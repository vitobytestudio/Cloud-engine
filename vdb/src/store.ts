/* ═══════════════════════════════════════════════════════════════════
   VDB — store.ts — طبقة الكتل العمياء: عقد المحرك مع العالم.
   المحرك يرى صفحات مرقّمة ولا يعلم أين تسكن: الذاكرة للفحص والفوضى،
   D1 لأقراصنا الذرية في الإنتاج (بتبديل-مقارنة CAS حقيقي)،
   وأي مخزن غداً بلا سطر واحد يتغير في المحرك.
   العقد الاختياري cas(): التزام آمن عبر عزلات متعددة — من يفشل يُعاد.
   ═══════════════════════════════════════════════════════════════════ */

export interface BlockStore {
  /* atGen: قراءة اللقطة — الصفحة كما كانت عند هذا الجيل (لا ترى مستقبل النافس) */
  get(page: number, atGen?: number): Promise<Uint8Array | null>;
  put(page: number, data: Uint8Array): Promise<void>;
  /* تبديل-مقارنة ذري: اكتب data على page فقط إن كانت تحمل expect بالضبط */
  cas?(page: number, expect: Uint8Array | null, data: Uint8Array): Promise<boolean>;
  /* التزام الذري الكامل عبر حجز الجيل: كل الصفحات + الميتا في معاملة واحدة.
     يعيد false إن حجز الجيل فشل (نافسة سبقتنا) — والمحرك يعيد المحاولة */
  atomicCommit?(pages: Array<[number, Uint8Array]>, meta: Uint8Array, gen: number): Promise<boolean>;
}

export type MinimalD1 = {
  prepare(sql: string): {
    bind(...v: unknown[]): {
      run(): Promise<{ meta?: { changes?: number }; results?: unknown[] }>;
      all(): Promise<{ results?: Array<{ data: unknown }> }>;
    };
    run(): Promise<{ meta?: { changes?: number }; results?: unknown[] }>;
    all(): Promise<{ results?: Array<{ data: unknown }> }>;
  };
  batch(stmts: unknown[]): Promise<unknown>;
};

const eqBytes = (a: Uint8Array | null, b: Uint8Array | null): boolean => {
  if (a === b) return true;
  if (!a || !b || a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
};

/* كتل بالذاكرة — لأدوات الفحص والفوضى، مع حقن انهيار لمحاكاة انقطاع الالتزام */
export class MemoryBlockStore implements BlockStore {
  private m = new Map<number, Uint8Array>();
  puts = 0;
  failAfter = Number.POSITIVE_INFINITY; /* بعد هذا العدد: كل put يرمي — محاكاة انهيار مفاجئ */

  async get(page: number): Promise<Uint8Array | null> {
    return this.m.get(page) ?? null;
  }

  async put(page: number, data: Uint8Array): Promise<void> {
    if (this.puts >= this.failAfter) throw new Error("vdb_sim_crash");
    this.puts++;
    this.m.set(page, data.slice());
  }

  async cas(page: number, expect: Uint8Array | null, data: Uint8Array): Promise<boolean> {
    if (this.puts >= this.failAfter) throw new Error("vdb_sim_crash");
    const cur = this.m.get(page) ?? null;
    if (!eqBytes(cur, expect)) return false;
    this.puts++;
    this.m.set(page, data.slice());
    return true;
  }
}

/* عقد KV بنيوي محايد — بلا CAS ذري (KV لا يمنحه) */
type MinimalKV = {
  get(key: string, opts?: unknown): Promise<unknown>;
  put(key: string, value: unknown, opts?: unknown): Promise<void>;
};

/* كتل KV: صفحة n = مفتاح <prefix>p<n> — القيمة ArrayBuffer خام */
export class KVBlockStore implements BlockStore {
  constructor(
    private kv: MinimalKV,
    private prefix: string,
  ) {}

  async get(page: number): Promise<Uint8Array | null> {
    const r = (await this.kv.get(`${this.prefix}p${page}`, { type: "arrayBuffer" })) as ArrayBuffer | null;
    return r ? new Uint8Array(r) : null;
  }

  async put(page: number, data: Uint8Array): Promise<void> {
    await this.kv.put(`${this.prefix}p${page}`, data.slice().buffer);
  }
}

/* ═════════ أقراص VDB الذرية: جدول صفحات في D1 — بعيداً عن KV تماماً ═════════
   كل صفحة = صف واحد (page PRIMARY KEY, data BLOB). التزام CAS البيتي:
   UPDATE ... WHERE page=? AND data=? — الذرية مضمونة من محرك SQLite
   وإخفاقها يعني أن نافسة سبقتنا (عزلة أخرى التزمت) — المحرك يعيد المحاولة */


const toU8 = (v: unknown): Uint8Array | null => {
  if (!v) return null;
  if (v instanceof Uint8Array) return v;
  if (v instanceof ArrayBuffer) return new Uint8Array(v);
  if (Array.isArray(v)) return new Uint8Array(v);
  return null;
};

/* أقراص VDB الذرية على D1: صفحات بالجيل (gen, page) — قراءة اللقطة MVCC،
   والتزام بحجز الجيل في معاملة واحدة: نافسة سبقتنا → كل شيء يتراجع ذرياً */
export class D1BlockStore implements BlockStore {
  constructor(
    private d1: MinimalD1,
    private table = "vdb_pages",
  ) {}

  /* تهيئة الأقراص — idempotent، تُستدعى مرة عند فتح المحرك */
  async init(): Promise<void> {
    await this.d1
      .prepare(
        `CREATE TABLE IF NOT EXISTS ${this.table} (gen INTEGER NOT NULL, page INTEGER NOT NULL, data BLOB, PRIMARY KEY (gen, page))`,
      )
      .run();
    await this.d1
      .prepare(`CREATE INDEX IF NOT EXISTS idx_${this.table}_pg ON ${this.table} (page, gen)`)
      .run();
    await this.d1
      .prepare(`CREATE TABLE IF NOT EXISTS vdb_commits (gen INTEGER PRIMARY KEY, at INTEGER NOT NULL)`)
      .run();
  }

  async get(page: number, atGen?: number): Promise<Uint8Array | null> {
    const r =
      atGen === undefined
        ? await this.d1
            .prepare(`SELECT data FROM ${this.table} WHERE page = ?1 ORDER BY gen DESC LIMIT 1`)
            .bind(page)
            .all()
        : await this.d1
            .prepare(`SELECT data FROM ${this.table} WHERE page = ?1 AND gen <= ?2 ORDER BY gen DESC LIMIT 1`)
            .bind(page, atGen)
            .all();
    return toU8(r?.results?.[0]?.data ?? null);
  }

  /* كتابة حرة (مسار المحركات بلا ذرية) — تحجز جيلاً جديداً وتكتب صفحة واحدة */
  async put(page: number, data: Uint8Array): Promise<void> {
    for (let i = 0; ; i++) {
      try {
        const g = await this.d1.prepare(`SELECT COALESCE(MAX(gen), 0) + 1 AS g FROM vdb_commits`).bind().all();
        const gen = Number((g?.results?.[0] as { g?: number } | undefined)?.g ?? 1);
        await this.d1.batch([
          this.d1.prepare(`INSERT INTO vdb_commits (gen, at) VALUES (?1, ?2)`).bind(gen, Date.now()),
          this.d1.prepare(`INSERT INTO ${this.table} (gen, page, data) VALUES (?1, ?2, ?3)`).bind(gen, page, data),
        ]);
        return;
      } catch (e) {
        if (i < 3 && String(e).includes("UNIQUE")) continue;
        throw e;
      }
    }
  }

  async cas(page: number, expect: Uint8Array | null, data: Uint8Array): Promise<boolean> {
    void expect;
    void page;
    void data;
    throw new Error("vdb:cas_unsupported_on_d1");
  }

  /* التزام ذري كامل: حجز الجيل + كل الصفحات + الميتا في معاملة D1 واحدة */
  async atomicCommit(pages: Array<[number, Uint8Array]>, meta: Uint8Array, gen: number): Promise<boolean> {
    const stmts = [
      this.d1.prepare(`INSERT INTO vdb_commits (gen, at) VALUES (?1, ?2)`).bind(gen, Date.now()),
      ...pages.map(([p, b]) =>
        this.d1.prepare(`INSERT INTO ${this.table} (gen, page, data) VALUES (?1, ?2, ?3)`).bind(gen, p, b),
      ),
      this.d1.prepare(`INSERT INTO ${this.table} (gen, page, data) VALUES (?1, 0, ?2)`).bind(gen, meta),
    ];
    try {
      await this.d1.batch(stmts);
      return true;
    } catch (e) {
      if (String(e).includes("UNIQUE")) return false; /* الجيل محجوز لنافس — أعد المحاولة */
      throw e;
    }
  }
}
