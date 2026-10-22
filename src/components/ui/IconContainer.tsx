import React from "react";
import { cn } from "@/lib/utils";
import { IonIcon, IonIconName } from "./IonIcon";

export type IconContainerVariant =
  | "hero"
  | "hero-soft"
  | "neutral"
  | "success"
  | "warning"
  | "error"
  | "info";

export type IconContainerSize = "sm" | "md" | "lg" | "xl";

export interface IconContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  name: IonIconName | string;
  variant?: IconContainerVariant;
  size?: IconContainerSize;
  iconSize?: number;
  className?: string;
}

const variantStyles: Record<IconContainerVariant, string> = {
  hero: "bg-[#4F46E5] text-white",
  "hero-soft": "bg-[#EEF2FF] text-[#4F46E5] border border-[#C7D2FE]",
  neutral: "bg-[#F8F9FA] text-[#1A1A1A] border border-[#E5E7EB]",
  success: "bg-[#ECFDF5] text-[#10B981] border border-[#A7F3D0]",
  warning: "bg-[#FFFBEB] text-[#F59E0B] border border-[#FDE68A]",
  error: "bg-[#FFF1F2] text-[#F43F5E] border border-[#FECDD3]",
  info: "bg-[#F0F9FF] text-[#0EA5E9] border border-[#BAE6FD]",
};

const sizeStyles: Record<IconContainerSize, { container: string; defaultIcon: number }> = {
  sm: { container: "w-8 h-8 rounded-lg", defaultIcon: 16 },
  md: { container: "w-10 h-10 rounded-xl", defaultIcon: 20 },
  lg: { container: "w-12 h-12 rounded-xl", defaultIcon: 24 },
  xl: { container: "w-14 h-14 rounded-2xl", defaultIcon: 28 },
};

export function IconContainer({
  name,
  variant = "hero-soft",
  size = "md",
  iconSize,
  className,
  ...props
}: IconContainerProps) {
  const sizeConfig = sizeStyles[size];
  const finalIconSize = iconSize ?? sizeConfig.defaultIcon;

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center shrink-0 transition-colors",
        sizeConfig.container,
        variantStyles[variant],
        className
      )}
      {...props}
    >
      <IonIcon name={name} size={finalIconSize} />
    </div>
  );
}
