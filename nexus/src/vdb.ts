/* ═══════════════════════════════════════════════════════════════════
   VDB — قاعدة بيانات فيتو: غرفة المحرك في نكسوس.
   أول مهمة إنتاجية: مرآة سجل التدقيق (وضع الظل) — كل عملية إدارية
   تُكتب في D1 كما في قاعدتنا، والقراءة العكسية من قاعدتنا تثبت الحياة.
   ═══════════════════════════════════════════════════════════════════ */
import { KVBlockStore, VDB } from "../../vdb/src";
import type { Env } from "./env";

let _db: VDB | null = null;

export const getVDB = async (env: Env): Promise<VDB> => {
  if (_db) return _db;
  _db = await VDB.open(new KVBlockStore(env.CACHE_KV, "vdb:nexus:"), {
    journal: true,
    maxKeysPerTenant: 20000,
  });
  return _db;
};

export async function vdbAudit(env: Env, action: string, target: string, detail: string): Promise<void> {
  try {
    const db = await getVDB(env);
    await db
      .tenant("nexus")
      .bucket("audit")
      .put(`${Date.now().toString(36).padStart(10, "0")}:${Math.random().toString(36).slice(2, 8)}`, {
        action,
        target,
        detail,
        ts: Date.now(),
      });
  } catch {
    /* وضع الظل: المرآة لا تُسقط الإنتاج — وبوابة المحرك تتحقق من القراءة العكسية */
  }
}
