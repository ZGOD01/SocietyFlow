"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  SectionHeading,
  AppCard,
  IconContainer,
  StatusBadge,
  AppButton,
  IonIcon,
} from "@/components/ui";
import Link from "next/link";

export function LandingFeatures() {
  const [activeTab, setActiveTab] = useState<"vault" | "library" | "approvals" | "records">("vault");

  const tabs = [
    { id: "vault" as const, label: "Personal Vault", icon: "folder-open-outline" },
    { id: "library" as const, label: "Society Library", icon: "library-outline" },
    { id: "approvals" as const, label: "Requests & Approvals", icon: "checkmark-done-circle-outline" },
    { id: "records" as const, label: "Ownership Registry", icon: "business-outline" },
  ];

  return (
    <section id="features" className="py-20 md:py-32 bg-slate-50/50 border-y border-slate-200/80 relative overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-indigo-500/5 blur-[100px] rounded-full pointer-events-none -z-10" />
      <div className="absolute bottom-0 right-10 w-80 h-80 bg-violet-500/5 blur-[90px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Core Architecture Pillars"
          title="Engineered for Modern Housing Societies"
          subtitle="Four purpose-built modules that unify personal property vaults, collective society archives, and statutory committee governance."
          align="center"
          className="mb-12"
        />

        {/* Feature Navigation Tabs */}
        <div className="flex items-center justify-center mb-14 overflow-x-auto pb-2 scrollbar-none">
          <div className="flex items-center gap-1.5 p-1.5 bg-white/90 backdrop-blur-md rounded-full border border-slate-200 shadow-sm">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative px-4 py-2 sm:px-5 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center gap-2 shrink-0 ${
                    isActive
                      ? "text-white"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeFeatureTab"
                      className="absolute inset-0 bg-gradient-to-r from-slate-900 to-indigo-950 rounded-full shadow-[0_2px_10px_rgba(15,23,42,0.18)]"
                      transition={{ type: "spring", stiffness: 450, damping: 32 }}
                    />
                  )}
                  <IonIcon
                    name={tab.icon}
                    size={16}
                    className={`relative z-10 transition-colors ${
                      isActive ? "text-indigo-300" : "text-slate-400"
                    }`}
                  />
                  <span className="relative z-10">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Detailed Feature View with AnimatePresence */}
        <AnimatePresence mode="wait">
          {activeTab === "vault" && (
            <motion.div
              key="vault"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3 }}
              id="vault"
              className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center"
            >
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-semibold">
                  <IonIcon name="folder-open-outline" size={16} />
                  <span>Resident Unit Isolation</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading leading-snug tracking-tight">
                  Personal Document Vault for Every Flat Owner
                </h3>
                <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
                  Every resident gets an encrypted, permanent repository for their
                  flat’s registered sale deeds, share certificates, possession letters,
                  property tax receipts, and police verification reports.
                </p>
                <ul className="space-y-3 text-sm text-slate-800">
                  <li className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                      <IonIcon name="checkmark" size={13} />
                    </div>
                    <span>Permanent version tracking for bank mortgage & resale NOCs</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                      <IonIcon name="checkmark" size={13} />
                    </div>
                    <span>Instant retrieval during property resale or legal due diligence</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                      <IonIcon name="checkmark" size={13} />
                    </div>
                    <span>Zero-trust permission isolation between flat owners and tenants</span>
                  </li>
                </ul>
                <div className="pt-2">
                  <Link href="/documents">
                    <AppButton variant="gradient" pill rightIcon="arrow-forward-outline">
                      Open Personal Vault Console
                    </AppButton>
                  </Link>
                </div>
              </div>

              <AppCard className="p-6 sm:p-8 glass-card space-y-4 shadow-[0_16px_36px_-6px_rgba(99,102,241,0.08)] border-slate-200">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <IconContainer name="shield-checkmark-outline" variant="hero-soft" size="sm" />
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Flat C-402 Vault</h4>
                      <p className="text-xs text-slate-500">Verified Owner: Priya Mehta</p>
                    </div>
                  </div>
                  <StatusBadge variant="success" size="sm" dot pulse>
                    Verified Ledger
                  </StatusBadge>
                </div>

                {/* Sample Document List */}
                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl border border-slate-200/80 bg-white hover:border-indigo-300 transition-colors flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                        <IonIcon name="document-text-outline" size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">Share_Certificate_C402.pdf</p>
                        <p className="text-[10px] text-slate-400">Issued 14 Jan 2024 • 1.8 MB</p>
                      </div>
                    </div>
                    <StatusBadge variant="success" size="sm">
                      Verified
                    </StatusBadge>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-200/80 bg-white hover:border-indigo-300 transition-colors flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                        <IonIcon name="document-text-outline" size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">Registered_Agreement_Sale.pdf</p>
                        <p className="text-[10px] text-slate-400">Indexed Haveli-II Sub-Registrar • 6.4 MB</p>
                      </div>
                    </div>
                    <StatusBadge variant="neutral" size="sm">
                      Archived
                    </StatusBadge>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-200/80 bg-white hover:border-indigo-300 transition-colors flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                        <IonIcon name="document-text-outline" size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">Bank_NOC_SBI_HomeLoans.pdf</p>
                        <p className="text-[10px] text-slate-400">Issued by Society Secretary • 420 KB</p>
                      </div>
                    </div>
                    <StatusBadge variant="info" size="sm">
                      Active NOC
                    </StatusBadge>
                  </div>
                </div>
              </AppCard>
            </motion.div>
          )}

          {activeTab === "library" && (
            <motion.div
              key="library"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center"
            >
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-semibold">
                  <IonIcon name="library-outline" size={16} />
                  <span>Central Governance Archive</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading leading-snug tracking-tight">
                  Society Document Library & Audit Trails
                </h3>
                <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
                  Eliminate lost paperwork and contested meeting minutes. Maintain a single,
                  searchable repository for AGM resolutions, audited balance sheets,
                  conveyance deeds, and municipal sanctions.
                </p>
                <ul className="space-y-3 text-sm text-slate-800">
                  <li className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                      <IonIcon name="checkmark" size={13} />
                    </div>
                    <span>Category-based indexing (Bylaws, Financials, Minutes, Sanctions)</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                      <IonIcon name="checkmark" size={13} />
                    </div>
                    <span>Audit-ready export for statutory Chartered Accountants</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                      <IonIcon name="checkmark" size={13} />
                    </div>
                    <span>Public resident notices vs confidential committee minutes</span>
                  </li>
                </ul>
                <div className="pt-2">
                  <Link href="/society-documents">
                    <AppButton variant="gradient" pill rightIcon="arrow-forward-outline">
                      Browse Society Library
                    </AppButton>
                  </Link>
                </div>
              </div>

              <AppCard className="p-6 sm:p-8 glass-card space-y-4 shadow-[0_16px_36px_-6px_rgba(99,102,241,0.08)] border-slate-200">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <h4 className="text-sm font-bold text-slate-900">Official Society Archives</h4>
                  <span className="text-xs text-slate-500 font-medium">Updated Yesterday</span>
                </div>
                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl border border-slate-200/80 bg-white hover:border-indigo-300 transition-colors flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-900">Society_Bylaws_Approved_2023.pdf</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">MCS Act 1960 Model Bylaws with Special Amendments</p>
                    </div>
                    <StatusBadge variant="hero" size="sm">Public</StatusBadge>
                  </div>
                  <div className="p-3.5 rounded-xl border border-slate-200/80 bg-white hover:border-indigo-300 transition-colors flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-900">Statutory_Audit_Report_FY24_25.pdf</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Grade &apos;A&apos; Certified by Auditor V. K. &amp; Co.</p>
                    </div>
                    <StatusBadge variant="success" size="sm">Audited</StatusBadge>
                  </div>
                  <div className="p-3.5 rounded-xl border border-slate-200/80 bg-white hover:border-indigo-300 transition-colors flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-900">AGM_Meeting_Minutes_Sept2024.pdf</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Resolutions Passed with 84% Member Quorum</p>
                    </div>
                    <StatusBadge variant="neutral" size="sm">Signed</StatusBadge>
                  </div>
                </div>
              </AppCard>
            </motion.div>
          )}

          {activeTab === "approvals" && (
            <motion.div
              key="approvals"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3 }}
              id="approvals"
              className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center"
            >
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-semibold">
                  <IonIcon name="checkmark-done-circle-outline" size={16} />
                  <span>Multi-Signer Workflow</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading leading-snug tracking-tight">
                  Streamlined Requests & Committee Approvals
                </h3>
                <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
                  Replace informal messaging with verifiable digital sign-offs.
                  Residents submit NOC, renovation, or tenant verification applications;
                  the Managing Committee reviews and digitally signs in minutes.
                </p>
                <ul className="space-y-3 text-sm text-slate-800">
                  <li className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                      <IonIcon name="checkmark" size={13} />
                    </div>
                    <span>Automated prerequisite checklists before submission</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                      <IonIcon name="checkmark" size={13} />
                    </div>
                    <span>Chairman, Secretary & Treasurer multi-step sign-offs</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                      <IonIcon name="checkmark" size={13} />
                    </div>
                    <span>Tamper-evident timestamped decision logs</span>
                  </li>
                </ul>
                <div className="pt-2">
                  <Link href="/requests">
                    <AppButton variant="gradient" pill rightIcon="arrow-forward-outline">
                      View Request Engine
                    </AppButton>
                  </Link>
                </div>
              </div>

              <AppCard className="p-6 sm:p-8 glass-card space-y-4 shadow-[0_16px_36px_-6px_rgba(99,102,241,0.08)] border-slate-200">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <h4 className="text-sm font-bold text-slate-900">Active Workflow Pipeline</h4>
                  <StatusBadge variant="warning" size="sm" dot pulse>
                    Requires Action
                  </StatusBadge>
                </div>
                <div className="space-y-3">
                  <div className="p-4 rounded-xl border border-slate-200/80 bg-white">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-slate-900">NOC for Property Sale (B-301)</span>
                      <StatusBadge variant="warning" size="sm">2/3 Signed</StatusBadge>
                    </div>
                    <p className="text-[11px] text-slate-500 mb-2.5">Buyer: Vikram Patil • Awaiting Secretary Sign-off</p>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-full w-2/3 rounded-full" />
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200/80 bg-white">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-900">Balcony Solar Panel Permission</span>
                      <StatusBadge variant="success" size="sm">Approved</StatusBadge>
                    </div>
                    <p className="text-[11px] text-slate-500">Flat A-104 • Approved by Managing Committee</p>
                  </div>
                </div>
              </AppCard>
            </motion.div>
          )}

          {activeTab === "records" && (
            <motion.div
              key="records"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center"
            >
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-semibold">
                  <IonIcon name="business-outline" size={16} />
                  <span>Roster & Share Registry</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading leading-snug tracking-tight">
                  Flats, Wings & Share Ownership Ledger
                </h3>
                <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
                  Maintain accurate, multi-tenant property rosters. Track carpet area,
                  active share certificate allocations, tenant leases, and nomination
                  forms with complete statutory compliance.
                </p>
                <ul className="space-y-3 text-sm text-slate-800">
                  <li className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                      <IonIcon name="checkmark" size={13} />
                    </div>
                    <span>Wing-wise structure (Wings A to E, 216 flats)</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                      <IonIcon name="checkmark" size={13} />
                    </div>
                    <span>Share certificate registry & serial numbering</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                      <IonIcon name="checkmark" size={13} />
                    </div>
                    <span>Nominee registration records (Form 14 / 15)</span>
                  </li>
                </ul>
                <div className="pt-2">
                  <Link href="/properties">
                    <AppButton variant="gradient" pill rightIcon="arrow-forward-outline">
                      Explore Property Ledger
                    </AppButton>
                  </Link>
                </div>
              </div>

              <AppCard className="p-6 sm:p-8 glass-card space-y-4 shadow-[0_16px_36px_-6px_rgba(99,102,241,0.08)] border-slate-200">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <h4 className="text-sm font-bold text-slate-900">Wing Master Snapshot</h4>
                  <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    100% Occupancy Tracked
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-4 rounded-xl border border-slate-200/80 bg-white">
                    <p className="text-slate-500">Total Units</p>
                    <p className="text-xl font-extrabold text-slate-900 font-heading mt-1">216 Flats</p>
                  </div>
                  <div className="p-4 rounded-xl border border-slate-200/80 bg-white">
                    <p className="text-slate-500">Wings</p>
                    <p className="text-xl font-extrabold text-slate-900 font-heading mt-1">5 (A, B, C, D, E)</p>
                  </div>
                  <div className="p-4 rounded-xl border border-slate-200/80 bg-white">
                    <p className="text-slate-500">Self-Occupied</p>
                    <p className="text-xl font-extrabold text-slate-900 font-heading mt-1">178 (82%)</p>
                  </div>
                  <div className="p-4 rounded-xl border border-slate-200/80 bg-white">
                    <p className="text-slate-500">Tenant Leased</p>
                    <p className="text-xl font-extrabold text-slate-900 font-heading mt-1">38 (18%)</p>
                  </div>
                </div>
              </AppCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
