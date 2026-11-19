/* قياس المسار الحار — قبل/بعد علاج بطء الاستجابة */
"use strict";
import crypto from "node:crypto";

const BASE = process.env.BASE || "http://127.0.0.1:8792";
const EMAIL = "perf" + Date.now() + "@example.com";
const PASS = "Secret-99";

function k0(email, pass) {
  return new Promise((res, rej) => {
    const salt = "nexus:c1:" + email.toLowerCase();
    crypto.pbkdf2(pass, salt, 2e5, 32, "sha256", (e, d) => e ? rej(e) : res(d.toString("hex")));
  });
}

async function j(path, opts = {}, cookie = null, extra = {}) {
  const headers = { "content-type": "application/json", ...(cookie ? { cookie } : {}), ...extra };
  const r = await fetch(BASE + path, { method: opts.method || "GET", headers, body: opts.body ? JSON.stringify(opts.body) : undefined });
  const setc = r.headers.get("set-cookie");
  const data = await r.json().catch(() => ({}));
  return { status: r.status, data, setc };
}

(async () => {
  const K0 = await k0(EMAIL, PASS);
  const reg = await j("/api/auth/register", { method: "POST", body: { email: EMAIL, k0: K0, name: "Perf", slug: "perf-" + Date.now(), store_name: "Perf Store" } });
  if (reg.status !== 200) { console.error("register failed", reg.status, reg.data); process.exit(1); }
  const cookie = (reg.setc || "").split(";")[0];
  const csrf = reg.data.csrf;
  const auth = { cookie, "x-csrf": csrf };

  const bench = async (name, path, n, useAuth) => {
    const times = [];
    let last;
    for (let i = 0; i < n; i++) {
      const t0 = performance.now();
      last = await j(path, {}, useAuth ? cookie : null, useAuth ? { "x-csrf": csrf } : {});
      times.push(performance.now() - t0);
    }
    times.sort((a, b) => a - b);
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const p50 = times[Math.floor(times.length / 2)];
    console.log(`${name.padEnd(22)} x${n}  avg=${avg.toFixed(1)}ms  p50=${p50.toFixed(1)}ms  p95=${times[Math.floor(times.length * 0.95)].toFixed(1)}ms  [status=${last.status}]`);
    return avg;
  };

  console.log("── المسار الحار المصادَق (" + BASE + ") ──");
  await bench("GET /api/me", "/api/me", 40, true);
  await bench("GET /api/finance", "/api/finance", 40, true);
  await bench("GET /api/orders", "/api/orders", 30, true);
  await bench("GET /api/products", "/api/products", 30, true);
  await bench("GET /api/feed (عام)", "/api/feed", 30, false);
})().catch(e => { console.error(e); process.exit(1); });
