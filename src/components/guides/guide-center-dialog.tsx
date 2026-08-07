"use client";

import {
  BookOpenCheck,
  CheckCircle2,
  CircleUserRound,
  Compass,
  Map as MapIcon,
  Play,
  Sparkles,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import type { GuideCategory, GuideDefinition, GuideProgress } from "@/lib/guides";

const CATEGORY_LABELS: Record<GuideCategory, string> = {
  "quick-start": "Hızlı Başlangıç",
  work: "Ödev ve Kaynaklar",
  planning: "Planlama",
  "follow-up": "Takip ve Gelişim",
  account: "Hesap ve Destek",
};

const CATEGORY_ICONS: Record<GuideCategory, typeof Compass> = {
  "quick-start": Sparkles,
  work: BookOpenCheck,
  planning: Compass,
  "follow-up": MapIcon,
  account: CircleUserRound,
};

export function GuideCenterDialog({
  guides,
  progress,
  onClose,
  onOpenOverview,
  onStartTour,
}: {
  guides: GuideDefinition[];
  progress: GuideProgress[];
  onClose: () => void;
  onOpenOverview: (guide: GuideDefinition) => void;
  onStartTour: (guide: GuideDefinition) => void;
}) {
  const progressById = new Map(progress.map((item) => [item.guide_id, item]));
  const categories = Array.from(new Set(guides.map((guide) => guide.category)));

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="h-[100dvh] max-h-none max-w-none gap-0 overflow-hidden rounded-none border-0 p-0 sm:h-auto sm:max-h-[90vh] sm:max-w-4xl sm:rounded-3xl sm:border"
      >
        <div className="flex items-start justify-between gap-4 border-b bg-gradient-to-r from-primary/10 via-background to-brand-to/10 p-5 sm:p-7">
          <div>
            <DialogTitle className="flex items-center gap-2 text-xl sm:text-2xl">
              <span className="gradient-surface flex size-9 items-center justify-center rounded-xl text-white shadow-md shadow-primary/25">
                <Compass className="size-4" />
              </span>
              Uygulama Rehberi
            </DialogTitle>
            <DialogDescription className="mt-2 max-w-2xl">
              Hızlı başlangıcı yeniden izle veya merak ettiğin özelliği örneklerle keşfet.
            </DialogDescription>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Rehber merkezini kapat"
            onClick={onClose}
          >
            <X />
          </Button>
        </div>

        <div className="h-[calc(100dvh-105px)] overflow-y-auto p-4 sm:h-auto sm:max-h-[calc(90vh-110px)] sm:p-7">
          <div className="space-y-8">
            {categories.map((category) => {
              const Icon = CATEGORY_ICONS[category];
              const items = guides.filter((guide) => guide.category === category);
              return (
                <section key={category} className="space-y-3">
                  <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    <Icon className="size-4 text-primary" />
                    {CATEGORY_LABELS[category]}
                  </h2>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {items.map((guide) => {
                      const saved = progressById.get(guide.id);
                      const seen = Boolean(saved && saved.version >= guide.version);
                      return (
                        <article
                          key={guide.id}
                          className="group flex min-h-44 flex-col rounded-2xl border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
                        >
                          <div className="mb-3 flex items-start justify-between gap-3">
                            <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-105">
                              <Icon className="size-5" />
                            </span>
                            {seen && (
                              <Badge
                                variant="outline"
                                className="gap-1 border-emerald-500/30 text-emerald-600 dark:text-emerald-300"
                              >
                                <CheckCircle2 className="size-3" /> Görüldü
                              </Badge>
                            )}
                          </div>
                          <h3 className="font-semibold">{guide.title}</h3>
                          <p className="mt-1.5 flex-1 text-sm leading-5 text-muted-foreground">
                            {guide.summary}
                          </p>
                          <div className="mt-4 flex flex-wrap gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => onOpenOverview(guide)}
                            >
                              <Play /> Özeti izle
                            </Button>
                            {guide.tourSteps.length > 0 && (
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => onStartTour(guide)}
                              >
                                <MapIcon /> Bu ekranda göster
                              </Button>
                            )}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
