/* ═══════════════════════════════════════════════════════════════════
   VDB — engine.ts — محرك قاعدة بيانات فيتو.
   عمارة مثبتة الصنع: شجرة B+ بنسخ-عند-الكتابة + ميتا بنقطة التزام واحدة.
   الجيران حثيثاً: كل تاجر مساحة محفوظة بحصص تُفرض في باب المحرك.
   الزمن حثيثاً: كل التزام يسجَّل في دفتر المحرك نفسه بذات الذرية.
   الالتزامات: كاتب واحد مُسلسَل، قراءات بلا قفل على لقطة معتمدة.
   ═══════════════════════════════════════════════════════════════════ */

import {
  MAX_KEY,
  MAX_VAL,
  del as btDel,
  getRaw,
  ins,
  scan,
  serInt,
  serLeaf,
  type Ctx,
  type Entry,
  type Split,
} from "./btree";
import { ck, ckLast, ckPrefix, cmpBytes, encKey, hasPrefix } from "./bytes";
import type { BlockStore } from "./store";

export type VValue = Uint8Array | string | object;
export type CommitInfo = { gen: number; pages: number; ts: number; ops: number };

const MAGIC = [0x56, 0x44, 0x42, 0x31]; /* "VDB1" */
const FLAG_JOURNAL = 1;

type Counters = { known: boolean; n: number; pend: number };

const toBytes = (v: VValue): Uint8Array => {
  if (v instanceof Uint8Array) return v;
  if (typeof v === "string") return new TextEncoder().encode(v);
  return new TextEncoder().encode(JSON.stringify(v));
};

const serMeta = (m: { root: number; pageCnt: number; gen: number; ts: number; flags: number }): Uint8Array => {
  const b = new Uint8Array(36);
  const dv = new DataView(b.buffer);
  b.set(MAGIC, 0);
  dv.setUint32(4, 1);
  dv.setUint32(8, m.root);
  dv.setUint32(12, m.pageCnt);
  dv.setBigUint64(16, BigInt(m.gen));
  dv.setBigUint64(24, BigInt(Math.min(Math.max(m.ts, 0), Number.MAX_SAFE_INTEGER)));
  dv.setUint32(32, m.flags);
  return b;
};

const parseMeta = (b: Uint8Array) => {
  const dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
  if (b[0] !== MAGIC[0] || b[1] !== MAGIC[1] || b[2] !== MAGIC[2] || b[3] !== MAGIC[3])
    throw new Error("vdb:not_a_vdb_file");
  return {
    root: dv.getUint32(8),
    pageCnt: dv.getUint32(12),
    gen: Number(dv.getBigUint64(16)),
    ts: Number(dv.getBigUint64(24)),
    flags: dv.getUint32(32),
  };
};

export class VDB {
  private root = 0; /* جذر آخر التزام معتمد — 0 = شجرة فارغة */
  private pageCnt = 1; /* عدّاد الصفحات المعتمد (الصفحة 0 مخصوصة للميتا) */
  private gen = 0;
  private ts = 0;
  private journal: boolean;
  private maxKeys: number;

  private cache = new Map<number, Uint8Array>(); /* صفحات معتمدة ساخنة */
  private overlay = new Map<number, Uint8Array>(); /* صفحات الالتزام الجاري */
  private dirtyRoot: number | null = null;
  private sessCnt = 1; /* عدّاد جلسة الالتزام الجاري */
  private opsN = 0;
  private bytesN = 0;
  private batching = false;
  private counters = new Map<string, Counters>();
  private q: Promise<unknown> = Promise.resolve();

  private constructor(
    private store: BlockStore,
    opts: { journal?: boolean; maxKeysPerTenant?: number },
  ) {
    this.journal = opts.journal !== false;
    this.maxKeys = opts.maxKeysPerTenant ?? 0; /* 0 = بلا سقف */
  }

  static async open(
    store: BlockStore,
    opts: { journal?: boolean; maxKeysPerTenant?: number } = {},
  ): Promise<VDB> {
    const db = new VDB(store, opts);
    const meta = await store.get(0);
    if (meta) {
      const m = parseMeta(meta);
      db.root = m.root;
      db.pageCnt = m.pageCnt;
      db.gen = m.gen;
      db.ts = m.ts;
      db.journal = (m.flags & FLAG_JOURNAL) !== 0;
      db.cache.set(0, meta);
    }
    db.sessCnt = db.pageCnt;
    return db;
  }

  /* ─── التسلسل: كاتب واحد — كل تعديل أو التزام ينتظر دوره ─── */
  private serial<T>(fn: () => Promise<T>): Promise<T> {
    const p = this.q.then(fn, fn);
    this.q = p.catch(() => undefined);
    return p;
  }

  private ctx(): Ctx {
    return {
      read: async (page) => this.overlay.get(page) ?? this.cache.get(page) ?? (await this.loadPage(page)),
      write: (page, b) => this.overlay.set(page, b),
      alloc: () => this.sessCnt++,
    };
  }

  private async loadPage(page: number): Promise<Uint8Array> {
    const b = await this.store.get(page, this.gen);
    if (!b) throw new Error("vdb:page_missing");
    this.cache.set(page, b);
    return b;
  }

  private committedCtx(): Ctx {
    return {
      read: async (page) => this.cache.get(page) ?? (await this.loadPage(page)),
      write: () => {
        throw new Error("vdb:readonly_ctx");
      },
      alloc: () => {
        throw new Error("vdb:readonly_ctx");
      },
    };
  }

  private beginIf(): void {
    if (this.dirtyRoot === null) {
      this.dirtyRoot = this.root;
      this.opsN = 0;
      this.bytesN = 0;
      this.sessCnt = this.pageCnt;
    }
  }

  private rollback(): void {
    this.overlay.clear();
    this.dirtyRoot = null;
    this.sessCnt = this.pageCnt;
    this.opsN = 0;
    this.bytesN = 0;
    for (const c of this.counters.values()) c.pend = 0;
  }

  /* إدراج في الجذر الجاري مع معالجة انقسام الجذر نفسه */
  private async treePut(key: Uint8Array, val: Uint8Array): Promise<void> {
    this.beginIf();
    const cur = this.dirtyRoot;
    if (cur === null) throw new Error("vdb:tx_not_open");
    const ctx = this.ctx();
    if (cur === 0) {
      const p = ctx.alloc();
      ctx.write(p, serLeaf([{ k: key, v: val }], 0));
      this.dirtyRoot = p;
      return;
    }
    const res = await ins(cur, key, val, ctx);
    this.dirtyRoot = res.page;
    if (res.split) await this.buildRootFromSplit(res.split);
  }

  private async buildRootFromSplit(sp: Split): Promise<void> {
    const ctx = this.ctx();
    const oldRoot = this.dirtyRoot!;
    const rp = ctx.alloc();
    ctx.write(rp, serInt({ keys: [sp.sep], children: [oldRoot, sp.page] }));
    this.dirtyRoot = rp;
  }

  private async flushCommit(): Promise<CommitInfo> {
    if (this.dirtyRoot === null || (this.overlay.size === 0 && this.opsN === 0)) {
      this.dirtyRoot = null;
      return { gen: this.gen, pages: this.pageCnt, ts: this.ts, ops: 0 };
    }
    /* دفتر الزمن: قيد داخل نفس الالتزام الذري — صفر كلفة التزام إضافية */
    if (this.journal) {
      const jk = ck(["_sys", "j", String(this.gen + 1).padStart(12, "0"), String(Date.now())]);
      this.beginIf();
      await this.treePut(jk, toBytes({ ts: Date.now(), ops: this.opsN, bytes: this.bytesN }));
    }
    const pages = [...this.overlay.entries()];
    const ts = Date.now();
    const meta = serMeta({
      root: this.dirtyRoot,
      pageCnt: this.sessCnt,
      gen: this.gen + 1,
      ts,
      flags: this.journal ? FLAG_JOURNAL : 0,
    });
    if (this.store.atomicCommit) {
      /* الذرية الكاملة عبر حجز الجيل: نافسة سبقتنا → المعاملة كلها تتراجع على الأقراص */
      const won = await this.store.atomicCommit(
        pages.filter(([p]) => p !== 0).map(([p, b]) => [p, b] as [number, Uint8Array]),
        meta,
        this.gen + 1,
      );
      if (!won) throw new Error("vdb:conflict");
    } else {
      for (const [p, b] of pages) if (p !== 0) await this.store.put(p, b);
      await this.store.put(0, meta); /* ← الالتزام يولد هنا. ما قبلها يتيمة بلا ضرر */
    }
    /* الاعتماد */
    for (const [p, b] of pages) this.cache.set(p, b);
    this.cache.set(0, meta);
    this.root = this.dirtyRoot;
    this.pageCnt = this.sessCnt;
    this.sessCnt = this.pageCnt;
    this.dirtyRoot = null;
    this.gen += 1;
    this.ts = ts;
    const ops = this.opsN;
    this.opsN = 0;
    this.bytesN = 0;
    for (const c of this.counters.values())
      if (c.known) {
        c.n += c.pend;
        c.pend = 0;
      }
    return { gen: this.gen, pages: this.pageCnt, ts, ops };
  }

  private async doReload(): Promise<void> {
    this.overlay.clear();
    this.cache.clear();
    const meta = await this.store.get(0);
    if (meta) {
      const m = parseMeta(meta);
      this.root = m.root;
      this.pageCnt = m.pageCnt;
      this.gen = m.gen;
      this.ts = m.ts;
      this.journal = (m.flags & FLAG_JOURNAL) !== 0;
      this.cache.set(0, meta);
    } else {
      this.root = 0;
      this.pageCnt = 1;
      this.gen = 0;
      this.ts = 0;
    }
    this.sessCnt = this.pageCnt;
    this.dirtyRoot = null;
    this.opsN = 0;
    this.bytesN = 0;
    for (const c of this.counters.values()) {
      c.known = false;
      c.pend = 0;
    }
  }

  /* مزامنة اللقطة من الأقراص — قبل أي قراءة حساسة عبر عزلات متعددة */
  async fresh(): Promise<void> {
    return this.serial(() => this.doReload());
  }

  /* ═════════ الواجهة العامة ═════════ */

  tenant(name: string): TenantHandle {
    return new TenantHandle(this, name);
  }

  /* عملية واحدة = التزام واحد ذري (الافتراضي — مثالي للسجلات الحية) */
  async put(tenant: string, bucket: string, key: string | number, val: VValue): Promise<CommitInfo> {
    const kb = this.keyBytes(tenant, bucket, key);
    const vb = toBytes(val);
    if (vb.length > MAX_VAL) throw new Error("vdb:value_too_large");
    const body = async () => {
      await this.quotaGuard(tenant);
      this.beginIf();
      await this.treePut(kb, vb);
      this.opsN++;
      this.bytesN += vb.length;
      this.bump(tenant, 1);
      if (!this.batching) return await this.flushCommit();
      return { gen: this.gen, pages: this.pageCnt, ts: this.ts, ops: this.opsN };
    };
    if (this.batching) return await body();
    return this.serial(async () => {
      for (let i = 0; ; i++) {
        try {
          return await body();
        } catch (er) {
          if (this.dirtyRoot !== null) this.rollback();
          if (String((er as Error)?.message ?? er).includes("vdb:conflict") && i < 8) {
            await this.doReload();
            continue;
          }
          throw er;
        }
      }
    });
  }

  async del(tenant: string, bucket: string, key: string | number): Promise<CommitInfo | null> {
    const kb = this.keyBytes(tenant, bucket, key);
    const body = async () => {
      this.beginIf();
      const cur = this.dirtyRoot;
      if (cur === null || cur === 0) return null;
      const res = await btDel(cur, kb, this.ctx());
      if (!res.found) {
        if (this.overlay.size === 0) this.dirtyRoot = null;
        return null;
      }
      this.dirtyRoot = res.page;
      this.opsN++;
      this.bump(tenant, -1);
      if (!this.batching) return await this.flushCommit();
      return { gen: this.gen, pages: this.pageCnt, ts: this.ts, ops: this.opsN };
    };
    if (this.batching) return await body();
    return this.serial(async () => {
      for (let i = 0; ; i++) {
        try {
          return await body();
        } catch (er) {
          if (this.dirtyRoot !== null) this.rollback();
          if (String((er as Error)?.message ?? er).includes("vdb:conflict") && i < 8) {
            await this.doReload();
            continue;
          }
          throw er;
        }
      }
    });
  }

  /* دفعة عمليات تحت التزام واحد ذري — فشل أحدها يُسقط الدفعة كلها */
  async batch<T>(fn: (db: VDB) => Promise<T>): Promise<T> {
    const attempt = async (): Promise<T> => {
      this.batching = true;
      try {
        const r = await fn(this);
        await this.flushCommit();
        return r;
      } finally {
        this.batching = false;
      }
    };
    return this.serial(async () => {
      for (let i = 0; ; i++) {
        try {
          return await attempt();
        } catch (er) {
          if (this.dirtyRoot !== null) this.rollback();
          if (String((er as Error)?.message ?? er).includes("vdb:conflict") && i < 8) {
            await this.doReload();
            continue;
          }
          throw er;
        }
      }
    });
  }

  async commit(): Promise<CommitInfo> {
    return this.serial(() => this.flushCommit());
  }

  /* القراءة على لقطة آخر التزام — بلا قفل وبلا تداخل مع الكتابة الجارية */
  async get(tenant: string, bucket: string, key: string | number): Promise<Uint8Array | null> {
    const kb = this.keyBytes(tenant, bucket, key);
    if (this.root === 0) return null;
    return getRaw(this.root, kb, this.committedCtx());
  }

  async list(
    tenant: string,
    bucket: string,
    o: {
      prefix?: (string | number)[];
      gte?: string | number;
      lte?: string | number;
      limit?: number;
    } = {},
  ): Promise<Array<{ k: string | number; v: Uint8Array }>> {
    const base = ckPrefix([tenant, bucket]);
    const pfx = o.prefix && o.prefix.length ? ckPrefix([tenant, bucket, ...o.prefix], true) : base;
    const start = o.gte !== undefined ? ck([tenant, bucket, o.gte]) : null;
    const lte = o.lte !== undefined ? ck([tenant, bucket, o.lte]) : null;
    const rows = await this.scanRaw(pfx, start, lte, o.limit ?? 500);
    const strip = base.length;
    return rows.map((e) => ({ k: ckLast(e.k, strip), v: e.v }));
  }

  async count(tenant: string, bucket: string): Promise<number> {
    const rows = await this.scanRaw(ckPrefix([tenant, bucket]), null, null, Number.POSITIVE_INFINITY);
    return rows.length;
  }

  stats(): { gen: number; pages: number; ts: number; journal: boolean; tenants: string[] } {
    return {
      gen: this.gen,
      pages: this.pageCnt,
      ts: this.ts,
      journal: this.journal,
      tenants: [...this.counters.keys()],
    };
  }

  /* إعادة بناء البنية من الصفر — تشفي الكسل بعد الحذف الكثيف */
  async compact(): Promise<CommitInfo> {
    return this.serial(async () => {
      const all = await this.scanRaw(new Uint8Array(0), null, null, Number.POSITIVE_INFINITY);
      this.beginIf();
      this.dirtyRoot = 0;
      for (const e of all) await this.treePut(e.k, e.v);
      return await this.flushCommit();
    });
  }

  /* ═════════ داخلية ═════════ */

  private keyBytes(tenant: string, bucket: string, key: string | number): Uint8Array {
    const uk = encKey(key);
    if (uk.length > 120) throw new Error("vdb:key_too_large");
    const full = ck([tenant, bucket, key]);
    if (full.length > MAX_KEY) throw new Error("vdb:key_too_large");
    return full;
  }

  private bump(tenant: string, d: number): void {
    let c = this.counters.get(tenant);
    if (!c) {
      c = { known: false, n: 0, pend: 0 };
      this.counters.set(tenant, c);
    }
    c.pend += d;
  }

  private async quotaGuard(tenant: string): Promise<void> {
    if (this.maxKeys <= 0) return;
    let c = this.counters.get(tenant);
    if (!c || !c.known) {
      const rows = await this.scanRaw(ckPrefix([tenant]), null, null, Number.POSITIVE_INFINITY);
      c = { known: true, n: rows.length, pend: 0 };
      this.counters.set(tenant, c);
    }
    if (c.n + c.pend >= this.maxKeys) throw new Error("vdb:quota_keys");
  }

  private async scanRaw(
    prefix: Uint8Array,
    start: Uint8Array | null,
    lte: Uint8Array | null,
    limit: number,
  ): Promise<Entry[]> {
    const out: Entry[] = [];
    if (this.root === 0) return out;
    const ctx = this.committedCtx();
    await scan(this.root, start ?? prefix, ctx, (e) => {
      if (!hasPrefix(e.k, prefix)) return false;
      if (lte && cmpBytes(e.k, lte) > 0) return false;
      out.push(e);
      return out.length < limit;
    });
    return out;
  }
}

export class TenantHandle {
  constructor(
    private db: VDB,
    private name: string,
  ) {}
  bucket(name: string): BucketHandle {
    return new BucketHandle(this.db, this.name, name);
  }
}

export class BucketHandle {
  constructor(
    private db: VDB,
    private tenant: string,
    private name: string,
  ) {}
  get(key: string | number): Promise<Uint8Array | null> {
    return this.db.get(this.tenant, this.name, key);
  }
  put(key: string | number, val: VValue): Promise<CommitInfo> {
    return this.db.put(this.tenant, this.name, key, val);
  }
  del(key: string | number): Promise<CommitInfo | null> {
    return this.db.del(this.tenant, this.name, key);
  }
  list(
    o: {
      prefix?: (string | number)[];
      gte?: string | number;
      lte?: string | number;
      limit?: number;
    } = {},
  ): Promise<Array<{ k: string | number; v: Uint8Array }>> {
    return this.db.list(this.tenant, this.name, o);
  }
  count(): Promise<number> {
    return this.db.count(this.tenant, this.name);
  }
}
