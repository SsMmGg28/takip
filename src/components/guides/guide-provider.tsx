"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { CircleHelp } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { GuideCenterDialog } from "@/components/guides/guide-center-dialog";
import { GuideOverviewDialog } from "@/components/guides/guide-overview-dialog";
import { SpotlightTour } from "@/components/guides/spotlight-tour";
import { saveGuideProgress } from "@/lib/actions/guides";
import {
  findPendingAutomaticGuide,
  getGuidesForRole,
  type GuideDefinition,
  type GuideOutcome,
  type GuideProgress,
  type GuideRole,
} from "@/lib/guides";

interface GuideContextValue {
  openCenter: () => void;
}

const GuideContext = createContext<GuideContextValue | null>(null);

export function GuideProvider({
  role,
  showExams,
  initialProgress,
  children,
}: {
  role: GuideRole;
  showExams: boolean;
  initialProgress: GuideProgress[];
  children: React.ReactNode;
}) {
  const guides = useMemo(
    () => getGuidesForRole(role, { exams: showExams }),
    [role, showExams],
  );
  const [progress, setProgress] = useState(initialProgress);
  const [centerOpen, setCenterOpen] = useState(false);
  const [overviewGuide, setOverviewGuide] = useState<GuideDefinition | null>(() =>
    findPendingAutomaticGuide(guides, initialProgress),
  );
  const [tourGuide, setTourGuide] = useState<GuideDefinition | null>(null);

  const record = useCallback(async (guide: GuideDefinition, outcome: GuideOutcome) => {
    setProgress((current) => [
      ...current.filter((item) => item.guide_id !== guide.id),
      { guide_id: guide.id, version: guide.version, outcome },
    ]);
    const result = await saveGuideProgress({
      guideId: guide.id,
      version: guide.version,
      outcome,
    });
    if (!result.ok) toast.error(result.error ?? "Rehber durumu kaydedilemedi.");
  }, []);

  const closeOverview = useCallback(
    (outcome: GuideOutcome) => {
      const guide = overviewGuide;
      setOverviewGuide(null);
      if (guide) void record(guide, outcome);
    },
    [overviewGuide, record],
  );

  const startTourFromOverview = useCallback(() => {
    const guide = overviewGuide;
    if (!guide) return;
    setOverviewGuide(null);
    void record(guide, "completed");
    setTourGuide(guide);
  }, [overviewGuide, record]);

  const startTour = useCallback((guide: GuideDefinition) => {
    setCenterOpen(false);
    setOverviewGuide(null);
    setTourGuide(guide);
  }, []);

  const finishTour = useCallback(
    (outcome: GuideOutcome) => {
      const guide = tourGuide;
      setTourGuide(null);
      if (guide) void record(guide, outcome);
      if (outcome === "completed") toast.success("Rehber tamamlandı.");
    },
    [record, tourGuide],
  );

  const contextValue = useMemo(() => ({ openCenter: () => setCenterOpen(true) }), []);

  return (
    <GuideContext.Provider value={contextValue}>
      {children}
      {centerOpen && (
        <GuideCenterDialog
          guides={guides}
          progress={progress}
          onClose={() => setCenterOpen(false)}
          onOpenOverview={(guide) => {
            setCenterOpen(false);
            setOverviewGuide(guide);
          }}
          onStartTour={startTour}
        />
      )}
      {overviewGuide && (
        <GuideOverviewDialog
          key={`${overviewGuide.id}-${overviewGuide.version}`}
          guide={overviewGuide}
          onExit={closeOverview}
          onStartTour={startTourFromOverview}
        />
      )}
      {tourGuide && (
        <SpotlightTour
          key={`${tourGuide.id}-${tourGuide.version}`}
          guide={tourGuide}
          role={role}
          onComplete={() => finishTour("completed")}
          onSkip={() => finishTour("skipped")}
        />
      )}
    </GuideContext.Provider>
  );
}

export function GuideHelpButton() {
  const context = useContext(GuideContext);
  if (!context) return null;
  return (
    <span data-guide-anchor="guide-help">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        title="Uygulama Rehberi"
        aria-label="Uygulama Rehberini aç"
        onClick={context.openCenter}
      >
        <CircleHelp />
      </Button>
    </span>
  );
}
