import type { Role } from "@/lib/types";

export type GuideRole = Extract<Role, "student" | "parent">;
export type GuideOutcome = "completed" | "skipped";
export type GuideCapability = "exams";
export type GuideCategory = "quick-start" | "work" | "planning" | "follow-up" | "account";
export type GuideSceneKind =
  | "dashboard"
  | "children"
  | "homework"
  | "resources"
  | "schedule"
  | "journal"
  | "updates"
  | "exams"
  | "account";

export interface GuideScene {
  title: string;
  description: string;
  kind: GuideSceneKind;
  eyebrow?: string;
}

export interface GuideTourStep {
  title: string;
  description: string;
  /** İlk görünür hedef kullanılır; böylece mobil/masaüstü ve boş durumlar desteklenir. */
  anchors: string[];
  routes?: Partial<Record<GuideRole, string>>;
}

export interface GuideDefinition {
  id: string;
  version: number;
  roles: GuideRole[];
  title: string;
  summary: string;
  category: GuideCategory;
  priority: number;
  autoLaunch: boolean;
  capability?: GuideCapability;
  routes?: Partial<Record<GuideRole, string>>;
  scenes: GuideScene[];
  tourSteps: GuideTourStep[];
}

export interface GuideProgress {
  guide_id: string;
  version: number;
  outcome: GuideOutcome;
}

const roleRoutes = (student: string, parent: string) => ({ student, parent });

export const GUIDE_DEFINITIONS: GuideDefinition[] = [
  {
    id: "student-quick-start",
    version: 1,
    roles: ["student"],
    title: "Öğrenci Hızlı Başlangıç",
    summary:
      "Ödevlerden çalışma günlüğüne, uygulamanın temel akışını birkaç adımda keşfet.",
    category: "quick-start",
    priority: 100,
    autoLaunch: true,
    routes: { student: "/student" },
    scenes: [
      {
        eyebrow: "1 · Anasayfa",
        title: "Bugünün planı tek ekranda",
        description:
          "Ödevlerini, programını ve ilerlemeni kartlardan takip et; istersen panelini düzenle.",
        kind: "dashboard",
      },
      {
        eyebrow: "2 · Ödevlerim",
        title: "Yaptığın çalışmayı işaretle",
        description:
          "Ödevdeki testleri tamamladıkça işaretle. Son durum öğretmen kontrolüyle kesinleşir.",
        kind: "homework",
      },
      {
        eyebrow: "3 · Kitaplığım",
        title: "Kaynak ilerlemeni kaydet",
        description:
          "Velinin eklediği kitabı aç ve çözdüğün testlere dokunarak ilerlemeni güncelle.",
        kind: "resources",
      },
      {
        eyebrow: "4 · Düzenli çalışma",
        title: "Programını izle, serini büyüt",
        description:
          "Haftalık programını kontrol et; her gün çalışmanı günlüğe ekleyerek serini sürdür.",
        kind: "journal",
      },
      {
        eyebrow: "5 · Gelişmeler",
        title: "Hiçbir gelişmeyi kaçırma",
        description:
          "Takvim, duyurular ve bildirimlerden yaklaşan işleri; uygun sınıfta deneme gelişimini gör.",
        kind: "updates",
      },
    ],
    tourSteps: [
      {
        title: "Burası anasayfan",
        description: "Güncel durumun ve sana özel kartlar burada yer alır.",
        anchors: ["dashboard-content"],
      },
      {
        title: "Ekranlar arasında geçiş",
        description:
          "Sık kullandığın sayfalara bu menüden ulaşırsın. Mobilde sabitlerini de değiştirebilirsin.",
        anchors: ["mobile-navigation", "desktop-navigation"],
      },
      {
        title: "Bildirimlerini kontrol et",
        description: "Yeni ödev, duyuru ve diğer gelişmeler burada görünür.",
        anchors: ["notifications"],
      },
      {
        title: "Rehber her zaman burada",
        description:
          "Bu anlatımı veya konu bazlı mini turları istediğin zaman yeniden açabilirsin.",
        anchors: ["guide-help"],
      },
    ],
  },
  {
    id: "parent-quick-start",
    version: 1,
    roles: ["parent"],
    title: "Veli Hızlı Başlangıç",
    summary: "Çocuğunun ödev, kaynak, program ve gelişim takibini birkaç adımda keşfet.",
    category: "quick-start",
    priority: 100,
    autoLaunch: true,
    routes: { parent: "/parent" },
    scenes: [
      {
        eyebrow: "1 · Anasayfa",
        title: "Çocuğunun özeti yanında",
        description:
          "Bekleyen ödevleri, haftalık programı ve ilerleme kartlarını tek bakışta gör.",
        kind: "children",
      },
      {
        eyebrow: "2 · Ödevler",
        title: "Ödev durumunu takip et",
        description:
          "Verilen çalışmaları, teslim tarihlerini ve öğretmen kontrolünden geçen durumları izle.",
        kind: "homework",
      },
      {
        eyebrow: "3 · Kaynaklar",
        title: "Kitaplığa kaynak ekle",
        description:
          "Kütüphaneden kitap seç veya yeni kitap öner; onaylanan kaynağı çocuğuna ata.",
        kind: "resources",
      },
      {
        eyebrow: "4 · Çalışma Programı",
        title: "Haftayı birlikte planla",
        description:
          "Çalışma saatlerini ekle, geçmiş haftaları incele ve uygun programı oluştur.",
        kind: "schedule",
      },
      {
        eyebrow: "5 · Gelişim",
        title: "Takvimi ve sonuçları izle",
        description:
          "Duyuru ve bildirimleri takip et; 7–8. sınıfta deneme sonuçlarını ekleyip analiz et.",
        kind: "exams",
      },
    ],
    tourSteps: [
      {
        title: "Veli anasayfası",
        description: "Çocuğunla ilgili güncel özet ve takip kartları bu alanda yer alır.",
        anchors: ["dashboard-content"],
      },
      {
        title: "Tüm takip ekranları",
        description: "Ödev, kaynak, takvim ve program ekranlarına bu menüden ulaşırsın.",
        anchors: ["mobile-navigation", "desktop-navigation"],
      },
      {
        title: "Yeni gelişmeler",
        description: "Ödev, kitap onayı ve duyuruların bildirimleri burada birikir.",
        anchors: ["notifications"],
      },
      {
        title: "Yardım hep elinin altında",
        description: "Konu bazlı anlatımları daha sonra buradan tekrar açabilirsin.",
        anchors: ["guide-help"],
      },
    ],
  },
  {
    id: "student-homework",
    version: 1,
    roles: ["student"],
    title: "Ödevleri Kullanma",
    summary:
      "Ödev durumlarını oku, yaptığın testleri işaretle ve öğretmen geri bildirimini gör.",
    category: "work",
    priority: 70,
    autoLaunch: false,
    routes: { student: "/student/homework" },
    scenes: [
      {
        title: "Ödev akışın",
        description: "Tarih, testler ve kontrol durumu aynı kartta.",
        kind: "homework",
      },
    ],
    tourSteps: [
      {
        title: "Ödevlerim",
        description: "Sayfanın amacı ve güncel açıklaması burada.",
        anchors: ["page-header"],
      },
      {
        title: "Ödev kartları",
        description:
          "Yaptığın testleri kart üzerinden işaretleyebilir, geri bildirimi okuyabilirsin.",
        anchors: ["homework-list", "page-header"],
      },
    ],
  },
  {
    id: "parent-homework",
    version: 1,
    roles: ["parent"],
    title: "Ödev Takibi",
    summary: "Çocuğunun ödevlerini, teslim tarihlerini ve kontrol durumunu takip et.",
    category: "work",
    priority: 70,
    autoLaunch: false,
    routes: { parent: "/parent/homework" },
    scenes: [
      {
        title: "Ödev takibi",
        description: "Bekleyen ve kontrol edilen çalışmalar bir arada.",
        kind: "homework",
      },
    ],
    tourSteps: [
      {
        title: "Ödevler",
        description: "Çocuğunun tüm ödevleri bu sayfada toplanır.",
        anchors: ["page-header"],
      },
      {
        title: "Durum kartları",
        description:
          "Teslim tarihi, test ilerlemesi ve öğretmen geri bildirimi kartlarda görünür.",
        anchors: ["homework-list", "page-header"],
      },
    ],
  },
  {
    id: "student-resources",
    version: 1,
    roles: ["student"],
    title: "Kitaplık ve Testler",
    summary: "Atanmış kaynaklarını aç ve çözdüğün testleri işaretle.",
    category: "work",
    priority: 65,
    autoLaunch: false,
    routes: { student: "/student/resources" },
    scenes: [
      {
        title: "Kitaplığın",
        description: "Her kaynakta tamamlanan test oranını anında gör.",
        kind: "resources",
      },
    ],
    tourSteps: [
      {
        title: "Kitaplığım",
        description: "Velinin senin için seçtiği kaynaklar burada görünür.",
        anchors: ["page-header"],
      },
      {
        title: "Kaynak kartları",
        description: "Bir kitabı açarak bölüm ve test ilerlemeni güncelleyebilirsin.",
        anchors: ["resource-library", "page-header"],
      },
    ],
  },
  {
    id: "parent-resources",
    version: 1,
    roles: ["parent"],
    title: "Kaynak Yönetimi",
    summary: "Kitap seç, yeni kaynak öner ve onaylanan kitabı çocuğuna ata.",
    category: "work",
    priority: 65,
    autoLaunch: false,
    routes: { parent: "/parent/resources" },
    scenes: [
      {
        title: "Kaynak seçimi",
        description: "Kütüphane ve çocuğunun kitaplığı aynı akışta.",
        kind: "resources",
      },
    ],
    tourSteps: [
      {
        title: "Kaynaklar",
        description: "Aktif çocuk ve kaynak ekleme işlemleri sayfanın üstünde.",
        anchors: ["page-header"],
      },
      {
        title: "Çocuğunun kitaplığı",
        description: "Atanmış kitapları ve ilerleme oranlarını burada görürsün.",
        anchors: ["resource-library", "page-header"],
      },
      {
        title: "Kütüphane",
        description: "Onaylı kaynakları buradan kitaplığa ekleyebilirsin.",
        anchors: ["resource-catalog", "resource-library", "page-header"],
      },
    ],
  },
  {
    id: "student-planning",
    version: 1,
    roles: ["student"],
    title: "Program ve Çalışma Günlüğü",
    summary: "Haftalık planını izle, günlük çalışmanı kaydet ve serini büyüt.",
    category: "planning",
    priority: 60,
    autoLaunch: false,
    routes: { student: "/student/schedule" },
    scenes: [
      {
        title: "Haftalık programın",
        description: "Hangi gün ne çalışacağını önceden gör.",
        kind: "schedule",
      },
      {
        title: "Çalışma günlüğün",
        description: "Süre ve soru sayını kaydederek gelişimini izle.",
        kind: "journal",
      },
    ],
    tourSteps: [
      {
        title: "Çalışma Programım",
        description: "Haftalar arasında geçerek planını inceleyebilirsin.",
        anchors: ["page-header"],
      },
      {
        title: "Haftalık görünüm",
        description: "Öğretmen ve velinin hazırladığı çalışma saatleri burada görünür.",
        anchors: ["weekly-schedule", "page-header"],
      },
      {
        title: "Çalışma Günlüğü",
        description: "Günlük çalışma kaydı eklemek için bu ekrana geç.",
        anchors: ["study-log-form", "page-header"],
        routes: { student: "/student/gunluk" },
      },
    ],
  },
  {
    id: "parent-planning",
    version: 1,
    roles: ["parent"],
    title: "Çalışma Programı",
    summary: "Çocuğunun haftalık çalışma saatlerini oluştur ve geçmiş haftaları incele.",
    category: "planning",
    priority: 60,
    autoLaunch: false,
    routes: { parent: "/parent/schedule" },
    scenes: [
      {
        title: "Haftayı planla",
        description: "Ders ve çalışma saatlerini dengeli bir programa yerleştir.",
        kind: "schedule",
      },
    ],
    tourSteps: [
      {
        title: "Çalışma Programı",
        description: "Hafta seçimi ve program açıklaması burada.",
        anchors: ["page-header"],
      },
      {
        title: "Program alanı",
        description:
          "Yeni çalışma ekleyebilir veya geçmiş programı bu haftaya kopyalayabilirsin.",
        anchors: ["weekly-schedule", "page-header"],
      },
    ],
  },
  {
    id: "student-updates",
    version: 1,
    roles: ["student"],
    title: "Takvim, Duyurular ve Bildirimler",
    summary: "Yaklaşan dersleri ve öğretmenin paylaştığı gelişmeleri kaçırma.",
    category: "follow-up",
    priority: 50,
    autoLaunch: false,
    routes: { student: "/student/calendar" },
    scenes: [
      {
        title: "Gelişmeler",
        description: "Takvim, duyuru ve bildirimler birbirini tamamlar.",
        kind: "updates",
      },
    ],
    tourSteps: [
      {
        title: "Takvim",
        description: "Dersler, teslim tarihleri ve hatırlatmalar burada görünür.",
        anchors: ["calendar-content", "page-header"],
      },
      {
        title: "Duyurular",
        description: "Öğretmenin mesaj ve belgelerine bu sayfadan ulaşırsın.",
        anchors: ["announcements-list", "page-header"],
        routes: { student: "/student/announcements" },
      },
      {
        title: "Bildirimler",
        description: "Yeni gelişmeler üst çubuktaki zil simgesinde birikir.",
        anchors: ["notifications"],
      },
    ],
  },
  {
    id: "parent-updates",
    version: 1,
    roles: ["parent"],
    title: "Takvim, Duyurular ve Bildirimler",
    summary: "Dersleri, teslim tarihlerini ve öğretmen duyurularını takip et.",
    category: "follow-up",
    priority: 50,
    autoLaunch: false,
    routes: { parent: "/parent/calendar" },
    scenes: [
      {
        title: "Güncel kal",
        description: "Çocuğunla ilgili gelişmeler doğru yerde, doğru zamanda.",
        kind: "updates",
      },
    ],
    tourSteps: [
      {
        title: "Takvim",
        description: "Dersler, teslim tarihleri ve hatırlatmalar burada görünür.",
        anchors: ["calendar-content", "page-header"],
      },
      {
        title: "Duyurular",
        description: "Öğretmenin veli duyuruları ve ekleri bu sayfada yer alır.",
        anchors: ["announcements-list", "page-header"],
        routes: { parent: "/parent/announcements" },
      },
      {
        title: "Bildirimler",
        description:
          "Yeni ödev ve diğer gelişmeler üst çubuktaki zil simgesinde birikir.",
        anchors: ["notifications"],
      },
    ],
  },
  {
    id: "student-exams",
    version: 1,
    roles: ["student"],
    title: "Deneme Analizim",
    summary: "Net, puan ve kazanım gelişimini geçmiş denemelerle birlikte incele.",
    category: "follow-up",
    priority: 55,
    autoLaunch: false,
    capability: "exams",
    routes: { student: "/student/exams" },
    scenes: [
      {
        title: "Gelişimini gör",
        description: "Net eğrisi ve kazanım analizi güçlü ve zayıf alanlarını gösterir.",
        kind: "exams",
      },
    ],
    tourSteps: [
      {
        title: "Deneme Analizim",
        description: "Genel gelişimin ve geçmiş sonuçların burada toplanır.",
        anchors: ["page-header"],
      },
      {
        title: "Analiz alanı",
        description: "Grafikler ve deneme listesi sonuçların eklendikçe oluşur.",
        anchors: ["exam-analysis", "page-header"],
      },
    ],
  },
  {
    id: "parent-exams",
    version: 1,
    roles: ["parent"],
    title: "Deneme Ekleme ve Analiz",
    summary: "7–8. sınıfta deneme sonucu ekle, net ve kazanım gelişimini incele.",
    category: "follow-up",
    priority: 55,
    autoLaunch: false,
    capability: "exams",
    routes: { parent: "/parent/exams" },
    scenes: [
      {
        title: "Deneme takibi",
        description: "Sonuç girişi ve gelişim analizi aynı akışta.",
        kind: "exams",
      },
    ],
    tourSteps: [
      {
        title: "Öğrenci seç",
        description: "Analiz görmek veya yeni deneme eklemek için önce öğrenciyi seç.",
        anchors: ["exam-analysis", "page-header"],
      },
      {
        title: "Deneme sonuçları",
        description: "Net, puan ve kazanım gelişimi öğrenci ekranında ayrıntılı görünür.",
        anchors: ["page-header"],
      },
    ],
  },
  {
    id: "account-help",
    version: 1,
    roles: ["student", "parent"],
    title: "Profil ve Destek",
    summary: "Bilgilerini güncelle, şifreni değiştir veya karşılaştığın sorunu bildir.",
    category: "account",
    priority: 30,
    autoLaunch: false,
    routes: roleRoutes("/student/profile", "/parent/profile"),
    scenes: [
      {
        title: "Hesabın ve destek",
        description: "Profil ayarları ile sorun bildirimi aynı güvenli alanda.",
        kind: "account",
      },
    ],
    tourSteps: [
      {
        title: "Profilim",
        description: "Kişisel bilgilerini ve şifreni bu sayfadan yönetebilirsin.",
        anchors: ["page-header"],
      },
      {
        title: "Destek",
        description:
          "Bir sorunla karşılaşırsan öğretmene ve yöneticiye buradan bildirebilirsin.",
        anchors: ["support-card", "page-header"],
      },
    ],
  },
];

export function getGuideById(id: string): GuideDefinition | undefined {
  return GUIDE_DEFINITIONS.find((guide) => guide.id === id);
}

export function getGuidesForRole(
  role: GuideRole,
  capabilities: { exams: boolean },
): GuideDefinition[] {
  return GUIDE_DEFINITIONS.filter(
    (guide) =>
      guide.roles.includes(role) && (!guide.capability || capabilities[guide.capability]),
  ).sort((a, b) => b.priority - a.priority);
}

export function findPendingAutomaticGuide(
  guides: GuideDefinition[],
  progress: GuideProgress[],
): GuideDefinition | null {
  const seenVersion = new Map(progress.map((item) => [item.guide_id, item.version]));
  return (
    guides.find(
      (guide) => guide.autoLaunch && (seenVersion.get(guide.id) ?? 0) < guide.version,
    ) ?? null
  );
}

export function routeForGuide(
  guide: GuideDefinition,
  role: GuideRole,
  step?: GuideTourStep,
): string | null {
  return step?.routes?.[role] ?? guide.routes?.[role] ?? null;
}
