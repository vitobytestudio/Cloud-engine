// ——— فحص المتصفح الحقيقي: AIHub من أول بكسل ———
import chromium from "@sparticuz/chromium";
import { chromium as pw } from "playwright-core";
import { createServer } from "http";
import { readFile } from "fs/promises";
import { extname, join } from "path";

const PUB = new URL("./public", import.meta.url).pathname;
const MIME = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml", ".png": "image/png" };
// خادم ثابت صغير يخدم public (الـAPI محذوف — فحص واجهة الهبوط فقط)
const srv = createServer(async (req, res) => {
  let p = req.url.split("?")[0];
  if (p === "/") p = "/index.html";
  try {
    const data = await readFile(join(PUB, p));
    res.writeHead(200, { "content-type": MIME[extname(p)] ?? "application/octet-stream" });
    res.end(data);
  } catch { res.writeHead(404); res.end("nf"); }
});
await new Promise((r) => srv.listen(8791, r));

const results = [];
const check = (n, ok, extra = "") => { results.push(ok); console.log(`${ok ? "✅" : "❌"} ${n}${extra ? " — " + extra : ""}`); };

const exe = await chromium.executablePath();
const browser = await pw.launch({
  executablePath: exe,
  args: [...chromium.args, "--single-process"],
  headless: true,
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => { if (m.type() === "error" && !m.text().includes("favicon") && !m.text().includes("Failed to load resource")) errors.push(m.text()); });

await page.goto("http://127.0.0.1:8791/", { waitUntil: "networkidle" });
await page.waitForTimeout(700);
// الافتتاحية السينمائية: شعارات + رائدات + تخطّي
check("الافتتاحية: تُعرض أول زيارة", await page.evaluate(() => !!document.querySelector(".nx-intro")));
check("الافتتاحية: 24 شعاراً في صفّي الماركي", await page.evaluate(() => document.querySelectorAll(".nx-logo").length === 24));
check("الافتتاحية: 6 بطاقات رائدات (Astra/Fable/Argon…)", await page.evaluate(() => [...document.querySelectorAll(".nx-card-name")].some((x) => x.textContent.includes("GPT-6 Astra")) && [...document.querySelectorAll(".nx-card-name")].some((x) => x.textContent.includes("Fable"))));
await page.evaluate(() => document.querySelector(".nx-skip").click());
await page.waitForTimeout(900);
check("الافتتاحية: التخطّي يكشف الهبوط", await page.evaluate(() => !document.querySelector(".nx-intro")));
await page.waitForTimeout(900);

check("العنوان الصحيح", (await page.title()).includes("Nexus"));
check("RTL عربي افتراضي", await page.evaluate(() => document.documentElement.dir) === "rtl");
check("البطل مرئي", await page.isVisible(".hero h1"));
const heroText = await page.textContent(".hero h1");
check("نص البطل العربي", heroText.includes("منصة واحدة."), heroText.trim().slice(0, 40));

// الأنيميشن: fade-up لها transition/animation فعلي
const anim = await page.evaluate(() => {
  const el = document.querySelector(".fade-up");
  const cs = getComputedStyle(el);
  return { anim: cs.animationName, dur: parseFloat(cs.animationDuration) };
});
check("أنيميشن fade-up يعمل", anim.anim !== "none" && anim.dur > 0, `${anim.anim} ${anim.dur}s`);

// البينتو والحلقات والباقات
check("بينتو 6 بطاقات", await page.locator(".b-card").count() === 6);
check("حلقات 3", await page.locator(".ring-card").count() === 3);
check("باقات 3", await page.locator(".plan-card").count() === 3);
check("الخزنة (featured) مميزة بصرياً", await page.evaluate(() => {
  const f = document.querySelector(".plan-card.featured");
  return f && getComputedStyle(f).boxShadow !== "none";
}));
// الشريط المتحرك
const marq = await page.evaluate(() => {
  const t = document.querySelector(".marquee-track");
  const cs = getComputedStyle(t);
  return { name: cs.animationName, w: t.scrollWidth };
});
check("شريط النماذج يتحرك", marq.name.includes("marq") && marq.w > 1000, `${marq.name} ${marq.w}px`);

// لقطة الهبوط
await page.screenshot({ path: "shots/landing-top.png" });
await page.evaluate(() => document.querySelector("#pricing")?.scrollIntoView());
await page.waitForTimeout(500);
await page.screenshot({ path: "shots/landing-pricing.png" });

// التنقل إلى التسجيل
await page.evaluate(() => { location.hash = "#auth-register"; });
await page.waitForTimeout(500);
check("صفحة التسجيل تفتح", await page.isVisible("#a-email"));
await page.screenshot({ path: "shots/auth.png" });

// EN: تبديل اللغة
await page.evaluate(() => { localStorage.setItem("ah_lang", "en"); location.hash = "#/"; location.reload(); });
await page.waitForTimeout(900);
check("EN: LTR", await page.evaluate(() => document.documentElement.dir) === "ltr");
check("EN: بطل إنجليزي", (await page.textContent(".hero h1")).includes("One platform"));
await page.screenshot({ path: "shots/landing-en.png" });

// FR
await page.evaluate(() => { localStorage.setItem("ah_lang", "fr"); location.reload(); });
await page.waitForTimeout(900);
check("FR: بطل فرنسي", (await page.textContent(".hero h1")).includes("Une plateforme"));

// موبايل
const mob = await browser.newPage({ viewport: { width: 390, height: 844 } });
await mob.goto("http://127.0.0.1:8791/", { waitUntil: "networkidle" });
await mob.waitForTimeout(700);
const noHScroll = await mob.evaluate(() => document.documentElement.scrollWidth <= 391);
check("موبايل: لا تمرير أفقي", noHScroll);
await mob.screenshot({ path: "shots/mobile.png" });

const realErrors = errors.filter((e) => !e.includes("net::") && !e.includes("fonts.g"));
check("لا أخطاء JS في الكونسول", realErrors.length === 0, realErrors.slice(0, 2).join(" | ").slice(0, 120));

await browser.close();
srv.close();
const fails = results.filter((r) => !r).length;
console.log(`\n═══ المتصفح الحقيقي: ${results.length - fails}/${results.length} ═══`);
process.exit(fails ? 1 : 0);
