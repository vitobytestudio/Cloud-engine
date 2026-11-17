/* ═══════════════════════════════════════════════════════════════════
   VDB — بوابة الهجين: أقراص حارة تلتزم لحظياً + أقراص أبدية تُرشح
   كل جيل إلى المستودع الملكي، بصيغة WAL واحدة فوق الطبقات كلها.
   خادم GitHub مزيّف حقيقي (node:http) يُختبر عليه كل شيء: الأرشفة،
   تسامح التكرار، سقوط المرآة بلا مساس للمسار الساخن، إعادة البناء
   من الأرشيف، وتطابق الصيغة مع أقراص الإمبراطورية الملفية حرفياً.
   ═══════════════════════════════════════════════════════════════════ */
import { execFileSync } from "node:child_process";
import { createServer } from "node:http";
import { existsSync, rmSync, readFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../..", import.meta.url));
const esb = ["nexus/node_modules/.bin/esbuild", "naksab/node_modules/.bin/esbuild"]
  .map((p) => root + p)
  .find(existsSync);
if (!esb) {
  console.error("::error::esbuild غير موجود — ثبت حزم المنصتين أولاً");
  process.exit(1);
}
execFileSync(
  esb,
  [root + "vdb/server/bundle-entry.ts", "--bundle", "--format=esm", "--platform=node", "--charset=utf8", "--outfile=" + root + "vdb/server/vdb.bundle.mjs"],
  { stdio: "pipe" },
);
const V = await import(root + "vdb/server/vdb.bundle.mjs");

let pass = 0;
const fails = [];
const ok = (name, cond, detail = "") => {
  if (cond) pass++;
  else fails.push(name + (detail ? " — " + detail : ""));
  console.log((cond ? "✓ " : "✗ ") + name + (cond ? "" : "  ✗✗ " + detail));
};

/* ═══ 1) صيغة WAL الموحّدة: ترميز وفك وبصمة تسقط التمزق ═══ */
{
  const pages = [
    [5, new TextEncoder().encode("hello-pages")],
    [0, new Uint8Array([9, 9, 9])],
    [7, new Uint8Array([1, 2, 3])],
  ];
  const rec = V.walEncode(42, pages);
  const dec = V.walDecode(rec);
  ok("ترميز وفك سجل WAL يدور كاملاً", dec.gen === 42 && dec.pages.length === 2 && new TextDecoder().decode(dec.pages[0].data) === "hello-pages" && dec.meta.length === 3);
  const corrupted = rec.slice();
  corrupted[25] ^= 0xff; /* تمزيق في الحمولة */
  let cut = false;
  try {
    V.walDecode(corrupted);
  } catch (e) {
    cut = String(e?.message || e).includes("crc");
  }
  ok("بصمة CRC تسقط التمزق قبل أي فك", cut);
}

/* ═══ 2) تطابق الصيغة مع أقراص الإمبراطورية الملفية حرفياً ═══ */
{
  const dir = mkdtempSync(join(tmpdir(), "vdb-wal-compat-"));
  const st = new V.DiskBlockStore(dir);
  await st.init();
  const meta = new Uint8Array([7, 7]);
  await st.atomicCommit([[3, new TextEncoder().encode("قرص-الإمبراطورية")]], meta, 1);
  const raw = readFileSync(join(dir, "vdb.wal"));
  const dec = V.walDecode(new Uint8Array(raw));
  ok("سجل القرص الملفي يُفك بنفس فاك الأرشيف الأبدي — الصيغة واحدة", dec.gen === 1 && new TextDecoder().decode(dec.pages[0].data) === "قرص-الإمبراطورية" && dec.meta.length === 2);
}

/* ═══ 3) خادم GitHub مزيّف حقيقي ═══ */
const files = new Map();
const gh = createServer((req, res) => {
  const path = decodeURIComponent(req.url.split("?")[0]);
  if (req.method === "PUT" && path.startsWith("/repos/o/r/contents/")) {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      const j = JSON.parse(body);
      if (files.has(path)) {
        res.writeHead(422);
        res.end(JSON.stringify({ message: "sha wasn't supplied" }));
        return;
      }
      files.set(path, Buffer.from(j.content, "base64"));
      res.writeHead(201);
      res.end(JSON.stringify({ commit: { sha: "f" + files.size } }));
    });
    return;
  }
  if (req.method === "GET" && path.startsWith("/repos/o/r/contents/")) {
    const b = files.get(path);
    if (!b) {
      res.writeHead(404);
      res.end();
      return;
    }
    res.writeHead(200, { "content-type": "application/octet-stream" });
    res.end(b);
    return;
  }
  res.writeHead(500);
  res.end();
});
await new Promise((r) => gh.listen(0, "127.0.0.1", r));
const ghPort = gh.address().port;
const ghApi = `http://127.0.0.1:${ghPort}`;

/* ═══ 4) المحرك الهجين: التزام حار + أرشفة أبدية لكل جيل ═══ */
{
  const mirror = new V.GitHubWALMirror({ token: "t", repo: "o/r", dir: "nexus", api: ghApi });
  ok("المرآة الأبدية نشطة بأسرارها", mirror.active);
  const db = await V.VDB.open(new V.MemoryBlockStore(), { journal: true, onCommit: async (info, pages) => { await mirror.archive(info.gen, pages); } });
  await db.put("تاجر", "audit", "و1", { action: "plan" });
  await db.batch(async (d) => {
    await d.put("تاجر", "audit", "و2", { action: "ban" });
    await d.put("تاجر", "audit", "و3", { action: "verify" });
  });
  await db.put("تاجر", "audit", "و4", { action: "svc_add" });
  await new Promise((r) => setTimeout(r, 200)); /* المرآة الأبدية fire-and-forget — انتظر تسويتها */
  ok("الأرشيف استقبل 3 سجلات (التزامان الفرديان + الدفعة)", files.size === 3, `ملفات=${files.size}`);
  const paths = [...files.keys()].sort();
  ok("أسماء الأرشيف بترتيب الجيلات المعتّم", paths[0].includes("gen-000000000001.bin") && paths[2].includes("gen-000000000003.bin"), paths.join(","));

  /* إعادة البناء من الأرشيف الأبدي: فك كل سجل وإعادة التزامه على أقراص جديدة */
  const st = new V.MemoryBlockStore();
  for (const p of paths) {
    const rec = V.walDecode(new Uint8Array(files.get(p)));
    await st.atomicCommit(rec.pages.map((x) => [x.p, x.data]), rec.meta, rec.gen);
  }
  const rebuilt = await V.VDB.open(st);
  await rebuilt.fresh();
  const n = await rebuilt.count("تاجر", "audit");
  const spot = await rebuilt.get("تاجر", "audit", "و3");
  ok("إعادة البناء من الأرشيف الأبدي: كل القيود عادت حرفياً", n === 4 && spot && JSON.parse(new TextDecoder().decode(spot)).action === "verify", `قيود=${n}`);
}

/* ═══ 5) تسامح التكرار وسقوط المرآة ═══ */
{
  const mirror = new V.GitHubWALMirror({ token: "t", repo: "o/r", dir: "nexus", api: ghApi });
  const rec = V.walEncode(1, [[9, new Uint8Array([1])]]);
  const first = await mirror.archive(1, [[9, new Uint8Array([1])]]);
  ok("أرشفة جيل موجود سابقاً = false (لا ازدواج)", first === false && files.size === 3, void rec);

  /* مرآة تنفجر — المحرك لا يشعر */
  const bomb = new V.GitHubWALMirror({ token: "t", repo: "o/r", dir: "x", api: ghApi });
  bomb.archive = async () => {
    throw new Error("github_503");
  };
  let hotOk = false;
  const db2 = await V.VDB.open(new V.MemoryBlockStore(), { journal: false, onCommit: async (i, p) => { await bomb.archive(i.gen, p); } });
  try {
    await db2.put("t", "b", "k", "v");
    hotOk = true;
  } catch {}
  ok("سقوط المرآة الأبدية لا يمس المسار الساخن إطلاقاً", hotOk && (await db2.get("t", "b", "k")) !== null);
}

/* ═══ 6) بلا أسرار: مرآة خاملة — الهجين يتحول لأقراص حارة صرفة بلا كسر ═══ */
{
  const idle = new V.GitHubWALMirror({ api: ghApi });
  ok("المرآة بلا أسرار خاملة صمتاً", !idle.active && (await idle.archive(1, [[1, new Uint8Array(0)]])) === false && files.size === 3);
}

gh.close();
console.log(`═══ VDB HYBRID GATE: ${pass}/${pass + fails.length} ═══`);
if (fails.length) {
  console.error("الفاشل:", fails);
  process.exit(1);
}
