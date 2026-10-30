"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { IonIcon } from "@/components/ui";
import Link from "next/link";

const rolesData = [
  {
    id: "committee",
    label: "Managing Committee",
    icon: "shield-checkmark-outline",
    title: "Chairmen, Secretaries & Treasurers",
    badge: "Governance Engine",
    description:
      "Automate statutory compliance, eliminate paper cupboards, and approve resale NOCs digitally with verified committee quorum.",
    capabilities: [
      "Quorum sign-offs (2 of 3 required signatures)",
      "Zero lost AGM/EGM resolution files during elections",
      "Automatic maintenance dues clearance checks",
      "Model Bylaw No. 38 statutory compliance",
    ],
    mockHeading: "Executive Committee Console",
    mockSub: "Active Society: Royal Palms CHS • 216 Flats",
    metrics: [
      { label: "Pending NOCs", val: "2 Requiring Sign-Off", status: "Action Required", variant: "amber" },
      { label: "Quorum Status", val: "Secretary & Treasurer Ready", status: "2/3 Signed", variant: "indigo" },
      { label: "Audit Rating", val: "Grade 'A' Certified", status: "Compliant", variant: "emerald" },
    ],
    ctaText: "Register Your Committee",
    ctaHref: "/register",
  },
  {
    id: "resident",
    label: "Flat Owners & Residents",
    icon: "home-outline",
    title: "Apartment Owners & Tenants",
    badge: "Personal Vault",
    description:
      "A permanent, bank-ready digital vault for your flat's registered sale deeds, share certificates, and 1-click NOC applications.",
    capabilities: [
      "24/7 instant access to property deeds & tax receipts",
      "48-hour bank loan & resale NOC issuance",
      "Zero chasing committee members on WhatsApp",
      "Encrypted isolation between owner and tenant records",
    ],
    mockHeading: "Unit C-402 Personal Vault",
    mockSub: "Verified Owner: Priya Mehta • Wing C",
    metrics: [
      { label: "Indexed Records", val: "5 Verified Deeds & Tax Receipts", status: "Encrypted", variant: "indigo" },
      { label: "Share Certificate", val: "#SC-042 (Registered)", status: "Active Seal", variant: "emerald" },
      { label: "Maintenance", val: "₹0 Dues (Q4 Cleared)", status: "Paid", variant: "emerald" },
    ],
    ctaText: "Enroll Your Flat Unit",
    ctaHref: "/register",
  },
  {
    id: "auditor",
    label: "Auditors & Advocates",
    icon: "briefcase-outline",
    title: "Chartered Accountants & Legal Counsel",
    badge: "Compliance Room",
    description:
      "A dedicated, read-only digital audit room to inspect vouchers, bank reconciliation, and title conveyance records under Section 81.",
    capabilities: [
      "1-click export for annual statutory MCS audits",
      "Tamper-proof SHA-256 timestamped audit trail",
      "Certified Grade 'A' compliance readiness",
      "Instant title due diligence during flat resales",
    ],
    mockHeading: "Statutory Audit & Legal Desk",
    mockSub: "Firm: V. & Associates Chartered Accountants",
    metrics: [
      { label: "Section 81 Audit", val: "100% Vouchers Reconciled", status: "Audit Ready", variant: "emerald" },
      { label: "Conveyance Title", val: "Deemed Conveyance Deed Ready", status: "Verified", variant: "indigo" },
      { label: "Bylaw Amendments", val: "Special Resolution Logged", status: "Recorded", variant: "indigo" },
    ],
    ctaText: "Access Partner Portal",
    ctaHref: "/login",
  },
];

export function LandingRoles() {
  const [activeRoleId, setActiveRoleId] = useState("committee");
  const activeRole = rolesData.find((r) => r.id === activeRoleId) || rolesData[0];

  return (
    <section id="stakeholders" className="py-16 md:py-24 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Editorial Header */}
      <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] sm:text-xs font-bold tracking-widest uppercase mb-3 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-indigo-500" />
          <span>Tailored Workspaces</span>
        </div>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black font-heading uppercase tracking-tight text-slate-950 leading-tight">
          BUILT FOR EVERY HOUSING STAKEHOLDER
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 mt-2.5 font-normal leading-relaxed">
          Switch roles below to explore the dedicated interface engineered for your exact responsibilities.
        </p>
      </div>

      {/* Role Navigation Pills (Bright Light Theme) */}
      <div className="flex items-center justify-center mb-10 overflow-x-auto pb-2 scrollbar-none">
        <div className="flex items-center gap-2 p-1.5 bg-white rounded-full border border-slate-200/90 shadow-sm">
          {rolesData.map((role) => {
            const isActive = activeRoleId === role.id;
            return (
              <button
                key={role.id}
                type="button"
                onClick={() => setActiveRoleId(role.id)}
                className={`px-4 sm:px-6 py-2.5 rounded-full text-xs sm:text-sm font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/25"
                    : "text-slate-600 hover:text-slate-950 hover:bg-slate-50"
                }`}
              >
                <IonIcon name={role.icon} size={16} />
                <span>{role.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Dynamic Role Card with AnimatePresence (Bright & Attractive Light Design) */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeRole.id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.3 }}
          className="rounded-2xl sm:rounded-3xl p-6 sm:p-10 bg-gradient-to-br from-white via-indigo-50/20 to-sky-50/20 border-2 border-indigo-100 shadow-[0_20px_50px_-12px_rgba(99,102,241,0.12)] grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
        >
          {/* Left Column: Responsibilities and Powers */}
          <div className="lg:col-span-6 space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200 shadow-2xs">
                {activeRole.badge}
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-slate-950 font-heading uppercase tracking-tight">
              {activeRole.title}
            </h3>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
              {activeRole.description}
            </p>

            <div className="pt-2 border-t border-slate-200/70">
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3">
                Key Platform Capabilities:
              </p>
              <ul className="space-y-2 text-xs text-slate-700 font-medium">
                {activeRole.capabilities.map((cap, cIdx) => (
                  <li key={cIdx} className="flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <span>{cap}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-4">
              <Link href={activeRole.ctaHref}>
                <button
                  type="button"
                  className="px-6 py-3 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>{activeRole.ctaText}</span>
                  <IonIcon name="arrow-forward-outline" size={14} />
                </button>
              </Link>
            </div>
          </div>

          {/* Right Column: Sleek Simulated Dashboard Snippet (Bright Light Theme) */}
          <div className="lg:col-span-6 rounded-2xl bg-white text-slate-900 p-5 sm:p-6 border-2 border-indigo-100 space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="ml-2 text-xs font-bold text-slate-950 font-heading">
                  {activeRole.mockHeading}
                </span>
              </div>
              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 font-bold">
                Live Console
              </span>
            </div>

            <p className="text-xs text-slate-500 font-medium">{activeRole.mockSub}</p>

            <div className="space-y-2.5">
              {activeRole.metrics.map((m, mIdx) => (
                <div
                  key={mIdx}
                  className="p-3 rounded-xl bg-slate-50 hover:bg-indigo-50/30 border border-slate-200/80 flex items-center justify-between text-xs transition-colors"
                >
                  <span className="text-slate-500 font-medium">{m.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{m.val}</span>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {m.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 text-[10px] text-slate-400 flex items-center justify-between border-t border-slate-100">
              <span>Zero data leakage between tenant partitions</span>
              <span className="text-indigo-600 font-bold">AES-256 Vault OK</span>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
