"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { IonIcon } from "@/components/ui";

export interface WorkspaceItem {
  id: string;
  name: string;
  code: string;
  unit?: string;
  role: string;
  roleBadge: string;
  isVerified: boolean;
}

const DEMO_WORKSPACES: WorkspaceItem[] = [
  {
    id: "soc-greenwood",
    name: "Greenwood Residency CHS Ltd.",
    code: "MH-PNA-14902-2019",
    unit: "Wing C • Flat 402",
    role: "Property Owner",
    roleBadge: "Owner",
    isVerified: true,
  },
  {
    id: "soc-greenwood-mgmt",
    name: "Greenwood Residency CHS Ltd.",
    code: "MH-PNA-14902-2019",
    unit: "Managing Committee",
    role: "Hon. Secretary",
    roleBadge: "Secretary",
    isVerified: true,
  },
  {
    id: "soc-silveroak",
    name: "Silver Oak Heights CHS",
    code: "MH-PNA-28311-2021",
    unit: "Wing B • Flat 201",
    role: "Tenant",
    roleBadge: "Tenant",
    isVerified: true,
  },
];

export interface WorkspaceSwitcherProps {
  className?: string;
  compact?: boolean;
}

export function WorkspaceSwitcher({ className = "", compact = false }: WorkspaceSwitcherProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceItem>(DEMO_WORKSPACES[0]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {compact ? (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-10 h-10 rounded-xl bg-[#F8F9FA] hover:bg-[#EEF2FF] border border-[#E5E7EB] hover:border-[#C7D2FE] flex items-center justify-center text-[#1A1A1A] transition-colors"
          title={`Switch Workspace: ${activeWorkspace.name}`}
          aria-label="Switch Workspace"
        >
          <IonIcon name="business-outline" size={18} className="text-[#4F46E5]" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full text-left p-2.5 rounded-xl bg-[#F8F9FA] hover:bg-[#F3F4F6] border border-[#E5E7EB] transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center shrink-0 border border-[#C7D2FE]">
              <IonIcon name="business-outline" size={16} />
            </div>
            <div className="truncate">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-[#1A1A1A] truncate">
                  {activeWorkspace.name}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] shrink-0" />
              </div>
              <p className="text-[11px] text-[#6B7280] truncate">
                {activeWorkspace.unit || activeWorkspace.role}
              </p>
            </div>
          </div>
          <IonIcon
            name={isOpen ? "chevron-down-outline" : "chevron-forward-outline"}
            size={14}
            className="text-[#9CA3AF] group-hover:text-[#1A1A1A] shrink-0 ml-1 transition-transform"
          />
        </button>
      )}

      {isOpen && (
        <div className="absolute left-0 right-0 sm:right-auto sm:w-80 top-full mt-2 bg-white rounded-xl border border-[#E5E7EB] shadow-[0_10px_25px_-5px_rgba(0,0,0,0.08)] z-50 p-2 space-y-1">
          <div className="px-3 py-2 border-b border-[#F1F3F5] flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">
              Switch Workspace / Role
            </span>
            <span className="text-[10px] font-semibold text-[#4F46E5] bg-[#EEF2FF] px-2 py-0.5 rounded-full">
              Multi-Tenant Context
            </span>
          </div>

          <div className="space-y-1 pt-1 max-h-60 overflow-y-auto">
            {DEMO_WORKSPACES.map((ws) => {
              const isSelected = ws.id === activeWorkspace.id && ws.role === activeWorkspace.role;
              return (
                <button
                  key={`${ws.id}-${ws.role}`}
                  type="button"
                  onClick={() => {
                    setActiveWorkspace(ws);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left p-2.5 rounded-lg text-xs transition-colors flex items-center justify-between ${
                    isSelected
                      ? "bg-[#EEF2FF] text-[#4F46E5] font-semibold"
                      : "hover:bg-[#F8F9FA] text-[#1A1A1A]"
                  }`}
                >
                  <div className="truncate pr-2">
                    <p className="font-bold truncate">{ws.name}</p>
                    <p className="text-[11px] text-[#6B7280] truncate mt-0.5">
                      {ws.unit} • {ws.role}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isSelected
                          ? "bg-[#4F46E5] text-white"
                          : "bg-[#F3F4F6] text-[#6B7280]"
                      }`}
                    >
                      {ws.roleBadge}
                    </span>
                    {isSelected && (
                      <IonIcon name="checkmark" size={14} className="text-[#4F46E5]" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-[#F1F3F5] px-2 py-1.5 flex items-center justify-between text-[11px] text-[#6B7280]">
            <span>Need to link another unit or society?</span>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                router.push("/register");
              }}
              className="text-[#4F46E5] font-bold hover:underline"
            >
              + Add Society
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
