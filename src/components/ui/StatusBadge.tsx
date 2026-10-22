import React from "react";
import { cn } from "@/lib/utils";
import { IonIcon, IonIconName } from "./IonIcon";

export type BadgeVariant =
  | "success"
  | "warning"
  | "error"
  | "info"
  | "neutral"
  | "hero";

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  variant?: BadgeVariant;
  iconName?: IonIconName | string;
  size?: "sm" | "md";
  dot?: boolean;
  className?: string;
}

const badgeVariants: Record<BadgeVariant, { container: string; dot: string; icon: string }> = {
  success: {
    container: "bg-[#ECFDF5] text-[#10B981] border border-[#A7F3D0]",
    dot: "bg-[#10B981]",
    icon: "text-[#10B981]",
  },
  warning: {
    container: "bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]",
    dot: "bg-[#F59E0B]",
    icon: "text-[#D97706]",
  },
  error: {
    container: "bg-[#FFF1F2] text-[#E11D48] border border-[#FECDD3]",
    dot: "bg-[#F43F5E]",
    icon: "text-[#E11D48]",
  },
  info: {
    container: "bg-[#F0F9FF] text-[#0284C7] border border-[#BAE6FD]",
    dot: "bg-[#0EA5E9]",
    icon: "text-[#0284C7]",
  },
  neutral: {
    container: "bg-[#F8F9FA] text-[#6B7280] border border-[#E5E7EB]",
    dot: "bg-[#9CA3AF]",
    icon: "text-[#6B7280]",
  },
  hero: {
    container: "bg-[#EEF2FF] text-[#4F46E5] border border-[#C7D2FE]",
    dot: "bg-[#4F46E5]",
    icon: "text-[#4F46E5]",
  },
};

export function StatusBadge({
  children,
  variant = "neutral",
  iconName,
  size = "md",
  dot = false,
  className,
  ...props
}: StatusBadgeProps) {
  const styles = badgeVariants[variant];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium transition-colors select-none",
        size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-xs",
        styles.container,
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn("w-1.5 h-1.5 rounded-full shrink-0", styles.dot)}
          aria-hidden="true"
        />
      )}
      {iconName && (
        <IonIcon
          name={iconName}
          size={size === "sm" ? 13 : 14}
          className={cn("shrink-0", styles.icon)}
          aria-hidden="true"
        />
      )}
      <span>{children}</span>
    </span>
  );
}
