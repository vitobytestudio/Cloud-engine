// ——— التعزيز المدفوع: أسعار من الخادم + دفتر قيود + idempotency ———
import type { Env, Session } from "../env";
import { BOOST_CATALOG } from "../lib/pricing";
import { rateLimit } from "../lib/rate";
import { sendMail, mailShell } from "../lib/mail";

const json = (obj: unknown, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json; charset=utf-8" } });

export async function checkout(req: Request, env: Env, s: Session): Promise<Response> {
  if (!s.userId) return json({ error: "auth_required" }, 401);
  if (!(await rateLimit(env, `boost:${s.userId}`, 5, 3600))) return json({ error: "too_many" }, 429);
  const b = (await req.json().catch(() => ({}))) as { post_id?: string; tier?: string; target_sector?: string; target_country?: string };
  const tier = BOOST_CATALOG[b.tier ?? ""];
  if (!tier) return json({ error: "invalid_tier" }, 400);
  const post = await env.DB.prepare("SELECT id, user_id FROM posts WHERE id=? AND quarantined=0").bind(b.post_id ?? "").first<{ id: string; user_id: string }>();
  if (!post) return json({ error: "not_found" }, 404);
  if (post.user_id !== s.userId) return json({ error: "not_owner" }, 403);

  // قيمة الباقة الذهبية: هيمنة مجانية واحدة شهرياً (بدون خصم من المحفظة)
  let price = tier.price_cents;
  let freeGrant = false;
  const badge = (await env.DB.prepare("SELECT badge_tier FROM users WHERE id=?").bind(s.userId).first<{ badge_tier: string }>())?.badge_tier ?? "FREE";
  if (badge === "ENTERPRISE_GOLD" && tier.name === "DOMINANCE_DROP") {
    const used = await env.DB.prepare(
      "SELECT COUNT(*) AS c FROM boosts WHERE user_id=? AND amount_paid_cents=0 AND created_at >= date('now','start of month')"
    ).bind(s.userId).first<{ c: number }>();
    if (!used?.c) { price = 0; freeGrant = true; }
  }
  // ——— v0.10-B: الرصيد = الدفتر + الهدية (تصرف أولاً — الأقرب انتهاءً) ———
  const bal = await env.DB.prepare("SELECT COALESCE(SUM(amount_cents),0) AS b FROM transactions WHERE user_id=?")
    .bind(s.userId).first<{ b: number }>();
  const grants = await env.DB.prepare(
    "SELECT id, remaining_cents FROM credit_grants WHERE user_id=? AND status='ACTIVE' AND expires_at > datetime('now') ORDER BY expires_at ASC"
  ).bind(s.userId).all<{ id: string; remaining_cents: number }>();
  const giftTotal = (grants.results ?? []).reduce((a, g) => a + g.remaining_cents, 0);
  const avail = (bal?.b ?? 0) + giftTotal;
  if (avail < price) return json({ error: "insufficient_balance", balance_cents: avail }, 402);

  const boostId = `b-${crypto.randomUUID().slice(0, 10)}`;
  const eventId = `stub_boost_${boostId}`;
  // الصرف: الهدية أولاً (بلا فواتير — رصيد داخلي ملك المستخدم)، والباقي من الدفتر
  let need = price;
  for (const g of grants.results ?? []) {
    if (need <= 0) break;
    const take = Math.min(g.remaining_cents, need);
    if (take <= 0) continue;
    const nrem = g.remaining_cents - take;
    await env.DB.prepare("UPDATE credit_grants SET remaining_cents=?, status=? WHERE id=?")
      .bind(nrem, nrem <= 0 ? "SPENT" : "ACTIVE", g.id).run();
    need -= take;
  }
  const charged = need; // الجزء المخصوم من الدفتر فقط
  try {
    await env.DB.prepare(
      `INSERT INTO boosts (id,user_id,post_id,tier_name,target_sector,target_country,impressions_bought,amount_paid_cents,status)
       VALUES (?,?,?,?,?,?,?,?, 'ACTIVE')`
    ).bind(boostId, s.userId, post.id, tier.name, (b.target_sector ?? "").slice(0, 16), (b.target_country ?? "").slice(0, 12).toUpperCase(),
      tier.impressions, price).run();
    if (charged > 0) {
      await env.DB.prepare(
        `INSERT INTO transactions (id,user_id,kind,amount_cents,ref_type,ref_id,provider_event_id) VALUES (?,?,?,?,?,?,?)`
      ).bind(`tx-${crypto.randomUUID().slice(0, 10)}`, s.userId, "BOOST_PURCHASE", -charged, "BOOST", boostId, eventId).run();
    }
  } catch {
    return json({ error: "duplicate_event" }, 409); // idempotency عبر provider_event_id UNIQUE
  }
  await env.DB.prepare(
    `UPDATE posts SET is_boosted=1, boost_expires_at=datetime('now', '+${tier.hours} hours') WHERE id=?`
  ).bind(post.id).run();
  // الفواتير للدفع الحقيقي فقط — الرصيد الداخلي (الهدية) يصرف بلا فواتير/قسائم
  if (charged > 0) {
    const buyer = await env.DB.prepare("SELECT email, full_name, company_name, vat_number, country_code FROM users WHERE id=?").bind(s.userId)
      .first<{ email: string; full_name: string; company_name: string; vat_number: string; country_code: string }>();
    if (buyer) {
      const origin = new URL(req.url).origin;
      const link = `${origin}/invoice/${boostId}`;
      void sendMail(env, buyer.email, "فاتورتك الضريبية — NEXUS B2B",
        mailShell(`فاتورة ${tier.name}`, "فوترتك الضريبية الرسمية جاهزة — قابلة للطباعة PDF من متصفح شركتك.", "عرض الفاتورة", link));
    }
  }
  return json({ ok: true, boost_id: boostId, tier: tier.name, expires_in_hours: tier.hours, free_grant: freeGrant,
    invoice_id: charged > 0 ? boostId : null, gift_used: price - charged }, 201);
}

// ——— الفاتورة الضريبية (مالك التعزيز فقط) — إعلان مبدئي حسب أوروبا ———
export async function invoice(req: Request, env: Env, s: Session, p: Record<string, string>): Promise<Response> {
  if (!s.userId) return json({ error: "auth_required" }, 401);
  const b = await env.DB.prepare(
    `SELECT b.id, b.tier_name, b.amount_paid_cents, b.created_at, u.full_name, u.email, u.company_name, u.vat_number, u.country_code
     FROM boosts b JOIN users u ON u.id=b.user_id WHERE b.id=? AND b.user_id=?`
  ).bind(p.id, s.userId).first<{ id: string; tier_name: string; amount_paid_cents: number; created_at: string; full_name: string; email: string; company_name: string; vat_number: string; country_code: string }>();
  if (!b) return json({ error: "not_found" }, 404);
  // v0.10: فاتورة على المال الحقيقي فقط — الدفع من رصيد داخلي/منحة = بلا فاتورة
  const paid = await env.DB.prepare(
    "SELECT COALESCE(SUM(amount_cents),0) AS c FROM transactions WHERE ref_type='BOOST' AND ref_id=?"
  ).bind(p.id).first<{ c: number }>();
  const realPaid = -(paid?.c ?? 0);
  if (realPaid <= 0) return json({ error: "no_invoice" }, 404);
  const net = (realPaid / 100).toFixed(2);
  const vatNote = b.country_code && !["DE", "AT", "CH", "FR"].includes(b.country_code)
    ? "Reverse Charge — VAT to be accounted for by the recipient (Art. 196 EU VAT Directive)"
    : "VAT excluded — prices exclude VAT where applicable";
  const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><title>Invoice ${b.id}</title>
<style>body{font-family:sans-serif;color:#111;max-width:720px;margin:40px auto;padding:0 20px}h1{font-size:20px}.box{border:1px solid #ddd;border-radius:10px;padding:18px;margin:14px 0}table{width:100%;border-collapse:collapse;margin-top:10px}td,th{padding:10px;border-bottom:1px solid #eee;text-align:left}button{background:#10b981;color:#03130c;border:0;padding:12px 26px;border-radius:10px;font-weight:800;cursor:pointer}@media print{button{display:none}}</style></head>
<body>
<h1>NEXUS B2B — VitoByte Studio</h1>
<div class="box"><b>Tax Invoice</b><br/>Invoice №: INV-${esc(b.id.toUpperCase())}<br/>Date: ${esc(b.created_at.slice(0, 10))}<br/>
Billed to: ${esc(b.company_name || b.full_name)} (${esc(b.email)})${b.vat_number ? `<br/>VAT ID: ${esc(b.vat_number)}` : ""}${b.country_code ? `<br/>Country: ${esc(b.country_code)}` : ""}</div>
<table><tr><th>Service</th><th>Amount</th></tr>
<tr><td>${esc(b.tier_name)} — Targeted Lead Reach (B2B advertising)</td><td>€${net}</td></tr>
<tr><td colspan="2" style="color:#555;font-size:13px">${vatNote} · Provider VAT ID: to be assigned upon entity registration</td></tr></table>
<button onclick="window.print()">🖨 Print / Save as PDF</button>
</body></html>`;
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
}

export async function wallet(env: Env, s: Session): Promise<Response> {
  if (!s.userId) return json({ error: "auth_required" }, 401);
  const bal = await env.DB.prepare("SELECT COALESCE(SUM(amount_cents),0) AS b FROM transactions WHERE user_id=?")
    .bind(s.userId).first<{ b: number }>();
  const gift = await env.DB.prepare(
    "SELECT COALESCE(SUM(remaining_cents),0) AS g, MIN(expires_at) AS exp FROM credit_grants WHERE user_id=? AND status='ACTIVE' AND expires_at > datetime('now')"
  ).bind(s.userId).first<{ g: number; exp: string | null }>();
  const tx = await env.DB.prepare(
    "SELECT kind, amount_cents, ref_type, created_at FROM transactions WHERE user_id=? ORDER BY created_at DESC LIMIT 20"
  ).bind(s.userId).all();
  return json({ balance_cents: (bal?.b ?? 0) + (gift?.g ?? 0), gift_cents: gift?.g ?? 0, gift_expires_at: gift?.exp ?? null,
    transactions: tx.results ?? [], catalog: Object.values(BOOST_CATALOG) });
}
