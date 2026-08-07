"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { routeForGuide, type GuideDefinition, type GuideRole } from "@/lib/guides";

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const PADDING = 8;

function visibleAnchor(anchor: string): HTMLElement | null {
  const elements = Array.from(
    document.querySelectorAll<HTMLElement>(`[data-guide-anchor="${anchor}"]`),
  );
  return (
    elements.find((element) => {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden";
    }) ?? null
  );
}

function measure(element: HTMLElement): TargetRect {
  const rect = element.getBoundingClientRect();
  return {
    top: Math.max(PADDING, rect.top - PADDING),
    left: Math.max(PADDING, rect.left - PADDING),
    width: Math.min(window.innerWidth - PADDING * 2, rect.width + PADDING * 2),
    height: Math.min(window.innerHeight - PADDING * 2, rect.height + PADDING * 2),
  };
}

export function SpotlightTour({
  guide,
  role,
  onComplete,
  onSkip,
}: {
  guide: GuideDefinition;
  role: GuideRole;
  onComplete: () => void;
  onSkip: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [stepIndex, setStepIndex] = useState(0);
  const [target, setTarget] = useState<{
    stepIndex: number;
    rect: TargetRect;
  } | null>(null);
  const nextButtonRef = useRef<HTMLButtonElement>(null);
  const step = guide.tourSteps[stepIndex];
  const targetRoute = routeForGuide(guide, role, step);
  const rect = target?.stepIndex === stepIndex ? target.rect : null;

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onSkip();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onSkip]);

  useEffect(() => {
    if (!step) return;

    const routeMatches =
      !targetRoute || pathname === targetRoute || pathname.startsWith(`${targetRoute}/`);
    if (!routeMatches && targetRoute) {
      router.push(targetRoute);
      return;
    }

    let element: HTMLElement | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let cancelled = false;

    const update = () => {
      if (element && !cancelled) {
        setTarget({ stepIndex, rect: measure(element) });
      }
    };

    const find = () => {
      element = step.anchors.map(visibleAnchor).find(Boolean) ?? null;
      if (!element) return false;
      const firstRect = element.getBoundingClientRect();
      if (firstRect.top < 12 || firstRect.bottom > window.innerHeight - 12) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      window.setTimeout(update, 250);
      setTarget({ stepIndex, rect: measure(element) });
      resizeObserver = new ResizeObserver(update);
      resizeObserver.observe(element);
      return true;
    };

    let interval: number | null = null;
    let timeout: number | null = null;
    const frame = window.requestAnimationFrame(() => {
      if (find()) return;
      interval = window.setInterval(() => {
        if (find() && interval !== null) window.clearInterval(interval);
      }, 160);
      timeout = window.setTimeout(() => {
        if (interval !== null) window.clearInterval(interval);
        if (cancelled || element) return;
        // Boş durum veya koşullu özellik hedefi yoksa adımı güvenle atla.
        if (stepIndex < guide.tourSteps.length - 1) {
          setStepIndex((value) => value + 1);
        } else {
          onSkip();
        }
      }, 5000);
    });

    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, { capture: true, passive: true });
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
      if (interval !== null) window.clearInterval(interval);
      if (timeout !== null) window.clearTimeout(timeout);
      resizeObserver?.disconnect();
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [guide, onSkip, pathname, router, step, stepIndex, targetRoute]);

  useEffect(() => {
    if (rect) nextButtonRef.current?.focus();
  }, [rect, stepIndex]);

  const tooltipStyle = useMemo(() => {
    if (!rect) return undefined;
    const width = Math.min(360, window.innerWidth - 24);
    const left = Math.max(12, Math.min(rect.left, window.innerWidth - width - 12));
    const roomBelow = window.innerHeight - (rect.top + rect.height);
    const top =
      roomBelow >= 230 ? rect.top + rect.height + 12 : Math.max(12, rect.top - 218);
    return { width, left, top };
  }, [rect]);

  if (!step) return null;

  if (!rect) {
    return (
      <div
        className="fixed inset-0 z-[80] flex items-center justify-center bg-black/65 p-4"
        role="dialog"
        aria-modal="true"
        aria-label="Rehber adımı hazırlanıyor"
      >
        <div className="glass flex items-center gap-3 rounded-2xl border px-5 py-4 shadow-2xl">
          <Loader2 className="size-5 animate-spin text-primary" />
          <div>
            <p className="text-sm font-semibold">Ekran hazırlanıyor</p>
            <p className="text-xs text-muted-foreground">Rehber hedefi bulunuyor…</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Turu kapat"
            onClick={onSkip}
          >
            <X />
          </Button>
        </div>
      </div>
    );
  }

  const right = rect.left + rect.width;
  const bottom = rect.top + rect.height;

  return (
    <div
      className="fixed inset-0 z-[80]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="guide-tour-title"
    >
      <div
        className="absolute inset-x-0 top-0 bg-black/70 backdrop-blur-[1px]"
        style={{ height: rect.top }}
      />
      <div
        className="absolute left-0 bg-black/70 backdrop-blur-[1px]"
        style={{ top: rect.top, width: rect.left, height: rect.height }}
      />
      <div
        className="absolute right-0 bg-black/70 backdrop-blur-[1px]"
        style={{ top: rect.top, left: right, height: rect.height }}
      />
      <div
        className="absolute inset-x-0 bottom-0 bg-black/70 backdrop-blur-[1px]"
        style={{ top: bottom }}
      />
      <div
        className="pointer-events-auto absolute rounded-xl border-2 border-primary bg-transparent shadow-[0_0_0_4px_rgba(124,58,237,0.25)]"
        style={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height }}
        aria-hidden="true"
      />

      <div
        className="fixed z-[82] rounded-2xl border bg-popover p-4 text-popover-foreground shadow-2xl sm:p-5"
        style={tooltipStyle}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-primary">
              {stepIndex + 1} / {guide.tourSteps.length}
            </p>
            <h2 id="guide-tour-title" className="mt-1 text-base font-semibold">
              {step.title}
            </h2>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Turu kapat"
            onClick={onSkip}
          >
            <X />
          </Button>
        </div>
        <p className="mt-2 text-sm leading-5 text-muted-foreground">{step.description}</p>
        <div className="mt-4 flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={stepIndex === 0}
            onClick={() => setStepIndex((value) => value - 1)}
          >
            <ArrowLeft /> Geri
          </Button>
          <Button
            ref={nextButtonRef}
            type="button"
            size="sm"
            onClick={() =>
              stepIndex === guide.tourSteps.length - 1
                ? onComplete()
                : setStepIndex((value) => value + 1)
            }
          >
            {stepIndex === guide.tourSteps.length - 1 ? (
              <>
                <Check /> Bitti
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
  );
}
