// ——— v0.10-B: الشارات — تحقق أزرق نمط إنستغرام + تاج الملكية + تاج المالك الوحيد ———
import { state } from "../api.js";

const checkSvg = `<svg viewBox="0 0 24 24" width="15" height="15"><circle cx="12" cy="12" r="10" fill="#3897F0"/><path d="m7.5 12.5 3 3 6-7" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const crownSvg = `<svg viewBox="0 0 24 24" width="16" height="16"><path d="M3 8.2 7.6 12 12 5.4 16.4 12 21 8.2l-1.7 9.3H4.7L3 8.2Z" fill="#E5A93C" stroke="#B78420" stroke-width=".8" stroke-linejoin="round"/><circle cx="12" cy="4.6" r="1.3" fill="#E5A93C"/></svg>`;
const ownerCrown = `<svg viewBox="0 0 24 24" width="17" height="17"><path d="M3 8.2 7.6 12 12 5.4 16.4 12 21 8.2l-1.7 9.3H4.7L3 8.2Z" fill="url(#og)" stroke="#8a6210" stroke-width=".9" stroke-linejoin="round"/><defs><linearGradient id="og" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFE9A8"/><stop offset="1" stop-color="#D99A1F"/></linearGradient></defs><circle cx="12" cy="4.4" r="1.5" fill="#FFE9A8"/><path d="M12 3v1.4" stroke="#FFE9A8" stroke-width="1" stroke-linecap="round"/></svg>`;

// u: { username, badge_tier }
export function badgeFor(u) {
  if (!u) return "";
  if (state.ownerUsername && u.username === state.ownerUsername)
    return `<span class="b-ic owner-crown" title="NEXUS — المالك" aria-label="المالك">${ownerCrown}</span>`;
  if (u.badge_tier === "ENTERPRISE_GOLD")
    return `<span class="b-ic crown" title="شارة الملكية — الذهبية" aria-label="ذهبي">${crownSvg}</span>`;
  if (u.badge_tier === "MERCHANT_EMERALD" || u.badge_tier === "PRO_TALENT")
    return `<span class="b-ic vrf" title="حساب مدفوع موثق" aria-label="موثق">${checkSvg}</span>`;
  return "";
}

export const supporterEmblem = `<svg viewBox="0 0 24 24" width="14" height="14"><path d="M12 21s-7.5-4.6-9.5-9C1 8.5 3 5 6.5 5c2.2 0 3.9 1.3 5.5 3.2C13.6 6.3 15.3 5 17.5 5 21 5 23 8.5 21.5 12c-2 4.4-9.5 9-9.5 9Z" fill="#8B5CF6"/><path d="M12 8.2v9" stroke="#EDE9FE" stroke-width="1.4" stroke-linecap="round"/></svg>`;
export const shieldSvg = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#38BDF8" stroke-width="1.8"><path d="M12 3l7 2.8v5.4c0 4.6-3 8.4-7 9.8-4-1.4-7-5.2-7-9.8V5.8L12 3Z" stroke-linejoin="round"/><path d="m9 12 2 2 4-4.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
