"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Bell,
  BookOpen,
  BookCheck,
  BookX,
  ClipboardList,
  PencilLine,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { AppNotification, NotificationType } from "@/lib/types";

const TYPE_ICON: Record<NotificationType, LucideIcon> = {
  homework_assigned: ClipboardList,
  homework_updated: PencilLine,
  homework_incomplete: AlertTriangle,
  book_pending: BookOpen,
  book_approved: BookCheck,
  book_rejected: BookX,
};

const TYPE_TONE: Record<NotificationType, string> = {
  homework_assigned: "bg-primary/12 text-primary",
  homework_updated: "bg-warning/15 text-warning",
  homework_incomplete: "bg-destructive/12 text-destructive",
  book_pending: "bg-primary/12 text-primary",
  book_approved: "bg-success/15 text-success",
  book_rejected: "bg-destructive/12 text-destructive",
};

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "şimdi";
  if (mins < 60) return `${mins} dk önce`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} sa önce`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} gün önce`;
  return new Date(iso).toLocaleDateString("tr-TR");
}

/**
 * Bildirim zili: Supabase Realtime ile canlı bildirim dinler (Vercel'in
 * sunucusuz yapısından bağımsız — tarayıcı doğrudan Supabase'e bağlanır).
 */
export function NotificationsBell({ userId }: { userId: string }) {
  const router = useRouter();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [open, setOpen] = useState(false);
  const [ringing, setRinging] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);

  function getSupabase() {
    if (!supabaseRef.current) supabaseRef.current = createClient();
    return supabaseRef.current;
  }

  const unreadCount = items.filter((n) => !n.read_at).length;

  const load = useCallback(async () => {
    const { data } = await getSupabase()
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(30);
    if (data) setItems(data as AppNotification[]);
  }, []);

  useEffect(() => {
    void load();

    const supabase = getSupabase();
    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const n = payload.new as AppNotification;
          setItems((prev) => [n, ...prev].slice(0, 30));
          setRinging(true);
          setTimeout(() => setRinging(false), 1200);
          toast(n.title, { description: n.body ?? undefined });
          router.refresh();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, load, router]);

  // Panel dışına tıklanınca kapan
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!panelRef.current?.contains(e.target as Node)) setOpen(false);
    }
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  async function markAllRead() {
    if (!items.some((n) => !n.read_at)) return;
    const now = new Date().toISOString();
    setItems((prev) => prev.map((n) => (n.read_at ? n : { ...n, read_at: now })));
    await getSupabase()
      .from("notifications")
      .update({ read_at: now })
      .is("read_at", null);
  }

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next) void markAllRead();
  }

  return (
    <div ref={panelRef} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-label={
          unreadCount > 0 ? `Bildirimler (${unreadCount} okunmamış)` : "Bildirimler"
        }
        aria-expanded={open}
        className={cn(
          "relative flex h-9 w-9 items-center justify-center rounded-full border bg-card/60 shadow-sm hover:bg-accent hover:text-accent-foreground active:scale-90",
          ringing && "animate-pop",
        )}
      >
        <Bell className="h-[18px] w-[18px]" />
        {unreadCount > 0 && (
          <>
            <span className="animate-ping-soft absolute -right-0.5 -top-0.5 h-4 w-4 rounded-full bg-destructive/60" />
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          </>
        )}
      </button>

      {open && (
        <div className="animate-scale-in glass absolute right-0 top-11 z-50 w-[min(92vw,360px)] origin-top-right overflow-hidden rounded-2xl border shadow-2xl shadow-primary/15">
          <div className="flex items-center justify-between border-b px-4 py-2.5">
            <p className="text-sm font-semibold">Bildirimler</p>
            <span className="text-[11px] text-muted-foreground">
              Son {items.length} bildirim
            </span>
          </div>

          {items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-muted">
                <Bell className="h-5 w-5 text-muted-foreground" />
              </span>
              <p className="text-sm text-muted-foreground">Henüz bildirim yok</p>
            </div>
          ) : (
            <ul className="max-h-[60vh] overflow-y-auto">
              {items.map((n) => {
                const Icon = TYPE_ICON[n.type] ?? Bell;
                const inner = (
                  <span className="flex items-start gap-3">
                    <span
                      className={cn(
                        "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                        TYPE_TONE[n.type] ?? "bg-muted text-muted-foreground",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-medium leading-snug">
                        {n.title}
                      </span>
                      {n.body && (
                        <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">
                          {n.body}
                        </span>
                      )}
                      <span className="mt-1 block text-[10px] uppercase tracking-wide text-muted-foreground/70">
                        {timeAgo(n.created_at)}
                      </span>
                    </span>
                  </span>
                );
                return (
                  <li key={n.id} className="border-b last:border-b-0">
                    {n.link ? (
                      <Link
                        href={n.link}
                        onClick={() => setOpen(false)}
                        className="block px-4 py-3 transition-colors hover:bg-accent/60"
                      >
                        {inner}
                      </Link>
                    ) : (
                      <div className="px-4 py-3">{inner}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
