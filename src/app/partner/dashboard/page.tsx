"use client";

import React from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import {
  PageHeader,
  StatCard,
  AppCard,
  StatusBadge,
  IconContainer,
  AppButton,
  IonIcon,
} from "@/components/ui";

export default function PartnerDashboardPage() {
  return (
    <AppShell>
      <PageHeader
        title="Statutory Auditor & Legal Partner Desk"
        description="Assigned Housing Society Audits, Financial Verification, & Cooperative Act Compliance"
        breadcrumbs={[
          { label: "Console", href: "/dashboard" },
          { label: "Partner Desk", href: "/partner/dashboard" },
        ]}
        badge={
          <StatusBadge variant="info" size="sm" dot pulse>
            Empanelled Auditor
          </StatusBadge>
        }
        actions={
          <div className="flex items-center gap-2.5">
            <Link href="/">
              <AppButton variant="outline" size="sm" leftIcon="home-outline">
                Visit Website
              </AppButton>
            </Link>
            <AppButton
              variant="gradient"
              size="sm"
              leftIcon="document-text-outline"
              onClick={() => alert("[Audit Signoff] Generate Statutory Audit Report Form 1.")}
            >
              Issue Audit Certificate
            </AppButton>
          </div>
        }
      />

      {/* Auditor Notice Banner */}
      <div className="mb-6 p-4 rounded-2xl border border-sky-200/90 bg-sky-50/80 backdrop-blur-xs text-xs text-sky-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <IconContainer name="briefcase-outline" variant="info" size="sm" className="bg-white" />
          <div>
            <span className="font-bold">Maharashtra Cooperative Societies Act Panel Verification:</span> Access
            granted to statutory books, voucher attachments, and member share ledgers for empanelled audits.
          </div>
        </div>
        <StatusBadge variant="info" size="sm">
          Firm: V. &amp; Associates CA
        </StatusBadge>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Assigned Societies"
          value="6 Societies"
          subtitle="FY 2024-25 Mandates"
          iconName="business-outline"
          iconVariant="hero-soft"
        />
        <StatCard
          label="Vouchers Audited"
          value="1,248 Records"
          subtitle="All Expenses Digitized"
          iconName="folder-open-outline"
          iconVariant="info"
        />
        <StatCard
          label="Audit Exceptions"
          value="0 Major"
          subtitle="2 Minor Queries Logged"
          iconName="alert-circle-outline"
          iconVariant="warning"
          badgeText="Clean"
          badgeVariant="success"
        />
        <StatCard
          label="Filing Deadline"
          value="15 Days Left"
          subtitle="Form 1 & Form 28 Due"
          iconName="time-outline"
          iconVariant="warning"
          badgeText="Active"
          badgeVariant="warning"
        />
      </div>

      {/* Two Column Layout: Assigned Society Audits + Statutory Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 font-heading">
              Current Society Audit Mandates
            </h2>
            <span className="text-xs text-slate-500 font-medium">Real-time Financial Verification</span>
          </div>

          <div className="space-y-3">
            {[
              {
                id: "audit-1",
                society: "Greenwood Residency CHS Ltd.",
                code: "MH-PNA-14902-2019",
                units: "216 Units",
                status: "AUDIT_IN_PROGRESS",
                progress: "92% Verified",
                badgeVariant: "warning" as const,
              },
              {
                id: "audit-2",
                society: "Silver Oak Heights Condominium",
                code: "MH-PNA-28311-2021",
                units: "128 Units",
                status: "VERIFIED_COMPLIANT",
                progress: "100% Complete",
                badgeVariant: "success" as const,
              },
              {
                id: "audit-3",
                society: "Blue Haven CHS Ltd.",
                code: "MH-PNA-31002-2022",
                units: "84 Units",
                status: "AWAITING_BANK_RECON",
                progress: "45% Verified",
                badgeVariant: "info" as const,
              },
            ].map((item) => (
              <AppCard key={item.id} className="p-5 glass-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-slate-200">
                <div className="flex items-start gap-3.5">
                  <IconContainer name="library-outline" variant="neutral" size="sm" />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900">{item.society}</h3>
                      <StatusBadge variant={item.badgeVariant} size="sm">
                        {item.progress}
                      </StatusBadge>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Reg ID: {item.code} • {item.units}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <AppButton
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      alert(`[Auditor Desk] Opening financial ledger and bank vouchers for ${item.society}.`)
                    }
                  >
                    Inspect Ledger
                  </AppButton>
                  <AppButton
                    variant="gradient"
                    size="sm"
                    onClick={() =>
                      alert(`[Auditor Desk] Generating statutory audit sign-off for ${item.society}.`)
                    }
                  >
                    Sign Certificate
                  </AppButton>
                </div>
              </AppCard>
            ))}
          </div>
        </div>

        {/* Audit Compliance Checklist */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 font-heading">
            Statutory Audit Checklist
          </h2>

          <AppCard className="p-6 bg-white/90 backdrop-blur-md border border-slate-200/80 shadow-md space-y-3.5 text-xs">
            <div className="flex items-center gap-2.5 text-emerald-700 font-semibold">
              <IonIcon name="checkmark-circle" size={17} className="text-emerald-500" />
              <span>Bank Statements Reconciled</span>
            </div>
            <div className="flex items-center gap-2.5 text-emerald-700 font-semibold">
              <IonIcon name="checkmark-circle" size={17} className="text-emerald-500" />
              <span>Share Register & Transfer Log Verified</span>
            </div>
            <div className="flex items-center gap-2.5 text-emerald-700 font-semibold">
              <IonIcon name="checkmark-circle" size={17} className="text-emerald-500" />
              <span>Sinking Fund & Reserve Investment Valid</span>
            </div>
            <div className="flex items-center gap-2.5 text-amber-700 font-semibold">
              <IonIcon name="alert-circle-outline" size={17} className="text-amber-500" />
              <span>Voucher Receipts for Water Tank Repair</span>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <Link href="/society-documents" className="w-full block">
                <AppButton variant="outline" size="sm" className="w-full">
                  Access Society Documents
                </AppButton>
              </Link>
            </div>
          </AppCard>
        </div>
      </div>
    </AppShell>
  );
}
