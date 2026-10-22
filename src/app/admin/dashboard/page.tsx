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
} from "@/components/ui";

export default function SuperAdminDashboardPage() {
  return (
    <AppShell>
      <PageHeader
        title="Platform Super Admin Console"
        description="Global Multi-Tenant Cluster Management, Tenant Provisioning & Security Oversight"
        breadcrumbs={[
          { label: "Console", href: "/dashboard" },
          { label: "Super Admin", href: "/admin/dashboard" },
        ]}
        badge={
          <StatusBadge variant="hero" size="sm" dot pulse>
            Root Authority
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
              leftIcon="business-outline"
              onClick={() => alert("[Super Admin Action] Provision new housing society tenant cluster.")}
            >
              + Provision Society
            </AppButton>
          </div>
        }
      />

      {/* Super Admin Notice */}
      <div className="mb-6 p-4 rounded-2xl border border-indigo-200/90 bg-indigo-50/80 backdrop-blur-xs text-xs text-indigo-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <IconContainer name="shield-checkmark-outline" variant="hero-soft" size="sm" className="bg-white" />
          <div>
            <span className="font-bold">Multi-Tenant Root Partition:</span> Global tenant isolation engine
            enforcing database schema boundaries and Cloudflare R2 bucket segregation per society.
          </div>
        </div>
        <StatusBadge variant="hero" size="sm" dot pulse>
          Cluster: Active
        </StatusBadge>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Active Societies"
          value="48 CHS"
          subtitle="Mumbai & Pune Districts"
          iconName="business-outline"
          iconVariant="hero-soft"
          trend={{ value: "+6 this month", positive: true }}
        />
        <StatCard
          label="Provisioned Units"
          value="8,420 Flats"
          subtitle="99.4% Vault Enrolled"
          iconName="folder-open-outline"
          iconVariant="info"
        />
        <StatCard
          label="Pending Society Onboarding"
          value="3 Complexes"
          subtitle="Awaiting Bylaw Validation"
          iconName="time-outline"
          iconVariant="warning"
          badgeText="Queue"
          badgeVariant="warning"
        />
        <StatCard
          label="System Health"
          value="99.98%"
          subtitle="Turbopack + Next.js App Router"
          iconName="shield-checkmark-outline"
          iconVariant="neutral"
          badgeText="Healthy"
          badgeVariant="success"
        />
      </div>

      {/* Two Column Layout: Societies Cluster + Global Platform Ops */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 font-heading">
              Managed Cooperative Housing Societies
            </h2>
            <span className="text-xs text-slate-500 font-medium">Real-time Tenant Partition Monitor</span>
          </div>

          <div className="space-y-3">
            {[
              {
                id: "soc-greenwood",
                name: "Greenwood Residency CHS Ltd.",
                location: "Baner Road, Pune, MH",
                wings: "5 Wings (A-E)",
                units: "216 Units",
                status: "ACTIVE",
                storage: "14.2 GB",
              },
              {
                id: "soc-silveroak",
                name: "Silver Oak Heights Condominium",
                location: "Kothrud, Pune, MH",
                wings: "3 Wings (A-C)",
                units: "128 Units",
                status: "ACTIVE",
                storage: "8.6 GB",
              },
              {
                id: "soc-palmcrest",
                name: "Palm Crest Federation",
                location: "Powai, Mumbai, MH",
                wings: "8 Towers",
                units: "512 Units",
                status: "PROVISIONING",
                storage: "1.2 GB",
              },
            ].map((soc) => (
              <AppCard key={soc.id} className="p-5 glass-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-slate-200">
                <div className="flex items-start gap-3.5">
                  <IconContainer name="business-outline" variant="neutral" size="sm" />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900">{soc.name}</h3>
                      <StatusBadge
                        variant={soc.status === "ACTIVE" ? "success" : "warning"}
                        size="sm"
                      >
                        {soc.status}
                      </StatusBadge>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {soc.location} • {soc.wings} • {soc.units}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400 font-medium">Storage: {soc.storage}</span>
                  <AppButton
                    variant="outline"
                    size="sm"
                    onClick={() => alert(`[Super Admin] Inspecting tenant cluster ${soc.id}`)}
                  >
                    Tenant Config
                  </AppButton>
                </div>
              </AppCard>
            ))}
          </div>
        </div>

        {/* Global Security & Admin shortcuts */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 font-heading">
            Platform Security Controls
          </h2>

          <AppCard className="p-6 bg-white/90 backdrop-blur-md border border-slate-200/80 shadow-md space-y-4">
            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50 space-y-1">
                <span className="font-bold text-slate-900">Cloudflare R2 Storage Buckets</span>
                <p className="text-slate-500">
                  Encrypted server-side with AES-256. Zero cross-tenant URI leakage.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50 space-y-1">
                <span className="font-bold text-slate-900">Auth.js Session Security</span>
                <p className="text-slate-500">
                  JWT claims verification with MongoDB compound tenant indexing.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-2">
              <Link href="/admin" className="w-full block">
                <AppButton variant="outline" size="sm" className="w-full">
                  Domain Schema Inspector
                </AppButton>
              </Link>
              <Link href="/partner/dashboard" className="w-full block">
                <AppButton variant="secondary" size="sm" className="w-full">
                  Open Auditor Partner Desk
                </AppButton>
              </Link>
            </div>
          </AppCard>
        </div>
      </div>
    </AppShell>
  );
}
