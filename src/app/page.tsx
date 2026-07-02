import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Calendar,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  GraduationCap,
  LineChart,
  LogIn,
  Sparkles,
  Users,
} from "lucide-react";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Reveal } from "@/components/landing/reveal";

const FEATURES = [
  {
    icon: ClipboardList,
    title: "Ödev Takibi",
    description:
      "Öğretmen ödevi dosya ekiyle birlikte atar, öğrenci teslim eder, veli süreci anlık izler. Bekleyen ve tamamlanan ödevler tek bakışta görünür.",
  },
  {
    icon: BookOpen,
    title: "Kaynak Kütüphanesi",
    description:
      "Kitaplar bölüm bölüm ve test test tanımlanır. Öğrenci çözdüğü testleri işaretler, ilerleme çubukları kitap bazında otomatik güncellenir.",
  },
  {
    icon: Calendar,
    title: "Ortak Takvim",
    description:
      "Ders saatleri ve genel hatırlatmalar tek takvimde toplanır. Öğrenciye özel etkinlikler yalnızca ilgili öğrenci ve velisine görünür.",
  },
  {
    icon: CalendarClock,
    title: "Çalışma Programı",
    description:
      "Haftalık çalışma programı gün gün ve saat saat planlanır. Öğrenci hangi gün hangi konuya çalışacağını her zaman bilir.",
  },
  {
    icon: LineChart,
    title: "Deneme Analizi",
    description:
      "Deneme sonuçları ders bazında girilir; net grafikleri ve zayıf konu tabloları ile gelişim somut verilerle takip edilir.",
  },
  {
    icon: Users,
    title: "Üç Rollü Sistem",
    description:
      "Öğretmen, öğrenci ve veli için ayrı paneller. Herkes yalnızca kendi yetkisindeki bilgiyi görür; veliler çocuklarının tüm sürecini izleyebilir.",
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
      "Öğrenci ve veli hesaplarını tek tıkla oluştur, geçici şifreleri paylaş.",
      "Ödev ata, kaynak kitapları ve testleri tanımla, ders saatlerini takvime ekle.",
      "Deneme sonuçlarını gir; net grafikleri ve zayıf konular otomatik hesaplansın.",
      "Panelden tüm öğrencilerin ilerlemesini tek ekrandan yönet.",
    ],
  },
  {
    role: "Öğrenci",
    icon: BookOpen,
    steps: [
      "Sana verilen kullanıcı adı ve şifreyle giriş yap, ilk girişte şifreni yenile.",
      "Ödevlerini gör, tamamladıklarını teslim et.",
      "Çözdüğün testleri işaretle, kitap ilerlemeni anlık takip et.",
      "Takvimden ders saatlerini, programından haftalık planını izle.",
    ],
  },
  {
    role: "Veli",
    icon: Users,
    steps: [
      "Velilere özel hesabınla giriş yap.",
      "Çocuğunun ödev durumunu ve kaynak ilerlemesini görüntüle.",
      "Ders takvimini ve haftalık çalışma programını takip et.",
      "Deneme analizleriyle gelişimi somut verilerle izle.",
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
              <a href="#ozellikler">Özellikler</a>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <a href="#nasil-calisir">Nasıl Çalışır?</a>
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
      <section className="mx-auto max-w-6xl px-4 pb-20 pt-16 text-center sm:pb-28 sm:pt-24">
        <div className="animate-fade-up mx-auto mb-6 flex w-fit items-center gap-2 rounded-full border bg-card/60 px-4 py-1.5 text-sm shadow-sm">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-muted-foreground">
            Ders takibinin en kolay yolu
          </span>
        </div>
        <h1
          className="animate-fade-up mx-auto max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl"
          style={{ animationDelay: "80ms" }}
        >
          Ders sürecini{" "}
          <span className="gradient-text animate-gradient">tek panelden</span>{" "}
          yönet
        </h1>
        <p
          className="animate-fade-up mx-auto mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg"
          style={{ animationDelay: "160ms" }}
        >
          Ödevler, kaynak kitaplar, takvim, haftalık çalışma programı ve deneme
          analizleri — öğretmen, öğrenci ve veli için tek bir modern platformda.
        </p>
        <div
          className="animate-fade-up mt-8 flex flex-wrap items-center justify-center gap-3"
          style={{ animationDelay: "240ms" }}
        >
          <Button size="lg" asChild>
            <Link href="/login">
              Hemen Başla
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <a href="#ozellikler">Özellikleri Keşfet</a>
          </Button>
        </div>

        {/* Süzülen mini kartlar */}
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
      </section>

      {/* Özellikler */}
      <section id="ozellikler" className="mx-auto max-w-6xl scroll-mt-20 px-4 pb-20 sm:pb-28">
        <Reveal className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            İhtiyacın olan her şey <span className="gradient-text">tek yerde</span>
          </h2>
          <p className="mt-3 text-muted-foreground">
            Dağınık mesajlar ve kağıt listeler yerine, ders sürecinin tamamını
            düzenli tutan altı güçlü modül.
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

      {/* Nasıl çalışır */}
      <section
        id="nasil-calisir"
        className="mx-auto max-w-6xl scroll-mt-20 px-4 pb-20 sm:pb-28"
      >
        <Reveal className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Nasıl <span className="gradient-text">çalışır?</span>
          </h2>
          <p className="mt-3 text-muted-foreground">
            Her rol için basit ve net bir akış. Giriş yaptığında sistem seni
            doğrudan kendi paneline yönlendirir.
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

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:pb-28">
        <Reveal>
          <div className="gradient-surface animate-gradient relative overflow-hidden rounded-3xl px-6 py-14 text-center text-white shadow-2xl shadow-primary/30 sm:px-12">
            <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-12 -right-8 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Hazırsan hemen başlayalım
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-white/85">
              Öğretmenin sana verdiği hesapla giriş yap; ödevlerin, programın ve
              deneme sonuçların seni bekliyor.
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
                <CheckCircle2 className="h-4 w-4" />
                Kurulum gerekmez, tarayıcıdan çalışır
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
            Ders Takip — ödev, kaynak, takvim, program ve deneme analizi tek
            platformda.
          </p>
        </div>
      </footer>
    </div>
  );
}
