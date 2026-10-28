// ——— صفحة المنشور المستقلة: مشغّد كامل بصوت، صاحب المنشور، إحصاءات وتفاعل حقيقي ———
import { api, state, toast, fmtN, confirmSheet } from "../api.js";
import { badgeFor } from "../lib/badges.js";
import { t } from "../i18n.js";
import { openBoost } from "./boost.js";
import { requireAuth } from "./authsheet.js";

const buzz = (ms = 12) => { try { navigator.vibrate?.(ms); } catch {} };
let soundOn = localStorage.getItem("nx_sound") === "1";

export async function renderPost(view, id) {
  view.innerHTML = `<div class="spin"></div>`;
  const r = await api.get(`/api/posts/${id}`);
  const p = r.data;
  const backSvg = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M15 5l-7 7 7 7"/></svg>`;
  if (!r.ok || !p?.id) {
    view.innerHTML = `
      <div class="page post-view">
        <div class="page-head"><button class="back-btn" data-back aria-label="${t("back")}">${backSvg}</button><div><h2>${t("post_title")}</h2></div></div>
        <div class="empty">${t("post_not_found")}</div>
      </div>`;
    view.querySelector("[data-back]")?.addEventListener("click", () => (location.hash = "#/feed"));
    return;
  }
  const sndSvg = `<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6.5 8.5H3v7h3.5L11 19V5Z"/><path class="snd-on" d="M15.5 8.5a5 5 0 0 1 0 7"/><path class="snd-on" d="M18.2 6a9 9 0 0 1 0 12"/><path class="snd-off" d="m16 9.5 5 5m0-5-5 5"/></svg>`;
  const likeSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 20.5c-5.2-3.1-8.5-6-8.5-9.8A4.7 4.7 0 0 1 12 7.6a4.7 4.7 0 0 1 8.5 3.1c0 3.8-3.3 6.7-8.5 9.8Z"/></svg>`;
  const saveSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M6 3.8h12v17l-6-4.4-6 4.4z" stroke-linejoin="round"/></svg>`;
  const shareSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M8 6.5 12 3l4 3.5"/><path d="M5 11v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8"/></svg>`;
  const boostSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M13 2 4.5 13.5H11L9.5 22 19 10h-6.5L13 2Z" stroke-linejoin="round"/></svg>`;
  view.innerHTML = `
    <div class="page post-view">
      <div class="page-head">
        <button class="back-btn" data-back aria-label="${t("back")}">${backSvg}</button>
        <div class="minw0"><h2 class="pv-h2">${p.title}</h2><div class="sub">${t("cat_" + p.category_tag)}${p.is_boosted ? " · " + t("why_boost") : ""}</div></div>
      </div>
      <div class="post-hero">
        ${p.media_kind === "IMAGE"
          ? `<img src="${p.playback_url}" alt="${p.title}" decoding="async" />`
          : `<video src="${p.playback_url}" poster="${p.thumbnail_url}" loop playsinline preload="auto" disablepictureinpicture decoding="async"></video><button class="snd-btn ${soundOn ? "" : "off"}" id="pv-snd" aria-label="sound">${sndSvg}</button>`}
      </div>
      <div class="pv-author">
        <a class="who-avatar" style="background:url(/api/avatar/${p.username}) center/cover, ${p.avatar_color}" href="#/profile/${p.username}">${(p.full_name ?? "?").trim()[0]}</a>
        <div class="minw0">
          <div class="who-name"><a href="#/profile/${p.username}">${p.full_name}</a>${badgeFor(p)}<span class="badge ${p.badge_tier}">${p.badge_tier === "FREE" ? (p.sector || "").slice(0, 3) : ""}</span></div>
          <div class="who-sub">${p.company_name || "@" + p.username}</div>
        </div>
        ${p.is_self ? `<span class="chip cat">${t("post_yours")}</span>` : `<button class="cta ghost" id="pv-follow">${t("follow")}</button>`}
      </div>
      ${p.description ? `<p class="pv-desc">${p.description}</p>` : ""}
      ${p.artifact_type ? `<a class="chip artifact" href="${p.artifact_url}" target="_blank" rel="noopener noreferrer">${t("art_" + p.artifact_type)}</a>` : ""}
      <div class="pv-stats">
        <div><b>${fmtN(p.views_count)}</b><small>${t("views")}</small></div>
        <div><b class="sl">${fmtN(p.likes_count)}</b><small>${t("like")}</small></div>
        <div><b class="ss">${fmtN(p.saves_count)}</b><small>${t("save")}</small></div>
      </div>
      <div class="pv-actions">
        <button class="rail-btn like ${p.liked ? "on" : ""}" id="pv-like">${likeSvg}<small class="nl">${fmtN(p.likes_count)}</small></button>
        <button class="rail-btn ${p.saved ? "on" : ""}" id="pv-save">${saveSvg}<small class="ns">${fmtN(p.saves_count)}</small></button>
        <button class="rail-btn" id="pv-share">${shareSvg}<small>${t("share")}</small></button>
        ${p.is_self
          ? `<button class="rail-btn boost" id="pv-boost">${boostSvg}<small>Boost</small></button><button class="rail-btn" id="pv-del" aria-label="${t("del_post")}"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M4 7h16M9 7V5h6v2m-8 0 .7 12.2A1.8 1.8 0 0 0 9.5 21h5a1.8 1.8 0 0 0 1.8-1.8L17 7"/></svg><small>${t("del_post")}</small></button>`
          : `<button class="cta" id="pv-contact">${t("contact_pub")}</button>`}
      </div>
    </div>`;

  const vid = view.querySelector(".post-hero video");
  if (vid) {
    vid.muted = !soundOn;
    vid.play().catch(() => {});
  }
  view.querySelector("#pv-snd")?.addEventListener("click", () => {
    soundOn = !soundOn;
    localStorage.setItem("nx_sound", soundOn ? "1" : "0");
    if (vid) vid.muted = !soundOn;
    view.querySelector("#pv-snd")?.classList.toggle("off", !soundOn);
    document.querySelectorAll(".snd-btn").forEach((b) => { if (b.id !== "pv-snd") b.classList.toggle("off", !soundOn); });
    buzz(8);
  });
  view.querySelector("[data-back]")?.addEventListener("click", () => (location.hash = "#/feed"));

  view.querySelector("#pv-like")?.addEventListener("click", async () => {
    if (!(await requireAuth())) return;
    const btn = view.querySelector("#pv-like");
    const was = btn.classList.contains("on");
    const nl = btn.querySelector(".nl");
    const sl = view.querySelector(".sl");
    const cur = parseInt(nl.textContent.replace(/,/g, "")) || 0;
    btn.classList.toggle("on", !was);
    btn.classList.add("pop");
    setTimeout(() => btn.classList.remove("pop"), 520);
    nl.textContent = fmtN(cur + (was ? -1 : 1));
    sl.textContent = fmtN(cur + (was ? -1 : 1));
    buzz(was ? 6 : 16);
    const res = await api.post(`/api/posts/${id}/vote`, { vote: was ? 0 : 1 });
    if (!res.ok) { btn.classList.toggle("on", was); nl.textContent = fmtN(cur); sl.textContent = fmtN(cur); }
    else { nl.textContent = fmtN(res.data.likes); sl.textContent = fmtN(res.data.likes); }
  });

  view.querySelector("#pv-save")?.addEventListener("click", async () => {
    if (!(await requireAuth())) return;
    const btn = view.querySelector("#pv-save");
    const was = btn.classList.contains("on");
    const ns = btn.querySelector(".ns");
    const ss = view.querySelector(".ss");
    const cur = parseInt(ns.textContent.replace(/,/g, "")) || 0;
    btn.classList.toggle("on", !was);
    ns.textContent = fmtN(cur + (was ? -1 : 1));
    ss.textContent = fmtN(cur + (was ? -1 : 1));
    buzz(12);
    const res = await api.post(`/api/posts/${id}/save`);
    if (!res.ok) { btn.classList.toggle("on", was); ns.textContent = fmtN(cur); ss.textContent = fmtN(cur); }
    else { ns.textContent = fmtN(cur + (res.data.saved ? 1 : -1)); ss.textContent = fmtN(cur + (res.data.saved ? 1 : -1)); }
  });

  view.querySelector("#pv-share")?.addEventListener("click", async () => {
    const { shareLink } = await import("./profile.js");
    shareLink(`${location.origin}/post/${id}`, p.title);
  });

  view.querySelector("#pv-boost")?.addEventListener("click", () => openBoost(p, () => renderPost(view, id)));

  view.querySelector("#pv-del")?.addEventListener("click", async () => {
    if (!(await confirmSheet(t("confirm_del"), t("confirm_del_s"), t("del_post")))) return;
    const r2 = await api.del(`/api/posts/${id}`);
    if (r2.ok) { toast(t("deleted_ok")); location.hash = "#/profile"; }
    else toast(t("err_generic"));
  });

  view.querySelector("#pv-contact")?.addEventListener("click", async () => {
    if (!(await requireAuth())) return;
    const rr = await api.post(`/api/chat/open/${p.username}`);
    if (rr.ok) location.hash = `#/chat/${rr.data.id}`;
    else if (rr.data?.error === "daily_limit") toast(t("err_locked"));
    else toast(t("err_generic"));
  });

  view.querySelector("#pv-follow")?.addEventListener("click", async () => {
    if (!(await requireAuth())) return;
    const res = await api.post(`/api/follow/${p.username}`);
    if (res.ok) view.querySelector("#pv-follow").textContent = res.data.following ? t("unfollow") : t("follow");
  });
}
