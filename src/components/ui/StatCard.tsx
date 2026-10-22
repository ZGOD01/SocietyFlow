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
    <AppCard className={cn("p-5 flex flex-col justify-between gap-3", className)}>
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
          {label}
        </span>
        <IconContainer name={iconName} variant={iconVariant} size="sm" />
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <span className="text-2xl sm:text-3xl font-extrabold text-[#1A1A1A] tracking-tight font-heading">
          {value}
        </span>
        {badgeText && (
          <StatusBadge variant={badgeVariant} size="sm">
            {badgeText}
          </StatusBadge>
        )}
      </div>

      {(subtitle || trend) && (
        <div className="flex items-center gap-2 text-xs text-[#6B7280]">
          {trend && (
            <span
              className={cn(
                "font-semibold",
                trend.positive ? "text-[#10B981]" : "text-[#F43F5E]"
              )}
            >
              {trend.positive ? "↑" : "↓"} {trend.value}
            </span>
          )}
          {subtitle && <span>{subtitle}</span>}
        </div>
      )}
    </AppCard>
  );
}
