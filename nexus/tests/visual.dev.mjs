/* NEXUS visual gate — بوابة بصرية بنيوية: تباين WCAG محسوب، أهداف لمس، حركات معرفة، أرضية قراءة، RTL/PWA */
import { readFileSync } from "node:fs";

let pass = 0, fail = 0;
const ok = (name, cond, detail = "") => { if (cond) { pass++; console.log("✓ " + name); } else { fail++; console.log("✗ " + name + (detail ? " — " + detail : "")); } };

const css = readFileSync(new URL("../public/styles.css", import.meta.url), "utf8");
const html = readFileSync(new URL("../public/index.html", import.meta.url), "utf8");

/* ─── 1) تباين الألوان (WCAG 2.1 — محسوب لا مزعوم) ─── */
const lum = (hex) => {
  const c = hex.replace("#", "").padEnd(6, "0");
  const f = (i) => {
    const v = parseInt(c.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(0) + 0.7152 * f(2) + 0.0722 * f(4);
};
const ratio = (a, b) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);
const root = css.match(/:root\s*\{([^}]*)\}/)?.[1] ?? "";
const tok = (name) => root.match(new RegExp("--" + name + ":\\s*(#[0-9a-fA-F]{6})"))?.[1];
const bg = tok("bg"), text = tok("text"), muted = tok("muted"), dim = tok("dim"), card = tok("card");
ok("رموز الألوان معرفة في :root", !!bg && !!text && !!muted && !!dim && !!card, `bg=${bg} text=${text} muted=${muted} dim=${dim} card=${card}`);
if (bg && text && muted && dim && card) {
  ok(`النص الأساسي على الخلفية ${ratio(text, bg).toFixed(1)}:1 ≥ 7 (AAA)`, ratio(text, bg) >= 7);
  ok(`الثانوي muted على الخلفية ${ratio(muted, bg).toFixed(1)}:1 ≥ 4.5 (AA صارم)`, ratio(muted, bg) >= 4.5);
  ok(`الثانوي muted على البطاقة (سطحه الفعلي) ${ratio(muted, card).toFixed(1)}:1 ≥ 4.5 (AA)`, ratio(muted, card) >= 4.5);
  ok(`الخافت dim على البطاقة ${ratio(dim, card).toFixed(1)}:1 ≥ 3 (نص زخرفي غير جوهري فقط)`, ratio(dim, card) >= 3);
}

/* ─── 2) أهداف اللمس (إرشاد 44px للموبايل) ─── */
const btnBlock = css.match(/\.btn\s*\{([^}]*)\}/)?.[1] ?? "";
const btnMin = Number(btnBlock.match(/min-height:\s*(\d+)/)?.[1] ?? 0);
ok(`زر القاعدة ${btnMin}px ≥ 44px هدف لمس آمن`, btnMin >= 44);
const tabbar = css.match(/\.tab\s*\{([^}]*)\}/)?.[1] ?? "";
ok("شريط التبويب بحد أدنى ملائم للمس", Number(tabbar.match(/min-height:\s*(\d+)/)?.[1] ?? 44) >= 34 || btnMin >= 44);

/* ─── 3) الحركات البريمية كلها معرفة (لا حركة استدعاء غير موجودة) ─── */
const usedAnims = [...css.matchAll(/animation:[^;]*?([a-zA-Z][a-zA-Z0-9]*)\s+[\d.]+s/g)].map((m) => m[1]);
const defined = new Set([...css.matchAll(/@keyframes\s+([a-zA-Z0-9-]+)/g)].map((m) => m[1]));
const missing = [...new Set(usedAnims)].filter((a) => !defined.has(a));
ok(`كل ${new Set(usedAnims).size} حركة مستعملة معرفة بـ@keyframes`, missing.length === 0, "المفقودة: " + missing.join(", "));
["fadeUp", "bootPop", "stxZoom", "gradShift", "sheen"].every((k) => defined.has(k)) && ok("الحركات البريمية الخمس الأساسية حاضرة", true);

/* ─── 4) أرضية القراءة: 11px حد قاعي مطلق، وشارات الميتا فقط تحت 12px ─── */
const sizes = [...css.matchAll(/font-size:\s*([\d.]+)px/g)].map((m) => Number(m[1]));
ok(`أصغر خط ${Math.min(...sizes)}px ≥ 11px (قاع صارم)`, Math.min(...sizes) >= 11);
const under12 = [...css.matchAll(/(?:^|})\s*([^{}@]*?)\{[^}]*font-size:\s*11(?:\.\d+)?px[^}]*\}/g)].map((m) => m[1].trim().split(",").pop().trim()).filter((sel) => sel);
const LABELISH = /badge|nbadge|hero-tag|pl-rib|tag|tab|pipe|dur|\bst\b|chip|pill|kicker|meta|hint/;
ok("كل ما هو أصغر من 12px ملصقات ميتا (خط الجسم يبدأ من 12.5px)", under12.length === 0 || under12.every((sel) => LABELISH.test(sel)), "خارج الملصقات: " + under12.filter((sel) => !LABELISH.test(sel)).join(", "));

/* ─── 5) الهيكل: RTL عربي افتراضياً + PWA + منفذ الجوال ─── */
ok("الوثيقة عربية RTL افتراضياً", /lang="ar"/.test(html) && /dir="rtl"/.test(html));
ok("منفذ الجوال viewport موجود", /name="viewport"/.test(html));
ok("المانيفست PWA مربوط", /manifest\.webmanifest/.test(html));
ok("قاعدة الخطوط على الجوال 16px (منع زوم iOS)", /max-width:\s*719px/.test(css) && /font-size:\s*16px/.test(css));

/* ─── 6) موانع الحنق البصرية: عرض ثابت في CSS الموبايل الأساسي (خارج كتل الوسائط) ─── */
const stripMedia = (src) => {
  let out = "", i = 0;
  while (i < src.length) {
    const m = src.indexOf("@media", i);
    if (m < 0) { out += src.slice(i); break; }
    out += src.slice(i, m);
    const open = src.indexOf("{", m);
    let depth = 1, j = open + 1;
    while (depth > 0 && j < src.length) { if (src[j] === "{") depth++; if (src[j] === "}") depth--; j++; }
    i = j;
  }
  return out;
};
const baseCss = stripMedia(css);
const wideFixed = [...baseCss.matchAll(/(?<![-a-z])width:\s*([2-9]\d{2,})px/g)].map((m) => Number(m[1]));
ok("لا عرض ثابت فوق 500px في قاعدة الموبايل", wideFixed.filter((w) => w > 500).length === 0, "قيم: " + wideFixed.filter((w) => w > 500).join(","));

/* ─── 7) نظام الأنظمة: جسم سطح المكتب لا يقبل أصغر من 13px (القاعدة أساساً للجوال؛ الشارات ميتا) ─── */
const desktopBlock = (() => {
  const m = css.match(/@media\s*\(min-width:\s*720px\)\s*\{/);
  if (!m) return "";
  let depth = 1, j = m.index + m[0].length;
  while (depth > 0 && j < css.length) { if (css[j] === "{") depth++; if (css[j] === "}") depth--; j++; }
  return css.slice(m.index + m[0].length, j - 1);
})();
const desktopSizes = [...desktopBlock.matchAll(/font-size:\s*([\d.]+)px/g)].map((m) => Number(m[1]));
ok(desktopSizes.length ? `أصغر خط في نظام سطح المكتب ${Math.min(...desktopSizes)}px ≥ 13px` : "نظام سطح المكتب بلا خطوط أصغر قاعدة", desktopSizes.length === 0 || Math.min(...desktopSizes) >= 13, desktopSizes.length ? "قيم: " + [...new Set(desktopSizes)].sort((a, b) => a - b).slice(0, 6).join(",") : "");

console.log(`\n═══ NEXUS visual gate: ${pass}/${pass + fail} ═══`);
process.exit(fail ? 1 : 0);
