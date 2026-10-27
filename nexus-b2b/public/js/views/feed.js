// ——— الفيد العمودي: تمرير خاطف، تشغيل ذكي، تفاعل، أفق 24 ساعة ———
import { api, state, toast, fmtN } from "../api.js";
import { t } from "../i18n.js";
import { openBoost } from "./boost.js";
import { requireAuth } from "./authsheet.js";

const CATS = ["ALL", "PRODUCT_DEMO", "REVENUE_WIN", "WORKFLOW_HACK", "CASE_STUDY", "SHOWCASE"];

let cat = "ALL";
let observed = new Map();
let viewedOnce = new Set();

export async function renderFeed(view) {
  viewedOnce = new Set();
  view.innerHTML = `
    <div class="reels-wrap" id="reels">
      <div class="stories-bar" id="stories-bar"></div>
      <div class="cat-chips" id="cat-chips">
        ${CATS.map((c) => `<button class="cat-chip ${c === cat ? "on" : ""}" data-cat="${c}">${t("cat_" + c)}</button>`).join("")}
      </div>
    </div>`;

  document.querySelectorAll(".cat-chip").forEach((b) =>
    b.addEventListener("click", async () => {
      cat = b.dataset.cat;
      document.querySelectorAll(".cat-chip").forEach((x) => x.classList.toggle("on", x === b));
      await loadReels(true);
    })
  );

  loadStories();
  await loadReels(true);
  setupObserver();
  heartbeat();
}

function heartbeat() {
  api.post("/api/presence");
  api.get("/api/presence").then((r) => {
    const el = document.getElementById("online-n");
    if (el) el.textContent = r.data.online ?? "—";
  });
}

async function loadStories() {
  const r = await api.get("/api/stories");
  const bar = document.getElementById("stories-bar");
  if (!bar) return;
  const groups = r.data.groups ?? [];
  bar.innerHTML = groups
    .map(
      (g, i) => `
      <button class="story-orb ${g.all_seen ? "seen" : ""}" data-i="${i}">
        <span class="story-ring"><div style="background:${g.user.avatar_color}">${(g.user.full_name ?? "?").trim()[0]}</div></span>
        <small>${g.user.full_name}</small>
      </button>`
    )
    .join("");
  bar.querySelectorAll(".story-orb").forEach((b) =>
    b.addEventListener("click", () => openStoryViewer(groups[+b.dataset.i]))
  );
}

function storyViewer(groups, gi) {
  let g = gi, item = 0;
  const root = document.getElementById("overlay-root");
  function close() { root.innerHTML = ""; }
  function render() {
    const grp = groups[g];
    const st = grp.items[item];
    root.innerHTML = `
      <div class="story-viewer">
        <video src="${st.playback_url}" autoplay playsinline></video>
        <div class="story-progress">${grp.items.map((_, j) => `<i class="${j < item ? "done" : ""}"><b></b></i>`).join("")}</div>
        <div class="story-head">
          <span class="who-avatar" style="background:${grp.user.avatar_color};width:34px;height:34px;font-size:13px">${(grp.user.full_name ?? "?")[0]}</span>
          <b style="font-size:13px">${grp.user.full_name}</b>
        </div>
        <div class="story-caption">${st.caption ?? ""}</div>
        <button class="story-close ghost-btn">${t("lang_name") === "العربية" ? "إغلاق" : "Close"}</button>
      </div>`;
    const cur = root.querySelector(".story-progress i b");
    if (cur) {
      cur.animate([{ width: "0%" }, { width: "100%" }], { duration: 8000, fill: "forwards" });
    }
    api.post(`/api/stories/${st.id}/view`);
    const timer = setTimeout(next, 8000);
    function next() {
      clearTimeout(timer);
      if (item + 1 < grp.items.length) { item++; render(); }
      else if (g + 1 < groups.length) { g++; item = 0; render(); }
      else close();
    }
    root.querySelector(".story-close").addEventListener("click", close);
    root.querySelector(".story-viewer").addEventListener("click", (e) => {
      if (e.target.closest("button")) return;
      next();
    });
  }
  render();
}
export function openStoryViewer(group) { storyViewer([group], 0); }

async function loadReels(reset) {
  const wrap = document.getElementById("reels");
  if (!wrap) return;
  if (reset) wrap.querySelectorAll(".reel").forEach((el) => el.remove());
  const offset = wrap.querySelectorAll(".reel").length;
  const r = await api.get(`/api/feed?category=${cat}&offset=${offset}&limit=5`);
  const items = r.data.items ?? [];
  for (const p of items) wrap.appendChild(reelEl(p));
}

function reelEl(p) {
  const el = document.createElement("section");
  el.className = "reel";
  el.dataset.id = p.id;
  const why = { boost: "why_boost", sector: "why_sector", fresh: "why_fresh", top: "why_top" }[p.reason] ?? "why_top";
  el.innerHTML = `
    <video src="${p.playback_url}" poster="${p.thumbnail_url}" loop muted playsinline preload="${p.reason === "boost" ? "auto" : "metadata"}"></video>
    <div class="shade"></div>
    ${p.is_boosted ? `<span class="boost-ribbon">${t("why_boost")}</span>` : ""}
    <div class="reel-meta">
      <div class="who-row">
        <a class="who-avatar" style="background:${p.avatar_color}" href="#/profile/${p.username}">${(p.full_name ?? "?").trim()[0]}</a>
        <div>
          <div class="who-name">
            <a href="#/profile/${p.username}">${p.full_name}</a>
            <span class="badge ${p.badge_tier}">${p.badge_tier === "FREE" ? (p.sector || "").slice(0, 3) : ""}</span>
          </div>
          <div class="who-sub">${p.company_name || p.username} · ${fmtN(p.views_count)} ${t("views")}</div>
        </div>
      </div>
      <div class="reel-title">${p.title}</div>
      ${p.description ? `<div class="reel-desc">${p.description}</div>` : ""}
      <div class="reel-tags">
        <span class="chip cat">${t("cat_" + p.category_tag)}</span>
        ${p.artifact_type ? `<a class="chip artifact" href="${p.artifact_url}" target="_blank" rel="noopener noreferrer">${t("art_" + p.artifact_type)}</a>` : ""}
        <button class="chip why" data-why>${t(why)}</button>
      </div>
    </div>
    <div class="action-rail">
      <button class="rail-btn like" data-act="like">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 20.5c-5.2-3.1-8.5-6-8.5-9.8A4.7 4.7 0 0 1 12 7.6a4.7 4.7 0 0 1 8.5 3.1c0 3.8-3.3 6.7-8.5 9.8Z"/></svg>
        <small class="n-likes">${fmtN(p.likes_count)}</small>
      </button>
      <button class="rail-btn" data-act="save">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M6 3.8h12v17l-6-4.4-6 4.4z" stroke-linejoin="round"/></svg>
        <small class="n-saves">${fmtN(p.saves_count)}</small>
      </button>
      <button class="rail-btn down" data-act="down">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="9"/><path d="M8.5 11.5h7M12 8.5v6" transform="rotate(45 12 12)"/></svg>
        <small>${t("novalue")}</small>
      </button>
      ${p.is_boosted ? "" : `<button class="rail-btn boost" data-act="boost">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M13 2 4.5 13.5H11L9.5 22 19 10h-6.5L13 2Z" stroke-linejoin="round"/></svg>
        <small>Boost</small>
      </button>`}
    </div>`;

  const vid = el.querySelector("video");
  el.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-act]");
    const link = e.target.closest("a");
    if (link) return;
    if (btn) return act(el, p, btn.dataset.act);
    vid.muted = !vid.muted;
  });
  return el;
}

async function act(el, p, act_) {
  if (act_ === "boost") return openBoost(p, () => loadReels(true));
  const r = await requireAuth();
  if (!r) return;
  if (act_ === "like") {
    const was = el.querySelector(".like").classList.contains("on");
    const res = await api.post(`/api/posts/${p.id}/vote`, { vote: was ? 0 : 1 });
    if (res.ok) {
      el.querySelector(".like").classList.toggle("on", !was);
      el.querySelector(".n-likes").textContent = fmtN(res.data.likes);
    }
  } else if (act_ === "down") {
    const was = el.querySelector(".down").classList.contains("on");
    const res = await api.post(`/api/posts/${p.id}/vote`, { vote: was ? 0 : -1 });
    if (res.ok) {
      el.querySelector(".down").classList.toggle("on", !was);
      if (!was) toast(t("lang_name") === "العربية" ? "شكراً — يراجع نظام الجودة هذا المحتوى" : "Thanks — quality system notified");
    }
  } else if (act_ === "save") {
    const res = await api.post(`/api/posts/${p.id}/save`);
    if (res.ok) el.querySelector("[data-act=save]").classList.toggle("on", res.data.saved);
  }
}

function setupObserver() {
  observed.forEach((h) => h.disconnect());
  observed = new Map();
  const wrap = document.getElementById("reels");
  if (!wrap) return;
  const io = new IntersectionObserver(
    (entries) => {
      for (const en of entries) {
        const v = en.target.querySelector("video");
        const id = en.target.dataset.id;
        if (en.intersectionRatio > 0.6) {
          v?.play().catch(() => {});
          if (!viewedOnce.has(id)) {
            viewedOnce.add(id);
            setTimeout(() => { if (document.contains(en.target)) api.post(`/api/posts/${id}/view`); }, 3000);
          }
        } else v?.pause();
      }
    },
    { root: wrap, threshold: [0, 0.6] }
  );
  wrap.querySelectorAll(".reel").forEach((el) => io.observe(el));
  observed.set("main", io);
}
