// ═══ بوابة نافذة الإعداد المؤقتة — فحص زمني ذاتي الإدارة (منفذ 8797 خاص) ═══
// تُثبت: الفتح المؤقت يخدم الصفحة ويسمح بالبوابة، التوكن موازٍ يعمل، الخاطئ يموت،
// والانقضاء الزمني يغلق كل شيء — بلا أي أثر على قاعدة الخادم الرئيسي (لا مالك يُنشأ هنا).
import { spawn, execSync } from "node:child_process";

const PORT = 8797;
const BASE = `http://127.0.0.1:${PORT}`;
let pass = 0, fail = 0;
function check(name, cond, extra = "") {
  if (cond) { pass++; console.log(`✓ ${name}`); }
  else { fail++; console.log(`✗ ${name}${extra ? " — " + extra : ""}`); }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const CWD = new URL("..", import.meta.url).pathname;

// تحصين الزومبي: إن كان المنفذ يعيش قبل إقلاعنا فالنتائج كاذبة — نموت بصوت عالٍ بدل أن نفحص خادماً غريباً
if (await fetch(`${BASE}/api/health`).then((r) => r.ok).catch(() => false)) {
  console.error(`✗ منفذ ${PORT} مشغول بخادم زومبي — أوقفه وأعد البوابة (الفحص على خادم غريب كذب لا يقبل)`);
  process.exit(2);
}

// تصفير الإدارة المحلية بصوت عالٍ — كي تختبر النافذة فعلاً (الهارنس قبله قد يترك setup_done=1 يقتل كل المسارات قانونياً)
execSync(`npx wrangler d1 execute DB --local -y --command "DELETE FROM admin_meta; DELETE FROM admin_devices; DELETE FROM admins"`, { cwd: CWD, stdio: ["pipe", "pipe", "inherit"] });
console.log("(تصفير الإدارة المحلية تم — النافذة ستُختبر على حالة نظيفة)");

const END = Date.now() + 90_000; // نافذة 90 ثانية — لبيئة CI الباردة (الانقضاء يُحسب ديناميكياً لا ثابتاً)
const child = spawn("npx", ["wrangler", "dev", "--port", String(PORT), "--local",
  "--var", "ADMIN_SETUP_TOKEN:win-tok",
  "--var", `ADMIN_SETUP_WINDOW_END:${END}`],
  { cwd: CWD, stdio: "pipe" });

try {
  // انتظار إقلاع الخادم — حتى 60 ثانية لبيئة CI
  let up = false;
  for (let i = 0; i < 120 && !up; i++) {
    await sleep(500);
    up = await fetch(`${BASE}/api/health`).then((r) => r.ok).catch(() => false);
  }
  check("خادم النافذة أقلع", up);
  if (!up) throw new Error("no server");

  // 1) الفتح: الصفحة العارية تُخدم أثناء النافذة
  const bare = await fetch(`${BASE}/setup`);
  const setupHtml = await bare.text();
  check("أثناء النافذة: /setup العارية 200 وتخدم نموذج الإعداد", bare.status === 200 && setupHtml.includes("إعداد لوحة الإدارة"));
  const sm = /<script>([\s\S]*?)<\/script>/.exec(setupHtml);
  let parses = false, parseErr = "";
  try { new Function(sm?.[1] ?? ""); parses = true; } catch (e) { parseErr = String(e).slice(0, 80); }
  check("سكربت صفحة الإعداد يُحلل بلا أخطاء (علة الزر الميت — تُمسح هنا للأبد)", parses, parseErr);

  // 2) التوكن الصحيح موازٍ ويعمل أثناء النافذة
  check("أثناء النافذة: /setup/<توكن صحيح> 200", (await fetch(`${BASE}/setup/win-tok`)).status === 200);

  // 3) التوكن الخاطئ يموت حتى أثناء النافذة
  check("أثناء النافذة: /setup/<توكن خاطئ> 404", (await fetch(`${BASE}/setup/wrong-000`)).status === 404);

  // 4) بوابة الإعداد تقبل ترويسة فارغة أثناء النافذة (الصفحة العارية) — تالفة الجسم 400 لا 404
  const api = await fetch(`${BASE}/api/adm/setup`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: "bad", k0: "x", name: "X" }) });
  check("أثناء النافذة: بوابة الإعداد بلا ترويسة تمر للتحقق (400 تالفة لا 404)", api.status === 400, `status=${api.status}`);

  // 5) الانقضاء: بعد نهاية النافذة كل شيء يموت (الانتظار من لحظة الإقلاع لا ثابتاً)
  await sleep(Math.max(1500, END - Date.now() + 1500));
  check("بعد الانقضاء: /setup العارية 404", (await fetch(`${BASE}/setup`)).status === 404);
  const api2 = await fetch(`${BASE}/api/adm/setup`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: "bad", k0: "x", name: "X" }) });
  check("بعد الانقضاء: بوابة الإعداد 404", api2.status === 404, `status=${api2.status}`);
} finally {
  child.kill("SIGTERM");
  await sleep(800);
  try { child.kill("SIGKILL"); } catch {}
}

console.log(`═══ GATE WINDOW: ${pass}/${pass + fail} ═══`);
process.exit(fail ? 1 : 0);
