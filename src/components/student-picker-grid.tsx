import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { Profile } from "@/lib/types";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase("tr-TR"))
    .join("");
}

export function StudentPickerGrid({
  students,
  hrefPrefix,
  ctaLabel,
}: {
  students: Profile[];
  hrefPrefix: string;
  ctaLabel: string;
}) {
  return (
    <div className="stagger grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {students.map((s) => (
        <Link key={s.id} href={`${hrefPrefix}/${s.id}`} className="block">
          <Card className="hover-lift group h-full hover:border-primary/40">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="gradient-surface flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white shadow-md shadow-primary/20 transition-transform duration-300 group-hover:scale-110">
                {initials(s.full_name)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{s.full_name}</p>
                <p className="text-xs text-muted-foreground">{ctaLabel}</p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300 group-hover:translate-x-1 group-hover:text-primary" />
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
