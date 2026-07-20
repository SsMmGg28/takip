"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Archive, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addWeeks, currentWeekStart, formatWeekRange } from "@/lib/week";
import { cn } from "@/lib/utils";

/**
 * Hafta gezgini: önceki/sonraki/bugün linkleri + arşiv haftaları listesi.
 * ?week= parametresiyle çalışır; URL paylaşılabilir kalır.
 */
export function WeekSwitcher({
  basePath,
  weekStart,
  archiveWeeks,
}: {
  basePath: string;
  weekStart: string;
  /** Kayıt bulunan geçmiş haftalar (yeni → eski). */
  archiveWeeks: string[];
}) {
  const router = useRouter();
  const current = currentWeekStart();
  const isCurrent = weekStart === current;
  const isPast = weekStart < current;

  const weekHref = (week: string) =>
    week === current ? basePath : `${basePath}?week=${week}`;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1">
        <Button variant="outline" size="icon" asChild aria-label="Önceki hafta">
          <Link href={weekHref(addWeeks(weekStart, -1))}>
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href={basePath}>Bu Hafta</Link>
        </Button>
        <Button variant="outline" size="icon" asChild aria-label="Sonraki hafta">
          <Link href={weekHref(addWeeks(weekStart, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      <span
        className={cn(
          "rounded-full px-3 py-1 text-sm font-medium",
          isCurrent
            ? "bg-primary/10 text-primary"
            : isPast
              ? "bg-muted text-muted-foreground"
              : "bg-accent text-accent-foreground",
        )}
      >
        {formatWeekRange(weekStart)}
        {isCurrent ? " · bu hafta" : isPast ? " · arşiv" : " · gelecek hafta"}
      </span>

      {archiveWeeks.length > 0 && (
        <Select
          value={isPast ? weekStart : ""}
          onValueChange={(w) => router.push(weekHref(w))}
        >
          <SelectTrigger className="w-44">
            <span className="flex items-center gap-1.5">
              <Archive className="h-3.5 w-3.5" />
              <SelectValue placeholder="Arşiv" />
            </span>
          </SelectTrigger>
          <SelectContent>
            {archiveWeeks.map((w) => (
              <SelectItem key={w} value={w}>
                {formatWeekRange(w)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
