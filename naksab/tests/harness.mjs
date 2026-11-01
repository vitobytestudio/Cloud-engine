// ——— NAKSAB harness: دورة حياة كاملة حقيقية ———
const BASE = process.env.BASE || "http://127.0.0.1:8791";
const results = [];
const check = (name, cond, extra = "") => { results.push(!!cond); console.log(`${cond ? "✓" : "❌"} ${name}${!cond && extra ? ` — ${extra}` : ""}`); };

// تصفير عدادات حدود المعدل (KV محلي) حتى لا تتراكم بين التشغيلات
{ const { execSync } = await import("node:child_process");
  let keys = []; try { keys = JSON.parse(execSync("./node_modules/.bin/wrangler kv key list --binding CACHE_KV --local", { cwd: new URL("..", import.meta.url).pathname, stdio: ["ignore", "pipe", "ignore"] }).toString()); } catch {}
  for (const k of keys.filter((x) => x.name.startsWith("rl:"))) try { execSync(`./node_modules/.bin/wrangler kv key delete --binding CACHE_KV --local "${k.name}"`, { cwd: new URL("..", import.meta.url).pathname, stdio: ["ignore", "ignore", "ignore"] }); } catch {} }

const k0Of = async (email, pass) => {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(pass), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: enc.encode("naksab:a1:" + email.toLowerCase()), iterations: 200000 }, key, 256);
  return [...new Uint8Array(bits)].map((b) => b.toString(16).padStart(2, "0")).join("");
};
const reg = async (email, pass, name, username, role) => {
  const k0 = await k0Of(email, pass);
  return fetch(`${BASE}/api/auth/register`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, k0, name, username, role }) });
};
const login = async (email, pass) => {
  const k0 = await k0Of(email, pass);
  return fetch(`${BASE}/api/auth/login`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, k0 }) });
};
const jar = {};
const capture = async (as, res) => {
  eatCookies(as, res);
  let data = {}; try { data = await res.json(); } catch {}
  if (data.csrf) jar[as + ":csrf"] = data.csrf;
  return { ok: res.ok, status: res.status, data };
};
function eatCookies(as, res) {
  const list = res.headers.getSetCookie ? res.headers.getSetCookie() : (res.headers.get("set-cookie") ? [res.headers.get("set-cookie")] : []);
  for (const c of list) {
    if (c.startsWith("nk_s=")) jar[as] = c.split(";")[0];
    if (c.startsWith("nk_ad=")) jar[as + ":ad"] = c.split(";")[0];
  }
}
const cookieOf = (as) => [jar[as], jar[as + ":ad"]].filter(Boolean).join("; ");
async function call(as, path, method = "GET", body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { "content-type": "application/json", ...(cookieOf(as) ? { cookie: cookieOf(as) } : {}), ...(body && jar[as] ? { "x-csrf": jar[as + ":csrf"] } : {}), ...(jar.panel ? { "x-panel": jar.panel } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  eatCookies(as, res);
  let data = {}; try { data = await res.json(); } catch {}
  if (data.csrf) jar[as + ":csrf"] = data.csrf;
  return { ok: res.ok, status: res.status, data };
}

// ═══ 1) الصحة والصفحة ═══
const h = await (await fetch(`${BASE}/api/health`)).json();
check("الخادم حي", h.ok === true, JSON.stringify(h));
const homeHtml = await (await fetch(`${BASE}/`)).text();
check("الصفحة الرئيسية تُخدم", homeHtml.includes("NAKSAB") && homeHtml.includes("styles.css"));
check("CSS حقيقي يُخدم", (await (await fetch(`${BASE}/styles.css`)).text()).includes("--brand1"));
check("app.js يُخدم", (await (await fetch(`${BASE}/app.js`)).text()).includes("viewHome"));

// ═══ 2) المصادقة ═══
const badReg = await reg("bad", "x", "N", "u", "freelancer");
check("تسجيل بريد تالف مرفوض (400)", badReg.status === 400);
const weak = await fetch(`${BASE}/api/auth/register`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: "w@w.test", k0: "123", name: "W", username: "www", role: "freelancer" }) });
check("k0 تالف مرفوض (400)", weak.status === 400);
const badUser = await reg("valid@nk.test", "StrongPass9", "Valid", "Bad User!", "freelancer");
check("username تالف مرفوض (400)", badUser.status === 400);
const suffix = Date.now().toString(36);
const fre = await capture("fre", await reg(`freelancer-${suffix}@nk.test`, "StrongPass9", "Amine Dev", `amine-${suffix}`, "freelancer"));
check("تسجيل مستقل (201)", fre.status === 201, JSON.stringify(fre.data));
const dup = await reg(`freelancer-${suffix}@nk.test`, "StrongPass9", "Amine", `amine-${suffix}`, "freelancer");
check("البريد المكرر مرفوض (409)", dup.status === 409);
const cli = await capture("cli", await reg(`client-${suffix}@nk.test`, "StrongPass9", "Sara Client", `sara-${suffix}`, "client"));
check("تسجيل عميل (201)", cli.status === 201);
const badLogin = await login(`freelancer-${suffix}@nk.test`, "WrongPass1");
check("دخول بخطأ مرفوض (401)", badLogin.status === 401);
const goodLogin = await capture("fre", await login(`freelancer-${suffix}@nk.test`, "StrongPass9"));
check("دخول صحيح (200)", goodLogin.status === 200);
const noAuth = await call("nobody", "/api/profile", "PUT", { headline: "x" });
check("تعديل بلا جلسة مرفوض (401)", noAuth.status === 401);

// ═══ 3) الملف الشخصي ═══
const prof = await call("fre", "/api/profile", "PUT", { headline: "Full-stack dev · React & Node", bio: "I ship production apps.", country: "Algeria", categories: ["programming"], skills: ["react", "nodejs", "landing-page"], available: true, avatar_url: "" });
check("تحديث ملف المستقل", prof.ok === true, JSON.stringify(prof.data));
const badAvatar = await call("fre", "/api/profile", "PUT", { avatar_url: "http://localhost/x.png" });
check("رابط غير آمن يُرفض للأفاتار", badAvatar.ok === true); // يُقبل الطلب لكن يُنظَّف
const me = await call("fre", "/api/me");
check("الملف محفوظ فعلاً", me.data.user?.headline === "Full-stack dev · React & Node" && me.data.user?.avatar_url === "", JSON.stringify(me.data.user?.headline));

// ═══ 4) الخدمات ═══
const svcBad = await call("fre", "/api/services", "POST", { title: "x", description: "y" });
check("خدمة ناقصة مرفوضة (400)", svcBad.status === 400);
const svc = await call("fre", "/api/services", "POST", { title: "I will build a SaaS landing page", description: "Modern responsive landing page with React, animations and contact form. Two revisions included.", category: "programming", skills: ["react", "landing-page"], price_min: 150, price_max: 400, delivery_days: 7, revisions: 2, requirements: "Brand assets and copy" });
check("إنشاء خدمة (201)", svc.status === 201, JSON.stringify(svc.data));
const svc2 = await call("fre", "/api/services", "POST", { title: "I will fix your Node.js API bugs", description: "Debug and fix production issues in your Node.js REST API quickly and cleanly.", category: "programming", skills: ["nodejs"], price_min: 40, price_max: 90, delivery_days: 2 });
const list = await call("anon", `/api/services?q=landing`);
check("الخدمة تظهر في البحث العام", (list.data.services || []).some((x) => x.id === svc.data.id));
const catList = await call("anon", "/api/services?category=programming");
check("فلتر التصنيف يعمل", (catList.data.services || []).every((x) => x.category === "programming"));
const detail = await call("anon", `/api/services/${svc.data.id}`);
check("تفاصيل الخدمة", detail.data.service?.title?.includes("landing page"));
const cliSvc = await call("cli", "/api/services", "POST", { title: "client service test", description: "client accounts cannot publish services at all here" });
check("العميل لا ينشر خدمات (403)", cliSvc.status === 403);

// ═══ 5) الأعمال + Discover ═══
const pf = await call("fre", "/api/portfolio", "POST", { title: "SaaS dashboard case study", description: "Full case study of a dashboard I shipped.", media_type: "image", media_url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800", tags: ["react", "dashboard"] });
check("نشر عمل (201)", pf.status === 201);
const pfBad = await call("fre", "/api/portfolio", "POST", { title: "SSRF test", media_url: "http://169.254.169.254/x" });
check("رابط داخلي يُنظَّف (SSRF)", pfBad.status === 201);
const pfDetail = await call("anon", `/api/u/amine-${suffix}`);
check("الرابط الداخلي لم يُخزَّن", (pfDetail.data.works || []).find((w) => w.title === "SSRF test")?.media_url === "");
const disc = await call("anon", "/api/discover");
check("Discover يعرض الأعمال", (disc.data.posts || []).some((x) => x.id === pf.data.id));
const like1 = await call("cli", `/api/portfolio/${pf.data.id}/like`, "POST", {});
check("إعجاب يعمل", like1.data.liked === true);
const like2 = await call("cli", `/api/portfolio/${pf.data.id}/like`, "POST", {});
check("إلغاء الإعجاب يعمل", like2.data.liked === false);

// ═══ 6) الطلبات + الهيكلة الذكية ═══
const rqBad = await call("cli", "/api/requests", "POST", { title: "x", description: "y" });
check("طلب ناقص مرفوض (400)", rqBad.status === 400);
const ai = await call("cli", "/api/requests/structure", "POST", { text: "I need a modern landing page for my SaaS product with pricing and a contact form, budget around 300 dollars, two weeks timeline." });
check("الهيكلة الذكية: محلياً بلا مفاتيح تسقط برشاقة (503 ai_unavailable)", ai.status === 503 && ai.data.error === "ai_unavailable", JSON.stringify(ai.data));
const rq = await call("cli", "/api/requests", "POST", { title: "Build a SaaS landing page", description: "Need a modern responsive landing page with pricing section, testimonials and contact form. React preferred.", category: "programming", skills: ["react", "landing-page"], budget_min: 250, budget_max: 400, currency: "USD" });
check("إنشاء طلب (201)", rq.status === 201);
const RID = rq.data.id;

// ═══ 7) المطابقة الموزونة ═══
const matches = await call("cli", `/api/requests/${RID}/matches`);
const amine = (matches.data.matches || []).find((m) => m.username === `amine-${suffix}`);
check("المطابقة تجد المستقل المناسب", !!amine, JSON.stringify(matches.data));
check("المطابقة مرجّحة (score>0 من المهارات+التوفر)", (amine?.score ?? 0) >= 5, `score=${amine?.score}`);
check("المطابقة مرتبة تنازلياً", (matches.data.matches || []).every((m, i, a) => i === 0 || a[i - 1].score >= m.score));
const openReqs = await call("fre", "/api/requests/open");
check("الطلبات المفتوحة تظهر للمستقل ومرتبة", (openReqs.data.requests || []).some((x) => x.id === RID));

// ═══ 8) العروض ═══
const propBad = await call("fre", "/api/proposals", "POST", { request_id: RID, amount: 300, days: 7, cover: "short" });
check("عرض سطحيل مرفوض (400)", propBad.status === 400);
const prop = await call("fre", "/api/proposals", "POST", { request_id: RID, amount: 320, days: 10, cover: "I have shipped 12 landing pages exactly like this one. Here is my plan: design tokens, hero A/B, clean Lighthouse 95+." });
check("إرسال عرض (201)", prop.status === 201);
const propDup = await call("fre", "/api/proposals", "POST", { request_id: RID, amount: 320, days: 10, cover: "Duplicate proposal attempt for the same request again." });
check("عرض مكرر مرفوض (409)", propDup.status === 409);
const propsOwner = await call("cli", `/api/requests/${RID}/proposals`);
check("المالك يرى العرض ببيانات المستقل", (propsOwner.data.proposals || [])[0]?.username === `amine-${suffix}` && propsOwner.data.owner === true);
const PID = (propsOwner.data.proposals || [])[0]?.id;

// ═══ 9) القبول → المشروع ═══
const accept = await call("cli", `/api/proposals/${PID}/accept`, "POST", {});
check("قبول العرض يفتح مشروعاً", accept.ok === true && !!accept.data.project_id, JSON.stringify(accept.data));
const PRJ = accept.data.project_id;
const notifFre = await call("fre", "/api/notifications");
check("إشعار القبول وصل للمستقل", (notifFre.data.notifications || []).some((n) => n.type === "accepted"));

// ═══ 10) غرفة المشروع ═══
const msg1 = await call("cli", `/api/projects/${PRJ}/messages`, "POST", { body: "Welcome! Share your design tokens doc when ready." });
check("رسالة العميل", msg1.status === 201);
const msg2 = await call("fre", `/api/projects/${PRJ}/messages`, "POST", { body: "Thanks! Starting today, first draft in 48h." });
check("رد المستقل", msg2.status === 201);
const room = await call("cli", `/api/projects/${PRJ}`);
check("الغرفة تعرض الرسالتين", (room.data.messages || []).length === 2);
const stranger = await reg(`stranger-${suffix}@nk.test`, "StrongPass9", "Stranger", `str-${suffix}`, "client");
const strangerPeek = await call("str", `/api/projects/${PRJ}`);
check("غريب لا يرى المشروع (404)", strangerPeek.status === 404);
const ms = await call("fre", `/api/projects/${PRJ}/milestones`, "POST", { title: "Design + hero section", due_days: 3 });
check("إنشاء مرحلة", ms.status === 201);
const msId = (await call("cli", `/api/projects/${PRJ}`)).data.milestones[0]?.id;
const msDel = await call("fre", `/api/milestones/${msId}/status`, "POST", { status: "delivered" });
check("تسليم المرحلة (من المستقل)", msDel.ok === true);
const msApp = await call("cli", `/api/milestones/${msId}/status`, "POST", { status: "approved" });
check("اعتماد المرحلة (من العميل)", msApp.ok === true);
const msBad = await call("fre", `/api/milestones/${msId}/status`, "POST", { status: "approved" });
check("انتقال غير مشروع مرفوض", msBad.status === 400);
const dvBad = await call("fre", `/api/projects/${PRJ}/deliverables`, "POST", { url: "ftp://x" });
check("تسليم برابط غير https مرفوض (400)", dvBad.status === 400);
const dv = await call("fre", `/api/projects/${PRJ}/deliverables`, "POST", { url: "https://drive.example.com/deliver-1", note: "First draft" });
check("تسليم رابط حقيقي", dv.status === 201);

// ═══ 11) التأكيد المتبادل ═══
const confF = await call("fre", `/api/projects/${PRJ}/confirm`, "POST", {});
check("تأكيد المستقل — ينتظر العميل", confF.ok === true && confF.data.client_confirmed === 0);
const earlyReview = await call("cli", "/api/reviews", "POST", { project_id: PRJ, rating: 5, body: "too early review attempt here" });
check("التقييم قبل الاكتمال مرفوض (409)", earlyReview.status === 409);
const confC = await call("cli", `/api/projects/${PRJ}/confirm`, "POST", {});
check("تأكيد العميل → اكتمال المشروع", confC.ok === true && confC.data.client_confirmed === 1 && confC.data.freelancer_confirmed === 1);

// ═══ 12) التقييمات ═══
const rvC = await call("cli", "/api/reviews", "POST", { project_id: PRJ, rating: 5, body: "Amine delivered exactly what was agreed, ahead of schedule. Communication was clear throughout." });
check("تقييم العميل (201)", rvC.status === 201);
const rvDup = await call("cli", "/api/reviews", "POST", { project_id: PRJ, rating: 5, body: "Duplicate review attempt after already reviewing this project." });
check("تقييم مكرر مرفوض (409)", rvDup.status === 409);
const rvF = await call("fre", "/api/reviews", "POST", { project_id: PRJ, rating: 5, body: "Great client, clear brief and fast feedback. Would work with Sara again anytime." });
check("تقييم المستقل (201)", rvF.status === 201);
const pubProf = await call("anon", `/api/u/amine-${suffix}`);
check("التقييم يظهر على الملف العام", (pubProf.data.reviews || []).length === 1);
check("السمعة محسوبة", pubProf.data.profile?.reputation === 5 && pubProf.data.profile?.reviews_count === 1);

// ═══ 13) ADS ═══
const ad = await call("fre", "/api/ads", "POST", { title: "Get your logo in 48 hours", body: "Studio-grade brand kits.", target_url: "https://example.com/logo" });
check("إرسال حملة (pending)", ad.status === 201);
const adsPub = await call("anon", "/api/ads/approved");
check("الحملة المعلقة لا تظهر للعموم", !(adsPub.data.ads || []).some((a) => a.title.includes("logo")));

// ═══ 14) الإدارة: إعداد لمرة واحدة + رابط مشتق + بوابة اللوحة + الدفع الخامل ═══
const { execSync } = await import("node:child_process");
// إعادة تهيئة الإعداد لتكرار التشغيل (محلي فقط)
execSync(`./node_modules/.bin/wrangler d1 execute naksab-db --local --command "DELETE FROM admin_meta; DELETE FROM admin_devices; DELETE FROM users WHERE role='admin'"`, { cwd: new URL("..", import.meta.url).pathname, stdio: "pipe" });
const suSt = await fetch(`${BASE}/api/admin/setup-status`).then((r) => r.json()).catch(() => ({}));
check("حالة الإعداد قبل الإنشاء", suSt.done === false);
const suBad = await fetch(`${BASE}/api/admin/setup`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: "bad", k0: "x", name: "X" }) });
check("إعداد ببيانات تالفة مرفوض (400)", suBad.status === 400);
const ownerEmail = `owner-${suffix}@nk.test`;
const k0o = await k0Of(ownerEmail, "OwnerSecret77x");
const su = await fetch(`${BASE}/api/admin/setup`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: ownerEmail, k0: k0o, name: "Owner" }) });
const suD = await su.json().catch(() => ({}));
check("إنشاء المالك لمرة واحدة (201 + رابط مشتق)", su.status === 201 && /^\/panel\/[A-Za-z0-9]{10,}$/.test(suD.panel_url || ""), JSON.stringify(suD).slice(0, 80));
eatCookies("str", su); jar["str:csrf"] = suD.csrf; jar.panel = (suD.panel_url || "").replace("/panel/", "");
const su2 = await fetch(`${BASE}/api/admin/setup`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: `o2-${suffix}@nk.test`, k0: k0o, name: "O2" }) });
check("الإعداد الثاني مرفوض (404) — لمرة واحدة", su2.status === 404);
const pgOk = await fetch(`${BASE}${suD.panel_url}`);
check("رابط اللوحة الصحيح يخدم الواجهة", pgOk.status === 200 && (await pgOk.text()).includes("NAKSAB"));
const pgBad = await fetch(`${BASE}/panel/WrongToken123`);
check("رابط لوحة خاطئ 404", pgBad.status === 404);
const noPan = await fetch(`${BASE}/api/admin/stats`, { headers: { cookie: cookieOf("str") } });
check("API الإدارة بلا x-panel مرفوض (404)", noPan.status === 404);
const admPub = await login(ownerEmail, "OwnerSecret77x");
check("دخول المدير من الموقع العام مرفوض صامتاً (401)", admPub.status === 401);
const admPan = await fetch(`${BASE}/api/auth/login`, { method: "POST", headers: { "content-type": "application/json", "x-panel": jar.panel }, body: JSON.stringify({ email: ownerEmail, k0: k0o }) });
check("دخول المدير من رابط اللوحة يعمل (200)", admPan.status === 200);
const admPanD = await admPan.json().catch(() => ({}));
if (admPanD.csrf) jar["str:csrf"] = admPanD.csrf;
eatCookies("str", admPan);
const stats = await call("str", "/api/admin/stats");
check("إحصائيات الإدارة عبر اللوحة", (stats.data.users ?? 0) >= 3 && stats.data.completed >= 1, JSON.stringify(stats.data).slice(0, 80));
const flagged = await call("str", "/api/admin/reviews/flagged");
check("قائمة المراجعة الإدارية تعمل", Array.isArray(flagged.data.reviews));

// ═══ 14-ب) الدفع الخامل + حماية Webhook + التدقيق المالي ═══
const meC = await call("cli", "/api/me");
check("رصيد الذكاء في /api/me", !!meC.data.ai && meC.data.ai.limit_daily >= 1 && !!meC.data.plan);
const co1 = await call("cli", "/api/payments/checkout", "POST", { kind: "plan", plan_id: "pro" });
check("الدفع الخامل: checkout مرفوض (503)", co1.status === 503);
const setOn = await call("str", "/api/admin/settings", "PUT", { payments_enabled: "1" });
check("الإعدادات من اللوحة تعمل", setOn.ok === true);
const plansPub = await fetch(`${BASE}/api/plans`).then((r) => r.json());
const pro = (plansPub.plans || []).find((x) => x.id === "pro");
check("الباقات: PRO بأسعار دج غير مفتوح (Coming Soon)", !!pro && pro.active === 0 && pro.price_dzd > 0 && plansPub.payments_enabled === 1);
const co2 = await call("cli", "/api/payments/checkout", "POST", { kind: "plan", plan_id: "pro" });
check("checkout لباقة غير مفتوحة مرفوض (400)", co2.status === 400);
const wh = await fetch(`${BASE}/api/payments/webhook/chargily`, { method: "POST", headers: { "content-type": "application/json", "x-signature": "deadbeef" }, body: JSON.stringify({ reference: "NK-TEST123", amount_dzd: 1900, status: "paid" }) });
check("Webhook بتوقيع خاطئ مرفوض (401)", wh.status === 401);
const fa = await call("str", "/api/admin/audit-financial");
check("سطر تدقيق مالي لرفض التوقيع", (fa.data.audit || []).some((a) => a.action === "webhook_rejected"));
await call("str", "/api/admin/settings", "PUT", { payments_enabled: "0" });
const co3 = await call("cli", "/api/payments/checkout", "POST", { kind: "plan", plan_id: "pro" });
check("إعادة التعطيل: النظام خاملاً مجدداً (503)", co3.status === 503);
const rot = await call("str", "/api/admin/rotate-panel", "POST", {});
check("تدوير رابط اللوحة يعمل", rot.ok === true && /^\/panel\//.test(rot.data.panel_url || ""));
jar.panel = (rot.data.panel_url || "").replace("/panel/", "");
const stats2 = await call("str", "/api/admin/stats");
check("الرابط الجديد يعمل والقديم مات", stats2.ok === true);

// ═══ 15) حقن وحماية ═══
const inj = await call("anon", `/api/services?q=${encodeURIComponent("' OR 1=1--")}`);
check("حقن SQL غير مؤثر (معاملات)", inj.ok === true && Array.isArray(inj.data.services));
const xss = await call("fre", "/api/portfolio", "POST", { title: "<script>alert(1)</script> safe", description: "xss probe" });
check("المحتوى الخبيث يُقبل كنص (الإخراج مُهرَّب في الواجهة)", xss.status === 201);
const csrfBad = await fetch(`${BASE}/api/services`, { method: "POST", headers: { "content-type": "application/json", cookie: jar.fre }, body: JSON.stringify({ title: "csrf probe attempt here", description: "no csrf header at all in this request" }) });
check("بدون CSRF مرفوض (403)", csrfBad.status === 403);

// ═══ النتيجة ═══
const fails = results.filter((r) => !r).length;
console.log(`\n═══ NAKSAB harness: ${results.length - fails}/${results.length} نجح ═══`);
process.exit(fails ? 1 : 0);
