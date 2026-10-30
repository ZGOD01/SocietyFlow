"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "motion/react";
import { IonIcon } from "@/components/ui";

export function LandingHero() {
  const [selectedSociety, setSelectedSociety] = useState("Royal Palms CHS");
  const [selectedUnit, setSelectedUnit] = useState("Wing B • Flat 402");
  const [selectedDocument, setSelectedDocument] = useState("Bank Resale NOC");
  const [selectedStatus, setSelectedStatus] = useState("Verified & Active");

  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [session, setSession] = useState<{
    name: string;
    email: string;
    activeRole?: string;
  } | null>(null);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          setSession(data.user);
        }
      })
      .catch(() => {});
  }, []);

  const toggleDropdown = (name: string) => {
    setActiveDropdown(activeDropdown === name ? null : name);
  };

  const handleLaunchSimulator = () => {
    const el = document.getElementById("simulator");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="p-3 sm:p-4 lg:p-6 max-w-6xl mx-auto w-full">
      {/* Medium-Sized Luxury Hero Card Container */}
      <div className="relative isolate rounded-2xl sm:rounded-3xl overflow-hidden min-h-[500px] sm:min-h-[540px] md:min-h-[580px] flex flex-col justify-between p-5 sm:p-7 lg:p-8 bg-slate-900 border border-white/15 shadow-[0_25px_60px_rgba(0,0,0,0.3)]">
        {/* Background Image: Slightly brighter with tuned overlay */}
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <Image
            src="/society-luxury-dusk.jpg"
            alt="Luxury Modern Residential Society Estate"
            fill
            priority
            className="object-cover object-center scale-[1.01] brightness-110 contrast-[1.02]"
            sizes="(max-width: 1200px) 100vw, 1200px"
          />
          {/* Lighter, warm cinematic overlay so the architecture and sky are clearly visible */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-black/35" />
        </div>

        {/* Top Architectural Card Badge Bar */}
        <div className="relative z-30 flex items-center justify-between gap-3 w-full">
          {/* Left Status Chip */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-black/40 backdrop-blur-xl border border-white/20 rounded-full shadow-md text-[11px] font-semibold text-white/90">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>MCS Act 1960 Digital Vaults</span>
          </div>

          {/* Center Brand Emblem */}
          <div className="hidden sm:flex items-center gap-1.5">
            <span className="font-heading font-black text-xs sm:text-sm tracking-[0.25em] text-white/80 uppercase">
              ZERO-TRUST ARCHITECTURE
            </span>
          </div>

          {/* Right Status Pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-black/40 backdrop-blur-xl border border-white/20 rounded-full shadow-md text-[11px] font-semibold text-white/90">
            <IonIcon name="shield-checkmark" size={13} className="text-indigo-400" />
            <span>3-Signatory Quorum Ready</span>
          </div>
        </div>

        {/* Hero Middle Content: Balanced Proportions & Elegant Typography */}
        <div className="relative z-20 my-auto py-5 sm:py-7 lg:py-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
          {/* Left Column: Eyebrow + Crisp Uppercase Headline + Pill CTA */}
          <div className="lg:col-span-8 space-y-3.5 sm:space-y-4">
            {/* Eyebrow */}
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="flex items-center gap-2"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] sm:text-xs font-semibold tracking-wider text-white/90 uppercase drop-shadow-sm">
                Explore verified society document vaults & statutory approvals
              </span>
            </motion.div>

            {/* Well-Proportioned Uppercase Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.08 }}
              className="text-2xl sm:text-3xl md:text-4xl lg:text-[42px] font-black uppercase tracking-tight text-white font-heading leading-[1.08] drop-shadow-md"
            >
              MANAGE HOUSING SOCIETY VAULTS <br className="hidden sm:block" />
              AND TURN UNCERTAINTY INTO TRUST
            </motion.h1>

            {/* Pill CTA Button */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.16 }}
              className="pt-1"
            >
              <Link href={session ? "/dashboard" : "/register"}>
                <button
                  type="button"
                  className="px-5 sm:px-6 py-2.5 sm:py-3 rounded-full bg-white hover:bg-slate-100 text-slate-950 font-extrabold text-xs tracking-wider uppercase transition-all shadow-[0_6px_20px_rgba(255,255,255,0.25)] hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2.5 cursor-pointer"
                >
                  <span>{session ? "OPEN RESIDENT CONSOLE" : "REGISTER YOUR COOPERATIVE SOCIETY"}</span>
                  <IonIcon name="arrow-forward-outline" size={14} />
                </button>
              </Link>
            </motion.div>
          </div>

          {/* Right Column: Subtitle Description */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="lg:col-span-4 lg:pl-4 pb-1"
          >
            <p className="text-xs sm:text-sm text-white/85 font-normal leading-relaxed border-l-2 border-white/30 pl-3.5 drop-shadow-sm">
              Elevate your society with verified resident vaults. Experience instant 3-signatory digital NOCs,
              tamper-proof share certificates, and automated Model Bylaw compliance.
            </p>
          </motion.div>
        </div>

        {/* Bottom Floating Glass Console Bar */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.25 }}
          className="relative z-20 w-full"
        >
          <div className="bg-black/45 backdrop-blur-2xl border border-white/20 rounded-xl sm:rounded-2xl p-2.5 sm:p-3 shadow-[0_15px_40px_rgba(0,0,0,0.4)]">
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-2.5 items-center">
              {/* Field 1: Society Name */}
              <div className="relative p-2 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 transition-colors">
                <span className="text-[9px] font-bold uppercase tracking-wider text-white/60 block">
                  Society
                </span>
                <button
                  type="button"
                  onClick={() => toggleDropdown("society")}
                  className="w-full flex items-center justify-between text-left text-xs font-bold text-white mt-0.5 cursor-pointer"
                >
                  <span className="truncate">{selectedSociety}</span>
                  <IonIcon name="chevron-down-outline" size={12} className="text-white/70 shrink-0 ml-1" />
                </button>
                {activeDropdown === "society" && (
                  <div className="absolute bottom-full left-0 mb-1.5 w-52 bg-slate-900 border border-white/20 rounded-xl p-1 shadow-2xl z-50 text-xs">
                    {["Royal Palms CHS", "Greenwood Heights", "Sunrise Co-op Towers", "Grand Vista Complex"].map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => {
                          setSelectedSociety(item);
                          setActiveDropdown(null);
                        }}
                        className="w-full text-left px-2.5 py-1.5 text-white hover:bg-white/10 rounded-lg transition-colors"
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Field 2: Flat / Unit */}
              <div className="relative p-2 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 transition-colors">
                <span className="text-[9px] font-bold uppercase tracking-wider text-white/60 block">
                  Flat / Unit
                </span>
                <button
                  type="button"
                  onClick={() => toggleDropdown("unit")}
                  className="w-full flex items-center justify-between text-left text-xs font-bold text-white mt-0.5 cursor-pointer"
                >
                  <span className="truncate">{selectedUnit}</span>
                  <IonIcon name="chevron-down-outline" size={12} className="text-white/70 shrink-0 ml-1" />
                </button>
                {activeDropdown === "unit" && (
                  <div className="absolute bottom-full left-0 mb-1.5 w-52 bg-slate-900 border border-white/20 rounded-xl p-1 shadow-2xl z-50 text-xs">
                    {["Wing A • Flat 104", "Wing B • Flat 402", "Wing C • Flat 301", "Wing D • Flat 502"].map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => {
                          setSelectedUnit(item);
                          setActiveDropdown(null);
                        }}
                        className="w-full text-left px-2.5 py-1.5 text-white hover:bg-white/10 rounded-lg transition-colors"
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Field 3: Document */}
              <div className="relative p-2 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 transition-colors">
                <span className="text-[9px] font-bold uppercase tracking-wider text-white/60 block">
                  Document
                </span>
                <button
                  type="button"
                  onClick={() => toggleDropdown("document")}
                  className="w-full flex items-center justify-between text-left text-xs font-bold text-white mt-0.5 cursor-pointer"
                >
                  <span className="truncate">{selectedDocument}</span>
                  <IonIcon name="chevron-down-outline" size={12} className="text-white/70 shrink-0 ml-1" />
                </button>
                {activeDropdown === "document" && (
                  <div className="absolute bottom-full left-0 mb-1.5 w-52 bg-slate-900 border border-white/20 rounded-xl p-1 shadow-2xl z-50 text-xs">
                    {["Bank Resale NOC", "Share Certificate", "Registered Sale Deed", "Maintenance No-Dues"].map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => {
                          setSelectedDocument(item);
                          setActiveDropdown(null);
                        }}
                        className="w-full text-left px-2.5 py-1.5 text-white hover:bg-white/10 rounded-lg transition-colors"
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Field 4: Status */}
              <div className="relative p-2 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 transition-colors">
                <span className="text-[9px] font-bold uppercase tracking-wider text-white/60 block">
                  Status
                </span>
                <button
                  type="button"
                  onClick={() => toggleDropdown("status")}
                  className="w-full flex items-center justify-between text-left text-xs font-bold text-white mt-0.5 cursor-pointer"
                >
                  <span className="truncate">{selectedStatus}</span>
                  <IonIcon name="chevron-down-outline" size={12} className="text-white/70 shrink-0 ml-1" />
                </button>
                {activeDropdown === "status" && (
                  <div className="absolute bottom-full left-0 mb-1.5 w-52 bg-slate-900 border border-white/20 rounded-xl p-1 shadow-2xl z-50 text-xs">
                    {["Verified & Active", "Quorum Approved (3/3)", "Awaiting Secretary Seal", "MCS Act Compliant"].map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => {
                          setSelectedStatus(item);
                          setActiveDropdown(null);
                        }}
                        className="w-full text-left px-2.5 py-1.5 text-white hover:bg-white/10 rounded-lg transition-colors"
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Button: White Square with Search Icon */}
              <div className="flex items-center justify-end col-span-2 lg:col-span-1">
                <button
                  type="button"
                  onClick={handleLaunchSimulator}
                  aria-label="Launch Sandbox Simulator"
                  className="w-full lg:w-12 h-10 lg:h-11 rounded-lg lg:rounded-xl bg-white text-slate-950 hover:bg-slate-100 flex items-center justify-center font-black transition-all shadow-md hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <IonIcon name="search-outline" size={18} className="stroke-[2.5]" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
