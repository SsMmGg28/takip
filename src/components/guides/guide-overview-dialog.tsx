"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, Map, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { GuideScenePreview } from "@/components/guides/guide-scene";
import type { GuideDefinition, GuideOutcome } from "@/lib/guides";

export function GuideOverviewDialog({
  guide,
  onExit,
  onStartTour,
}: {
  guide: GuideDefinition;
  onExit: (outcome: GuideOutcome) => void;
  onStartTour: () => void;
}) {
  const [sceneIndex, setSceneIndex] = useState(0);
  const scene = guide.scenes[sceneIndex];
  const last = sceneIndex === guide.scenes.length - 1;

  return (
    <Dialog open onOpenChange={(open) => !open && onExit("skipped")}>
      <DialogContent
        showCloseButton={false}
        className="h-[100dvh] max-h-none max-w-none gap-0 overflow-y-auto rounded-none border-0 p-0 sm:h-auto sm:max-h-[92vh] sm:max-w-5xl sm:rounded-3xl sm:border"
      >
        <div className="grid min-h-full lg:grid-cols-[1.12fr_0.88fr]">
          <div className="p-4 sm:p-6 lg:p-8">
            <GuideScenePreview scene={scene} />
          </div>
          <div className="flex min-h-80 flex-col border-t p-5 sm:p-7 lg:border-l lg:border-t-0 lg:p-9">
            <div className="mb-8 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <DialogTitle className="text-xl sm:text-2xl">{guide.title}</DialogTitle>
                <DialogDescription className="mt-2">
                  {scene.eyebrow ?? `${sceneIndex + 1}. bölüm`}
                </DialogDescription>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Rehberi kapat"
                onClick={() => onExit("skipped")}
              >
                <X />
              </Button>
            </div>

            <div className="flex-1">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {scene.title}
              </h2>
              <p className="mt-4 text-base leading-7 text-muted-foreground">
                {scene.description}
              </p>
              <div className="mt-8 flex gap-2" aria-label="Rehber ilerlemesi">
                {guide.scenes.map((item, index) => (
                  <span
                    key={`${item.title}-${index}`}
                    className={
                      index === sceneIndex
                        ? "gradient-surface h-2 flex-[2] rounded-full transition-all"
                        : "h-2 flex-1 rounded-full bg-muted transition-all"
                    }
                  />
                ))}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {sceneIndex + 1} / {guide.scenes.length}
              </p>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t pt-5">
              <Button type="button" variant="ghost" onClick={() => onExit("skipped")}>
                Atla
              </Button>
              <div className="flex flex-wrap justify-end gap-2">
                {sceneIndex > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSceneIndex((value) => value - 1)}
                  >
                    <ArrowLeft /> Geri
                  </Button>
                )}
                {last && guide.tourSteps.length > 0 && (
                  <Button type="button" variant="outline" onClick={onStartTour}>
                    <Map /> Ekranda göster
                  </Button>
                )}
                <Button
                  type="button"
                  onClick={() =>
                    last ? onExit("completed") : setSceneIndex((value) => value + 1)
                  }
                >
                  {last ? (
                    <>
                      <Check /> Rehberi Bitir
                    </>
                  ) : (
                    <>
                      İleri <ArrowRight />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
