/* ═══════════════════════════════════════════════════════════════════
   VDB — node.mjs — عقدة الإمبراطورية السحابية.
   خادم HTTP يدير أقراصنا الخاصة (WAL + fsync) ويخدم محرك قاعدة فيتو:
   وضع/قراءة/عد/دفعة/ترميم + تغذية النسخ المتماثل + النسخ الاحتياطي.
   تشغيل: node node.mjs --port 8490 --data ./data --token SECRET
   ═══════════════════════════════════════════════════════════════════ */
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { VDB, DiskBlockStore } from "./vdb.bundle.mjs";

const arg = (name, def) => {
  const i = process.argv.indexOf("--" + name);
  return i > 0 ? process.argv[i + 1] : def;
};
const PORT = Number(arg("port", 8490));
const DATA = arg("data", join(dirname(fileURLToPath(import.meta.url)), "data"));
const TOKEN = arg("token", "vdb-empire-dev");

const b64 = (u8) => Buffer.from(u8).toString("base64");
const unb64 = (s) => new Uint8Array(Buffer.from(s || "", "base64"));

const store = new DiskBlockStore(DATA);
await store.init();
const db = await VDB.open(store, { journal: true });

const json = (res, code, obj) => {
  const b = JSON.stringify(obj);
  res.writeHead(code, { "content-type": "application/json" });
  res.end(b);
};

const readBody = (req) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (c) => {
      size += c.length;
      if (size > 4_000_000) {
        reject(new Error("too_large"));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://x");
    const path = url.pathname;
    if (req.headers["x-vdb-token"] !== TOKEN) return json(res, 403, { error: "forbidden" });

    if (path === "/vdb/health" && req.method === "GET")
      return json(res, 200, { ok: true, engine: "vdb", gen: db.stats().gen, pages: db.stats().pages });

    const body = req.method === "POST" ? JSON.parse((await readBody(req)) || "{}") : {};

    if (path === "/vdb/put" && req.method === "POST") {
      const v = body.v?.__raw ? unb64(body.v.raw) : body.v;
      const r = await db.put(String(body.t), String(body.b), body.k, v);
      return json(res, 200, { ok: true, gen: r.gen });
    }
    if (path === "/vdb/get" && req.method === "POST") {
      const v = await db.get(String(body.t), String(body.b), body.k);
      return json(res, 200, { v: v ? b64(v) : null });
    }
    if (path === "/vdb/list" && req.method === "POST") {
      const rows = await db.list(String(body.t), String(body.b), {
        limit: Math.min(Number(body.limit) || 500, 5000),
        prefix: body.prefix,
      });
      return json(res, 200, { rows: rows.map((r) => ({ k: r.k, v: b64(r.v) })) });
    }
    if (path === "/vdb/count" && req.method === "POST")
      return json(res, 200, { n: await db.count(String(body.t), String(body.b)) });
    if (path === "/vdb/batch" && req.method === "POST") {
      await db.batch(async (d) => {
        for (const op of body.ops || []) {
          if (op.op === "put") await d.put(String(op.t), String(op.b), op.k, op.v?.__raw ? unb64(op.v.raw) : op.v);
          else if (op.op === "del") await d.del(String(op.t), String(op.b), op.k);
        }
      });
      return json(res, 200, { ok: true });
    }
    if (path === "/vdb/compact" && req.method === "POST") {
      const r = await db.compact();
      return json(res, 200, { ok: true, gen: r.gen });
    }
    if (path === "/vdb/sync" && req.method === "GET") {
      const since = Number(url.searchParams.get("since")) || 0;
      const records = store.syncSince(since).map((r) => ({
        gen: r.gen,
        entries: r.entries.map((e) => ({ p: e.p, d: b64(e.data) })),
      }));
      return json(res, 200, { records });
    }
    if (path === "/vdb/dump" && req.method === "GET")
      return json(res, 200, { pages: store.dump().map((x) => ({ p: x.p, d: b64(x.data) })) });
    if (path === "/vdb/restore" && req.method === "POST") {
      await store.restore((body.pages || []).map((x) => ({ p: Number(x.p), data: unb64(x.d) })));
      await db.fresh(); /* الأقراص تغيرت خلف ظهرنا — زامن اللقطة فوراً */
      return json(res, 200, { ok: true, gen: db.stats().gen });
    }
    return json(res, 404, { error: "not_found" });
  } catch (e) {
    return json(res, 400, { error: String(e?.message || e).slice(0, 120) });
  }
});

server.listen(PORT, "0.0.0.0", () => console.log(`VDB empire node on :${PORT} data=${DATA}`));
const bye = async () => {
  await store.seal().catch(() => {});
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 1500).unref();
};
process.on("SIGTERM", bye);
process.on("SIGINT", bye);
