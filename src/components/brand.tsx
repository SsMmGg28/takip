import { GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

export function Brand({
  size = "md",
  className,
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const dimensions = {
    sm: { box: "h-8 w-8 rounded-lg", icon: "h-4 w-4", text: "text-sm" },
    md: { box: "h-10 w-10 rounded-xl", icon: "h-5 w-5", text: "text-base" },
    lg: { box: "h-14 w-14 rounded-2xl", icon: "h-7 w-7", text: "text-xl" },
  }[size];

  return (
    <div className={cn("group flex items-center gap-2.5", className)}>
      <div
        className={cn(
          "gradient-surface relative flex items-center justify-center text-white shadow-lg shadow-primary/25 transition-transform duration-300 group-hover:scale-105 group-hover:rotate-3",
          dimensions.box,
        )}
      >
        <GraduationCap className={dimensions.icon} />
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
