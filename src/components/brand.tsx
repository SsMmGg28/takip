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
    sm: { box: "h-7 w-7", icon: "h-4 w-4", text: "text-sm" },
    md: { box: "h-9 w-9", icon: "h-5 w-5", text: "text-base" },
    lg: { box: "h-12 w-12", icon: "h-6 w-6", text: "text-lg" },
  }[size];

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div
        className={cn(
          "flex items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm",
          dimensions.box,
        )}
      >
        <GraduationCap className={dimensions.icon} />
      </div>
      <div className="leading-tight">
        <p className={cn("font-semibold tracking-tight", dimensions.text)}>
          Özel Ders Takip
        </p>
        {size !== "sm" && (
          <p className="text-xs text-muted-foreground">Öğrenci yönetim sistemi</p>
        )}
      </div>
    </div>
  );
}
