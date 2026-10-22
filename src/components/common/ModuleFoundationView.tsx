import React from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  PageHeader,
  AppCard,
  StatusBadge,
  IconContainer,
  AppButton,
} from "@/components/ui";
import Link from "next/link";

export interface ModuleFoundationViewProps {
  moduleName: string;
  routePath: string;
  iconName: string;
  summary: string;
  targetMilestone: string;
  architecturalComponents: string[];
  plannedIntegrations: string[];
  demoStats?: { label: string; value: string }[];
  children?: React.ReactNode;
}

export function ModuleFoundationView({
  moduleName,
  routePath,
  iconName,
  summary,
  targetMilestone,
  architecturalComponents,
  plannedIntegrations,
  demoStats,
  children,
}: ModuleFoundationViewProps) {
  return (
    <AppShell>
      <PageHeader
        title={moduleName}
        description={summary}
        breadcrumbs={[
          { label: "Console", href: "/dashboard" },
          { label: moduleName },
        ]}
        badge={
          <StatusBadge variant="info" size="sm" dot>
            {targetMilestone}
          </StatusBadge>
        }
        actions={
          <div className="flex items-center gap-2">
            <Link href="/dashboard">
              <AppButton variant="outline" size="sm" leftIcon="grid-outline">
                Back to Overview
              </AppButton>
            </Link>
          </div>
        }
      />

      {/* Architecture & Foundation Alert Notice */}
      <div className="mb-6 p-4 rounded-xl border border-[#C7D2FE] bg-[#EEF2FF]/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-[#4F46E5]">
        <div className="flex items-center gap-2.5">
          <IconContainer
            name="information-circle-outline"
            variant="hero-soft"
            size="sm"
          />
          <div>
            <span className="font-bold">Module Foundation Initialized:</span> Route{" "}
            <code className="bg-white/80 px-1.5 py-0.5 rounded text-[#1A1A1A] font-mono">
              {routePath}
            </code>{" "}
            is prepared with strict TypeScript domain contracts. Backend integration scheduled for future milestones.
          </div>
        </div>
        <StatusBadge variant="hero" size="sm">
          Strict Scaffold
        </StatusBadge>
      </div>

      {/* Stat Cards if provided */}
      {demoStats && demoStats.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {demoStats.map((stat, i) => (
            <AppCard key={i} className="p-4 bg-white border-[#E5E7EB]">
              <span className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">
                {stat.label}
              </span>
              <p className="text-xl font-extrabold text-[#1A1A1A] font-heading mt-1">
                {stat.value}
              </p>
            </AppCard>
          ))}
        </div>
      )}

      {/* Main children or default architectural spec */}
      {children ? (
        children
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Architectural Specs */}
          <AppCard className="p-6 bg-white border-[#E5E7EB] space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-[#F1F3F5]">
              <IconContainer name={iconName} variant="hero-soft" size="sm" />
              <div>
                <h3 className="text-sm font-bold text-[#1A1A1A]">
                  Domain Architecture Components
                </h3>
                <p className="text-xs text-[#6B7280]">
                  Pre-configured contracts and validation schemas
                </p>
              </div>
            </div>

            <ul className="space-y-2.5 text-xs text-[#1A1A1A]">
              {architecturalComponents.map((comp, idx) => (
                <li
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-[#F8F9FA] border border-[#E5E7EB]"
                >
                  <span className="font-mono text-[#4F46E5]">{comp}</span>
                  <StatusBadge variant="neutral" size="sm">
                    Defined
                  </StatusBadge>
                </li>
              ))}
            </ul>
          </AppCard>

          {/* Planned Integrations */}
          <AppCard className="p-6 bg-white border-[#E5E7EB] space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-[#F1F3F5]">
              <IconContainer name="shield-outline" variant="neutral" size="sm" />
              <div>
                <h3 className="text-sm font-bold text-[#1A1A1A]">
                  Scheduled Stack Integrations
                </h3>
                <p className="text-xs text-[#6B7280]">
                  Target infrastructure & protocol alignment
                </p>
              </div>
            </div>

            <ul className="space-y-2.5 text-xs text-[#1A1A1A]">
              {plannedIntegrations.map((integ, idx) => (
                <li
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-[#F8F9FA] border border-[#E5E7EB]"
                >
                  <span className="font-medium text-[#1A1A1A]">{integ}</span>
                  <StatusBadge variant="info" size="sm">
                    Pending Next Step
                  </StatusBadge>
                </li>
              ))}
            </ul>
          </AppCard>
        </div>
      )}
    </AppShell>
  );
}
