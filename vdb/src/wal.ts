/* ═══════════════════════════════════════════════════════════════════
   VDB — wal.ts — صيغة سجل الكتابة المسبقة الموحّدة: لسان أقراص
   الإمبراطورية الثلاثة واحد — الحارة (D1 عبر العقدة)، المملوكة (WAL
   الملفي)، والأبدية (أرشيف المستودع). سجل واحد = جيل واحد: ترويسة
   17 بايت (سحر + الحجم + الجيل + عدد الصفحات + بصمة CRC32 للحمولة)
   ثم مدخلات [الصفحة u32][الطول u32][البيانات] والصفحة 0 هي الميتا.
   ═══════════════════════════════════════════════════════════════════ */

export const WAL_MAGIC = 0x56;
export const WAL_HEAD = 17;

export const crc32 = (b: Uint8Array, start: number, end: number): number => {
  let c = ~0;
  for (let i = start; i < end; i++) {
    c ^= b[i]!;
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
};

/* صفحات الالتزام كاملة (الصفحة 0 = الميتا) → سجل WAL واحد */
export const walEncode = (gen: number, pages: Array<[number, Uint8Array]>): Uint8Array => {
  let body = WAL_HEAD;
  for (const [, d] of pages) body += 8 + d.length;
  const rec = new Uint8Array(body);
  const dv = new DataView(rec.buffer);
  rec[0] = WAL_MAGIC;
  dv.setUint32(1, body - WAL_HEAD);
  dv.setUint32(5, gen);
  dv.setUint32(9, pages.length);
  let o = WAL_HEAD;
  for (const [p, d] of pages) {
    dv.setUint32(o, p);
    dv.setUint32(o + 4, d.length);
    rec.set(d, o + 8);
    o += 8 + d.length;
  }
  dv.setUint32(13, crc32(rec, WAL_HEAD, body));
  return rec;
};

export type WalRecord = { gen: number; pages: Array<{ p: number; data: Uint8Array }>; meta: Uint8Array };

/* سجل WAL → جيله وصفحاته وميتاه — البصمة تسقط التمزق قبل أي فك */
export const walDecode = (rec: Uint8Array): WalRecord => {
  const dv = new DataView(rec.buffer, rec.byteOffset, rec.byteLength);
  if (rec.length < WAL_HEAD || rec[0] !== WAL_MAGIC) throw new Error("vdb:wal_bad_magic");
  const total = dv.getUint32(1);
  if (rec.length < WAL_HEAD + total) throw new Error("vdb:wal_truncated");
  const gen = dv.getUint32(5);
  const count = dv.getUint32(9);
  if (crc32(rec, WAL_HEAD, WAL_HEAD + total) !== dv.getUint32(13)) throw new Error("vdb:wal_crc");
  const pages: Array<{ p: number; data: Uint8Array }> = [];
  let meta = new Uint8Array(0);
  let o = WAL_HEAD;
  for (let i = 0; i < count; i++) {
    const p = dv.getUint32(o);
    const len = dv.getUint32(o + 4);
    const data = rec.slice(o + 8, o + 8 + len);
    if (p === 0) meta = data;
    else pages.push({ p, data });
    o += 8 + len;
  }
  return { gen, pages, meta };
};
