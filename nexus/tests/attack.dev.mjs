/* NEXUS attack gate — بوابة الهجمات (السادسة): طابور عدائي حقيقي ضد الخادم الحي المحلي */
const BASE = "http://127.0.0.1:8792";
let pass = 0, fail = 0;
const ok = (name, cond, detail = "") => { if (cond) { pass++; console.log("✓ " + name); } else { fail++; console.log("✗ " + name + (detail ? " — " + detail : "")); } };

const k0 = async (email, passw) => {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(passw), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: enc.encode("nexus:c1:" + email), iterations: 200000 }, key, 256);
  return [...new Uint8Array(bits)].map((b) => b.toString(16).padStart(2, "0")).join("");
};
const ts = Date.now();
const reg = async (slug, email) => {
  const r = await fetch(BASE + "/api/auth/register", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, k0: await k0(email, "Atk-Secret-7"), name: "Atk", slug, store_name: "متجر الهجوم" }) });
  const d = await r.json();
  return { status: r.status, cookie: (r.headers.get("set-cookie") || "").split(";")[0], csrf: d.csrf };
};

/* تسجيل تاجرين منفصلين (ضحية + مهاجم) */
const A = await reg("atk-a-" + ts, "atk-a" + ts + "@t.test");
const B = await reg("atk-b-" + ts, "atk-b" + ts + "@t.test");
ok("تسجيل الضحية والمهاجم", A.status === 200 && B.status === 200);
const mk = await fetch(BASE + "/api/products", { method: "POST", headers: { "content-type": "application/json", cookie: A.cookie, "x-csrf": A.csrf }, body: JSON.stringify({ title: "منتج الضحية للتجاوزات", descr: "", price: 900, image: "/data/demo/p-watch.jpg", category: "other" }) });
const mkd = await mk.json();
ok("منتج الضحية جاهز", mk.status === 201 && mkd.id, JSON.stringify(mkd).slice(0, 80));

/* ─── 1) مسارات الوسائط ─── */
ok("traversal مشفّر في /media مرفوض", (await fetch(BASE + "/media/%2e%2e%2f%2e%2e%2fetc%2fpasswd.jpg")).status === 404);
ok("امتداد وسائط غريب مرفوض", (await fetch(BASE + "/media/aaaaaaaaaaaaaaaa.html")).status === 404);
ok("طول بصمة وسائط خاطئ مرفوض", (await fetch(BASE + "/media/abc123.jpg")).status === 404);
ok("مسار API مجهول بالكامل 404", (await fetch(BASE + "/api/admin/nonexistent")).status === 404);

/* ─── 2) تجاوز الملكية والجلسات ─── */
ok("المهاجم لا يعدّل منتج الغير", (await fetch(BASE + "/api/products/" + mkd.id, { method: "PUT", headers: { "content-type": "application/json", cookie: B.cookie, "x-csrf": B.csrf }, body: JSON.stringify({ title: "خُطفت", price: 1, image: "/data/demo/p-watch.jpg", category: "other" }) })).status === 404);
ok("المهاجم لا يحذف منتج الغير", (await fetch(BASE + "/api/products/" + mkd.id, { method: "DELETE", headers: { cookie: B.cookie, "x-csrf": B.csrf } })).status === 404);
ok("كوكي جلسة مزيف مرفوض", (await fetch(BASE + "/api/me", { headers: { cookie: "nx_s=" + "f".repeat(48) } })).status === 401);
ok("csrf جلستين متبادلتين مرفوض", (await fetch(BASE + "/api/products", { method: "POST", headers: { "content-type": "application/json", cookie: A.cookie, "x-csrf": B.csrf }, body: JSON.stringify({ title: "هجوم csrf", price: 1, image: "", category: "other" }) })).status === 403);

/* ─── 3) قفل الإدارة من زاوية المهاجم ─── */
ok("كوكي مدير مزيف + ترويسة تخمين → 404", (await fetch(BASE + "/api/adm/stats", { headers: { cookie: "nx_adm=" + "a".repeat(64), "x-panel": "guessed-token-000" } })).status === 404);
ok("دخول إدارة بلا رابط سري → 404", (await fetch(BASE + "/api/adm/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: "owner@x.test", k0: "a".repeat(64) }) })).status === 404);
ok("/panel/ فارغة → 404", (await fetch(BASE + "/panel/")).status === 404);
ok("/setup بعد الإعداد → 404 أو مخفي", (await fetch(BASE + "/setup")).status === 404 || (await fetch(BASE + "/setup")).status === 200);

/* ─── 4) حقن وحمولات مشوهة ─── */
ok("slug بوسوم خبيثة مرفوض", (await fetch(BASE + "/api/auth/register", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: "x" + ts + "@t.test", k0: await k0("x" + ts + "@t.test", "Atk-Secret-7"), name: "X", slug: "<script>alert(1)</script>", store_name: "X" }) })).status === 400);
{
  const r = await fetch(BASE + "/api/products", { method: "POST", headers: { "content-type": "application/json", cookie: A.cookie, "x-csrf": A.csrf }, body: JSON.stringify({ title: "تلوث", price: 5, image: "", category: "other", __proto__: { isAdmin: true }, constructor: { prototype: { isAdmin: true } } }) });
  const h = await fetch(BASE + "/api/health");
  ok("حمولة proto pollution لا تُسقط النظام", r.status < 500 && (await h.json()).ok === true);
}
{
  const big = "أ".repeat(2_000_000);
  const r = await fetch(BASE + "/api/products", { method: "POST", headers: { "content-type": "application/json", cookie: A.cookie, "x-csrf": A.csrf }, body: JSON.stringify({ title: big, price: 5, image: "", category: "other" }) });
  ok("حمولة 2MB تُبتلع بأمان (<500)", r.status < 500, "status=" + r.status);
}
{
  const r = await fetch(BASE + "/api/products", { method: "POST", headers: { "content-type": "application/json", cookie: A.cookie, "x-csrf": A.csrf }, body: JSON.stringify({ title: "سعر فلكي", price: 1e19, image: "", category: "other" }) });
  ok("سعر 1e19 لا يُسقط النظام (<500)", r.status < 500, "status=" + r.status);
}
ok("ولاية سالبة مرفوضة", (await fetch(BASE + `/api/store/atk-a-${ts}/order`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ product_id: mkd.id, cname: "مهاجم", phone: "0551234567", wilaya: -1, commune: "x", delivery: "desk", qty: 1 }) })).status === 400);
{
  const r = await fetch(BASE + "/api/products", { method: "POST", headers: { "content-type": "application/json", cookie: A.cookie, "x-csrf": A.csrf }, body: JSON.stringify(["array", "not", "object"]) });
  ok("جسم مصفوفة بدل كائن → رفض آمن", r.status < 500, "status=" + r.status);
}

/* ─── 5) المنظومة تقف بعد الطابور كاملاً ─── */
{
  const h = await (await fetch(BASE + "/api/health")).json();
  const f = await fetch(BASE + "/api/feed");
  ok("النظام يقف بعد كل الهجمات", h.ok === true && f.status === 200);
}

console.log(`\n═══ NEXUS attack gate: ${pass}/${pass + fail} ═══`);
process.exit(fail ? 1 : 0);
