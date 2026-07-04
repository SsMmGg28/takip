"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

/**
 * Canlı saat: ilk değer mount sonrası (rAF ile) gelir, sonra stepMs'te bir
 * güncellenir. Sunucu tarafında null döner — widget'lar shimmer gösterir.
 */
export function useNow(stepMs = 1000): Date | null {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const update = () => setNow(new Date());
    const raf = requestAnimationFrame(update);
    const t = setInterval(update, stepMs);
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(t);
    };
  }, [stepMs]);

  return now;
}

const STORAGE_EVENT = "dashboard-storage-changed";

function subscribeStorage(callback: () => void) {
  window.addEventListener(STORAGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(STORAGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

/**
 * SSR uyumlu localStorage değeri. Sunucuda/hydration sırasında null döner;
 * yazma işlemi aynı sekmedeki diğer aboneleri de tetikler.
 * Dönen `hydrated` bayrağı istemci değerinin okunduğunu belirtir.
 */
export function useLocalStorageValue(
  key: string,
): [string | null, (next: string) => void, boolean] {
  const value = useSyncExternalStore(
    subscribeStorage,
    () => window.localStorage.getItem(key),
    () => null,
  );
  const hydrated = useSyncExternalStore(
    subscribeStorage,
    () => true,
    () => false,
  );

  const setValue = useCallback(
    (next: string) => {
      window.localStorage.setItem(key, next);
      window.dispatchEvent(new Event(STORAGE_EVENT));
    },
    [key],
  );

  return [value, setValue, hydrated];
}
