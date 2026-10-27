// ——— استوديو النشر: رفع مباشر، غلاف من اللقطة، منشور أو قصة ———
import { api, state, toast } from "../api.js";
import { t } from "../i18n.js";
import { requireAuth } from "./authsheet.js";
import { openBoost } from "./boost.js";

const CATS = ["PRODUCT_DEMO", "REVENUE_WIN", "WORKFLOW_HACK", "CASE_STUDY", "SHOWCASE"];
const ARTS = ["GITHUB_REPO", "FIGMA_FILE", "STORE_LINK", "AUDIT_DOC", "CASE_METRIC"];

export async function renderStudio(view) {
  if (!state.user) {
    const ok = await requireAuth();
    if (!ok) { location.hash = "#/feed"; return; }
  }
  let file = null;
  let mediaId = null;
  let thumbId = null;

  view.innerHTML = `
    <div class="studio-wrap">
      <h3 style="font-size:17px">${t("studio_title")}</h3>
      <div class="studio-preview" id="prev">
        <span class="empty" style="padding:10px">${t("studio_pick")}<br />${t("studio_or")}</span>
      </div>
      <label class="drop" for="vid-file"><b>${t("studio_pick")}</b><br />MP4 · MOV · WEBM — 20MB</label>
      <input type="file" id="vid-file" accept="video/*,.mp4,.webm,.mov" />
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
      <p class="hint">9:16 · 20MB · ${t("studio_or")}</p>
    </div>`;

  let mode = "post";
  view.querySelectorAll("#mode button").forEach((b) =>
    b.addEventListener("click", () => {
      mode = b.dataset.m;
      view.querySelectorAll("#mode button").forEach((x) => x.classList.toggle("on", x === b));
      view.querySelector("#post-fields").style.display = mode === "post" ? "flex" : "none";
      view.querySelector("#story-fields").style.display = mode === "story" ? "flex" : "none";
    })
  );

  const fileInput = view.querySelector("#vid-file");
  fileInput.addEventListener("change", () => {
    file = fileInput.files[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) return toast("20MB max");
    const url = URL.createObjectURL(file);
    view.querySelector("#prev").innerHTML = `<video id="pv" src="${url}" muted loop autoplay playsinline></video>`;
    const pv = view.querySelector("#pv");
    pv.addEventListener("click", () => {
      // الغلاف = اللقطة الحالية
      captureThumb(pv);
    });
  });

  async function captureThumb(pv) {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 540; canvas.height = 960;
      const ctx = canvas.getContext("2d");
      const ar = pv.videoWidth / pv.videoHeight, target = 540 / 960;
      let sw = pv.videoWidth, sh = pv.videoHeight, sx = 0, sy = 0;
      if (ar > target) { sw = pv.videoHeight * target; sx = (pv.videoWidth - sw) / 2; }
      else { sh = pv.videoWidth / target; sy = (pv.videoHeight - sh) / 2; }
      ctx.drawImage(pv, sx, sy, sw, sh, 0, 0, 540, 960);
      const blob = await new Promise((res) => canvas.toBlob(res, "image/jpeg", 0.8));
      const up = await api.post("/api/stream/direct-upload", { purpose: "POST", bytes: blob.size, content_type: "image/jpeg" });
      if (up.ok) {
        const b = await blob.arrayBuffer();
        await fetch(up.data.upload_url, { method: "PUT", body: b, headers: { "content-type": "image/jpeg", "x-csrf": state.csrf ?? "" } });
        thumbId = up.data.media_id;
        toast(t("lang_name") === "العربية" ? "تم تعيين الغلاف" : "Cover frame set");
      }
    } catch { /* الغلاف اختياري */ }
  }

  view.querySelector("#s-go").addEventListener("click", async () => {
    if (!file) return toast(t("studio_pick"));
    const go = view.querySelector("#s-go");
    go.disabled = true;
    go.textContent = t("uploading");

    const purpose = mode === "story" ? "STORY" : "POST";
    const up = await api.post("/api/stream/direct-upload", { purpose, bytes: file.size, content_type: file.type || "video/mp4" });
    if (!up.ok) { reset(); return toast(t("err_generic")); }
    mediaId = up.data.media_id;
    const put = await fetch(up.data.upload_url, {
      method: "PUT",
      body: file,
      headers: { "content-type": file.type || "video/mp4", "x-csrf": state.csrf ?? "" },
    });
    if (!put.ok) { reset(); return toast(t("err_generic")); }

    if (mode === "story") {
      const r = await api.post("/api/stories", { media_id: mediaId, caption: view.querySelector("#s-cap").value.trim() });
      if (r.ok) { toast(t("published")); location.hash = "#/feed"; return; }
    } else {
      const body = {
        media_id: mediaId,
        thumbnail_media_id: thumbId,
        title: view.querySelector("#s-title").value.trim(),
        description: view.querySelector("#s-desc").value.trim(),
        category_tag: view.querySelector("#s-cat").value,
        artifact_type: view.querySelector("#s-art").value,
        artifact_url: view.querySelector("#s-url").value.trim(),
      };
      const r = await api.post("/api/posts", body);
      if (r.ok) {
        toast(t("published"));
        openBoost({ id: r.data.id }, () => { location.hash = "#/feed"; setTimeout(() => location.reload(), 300); });
        return;
      } else if (r.data.error === "media_not_owned") {
        toast("media_not_owned");
      } else toast(t("err_generic"));
    }
    reset();

    function reset() {
      go.disabled = false;
      go.textContent = t("publish");
    }
  });
}
