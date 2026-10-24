// ——— التشفير: PBKDF2 للكلمات السرية، AES-256-GCM للوصولات، SHA-256 للبصمات ———

const enc = new TextEncoder();

export function bufToHex(buf: ArrayBuffer | Uint8Array): string {
  const u8 = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  return Array.from(u8).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function hexToBuf(hex: string): Uint8Array {
  const clean = hex.replace(/[^0-9a-f]/gi, "");
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  return out;
}

export function randomHex(bytes = 32): string {
  const u8 = crypto.getRandomValues(new Uint8Array(bytes));
  return bufToHex(u8);
}

export function randomToken(): string {
  const u8 = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...u8)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function randomId(prefix = ""): string {
  const u8 = crypto.getRandomValues(new Uint8Array(12));
  return prefix + bufToHex(u8);
}

/** مرجع دفع بشري قابل للقراءة وغير قابل للتخمين — بلا أحرف ملتبسة */
export function paymentReference(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const u8 = crypto.getRandomValues(new Uint8Array(6));
  return "MRS-" + Array.from(u8).map((b) => alphabet[b % alphabet.length]).join("");
}

export async function sha256Hex(data: string | Uint8Array | ArrayBuffer): Promise<string> {
  const input = typeof data === "string" ? enc.encode(data) : data;
  const digest = await crypto.subtle.digest("SHA-256", input as ArrayBuffer);
  return bufToHex(digest);
}

export async function pbkdf2Hash(password: string, saltHex: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: hexToBuf(saltHex), iterations: 100_000 },
    key,
    256
  );
  return bufToHex(bits);
}

/** AES-256-GCM: المخرجات = nonce(12B) || ciphertext */
export async function aesEncrypt(keyHex: string, plaintext: ArrayBuffer): Promise<ArrayBuffer> {
  const key = await crypto.subtle.importKey("raw", hexToBuf(keyHex), "AES-GCM", false, ["encrypt"]);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plaintext);
  const out = new Uint8Array(12 + ct.byteLength);
  out.set(iv, 0);
  out.set(new Uint8Array(ct), 12);
  return out.buffer;
}

export async function aesDecrypt(keyHex: string, blob: ArrayBuffer): Promise<ArrayBuffer> {
  const key = await crypto.subtle.importKey("raw", hexToBuf(keyHex), "AES-GCM", false, ["decrypt"]);
  const u8 = new Uint8Array(blob);
  const iv = u8.slice(0, 12);
  const ct = u8.slice(12);
  return crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
}

/** مقارنة زمن-ثابت للنصوص السرية */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
