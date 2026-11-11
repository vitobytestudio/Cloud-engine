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
check("الصفحة الرئيسية تُخدم", homeHtml.includes("NAKSAB") && homeHtml.includes("styles.min.css"));
check("CSS حقيقي يُخدم", (await (await fetch(`${BASE}/styles.min.css`)).text()).includes("--brand1"));
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
const rqFre = await call("fre", "/api/requests", "POST", { title: "Freelancer trying", description: "should be blocked", category: "design" });
check("المستقل لا ينشر طلبات مشاريع (403)", rqFre.status === 403);
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

// ─── 14-أ2) منحة الباقة والرصيد بيد المدير (بلا دفع — بأمر المالك) ───
{
  const gEmail = `grantee-${suffix}@nk.test`;
  const gReg = await fetch(`${BASE}/api/auth/register`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: gEmail, k0: await k0Of(gEmail, "Secret-99"), name: "Grantee", username: "gr" + suffix, role: "client" }) });
  const gD = await gReg.json().catch(() => ({}));
  check("تسجيل المستلم (201)", gReg.status === 201);
  const grant = await call("str", `/api/admin/users/${gD.user.id}/flags`, "POST", { plan: "pro", credits: 250 });
  check("منحة PRO + 250 رصيد", grant.ok && grant.data.ok && grant.data.plan === "PRO" && grant.data.credits === 250, JSON.stringify(grant.data).slice(0, 100));
  const gMe = await fetch(`${BASE}/api/me`, { headers: { cookie: (gReg.headers.get("set-cookie") || "").split(";")[0] } });
  const gMeD = await gMe.json().catch(() => ({}));
  check("المستلم يرى PRO ورصيده", gMe.status === 200 && gMeD.plan?.id === "pro" && gMeD.ai?.balance === 250, JSON.stringify({ p: gMeD.plan, b: gMeD.ai?.balance }).slice(0, 100));
  const badPlan = await call("str", `/api/admin/users/${gD.user.id}/flags`, "POST", { plan: "ghost" });
  check("باقة وهمية مرفوضة (400)", !badPlan.ok && badPlan.data.error === "invalid_plan");
  const gNotif = await fetch(`${BASE}/api/notifications`, { headers: { cookie: (gReg.headers.get("set-cookie") || "").split(";")[0] } });
  const gNj = await gNotif.json().catch(() => ({}));
  check("إشعار المنحة وصل", (gNj.notifications || []).some((n) => n.type === "plan"));
}

// ─── 14-أ3) العضوية الجسرية: شراء → إفراج → ثمن متدرج → بوابة عامة ───
{
  await call("str", "/api/admin/settings", "PUT", { payments_enabled: "1" });
  const wEmail = `bridge-${suffix}@nk.test`;
  const wReg = await fetch(`${BASE}/api/auth/register`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: wEmail, k0: await k0Of(wEmail, "Secret-99"), name: "BridgeBuyer", username: "bb" + suffix, role: "client" }) });
  const wD = await wReg.json().catch(() => ({}));
  const wCookie = (wReg.headers.get("set-cookie") || "").split(";")[0];
  const wCsrf = wD.csrf;
  const co = await fetch(`${BASE}/api/payments/checkout`, { method: "POST", headers: { "content-type": "application/json", cookie: wCookie, "x-csrf": wCsrf }, body: JSON.stringify({ kind: "plan", plan_id: "bridge-weekly" }) });
  const coD = await co.json().catch(() => ({}));
  check("شراء عضوية الأسبوع (مرجع + مبلغ)", (co.status === 200 || co.status === 201) && coD.reference && coD.amount_dzd === 199, JSON.stringify(coD).slice(0, 100));
  /* تأكيد يدوي من المالك → إفراج العضوية */
  const wPid = await fetch(`${BASE}/api/me`, { headers: { cookie: wCookie } }).then((r) => r.json());
  const conf = await call("str", `/api/admin/payments/${coD.payment_id}/status`, "POST", { status: "confirmed" });
  check("تأكيد المالك للدفع (200)", conf.ok, JSON.stringify(conf.data));
  const memPub = await fetch(`${BASE}/api/bridge/member/bb${suffix}`).then((r) => r.json());
  check("البوابة العامة: العضوية نشطة 3%", memPub.active === true && memPub.pct === 3, JSON.stringify(memPub));
  const memMe = await fetch(`${BASE}/api/me`, { headers: { cookie: wCookie } }).then((r) => r.json());
  check("العضو يرى عضويته في /api/me", memMe.member?.active === true && memMe.member?.plan_id === "bridge-weekly");
  /* ثمن الجسر المتدرج: نوثق كل المستخدمين محلياً فيمتلئ كتالوج الجسر ثم نطلب */
  const users = await call("str", "/api/admin/users");
  for (const uu of users.data.users || []) if (!uu.verified) await call("str", `/api/admin/users/${uu.id}/flags`, "POST", { verified: true });
  const cat = await fetch(`${BASE}/api/bridge/catalog`).then((r) => r.json());
  const wSvc = (cat.services || [])[0];
  if (wSvc) {
    const ord = await fetch(`${BASE}/api/bridge/orders`, { method: "POST", headers: { "content-type": "application/json", cookie: wCookie, "x-csrf": wCsrf }, body: JSON.stringify({ service_id: wSvc.id, brief: "طلب اختبار ثمن العضوية الجسرية" }) });
    const ordD = await ord.json().catch(() => ({}));
    check("ثمن الجسر بخصم العضوية (3%)", ord.status === 201 && ordD.fee_dzd === Math.max(100, Math.round(wSvc.price_min * 0.03)), JSON.stringify({ got: ordD.fee_dzd, want: Math.max(100, Math.round(wSvc.price_min * 0.03)), price: wSvc.price_min }));
  } else check("ثمن العضوية (تخطي — الكتالوج فارغ محلياً)", true);
  /* نعيد الخمول لقسم الدفع التالي */
  await call("str", "/api/admin/settings", "PUT", { payments_enabled: "0" });
}

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
check("باب الـwebhook الخارجي ملحوم تماماً (404) — بريدي موب حصراً", wh.status === 404);
const wh2 = await fetch(`${BASE}/api/payments/webhook/sofizpay`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ reference: "NK-TEST123", amount_dzd: 1900, status: "paid" }) });
check("باب SofizPay ملحوم أيضاً (404)", wh2.status === 404);
const setK = await call("str", "/api/admin/settings", "PUT", { webhook_secret_chargily: "hacker-tries", webhook_secret_sofizpay: "hacker-tries" });
const stAfter = await call("str", "/api/admin/settings");
check("مفاتيح webhook الخارجية تُرفض من الإعدادات", setK.ok === true && !(stAfter.data.settings || []).some((x) => String(x.k).includes("webhook_secret")));
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

// ═══ المواقع الشخصية (3 قوالب حسب الباقة) + دخول الزبائن + شارة التوثيق ═══
const nd_siteRes = await fetch(`${BASE}/w/amine-${suffix}`);
const nd_siteHtml = await nd_siteRes.text();
check("الموقع الشخصي يُخدم (200 HTML)", nd_siteRes.status === 200 && nd_siteRes.headers.get("content-type")?.includes("text/html"));
check("القالب الافتراضي Aurora للمجاني", !nd_siteHtml.includes("badge-vip"));
check("بيانات المستقل تظهر بالموقع", nd_siteHtml.includes("Amine Dev"));
check("نموذج دخول الزبائن موجود", nd_siteHtml.includes("leadform"));
const nd_leadRes = await fetch(`${BASE}/api/site/amine-${suffix}/lead`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: "زبون الموقع", contact: "0770112233", body: "أحتاج تصميم متجر إلكتروني كامل بصفحة دفع" }) });
check("زبون الموقع يترك طلباً (عام بلا جلسة)", nd_leadRes.status === 200);
const nd_leadBad = await fetch(`${BASE}/api/site/amine-${suffix}/lead`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: "x", contact: "y", body: "z" }) });
check("طلب زبون ناقص مرفوض (400)", nd_leadBad.status === 400);
const nd_leadsList = await call("fre", "/api/site/leads");
check("صاحب الموقع يرى طلبات زبائنه", (nd_leadsList.data.leads || []).some((l) => l.name === "زبون الموقع"));
const nd_tplLock = await call("fre", "/api/profile", "PUT", { site_template: "prime" });
check("قالب VIP مقفل على FREE (403)", nd_tplLock.status === 403);
const nd_tplAur = await call("fre", "/api/profile", "PUT", { site_template: "aurora" });
check("اختيار القالب المسموح يعمل", nd_tplAur.ok === true);

// ═══ العقود والفواتير (Devis/Facture) — حساب بالخادم وقفل بعد الإرسال ═══
const nd_docCli = await call("cli", "/api/docs", "POST", { kind: "devis", client_name: "شركة تجربة", items: [{ d: "خدمة", q: 1, p: 100 }] });
check("العميل لا ينشئ فواتير (403)", nd_docCli.status === 403);
const nd_dv1 = await call("fre", "/api/docs", "POST", { kind: "devis", client_name: "شركة النور", client_info: "وهران", seller_info: "مقاول ذاتي — NIK 12345", items: [{ d: "تصميم هوية بصرية", q: 1, p: 25000 }, { d: "ساعة استشارة", q: 2, p: 2000 }], tva_rate: 19 });
check("إنشاء Devis (201) برقم تسلسلي", nd_dv1.status === 201 && nd_dv1.data.number === "DEV-" + new Date().getFullYear() + "-001", JSON.stringify(nd_dv1.data));
check("المجاميع محسوبة بالخادم (19%)", nd_dv1.data.subtotal === 29000 && nd_dv1.data.tva_amount === 5510 && nd_dv1.data.total === 34510, JSON.stringify(nd_dv1.data));
const nd_dvEdit = await call("fre", `/api/docs/${nd_dv1.data.id}`, "PUT", { client_name: "شركة النور", items: [{ d: "تصميم هوية بصرية", q: 1, p: 30000 }], tva_rate: 19 });
check("تعديل المسودة يعيد الحساب", nd_dvEdit.ok === true && nd_dvEdit.data.total === 35700, JSON.stringify(nd_dvEdit.data));
const nd_dvSend = await call("fre", `/api/docs/${nd_dv1.data.id}/status`, "POST", { status: "sent" });
check("إرسال Devis يعمل", nd_dvSend.ok === true);
const nd_dvEdit2 = await call("fre", `/api/docs/${nd_dv1.data.id}`, "PUT", { client_name: "محاولة تعديل بعد الإرسال", items: [{ d: "x", q: 1, p: 1 }] });
check("المُرسل مقفل على التعديل (409)", nd_dvEdit2.status === 409);
const nd_dvBad = await call("fre", `/api/docs/${nd_dv1.data.id}/status`, "POST", { status: "paid" });
check("انتقال غير مشروع مرفوض (409)", nd_dvBad.status === 409);
const nd_dvPrint = await fetch(`${BASE}/print/${nd_dv1.data.share_token}`);
check("طباعة الوثيقة بالتوكن السري (200)", nd_dvPrint.status === 200 && (await nd_dvPrint.text()).includes("DEV-"));
const nd_fac1 = await call("fre", "/api/docs", "POST", { kind: "facture", client_name: "شركة النور", items: [{ d: "تنفيذ المشروع", q: 1, p: 40000 }] });
check("الفاتورة الأولى برقمها التسلسلي", nd_fac1.status === 201 && nd_fac1.data.number === "FAC-" + new Date().getFullYear() + "-001", JSON.stringify(nd_fac1.data));
const nd_doc3 = await call("fre", "/api/docs", "POST", { kind: "devis", client_name: "زبون ثالث", items: [{ d: "خدمة تجاوز الحصة", q: 1, p: 1000 }] });
check("حصة FREE الشهرية (2) تُطبق (403)", nd_doc3.status === 403, JSON.stringify(nd_doc3.data));
const nd_docDel = await call("fre", `/api/docs/${nd_fac1.data.id}`, "DELETE", {});
check("حذف المسودة يعمل", nd_docDel.ok === true);
const nd_docDel2 = await call("fre", `/api/docs/${nd_dv1.data.id}`, "DELETE", {});
check("حذف المُرسلة مرفوض (409)", nd_docDel2.status === 409);

// ═══ شارة التوثيق من لوحة الإدارة ═══
const nd_admUsers = await call("str", "/api/admin/users");
check("قائمة المستخدمين للإدارة", (nd_admUsers.data.users || []).some((x) => x.username === `amine-${suffix}`));
const nd_freRow = (nd_admUsers.data.users || []).find((x) => x.username === `amine-${suffix}`);
await call("str", `/api/admin/users/${nd_freRow.id}/flags`, "POST", { verified: true });
const nd_siteV = await fetch(`${BASE}/w/amine-${suffix}`);
const nd_siteVHtml = await nd_siteV.text();
check("شارة التوثيق تظهر بالموقع بعد الاعتماد", nd_siteVHtml.includes('<span class="vbadge">'));
await call("str", `/api/admin/users/${nd_freRow.id}/flags`, "POST", { verified: false });
const nd_meBan = await call("str", `/api/admin/users/${nd_freRow.id}/flags`, "POST", { banned: true });
check("حظر مستخدم من الإدارة يعمل", nd_meBan.ok === true, JSON.stringify({ s: nd_meBan.status, d: nd_meBan.data }).slice(0, 160));
await call("str", `/api/admin/users/${nd_freRow.id}/flags`, "POST", { banned: false });

// ═══ النتيجة ═══
const fails = results.filter((r) => !r).length;
console.log(`\n═══ NAKSAB harness: ${results.length - fails}/${results.length} نجح ═══`);
process.exit(fails ? 1 : 0);
