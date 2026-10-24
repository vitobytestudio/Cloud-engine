import fs from "fs";
import path from "path";
import type { DB } from "./types";
import { buildSeed } from "./seed";

// مخزن JSON بسيط للنسخة التجريبية — يُستبدل لاحقاً بـ PostgreSQL دون تغيير الواجهات
const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

let cache: DB | null = null;

export function db(): DB {
  if (cache) return cache;
  try {
    if (fs.existsSync(DB_FILE)) {
      cache = JSON.parse(fs.readFileSync(DB_FILE, "utf8")) as DB;
      return cache;
    }
  } catch {
    // ملف تالف → إعادة التهيئة
  }
  cache = buildSeed();
  persist();
  return cache;
}

export function persist() {
  if (!cache) return;
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = DB_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(cache, null, 2));
  fs.renameSync(tmp, DB_FILE);
}
