// ——— طبقة الـAPI: الجلسة، الأخطاء، البث الحي ———
export const state = {
  user: null,
  csrf: null,
};

function handle(res) {
  if (res.status === 401 && location.hash !== "#/" && !location.hash.startsWith("#auth")) {
    state.user = null;
    location.hash = "#/";
  }
}

export const api = {
  async get(path) {
    const res = await fetch(path, { headers: { "content-type": "application/json" } });
    handle(res);
    return { ok: res.ok, status: res.status, data: await res.json().catch(() => ({})) };
  },
  async post(path, body, headers = {}) {
    const res = await fetch(path, {
      method: "POST", headers: { "content-type": "application/json", ...(state.csrf ? { "x-csrf": state.csrf } : {}), ...headers },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    handle(res);
    return { ok: res.ok, status: res.status, data: await res.json().catch(() => ({})) };
  },
  async put(path, body) {
    const res = await fetch(path, {
      method: "PUT", headers: { "content-type": "application/json", ...(state.csrf ? { "x-csrf": state.csrf } : {}) },
      body: JSON.stringify(body),
    });
    handle(res);
    return { ok: res.ok, status: res.status, data: await res.json().catch(() => ({})) };
  },
  // بث حي: يمرّر رقاقات SSE من المزود كما هي — الوكيل شفاف
  async stream(provider, upstreamKey, body, onChunk, onDone, onErr) {
    let res;
    try {
      res = await fetch(`/api/infer/${provider}`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-upstream-key": upstreamKey, ...(state.csrf ? { "x-csrf": state.csrf } : {}) },
        body: JSON.stringify(body),
      });
    } catch {
      onErr("network"); return;
    }
    if (!res.ok || !res.body) {
      const d = await res.json().catch(() => ({}));
      onErr(d.error ?? `http_${res.status}`); return;
    }
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = "";
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const events = buf.split("\n\n");
        buf = events.pop() ?? "";
        for (const ev of events) {
          for (const line of ev.split("\n")) {
            if (!line.startsWith("data:")) continue;
            const payload = line.slice(5).trim();
            if (payload === "[DONE]") { onDone(); return; }
            try {
              const j = JSON.parse(payload);
              const txt = j.choices?.[0]?.delta?.content ?? j.delta?.text ?? "";
              if (txt) onChunk(txt);
            } catch { /* رقاقة غير مكتملة — نتجاهل */ }
          }
        }
      }
      onDone();
    } catch {
      onErr("stream_broken");
    }
  },
};
