/* ═══════════════════════════════════════════════════════════════════
   VDB — قاعدة بيانات فيتو: غرفة المحرك في ناكساب.
   أول مهمة إنتاجية: مرآة سجل التدقيق الإداري (وضع الظل).
   ═══════════════════════════════════════════════════════════════════ */
import { D1BlockStore, GitHubWALMirror, VDB, type MinimalD1 } from "../../vdb/src";
import type { Env } from "./env";

let _db: VDB | null = null;

export const getVDB = async (env: Env): Promise<VDB> => {
  if (_db) return _db;
  const store = new D1BlockStore(env.DB as unknown as MinimalD1, "vdb_pages");
  await store.init(); /* أقراص قاعدة فيتو الذرية — بلا KV إطلاقاً */
  const mirror = new GitHubWALMirror({
    token: (env as unknown as { GH_VDB_TOKEN?: string }).GH_VDB_TOKEN,
    repo: (env as unknown as { GH_VDB_REPO?: string }).GH_VDB_REPO,
    dir: "naksab", /* أقراص الأبدية: كل جيل يُرشح للمستودع الملكي بالصيغة الموحدة */
  });
  _db = await VDB.open(store, {
    journal: true,
    maxKeysPerTenant: 20000,
    onCommit: async (info, pages) => {
      try {
        await mirror.archive(info.gen, pages); /* فشلها لا يمس الأقراص الحارة — البوابة تتحقق */
      } catch { /* الأبدية صامتة دائماً */ }
    },
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
