// بوابة المحلل — كل صيغ المفاتيح المعروفة تُطاع أو تفشل البناء
import { execSync } from "node:child_process";
import { unlinkSync } from "node:fs";
const hasLocal = (() => { try { execSync("test -x ./node_modules/.bin/esbuild", { stdio: "pipe" }); return true; } catch { return false; } })();
const esb = hasLocal ? "./node_modules/.bin/esbuild" : "npx --no-install esbuild";
execSync(`${esb} src/agent.ts --bundle --format=esm --outfile=tests/.agent.mjs --log-level=silent`, { stdio: "pipe" });
const { parseFleet, PLAN_QUOTA, PLAN_PRODUCTS } = await import("./.agent.mjs");
const G = "AIza" + "x".repeat(34), AQ = "AQ.Ab8" + "y".repeat(34), Q = "gsk_" + "q".repeat(40), O1 = "sk-or-v1-" + "a".repeat(48), O2 = "sk-or-01-" + "b".repeat(40), SK = "sk-" + "c".repeat(40);
let fails = 0;
const t = (n, c) => { console.log((c ? "✓" : "✗") + " " + n); if (!c) fails++; };
const cnt = (r, p) => new Set(r.filter(x => x.p === p).map(x => x.key)).size;
t("gemini عاري AIza", cnt(parseFleet(G), "gemini") === 1);
t("gemini صيغة AQ الجديدة", cnt(parseFleet(AQ), "gemini") === 1);
t("groq عاري", cnt(parseFleet(Q), "groq") === 1);
t("openrouter sk-or-v1-", cnt(parseFleet(O1), "openrouter") === 1);
t("openrouter صيغة sk-or- عامة", cnt(parseFleet(O2), "openrouter") === 1);
t("sk- عاري يذهب لأوبن راوتر (احتياط)", cnt(parseFleet(SK), "openrouter") === 1);
t("الثلاثة معاً بكل الصيغ", (() => { const f = parseFleet([AQ, Q, O1].join(", ")); return cnt(f, "gemini") === 1 && cnt(f, "groq") === 1 && cnt(f, "openrouter") === 1; })());
t("JSON قانوني", (() => { const f = parseFleet(JSON.stringify({ gemini: [{ name: "m", key: AQ }], groq: [{ name: "g", key: Q }] })); return cnt(f, "gemini") === 1 && cnt(f, "groq") === 1; })());
t("JSON مسطح", (() => { const f = parseFleet(JSON.stringify({ GEMINI: G, openrouter: O2 })); return cnt(f, "gemini") === 1 && cnt(f, "openrouter") === 1; })());
t("مدفون داخل بنية غريبة", (() => { const f = parseFleet(JSON.stringify({ a: { b: Q }, k: AQ })); return cnt(f, "groq") === 1 && cnt(f, "gemini") === 1; })());
t("مكرر يُدمج بلا تضاعف", cnt(parseFleet(AQ + "\n" + JSON.stringify({ gemini: AQ })), "gemini") === 1);
t("sk- احتياط لا يخطف gsk_", (() => { const f = parseFleet("x " + Q + " y"); return cnt(f, "groq") === 1 && cnt(f, "openrouter") === 0; })());
t("نفايات → صفر", parseFleet("hello !! ??").length === 0);
t("فراغ → صفر", parseFleet(undefined).length === 0);
t("الحصص 15/300/1000", PLAN_QUOTA.free === 15 && PLAN_QUOTA.pro === 300 && PLAN_QUOTA.vip === 1000);
t("حدود المنتجات 3/10/30", PLAN_PRODUCTS.free === 3 && PLAN_PRODUCTS.pro === 10 && PLAN_PRODUCTS.vip === 30);
try { unlinkSync("tests/.agent.mjs"); } catch {}
if (fails) { console.error(`فشل ${fails}`); process.exit(1); }
console.log("PARSER: كل الصيغ مطموعة");
