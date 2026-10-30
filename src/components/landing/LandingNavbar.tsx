"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { AppButton, IonIcon } from "@/components/ui";

export interface NavbarUser {
  name: string;
  email: string;
  role?: string;
  activeRole?: string;
  avatarUrl?: string;
}

export interface LandingNavbarProps {
  user?: NavbarUser | null;
}

export function LandingNavbar({ user: initialUser }: LandingNavbarProps) {
  const [fetchedUser, setFetchedUser] = useState<NavbarUser | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Check Auth.js session only if not explicitly provided via prop
  useEffect(() => {
    if (initialUser !== undefined) {
      return;
    }

    let isMounted = true;
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.authenticated && data.user) {
          setFetchedUser(data.user);
        } else {
          setFetchedUser(null);
        }
      })
      .catch(() => {
        if (isMounted) {
          setFetchedUser(null);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [initialUser]);

  const user = initialUser !== undefined ? initialUser : fetchedUser;

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getDashboardDestination = (role?: string): string => {
    const normalizedRole = (role || "").toUpperCase();
    if (
      normalizedRole.includes("SECRETARY") ||
      normalizedRole.includes("CHAIRMAN") ||
      normalizedRole.includes("TREASURER") ||
      normalizedRole.includes("MANAGER") ||
      normalizedRole === "SOCIETY_ADMIN"
    ) {
      return "/management/dashboard";
    }
    if (normalizedRole === "SUPER_ADMIN") {
      return "/admin/dashboard";
    }
    if (
      normalizedRole === "AUDITOR_PARTNER" ||
      normalizedRole.includes("AUDITOR") ||
      normalizedRole.includes("PARTNER")
    ) {
      return "/partner/dashboard";
    }
    if (normalizedRole === "TENANT") {
      return "/dashboard?view=tenant";
    }
    return "/dashboard";
  };

  const effectiveRole = user?.activeRole || user?.role || "RESIDENT_OWNER";
  const dashboardHref = getDashboardDestination(effectiveRole);

  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {
      console.error("[LandingNavbar] Logout error:", e);
    } finally {
      setFetchedUser(null);
      setProfileDropdownOpen(false);
      setMobileMenuOpen(false);
      window.location.href = "/login?switch=true";
    }
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-200 ${
        scrolled
          ? "bg-white/95 backdrop-blur-md border-b border-[#E5E7EB] shadow-[0_1px_3px_0_rgba(0,0,0,0.05)]"
          : "bg-white border-b border-[#E5E7EB]"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* SocietyFlow Logo (Links to /) */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-[#4F46E5] text-white flex items-center justify-center font-bold text-lg font-heading shadow-xs transition-transform group-hover:scale-105">
            S
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-lg tracking-tight text-[#1A1A1A] font-heading leading-tight">
              Society<span className="text-[#4F46E5]">Flow</span>
            </span>
            <span className="text-[10px] font-semibold tracking-wider text-[#6B7280] uppercase">
              Cooperative Governance
            </span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-1 bg-[#F8F9FA] p-1 rounded-full border border-[#E5E7EB] text-xs font-semibold text-[#6B7280]">
          <a
            href="#features"
            className="px-3.5 py-1.5 rounded-full hover:text-[#1A1A1A] hover:bg-white transition-colors"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            className="px-3.5 py-1.5 rounded-full hover:text-[#1A1A1A] hover:bg-white transition-colors"
          >
            How It Works
          </a>
          {!user && (
            <a
              href="#pricing"
              className="px-3.5 py-1.5 rounded-full hover:text-[#1A1A1A] hover:bg-white transition-colors"
            >
              Pricing
            </a>
          )}
        </nav>

        {/* Right CTA Controls */}
        <div className="hidden sm:flex items-center gap-2.5">
          {user ? (
            /* Logged-In State */
            <div className="flex items-center gap-3">
              <Link href={dashboardHref}>
                <AppButton
                  variant="hero"
                  size="sm"
                  pill
                  rightIcon="arrow-forward-outline"
                >
                  Go to Dashboard
                </AppButton>
              </Link>

              {/* Profile Menu Dropdown */}
              <div className="relative" ref={profileRef}>
                <button
                  type="button"
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 p-1 pl-2 rounded-full border border-[#E5E7EB] hover:border-[#4F46E5] transition-all bg-[#F8F9FA] hover:bg-white cursor-pointer"
                  aria-label="User Profile Menu"
                >
                  <span className="text-xs font-semibold text-[#1A1A1A] max-w-[120px] truncate">
                    {user.name}
                  </span>
                  <div className="w-7 h-7 rounded-full bg-[#1A1A1A] text-white flex items-center justify-center font-bold text-[11px]">
                    {user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .substring(0, 2)
                      .toUpperCase()}
                  </div>
                  <IonIcon
                    name="chevron-down-outline"
                    size={13}
                    className="text-[#6B7280] mr-1"
                  />
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl border border-[#E5E7EB] shadow-[0_10px_25px_-5px_rgba(0,0,0,0.08)] z-50 p-2 space-y-1">
                    <div className="p-3 border-b border-[#E5E7EB]">
                      <p className="text-xs font-bold text-[#1A1A1A] truncate">
                        {user.name}
                      </p>
                      <p className="text-[11px] text-[#6B7280] truncate mt-0.5">
                        {user.email}
                      </p>
                      <span className="inline-block mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EEF2FF] text-[#4F46E5] uppercase border border-[#C7D2FE]">
                        {effectiveRole.replace(/_/g, " ")}
                      </span>
                    </div>

                    <Link
                      href={dashboardHref}
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#1A1A1A] hover:bg-[#F8F9FA] rounded-lg transition-colors"
                    >
                      <IonIcon name="grid-outline" size={16} className="text-[#4F46E5]" />
                      <span>Console Overview</span>
                    </Link>

                    <Link
                      href="/settings"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#6B7280] hover:text-[#1A1A1A] hover:bg-[#F8F9FA] rounded-lg transition-colors"
                    >
                      <IonIcon name="settings-outline" size={16} className="text-[#9CA3AF]" />
                      <span>Account Settings</span>
                    </Link>

                    <div className="pt-1 border-t border-[#E5E7EB]">
                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#F43F5E] hover:bg-[#FFF1F2] rounded-lg transition-colors text-left cursor-pointer"
                      >
                        <IonIcon name="log-out-outline" size={16} />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Logged-Out State */
            <>
              <Link href="/login">
                <AppButton variant="ghost" size="sm">
                  Log In
                </AppButton>
              </Link>
              <Link href="/register">
                <AppButton
                  variant="hero"
                  size="sm"
                  pill
                  rightIcon="arrow-forward-outline"
                >
                  Get Started
                </AppButton>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-[#1A1A1A] rounded-xl bg-[#F8F9FA] border border-[#E5E7EB] active:scale-95 transition-all"
          aria-label="Toggle Navigation"
        >
          <IonIcon name={mobileMenuOpen ? "close-outline" : "menu-outline"} size={20} />
        </button>
      </div>

      {/* Mobile Drawer Dropdown */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-b border-[#E5E7EB] bg-white px-4 py-4 space-y-3 shadow-lg overflow-hidden"
          >
            <nav className="flex flex-col space-y-1 text-xs font-semibold text-[#6B7280]">
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2.5 px-3 rounded-lg hover:bg-[#F8F9FA] hover:text-[#1A1A1A] flex items-center justify-between"
              >
                <span>Features</span>
                <IonIcon name="chevron-forward-outline" size={14} className="text-[#9CA3AF]" />
              </a>
              <a
                href="#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2.5 px-3 rounded-lg hover:bg-[#F8F9FA] hover:text-[#1A1A1A] flex items-center justify-between"
              >
                <span>How It Works</span>
                <IonIcon name="chevron-forward-outline" size={14} className="text-[#9CA3AF]" />
              </a>
              {!user && (
                <a
                  href="#pricing"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2.5 px-3 rounded-lg hover:bg-[#F8F9FA] hover:text-[#1A1A1A] flex items-center justify-between"
                >
                  <span>Pricing</span>
                  <IonIcon name="chevron-forward-outline" size={14} className="text-[#9CA3AF]" />
                </a>
              )}
            </nav>

            <div className="pt-3 border-t border-[#E5E7EB] flex flex-col gap-2">
              {user ? (
                <>
                  <Link
                    href={dashboardHref}
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full"
                  >
                    <AppButton variant="hero" size="sm" className="w-full" pill>
                      Go to Dashboard
                    </AppButton>
                  </Link>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="w-full py-2 text-xs text-[#F43F5E] font-semibold text-center hover:bg-[#FFF1F2] rounded-lg transition-colors cursor-pointer"
                  >
                    Log Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full"
                  >
                    <AppButton variant="outline" size="sm" className="w-full">
                      Log In
                    </AppButton>
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full"
                  >
                    <AppButton variant="hero" size="sm" className="w-full" pill>
                      Get Started
                    </AppButton>
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
