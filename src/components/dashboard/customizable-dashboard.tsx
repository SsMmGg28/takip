"use client";

import { useCallback, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  GripVertical,
  Plus,
  RotateCcw,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { saveDashboardLayout } from "@/lib/actions/dashboard";
import {
  defaultLayout,
  WIDGET_BY_ID,
  widgetsForRole,
  widgetTitle,
  type WidgetDef,
} from "@/components/dashboard/registry";
import type {
  DashboardData,
  LayoutItem,
  StoredLayout,
} from "@/lib/dashboard-types";

const LAYOUT_VERSION = 1;

// Tailwind'in sınıfları statik görebilmesi için span haritaları sabit metin.
const COL_CLASS: Record<number, string> = {
  1: "col-span-1",
  2: "col-span-2",
  3: "col-span-2 lg:col-span-3",
  4: "col-span-2 lg:col-span-4",
};
const ROW_CLASS: Record<number, string> = {
  1: "row-span-1",
  2: "row-span-2",
  3: "row-span-3",
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function sanitize(items: LayoutItem[], role: DashboardData["role"]): LayoutItem[] {
  const seen = new Set<string>();
  const result: LayoutItem[] = [];
  for (const item of items) {
    const def = WIDGET_BY_ID.get(item.id);
    if (!def || !def.roles.includes(role) || seen.has(item.id)) continue;
    seen.add(item.id);
    result.push({
      id: item.id,
      w: clamp(Math.round(item.w) || def.defaultW, def.minW, def.maxW),
      h: clamp(Math.round(item.h) || def.defaultH, def.minH, def.maxH),
    });
  }
  return result;
}

/**
 * Özelleştirilebilir Anasayfa: widget'lar sürüklenerek sıralanır, ok
 * düğmeleriyle büyütülüp küçültülür, eklenip çıkarılabilir. Yerleşim cihaz
 * bazında localStorage'da saklanır.
 */
/** Kayıtlı yerleşimi doğrular; sonradan eklenen widget türlerini sona ekler. */
function reconcile(
  stored: StoredLayout | null,
  role: DashboardData["role"],
): { items: LayoutItem[]; removed: string[] } {
  if (!stored) return { items: defaultLayout(role), removed: [] };
  const cleanItems = sanitize(stored.items ?? [], role);
  const cleanRemoved = (stored.removed ?? []).filter((id) => WIDGET_BY_ID.has(id));
  const known = new Set([...cleanItems.map((i) => i.id), ...cleanRemoved]);
  const fresh = defaultLayout(role).filter((i) => !known.has(i.id));
  return { items: [...cleanItems, ...fresh], removed: cleanRemoved };
}

export function CustomizableDashboard({
  data,
  initialLayout,
}: {
  data: DashboardData;
  initialLayout: StoredLayout | null;
}) {
  const { role } = data;
  const [{ items, removed }, setLayout] = useState(() => reconcile(initialLayout, role));
  const [editing, setEditing] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const itemRefs = useRef(new Map<string, HTMLDivElement>());
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Yerleşim sunucuda kullanıcı hesabına kaydedilir (cihazlar arası senkron).
  // Sürükleme sırasında sık değiştiği için kayıt kısa bir gecikmeyle yapılır.
  const update = useCallback(
    (nextItems: LayoutItem[], nextRemoved?: string[]) => {
      const next = { items: nextItems, removed: nextRemoved ?? removed };
      setLayout(next);
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        void saveDashboardLayout({ version: LAYOUT_VERSION, ...next }).catch((err) =>
          console.error("[layout save]", err),
        );
      }, 600);
    },
    [removed],
  );

  function resize(id: string, dw: number, dh: number) {
    const def = WIDGET_BY_ID.get(id);
    if (!def) return;
    update(
      items.map((item) =>
        item.id === id
          ? {
              ...item,
              w: clamp(item.w + dw, def.minW, def.maxW),
              h: clamp(item.h + dh, def.minH, def.maxH),
            }
          : item,
      ),
    );
  }

  function remove(id: string) {
    update(
      items.filter((item) => item.id !== id),
      [...removed, id],
    );
  }

  function add(def: WidgetDef) {
    update(
      [...items, { id: def.id, w: def.defaultW, h: def.defaultH }],
      removed.filter((r) => r !== def.id),
    );
  }

  function reset() {
    update(defaultLayout(role), []);
  }

  // ── Sürükle-bırak (pointer tabanlı: fare + dokunmatik) ────────────────────
  function onDragStart(e: React.PointerEvent, id: string) {
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setDragId(id);
  }

  function onDragMove(e: React.PointerEvent) {
    if (!dragId) return;
    const { clientX, clientY } = e;
    for (const [id, el] of itemRefs.current) {
      if (id === dragId || !el) continue;
      const r = el.getBoundingClientRect();
      if (clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom) {
        const from = items.findIndex((i) => i.id === dragId);
        const to = items.findIndex((i) => i.id === id);
        if (from === -1 || to === -1 || from === to) return;
        const next = [...items];
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved);
        update(next);
        return;
      }
    }
  }

  function onDragEnd() {
    setDragId(null);
  }

  const addable = widgetsForRole(role).filter(
    (def) => !items.some((item) => item.id === def.id),
  );

  return (
    <>
      <PageHeader
        title="Anasayfa"
        description={`Merhaba ${data.firstName} 👋 Widget'ları dilediğin gibi düzenle.`}
        action={
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium shadow-sm",
              editing
                ? "gradient-surface text-white shadow-primary/30"
                : "border bg-card hover:bg-accent hover:text-accent-foreground",
            )}
          >
            {editing ? (
              <>
                <Check className="h-4 w-4" /> Bitti
              </>
            ) : (
              <>
                <SlidersHorizontal className="h-4 w-4" /> Düzenle
              </>
            )}
          </button>
        }
      />

      {editing && (
        <div className="animate-fade-up flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-dashed bg-muted/30 px-4 py-2.5">
          <p className="text-xs text-muted-foreground">
            Tutamaçtan sürükleyerek sırala, oklarla boyutlandır,{" "}
            <X className="inline h-3 w-3" /> ile kaldır.
          </p>
          <button
            type="button"
            onClick={reset}
            className="flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          >
            <RotateCcw className="h-3 w-3" /> Varsayılana dön
          </button>
        </div>
      )}

      <div className="animate-fade-up grid auto-rows-[8.5rem] grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {items.map((item) => {
          const def = WIDGET_BY_ID.get(item.id);
          if (!def) return null;
          const Icon = def.icon;
          const Component = def.component;
          const dragging = dragId === item.id;

          return (
            <div
              key={item.id}
              ref={(el) => {
                if (el) itemRefs.current.set(item.id, el);
                else itemRefs.current.delete(item.id);
              }}
              className={cn(
                "flex min-h-0 flex-col overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-sm",
                COL_CLASS[clamp(item.w, 1, 4)],
                ROW_CLASS[clamp(item.h, 1, 3)],
                editing && "border-dashed",
                dragging && "z-10 opacity-70 ring-2 ring-primary",
              )}
            >
              <div className="flex items-center gap-1.5 px-3 pb-1 pt-2.5">
                {editing ? (
                  <button
                    type="button"
                    onPointerDown={(e) => onDragStart(e, item.id)}
                    onPointerMove={onDragMove}
                    onPointerUp={onDragEnd}
                    onPointerCancel={onDragEnd}
                    aria-label={`${widgetTitle(def, role)} taşı`}
                    className="-ml-1 flex h-6 w-6 shrink-0 cursor-grab touch-none select-none items-center justify-center rounded-md text-muted-foreground hover:bg-accent active:cursor-grabbing"
                  >
                    <GripVertical className="h-4 w-4" />
                  </button>
                ) : (
                  <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                )}
                <p className="min-w-0 flex-1 truncate text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {widgetTitle(def, role)}
                </p>
                {editing && (
                  <button
                    type="button"
                    onClick={() => remove(item.id)}
                    aria-label={`${widgetTitle(def, role)} kaldır`}
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/12 hover:text-destructive"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <div
                className={cn(
                  "min-h-0 flex-1 px-3 pb-2.5",
                  editing && "pointer-events-none opacity-60",
                )}
              >
                <Component data={data} w={item.w} h={item.h} />
              </div>

              {editing && (
                <div className="flex items-center justify-center gap-1 border-t bg-muted/40 px-2 py-1">
                  <SizeButton
                    label="Daralt"
                    disabled={item.w <= def.minW}
                    onClick={() => resize(item.id, -1, 0)}
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </SizeButton>
                  <SizeButton
                    label="Genişlet"
                    disabled={item.w >= def.maxW}
                    onClick={() => resize(item.id, 1, 0)}
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </SizeButton>
                  <span className="mx-1 h-3.5 w-px bg-border" />
                  <SizeButton
                    label="Kısalt"
                    disabled={item.h <= def.minH}
                    onClick={() => resize(item.id, 0, -1)}
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </SizeButton>
                  <SizeButton
                    label="Uzat"
                    disabled={item.h >= def.maxH}
                    onClick={() => resize(item.id, 0, 1)}
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </SizeButton>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {editing && (
        <div className="animate-fade-up rounded-2xl border border-dashed bg-muted/20 p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Widget Ekle
          </p>
          {addable.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Tüm widget&apos;lar zaten panelde. 🎛️
            </p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {addable.map((def) => {
                const Icon = def.icon;
                return (
                  <button
                    key={def.id}
                    type="button"
                    onClick={() => add(def)}
                    className="flex items-center gap-3 rounded-2xl border bg-card px-3 py-2.5 text-left hover:border-primary/40 hover:bg-accent/50 active:scale-[0.98]"
                  >
                    <span className="gradient-surface flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white shadow-sm">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">
                        {widgetTitle(def, role)}
                      </span>
                      <span className="block truncate text-[11px] text-muted-foreground">
                        {def.description}
                      </span>
                    </span>
                    <Plus className="h-4 w-4 shrink-0 text-primary" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </>
  );
}

function SizeButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="flex h-6 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground disabled:opacity-30"
    >
      {children}
    </button>
  );
}
