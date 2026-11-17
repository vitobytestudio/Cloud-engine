/* ═══════════════════════════════════════════════════════════════════
   VDB — store-disk.node.ts — أقراص الإمبراطورية (أرض Node حصراً —
   خارج حزمة السحابة نهائياً: العقل في Workers والأقراص في بيوتنا).
   سجل كتابة مسبق (WAL) ملحق-فقط: كل التزام = سجل واحد بصمة تحقق
   CRC32 + fsync إجباري. الانهيار القاسي يترك السجل كاملاً أو بذيل
   ممزق يُقص عند الفتح. الفهرس في الذاكرة = قراءة لقطة MVCC بلا مسح.
   القفل بالملف = التزام عزلات متعددة على نفس الأقراص بحجز الجيل.
   ═══════════════════════════════════════════════════════════════════ */
import {
  existsSync,
  mkdirSync,
  openSync,
  readSync,
  closeSync,
  fstatSync,
  statSync,
  unlinkSync,
  fsyncSync,
  writeSync,
  ftruncateSync,
} from "node:fs";
import type { BlockStore } from "./store";

const MAGIC = 0x56;
const crc32 = (b: Uint8Array, start: number, end: number): number => {
  let c = ~0;
  for (let i = start; i < end; i++) {
    c ^= b[i]!;
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
};

type Version = { gen: number; off: number; len: number };

export class DiskBlockStore implements BlockStore {
  private walPath: string;
  private lockPath: string;
  private fd = -1;
  private index = new Map<number, Version[]>();
  private maxGen = 0;
  private walSize = 0; /* دائماً نكتب في ذيل السجل — القتل لا يطمس التاريخ أبداً */
  private lockDeadlineMs = 10_000;
  private lockStaleMs = 15_000;

  constructor(private dir: string) {
    this.walPath = `${dir}/vdb.wal`;
    this.lockPath = `${dir}/vdb.lock`;
  }

  /* التهيئة والاسترجاع: مسح السجل، قص الذيل الممزق، بناء الفهرس */
  async init(): Promise<void> {
    mkdirSync(this.dir, { recursive: true });
    if (!existsSync(this.walPath)) writeSync(openSync(this.walPath, "w"), new Uint8Array(0));
    this.fd = openSync(this.walPath, "r+");
    await this.recover();
  }

  private recover(): void {
    this.index.clear();
    this.maxGen = 0;
    const size = fstatSync(this.fd).size;
    if (size === 0) return;
    const buf = new Uint8Array(size);
    readSync(this.fd, buf, 0, size, 0);
    const dv = new DataView(buf.buffer);
    let o = 0;
    let good = 0;
    while (o + 17 <= size) {
      if (buf[o] !== MAGIC) break;
      const total = dv.getUint32(o + 1);
      if (o + 17 + total > size) break; /* ذيل ممزق — لم يكتمل السجل يوماً */
      const gen = dv.getUint32(o + 5);
      const cnt = dv.getUint32(o + 9);
      const crc = dv.getUint32(o + 13);
      if (crc32(buf, o + 17, o + 17 + total) !== crc) break; /* بصمة الحمولة لا تطابق */
      let p = o + 17;
      for (let i = 0; i < cnt; i++) {
        const page = dv.getUint32(p);
        const len = dv.getUint32(p + 4);
        const off = p + 8;
        const vs = this.index.get(page) ?? [];
        vs.push({ gen, off, len });
        this.index.set(page, vs);
        p = off + len;
      }
      if (gen > this.maxGen) this.maxGen = gen;
      o = p;
      good = o;
    }
    if (good < size) ftruncateSync(this.fd, good); /* الذيل الممزق لم يكن يوماً */
    this.walSize = good;
  }

  /* قفل ملف حصري — التزام العزلات المتعددة على نفس الأقراص */
  private async withLock<T>(fn: () => Promise<T>): Promise<T> {
    const start = Date.now();
    for (;;) {
      try {
        const fd = openSync(this.lockPath, "wx");
        closeSync(fd);
        break;
      } catch {
        try {
          const st = statSync(this.lockPath);
          if (Date.now() - st.mtimeMs > this.lockStaleMs) unlinkSync(this.lockPath);
        } catch {}
        if (Date.now() - start > this.lockDeadlineMs) throw new Error("vdb:lock_timeout");
        await new Promise((r) => setTimeout(r, 15));
      }
    }
    try {
      return await fn();
    } finally {
      try {
        unlinkSync(this.lockPath);
      } catch {}
    }
  }

  private readAt(off: number, len: number): Uint8Array {
    const b = new Uint8Array(len);
    readSync(this.fd, b, 0, len, off);
    return b;
  }

  async get(page: number, atGen?: number): Promise<Uint8Array | null> {
    const vs = this.index.get(page);
    if (!vs || vs.length === 0) return null;
    let v: Version | null = null;
    if (atGen === undefined) v = vs[vs.length - 1]!;
    else
      for (let i = vs.length - 1; i >= 0; i--)
        if (vs[i]!.gen <= atGen) {
          v = vs[i]!;
          break;
        }
    if (!v) return null;
    return this.readAt(v.off, v.len);
  }

  /* الكتابة الحرة غير مسموحة على الأقراص — كل التزام يمر بالذري */
  async put(_page: number, _data: Uint8Array): Promise<void> {
    throw new Error("vdb:use_atomic_commit");
  }

  /* التزام ذري كامل: قفل → سجل واحد + fsync → فهرس → فك القفل */
  async atomicCommit(pages: Array<[number, Uint8Array]>, meta: Uint8Array, gen: number): Promise<boolean> {
    return this.withLock(async () => {
      if (gen <= this.maxGen) return false; /* الجيل محجوز لنافس */
      const base = this.walSize; /* إحداثيات مطلقة في الملف — لا نسبية أبداً */
      const all: Array<[number, Uint8Array]> = [...pages, [0, meta]];
      let body = 17;
      for (const [, d] of all) body += 8 + d.length;
      const rec = new Uint8Array(body);
      const dv = new DataView(rec.buffer);
      rec[0] = MAGIC;
      dv.setUint32(1, body - 17);
      dv.setUint32(5, gen);
      dv.setUint32(9, all.length);
      let o = 17;
      const offs: Array<{ p: number; off: number; len: number }> = [];
      for (const [p, d] of all) {
        dv.setUint32(o, p);
        dv.setUint32(o + 4, d.length);
        rec.set(d, o + 8);
        offs.push({ p, off: base + o + 8, len: d.length });
        o += 8 + d.length;
      }
      dv.setUint32(13, crc32(rec, 17, body)); /* بصمة الحمولة — حقلها خارج الحساب */
      writeSync(this.fd, rec, 0, body, this.walSize); /* في الذيل حصراً */
      fsyncSync(this.fd); /* ← نقطة الالتزام: بايتات الإمبراطورية على القرص */
      this.walSize += body;
      for (const e of offs) {
        const vs = this.index.get(e.p) ?? [];
        vs.push({ gen, off: e.off, len: e.len });
        this.index.set(e.p, vs);
      }
      this.maxGen = gen;
      return true;
    });
  }

  async seal(): Promise<void> {
    if (this.fd >= 0) {
      fsyncSync(this.fd);
      closeSync(this.fd);
      this.fd = -1;
    }
  }

  /* تغذية النسخ المتماثل: كل سجلات الأقراص بعد جيل معين */
  syncSince(since: number): Array<{ gen: number; entries: Array<{ p: number; data: Uint8Array }> }> {
    const size = fstatSync(this.fd).size;
    const buf = new Uint8Array(size);
    readSync(this.fd, buf, 0, size, 0);
    const dv = new DataView(buf.buffer);
    const out: Array<{ gen: number; entries: Array<{ p: number; data: Uint8Array }> }> = [];
    let o = 0;
    while (o + 17 <= size) {
      if (buf[o] !== MAGIC) break;
      const total = dv.getUint32(o + 1);
      if (o + 17 + total > size) break;
      const gen = dv.getUint32(o + 5);
      const cnt = dv.getUint32(o + 9);
      const crc = dv.getUint32(o + 13);
      if (crc32(buf, o + 17, o + 17 + total) !== crc) break;
      let p = o + 17;
      const entries: Array<{ p: number; data: Uint8Array }> = [];
      for (let i = 0; i < cnt; i++) {
        const page = dv.getUint32(p);
        const len = dv.getUint32(p + 4);
        entries.push({ p: page, data: buf.slice(p + 8, p + 8 + len) });
        p += 8 + len;
      }
      if (gen > since) out.push({ gen, entries });
      o = p;
    }
    return out;
  }

  /* النسخة الكاملة الحالية — للنسخ الاحتياطي والاستعادة */
  dump(): Array<{ p: number; data: Uint8Array }> {
    const out: Array<{ p: number; data: Uint8Array }> = [];
    for (const [p, vs] of this.index) {
      const v = vs[vs.length - 1]!;
      out.push({ p, data: this.readAt(v.off, v.len) });
    }
    return out;
  }

  /* استعادة كاملة: كل الصفحات في التزام واحد جديد */
  async restore(pages: Array<{ p: number; data: Uint8Array }>): Promise<void> {
    const meta = pages.find((x) => x.p === 0);
    if (!meta) throw new Error("vdb:restore_needs_meta");
    const gen = this.maxGen + 1;
    const ok = await this.atomicCommit(
      pages.filter((x) => x.p !== 0).map((x) => [x.p, x.data] as [number, Uint8Array]),
      meta.data,
      gen,
    );
    if (!ok) throw new Error("vdb:restore_conflict");
  }
}
