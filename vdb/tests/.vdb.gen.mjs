// src/bytes.ts
var cmpBytes = (a, b) => {
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) {
    const d = a[i] - b[i];
    if (d !== 0) return d < 0 ? -1 : 1;
  }
  return a.length === b.length ? 0 : a.length < b.length ? -1 : 1;
};
var hasPrefix = (k, p) => {
  if (p.length > k.length) return false;
  for (let i = 0; i < p.length; i++) if (k[i] !== p[i]) return false;
  return true;
};
var encStr = (s) => {
  const b = new TextEncoder().encode(s);
  if (b.includes(0)) throw new Error("vdb:key_nul_forbidden");
  return b;
};
var encNum = (n) => {
  if (!Number.isFinite(n)) throw new Error("vdb:key_num_not_finite");
  const f = new Float64Array(1);
  f[0] = n;
  let x = new BigUint64Array(f.buffer)[0];
  x = x >> 63n ? ~x & 0xffffffffffffffffn : x | 0x8000000000000000n;
  const out = new Uint8Array(9);
  out[0] = 2;
  for (let i = 0; i < 8; i++) out[1 + i] = Number(x >> BigInt((7 - i) * 8) & 0xffn);
  return out;
};
var decNum = (b) => {
  if (b.length !== 9 || b[0] !== 2) throw new Error("vdb:key_not_num");
  let x = 0n;
  for (let i = 0; i < 8; i++) x = x << 8n | BigInt(b[1 + i]);
  x = x & 0x8000000000000000n ? x & 0x7fffffffffffffffn : ~x & 0xffffffffffffffffn;
  const u = new BigUint64Array(1);
  u[0] = x;
  return new Float64Array(u.buffer)[0];
};
var encKey = (k) => {
  if (typeof k === "number") return encNum(k);
  const s = encStr(k);
  const out = new Uint8Array(s.length + 1);
  out[0] = 1;
  out.set(s, 1);
  return out;
};
var decKey = (b) => {
  if (b.length === 0) throw new Error("vdb:key_empty");
  if (b[0] === 1) return new TextDecoder().decode(b.subarray(1));
  if (b[0] === 2) return decNum(b);
  throw new Error("vdb:key_unknown_type");
};
var escPart = (b) => {
  let zeros = 0;
  for (let i = 0; i < b.length; i++) if (b[i] === 0) zeros++;
  if (zeros === 0) return b;
  const out = new Uint8Array(b.length + zeros);
  let o = 0;
  for (let i = 0; i < b.length; i++) {
    out[o++] = b[i];
    if (b[i] === 0) out[o++] = 255;
  }
  return out;
};
var concat = (parts) => {
  let n = 0;
  for (const p of parts) n += p.length;
  const out = new Uint8Array(n);
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
};
var ck = (parts) => concat(parts.map((p) => concat([escPart(encKey(p)), new Uint8Array([0, 0])])));
var ckPrefix = (parts, openLast = false) => {
  const segs = [];
  parts.forEach((p, i) => {
    segs.push(escPart(encKey(p)));
    if (!openLast || i < parts.length - 1) segs.push(new Uint8Array([0, 0]));
  });
  return concat(segs);
};
var decRaw = (b) => {
  if (b.length === 0) throw new Error("vdb:key_empty");
  if (b[0] === 1) return new TextDecoder().decode(b.subarray(1));
  if (b[0] === 2) return decNum(b);
  throw new Error("vdb:key_unknown_type");
};
var ckLast = (full, prefixLen) => {
  const out = [];
  for (let i = prefixLen; i < full.length; i++) {
    const b = full[i];
    if (b === 0) {
      if (full[i + 1] === 255) {
        out.push(0);
        i++;
        continue;
      }
      break;
    }
    out.push(b);
  }
  return decRaw(new Uint8Array(out));
};

// src/btree.ts
var PAGE = 4096;
var MAX_KEY = 200;
var MAX_VAL = 1500;
var T_LEAF = 2;
var T_INT = 3;
var serLeaf = (es, next) => {
  let n = 7;
  for (const e of es) n += 4 + e.k.length + e.v.length;
  const b = new Uint8Array(n);
  const dv = new DataView(b.buffer);
  b[0] = T_LEAF;
  dv.setUint16(1, es.length);
  dv.setUint32(3, next);
  let o = 7;
  for (const e of es) {
    dv.setUint16(o, e.k.length);
    b.set(e.k, o + 2);
    o += 2 + e.k.length;
    dv.setUint16(o, e.v.length);
    b.set(e.v, o + 2);
    o += 2 + e.v.length;
  }
  return b;
};
var parseLeaf = (b) => {
  const dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
  const count = dv.getUint16(1);
  const next = dv.getUint32(3);
  const es = [];
  let o = 7;
  for (let i = 0; i < count; i++) {
    const kl = dv.getUint16(o);
    o += 2;
    const k = b.slice(o, o + kl);
    o += kl;
    const vl = dv.getUint16(o);
    o += 2;
    const v = b.slice(o, o + vl);
    o += vl;
    es.push({ k, v });
  }
  return { es, next };
};
var serInt = (n) => {
  let size = 7;
  for (const k of n.keys) size += 6 + k.length;
  const b = new Uint8Array(size);
  const dv = new DataView(b.buffer);
  b[0] = T_INT;
  dv.setUint16(1, n.keys.length);
  dv.setUint32(3, n.children[0]);
  let o = 7;
  for (let i = 0; i < n.keys.length; i++) {
    dv.setUint32(o, n.children[i + 1]);
    o += 4;
    const k = n.keys[i];
    dv.setUint16(o, k.length);
    b.set(k, o + 2);
    o += 2 + k.length;
  }
  return b;
};
var parseIntN = (b) => {
  const dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
  const kn = dv.getUint16(1);
  const children = [dv.getUint32(3)];
  const keys = [];
  let o = 7;
  for (let i = 0; i < kn; i++) {
    children.push(dv.getUint32(o));
    o += 4;
    const kl = dv.getUint16(o);
    o += 2;
    keys.push(b.slice(o, o + kl));
    o += kl;
  }
  return { keys, children };
};
var ubKeys = (keys, key) => {
  let lo = 0;
  let hi = keys.length;
  while (lo < hi) {
    const mid = lo + hi >> 1;
    if (cmpBytes(keys[mid], key) <= 0) lo = mid + 1;
    else hi = mid;
  }
  return lo;
};
var lb = (es, key) => {
  let lo = 0;
  let hi = es.length;
  while (lo < hi) {
    const mid = lo + hi >> 1;
    if (cmpBytes(es[mid].k, key) < 0) lo = mid + 1;
    else hi = mid;
  }
  return lo;
};
var leafSplitPoint = (es) => {
  let acc = 7;
  let cut = 1;
  for (let i = 0; i < es.length - 1; i++) {
    const sz = 4 + es[i].k.length + es[i].v.length;
    if (acc + sz > PAGE / 2) break;
    acc += sz;
    cut = i + 1;
  }
  return cut;
};
var ins = async (page, key, val, ctx) => {
  const raw = await ctx.read(page);
  if (raw[0] === T_LEAF) {
    const { es, next } = parseLeaf(raw);
    const i2 = lb(es, key);
    if (i2 < es.length && cmpBytes(es[i2].k, key) === 0) es[i2] = { k: key, v: val };
    else es.splice(i2, 0, { k: key, v: val });
    const b2 = serLeaf(es, next);
    const np2 = ctx.alloc();
    if (b2.length <= PAGE) {
      ctx.write(np2, b2);
      return { page: np2, split: null };
    }
    const cut = leafSplitPoint(es);
    const left = es.slice(0, cut);
    const right = es.slice(cut);
    const lp = np2;
    const rp2 = ctx.alloc();
    ctx.write(rp2, serLeaf(right, 0));
    ctx.write(lp, serLeaf(left, 0));
    return { page: lp, split: { sep: right[0].k, page: rp2 } };
  }
  const node = parseIntN(raw);
  const i = ubKeys(node.keys, key);
  const child = await ins(node.children[i], key, val, ctx);
  node.children[i] = child.page;
  if (child.split) {
    node.keys.splice(i, 0, child.split.sep);
    node.children.splice(i + 1, 0, child.split.page);
  }
  const b = serInt(node);
  const np = ctx.alloc();
  if (b.length <= PAGE) {
    ctx.write(np, b);
    return { page: np, split: null };
  }
  const mid = Math.floor(node.keys.length / 2);
  const sepK = node.keys[mid];
  const rp = ctx.alloc();
  ctx.write(rp, serInt({ keys: node.keys.slice(mid + 1), children: node.children.slice(mid + 1) }));
  ctx.write(np, serInt({ keys: node.keys.slice(0, mid), children: node.children.slice(0, mid + 1) }));
  return { page: np, split: { sep: sepK, page: rp } };
};
var del = async (page, key, ctx) => {
  const raw = await ctx.read(page);
  if (raw[0] === T_LEAF) {
    const { es, next } = parseLeaf(raw);
    const i2 = lb(es, key);
    if (!(i2 < es.length && cmpBytes(es[i2].k, key) === 0)) return { page, found: false };
    es.splice(i2, 1);
    const np2 = ctx.alloc();
    ctx.write(np2, serLeaf(es, next));
    return { page: np2, found: true };
  }
  const node = parseIntN(raw);
  const i = ubKeys(node.keys, key);
  const child = await del(node.children[i], key, ctx);
  if (!child.found) return { page, found: false };
  node.children[i] = child.page;
  const np = ctx.alloc();
  ctx.write(np, serInt(node));
  return { page: np, found: true };
};
var getRaw = async (root, key, ctx) => {
  let page = root;
  for (; ; ) {
    const raw = await ctx.read(page);
    if (raw[0] === T_LEAF) {
      const { es } = parseLeaf(raw);
      const i = lb(es, key);
      return i < es.length && cmpBytes(es[i].k, key) === 0 ? es[i].v : null;
    }
    const node = parseIntN(raw);
    page = node.children[ubKeys(node.keys, key)];
  }
};
var scan = async (root, start, ctx, take) => {
  if (root === 0) return;
  const path = [];
  let page = root;
  let raw = await ctx.read(page);
  for (; ; ) {
    if (raw[0] === T_LEAF) break;
    const node = parseIntN(raw);
    const c = start ? ubKeys(node.keys, start) : 0;
    path.push({ node, child: c });
    page = node.children[c];
    raw = await ctx.read(page);
  }
  const first = parseLeaf(raw);
  let es = first.es;
  let i = start ? lb(es, start) : 0;
  for (; ; ) {
    for (; i < es.length; i++) if (!take(es[i])) return;
    let moved = false;
    while (path.length) {
      const f = path.pop();
      if (f.child + 1 < f.node.children.length) {
        f.child++;
        path.push(f);
        let pg = f.node.children[f.child];
        for (; ; ) {
          const r2 = await ctx.read(pg);
          if (r2[0] === T_LEAF) {
            es = parseLeaf(r2).es;
            i = 0;
            moved = true;
            break;
          }
          const n2 = parseIntN(r2);
          path.push({ node: n2, child: 0 });
          pg = n2.children[0];
        }
        break;
      }
    }
    if (!moved) return;
  }
};

// src/engine.ts
var MAGIC = [86, 68, 66, 49];
var FLAG_JOURNAL = 1;
var toBytes = (v) => {
  if (v instanceof Uint8Array) return v;
  if (typeof v === "string") return new TextEncoder().encode(v);
  return new TextEncoder().encode(JSON.stringify(v));
};
var serMeta = (m) => {
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
var parseMeta = (b) => {
  const dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
  if (b[0] !== MAGIC[0] || b[1] !== MAGIC[1] || b[2] !== MAGIC[2] || b[3] !== MAGIC[3])
    throw new Error("vdb:not_a_vdb_file");
  return {
    root: dv.getUint32(8),
    pageCnt: dv.getUint32(12),
    gen: Number(dv.getBigUint64(16)),
    ts: Number(dv.getBigUint64(24)),
    flags: dv.getUint32(32)
  };
};
var VDB = class _VDB {
  constructor(store, opts) {
    this.store = store;
    this.journal = opts.journal !== false;
    this.maxKeys = opts.maxKeysPerTenant ?? 0;
  }
  store;
  root = 0;
  /* جذر آخر التزام معتمد — 0 = شجرة فارغة */
  pageCnt = 1;
  /* عدّاد الصفحات المعتمد (الصفحة 0 مخصوصة للميتا) */
  gen = 0;
  ts = 0;
  journal;
  maxKeys;
  cache = /* @__PURE__ */ new Map();
  /* صفحات معتمدة ساخنة */
  overlay = /* @__PURE__ */ new Map();
  /* صفحات الالتزام الجاري */
  dirtyRoot = null;
  sessCnt = 1;
  /* عدّاد جلسة الالتزام الجاري */
  opsN = 0;
  bytesN = 0;
  batching = false;
  counters = /* @__PURE__ */ new Map();
  q = Promise.resolve();
  static async open(store, opts = {}) {
    const db = new _VDB(store, opts);
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
  serial(fn) {
    const p = this.q.then(fn, fn);
    this.q = p.catch(() => void 0);
    return p;
  }
  ctx() {
    return {
      read: async (page) => this.overlay.get(page) ?? this.cache.get(page) ?? await this.loadPage(page),
      write: (page, b) => this.overlay.set(page, b),
      alloc: () => this.sessCnt++
    };
  }
  async loadPage(page) {
    const b = await this.store.get(page, this.gen);
    if (!b) throw new Error("vdb:page_missing");
    this.cache.set(page, b);
    return b;
  }
  committedCtx() {
    return {
      read: async (page) => this.cache.get(page) ?? await this.loadPage(page),
      write: () => {
        throw new Error("vdb:readonly_ctx");
      },
      alloc: () => {
        throw new Error("vdb:readonly_ctx");
      }
    };
  }
  beginIf() {
    if (this.dirtyRoot === null) {
      this.dirtyRoot = this.root;
      this.opsN = 0;
      this.bytesN = 0;
      this.sessCnt = this.pageCnt;
    }
  }
  rollback() {
    this.overlay.clear();
    this.dirtyRoot = null;
    this.sessCnt = this.pageCnt;
    this.opsN = 0;
    this.bytesN = 0;
    for (const c of this.counters.values()) c.pend = 0;
  }
  /* إدراج في الجذر الجاري مع معالجة انقسام الجذر نفسه */
  async treePut(key, val) {
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
  async buildRootFromSplit(sp) {
    const ctx = this.ctx();
    const oldRoot = this.dirtyRoot;
    const rp = ctx.alloc();
    ctx.write(rp, serInt({ keys: [sp.sep], children: [oldRoot, sp.page] }));
    this.dirtyRoot = rp;
  }
  async flushCommit() {
    if (this.dirtyRoot === null || this.overlay.size === 0 && this.opsN === 0) {
      this.dirtyRoot = null;
      return { gen: this.gen, pages: this.pageCnt, ts: this.ts, ops: 0 };
    }
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
      flags: this.journal ? FLAG_JOURNAL : 0
    });
    if (this.store.atomicCommit) {
      const won = await this.store.atomicCommit(
        pages.filter(([p]) => p !== 0).map(([p, b]) => [p, b]),
        meta,
        this.gen + 1
      );
      if (!won) throw new Error("vdb:conflict");
    } else {
      for (const [p, b] of pages) if (p !== 0) await this.store.put(p, b);
      await this.store.put(0, meta);
    }
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
  async doReload() {
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
  async fresh() {
    return this.serial(() => this.doReload());
  }
  /* ═════════ الواجهة العامة ═════════ */
  tenant(name) {
    return new TenantHandle(this, name);
  }
  /* عملية واحدة = التزام واحد ذري (الافتراضي — مثالي للسجلات الحية) */
  async put(tenant, bucket, key, val) {
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
          if (String(er?.message ?? er).includes("vdb:conflict") && i < 8) {
            await this.doReload();
            continue;
          }
          throw er;
        }
      }
    });
  }
  async del(tenant, bucket, key) {
    const kb = this.keyBytes(tenant, bucket, key);
    const body = async () => {
      this.beginIf();
      const cur = this.dirtyRoot;
      if (cur === null || cur === 0) return null;
      const res = await del(cur, kb, this.ctx());
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
          if (String(er?.message ?? er).includes("vdb:conflict") && i < 8) {
            await this.doReload();
            continue;
          }
          throw er;
        }
      }
    });
  }
  /* دفعة عمليات تحت التزام واحد ذري — فشل أحدها يُسقط الدفعة كلها */
  async batch(fn) {
    const attempt = async () => {
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
          if (String(er?.message ?? er).includes("vdb:conflict") && i < 8) {
            await this.doReload();
            continue;
          }
          throw er;
        }
      }
    });
  }
  async commit() {
    return this.serial(() => this.flushCommit());
  }
  /* القراءة على لقطة آخر التزام — بلا قفل وبلا تداخل مع الكتابة الجارية */
  async get(tenant, bucket, key) {
    const kb = this.keyBytes(tenant, bucket, key);
    if (this.root === 0) return null;
    return getRaw(this.root, kb, this.committedCtx());
  }
  async list(tenant, bucket, o = {}) {
    const base = ckPrefix([tenant, bucket]);
    const pfx = o.prefix && o.prefix.length ? ckPrefix([tenant, bucket, ...o.prefix], true) : base;
    const start = o.gte !== void 0 ? ck([tenant, bucket, o.gte]) : null;
    const lte = o.lte !== void 0 ? ck([tenant, bucket, o.lte]) : null;
    const rows = await this.scanRaw(pfx, start, lte, o.limit ?? 500);
    const strip = base.length;
    return rows.map((e) => ({ k: ckLast(e.k, strip), v: e.v }));
  }
  async count(tenant, bucket) {
    const rows = await this.scanRaw(ckPrefix([tenant, bucket]), null, null, Number.POSITIVE_INFINITY);
    return rows.length;
  }
  stats() {
    return {
      gen: this.gen,
      pages: this.pageCnt,
      ts: this.ts,
      journal: this.journal,
      tenants: [...this.counters.keys()]
    };
  }
  /* إعادة بناء البنية من الصفر — تشفي الكسل بعد الحذف الكثيف */
  async compact() {
    return this.serial(async () => {
      const all = await this.scanRaw(new Uint8Array(0), null, null, Number.POSITIVE_INFINITY);
      this.beginIf();
      this.dirtyRoot = 0;
      for (const e of all) await this.treePut(e.k, e.v);
      return await this.flushCommit();
    });
  }
  /* ═════════ داخلية ═════════ */
  keyBytes(tenant, bucket, key) {
    const uk = encKey(key);
    if (uk.length > 120) throw new Error("vdb:key_too_large");
    const full = ck([tenant, bucket, key]);
    if (full.length > MAX_KEY) throw new Error("vdb:key_too_large");
    return full;
  }
  bump(tenant, d) {
    let c = this.counters.get(tenant);
    if (!c) {
      c = { known: false, n: 0, pend: 0 };
      this.counters.set(tenant, c);
    }
    c.pend += d;
  }
  async quotaGuard(tenant) {
    if (this.maxKeys <= 0) return;
    let c = this.counters.get(tenant);
    if (!c || !c.known) {
      const rows = await this.scanRaw(ckPrefix([tenant]), null, null, Number.POSITIVE_INFINITY);
      c = { known: true, n: rows.length, pend: 0 };
      this.counters.set(tenant, c);
    }
    if (c.n + c.pend >= this.maxKeys) throw new Error("vdb:quota_keys");
  }
  async scanRaw(prefix, start, lte, limit) {
    const out = [];
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
};
var TenantHandle = class {
  constructor(db, name) {
    this.db = db;
    this.name = name;
  }
  db;
  name;
  bucket(name) {
    return new BucketHandle(this.db, this.name, name);
  }
};
var BucketHandle = class {
  constructor(db, tenant, name) {
    this.db = db;
    this.tenant = tenant;
    this.name = name;
  }
  db;
  tenant;
  name;
  get(key) {
    return this.db.get(this.tenant, this.name, key);
  }
  put(key, val) {
    return this.db.put(this.tenant, this.name, key, val);
  }
  del(key) {
    return this.db.del(this.tenant, this.name, key);
  }
  list(o = {}) {
    return this.db.list(this.tenant, this.name, o);
  }
  count() {
    return this.db.count(this.tenant, this.name);
  }
};

// src/store.ts
var eqBytes = (a, b) => {
  if (a === b) return true;
  if (!a || !b || a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
};
var MemoryBlockStore = class {
  m = /* @__PURE__ */ new Map();
  puts = 0;
  failAfter = Number.POSITIVE_INFINITY;
  /* بعد هذا العدد: كل put يرمي — محاكاة انهيار مفاجئ */
  async get(page) {
    return this.m.get(page) ?? null;
  }
  async put(page, data) {
    if (this.puts >= this.failAfter) throw new Error("vdb_sim_crash");
    this.puts++;
    this.m.set(page, data.slice());
  }
  async cas(page, expect, data) {
    if (this.puts >= this.failAfter) throw new Error("vdb_sim_crash");
    const cur = this.m.get(page) ?? null;
    if (!eqBytes(cur, expect)) return false;
    this.puts++;
    this.m.set(page, data.slice());
    return true;
  }
};
var KVBlockStore = class {
  constructor(kv, prefix) {
    this.kv = kv;
    this.prefix = prefix;
  }
  kv;
  prefix;
  async get(page) {
    const r = await this.kv.get(`${this.prefix}p${page}`, { type: "arrayBuffer" });
    return r ? new Uint8Array(r) : null;
  }
  async put(page, data) {
    await this.kv.put(`${this.prefix}p${page}`, data.slice().buffer);
  }
};
var toU8 = (v) => {
  if (!v) return null;
  if (v instanceof Uint8Array) return v;
  if (v instanceof ArrayBuffer) return new Uint8Array(v);
  if (Array.isArray(v)) return new Uint8Array(v);
  return null;
};
var D1BlockStore = class {
  constructor(d1, table = "vdb_pages") {
    this.d1 = d1;
    this.table = table;
  }
  d1;
  table;
  /* تهيئة الأقراص — idempotent، تُستدعى مرة عند فتح المحرك */
  async init() {
    await this.d1.prepare(
      `CREATE TABLE IF NOT EXISTS ${this.table} (gen INTEGER NOT NULL, page INTEGER NOT NULL, data BLOB, PRIMARY KEY (gen, page))`
    ).run();
    await this.d1.prepare(`CREATE INDEX IF NOT EXISTS idx_${this.table}_pg ON ${this.table} (page, gen)`).run();
    await this.d1.prepare(`CREATE TABLE IF NOT EXISTS vdb_commits (gen INTEGER PRIMARY KEY, at INTEGER NOT NULL)`).run();
  }
  async get(page, atGen) {
    const r = atGen === void 0 ? await this.d1.prepare(`SELECT data FROM ${this.table} WHERE page = ?1 ORDER BY gen DESC LIMIT 1`).bind(page).all() : await this.d1.prepare(`SELECT data FROM ${this.table} WHERE page = ?1 AND gen <= ?2 ORDER BY gen DESC LIMIT 1`).bind(page, atGen).all();
    return toU8(r?.results?.[0]?.data ?? null);
  }
  /* كتابة حرة (مسار المحركات بلا ذرية) — تحجز جيلاً جديداً وتكتب صفحة واحدة */
  async put(page, data) {
    for (let i = 0; ; i++) {
      try {
        const g = await this.d1.prepare(`SELECT COALESCE(MAX(gen), 0) + 1 AS g FROM vdb_commits`).bind().all();
        const gen = Number(g?.results?.[0]?.g ?? 1);
        await this.d1.batch([
          this.d1.prepare(`INSERT INTO vdb_commits (gen, at) VALUES (?1, ?2)`).bind(gen, Date.now()),
          this.d1.prepare(`INSERT INTO ${this.table} (gen, page, data) VALUES (?1, ?2, ?3)`).bind(gen, page, data)
        ]);
        return;
      } catch (e) {
        if (i < 3 && String(e).includes("UNIQUE")) continue;
        throw e;
      }
    }
  }
  async cas(page, expect, data) {
    void expect;
    void page;
    void data;
    throw new Error("vdb:cas_unsupported_on_d1");
  }
  /* التزام ذري كامل: حجز الجيل + كل الصفحات + الميتا في معاملة D1 واحدة */
  async atomicCommit(pages, meta, gen) {
    const stmts = [
      this.d1.prepare(`INSERT INTO vdb_commits (gen, at) VALUES (?1, ?2)`).bind(gen, Date.now()),
      ...pages.map(
        ([p, b]) => this.d1.prepare(`INSERT INTO ${this.table} (gen, page, data) VALUES (?1, ?2, ?3)`).bind(gen, p, b)
      ),
      this.d1.prepare(`INSERT INTO ${this.table} (gen, page, data) VALUES (?1, 0, ?2)`).bind(gen, meta)
    ];
    try {
      await this.d1.batch(stmts);
      return true;
    } catch (e) {
      if (String(e).includes("UNIQUE")) return false;
      throw e;
    }
  }
};

// src/ar.ts
var DIACRITICS = /[\u064B-\u0655\u0670\u0640]/g;
var normAr = (s) => s.replace(DIACRITICS, "").replace(/[أإآٱ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي").replace(/ؤ/g, "و").replace(/ئ/g, "ي").toLowerCase();
var arKey = (s) => normAr(s.trim()).replace(/\s+/g, " ");
export {
  BucketHandle,
  D1BlockStore,
  KVBlockStore,
  MAX_KEY,
  MAX_VAL,
  MemoryBlockStore,
  PAGE,
  TenantHandle,
  VDB,
  arKey,
  ck,
  ckLast,
  ckPrefix,
  cmpBytes,
  decKey,
  decNum,
  decRaw,
  encKey,
  encNum,
  normAr
};
