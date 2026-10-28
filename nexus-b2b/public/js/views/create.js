// ——— قائمة الإنشاء: ستوري أو ريلز أو منشور — مسارات سريعة بلا انتظار ———
import { api, toast, xhrUpload } from "../api.js";
import { compressVideo, progressSheet } from "../lib/media.js";
import { giftSheet } from "../lib/gift.js";
import { t } from "../i18n.js";
import { requireAuth } from "./authsheet.js";

export async function openCreateSheet(preset = "") {
  const root = document.getElementById("overlay-root");
  const items = [
    { k: "story", icon: `<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="3.4" fill="none" stroke="currentColor" stroke-width="1.8"/>`, lbl: "create_story", sub: "create_story_s" },
    { k: "reel", icon: `<rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M10 8.5v7l6-3.5z" fill="currentColor"/>`, lbl: "create_reel", sub: "create_reel_s" },
    { k: "post", icon: `<rect x="3.5" y="3.5" width="17" height="17" rx="4" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="9" cy="9" r="1.7" fill="currentColor"/><path d="m5.5 17.5 4.2-4.2 3 3 2.6-2.6 3.2 3.2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>`, lbl: "create_post", sub: "create_post_s" },
  ];
  root.innerHTML = `
    <div class="backdrop" id="bk"></div>
    <div class="sheet create-sheet">
      <h3>${t("create_title")}</h3>
      <p class="sub">${t("create_sub")}</p>
      ${items.map((it) => `
        <button class="create-row" data-c="${it.k}">
          <span class="cr-ic"><svg viewBox="0 0 24 24" width="21" height="21">${it.icon}</svg></span>
          <span class="minw0"><b>${t(it.lbl)}</b><small>${t(it.sub)}</small></span>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="opacity:.4"><path d="m9 5 7 7-7 7"/></svg>
        </button>`).join("")}
    </div>`;
  root.querySelector("#bk").addEventListener("click", () => (root.innerHTML = ""));

  const filePick = (accept) => {
    const inp = document.createElement("input");
    inp.type = "file";
    inp.accept = accept;
    inp.style.display = "none";
    document.body.appendChild(inp);
    return inp;
  };
  const upload = async (file, purpose) => {
    const prg = progressSheet(t("preparing"));
    if (String(file.type || "").startsWith("video/")) {
      prg.label(t("compressing"));
      file = await compressVideo(file, (p) => prg.set(p));
    }
    prg.label(t("uploading"));
    prg.set(0);
    const init = await api.post("/api/stream/direct-upload", { purpose, bytes: file.size, content_type: file.type || "application/octet-stream" });
    if (!init.ok || !init.data.media_id) { prg.done(); toast(init.data?.error === "size_invalid" ? t("err_too_big") : t("err_generic")); return null; }
    const put = await xhrUpload(init.data.upload_url, file, (p) => prg.set(p));
    prg.done();
    if (!put.ok) { toast(put.status === 413 ? t("err_too_big") : t("err_generic")); return null; }
    return init.data.media_id;
  };

  root.querySelectorAll(".create-row").forEach((b) =>
    b.addEventListener("click", async () => {
      const k = b.dataset.c;
      if (!(await requireAuth())) return;
      if (k === "reel") {
        root.innerHTML = "";
        location.hash = "#/studio";
        return;
      }
      if (k === "story") {
        const inp = filePick("video/*,image/*");
        inp.onchange = async () => {
          const f = inp.files?.[0];
          inp.remove();
          root.innerHTML = "";
          if (!f) return;
          const mid = await upload(f, "STORY");
          if (!mid) return;
          const r = await api.post("/api/stories", { media_id: mid, media_type: (f.type || "").startsWith("image/") ? "IMAGE" : "VIDEO" });
          if (r.ok) { toast(t("story_posted")); location.hash = "#/posts"; }
          else toast(t("err_generic"));
        };
        inp.click();
        return;
      }
      // منشور ساكن: صورة + عنوان → نشر فوري
      const inp = filePick("image/*");
      inp.onchange = async () => {
        const f = inp.files?.[0];
        inp.remove();
        if (!f) return;
        root.innerHTML = `
          <div class="backdrop" id="bk2"></div>
          <div class="sheet">
            <h3>${t("create_post")}</h3>
            <img class="cp-preview" src="${URL.createObjectURL(f)}" alt="" />
            <div class="field"><label>${t("item_title")}</label><input id="cp-title" maxlength="80" placeholder="${t("post_ph")}" /></div>
            <div style="display:flex;gap:9px;margin-top:12px">
              <button class="cta" id="cp-go">${t("publish_now")}</button>
              <button class="cta ghost" id="cp-x">${t("decline")}</button>
            </div>
          </div>`;
        root.querySelector("#bk2").addEventListener("click", () => (root.innerHTML = ""));
        root.querySelector("#cp-x").addEventListener("click", () => (root.innerHTML = ""));
        root.querySelector("#cp-go").addEventListener("click", async () => {
          const title = root.querySelector("#cp-title").value.trim();
          if (title.length < 4) return toast(t("err_generic"));
          root.querySelector("#cp-go").disabled = true;
          const mid = await upload(f, "POST");
          if (!mid) { root.innerHTML = ""; return; }
          const r = await api.post("/api/posts", { title, category_tag: "SHOWCASE", media_id: mid, media_kind: "IMAGE" });
          if (r.ok && r.data.gift_granted) setTimeout(giftSheet, 700);
          root.innerHTML = "";
          if (r.ok && r.data.id) { toast(t("post_posted")); location.hash = `#/post/${r.data.id}`; }
          else toast(t("err_generic"));
        });
      };
      inp.click();
    }));
}
