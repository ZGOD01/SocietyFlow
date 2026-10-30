"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { APP_NAV_ITEMS } from "@/config/navigation";
import { UserRole, NavItem } from "@/types";
import {
  IonIcon,
  AppButton,
  Modal,
} from "@/components/ui";
import { WorkspaceSwitcher } from "@/components/common/WorkspaceSwitcher";
import { cn } from "@/lib/utils";

export interface AppShellProps {
  children: React.ReactNode;
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  actionUrl?: string;
  type?: string;
  category?: string;
}

const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-1",
    title: "Annual General Meeting (AGM) Notice",
    message: "Statutory AGM scheduled for next Sunday at 10:30 AM in Society Clubhouse.",
    time: "2 hours ago",
    read: false,
  },
  {
    id: "notif-2",
    title: "Digital Vault Ready",
    message: "Secure document storage is available for your unit records.",
    time: "1 day ago",
    read: false,
  },
  {
    id: "notif-3",
    title: "Water Tank Maintenance Completed",
    message: "Borewell and overhead reservoir cleaning completed for all wings.",
    time: "3 days ago",
    read: true,
  },
];

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(DEFAULT_NOTIFICATIONS);
  const [activeRole, setActiveRole] = useState<UserRole>("RESIDENT_OWNER");

  const [liveUser, setLiveUser] = useState<{
    id: string;
    name: string;
    email: string;
    activeRole?: string;
    activeSocietyId?: string;
    isSuperAdmin?: boolean;
    isPartner?: boolean;
    memberships?: { role: string; societyName: string; status: string }[];
  } | null>(null);

  const profileRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Session Expiration & Idle Timeout State
  const [sessionTimeoutWarning, setSessionTimeoutWarning] = useState(false);
  const [remainingCountdown, setRemainingCountdown] = useState<number>(60);
  const sessionExpiresAtRef = useRef<number | null>(null);
  const lastActiveRef = useRef<number | null>(null);
  const isRefreshingSessionRef = useRef<boolean>(false);

  const handleSessionExpired = async () => {
    try {
      try {
        localStorage.setItem("societyflow_logout", String(Date.now()));
      } catch {}
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {
      console.error("[AppShell] Auto-logout error:", e);
    } finally {
      window.location.href = "/login?reason=session_expired";
    }
  };

  const extendSession = async () => {
    try {
      isRefreshingSessionRef.current = true;
      // Immediately hide warning modal and optimistically extend countdown
      setSessionTimeoutWarning(false);
      setRemainingCountdown(1800);
      sessionExpiresAtRef.current = Date.now() + 1800 * 1000;
      lastActiveRef.current = Date.now();
      try {
        localStorage.setItem("societyflow_last_activity", String(Date.now()));
      } catch {}

      const res = await fetch("/api/auth/session", { method: "POST" });
      const data = await res.json();
      if (data.authenticated && data.sessionExpiry) {
        sessionExpiresAtRef.current = data.sessionExpiry.expiresAt;
        setRemainingCountdown(data.sessionExpiry.remainingSeconds || 1800);
      } else {
        handleSessionExpired();
      }
    } catch {
      // ignore
    } finally {
      isRefreshingSessionRef.current = false;
    }
  };

  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          setLiveUser(data.user);
          if (data.sessionExpiry?.expiresAt) {
            sessionExpiresAtRef.current = data.sessionExpiry.expiresAt;
          } else {
            // Default statutory fallback
            sessionExpiresAtRef.current = Date.now() + 1800 * 1000;
          }

          if (data.user.isSuperAdmin) {
            setActiveRole("SUPER_ADMIN");
          } else if (data.user.isPartner) {
            setActiveRole("AUDITOR_PARTNER");
          } else if (
            data.user.activeRole &&
            ["SECRETARY", "CHAIRMAN", "TREASURER", "SOCIETY_MANAGER"].includes(data.user.activeRole)
          ) {
            setActiveRole("SOCIETY_ADMIN");
          } else if (data.user.activeRole === "TENANT") {
            setActiveRole("TENANT");
          } else {
            setActiveRole("RESIDENT_OWNER");
          }

          // Function to fetch real in-app notifications
          const loadNotifications = () => {
            fetch("/api/notifications?limit=8")
              .then((r) => r.json())
              .then((nData) => {
                if (nData.success && Array.isArray(nData.notifications)) {
                  setNotifications(
                    nData.notifications.map((n: any) => ({
                      id: n.id,
                      title: n.title,
                      message: n.message,
                      time: new Date(n.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      }),
                      read: n.read,
                      actionUrl: n.actionUrl,
                      type: n.type,
                      category: n.category,
                    }))
                  );
                }
              })
              .catch(() => {});
          };

          loadNotifications();
          const interval = setInterval(loadNotifications, 30000);
          return () => clearInterval(interval);
        } else if (data.authenticated === false && data.reason === "expired") {
          window.location.href = "/login?reason=session_expired";
        }
      })
      .catch(() => {});
  }, []);

  // Monitor user activity and session expiration countdown
  useEffect(() => {
    const onUserActivity = () => {
      const now = Date.now();
      lastActiveRef.current = now;
      try {
        localStorage.setItem("societyflow_last_activity", String(now));
      } catch {}

      // If user is actively typing/working and expiry is within 10 minutes,
      // refresh session in background so they aren't interrupted while active
      if (
        sessionExpiresAtRef.current &&
        !sessionTimeoutWarning &&
        !isRefreshingSessionRef.current
      ) {
        const remaining = sessionExpiresAtRef.current - now;
        if (remaining > 0 && remaining < 10 * 60 * 1000) {
          extendSession();
        }
      }
    };

    const activityEvents = ["mousedown", "keydown", "scroll", "touchstart"];
    activityEvents.forEach((ev) =>
      window.addEventListener(ev, onUserActivity, { passive: true })
    );

    const onStorage = (e: StorageEvent) => {
      if (e.key === "societyflow_logout") {
        window.location.href = "/login?reason=session_expired";
      } else if (e.key === "societyflow_last_activity" && e.newValue) {
        lastActiveRef.current = parseInt(e.newValue, 10) || Date.now();
      }
    };
    window.addEventListener("storage", onStorage);

    // Check timer every second
    const timerInterval = setInterval(() => {
      if (!sessionExpiresAtRef.current) return;

      const now = Date.now();
      const diffMs = sessionExpiresAtRef.current - now;
      const diffSec = Math.floor(diffMs / 1000);

      if (diffSec <= 0) {
        // Time spent (passout) -> auto logout immediately
        clearInterval(timerInterval);
        handleSessionExpired();
        return;
      }

      if (diffSec <= 60) {
        // Under 60 seconds left -> show warning modal with countdown
        setRemainingCountdown(diffSec);
        setSessionTimeoutWarning(true);
      } else if (sessionTimeoutWarning) {
        setSessionTimeoutWarning(false);
      }
    }, 1000);

    return () => {
      activityEvents.forEach((ev) =>
        window.removeEventListener(ev, onUserActivity)
      );
      window.removeEventListener("storage", onStorage);
      clearInterval(timerInterval);
    };
  }, [sessionTimeoutWarning]);

  const handleLogout = async () => {
    try {
      try {
        localStorage.setItem("societyflow_logout", String(Date.now()));
      } catch {}
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {
      console.error("[AppShell] Logout error:", e);
    } finally {
      window.location.href = "/login?switch=true";
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isSuperAdminUser = Boolean(
    liveUser?.isSuperAdmin || activeRole === "SUPER_ADMIN" || pathname.startsWith("/admin")
  );

  // Strictly ONLY the 2 requested tabs for Super Admin sidebar: Society Profile & Requests
  const superAdminNavItems: NavItem[] = [
    {
      title: "Society Profile",
      href: "/admin/dashboard",
      iconName: "business-outline",
      allowedRoles: ["SUPER_ADMIN"],
      description: "Registered societies, locations, and wings",
    },
    {
      title: "Requests",
      href: "/admin/requests",
      iconName: "document-text-outline",
      allowedRoles: ["SUPER_ADMIN"],
      description: "All requests and approvals across registered societies",
    },
  ];

  const visibleNavItems: NavItem[] = isSuperAdminUser
    ? superAdminNavItems
    : APP_NAV_ITEMS.filter((item) => item.allowedRoles.includes(activeRole));

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const displayName = isSuperAdminUser
    ? (liveUser?.name || "Platform Super Admin")
    : (liveUser?.name || "Resident Member");

  const displayRoleLabel = isSuperAdminUser
    ? "Super Admin"
    : liveUser?.activeRole
    ? liveUser.activeRole.replace(/_/g, " ")
    : activeRole === "SOCIETY_ADMIN"
    ? "Society Management"
    : activeRole === "TENANT"
    ? "Tenant Resident"
    : activeRole === "AUDITOR_PARTNER"
    ? "Statutory Auditor"
    : "Property Owner";

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleNotificationClick = (item: NotificationItem) => {
    if (!item.read) {
      fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: item.id }),
      }).catch(() => {});
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, read: true } : n))
      );
    }
    setNotificationsOpen(false);
    if (item.actionUrl) {
      router.push(item.actionUrl);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col md:flex-row text-[#1A1A1A] relative font-sans">
      {/* Mobile Top Header */}
      <header className="md:hidden sticky top-0 z-40 bg-white border-b border-[#E5E7EB] px-4 py-3 flex items-center justify-between shadow-2xs">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#4F46E5] text-white flex items-center justify-center font-bold text-lg font-heading shadow-xs">
            S
          </div>
          <span className="font-extrabold text-lg tracking-tight font-heading text-[#1A1A1A]">
            Society<span className="text-[#4F46E5]">Flow</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          {/* Notifications Icon Button */}
          <button
            type="button"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="p-2 text-[#6B7280] hover:text-[#1A1A1A] rounded-xl border border-[#E5E7EB] relative cursor-pointer"
            aria-label="Notifications"
          >
            <IonIcon name="notifications-outline" size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#4F46E5]" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-[#1A1A1A] hover:bg-[#F3F4F6] rounded-xl border border-[#E5E7EB] active:scale-95 transition-all cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            <IonIcon name={isMobileMenuOpen ? "close-outline" : "menu-outline"} size={22} />
          </button>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="md:hidden fixed inset-x-0 top-14 z-30 bg-white border-b border-[#E5E7EB] shadow-lg p-4 space-y-3"
          >
            {/* Mobile Workspace Switcher - Only for regular members */}
            {!isSuperAdminUser && (
              <div className="pb-2 border-b border-[#E5E7EB]">
                <WorkspaceSwitcher />
              </div>
            )}

            <nav className="space-y-1 max-h-[60vh] overflow-y-auto">
              {visibleNavItems.map((item) => {
                const isActive = isSuperAdminUser
                  ? item.href === "/admin/dashboard"
                    ? pathname === "/admin/dashboard" ||
                      pathname === "/admin" ||
                      pathname.startsWith("/management") ||
                      pathname.startsWith("/onboarding")
                    : pathname.startsWith(item.href)
                  : pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all",
                      isActive
                        ? "bg-[#EEF2FF] text-[#4F46E5] font-bold border border-[#C7D2FE]"
                        : "text-[#6B7280] hover:text-[#1A1A1A] hover:bg-[#F8F9FA]"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <IonIcon
                        name={item.iconName}
                        size={19}
                        className={isActive ? "text-[#4F46E5]" : "text-[#9CA3AF]"}
                      />
                      <span>{item.title}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F3F4F6] text-[#6B7280] border border-[#E5E7EB]">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}

              <Link
                href="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-[#6B7280] hover:text-[#1A1A1A] hover:bg-[#F8F9FA]"
              >
                <IonIcon name="home-outline" size={19} className="text-[#9CA3AF]" />
                <span>Visit Landing Page</span>
              </Link>
            </nav>

            <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#1A1A1A] text-white flex items-center justify-center font-bold text-xs">
                  {getInitials(displayName)}
                </div>
                <div className="text-xs">
                  <p className="font-bold text-[#1A1A1A] truncate max-w-[160px]">{displayName}</p>
                  <p className="text-[10px] text-[#6B7280] capitalize">{displayRoleLabel}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleLogout();
                }}
                className="text-xs text-[#F43F5E] hover:underline font-semibold cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Collapsible Sidebar */}
      <aside
        className={cn(
          "hidden md:flex flex-col bg-white border-r border-[#E5E7EB] transition-all duration-300 sticky top-0 h-screen select-none z-30 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)]",
          isCollapsed ? "w-20" : "w-64"
        )}
      >
        {/* Logo and Collapse Toggle */}
        <div className="p-4 border-b border-[#E5E7EB] flex items-center justify-between gap-2 h-16">
          {!isCollapsed && (
            <Link href="/" className="flex items-center gap-2.5 overflow-hidden group">
              <div className="w-8 h-8 rounded-xl bg-[#4F46E5] text-white flex items-center justify-center font-bold text-lg font-heading shadow-xs shrink-0 transition-transform group-hover:scale-105">
                S
              </div>
              <span className="font-extrabold text-lg tracking-tight font-heading truncate text-[#1A1A1A]">
                Society<span className="text-[#4F46E5]">Flow</span>
              </span>
            </Link>
          )}

          {isCollapsed && (
            <Link href="/" className="mx-auto" title="SocietyFlow Home">
              <div className="w-8 h-8 rounded-xl bg-[#4F46E5] text-white flex items-center justify-center font-bold text-lg font-heading shadow-xs">
                S
              </div>
            </Link>
          )}

          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg text-[#9CA3AF] hover:text-[#1A1A1A] hover:bg-[#F3F4F6] transition-colors cursor-pointer"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label="Toggle sidebar width"
          >
            <IonIcon
              name={isCollapsed ? "chevron-forward-outline" : "chevron-back-outline"}
              size={18}
            />
          </button>
        </div>

        {/* Tenant / Workspace Switcher Control - Only for regular members */}
        {!isSuperAdminUser && !isCollapsed && (
          <div className="px-3 pt-3">
            <WorkspaceSwitcher />
          </div>
        )}

        {!isSuperAdminUser && isCollapsed && (
          <div className="py-2.5 flex justify-center">
            <WorkspaceSwitcher compact />
          </div>
        )}

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
          {visibleNavItems.map((item) => {
            const isActive = isSuperAdminUser
              ? item.href === "/admin/dashboard"
                ? pathname === "/admin/dashboard" ||
                  pathname === "/admin" ||
                  pathname.startsWith("/management") ||
                  pathname.startsWith("/onboarding")
                : pathname.startsWith(item.href)
              : pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 relative",
                  isActive
                    ? "bg-[#EEF2FF] text-[#4F46E5] font-bold border border-[#C7D2FE]"
                    : "text-[#6B7280] hover:text-[#1A1A1A] hover:bg-[#F8F9FA]",
                  isCollapsed && "justify-center px-0"
                )}
                title={isCollapsed ? item.title : undefined}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-[#4F46E5] rounded-r-full" />
                )}
                <IonIcon
                  name={item.iconName}
                  size={19}
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
                      "text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 border",
                      isActive
                        ? "bg-[#4F46E5] text-white border-[#4F46E5]"
                        : "bg-[#F3F4F6] text-[#6B7280] border-[#E5E7EB]"
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Footer Profile */}
        <div className={cn("p-3 border-t border-[#E5E7EB] flex items-center", isCollapsed ? "flex-col gap-2 justify-center" : "justify-between")}>
          <Link
            href="/profile"
            className="flex items-center gap-2.5 overflow-hidden group cursor-pointer flex-1"
            title="View Profile & Credentials"
          >
            <div className="w-9 h-9 rounded-full bg-[#1A1A1A] group-hover:bg-[#4F46E5] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-inner transition-colors" title={`${displayName} (${displayRoleLabel})`}>
              {getInitials(displayName)}
            </div>
            {!isCollapsed && (
              <div className="truncate text-left">
                <p className="text-xs font-bold text-[#1A1A1A] group-hover:text-[#4F46E5] transition-colors truncate">{displayName}</p>
                <p className="text-[11px] text-[#6B7280] capitalize truncate">{displayRoleLabel}</p>
              </div>
            )}
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="p-1.5 text-[#9CA3AF] hover:text-[#F43F5E] rounded-lg hover:bg-[#FFF1F2] transition-colors cursor-pointer shrink-0"
            title="Sign Out"
            aria-label="Logout"
          >
            <IonIcon name="log-out-outline" size={18} />
          </button>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Desktop Top Header Bar */}
        <header className="hidden md:flex h-16 bg-white border-b border-[#E5E7EB] px-8 items-center justify-between sticky top-0 z-20 shadow-xs">
          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-2 text-xs font-semibold text-[#6B7280]">
            <Link href="/" className="hover:text-[#4F46E5] transition-colors flex items-center gap-1">
              <IonIcon name="home-outline" size={14} />
              <span>SocietyFlow</span>
            </Link>
            <span className="text-[#9CA3AF]">/</span>
            <Link href="/dashboard" className="hover:text-[#4F46E5] transition-colors">
              Console
            </Link>
            <span className="text-[#9CA3AF]">/</span>
            <span className="capitalize font-bold text-[#1A1A1A]">
              {pathname === "/" ? "Home" : pathname.replace("/", "").replace(/-/g, " ")}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Notification Drawer Trigger */}
            <div className="relative" ref={notificationsRef}>
              <button
                type="button"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="w-9 h-9 rounded-xl border border-[#E5E7EB] hover:border-[#4F46E5] flex items-center justify-center text-[#6B7280] hover:text-[#4F46E5] bg-white transition-colors cursor-pointer relative"
                aria-label="Notifications"
                title="Notifications"
              >
                <IonIcon name="notifications-outline" size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#4F46E5] text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full min-w-4 text-center ring-2 ring-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 top-full mt-2 w-84 bg-white rounded-2xl border border-[#E5E7EB] shadow-[0_15px_30px_-5px_rgba(0,0,0,0.1)] z-50 p-3 space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB]">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#1A1A1A]">Notifications</span>
                      {unreadCount > 0 && (
                        <span className="text-[10px] font-semibold bg-[#EEF2FF] text-[#4F46E5] px-2 py-0.5 rounded-full">
                          {unreadCount} New
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
                          fetch("/api/notifications", {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ markAllRead: true }),
                          }).catch(() => {});
                        }}
                        className="text-[11px] font-bold text-[#4F46E5] hover:underline cursor-pointer"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  <div className="space-y-1.5 max-h-72 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="py-6 text-center text-xs text-gray-400">
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => handleNotificationClick(n)}
                          className={cn(
                            "p-2.5 rounded-xl border transition-all text-xs cursor-pointer hover:shadow-xs",
                            n.read
                              ? "bg-[#F8F9FA] border-[#E5E7EB] text-[#6B7280] hover:bg-gray-100"
                              : "bg-[#EEF2FF]/60 border-[#C7D2FE] text-[#1A1A1A] hover:bg-[#EEF2FF]"
                          )}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-bold text-[#1A1A1A] truncate max-w-[190px]">{n.title}</p>
                            <span className="text-[10px] text-[#9CA3AF] shrink-0">{n.time}</span>
                          </div>
                          <p className="text-[11px] leading-relaxed line-clamp-2">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="pt-2 border-t border-[#E5E7EB] flex items-center justify-between text-[11px]">
                    <Link
                      href="/notifications"
                      onClick={() => setNotificationsOpen(false)}
                      className="font-bold text-[#4F46E5] hover:underline"
                    >
                      View all notifications &rarr;
                    </Link>
                    <Link
                      href="/settings/notifications"
                      onClick={() => setNotificationsOpen(false)}
                      className="text-gray-500 hover:text-gray-900"
                    >
                      Settings
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Popover */}
            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 p-1 pl-2.5 rounded-full border border-[#E5E7EB] hover:border-[#C7D2FE] transition-all bg-white shadow-2xs cursor-pointer"
                aria-label="User Profile"
              >
                <span className="text-xs font-bold text-[#1A1A1A] max-w-[130px] truncate">
                  {displayName}
                </span>
                <div className="w-7 h-7 rounded-full bg-[#1A1A1A] text-white flex items-center justify-center font-bold text-[11px] shadow-inner">
                  {getInitials(displayName)}
                </div>
                <IonIcon name="chevron-down-outline" size={14} className="text-[#9CA3AF] pr-1" />
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl border border-[#E5E7EB] shadow-[0_15px_30px_-5px_rgba(0,0,0,0.1)] z-50 p-2 space-y-1">
                  <div className="p-3 border-b border-[#E5E7EB]">
                    <p className="text-xs font-bold text-[#1A1A1A] truncate">{displayName}</p>
                    <p className="text-[11px] text-[#6B7280] truncate">{liveUser?.email}</p>
                    <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EEF2FF] text-[#4F46E5] border border-[#C7D2FE]">
                      {displayRoleLabel}
                    </span>
                  </div>

                  <Link
                    href="/dashboard"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#1A1A1A] hover:bg-[#F8F9FA] rounded-xl transition-colors"
                  >
                    <IonIcon name="grid-outline" size={16} className="text-[#4F46E5]" />
                    <span>Resident Console</span>
                  </Link>

                  <Link
                    href="/profile"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#1A1A1A] hover:bg-[#F8F9FA] rounded-xl transition-colors"
                  >
                    <IonIcon name="person-outline" size={16} className="text-[#4F46E5]" />
                    <span>Member Profile &amp; Vault</span>
                  </Link>

                  {(activeRole === "RESIDENT_OWNER" || activeRole === "TENANT") && (
                    <Link
                      href="/my-flat"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#1A1A1A] hover:bg-[#F8F9FA] rounded-xl transition-colors"
                    >
                      <IonIcon name="home-outline" size={16} className="text-[#4F46E5]" />
                      <span>My Flat</span>
                    </Link>
                  )}

                  <Link
                    href="/settings"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#1A1A1A] hover:bg-[#F8F9FA] rounded-xl transition-colors"
                  >
                    <IonIcon name="settings-outline" size={16} className="text-[#9CA3AF]" />
                    <span>Settings &amp; Security</span>
                  </Link>

                  <div className="pt-1 border-t border-[#E5E7EB]">
                    <button
                      type="button"
                      onClick={() => {
                        setProfileOpen(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#F43F5E] hover:bg-[#FFF1F2] rounded-xl transition-colors text-left cursor-pointer"
                    >
                      <IonIcon name="log-out-outline" size={16} />
                      <span>Sign Out</span>
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

      {/* Statutory Inactivity Timeout Warning Modal */}
      <Modal
        isOpen={sessionTimeoutWarning}
        onClose={extendSession}
        title="Session Expiring Soon"
        description="For statutory security and compliance, inactive accounts are automatically logged out."
        maxWidth="sm"
        footer={
          <div className="flex items-center justify-end gap-2.5 w-full">
            <AppButton
              variant="outline"
              size="sm"
              onClick={handleSessionExpired}
            >
              Log Out Now
            </AppButton>
            <AppButton
              variant="primary"
              size="sm"
              onClick={extendSession}
            >
              Stay Logged In
            </AppButton>
          </div>
        }
      >
        <div className="py-2 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#FEF3C7] text-[#D97706] flex items-center justify-center mx-auto">
            <IonIcon name="time-outline" size={28} />
          </div>
          <p className="text-sm text-[#4B5563]">
            Your session will expire in{" "}
            <span className="font-bold text-[#D97706] font-mono text-base">
              {remainingCountdown}s
            </span>{" "}
            due to inactivity.
          </p>
          <p className="text-xs text-[#9CA3AF]">
            Click &quot;Stay Logged In&quot; to continue your work without interruption.
          </p>
        </div>
      </Modal>
    </div>
  );
}
