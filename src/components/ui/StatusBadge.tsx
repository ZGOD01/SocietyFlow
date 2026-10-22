import React from "react";
import { cn } from "@/lib/utils";
import { IonIcon, IonIconName } from "./IonIcon";

export type BadgeVariant =
  | "success"
  | "warning"
  | "error"
  | "info"
  | "neutral"
  | "hero"
  | "gradient";

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  variant?: BadgeVariant;
  iconName?: IonIconName | string;
  size?: "sm" | "md";
  dot?: boolean;
  pulse?: boolean;
  className?: string;
}

const badgeVariants: Record<BadgeVariant, { container: string; dot: string; icon: string }> = {
  success: {
    container: "bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs",
    dot: "bg-emerald-500",
    icon: "text-emerald-600",
  },
  warning: {
    container: "bg-amber-50 text-amber-700 border border-amber-200/80 shadow-2xs",
    dot: "bg-amber-500",
    icon: "text-amber-600",
  },
  error: {
    container: "bg-rose-50 text-rose-700 border border-rose-200/80 shadow-2xs",
    dot: "bg-rose-500",
    icon: "text-rose-600",
  },
  info: {
    container: "bg-sky-50 text-sky-700 border border-sky-200/80 shadow-2xs",
    dot: "bg-sky-500",
    icon: "text-sky-600",
  },
  neutral: {
    container: "bg-slate-100/80 text-slate-700 border border-slate-200/90 shadow-2xs",
    dot: "bg-slate-400",
    icon: "text-slate-600",
  },
  hero: {
    container: "bg-indigo-50/90 text-indigo-700 border border-indigo-200/90 shadow-[0_1px_3px_rgba(99,102,241,0.12)]",
    dot: "bg-indigo-600",
    icon: "text-indigo-600",
  },
  gradient: {
    container: "bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 text-indigo-700 border border-indigo-200/60 shadow-2xs",
    dot: "bg-indigo-600",
    icon: "text-indigo-600",
  },
};

export function StatusBadge({
  children,
  variant = "neutral",
  iconName,
  size = "md",
  dot = false,
  pulse = false,
  className,
  ...props
}: StatusBadgeProps) {
  const styles = badgeVariants[variant] || badgeVariants.neutral;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-semibold transition-all select-none backdrop-blur-xs tracking-tight",
        size === "sm" ? "px-2.5 py-0.5 text-[11px]" : "px-3 py-1 text-xs",
        styles.container,
        className
      )}
      {...props}
    >
      {dot && (
        <span className="relative flex h-2 w-2 items-center justify-center">
          {pulse && (
            <span
              className={cn(
                "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                styles.dot
              )}
            />
          )}
          <span
            className={cn("relative inline-flex rounded-full h-1.5 w-1.5", styles.dot)}
            aria-hidden="true"
          />
        </span>
      )}
      {iconName && (
        <IonIcon
          name={iconName}
          size={size === "sm" ? 12 : 14}
          className={cn("shrink-0", styles.icon)}
          aria-hidden="true"
        />
      )}
      <span>{children}</span>
    </span>
  );
}
