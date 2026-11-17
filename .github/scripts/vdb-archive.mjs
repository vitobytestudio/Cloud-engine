#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════
   أمين الإمبراطورية — يسحب أجيال قاعدة فيتو من أقراص D1 الحارة
   ويُلحقها بالأرشيف الملكي داخل هذا المستودع (vdb-wal/<منصة>/gen-*.bin)
   بالصيغة الموحدة، ثم يفتش سلامة الأرشيف ويكتب التقرير.
   استعمال: PLATFORM=nexus DB_NAME=nexus_db node vdb-archive.mjs
   ═══════════════════════════════════════════════════════════════════ */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";

const PLATFORM = process.env.PLATFORM || "nexus";
const DB_NAME = process.env.DB_NAME || "nexus_db";
const DIR = `vdb-wal/${PLATFORM}`;
mkdirSync(DIR, { recursive: true });

const d1 = (sql) =>
  JSON.parse(
    execFileSync(
      "npx",
      ["wrangler", "d1", "execute", "DB", "--remote", "--json", "--command", sql],
      { env: { ...process.env, CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID }, stdio: ["ignore", "pipe", "pipe"], cwd: PLATFORM },
    ).toString().split("\n").filter((l) => l.startsWith("[") || l.startsWith("{")).join("\n") || "{}",
  )[0]?.results ?? [];

/* آخر جيل مؤرشف — من الملفات الموجودة */
let last = 0;
for (const f of readdirSync(DIR))
  if (f.startsWith("gen-") && f.endsWith(".bin")) {
    const g = Number(f.slice(4, 16));
    if (g > last) last = g;
  }

/* الأجيال على الأقراص الحارة */
const commits = d1(`SELECT gen FROM vdb_commits WHERE gen > ${last} ORDER BY gen LIMIT 500`);
let archived = 0, skipped = 0, bad = 0;
for (const { gen } of commits) {
  const rows = d1(`SELECT page, data FROM vdb_pages WHERE gen = ${gen} ORDER BY page`);
  if (!rows.length) continue;
  /* صيغة WAL الموحدة: سحر=0x56 + حجم + جيل + عدد + CRC32 (يُحسب هنا) */
  const parts = rows.map((r) => ({ p: r.page, data: Buffer.from(r.data.replace(/^0x/i, ""), "hex") }));
  const meta = parts.find((x) => x.p === 0);
  if (!meta) { bad++; continue; }
  const bodyLen = 17 + parts.reduce((a, x) => a + 8 + x.data.length, 0);
  const rec = Buffer.alloc(bodyLen);
  rec[0] = 0x56;
  rec.writeUInt32BE(bodyLen - 17, 1);
  rec.writeUInt32BE(gen, 5);
  rec.writeUInt32BE(parts.length, 9);
  let o = 17;
  for (const x of parts) {
    rec.writeUInt32BE(x.p, o);
    rec.writeUInt32BE(x.data.length, o + 4);
    x.data.copy(rec, o + 8);
    o += 8 + x.data.length;
  }
  rec.writeUInt32BE(crc32(rec, 17, bodyLen), 13);
  writeFileSync(`${DIR}/gen-${String(gen).padStart(12, "0")}.bin`, rec);
  archived++;
}
function crc32(b, s, e) {
  let c = ~0;
  for (let i = s; i < e; i++) {
    c ^= b[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

/* فحص سلامة الأرشيف كله — كل ملف يُفك وتُدقق بصمته */
let scanned = 0, healthy = 0;
for (const f of readdirSync(DIR)) {
  if (!f.endsWith(".bin")) continue;
  scanned++;
  const b = readFileSync(`${DIR}/${f}`);
  try {
    const dv = b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
    if (b[0] !== 0x56) throw 0;
    if (crc32(b, 17, 17 + dv.getUint32(1)) !== dv.getUint32(13)) throw 0;
    healthy++;
  } catch {}
}

const report = `PLATFORM=${PLATFORM} أُرشف=${archived} متجاوَز=${skipped} فاسد=${bad} فحص=${healthy}/${scanned} آخر_جيل=${last + archived}`;
console.log("═══ " + report + " ═══");
if (bad > 0) {
  console.error("::error::سجل فاسد في الأرشيف — الترميم إلزامي");
  process.exit(1);
}
if (archived > 0) {
  execFileSync("git", ["add", DIR]);
  execFileSync("git", ["commit", "-m", `vdb[${PLATFORM}]: أرشفة ${archived} جيلاً — فحص ${healthy}/${scanned}`]);
  console.log("::notice::الأرشيف الملكي تحدث");
}
