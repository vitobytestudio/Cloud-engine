// ——— الملف الشخصي: شارات متوهجة + تبويبات القطاع + المحفظة ———
import { api, state, fmtEur, fmtN, toast } from "../api.js";
import { t } from "../i18n.js";
import { requireAuth } from "./authsheet.js";

export async function renderProfile(view, username) {
  const uname = username || state.user?.username;
  if (!uname) {
    const ok = await requireAuth();
    if (!ok) { location.hash = "#/feed"; return; }
    return renderProfile(view, state.user.username);
  }
  view.innerHTML = `<div class="spin"></div>`;
  const r = await api.get(`/api/profile/${uname}`);
  if (!r.ok) { view.innerHTML = `<div class="empty">${t("err_generic")}</div>`; return; }
  const u = r.data.user;
  const isSelf = r.data.is_self;

  const ctaKey = { FOUNDER: "cta_founder", MERCHANT: "cta_merchant", FREELANCER: "cta_freelancer" }[u.sector];
  const tabs = u.sector === "MERCHANT"
    ? [["reels", "pf_reels"], ["items", "pf_products"], ...(isSelf ? [["wallet", "pf_wallet"]] : [])]
    : u.sector === "FREELANCER"
      ? [["reels", "pf_reels"], ["items", "pf_services"], ...(isSelf ? [["wallet", "pf_wallet"]] : [])]
      : [["reels", "pf_reels"], ...(isSelf ? [["wallet", "pf_wallet"]] : [])];

  view.innerHTML = `
    <div class="pf-head">
      <div class="pf-top">
        <div class="pf-ava" style="background:${u.avatar_color}">${(u.full_name ?? "?").trim()[0]}</div>
        <div class="pf-names">
          <h2>${u.full_name} <span class="badge ${u.badge_tier}">${u.badge_tier.replace("_", " ")}</span></h2>
          <div class="sub">@${u.username}${u.company_name ? " · " + u.company_name : ""}${u.country_code ? " · " + u.country_code : ""}</div>
        </div>
      </div>
      ${u.bio ? `<div class="pf-bio">${u.bio}</div>` : ""}
      <div class="rep">
        <div class="lbl"><span>${t("rep_score")}</span><b>${u.reputation_score}</b></div>
        <div class="bar"><b style="width:${Math.min(100, (u.reputation_score / 200) * 100)}%"></b></div>
      </div>
      <div class="pf-stats">
        <div class="pf-stat"><b>${fmtN((r.data.posts ?? []).reduce((a, p) => a + (p.views_count ?? 0), 0))}</b><span>${t("views")}</span></div>
        <div class="pf-stat"><b>${(r.data.posts ?? []).length}</b><span>${t("pf_reels")}</span></div>
        <div class="pf-stat"><b>${u.sector === "MERCHANT" ? (r.data.products ?? []).length : u.sector === "FREELANCER" ? (r.data.services ?? []).length : "—"}</b><span>${u.sector === "MERCHANT" ? t("pf_products") : u.sector === "FREELANCER" ? t("pf_services") : "B2B"}</span></div>
      </div>
      ${isSelf
        ? `<a class="cta ghost" href="#/studio">${t("studio_title")}</a>`
        : `<div class="pf-cta"><button class="cta" id="contact-btn">${t(ctaKey)}</button></div>`}
    </div>
    <div class="pf-tabs">${tabs.map(([id, k], i) => `<button class="pf-tab ${i === 0 ? "on" : ""}" data-tab="${id}">${t(k)}</button>`).join("")}</div>
    <div class="pf-body" id="pf-body"></div>`;

  const body = view.querySelector("#pf-body");
  function draw(tab) {
    if (tab === "reels") {
      body.innerHTML = (r.data.posts ?? []).length
        ? `<div class="grid3">${(r.data.posts ?? []).map((p) => `
            <a href="#/feed" data-post="${p.id}">
              <img src="${p.thumbnail_url || "/media/poster1.jpg"}" loading="lazy" alt="" />
              <span class="pv">${fmtN(p.views_count)} · ${t("cat_" + p.category_tag)}</span>
            </a>`).join("")}</div>`
        : `<div class="empty">${t("no_conv")}</div>`;
    } else if (tab === "items") {
      const rows = u.sector === "MERCHANT"
        ? (r.data.products ?? []).map((pr) => `
            <div class="item-row">
              <span><b>${pr.title}</b><small>${t("sample_available")}: ${pr.sample_available ? "✓" : "—"} · ${fmtN(pr.inventory_count)}</small></span>
              <span class="price">${fmtEur(pr.price_cents)}</span>
            </div>`)
        : (r.data.services ?? []).map((sv) => `
            <div class="item-row">
              <span><b>${sv.service_title}</b><small>${t("delivery")}: ${sv.delivery_days} ${t("days")} · ${sv.rate_unit}</small></span>
              <span class="price">${fmtEur(sv.starting_price_cents)}</span>
            </div>`);
      body.innerHTML = rows.length ? rows.join("") : `<div class="empty">—</div>`;
    } else if (tab === "wallet") {
      drawWallet(body);
    }
  }
  view.querySelectorAll(".pf-tab").forEach((b) =>
    b.addEventListener("click", () => {
      view.querySelectorAll(".pf-tab").forEach((x) => x.classList.toggle("on", x === b));
      draw(b.dataset.tab);
    })
  );
  draw(tabs[0][0]);

  const contact = view.querySelector("#contact-btn");
  contact?.addEventListener("click", async () => {
    if (!(await requireAuth())) return;
    const rr = await api.post(`/api/chat/open/${u.username}`);
    if (rr.ok) location.hash = `#/chat/${rr.data.id}`;
    else if (rr.data.error === "daily_limit") toast(t("err_locked"));
    else toast(t("err_generic"));
  });
}

async function drawWallet(body) {
  const r = await api.get("/api/wallet");
  body.innerHTML = `
    <div class="balance-line"><span>${t("balance")}</span><b style="color:var(--emerald);font-size:16px">${fmtEur(r.data.balance_cents)}</b></div>
    ${(r.data.transactions ?? []).map((tx) => `
      <div class="tx-row ${tx.amount_cents >= 0 ? "amt-plus" : "amt-minus"}">
        <span>${t("tx_" + tx.kind)}<br /><small style="color:var(--text-faint)">${(tx.created_at ?? "").slice(0, 16)}</small></span>
        <b>${tx.amount_cents >= 0 ? "+" : ""}${fmtEur(tx.amount_cents)}</b>
      </div>`).join("")}`;
}
