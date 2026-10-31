const envState = { sid: "", busy: false };
const shortSid = (s) => (s || "").slice(0, 8) + "…";

function envStepHtml(st, i) {
  const okCls = st.exit === 0 ? "ok" : "bad";
  return `<div class="env-step fade-up">
    <div class="env-step-head"><span class="env-n">${i + 1}</span><span class="env-explain">${esc(st.explain || "")}</span><span class="env-exit ${okCls}">exit ${st.exit}</span></div>
    <pre class="env-cmd" dir="ltr">$ ${esc(st.cmd)}</pre>
    ${st.stdout ? `<pre class="env-term" dir="ltr">${esc(st.stdout)}</pre>` : ""}
    ${st.stderr ? `<pre class="env-term err" dir="ltr">${esc(st.stderr)}</pre>` : ""}
  </div>`;
}

async function renderEnv(view) {
  if (!view) return;
  view.innerHTML = `<div class="env-wrap">
    <div class="page-head"><h2>${t("nav_env")}</h2><p class="page-sub">${t("env_sub")}</p></div>
    <div id="env-body"><div class="env-loading">${t("env_working")}</div></div>
  </div>`;
  const body = view.querySelector("#env-body");
  let st = null;
  try { st = await api.get("/api/env/status"); } catch {}
  const engine = !!(st && st.data && st.data.engine);
  const active = (st && st.data && st.data.active) || [];
  envState.sid = active[0] || "";
  if (!engine) {
    body.innerHTML = `<div class="card env-off fade-up">
      <h3>${t("env_off_title")}</h3>
      <p>${t("env_off_sub")}</p>
      <ol class="env-off-steps">
        <li>${t("env_off_1")}</li>
        <li>${t("env_off_2")}</li>
        <li>${t("env_off_3")}</li>
      </ol>
      <a class="btn btn-grad" href="https://e2b.dev/dashboard" target="_blank" rel="noopener noreferrer">${t("env_off_cta")} ↗</a>
    </div>`;
    return;
  }
  body.innerHTML = `
    <div class="card env-bar fade-up">
      <span class="env-dot ${envState.sid ? "on" : ""}"></span>
      <span class="env-bar-txt">${envState.sid ? `${t("env_active")} <code>${esc(shortSid(envState.sid))}</code>` : t("env_none")}</span>
      ${envState.sid
        ? `<button class="btn btn-ghost btn-sm" id="env-kill">${t("env_kill")}</button>`
        : `<button class="btn btn-grad btn-sm" id="env-create">${t("env_create")}</button>`}
    </div>
    <div class="card env-goal-card fade-up">
      <label class="env-label">${t("env_goal_label")}</label>
      <textarea id="env-goal" rows="2" placeholder="${t("env_goal_ph")}"></textarea>
      <div class="env-actions">
        <button class="btn btn-grad" id="env-build">${t("env_build")}</button>
        <span class="env-hint">${t("env_build_hint")}</span>
      </div>
    </div>
    <div id="env-log"></div>
    <div class="card env-manual fade-up">
      <label class="env-label">${t("env_manual")}</label>
      <div class="env-cmd-row">
        <input id="env-cmd" dir="ltr" placeholder="ls -la" />
        <button class="btn btn-ghost" id="env-run">${t("env_run")}</button>
      </div>
      <pre class="env-term" id="env-out" dir="ltr" hidden></pre>
      <div class="env-preview-row">
        <label>${t("env_preview")}</label>
        <input id="env-port" dir="ltr" type="number" min="1024" max="65535" placeholder="3000" />
        <button class="btn btn-ghost btn-sm" id="env-open">${t("env_open")}</button>
      </div>
    </div>`;
  body.querySelector("#env-create")?.addEventListener("click", async () => {
    if (envState.busy) return;
    envState.busy = true;
    const r = await api.post("/api/env");
    envState.busy = false;
    if (r.ok && r.data.sid) { renderEnv(view); return; }
    alert(envErrText(r));
  });
  body.querySelector("#env-kill")?.addEventListener("click", async () => {
    if (!envState.sid) return;
    await api.post("/api/env/stop", { sid: envState.sid });
    renderEnv(view);
  });
  body.querySelector("#env-build")?.addEventListener("click", async () => {
    const goal = (body.querySelector("#env-goal") ?? {}).value?.trim();
    if (!goal || envState.busy) return;
    if (envState.sid) {
      const stop = await api.post("/api/env/stop", { sid: envState.sid });
      if (!stop.ok) { alert(envErrText(stop)); return; }
    }
    const btn = body.querySelector("#env-build");
    btn.disabled = true;
    btn.textContent = t("env_working");
    const log = body.querySelector("#env-log");
    log.innerHTML = `<div class="env-loading pulse">${t("env_working")}</div>`;
    const r = await api.post("/api/env/agent", { goal });
    btn.disabled = false;
    btn.textContent = t("env_build");
    if (!r.ok || !r.data.sid) { log.innerHTML = `<div class="env-error">${esc(envErrText(r))}</div>`; return; }
    envState.sid = r.data.sid;
    const steps = r.data.steps || [];
    log.innerHTML = steps.map((x, i) => envStepHtml(x, i)).join("") + `
      ${r.data.preview ? `<div class="card env-preview-card fade-up"><div class="env-label">${t("env_live")}</div><a class="env-link" href="${esc(r.data.preview)}" target="_blank" rel="noopener noreferrer">${esc(r.data.preview)}</a><button class="btn btn-grad btn-sm" data-copy-link="${esc(r.data.preview)}">${t("env_copy")}</button></div>` : ""}
      ${r.data.summary ? `<div class="card env-summary fade-up"><div class="env-label">${t("env_summary")}</div><p>${esc(r.data.summary)}</p></div>` : ""}`;
    log.querySelector("[data-copy-link]")?.addEventListener("click", (e) => {
      navigator.clipboard?.writeText(e.target.dataset.copyLink).catch(() => {});
      e.target.textContent = t("env_copied");
    });
    const bar = body.querySelector(".env-bar");
    if (bar) {
      bar.querySelector(".env-dot")?.classList.add("on");
      const txt = bar.querySelector(".env-bar-txt");
      if (txt) txt.innerHTML = `${t("env_active")} <code>${esc(shortSid(envState.sid))}</code>`;
    }
    renderEnvStatus(view);
  });
  body.querySelector("#env-run")?.addEventListener("click", async () => {
    const cmd = (body.querySelector("#env-cmd") ?? {}).value?.trim();
    const out = body.querySelector("#env-out");
    if (!cmd || !envState.sid) { out.hidden = false; out.textContent = t("env_need_env"); return; }
    out.hidden = false;
    out.textContent = "…";
    const r = await api.post("/api/env/exec", { sid: envState.sid, script: cmd });
    out.textContent = r.ok
      ? [r.data.stdout, r.data.stderr].filter(Boolean).join("\n") || `(exit ${r.data.exit})`
      : envErrText(r);
  });
  body.querySelector("#env-open")?.addEventListener("click", () => {
    const port = parseInt((body.querySelector("#env-port") ?? {}).value, 10);
    if (!port || !envState.sid) return;
    window.open(`https://${port}-${envState.sid}.e2b.app`, "_blank", "noopener");
  });
}

function envErrText(r) {
  const e = (r && r.data && r.data.error) || "error";
  const map = {
    engine_off: t("env_err_off"),
    env_busy: t("env_err_busy"),
    too_many: t("too_many"),
    create_failed: t("env_err_create"),
    plan_invalid: t("env_err_plan"),
    forbidden_cmd: t("env_err_forbidden"),
  };
  return map[e] || e;
}

async function renderEnvStatus(view) {
  try {
    const st = await api.get("/api/env/status");
    envState.sid = ((st.data && st.data.active) || [])[0] || "";
  } catch {}
}
