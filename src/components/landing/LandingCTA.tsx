"use client";

import React from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { AppButton, IonIcon } from "@/components/ui";

export function LandingCTA() {
  return (
    <section className="py-20 md:py-28 bg-white border-t border-slate-200 relative overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-8 sm:p-14 lg:p-16 text-center text-white shadow-[0_24px_60px_-12px_rgba(15,23,42,0.35)] overflow-hidden border border-slate-800"
        >
          {/* Luminous Glow Orbs inside CTA */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/20 blur-[80px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-violet-500/20 blur-[80px] rounded-full pointer-events-none" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 text-indigo-300 text-xs font-semibold mb-6 border border-white/10 backdrop-blur-md">
              <IonIcon name="sparkles-outline" size={15} />
              <span>Cooperative Society Digital Revolution</span>
            </div>

            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold font-heading tracking-tight mb-3 text-white">
              Ready to Modernize Your Housing Society?
            </h2>

            <p className="text-sm sm:text-base lg:text-lg text-slate-300 max-w-2xl mx-auto mb-8 font-normal leading-relaxed">
              Step directly into the interactive SocietyFlow platform. Explore verified document vaults,
              automated NOC committee approvals, and transparent ownership ledgers.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register" className="w-full sm:w-auto">
                <AppButton
                  variant="gradient"
                  size="lg"
                  pill
                  rightIcon="arrow-forward-outline"
                  className="w-full sm:w-auto shadow-[0_0_30px_rgba(99,102,241,0.4)]"
                >
                  Get Started with SocietyFlow
                </AppButton>
              </Link>
              <Link href="/login" className="w-full sm:w-auto">
                <AppButton
                  variant="outline"
                  size="lg"
                  pill
                  leftIcon="lock-closed-outline"
                  className="w-full sm:w-auto bg-white/10 text-white border-white/20 hover:bg-white/20 hover:text-white"
                >
                  Sign In to Your Account
                </AppButton>
              </Link>
            </div>

            <div className="mt-10 pt-8 border-t border-white/10 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 font-medium">
              <span>Next.js 16 App Router</span>
              <span>•</span>
              <span>Tailwind CSS</span>
              <span>•</span>
              <span>TypeScript Strict</span>
              <span>•</span>
              <span>Multi-Tenant Isolated</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
