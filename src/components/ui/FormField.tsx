import React from "react";
import { cn } from "@/lib/utils";
import { IonIcon } from "./IonIcon";

export interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  required?: boolean;
  leftIcon?: string;
  rightIcon?: string;
  onRightIconClick?: () => void;
  containerClassName?: string;
}

export const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(
  (
    {
      label,
      helperText,
      error,
      required,
      leftIcon,
      rightIcon,
      onRightIconClick,
      containerClassName,
      className,
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className={cn("flex flex-col gap-1.5 w-full", containerClassName)}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-semibold uppercase tracking-wider text-[#1A1A1A] flex items-center justify-between"
          >
            <span>
              {label}
              {required && <span className="text-[#F43F5E] ml-1">*</span>}
            </span>
          </label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 text-[#9CA3AF] pointer-events-none flex items-center">
              <IonIcon name={leftIcon} size={18} />
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            className={cn(
              "w-full h-11 px-3.5 bg-white text-[#1A1A1A] placeholder:text-[#9CA3AF] text-sm rounded-xl border transition-all duration-150",
              "focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5]",
              leftIcon ? "pl-10" : "pl-3.5",
              rightIcon ? "pr-10" : "pr-3.5",
              error
                ? "border-[#F43F5E] focus:ring-[#F43F5E]/20 focus:border-[#F43F5E]"
                : "border-[#E5E7EB] hover:border-[#D1D5DB]",
              disabled && "bg-[#F8F9FA] text-[#9CA3AF] cursor-not-allowed",
              className
            )}
            {...props}
          />

          {rightIcon && (
            <button
              type="button"
              onClick={onRightIconClick}
              disabled={disabled || !onRightIconClick}
              className={cn(
                "absolute right-3.5 text-[#9CA3AF] hover:text-[#1A1A1A] flex items-center transition-colors",
                !onRightIconClick && "pointer-events-none"
              )}
            >
              <IonIcon name={rightIcon} size={18} />
            </button>
          )}
        </div>

        {error ? (
          <p className="text-xs text-[#F43F5E] flex items-center gap-1 mt-0.5">
            <IonIcon name="alert-circle-outline" size={13} className="shrink-0" />
            <span>{error}</span>
          </p>
        ) : helperText ? (
          <p className="text-xs text-[#6B7280] mt-0.5">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

FormField.displayName = "FormField";
