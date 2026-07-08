"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Calendar,
  CalendarClock,
  ChevronDown,
  ClipboardList,
  KeyRound,
  LayoutDashboard,
  LineChart,
  LogIn,
  MonitorSmartphone,
  Play,
  Users,
} from "lucide-react";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Reveal } from "@/components/landing/reveal";
import { cn } from "@/lib/utils";

type Role = "ogrenci" | "veli";

const QUICK_START = [
  {
    icon: KeyRound,
    title: "1. Hesap bilgini al",
    description:
      "Hesabın öğretmenin tarafından oluşturulur. Kullanıcı adını ve geçici şifreni öğretmeninden al; kayıt olman gerekmez.",
  },
  {
    icon: LogIn,
    title: "2. Giriş yap, şifreni belirle",
    description:
      "Sağ üstteki Giriş Yap ile oturum aç. İlk girişte güvenlik için yeni bir şifre belirlersin.",
  },
  {
    icon: LayoutDashboard,
    title: "3. Paneline geç",
    description:
      "Rolüne göre öğrenci veya veli panelin açılır. Bölümlere üstteki menüden, mobilde alt çubuktan ulaşırsın.",
  },
];

const FEATURES: {
  icon: typeof ClipboardList;
  title: string;
  desc: string;
  steps: Record<Role, string[]>;
}[] = [
  {
    icon: ClipboardList,
    title: "Ödev Takibi",
    desc: "Sana atanan ödevleri tek listede görürsün: eki indir, yaptığın testleri işaretle, öğretmenin geri bildirimini oku.",
    steps: {
      ogrenci: [
        "Menüden Ödevlerim'i aç; bekleyen ve teslim edilen ödevler ayrı listelenir.",
        "Bir ödeve dokun ve varsa ekli dosyayı indir.",
        "Bitirdiğin testleri işaretle; ödev otomatik teslim durumuna geçer.",
        "Öğretmenin yazdığı geri bildirimi ödev detayında oku.",
      ],
      veli: [
        "Menüden Ödevler'i aç; çocuğunun bekleyen ve teslim ettiği ödevleri gör.",
        "Ödev detayında ekleri ve işaretlenen testleri incele.",
        "Öğretmenin geri bildirimlerini okuma modunda takip et.",
      ],
    },
  },
  {
    icon: BookOpen,
    title: "Kaynak Kütüphanesi",
    desc: "Kitapların bölüm ve testleri burada. Çözdüğün testi işaretledikçe ilerleme çubuğu dolar; yeni kitap talebini de buradan iletirsin.",
    steps: {
      ogrenci: [
        "Kaynaklarım'ı aç; kitapları ve her kitabın bölümlerini gör.",
        "Çözdüğün testin kutucuğuna dokunarak işaretle.",
        "Kitap ilerleme çubuğunun kendiliğinden dolduğunu izle.",
        "İhtiyacın olan kitabı 'İstek' ile öğretmenine gönder.",
      ],
      veli: [
        "Kaynaklar'ı aç; çocuğunun kitap ilerlemesini gör.",
        "Hangi bölüm ve testlerin tamamlandığını incele.",
      ],
    },
  },
  {
    icon: Calendar,
    title: "Ortak Takvim",
    desc: "Ders saatleri ve hatırlatmalar takvimde görünür. Sana özel eklenen etkinlikler yalnızca sana ve velinize görünür.",
    steps: {
      ogrenci: [
        "Takvim'i aç; yaklaşan ders saatlerini ve hatırlatmaları gör.",
        "Bir güne dokunarak o günün etkinliklerini incele.",
        "Sana özel eklenen etkinlikleri kaçırma.",
      ],
      veli: [
        "Takvim'i aç; çocuğunun ders saatlerini ve hatırlatmalarını gör.",
        "Yaklaşan etkinlikleri gün gün takip et.",
      ],
    },
  },
  {
    icon: CalendarClock,
    title: "Çalışma Programı",
    desc: "Haftalık planın gün gün, saat saat listelenir. Programı öğretmenin ve velinle birlikte oluşturursunuz.",
    steps: {
      ogrenci: [
        "Çalışma Programım'ı aç; haftanın günlerini gör.",
        "Her gün hangi derse/konuya çalışacağını takip et.",
        "Tamamladığın çalışmayı işaretleyerek ilerle.",
      ],
      veli: [
        "Çalışma Programı'nı aç; çocuğunun haftalık planını gör.",
        "Hangi gün hangi konunun planlandığını incele.",
      ],
    },
  },
  {
    icon: LineChart,
    title: "Deneme Analizi",
    desc: "Girilen deneme sonuçları ders bazında net grafiklerine dönüşür; zayıf konular ayrı bir tabloda listelenir.",
    steps: {
      ogrenci: [
        "Deneme Analizim'i aç; netlerini ders bazında grafiklerle gör.",
        "Zayıf konu tablosundan nerede eksiğin olduğunu belirle.",
        "Denemeler arası gelişimini grafiklerden karşılaştır.",
      ],
      veli: [
        "Deneme Analizi'ni aç; çocuğunun net grafiklerini gör.",
        "Zayıf konuları ve gelişim eğilimini takip et.",
      ],
    },
  },
];

const SUMMARY_CARDS = [
  { icon: ClipboardList, label: "5 ödev teslim edildi" },
  { icon: LineChart, label: "Matematik neti +4,25" },
  { icon: Calendar, label: "Yarın 18.00 ders" },
];

export default function LandingPage() {
  const [role, setRole] = useState<Role>("ogrenci");
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="relative min-h-screen overflow-x-clip">
      {/* Arka plan blobları */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="animate-blob absolute -top-40 -left-40 h-[34rem] w-[34rem] rounded-full bg-primary/15 blur-3xl" />
        <div
          className="animate-blob absolute -right-36 top-[30rem] h-[30rem] w-[30rem] rounded-full bg-brand-to/15 blur-3xl"
          style={{ animationDelay: "-6s" }}
        />
      </div>

      {/* Üst bar */}
      <header className="glass sticky top-0 z-40 border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Brand size="sm" />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button size="sm" asChild>
              <Link href="/login">
                Giriş Yap
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto flex max-w-6xl flex-wrap items-center gap-9 px-4 pb-8 pt-10 sm:pb-12 sm:pt-16">
        <div className="min-w-[min(100%,340px)] flex-1 basis-[380px]">
          <span
            className="animate-fade-up inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-sm font-semibold text-muted-foreground shadow-sm"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_0_4px_var(--glow)]" />
            Öğrenci ve veli rehberi
          </span>
          <h1
            className="animate-fade-up mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl"
            style={{ animationDelay: "80ms" }}
          >
            Paneli{" "}
            <span className="gradient-text animate-gradient">adım adım</span>{" "}
            öğren
          </h1>
          <p
            className="animate-fade-up mt-4 max-w-md text-base leading-relaxed text-muted-foreground"
            style={{ animationDelay: "160ms" }}
          >
            Aşağıdaki bölümleri sırayla aç; her birinde ne işe yaradığını, kısa
            videosunu ve tek tek yapılacak adımları göreceksin.
          </p>
          <div
            className="animate-fade-up mt-7 flex flex-col gap-2"
            style={{ animationDelay: "240ms" }}
          >
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Kim için görüntüle
            </span>
            <div className="inline-flex w-fit gap-1 rounded-full border bg-secondary p-1">
              {(
                [
                  { value: "ogrenci" as const, label: "Öğrenci", icon: BookOpen },
                  { value: "veli" as const, label: "Veli", icon: Users },
                ]
              ).map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRole(value)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all",
                    role === value
                      ? "gradient-surface text-white shadow-md shadow-primary/25"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Süzülen özet kartları */}
        <div
          className="animate-fade-up relative h-[280px] min-w-[min(100%,300px)] flex-1 basis-[300px]"
          style={{ animationDelay: "300ms" }}
        >
          {SUMMARY_CARDS.map(({ icon: Icon, label }, i) => (
            <div
              key={label}
              className="hover-lift glass absolute flex items-center gap-3 rounded-2xl border px-4 py-3.5 shadow-lg shadow-primary/10"
              style={{
                top: `${8 + i * 96}px`,
                left: i === 1 ? "48px" : i === 2 ? "16px" : "8px",
                right: i === 0 ? "44px" : i === 1 ? "4px" : "36px",
                animation: `float ${5 + i * 0.6}s ease-in-out infinite`,
                animationDelay: `-${i * 1.8}s`,
              }}
            >
              <span className="gradient-surface flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px] text-white">
                <Icon className="h-4 w-4" />
              </span>
              <span className="text-sm font-semibold">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Hızlı başlangıç */}
      <section className="mx-auto max-w-6xl px-4 pb-6 pt-1.5 sm:pb-8">
        <div className="grid gap-3.5 sm:grid-cols-3">
          {QUICK_START.map((step, i) => (
            <Reveal key={step.title} delay={i * 90}>
              <div className="hover-lift flex h-full items-start gap-3 rounded-2xl border bg-card p-[18px] shadow-sm">
                <span className="gradient-surface flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white">
                  <step.icon className="h-5 w-5" />
                </span>
                <span>
                  <span className="mb-0.5 block text-[14.5px] font-semibold">
                    {step.title}
                  </span>
                  <span className="block text-[13px] leading-relaxed text-muted-foreground">
                    {step.description}
                  </span>
                </span>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Bölümler (akordeon) */}
      <section className="mx-auto max-w-6xl px-4 pb-3 pt-4">
        <Reveal className="mx-auto mb-6 max-w-xl text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Bölümleri <span className="gradient-text">keşfet</span>
          </h2>
          <p className="mt-2.5 text-[15px] text-muted-foreground">
            Bir bölümü aç; açıklamasını oku, videosunu izle, adımları uygula.
          </p>
        </Reveal>
        <div className="overflow-hidden rounded-[20px] border bg-card">
          {FEATURES.map((feature, i) => {
            const open = i === openIndex;
            return (
              <Reveal
                key={feature.title}
                delay={i * 70}
                className="border-b last:border-b-0"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(open ? -1 : i)}
                  className="flex w-full items-center gap-3.5 px-4 py-5 text-left transition-colors hover:bg-accent/60 sm:px-5"
                >
                  <span
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-base font-bold text-white transition-all duration-300",
                      open
                        ? "gradient-surface scale-105 shadow-md shadow-primary/25"
                        : "gradient-surface",
                    )}
                  >
                    {i + 1}
                  </span>
                  <span className="flex shrink-0 text-primary">
                    <feature.icon className="h-[22px] w-[22px]" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[16.5px] font-semibold tracking-tight">
                      {feature.title}
                    </span>
                    <span className="mt-0.5 block text-[13px] leading-relaxed text-muted-foreground">
                      {feature.desc}
                    </span>
                  </span>
                  <ChevronDown
                    className={cn(
                      "h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-300",
                      open && "rotate-180 text-primary",
                    )}
                  />
                </button>

                {open && (
                  <div className="animate-fade-up flex flex-wrap gap-5 px-4 pb-6 sm:px-5">
                    <ol className="flex flex-1 basis-[300px] flex-col gap-3">
                      {feature.steps[role].map((text, j) => (
                        <li key={j} className="flex items-start gap-2.5">
                          <span className="gradient-surface mt-0.5 flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full text-xs font-bold text-white">
                            {j + 1}
                          </span>
                          <span className="text-sm leading-relaxed">{text}</span>
                        </li>
                      ))}
                    </ol>

                    <div className="flex-1 basis-[300px]">
                      <div className="relative aspect-video overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[oklch(0.28_0.06_260)] to-[oklch(0.16_0.03_250)]">
                        <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                          <Play className="h-2.5 w-2.5 fill-current" />
                          Nasıl kullanılır
                        </span>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="animate-ping-soft absolute h-14 w-14 rounded-full bg-primary/50" />
                          <span className="gradient-surface relative flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg shadow-primary/40">
                            <Play className="h-5 w-5 fill-current" />
                          </span>
                        </div>
                        <div className="absolute inset-x-3.5 bottom-3.5 h-1 rounded-full bg-white/20">
                          <div className="h-full w-[34%] rounded-full bg-white" />
                        </div>
                      </div>
                      <p className="mt-2 px-0.5 text-xs text-muted-foreground">
                        Kısa videoyla adım adım — buraya ekran kaydını ekle.
                      </p>
                    </div>
                  </div>
                )}
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* Giriş bölümü */}
      <section className="mx-auto max-w-6xl px-4 pb-14 pt-7 sm:pb-16">
        <Reveal>
          <div className="gradient-surface animate-gradient relative overflow-hidden rounded-3xl px-6 py-11 text-center text-white shadow-2xl shadow-primary/30 sm:px-10">
            <div className="pointer-events-none absolute -left-8 -top-10 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-12 -right-5 h-52 w-52 rounded-full bg-white/10 blur-2xl" />
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Kullanmaya başlamak için giriş yap
            </h2>
            <p className="mx-auto mt-3 max-w-md text-[15px] text-white/85">
              Öğretmeninden aldığın kullanıcı adı ve şifreyle oturum aç. Şifreni
              unutursan yenisini yine öğretmenin oluşturur.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
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
                Telefon, tablet ve bilgisayardan kullanılır
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Footer */}
      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3.5 px-4 py-[22px] text-center sm:flex-row sm:text-left">
          <Brand size="sm" />
          <p className="text-xs text-muted-foreground">
            Öğrenci ve veli için kullanım rehberi.
          </p>
        </div>
      </footer>
    </div>
  );
}
