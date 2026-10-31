export type Env = {
  DB: D1Database;
  CACHE_KV: KVNamespace;
  ASSETS: Fetcher;
  AI?: unknown; // ربط Workers AI — الإنتاج فقط (التطوير بلا شبكة يعيد خطأ لطيفاً)
  ENVIRONMENT: string;
  AUTH_PEPPER?: string;
  AUTH_ITER?: string; // دورات PBKDF2 — المجانية 15k، المدفوعة ارفعها لـ100k+
  // مفاتيح المنصة (من أسرار GitHub → أسرار Worker) — للحلقة المفتوحة فقط، لا تُسجَّل ولا تُعاد للمستخدم
  GROQ_API_KEY?: string;
  CEREBRAS_API_KEY?: string;
  GEMINI_API_KEY?: string;
  OPENROUTER_API_KEY?: string;
  HUGGINGFACE_API_KEY?: string;
  NVIDIA_API_KEY?: string;
  MISTRAL_API_KEY?: string;
  SAMBANOVA_API_KEY?: string;
  COHERE_API_KEY?: string;
  E2B_API_KEY?: string; // محرك بيئة الفريق اللحظية (E2B) — إن غاب اعتُبر المحرك غير مفعّل
};

export type Session = { token: string | null; csrf: string | null; userId: string | null };
