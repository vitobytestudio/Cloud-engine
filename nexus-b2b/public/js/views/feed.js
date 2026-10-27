// ——— الفيد V2: تفاعل تفاؤلي فوري، ازدواج النقر = إعجاب، تحميل مسبق، نبض لمسي ———
import { api, state, toast, fmtN } from "../api.js";
import { t } from "../i18n.js";
import { openBoost } from "./boost.js";
import { requireAuth } from "./authsheet.js";

const CATS = ["ALL", "PRODUCT_DEMO", "REVENUE_WIN", "WORKFLOW_HACK", "CASE_STUDY", "SHOWCASE"];

let cat = "ALL";
let observer = null;
let viewedOnce = new Set();
const buzz = (ms = 12) => { try { navigator.vibrate?.(ms); } catch {} };

export async function renderFeed(view) {
  viewedOnce = new Set();
  view.innerHTML = `
    <div class="reels-wrap" id="reels">
      <div class="stories-bar skeleton" id="stories-bar" style="height:70px"></div>
      <div class="cat-chips" id="cat-chips">
        ${CATS.map((c) => `<button class="cat-chip ${c === cat ? "on" : ""}" data-cat="${c}">${t("cat_" + c)}</button>`).join("")}
      </div>
    </div>`;

  document.querySelectorAll(".cat-chip").forEach((b) =>
    b.addEventListener("click", async () => {
      if (cat === b.dataset.cat) return;
      cat = b.dataset.cat;
      document.querySelectorAll(".cat-chip").forEach((x) => x.classList.toggle("on", x === b));
      buzz(8);
      await loadReels(true);
    })
  );

  loadStories();
  await loadReels(true);
  setupObserver();
  heartbeat();
  loadPulse();
}

// ——— نبض الشبكة: حركة عالمية حية أعلى الفيد ———
async function loadPulse() {
  const r = await api.get("/api/pulse");
  if (!r.ok) return;
  const bar = document.createElement("div");
  bar.className = "pulse-bar";
  bar.id = "pulse-bar";
  wrap()?.insertBefore(bar, wrap()?.firstChild);
  const evs = r.data.events ?? [];
  if (!evs.length) return;
  const fmt = (e) => {
    const c = e.c ? ` · ${e.c}` : "";
    const ago = e.mins >= 60 ? `${Math.round(e.mins / 60)}h` : `${e.mins}m`;
    if (e.kind === "join") return `${t("pulse_join").replace("{n}", e.n)}${c} · ${ago}`;
    if (e.kind === "deal") return `${t("pulse_deal").replace("{n}", e.n).replace("{a}", "€" + fmtN((e.amt ?? 0) / 100))}${c} · ${ago}`;
    return `${t("pulse_post").replace("{n}", e.n)}${c} · ${ago}`;
  };
  let i = 0;
  const tick = () => {
    if (!document.getElementById("pulse-bar")) return;
    const el = document.getElementById("pulse-bar");
    el.classList.remove("show");
    setTimeout(() => {
      if (!document.getElementById("pulse-bar")) return;
      el.textContent = `${fmt(evs[i % evs.length])}  —  ${fmtN(r.data.members)} ${t("members_lbl")} · ${r.data.countries} ${t("countries_lbl")}`;
      el.classList.add("show");
      i++;
    }, 260);
  };
  tick();
  setInterval(tick, 3400);
}

const wrap = () => document.getElementById("reels");

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
  bar.classList.remove("skeleton");
  const groups = r.data.groups ?? [];
  bar.style.height = "";
  bar.innerHTML = groups
    .map(
      (g, i) => `
      <button class="story-orb ${g.all_seen ? "seen" : ""}" data-i="${i}">
        <span class="story-ring"><div style="background:url(/api/avatar/${g.user.username}) center/cover, ${g.user.avatar_color}">${(g.user.full_name ?? "?").trim()[0]}</div></span>
        <small>${g.user.full_name}</small>
      </button>`
    )
    .join("");
  bar.querySelectorAll(".story-orb").forEach((b) =>
    b.addEventListener("click", () => { buzz(8); openStoryViewer(groups[+b.dataset.i]); })
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
          <span class="who-avatar" style="background:url(/api/avatar/${grp.user.username}) center/cover, ${grp.user.avatar_color};width:34px;height:34px;font-size:13px">${(grp.user.full_name ?? "?")[0]}</span>
          <b style="font-size:13px">${grp.user.full_name}</b>
        </div>
        <div class="story-caption">${st.caption ?? ""}</div>
        <button class="story-close ghost-btn">${t("lang_name") === "العربية" ? "إغلاق" : "Close"}</button>
      </div>`;
    const cur = root.querySelector(".story-progress i b");
    cur?.animate([{ width: "0%" }, { width: "100%" }], { duration: 8000, fill: "forwards" });
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
  if (reset) {
    wrap.querySelectorAll(".reel").forEach((el) => el.remove());
    for (let i = 0; i < 3; i++) {
      const sk = document.createElement("div");
      sk.className = "reel skel";
      wrap.appendChild(sk);
    }
  }
  const offset = reset ? 0 : wrap.querySelectorAll(".reel:not(.skel)").length;
  const r = await api.get(`/api/feed?category=${cat}&offset=${offset}&limit=5`);
  wrap.querySelectorAll(".reel.skel").forEach((el) => el.remove());
  const items = r.data.items ?? [];
  for (const p of items) wrap.appendChild(reelEl(p));
  setupObserver();
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
        <a class="who-avatar" style="background:url(/api/avatar/${p.username}) center/cover, ${p.avatar_color}" href="#/profile/${p.username}">${(p.full_name ?? "?").trim()[0]}</a>
        <div>
          <div class="who-name">
            <a href="#/profile/${p.username}">${p.full_name}</a>
            <span class="badge ${p.badge_tier}">${p.badge_tier === "FREE" ? (p.sector || "").slice(0, 3) : ""}</span>
          </div>
          <div class="who-sub">${p.company_name || p.username} · <span class="n-views">${fmtN(p.views_count)}</span> ${t("views")}</div>
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
      <button class="rail-btn like ${p.liked ? "on" : ""}" data-act="like">
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
      <button class="rail-btn" data-act="share" aria-label="${t("share")}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M8 6.5 12 3l4 3.5"/><path d="M5 11v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8"/></svg>
        <small>${t("share")}</small>
      </button>
      ${p.is_boosted ? "" : `<button class="rail-btn boost" data-act="boost">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M13 2 4.5 13.5H11L9.5 22 19 10h-6.5L13 2Z" stroke-linejoin="round"/></svg>
        <small>Boost</small>
      </button>`}
    </div>`;

  const vid = el.querySelector("video");
  let lastTap = 0, singleT = null;

  el.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-act]");
    if (e.target.closest("a") || e.target.closest(".reel-meta a")) return;
    if (btn) return act(el, p, btn.dataset.act);
    // ازدواج النقر = إعجاب بفرقعة قلب · النقرة المفردة = كتم/تشغيل الصوت
    const now = Date.now();
    if (now - lastTap < 320) {
      clearTimeout(singleT);
      lastTap = 0;
      heartBurst(el, e);
      likeOn(el, p, true);
      return;
    }
    lastTap = now;
    clearTimeout(singleT);
    singleT = setTimeout(() => {
      vid.muted = !vid.muted;
      const pill = document.createElement("div");
      pill.className = "mute-pill";
      pill.textContent = vid.muted ? "🔇" : "🔊";
      el.appendChild(pill);
      setTimeout(() => pill.remove(), 950);
    }, 330);
  });
  return el;
}

function heartBurst(el, e) {
  const rect = el.getBoundingClientRect();
  const x = (e.clientX || rect.width / 2) - rect.left;
  const y = (e.clientY || rect.height / 2) - rect.top;
  const h = document.createElement("div");
  h.className = "heart-burst";
  h.textContent = "❤";
  h.style.left = `${x - 48}px`;
  h.style.top = `${y - 48}px`;
  el.appendChild(h);
  setTimeout(() => h.remove(), 900);
}

function likeOn(el, p, force) {
  const btn = el.querySelector(".like");
  const was = btn.classList.contains("on");
  if (force && was) return; // مُعجب مسبقاً
  btn.classList.add("pop");
  setTimeout(() => btn.classList.remove("pop"), 520);
  const n = el.querySelector(".n-likes");
  n.textContent = fmtN((parseInt(n.textContent.replace(/,/g, "")) || 0) + (was ? 0 : 1));
  btn.classList.add("on");
  buzz(18);
  api.post(`/api/posts/${p.id}/vote`, { vote: 1 }).then((res) => {
    if (!res.ok && res.status === 401) { requireAuth(); }
    else if (res.ok) n.textContent = fmtN(res.data.likes);
  });
}

async function act(el, p, act_) {
  if (act_ === "boost") return openBoost(p, () => loadReels(true));
  if (act_ === "share") {
    const { shareLink } = await import("./profile.js");
    return shareLink(`${location.origin}/post/${p.id}`, p.title);
  }
  // تفاؤلي فوري: الواجهة أولاً — الخادم يلحق
  if (!state.user) {
    const ok = await requireAuth();
    if (!ok) return;
  }
  if (act_ === "like") {
    const btn = el.querySelector(".like");
    const was = btn.classList.contains("on");
    const n = el.querySelector(".n-likes");
    const cur = parseInt(n.textContent.replace(/,/g, "")) || 0;
    btn.classList.toggle("on", !was);
    btn.classList.add("pop");
    setTimeout(() => btn.classList.remove("pop"), 520);
    n.textContent = fmtN(cur + (was ? -1 : 1));
    buzz(was ? 6 : 16);
    const res = await api.post(`/api/posts/${p.id}/vote`, { vote: was ? 0 : 1 });
    if (!res.ok) { btn.classList.toggle("on", was); n.textContent = fmtN(cur); }
    else n.textContent = fmtN(res.data.likes);
  } else if (act_ === "down") {
    const btn = el.querySelector(".down");
    const was = btn.classList.contains("on");
    btn.classList.toggle("on", !was);
    buzz(10);
    const res = await api.post(`/api/posts/${p.id}/vote`, { vote: was ? 0 : -1 });
    if (res.ok && !was) toast(t("lang_name") === "العربية" ? "شكراً — نظام الجودة يراجع" : "Thanks — quality system notified");
    if (!res.ok) btn.classList.toggle("on", was);
  } else if (act_ === "save") {
    const btn = el.querySelector("[data-act=save]");
    const was = btn.classList.contains("on");
    const n = el.querySelector(".n-saves");
    const cur = parseInt(n.textContent.replace(/,/g, "")) || 0;
    btn.classList.toggle("on", !was);
    btn.classList.add("pop");
    setTimeout(() => btn.classList.remove("pop"), 520);
    n.textContent = fmtN(cur + (was ? -1 : 1));
    buzz(12);
    const res = await api.post(`/api/posts/${p.id}/save`);
    if (!res.ok) { btn.classList.toggle("on", was); n.textContent = fmtN(cur); }
    else n.textContent = fmtN(cur + (res.data.saved ? 1 : -1));
  }
}

function setupObserver() {
  observer?.disconnect();
  const wrap = document.getElementById("reels");
  if (!wrap) return;
  const reels = wrap.querySelectorAll(".reel:not(.skel)");
  const io = new IntersectionObserver(
    (entries) => {
      for (const en of entries) {
        const v = en.target.querySelector("video");
        const id = en.target.dataset.id;
        if (en.intersectionRatio > 0.6) {
          if ((localStorage.getItem("nx_autoplay") ?? "on") === "on") v?.play().catch(() => {});
          if (!viewedOnce.has(id)) {
            viewedOnce.add(id);
            setTimeout(() => { if (document.contains(en.target)) api.post(`/api/posts/${id}/view`); }, 3000);
          }
          // تحميل مسبق للمقطع التالي = صفر انتظار عند التمرير
          const nxt = en.target.nextElementSibling?.querySelector("video");
          if (nxt && nxt.preload !== "auto") nxt.preload = "auto";
        } else v?.pause();
      }
    },
    { root: wrap, threshold: [0, 0.6] }
  );
  reels.forEach((el) => io.observe(el));
  observer = io;
}
