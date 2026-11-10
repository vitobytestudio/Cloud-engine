// ——— NAKSAB × BaridiMob — القارئ المؤتمت (نائم بأمان بلا أسرار) + المطابق الصارم ———
// قانون المالك: لا AI في الدفع، لا SMS، لا تصديق كلام المستخدم — الحقيقة من المصدر حصراً.
// القواعد: تطابق المبلغ بالدينار + المرجع داخل وسم الحوالة + نافذة 10 دقائق + استهلاك أحادي.
import type { Env } from "./env";

export type RawTransfer = { id: string; amount: number; label: string; ts: number };
export type PendingOrder = { id: string; reference: string; amount_dzd: number; created_at: number };
export type MatchResult = { ok: boolean; why: string };

export const WINDOW_MS = 10 * 60_000;

export function baridiConfigured(env: Env): boolean {
  return !!(env.BARIDI_USER && env.BARIDI_PASS && env.BARIDI_ANSWER);
}

export function ccpConfigured(env: Env): boolean {
  return !!env.CCP_PAY && /^[0-9]{10,20}:[0-9]{1,3}$/.test(env.CCP_PAY.trim());
}
export function ccpParts(env: Env): { rip: string; cle: string } | null {
  const v = (env.CCP_PAY ?? "").trim();
  if (!/^[0-9]{10,20}:[0-9]{1,3}$/.test(v)) return null;
  const [rip, cle] = v.split(":");
  return { rip: rip!, cle: cle! };
}

/** توحيد وسم الحوالة: حروف كبيرة بلا فراغات ولا شرطات — لمطابقة المرجع بأي تنسيق لصق */
export function normLabel(s: string): string {
  return String(s ?? "").toUpperCase().replace(/[\s\-_.]/g, "");
}

/** المطابق الصارم — كل قاعدة تفشل برسالة سبب واضحة تذهب لسجل المراجعة */
export function matchTransfer(t: RawTransfer, o: PendingOrder): MatchResult {
  if (!Number.isFinite(t.amount) || t.amount !== o.amount_dzd)
    return { ok: false, why: `amount:${t.amount}!=${o.amount_dzd}` };
  if (t.ts < o.created_at || t.ts > o.created_at + WINDOW_MS)
    return { ok: false, why: `window:${t.ts}` };
  if (!normLabel(t.label).includes(normLabel(o.reference)))
    return { ok: false, why: "reference_missing" };
  return { ok: true, why: "matched" };
}

/** أول طلب يطابق الحوالة — إعادة استخدام الحوالة تُكسر بقيود provider_ref UNIQUE في القاعدة */
export function pickMatch(t: RawTransfer, orders: PendingOrder[]): PendingOrder | null {
  for (const o of orders) if (matchTransfer(t, o).ok) return o;
  return null;
}

/**
 * جامع الحوالات من موقع بريد الجزائر (بريدي موب ويب) — يحتاج أسرار المالك الثلاثة.
 * نائم كلياً بلا أسرار؛ وعند توفرها: أي عائق شبكة/تغيير واجهة = {ok:false} — لا قيد أبداً على بيانات ناقصة.
 * المرجّع (Parser) معزول هنا وحده: أول تشغيل حقيقي يوثق صيغة الاستجابة في financial_audit ويُحسَن من دون مساس بالمطابق.
 */
export async function collectTransfers(env: Env): Promise<{ ok: boolean; transfers?: RawTransfer[]; error?: string }> {
  if (!baridiConfigured(env)) return { ok: false, error: "not_configured" };
  const base = String(env.BARIDI_ENDPOINT || "https://app.baridimob.nc").replace(/\/$/, "");
  try {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), 15000);
    const login = await fetch(`${base}/api/authenticate`, {
      method: "POST",
      signal: ac.signal,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username: env.BARIDI_USER, password: env.BARIDI_PASS, secretAnswer: env.BARIDI_ANSWER }),
    });
    if (!login.ok) { clearTimeout(timer); return { ok: false, error: `login:${login.status}` }; }
    const lj: any = await login.json().catch(() => null);
    const token = lj?.token || lj?.access_token || lj?.jwt;
    if (!token) { clearTimeout(timer); return { ok: false, error: "no_token" }; }
    const ops = await fetch(`${base}/api/operations?limit=20`, {
      signal: ac.signal,
      headers: { authorization: `Bearer ${token}` },
    });
    clearTimeout(timer);
    if (!ops.ok) return { ok: false, error: `ops:${ops.status}` };
    const oj: any = await ops.json().catch(() => null);
    const rows: any[] = Array.isArray(oj) ? oj : Array.isArray(oj?.operations) ? oj.operations : [];
    const transfers: RawTransfer[] = rows
      .filter((r) => r && (r.credit ?? r.montantCredit ?? r.amount) != null)
      .map((r, i) => ({
        id: String(r.id ?? r.reference ?? `t${i}-${r.date ?? ""}`),
        amount: Math.round(Number(r.credit ?? r.montantCredit ?? r.amount)),
        label: String(r.label ?? r.libelle ?? r.description ?? ""),
        ts: Number(r.date ?? r.timestamp ?? 0) || 0,
      }))
      .filter((t) => t.amount > 0);
    return { ok: true, transfers };
  } catch (e) {
    return { ok: false, error: `collect:${String(e).slice(0, 120)}` };
  }
}
