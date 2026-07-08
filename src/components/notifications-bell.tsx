"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Bell,
  BookOpen,
  BookCheck,
  BookX,
  Bug,
  CalendarClock,
  CalendarDays,
  ClipboardList,
  GraduationCap,
  MailQuestion,
  Megaphone,
  PencilLine,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { PushNotificationToggle } from "@/components/push-manager";
import type { AppNotification, NotificationType } from "@/lib/types";

const TYPE_ICON: Record<NotificationType, LucideIcon> = {
  homework_assigned: ClipboardList,
  homework_updated: PencilLine,
  homework_incomplete: AlertTriangle,
  book_pending: BookOpen,
  book_approved: BookCheck,
  book_rejected: BookX,
  exam_created: GraduationCap,
  exam_edit_requested: MailQuestion,
  exam_edit_resolved: PencilLine,
  homework_due_soon: CalendarClock,
  event_created: CalendarDays,
  bug_report: Bug,
  announcement_created: Megaphone,
  schedule_assigned: CalendarClock,
};

const TYPE_TONE: Record<NotificationType, string> = {
  homework_assigned: "bg-primary/12 text-primary",
  homework_updated: "bg-warning/15 text-warning",
  homework_incomplete: "bg-destructive/12 text-destructive",
  book_pending: "bg-primary/12 text-primary",
  book_approved: "bg-success/15 text-success",
  book_rejected: "bg-destructive/12 text-destructive",
  exam_created: "bg-primary/12 text-primary",
  exam_edit_requested: "bg-warning/15 text-warning",
  exam_edit_resolved: "bg-success/15 text-success",
  homework_due_soon: "bg-warning/15 text-warning",
  event_created: "bg-primary/12 text-primary",
  bug_report: "bg-destructive/12 text-destructive",
  announcement_created: "bg-primary/12 text-primary",
  schedule_assigned: "bg-primary/12 text-primary",
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

const PANEL_MAX_WIDTH = 360;
const PANEL_MARGIN = 12;

/**
 * Bildirim zili: Supabase Realtime ile canlı bildirim dinler (Vercel'in
 * sunucusuz yapısından bağımsız — tarayıcı doğrudan Supabase'e bağlanır).
 *
 * Panel, header'ın backdrop-filter'ı fixed/absolute konumlandırmayı ve iç içe
 * cam efektini bozduğu için portal ile body'ye çizilir; konumu zil butonunun
 * ekran koordinatlarından hesaplanır. Böylece dar ekranlarda taşmaz ve
 * arkasındaki içerik panelin içinden görünmez.
 */
export function NotificationsBell({ userId }: { userId: string }) {
  const router = useRouter();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [open, setOpen] = useState(false);
  const [ringing, setRinging] = useState(false);
  const [panelPos, setPanelPos] = useState<{
    top: number;
    right: number;
    width: number;
  } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
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

  const updatePanelPos = useCallback(() => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    // Önce genişlik hesaplanır; right değeri panelin sol kenarı ekran dışına
    // taşmayacak şekilde kıskaçlanır (right + width <= innerWidth - margin).
    const width = Math.min(PANEL_MAX_WIDTH, window.innerWidth - PANEL_MARGIN * 2);
    const maxRight = window.innerWidth - PANEL_MARGIN - width;
    const right = Math.min(
      Math.max(PANEL_MARGIN, window.innerWidth - rect.right),
      Math.max(PANEL_MARGIN, maxRight),
    );
    setPanelPos({ top: rect.bottom + 8, right, width });
  }, []);

  // Panel dışına tıklanınca kapan; ekran boyutu değişirse yeniden konumlan
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node;
      if (buttonRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setOpen(false);
    }
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("resize", updatePanelPos);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("resize", updatePanelPos);
    };
  }, [open, updatePanelPos]);

  async function markAllRead() {
    if (!items.some((n) => !n.read_at)) return;
    const now = new Date().toISOString();
    setItems((prev) => prev.map((n) => (n.read_at ? n : { ...n, read_at: now })));
    await getSupabase()
      .from("notifications")
      .update({ read_at: now })
      .is("read_at", null);
  }

  // Paneli açmak artık her şeyi okundu saymıyor; bildirim ancak tıklanınca
  // (veya "Tümünü okundu say" ile) okunmuş kabul edilir.
  async function markRead(id: string) {
    const target = items.find((n) => n.id === id);
    if (!target || target.read_at) return;
    const now = new Date().toISOString();
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read_at: now } : n)));
    await getSupabase().from("notifications").update({ read_at: now }).eq("id", id);
  }

  function toggle() {
    const next = !open;
    if (next) updatePanelPos();
    setOpen(next);
  }

  return (
    <>
      <button
        ref={buttonRef}
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

      {open &&
        panelPos &&
        createPortal(
          <div
            ref={panelRef}
            style={{
              top: panelPos.top,
              right: panelPos.right,
              width: panelPos.width,
              // Kısa/mobil ekranlarda panel ekrandan taşmasın; liste kendi
              // içinde kaydırılır, alt kısımdaki push anahtarı hep görünür kalır.
              maxHeight: `calc(100dvh - ${panelPos.top}px - ${PANEL_MARGIN}px)`,
            }}
            className="animate-scale-in fixed z-50 flex origin-top-right flex-col overflow-hidden rounded-2xl border bg-popover text-popover-foreground shadow-2xl shadow-primary/15"
          >
            <div className="flex shrink-0 items-center justify-between border-b px-4 py-2.5">
              <p className="text-sm font-semibold">Bildirimler</p>
              {unreadCount > 0 ? (
                <button
                  type="button"
                  onClick={() => void markAllRead()}
                  className="text-[11px] font-medium text-primary hover:underline"
                >
                  Tümünü okundu say
                </button>
              ) : (
                <span className="text-[11px] text-muted-foreground">
                  Son {items.length} bildirim
                </span>
              )}
            </div>

            {items.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-muted">
                  <Bell className="h-5 w-5 text-muted-foreground" />
                </span>
                <p className="text-sm text-muted-foreground">Henüz bildirim yok</p>
              </div>
            ) : (
              <ul className="min-h-0 flex-1 overflow-y-auto">
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
                  const rowClass = cn(
                    "block px-4 py-3 transition-colors hover:bg-accent/60",
                    !n.read_at && "bg-primary/5",
                  );
                  return (
                    <li key={n.id} className="relative border-b last:border-b-0">
                      {!n.read_at && (
                        <span className="absolute right-3 top-3.5 h-2 w-2 rounded-full bg-primary" />
                      )}
                      {n.link ? (
                        <Link
                          href={n.link}
                          onClick={() => {
                            void markRead(n.id);
                            setOpen(false);
                          }}
                          className={rowClass}
                        >
                          {inner}
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={() => void markRead(n.id)}
                          className={cn(rowClass, "w-full text-left")}
                        >
                          {inner}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="shrink-0">
              <PushNotificationToggle />
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
