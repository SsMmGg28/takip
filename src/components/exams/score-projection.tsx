import { Gauge, Target, TrendingUp } from "lucide-react";

/**
 * LGS puan projeksiyonu (tahmini). Öğrencinin kendi geçmiş (net, puan) ilişkisinden
 * çıkarılan "net başına puan" ile hedefe kalan puan/net gösterilir. Salt-okunur;
 * üç rolde de görünür. Gerçek LGS puanı standardize edildiğinden değerler tahminidir.
 */
export function ScoreProjection({
  latestScore,
  latestNet,
  targetScore,
  puanPerNet,
}: {
  latestScore: number | null;
  latestNet: number | null;
  targetScore: number | null;
  puanPerNet: number | null;
}) {
  if (latestScore == null && targetScore == null) return null;

  const gap =
    latestScore != null && targetScore != null ? targetScore - latestScore : null;
  const netNeeded =
    gap != null && gap > 0 && puanPerNet != null && puanPerNet > 0
      ? Math.ceil(gap / puanPerNet)
      : null;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Puan Projeksiyonu</h3>
        <span className="text-xs font-normal text-muted-foreground">(tahmini)</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border bg-muted/30 p-3">
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Gauge className="h-3.5 w-3.5" /> Son deneme
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {latestScore != null ? latestScore.toFixed(1) : "—"}
          </p>
          {latestNet != null && (
            <p className="text-xs text-muted-foreground">{latestNet.toFixed(2)} net</p>
          )}
        </div>

        <div className="rounded-xl border bg-muted/30 p-3">
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Target className="h-3.5 w-3.5" /> Hedef
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {targetScore != null ? targetScore.toFixed(1) : "—"}
          </p>
          <p className="text-xs text-muted-foreground">
            {targetScore != null ? "puan" : "belirlenmedi"}
          </p>
        </div>

        <div className="rounded-xl border bg-muted/30 p-3">
          <p className="text-xs text-muted-foreground">Hedefe kalan</p>
          {gap == null ? (
            <p className="mt-1 text-sm text-muted-foreground">
              {targetScore == null ? "Hedef belirlenmedi" : "Deneme bekleniyor"}
            </p>
          ) : gap <= 0 ? (
            <p className="mt-1 text-2xl font-semibold text-success">Ulaşıldı 🎉</p>
          ) : (
            <>
              <p className="mt-1 text-2xl font-semibold tabular-nums">
                {gap.toFixed(1)} <span className="text-sm font-normal">puan</span>
              </p>
              {netNeeded != null && (
                <p className="text-xs text-muted-foreground">≈ {netNeeded} net daha</p>
              )}
            </>
          )}
        </div>
      </div>

      {puanPerNet != null && puanPerNet > 0 && (
        <p className="text-xs text-muted-foreground">
          Tahmini: 1 net ≈ {puanPerNet.toFixed(1)} puan (öğrencinin kendi denemelerinden
          hesaplandı; ülke geneli standardizasyon nedeniyle gerçek puan farklı olabilir).
        </p>
      )}
    </div>
  );
}
