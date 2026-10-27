// ——— البريد الحقيقي: Resend — يعمل لحظة إضافة المفتاح، ويتلاشى بنعومة بدونه ———
import type { Env } from "../env";

export const mailReady = (env: Env) => !!env.RESEND_API_KEY;

export async function sendMail(env: Env, to: string, subject: string, html: string): Promise<boolean> {
  if (!env.RESEND_API_KEY) return false;
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, "content-type": "application/json" },
      body: JSON.stringify({ from: env.ENVIRONMENT === "production" ? "NEXUS B2B <noreply@vitobytestudio.com>" : "NEXUS B2B <onboarding@resend.dev>", to, subject, html }),
    });
    return r.ok;
  } catch {
    return false;
  }
}

export const mailShell = (title: string, body: string, cta: string, link: string) => `
<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:28px;background:#0b0b10;color:#e9e9ee;border-radius:16px">
  <div style="font-size:20px;font-weight:800;color:#10b981;margin-bottom:14px">NEXUS <span style="color:#e5a93c">B2B</span></div>
  <h2 style="font-size:17px;margin:0 0 10px">${title}</h2>
  <p style="color:#b9b9c4;font-size:14px;line-height:1.9">${body}</p>
  <a href="${link}" style="display:inline-block;margin-top:16px;background:#10b981;color:#04110b;font-weight:700;padding:12px 26px;border-radius:12px;text-decoration:none">${cta}</a>
  <p style="color:#55555f;font-size:11px;margin-top:22px">إن لم تطلب هذا البريد تجاهله بأمان — رابطك ينتهي تلقائياً.</p>
</div>`;

const page = (title: string, msg: string, ok: boolean) => `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /><title>${title}</title><style>body{background:#070709;color:#e9e9ee;font-family:sans-serif;display:grid;place-items:center;min-height:100dvh;margin:0}div{text-align:center;padding:34px}h1{font-size:22px}p{color:#9a9aa6}a{color:#10b981}</style></head><body><div><h1>${ok ? "✅" : "⚠️"} ${title}</h1><p>${msg}</p><a href="/#/feed">العودة إلى NEXUS</a></div></body></html>`;
export const htmlPage = page;
