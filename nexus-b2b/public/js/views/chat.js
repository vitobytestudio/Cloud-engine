// ——— المحادثات الحية + بطاقات الصفقات (WebSocket) ———
import { api, state, fmtEur, toast } from "../api.js";
import { t } from "../i18n.js";
import { requireAuth } from "./authsheet.js";

export async function renderChat(view, convId) {
  if (!state.user) {
    const ok = await requireAuth();
    if (!ok) { location.hash = "#/feed"; return; }
  }
  if (convId) return renderPane(view, convId);
  const r = await api.get("/api/chat/conversations");
  const items = r.data.items ?? [];
  view.innerHTML = `
    <div class="chat-wrap">
      <div class="conv-list">
        <h3 style="padding:6px 4px 2px">${t("chat_title")}</h3>
        ${items.length ? items.map((c) => `
          <a class="conv-row" href="#/chat/${c.id}">
            <span class="who-avatar" style="background:${c.avatar_color}">${(c.full_name ?? "?")[0]}</span>
            <span class="txt">
              <b>${c.full_name}</b>
              <small>${(c.snippet ?? "").slice(0, 60) || (c.snippet_type === "PROPOSAL" ? t("send_proposal") : "")}</small>
            </span>
            ${c.badge_tier !== "FREE" ? `<span class="badge ${c.badge_tier}"></span>` : ""}
          </a>`).join("") : `<div class="empty">${t("no_conv")}</div>`}
      </div>
    </div>`;
}

async function renderPane(view, convId) {
  const r = await api.get(`/api/chat/${convId}/messages`);
  if (r.status === 403) { location.hash = "#/chat"; return; }
  const items = r.data.items ?? [];
  const me = r.data.me;
  const other = items.find((m) => m.sender_id !== me);

  view.innerHTML = `
    <div class="chat-pane">
      <div class="chat-peer">
        <a class="chat-back ghost-btn" href="#/chat">←</a>
        ${other ? `
          <span class="who-avatar" style="background:${other.avatar_color};width:30px;height:30px;font-size:12px">${(other.full_name ?? "?")[0]}</span>
          <a href="#/profile/${other.username}">${other.full_name}</a>` : `<span>${t("chat_title")}</span>`}
      </div>
      <div class="chat-msgs" id="msgs">
        ${items.map((m) => msgEl(m, me)).join("")}
      </div>
      <div class="typing" id="typing"></div>
      <div class="composer">
        <button class="icon-btn ghost2" id="deal-btn" title="${t("send_proposal")}">
          <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M7 4h10a1 1 0 0 1 1 1v15l-6-3.6L6 20V5a1 1 0 0 1 1-1Z"/></svg>
        </button>
        <input type="text" id="msg-input" placeholder="${t("msg_placeholder")}" />
        <button class="icon-btn" id="send-btn">
          <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M20 12 4.5 5l2.2 7-2.2 7L20 12Z" stroke-linejoin="round" transform="${document.documentElement.dir === "rtl" ? "scale(-1,1) translate(-24,0)" : ""}"/></svg>
        </button>
      </div>
    </div>`;

  const msgs = view.querySelector("#msgs");
  msgs.scrollTop = msgs.scrollHeight;

  // اتصال حي
  const proto = location.protocol === "https:" ? "wss" : "ws";
  const ws = new WebSocket(`${proto}://${location.host}/api/ws/chat/${convId}`);
  ws.addEventListener("open", () => ws.send(JSON.stringify({ t: "hello" })));
  ws.addEventListener("message", (ev) => {
    let m; try { m = JSON.parse(ev.data); } catch { return; }
    if (m.t === "msg" && m.message) {
      if (m.message.sender_id === me) return;
      msgs.insertAdjacentHTML("beforeend", msgEl(m.message, me));
      msgs.scrollTop = msgs.scrollHeight;
    } else if (m.t === "typing") {
      const ty = view.querySelector("#typing");
      if (ty) { ty.textContent = "…"; setTimeout(() => (ty.textContent = ""), 1800); }
    } else if (m.t === "deal" && m.message) {
      const el = document.getElementById(`deal-${m.message.id}`);
      if (el) el.outerHTML = msgEl(m.message, me);
    }
  });
  ws.addEventListener("error", () => toast(t("err_generic")));

  let typingSent = 0;
  const input = view.querySelector("#msg-input");
  input.addEventListener("input", () => {
    if (Date.now() - typingSent > 2000 && ws.readyState === 1) {
      ws.send(JSON.stringify({ t: "typing", conv_id: convId, user_id: me }));
      typingSent = Date.now();
    }
  });
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") sendText(); });

  async function sendText() {
    const content = input.value.trim();
    if (!content) return;
    input.value = "";
    if (ws.readyState === 1) {
      ws.send(JSON.stringify({ t: "msg", conv_id: convId, user_id: me, content }));
      const rr = await api.get(`/api/chat/${convId}/messages`);
      const last = (rr.data.items ?? []).slice(-1)[0];
      if (last) { msgs.insertAdjacentHTML("beforeend", msgEl(last, me)); msgs.scrollTop = msgs.scrollHeight; }
    }
  }
  view.querySelector("#send-btn").addEventListener("click", sendText);
  view.querySelector("#deal-btn").addEventListener("click", () => dealModal(convId, me, msgs));

  view.addEventListener("click", async (e) => {
    const b = e.target.closest("[data-deal]");
    if (!b) return;
    const r2 = await api.post(`/api/deal/${b.dataset.id}/action`, { action: b.dataset.deal });
    if (r2.ok && r2.data.message) {
      const el = document.getElementById(`deal-${b.dataset.id}`);
      if (el) el.outerHTML = msgEl(r2.data.message, me);
    } else toast(t("err_generic"));
  });
}

function msgEl(m, me) {
  const mine = m.sender_id === me;
  if (m.message_type === "TEXT") {
    return `<div class="msg ${mine ? "me" : ""}">${esc(m.content)}<span class="t">${m.username ?? ""}</span></div>`;
  }
  const canAct = !mine && m.deal_status === "PENDING";
  return `
    <div class="msg ${mine ? "me" : ""}" id="deal-${m.id}" style="max-width:92%">
      <div class="deal-card" style="background:${mine ? "rgba(59,130,246,0.12)" : "var(--bg-elev)"}">
        <div class="dt">${m.message_type === "PROPOSAL" ? t("send_proposal") : m.message_type === "SAMPLE_ORDER" ? t("send_invoice") : "PAYMENT"}</div>
        <b>${esc(m.deal_title ?? "")}</b>
        <div class="amt">${fmtEur(m.deal_amount_cents)}</div>
        <span class="deal-status ${m.deal_status}">${t("deal_" + m.deal_status)}</span>
        ${m.deal_status === "ESCROWED" ? `<div class="hint" style="margin-top:8px">${t("escrow_note")}</div>` : ""}
        ${canAct ? `
          <div class="deal-actions">
            <button class="cta" data-deal="accept" data-id="${m.id}">${t("accept_escrow")}</button>
            <button class="cta ghost" data-deal="decline" data-id="${m.id}">${t("decline")}</button>
          </div>` : ""}
      </div>
    </div>`;
}

function dealModal(convId, me, msgs) {
  const root = document.getElementById("overlay-root");
  root.innerHTML = `
    <div class="backdrop" id="bk"></div>
    <div class="sheet">
      <h3>${t("send_proposal")}</h3>
      <div class="field"><label>${t("deal_title")}</label><input id="d-title" type="text" /></div>
      <div class="field"><label>${t("deal_amount")}</label><input id="d-amt" type="number" dir="ltr" min="1" /></div>
      <div style="display:flex;gap:9px;margin-top:14px">
        <button class="cta" id="d-go">${t("send")}</button>
        <button class="cta ghost" id="d-x">${t("decline")}</button>
      </div>
    </div>`;
  root.querySelector("#bk").addEventListener("click", () => (root.innerHTML = ""));
  root.querySelector("#d-x").addEventListener("click", () => (root.innerHTML = ""));
  root.querySelector("#d-go").addEventListener("click", async () => {
    const title = root.querySelector("#d-title").value.trim();
    const amt = Math.round(parseFloat(root.querySelector("#d-amt").value || "0") * 100);
    if (!title || !amt) return;
    const r = await api.post(`/api/chat/${convId}/messages`, { type: "PROPOSAL", deal_title: title, deal_amount_cents: amt });
    root.innerHTML = "";
    if (r.ok && r.data.message) {
      msgs.insertAdjacentHTML("beforeend", msgEl(r.data.message, me));
      msgs.scrollTop = msgs.scrollHeight;
    }
  });
}

function esc(s) {
  const d = document.createElement("div");
  d.textContent = s ?? "";
  return d.innerHTML;
}
