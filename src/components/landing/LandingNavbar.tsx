"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { AppButton, IonIcon } from "@/components/ui";
import { UserRole } from "@/types";

export interface LandingNavbarProps {
  user?: {
    name: string;
    email: string;
    role: UserRole;
    avatarUrl?: string;
  } | null;
}

export function LandingNavbar({ user = null }: LandingNavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

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

  const getDashboardDestination = (role?: UserRole): string => {
    switch (role) {
      case "SOCIETY_ADMIN":
        return "/management/dashboard";
      case "SUPER_ADMIN":
        return "/admin/dashboard";
      case "AUDITOR_PARTNER":
        return "/partner/dashboard";
      case "TENANT":
        return "/dashboard?view=tenant";
      case "RESIDENT_OWNER":
      default:
        return "/dashboard";
    }
  };

  const dashboardHref = getDashboardDestination(user?.role);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/85 backdrop-blur-xl border-b border-slate-200/80 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.06)]"
          : "bg-white/60 backdrop-blur-md border-b border-slate-100"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-600 to-violet-500 text-white flex items-center justify-center font-extrabold text-xl font-heading shadow-[0_4px_16px_rgba(79,70,229,0.35)] transition-all duration-300 group-hover:scale-105 group-hover:shadow-[0_6px_20px_rgba(79,70,229,0.45)]">
            S
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-xl tracking-tight text-slate-900 font-heading">
              Society<span className="text-gradient-brand">Flow</span>
            </span>
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
              Cooperative Governance
            </span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-100/70 p-1.5 rounded-full border border-slate-200/70 backdrop-blur-md text-sm font-semibold text-slate-600">
          <a
            href="#simulator"
            className="px-3.5 py-1.5 rounded-full hover:text-slate-900 hover:bg-white transition-all duration-200"
          >
            Live Simulator
          </a>
          <a
            href="#features"
            className="px-3.5 py-1.5 rounded-full hover:text-slate-900 hover:bg-white transition-all duration-200"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            className="px-3.5 py-1.5 rounded-full hover:text-slate-900 hover:bg-white transition-all duration-200"
          >
            How It Works
          </a>
          {!user && (
            <a
              href="#pricing"
              className="px-3.5 py-1.5 rounded-full hover:text-slate-900 hover:bg-white transition-all duration-200"
            >
              Pricing
            </a>
          )}
        </nav>

        {/* CTA Controls */}
        <div className="hidden sm:flex items-center gap-3">
          {user ? (
            /* Logged-In State */
            <div className="flex items-center gap-3">
              <Link href={dashboardHref}>
                <AppButton
                  variant="gradient"
                  size="sm"
                  pill
                  rightIcon="arrow-forward-outline"
                >
                  Go to Dashboard
                </AppButton>
              </Link>

              {/* Profile Dropdown */}
              <div className="relative" ref={profileRef}>
                <button
                  type="button"
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-full border border-slate-200 hover:border-indigo-300 transition-all bg-white/90 shadow-2xs"
                  aria-label="User Profile Menu"
                >
                  <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-inner">
                    {user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .substring(0, 2)
                      .toUpperCase()}
                  </div>
                  <IonIcon
                    name="chevron-down-outline"
                    size={14}
                    className="text-slate-500 mr-1"
                  />
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white/95 backdrop-blur-xl rounded-2xl border border-slate-200 shadow-[0_20px_40px_-10px_rgba(15,23,42,0.12)] z-50 p-2 space-y-1">
                    <div className="p-3 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {user.name}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {user.email}
                      </p>
                      <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 uppercase border border-indigo-100">
                        {user.role.replace(/_/g, " ")}
                      </span>
                    </div>

                    <Link
                      href={dashboardHref}
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
                    >
                      <IonIcon name="grid-outline" size={16} className="text-indigo-600" />
                      <span>Console Overview</span>
                    </Link>

                    <Link
                      href="/settings"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
                    >
                      <IonIcon name="settings-outline" size={16} className="text-slate-400" />
                      <span>Account Settings</span>
                    </Link>

                    <div className="pt-1 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          alert(
                            "[Auth Notice] Real session termination connects with Auth.js signOut() in Prompt 2."
                          );
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors text-left"
                      >
                        <IonIcon name="log-out-outline" size={16} />
                        <span>Log Out</span>
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
                  variant="gradient"
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
          className="md:hidden p-2.5 text-slate-800 rounded-xl bg-slate-100 border border-slate-200 active:scale-95 transition-all"
          aria-label="Toggle Navigation"
        >
          <IonIcon name={mobileMenuOpen ? "close-outline" : "menu-outline"} size={22} />
        </button>
      </div>

      {/* Mobile Drawer Dropdown */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-b border-slate-200 bg-white/95 backdrop-blur-xl px-4 py-4 space-y-3 shadow-xl overflow-hidden"
          >
            <nav className="flex flex-col space-y-1 text-sm font-semibold text-slate-700">
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2.5 px-3 rounded-xl hover:bg-slate-100 flex items-center justify-between"
              >
                <span>Features</span>
                <IonIcon name="chevron-forward-outline" size={14} className="text-slate-400" />
              </a>
              <a
                href="#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2.5 px-3 rounded-xl hover:bg-slate-100 flex items-center justify-between"
              >
                <span>How It Works</span>
                <IonIcon name="chevron-forward-outline" size={14} className="text-slate-400" />
              </a>
              {!user && (
                <a
                  href="#pricing"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2.5 px-3 rounded-xl hover:bg-slate-100 flex items-center justify-between"
                >
                  <span>Pricing</span>
                  <IonIcon name="chevron-forward-outline" size={14} className="text-slate-400" />
                </a>
              )}
            </nav>

            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              {user ? (
                <>
                  <Link
                    href={dashboardHref}
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full"
                  >
                    <AppButton variant="gradient" size="sm" className="w-full" pill>
                      Go to Dashboard
                    </AppButton>
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      alert("[Auth Notice] Sign out connects in Prompt 2.");
                    }}
                    className="w-full py-2 text-xs text-rose-600 font-semibold text-center hover:bg-rose-50 rounded-xl transition-colors"
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
                    <AppButton variant="gradient" size="sm" className="w-full" pill>
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
