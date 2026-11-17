/* ═══════════════════════════════════════════════════════════════════
   VDB — قاعدة بيانات فيتو: غرفة المحرك في ناكساب.
   أول مهمة إنتاجية: مرآة سجل التدقيق الإداري (وضع الظل).
   ═══════════════════════════════════════════════════════════════════ */
import { KVBlockStore, VDB } from "../../vdb/src";
import type { Env } from "./env";

let _db: VDB | null = null;

export const getVDB = async (env: Env): Promise<VDB> => {
  if (_db) return _db;
  _db = await VDB.open(new KVBlockStore(env.CACHE_KV, "vdb:naksab:"), {
    journal: true,
    maxKeysPerTenant: 20000,
  });
  return _db;
};

export async function vdbAudit(env: Env, adminId: string, action: string, detail: string): Promise<void> {
  try {
    const db = await getVDB(env);
    await db
      .tenant("naksab")
      .bucket("audit")
      .put(`${Date.now().toString(36).padStart(10, "0")}:${Math.random().toString(36).slice(2, 8)}`, {
        adminId,
        action,
        detail,
        ts: Date.now(),
      });
  } catch {
    /* وضع الظل: المرآة لا تُسقط الإنتاج */
  }
}
