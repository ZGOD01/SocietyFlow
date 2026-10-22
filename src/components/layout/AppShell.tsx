"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { APP_NAV_ITEMS } from "@/config/navigation";
import { UserRole } from "@/types";
import {
  IonIcon,
  IconContainer,
  AppButton,
} from "@/components/ui";
import { cn } from "@/lib/utils";

export interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeRole, setActiveRole] = useState<UserRole>("SOCIETY_ADMIN");

  // Filter nav items based on currently active preview role
  const visibleNavItems = APP_NAV_ITEMS.filter((item) =>
    item.allowedRoles.includes(activeRole)
  );

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col md:flex-row text-[#1A1A1A]">
      {/* Mobile Top Header */}
      <header className="md:hidden sticky top-0 z-40 bg-white border-b border-[#E5E7EB] px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#4F46E5] text-white flex items-center justify-center font-bold text-lg font-heading shadow-sm">
            S
          </div>
          <span className="font-extrabold text-lg tracking-tight font-heading">
            Society<span className="text-[#4F46E5]">Flow</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          {/* Role selector dropdown badge for prototype inspection */}
          <select
            value={activeRole}
            onChange={(e) => setActiveRole(e.target.value as UserRole)}
            className="text-xs font-semibold bg-[#EEF2FF] text-[#4F46E5] border border-[#C7D2FE] rounded-full px-2.5 py-1 outline-none"
            title="Switch Prototype Role"
          >
            <option value="SOCIETY_ADMIN">Admin View</option>
            <option value="RESIDENT_OWNER">Owner View</option>
            <option value="AUDITOR_PARTNER">Auditor View</option>
            <option value="SUPER_ADMIN">SuperAdmin</option>
          </select>

          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-[#1A1A1A] hover:bg-[#F8F9FA] rounded-xl border border-[#E5E7EB]"
            aria-label="Toggle navigation menu"
          >
            <IonIcon name={isMobileMenuOpen ? "close-outline" : "menu-outline"} size={22} />
          </button>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden fixed inset-x-0 top-[57px] bg-white border-b border-[#E5E7EB] shadow-lg z-30 p-4 space-y-1"
          >
            <div className="pb-3 mb-2 border-b border-[#F1F3F5] px-2 flex items-center justify-between text-xs text-[#6B7280]">
              <span>Greenwood Residency (Wing A-E)</span>
              <span className="bg-[#ECFDF5] text-[#10B981] px-2 py-0.5 rounded-full font-medium">
                Verified
              </span>
            </div>

            {visibleNavItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors",
                    isActive
                      ? "bg-[#EEF2FF] text-[#4F46E5] font-semibold"
                      : "text-[#6B7280] hover:text-[#1A1A1A] hover:bg-[#F8F9FA]"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <IonIcon
                      name={item.iconName}
                      size={20}
                      className={isActive ? "text-[#4F46E5]" : "text-[#9CA3AF]"}
                    />
                    <span>{item.title}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F3F4F6] text-[#6B7280]">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}

            <div className="pt-3 mt-2 border-t border-[#F1F3F5] flex items-center gap-2">
              <Link href="/login" className="w-full">
                <AppButton variant="outline" size="sm" className="w-full">
                  Sign In
                </AppButton>
              </Link>
              <Link href="/register" className="w-full">
                <AppButton variant="hero" size="sm" className="w-full">
                  Register
                </AppButton>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Collapsible Sidebar */}
      <aside
        className={cn(
          "hidden md:flex flex-col bg-white border-r border-[#E5E7EB] transition-all duration-200 sticky top-0 h-screen select-none z-30",
          isCollapsed ? "w-20" : "w-64"
        )}
      >
        {/* Logo and Collapse Toggle */}
        <div className="p-4 border-b border-[#F1F3F5] flex items-center justify-between gap-2 h-16">
          {!isCollapsed && (
            <Link href="/" className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-xl bg-[#4F46E5] text-white flex items-center justify-center font-bold text-lg font-heading shadow-sm shrink-0">
                S
              </div>
              <span className="font-extrabold text-lg tracking-tight font-heading truncate">
                Society<span className="text-[#4F46E5]">Flow</span>
              </span>
            </Link>
          )}

          {isCollapsed && (
            <Link href="/" className="mx-auto">
              <div className="w-8 h-8 rounded-xl bg-[#4F46E5] text-white flex items-center justify-center font-bold text-lg font-heading shadow-sm">
                S
              </div>
            </Link>
          )}

          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg text-[#9CA3AF] hover:text-[#1A1A1A] hover:bg-[#F8F9FA] transition-colors"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label="Toggle sidebar width"
          >
            <IonIcon
              name={isCollapsed ? "chevron-forward-outline" : "chevron-back-outline"}
              size={18}
            />
          </button>
        </div>

        {/* Tenant / Society Badge */}
        {!isCollapsed && (
          <div className="px-4 py-3 mx-3 my-2 bg-[#F8F9FA] rounded-xl border border-[#E5E7EB] flex items-center justify-between">
            <div className="overflow-hidden">
              <p className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">
                Society
              </p>
              <p className="text-xs font-semibold text-[#1A1A1A] truncate">
                Greenwood Residency
              </p>
            </div>
            <span className="w-2 h-2 rounded-full bg-[#10B981] shrink-0" title="Active Tenant" />
          </div>
        )}

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
          {visibleNavItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                  isActive
                    ? "bg-[#EEF2FF] text-[#4F46E5] font-semibold shadow-[0_1px_2px_rgba(79,70,229,0.06)]"
                    : "text-[#6B7280] hover:text-[#1A1A1A] hover:bg-[#F8F9FA]",
                  isCollapsed && "justify-center px-0"
                )}
                title={isCollapsed ? item.title : undefined}
              >
                <IonIcon
                  name={item.iconName}
                  size={20}
                  className={cn(
                    "shrink-0 transition-colors",
                    isActive ? "text-[#4F46E5]" : "text-[#9CA3AF] group-hover:text-[#1A1A1A]"
                  )}
                />
                {!isCollapsed && (
                  <span className="truncate flex-1">{item.title}</span>
                )}
                {!isCollapsed && item.badge && (
                  <span
                    className={cn(
                      "text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0",
                      isActive
                        ? "bg-[#4F46E5] text-white"
                        : "bg-[#F3F4F6] text-[#6B7280]"
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Role Switcher Sandbox for prototype inspection */}
        {!isCollapsed && (
          <div className="p-3 mx-3 mb-3 bg-[#EEF2FF]/60 rounded-xl border border-[#C7D2FE]/60">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold text-[#4F46E5] uppercase tracking-wider">
                Role Sandbox
              </span>
              <span className="text-[10px] text-[#6B7280]">Preview</span>
            </div>
            <select
              value={activeRole}
              onChange={(e) => setActiveRole(e.target.value as UserRole)}
              className="w-full text-xs font-semibold bg-white text-[#1A1A1A] border border-[#C7D2FE] rounded-lg px-2 py-1.5 outline-none cursor-pointer"
            >
              <option value="SOCIETY_ADMIN">Society Admin</option>
              <option value="RESIDENT_OWNER">Resident / Flat Owner</option>
              <option value="AUDITOR_PARTNER">Auditor / Legal Partner</option>
              <option value="SUPER_ADMIN">Platform Super Admin</option>
            </select>
          </div>
        )}

        {/* User Footer Profile */}
        <div className="p-3 border-t border-[#F1F3F5] flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-full bg-[#1A1A1A] text-white flex items-center justify-center font-bold text-xs shrink-0">
              {activeRole === "SOCIETY_ADMIN"
                ? "SA"
                : activeRole === "RESIDENT_OWNER"
                ? "RO"
                : activeRole === "AUDITOR_PARTNER"
                ? "AP"
                : "AD"}
            </div>
            {!isCollapsed && (
              <div className="truncate">
                <p className="text-xs font-bold text-[#1A1A1A] truncate">
                  {activeRole === "SOCIETY_ADMIN"
                    ? "R. K. Sharma (Sec)"
                    : activeRole === "RESIDENT_OWNER"
                    ? "Priya Mehta (Flat 402)"
                    : activeRole === "AUDITOR_PARTNER"
                    ? "V. & Associates CA"
                    : "Dev Super Admin"}
                </p>
                <p className="text-[11px] text-[#9CA3AF] capitalize">
                  {activeRole.toLowerCase().replace(/_/g, " ")}
                </p>
              </div>
            )}
          </div>

          {!isCollapsed && (
            <Link
              href="/login"
              className="p-1.5 text-[#9CA3AF] hover:text-[#F43F5E] rounded-lg hover:bg-[#FFF1F2] transition-colors"
              title="Logout"
            >
              <IonIcon name="log-out-outline" size={18} />
            </Link>
          )}
        </div>
      </aside>

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Desktop Top Header Bar */}
        <header className="hidden md:flex h-16 bg-white border-b border-[#E5E7EB] px-8 items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3 text-sm text-[#6B7280]">
            <span className="font-semibold text-[#1A1A1A]">SocietyFlow Console</span>
            <span>/</span>
            <span className="capitalize">
              {pathname === "/" ? "Home" : pathname.replace("/", "").replace(/-/g, " ")}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs font-medium bg-[#F8F9FA] px-3 py-1.5 rounded-full border border-[#E5E7EB]">
              <span className="w-2 h-2 rounded-full bg-[#10B981]" />
              <span>Multi-Tenant Node: Mumbai-North</span>
            </div>

            <IconContainer
              name="notifications-outline"
              variant="neutral"
              size="sm"
              className="hover:border-[#4F46E5] hover:text-[#4F46E5] cursor-pointer"
            />

            <Link href="/documents">
              <AppButton variant="hero" size="sm" pill leftIcon="cloud-upload-outline">
                Quick Vault
              </AppButton>
            </Link>
          </div>
        </header>

        {/* Page Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
