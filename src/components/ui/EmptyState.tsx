import React from "react";
import { cn } from "@/lib/utils";
import { IconContainer } from "./IconContainer";

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  iconName?: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({
  iconName = "albums-outline",
  title,
  description,
  action,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-[14px] border border-dashed border-[#E5E7EB] bg-[#F8F9FA]/60",
        className
      )}
      {...props}
    >
      <IconContainer
        name={iconName}
        variant="neutral"
        size="lg"
        className="mb-4 bg-white"
      />
      <h3 className="text-base font-semibold text-[#1A1A1A] mb-1">
        {title}
      </h3>
      <p className="text-sm text-[#6B7280] max-w-sm mb-6">
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
}
