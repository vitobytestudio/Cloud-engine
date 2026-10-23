"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

// سياق "الوضع الحي" — يتحكم في المحاكاة اللحظية عبر كل صفحات اللوحة

const LiveCtx = createContext<{ live: boolean; setLive: (v: boolean) => void }>({
  live: true,
  setLive: () => {},
});

export function LiveProvider({ children }: { children: React.ReactNode }) {
  const [live, setLiveState] = useState(true);
  useEffect(() => {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem("mirsal-live") : null;
    if (saved === "0") setLiveState(false);
  }, []);
  const setLive = useCallback((v: boolean) => {
    setLiveState(v);
    try {
      window.localStorage.setItem("mirsal-live", v ? "1" : "0");
    } catch {}
  }, []);
  return <LiveCtx.Provider value={{ live, setLive }}>{children}</LiveCtx.Provider>;
}

export function useLive() {
  return useContext(LiveCtx);
}

// جلب بيانات مع تحديث دوري (polling) — استبدل لاحقاً بـ SSE/WebSocket في الإنتاج

export function useJson<T>(url: string | null, intervalMs = 0) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const refresh = useCallback(async () => {
    if (!url) return;
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as T;
      if (mounted.current) {
        setData(json);
        setError(null);
      }
    } catch (e) {
      if (mounted.current) setError(String(e));
    }
  }, [url]);

  useEffect(() => {
    mounted.current = true;
    refresh();
    let t: ReturnType<typeof setInterval> | undefined;
    if (intervalMs > 0) t = setInterval(refresh, intervalMs);
    return () => {
      mounted.current = false;
      if (t) clearInterval(t);
    };
  }, [refresh, intervalMs]);

  return { data, error, refresh, setData };
}
