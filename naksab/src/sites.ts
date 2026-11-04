// ——— NAKSAB Sites: موقع إلكتروني شخصي لكل مستقل — 3 قوالب حسب الباقة ———
// Aurora (FREE) نظيف هادئ · Pulse (PRO) حركة واحترافية · Prime (VIP) سينمائي بعدّادات وفيديو بطولي
// عام بلا جلسة؛ جلب البيانات من D1 فقط؛ نموذج «دخول الزبائن» يولّد عميلاً محتملاً داخلياً.
import type { Env } from "./env";
import { clip, esc } from "./lib";

export const PLAN_TEMPLATES: Record<string, string[]> = { free: ["aurora"], pro: ["aurora", "pulse"], vip: ["aurora", "pulse", "prime"] };
export const templateAllowed = (plan: string, tpl: string): boolean => (PLAN_TEMPLATES[plan] ?? PLAN_TEMPLATES.free).includes(tpl);

const L = {
  ar: { avail: "متاح للعمل", busy: "مشغول حالياً", services: "الخدمات", works: "الأعمال", reviews: "آراء العملاء", projects: "مشروع منجز", rep: "التقييم", lead_h: "اطلب خدمتك الآن", lead_p: "اترك طلبك وسأتواصل معك مباشرة.", name: "الاسم", contact: "بريد أو هاتف للتواصل", msg: "صف ما تحتاجه بسطر أو سطرين", send: "أرسل الطلب", sent: "تم الاستلام — سأتواصل معك قريباً.", err: "تحقق من الحقول وحاول مجدداً.", from: "يبدأ من", d: "يوم تسليم", by: "بواسطة", site_by: "موقع احترافي من", no_reviews: "كن أول عميل يقيّم.", verified: "موثّق", contact_h: "تواصل مباشر", ads: "إعلانات وفيديوهات" },
  en: { avail: "Available for work", busy: "Currently busy", services: "Services", works: "Portfolio", reviews: "Client reviews", projects: "projects done", rep: "rating", lead_h: "Request a service", lead_p: "Leave your request and I'll get back to you directly.", name: "Name", contact: "Email or phone", msg: "Describe what you need in a line or two", send: "Send request", sent: "Received — I'll get back to you soon.", err: "Check the fields and try again.", from: "from", d: "day delivery", by: "by", site_by: "Professional site by", no_reviews: "Be the first to review.", verified: "Verified", contact_h: "Direct contact", ads: "Ads & videos" },
} as const;

function embed(url: string): string {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([\w-]{6,})/);
  const vm = url.match(/vimeo\.com\/(\d+)/);
  if (yt) return `<div class="vid"><iframe src="https://www.youtube-nocookie.com/embed/${yt[1]}" loading="lazy" allowfullscreen title="video"></iframe></div>`;
  if (vm) return `<div class="vid"><iframe src="https://player.vimeo.com/video/${vm[1]}" loading="lazy" allowfullscreen title="video"></iframe></div>`;
  if (/^https:\/\//.test(url)) return `<div class="vid"><video src="${esc(url)}" controls preload="none" playsinline></video></div>`;
  return "";
}

const stars = (r: number) => "★".repeat(Math.round(Number(r) || 0)) + "☆".repeat(5 - Math.round(Number(r) || 0));

function css(tpl: string, dir: "rtl" | "ltr"): string {
  const anim = tpl !== "aurora";
  return `:root{--bg:#05060a;--card:#0c0e17;--line:rgba(255,255,255,.08);--fg:#f3f5f9;--dim:#9aa3b8;--b1:#7c6cff;--b2:#00d4ff;--gold:#fbbf24;--ok:#34d399}
*{margin:0;padding:0;box-sizing:border-box}
body{background:var(--bg);color:var(--fg);font-family:${dir === "rtl" ? '"IBM Plex Sans Arabic","Inter",system-ui,sans-serif' : '"Inter",system-ui,sans-serif'};line-height:1.7}
a{color:inherit;text-decoration:none}
.wrap{max-width:1000px;margin:0 auto;padding:0 20px}
header.top{position:sticky;top:0;z-index:9;backdrop-filter:blur(10px);background:rgba(5,6,10,.75);border-bottom:1px solid var(--line)}
.top .wrap{display:flex;align-items:center;gap:14px;padding:14px 20px}
.av{width:52px;height:52px;border-radius:16px;object-fit:cover;background:linear-gradient(135deg,var(--b1),var(--b2));display:grid;place-items:center;font-weight:800;font-size:22px;flex:none}
.nm{font-weight:800;font-size:17px;display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.vbadge{display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:700;color:#0b0e14;background:linear-gradient(120deg,#ffd76a,#ffb347);border-radius:99px;padding:2.5px 10px}
.st{font-size:11.5px;color:var(--dim)}
.chip{font-size:11px;border:1px solid var(--line);border-radius:99px;padding:3px 10px;color:var(--dim)}
.chip.on{color:var(--ok);border-color:rgba(52,211,153,.4)}
.hero{padding:56px 0 34px;position:relative;overflow:hidden}
h1.big{font-size:clamp(26px,5vw,40px);font-weight:800;line-height:1.35}
.lead{color:var(--dim);margin-top:12px;max-width:640px}
.stats{display:flex;gap:26px;margin-top:22px;flex-wrap:wrap}
.stat b{font-size:22px;font-weight:800}
.stat span{display:block;font-size:12px;color:var(--dim)}
.sec{padding:34px 0}
h2.sh{font-size:19px;font-weight:800;margin-bottom:18px;display:flex;align-items:center;gap:10px}
h2.sh::after{content:"";flex:1;height:1px;background:var(--line)}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px}
.svc{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:18px;transition:transform .25s,border-color .25s}
.svc:hover{transform:translateY(-3px);border-color:rgba(0,212,255,.45)}
.svc b{font-size:15px}
.svc p{font-size:13px;color:var(--dim);margin:8px 0;max-height:64px;overflow:hidden}
.pr{display:flex;justify-content:space-between;align-items:center;font-size:13px}
.pr .p{color:var(--b2);font-weight:800}
.wk{background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:hidden}
.wk img,.vid{width:100%;aspect-ratio:16/10;object-fit:cover;display:block}
.vid iframe,.vid video{width:100%;aspect-ratio:16/10;border:0;display:block}
.wk .cap{padding:12px 14px;font-size:13.5px;font-weight:600}
.rv{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:16px;margin-bottom:10px}
.rv .st2{color:var(--gold);letter-spacing:2px;font-size:13px}
.rv p{font-size:13.5px;color:var(--dim);margin-top:6px}
form.lead{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:22px;max-width:560px}
label{display:block;font-size:12px;color:var(--dim);margin:12px 0 6px}
input,textarea{width:100%;background:#090b12;border:1px solid var(--line);border-radius:11px;padding:11px 13px;color:var(--fg);font:inherit;font-size:13.5px}
input:focus,textarea:focus{outline:none;border-color:var(--b2)}
button.go{margin-top:16px;width:100%;border:0;cursor:pointer;border-radius:12px;padding:13px;font:inherit;font-weight:800;font-size:14px;color:#04121a;background:linear-gradient(120deg,var(--b1),var(--b2))}
.msg{margin-top:12px;font-size:13px;display:none}
footer{border-top:1px solid var(--line);margin-top:30px;padding:22px 0;color:var(--dim);font-size:12.5px;text-align:center}
footer a{color:var(--b2);font-weight:700}
.links{display:flex;gap:10px;flex-wrap:wrap;margin-top:18px}
.links a{border:1px solid var(--line);border-radius:12px;padding:9px 16px;font-size:13px;transition:border-color .2s}
.links a:hover{border-color:var(--b2)}${anim ? `
/* حركتا Pulse وPrime */
.reveal{opacity:0;transform:translateY(18px);transition:opacity .7s ease,transform .7s ease}
.reveal.in{opacity:1;transform:none}
.orb{position:absolute;border-radius:50%;filter:blur(70px);opacity:.28;pointer-events:none}
.o1{width:340px;height:340px;background:var(--b1);top:-120px;inset-inline-end:-80px}
.o2{width:280px;height:280px;background:var(--b2);bottom:-100px;inset-inline-start:-60px;opacity:.18}
.gridln{position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.035) 1px,transparent 1px);background-size:44px 44px;mask-image:radial-gradient(closest-side at 50% 30%,#000,transparent);pointer-events:none}
.svc:hover .p{text-shadow:0 0 18px rgba(0,212,255,.5)}${tpl === "prime" ? `
h1.big .grad{background:linear-gradient(120deg,#8b7cff,#00d4ff);-webkit-background-clip:text;background-clip:text;color:transparent}
.stat b{background:linear-gradient(120deg,#8b7cff,#00d4ff);-webkit-background-clip:text;background-clip:text;color:transparent}
.top .av{box-shadow:0 0 0 2px rgba(124,108,255,.35),0 0 34px -6px rgba(124,108,255,.5)}
button.go{box-shadow:0 10px 34px -10px rgba(124,108,255,.55)}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)}}
.o1{animation:float 9s ease-in-out infinite}
.hero .badge-vip{display:inline-flex;gap:6px;align-items:center;font-size:11px;font-weight:800;letter-spacing:.14em;border:1px solid rgba(251,191,36,.45);color:var(--gold);border-radius:99px;padding:4px 14px;margin-bottom:16px}` : ""}` : `
.hero,.sec{opacity:1}}`}
@media (max-width:640px){.grid{grid-template-columns:1fr}.stats{gap:18px}}`;
}

const SCRIPT = (tpl: string) => `<script>
(function(){
  var reveals=document.querySelectorAll('.reveal');
  if(reveals.length&&'IntersectionObserver' in window){
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}});},{threshold:.12});
    reveals.forEach(function(el){io.observe(el);});
  } else { reveals.forEach(function(el){el.classList.add('in');}); }
  ${tpl === "prime" ? `
  var counters=document.querySelectorAll('[data-count]');
  var cio=new IntersectionObserver(function(es){es.forEach(function(e){
    if(!e.isIntersecting)return;cio.unobserve(e.target);
    var el=e.target,target=Number(el.getAttribute('data-count'))||0,t0=performance.now();
    (function tick(t){var p=Math.min(1,(t-t0)/1100);el.textContent=Math.round(target*(0.2+0.8*p*p));if(p<1)requestAnimationFrame(tick);})(t0);
  });},{threshold:.4});
  counters.forEach(function(el){cio.observe(el);});` : ""}
  var f=document.getElementById('leadform');
  if(f)f.addEventListener('submit',function(ev){
    ev.preventDefault();
    var m=document.getElementById('lmsg');
    var btn=f.querySelector('button');
    btn.disabled=true;
    fetch(f.getAttribute('data-api'),{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({name:f.nm.value.trim(),contact:f.ct.value.trim(),body:f.bd.value.trim()})})
    .then(function(r){if(!r.ok)throw 0;f.reset();m.style.display='block';m.style.color='#34d399';m.textContent=f.getAttribute('data-ok');btn.disabled=false;})
    .catch(function(){m.style.display='block';m.style.color='#f87171';m.textContent=f.getAttribute('data-err');btn.disabled=false;});
  });
})();
</script>`;

export async function renderSite(env: Env, username: string, lang: "ar" | "en"): Promise<Response | null> {
  const u = await env.DB.prepare("SELECT id, username, name, headline, bio, avatar_url, verified, reputation, reviews_count, completed, skills, links, available, plan_id, site_template FROM users WHERE username = ? AND role = 'freelancer'").bind(username).first<any>();
  if (!u) return null;
  const plan = String(u.plan_id || "free");
  const tpl = templateAllowed(plan, String(u.site_template || "aurora")) ? String(u.site_template || "aurora") : "aurora";
  const dir: "rtl" | "ltr" = lang === "ar" ? "rtl" : "ltr";
  const t = L[lang];
  const svcs = await env.DB.prepare("SELECT title, description, price_min, price_max, currency, delivery_days FROM services WHERE user_id = ? AND active = 1 ORDER BY created_at DESC LIMIT 9").bind(u.id ?? username).all<any>().catch(() => ({ results: [] }));
  const works = await env.DB.prepare("SELECT title, description, media_type, media_url, thumb_url FROM portfolio WHERE user_id = ? ORDER BY created_at DESC LIMIT 8").bind(u.id ?? username).all<any>().catch(() => ({ results: [] }));
  const revs = await env.DB.prepare("SELECT r.rating, r.body, r.created_at, us.name AS reviewer FROM reviews r JOIN projects p ON p.id = r.project_id JOIN users us ON us.id = r.reviewer_id WHERE r.reviewee_id = ? ORDER BY r.created_at DESC LIMIT 6").bind(u.id ?? username).all<any>().catch(() => ({ results: [] }));
  const links = (() => { try { return (JSON.parse(u.links || "[]") || []).filter((x: any) => x && x.url).slice(0, 5); } catch { return []; } })();
  const skills = (() => { try { return (JSON.parse(u.skills || "[]") || []).slice(0, 8); } catch { return []; } })();
  const R = (rows: any[] | undefined) => rows ?? [];
  const siteUrl = `/w/${u.username}`;

  const servicesHtml = R(svcs.results).map((s: any, i: number) => `
      <div class="svc reveal" style="transition-delay:${Math.min(i * 60, 240)}ms"><b>${esc(s.title)}</b><p>${esc(clip(s.description, 150))}</p>
      <div class="pr"><span class="p">${Number(s.price_min) || 0}–${Number(s.price_max) || 0} ${esc(s.currency || "DZD")}</span><span class="chip">${s.delivery_days} ${t.d}</span></div></div>`).join("");
  const worksHtml = R(works.results).map((w: any, i: number) => `
      <div class="wk reveal" style="transition-delay:${Math.min(i * 60, 240)}ms">${w.media_type === "video" ? embed(w.media_url) : `<img src="${esc(w.thumb_url || w.media_url)}" alt="${esc(w.title)}" loading="lazy"/>`}<div class="cap">${esc(w.title)}</div></div>`).join("");
  const revsHtml = R(revs.results).map((r: any) => `
      <div class="rv reveal"><div class="spread" style="display:flex;justify-content:space-between;gap:10px"><b style="font-size:13.5px">${esc(r.reviewer)}</b><span class="st2">${stars(r.rating)}</span></div><p>${esc(clip(r.body, 260))}</p></div>`).join("");
  const linksHtml = links.length ? `<div class="links reveal">${links.map((l: any) => `<a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label || l.url)}</a>`).join("")}</div>` : "";

  return new Response(`<!doctype html>
<html lang="${lang}" dir="${dir}"><head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${esc(u.name)} — ${esc(u.headline || (lang === "ar" ? "محترف على NAKSAB" : "Professional on NAKSAB"))}</title>
<meta name="description" content="${esc(clip(u.bio || u.headline || u.name, 150))}"/>
<meta property="og:title" content="${esc(u.name)}"/><meta property="og:description" content="${esc(clip(u.headline || u.bio || "", 120))}"/>
<link rel="preconnect" href="https://fonts.googleapis.com"/><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;600;800&family=Inter:wght@400;600;800&display=swap"/>
<style>${css(tpl, dir)}</style></head>
<body>
<header class="top"><div class="wrap">
  ${u.avatar_url ? `<img class="av" src="${esc(u.avatar_url)}" alt="${esc(u.name)}"/>` : `<div class="av">${esc((u.name || "?").trim().charAt(0).toUpperCase())}</div>`}
  <div style="flex:1"><div class="nm">${esc(u.name)}${u.verified ? `<span class="vbadge">✓ ${t.verified}</span>` : ""}</div>
  <div class="st">${esc(u.headline || "")}</div></div>
  <span class="chip ${u.available ? "on" : ""}">${u.available ? t.avail : t.busy}</span>
  <a href="#lead" style="color:var(--b2);font-weight:700;font-size:13px">${t.lead_h}</a>
</div></header>

<section class="hero"><div class="gridln"></div>${tpl !== "aurora" ? '<div class="orb o1"></div><div class="orb o2"></div>' : ""}
<div class="wrap" style="position:relative">
  ${tpl === "prime" ? '<div class="badge-vip">★ PRIME</div>' : ""}
  <h1 class="big">${tpl === "prime" ? `<span class="grad">${esc(u.headline || u.name)}</span>` : esc(u.headline || u.name)}</h1>
  <p class="lead">${esc(clip(u.bio || "", 320))}</p>
  ${skills.length ? `<div class="links" style="margin-top:14px">${skills.map((s: string) => `<span class="chip">${esc(s)}</span>`).join("")}</div>` : ""}
  <div class="stats">
    <div class="stat"><b ${tpl === "prime" ? `data-count="${Number(u.completed) || 0}"` : ""}>${Number(u.completed) || 0}</b><span>${t.projects}</span></div>
    <div class="stat"><b ${tpl === "prime" ? `data-count="${Math.round(Number(u.reputation) || 0)}"` : ""}>${Math.round(Number(u.reputation) || 0)}</b><span>${t.rep}</span></div>
    <div class="stat"><b ${tpl === "prime" ? `data-count="${R(svcs.results).length}"` : ""}>${R(svcs.results).length}</b><span>${t.services}</span></div>
  </div>
  ${linksHtml}
</div></section>

${servicesHtml ? `<section class="sec"><div class="wrap"><h2 class="sh">${t.services}</h2><div class="grid">${servicesHtml}</div></div></section>` : ""}
${worksHtml ? `<section class="sec"><div class="wrap"><h2 class="sh">${t.works}${R(works.results).some((w: any) => w.media_type === "video") ? ` · ${t.ads}` : ""}</h2><div class="grid">${worksHtml}</div></div></section>` : ""}
${revsHtml ? `<section class="sec"><div class="wrap"><h2 class="sh">${t.reviews}</h2>${revsHtml}</div></section>` : ""}

<section class="sec" id="lead"><div class="wrap">
  <h2 class="sh">${t.lead_h}</h2>
  <form class="lead reveal" id="leadform" data-api="/api/site/${esc(u.username)}/lead?lang=${lang}" data-ok="${t.sent}" data-err="${t.err}">
    <label>${t.name}</label><input name="nm" required minlength="2" maxlength="80"/>
    <label>${t.contact}</label><input name="ct" required minlength="5" maxlength="120"/>
    <label>${t.msg}</label><textarea name="bd" rows="3" required minlength="10" maxlength="1200"></textarea>
    <button class="go" type="submit">${t.send}</button>
    <div class="msg" id="lmsg"></div>
  </form>
</div></section>

<footer><div class="wrap">${t.site_by} <a href="/">NAKSAB</a> · ${esc(u.username)}</div></footer>
${SCRIPT(tpl)}
</body></html>`, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=60" } });
}

// طباعة Devis/Facture — بالتوكن السري (قدرة حاملة) أو جلب الخادم داخل الجلسة
export async function renderDocPrint(env: Env, token: string): Promise<Response | null> {
  const d = await env.DB.prepare("SELECT * FROM docs WHERE share_token = ?").bind(token).first<any>();
  if (!d) return null;
  const items = (() => { try { return JSON.parse(d.items || "[]"); } catch { return []; } })() as Array<{ d: string; q: number; p: number }>;
  const isFacture = d.kind === "facture";
  const title = isFacture ? "FACTURE / فاتورة" : "DEVIS / عرض سعر";
  const stMap: Record<string, [string, string]> = { draft: ["DRAFT", "#9aa3b8"], sent: ["SENT", "#00d4ff"], accepted: ["ACCEPTED", "#34d399"], rejected: ["REJECTED", "#f87171"], paid: ["PAYÉ / مدفوعة", "#34d399"], cancelled: ["CANCELLED", "#9aa3b8"] };
  const [stLabel, stColor] = stMap[d.status] ?? ["", "#9aa3b8"];
  const rows = items.map((it, i) => `<tr><td>${i + 1}</td><td style="text-align:start">${esc(it.d)}</td><td>${it.q}</td><td style="text-align:end">${Number(it.p).toLocaleString("fr-DZ")}</td><td style="text-align:end;font-weight:700">${(Number(it.q) * Number(it.p)).toLocaleString("fr-DZ")}</td></tr>`).join("");
  return new Response(`<!doctype html><html lang="fr"><head><meta charset="utf-8"/><title>${d.number} — ${esc(d.client_name)}</title>
<style>
@page{size:A4;margin:14mm}
*{box-sizing:border-box}body{font-family:"IBM Plex Sans Arabic","Inter",system-ui,sans-serif;color:#14181f;margin:0;padding:28px;max-width:820px}
.hd{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;border-bottom:3px solid #7c6cff;padding-bottom:16px}
.hd h1{font-size:26px;margin:0;letter-spacing:.04em}
.mut{color:#6b7280;font-size:12px;line-height:1.8}
.box{background:#f6f7fb;border:1px solid #e5e7eb;border-radius:10px;padding:12px 14px;font-size:12.5px;line-height:1.8}
table{width:100%;border-collapse:collapse;margin-top:22px;font-size:13px}
th{background:#0c0e17;color:#fff;padding:9px 10px;text-align:end;font-size:11.5px}
th:first-child{text-align:center;border-radius:8px 0 0 8px}th:last-child{border-radius:0 8px 8px 0}
td{padding:9px 10px;border-bottom:1px solid #e5e7eb;text-align:end}
td:first-child{text-align:center}
.tot{margin-top:18px;margin-inline-start:auto;width:300px;font-size:13.5px}
.tot div{display:flex;justify-content:space-between;padding:6px 4px}
.tot .g{border-top:2px solid #14181f;font-weight:800;font-size:16px;margin-top:4px;padding-top:10px}
.notes{margin-top:20px;font-size:12px;color:#4b5563;white-space:pre-wrap}
.wm{position:fixed;top:42%;inset-inline-end:8%;transform:rotate(-18deg);font-size:64px;font-weight:800;opacity:.09;letter-spacing:.1em;color:${stColor};pointer-events:none}
.ft{margin-top:34px;padding-top:12px;border-top:1px solid #e5e7eb;font-size:11px;color:#9ca3af;display:flex;justify-content:space-between}
@media print{.wm{position:fixed}button{display:none}}
button{margin-bottom:18px;border:0;background:#7c6cff;color:#fff;border-radius:9px;padding:10px 20px;font:inherit;font-weight:700;cursor:pointer}
</style></head><body>
<button onclick="print()">🖨 Imprimer / PDF</button>
<div class="wm">${stLabel}</div>
<div class="hd"><div><h1>${title}</h1><div class="mut" style="margin-top:6px"><b>${d.number}</b> · ${esc(d.issued_date)}</div></div>
<div class="box" style="max-width:300px"><b style="font-size:13px">${esc(d.seller_info ? "" : "")}</b>${d.seller_info ? esc(d.seller_info).replace(/\n/g, "<br>") : ""}</div></div>
<div style="display:flex;gap:14px;margin-top:18px;align-items:flex-start">
<div class="box" style="flex:1"><div class="mut" style="font-size:10.5px;letter-spacing:.1em;margin-bottom:4px">CLIENT</div><b>${esc(d.client_name)}</b>${d.client_info ? `<br>${esc(d.client_info).replace(/\n/g, "<br>")}` : ""}</div></div>
<table><thead><tr><th>#</th><th style="text-align:start">Désignation / البيان</th><th>Qté</th><th>P.U (DZD)</th><th>Total (DZD)</th></tr></thead>
<tbody>${rows}</tbody></table>
<div class="tot"><div><span>Sous-total</span><b>${Number(d.subtotal).toLocaleString("fr-DZ")} DZD</b></div>
${Number(d.tva_rate) ? `<div><span>TVA ${Number(d.tva_rate)}%</span><b>${Number(d.tva_amount).toLocaleString("fr-DZ")} DZD</b></div>` : ""}
<div class="g"><span>TOTAL</span><span>${Number(d.total).toLocaleString("fr-DZ")} DZD</span></div></div>
${d.notes ? `<div class="notes"><b>Notes:</b> ${esc(d.notes)}</div>` : ""}
<div class="ft"><span>Créé avec NAKSAB — naksab.vitobytestudio.workers.dev</span><span>${d.number}</span></div>
</body></html>`, { headers: { "content-type": "text/html; charset=utf-8" } });
}
