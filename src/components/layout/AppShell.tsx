"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { APP_NAV_ITEMS } from "@/config/navigation";
import { UserRole } from "@/types";
import {
  IonIcon,
  IconContainer,
  AppButton,
} from "@/components/ui";
import { WorkspaceSwitcher } from "@/components/common/WorkspaceSwitcher";
import { cn } from "@/lib/utils";

export interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeRole, setActiveRole] = useState<UserRole>("SOCIETY_ADMIN");
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const visibleNavItems = APP_NAV_ITEMS.filter((item) =>
    item.allowedRoles.includes(activeRole)
  );

  const roleMeta = {
    SOCIETY_ADMIN: {
      name: "R. K. Sharma",
      roleLabel: "Hon. Secretary",
      society: "Greenwood Residency CHS Ltd.",
      unit: "Managing Committee",
      avatar: "RS",
    },
    RESIDENT_OWNER: {
      name: "Priya Mehta",
      roleLabel: "Flat Owner",
      society: "Greenwood Residency CHS Ltd.",
      unit: "Wing C • Flat 402",
      avatar: "PM",
    },
    TENANT: {
      name: "Rahul Joshi",
      roleLabel: "Tenant Resident",
      society: "Greenwood Residency CHS Ltd.",
      unit: "Wing B • Flat 201",
      avatar: "RJ",
    },
    AUDITOR_PARTNER: {
      name: "V. & Associates CA",
      roleLabel: "Statutory Auditor",
      society: "Pune District Panel",
      unit: "Audit Desk",
      avatar: "VA",
    },
    SUPER_ADMIN: {
      name: "Platform Architect",
      roleLabel: "Platform Super Admin",
      society: "SocietyFlow Cloud Multi-Tenant",
      unit: "Cluster Root",
      avatar: "SA",
    },
  }[activeRole];

  return (
    <div className="min-h-screen bg-slate-50/70 flex flex-col md:flex-row text-slate-900 relative">
      {/* Mobile Top Header */}
      <header className="md:hidden sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-200/80 px-4 py-3 flex items-center justify-between shadow-2xs">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center font-bold text-lg font-heading shadow-xs">
            S
          </div>
          <span className="font-extrabold text-lg tracking-tight font-heading text-slate-900">
            Society<span className="text-indigo-600">Flow</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          {/* Quick Role preview selector */}
          <select
            value={activeRole}
            onChange={(e) => setActiveRole(e.target.value as UserRole)}
            className="text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full px-2.5 py-1 outline-none"
            title="Switch Prototype Role"
          >
            <option value="SOCIETY_ADMIN">Management</option>
            <option value="RESIDENT_OWNER">Owner View</option>
            <option value="TENANT">Tenant View</option>
            <option value="AUDITOR_PARTNER">Auditor View</option>
            <option value="SUPER_ADMIN">Super Admin</option>
          </select>

          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-slate-700 hover:bg-slate-100 rounded-xl border border-slate-200 active:scale-95 transition-all"
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
            className="md:hidden fixed inset-x-0 top-[57px] bg-white/95 backdrop-blur-2xl border-b border-slate-200 shadow-2xl z-30 p-4 space-y-3 max-h-[calc(100vh-60px)] overflow-y-auto"
          >
            {/* Workspace Switcher in Mobile Drawer */}
            <div className="pb-1">
              <WorkspaceSwitcher />
            </div>

            <div className="py-2.5 border-y border-slate-100 flex items-center justify-between text-xs">
              <Link
                href="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-1.5 text-indigo-600 font-semibold hover:underline"
              >
                <IonIcon name="home-outline" size={14} />
                <span>Visit Landing Page</span>
              </Link>
              <Link
                href="/dashboard"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-slate-500 hover:text-slate-800 font-medium"
              >
                Console Home
              </Link>
            </div>

            <nav className="space-y-1">
              {visibleNavItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all",
                      isActive
                        ? "bg-indigo-50 text-indigo-700 font-bold border border-indigo-100 shadow-2xs"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <IonIcon
                        name={item.iconName}
                        size={19}
                        className={isActive ? "text-indigo-600" : "text-slate-400"}
                      />
                      <span>{item.title}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200/60">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-inner">
                  {roleMeta.avatar}
                </div>
                <div className="text-xs">
                  <p className="font-bold text-slate-900">{roleMeta.name}</p>
                  <p className="text-[10px] text-slate-500">{roleMeta.roleLabel}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  alert("[Auth Notice] Real session termination connects with Auth.js in Prompt 2.");
                  router.push("/login");
                }}
                className="text-xs text-rose-600 hover:underline font-semibold cursor-pointer"
              >
                Log Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Collapsible Sidebar */}
      <aside
        className={cn(
          "hidden md:flex flex-col bg-white border-r border-slate-200/90 transition-all duration-300 sticky top-0 h-screen select-none z-30 shadow-[0_2px_12px_rgba(15,23,42,0.02)]",
          isCollapsed ? "w-20" : "w-64"
        )}
      >
        {/* Logo and Collapse Toggle */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-2 h-16">
          {!isCollapsed && (
            <Link href="/" className="flex items-center gap-2.5 overflow-hidden group">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center font-bold text-lg font-heading shadow-xs shrink-0 transition-transform group-hover:scale-105">
                S
              </div>
              <span className="font-extrabold text-lg tracking-tight font-heading truncate text-slate-900">
                Society<span className="text-indigo-600">Flow</span>
              </span>
            </Link>
          )}

          {isCollapsed && (
            <Link href="/" className="mx-auto" title="SocietyFlow Home">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center font-bold text-lg font-heading shadow-xs">
                S
              </div>
            </Link>
          )}

          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label="Toggle sidebar width"
          >
            <IonIcon
              name={isCollapsed ? "chevron-forward-outline" : "chevron-back-outline"}
              size={18}
            />
          </button>
        </div>

        {/* Tenant / Workspace Switcher Control */}
        {!isCollapsed && (
          <div className="px-3 pt-3">
            <WorkspaceSwitcher />
          </div>
        )}

        {isCollapsed && (
          <div className="py-2.5 flex justify-center">
            <WorkspaceSwitcher compact />
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
                  "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 relative",
                  isActive
                    ? "bg-indigo-50/90 text-indigo-700 font-bold border border-indigo-200/60 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50",
                  isCollapsed && "justify-center px-0"
                )}
                title={isCollapsed ? item.title : undefined}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-indigo-600 rounded-r-full" />
                )}
                <IonIcon
                  name={item.iconName}
                  size={19}
                  className={cn(
                    "shrink-0 transition-colors",
                    isActive ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-700"
                  )}
                />
                {!isCollapsed && (
                  <span className="truncate flex-1">{item.title}</span>
                )}
                {!isCollapsed && item.badge && (
                  <span
                    className={cn(
                      "text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 border",
                      isActive
                        ? "bg-indigo-600 text-white border-indigo-500"
                        : "bg-slate-100 text-slate-500 border-slate-200"
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
          <div className="p-3 mx-3 mb-2 bg-indigo-50/60 rounded-2xl border border-indigo-100 backdrop-blur-xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">
                Role Sandbox
              </span>
              <span className="text-[10px] text-slate-500 font-medium">Live Preview</span>
            </div>
            <select
              value={activeRole}
              onChange={(e) => setActiveRole(e.target.value as UserRole)}
              className="w-full text-xs font-semibold bg-white text-slate-800 border border-indigo-200 rounded-lg px-2 py-1.5 outline-none cursor-pointer shadow-2xs"
            >
              <option value="SOCIETY_ADMIN">Society Management</option>
              <option value="RESIDENT_OWNER">Property Owner</option>
              <option value="TENANT">Tenant Resident</option>
              <option value="AUDITOR_PARTNER">Auditor Partner</option>
              <option value="SUPER_ADMIN">Platform Super Admin</option>
            </select>
          </div>
        )}

        {/* Return to Public Website shortcut */}
        {!isCollapsed && (
          <div className="px-3 pb-2">
            <Link
              href="/"
              className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/70 rounded-xl transition-colors border border-transparent hover:border-indigo-100"
            >
              <IonIcon name="home-outline" size={16} />
              <span>Visit Landing Page</span>
            </Link>
          </div>
        )}

        {/* User Footer Profile */}
        <div className="p-3 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-inner">
              {roleMeta.avatar}
            </div>
            {!isCollapsed && (
              <div className="truncate">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {roleMeta.name}
                </p>
                <p className="text-[11px] text-slate-400 capitalize truncate">
                  {roleMeta.roleLabel}
                </p>
              </div>
            )}
          </div>

          {!isCollapsed && (
            <button
              type="button"
              onClick={() => {
                alert("[Auth Notice] Session termination connects with Auth.js in Prompt 2.");
                router.push("/login");
              }}
              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
              title="Logout (Auth placeholder)"
              aria-label="Logout"
            >
              <IonIcon name="log-out-outline" size={18} />
            </button>
          )}
        </div>
      </aside>

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Desktop Top Header Bar */}
        <header className="hidden md:flex h-16 bg-white/90 backdrop-blur-xl border-b border-slate-200/80 px-8 items-center justify-between sticky top-0 z-20 shadow-2xs">
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <Link href="/dashboard" className="font-semibold text-slate-800 hover:text-indigo-600 transition-colors">
              SocietyFlow Console
            </Link>
            <span>/</span>
            <span className="capitalize font-semibold text-slate-900">
              {pathname === "/" ? "Home" : pathname.replace("/", "").replace(/-/g, " ")}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Return to Landing Page Button */}
            <Link href="/">
              <AppButton variant="ghost" size="sm" leftIcon="home-outline">
                Visit Website
              </AppButton>
            </Link>

            <div className="flex items-center gap-2 text-xs font-semibold bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200 text-slate-700 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Node: Mumbai-North</span>
            </div>

            <IconContainer
              name="notifications-outline"
              variant="neutral"
              size="sm"
              className="hover:border-indigo-400 hover:text-indigo-600 cursor-pointer shadow-2xs"
            />

            {/* Profile Popover */}
            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 p-1 pl-2.5 rounded-full border border-slate-200 hover:border-indigo-300 transition-all bg-white shadow-2xs cursor-pointer"
                aria-label="User Profile"
              >
                <span className="text-xs font-bold text-slate-800">{roleMeta.name}</span>
                <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[11px] shadow-inner">
                  {roleMeta.avatar}
                </div>
                <IonIcon name="chevron-down-outline" size={14} className="text-slate-400 pr-1" />
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white/95 backdrop-blur-xl rounded-2xl border border-slate-200 shadow-[0_20px_40px_-10px_rgba(15,23,42,0.12)] z-50 p-2 space-y-1">
                  <div className="p-3 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-900 truncate">{roleMeta.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{roleMeta.unit}</p>
                    <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {roleMeta.roleLabel}
                    </span>
                  </div>

                  <Link
                    href="/dashboard"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
                  >
                    <IonIcon name="grid-outline" size={16} className="text-indigo-600" />
                    <span>Overview Dashboard</span>
                  </Link>

                  <Link
                    href="/"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
                  >
                    <IonIcon name="home-outline" size={16} className="text-slate-400" />
                    <span>Visit Public Website</span>
                  </Link>

                  <Link
                    href="/settings"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
                  >
                    <IonIcon name="settings-outline" size={16} className="text-slate-400" />
                    <span>Profile & Security</span>
                  </Link>

                  <div className="pt-1 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setProfileOpen(false);
                        alert("[Auth Notice] Session termination connects with Auth.js in Prompt 2.");
                        router.push("/login");
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors text-left cursor-pointer"
                    >
                      <IonIcon name="log-out-outline" size={16} />
                      <span>Log Out (Placeholder)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
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
