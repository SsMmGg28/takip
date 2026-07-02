import Image from "next/image";
import { cn } from "@/lib/utils";

export function Brand({
  size = "md",
  className,
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const dimensions = {
    sm: { box: 32, text: "text-sm" },
    md: { box: 40, text: "text-base" },
    lg: { box: 56, text: "text-xl" },
  }[size];

  return (
    <div className={cn("group flex items-center gap-2.5", className)}>
      <div
        className="relative shrink-0 transition-transform duration-300 group-hover:scale-105 group-hover:rotate-3"
        style={{ width: dimensions.box, height: dimensions.box }}
      >
        <Image
          src="/logo-light.png"
          alt="Ders Takip logosu"
          fill
          sizes={`${dimensions.box}px`}
          className="object-contain dark:hidden"
          priority
        />
        <Image
          src="/logo-dark.png"
          alt="Ders Takip logosu"
          fill
          sizes={`${dimensions.box}px`}
          className="hidden object-contain dark:block"
          priority
        />
      </div>
      <div className="leading-tight">
        <p className={cn("font-bold tracking-tight", dimensions.text)}>
          Ders <span className="gradient-text">Takip</span>
        </p>
        {size !== "sm" && (
          <p className="text-xs text-muted-foreground">Öğrenci yönetim sistemi</p>
        )}
      </div>
    </div>
  );
}
