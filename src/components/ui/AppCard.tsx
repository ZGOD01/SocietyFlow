"use client";

import React from "react";
import { motion, HTMLMotionProps } from "motion/react";
import { cn } from "@/lib/utils";

export interface AppCardProps extends HTMLMotionProps<"div"> {
  variant?: "white" | "surface" | "outlined" | "interactive" | "glass" | "glow";
  radius?: "card" | "lg" | "xl" | "2xl";
  className?: string;
  children?: React.ReactNode;
}

export function AppCard({
  variant = "white",
  radius = "card",
  className,
  children,
  ...props
}: AppCardProps) {
  const isInteractive = variant === "interactive" || variant === "glow";

  const baseStyles =
    "transition-all duration-300 text-slate-900 relative";

  const radiusStyles = {
    card: "rounded-[16px]",
    lg: "rounded-xl",
    xl: "rounded-2xl",
    "2xl": "rounded-3xl",
  }[radius];

  const variantStyles = {
    white:
      "bg-white border border-slate-200/80 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.04),0_1px_2px_rgba(15,23,42,0.02)]",
    surface:
      "bg-slate-50/70 border border-slate-200/80 shadow-xs",
    outlined:
      "bg-white border border-slate-200",
    interactive:
      "bg-white border border-slate-200/80 hover:border-indigo-400/50 hover:shadow-[0_16px_36px_-4px_rgba(99,102,241,0.12),0_4px_12px_rgba(15,23,42,0.04)] cursor-pointer",
    glass:
      "bg-white/80 backdrop-blur-xl border border-slate-200/80 shadow-[0_8px_32px_-4px_rgba(15,23,42,0.05)]",
    glow:
      "bg-white/90 backdrop-blur-xl border border-indigo-200/60 shadow-[0_8px_32px_-4px_rgba(99,102,241,0.15)] hover:border-indigo-400/80 hover:shadow-[0_16px_48px_-8px_rgba(99,102,241,0.25)] cursor-pointer",
  }[variant];

  return (
    <motion.div
      whileHover={isInteractive ? { y: -3 } : undefined}
      transition={{ type: "spring", stiffness: 350, damping: 24 }}
      className={cn(baseStyles, radiusStyles, variantStyles, className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function AppCardHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "p-6 pb-4 flex items-start justify-between gap-4 border-b border-slate-100",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function AppCardBody({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("p-6", className)} {...props}>
      {children}
    </div>
  );
}

export function AppCardFooter({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "p-5 pt-3 bg-slate-50/60 rounded-b-[16px] border-t border-slate-100 flex items-center justify-between",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
