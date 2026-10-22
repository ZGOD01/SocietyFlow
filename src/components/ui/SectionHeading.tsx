import React from "react";
import { cn } from "@/lib/utils";

export interface SectionHeadingProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  action?: React.ReactNode;
  align?: "left" | "center";
}

export function SectionHeading({
  title,
  subtitle,
  eyebrow,
  action,
  align = "left",
  className,
  ...props
}: SectionHeadingProps) {
  const isCentered = align === "center";

  return (
    <div
      className={cn(
        "flex flex-col gap-1 w-full",
        isCentered ? "items-center text-center" : "sm:flex-row sm:items-end sm:justify-between",
        className
      )}
      {...props}
    >
      <div className={cn("flex flex-col gap-1.5", isCentered && "items-center")}>
        {eyebrow && (
          <span className="text-xs font-semibold tracking-wider uppercase text-[#4F46E5] bg-[#EEF2FF] px-2.5 py-0.5 rounded-full w-fit">
            {eyebrow}
          </span>
        )}
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1A1A1A]">
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm sm:text-base text-[#6B7280] max-w-2xl">
            {subtitle}
          </p>
        )}
      </div>

      {action && <div className="mt-4 sm:mt-0 shrink-0">{action}</div>}
    </div>
  );
}
