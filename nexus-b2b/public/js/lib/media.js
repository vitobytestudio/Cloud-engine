// ——— وسائط v0.10-A: ضغط الفيديو داخل الجهاز + شريط تقدم حقيقي ———
import { t } from "../i18n.js";

// ورقة تقدم: مراحل واضحة (تهيئة → ضغط → رفع) بنسبة مئوية
export function progressSheet(label) {
  const root = document.getElementById("overlay-root");
  const el = document.createElement("div");
  el.className = "up-progress";
  el.innerHTML = `<div class="up-box"><b>${label}</b><div class="up-bar"><i></i></div><small>0%</small></div>`;
  root.appendChild(el);
  return {
    set(pct) {
      const i = el.querySelector(".up-bar i");
      if (i) i.style.width = Math.max(0, Math.min(100, pct)) + "%";
      const s = el.querySelector("small");
      if (s) s.textContent = Math.round(pct) + "%";
    },
    label(t2) { const b = el.querySelector("b"); if (b) b.textContent = t2; },
    done() { el.remove(); },
  };
}

// ضغط الفيديو محلياً: 720px جانب طويل + صوت أصلي مُعاد ترميزه — نمط إنستغرام
// فيديو 15ث من كاميرا الهاتف (~40MB) → ~3-5MB يُرفع بثوانٍ
export function compressVideo(file, onPct) {
  return new Promise((resolve) => {
    try {
      if (!file || !String(file.type || "").startsWith("video/") || file.size < 3_500_000) return resolve(file);
      if (typeof MediaRecorder === "undefined" || !HTMLCanvasElement.prototype.captureStream) return resolve(file);
      const url = URL.createObjectURL(file);
      const v = document.createElement("video");
      v.src = url;
      v.playsInline = true;
      v.preload = "auto";
      let settled = false;
      const giveUp = () => { if (!settled) { settled = true; URL.revokeObjectURL(url); resolve(file); } };
      v.onerror = giveUp;
      v.onloadedmetadata = () => {
        try {
          if (!v.videoWidth || !v.duration || !isFinite(v.duration)) return giveUp();
          const long = Math.max(v.videoWidth, v.videoHeight);
          const scale = Math.min(1, 720 / long);
          const canvas = document.createElement("canvas");
          canvas.width = Math.max(2, Math.round(v.videoWidth * scale / 2) * 2);
          canvas.height = Math.max(2, Math.round(v.videoHeight * scale / 2) * 2);
          const ctx = canvas.getContext("2d");
          if (!ctx || typeof canvas.captureStream !== "function") return giveUp();
          const stream = canvas.captureStream(30);
          // الصوت الأصلي: يوجَّه للتسجيل دون إخراج للسماعة
          let audioCtx = null;
          try {
            audioCtx = new AudioContext();
            const src = audioCtx.createMediaElementSource(v);
            const dest = audioCtx.createMediaStreamDestination();
            src.connect(dest);
            dest.stream.getAudioTracks().forEach((tr) => stream.addTrack(tr));
          } catch {}
          const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
            ? "video/webm;codecs=vp9,opus"
            : MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus") ? "video/webm;codecs=vp8,opus" : "video/webm";
          const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 2_200_000 });
          const chunks = [];
          rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
          rec.onstop = () => {
            if (settled) return;
            settled = true;
            URL.revokeObjectURL(url);
            try { audioCtx?.close(); } catch {}
            const out = new Blob(chunks, { type: "video/webm" });
            if (out.size > 0 && out.size < file.size) {
              const name = (file.name || "clip").replace(/\.[^.]+$/, "") + ".webm";
              resolve(new File([out], name, { type: "video/webm" }));
            } else resolve(file);
          };
          rec.onerror = giveUp;
          v.onended = () => { try { if (rec.state !== "inactive") rec.stop(); } catch {} };
          v.ontimeupdate = () => { if (v.duration && onPct) onPct(Math.min(99, (v.currentTime / v.duration) * 100)); };
          rec.start(250);
          const p = v.play();
          if (p && p.catch) p.catch(() => { try { rec.stop(); } catch {} });
          // مهلة أمان: 3× المدة + 8ث
          setTimeout(() => { try { if (rec.state !== "inactive") rec.stop(); } catch {} }, (v.duration || 90) * 3000 + 8000);
        } catch { giveUp(); }
      };
      setTimeout(giveUp, 9000); // إن لم تُحمَّل البيانات الوصفية
    } catch { resolve(file); }
  });
}
