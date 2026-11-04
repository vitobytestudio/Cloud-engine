// ——— NEXUS v1.0 harness — بوابات الجودة ———
import { execSync } from "node:child_process";
const CWD = new URL("..", import.meta.url).pathname;
// تصفير عدادات المعدل (KV تبقى بين الجولات — فخ 429 موثق)
let rkeys = []; try { rkeys = JSON.parse(execSync("./node_modules/.bin/wrangler kv key list --binding CACHE_KV --local", { cwd: CWD, stdio: ["ignore", "pipe", "ignore"] }).toString()); } catch {}
for (const k of rkeys.filter((x) => x.name.startsWith("rl:"))) try { execSync(`./node_modules/.bin/wrangler kv key delete --binding CACHE_KV --local "${k.name}"`, { cwd: CWD, stdio: ["ignore", "ignore", "ignore"] }); } catch {}
const BASE = process.env.BASE || "http://127.0.0.1:8792";
const results = [];
const check = (name, cond, extra = "") => { results.push(!!cond); console.log(`${cond ? "✓" : "❌"} ${name}${!cond && extra ? ` — ${extra}` : ""}`); };

const k0Of = async (email, pass) => {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(pass), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: enc.encode("nexus:a1:" + email.toLowerCase()), iterations: 200000 }, key, 256);
  return [...new Uint8Array(bits)].map((b) => b.toString(16).padStart(2, "0")).join("");
};
const jar = {};
const cookieOf = (as) => jar[as] || "";
async function call(as, path, method = "GET", body, extra = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { "content-type": "application/json", ...(cookieOf(as) ? { cookie: cookieOf(as) } : {}), ...(jar[as + ":csrf"] ? { "x-csrf": jar[as + ":csrf"] } : {}), ...extra },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const list = res.headers.getSetCookie ? res.headers.getSetCookie() : (res.headers.get("set-cookie") ? [res.headers.get("set-cookie")] : []);
  for (const c of list) if (c.startsWith("nx_s=")) jar[as] = c.split(";")[0];
  let data = {}; try { data = await res.json(); } catch {}
  if (data.csrf) jar[as + ":csrf"] = data.csrf;
  return { ok: res.ok, status: res.status, data };
}
const su = Date.now().toString(36);
const IMG = "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800";

// ═══ الصحة والصفحة ═══
const h = await (await fetch(`${BASE}/api/health`)).json();
check("الخادم حي", h.ok === true && h.app === "nexus");
const home = await (await fetch(`${BASE}/`)).text();
check("الواجهة تُخدم", home.includes("NEXUS") && home.includes("styles.css"));

// ═══ المصادقة ═══
const badEmail = await call("x", "/api/auth/register", "POST", { email: "not-email", k0: "a".repeat(64), name: "X", username: "xx" });
check("بريد تالف مرفوض (400)", badEmail.status === 400);
const badK0 = await call("x", "/api/auth/register", "POST", { email: "a@b.test", k0: "123", name: "X", username: "xx" });
check("k0 تالف مرفوض (400)", badK0.status === 400);
const rA = await call("a", "/api/auth/register", "POST", { email: `seller-${su}@nx.test`, k0: await k0Of(`seller-${su}@nx.test`, "StrongPass9"), name: "ياسين التاجر", username: `yacine-${su}` });
check("تسجيل تاجر (201)", rA.status === 201 && rA.data.user.username === `yacine-${su}`);
const dup = await call("x", "/api/auth/register", "POST", { email: `seller-${su}@nx.test`, k0: "b".repeat(64), name: "Duplicate", username: `yacine-${su}` });
check("البريد المكرر مرفوض (409)", dup.status === 409);
const badLog = await call("a", "/api/auth/login", "POST", { email: `seller-${su}@nx.test`, k0: "c".repeat(64) });
check("دخول خاطئ مرفوض (401)", badLog.status === 401);
const logA = await call("a", "/api/auth/login", "POST", { email: `seller-${su}@nx.test`, k0: await k0Of(`seller-${su}@nx.test`, "StrongPass9") });
check("دخول صحيح (200)", logA.status === 200 && logA.data.csrf);

// ═══ الملف ═══
const pf = await call("a", "/api/profile", "PUT", { bio: "بائع إلكترونيات أصلية", category: "إلكترونيات", store_url: "https://wa.me/213770000000" });
check("تحديث الملف", pf.ok === true);
const pfBad = await call("a", "/api/profile", "PUT", { store_url: "http://localhost/x" });
check("رابط متجر غير آمن مرفوض (400)", pfBad.status === 400);
const meA = await call("a", "/api/me");
check("الملف في /api/me بعدّادات", meA.data.user?.category === "إلكترونيات" && meA.data.counts?.followers === 0);

// ═══ المنشورات ═══
const pBad = await call("a", "/api/posts", "POST", { image_url: "http://x.test/a.jpg" });
check("صورة غير https مرفوضة (400)", pBad.status === 400);
const p1 = await call("a", "/api/posts", "POST", { image_url: IMG, caption: "سماعات بلوتوث أصلية — توصيل 58 ولاية", category: "إلكترونيات" });
check("إنشاء منشور (201)", p1.status === 201);
const p2 = await call("a", "/api/posts", "POST", { image_url: IMG, caption: "ساعة ذكية جديدة", category: "إلكترونيات" });
check("منشور ثانٍ (201)", p2.status === 201);
const ex = await (await fetch(`${BASE}/api/explore`)).json();
check("الاستكشاف العام يعرض المنشورين", (ex.posts || []).length >= 2);
const exCat = await (await fetch(`${BASE}/api/explore?cat=${encodeURIComponent("ملابس")}`)).json();
check("فلتر التصنيف يفرغ غير المطابق", (exCat.posts || []).length === 0);
const exQ = await (await fetch(`${BASE}/api/explore?q=${encodeURIComponent("سماعات")}`)).json();
check("البحث النصي يجد", (exQ.posts || []).some((p) => p.id === p1.data.id));
const one = await (await fetch(`${BASE}/api/posts/${p1.data.id}`)).json();
check("قراءة منشور بعدّادات", one.post?.likes === 0 && one.post?.username === `yacine-${su}`);

// ═══ التفاعلات ═══
const lk = await call("a", `/api/posts/${p1.data.id}/like`, "POST", {});
check("إعجاب يعمل", lk.ok === true && lk.data.likes === 1);
const lk2 = await call("a", `/api/posts/${p1.data.id}/like`, "POST", {});
check("الإعجاب المكرر idempotent (لا يتضاعف)", lk2.ok === true && lk2.data.likes === 1);
const unlk = await call("a", `/api/posts/${p1.data.id}/like`, "DELETE");
check("إلغاء الإعجاب يعود للصفر", unlk.ok === true && unlk.data.likes === 0);
const cEmpty = await call("a", `/api/posts/${p1.data.id}/comments`, "POST", { body: "  " });
check("تعليق فارغ مرفوض (400)", cEmpty.status === 400);
const c1 = await call("a", `/api/posts/${p1.data.id}/comments`, "POST", { body: "السعر combien؟" });
check("تعليق يُضاف (201)", c1.status === 201);
const cl = await (await fetch(`${BASE}/api/posts/${p1.data.id}/comments`)).json();
check("قائمة التعليقات تعرضه", (cl.comments || []).some((c) => c.body === "السعر combien؟"));
const sv = await call("a", `/api/posts/${p1.data.id}/save`, "POST", {});
check("حفظ المنشور يعمل", sv.ok === true && sv.data.saved === true);

// ═══ المتابعة والفيد ═══
const selfF = await call("a", `/api/users/yacine-${su}/follow`, "POST", {});
check("متابعة النفس مرفوضة", selfF.status === 400);
const rB = await call("b", "/api/auth/register", "POST", { email: `buyer-${su}@nx.test`, k0: await k0Of(`buyer-${su}@nx.test`, "StrongPass9"), name: "سارة المشترية", username: `sara-${su}` });
check("تسجيل عضو ثانٍ (201)", rB.status === 201);
const fo = await call("b", `/api/users/yacine-${su}/follow`, "POST", {});
check("المتابعة تعمل مع عدّاد", fo.ok === true && fo.data.followers === 1);
const pr = await (await fetch(`${BASE}/api/users/yacine-${su}`)).json();
check("البروفايل العام بعداداته", pr.counts?.followers === 1 && pr.counts?.posts === 2);
const feedB = await call("b", "/api/feed");
check("فيد المتابع يعرض منشورات A", (feedB.data.posts || []).length === 2 && feedB.data.posts[0].id === p2.data.id);
check("الفيد مرتب تنازلياً", (feedB.data.posts || []).every((p, i, arr) => !i || arr[i - 1].created_at >= p.created_at));
const feedNoAuth = await fetch(`${BASE}/api/feed`);
check("الفيد بلا جلسة مرفوض (401)", feedNoAuth.status === 401);

// ═══ الحدود ═══
const delOther = await call("b", `/api/posts/${p1.data.id}`, "DELETE");
check("حذف منشور الغير مرفوض (403)", delOther.status === 403);
const delOwn = await call("a", `/api/posts/${p2.data.id}`, "DELETE", {});
check("حذف منشوري يعمل", delOwn.ok === true);
const exAfter = await (await fetch(`${BASE}/api/explore`)).json();
check("المحذوف يختفي من الاستكشاف", !(exAfter.posts || []).some((p) => p.id === p2.data.id));
const noCsrf = await fetch(`${BASE}/api/posts`, { method: "POST", headers: { "content-type": "application/json", cookie: cookieOf("a") }, body: JSON.stringify({ image_url: IMG }) });
check("كتابة بلا CSRF مرفوضة (403)", noCsrf.status === 403);

// ═══ الستوريات ═══
const st = await call("a", "/api/stories", "POST", { image_url: IMG, caption: "وصل حديثاً" });
check("إنشاء ستوري (201)", st.status === 201);
const stBad = await call("a", "/api/stories", "POST", { image_url: "ftp://x" });
check("ستوري برابط غير آمن مرفوض", stBad.status === 400);
const stB = await call("b", "/api/stories");
check("ستوريات المتابَعين تظهر مجمعة", (stB.data.stories || []).some((g) => g.username === `yacine-${su}` && g.items.length >= 1));
const stNoAuth = await fetch(`${BASE}/api/stories`);
check("الستوريات بلا جلسة مرفوضة (401)", stNoAuth.status === 401);

// ═══ الخلاصة ═══
const total = results.length, passed = results.filter(Boolean).length;
console.log(`\n═══ NEXUS harness: ${passed}/${total} ═══`);
process.exit(passed === total ? 0 : 1);
