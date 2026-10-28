// ——— صفحة المنشورات الساكنة والصور: الستوريات أعلاها ثم شبكة الصور ———
import { api, fmtN, state, toast, confirmSheet } from "../api.js";
import { t } from "../i18n.js";
import { openStoryViewer, storiesBarData } from "./feed.js";

export async function renderPostsPage(view) {
  view.innerHTML = `
    <div class="page photos-page">
      <div class="stories-bar" id="ph-stories"></div>
      <div class="photos-head">
        <div><h2>${t("gallery_title")}</h2><div class="sub">${t("gallery_sub")}</div></div>
        <button class="mini-btn2" id="ph-add" aria-label="${t("create_post")}"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg></button>
      </div>
      <div id="ph-grid"><div class="spin"></div></div>
    </div>`;

  loadBar();
  const r = await api.get("/api/gallery");
  const items = r.data.items ?? [];
  const grid = view.querySelector("#ph-grid");
  if (!items.length) {
    grid.innerHTML = `<div class="empty">${t("gallery_empty")}<br /><button class="cta" id="ph-empty-add" style="margin-top:14px">${t("create_post")}</button></div>`;
  } else {
    grid.innerHTML = `<div class="grid3">${items.map((p) => `
      <div class="tile">
        <a href="#/post/${p.id}">
          <img src="${p.thumbnail_url || p.playback_url}" loading="lazy" alt="" />
          <span class="pv">${p.full_name} · ${fmtN(p.likes_count)} ♥</span>
        </a>
        ${state.user?.id === p.user_id ? `<button class="tile-del" data-del="${p.id}" aria-label="${t("del_post")}"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg></button>` : ""}
      </div>`).join("")}</div>`;
    grid.querySelectorAll("[data-del]").forEach((b) =>
      b.addEventListener("click", async (e) => {
        e.preventDefault();
        if (!(await confirmSheet(t("confirm_del"), t("confirm_del_s"), t("del_post")))) return;
        const r2 = await api.del(`/api/posts/${b.dataset.del}`);
        if (r2.ok) { toast(t("deleted_ok")); renderPostsPage(view); }
        else toast(t("err_generic"));
      }));
  }
  const goCreate = () => import("./create.js").then((m) => m.openCreateSheet("post"));
  view.querySelector("#ph-add")?.addEventListener("click", goCreate);
  view.querySelector("#ph-empty-add")?.addEventListener("click", goCreate);
}

async function loadBar() {
  const bar = document.getElementById("ph-stories");
  if (!bar) return;
  const groups = await storiesBarData();
  if (!groups.length) { bar.innerHTML = `<div class="empty" style="padding:6px 2px">${t("stories_empty")}</div>`; return; }
  bar.innerHTML = groups
    .map((g, i) => `
      <button class="story-orb ${g.all_seen ? "seen" : ""}" data-i="${i}">
        <span class="story-ring"><div style="background:url(/api/avatar/${g.user.username}) center/cover, ${g.user.avatar_color}">${(g.user.full_name ?? "?").trim()[0]}</div></span>
        <small>${g.user.full_name}</small>
      </button>`)
    .join("");
  bar.querySelectorAll(".story-orb").forEach((b) => b.addEventListener("click", () => openStoryViewer(groups[+b.dataset.i])));
}
