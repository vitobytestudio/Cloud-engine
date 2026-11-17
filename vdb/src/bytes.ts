/* ═══════════════════════════════════════════════════════════════════
   VDB — قاعدة بيانات فيتو (VITO BYTE DATABASE)
   bytes.ts — ترميز المفاتيح المرتِّب: أي بايتين يُقارنان معجمياً
   والترتيب الناتج يطابق ترتيب القيم الأصلية (نصوص/أرقام/مركّبة).
   هذا الأساس الذي تقوم عليه كل الفهارس والمدى والسوابق في المحرك.
   ═══════════════════════════════════════════════════════════════════ */

export const cmpBytes = (a: Uint8Array, b: Uint8Array): number => {
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) {
    const d = a[i]! - b[i]!;
    if (d !== 0) return d < 0 ? -1 : 1;
  }
  return a.length === b.length ? 0 : a.length < b.length ? -1 : 1;
};

export const hasPrefix = (k: Uint8Array, p: Uint8Array): boolean => {
  if (p.length > k.length) return false;
  for (let i = 0; i < p.length; i++) if (k[i] !== p[i]) return false;
  return true;
};

/* نص → بايتات utf8 — بايت NUL ممنوع في أسماء المستويات (المهرِّب يعتمد عليه) */
export const encStr = (s: string): Uint8Array => {
  const b = new TextEncoder().encode(s);
  if (b.includes(0)) throw new Error("vdb:key_nul_forbidden");
  return b;
};

/* رقم → float64 مرتِّب في 9 بايتات: بايت نوع 0x02 + ثمانية بايتات مرتبة
   ترتيباً صحيحاً للسالب والموجب والكسور والصفر (التحويل الكلاسيكي المثبت) */
export const encNum = (n: number): Uint8Array => {
  if (!Number.isFinite(n)) throw new Error("vdb:key_num_not_finite");
  const f = new Float64Array(1);
  f[0] = n;
  let x = new BigUint64Array(f.buffer)[0]!;
  x = x >> 63n ? ~x & 0xffffffffffffffffn : x | 0x8000000000000000n;
  const out = new Uint8Array(9);
  out[0] = 0x02;
  for (let i = 0; i < 8; i++) out[1 + i] = Number((x >> BigInt((7 - i) * 8)) & 0xffn);
  return out;
};

/* فك رقم مرتِّب — عكس encNum حرفياً */
export const decNum = (b: Uint8Array): number => {
  if (b.length !== 9 || b[0] !== 0x02) throw new Error("vdb:key_not_num");
  let x = 0n;
  for (let i = 0; i < 8; i++) x = (x << 8n) | BigInt(b[1 + i]!);
  x = x & 0x8000000000000000n ? x & 0x7fffffffffffffffn : ~x & 0xffffffffffffffffn;
  const u = new BigUint64Array(1);
  u[0] = x;
  return new Float64Array(u.buffer)[0]!;
};

/* مفتاح مستخدم: نص (بايت نوع 0x01) أو رقم (بايت نوع 0x02) — الأنواع لا تتصادم */
export const encKey = (k: string | number): Uint8Array => {
  if (typeof k === "number") return encNum(k);
  const s = encStr(k);
  const out = new Uint8Array(s.length + 1);
  out[0] = 0x01;
  out.set(s, 1);
  return out;
};

export const decKey = (b: Uint8Array): string | number => {
  if (b.length === 0) throw new Error("vdb:key_empty");
  if (b[0] === 0x01) return new TextDecoder().decode(b.subarray(1));
  if (b[0] === 0x02) return decNum(b);
  throw new Error("vdb:key_unknown_type");
};

/* ─── المركّبة: أجزاء مهرَّبة بذاتية الإنهاء — الترتيب محفوظ عبر حدود الأجزاء ───
   قاعدة الهروب: بايت 0x00 داخل الجزء → 0x00 0xFF، ونهاية الجزء → 0x00 0x00.
   (0x00 0x00 أصغر من أي تتمة، و0x00 0xFF أكبر منها وأصغر من 0x01 — الحيلة المثبتة) */
const escPart = (b: Uint8Array): Uint8Array => {
  let zeros = 0;
  for (let i = 0; i < b.length; i++) if (b[i] === 0) zeros++;
  if (zeros === 0) return b;
  const out = new Uint8Array(b.length + zeros);
  let o = 0;
  for (let i = 0; i < b.length; i++) {
    out[o++] = b[i]!;
    if (b[i] === 0) out[o++] = 0xff;
  }
  return out;
};

const concat = (parts: Uint8Array[]): Uint8Array => {
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

/* مفتاح مركّب كامل: كل جزء مهرَّب ومنتهٍ */
export const ck = (parts: (string | number)[]): Uint8Array =>
  concat(parts.map((p) => concat([escPart(encKey(p)), new Uint8Array([0, 0])])));

/* بادئة مركّبة مفتوحة: كل الأجزاء ما عدا الأخير منتهية، والأخير مهرَّب بلا نهاية —
   وبادئة مستوى كامل = أجزاء مهرَّبة منتهية كلها (تلتقط كل ما تحتها حصراً) */
export const ckPrefix = (parts: (string | number)[], openLast = false): Uint8Array => {
  const segs: Uint8Array[] = [];
  parts.forEach((p, i) => {
    segs.push(escPart(encKey(p)));
    if (!openLast || i < parts.length - 1) segs.push(new Uint8Array([0, 0]));
  });
  return concat(segs);
};

/* فك الجزء الأخير من مفتاح مركّب: يفك الهروب ويتوقف عند المنهي 0x00 0x00 */
export const decRaw = (b: Uint8Array): string | number => {
  if (b.length === 0) throw new Error("vdb:key_empty");
  if (b[0] === 0x01) return new TextDecoder().decode(b.subarray(1));
  if (b[0] === 0x02) return decNum(b);
  throw new Error("vdb:key_unknown_type");
};

export const ckLast = (full: Uint8Array, prefixLen: number): string | number => {
  const out: number[] = [];
  for (let i = prefixLen; i < full.length; i++) {
    const b = full[i]!;
    if (b === 0) {
      if (full[i + 1] === 0xff) {
        out.push(0);
        i++;
        continue;
      }
      break; /* المنهي — نهاية الجزء الأخير */
    }
    out.push(b);
  }
  return decRaw(new Uint8Array(out));
};
