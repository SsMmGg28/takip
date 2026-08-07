import type { Role } from "@/lib/types";

export type GuideOutcome = "completed" | "skipped";

export type GuideMockupKind =
  | "dashboard"
  | "homework"
  | "resources"
  | "schedule"
  | "journal"
  | "updates"
  | "exams"
  | "children";

export interface GuideScene {
  id: string;
  title: string;
  description: string;
  mockup: GuideMockupKind;
  /** Yalnız deneme özelliği açık bir öğrenci bağlamında gösterilir. */
  requiresExams?: boolean;
}

export interface GuideTourStep {
  id: string;
  route: string;
  anchor: string;
  title: string;
  description: string;
}

export interface GuideDefinition {
  id: string;
  version: number;
  roles: readonly Role[];
  title: string;
  summary: string;
  priority: number;
  autoOpen: boolean;
  requiresExams?: boolean;
  scenes: readonly GuideScene[];
  tour: readonly GuideTourStep[];
}

export interface GuideContext {
  role: Role;
  examsEnabled: boolean;
}

export interface GuideProgressSnapshot {
  guideId: string;
  version: number;
  outcome: GuideOutcome;
}

const studentRoot = "/student";
const parentRoot = "/parent";

export const GUIDE_DEFINITIONS: readonly GuideDefinition[] = [
  {
    id: "student-quick-start",
    version: 2,
    roles: ["student"],
    title: "Öğrenci Hızlı Başlangıç",
    summary: "Panelini, ödevlerini, kitaplığını ve çalışma akışını kısa sürede tanı.",
    priority: 100,
    autoOpen: true,
    scenes: [
      {
        id: "student-home",
        title: "Burası senin çalışma üssün",
        description:
          "Anasayfada bugünün planını ve önceliklerini görür, menüyü kendine göre düzenlersin.",
        mockup: "dashboard",
      },
      {
        id: "student-homework",
        title: "Yaptığın testleri işaretle",
        description:
          "Ödevlerindeki testleri tek dokunuşla işaretleyebilirsin. Son kontrol öğretmenindedir.",
        mockup: "homework",
      },
      {
        id: "student-library",
        title: "Kitaplığında ilerlemeni izle",
        description:
          "Kaynak kitabını aç, çözdüğün testleri işaretle ve ilerleme çubuğunu büyüt.",
        mockup: "resources",
      },
      {
        id: "student-plan",
        title: "Programla, tamamla, günlüğe aktar",
        description:
          "Haftalık programını düzenle; bitirdiğin çalışmayı süre ve soru bilgisiyle günlüğüne ekle.",
        mockup: "schedule",
      },
      {
        id: "student-updates",
        title: "Gelişmeler hep elinin altında",
        description:
          "Takvim, bildirim ve duyuruları takip et; sınıfında açıksa deneme gelişimini incele.",
        mockup: "updates",
      },
    ],
    tour: [],
  },
  {
    id: "student-dashboard",
    version: 1,
    roles: ["student"],
    title: "Anasayfa ve menü",
    summary: "Bugünün akışı, öncelikler ve panel özelleştirme.",
    priority: 80,
    autoOpen: false,
    scenes: [
      {
        id: "student-dashboard-summary",
        title: "Gününe tek bakışta başla",
        description:
          "Önceliklerini gör, panel kartlarını düzenle ve sık kullandığın ekranları sabitle.",
        mockup: "dashboard",
      },
    ],
    tour: [
      {
        id: "student-dashboard-main",
        route: studentRoot,
        anchor: "dashboard-main",
        title: "Anasayfan",
        description: "Bugünün programı, bekleyen ödevler ve ilerleme kartların burada.",
      },
      {
        id: "student-navigation",
        route: studentRoot,
        anchor: "navigation",
        title: "Ekranlar arasında geçiş",
        description: "Masaüstünde yan menüyü, telefonda alt menüyü kullanabilirsin.",
      },
    ],
  },
  {
    id: "student-homework",
    version: 1,
    roles: ["student"],
    title: "Ödevler",
    summary: "Aktif ödevleri görme ve yapılan testleri işaretleme.",
    priority: 70,
    autoOpen: false,
    scenes: [
      {
        id: "student-homework-summary",
        title: "Yaptığını anında işaretle",
        description: "Testli veya testsiz ödevlerde ilerlemeni öğretmenine bildir.",
        mockup: "homework",
      },
    ],
    tour: [
      {
        id: "student-homework-page",
        route: `${studentRoot}/homework`,
        anchor: "page-homework",
        title: "Ödev listesi",
        description: "Aktif ve tamamlanan ödevler arasında buradan geçiş yaparsın.",
      },
    ],
  },
  {
    id: "student-resources",
    version: 1,
    roles: ["student"],
    title: "Kitaplık ve test ilerlemesi",
    summary: "Kaynaklarını açma, testleri işaretleme ve ilerlemeyi izleme.",
    priority: 60,
    autoOpen: false,
    scenes: [
      {
        id: "student-resources-summary",
        title: "Her test ilerlemene eklenir",
        description: "Kitap kartından ayrıntıya geçip çözdüğün testleri işaretle.",
        mockup: "resources",
      },
    ],
    tour: [
      {
        id: "student-resources-page",
        route: `${studentRoot}/resources`,
        anchor: "page-resources",
        title: "Kitaplığın",
        description: "Sana eklenen kaynakları ve toplam test ilerlemeni burada görürsün.",
      },
    ],
  },
  {
    id: "student-planning",
    version: 1,
    roles: ["student"],
    title: "Program ve çalışma günlüğü",
    summary: "Haftanı planlama, tamamlanan çalışmayı günlüğe aktarma.",
    priority: 50,
    autoOpen: false,
    scenes: [
      {
        id: "student-planning-summary",
        title: "Planın günlüğünle birlikte çalışır",
        description: "Programını tamamladığında süre ve soru bilgisi günlüğüne taşınır.",
        mockup: "schedule",
      },
    ],
    tour: [
      {
        id: "student-schedule-page",
        route: `${studentRoot}/schedule`,
        anchor: "page-schedule",
        title: "Haftalık program",
        description: "Çalışma ekleme ve tamamlamayı bu ekrandan yönetirsin.",
      },
      {
        id: "student-journal-page",
        route: `${studentRoot}/gunluk`,
        anchor: "page-journal",
        title: "Çalışma günlüğü",
        description: "Serini, sürelerini ve son çalışma kayıtlarını burada izlersin.",
      },
    ],
  },
  {
    id: "student-updates",
    version: 1,
    roles: ["student"],
    title: "Takvim ve duyurular",
    summary: "Teslim tarihleri, bildirimler ve öğretmen duyuruları.",
    priority: 40,
    autoOpen: false,
    scenes: [
      {
        id: "student-updates-summary",
        title: "Hiçbir gelişmeyi kaçırma",
        description:
          "Takvim yaklaşanları, duyurular öğretmeninden gelen yenilikleri gösterir.",
        mockup: "updates",
      },
    ],
    tour: [
      {
        id: "student-calendar-page",
        route: `${studentRoot}/calendar`,
        anchor: "page-calendar",
        title: "Takvim",
        description: "Dersleri, teslim tarihlerini ve hatırlatmaları birlikte görürsün.",
      },
      {
        id: "student-announcements-page",
        route: `${studentRoot}/announcements`,
        anchor: "page-announcements",
        title: "Duyurular",
        description: "Öğretmeninin paylaştığı mesaj ve belgelere buradan ulaşırsın.",
      },
    ],
  },
  {
    id: "student-exams",
    version: 1,
    roles: ["student"],
    title: "Deneme analizi",
    summary: "7–8. sınıflar için net, puan ve kazanım gelişimi.",
    priority: 30,
    autoOpen: false,
    requiresExams: true,
    scenes: [
      {
        id: "student-exams-summary",
        title: "Gelişimini grafikte gör",
        description:
          "Denemelerini karşılaştır, güçlü ve çalışılacak kazanımları ayırt et.",
        mockup: "exams",
      },
    ],
    tour: [
      {
        id: "student-exams-page",
        route: `${studentRoot}/exams`,
        anchor: "page-exams",
        title: "Deneme analizin",
        description: "Net ve puan değişimin ile geçmiş denemelerin bu ekranda.",
      },
    ],
  },
  {
    id: "parent-quick-start",
    version: 2,
    roles: ["parent"],
    title: "Veli Hızlı Başlangıç",
    summary: "Çocuğunuzun ödev, kaynak ve çalışma gelişimini kısa sürede tanıyın.",
    priority: 100,
    autoOpen: true,
    scenes: [
      {
        id: "parent-home",
        title: "Çocuğunuzun özeti tek ekranda",
        description:
          "Birden fazla öğrenci bağlıysa seçim yapıp her çocuğun haftalık hikâyesini izleyin.",
        mockup: "children",
      },
      {
        id: "parent-homework",
        title: "Ödevleri yakından takip edin",
        description: "Aktif ve tamamlanan ödevleri, test ilerlemesiyle birlikte görün.",
        mockup: "homework",
      },
      {
        id: "parent-library",
        title: "Kaynak seçin, ilerlemeyi izleyin",
        description:
          "Kütüphaneden kitap seçin; kitaplığa ekleyip çözülen testleri takip edin.",
        mockup: "resources",
      },
      {
        id: "parent-plan",
        title: "Haftalık programı birlikte düzenleyin",
        description:
          "Çalışma ekleyin, var olan planı düzenleyin ve geçmiş haftaları inceleyin.",
        mockup: "schedule",
      },
      {
        id: "parent-updates",
        title: "Takvim ve gelişim hep görünür",
        description:
          "Duyuruları ve takvimi takip edin; uygun sınıflarda deneme ekleyip analiz edin.",
        mockup: "updates",
      },
    ],
    tour: [],
  },
  {
    id: "parent-dashboard",
    version: 1,
    roles: ["parent"],
    title: "Çocuk özeti ve seçimi",
    summary: "Çocuklar arasında geçiş ve haftalık gelişim özeti.",
    priority: 80,
    autoOpen: false,
    scenes: [
      {
        id: "parent-dashboard-summary",
        title: "Her çocuğa ayrı bakış",
        description:
          "Seçili çocuğun ödev, program ve akademik gelişim kartlarını birlikte görün.",
        mockup: "children",
      },
    ],
    tour: [
      {
        id: "parent-dashboard-main",
        route: parentRoot,
        anchor: "dashboard-main",
        title: "Çocuk özeti",
        description: "Seçili çocuğun haftalık hikâyesi ve yaklaşan işleri burada.",
      },
    ],
  },
  {
    id: "parent-homework",
    version: 1,
    roles: ["parent"],
    title: "Ödev takibi",
    summary: "Tüm çocukların aktif ve tamamlanan ödevleri.",
    priority: 70,
    autoOpen: false,
    scenes: [
      {
        id: "parent-homework-summary",
        title: "Ödev durumunu kolayca görün",
        description: "Ödevleri çocuk bazında ve test ayrıntılarıyla takip edin.",
        mockup: "homework",
      },
    ],
    tour: [
      {
        id: "parent-homework-page",
        route: `${parentRoot}/homework`,
        anchor: "page-homework",
        title: "Ödev takibi",
        description: "Aktif ve tamamlanan ödevler burada çocuk bazında gruplanır.",
      },
    ],
  },
  {
    id: "parent-resources",
    version: 1,
    roles: ["parent"],
    title: "Kaynak ve kitaplık",
    summary: "Kaynak seçme, kitaplığa ekleme ve ilerleme takibi.",
    priority: 60,
    autoOpen: false,
    scenes: [
      {
        id: "parent-resources-summary",
        title: "Doğru kaynağı kitaplığa ekleyin",
        description: "Sınıfa uygun kaynakları seçin, olmayan kitabı onaya gönderin.",
        mockup: "resources",
      },
    ],
    tour: [
      {
        id: "parent-resources-page",
        route: `${parentRoot}/resources`,
        anchor: "page-resources",
        title: "Kaynak merkezi",
        description: "Çocuğun kitaplığı, onay bekleyenler ve kütüphane aynı ekranda.",
      },
    ],
  },
  {
    id: "parent-planning",
    version: 1,
    roles: ["parent"],
    title: "Çalışma programı",
    summary: "Haftalık programı ekleme, düzenleme ve geçmişi görme.",
    priority: 50,
    autoOpen: false,
    scenes: [
      {
        id: "parent-planning-summary",
        title: "Haftayı birlikte planlayın",
        description:
          "Çalışma saatlerini ekleyin; eski haftaları gerektiğinde geri getirin.",
        mockup: "schedule",
      },
    ],
    tour: [
      {
        id: "parent-schedule-page",
        route: `${parentRoot}/schedule`,
        anchor: "page-schedule",
        title: "Haftalık program",
        description: "Her çocuk için çalışma ekleme ve düzenleme kontrolleri burada.",
      },
    ],
  },
  {
    id: "parent-updates",
    version: 1,
    roles: ["parent"],
    title: "Takvim ve duyurular",
    summary: "Yaklaşan tarihler ve öğretmen duyuruları.",
    priority: 40,
    autoOpen: false,
    scenes: [
      {
        id: "parent-updates-summary",
        title: "Yaklaşanları kaçırmayın",
        description:
          "Takvim tüm çocukların tarihlerini; duyurular öğretmen mesajlarını gösterir.",
        mockup: "updates",
      },
    ],
    tour: [
      {
        id: "parent-calendar-page",
        route: `${parentRoot}/calendar`,
        anchor: "page-calendar",
        title: "Aile takvimi",
        description: "Bağlı çocukların ders ve teslim tarihleri tek takvimde birleşir.",
      },
      {
        id: "parent-announcements-page",
        route: `${parentRoot}/announcements`,
        anchor: "page-announcements",
        title: "Duyurular",
        description: "Öğretmen mesajları ve ekli belgeler burada görünür.",
      },
    ],
  },
  {
    id: "parent-exams",
    version: 1,
    roles: ["parent"],
    title: "Deneme ekleme ve analiz",
    summary: "7–8. sınıflar için deneme kaydı, net ve kazanım analizi.",
    priority: 30,
    autoOpen: false,
    requiresExams: true,
    scenes: [
      {
        id: "parent-exams-summary",
        title: "Deneme gelişimini birlikte izleyin",
        description: "Yeni deneme ekleyin; net, puan ve kazanım değişimini inceleyin.",
        mockup: "exams",
      },
    ],
    tour: [
      {
        id: "parent-exams-page",
        route: `${parentRoot}/exams`,
        anchor: "page-exams",
        title: "Deneme merkezi",
        description: "Uygun sınıftaki çocuğu seçip denemelerine ve analizine ulaşın.",
      },
    ],
  },
];

export function getGuidesForContext(context: GuideContext): GuideDefinition[] {
  return GUIDE_DEFINITIONS.filter(
    (guide) =>
      guide.roles.includes(context.role) &&
      (!guide.requiresExams || context.examsEnabled),
  ).map((guide) => ({
    ...guide,
    scenes: guide.scenes.filter((scene) => !scene.requiresExams || context.examsEnabled),
  }));
}

export function getGuideById(guideId: string): GuideDefinition | undefined {
  return GUIDE_DEFINITIONS.find((guide) => guide.id === guideId);
}

export function guideNeedsAttention(
  guide: GuideDefinition,
  progress: readonly GuideProgressSnapshot[],
): boolean {
  const seen = progress.find((entry) => entry.guideId === guide.id);
  return !seen || seen.version < guide.version;
}

export function getHighestPriorityAutoGuide(
  guides: readonly GuideDefinition[],
  progress: readonly GuideProgressSnapshot[],
): GuideDefinition | undefined {
  return guides
    .filter((guide) => guide.autoOpen && guideNeedsAttention(guide, progress))
    .toSorted((a, b) => b.priority - a.priority)[0];
}
