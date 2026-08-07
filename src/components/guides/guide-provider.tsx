"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleHelp,
  MapPinned,
  Play,
  Sparkles,
  X,
} from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { toast } from "sonner";
import { GuideMockup } from "@/components/guides/guide-mockup";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { saveGuideProgress } from "@/lib/actions/guides";
import {
  getGuidesForContext,
  getHighestPriorityAutoGuide,
  type GuideDefinition,
  type GuideOutcome,
  type GuideProgressSnapshot,
} from "@/lib/guides";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/types";

type GuideView =
  | { kind: "center" }
  | { kind: "guide"; guideId: string; sceneIndex: number; source: "auto" | "manual" }
  | { kind: "tour"; guideId: string; stepIndex: number }
  | null;

interface TargetRect {
  top: number;
  left: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

export function GuideProvider({
  role,
  examsEnabled,
  initialProgress,
}: {
  role: Role;
  examsEnabled: boolean;
  initialProgress: GuideProgressSnapshot[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const guides = useMemo(
    () => getGuidesForContext({ role, examsEnabled }),
    [role, examsEnabled],
  );
  const [view, setView] = useState<GuideView>(() => {
    const guide = getHighestPriorityAutoGuide(guides, initialProgress);
    return guide
      ? { kind: "guide", guideId: guide.id, sceneIndex: 0, source: "auto" }
      : null;
  });
  const [progress, setProgress] = useState(initialProgress);
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const [isPending, startTransition] = useTransition();
  const guideById = useMemo(
    () => new Map(guides.map((guide) => [guide.id, guide])),
    [guides],
  );
  const activeGuide = view && "guideId" in view ? guideById.get(view.guideId) : undefined;
  const activeScene =
    view?.kind === "guide" ? activeGuide?.scenes[view.sceneIndex] : undefined;
  const activeTourStep =
    view?.kind === "tour" ? activeGuide?.tour[view.stepIndex] : undefined;

  const persistProgress = useCallback((guide: GuideDefinition, outcome: GuideOutcome) => {
    setProgress((current) => [
      ...current.filter((entry) => entry.guideId !== guide.id),
      { guideId: guide.id, version: guide.version, outcome },
    ]);
    startTransition(async () => {
      try {
        await saveGuideProgress({
          guideId: guide.id,
          version: guide.version,
          outcome,
        });
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Rehber ilerlemesi kaydedilemedi.",
        );
      }
    });
  }, []);

  const closeGuide = useCallback(
    (outcome: GuideOutcome) => {
      if (!activeGuide || view?.kind !== "guide") return;
      persistProgress(activeGuide, outcome);
      setView(view.source === "manual" ? { kind: "center" } : null);
    },
    [activeGuide, persistProgress, view],
  );

  const finishTour = useCallback(() => {
    if (activeGuide) persistProgress(activeGuide, "completed");
    setTargetRect(null);
    setView({ kind: "center" });
  }, [activeGuide, persistProgress]);

  const nextTourStep = useCallback(() => {
    if (!activeGuide || view?.kind !== "tour") return;
    if (view.stepIndex >= activeGuide.tour.length - 1) {
      finishTour();
      return;
    }
    setTargetRect(null);
    setView({ ...view, stepIndex: view.stepIndex + 1 });
  }, [activeGuide, finishTour, view]);

  useEffect(() => {
    if (!activeTourStep || view?.kind !== "tour") return;
    const routeParts = activeTourStep.route.split("/").filter(Boolean);
    const routeMatches =
      pathname === activeTourStep.route ||
      (routeParts.length > 1 && pathname.startsWith(`${activeTourStep.route}/`));
    if (!routeMatches) {
      router.push(activeTourStep.route);
      return;
    }

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let observer: ResizeObserver | undefined;
    const startedAt = Date.now();

    const updateRect = (element: HTMLElement) => {
      const rect = element.getBoundingClientRect();
      setTargetRect({
        top: rect.top,
        left: rect.left,
        right: rect.right,
        bottom: rect.bottom,
        width: rect.width,
        height: rect.height,
      });
    };

    const findTarget = () => {
      if (cancelled) return;
      const element = Array.from(
        document.querySelectorAll<HTMLElement>(
          `[data-guide-anchor="${activeTourStep.anchor}"]`,
        ),
      ).find((candidate) => {
        const rect = candidate.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      });
      if (!element) {
        if (Date.now() - startedAt >= 4500) {
          toast.info("Bu ekrandaki hedef bulunamadı; sonraki adıma geçiliyor.");
          nextTourStep();
          return;
        }
        timeoutId = setTimeout(findTarget, 100);
        return;
      }

      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      element.scrollIntoView({
        block: "center",
        behavior: reducedMotion ? "auto" : "smooth",
      });
      updateRect(element);
      const handleViewportChange = () => updateRect(element);
      window.addEventListener("resize", handleViewportChange);
      window.addEventListener("scroll", handleViewportChange, true);
      if ("ResizeObserver" in window) {
        observer = new ResizeObserver(handleViewportChange);
        observer.observe(element);
      }
      cleanupViewport = () => {
        window.removeEventListener("resize", handleViewportChange);
        window.removeEventListener("scroll", handleViewportChange, true);
      };
    };

    let cleanupViewport = () => undefined;
    findTarget();
    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
      observer?.disconnect();
      cleanupViewport();
    };
  }, [activeTourStep, nextTourStep, pathname, router, view?.kind]);

  function startGuide(guide: GuideDefinition) {
    setView({ kind: "guide", guideId: guide.id, sceneIndex: 0, source: "manual" });
  }

  function startTour(guide: GuideDefinition) {
    if (guide.tour.length === 0) return;
    setTargetRect(null);
    setView({ kind: "tour", guideId: guide.id, stepIndex: 0 });
  }

  const tourPanelStyle = getTourPanelStyle(targetRect);

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={() => setView({ kind: "center" })}
        aria-label="Rehber Merkezini aç"
        title="Yardım ve Rehber Merkezi"
        data-guide-anchor="help-button"
        className="rounded-full"
      >
        <CircleHelp className="h-5 w-5" />
      </Button>

      <Dialog
        open={view?.kind === "center"}
        onOpenChange={(open) => !open && setView(null)}
        closeOnUnmount={false}
      >
        <DialogContent className="inset-0 h-[100dvh] max-h-[100dvh] grid-rows-[auto_minmax(0,1fr)] gap-0 overflow-hidden rounded-none p-0 sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:h-[min(760px,calc(100dvh-3rem))] sm:max-w-4xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl">
          <DialogHeader className="border-b p-5 pr-16 sm:p-6">
            <DialogTitle className="flex items-center gap-2 text-xl sm:text-2xl">
              <span className="gradient-surface flex h-9 w-9 items-center justify-center rounded-xl text-white">
                <Sparkles className="h-5 w-5" />
              </span>
              Rehber Merkezi
            </DialogTitle>
            <DialogDescription>
              Hareketli özeti izle veya özelliği gerçek ekran üzerinde adım adım gör.
            </DialogDescription>
          </DialogHeader>
          <div className="grid min-h-0 auto-rows-max content-start gap-3 overflow-y-auto overscroll-contain p-4 sm:grid-cols-2 sm:p-6">
            {guides.map((guide) => {
              const seen = progress.find((entry) => entry.guideId === guide.id);
              const isCurrentVersion = seen?.version === guide.version;
              return (
                <Card key={guide.id} className="overflow-hidden">
                  <CardContent className="flex flex-col gap-3 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-semibold">{guide.title}</h3>
                        <p className="mt-1 text-sm leading-5 text-muted-foreground">
                          {guide.summary}
                        </p>
                      </div>
                      {isCurrentVersion && (
                        <span className="flex shrink-0 items-center gap-1 rounded-full bg-success/10 px-2 py-1 text-[10px] font-semibold text-success">
                          <Check className="h-3 w-3" />
                          {seen.outcome === "completed" ? "Tamamlandı" : "Görüldü"}
                        </span>
                      )}
                    </div>
                    <div className="mt-auto flex flex-wrap gap-2">
                      <Button size="sm" onClick={() => startGuide(guide)}>
                        <Play className="h-4 w-4" />
                        Özeti aç
                      </Button>
                      {guide.tour.length > 0 && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startTour(guide)}
                        >
                          <MapPinned className="h-4 w-4" />
                          Bu ekranda göster
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={view?.kind === "guide"}
        onOpenChange={(open) => !open && closeGuide("skipped")}
        closeOnUnmount={false}
      >
        <DialogContent
          showCloseButton
          className="inset-0 h-[100dvh] max-h-[100dvh] gap-0 overflow-hidden rounded-none p-0 sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:h-[min(760px,calc(100dvh-3rem))] sm:max-w-5xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl"
        >
          {activeGuide && activeScene && view?.kind === "guide" && (
            <div className="flex h-full min-h-0 flex-col">
              <div className="flex items-center justify-between gap-4 border-b px-4 py-3 pr-16 sm:px-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                    {activeGuide.title}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {view.sceneIndex + 1} / {activeGuide.scenes.length}
                  </p>
                </div>
                <div className="hidden gap-1 sm:flex" aria-hidden="true">
                  {activeGuide.scenes.map((scene, index) => (
                    <span
                      key={scene.id}
                      className={cn(
                        "h-1.5 rounded-full transition-all",
                        index === view.sceneIndex ? "w-8 bg-primary" : "w-3 bg-muted",
                      )}
                    />
                  ))}
                </div>
              </div>

              <div className="grid min-h-0 flex-1 items-center gap-5 overflow-y-auto p-4 sm:grid-cols-[minmax(0,1.25fr)_minmax(16rem,.75fr)] sm:p-7">
                <GuideMockup kind={activeScene.mockup} />
                <div className="space-y-3 text-center sm:text-left">
                  <DialogHeader className="sm:text-left">
                    <DialogTitle className="text-2xl leading-tight sm:text-3xl">
                      {activeScene.title}
                    </DialogTitle>
                    <DialogDescription className="text-base leading-7">
                      {activeScene.description}
                    </DialogDescription>
                  </DialogHeader>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 border-t bg-card/50 p-4 sm:px-6">
                <Button
                  variant="ghost"
                  onClick={() => closeGuide("skipped")}
                  disabled={isPending}
                >
                  Atla
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() =>
                      setView({ ...view, sceneIndex: Math.max(0, view.sceneIndex - 1) })
                    }
                    disabled={view.sceneIndex === 0}
                  >
                    <ArrowLeft className="h-4 w-4" /> Geri
                  </Button>
                  {view.sceneIndex < activeGuide.scenes.length - 1 ? (
                    <Button
                      onClick={() =>
                        setView({ ...view, sceneIndex: view.sceneIndex + 1 })
                      }
                    >
                      İleri <ArrowRight className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button onClick={() => closeGuide("completed")} disabled={isPending}>
                      <Check className="h-4 w-4" /> Rehberi Bitir
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <DialogPrimitive.Root open={view?.kind === "tour"} modal>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-[70] overflow-hidden">
            {targetRect ? (
              <div
                className="pointer-events-none absolute rounded-2xl border-2 border-primary bg-transparent shadow-[0_0_0_9999px_rgba(2,6,23,0.72)] transition-[top,left,width,height] duration-200"
                style={{
                  top: Math.max(8, targetRect.top - 8),
                  left: Math.max(8, targetRect.left - 8),
                  width: Math.min(window.innerWidth - 16, targetRect.width + 16),
                  height: Math.min(window.innerHeight - 16, targetRect.height + 16),
                }}
              />
            ) : (
              <div className="absolute inset-0 bg-slate-950/72" />
            )}
          </DialogPrimitive.Overlay>
          {activeGuide && activeTourStep && view?.kind === "tour" && (
            <DialogPrimitive.Content
              className="fixed z-[71] w-[calc(100vw-2rem)] max-w-sm rounded-2xl border bg-background p-4 shadow-2xl outline-none"
              style={tourPanelStyle}
              onEscapeKeyDown={(event) => {
                event.preventDefault();
                finishTour();
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                    {activeGuide.title} · {view.stepIndex + 1}/{activeGuide.tour.length}
                  </p>
                  <DialogPrimitive.Title className="mt-1 text-lg font-semibold">
                    {targetRect ? activeTourStep.title : "Ekran hazırlanıyor…"}
                  </DialogPrimitive.Title>
                </div>
                <button
                  type="button"
                  onClick={finishTour}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Turu kapat"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <DialogPrimitive.Description className="mt-2 text-sm leading-6 text-muted-foreground">
                {targetRect
                  ? activeTourStep.description
                  : "İlgili sayfaya gidiliyor ve hedef alan bekleniyor."}
              </DialogPrimitive.Description>
              <div className="mt-4 flex justify-between gap-2">
                <Button variant="ghost" size="sm" onClick={finishTour}>
                  Turu bitir
                </Button>
                <Button size="sm" onClick={nextTourStep} disabled={!targetRect}>
                  {view.stepIndex === activeGuide.tour.length - 1 ? "Tamamla" : "Sonraki"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </DialogPrimitive.Content>
          )}
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </>
  );
}

function getTourPanelStyle(rect: TargetRect | null): React.CSSProperties {
  if (!rect || typeof window === "undefined") {
    return { left: "50%", top: "50%", transform: "translate(-50%, -50%)" };
  }
  const width = Math.min(384, window.innerWidth - 32);
  const left = Math.max(16, Math.min(rect.left, window.innerWidth - width - 16));
  const estimatedHeight = 220;
  const placeBelow = rect.bottom + estimatedHeight + 24 < window.innerHeight;
  const top = placeBelow
    ? rect.bottom + 16
    : Math.max(16, rect.top - estimatedHeight - 16);
  return { left, top };
}
