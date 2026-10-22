"use client";

import React from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  AppButton,
  StatusBadge,
  IconContainer,
  IonIcon,
} from "@/components/ui";
import {
  containerStaggerVariants,
  itemFadeUpVariants,
  softSpringTransition,
} from "@/lib/animations";

export function LandingHero() {
  return (
    <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={containerStaggerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center text-center max-w-4xl mx-auto"
        >
          {/* Eyebrow Pill */}
          <motion.div variants={itemFadeUpVariants} className="mb-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EEF2FF] border border-[#C7D2FE] text-xs font-semibold text-[#4F46E5]">
              <span className="w-2 h-2 rounded-full bg-[#4F46E5] animate-pulse" />
              <span>Multi-Tenant Cooperative Society Architecture</span>
              <span className="text-[#9CA3AF]">|</span>
              <span className="text-[#1A1A1A]">Next.js Foundation</span>
            </div>
          </motion.div>

          {/* Main Hero Heading */}
          <motion.h1
            variants={itemFadeUpVariants}
            className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-[#1A1A1A] font-heading leading-[1.08]"
          >
            Your Society. <br className="hidden sm:inline" />
            <span className="text-[#4F46E5]">Every Document.</span> <br className="hidden sm:inline" />
            One Place.
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={itemFadeUpVariants}
            className="mt-6 text-lg sm:text-xl text-[#6B7280] max-w-2xl font-normal leading-relaxed"
          >
            Replace chaotic paper files, missing share certificates, and WhatsApp
            approval threads with a tamper-resistant digital vault, structured NOC
            workflows, and auditable flat ownership records.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            variants={itemFadeUpVariants}
            className="mt-8 flex flex-col sm:flex-row items-center gap-3.5 w-full sm:w-auto"
          >
            <Link href="/dashboard" className="w-full sm:w-auto">
              <AppButton
                variant="hero"
                size="lg"
                pill
                rightIcon="arrow-forward-outline"
                className="w-full sm:w-auto shadow-[0_2px_8px_rgba(79,70,229,0.25)]"
              >
                Access Prototype Console
              </AppButton>
            </Link>
            <Link href="#how-it-works" className="w-full sm:w-auto">
              <AppButton
                variant="outline"
                size="lg"
                pill
                leftIcon="cube-outline"
                className="w-full sm:w-auto"
              >
                Explore Governance Engine
              </AppButton>
            </Link>
          </motion.div>

          {/* Highlights Ribbon */}
          <motion.div
            variants={itemFadeUpVariants}
            className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-[#6B7280]"
          >
            <span className="flex items-center gap-1.5 font-medium">
              <IonIcon name="checkmark-circle" className="text-[#10B981]" size={16} />
              Bank-Ready Share Certificates
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <IonIcon name="checkmark-circle" className="text-[#10B981]" size={16} />
              Auditable Committee Approvals
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <IonIcon name="checkmark-circle" className="text-[#10B981]" size={16} />
              Multi-Tenant Society Isolation
            </span>
          </motion.div>
        </motion.div>

        {/* Live Interactive Hero Mockup Card */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...softSpringTransition, delay: 0.3 }}
          className="mt-14 max-w-5xl mx-auto"
        >
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-[0_4px_20px_rgba(0,0,0,0.06)] overflow-hidden">
            {/* Window Top Bar */}
            <div className="bg-[#F8F9FA] px-5 py-3 border-b border-[#E5E7EB] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#E5E7EB]" />
                <span className="w-3 h-3 rounded-full bg-[#E5E7EB]" />
                <span className="w-3 h-3 rounded-full bg-[#E5E7EB]" />
                <span className="ml-3 text-xs font-semibold text-[#6B7280]">
                  Greenwood Heights Co-op Housing Society Ltd. • ID: SF-MH-411007
                </span>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge variant="success" size="sm" dot>
                  Live Tenant Node
                </StatusBadge>
              </div>
            </div>

            {/* Dashboard Mock Grid */}
            <div className="p-6 sm:p-8 bg-white grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Card 1: Vault Overview */}
              <div className="p-5 rounded-xl border border-[#E5E7EB] bg-[#F8F9FA]/50 flex flex-col justify-between gap-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">
                      Society Vault
                    </span>
                    <h3 className="text-xl font-bold text-[#1A1A1A] mt-1 font-heading">
                      1,482 Documents
                    </h3>
                  </div>
                  <IconContainer name="library-outline" variant="hero-soft" size="md" />
                </div>
                <div className="space-y-2 pt-2 border-t border-[#E5E7EB]">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#6B7280]">Indexed Bylaws & Minutes</span>
                    <span className="font-semibold text-[#1A1A1A]">240 files</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[#6B7280]">Share Certificates</span>
                    <span className="font-semibold text-[#1A1A1A]">100% Verified</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Active Approvals */}
              <div className="p-5 rounded-xl border border-[#E5E7EB] bg-[#F8F9FA]/50 flex flex-col justify-between gap-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">
                      Workflow Pipeline
                    </span>
                    <h3 className="text-xl font-bold text-[#1A1A1A] mt-1 font-heading">
                      14 Pending Reviews
                    </h3>
                  </div>
                  <IconContainer name="checkmark-done-circle-outline" variant="warning" size="md" />
                </div>
                <div className="space-y-2 pt-2 border-t border-[#E5E7EB]">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#6B7280]">Flat Transfer NOCs</span>
                    <span className="font-semibold text-[#F59E0B]">3 Urgent</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[#6B7280]">Average Committee Turnaround</span>
                    <span className="font-semibold text-[#10B981]">2.4 Days</span>
                  </div>
                </div>
              </div>

              {/* Card 3: Ownership Ledger */}
              <div className="p-5 rounded-xl border border-[#E5E7EB] bg-[#F8F9FA]/50 flex flex-col justify-between gap-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">
                      Registry Ledger
                    </span>
                    <h3 className="text-xl font-bold text-[#1A1A1A] mt-1 font-heading">
                      216 Units (5 Wings)
                    </h3>
                  </div>
                  <IconContainer name="business-outline" variant="info" size="md" />
                </div>
                <div className="space-y-2 pt-2 border-t border-[#E5E7EB]">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#6B7280]">Rented Occupancy</span>
                    <span className="font-semibold text-[#1A1A1A]">38 Units</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[#6B7280]">Statutory Audit Readiness</span>
                    <span className="font-semibold text-[#10B981]">Complete</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
