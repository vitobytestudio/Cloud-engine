// ——— استوديو NEXUS: محرر فيديو داخل المنصة (قصّ + نص + ستيكرز + موسيقى) ثم نشر ———
// كل المعالجة في متصفح المستخدم: صفر خوادم، صفر مكتبات موسيقى (العضو يستورد ملفه الخاص)
import { api, state, toast, xhrUpload } from "../api.js";
import { compressVideo, progressSheet } from "../lib/media.js";
import { t } from "../i18n.js";
import { requireAuth } from "./authsheet.js";
import { openBoost } from "./boost.js";
import { invalidateStories } from "./feed.js";

const CATS = ["PRODUCT_DEMO", "REVENUE_WIN", "WORKFLOW_HACK", "CASE_STUDY", "SHOWCASE"];
const ARTS = ["GITHUB_REPO", "FIGMA_FILE", "STORE_LINK", "AUDIT_DOC", "CASE_METRIC"];
const STICKERS = ["🔥", "💎", "👑", "⚡", "🎯", "📈", "💡", "✅", "🚀", "💰", "⭐", "🤝"];
const COLORS = ["#ffffff", "#10B981", "#E5A93C", "#3B82F6", "#EF4444", "#000000"];
const canEdit = typeof MediaRecorder !== "undefined" && !!HTMLCanvasElement.prototype.captureStream;

export async function renderStudio(view) {
  if (!state.user) {
    const ok = await requireAuth();
    if (!ok) { location.hash = "#/feed"; return; }
  }
  view.innerHTML = `
    <div class="studio-wrap">
      <h3 style="font-size:17px">${t("studio_title")}</h3>
      <div class="studio-preview" id="prev">
        <span class="empty" style="padding:10px">${t("studio_pick")}<br />${t("studio_or")}</span>
      </div>
      <label class="drop" for="vid-file"><b>${t("studio_pick")}</b><br />MP4 · MOV · WEBM — 20MB</label>
      <input type="file" id="vid-file" accept="video/*,.mp4,.webm,.mov" />
      <p class="hint">${canEdit ? t("editor_available") : t("editor_unavailable")}</p>
    </div>`;

  const fileInput = view.querySelector("#vid-file");
  fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) return toast("20MB max");
    if (canEdit) openEditor(view, file);
    else openPublish(view, file);
  });
}

// ═══════════ المحرر ═══════════
function openEditor(view, file) {
  const url = URL.createObjectURL(file);
  const layers = [];
  let trimS = 0, trimE = 0, dur = 0, selected = null;
  let music = null; // {buffer, name, vol, start}

  view.innerHTML = `
    <div class="studio-wrap">
      <h3 style="font-size:17px">${t("editor_title")}</h3>
      <div class="ed-stage" id="ed-stage">
        <video id="ed-vid" src="${url}" muted playsinline loop></video>
        <div id="ed-layers"></div>
      </div>
      <div class="ed-trim">
        <label>${t("trim_from")} <b id="ts-l">0.0s</b></label>
        <input type="range" id="tr-s" min="0" max="100" value="0" />
        <label>${t("trim_to")} <b id="te-l">0.0s</b></label>
        <input type="range" id="tr-e" min="0" max="100" value="100" />
      </div>
      <div class="ed-tools">
        <button class="ed-tool" id="t-text">✍️ ${t("ed_text")}</button>
        <button class="ed-tool" id="t-stick">✨ ${t("ed_sticker")}</button>
        <button class="ed-tool" id="t-music">🎵 ${t("ed_music")}</button>
        <button class="ed-tool danger" id="t-del" style="display:none">🗑 ${t("ed_delete")}</button>
      </div>
      <div id="ed-panel"></div>
      <div class="ed-actions">
        <button class="cta ghost" id="ed-skip">${t("ed_skip")}</button>
        <button class="cta" id="ed-go">🎬 ${t("ed_export")}</button>
      </div>
      <div class="ed-progress" id="ed-prog" style="display:none"><i id="ed-bar"></i><span id="ed-plbl">0%</span></div>
    </div>`;

  const vid = view.querySelector("#ed-vid");
  const layersEl = view.querySelector("#ed-layers");
  const stage = view.querySelector("#ed-stage");
  const panel = view.querySelector("#ed-panel");

  vid.addEventListener("loadedmetadata", () => {
    dur = Math.min(vid.duration || 0, 300);
    trimE = Math.min(dur, 60);
    syncTrim();
  });
  function syncTrim() {
    view.querySelector("#tr-s").value = dur ? (trimS / dur) * 100 : 0;
    view.querySelector("#tr-e").value = dur ? (trimE / dur) * 100 : 100;
    view.querySelector("#ts-l").textContent = `${trimS.toFixed(1)}s`;
    view.querySelector("#te-l").textContent = `${trimE.toFixed(1)}s`;
  }
  view.querySelector("#tr-s").addEventListener("input", (e) => {
    trimS = Math.min((+e.target.value / 100) * dur, trimE - 0.5);
    syncTrim();
  });
  view.querySelector("#tr-e").addEventListener("input", (e) => {
    trimE = Math.max((+e.target.value / 100) * dur, trimS + 0.5);
    syncTrim();
  });

  // ——— طبقات: سحب بالإصبع ———
  function drawLayers() {
    layersEl.innerHTML = layers.map((l) => `
      <div class="ed-layer ${selected === l.id ? "sel" : ""}" data-id="${l.id}"
        style="left:${l.x * 100}%;top:${l.y * 100}%;font-size:${l.size}px;${l.type === "text" ? `color:${l.color};font-weight:700;text-shadow:0 2px 10px rgba(0,0,0,.6);white-space:pre-wrap` : ""}">${l.type === "text" ? l.text : l.emoji}</div>`).join("");
    view.querySelector("#t-del").style.display = selected ? "inline-flex" : "none";
    layersEl.querySelectorAll(".ed-layer").forEach((el) => {
      el.addEventListener("pointerdown", (e) => {
        selected = el.dataset.id;
        const l = layers.find((z) => z.id === selected);
        const r = stage.getBoundingClientRect();
        const sx = e.clientX, sy = e.clientY, ox = l.x, oy = l.y;
        const move = (ev) => {
          l.x = Math.min(1, Math.max(0, ox + (ev.clientX - sx) / r.width));
          l.y = Math.min(1, Math.max(0, oy + (ev.clientY - sy) / r.height));
          el.style.left = `${l.x * 100}%`;
          el.style.top = `${l.y * 100}%`;
        };
        const up = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); drawLayers(); };
        window.addEventListener("pointermove", move);
        window.addEventListener("pointerup", up);
      });
    });
  }

  view.querySelector("#t-text").addEventListener("click", () => {
    const l = { id: crypto.randomUUID().slice(0, 6), type: "text", text: t("ed_your_text"), color: "#ffffff", size: 30, x: 0.5, y: 0.5 };
    layers.push(l); selected = l.id; drawLayers();
    panel.innerHTML = `
      <div class="ed-panel">
        <input id="p-text" maxlength="80" value="${l.text}" />
        <div class="pe-colors">${COLORS.map((c) => `<button data-c="${c}" class="${c === l.color ? "on" : ""}" style="background:${c}"></button>`).join("")}</div>
        <label class="ed-size">${t("ed_size")}: <b id="p-size-l">${l.size}</b><input type="range" id="p-size" min="14" max="72" value="${l.size}" /></label>
      </div>`;
    panel.querySelector("#p-text").addEventListener("input", (e) => { l.text = e.target.value; drawLayers(); });
    panel.querySelectorAll(".pe-colors button").forEach((b) =>
      b.addEventListener("click", () => { l.color = b.dataset.c; panel.querySelectorAll(".pe-colors button").forEach((x) => x.classList.toggle("on", x === b)); drawLayers(); }));
    panel.querySelector("#p-size").addEventListener("input", (e) => { l.size = +e.target.value; panel.querySelector("#p-size-l").textContent = l.size; drawLayers(); });
  });

  view.querySelector("#t-stick").addEventListener("click", () => {
    panel.innerHTML = `<div class="ed-panel"><div class="ed-stickers">${STICKERS.map((s) => `<button data-s="${s}">${s}</button>`).join("")}</div></div>`;
    panel.querySelectorAll("[data-s]").forEach((b) =>
      b.addEventListener("click", () => {
        const l = { id: crypto.randomUUID().slice(0, 6), type: "sticker", emoji: b.dataset.s, size: 44, x: 0.5, y: 0.35 };
        layers.push(l); selected = l.id; drawLayers();
        panel.innerHTML = `<label class="ed-size">${t("ed_size")}: <b id="p-size-l">${l.size}</b><input type="range" id="p-size" min="24" max="90" value="${l.size}" /></label>`;
        panel.querySelector("#p-size").addEventListener("input", (e) => { l.size = +e.target.value; panel.querySelector("#p-size-l").textContent = l.size; drawLayers(); });
      }));
  });

  view.querySelector("#t-music").addEventListener("click", () => {
    panel.innerHTML = `
      <div class="ed-panel">
        <label class="mini-btn" for="m-file">🎵 ${t("ed_pick_music")}</label>
        <input type="file" id="m-file" accept="audio/*" hidden />
        <div id="m-ui"></div>
      </div>`;
    panel.querySelector("#m-file").addEventListener("change", async (e) => {
      const f = e.target.files[0];
      if (!f) return;
      try {
        const buf = await f.arrayBuffer();
        const ac = new (window.AudioContext || window.webkitAudioContext)();
        const buffer = await ac.decodeAudioData(buf);
        music = { buffer, name: f.name.slice(0, 24), vol: 0.7, start: 0, ac };
        panel.querySelector("#m-ui").innerHTML = `
          <div class="m-row">🎧 ${music.name}</div>
          <label class="ed-size">${t("ed_volume")}: <b id="m-vl">70%</b><input type="range" id="m-vol" min="0" max="100" value="70" /></label>
          <label class="ed-size">${t("ed_mstart")}: <b id="m-sl">0.0s</b><input type="range" id="m-start" min="0" max="${Math.floor(buffer.duration * 10) / 10}" value="0" step="0.1" /></label>`;
        panel.querySelector("#m-vol").addEventListener("input", (e) => { music.vol = +e.target.value / 100; panel.querySelector("#m-vl").textContent = `${e.target.value}%`; });
        panel.querySelector("#m-start").addEventListener("input", (e) => { music.start = +e.target.value; panel.querySelector("#m-sl").textContent = `${music.start.toFixed(1)}s`; });
      } catch { toast(t("err_generic")); }
    });
  });

  view.querySelector("#t-del").addEventListener("click", () => {
    const i = layers.findIndex((l) => l.id === selected);
    if (i >= 0) layers.splice(i, 1);
    selected = null; drawLayers(); panel.innerHTML = "";
  });

  view.querySelector("#ed-skip").addEventListener("click", () => openPublish(view, file));
  view.querySelector("#ed-go").addEventListener("click", () => exportEdited(view, { file, vid, layers, trimS, trimE, music }, (out) => openPublish(view, out)));
}

// ——— التصدير: canvas + MediaRecorder + خلط الموسيقى ———
async function exportEdited(view, src, done) {
  const { vid, layers, trimS, trimE, music } = src;
  const bar = view.querySelector("#ed-bar"), plbl = view.querySelector("#ed-plbl"), prog = view.querySelector("#ed-prog");
  prog.style.display = "flex";
  try {
    try { await document.fonts.load('700 48px "IBM Plex Sans Arabic"'); } catch {}
    const canvas = document.createElement("canvas");
    canvas.width = 540; canvas.height = 960;
    const ctx = canvas.getContext("2d");
    const secs = Math.min(60, trimE - trimS);
    const stream = canvas.captureStream(30);

    let ac = null, srcNode = null, gain = null;
    if (music) {
      ac = music.ac || new (window.AudioContext || window.webkitAudioContext)();
      const dest = ac.createMediaStreamDestination();
      srcNode = ac.createBufferSource();
      srcNode.buffer = music.buffer;
      gain = ac.createGain();
      gain.gain.value = music.vol;
      srcNode.connect(gain).connect(dest);
      const at = dest.stream.getAudioTracks()[0];
      if (at) stream.addTrack(at);
    }
    const mime = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm", "video/mp4"].find((m) => MediaRecorder.isTypeSupported(m)) ?? "";
    const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
    const chunks = [];
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    const finished = new Promise((res) => { rec.onstop = res; });

    vid.currentTime = trimS;
    await new Promise((r) => { vid.onseeked = r; setTimeout(r, 900); });
    if (ac) await ac.resume().catch(() => {});
    rec.start(250);
    if (srcNode) srcNode.start(0, music.start, secs + 0.3);
    await vid.play().catch(() => {});

    await new Promise((res) => {
      const draw = () => {
        const el = vid.currentTime - trimS;
        const p = Math.min(99, Math.round((el / secs) * 100));
        bar.style.width = `${p}%`; plbl.textContent = `${p}%`;
        const ar = vid.videoWidth / vid.videoHeight, target = 540 / 960;
        let sw = vid.videoWidth, sh = vid.videoHeight, sx = 0, sy = 0;
        if (ar > target) { sw = vid.videoHeight * target; sx = (vid.videoWidth - sw) / 2; }
        else { sh = vid.videoWidth / target; sy = (vid.videoHeight - sh) / 2; }
        ctx.drawImage(vid, sx, sy, sw, sh, 0, 0, 540, 960);
        for (const l of layers) {
          ctx.save();
          if (l.type === "text") {
            ctx.font = `700 ${l.size * 1.6}px "IBM Plex Sans Arabic", sans-serif`;
            ctx.fillStyle = l.color;
            ctx.textAlign = "center";
            ctx.shadowColor = "rgba(0,0,0,.55)"; ctx.shadowBlur = 12;
            const lines = l.text.split("\n");
            lines.forEach((ln, i) => ctx.fillText(ln, l.x * 540, l.y * 960 + i * l.size * 2));
          } else {
            ctx.font = `${l.size * 1.6}px serif`;
            ctx.textAlign = "center";
            ctx.fillText(l.emoji, l.x * 540, l.y * 960);
          }
          ctx.restore();
        }
        if (vid.currentTime >= trimE - 0.03 || vid.ended) return res();
        requestAnimationFrame(draw);
      };
      requestAnimationFrame(draw);
      setTimeout(res, secs * 1000 + 1200);
    });
    vid.pause();
    rec.stop();
    await finished;
    srcNode?.stop?.();
    const blob = new Blob(chunks, { type: mime.split(";")[0] || "video/webm" });
    const out = new File([blob], "nexus-edited." + ((mime.split(";")[0] || "video/webm").includes("mp4") ? "mp4" : "webm"), { type: mime.split(";")[0] || "video/webm" });
    if (!blob.size) throw new Error("empty");
    bar.style.width = "100%"; plbl.textContent = "100%";
    toast(t("exported_ok"));
    done(out);
  } catch {
    toast(t("export_fail"));
    prog.style.display = "none";
    openPublish(view, src.file);
  }
}

// ═══════════ النشر (منشور أو قصة) — يبقى كما هو بصيغته المجرّبة ═══════════
function openPublish(view, file) {
  view.innerHTML = `
    <div class="studio-wrap">
      <h3 style="font-size:17px">${t("publish_ready")}</h3>
      <div class="studio-preview" id="prev"></div>
      <label class="drop" for="vid-file2" style="text-align:center"><b>${t("ed_replace")}</b></label>
      <input type="file" id="vid-file2" accept="video/*" hidden />
      <div class="seg" id="mode"><button class="on" data-m="post">${t("publish")}</button><button data-m="story">${t("publish_story")}</button></div>
      <div id="post-fields" style="display:flex;flex-direction:column;gap:12px">
        <div class="field"><label>${t("f_title")}</label><input id="s-title" type="text" maxlength="120" /></div>
        <div class="field"><label>${t("f_desc")}</label><textarea id="s-desc" rows="2" maxlength="600"></textarea></div>
        <div class="field"><label>${t("f_cat")}</label><select id="s-cat">${CATS.map((c) => `<option value="${c}">${t("cat_" + c)}</option>`).join("")}</select></div>
        <div class="field"><label>${t("f_art")}</label><select id="s-art">${ARTS.map((a) => `<option value="${a}">${t("art_" + a)}</option>`).join("")}</select></div>
        <div class="field"><label>${t("f_arturl")}</label><input id="s-url" type="url" dir="ltr" placeholder="https://…" /></div>
      </div>
      <div class="field" id="story-fields" style="display:none"><label>${t("f_desc")}</label><input id="s-cap" type="text" maxlength="200" /></div>
      <button class="cta" id="s-go" style="justify-content:center">${t("publish")}</button>
    </div>`;
  const url = URL.createObjectURL(file);
  view.querySelector("#prev").innerHTML = `<video src="${url}" muted loop autoplay playsinline></video>`;

  let mode = "post", thumbId = null;
  view.querySelectorAll("#mode button").forEach((b) =>
    b.addEventListener("click", () => {
      mode = b.dataset.m;
      view.querySelectorAll("#mode button").forEach((x) => x.classList.toggle("on", x === b));
      view.querySelector("#post-fields").style.display = mode === "post" ? "flex" : "none";
      view.querySelector("#story-fields").style.display = mode === "story" ? "flex" : "none";
    }));
  view.querySelector("#vid-file2").addEventListener("change", (e) => {
    if (e.target.files[0]) { if (canEdit) openEditor(view, e.target.files[0]); else openPublish(view, e.target.files[0]); }
  });

  // الغلاف التلقائي من أول إطار بعد القصّ
  const pv = view.querySelector("#prev video");
  pv?.addEventListener("loadeddata", () => { captureThumb(pv).catch(() => {}); }, { once: true });

  async function captureThumb(p) {
    const canvas = document.createElement("canvas");
    canvas.width = 540; canvas.height = 960;
    const ctx = canvas.getContext("2d");
    const ar = p.videoWidth / p.videoHeight, target = 540 / 960;
    let sw = p.videoWidth, sh = p.videoHeight, sx = 0, sy = 0;
    if (ar > target) { sw = p.videoHeight * target; sx = (p.videoWidth - sw) / 2; }
    else { sh = p.videoWidth / target; sy = (p.videoHeight - sh) / 2; }
    ctx.drawImage(p, sx, sy, sw, sh, 0, 0, 540, 960);
    const blob = await new Promise((res) => canvas.toBlob(res, "image/jpeg", 0.8));
    const up = await api.post("/api/stream/direct-upload", { purpose: "POST", bytes: blob.size, content_type: "image/jpeg" });
    if (up.ok) {
      const b = await blob.arrayBuffer();
      await fetch(up.data.upload_url, { method: "PUT", body: b, headers: { "content-type": "image/jpeg", "x-csrf": state.csrf ?? "" } });
      thumbId = up.data.media_id;
    }
  }

  view.querySelector("#s-go").addEventListener("click", async () => {
    const go = view.querySelector("#s-go");
    go.disabled = true;
    const prg = progressSheet(t("preparing"));
    const purpose = mode === "story" ? "STORY" : "POST";
    prg.label(t("compressing"));
    const f = await compressVideo(file, (p) => prg.set(p));
    prg.label(t("uploading"));
    prg.set(0);
    const up = await api.post("/api/stream/direct-upload", { purpose, bytes: f.size, content_type: f.type || "video/webm" });
    if (!up.ok) { prg.done(); go.disabled = false; return toast(up.data?.error === "size_invalid" ? t("err_too_big") : t("err_generic")); }
    const put = await xhrUpload(up.data.upload_url, f, (p) => prg.set(p));
    if (!put.ok) { prg.done(); go.disabled = false; return toast(put.status === 413 ? t("err_too_big") : t("err_generic")); }
    prg.done();
    const mediaId = up.data.media_id;

    if (mode === "story") {
      const r = await api.post("/api/stories", { media_id: mediaId, caption: view.querySelector("#s-cap").value.trim() });
      if (r.ok) { invalidateStories(); toast(t("published")); location.hash = "#/posts"; return; }
    } else {
      const r = await api.post("/api/posts", {
        media_id: mediaId,
        thumbnail_media_id: thumbId,
        title: view.querySelector("#s-title").value.trim(),
        description: view.querySelector("#s-desc").value.trim(),
        category_tag: view.querySelector("#s-cat").value,
        artifact_type: view.querySelector("#s-art").value,
        artifact_url: view.querySelector("#s-url").value.trim(),
      });
      if (r.ok) {
        toast(t("published"));
        openBoost({ id: r.data.id }, () => { location.hash = "#/feed"; });
        return;
      }
    }
    go.disabled = false;
    go.textContent = t("publish");
    toast(t("err_generic"));
  });
}
