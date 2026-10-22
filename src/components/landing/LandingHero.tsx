"use client";

import React from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { AppButton, IonIcon } from "@/components/ui";
import { InteractiveHeroSimulator } from "./InteractiveHeroSimulator";

export function LandingHero() {
  return (
    <section className="relative pt-8 pb-16 md:pt-16 md:pb-24 overflow-hidden bg-gradient-to-b from-white via-indigo-50/20 to-white">
      {/* Ambient Gradient Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-gradient-to-tr from-indigo-500/12 via-purple-500/8 to-cyan-400/8 blur-[90px] rounded-full pointer-events-none -z-10 animate-pulse-glow" />
      <div className="absolute top-10 left-10 w-64 h-64 bg-indigo-400/8 blur-[80px] rounded-full pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-violet-400/8 blur-[100px] rounded-full pointer-events-none -z-10" />

      {/* Subtle Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-dot-pattern opacity-30 pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
          {/* Refined Eyebrow Pill */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="mb-4"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/95 border border-indigo-200/90 shadow-[0_2px_10px_rgba(99,102,241,0.1)] backdrop-blur-md text-xs font-semibold text-indigo-700">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600" />
              </span>
              <span>Digital Society Governance Platform</span>
              <span className="text-slate-300">|</span>
              <span className="text-slate-600 font-medium">MCS Act 1960 Compliant</span>
            </div>
          </motion.div>

          {/* Refined, Well-Proportioned Hero Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.08, ease: "easeOut" }}
            className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-[-0.03em] text-slate-900 font-heading leading-[1.18]"
          >
            Your Society. <span className="text-gradient-brand">Every Document.</span> One Place.
          </motion.h1>

          {/* Meaningful Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.16, ease: "easeOut" }}
            className="mt-4 text-sm sm:text-base md:text-lg text-slate-600 max-w-2xl font-normal leading-relaxed"
          >
            Replace missing share certificates, physical paper files, and WhatsApp approval threads
            with tamper-evident unit vaults, multi-signatory NOC workflows, and verified flat ownership records.
          </motion.p>

          {/* Refined Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.24, ease: "easeOut" }}
            className="mt-6 flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto"
          >
            <Link href="/dashboard" className="w-full sm:w-auto">
              <AppButton
                variant="gradient"
                size="md"
                pill
                rightIcon="arrow-forward-outline"
                className="w-full sm:w-auto shadow-md"
              >
                Launch Live Prototype Console
              </AppButton>
            </Link>
            <a href="#simulator" className="w-full sm:w-auto">
              <AppButton
                variant="outline"
                size="md"
                pill
                leftIcon="cube-outline"
                className="w-full sm:w-auto bg-white/95"
              >
                Test Interactive Simulator
              </AppButton>
            </a>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.45, delay: 0.32 }}
            className="mt-7 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-600 font-medium"
          >
            <span className="flex items-center gap-1.5 bg-white/80 px-3 py-1 rounded-full border border-slate-200/70 shadow-2xs">
              <IonIcon name="checkmark-circle" className="text-emerald-500" size={15} />
              Bank-Ready Share Certificates
            </span>
            <span className="flex items-center gap-1.5 bg-white/80 px-3 py-1 rounded-full border border-slate-200/70 shadow-2xs">
              <IonIcon name="checkmark-circle" className="text-emerald-500" size={15} />
              Instant 3-Signatory NOCs
            </span>
            <span className="flex items-center gap-1.5 bg-white/80 px-3 py-1 rounded-full border border-slate-200/70 shadow-2xs">
              <IonIcon name="checkmark-circle" className="text-emerald-500" size={15} />
              100% Multi-Tenant Isolation
            </span>
          </motion.div>
        </div>

        {/* Live Interactive Hero Simulator (Replaces static dead boxes) */}
        <motion.div
          id="simulator"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 140, damping: 22, delay: 0.28 }}
          className="mt-10 max-w-5xl mx-auto"
        >
          <div className="text-center mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-3 py-1 rounded-full">
              Live Interactive Prototype Sandbox — Click Below to Test Workflows
            </span>
          </div>
          <InteractiveHeroSimulator />
        </motion.div>
      </div>
    </section>
  );
}
