// ——— الرحلة الكاملة على wrangler: تسجيل → استوديو → دردشة فورية → خزنة مشفرة → إعادة فتح ———
import chromium from "@sparticuz/chromium";
import { chromium as pw } from "playwright-core";

const BASE = "http://127.0.0.1:8789";
const EMAIL = `vito-${Date.now().toString(36)}@aihub.test`;
const VPASS = "vault-pass-A1";
const XSS = '<img src=x onerror="window.__xss=1">';
const results = [];
const check = (n, ok, extra = "") => { results.push(ok); console.log(`${ok ? "✅" : "❌"} ${n}${extra ? " — " + extra : ""}`); };

const browser = await pw.launch({ executablePath: await chromium.executablePath(), args: [...chromium.args, "--single-process"], headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));

await page.goto(BASE + "/", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(600);

// 1) التسجيل من الواجهة
await page.evaluate((em) => { location.hash = "#auth-register"; }, EMAIL);
await page.waitForTimeout(400);
await page.evaluate(({ em, xss }) => {
  document.querySelector("#a-email").value = em;
  document.querySelector("#a-name").value = xss;
  document.querySelector("#a-pass").value = "StrongPass9";
  document.querySelector("#a-go").click();
}, { em: EMAIL, xss: XSS });
await page.waitForFunction(() => location.hash === "#/app", null, { timeout: 8000 });
check("التسجيل من الواجهة يدخل الاستوديو", true, EMAIL);

// 2) الاستوديو: الهيكل
await page.waitForTimeout(700);
check("سايدبار + مرسال + مختار نموذج", await page.evaluate(() => !!document.querySelector(".app-shell") && !!document.querySelector("#prompt") && !!document.querySelector("#model-pick")));
check("⚠ XSS: الحقن في الاسم لم يُنفَّذ", await page.evaluate(() => window.__xss === undefined));
check("⚠ XSS: لا عنصر img محقون في الواجهة", await page.evaluate(() => document.querySelector(".side-foot img") === null && document.querySelector(".msg-ava img") === null));
await page.screenshot({ path: "shots/app.png" });

// 3) دردشة فورية (بلا مفتاح): محلياً ai_unavailable يعرض برسالة لطيفة
await page.evaluate(() => {
  const ta = document.querySelector("#prompt");
  ta.value = "مرحبا، من أنت؟";
  ta.dispatchEvent(new Event("input", { bubbles: true }));
  document.querySelector("#send").click();
});
await page.waitForFunction(() => {
  const msgs = document.querySelectorAll(".msg-ai .txt");
  const last = msgs[msgs.length - 1];
  return last && last.textContent.length > 0 && !last.querySelector(".typing");
}, null, { timeout: 15000 });
const botText = await page.evaluate(() => {
  const msgs = document.querySelectorAll(".msg-ai .txt");
  return msgs[msgs.length - 1].textContent;
});
check("دورة دردشة كاملة (رسالة → رد/رسالة لطيفة)", botText.length > 3, botText.slice(0, 50));
await page.screenshot({ path: "shots/chat.png" });

// 4) الخزنة: فتح أول مرة بكلمة سر + حفظ مفتاح
await page.evaluate(() => document.querySelector("#nav-vault").click());
await page.waitForTimeout(300);
await page.evaluate((vp) => {
  document.querySelector("#vp").value = vp;
  document.querySelector("#vp-go").click();
}, VPASS);
await page.waitForTimeout(1200); // فتح + إعادة رسم + (الخزنة فارغة تُفتح مجدداً؟ لا — تُغلق)
check("الخزنة تُفتح من الواجهة", await page.evaluate(() => document.getElementById("overlay-root").innerHTML === ""));

// أضف مفتاحاً
await page.evaluate(() => document.querySelector("#nav-vault").click());
await page.waitForTimeout(300);
await page.evaluate(() => {
  document.querySelector("#nk-prov").value = "openai";
  document.querySelector("#nk-label").value = "work";
  document.querySelector("#nk-key").value = "sk-test-SECRET-1234567890";
  document.querySelector("#nk-go").click();
});
await page.waitForTimeout(1200);
check("المفتاح ظاهر في القائمة بالتسمية", await page.evaluate(() => document.querySelector("#key-list")?.textContent.includes("work") ?? false));

// 5) الدليل القاطع: المخزن على الخادم لا يحوي المفتاح الصريح
const serverBlob = await page.evaluate(async () => {
  const r = await fetch("/api/vault", { headers: { "content-type": "application/json" } });
  return (await r.json()).blob ?? "";
});
check("⚠ لا تسريب: نص المفتاح غير موجود في مخزن الخادم", serverBlob && !serverBlob.includes("sk-test-SECRET"));
check("الـblob مشفر فعلاً (base64)", serverBlob.includes("\"ct\""), serverBlob.slice(0, 40) + "…");

// 6) إعادة التحميل: الجلسة تبقى، الخزنة مقفلة، وتُفتح بنفس الكلمة
await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForTimeout(800);
check("الجلسة صامدة بعد التحديث", await page.evaluate(() => location.hash.startsWith("#/app")));
check("الخزنة مقفلة بعد التحديث (الذاكرة فقط)", await page.evaluate(() => document.querySelector("#nav-vault")?.textContent.includes("افتح") ?? false));
await page.evaluate(() => document.querySelector("#nav-vault").click());
await page.waitForTimeout(300);
await page.evaluate((vp) => { document.querySelector("#vp").value = vp; document.querySelector("#vp-go").click(); }, VPASS);
await page.waitForTimeout(1200);
await page.evaluate(() => document.querySelector("#nav-vault").click());
await page.waitForTimeout(300);
check("إعادة الفتح بنفس الكلمة تعيد المفاتيح", await page.evaluate(() => document.querySelector("#key-list")?.textContent.includes("work") ?? false));

// كلمة خاطئة ترفض (بعد قفل جديد عبر تحميل)
await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForTimeout(800);
await page.evaluate(() => document.querySelector("#nav-vault").click());
await page.waitForTimeout(300);
await page.evaluate(() => { document.querySelector("#vp").value = "WRONG-pass"; document.querySelector("#vp-go").click(); });
await page.waitForTimeout(900);
check("كلمة خزنة خاطئة تُرفض في الواجهة", await page.evaluate(() => document.querySelector("#vp")?.placeholder.includes("غير صحيحة") ?? false));

// 7) الموصلات: بطاقات النقرة الواحدة
await page.evaluate(() => { location.hash = "#/app/connectors"; });
await page.waitForTimeout(600);
check("الموصلات: 8 بطاقات بثلاثة أقسام", await page.evaluate(() => document.querySelectorAll(".conn-card").length === 8));
check("الموصلات: الفوري موصول افتراضياً (بلا مفتاح)", await page.evaluate(() => document.querySelector(".conn-card .conn-status")?.textContent.includes("مُوصَّل") ?? false));
// وصّل Groq — افتح الخزنة أولاً إن كانت مقفلة (سلوك آمن: اللصق يتطلب خزنة حية)
await page.evaluate(() => document.querySelector("#nav-vault").click());
await page.waitForTimeout(300);
const vaultLocked = await page.evaluate(() => !!document.querySelector("#vp"));
if (vaultLocked) {
  await page.evaluate((vp) => { document.querySelector("#vp").value = vp; document.querySelector("#vp-go").click(); }, VPASS);
  await page.waitForTimeout(1200);
} else {
  await page.evaluate(() => document.querySelector("#sh-close").click());
}
await page.evaluate(() => { location.hash = "#/app/connectors"; });
await page.waitForTimeout(500);
await page.evaluate(() => document.querySelector('button[data-connect="groq"]')?.click());
await page.waitForTimeout(300);
await page.evaluate(() => {
  const form = document.querySelector("#cf-groq");
  if (form && !form.hidden) {
    form.querySelector("[data-keyinput]").value = "gsk_FAKEKEYFORTEST1234567890";
    form.querySelector("button[data-save]").click();
  }
});
await page.waitForTimeout(1200);
check("الموصلات: Groq أصبح مُوصَّلاً بعد اللصق", await page.evaluate(() => [...document.querySelectorAll(".conn-card")].some((c) => c.textContent.includes("Groq") && c.querySelector(".conn-status.ok"))));
await page.evaluate(() => document.querySelector(".conn-wrap")?.scrollIntoView());
await page.waitForTimeout(300);
await page.screenshot({ path: "shots/connectors.png" });

// 8) مبدّل الدردشة/الصورة للفوري
await page.evaluate(() => { location.hash = "#/app"; });
await page.waitForTimeout(600);
check("رقائق الوضع ظاهرة للفوري", await page.evaluate(() => !document.querySelector("#mode-chips").hidden));
await page.evaluate(() => document.querySelector('button[data-m="image"]').click());
await page.waitForTimeout(200);
check("وضع الصورة يبدّل التلميح", await page.evaluate(() => document.querySelector("#prompt").placeholder.length > 10));
await page.evaluate(() => {
  const ta = document.querySelector("#prompt");
  ta.value = "غروب فوق الصحراء";
  ta.dispatchEvent(new Event("input", { bubbles: true }));
  document.querySelector("#send").click();
});
await page.waitForFunction(() => {
  const msgs = document.querySelectorAll(".msg-ai .txt");
  const last = msgs[msgs.length - 1];
  return last && !last.querySelector(".typing") && last.textContent.length > 0;
}, null, { timeout: 15000 });
check("دورة الصورة كاملة (محلياً برسالة لطيفة)", true);
await page.screenshot({ path: "shots/image-mode.png" });

const realErrors = errors.filter((e) => !e.includes("fonts.g") && !e.includes("net::"));
check("لا أخطاء JS في الكونسول", realErrors.length === 0, realErrors.slice(0, 2).join("|").slice(0, 100));
await page.screenshot({ path: "shots/app-final.png" });

await browser.close();
const fails = results.filter((r) => !r).length;
console.log(`\n═══ الرحلة الكاملة: ${results.length - fails}/${results.length} ═══`);
process.exit(fails ? 1 : 0);
