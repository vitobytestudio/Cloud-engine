/* ═══════════════════════════════════════════════════════════════════
   VDB — بوابة الفوضى والمعارك: نسخ محرك متعددة تناور على أقراص واحدة
   بمحاكاة D1 الذرية حرفياً (حجز الجيل + تطبيق معاملة بطيء متشابك)،
   وانهيارات مصادفة في قلب المعارك، وقراءات لقطة أثناء القتال.
   الحكم: صفر تحديث مفقود، صفر قراءة ملوثة، والناجون كلهم على الأقراص.
   ═══════════════════════════════════════════════════════════════════ */
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../..", import.meta.url));
const esb = ["nexus/node_modules/.bin/esbuild", "naksab/node_modules/.bin/esbuild"]
  .map((p) => root + p)
  .find(existsSync);
if (!esb) {
  console.error("::error::esbuild غير موجود — ثبت حزم المنصتين أولاً");
  process.exit(1);
}
const OUT = root + "vdb/tests/.vdb.chaos.mjs";
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
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ─── مخزن يحاكي D1 الذري حرفياً: صفحات بالجيل + حجز الجيل في معاملة
     بطيئة متشابكة (نقاط تسليم عشوائية داخل التطبيق تكشف السباقات) ─── */
class FakeAtomicStore {
  constructor(slow = 2) {
    this.slow = slow;
    this.versions = new Map(); /* page → Array<{gen, data}> */
    this.gens = new Set(); /* حجوزات الجيل — كل جيل يُحجز مرة واحدة */
    this.crashAfter = Number.POSITIVE_INFINITY;
    this.writes = 0;
    this.conflicts = 0;
  }
  async get(page, atGen) {
    await sleep(Math.random() * this.slow);
    const vs = this.versions.get(page) ?? [];
    if (atGen === undefined) {
      let best = null;
      for (const v of vs) if (best === null || v.gen > best.gen) best = v;
      return best ? best.data : null;
    }
    let best = null;
    for (const v of vs) if (v.gen <= atGen && (best === null || v.gen > best.gen)) best = v;
    return best ? best.data : null;
  }
  async put(page, data) {
    await this.atomicCommit([[page, data]], data, (await this.maxGen()) + 1);
  }
  async maxGen() {
    let m = 0;
    for (const g of this.gens) if (g > m) m = g;
    return m;
  }
  async atomicCommit(pages, meta, gen) {
    /* حجز الجيل — التعارض هنا = نافسة سبقتنا */
    if (this.gens.has(gen)) {
      this.conflicts++;
      return false;
    }
    this.gens.add(gen);
    /* معاملة بطيئة متشابكة: نقاط تسليم عشوائية أثناء التطبيق —
       القارئ اللقطة في هذه الأثناء يجب ألا يرى شيئاً من هذا الجيل */
    const all = [...pages, [0, meta]];
    let i = 0;
    while (i < all.length) {
      await sleep(Math.random() * this.slow);
      if (this.writes >= this.crashAfter) {
        this.gens.delete(gen); /* الانهيار يتراجع كلياً — كأن المعاملة لم تكن */
        throw new Error("vdb_sim_crash");
      }
      const [p, d] = all[i++];
      const vs = this.versions.get(p) ?? [];
      vs.push({ gen, data: d });
      this.versions.set(p, vs);
      this.writes++;
    }
    return true;
  }
}

/* ═════════ 1) معركة 6 كتاب على أقراص واحدة — صفر تحديث مفقود ═════════ */
{
  const st = new FakeAtomicStore();
  const dbs = [];
  for (let i = 0; i < 6; i++) dbs.push(await V.VDB.open(st, { journal: false }));
  let thrown = 0;
  const results = await Promise.all(
    dbs.map(async (db, w) => {
      let done = 0;
      for (let j = 0; j < 15; j++) {
        try {
          await db.put("تاجر" + w, "b", "k" + j, { w, j });
          done++;
        } catch (e) {
          thrown++;
          if (!String(e?.message ?? e).includes("conflict")) throw e;
        }
      }
      return done;
    }),
  );
  const landed = results.reduce((a, b) => a + b, 0);
  ok("المعركة دارت فعلاً: تعارضات حقيقية وُلدت", st.conflicts > 0, `تعارضات=${st.conflicts} مرفوضات=${thrown}`);
  ok("كل العمليات المقبولة عدادها دقيق", landed === 6 * 15 - thrown, `ناجحة=${landed} فاشلة=${thrown}`);
  const db = await V.VDB.open(st);
  await db.fresh();
  let total = 0;
  for (let w = 0; w < 6; w++) total += await db.count("تاجر" + w, "b");
  ok("صفر تحديث مفقود على الأقراص بعد المعركة", total === landed, `على الأقراص=${total} المفترض=${landed}`);
  const reopen = await V.VDB.open(st);
  await reopen.fresh();
  let total2 = 0;
  for (let w = 0; w < 6; w++) total2 += await reopen.count("تاجر" + w, "b");
  ok("إعادة الفتح من الأقراص تحسب نفس الشيء بالضبط", total2 === total, `${total2} مقابل ${total}`);
}

/* ═════════ 2) قراءة اللقطة أثناء القتال: القارئ لا يرى مستقبل النافس ═════════ */
{
  const st = new FakeAtomicStore(6); /* معاملة بطيئة جداً — سباق واسع */
  const w = await V.VDB.open(st, { journal: false });
  await w.put("t", "b", "seed", "v0");
  await w.fresh();
  const genBefore = w.stats().gen;
  /* القارئ يُفتح قبل بدء المعاملة — لقطة الجيل حتمية لا سباق فيها */
  const r = await V.VDB.open(st);
  ok("لقطة القارئ مثبتة على الجيل الحالي", r.stats().gen === genBefore, `gen=${r.stats().gen}`);
  /* كاتب يلتزم في الخلفية بمعاملة بطيئة */
  const bg = w.put("t", "b", "new", "v1");
  const seen = await r.get("t", "b", "new");
  const seed = await r.get("t", "b", "seed");
  ok("اللقطة القديمة لا ترى التزام الجيل الجديد أثناء طهيه", seen === null && seed && new TextDecoder().decode(seed) === "v0");
  await bg;
  ok("بعد اكتمال المعاملة: القراءة الجديدة ترى القيد", (await (await V.VDB.open(st)).get("t", "b", "new")) !== null);
  void genBefore;
}

/* ═════════ 3) انهيار مصادف في قلب المعركة — الناجون سليمون والممزق ليس موجوداً ═════════ */
{
  const st = new FakeAtomicStore();
  const dbs = [];
  for (let i = 0; i < 4; i++) dbs.push(await V.VDB.open(st, { journal: false }));
  st.crashAfter = st.writes + 3; /* انهيار يضرب أثناء معاملة أحدهم */
  const outcomes = await Promise.allSettled(
    dbs.map(async (db, w) => {
      const done = [];
      for (let j = 0; j < 10; j++) {
        try {
          await db.put("ح" + w, "b", "k" + j, j);
          done.push(j);
        } catch (e) {
          if (!String(e?.message ?? e).includes("crash") && !String(e?.message ?? e).includes("conflict")) throw e;
        }
      }
      return done.length;
    }),
  );
  const landed = outcomes.filter((o) => o.status === "fulfilled").reduce((a, o) => a + o.value, 0);
  const db = await V.VDB.open(st);
  await db.fresh();
  let total = 0;
  for (let w = 0; w < 4; w++) total += await db.count("ح" + w, "b");
  ok("الانهيار أثناء المعركة: على الأقراص بالضبط ما ثبت", total === landed, `على الأقراص=${total} الثابت=${landed}`);
  const clean = await V.VDB.open(st);
  await clean.fresh();
  let consistent = true;
  for (let w = 0; w < 4; w++) {
    const rows = await clean.list("ح" + w, "b", { limit: 100 });
    for (const r2 of rows) if (typeof r2.k !== "string") consistent = false;
  }
  ok("لا فساد في البنية بعد الانهيار الجماعي", consistent);
}

/* ═════════ 4) مسار CAS الكلاسيكي: نافستان على مخزن CAS — واحدة تعيد المحاولة وتنجح ═════════ */
{
  const st = new V.MemoryBlockStore();
  const a = await V.VDB.open(st, { journal: false });
  const b = await V.VDB.open(st, { journal: false });
  await a.put("t", "b", "x0", "seed");
  /* فسحة متشابكة: كلاهما يقرأ الحالة نفسها ثم يلتزم — CAS يقتل واحدة */
  await b.fresh();
  const [ra, rb] = await Promise.allSettled([a.put("t", "b", "a1", "va"), b.put("t", "b", "b1", "vb")]);
  const winners = [ra, rb].filter((r) => r.status === "fulfilled").length;
  ok("مسار CAS: كلتاهما نجحتا بالتناوب أو التعارض رُفع بوضوح", winners === 2 || [ra, rb].some((r) => r.status === "rejected" && String(r.reason).includes("conflict")));
  const db = await V.VDB.open(st);
  const cnt = await db.count("t", "b");
  ok("حالة الأقراص بعد سباق CAS متسقة", cnt >= 2 && cnt <= 3, `قيود=${cnt}`);
  const x0 = await db.get("t", "b", "x0");
  ok("البذرة سليمة بعد سباق CAS", x0 && new TextDecoder().decode(x0) === "seed");
}

console.log(`═══ VDB CHAOS GATE: ${pass}/${pass + fails.length} ═══`);
if (fails.length) {
  console.error("الفاشل:", fails);
  process.exit(1);
}
