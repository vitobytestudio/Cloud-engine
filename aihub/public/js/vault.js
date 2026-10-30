// ——— الخزنة الصفرية المعرفة: WebCrypto داخل جهازك — الخادم يرى نصاً مشفّراً فقط ———
// KEK = PBKDF2(vaultPassword, salt, 650k) → AES-256-GCM يشفّر JSON المفاتيح
// كلمة سر الخزنة لا تُرسل أبداً؛ الخادم لا يستطيع الاشتقاق لأن الملح يبقى داخل الـblob

const PBKDF2_ITER = 650000;

const enc = new TextEncoder();
const dec = new TextDecoder();

function b64(buf) {
  const u = new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < u.length; i++) s += String.fromCharCode(u[i]);
  return btoa(s);
}
function unb64(s) {
  const bin = atob(s);
  const u = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
  return u;
}

async function deriveKEK(password, salt) {
  const base = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", hash: "SHA-256", salt: salt, iterations: PBKDF2_ITER },
    base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]
  );
}

export async function encryptBlob(password, data) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const kek = await deriveKEK(password, salt);
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv }, kek, enc.encode(JSON.stringify(data)));
  return JSON.stringify({ v: 1, kdf: "PBKDF2-SHA256", iter: PBKDF2_ITER, salt: b64(salt.buffer), iv: b64(iv.buffer), ct: b64(ct) });
}

export async function decryptBlob(password, blobJson) {
  const p = JSON.parse(blobJson);
  const kek = await deriveKEK(password, unb64(p.salt));
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(p.iv) }, kek, unb64(p.ct));
  return JSON.parse(dec.decode(pt));
}

// ——— حالة الجلسة: المفاتيح وكلمة السر في الذاكرة فقط — لا localStorage إطلاقاً ———
export const vaultState = {
  unlocked: false,
  keys: [], // { id, provider, label, key }
  _pass: null,
};
