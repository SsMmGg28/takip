"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Öğretmenin kitaba zorluk derecesi (1-5) verdiği etkileşimli yıldız girişi.
 * Seçili yıldıza tekrar tıklamak veya "Temizle" derecesi sıfırlar (0 = atanmadı).
 */
export function StarRatingInput({
  value,
  onChange,
  size = 24,
}: {
  value: number;
  onChange: (v: number) => void;
  size?: number;
}) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i === value ? 0 : i)}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          className="rounded transition-transform active:scale-90"
          aria-label={`${i} yıldız`}
          aria-pressed={i <= value}
        >
          <Star
            style={{ width: size, height: size }}
            className={
              i <= shown
                ? "fill-amber-500 text-amber-500"
                : "fill-transparent text-muted-foreground/40"
            }
          />
        </button>
      ))}
      <span className="ml-2 text-xs text-muted-foreground">
        {value > 0 ? `${value}/5` : "Belirtilmedi"}
      </span>
      {value > 0 && (
        <button
          type="button"
          onClick={() => onChange(0)}
          className={cn("ml-1 text-xs text-muted-foreground hover:text-foreground hover:underline")}
        >
          Temizle
        </button>
      )}
    </div>
  );
}
