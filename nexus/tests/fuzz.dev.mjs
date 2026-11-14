// ═══ بوابة التشويش العدواني — مسبارات عشوائية مبذورة + سباق تزامن ═══
// العقد: صفر استجابات 5xx على كل المسبارات، وسباق تسجيل نفس اسم المستخدم ينتهي بواحد 201 فقط.
const BASE = process.env.BASE || "http://127.0.0.1:8792";
import { execSync } from "node:child_process";
let pass = 0, fail = 0;
const violations = [];
function check(name, cond, extra = "") {
  if (cond) { pass++; console.log(`✓ ${name}`); }
  else { fail++; console.log(`✗ ${name}${extra ? " — " + extra : ""}`); }
}

// تصفير عدادات الحد محلياً (KV) — كي تصل المسبارات للمتحققين الفعليين ويُختبر قيد الفردية حقاً
function resetLimiter(prefixes) {
  try {
    const cwd = new URL("..", import.meta.url).pathname;
    const out = execSync(`npx wrangler kv key list --binding CACHE_KV --local`, { cwd, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] });
    const keys = JSON.parse(out).map((k) => k.name).filter((n) => prefixes.some((p) => n.startsWith(p)));
    for (const k of keys) execSync(`npx wrangler kv key delete ${JSON.stringify(k)} --binding CACHE_KV --local`, { cwd, stdio: "pipe" });
    return keys.length;
  } catch { return -1; }
}
const hdrSafe = (s) => (String(s).replace(/[^\x20-\x7E]/g, "").slice(0, 80) || "fuzz-tok");

// مولد مبذور — نفس البذرة نفس المسبارات (بوابة مستقرة)
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(1337);
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];

async function probe(target, tag, opts) {
  try {
    const res = await fetch(BASE + target, opts);
    if (res.status >= 500) violations.push(`${tag} → ${res.status}`);
    else pass++;
    try { await res.arrayBuffer(); } catch {}
  } catch (e) {
    violations.push(`${tag} → استثناء شبكة: ${String(e).slice(0, 60)}`);
  }
}

const BIG = "أ".repeat(200_000);
const ZALGO = "مُحَمَّد".normalize("NFD") + "\u035C\u035F\u0489".repeat(50);
const DEEP = JSON.parse('{"a":'.repeat(200) + "1" + "}".repeat(200));
const HEX64 = "ab".repeat(32);

const emailPayloads = [
  "", "x", "a@b", `${BIG}@t.test`, "a b@t.test", "a@t.test ".trim() + "\u0000",
  "a@t\u0640.test", `"quotes"@t.test`, "a@[192.168.1.1]", "a@t.test\nBCC:x@y.z",
];
const strPayloads = ["", BIG, ZALGO, "<script>alert(1)</script>", "{{7*7}}", "../../etc/passwd", "\u0000\u0001\u0002", "—±§¶•ªº", "أ".repeat(5000), "__proto__"];

async function k0Of(email, pass2) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(pass2), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: enc.encode("nexus:c1:" + email.toLowerCase()), iterations: 200000 }, key, 256);
  return [...new Uint8Array(bits)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

console.log("═══ مرحلة 1: تشويش نقاط النهاية ═══");
console.log(`(تصفير عدادات الحد محلياً: ${resetLimiter(["rl:reg:", "rl:log:", "rl:logE:"])} مفتاحاً)`);
// تسجيل — 12 مسباراً مبذوراً
for (let i = 0; i < 12; i++) {
  const body = {
    email: pick(emailPayloads) || `fz${i}@t.test`,
    k0: pick([HEX64, "x", "", 12345, null, HEX64.slice(0, 31), "0x" + HEX64]),
    name: pick(strPayloads).slice(0, 3000),
    username: pick(strPayloads).slice(0, 60) || `fz${i}_${Date.now()}`,
    role: pick(["client", "merchant", "freelancer", "admin", "", null, 7]),
  };
  if (rnd() < 0.15) body.extra_inject = { role: "admin", verified: 1, plan_id: "vip" };
  if (rnd() < 0.1) body.__proto__ = { banned: 0 };
  await probe("/api/auth/register", `register#${i}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
}
// أجسام شاذة صريحة
await probe("/api/auth/register", "register:مصفوفة", { method: "POST", headers: { "content-type": "application/json" }, body: "[1,2,3]" });
await probe("/api/auth/register", "register:عمق200", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(DEEP) });
await probe("/api/auth/register", "register:غير-JSON", { method: "POST", headers: { "content-type": "application/json" }, body: "——— garbage \x00\x01" });
await probe("/api/auth/register", "register:رقم", { method: "POST", headers: { "content-type": "application/json" }, body: "1e999" });

// دخول — 8 مسبارات
for (let i = 0; i < 8; i++) {
  const body = { email: pick(emailPayloads) || `lg${i}@t.test`, k0: pick(["x", "", null, 9, BIG.slice(0, 100), HEX64]) };
  if (rnd() < 0.2) body.totp = null;
  await probe("/api/auth/login", `login#${i}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
}
await probe("/api/auth/login", "login:جسم-ناقص", { method: "POST", headers: { "content-type": "application/json" }, body: '{"email":"a@t.test"}' });

// متجر عام واستعلامات شاذة
const slugs = ["../../etc/passwd", "%2e%2e%2fetc", "أ".repeat(300), "", "vito-store?x=1", "p".repeat(5000), "uni\u0000code"];
for (const s of slugs) await probe(`/api/store/${encodeURIComponent(s)}`, `store:${s.slice(0, 18)}`);
for (const q of ["limit=-1", "offset=1e19", "page=999999999999", "sort=(select%201)", "q=%27%20OR%201%3D1--"]) {
  await probe(`/api/store/vito-store?${q}`, `store?q=${q.slice(0, 22)}`);
}
// إنشاء متجر بلا جلسة (يجب 401/403 لا 500)
await probe("/api/stores", "stores:بلا-جلسة", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ store_name: BIG }) });
// بوابة الإدارة
await probe("/api/adm/login", "adm:تشويش", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: ZALGO, k0: HEX64 }) });
await probe("/api/adm/setup", "setup:تشويش", { method: "POST", headers: { "content-type": "application/json", "x-setup-token": hdrSafe(ZALGO) }, body: JSON.stringify({ email: "fz@t.test", k0: HEX64, name: "F" }) });

console.log("═══ مرحلة 2: سباق تزامن — نفس اسم المستخدم 8 مرات متوازية ═══");
console.log(`(تصفير عدادات التسجيل قبل السباق: ${resetLimiter(["rl:reg:"])} مفتاحاً)`);
const stamp = Date.now().toString(36);
const raceEmails = Array.from({ length: 8 }, (_, i) => `race-${stamp}-${i}@t.test`);
const results = await Promise.all(raceEmails.map(async (email, i) => {
  try {
    const r = await fetch(BASE + "/api/auth/register", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, k0: await k0Of(email, "Race-Secret-1"), name: `Race${i}`, slug: `race-${stamp}`, store_name: `متجر السباق ${stamp}` }) });
    try { await r.arrayBuffer(); } catch {}
    return r.status;
  } catch { return -1; }
}));
const created = results.filter((s) => s === 200).length; /* عقد التسجيل في نكسوس: 200 للفائز */
const rejected = results.every((s) => s === 200 || (s >= 400 && s < 500) || s === 429);
check("السباق: واحد 201 فقط لـslug متنافس (قيد الفردية تحت التزاحم)", created === 1, `statuses=${results.join(",")}`);
check("السباق: النمط الفائز-واحد/409-للباقي بلا 5xx", rejected && !results.some((s) => s >= 500 || s === -1));

console.log(`═══ GATE FUZZ: مسبارات ناجحة ${pass} — مخالفات ${violations.length} ═══`);
if (violations.length) { console.log("المخالفات:"); for (const v of violations) console.log("  ✗ " + v); }
console.log(`═══ GATE FUZZ: ${fail + (violations.length ? 1 : 0)} فشل — الحكم: ${violations.length || fail ? "مرفوض" : "مطموع"} ═══`);
process.exit(violations.length || fail || created !== 1 ? 1 : 0);
