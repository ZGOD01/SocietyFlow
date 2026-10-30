"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { IonIcon } from "@/components/ui";

export interface WorkspaceItem {
  societyId: string;
  societyName: string;
  societyCode: string;
  role: string;
  status: "PENDING" | "VERIFIED" | "REJECTED" | "SUSPENDED";
}

export interface WorkspaceSwitcherProps {
  className?: string;
  compact?: boolean;
}

export function WorkspaceSwitcher({ className = "", compact = false }: WorkspaceSwitcherProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeSocietyId, setActiveSocietyId] = useState<string>("");
  const [activeRole, setActiveRole] = useState<string>("");
  const [verifiedWorkspaces, setVerifiedWorkspaces] = useState<WorkspaceItem[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          const memberships: WorkspaceItem[] = data.user.memberships || [];
          // Strict requirement: Switch Society must only allow verified society memberships
          const verified = memberships.filter((m) => m.status === "VERIFIED");
          setVerifiedWorkspaces(verified);

          const curSocietyId = data.user.activeSocietyId || verified[0]?.societyId || "";
          const curRole = data.user.activeRole || verified[0]?.role || "OWNER";
          setActiveSocietyId(curSocietyId);
          setActiveRole(curRole);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentWorkspace =
    verifiedWorkspaces.find((w) => w.societyId === activeSocietyId) ||
    verifiedWorkspaces[0] || {
      societyId: activeSocietyId || "default",
      societyName: loading ? "Loading Society..." : "Society Workspace",
      societyCode: "ACTIVE",
      role: activeRole || "MEMBER",
      status: "VERIFIED" as const,
    };


  const handleSwitch = async (item: WorkspaceItem) => {
    try {
      setIsOpen(false);
      const res = await fetch("/api/auth/switch-society", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ societyId: item.societyId, role: item.role }),
      });
      if (res.ok) {
        setActiveSocietyId(item.societyId);
        setActiveRole(item.role);
        router.refresh();
        window.location.reload();
      }
    } catch (err) {
      console.error("Failed to switch workspace", err);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "SECRETARY":
        return "Secretary";
      case "CHAIRMAN":
        return "Chairman";
      case "TREASURER":
        return "Treasurer";
      case "SOCIETY_MANAGER":
        return "Manager";
      case "TENANT":
        return "Tenant";
      case "PARTNER":
        return "Auditor";
      case "SUPER_ADMIN":
        return "Super Admin";
      default:
        return "Owner";
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {compact ? (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-10 h-10 rounded-xl bg-[#F8F9FA] hover:bg-[#EEF2FF] border border-[#E5E7EB] hover:border-[#C7D2FE] flex items-center justify-center text-[#1A1A1A] transition-colors cursor-pointer"
          title={`Switch Workspace: ${currentWorkspace.societyName}`}
          aria-label="Switch Workspace"
        >
          <IonIcon name="business-outline" size={18} className="text-[#4F46E5]" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full text-left p-2.5 rounded-xl bg-[#F8F9FA] hover:bg-[#F3F4F6] border border-[#E5E7EB] transition-all flex items-center justify-between group cursor-pointer"
        >
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center shrink-0 border border-[#C7D2FE]">
              <IonIcon name="business-outline" size={16} />
            </div>
            <div className="truncate">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-[#1A1A1A] truncate">
                  {currentWorkspace.societyName}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] shrink-0" title="Verified Society" />
              </div>
              <p className="text-[11px] text-[#6B7280] truncate">
                {currentWorkspace.societyCode} • {getRoleBadge(currentWorkspace.role)}
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
              Verified Workspaces
            </span>
            <span className="text-[10px] font-semibold text-[#4F46E5] bg-[#EEF2FF] px-2 py-0.5 rounded-full">
              {verifiedWorkspaces.length} Available
            </span>
          </div>

          <div className="space-y-1 pt-1 max-h-60 overflow-y-auto">
            {verifiedWorkspaces.length === 0 && !loading && (
              <div className="p-3 text-center text-xs text-[#6B7280]">
                No additional verified memberships.
              </div>
            )}

            {verifiedWorkspaces.map((ws) => {
              const isSelected =
                ws.societyId === currentWorkspace.societyId && ws.role === currentWorkspace.role;
              return (
                <button
                  key={`${ws.societyId}-${ws.role}`}
                  type="button"
                  onClick={() => handleSwitch(ws)}
                  className={`w-full text-left p-2.5 rounded-lg text-xs transition-colors flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? "bg-[#EEF2FF] text-[#4F46E5] font-semibold"
                      : "hover:bg-[#F8F9FA] text-[#1A1A1A]"
                  }`}
                >
                  <div className="truncate pr-2">
                    <p className="font-bold truncate">{ws.societyName}</p>
                    <p className="text-[11px] text-[#6B7280] truncate mt-0.5">
                      {ws.societyCode} • {getRoleBadge(ws.role)}
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
                      {getRoleBadge(ws.role)}
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
            <span>Link another unit or society?</span>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                router.push("/register");
              }}
              className="text-[#4F46E5] font-bold hover:underline cursor-pointer"
            >
              + Register Unit
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
