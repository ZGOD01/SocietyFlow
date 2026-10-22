"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppButton, IonIcon } from "@/components/ui";

export function LandingNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-[#E5E7EB]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-[#4F46E5] text-white flex items-center justify-center font-extrabold text-xl font-heading shadow-[0_1px_3px_rgba(79,70,229,0.3)] transition-transform group-hover:scale-105">
            S
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-xl tracking-tight text-[#1A1A1A] font-heading">
              Society<span className="text-[#4F46E5]">Flow</span>
            </span>
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#6B7280]">
              Governance Platform
            </span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#6B7280]">
          <a
            href="#features"
            className="hover:text-[#1A1A1A] transition-colors"
          >
            Features
          </a>
          <a
            href="#vault"
            className="hover:text-[#1A1A1A] transition-colors"
          >
            Document Vault
          </a>
          <a
            href="#approvals"
            className="hover:text-[#1A1A1A] transition-colors"
          >
            Approvals
          </a>
          <a
            href="#how-it-works"
            className="hover:text-[#1A1A1A] transition-colors"
          >
            How It Works
          </a>
          <Link
            href="/dashboard"
            className="text-[#4F46E5] font-semibold hover:text-[#4338CA] transition-colors"
          >
            Console Preview
          </Link>
        </nav>

        {/* CTA Controls */}
        <div className="hidden sm:flex items-center gap-3">
          <Link href="/login">
            <AppButton variant="ghost" size="sm">
              Sign In
            </AppButton>
          </Link>
          <Link href="/dashboard">
            <AppButton
              variant="hero"
              size="sm"
              pill
              rightIcon="arrow-forward-outline"
            >
              Explore Live Prototype
            </AppButton>
          </Link>
        </div>

        {/* Mobile Hamburger */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-[#1A1A1A] rounded-xl border border-[#E5E7EB]"
          aria-label="Toggle Navigation"
        >
          <IonIcon name={mobileMenuOpen ? "close-outline" : "menu-outline"} size={22} />
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-[#E5E7EB] bg-white p-4 space-y-3 shadow-lg">
          <nav className="flex flex-col space-y-2 text-sm font-medium text-[#6B7280]">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 px-3 rounded-lg hover:bg-[#F8F9FA] hover:text-[#1A1A1A]"
            >
              Features
            </a>
            <a
              href="#vault"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 px-3 rounded-lg hover:bg-[#F8F9FA] hover:text-[#1A1A1A]"
            >
              Document Vault
            </a>
            <a
              href="#approvals"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 px-3 rounded-lg hover:bg-[#F8F9FA] hover:text-[#1A1A1A]"
            >
              Approvals
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 px-3 rounded-lg hover:bg-[#F8F9FA] hover:text-[#1A1A1A]"
            >
              How It Works
            </a>
            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 px-3 rounded-lg bg-[#EEF2FF] text-[#4F46E5] font-semibold"
            >
              Console Preview
            </Link>
          </nav>
          <div className="pt-2 border-t border-[#F1F3F5] flex flex-col gap-2">
            <Link href="/login" className="w-full">
              <AppButton variant="outline" size="sm" className="w-full">
                Sign In
              </AppButton>
            </Link>
            <Link href="/dashboard" className="w-full">
              <AppButton variant="hero" size="sm" className="w-full">
                Explore Prototype
              </AppButton>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
