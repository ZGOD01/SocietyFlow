import React from "react";
import { cn } from "@/lib/utils";
import { IonIcon } from "./IonIcon";

export interface LoadingStateProps extends React.HTMLAttributes<HTMLDivElement> {
  message?: string;
  size?: "sm" | "md" | "lg";
}

export function LoadingState({
  message = "Loading records...",
  size = "md",
  className,
  ...props
}: LoadingStateProps) {
  const iconSize = size === "sm" ? 20 : size === "md" ? 28 : 36;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 sm:p-12 text-center",
        className
      )}
      {...props}
    >
      <IonIcon
        name="refresh-outline"
        size={iconSize}
        className="animate-spin text-[#4F46E5] mb-3"
      />
      <p className="text-xs font-medium text-[#6B7280] tracking-wide uppercase">
        {message}
      </p>
    </div>
  );
}

export function SkeletonBox({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse bg-[#F3F4F6] rounded-xl",
        className
      )}
      {...props}
    />
  );
}
