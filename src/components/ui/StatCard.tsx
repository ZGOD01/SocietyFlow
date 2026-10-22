import React from "react";
import { AppCard } from "./AppCard";
import { IconContainer, IconContainerVariant } from "./IconContainer";
import { StatusBadge } from "./StatusBadge";
import { IonIconName } from "./IonIcon";
import { cn } from "@/lib/utils";

export interface StatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  iconName: IonIconName | string;
  iconVariant?: IconContainerVariant;
  trend?: {
    value: string;
    positive?: boolean;
  };
  badgeText?: string;
  badgeVariant?: "success" | "warning" | "error" | "info" | "neutral" | "hero";
  className?: string;
}

export function StatCard({
  label,
  value,
  subtitle,
  iconName,
  iconVariant = "hero-soft",
  trend,
  badgeText,
  badgeVariant = "success",
  className,
}: StatCardProps) {
  return (
    <AppCard
      variant="interactive"
      className={cn(
        "p-6 flex flex-col justify-between gap-4 bg-white/90 backdrop-blur-md border border-slate-200/80 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.03)] hover:border-indigo-300/60 hover:shadow-[0_12px_32px_-4px_rgba(99,102,241,0.1)] transition-all",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          {label}
        </span>
        <IconContainer
          name={iconName}
          variant={iconVariant}
          size="sm"
          className="shadow-xs transition-transform duration-200 group-hover:scale-105"
        />
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-heading">
          {value}
        </span>
        {badgeText && (
          <StatusBadge variant={badgeVariant} size="sm">
            {badgeText}
          </StatusBadge>
        )}
      </div>

      {(subtitle || trend) && (
        <div className="flex items-center gap-2 text-xs text-slate-500 pt-2 border-t border-slate-100/80">
          {trend && (
            <span
              className={cn(
                "font-semibold flex items-center gap-0.5",
                trend.positive ? "text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md" : "text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-md"
              )}
            >
              <span>{trend.positive ? "↑" : "↓"}</span> {trend.value}
            </span>
          )}
          {subtitle && <span className="truncate">{subtitle}</span>}
        </div>
      )}
    </AppCard>
  );
}
