"use client";

import React from "react";
import { motion, HTMLMotionProps } from "motion/react";
import { cn } from "@/lib/utils";
import { IonIcon, IonIconName } from "./IonIcon";

export type ButtonVariant =
  | "primary"
  | "hero"
  | "gradient"
  | "glow"
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
    "bg-slate-900 text-white hover:bg-slate-800 active:bg-slate-950 border border-slate-800 shadow-[0_2px_8px_rgba(15,23,42,0.12)]",
  hero: "bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800 border border-indigo-500/30 shadow-[0_4px_16px_rgba(79,70,229,0.3)]",
  gradient:
    "bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 text-white hover:opacity-95 shadow-[0_4px_20px_rgba(99,102,241,0.35)] border border-indigo-400/20",
  glow: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-[0_0_24px_rgba(99,102,241,0.45)] border border-indigo-400/40",
  secondary:
    "bg-indigo-50 text-indigo-600 hover:bg-indigo-100/80 active:bg-indigo-200/70 border border-indigo-100",
  outline:
    "bg-white/80 backdrop-blur-sm text-slate-800 hover:bg-slate-50 active:bg-slate-100 border border-slate-200/90 hover:border-slate-300 shadow-[0_1px_2px_rgba(0,0,0,0.04)]",
  ghost:
    "bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 active:bg-slate-200/60",
  danger:
    "bg-rose-50 text-rose-600 hover:bg-rose-100/80 active:bg-rose-200/70 border border-rose-200/60",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-9 px-3.5 text-xs gap-1.5 font-semibold",
  md: "h-11 px-5 text-sm gap-2 font-semibold",
  lg: "h-12 px-6 text-base gap-2.5 font-bold tracking-tight",
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
        whileHover={!disabled && !isLoading ? { scale: 1.015, y: -0.5 } : undefined}
        whileTap={!disabled && !isLoading ? { scale: 0.975 } : undefined}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex items-center justify-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none relative overflow-hidden group",
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
            className="shrink-0 transition-transform duration-200 group-hover:-translate-x-0.5"
            size={size === "sm" ? 14 : size === "md" ? 16 : 18}
          />
        ) : null}

        {children && <span className="relative z-10">{children}</span>}

        {!isLoading && rightIcon && (
          <IonIcon
            name={rightIcon}
            className="shrink-0 transition-transform duration-200 group-hover:translate-x-0.5"
            size={size === "sm" ? 14 : size === "md" ? 16 : 18}
          />
        )}
      </motion.button>
    );
  }
);

AppButton.displayName = "AppButton";
