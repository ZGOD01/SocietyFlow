"use client";

import React from "react";
import { motion, HTMLMotionProps } from "motion/react";
import { cn } from "@/lib/utils";
import { IonIcon, IonIconName } from "./IonIcon";

export type ButtonVariant =
  | "primary"
  | "hero"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger";

export type ButtonSize = "sm" | "md" | "lg";

export interface AppButtonProps
  extends Omit<HTMLMotionProps<"button">, "children"> {
  children?: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  pill?: boolean;
  leftIcon?: IonIconName | string;
  rightIcon?: IonIconName | string;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-[#1A1A1A] text-white hover:bg-[#2A2A2A] active:bg-[#111111] border border-transparent shadow-[0_1px_2px_rgba(0,0,0,0.06)]",
  hero: "bg-[#4F46E5] text-white hover:bg-[#4338CA] active:bg-[#3730A3] border border-transparent shadow-[0_1px_2px_rgba(79,70,229,0.2)]",
  secondary:
    "bg-[#EEF2FF] text-[#4F46E5] hover:bg-[#E0E7FF] active:bg-[#C7D2FE] border border-[#C7D2FE]",
  outline:
    "bg-white text-[#1A1A1A] hover:bg-[#F8F9FA] active:bg-[#F1F3F5] border border-[#E5E7EB] hover:border-[#D1D5DB]",
  ghost:
    "bg-transparent text-[#6B7280] hover:text-[#1A1A1A] hover:bg-[#F8F9FA] active:bg-[#E5E7EB]",
  danger:
    "bg-[#FFF1F2] text-[#F43F5E] hover:bg-[#FFE4E6] active:bg-[#FECDD3] border border-[#FECDD3]",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-9 px-3.5 text-xs gap-1.5 font-medium",
  md: "h-11 px-5 text-sm gap-2 font-medium",
  lg: "h-12 px-6 text-base gap-2.5 font-medium",
};

export const AppButton = React.forwardRef<HTMLButtonElement, AppButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      pill = true,
      leftIcon,
      rightIcon,
      isLoading = false,
      disabled = false,
      className,
      ...props
    },
    ref
  ) => {
    return (
      <motion.button
        ref={ref}
        whileHover={!disabled && !isLoading ? { scale: 1.01 } : undefined}
        whileTap={!disabled && !isLoading ? { scale: 0.98 } : undefined}
        transition={{ duration: 0.12, ease: "easeInOut" }}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5] focus-visible:ring-offset-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none",
          pill ? "rounded-full" : "rounded-xl",
          sizeStyles[size],
          variantStyles[variant],
          className
        )}
        {...props}
      >
        {isLoading ? (
          <IonIcon
            name="refresh-outline"
            className="animate-spin text-current shrink-0"
            size={size === "sm" ? 14 : size === "md" ? 16 : 18}
          />
        ) : leftIcon ? (
          <IonIcon
            name={leftIcon}
            className="shrink-0"
            size={size === "sm" ? 14 : size === "md" ? 16 : 18}
          />
        ) : null}

        {children && <span>{children}</span>}

        {!isLoading && rightIcon && (
          <IonIcon
            name={rightIcon}
            className="shrink-0"
            size={size === "sm" ? 14 : size === "md" ? 16 : 18}
          />
        )}
      </motion.button>
    );
  }
);

AppButton.displayName = "AppButton";
