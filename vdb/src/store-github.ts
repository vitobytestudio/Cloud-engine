/* ═══════════════════════════════════════════════════════════════════
   VDB — store-github.ts — الأقراص الأبدية: أرشيف المستودع الملكي.
   كل جيل معتمد في الأقراص الحارة يُنسخ إلى المستودع كسجل WAL واحد
   بالصيغة الموحّدة (gen-NNN.bin) عبر واجهة GitHub الرسمية —
   بلا سقف كتابات، وتاريخ الجيلات يصبح تاريخ git الأبدية.
   فشل المرآة لا يمس الأقراص الحارة أبداً — هي طبقة فوقية صرفة.
   ═══════════════════════════════════════════════════════════════════ */
import { walEncode } from "./wal";

const b64enc = (u8: Uint8Array): string => {
  let s = "";
  const CH = 0x8000;
  for (let i = 0; i < u8.length; i += CH)
    s += String.fromCharCode(...u8.subarray(i, i + CH));
  return btoa(s);
};

export class GitHubWALMirror {
  constructor(
    private o: {
      token?: string;
      repo?: string; /* owner/name */
      dir?: string; /* مجلد الأرشيف داخل المستودع */
      branch?: string;
      api?: string; /* للاختبار — الافتراضي api.github.com */
    },
  ) {}

  get active(): boolean {
    return !!(this.o.token && this.o.repo);
  }

  /* أرشفة جيل كامل — true: نُزل، false: محفوظ سابقاً (تسامح التكرار) */
  async archive(gen: number, pages: Array<[number, Uint8Array]>): Promise<boolean> {
    if (!this.active) return false;
    const rec = walEncode(gen, pages);
    const dir = this.o.dir ?? "vdb-wal";
    const path = `${dir}/gen-${String(gen).padStart(12, "0")}.bin`;
    const api = this.o.api ?? "https://api.github.com";
    const res = await fetch(`${api}/repos/${this.o.repo}/contents/${path}`, {
      method: "PUT",
      headers: {
        authorization: `Bearer ${this.o.token}`,
        accept: "application/vnd.github+json",
        "content-type": "application/json",
        "user-agent": "vdb-eternal-mirror",
      },
      body: JSON.stringify({
        message: `vdb: archive gen ${gen} (${rec.length}B)`,
        content: b64enc(rec),
        branch: this.o.branch ?? "main",
      }),
    });
    if (res.status === 201) return true;
    if (res.status === 422 || res.status === 409) return false; /* الجيل في الأرشيف سابقاً */
    throw new Error("vdb:github_" + res.status);
  }

  /* قراءة سجل من الأرشيف — للترميم والفحص */
  async readGen(gen: number): Promise<Uint8Array | null> {
    if (!this.o.repo) return null;
    const dir = this.o.dir ?? "vdb-wal";
    const path = `${dir}/gen-${String(gen).padStart(12, "0")}.bin`;
    const api = this.o.api ?? "https://api.github.com";
    const res = await fetch(
      `${api}/repos/${this.o.repo}/contents/${path}?ref=${encodeURIComponent(this.o.branch ?? "main")}`,
      { headers: { authorization: this.o.token ? `Bearer ${this.o.token}` : "", accept: "application/vnd.github.raw", "user-agent": "vdb-eternal-mirror" } },
    );
    if (res.status === 404) return null;
    if (!res.ok) throw new Error("vdb:github_" + res.status);
    return new Uint8Array(await res.arrayBuffer());
  }
}
