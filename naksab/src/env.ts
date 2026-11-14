export type Env = {
  DB: D1Database;
  CACHE_KV: KVNamespace;
  ASSETS: Fetcher;
  ENVIRONMENT: string;
  GEMINI_API_KEY?: string;
  GROQ_API_KEY?: string;
  OPENROUTER_API_KEY?: string;
  ADMIN_BOOTSTRAP_EMAIL?: string;
  ADMIN_PATH_SECRET?: string;
  ADMIN_SETUP_TOKEN?: string;
  /* بوابة بريدي موب المؤتمتة — تُضبط بأسرار المالك حصراً */
  CCP_PAY?: string;            /* "RIP:CLÉ" مثل 00799999004159589:029 */
  BARIDI_USER?: string;        /* دخول موقع بريد الجزائر للقراءة الآلية */
  BARIDI_PASS?: string;
  BARIDI_ANSWER?: string;
  BARIDI_ENDPOINT?: string;    /* اختياري — عنوان القارئ الافتراضي يُستبدل به */
};

export type Session = { userId: string; role: string; csrf: string } | null;
