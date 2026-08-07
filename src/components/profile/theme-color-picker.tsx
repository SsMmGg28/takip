"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { updateOwnThemeColor } from "@/lib/actions/profile";
import { THEME_COLORS, type ThemeColor } from "@/lib/theme-colors";
import { cn } from "@/lib/utils";

/**
 * Profil sayfasındaki aksan tema rengi seçici. Seçim anında `<html data-color>`
 * üzerine uygulanır (canlı önizleme) ve `updateOwnThemeColor` ile DB'ye yazılır;
 * DB'de tutulduğundan seçim tüm cihazlarda senkron olur. Hata olursa eski renge döner.
 */
export function ThemeColorPicker({ initialColor }: { initialColor: ThemeColor }) {
  const [color, setColor] = useState<ThemeColor>(initialColor);
  const [pending, setPending] = useState(false);

  async function select(next: ThemeColor) {
    if (next === color || pending) return;
    const previous = color;
    setColor(next);
    document.documentElement.setAttribute("data-color", next);
    setPending(true);
    try {
      const res = await updateOwnThemeColor(next);
      if (!res.ok) {
        setColor(previous);
        document.documentElement.setAttribute("data-color", previous);
        toast.error(res.error ?? "Renk kaydedilemedi.");
        return;
      }
      toast.success("Tema rengi güncellendi.");
    } catch (e) {
      setColor(previous);
      document.documentElement.setAttribute("data-color", previous);
      toast.error(e instanceof Error ? e.message : "Renk kaydedilemedi.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-3">
      {THEME_COLORS.map((c) => {
        const active = c.value === color;
        return (
          <button
            key={c.value}
            type="button"
            onClick={() => select(c.value)}
            disabled={pending}
            aria-pressed={active}
            title={c.label}
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-full text-white shadow-sm ring-offset-2 ring-offset-background transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60",
              active && "ring-2 ring-foreground",
            )}
            style={{ backgroundColor: c.swatch }}
          >
            {active && <Check className="h-5 w-5" strokeWidth={3} />}
            <span className="sr-only">{c.label}</span>
          </button>
        );
      })}
    </div>
  );
}
