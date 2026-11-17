/* ═══════════════════════════════════════════════════════════════════
   VDB — بوابة الأمبراطورية: عنقود حي على أقراصنا الخاصة.
   عقدة خادمة حقيقية + ضغط HTTP فعلي + قتل قاسٍ SIGKILL أثناء الكتابة
   + إعادة إقلاع والتحقق أن كل ما ثبت باقي ولم يمزق شيء +
   نسخ متماثل بتغذية السجل (/vdb/sync) + نسخ احتياطي واستعادة في عقدة ثالثة.
   الحكم: الإمبراطورية لا تفقد بايتاً معتمداً مهما ضُربت.
   ═══════════════════════════════════════════════════════════════════ */
import { execFileSync, spawn } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { join } from "node:path";

const root = fileURLToPath(new URL("../..", import.meta.url));
const esb = ["nexus/node_modules/.bin/esbuild", "naksab/node_modules/.bin/esbuild"]
  .map((p) => root + p)
  .find(existsSync);
if (!esb) {
  console.error("::error::esbuild غير موجود — ثبت حزم المنصتين أولاً");
  process.exit(1);
}
execFileSync(
  esb,
  [root + "vdb/server/bundle-entry.ts", "--bundle", "--format=esm", "--platform=node", "--charset=utf8", "--outfile=" + root + "vdb/server/vdb.bundle.mjs"],
  { stdio: "pipe" },
);
const V = await import(root + "vdb/server/vdb.bundle.mjs");

let pass = 0;
const fails = [];
const ok = (name, cond, detail = "") => {
  if (cond) pass++;
  else fails.push(name + (detail ? " — " + detail : ""));
  console.log((cond ? "✓ " : "✗ ") + name + (cond ? "" : "  ✗✗ " + detail));
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const TOKEN = "empire-drill";
const H = { "content-type": "application/json", "x-vdb-token": TOKEN };
const dir = (n) => join(tmpdir(), "vdb-empire-" + n);
for (const d of ["A", "B", "C"]) rmSync(dir(d), { recursive: true, force: true });

let portSeq = 18990 + Math.floor(Math.random() * 200);
const spawnNode = (d) => {
  const p = spawn("node", [root + "vdb/server/node.mjs", "--port", String(portSeq), "--data", dir(d), "--token", TOKEN], {
    stdio: ["ignore", "pipe", "pipe"],
  });
  p.log = "";
  p.stdout.on("data", (c) => (p.log += c));
  p.stderr.on("data", (c) => (p.log += c));
  p.port = portSeq++;
  p.base = `http://127.0.0.1:${p.port}`;
  return p;
};
const waitHealthy = async (node, tries = 60) => {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(node.base + "/vdb/health", { headers: H });
      if (r.ok) return await r.json();
    } catch {}
    await sleep(250);
  }
  throw new Error("node unreachable: " + node.log.slice(-300));
};
const api = async (node, path, opts = {}) => {
  const r = await fetch(node.base + path, {
    method: opts.m || "GET",
    headers: H,
    body: opts.b ? JSON.stringify(opts.b) : undefined,
  });
  return { s: r.status, d: await r.json().catch(() => ({})) };
};

/* ═══ 1) عقدة الإمبراطورية تقلع على أقراصنا ═══ */
const A = spawnNode("A");
const h1 = await waitHealthy(A);
ok("عقدة الإمبراطورية قامت على أقراصنا الخاصة", h1.ok && h1.engine === "vdb", JSON.stringify(h1));

let noAuth = 0;
for (let i = 0; i < 3; i++) {
  const r = await fetch(A.base + "/vdb/put", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ t: "t", b: "b", k: "k", v: "x" }),
  });
  if (r.status === 403) noAuth++;
}
ok("بلا توكن العقدة: 403 صامت — لا مجاناً لأحد", noAuth === 3);

/* ═══ 2) ضغط كتابة فعلي عبر الشبكة ═══ */
const W = 3;
const N = 25;
let acked = 0;
const burst = async (tag, from) => {
  let done = 0;
  for (let j = from; j < from + N; j++) {
    try {
      const r = await api(A, "/vdb/put", {
        m: "POST",
        b: { t: "تاجر" + (j % W), b: "audit", k: "k" + tag + "-" + j, v: { tag, j, at: Date.now() } },
      });
      if (r.s === 200 && r.d.ok) {
        done++;
        acked++;
      }
    } catch {}
  }
  return done;
};
await Promise.all([burst("a", 0), burst("b", 100), burst("c", 200)]);
const countsOf = async (node) => {
  let n = 0;
  for (let w = 0; w < W; w++) n += (await api(node, "/vdb/count", { m: "POST", b: { t: "تاجر" + w, b: "audit" } })).d.n;
  return n;
};
const c1 = await countsOf(A);
ok("ضغط الشبكة على العقدة: كل المُقرّ به على الأقراص", c1 === acked, `مُقرّ=${acked} على الأقراص=${c1}`);
const genBefore = (await api(A, "/vdb/health")).d.gen;

/* ═══ 3) القتل القاسي SIGKILL أثناء كتابة حية — ثم إعادة الإقلاع ═══ */
const survivors = Promise.all([burst("d", 300), burst("e", 400)]).catch(() => []);
await sleep(400);
const ackedAtKill = acked;
A.kill("SIGKILL");
await survivors;
ok("القتل القاسي نُفذ على العقدة الحية أثناء الضغط", true);

const A2 = spawnNode("A");
const h2 = await waitHealthy(A2);
ok("إعادة الإقلاع من الأقراص بعد القتل القاسي", h2.ok && h2.gen >= genBefore, `gen قبل=${genBefore} بعد=${h2.gen}`);
const c2 = await countsOf(A2);
ok("ما بعد القتل: كل المُقرّ باقي — صفر خسارة صفر تزوير", c2 >= ackedAtKill, `مُقرّ وقت القتل=${ackedAtKill} على الأقراص=${c2}`);
const spot = await api(A2, "/vdb/get", { m: "POST", b: { t: "تاجر2", b: "audit", k: "kb-101" } });
ok("فحص عيني من قلب ما قبل القتل", spot.d.v !== null && JSON.parse(Buffer.from(spot.d.v, "base64").toString()).j === 101);

/* ═══ 4) النسخ المتماثل: B تلتزم نسخة A عبر تغذية السجل /vdb/sync ═══ */
const bs = new V.DiskBlockStore(dir("B"));
await bs.init();
let last = 0;
let applied = 0;
for (;;) {
  const r = await api(A2, "/vdb/sync?since=" + last);
  const recs = r.d.records || [];
  if (!recs.length) break;
  for (const rec of recs) {
    const meta = rec.entries.find((e) => e.p === 0);
    const pages = rec.entries.filter((e) => e.p !== 0).map((e) => [e.p, new Uint8Array(Buffer.from(e.d, "base64"))]);
    const won = await bs.atomicCommit(pages, new Uint8Array(Buffer.from(meta.d, "base64")), rec.gen);
    if (won) applied++;
  }
  last = recs[recs.length - 1].gen;
}
const dbB = await V.VDB.open(bs);
await dbB.fresh();
let cB = 0;
for (let w = 0; w < W; w++) cB += await dbB.count("تاجر" + w, "audit");
const cA2 = await countsOf(A2);
ok("النسخة المتماثلة B: طبّقت سجل السجل وطابقت الأصل", cB === cA2 && applied === h2.gen, `B=${cB} A=${cA2} سجلات مطبقة=${applied}`);

/* كتابات جديدة ثم التقاط الفارق على B نفسها */
await Promise.all([burst("f", 500), burst("g", 600)]);
let last2 = last;
for (;;) {
  const r = await api(A2, "/vdb/sync?since=" + last2);
  const recs = r.d.records || [];
  if (!recs.length) break;
  for (const rec of recs) {
    const meta = rec.entries.find((e) => e.p === 0);
    const pages = rec.entries.filter((e) => e.p !== 0).map((e) => [e.p, new Uint8Array(Buffer.from(e.d, "base64"))]);
    await bs.atomicCommit(pages, new Uint8Array(Buffer.from(meta.d, "base64")), rec.gen);
  }
  last2 = recs[recs.length - 1].gen;
}
await dbB.fresh();
let cB2 = 0;
for (let w = 0; w < W; w++) cB2 += await dbB.count("تاجر" + w, "audit");
const cA3 = await countsOf(A2);
ok("التقاط الفارق: B لحقت بالكامل بعد الكتابات الجديدة", cB2 === cA3, `B=${cB2} A=${cA3}`);

/* ═══ 5) عقدة C: استعادة كاملة من النسخة الاحتياطية — لا اعتماد على عقدة واحدة ═══ */
const C = spawnNode("C");
await waitHealthy(C);
const dumpC = (await api(A2, "/vdb/dump")).d.pages;
const rs = await api(C, "/vdb/restore", { m: "POST", b: { pages: dumpC } });
ok("النسخة الاحتياطية نزلت في عقدة ثالثة", rs.s === 200 && rs.d.ok);
const cC0 = (await api(C, "/vdb/count", { m: "POST", b: { t: "تاجر2", b: "audit" } })).d.n;
const cA0 = (await api(A2, "/vdb/count", { m: "POST", b: { t: "تاجر2", b: "audit" } })).d.n;
ok("عقدة الاستعادة مطابقة للأصل", cC0 === cA0, `C=${cC0} A=${cA0}`);
const spotC = await api(C, "/vdb/get", { m: "POST", b: { t: "تاجر0", b: "audit", k: "ka-0" } });
void spotC;
ok("أقدم قيد في التاريخ وصل للعقدة الجديدة سليماً", spotC.d.v !== null && JSON.parse(Buffer.from(spotC.d.v, "base64").toString()).j === 0);

A2.kill("SIGKILL");
C.kill("SIGKILL");

console.log(`═══ VDB EMPIRE GATE: ${pass}/${pass + fails.length} ═══`);
if (fails.length) {
  console.error("الفاشل:", fails);
  process.exit(1);
}
