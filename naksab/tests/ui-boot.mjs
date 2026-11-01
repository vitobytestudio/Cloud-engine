// ——— فحص انحدار إقلاع الواجهة: /panel/<tok> يجب أن يضع S.panel ويبعثه x-panel ———
import fs from "node:fs";
import vm from "node:vm";

const js = fs.readFileSync(new URL("../public/app.js", import.meta.url), "utf8");
const noop = () => {};
const el = () => ({ innerHTML: "", textContent: "", hidden: false, classList: { add: noop, remove: noop, toggle: noop, contains: () => false }, addEventListener: noop, dataset: {}, style: {}, setAttribute: noop, appendChild: noop, querySelector: () => null, querySelectorAll: () => [], value: "", src: "", scrollTo: noop });

const seen = [];
const sandbox = {
  document: { getElementById: () => el(), querySelector: () => el(), querySelectorAll: () => [], createElement: () => el(), body: el(), addEventListener: noop, documentElement: el(), _spot: 0 },
  console, URLSearchParams, URL,
  fetch: (url, opts) => { seen.push({ url: String(url), headers: opts?.headers ?? {} }); return Promise.resolve({ ok: true, json: () => Promise.resolve({}) }); },
  location: { hash: "#/", replace: noop, pathname: "/panel/regtok123", search: "" },
  history: { pushState: noop }, localStorage: { getItem: () => null, setItem: noop, removeItem: noop },
  sessionStorage: { getItem: () => null, setItem: noop, removeItem: noop },
  matchMedia: () => ({ matches: false, addEventListener: noop, removeEventListener: noop }),
  IntersectionObserver: class { observe() {} unobserve() {} disconnect() {} },
  MutationObserver: class { observe() {} disconnect() {} },
  scrollTo: noop, addEventListener: noop, removeEventListener: noop, requestAnimationFrame: () => {}, TextEncoder, crypto,
  setTimeout, clearTimeout, setInterval, clearInterval,
  encodeURIComponent, decodeURIComponent, isNaN, parseInt, parseFloat,
  String, Number, Boolean, Array, Object, JSON, Promise, Date, Math, Error, RegExp, Set, Map, Proxy,
  navigator: { clipboard: { writeText: async () => {} } },
};
sandbox.window = sandbox;
vm.createContext(sandbox);

let bootErr = null;
process.on("uncaughtException", (e) => { if (!bootErr) bootErr = e; });
try { vm.runInContext(js, sandbox); } catch (e) { console.log("EVAL_FAIL:", e.message.slice(0, 160)); process.exit(1); }

setTimeout(() => {
  if (bootErr) { console.log("BOOT_ERR:", bootErr.message.slice(0, 160)); process.exit(1); }
  const ok = seen.some((s) => s.url.includes("/api/me") && s.headers["x-panel"] === "regtok123");
  if (!ok) { console.log("XPANEL_MISSING — boot لم يقرأ رابط اللوحة من المسار"); process.exit(1); }
  console.log("UI_BOOT_OK — x-panel يُبعث من /panel/ ✓");
  process.exit(0);
}, 1400);
