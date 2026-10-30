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
      <div className={cn("flex flex-col gap-2.5", isCentered && "items-center")}>
        {eyebrow && (
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[10px] sm:text-xs font-bold tracking-wider uppercase bg-slate-950 text-white border border-slate-800 shadow-2xs w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>{eyebrow}</span>
          </span>
        )}
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-tight text-slate-950 font-heading leading-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs sm:text-sm md:text-base text-slate-600 max-w-2xl font-normal leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>

      {action && <div className="mt-4 sm:mt-0 shrink-0">{action}</div>}
    </div>
  );
}
