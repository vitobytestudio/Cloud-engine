// ——— الرادار الحقيقي: بحث فوري عبر القنوات العامة الرسمية ———
// المصادر: Google News RSS (تغذية رسمية عامة) + Reddit JSON (واجهة رسمية عامة)
// كل نتيجة تحمل رابط المصدر الأصلي إلزامياً — الجديد فقط (<72 ساعة) — بلا واجهات خاصة ولا حسابات مزيفة.
import { PROFESSIONS } from "./matching";
import { randomId } from "./crypto";

export interface RadarHit {
  title: string;
  source_url: string;
  author_public: string;
  platform: string;
  keyword: string;
  published_at: number;
  excerpt: string;
}

// ——— 1) التوسيع المؤتمت لصياغات البحث (عربي/فرنسي/إنجليزي) — قواعد حتمية ———
const VERBS_AR = ["أحتاج", "مطلوب", "نبحث عن", "أبحث عن", "من يقدم"];
const SERVICE_AR: Record<string, string> = {
  dev_web: "مبرمج",
  logo_brand: "مصمم شعار",
  graphic: "مصمم جرافيك",
  video_ads: "مصمم فيديو اعلاني",
  montage: "مونتير فيديو",
  content: "كاتب محتوى",
  photo: "مصور",
  smm: "مدير صفحات",
  translation: "مترجم",
};
const SERVICE_FR: Record<string, string> = {
  dev_web: "développeur web",
  logo_brand: "logo designer",
  graphic: "graphiste",
  video_ads: "video maker",
  montage: "monteur video",
  content: "redacteur",
  photo: "photographe",
  smm: "community manager",
  translation: "traducteur",
};
const GENERIC_QUERIES = [
  "فريلانسر الجزائر مطلوب",
  "freelance algerie demande",
  "recherche freelance algerie",
  "أحتاج مبرمج الجزائر",
  "أحتاج مصمم الجزائر",
  "مطلوب مبرمج",
];

export function buildQueries(professionIds: string[]): string[] {
  const qs: string[] = [];
  const ids = professionIds.length ? professionIds : PROFESSIONS.map((p) => p.id);
  for (const id of ids.slice(0, 4)) {
    const ar = SERVICE_AR[id];
    const fr = SERVICE_FR[id];
    if (ar) VERBS_AR.forEach((v) => qs.push(`${v} ${ar}`));
    if (fr) qs.push(`recherche ${fr} algerie`);
  }
  return [...new Set([...qs, ...GENERIC_QUERIES])].slice(0, 14);
}

// ——— 2) مصدر Google News RSS ———
function parseRSS(xml: string, limit: number): RadarHit[] {
  const out: RadarHit[] = [];
  const items = xml.match(/<item>[\s\S]*?<\/item>/g) ?? [];
  for (const it of items.slice(0, limit)) {
    const title = (it.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/)?.[1] ?? "").trim();
    const link = (it.match(/<link>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/)?.[1] ?? "").trim();
    const pub = it.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1]?.trim() ?? "";
    const srcName = it.match(/<source[^>]*>([\s\S]*?)<\/source>/)?.[1]?.trim() ?? "مصدر إخباري";
    if (!title || !link) continue;
    const ts = pub ? new Date(pub).getTime() : Date.now();
    out.push({ title, source_url: link, author_public: srcName, platform: "news", keyword: "", published_at: ts, excerpt: "" });
  }
  return out;
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), ms);
    p.then(
      (v) => { clearTimeout(timer); resolve(v); },
      (e) => { clearTimeout(timer); reject(e); }
    );
    void ctl;
  });
}

async function fetchGoogleNews(q: string): Promise<RadarHit[]> {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(q + " الجزائر")}&hl=ar&gl=DZ&ceid=DZ:ar`;
  const res = await withTimeout(fetch(url, { headers: { "user-agent": "mirsal-radar/1.0" } }), 9000);
  if (!res.ok) throw new Error(`news ${res.status}`);
  return parseRSS(await res.text(), 12);
}

// ——— 3) مصدر Reddit (JSON رسمي عام) ———
const REDDIT_SUBS = ["algeria", "AlgeriaFreelance", "dzdev"];
async function fetchReddit(q: string): Promise<RadarHit[]> {
  const out: RadarHit[] = [];
  const res = await withTimeout(
    fetch(`https://www.reddit.com/search.json?q=${encodeURIComponent(q)}&sort=new&t=week&limit=25`, {
      headers: { "user-agent": "mirsal-radar/1.0 (platform contact: admin@mirsal.dz)" },
    }),
    9000
  );
  if (!res.ok) throw new Error(`reddit ${res.status}`);
  const data = (await res.json()) as { data?: { children?: { data: Record<string, unknown> }[] } };
  for (const child of data.data?.children ?? []) {
    const d = child.data;
    const title = String(d.title ?? "");
    const perm = String(d.permalink ?? "");
    if (!title || !perm) continue;
    out.push({
      title,
      source_url: `https://www.reddit.com${perm}`,
      author_public: `r/${String(d.subreddit ?? "reddit")}`,
      platform: "reddit",
      keyword: "",
      published_at: Number(d.created_utc ?? 0) * 1000,
      excerpt: String(d.selftext ?? "").slice(0, 400),
    });
  }
  return out;
}

// ——— 4) التصنيف: أي طلب يخص تخصصاً معروفاً؟ (حتمي) ———
function normalizeAr(s: string): string {
  return s
    .toLowerCase()
    .replace(/[أإآ]/g, "ا")
    .replace(/[ىي]/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[ًٌٍَُِّْ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
export function classify(hit: RadarHit): { professionId: string; keyword: string } | null {
  const hay = normalizeAr(`${hit.title} ${hit.excerpt}`);
  for (const p of PROFESSIONS) {
    for (const kw of p.keywords) {
      if (hay.includes(normalizeAr(kw))) return { professionId: p.id, keyword: kw };
    }
  }
  return null;
}

// ——— 5) المسح الفوري: يجلب بالتوازي، يصنف، يستبعد القديم والمكرر ———
export async function scan(professionIds: string[]): Promise<{ fetched: number; kept: RadarHit[]; errors: string[] }> {
  const queries = buildQueries(professionIds);
  const errors: string[] = [];
  const newsJobs = queries.slice(0, 8).map((q) =>
    fetchGoogleNews(q).catch((e) => { errors.push(`news:${e?.message ?? "؟"}`.slice(0, 80)); return [] as RadarHit[]; })
  );
  const redditJobs = [
    fetchReddit("algeria freelance OR فريلانسر OR مطلوب"),
    fetchReddit("algeria \"looking for\" developer OR designer"),
  ].map((p) => p.catch((e) => { errors.push(`reddit:${e?.message ?? "؟"}`.slice(0, 80)); return [] as RadarHit[]; }));

  const all = await Promise.all([...newsJobs, ...redditJobs]);
  const cutoff = Date.now() - 72 * 3600_000;
  const seen = new Set<string>();
  const kept: RadarHit[] = [];
  for (const batch of all) {
    for (const hit of batch) {
      if (hit.published_at < cutoff) continue;
      if (!classify(hit)) continue;
      const key = hit.source_url;
      if (seen.has(key)) continue;
      seen.add(key);
      kept.push(hit);
    }
  }
  return { fetched: all.reduce((a, b) => a + b.length, 0), kept, errors: errors.slice(0, 6) };
}

export { randomId };
