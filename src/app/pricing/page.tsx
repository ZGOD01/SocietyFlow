"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import {
  AppCard,
  AppButton,
  StatusBadge,
  Modal,
  IonIcon,
} from "@/components/ui";

interface Plan {
  _id?: string;
  code: string;
  name: string;
  tagline: string;
  priceMonthly: number;
  priceAnnual: number;
  maxFlats: number;
  storageAllowanceGb: number;
  maxManagementAccounts: number;
  allowedWorkflowTypes: string[];
  notificationChannels: string[];
  reportingFeatures: string[];
  supportLevel: string;
  isPopular?: boolean;
}

export default function PricingPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [billingInterval, setBillingInterval] = useState<"MONTHLY" | "ANNUAL">("ANNUAL");
  const [selectedPlanForDemo, setSelectedPlanForDemo] = useState<Plan | null>(null);
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignFeedback, setAssignFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/subscriptions/plans")
      .then((r) => r.json())
      .then((d) => {
        if (d.plans) setPlans(d.plans);
      })
      .catch((err) => console.error("Error loading plans:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleAssignDemoPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanForDemo) return;

    setAssignLoading(true);
    setAssignFeedback(null);

    try {
      const res = await fetch("/api/subscriptions/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planCode: selectedPlanForDemo.code,
          notes: `Activated ${selectedPlanForDemo.name} from Pricing Portal.`,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to activate plan");

      setAssignFeedback({ type: "success", text: data.message });
      setTimeout(() => {
        setSelectedPlanForDemo(null);
        setAssignFeedback(null);
      }, 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error activating plan";
      setAssignFeedback({ type: "error", text: msg });
    } finally {
      setAssignLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-8 max-w-7xl mx-auto py-2">
        {/* Header Hero */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EEF2FF] text-[#4F46E5] text-xs font-bold border border-[#C7D2FE]">
            <IonIcon name="sparkles-outline" size={14} />
            <span>SaaS Subscription Architecture</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-[#1A1A1A] font-heading tracking-tight">
            Transparent Cooperative Governance Plans
          </h1>
          <p className="text-sm text-[#6B7280] leading-relaxed">
            Tailored subscription tiers engineered for cooperative housing societies, gated townships, and apex clusters. Includes multi-signatory SLAs, document vaults, and multi-channel notifications.
          </p>

          {/* Prototype Illustrative Notice (Section 8 Requirement) */}
          <div className="inline-block bg-[#FFFBEB] border border-[#FDE68A] text-[#92400E] px-4 py-2 rounded-xl text-xs font-medium">
            <strong>Demonstration Notice:</strong> All subscription tiers and pricing models shown below are illustrative sample configurations for prototype demonstration. No actual monetary payments are processed.
          </div>
        </div>

        {/* Monthly / Annual Billing Toggle */}
        <div className="flex justify-center items-center gap-3">
          <span className={`text-xs font-bold ${billingInterval === "MONTHLY" ? "text-[#1A1A1A]" : "text-[#6B7280]"}`}>
            Billed Monthly
          </span>
          <button
            type="button"
            onClick={() => setBillingInterval(billingInterval === "MONTHLY" ? "ANNUAL" : "MONTHLY")}
            className="w-12 h-6 rounded-full bg-[#1A1A1A] p-0.5 relative transition-colors cursor-pointer"
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                billingInterval === "ANNUAL" ? "translate-x-6" : "translate-x-0"
              }`}
            />
          </button>
          <span className={`text-xs font-bold flex items-center gap-1.5 ${billingInterval === "ANNUAL" ? "text-[#1A1A1A]" : "text-[#6B7280]"}`}>
            <span>Billed Annually</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0]">
              Save 20%
            </span>
          </span>
        </div>

        {/* Pricing Cards Grid */}
        {loading ? (
          <div className="p-12 text-center text-xs text-[#6B7280]">
            <IonIcon name="sync-outline" size={24} className="animate-spin text-[#4F46E5] mx-auto mb-2" />
            <p>Loading subscription tiers...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan) => {
              const price = billingInterval === "ANNUAL" ? Math.round(plan.priceAnnual / 12) : plan.priceMonthly;
              const isPopular = !!plan.isPopular;

              return (
                <AppCard
                  key={plan.code}
                  className={`p-6 flex flex-col justify-between relative transition-all ${
                    isPopular
                      ? "border-2 border-[#4F46E5] shadow-md bg-white"
                      : "border border-[#E5E7EB] bg-white hover:border-[#D1D5DB]"
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-[#4F46E5] text-white shadow-xs">
                        Most Popular
                      </span>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-bold text-[#1A1A1A] font-heading">{plan.name}</h3>
                      <p className="text-xs text-[#6B7280] mt-1 min-h-[32px]">{plan.tagline}</p>
                    </div>

                    <div className="pt-2 pb-3 border-y border-[#F1F3F5]">
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl md:text-3xl font-extrabold text-[#1A1A1A] font-heading">
                          ₹{price.toLocaleString("en-IN")}
                        </span>
                        <span className="text-xs text-[#6B7280]">/ society / month</span>
                      </div>
                      <span className="text-[10px] text-[#9CA3AF]">
                        {billingInterval === "ANNUAL"
                          ? `₹${plan.priceAnnual.toLocaleString("en-IN")} billed annually (Illustrative)`
                          : "Billed monthly (Illustrative)"}
                      </span>
                    </div>

                    {/* Features checklist */}
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center gap-2 text-[#1A1A1A]">
                        <IonIcon name="checkmark-circle" size={16} className="text-[#10B981] shrink-0" />
                        <span>Up to <strong>{plan.maxFlats}</strong> Flats</span>
                      </div>
                      <div className="flex items-center gap-2 text-[#1A1A1A]">
                        <IonIcon name="checkmark-circle" size={16} className="text-[#10B981] shrink-0" />
                        <span><strong>{plan.storageAllowanceGb} GB</strong> Encrypted Vault</span>
                      </div>
                      <div className="flex items-center gap-2 text-[#1A1A1A]">
                        <IonIcon name="checkmark-circle" size={16} className="text-[#10B981] shrink-0" />
                        <span><strong>{plan.maxManagementAccounts}</strong> Committee Logins</span>
                      </div>
                      <div className="flex items-center gap-2 text-[#1A1A1A]">
                        <IonIcon name="checkmark-circle" size={16} className="text-[#10B981] shrink-0" />
                        <span>
                          {plan.allowedWorkflowTypes.length} Configurable Workflows
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[#1A1A1A]">
                        <IonIcon name="checkmark-circle" size={16} className="text-[#10B981] shrink-0" />
                        <span>{plan.notificationChannels.join(" & ")} Alerts</span>
                      </div>
                      <div className="flex items-center gap-2 text-[#1A1A1A]">
                        <IonIcon name="checkmark-circle" size={16} className="text-[#10B981] shrink-0" />
                        <span>{plan.supportLevel.replace(/_/g, " ")} Support</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 mt-4 border-t border-[#F1F3F5]">
                    <AppButton
                      variant={isPopular ? "hero" : "outline"}
                      size="md"
                      className="w-full justify-center"
                      onClick={() => setSelectedPlanForDemo(plan)}
                    >
                      {plan.code === "DEMO" ? "Select Free Sandbox" : "Activate Demo Plan"}
                    </AppButton>
                  </div>
                </AppCard>
              );
            })}
          </div>
        )}

        {/* Feature Comparison Table */}
        <AppCard className="p-6">
          <h3 className="text-base font-bold text-[#1A1A1A] font-heading mb-4 pb-3 border-b border-[#F1F3F5]">
            Comprehensive Plan Feature Matrix
          </h3>

          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E5E7EB] text-[#6B7280]">
                  <th className="py-2.5 font-bold">Feature Capability</th>
                  <th className="py-2.5 font-bold text-center">Free Sandbox</th>
                  <th className="py-2.5 font-bold text-center">Starter</th>
                  <th className="py-2.5 font-bold text-center">Professional</th>
                  <th className="py-2.5 font-bold text-center">Enterprise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F3F5]">
                <tr>
                  <td className="py-3 font-semibold text-[#1A1A1A]">Resident Self-Onboarding &amp; Title Verification</td>
                  <td className="py-3 text-center text-[#10B981]">✓</td>
                  <td className="py-3 text-center text-[#10B981]">✓</td>
                  <td className="py-3 text-center text-[#10B981]">✓</td>
                  <td className="py-3 text-center text-[#10B981]">✓</td>
                </tr>
                <tr>
                  <td className="py-3 font-semibold text-[#1A1A1A]">Dual-Signatory Tenant Authorization</td>
                  <td className="py-3 text-center text-[#10B981]">✓</td>
                  <td className="py-3 text-center text-[#10B981]">✓</td>
                  <td className="py-3 text-center text-[#10B981]">✓</td>
                  <td className="py-3 text-center text-[#10B981]">✓</td>
                </tr>
                <tr>
                  <td className="py-3 font-semibold text-[#1A1A1A]">Cloudflare R2 Digital Document Vault</td>
                  <td className="py-3 text-center">1 GB</td>
                  <td className="py-3 text-center">5 GB</td>
                  <td className="py-3 text-center">25 GB</td>
                  <td className="py-3 text-center">100 GB</td>
                </tr>
                <tr>
                  <td className="py-3 font-semibold text-[#1A1A1A]">Property Ownership Transfer Module</td>
                  <td className="py-3 text-center text-[#9CA3AF]">—</td>
                  <td className="py-3 text-center text-[#10B981]">✓</td>
                  <td className="py-3 text-center text-[#10B981]">✓</td>
                  <td className="py-3 text-center text-[#10B981]">✓</td>
                </tr>
                <tr>
                  <td className="py-3 font-semibold text-[#1A1A1A]">Multi-Signatory SLAs &amp; Remote Approvals</td>
                  <td className="py-3 text-center text-[#9CA3AF]">—</td>
                  <td className="py-3 text-center text-[#9CA3AF]">—</td>
                  <td className="py-3 text-center text-[#10B981]">✓</td>
                  <td className="py-3 text-center text-[#10B981]">✓</td>
                </tr>
                <tr>
                  <td className="py-3 font-semibold text-[#1A1A1A]">WhatsApp Notifications (Meta Test Mode)</td>
                  <td className="py-3 text-center text-[#9CA3AF]">—</td>
                  <td className="py-3 text-center text-[#9CA3AF]">—</td>
                  <td className="py-3 text-center text-[#10B981]">✓</td>
                  <td className="py-3 text-center text-[#10B981]">✓</td>
                </tr>
                <tr>
                  <td className="py-3 font-semibold text-[#1A1A1A]">Automated SLA Reminder Cron &amp; Escalation</td>
                  <td className="py-3 text-center text-[#9CA3AF]">—</td>
                  <td className="py-3 text-center text-[#9CA3AF]">—</td>
                  <td className="py-3 text-center text-[#10B981]">✓</td>
                  <td className="py-3 text-center text-[#10B981]">✓</td>
                </tr>
              </tbody>
            </table>
          </div>
        </AppCard>

        {/* Demo Activation Modal */}
        <Modal
          isOpen={!!selectedPlanForDemo}
          onClose={() => {
            if (!assignLoading) setSelectedPlanForDemo(null);
          }}
          title={`Activate ${selectedPlanForDemo?.name || "Plan"} (Demonstration)`}
        >
          <form onSubmit={handleAssignDemoPlan} className="space-y-4 text-xs">
            {assignFeedback && (
              <div
                className={`p-3 rounded-xl ${
                  assignFeedback.type === "success"
                    ? "bg-[#ECFDF5] border border-[#A7F3D0] text-[#047857]"
                    : "bg-[#FEF2F2] border border-[#FCA5A5] text-[#B91C1C]"
                }`}
              >
                {assignFeedback.text}
              </div>
            )}

            <div className="p-3 bg-[#EEF2FF] border border-[#C7D2FE] rounded-xl text-[#4F46E5] leading-relaxed">
              <strong>Demonstration Assignment:</strong> Activating this plan will configure your active society with the quotas and features of the <strong>{selectedPlanForDemo?.name}</strong> tier in MongoDB. No payment or billing credentials are required.
            </div>

            <div className="space-y-2 py-2 border-y border-[#E5E7EB]">
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Plan Tier:</span>
                <span className="font-bold text-[#1A1A1A]">{selectedPlanForDemo?.name} ({selectedPlanForDemo?.code})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Flats Quota:</span>
                <span className="font-bold text-[#1A1A1A]">{selectedPlanForDemo?.maxFlats} Units</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Vault Allowance:</span>
                <span className="font-bold text-[#1A1A1A]">{selectedPlanForDemo?.storageAllowanceGb} GB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Illustrative Rate:</span>
                <span className="font-bold text-[#1A1A1A]">₹{selectedPlanForDemo?.priceMonthly}/month (Demo Only)</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <AppButton
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelectedPlanForDemo(null)}
                disabled={assignLoading}
              >
                Cancel
              </AppButton>
              <AppButton type="submit" variant="hero" size="sm" isLoading={assignLoading}>
                Confirm Demo Plan Activation
              </AppButton>
            </div>
          </form>
        </Modal>
      </div>
    </AppShell>
  );
}
