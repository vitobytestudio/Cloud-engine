// ——— طبقة الواجهة البرمجية: تغليف fetch مع CSRF وإعادة محاولة ———
export const state = {
  user: null,
  csrf: null,
  balance: 0,
  online: 0,
};

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
};

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
