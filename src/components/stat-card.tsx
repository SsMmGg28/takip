import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

/** Sayfa üstü istatistik kartı; href verilirse tamamı tıklanabilir. */
export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  href,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  hint?: string;
  href?: string;
}) {
  const card = (
    <Card className="hover-lift group relative h-full overflow-hidden">
      <span className="gradient-surface absolute inset-x-0 top-0 h-1 opacity-70 transition-opacity group-hover:opacity-100" />
      <CardContent className="flex items-center justify-between gap-3 p-5">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-1 text-3xl font-bold tracking-tight tabular-nums sm:text-4xl">
            {value}
          </p>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
        <div className="gradient-surface flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg shadow-primary/25 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6">
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="block h-full">
        {card}
      </Link>
    );
  }
  return card;
}
