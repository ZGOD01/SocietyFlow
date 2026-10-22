"use client";

import React, { useState } from "react";
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

type CommitteePosition = "SECRETARY" | "CHAIRMAN" | "TREASURER" | "SOCIETY_MANAGER";

export default function ManagementDashboardPage() {
  const [activePosition, setActivePosition] = useState<CommitteePosition>("SECRETARY");

  return (
    <AppShell>
      {/* Page Header */}
      <PageHeader
        title="Managing Committee Console"
        description="Greenwood Residency CHS Ltd. • Statutory Committee Administration & Compliance Engine"
        breadcrumbs={[
          { label: "Console", href: "/dashboard" },
          { label: "Management", href: "/management/dashboard" },
        ]}
        badge={
          <StatusBadge variant="hero" size="sm" dot pulse>
            Committee Verified
          </StatusBadge>
        }
        actions={
          <div className="flex items-center gap-2.5">
            <Link href="/">
              <AppButton variant="outline" size="sm" leftIcon="home-outline">
                Visit Website
              </AppButton>
            </Link>
            <Link href="/approvals">
              <AppButton variant="gradient" size="sm" leftIcon="checkmark-done-circle-outline">
                Pending Approvals (4)
              </AppButton>
            </Link>
          </div>
        }
      />

      {/* Position Selector Preview Ribbon */}
      <div className="mb-6 p-4 rounded-2xl border border-indigo-200/90 bg-indigo-50/80 backdrop-blur-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-2xs">
        <div className="flex items-center gap-2.5">
          <IconContainer name="shield-checkmark-outline" variant="hero-soft" size="sm" className="bg-white" />
          <div>
            <span className="font-bold text-slate-900">Committee Position Sandbox:</span> Currently previewing
            statutory authority as <strong className="text-indigo-700">{activePosition}</strong>.
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {(
            [
              { id: "SECRETARY", label: "Secretary" },
              { id: "CHAIRMAN", label: "Chairman" },
              { id: "TREASURER", label: "Treasurer" },
              { id: "SOCIETY_MANAGER", label: "Manager" },
            ] as const
          ).map((pos) => (
            <button
              key={pos.id}
              type="button"
              onClick={() => setActivePosition(pos.id)}
              className={`px-3.5 py-1 rounded-full font-bold transition-all cursor-pointer ${
                activePosition === pos.id
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:text-slate-900"
              }`}
            >
              {pos.label}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Pending Approvals"
          value="4 Requests"
          subtitle="2 Resale NOCs, 2 Renovations"
          iconName="checkmark-done-circle-outline"
          iconVariant="warning"
          badgeText="Action Req."
          badgeVariant="warning"
        />
        <StatCard
          label="Verification Queue"
          value="3 Enrollees"
          subtitle="2 Unit Owners, 1 Tenant"
          iconName="people-outline"
          iconVariant="info"
          badgeText="Pending"
          badgeVariant="info"
        />
        <StatCard
          label="Registered Units"
          value="216 Units"
          subtitle="178 Owner, 38 Rented"
          iconName="business-outline"
          iconVariant="neutral"
        />
        <StatCard
          label="Statutory Audit"
          value="100% Ready"
          subtitle="FY 2024-25 Compliance"
          iconName="shield-checkmark-outline"
          iconVariant="hero-soft"
          badgeText="Compliant"
          badgeVariant="success"
        />
      </div>

      {/* Two Column Layout: Verification Queue + Committee Workflow */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Left Column (2 spans): Verification Queue & Member Onboarding */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 font-heading">
                Member Verification & Flat Onboarding Queue
              </h2>
              <p className="text-xs text-slate-500">
                Zero-Trust Verification: Review legal titles before granting vault access
              </p>
            </div>
            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full">
              3 Pending Review
            </span>
          </div>

          <div className="space-y-3">
            {/* Queue Item 1 */}
            <AppCard className="p-5 glass-card flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-slate-200">
              <div className="flex items-start gap-3.5">
                <IconContainer name="home-outline" variant="hero-soft" size="md" />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">
                      Anand K. Deshmukh
                    </h3>
                    <StatusBadge variant="neutral" size="sm">
                      Owner Applicant
                    </StatusBadge>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    Unit: Wing C • Flat 301 • Sale Deed Uploaded (Ref: 2024/0912)
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Submitted: 2 days ago • Match: 100% with Share Certificate Registry
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <AppButton
                  variant="outline"
                  size="sm"
                  onClick={() => alert("[Audit Detail] Inspecting deed for Unit C-301.")}
                >
                  Inspect Deed
                </AppButton>
                <AppButton
                  variant="gradient"
                  size="sm"
                  onClick={() =>
                    alert("[Committee Action] Approved Unit C-301. Vault provisioned.")
                  }
                >
                  Approve Title
                </AppButton>
              </div>
            </AppCard>

            {/* Queue Item 2 */}
            <AppCard className="p-5 glass-card flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-slate-200">
              <div className="flex items-start gap-3.5">
                <IconContainer name="key-outline" variant="info" size="md" />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">
                      Sunita Rao
                    </h3>
                    <StatusBadge variant="info" size="sm">
                      Tenant Applicant
                    </StatusBadge>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    Unit: Wing A • Flat 104 • Landlord: Vijay Rao (Confirmed)
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Police Verification: Cleared • Tenancy Period: 11 Months
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <AppButton
                  variant="outline"
                  size="sm"
                  onClick={() => alert("[Audit Detail] Inspecting police slip for Unit A-104.")}
                >
                  Verify Police Slip
                </AppButton>
                <AppButton
                  variant="gradient"
                  size="sm"
                  onClick={() =>
                    alert("[Committee Action] Tenant Sunita Rao confirmed. Move-in pass issued.")
                  }
                >
                  Authorize Tenant
                </AppButton>
              </div>
            </AppCard>

            {/* Queue Item 3 */}
            <AppCard className="p-5 glass-card flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-slate-200">
              <div className="flex items-start gap-3.5">
                <IconContainer name="home-outline" variant="warning" size="md" />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">
                      Deepak Vernekar
                    </h3>
                    <StatusBadge variant="warning" size="sm">
                      Co-Owner Application
                    </StatusBadge>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    Unit: Wing E • Flat 502 • Gift Deed Transmission
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Nomination Form 14 missing • Requires Secretary Review
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <AppButton
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    alert("[Committee Query] Notice sent to applicant requesting Form 14.")
                  }
                >
                  Request Form 14
                </AppButton>
              </div>
            </AppCard>
          </div>
        </div>

        {/* Right Column (1 span): Statutory Committee Governance Box */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 font-heading">
            Committee Action Desk
          </h2>

          <AppCard className="p-6 bg-white/90 backdrop-blur-md border border-slate-200/80 shadow-md space-y-4">
            <div className="space-y-3">
              <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">Digital Sign-off Waiting</span>
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                </div>
                <p className="text-[11px] text-slate-600">
                  Resale NOC for Flat C-402 (Priya Mehta → Vikram Patil).
                  Awaiting Chairman signature.
                </p>
                <div className="pt-2 flex justify-end">
                  <AppButton
                    variant="gradient"
                    size="sm"
                    onClick={() =>
                      alert("[Digital Signoff] Append DSC / Committee Digital Signature.")
                    }
                  >
                    Append Signature
                  </AppButton>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">Upcoming Committee Meeting</span>
                  <IonIcon name="time-outline" size={14} className="text-slate-500" />
                </div>
                <p className="text-[11px] text-slate-600">
                  Monthly Managing Committee Meeting #13 scheduled for 25th of this month.
                </p>
                <div className="pt-1 flex items-center justify-between text-[11px] text-indigo-600 font-semibold">
                  <span>Draft Agenda: 6 items</span>
                  <Link href="/society-documents" className="hover:underline">
                    View Draft Minutes →
                  </Link>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              <Link href="/society-documents" className="w-full">
                <AppButton variant="outline" size="sm" className="w-full" leftIcon="library-outline">
                  Manage Society Document Vault
                </AppButton>
              </Link>
              <Link href="/admin" className="w-full">
                <AppButton variant="secondary" size="sm" className="w-full" leftIcon="settings-outline">
                  Society Configurations
                </AppButton>
              </Link>
            </div>
          </AppCard>

          <AppCard className="p-5 bg-slate-50/80 border border-slate-200/80 text-xs text-slate-600 space-y-1.5">
            <div className="flex items-center gap-2 text-slate-900 font-bold">
              <IconContainer name="shield-outline" variant="neutral" size="sm" />
              <span>Section 73 Statutory Compliance</span>
            </div>
            <p className="leading-relaxed">
              Managing committee resolutions, NOC issuance, and flat transfer registers are archived
              with immutable audit trails compliant with cooperative society appellate standards.
            </p>
          </AppCard>
        </div>
      </div>
    </AppShell>
  );
}
