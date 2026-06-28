import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { Profile } from "@/lib/types";

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
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {students.map((s) => (
        <Link key={s.id} href={`${hrefPrefix}/${s.id}`} className="block">
          <Card className="group transition-colors hover:border-primary/40 hover:bg-accent/40">
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium">{s.full_name}</p>
                <p className="text-xs text-muted-foreground">{ctaLabel}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
