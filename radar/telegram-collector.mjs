// ——— جامع تيليجرام الرسمي: قراءة القنوات العامة بحسابك عبر MTProto (GramJS) ———
// يعمل من GitHub Actions كل 15 دقيقة، ويغذي /api/ingest بالرمز السري.
// التفعيل (مرة واحدة، مجاني):
//   1) my.telegram.org → API development tools → احفظ api_id و api_hash
//   2) على حاسوبك: node radar/telegram-session.mjs → اتبع الخطوات → انسخ SESSION
//   3) أسرار GitHub: TELEGRAM_API_ID, TELEGRAM_API_HASH, TELEGRAM_SESSION, MIRSAL_TOKEN
//   4) عدّل قناة CHANNELS أدناه (أسماء قنوات العمل الحر الجزائرية العامة)
// ملاحظة: هذا استخدام واجهة تيليجرام الرسمية بحسابك أنت — بلا حسابات مزيفة.
import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";

const API_ID = Number(process.env.TELEGRAM_API_ID);
const API_HASH = process.env.TELEGRAM_API_HASH;
const SESSION = process.env.TELEGRAM_SESSION ?? "";
const MIRSAL_URL = (process.env.MIRSAL_URL ?? "").replace(/\/$/, "");
const MIRSAL_TOKEN = process.env.MIRSAL_TOKEN ?? "";
const CHANNELS = (process.env.TELEGRAM_CHANNELS ?? "").split(",").map((s) => s.trim()).filter(Boolean);

const STOP = new Set(["في","من","على","عن","إلى","الى","هذا","هذه","التي","الذي","مع","أو","او","ثم","قد","هو","هي","نحن","كل","بعد","قبل","عند","حتى","لكن","إن","ان","ما","لا","يوم","اليوم"]);
const PROF_KEYWORDS = [
  "مبرمج","مطور","برمجة","موقع","تطبيق","ووردبريس","متجر الكتروني","فلاتر",
  "شعار","لوقو","لوجو","هوية بصرية","براندنج",
  "مصمم","تصميم","جرافيك","بوستر","فلاير",
  "فيديو اعلاني","اعلان ممول","موشن","مونتير","مونتاج","ريلز","تيك توك",
  "كاتب","كتابة","محتوى","مقالات","سيناريو",
  "مصور","تصوير","فوتوغرافي",
  "ادارة صفحات","سوشيال ميديا","تسويق",
  "ترجمة","مترجم",
  "أحتاج","احتاج","مطلوب","نبحث عن","نبحث","أبحث عن","احتاج مبرمج","محتاج",
];
function norm(s) {
  return (s ?? "").toLowerCase().replace(/[أإآ]/g, "ا").replace(/[ىي]/g, "ي").replace(/ة/g, "ه").replace(/\s+/g, " ").trim();
}
function extractUrl(msg) {
  if (msg.webPreview?.url) return msg.webPreview.url;
  for (const e of msg.entities ?? []) {
    if (e.className === "MessageEntityUrl" || e.className === "MessageEntityTextUrl") {
      return e.url ?? msg.message.slice(e.offset, e.offset + e.length);
    }
  }
  return null;
}
async function main() {
  if (!API_ID || !API_HASH || !SESSION || !MIRSAL_URL || !MIRSAL_TOKEN) {
    console.log("أسرار تيليجرام غير مضبوطة — تخطي الجولة (أضف الأسرار الأربعة لتفعيل الجامع)");
    return;
  }
  if (!CHANNELS.length) { console.log("لا قنوات مضبوطة في TELEGRAM_CHANNELS"); return; }
  const client = new TelegramClient(new StringSession(SESSION), API_ID, API_HASH, { connectionRetries: 2 });
  await client.connect();
  const cutoff = Math.floor(Date.now() / 1000) - 2 * 3600; // آخر ساعتين
  const items = [];
  for (const ch of CHANNELS) {
    try {
      const msgs = await client.getMessages(ch, { limit: 60 });
      for (const m of msgs) {
        const text = m.message ?? "";
        if (!text || text.length < 12) continue;
        if (m.date < cutoff) continue;
        const n = norm(text);
        const hit = PROF_KEYWORDS.find((k) => n.includes(norm(k)));
        if (!hit) continue;
        const url = extractUrl(m) ?? (ch.startsWith("@") ? `https://t.me/${ch.slice(1)}/${m.id}` : `https://t.me/${ch}/${m.id}`);
        items.push({
          title: text.split("\n")[0].slice(0, 150),
          excerpt: text.slice(0, 500),
          author_public: ch,
          platform: "telegram",
          source_url: url,
          keyword: hit,
          published_at: m.date * 1000,
        });
      }
    } catch (e) {
      console.log(`تعذر قراءة ${ch}: ${e?.message ?? e}`);
    }
  }
  // إزالة التكرار داخلياً ثم الإرسال
  const seen = new Set();
  const unique = items.filter((i) => (seen.has(i.source_url) ? false : (seen.add(i.source_url), true)));
  if (!unique.length) { console.log("لا طلبات جديدة في آخر ساعتين"); await client.disconnect(); return; }
  const res = await fetch(`${MIRSAL_URL}/api/ingest`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-ingest-token": MIRSAL_TOKEN },
    body: JSON.stringify({ items: unique.slice(0, 100) }),
  });
  console.log("أُرسل", unique.length, "— رد المنصة:", await res.text());
  await client.disconnect();
}
main().catch((e) => { console.error("خطأ الجامع:", e?.message ?? e); process.exit(1); });
