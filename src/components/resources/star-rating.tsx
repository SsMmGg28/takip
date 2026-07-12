import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Kitabın zorluk derecesini gösteren salt-okunur yıldız satırı (1-5). Sunucu
 * bileşenlerinde de kullanılabilir. `value` 0/negatifse hiçbir şey çizmez.
 */
export function StarRating({
  value,
  size = 14,
  className,
}: {
  value: number;
  size?: number;
  className?: string;
}) {
  if (!value || value < 1) return null;
  return (
    <span
      className={cn("inline-flex items-center gap-0.5", className)}
      title={`Zorluk: ${value}/5`}
      aria-label={`Zorluk derecesi ${value} / 5`}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          style={{ width: size, height: size }}
          className={
            i <= value
              ? "fill-amber-500 text-amber-500"
              : "fill-transparent text-muted-foreground/35"
          }
        />
      ))}
    </span>
  );
}
