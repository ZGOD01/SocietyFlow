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
            className="text-xs font-semibold text-slate-700 flex items-center justify-between"
          >
            <span>
              {label}
              {required && <span className="text-rose-500 ml-1">*</span>}
            </span>
          </label>
        )}

        <div className="relative flex items-center group">
          {leftIcon && (
            <div className="absolute left-3.5 text-slate-400 group-focus-within:text-indigo-600 pointer-events-none flex items-center transition-colors">
              <IonIcon name={leftIcon} size={18} />
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            className={cn(
              "w-full h-11 px-3.5 bg-white/80 backdrop-blur-xs text-slate-900 placeholder:text-slate-400 text-sm rounded-xl border transition-all duration-200 shadow-2xs",
              "focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white",
              leftIcon ? "pl-10" : "pl-3.5",
              rightIcon ? "pr-10" : "pr-3.5",
              error
                ? "border-rose-400 bg-rose-50/20 focus:ring-rose-500/20 focus:border-rose-500"
                : "border-slate-200/90 hover:border-slate-300",
              disabled && "bg-slate-50 text-slate-400 cursor-not-allowed",
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
                "absolute right-3.5 text-slate-400 hover:text-slate-700 flex items-center transition-colors cursor-pointer",
                !onRightIconClick && "pointer-events-none"
              )}
            >
              <IonIcon name={rightIcon} size={18} />
            </button>
          )}
        </div>

        {error ? (
          <p className="text-xs text-rose-500 flex items-center gap-1 mt-0.5 font-medium">
            <IonIcon name="alert-circle-outline" size={13} className="shrink-0" />
            <span>{error}</span>
          </p>
        ) : helperText ? (
          <p className="text-xs text-slate-500 mt-0.5">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

FormField.displayName = "FormField";
