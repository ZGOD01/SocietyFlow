import React from "react";
import { cn } from "@/lib/utils";
import { IonIcon } from "./IonIcon";

export interface SearchFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value?: string;
  onClear?: () => void;
  pill?: boolean;
  shortcut?: string;
  containerClassName?: string;
}

export const SearchField = React.forwardRef<HTMLInputElement, SearchFieldProps>(
  (
    {
      value,
      onChange,
      onClear,
      placeholder = "Search documents, units, bylaws...",
      pill = true,
      shortcut = "⌘K",
      containerClassName,
      className,
      ...props
    },
    ref
  ) => {
    return (
      <div className={cn("relative flex items-center w-full max-w-md", containerClassName)}>
        <div className="absolute left-3.5 text-[#9CA3AF] pointer-events-none flex items-center">
          <IonIcon name="search-outline" size={17} />
        </div>

        <input
          ref={ref}
          type="search"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={cn(
            "w-full h-10 pl-10 pr-12 text-sm bg-white text-[#1A1A1A] placeholder:text-[#9CA3AF] border border-[#E5E7EB] hover:border-[#D1D5DB] transition-all duration-150",
            "focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5]",
            pill ? "rounded-full" : "rounded-xl",
            className
          )}
          {...props}
        />

        <div className="absolute right-3 flex items-center gap-1.5">
          {value && onClear ? (
            <button
              type="button"
              onClick={onClear}
              className="text-[#9CA3AF] hover:text-[#1A1A1A] transition-colors p-1"
              aria-label="Clear search"
            >
              <IonIcon name="close-outline" size={16} />
            </button>
          ) : shortcut ? (
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-medium text-[#9CA3AF] bg-[#F8F9FA] border border-[#E5E7EB] rounded-md pointer-events-none">
              {shortcut}
            </kbd>
          ) : null}
        </div>
      </div>
    );
  }
);

SearchField.displayName = "SearchField";
