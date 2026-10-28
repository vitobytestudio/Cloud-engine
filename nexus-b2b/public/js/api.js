// ——— طبقة الواجهة البرمجية: تغليف fetch مع CSRF وإعادة محاولة ———
export const state = {
  user: null,
  csrf: null,
  balance: 0,
  online: 0,
};

import { t } from "./i18n.js";

async function request(path, opts = {}, retry = 1) {
  const headers = { ...(opts.headers ?? {}) };
  if (opts.body && !(opts.body instanceof FormData)) headers["content-type"] = "application/json";
  if (state.csrf && !["GET", "HEAD"].includes(opts.method ?? "GET")) headers["x-csrf"] = state.csrf;
  try {
    const r = await fetch(path, { ...opts, headers, credentials: "same-origin" });
    if (r.status === 429 && retry > 0) {
      await new Promise((res) => setTimeout(res, 1200));
      return request(path, opts, retry - 1);
    }
    const data = await r.json().catch(() => ({}));
    return { ok: r.ok, status: r.status, data };
  } catch {
    return { ok: false, status: 0, data: {} };
  }
}

export const api = {
  request: (p, o) => request(p, o),
  get: (p) => request(p),
  post: (p, body) => request(p, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
  put: (p, body, ct) => request(p, { method: "PUT", body, headers: ct ? { "content-type": ct } : {} }),
  del: (p) => request(p, { method: "DELETE" }),
};

// رفع بقياس تقدم حقيقي (fetch لا يعطي تقدم الرفع — XHR يعطيه)
export function xhrUpload(url, file, onPct) {
  return new Promise((resolve) => {
    try {
      const x = new XMLHttpRequest();
      x.open("PUT", url);
      x.setRequestHeader("content-type", file.type || "application/octet-stream");
      if (state.csrf) x.setRequestHeader("x-csrf", state.csrf);
      x.timeout = 120000;
      x.upload.onprogress = (e) => { if (e.lengthComputable && onPct) onPct(Math.min(99, (e.loaded / e.total) * 100)); };
      x.onload = () => resolve({ ok: x.status >= 200 && x.status < 300, status: x.status });
      x.onerror = () => resolve({ ok: false, status: 0 });
      x.ontimeout = () => resolve({ ok: false, status: 0 });
      x.send(file);
    } catch { resolve({ ok: false, status: 0 }); }
  });
}

// ورقة تأكيد للحذف النهائي
export function confirmSheet(title, desc, okLabel) {
  return new Promise((resolve) => {
    const root = document.getElementById("overlay-root");
    root.innerHTML = `
      <div class="backdrop" id="cbk"></div>
      <div class="sheet">
        <h3>${title}</h3>
        <p class="sub">${desc}</p>
        <div style="display:flex;gap:9px;margin-top:12px">
          <button class="cta danger" id="c-ok">${okLabel}</button>
          <button class="cta ghost" id="c-x">${t("decline")}</button>
        </div>
      </div>`;
    const close = (v) => { root.innerHTML = ""; resolve(v); };
    root.querySelector("#cbk").addEventListener("click", () => close(false));
    root.querySelector("#c-x").addEventListener("click", () => close(false));
    root.querySelector("#c-ok").addEventListener("click", () => close(true));
  });
}

export const fmtEur = (cents) =>
  new Intl.NumberFormat(state.user?.locale === "ar" ? "ar" : "en", { style: "currency", currency: "EUR", maximumFractionDigits: 0 })
    .format((cents ?? 0) / 100);

export const fmtN = (n) => new Intl.NumberFormat("en").format(n ?? 0);

export function toast(msg) {
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2600);
}
