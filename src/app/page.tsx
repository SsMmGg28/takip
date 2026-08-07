import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  BookOpen,
  Calendar,
  CalendarClock,
  Check,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  KeyRound,
  LayoutDashboard,
  LineChart,
  ListChecks,
  LogIn,
  MonitorSmartphone,
  MoonStar,
  NotebookPen,
  PanelsTopLeft,
  Pin,
  RefreshCcw,
  UserRoundCheck,
  Users,
} from "lucide-react";
import { Brand } from "@/components/brand";
import { RoleExplorer } from "@/components/landing/role-explorer";
import { Reveal } from "@/components/landing/reveal";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import styles from "@/components/landing/landing.module.css";

export const metadata: Metadata = {
  title: "Öğrenci ve Veli Kullanım Rehberi",
  description:
    "Ders Takip öğrenci ve veli panellerindeki ödev, kaynak, program, günlük ve deneme bölümlerinin kullanım rehberi.",
};

type GuideItem = {
  title: string;
  summary: string;
  icon: typeof BookOpen;
  steps: string[];
};

const STUDENT_GUIDE: GuideItem[] = [
  {
    title: "Ana sayfa ve kişisel araçlar",
    summary: "Günlük özetini düzenle, sık kullandığın araçları yakında tut.",
    icon: LayoutDashboard,
    steps: [
      "Bekleyen ödev, bugünün programı, yaklaşan etkinlik ve kaynak ilerlemesini kartlar halinde gör.",
      "Kartların yerini değiştir, kullanmadıklarını kaldır ve ihtiyaç duyduklarını yeniden ekle.",
      "Pomodoro, hızlı not, geri sayım ve hızlı erişim gibi cihazına özel yardımcıları kullan.",
    ],
  },
  {
    title: "Ödevlerim",
    summary: "Teslim tarihini, ekleri ve test durumunu aynı kayıtta gör.",
    icon: ClipboardList,
    steps: [
      "Bekleyen ve tamamlanan ödevleri durumlarına veya tarihlerine göre incele.",
      "Varsa ek dosyayı indir; ödeve bağlı testleri çözdükçe ayrı ayrı işaretle.",
      "Ödevi tamamladığını bildir. Kontrol edilen ödevdeki işaretler sonradan değiştirilemez.",
    ],
  },
  {
    title: "Kaynaklarım",
    summary: "Kitaplığını bölüm ve test düzeyinde takip et.",
    icon: BookOpen,
    steps: [
      "Kitaplığındaki kaynakları ders, sınıf ve zorluk bilgileriyle görüntüle.",
      "Bir kitabı açıp bölüm listesinden çözdüğün testleri işaretle; ilerleme yüzdesi otomatik güncellensin.",
      "Aradığın kitap kütüphanede yoksa eklenmesi için talep oluştur ve onay durumunu takip et.",
    ],
  },
  {
    title: "Takvim ve program",
    summary: "Dersleri, teslimleri ve haftalık çalışma saatlerini bir arada izle.",
    icon: CalendarClock,
    steps: [
      "Takvimde ders saatlerini, genel hatırlatmaları ve ödev teslim tarihlerini gör.",
      "Çalışma Programım bölümünde seçilen haftayı gün ve saat sırasıyla incele.",
      "Geçmiş haftalara geçerek önceki planları görüntüle; program öğrenci ekranında salt okunurdur.",
    ],
  },
  {
    title: "Çalışma günlüğü",
    summary: "Yaptığın çalışmayı süre, soru ve konu bilgisiyle kaydet.",
    icon: NotebookPen,
    steps: [
      "Ders, konu, çalışma süresi, soru sayısı ve istersen kısa bir not ekle.",
      "Yanlış eklenen kendi günlük kaydını sil ve günlere göre çalışma serini takip et.",
      "Çalışma dökümünde süre ve soru sayılarını ders ve konu bazında karşılaştır.",
    ],
  },
  {
    title: "Deneme analizim",
    summary: "Netlerini ve kazanım sonuçlarını ayrıntılı olarak incele.",
    icon: LineChart,
    steps: [
      "Deneme listesinden tarih, tür ve toplam puan bilgilerini görüntüle.",
      "Her ders için doğru, yanlış, boş ve net değerlerini karşılaştır.",
      "Kazanım tablosu ve zayıf konu görünümüyle hangi alanların tekrar istediğini gör.",
    ],
  },
  {
    title: "Duyuru ve bildirimler",
    summary: "Yeni gelişmeleri panelden veya desteklenen cihazdan takip et.",
    icon: BellRing,
    steps: [
      "Duyurular bölümünde sana gönderilen metinleri ve varsa ek dosyaları aç.",
      "Bildirim zilinden yeni ödev, program ve diğer güncellemeleri kontrol et.",
      "Desteklenen telefonlarda Web Push seçeneğini açarak tarayıcı kapalıyken de bildirim al.",
    ],
  },
  {
    title: "Profil ve mobil menü",
    summary: "Profilini güncelle, alt menüyü kendi kullanımına göre düzenle.",
    icon: Pin,
    steps: [
      "Profil bölümünde kendi görüntülenebilir bilgilerini kontrol et ve güncelle.",
      "Mobil menüyü aç, sık kullandığın en fazla dört ekranı alt çubuğa sabitle.",
      "Sabitleri daha sonra değiştir; tercih yalnız kullandığın cihazda saklanır.",
    ],
  },
];

const PARENT_GUIDE: GuideItem[] = [
  {
    title: "Ana sayfa ve çocuklarım",
    summary: "Bağlı öğrencilerin durumunu birbirine karıştırmadan izle.",
    icon: Users,
    steps: [
      "Birden fazla öğrenci bağlıysa her birinin özetini kendi adı altında görüntüle.",
      "Haftalık ödev, çözülen test, yaklaşan etkinlik ve son deneme kartlarını incele.",
      "Panel kartlarını takip önceliğine göre taşı, kaldır veya yeniden görünür yap.",
    ],
  },
  {
    title: "Ödev takibi",
    summary: "Bekleyen, tamamlanan ve kontrol edilen ödevleri ayırt et.",
    icon: ClipboardCheck,
    steps: [
      "Öğrenci seçerek ona ait ödevleri teslim tarihi ve durum bilgisiyle listele.",
      "Ödev açıklamasını, ek dosyaları ve öğrenci tarafından işaretlenen testleri görüntüle.",
      "Tamamlanma ve kontrol durumlarını izleyerek geçmiş ödev kayıtlarına yeniden ulaş.",
    ],
  },
  {
    title: "Kaynak ve kitaplık",
    summary: "Kitaplığı düzenle, kaynak ilerlemesini bölüm bölüm gör.",
    icon: BookOpen,
    steps: [
      "Bağlı öğrenciyi seç; onaylı bir kitabı kitaplığa ekle veya artık kullanılmayanı çıkar.",
      "Kitap ayrıntısında bölümleri, test sayılarını ve tamamlanan testleri görüntüle.",
      "Listede olmayan kaynak için kitap ekleme talebi oluştur; onaylanınca kitaplığa ata.",
    ],
  },
  {
    title: "Takvim",
    summary: "Dersleri, hatırlatmaları ve teslim tarihlerini tek takvimde gör.",
    icon: Calendar,
    steps: [
      "Bağlı öğrencilere açık ders ve etkinlik kayıtlarını tarih sırasıyla incele.",
      "Ödeve ait teslim tarihlerini diğer etkinliklerden ayrılmış biçimde gör.",
      "Birden fazla öğrenci varsa takvimde hangi kaydın kime ait olduğunu kontrol et.",
    ],
  },
  {
    title: "Çalışma programı",
    summary: "Gelecek haftaları düzenle, geçmiş bir planı yeniden kullan.",
    icon: CalendarClock,
    steps: [
      "Öğrenci için gün, saat, ders ve konu bilgisiyle yeni çalışma kaydı ekle.",
      "Güncel ve gelecek haftadaki kayıtları düzenle veya kaldır.",
      "Geçmiş haftaları arşivden aç; uygun bir planı seçilen haftaya tek adımda kopyala.",
    ],
  },
  {
    title: "Deneme analizi",
    summary: "Sonuç ekle, net gelişimini ve kazanımları incele.",
    icon: LineChart,
    steps: [
      "Bağlı öğrenci için yeni deneme kaydı oluştur ve ders sonuçlarını gir.",
      "Toplam puanı, ders netlerini, kazanım tablosunu ve zayıf konu listesini görüntüle.",
      "Kayıt değişikliği gerektiğinde düzenleme talebi oluştur; onay verilen kaydı düzenle.",
    ],
  },
  {
    title: "Duyuru ve bildirimler",
    summary: "Öğrenciyle ilgili güncellemeleri tek yerde takip et.",
    icon: BellRing,
    steps: [
      "Veli hesabına veya bağlı öğrenciye gönderilen duyuruları görüntüle.",
      "Duyuru eklerini güvenli indirme düğmesiyle aç.",
      "Uygulama içi bildirimleri ve desteklenen cihazlarda Web Push seçeneğini kullan.",
    ],
  },
  {
    title: "Profil ve panel düzeni",
    summary: "Kendi hesabını ve sık kullandığın ekranları düzenle.",
    icon: PanelsTopLeft,
    steps: [
      "Profil bölümünde kendi görüntülenebilir hesap bilgilerini güncelle.",
      "Ana sayfa kartlarının sırasını ve görünürlüğünü kişisel olarak belirle.",
      "Mobil alt çubukta en sık kullandığın dört ekranı cihazına özel olarak sabitle.",
    ],
  },
];

const COMMON_FEATURES = [
  {
    icon: MonitorSmartphone,
    title: "Her ekran boyutuna uyum",
    description:
      "Telefon, tablet ve bilgisayarda aynı bölümlere ulaşırsın. Mobilde sık kullanılan ekranlar alt çubukta kalır.",
    color: "var(--brand-to)",
  },
  {
    icon: MoonStar,
    title: "Açık ve koyu tema",
    description:
      "Tema seçimini üst menüden değiştirebilir; cihaz ve ortam ışığına uygun görünümü kullanabilirsin.",
    color: "var(--student)",
  },
  {
    icon: PanelsTopLeft,
    title: "Kişisel panel düzeni",
    description:
      "Ana sayfadaki bilgi kartlarını taşıyabilir, kaldırabilir ve daha sonra yeniden ekleyebilirsin.",
    color: "var(--parent)",
  },
  {
    icon: BellRing,
    title: "Bildirim seçenekleri",
    description:
      "Yeni kayıtları uygulama içi bildirimlerden; desteklenen cihazlarda ise Profilim sayfasındaki Telefon Bildirimleri düğmesinden Web Push ile takip edebilirsin.",
    color: "var(--success)",
  },
];

const START_STEPS = [
  {
    icon: KeyRound,
    title: "Hesap bilgilerini al",
    description:
      "Öğrenci ve veli hesapları öğretmen tarafından oluşturulur. Ayrı bir kayıt formu doldurman gerekmez.",
  },
  {
    icon: LogIn,
    title: "İlk girişini yap",
    description:
      "Verilen kullanıcı adı ve geçici şifreyle giriş yap. Sistem ilk girişte kendi şifreni belirlemeni ister.",
  },
  {
    icon: UserRoundCheck,
    title: "Rol paneline geç",
    description:
      "Giriş tamamlandığında öğrenci veya veli paneline otomatik olarak yönlendirilirsin.",
  },
  {
    icon: RefreshCcw,
    title: "Şifre desteği al",
    description:
      "Şifreni unutursan yeni geçici şifre oluşturulması için öğretmeninle iletişime geç.",
  },
];

function SectionHeader({
  label,
  title,
  description,
  centered = false,
}: {
  label: string;
  title: string;
  description: string;
  centered?: boolean;
}) {
  return (
    <div
      className={`${styles.sectionHeader} ${centered ? styles.sectionHeaderCentered : ""}`}
    >
      <span className={styles.sectionLabel}>{label}</span>
      <h2 className={styles.sectionTitle}>{title}</h2>
      <p className={styles.sectionDescription}>{description}</p>
    </div>
  );
}

function GuideRail({ items, parent = false }: { items: GuideItem[]; parent?: boolean }) {
  return (
    <div className={`${styles.guideRail} ${parent ? styles.parentGuide : ""}`}>
      {items.map((item, index) => {
        const Icon = item.icon;
        return (
          <details key={item.title} className={styles.guideCard} open={index === 0}>
            <summary>
              <span className={styles.guideIcon}>
                <Icon aria-hidden="true" />
              </span>
              <div>
                <h3>{item.title}</h3>
                <p>{item.summary}</p>
              </div>
              <ChevronRight aria-hidden="true" className={styles.summaryChevron} />
            </summary>
            <div className={styles.guideBody}>
              <ol>
                {item.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </div>
          </details>
        );
      })}
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className={styles.page}>
      <div className={styles.backgroundGrid} />
      <div className={`${styles.glow} ${styles.glowOne}`} />
      <div className={`${styles.glow} ${styles.glowTwo}`} />

      <header className="glass sticky top-0 z-40 border-b border-border/70">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Brand size="sm" />
          <nav className="hidden items-center gap-1 md:flex" aria-label="Sayfa bölümleri">
            <Button variant="ghost" size="sm" asChild>
              <a href="#ogrenci">Öğrenci</a>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <a href="#veli">Veli</a>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <a href="#ortak">Ortak İmkânlar</a>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <a href="#baslangic">Başlangıç</a>
            </Button>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button size="sm" asChild>
              <Link href="/login">
                <LogIn className="h-4 w-4" />
                <span className="hidden min-[390px]:inline">Giriş Yap</span>
              </Link>
            </Button>
          </div>
        </div>
        <nav
          className={`${styles.mobileChapterNav} flex gap-1 overflow-x-auto border-t border-border/50 px-3 py-2 md:hidden`}
          aria-label="Mobil sayfa bölümleri"
        >
          {[
            ["#ogrenci", "Öğrenci"],
            ["#veli", "Veli"],
            ["#ortak", "Ortak İmkânlar"],
            ["#baslangic", "Başlangıç"],
          ].map(([href, label]) => (
            <a
              key={href}
              href={href}
              className="shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              {label}
            </a>
          ))}
        </nav>
      </header>

      <main>
        <section className={`${styles.hero} mx-auto max-w-7xl px-4 sm:px-6`}>
          <div className={styles.heroCopy}>
            <span className={styles.heroBadge}>
              <ListChecks aria-hidden="true" />
              Öğrenci ve veli kullanım rehberi
            </span>
            <h1 className={styles.heroTitle}>
              Panellerde neler var?
              <span>Nasıl kullanılır?</span>
            </h1>
            <p className={styles.heroDescription}>
              Ödev, kaynak, çalışma programı, günlük ve deneme bölümlerinde neleri
              görebileceğini; hangi işlemleri yapabileceğini rolüne göre incele.
            </p>
            <div className={styles.heroFacts} aria-label="Sayfa özellikleri">
              <span>
                <Check aria-hidden="true" /> Temsili panel görünümü
              </span>
              <span>
                <Check aria-hidden="true" /> Ayrıntılı kullanım adımları
              </span>
              <span>
                <Check aria-hidden="true" /> Telefon öncelikli anlatım
              </span>
            </div>
          </div>
          <RoleExplorer />
        </section>

        <section id="ogrenci" className={`${styles.section} ${styles.sectionTint}`}>
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <Reveal>
              <SectionHeader
                label="Öğrenci paneli"
                title="Günlük işlerini adım adım takip et"
                description="Her başlığı açarak ilgili bölümde hangi bilgilerin bulunduğunu ve hangi işlemleri yapabileceğini görebilirsin. Mobilde kartları yana kaydırabilirsin."
              />
            </Reveal>
            <Reveal delay={80}>
              <GuideRail items={STUDENT_GUIDE} />
            </Reveal>
          </div>
        </section>

        <section id="veli" className={styles.section}>
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <Reveal>
              <SectionHeader
                label="Veli paneli"
                title="Planı düzenle, ilerlemeyi ayrıntılı gör"
                description="Bağlı öğrencilerin ödev, kaynak, program ve deneme bilgileri ayrı ayrı tutulur. Aşağıdaki başlıklar veli hesabındaki işlem alanlarını açıklar."
              />
            </Reveal>
            <Reveal delay={80}>
              <GuideRail items={PARENT_GUIDE} parent />
            </Reveal>
          </div>
        </section>

        <section id="ortak" className={`${styles.section} ${styles.sectionTint}`}>
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <Reveal>
              <SectionHeader
                label="Ortak imkânlar"
                title="İki rolde de aynı temel kullanım alışkanlıkları"
                description="Ekran uyumu, görünüm tercihleri ve bildirim araçları öğrenci ve veli hesaplarında ortak şekilde çalışır."
                centered
              />
            </Reveal>
            <div className={styles.commonGrid}>
              {COMMON_FEATURES.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <Reveal key={feature.title} delay={(index % 4) * 70}>
                    <article
                      className={styles.commonCard}
                      style={{ "--card-accent": feature.color } as React.CSSProperties}
                    >
                      <span className={styles.commonCardIcon}>
                        <Icon aria-hidden="true" />
                      </span>
                      <h3>{feature.title}</h3>
                      <p>{feature.description}</p>
                    </article>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        <section id="baslangic" className={styles.section}>
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <Reveal>
              <SectionHeader
                label="Başlangıç"
                title="Hesabına ilk kez girerken"
                description="Kayıt formu bulunmaz. Hesap bilgilerini aldıktan sonra aşağıdaki sırayla öğrenci veya veli paneline geçersin."
              />
            </Reveal>
            <div className={styles.startGrid}>
              {START_STEPS.map((step, index) => {
                const Icon = step.icon;
                return (
                  <Reveal key={step.title} delay={index * 70}>
                    <article className={styles.startStep}>
                      <span className={styles.stepNumber} aria-hidden="true">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <h3 className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
                          {step.title}
                        </h3>
                        <p>{step.description}</p>
                      </div>
                    </article>
                  </Reveal>
                );
              })}
            </div>

            <Reveal delay={120}>
              <div className={styles.loginNote}>
                <div>
                  <h3>Hesap bilgilerin hazırsa giriş ekranına geçebilirsin.</h3>
                  <p>
                    Kullanıcı adı ve şifre alanları öğrenci ve veli hesapları için
                    aynıdır; yönlendirme girişten sonra otomatik yapılır.
                  </p>
                </div>
                <Button size="lg" asChild className="shrink-0">
                  <Link href="/login">
                    Giriş Yap
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/70">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-5 px-4 py-8 sm:flex-row sm:items-center sm:px-6">
          <Brand size="sm" />
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
            Öğrenci ve veli hesapları için ödev, kaynak, takvim, çalışma programı ve
            deneme takip sistemi.
          </p>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/login">
              Giriş Yap
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </footer>
    </div>
  );
}
