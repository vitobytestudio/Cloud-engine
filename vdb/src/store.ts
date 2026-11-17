/* ═══════════════════════════════════════════════════════════════════
   VDB — store.ts — طبقة الكتل العمياء: عقد المحرك مع العالم.
   المحرك يرى صفحات مرقّمة ولا يعلم أين تسكن — الذاكرة اليوم،
   وسحابة Workers (KV) في الإنتاج، وأقراص عنقودنا غداً بلا سطر واحد يتغير.
   ═══════════════════════════════════════════════════════════════════ */

export interface BlockStore {
  get(page: number): Promise<Uint8Array | null>;
  put(page: number, data: Uint8Array): Promise<void>;
}

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
}

/* عقد KV بنيوي محايد (Workers KV أو أي مخزن مفاتيح غير متزامن) */
type MinimalKV = {
  get(key: string, opts?: unknown): Promise<unknown>;
  put(key: string, value: unknown, opts?: unknown): Promise<void>;
};

/* كتل سحابية: صفحة رقم n = مفتاح <prefix>p<n> — القيمة ArrayBuffer خام */
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
