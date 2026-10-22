"use client";

import React from "react";
import { motion, HTMLMotionProps } from "motion/react";
import { cn } from "@/lib/utils";

export interface AppCardProps extends HTMLMotionProps<"div"> {
  variant?: "white" | "surface" | "outlined" | "interactive";
  radius?: "card" | "lg" | "xl";
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
  const isInteractive = variant === "interactive";

  const baseStyles =
    "border transition-all duration-200 text-[#1A1A1A]";

  const radiusStyles = {
    card: "rounded-[14px]",
    lg: "rounded-xl",
    xl: "rounded-2xl",
  }[radius];

  const variantStyles = {
    white: "bg-white border-[#E5E7EB] shadow-[0_1px_3px_0_rgba(0,0,0,0.05),0_1px_2px_-1px_rgba(0,0,0,0.05)]",
    surface: "bg-[#F8F9FA] border-[#E5E7EB]",
    outlined: "bg-white border-[#E5E7EB]",
    interactive:
      "bg-white border-[#E5E7EB] hover:border-[#D1D5DB] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] cursor-pointer",
  }[variant];

  return (
    <motion.div
      whileHover={isInteractive ? { y: -2 } : undefined}
      transition={{ duration: 0.18, ease: "easeOut" }}
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
        "p-5 pb-3 flex items-start justify-between gap-4 border-b border-[#F1F3F5]",
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
    <div className={cn("p-5", className)} {...props}>
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
        "p-5 pt-3 bg-[#FBFBFC] rounded-b-[14px] border-t border-[#F1F3F5] flex items-center justify-between",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
