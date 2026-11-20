#!/usr/bin/env node
/* بوابة النافذة التفاعلية: WebSocket حي مقابل عقدة الترحيل — إطارات تصل + مدخلات لا تسقطها + ربط يكتمل.
   تعمل مقابل سائق mock في CI ومحلياً — تختبر جسر البث الحقيقي (المصافحة، الإطارات، أحداث الإدخال، دورة الربط). */
const BASE = (process.env.RELAY || "http://127.0.0.1:8801").replace(/\/+$/, "");
const tok = "gate" + Math.random().toString(16).slice(2, 10);
const pg = await fetch(BASE + "/login/" + tok).then((r) => r.text()).catch(() => "");
if (!pg.includes("vbs-live")) { console.error("WS-GATE: صفحة النافذة التفاعلية لم تُخدَم"); process.exit(1); }
const ws = new WebSocket(BASE.replace(/^http/, "ws") + "/ws/" + tok);
let frames = 0, linked = false, inputsSent = false, gotAfterInputs = 0, opened = false;
ws.onopen = () => { opened = true; ws.send(JSON.stringify({ type: "mouse", kind: "down", x: 10, y: 10 })); ws.send(JSON.stringify({ type: "mouse", kind: "up", x: 10, y: 10 })); ws.send(JSON.stringify({ type: "text", text: "أهلاً" })); inputsSent = true; };
ws.onmessage = (ev) => { const d = JSON.parse(ev.data); if (d.type === "frame") { frames++; if (inputsSent) gotAfterInputs++; } if (d.type === "linked") linked = true; if (d.type === "error") { console.error("WS-GATE: خطأ من العقدة:", d.msg); process.exit(1); } };
const t0 = Date.now();
while (Date.now() - t0 < 15000 && !(linked && frames >= 3)) await new Promise((r) => setTimeout(r, 250));
const alive = await fetch(BASE + "/health").then((r) => r.json()).catch(() => null);
try { ws.close(); } catch {}
console.log(`WS-GATE: frames=${frames} linked=${linked} inputs=${inputsSent} framesAfterInputs=${gotAfterInputs} health=${alive && alive.ok ? "true" : "false"}`);
if (!(opened && linked && frames >= 3 && inputsSent && gotAfterInputs >= 1 && alive && alive.ok)) { console.error("فشل بوابة النافذة التفاعلية — الجسر مكسور"); process.exit(1); }
