"use client";

import { useEffect, useState } from "react";
import { BellRing, Loader2, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { savePushSubscription, deletePushSubscription } from "@/lib/actions/push";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Service worker'ı uygulama açılır açılmaz kaydeder; böylece daha önce
 * abone olmuş cihazlar zile hiç dokunmadan da push almaya devam eder.
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/", updateViaCache: "none" })
        .catch(() => {
          // kayıt başarısızsa push açılırken tekrar denenir
        });
    }
  }, []);
  return null;
}

type PushState =
  | "loading" // destek/abonelik durumu henüz bilinmiyor
  | "unsupported" // tarayıcı web push desteklemiyor
  | "ios-install" // iOS: önce ana ekrana eklenmeli
  | "denied" // bildirim izni reddedilmiş
  | "off"
  | "on"
  | "busy";

/**
 * Telefon/kilit ekranı bildirimleri: service worker'ı kaydeder ve web push
 * aboneliğini açıp kapatmayı sağlar. Bildirim panelinin alt satırında yaşar.
 */
export function PushNotificationToggle() {
  const [state, setState] = useState<PushState>("loading");

  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (!VAPID_PUBLIC_KEY) {
        setState("unsupported");
        return;
      }
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const standalone = window.matchMedia("(display-mode: standalone)").matches;
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        setState(isIOS && !standalone ? "ios-install" : "unsupported");
        return;
      }
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        });
        const sub = await registration.pushManager.getSubscription();
        if (cancelled) return;
        if (sub) {
          setState("on");
        } else if (Notification.permission === "denied") {
          setState("denied");
        } else {
          setState("off");
        }
      } catch {
        if (!cancelled) setState("unsupported");
      }
    }

    void init();
    return () => {
      cancelled = true;
    };
  }, []);

  async function enable() {
    setState("busy");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState(permission === "denied" ? "denied" : "off");
        if (permission === "denied") {
          toast.error("Bildirim izni reddedildi. Tarayıcı ayarlarından açabilirsin.");
        }
        return;
      }
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY!),
      });
      await savePushSubscription(
        JSON.parse(JSON.stringify(sub)),
        navigator.userAgent,
      );
      setState("on");
      toast.success("Telefon bildirimleri açıldı 🎉");
    } catch (err) {
      console.error("[push subscribe]", err);
      setState("off");
      toast.error("Bildirimler açılamadı. Daha sonra tekrar dene.");
    }
  }

  async function disable() {
    setState("busy");
    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.getSubscription();
      if (sub) {
        await sub.unsubscribe();
        await deletePushSubscription(sub.endpoint);
      }
      setState("off");
      toast("Telefon bildirimleri kapatıldı.");
    } catch {
      setState("on");
      toast.error("Bildirimler kapatılamadı.");
    }
  }

  if (state === "loading" || state === "unsupported") return null;

  if (state === "ios-install") {
    return (
      <div className="flex items-start gap-2.5 border-t bg-muted/40 px-4 py-3">
        <Smartphone className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <p className="text-xs leading-snug text-muted-foreground">
          Kilit ekranı bildirimleri için siteyi önce{" "}
          <span className="font-medium text-foreground">
            Paylaş → Ana Ekrana Ekle
          </span>{" "}
          ile yükle, sonra uygulamadan bu düğmeyi aç.
        </p>
      </div>
    );
  }

  if (state === "denied") {
    return (
      <div className="flex items-start gap-2.5 border-t bg-muted/40 px-4 py-3">
        <BellRing className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <p className="text-xs leading-snug text-muted-foreground">
          Bildirim izni engellenmiş. Telefon bildirimleri için tarayıcı
          ayarlarından bu siteye izin ver.
        </p>
      </div>
    );
  }

  const on = state === "on";
  return (
    <div className="flex items-center justify-between gap-3 border-t bg-muted/40 px-4 py-2.5">
      <span className="flex items-center gap-2 text-xs font-medium">
        <Smartphone className="h-4 w-4 text-muted-foreground" />
        Telefon bildirimleri
      </span>
      <button
        type="button"
        onClick={on ? disable : enable}
        disabled={state === "busy"}
        aria-pressed={on}
        className={cn(
          "flex h-7 items-center gap-1.5 rounded-full px-3 text-[11px] font-semibold transition-colors",
          on
            ? "gradient-surface text-white shadow-sm"
            : "border bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        )}
      >
        {state === "busy" ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <BellRing className="h-3.5 w-3.5" />
        )}
        {on ? "Açık" : "Aç"}
      </button>
    </div>
  );
}
