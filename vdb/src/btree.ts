/* ═══════════════════════════════════════════════════════════════════
   VDB — btree.ts — شجرة B+ بنسخ-عند-الكتابة الصارم فوق صفحات 4096.
   القانون الحاكم: الصفحات الملتزمة أبداً لا تُعاد كتابة — كل تعديل
   يولّد نسخاً جديدة من مساره صعوداً حتى الجذر، والوالد يشير للابن الجديد.
   الالتزام = كتابة صفحة الميتا (0) وحدها. انهيار قبلها → الجذر القديم
   سليم بحرفه، والصفحات الجديدة يتيمة بلا أي ضرر على آخر حالة جيدة.
   الحذف بلا إعادة توازن (كسل مُوثَّق) — وإعادة البناء تشفي البنية.
   ═══════════════════════════════════════════════════════════════════ */

import { cmpBytes } from "./bytes";

export const PAGE = 4096;
export const MAX_KEY = 200; /* بايت للمفتاح المشفَّر بعد الترميز */
export const MAX_VAL = 1500; /* بايت للقيمة — القيم الأكبر تلقى رفضاً واضحاً */

const T_LEAF = 2;
const T_INT = 3;

export type Entry = { k: Uint8Array; v: Uint8Array };
export type Split = { sep: Uint8Array; page: number };

export type Ctx = {
  read(page: number): Promise<Uint8Array>;
  write(page: number, b: Uint8Array): void;
  alloc(): number;
};

/* ─── تنسيق الصفحة الورقية: [نوع=2 u8][عدد u16][التالي u32] ثم مدخلات
     [طول المفتاح u16][المفتاح][طول القيمة u16][القيمة] ─── */
export const serLeaf = (es: Entry[], next: number): Uint8Array => {
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

const parseLeaf = (b: Uint8Array): { es: Entry[]; next: number } => {
  const dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
  const count = dv.getUint16(1);
  const next = dv.getUint32(3);
  const es: Entry[] = [];
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

/* ─── تنسيق الصفحة الداخلية: [نوع=3 u8][عدد المفاتيح u16][الابن الأول u32]
     ثم لكل مفتاح: [الابن التالي u32][طول المفتاح u16][المفتاح] ─── */
type INode = { keys: Uint8Array[]; children: number[] };

export const serInt = (n: INode): Uint8Array => {
  let size = 7;
  for (const k of n.keys) size += 6 + k.length;
  const b = new Uint8Array(size);
  const dv = new DataView(b.buffer);
  b[0] = T_INT;
  dv.setUint16(1, n.keys.length);
  dv.setUint32(3, n.children[0]!);
  let o = 7;
  for (let i = 0; i < n.keys.length; i++) {
    dv.setUint32(o, n.children[i + 1]!);
    o += 4;
    const k = n.keys[i]!;
    dv.setUint16(o, k.length);
    b.set(k, o + 2);
    o += 2 + k.length;
  }
  return b;
};

const parseIntN = (b: Uint8Array): INode => {
  const dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
  const kn = dv.getUint16(1);
  const children: number[] = [dv.getUint32(3)];
  const keys: Uint8Array[] = [];
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

/* فهرس الابن الصحيح عند النزول الداخلي: عدد الفواصل ≤ المفتاح —
   التساوي مع الفاصل ينزل يميناً (الفاصل هو أول مفتاح اليمين، عقد البحث القياسية) */
const ubKeys = (keys: Uint8Array[], key: Uint8Array): number => {
  let lo = 0;
  let hi = keys.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (cmpBytes(keys[mid]!, key) <= 0) lo = mid + 1;
    else hi = mid;
  }
  return lo;
};

/* أول فهرس بمدخلة ≥ المفتاح */
const lb = (es: Entry[], key: Uint8Array): number => {
  let lo = 0;
  let hi = es.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (cmpBytes(es[mid]!.k, key) < 0) lo = mid + 1;
    else hi = mid;
  }
  return lo;
};

/* نقطة الانقسام الورقية: أغرق حتى ما تحت النصف ثم توقف (كل مدخلة ≤ 1704 بايت
   فلا يمكن أن يفيض أي نصف عن الصفحة) */
const leafSplitPoint = (es: Entry[]): number => {
  let acc = 7;
  let cut = 1;
  for (let i = 0; i < es.length - 1; i++) {
    const sz = 4 + es[i]!.k.length + es[i]!.v.length;
    if (acc + sz > PAGE / 2) break;
    acc += sz;
    cut = i + 1;
  }
  return cut;
};

export type InsRes = { page: number; split: Split | null };

/* ─── الإدراج الصارم: كل مستوى يكتب نسخته الجديدة ويعيد رقم صفحته ─── */
export const ins = async (page: number, key: Uint8Array, val: Uint8Array, ctx: Ctx): Promise<InsRes> => {
  const raw = await ctx.read(page);
  if (raw[0] === T_LEAF) {
    const { es, next } = parseLeaf(raw);
    const i = lb(es, key);
    if (i < es.length && cmpBytes(es[i]!.k, key) === 0) es[i] = { k: key, v: val };
    else es.splice(i, 0, { k: key, v: val });
    const b = serLeaf(es, next);
    const np = ctx.alloc();
    if (b.length <= PAGE) {
      ctx.write(np, b);
      return { page: np, split: null };
    }
    const cut = leafSplitPoint(es);
    const left = es.slice(0, cut);
    const right = es.slice(cut);
    const lp = np;
    const rp = ctx.alloc();
    ctx.write(rp, serLeaf(right, 0));
    ctx.write(lp, serLeaf(left, 0));
    return { page: lp, split: { sep: right[0]!.k, page: rp } };
  }
  const node = parseIntN(raw);
  const i = ubKeys(node.keys, key);
  const child = await ins(node.children[i]!, key, val, ctx);
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
  const sepK = node.keys[mid]!;
  const rp = ctx.alloc();
  ctx.write(rp, serInt({ keys: node.keys.slice(mid + 1), children: node.children.slice(mid + 1) }));
  ctx.write(np, serInt({ keys: node.keys.slice(0, mid), children: node.children.slice(0, mid + 1) }));
  return { page: np, split: { sep: sepK, page: rp } };
};

export type DelRes = { page: number; found: boolean };

/* ─── الحذف الصارم: المسار المتغير يُنسخ، والسالم يعود كما هو بلا كلفة ─── */
export const del = async (page: number, key: Uint8Array, ctx: Ctx): Promise<DelRes> => {
  const raw = await ctx.read(page);
  if (raw[0] === T_LEAF) {
    const { es, next } = parseLeaf(raw);
    const i = lb(es, key);
    if (!(i < es.length && cmpBytes(es[i]!.k, key) === 0)) return { page, found: false };
    es.splice(i, 1);
    const np = ctx.alloc();
    ctx.write(np, serLeaf(es, next));
    return { page: np, found: true };
  }
  const node = parseIntN(raw);
  const i = ubKeys(node.keys, key);
  const child = await del(node.children[i]!, key, ctx);
  if (!child.found) return { page, found: false };
  node.children[i] = child.page;
  const np = ctx.alloc();
  ctx.write(np, serInt(node));
  return { page: np, found: true };
};

/* ─── القراءة: نزول واحد حتى الورق ─── */
export const getRaw = async (root: number, key: Uint8Array, ctx: Ctx): Promise<Uint8Array | null> => {
  let page = root;
  for (;;) {
    const raw = await ctx.read(page);
    if (raw[0] === T_LEAF) {
      const { es } = parseLeaf(raw);
      const i = lb(es, key);
      return i < es.length && cmpBytes(es[i]!.k, key) === 0 ? es[i]!.v : null;
    }
    const node = parseIntN(raw);
    page = node.children[ubKeys(node.keys, key)]!;
  }
};

/* ─── العد الطرقي (نموذج LMDB): كرسيّ يحمل رحلة النزول، يصعد لأول ابن
     لم يُزر وينزل إلى أقصى اليسار — بلا أي مؤشرات شقيقة بين الأوراق،
     فانقسام الورق لا يكسر العد أبداً في النسخ-عند-الكتابة الصارم ─── */
export const scan = async (
  root: number,
  start: Uint8Array | null,
  ctx: Ctx,
  take: (e: Entry) => boolean,
): Promise<void> => {
  if (root === 0) return;
  const path: Array<{ node: INode; child: number }> = [];
  let page = root;
  let raw = await ctx.read(page);
  for (;;) {
    if (raw[0] === T_LEAF) break;
    const node = parseIntN(raw);
    const c = start ? ubKeys(node.keys, start) : 0;
    path.push({ node, child: c });
    page = node.children[c]!;
    raw = await ctx.read(page);
  }
  const first = parseLeaf(raw);
  let es = first.es;
  let i = start ? lb(es, start) : 0;
  for (;;) {
    for (; i < es.length; i++) if (!take(es[i]!)) return;
    let moved = false;
    while (path.length) {
      const f = path.pop()!;
      if (f.child + 1 < f.node.children.length) {
        f.child++;
        path.push(f);
        let pg = f.node.children[f.child]!;
        for (;;) {
          const r2 = await ctx.read(pg);
          if (r2[0] === T_LEAF) {
            es = parseLeaf(r2).es;
            i = 0;
            moved = true;
            break;
          }
          const n2 = parseIntN(r2);
          path.push({ node: n2, child: 0 });
          pg = n2.children[0]!;
        }
        break;
      }
    }
    if (!moved) return;
  }
};
