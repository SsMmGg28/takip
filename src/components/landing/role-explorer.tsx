"use client";

import { useState } from "react";
import {
  Bell,
  BookOpen,
  CalendarClock,
  Check,
  ChevronRight,
  ClipboardList,
  Flame,
  LayoutDashboard,
  LineChart,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import styles from "./landing.module.css";

type RoleKey = "student" | "parent";

type ExplorerFeature = {
  id: string;
  label: string;
  eyebrow: string;
  title: string;
  description: string;
  detail: string;
  icon: LucideIcon;
  metric: string;
  metricLabel: string;
  progress: number;
};

const ROLE_CONTENT: Record<
  RoleKey,
  {
    label: string;
    shortDescription: string;
    icon: LucideIcon;
    features: ExplorerFeature[];
  }
> = {
  student: {
    label: "Öğrenci",
    shortDescription: "Günlük plan, ödevler ve kendi ilerlemen aynı görünümde.",
    icon: BookOpen,
    features: [
      {
        id: "student-overview",
        label: "Günlük özet",
        eyebrow: "Bugünün görünümü",
        title: "Nereden başlayacağını tek bakışta gör",
        description:
          "Bekleyen ödevler, bugünkü çalışma programı, yaklaşan etkinlikler ve son bildirimler ana sayfada bir araya gelir.",
        detail:
          "Panel kartlarını ihtiyacına göre sıralayabilir veya görünümden kaldırabilirsin.",
        icon: LayoutDashboard,
        metric: "4",
        metricLabel: "bugünkü görev",
        progress: 68,
      },
      {
        id: "student-homework",
        label: "Ödevler",
        eyebrow: "Ödev durumu",
        title: "Yaptığın testleri ilerledikçe işaretle",
        description:
          "Teslim tarihini ve ödev eklerini görür, tamamladığın testleri ayrı ayrı işaretler ve ödevi bitirdiğini bildirirsin.",
        detail:
          "Kontrol tamamlandıktan sonra işaretler korunur ve ödev durumu geçmişte görülebilir.",
        icon: ClipboardList,
        metric: "3/5",
        metricLabel: "test tamamlandı",
        progress: 60,
      },
      {
        id: "student-resources",
        label: "Kaynaklar",
        eyebrow: "Kaynak ilerlemesi",
        title: "Kitap, bölüm ve test ilerlemeni izle",
        description:
          "Kitaplığındaki kaynakları açar, çözdüğün testleri işaretler ve her kitap için tamamlanma oranını görürsün.",
        detail: "Listede olmayan bir kaynak için yeni kitap talebi de gönderebilirsin.",
        icon: BookOpen,
        metric: "%72",
        metricLabel: "matematik kaynağı",
        progress: 72,
      },
      {
        id: "student-rhythm",
        label: "Çalışma ritmi",
        eyebrow: "Günlük ve program",
        title: "Programını takip et, çalışmanı kaydet",
        description:
          "Haftalık programı saat saat görür; çalışma günlüğüne ders, konu, süre ve soru sayısı ekleyebilirsin.",
        detail:
          "Çalışma serisi ve konu dökümü, düzenli olarak ne yaptığını geriye dönük gösterir.",
        icon: Flame,
        metric: "6 gün",
        metricLabel: "çalışma serisi",
        progress: 84,
      },
    ],
  },
  parent: {
    label: "Veli",
    shortDescription: "Bağlı öğrencilerin planı ve ilerlemesi düzenli bir özette.",
    icon: Users,
    features: [
      {
        id: "parent-overview",
        label: "Haftalık özet",
        eyebrow: "Genel görünüm",
        title: "Bir veya birden fazla öğrenciyi ayrı ayrı izle",
        description:
          "Her öğrenci için ödev, çözülen test, çalışma programı ve son deneme verilerini karışmadan görüntülersin.",
        detail:
          "Ana sayfadaki kartların sırasını kendi takip alışkanlığına göre değiştirebilirsin.",
        icon: Users,
        metric: "2",
        metricLabel: "bağlı öğrenci",
        progress: 76,
      },
      {
        id: "parent-schedule",
        label: "Program",
        eyebrow: "Haftalık plan",
        title: "Güncel ve gelecek haftaları düzenle",
        description:
          "Çalışma saatlerini ve konuları haftalık plana ekleyebilir, geçmiş bir haftayı yeni haftaya kopyalayabilirsin.",
        detail:
          "Geçmiş haftalar arşivde korunur; güncel program öğrenci ekranında salt okunur görünür.",
        icon: CalendarClock,
        metric: "8",
        metricLabel: "planlı çalışma",
        progress: 64,
      },
      {
        id: "parent-resources",
        label: "Kaynaklar",
        eyebrow: "Kitaplık görünümü",
        title: "Kitaplığı ve test ilerlemesini birlikte gör",
        description:
          "Onaylı kaynakları öğrencinin kitaplığına ekler, tamamlanan testleri ve kitap ilerleme yüzdesini incelersin.",
        detail:
          "Listede olmayan bir kitabı ekleyebilir; onay sürecindeyken talebin durumunu takip edebilirsin.",
        icon: BookOpen,
        metric: "%58",
        metricLabel: "genel kaynak ilerlemesi",
        progress: 58,
      },
      {
        id: "parent-exams",
        label: "Denemeler",
        eyebrow: "Deneme analizi",
        title: "Sonuçları ekle, gelişimi ders bazında incele",
        description:
          "Yeni deneme sonucu ekleyebilir; net değişimini, kazanım sonuçlarını ve çalışılması gereken konuları görebilirsin.",
        detail:
          "Kaydedilmiş bir sonuçta değişiklik gerektiğinde düzenleme talebi akışını kullanırsın.",
        icon: LineChart,
        metric: "+4,25",
        metricLabel: "son üç denemede net",
        progress: 81,
      },
    ],
  },
};

function focusRoleTab(role: RoleKey) {
  document.getElementById(`role-tab-${role}`)?.focus();
}

export function RoleExplorer() {
  const [role, setRole] = useState<RoleKey>("student");
  const [activeFeatureId, setActiveFeatureId] = useState(
    ROLE_CONTENT.student.features[0].id,
  );

  const content = ROLE_CONTENT[role];
  const activeFeature =
    content.features.find((feature) => feature.id === activeFeatureId) ??
    content.features[0];
  const RoleIcon = content.icon;
  const ActiveIcon = activeFeature.icon;

  function changeRole(nextRole: RoleKey) {
    setRole(nextRole);
    setActiveFeatureId(ROLE_CONTENT[nextRole].features[0].id);
  }

  function handleRoleKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const nextRole =
      event.key === "ArrowRight" || event.key === "End" ? "parent" : "student";
    changeRole(nextRole);
    focusRoleTab(nextRole);
  }

  return (
    <div className={cn(styles.explorer, styles[role])}>
      <div className={styles.explorerIntro}>
        <div className={styles.roleTabs} role="tablist" aria-label="Panel rolünü seç">
          {(Object.keys(ROLE_CONTENT) as RoleKey[]).map((roleKey) => {
            const item = ROLE_CONTENT[roleKey];
            const Icon = item.icon;
            const selected = role === roleKey;
            return (
              <button
                key={roleKey}
                id={`role-tab-${roleKey}`}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls="role-explorer-panel"
                tabIndex={selected ? 0 : -1}
                className={cn(styles.roleTab, selected && styles.roleTabActive)}
                onClick={() => changeRole(roleKey)}
                onKeyDown={handleRoleKeyDown}
              >
                <Icon aria-hidden="true" />
                {item.label}
              </button>
            );
          })}
        </div>

        <div className={styles.roleSummary}>
          <span className={styles.roleIcon}>
            <RoleIcon aria-hidden="true" />
          </span>
          <div>
            <p className={styles.kicker}>{content.label} paneli</p>
            <p>{content.shortDescription}</p>
          </div>
        </div>

        <div className={styles.featureRail} aria-label={`${content.label} özellikleri`}>
          {content.features.map((feature) => {
            const Icon = feature.icon;
            const selected = feature.id === activeFeature.id;
            return (
              <button
                key={feature.id}
                type="button"
                aria-pressed={selected}
                className={cn(
                  styles.featureButton,
                  selected && styles.featureButtonActive,
                )}
                onClick={() => setActiveFeatureId(feature.id)}
              >
                <span className={styles.featureButtonIcon}>
                  <Icon aria-hidden="true" />
                </span>
                <span>{feature.label}</span>
                <ChevronRight aria-hidden="true" className={styles.featureChevron} />
              </button>
            );
          })}
        </div>
      </div>

      <div
        id="role-explorer-panel"
        role="tabpanel"
        aria-labelledby={`role-tab-${role}`}
        className={styles.phoneStage}
      >
        <div className={styles.orbitOne} />
        <div className={styles.orbitTwo} />
        <div className={styles.phone} key={`${role}-${activeFeature.id}`}>
          <div className={styles.phoneTop}>
            <span>09:41</span>
            <span className={styles.phonePill} />
            <div className={styles.phoneStatus}>
              <span />
              <span />
              <span />
            </div>
          </div>

          <div className={styles.phoneHeader}>
            <div>
              <span className={styles.phoneEyebrow}>{content.label} paneli</span>
              <strong>Merhaba, Deniz</strong>
            </div>
            <span className={styles.bellButton}>
              <Bell aria-hidden="true" />
              <i />
            </span>
          </div>

          <div className={styles.metricCard}>
            <div className={styles.metricTopline}>
              <span className={styles.metricIcon}>
                <ActiveIcon aria-hidden="true" />
              </span>
              <span className={styles.metricBadge}>
                <Sparkles aria-hidden="true" /> Temsili görünüm
              </span>
            </div>
            <span className={styles.metricValue}>{activeFeature.metric}</span>
            <span className={styles.metricLabel}>{activeFeature.metricLabel}</span>
            <div className={styles.progressTrack} aria-hidden="true">
              <span
                className={styles.progressFill}
                style={{ width: `${activeFeature.progress}%` }}
              />
            </div>
          </div>

          <div className={styles.detailCard}>
            <span className={styles.detailEyebrow}>{activeFeature.eyebrow}</span>
            <h3>{activeFeature.title}</h3>
            <p>{activeFeature.description}</p>
            <div className={styles.detailNote}>
              <Check aria-hidden="true" />
              <span>{activeFeature.detail}</span>
            </div>
          </div>

          <div className={styles.miniNav} aria-hidden="true">
            {[LayoutDashboard, ClipboardList, BookOpen, CalendarClock].map(
              (Icon, index) => (
                <span
                  key={index}
                  className={index === 0 ? styles.miniNavActive : undefined}
                >
                  <Icon />
                </span>
              ),
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
