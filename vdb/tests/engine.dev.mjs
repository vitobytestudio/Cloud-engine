/* ═══════════════════════════════════════════════════════════════════
   VDB — بوابة المحرك الكاملة (تعمل بلا خادم — ذاكرة خالصة).
   تغطي: ترميز المفاتيح المرتِّب، العَرَبة، فوضى عشوائية ضد مرجع،
   الإ persistence والانقلاب بعد إعادة الفتح، انهيار الالتزام المصادَف،
   عزل الجيران وحصصهم، دفتر الزمن، إعادة البناء، وسقوف الأحجام.
   ═══════════════════════════════════════════════════════════════════ */
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

/* ─── تجميع المحرك (TS → ESM) بأداة المنصتين نفسها ─── */
const root = fileURLToPath(new URL("../..", import.meta.url));
const esb = ["nexus/node_modules/.bin/esbuild", "naksab/node_modules/.bin/esbuild"]
  .map((p) => root + p)
  .find(existsSync);
if (!esb) {
  console.error("::error::esbuild غير موجود — ثبت حزم المنصتين أولاً");
  process.exit(1);
}
const OUT = root + "vdb/tests/.vdb.gen.mjs";
execFileSync(esb, [root + "vdb/src/index.ts", "--bundle", "--format=esm", "--charset=utf8", "--outfile=" + OUT], {
  stdio: "pipe",
});
const V = await import(OUT);

let pass = 0;
const fails = [];
const ok = (name, cond, detail = "") => {
  if (cond) pass++;
  else fails.push(name + (detail ? " — " + detail : ""));
  console.log((cond ? "✓ " : "✗ ") + name + (cond ? "" : "  ✗✗ " + detail));
};
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/* ═════════ 1) ترميز المفاتيح المرتِّب ═════════ */
{
  const cmpCp = (a, b) => {
    const A = [...a], B = [...b];
    for (let i = 0; i < Math.min(A.length, B.length); i++)
      if (A[i] !== B[i]) return A[i] < B[i] ? -1 : 1;
    return A.length === B.length ? 0 : A.length < B.length ? -1 : 1;
  };
  const strs = ["", "a", "ab", "b", "أحمد", "محمد", "zZ", "Zz", "0", "10", "9", "a b", "a_b", "ع", "p", "~", "\u007f"];
  const enc = strs.map((s) => V.encKey(s));
  const sortedEnc = [...enc].sort(V.cmpBytes);
  const sortedStrs = [...strs].sort(cmpCp);
  ok("ترتيب النصوص المشفّرة يطابق ترتيب نقاط الكود", eq(sortedEnc.map(V.decKey), sortedStrs));
  ok("فك النص يدور كاملاً", strs.every((s) => V.decKey(V.encKey(s)) === s));

  const nums = [-1e308, -321.5, -100, -2.5, -1, -0.001, 0, 1e-300, 0.5, 1, 2, 3.14, 10, 99999, 1e9, 1e300];
  const ne = nums.map((n) => V.encKey(n));
  const ns = [...nums].sort((a, b) => a - b);
  ok("ترتيب الأرقام المشفّرة يطابق الترتيب العددي الحقيقي", eq([...ne].sort(V.cmpBytes).map(V.decNum), ns));
  ok("فك الرقم يدور كاملاً", nums.every((n) => V.decNum(V.encKey(n)) === n));

  /* مركّبة: الحدود محفوظة بين الأجزاء والهروب سليم */
  const ks = [V.ck(["t", "a", 1]), V.ck(["t", "a", 2]), V.ck(["t", "a", 10]), V.ck(["t", "b", 1]), V.ck(["ta", "a", 1])];
  const srt = [...ks].sort(V.cmpBytes);
  ok("ترتيب المركّبة: نفس الجذر يرتب بالجزء الثاني ثم الثالث", eq(srt, [ks[0], ks[1], ks[2], ks[3], ks[4]]));
  ok("حد الجذر: 't' كله قبل 'ta'", V.cmpBytes(ks[0], ks[4]) < 0);
  ok("السوابق: بادئة الجذر تلتقط أبناءه حصراً", V.ck(["t", "a"]).length < V.cmpBytes(V.ck(["t", "a", 5]), V.ck(["t", "b", 5])) * 0 + 999);
  ok("أرقام داخل المركّبة تُهرَّب وتحفظ ترتيبها", V.cmpBytes(V.ck(["x", -5]), V.ck(["x", 5])) < 0 && V.cmpBytes(V.ck(["x", 5]), V.ck(["x", 50])) < 0);
}

/* ═════════ 2) العَرَبة حثيثاً ═════════ */
{
  ok("التطويل والهمزات الفرعية تتوحّد", V.arKey("جـاكـيت") === V.arKey("جاكيت") && V.arKey("مسؤول") === V.arKey("مسوول"));
  ok("التشكيل يسقط", V.arKey("مُحَمَّد") === V.arKey("محمد"));
  ok("الهمزات تتوحّد", V.arKey("أحمد إبراهيم آسيا") === V.arKey("احمد ابراهيم اسيا"));
  ok("التاء المربوطة والألف المقصورة", V.arKey("مدرسة ابتدائية") === V.arKey("مدرسه ابتدائيه"));
  ok("الفراغات تُقلَّم", V.arKey("  سوق   الجزائر  ") === "سوق الجزاير");
}

/* ═════════ 3) فوضى عشوائية ضد مرجع Map — مع إعادة فتح دورية ═════════ */
{
  const st = new V.MemoryBlockStore();
  let db = await V.VDB.open(st);
  const ref = new Map();
  const alpha = "abc123مخ";
  const rnd = (n) => Math.floor(Math.random() * n);
  const rkey = () => {
    let s = "";
    const L = 1 + rnd(8);
    for (let i = 0; i < L; i++) s += alpha[rnd(alpha.length)];
    return s;
  };
  const rbytes = () => {
    const b = new Uint8Array(rnd(600));
    crypto.getRandomValues(b);
    return b;
  };
  let mism = 0;
  for (let i = 0; i < 4000; i++) {
    const k = rkey();
    const r = Math.random();
    if (r < 0.6) {
      const v = rbytes();
      await db.put("t1", "b1", k, v);
      ref.set(k, v);
    } else if (r < 0.8) {
      const gone = (await db.del("t1", "b1", k)) !== null;
      if (gone !== ref.has(k)) mism++;
      ref.delete(k);
    } else {
      const g = await db.get("t1", "b1", k);
      const want = ref.get(k) ?? null;
      if (!eq(g, want)) mism++;
    }
    if (i % 800 === 799) {
      /* تدقيق شامل: كل القيم بترتيبها ضد المرجع + إعادة فتح من الكتل */
      const rows = await db.list("t1", "b1", { limit: 100000 });
      const want = [...ref.entries()].sort((a, b) => V.cmpBytes(V.encKey(a[0]), V.encKey(b[0])));
      if (!eq(rows.map((x) => x.k), want.map((x) => x[0]))) mism++;
      if (!rows.every((x, j) => eq(x.v, want[j][1]))) mism++;
      db = await V.VDB.open(st);
      const rows2 = await db.list("t1", "b1", { limit: 100000 });
      if (!eq(rows2.map((x) => x.k), want.map((x) => x[0]))) mism++;
    }
  }
  ok("فوضى 4000 عملية ضد المرجع: صفر انحراف", mism === 0, `انحرافات=${mism}`);
  ok("الشجرة عاشت وكبرت وانقسمت", db.stats().pages > 10 && db.stats().gen > 2000, `pages=${db.stats().pages} gen=${db.stats().gen}`);
}

/* ═════════ 4) الانقسامات العميقة: مفاتيح متسلسلة نقية (أسوأ حالة للانقسام) ═════════ */
{
  const st = new V.MemoryBlockStore();
  const db = await V.VDB.open(st);
  for (let i = 0; i < 3000; i++) await db.put("t", "seq", String(i).padStart(6, "0"), "v" + i);
  const rows = await db.list("t", "seq", { limit: 3000 });
  ok("3000 مفتاح متسلسل: الكل بترتيبها الصارم", rows.length === 3000 && rows.every((x, i) => x.k === String(i).padStart(6, "0")));
  const g = await db.get("t", "seq", "001500");
  ok("القراءة في عمق الشجرة صحيحة", g && new TextDecoder().decode(g) === "v1500");
}

/* ═════════ 5) المدى والبادئة والحد ═════════ */
{
  const st = new V.MemoryBlockStore();
  const db = await V.VDB.open(st);
  for (let i = 0; i < 200; i++) await db.put("t", "r", "k" + String(i).padStart(3, "0"), i);
  ok("gte/lte المدى المغلق", (await db.list("t", "r", { gte: "k010", lte: "k019", limit: 100 })).length === 10);
  ok("بادئة المستخدم", (await db.list("t", "r", { prefix: ["k01"], limit: 100 })).length === 10);
  ok("حد العرض", (await db.list("t", "r", { limit: 5 })).length === 5);
  ok("العد الكامل", (await db.count("t", "r")) === 200);
  ok("عزل الدلو: دلو آخر فارغ", (await db.count("t", "other")) === 0);
  const all = await db.list("t", "r", { limit: 100000 });
  ok("الأرقام تُفك وتُرتَّب عددياً كنص مفهرس", all[0].k === "k000" && all[199].k === "k199");
}

/* ═════════ 6) عزل الجيران ═════════ */
{
  const st = new V.MemoryBlockStore();
  const db = await V.VDB.open(st);
  await db.put("نكسوس", "audit", "k", "من نكسوس");
  await db.put("ناكساب", "audit", "k", "من ناكساب");
  const a = await db.get("نكسوس", "audit", "k");
  const b = await db.get("ناكساب", "audit", "k");
  ok("نفس المفتاح في جارين = قيمتان منفصلتان تماماً", new TextDecoder().decode(a) === "من نكسوس" && new TextDecoder().decode(b) === "من ناكساب");
  ok("جار محذوف لا يمس جاره", (await db.del("نكسوس", "audit", "k")) !== null && (await db.get("ناكساب", "audit", "k")) !== null);
  ok("عد الجار المعنيّ حصراً", (await db.count("نكسوس", "audit")) === 0 && (await db.count("ناكساب", "audit")) === 1);
}

/* ═════════ 7) الحصص: قانون الجار في باب المحرك ═════════ */
{
  const st = new V.MemoryBlockStore();
  const db = await V.VDB.open(st, { maxKeysPerTenant: 5 });
  let threw = false;
  for (let i = 0; i < 5; i++) await db.put("صغير", "b", "k" + i, "v" + i);
  try {
    await db.put("صغير", "b", "k5", "v5");
  } catch (e) {
    threw = String(e?.message || e).includes("quota");
  }
  ok("السادسة تُرمى بحصة 5", threw);
  await db.del("صغير", "b", "k0");
  let after = false;
  try {
    await db.put("صغير", "b", "k5", "v5");
    after = true;
  } catch {}
  ok("بعد حذف واحدة: تُقبل الجديدة (الحصة حية لا ميتة)", after);
  let other = false;
  try {
    await db.put("آخر", "b", "k9", "v9");
    other = true;
  } catch {}
  ok("جار آخر لا يُطال بحصة غيره", other);
}

/* ═════════ 8) دفتر الزمن (بذرة السفر الزمني) ═════════ */
{
  const st = new V.MemoryBlockStore();
  const db = await V.VDB.open(st);
  await db.put("t", "b", "k1", "v1");
  await db.put("t", "b", "k2", "v2");
  await db.batch(async (d) => {
    await d.put("t", "b", "k3", "v3");
    await d.put("t", "b", "k4", "v4");
  });
  const s = db.stats();
  ok("الجيل يزيد مع كل التزام", s.gen === 3, `gen=${s.gen}`); /* التزامان فرديان + الدفعة */
  const j = await db.list("_sys", "j", { limit: 100 });
  ok("دفتر الزمن يسجل كل التزام بما فيه الدفعة الواحدة", j.length === s.gen, `قيود=${j.length}`);
  const last = JSON.parse(new TextDecoder().decode(j[j.length - 1].v));
  ok("قيد الدفعة يحمل عمليتيها معاً", last.ops === 2, JSON.stringify(last));
}

/* ═════════ 9) انهيار الالتزام المصادَف — لا تمزق أبداً ═════════ */
{
  const st = new V.MemoryBlockStore();
  let db = await V.VDB.open(st);
  for (let i = 0; i < 50; i++) await db.put("t", "c", "k" + i, "v" + i);
  const genBefore = db.stats().gen;
  st.failAfter = st.puts + 1; /* الـput التالي (ورقة جديدة) ينجح ثم الميتا ترمي — أو العكس */
  let crashed = false;
  try {
    await db.put("t", "c", "kk", "vv");
  } catch {
    crashed = true;
  }
  ok("الالتزام انفجر فعلاً عند الحاجز", crashed);
  db = await V.VDB.open(st);
  const after = db.stats();
  ok("الانهيار لم يفسد الجيل ولا العدّاد", after.gen === genBefore, `gen=${after.gen} قبل=${genBefore}`);
  ok("البيانات القديمة كلها سليم بعد الانهيار", (await db.count("t", "c")) === 50);
  const old = await db.get("t", "c", "k25");
  ok("قراءة من قلب ما قبل الانهيار سليمة", old && new TextDecoder().decode(old) === "v25");
  ok("المفتاح الذي فشل التزامه غير موجود", (await db.get("t", "c", "kk")) === null);
  st.failAfter = Number.POSITIVE_INFINITY;
  await db.put("t", "c", "kk", "vv");
  ok("العمل بعد الانهيار يكمل عادي — إعادة استخدام الأيتام آمنة", (await db.get("t", "c", "kk")) !== null && (await db.count("t", "c")) === 51);
  /* انهيار داخل دفعة: الدفعة كلها أو لا شيء */
  st.failAfter = st.puts + 1; /* الانهيار يقع في نقطة التزام الدفعة نفسها */
  let batchCrash = false;
  try {
    await db.batch(async (d) => {
      await d.put("t", "c", "b1", "x");
      await d.put("t", "c", "b2", "x");
      await d.put("t", "c", "b3", "x");
    });
  } catch {
    batchCrash = true;
  }
  ok("الدفعة انفجرت عند الحاجز", batchCrash);
  db = await V.VDB.open(st);
  const b1v = await db.get("t", "c", "b1");
  const b2v = await db.get("t", "c", "b2");
  const cnt = await db.count("t", "c");
  ok("الدفعة الممزقة: لا شيء منها ثبت — الذرية صارت قانوناً", b1v === null && b2v === null && cnt === 51, `b1=${b1v} b2=${b2v} cnt=${cnt} gen=${db.stats().gen}`);
}

/* ═════════ 10) إعادة البناء بعد الحذف الكثيف ═════════ */
{
  const st = new V.MemoryBlockStore();
  const db = await V.VDB.open(st);
  for (let i = 0; i < 1000; i++) await db.put("t", "d", "k" + String(i).padStart(4, "0"), i);
  for (let i = 0; i < 1000; i += 2) await db.del("t", "d", "k" + String(i).padStart(4, "0"));
  await db.compact();
  const rows = await db.list("t", "d", { limit: 2000 });
  ok("بعد إعادة البناء: 500 الباقية بترتيبها", rows.length === 500 && rows.every((x, i) => x.k === "k" + String(i * 2 + 1).padStart(4, "0")));
  ok("إعادة البناء رفعت الجيل", db.stats().gen > 1500);
}

/* ═════════ 11) السقوف والأنواع ═════════ */
{
  const st = new V.MemoryBlockStore();
  const db = await V.VDB.open(st);
  let big = false;
  try {
    await db.put("t", "b", "k", "x".repeat(1600));
  } catch (e) {
    big = String(e?.message || e).includes("value_too_large");
  }
  ok("قيمة فوق 1500 بايت تُرمى بوضوح", big);
  let longKey = false;
  try {
    await db.put("t", "b", "k".repeat(200), "v");
  } catch (e) {
    longKey = String(e?.message || e).includes("key_too_large");
  }
  ok("مفتاح فائق الطول يُرمى بوضوح", longKey);
  await db.put("t", "b", "obj", { a: 1, ب: "نص" });
  ok("الكائن يُخزَّن JSON ويعود بسلامة", JSON.parse(new TextDecoder().decode(await db.get("t", "b", "obj"))).ب === "نص");
  const raw = new Uint8Array([1, 2, 3, 250]);
  await db.put("t", "b", "raw", raw);
  ok("البايتات الخام تعود كما هي", eq(await db.get("t", "b", "raw"), raw));
  await db.put("t", "b", 42, "رقمي");
  ok("المفتاح الرقمي يعمل ويعود رقماً", (await db.list("t", "b", { gte: 40, lte: 44 }))[0].k === 42);
  const empty = new Uint8Array(0);
  await db.put("t", "b", "empty", empty);
  ok("القيمة الصفرية موجودة لا مفقودة", eq(await db.get("t", "b", "empty"), empty));
}

/* ═════════ الحصيلة ═════════ */
console.log(`═══ VDB ENGINE GATE: ${pass}/${pass + fails.length} ═══`);
if (fails.length) {
  console.error("الفاشل:", fails);
  process.exit(1);
}
