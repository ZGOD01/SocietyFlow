"use client";

import React from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { IonIcon } from "@/components/ui";

export function LandingCTA() {
  return (
    <section className="py-16 md:py-24 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
        className="relative rounded-2xl sm:rounded-3xl overflow-hidden p-8 sm:p-12 lg:p-16 text-center text-slate-950 bg-gradient-to-br from-indigo-50/90 via-white to-sky-50/80 border-2 border-indigo-200/80 shadow-[0_25px_60px_-15px_rgba(99,102,241,0.18)]"
      >
        {/* Subtle Ambient Radial Glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-200/30 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-sky-200/30 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="relative z-10 max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-100/80 text-indigo-800 text-[10px] sm:text-xs font-bold tracking-widest uppercase border border-indigo-200 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
            <span>Digital Governance Evolution</span>
          </div>

          <h2 className="text-2xl sm:text-4xl md:text-5xl font-black font-heading uppercase tracking-tight text-slate-950 leading-[1.08]">
            READY TO MODERNIZE YOUR HOUSING SOCIETY?
          </h2>

          <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto font-normal leading-relaxed">
            Join cooperative housing societies, flat owners, and managing committee members
            turning paper chaos into verifiable digital trust.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/register" className="w-full sm:w-auto">
              <button
                type="button"
                className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm tracking-wider uppercase transition-all shadow-md shadow-indigo-500/25 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <span>REGISTER YOUR SOCIETY</span>
                <IonIcon name="arrow-forward-outline" size={16} />
              </button>
            </Link>
            <Link href="/login" className="w-full sm:w-auto">
              <button
                type="button"
                className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-white hover:bg-slate-50 text-slate-900 font-bold text-xs sm:text-sm tracking-wider uppercase border border-slate-300 shadow-sm transition-all flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <IonIcon name="lock-closed-outline" size={16} />
                <span>MEMBER LOGIN</span>
              </button>
            </Link>
          </div>

          <div className="pt-6 border-t border-indigo-100 flex flex-wrap items-center justify-center gap-4 text-[10px] sm:text-[11px] text-slate-500 font-semibold tracking-wider uppercase">
            <span>MCS ACT 1960</span>
            <span>•</span>
            <span>AES-256 VAULTS</span>
            <span>•</span>
            <span>BANK-APPROVED NOCS</span>
            <span>•</span>
            <span>48-HOUR QUORUM</span>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
