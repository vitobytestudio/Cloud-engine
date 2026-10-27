// ——— الملف الشخصي: شارات متوهجة + تبويبات القطاع + المحفظة ———
import { api, state, fmtEur, fmtN, toast } from "../api.js";
import { t } from "../i18n.js";
import { requireAuth } from "./authsheet.js";
import { openProfileEditor } from "./settings.js";

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
    ? [["reels", "pf_reels"], ["items", "pf_products"], ...(isSelf ? [["samples", "samples_tab"], ["wallet", "pf_wallet"]] : [])]
    : u.sector === "FREELANCER"
      ? [["reels", "pf_reels"], ["items", "pf_services"], ...(isSelf ? [["wallet", "pf_wallet"]] : [])]
      : [["reels", "pf_reels"], ...(isSelf ? [["wallet", "pf_wallet"]] : [])];

  view.innerHTML = `
    <div class="pf-head">
      <div class="pf-top">
        <div class="pf-ava" style="background:url(/api/avatar/${u.username}) center/cover, ${u.avatar_color}">${(u.full_name ?? "?").trim()[0]}</div>
        <div class="pf-names">
          <h2>${u.full_name} <span class="badge ${u.badge_tier}">${u.badge_tier.replace("_", " ")}</span>${r.data.founding ? `<span class="chip founding">${t("founding_badge")}</span>` : ""}</h2>
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
        <div class="pf-stat"><b>${fmtN(r.data.followers_count ?? 0)}</b><span>${t("followers")}</span></div>
        <div class="pf-stat"><b>${fmtN(r.data.following_count ?? 0)}</b><span>${t("following_lbl")}</span></div>
        <div class="pf-stat"><b>${u.sector === "MERCHANT" ? (r.data.products ?? []).length : u.sector === "FREELANCER" ? (r.data.services ?? []).length : "—"}</b><span>${u.sector === "MERCHANT" ? t("pf_products") : u.sector === "FREELANCER" ? t("pf_services") : "B2B"}</span></div>
      </div>
      ${isSelf
        ? `<div class="pf-cta-row">
             <a class="cta ghost grow" href="#/studio">${t("studio_title")}</a>
             <a class="icon-tile" href="#/plans" aria-label="${t("plans_title")}"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 8l4 4 5-6 5 6 4-4v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke-linejoin="round"/></svg></a>
             <a class="icon-tile" href="#/analytics" aria-label="${t("analytics_title")}"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 20V10M10 20V4M16 20v-7M21 20H3"/></svg></a>
             <button class="icon-tile" id="edit-tile" aria-label="${t("profile_edit")}"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="m14.5 5.5 4 4L8 20l-5 1 1-5 10.5-10.5ZM13 7l4 4"/></svg></button>
             <a class="icon-tile" href="#/settings" aria-label="${t("settings_title")}"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="3.2"/><path d="M19.4 13a7.6 7.6 0 0 0 0-2l2.1-1.6-2-3.5-2.5 1a7.6 7.6 0 0 0-1.7-1L15 3.2h-4l-.3 2.7a7.6 7.6 0 0 0-1.7 1l-2.5-1-2 3.5L6.6 11a7.6 7.6 0 0 0 0 2l-2.1 1.6 2 3.5 2.5-1a7.6 7.6 0 0 0 1.7 1l.3 2.7h4l.3-2.7a7.6 7.6 0 0 0 1.7-1l2.5 1 2-3.5-2.1-1.6Z" stroke-linejoin="round"/></svg></a>
           </div>`
        : `<div class="pf-cta"><button class="cta" id="contact-btn">${t(ctaKey)}</button><button class="cta ghost" id="follow-btn">${r.data.is_following ? t("unfollow") : t("follow")}</button><button class="icon-tile" id="pf-share" aria-label="${t("share")}"><svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M8 6.5 12 3l4 3.5"/><path d="M5 11v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8"/></svg></button></div>`}
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
      const addBtn = isSelf
        ? `<button class="mini-btn add-item" id="add-item">＋ ${u.sector === "MERCHANT" ? t("add_product") : t("add_service")}</button>`
        : "";
      const delBtn = (id) => isSelf ? `<button class="mini-btn danger" data-del="${id}">×</button>` : "";
      const list = u.sector === "MERCHANT"
        ? (r.data.products ?? []).map((pr) => `
            <div class="item-row">
              <span><b>${pr.title}</b><small>${t("sample_available")}: ${pr.sample_available ? "✓" : "—"} · ${fmtN(pr.inventory_count)}</small></span>
              <span class="row-end">${!isSelf && pr.sample_available ? `<button class="mini-btn" data-sample="${pr.id}">${t("sample_req")}</button>` : ""}${delBtn(pr.id)}<span class="price">${fmtEur(pr.price_cents)}</span></span>
            </div>`)
        : (r.data.services ?? []).map((sv) => `
            <div class="item-row">
              <span><b>${sv.service_title}</b><small>${t("delivery")}: ${sv.delivery_days} ${t("days")} · ${sv.rate_unit}</small></span>
              <span class="row-end">${delBtn(sv.id)}<span class="price">${fmtEur(sv.starting_price_cents)}</span></span>
            </div>`);
      body.innerHTML = addBtn + (list.length ? list.join("") : `<div class="empty">—</div>`);
      body.querySelector("#add-item")?.addEventListener("click", () =>
        u.sector === "MERCHANT" ? openProductForm(() => renderProfile(view, username)) : openServiceForm(() => renderProfile(view, username)));
      body.querySelectorAll("[data-del]").forEach((b) =>
        b.addEventListener("click", async () => {
          const kind = u.sector === "MERCHANT" ? "products" : "services";
          const rr = await api.request(`/api/account/${kind}/${b.dataset.del}`, { method: "DELETE" });
          if (rr.ok) { toast(t("item_deleted")); renderProfile(view, username); } else toast(t("err_generic"));
        }));
    } else if (tab === "samples") {
      drawSamples(body);
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

  view.querySelector("#edit-tile")?.addEventListener("click", () => openProfileEditor(() => renderProfile(view, username)));
  view.querySelector("#pf-share")?.addEventListener("click", () => shareLink(`${location.origin}/p/${u.username}`, u.full_name));
  view.querySelector("#follow-btn")?.addEventListener("click", async (e) => {
    const btn = e.currentTarget;
    const res = await api.post(`/api/follow/${u.username}`);
    if (res.ok) { btn.textContent = res.data.following ? t("unfollow") : t("follow"); btn.classList.toggle("ghost", res.data.following); }
    else toast(t("err_generic"));
  });
  body.addEventListener("click", async (e) => {
    const sbtn = e.target.closest("[data-sample]");
    if (!sbtn) return;
    const res = await api.post(`/api/samples/${sbtn.dataset.sample}`);
    if (res.ok) { sbtn.disabled = true; sbtn.textContent = "✓"; toast(t("sample_req_ok")); }
    else if (res.data?.error === "already_requested") { sbtn.disabled = true; sbtn.textContent = "✓"; }
    else toast(t("err_generic"));
  });

  async function drawSamples(el) {
    const res = await api.get("/api/samples/incoming");
    if (res.data?.locked) {
      el.innerHTML = `<div class="lock-card"><span class="lock-ic"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="5" y="10.5" width="14" height="10" rx="3"/><path d="M8.5 10V7.5a3.5 3.5 0 0 1 7 0V10"/></svg></span><h3>${t("samples_locked")}</h3><p>${t("samples_locked_s")}</p><a class="cta" href="#/plans">${t("see_plans")}</a></div>`;
      return;
    }
    const rows = res.data?.items ?? [];
    el.innerHTML = rows.length ? rows.map((s) => `
      <div class="item-row">
        <span><b>${s.requester_name}</b><small>${s.product_title} · ${(s.created_at ?? "").slice(0, 10)}</small></span>
        <span class="row-end">${s.status === "PENDING"
          ? `<button class="mini-btn" data-sr-yes="${s.id}">${t("samples_accept")}</button><button class="mini-btn danger" data-sr-no="${s.id}">${t("samples_decline")}</button>`
          : `<span class="badge FREE">${s.status === "ACCEPTED" ? "✓" : "—"}</span>`}</span>
      </div>`).join("") : `<div class="empty">${t("samples_empty")}</div>`;
    el.querySelectorAll("[data-sr-yes],[data-sr-no]").forEach((b) =>
      b.addEventListener("click", async () => {
        const rr = await api.post(`/api/samples/action/${b.dataset.srYes || b.dataset.srNo}`, { action: b.dataset.srYes ? "accept" : "decline" });
        if (rr.ok) drawSamples(el); else toast(t("err_generic"));
      })
    );
  }

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


// ——— نموذجا الإضافة: منتج التاجر وباقة المستقل ———
function itemSheet(inner) {
  const root = document.getElementById("overlay-root");
  root.innerHTML = `<div class="backdrop" id="if-bk"></div><div class="sheet">${inner}</div>`;
  root.querySelector("#if-bk").addEventListener("click", () => (root.innerHTML = ""));
  return root;
}
function openProductForm(onDone) {
  const root = itemSheet(`
    <h3>${t("add_product")}</h3>
    <label class="pe-f"><span>${t("item_title")}</span><input id="if-title" maxlength="80" /></label>
    <div style="display:flex;gap:10px">
      <label class="pe-f" style="flex:1"><span>${t("price_eur")}</span><input id="if-price" type="number" min="1" /></label>
      <label class="pe-f" style="flex:1"><span>${t("inventory")}</span><input id="if-inv" type="number" min="0" value="0" /></label>
    </div>
    <label class="pe-f" style="flex-direction:row;align-items:center;gap:9px"><input type="checkbox" id="if-sample" checked style="width:18px;height:18px" /><span>${t("sample_avail")}</span></label>
    <div style="display:flex;gap:9px;margin-top:6px"><button class="cta" id="if-go">${t("add_item")}</button><button class="cta ghost" id="if-x">${t("decline")}</button></div>`);
  root.querySelector("#if-x").addEventListener("click", () => (root.innerHTML = ""));
  root.querySelector("#if-go").addEventListener("click", async () => {
    const eur = parseFloat(root.querySelector("#if-price").value || "0");
    const rr = await api.post("/api/account/products", {
      title: root.querySelector("#if-title").value,
      price_cents: Math.round(eur * 100),
      inventory_count: parseInt(root.querySelector("#if-inv").value || "0"),
      sample_available: root.querySelector("#if-sample").checked,
    });
    if (rr.ok) { root.innerHTML = ""; toast(t("item_added")); onDone?.(); } else toast(t("err_generic"));
  });
}
function openServiceForm(onDone) {
  const root = itemSheet(`
    <h3>${t("add_service")}</h3>
    <label class="pe-f"><span>${t("item_title")}</span><input id="if-title" maxlength="80" /></label>
    <div style="display:flex;gap:10px">
      <label class="pe-f" style="flex:1"><span>${t("price_eur")}</span><input id="if-price" type="number" min="1" /></label>
      <label class="pe-f" style="flex:1"><span>${t("delivery_days_lbl")}</span><input id="if-days" type="number" min="1" max="90" value="3" /></label>
    </div>
    <label class="pe-f"><span>${t("rate_lbl")}</span>
      <select id="if-rate"><option value="PROJECT">${t("rate_project")}</option><option value="HOURLY">${t("rate_hourly")}</option></select></label>
    <div style="display:flex;gap:9px;margin-top:6px"><button class="cta" id="if-go">${t("add_item")}</button><button class="cta ghost" id="if-x">${t("decline")}</button></div>`);
  root.querySelector("#if-x").addEventListener("click", () => (root.innerHTML = ""));
  root.querySelector("#if-go").addEventListener("click", async () => {
    const eur = parseFloat(root.querySelector("#if-price").value || "0");
    const rr = await api.post("/api/account/services", {
      service_title: root.querySelector("#if-title").value,
      starting_price_cents: Math.round(eur * 100),
      delivery_days: parseInt(root.querySelector("#if-days").value || "3"),
      rate_unit: root.querySelector("#if-rate").value,
    });
    if (rr.ok) { root.innerHTML = ""; toast(t("item_added")); onDone?.(); } else toast(t("err_generic"));
  });
}

// ——— مشاركة غنية: Web Share ثم نسخ احتياطي ———
export async function shareLink(url, title) {
  try {
    if (navigator.share) { await navigator.share({ title: title ?? "NEXUS B2B", url }); return; }
  } catch {}
  try { await navigator.clipboard.writeText(url); }
  catch {
    const ta = document.createElement("textarea");
    ta.value = url; document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); } catch {}
    ta.remove();
  }
  toast(t("link_copied"));
}
