import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Calendar,
  CalendarClock,
  ClipboardList,
  GraduationCap,
  KeyRound,
  LayoutDashboard,
  LineChart,
  LogIn,
  MonitorSmartphone,
  Users,
} from "lucide-react";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Reveal } from "@/components/landing/reveal";

const QUICK_START = [
  {
    icon: KeyRound,
    title: "1. Hesap bilgilerini al",
    description:
      "Hesaplar öğretmen tarafından oluşturulur. Kullanıcı adını ve geçici şifreni öğretmeninden al; siteye kayıt olman gerekmez.",
  },
  {
    icon: LogIn,
    title: "2. Giriş yap, şifreni belirle",
    description:
      "Sağ üstteki Giriş Yap butonuyla oturum aç. İlk girişte sistem güvenlik için senden yeni bir şifre belirlemeni ister.",
  },
  {
    icon: LayoutDashboard,
    title: "3. Paneline yönlendirilirsin",
    description:
      "Rolüne göre öğretmen, öğrenci veya veli paneli otomatik açılır. Tüm bölümlere üstteki menüden (mobilde alt çubuktan) ulaşırsın.",
  },
];

const FEATURES = [
  {
    icon: ClipboardList,
    title: "Ödev Takibi",
    description:
      "Ödevler menüsünde sana atanan ödevler listelenir. Ekli dosyayı indirir, yaptığın testleri işaretlersin. Öğretmen kontrol edip geri bildirim yazar; veli süreci anlık izler.",
  },
  {
    icon: BookOpen,
    title: "Kaynak Kütüphanesi",
    description:
      "Kaynaklar menüsünde kitapların bölüm ve test listesi yer alır. Çözdüğün testin kutusuna tıklayarak işaretlersin; kitap ilerleme çubuğu otomatik dolar. Yeni kitap talebini de buradan gönderirsin.",
  },
  {
    icon: Calendar,
    title: "Ortak Takvim",
    description:
      'Takvim menüsünde ders saatleri ve hatırlatmalar görünür. Öğretmen "Yeni Etkinlik Ekle" ile ders saati veya genel hatırlatma oluşturur; öğrenciye özel etkinlik yalnızca o öğrenciye ve velisine görünür.',
  },
  {
    icon: CalendarClock,
    title: "Çalışma Programı",
    description:
      "Çalışma Programı menüsünde haftalık planın gün gün, saat saat listelenir. Programı öğretmenin, velin ve sen birlikte oluşturursunuz; hangi gün hangi konuya çalışacağını buradan takip edersin.",
  },
  {
    icon: LineChart,
    title: "Deneme Analizi",
    description:
      "Deneme Analizi menüsünde öğretmenin veya velinin girdiği deneme sonuçları ders bazında net grafiklerine dönüşür. Yanlış yaptığın konular zayıf konu tablosunda listelenir; neye çalışacağını buradan görürsün.",
  },
  {
    icon: Users,
    title: "Üç Ayrı Panel",
    description:
      "Giriş yaptığında sistem seni rolüne göre doğru panele yönlendirir: öğretmen tüm öğrencilerini yönetir, öğrenci kendi verilerini görür, veli çocuğunun tüm sürecini okuma modunda izler.",
  },
];

const HOW_IT_WORKS: {
  role: string;
  icon: typeof GraduationCap;
  steps: string[];
}[] = [
  {
    role: "Öğretmen",
    icon: GraduationCap,
    steps: [
      "Öğrenciler menüsünden öğrenci ve veli hesaplarını oluştur; geçici şifreleri kendilerine ilet.",
      "Ödevler menüsünden öğrenci seçip dosya ekiyle ödev ata; teslimleri aynı ekrandan takip et.",
      "Kaynaklar'da kitap, bölüm ve test tanımla; İstekler kutusuna düşen kitap taleplerini yanıtla.",
      "Takvim'e ders saatlerini ekle, her öğrenci için haftalık çalışma programı hazırla.",
      "Deneme Analizi'nde sonuçları gir; net grafikleri ve zayıf konu listesi otomatik hesaplanır.",
    ],
  },
  {
    role: "Öğrenci",
    icon: BookOpen,
    steps: [
      "Öğretmenin verdiği kullanıcı adı ve şifreyle giriş yap; ilk girişte yeni şifreni belirle.",
      "Ödevlerim'de bekleyen ödevlerini gör, ekleri indir, yaptığın testleri işaretle.",
      "Kaynaklarım'da çözdüğün testlere tıklayıp işaretle; kitap ilerlemen kendiliğinden güncellenir.",
      "Takvim'den ders saatlerini, Çalışma Programım'dan haftalık planını takip et.",
      "Deneme Analizim'de netlerini ve zayıf konularını grafiklerle incele.",
    ],
  },
  {
    role: "Veli",
    icon: Users,
    steps: [
      "Sana verilen veli hesabıyla giriş yap; ilk girişte şifreni yenile.",
      "Ödevler'de çocuğunun bekleyen ve teslim edilen ödevlerini görüntüle.",
      "Kaynaklar'da kitap ilerlemesini, Takvim'de ders saatlerini takip et.",
      "Çalışma Programı'nda haftalık planı, Deneme Analizi'nde net grafiklerini incele.",
    ],
  },
];

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-x-clip">
      {/* Arka plan blobları */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="animate-blob absolute -top-40 -left-40 h-[32rem] w-[32rem] rounded-full bg-primary/15 blur-3xl" />
        <div
          className="animate-blob absolute -right-40 top-40 h-[28rem] w-[28rem] rounded-full bg-brand-to/15 blur-3xl"
          style={{ animationDelay: "-6s" }}
        />
        <div
          className="animate-blob absolute left-1/3 top-[60rem] h-[30rem] w-[30rem] rounded-full bg-brand-via/10 blur-3xl"
          style={{ animationDelay: "-11s" }}
        />
      </div>

      {/* Üst bar */}
      <header className="glass sticky top-0 z-40 border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Brand size="sm" />
          <nav className="hidden items-center gap-1 sm:flex">
            <Button variant="ghost" size="sm" asChild>
              <a href="#hizli-baslangic">Hızlı Başlangıç</a>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <a href="#bolumler">Bölümler</a>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <a href="#kullanim-rehberi">Kullanım Rehberi</a>
            </Button>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button size="sm" asChild>
              <Link href="/login">
                <LogIn className="h-4 w-4" />
                Giriş Yap
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pb-16 pt-16 text-center sm:pb-24 sm:pt-24">
        <div className="animate-fade-up mx-auto mb-6 flex w-fit items-center gap-2 rounded-full border bg-card/60 px-4 py-1.5 text-sm shadow-sm">
          <Users className="h-4 w-4 text-primary" />
          <span className="text-muted-foreground">Öğretmen · Öğrenci · Veli paneli</span>
        </div>
        <h1
          className="animate-fade-up mx-auto max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl"
          style={{ animationDelay: "80ms" }}
        >
          <span className="gradient-text animate-gradient">Ders Takip</span> nasıl
          kullanılır?
        </h1>
        <p
          className="animate-fade-up mx-auto mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg"
          style={{ animationDelay: "160ms" }}
        >
          Bu sitede ödevlerini, kaynak kitaplarını, ders takvimini, haftalık çalışma
          programını ve deneme sonuçlarını takip edersin. Aşağıda her bölümün ne işe
          yaradığını ve adım adım nasıl kullanıldığını bulacaksın.
        </p>
        <div
          className="animate-fade-up mt-8 flex flex-wrap items-center justify-center gap-3"
          style={{ animationDelay: "240ms" }}
        >
          <Button size="lg" asChild>
            <Link href="/login">
              Giriş Yap
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <a href="#kullanim-rehberi">Kullanım Rehberine Git</a>
          </Button>
        </div>

        {/* Panelde göreceklerine örnekler */}
        <div className="relative mx-auto mt-16 hidden max-w-3xl items-center justify-center gap-6 sm:flex">
          {[
            { icon: ClipboardList, label: "5 ödev teslim edildi", delay: "0s" },
            { icon: LineChart, label: "Matematik neti +4,25", delay: "-1.6s" },
            { icon: BookOpen, label: "Kitap ilerlemesi %72", delay: "-3.2s" },
            { icon: Calendar, label: "Yarın 18.00 ders", delay: "-4.8s" },
          ].map(({ icon: Icon, label, delay }, i) => (
            <div
              key={label}
              className="animate-float glass hover-lift flex items-center gap-2.5 rounded-2xl border px-4 py-3 text-sm font-medium shadow-lg shadow-primary/5"
              style={{ animationDelay: delay, animationDuration: `${4.5 + i * 0.6}s` }}
            >
              <span className="gradient-surface flex h-8 w-8 items-center justify-center rounded-lg text-white">
                <Icon className="h-4 w-4" />
              </span>
              {label}
            </div>
          ))}
        </div>
        <p className="animate-fade-in mt-6 hidden text-xs text-muted-foreground sm:block">
          Panelinde bu tür özet kartları ve bildirimlerle karşılaşacaksın.
        </p>
      </section>

      {/* Hızlı başlangıç */}
      <section
        id="hizli-baslangic"
        className="mx-auto max-w-6xl scroll-mt-20 px-4 pb-20 sm:pb-28"
      >
        <Reveal className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Üç adımda <span className="gradient-text">başla</span>
          </h2>
          <p className="mt-3 text-muted-foreground">
            Siteye kayıt olma adımı yoktur; hesabını öğretmenin oluşturur ve bilgilerini
            seninle paylaşır.
          </p>
        </Reveal>
        <div className="grid gap-5 sm:grid-cols-3">
          {QUICK_START.map((step, i) => (
            <Reveal key={step.title} delay={i * 110}>
              <div className="hover-lift group h-full rounded-2xl border bg-card/70 p-6 text-center shadow-sm">
                <div className="gradient-surface mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-lg shadow-primary/25 transition-transform duration-300 group-hover:scale-110">
                  <step.icon className="h-5 w-5" />
                </div>
                <h3 className="mb-2 font-semibold">{step.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Bölümler ve kullanımları */}
      <section
        id="bolumler"
        className="mx-auto max-w-6xl scroll-mt-20 px-4 pb-20 sm:pb-28"
      >
        <Reveal className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Sitedeki <span className="gradient-text">bölümler</span> ve kullanımları
          </h2>
          <p className="mt-3 text-muted-foreground">
            Menüde gördüğün her bölümün ne işe yaradığı ve içinde neler yapabileceğin
            aşağıda açıklanıyor.
          </p>
        </Reveal>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, i) => (
            <Reveal key={feature.title} delay={(i % 3) * 90}>
              <div className="hover-lift group h-full rounded-2xl border bg-card/70 p-6 shadow-sm">
                <div className="gradient-surface mb-4 flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-lg shadow-primary/25 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Rol bazlı kullanım rehberi */}
      <section
        id="kullanim-rehberi"
        className="mx-auto max-w-6xl scroll-mt-20 px-4 pb-20 sm:pb-28"
      >
        <Reveal className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Rolüne göre <span className="gradient-text">adım adım</span> kullanım
          </h2>
          <p className="mt-3 text-muted-foreground">
            Giriş yaptığında sistem seni rolüne uygun panele yönlendirir. Aşağıdaki
            adımlar kendi panelinde izleyeceğin sırayı gösterir.
          </p>
        </Reveal>
        <div className="grid gap-5 lg:grid-cols-3">
          {HOW_IT_WORKS.map((item, i) => (
            <Reveal key={item.role} delay={i * 110}>
              <div className="hover-lift h-full rounded-2xl border bg-card/70 p-6 shadow-sm">
                <div className="mb-5 flex items-center gap-3">
                  <div className="gradient-surface flex h-11 w-11 items-center justify-center rounded-2xl text-white shadow-lg shadow-primary/25">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-semibold">{item.role}</h3>
                </div>
                <ol className="space-y-3">
                  {item.steps.map((step, stepIndex) => (
                    <li key={stepIndex} className="flex gap-3 text-sm">
                      <span className="gradient-surface mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white">
                        {stepIndex + 1}
                      </span>
                      <span className="leading-relaxed text-muted-foreground">
                        {step}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Giriş bölümü */}
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:pb-28">
        <Reveal>
          <div className="gradient-surface animate-gradient relative overflow-hidden rounded-3xl px-6 py-14 text-center text-white shadow-2xl shadow-primary/30 sm:px-12">
            <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-12 -right-8 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Kullanmaya başlamak için giriş yap
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-white/85">
              Öğretmeninden aldığın kullanıcı adı ve şifreyle oturum aç. Şifreni unutursan
              yeni şifreni yine öğretmenin oluşturur.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Button
                size="lg"
                asChild
                className="border-0 bg-white text-primary shadow-lg hover:bg-white/90 hover:brightness-100"
              >
                <Link href="/login">
                  Giriş Yap
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <div className="flex items-center gap-2 text-sm text-white/85">
                <MonitorSmartphone className="h-4 w-4" />
                Telefon, tablet ve bilgisayar tarayıcısından kullanılır
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Footer */}
      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-center sm:flex-row sm:text-left">
          <Brand size="sm" />
          <p className="text-xs text-muted-foreground">
            Ders Takip — ödev, kaynak, takvim, çalışma programı ve deneme analizi tek
            panelde.
          </p>
        </div>
      </footer>
    </div>
  );
}
