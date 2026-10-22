"use client";

import React, { useState } from "react";
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

  return (
    <section id="features" className="py-20 md:py-28 bg-[#F8F9FA] border-y border-[#E5E7EB]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Core Pillars"
          title="Engineered for Modern Housing Societies"
          subtitle="Four purpose-built modules that unify personal property vaults, collective society archives, and statutory committee governance."
          align="center"
          className="mb-14"
        />

        {/* Feature Navigation Tabs */}
        <div className="flex items-center justify-center gap-2 mb-12 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveTab("vault")}
            className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
              activeTab === "vault"
                ? "bg-[#1A1A1A] text-white shadow-sm"
                : "bg-white text-[#6B7280] border border-[#E5E7EB] hover:text-[#1A1A1A]"
            }`}
          >
            Personal Vault
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("library")}
            className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
              activeTab === "library"
                ? "bg-[#1A1A1A] text-white shadow-sm"
                : "bg-white text-[#6B7280] border border-[#E5E7EB] hover:text-[#1A1A1A]"
            }`}
          >
            Society Library
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("approvals")}
            className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
              activeTab === "approvals"
                ? "bg-[#1A1A1A] text-white shadow-sm"
                : "bg-white text-[#6B7280] border border-[#E5E7EB] hover:text-[#1A1A1A]"
            }`}
          >
            Requests & Approvals
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("records")}
            className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
              activeTab === "records"
                ? "bg-[#1A1A1A] text-white shadow-sm"
                : "bg-white text-[#6B7280] border border-[#E5E7EB] hover:text-[#1A1A1A]"
            }`}
          >
            Flat & Ownership Records
          </button>
        </div>

        {/* Dynamic Detailed Feature View */}
        {activeTab === "vault" && (
          <div id="vault" className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EEF2FF] text-[#4F46E5] text-xs font-semibold">
                <IonIcon name="folder-open-outline" size={16} />
                <span>Resident Unit Isolation</span>
              </div>
              <h3 className="text-3xl font-extrabold text-[#1A1A1A] font-heading leading-tight">
                Personal Document Vault for Every Flat Owner
              </h3>
              <p className="text-[#6B7280] leading-relaxed">
                Every resident gets an encrypted, permanent repository for their
                flat’s registered sale deeds, share certificates, possession letters,
                property tax receipts, and police verification reports.
              </p>
              <ul className="space-y-3 text-sm text-[#1A1A1A]">
                <li className="flex items-center gap-2.5">
                  <IonIcon name="checkmark" className="text-[#10B981] font-bold" size={18} />
                  <span>Permanent version tracking for home loan NOCs</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <IonIcon name="checkmark" className="text-[#10B981] font-bold" size={18} />
                  <span>Instant retrieval during property resale or mortgage</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <IonIcon name="checkmark" className="text-[#10B981] font-bold" size={18} />
                  <span>Owner and tenant privilege isolation</span>
                </li>
              </ul>
              <Link href="/documents">
                <AppButton variant="hero" pill rightIcon="arrow-forward-outline">
                  Open Personal Vault Console
                </AppButton>
              </Link>
            </div>

            <AppCard className="p-6 bg-white border-[#E5E7EB] space-y-4 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-[#F1F3F5]">
                <div className="flex items-center gap-3">
                  <IconContainer name="shield-checkmark-outline" variant="hero-soft" size="sm" />
                  <div>
                    <h4 className="text-sm font-bold text-[#1A1A1A]">Flat C-402 Vault</h4>
                    <p className="text-[11px] text-[#6B7280]">Owner: Priya Mehta</p>
                  </div>
                </div>
                <StatusBadge variant="success" size="sm" dot>
                  Verified Ledger
                </StatusBadge>
              </div>

              {/* Sample Document List */}
              <div className="space-y-2.5">
                <div className="p-3 rounded-xl border border-[#E5E7EB] bg-[#F8F9FA] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <IonIcon name="document-text-outline" size={20} className="text-[#4F46E5]" />
                    <div>
                      <p className="text-xs font-bold text-[#1A1A1A]">Share_Certificate_C402.pdf</p>
                      <p className="text-[10px] text-[#9CA3AF]">Issued 14 Jan 2024 • 1.8 MB</p>
                    </div>
                  </div>
                  <StatusBadge variant="success" size="sm">
                    Verified
                  </StatusBadge>
                </div>

                <div className="p-3 rounded-xl border border-[#E5E7EB] bg-[#F8F9FA] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <IonIcon name="document-text-outline" size={20} className="text-[#4F46E5]" />
                    <div>
                      <p className="text-xs font-bold text-[#1A1A1A]">Registered_Agreement_Sale.pdf</p>
                      <p className="text-[10px] text-[#9CA3AF]">Indexed Haveli-II Sub-Registrar • 6.4 MB</p>
                    </div>
                  </div>
                  <StatusBadge variant="neutral" size="sm">
                    Archived
                  </StatusBadge>
                </div>

                <div className="p-3 rounded-xl border border-[#E5E7EB] bg-[#F8F9FA] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <IonIcon name="document-text-outline" size={20} className="text-[#4F46E5]" />
                    <div>
                      <p className="text-xs font-bold text-[#1A1A1A]">Bank_NOC_SBI_HomeLoans.pdf</p>
                      <p className="text-[10px] text-[#9CA3AF]">Issued by Society Secretary • 420 KB</p>
                    </div>
                  </div>
                  <StatusBadge variant="info" size="sm">
                    Active NOC
                  </StatusBadge>
                </div>
              </div>
            </AppCard>
          </div>
        )}

        {activeTab === "library" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EEF2FF] text-[#4F46E5] text-xs font-semibold">
                <IonIcon name="library-outline" size={16} />
                <span>Central Governance Archive</span>
              </div>
              <h3 className="text-3xl font-extrabold text-[#1A1A1A] font-heading leading-tight">
                Society Document Library & Audit Trails
              </h3>
              <p className="text-[#6B7280] leading-relaxed">
                Eliminate lost paperwork and contested minutes. Maintain a single,
                searchable repository for AGM/EGM resolutions, audited balance sheets,
                conveyance deeds, and municipal sanctions.
              </p>
              <ul className="space-y-3 text-sm text-[#1A1A1A]">
                <li className="flex items-center gap-2.5">
                  <IonIcon name="checkmark" className="text-[#10B981] font-bold" size={18} />
                  <span>Category-based indexing (Bylaws, Financials, Minutes)</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <IonIcon name="checkmark" className="text-[#10B981] font-bold" size={18} />
                  <span>Audit-ready export for statutory Chartered Accountants</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <IonIcon name="checkmark" className="text-[#10B981] font-bold" size={18} />
                  <span>Public vs Committee-confidential access controls</span>
                </li>
              </ul>
              <Link href="/society-documents">
                <AppButton variant="hero" pill rightIcon="arrow-forward-outline">
                  Browse Society Library
                </AppButton>
              </Link>
            </div>

            <AppCard className="p-6 bg-white border-[#E5E7EB] space-y-4 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-[#F1F3F5]">
                <h4 className="text-sm font-bold text-[#1A1A1A]">Official Society Archives</h4>
                <span className="text-xs text-[#6B7280]">Updated Yesterday</span>
              </div>
              <div className="space-y-2.5">
                <div className="p-3 rounded-xl border border-[#E5E7EB] bg-[#F8F9FA] flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-[#1A1A1A]">Society_Bylaws_Approved_2023.pdf</p>
                    <p className="text-[10px] text-[#6B7280]">MCS Act 1960 Model Bylaws with Special Amendments</p>
                  </div>
                  <StatusBadge variant="hero" size="sm">Public</StatusBadge>
                </div>
                <div className="p-3 rounded-xl border border-[#E5E7EB] bg-[#F8F9FA] flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-[#1A1A1A]">Statutory_Audit_Report_FY24_25.pdf</p>
                    <p className="text-[10px] text-[#6B7280]">Grade &apos;A&apos; Certified by Auditor V. K. &amp; Co.</p>
                  </div>
                  <StatusBadge variant="success" size="sm">Audited</StatusBadge>
                </div>
                <div className="p-3 rounded-xl border border-[#E5E7EB] bg-[#F8F9FA] flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-[#1A1A1A]">AGM_Meeting_Minutes_Sept2024.pdf</p>
                    <p className="text-[10px] text-[#6B7280]">Resolutions Passed with 84% Member Quorum</p>
                  </div>
                  <StatusBadge variant="neutral" size="sm">Signed</StatusBadge>
                </div>
              </div>
            </AppCard>
          </div>
        )}

        {activeTab === "approvals" && (
          <div id="approvals" className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EEF2FF] text-[#4F46E5] text-xs font-semibold">
                <IonIcon name="checkmark-done-circle-outline" size={16} />
                <span>Multi-Signer Workflow</span>
              </div>
              <h3 className="text-3xl font-extrabold text-[#1A1A1A] font-heading leading-tight">
                Streamlined Requests & Committee Approvals
              </h3>
              <p className="text-[#6B7280] leading-relaxed">
                Replace informal messaging with verifiable digital sign-offs.
                Residents submit NOC, renovation, or tenant verification applications;
                the Managing Committee reviews and digitally signs in minutes.
              </p>
              <ul className="space-y-3 text-sm text-[#1A1A1A]">
                <li className="flex items-center gap-2.5">
                  <IonIcon name="checkmark" className="text-[#10B981] font-bold" size={18} />
                  <span>Automated prerequisite checklists before submission</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <IonIcon name="checkmark" className="text-[#10B981] font-bold" size={18} />
                  <span>Chairman, Secretary & Treasurer multi-step sign-offs</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <IonIcon name="checkmark" className="text-[#10B981] font-bold" size={18} />
                  <span>Tamper-evident timestamped decision logs</span>
                </li>
              </ul>
              <Link href="/requests">
                <AppButton variant="hero" pill rightIcon="arrow-forward-outline">
                  View Request Engine
                </AppButton>
              </Link>
            </div>

            <AppCard className="p-6 bg-white border-[#E5E7EB] space-y-4 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-[#F1F3F5]">
                <h4 className="text-sm font-bold text-[#1A1A1A]">Active Workflow Pipeline</h4>
                <StatusBadge variant="warning" size="sm" dot>
                  Requires Action
                </StatusBadge>
              </div>
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl border border-[#E5E7EB] bg-white">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-[#1A1A1A]">NOC for Property Sale (B-301)</span>
                    <StatusBadge variant="warning" size="sm">2/3 Signed</StatusBadge>
                  </div>
                  <p className="text-[11px] text-[#6B7280] mb-2">Buyer: Vikram Patil • Awaiting Secretary Sign-off</p>
                  <div className="w-full bg-[#E5E7EB] h-1.5 rounded-full overflow-hidden">
                    <div className="bg-[#4F46E5] h-full w-2/3" />
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-[#E5E7EB] bg-white">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-[#1A1A1A]">Balcony Solar Panel Permission</span>
                    <StatusBadge variant="success" size="sm">Approved</StatusBadge>
                  </div>
                  <p className="text-[11px] text-[#6B7280]">Flat A-104 • Approved by Managing Committee</p>
                </div>
              </div>
            </AppCard>
          </div>
        )}

        {activeTab === "records" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EEF2FF] text-[#4F46E5] text-xs font-semibold">
                <IonIcon name="business-outline" size={16} />
                <span>Roster & Share Registry</span>
              </div>
              <h3 className="text-3xl font-extrabold text-[#1A1A1A] font-heading leading-tight">
                Flats, Wings & Share Ownership Ledger
              </h3>
              <p className="text-[#6B7280] leading-relaxed">
                Maintain accurate, multi-tenant property rosters. Track carpet area,
                active share certificate allocations, tenant leases, and nomination
                forms with complete statutory compliance.
              </p>
              <ul className="space-y-3 text-sm text-[#1A1A1A]">
                <li className="flex items-center gap-2.5">
                  <IonIcon name="checkmark" className="text-[#10B981] font-bold" size={18} />
                  <span>Wing-wise structure (Wings A to F, 216 flats)</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <IonIcon name="checkmark" className="text-[#10B981] font-bold" size={18} />
                  <span>Share certificate registry & serial numbering</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <IonIcon name="checkmark" className="text-[#10B981] font-bold" size={18} />
                  <span>Nominee registration records (Form 14 / 15)</span>
                </li>
              </ul>
              <Link href="/properties">
                <AppButton variant="hero" pill rightIcon="arrow-forward-outline">
                  Explore Property Ledger
                </AppButton>
              </Link>
            </div>

            <AppCard className="p-6 bg-white border-[#E5E7EB] space-y-4 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-[#F1F3F5]">
                <h4 className="text-sm font-bold text-[#1A1A1A]">Wing Master Snapshot</h4>
                <span className="text-xs font-semibold text-[#10B981]">100% Occupancy Tracked</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl border border-[#E5E7EB] bg-[#F8F9FA]">
                  <p className="text-[#6B7280]">Total Units</p>
                  <p className="text-lg font-bold text-[#1A1A1A] font-heading">216 Flats</p>
                </div>
                <div className="p-3 rounded-xl border border-[#E5E7EB] bg-[#F8F9FA]">
                  <p className="text-[#6B7280]">Wings</p>
                  <p className="text-lg font-bold text-[#1A1A1A] font-heading">5 (A, B, C, D, E)</p>
                </div>
                <div className="p-3 rounded-xl border border-[#E5E7EB] bg-[#F8F9FA]">
                  <p className="text-[#6B7280]">Self-Occupied</p>
                  <p className="text-lg font-bold text-[#1A1A1A] font-heading">178 (82%)</p>
                </div>
                <div className="p-3 rounded-xl border border-[#E5E7EB] bg-[#F8F9FA]">
                  <p className="text-[#6B7280]">Tenant Leased</p>
                  <p className="text-lg font-bold text-[#1A1A1A] font-heading">38 (18%)</p>
                </div>
              </div>
            </AppCard>
          </div>
        )}
      </div>
    </section>
  );
}
