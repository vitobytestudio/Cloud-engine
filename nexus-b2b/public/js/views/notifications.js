// ——— الإشعارات: نبض الشبكة — تفاعل فوري بجرس حي ———
import { api, fmtN } from "../api.js";
import { t } from "../i18n.js";

const kindText = (k) =>
  ({ like: "n_like", save: "n_save", follow: "n_follow", sample: "n_sample", sample_ok: "n_sample_ok", sample_no: "n_sample_no", message: "n_message", gift: "n_gift", bot_offer: "n_bot_offer", weekly_summary: "wk_summary" }[k] ?? "n_like");

export async function renderNotifications(view) {
  view.innerHTML = `<div class="page"><div class="spin"></div></div>`;
  const r = await api.get("/api/notifications");
  const items = r.data.items ?? [];
  view.innerHTML = `
    <div class="page notif-page">
      <div class="page-head">
        <button class="back-btn" data-back aria-label="${t("back")}"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M15 5l-7 7 7 7"/></svg></button>
        <div><h2>${t("notif_title")}</h2></div>
      </div>
      <div class="notif-list">
        ${items.length ? items.map((n) => {
          const href = n.ref_type === "conversation" || n.kind === "message"
            ? `#/chat/${n.ref_id}`
            : `#/profile/${n.actor_username ?? ""}`;
          return `
          <a class="notif-row ${n.is_read ? "" : "fresh"}" href="${href}">
            <span class="who-avatar" style="background:url(/api/avatar/${n.actor_username ?? ""}) center/cover, ${n.actor_color ?? "#1a1a22"}">${(n.actor_name ?? "?").trim()[0]}</span>
            <div class="minw0">
              ${n.kind === "weekly_summary" ? `<b>${t("wk_summary")}</b>` : `<b>${n.actor_name ?? "—"}</b> <span>${t(kindText(n.kind))}</span>`}
              <small>${(n.created_at ?? "").slice(0, 16).replace("T", " ")}</small>
            </div>
            <span class="notif-ic">${kindIcon(n.kind)}</span>
          </a>`;
        }).join("") : `<div class="empty">${t("notif_empty")}</div>`}
      </div>
    </div>`;
  view.querySelector("[data-back]").addEventListener("click", () => (location.hash = "#/feed"));
  if (r.data.unread > 0) {
    await api.post("/api/notifications/read");
    const dot = document.getElementById("notif-dot");
    if (dot) dot.hidden = true;
  }
}

function kindIcon(k) {
  const svg = {
    like: `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#ff3b5c" stroke-width="2"><path d="M12 20.5c-5.2-3.1-8.5-6-8.5-9.8A4.7 4.7 0 0 1 12 7.6a4.7 4.7 0 0 1 8.5 3.1c0 3.8-3.3 6.7-8.5 9.8Z"/></svg>`,
    save: `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="var(--gold)" stroke-width="2"><path d="M6 3.8h12v17l-6-4.4-6 4.4z" stroke-linejoin="round"/></svg>`,
    follow: `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="var(--blue)" stroke-width="2"><circle cx="9" cy="8" r="3.4"/><path d="M2.8 20a6.2 6.2 0 0 1 12.4 0M17 8v6M20 11h-6" stroke-linecap="round"/></svg>`,
    gift: `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="var(--gold)" stroke-width="2" stroke-linejoin="round"><rect x="4" y="9.5" width="16" height="11" rx="1.5"/><path d="M3.5 6.5h17v3h-17zM12 6.5V20.5M12 6.5c-1.8 0-4.5-.7-4.5-2.6C7.5 2.6 9 2 10 2.4c1.3.5 2 2.4 2 4.1Zm0 0c1.8 0 4.5-.7 4.5-2.6C16.5 2.6 15 2 14 2.4c-1.3.5-2 2.4-2 4.1Z"/></svg>`,
    bot_offer: `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="var(--blue)" stroke-width="2" stroke-linecap="round"><rect x="5" y="8" width="14" height="10" rx="2.5"/><path d="M12 8V4.5M9.5 13h.01M14.5 13h.01M2.8 12.5v3M21.2 12.5v3"/></svg>`,
    weekly_summary: `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="var(--emerald)" stroke-width="2" stroke-linecap="round"><path d="M4 20V14M10 20V9M16 20V4.5"/></svg>`,
  };
  return svg[k] ?? `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="var(--emerald)" stroke-width="2"><path d="m4.5 12.5 5 5 10-11" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}
