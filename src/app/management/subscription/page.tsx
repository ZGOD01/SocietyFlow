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

interface SubscriptionData {
  subscription: {
    _id?: string;
    status: string;
    billingInterval: string;
    startDate: string;
    renewalDate: string;
    isDemo: boolean;
  } | null;
  plan: {
    code: string;
    name: string;
    tagline: string;
    priceMonthly: number;
    priceAnnual: number;
    maxFlats: number;
    storageAllowanceGb: number;
    maxManagementAccounts: number;
    allowedWorkflowTypes?: string[];
    notificationChannels?: string[];
    reportingFeatures?: string[];
    supportLevel?: string;
    isDemonstrationOnly: boolean;
  };
  usage: {
    flats: {
      current: number;
      limit: number;
      percentage: number;
    };
    storage: {
      currentBytes: number;
      currentMb: number;
      currentGb: number;
      limitGb: number;
      percentage: number;
    };
    managementAccounts: {
      current: number;
      limit: number;
      percentage: number;
    };
  };
}

export default function SocietySubscriptionManagementPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [selectedPlanCode, setSelectedPlanCode] = useState("PROFESSIONAL");
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/subscriptions/current");
      const resData = await res.json();
      if (res.ok) {
        setData(resData);
        setSelectedPlanCode(resData.plan?.code || "PROFESSIONAL");
      }
    } catch (err) {
      console.error("Error loading subscription:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, []);

  const handlePlanChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpgradeLoading(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/subscriptions/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planCode: selectedPlanCode,
          notes: "Updated from Society Management Subscription console.",
        }),
      });

      const resJson = await res.json();
      if (!res.ok) throw new Error(resJson.error || "Failed to change subscription plan");

      setFeedback({ type: "success", text: resJson.message });
      fetchSubscription();
      setTimeout(() => {
        setIsUpgradeModalOpen(false);
        setFeedback(null);
      }, 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error upgrading plan";
      setFeedback({ type: "error", text: msg });
    } finally {
      setUpgradeLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-xs">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#EEF2FF] text-[#4F46E5] border border-[#C7D2FE]">
                Management Console
              </span>
              <span className="text-xs text-[#6B7280]">Prompt 10 Module</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-[#1A1A1A] font-heading">
              Society Subscription &amp; Quotas
            </h1>
            <p className="text-xs md:text-sm text-[#6B7280] mt-1 max-w-2xl">
              Inspect current SaaS plan, actual unit usage, digital document vault storage allowances, and manage demonstration plan tiers.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/pricing">
              <AppButton variant="outline" size="sm" leftIcon="list-outline">
                View Pricing Matrix
              </AppButton>
            </Link>
            <AppButton
              variant="hero"
              size="sm"
              leftIcon="arrow-up-circle-outline"
              onClick={() => setIsUpgradeModalOpen(true)}
            >
              Change Demo Plan
            </AppButton>
          </div>
        </div>

        {/* Prototype Notice */}
        <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-xl p-4 text-xs text-[#92400E] flex items-start gap-3">
          <IonIcon name="information-circle-outline" size={20} className="shrink-0 text-[#D97706] mt-0.5" />
          <div className="leading-relaxed">
            <strong>Demonstration Mode:</strong> All usage quotas, storage caps, and subscription tiers are fully operational internal demo records. No commercial billing or financial transactions are triggered.
          </div>
        </div>

        {loading || !data ? (
          <div className="p-12 text-center text-xs text-[#6B7280]">
            <IonIcon name="sync-outline" size={24} className="animate-spin text-[#4F46E5] mx-auto mb-2" />
            <p>Loading society subscription and usage metrics...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Active Plan Card */}
            <AppCard className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#F1F3F5]">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center font-bold text-lg">
                    <IonIcon name="ribbon-outline" size={26} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-[#1A1A1A] font-heading">
                        {data.plan.name}
                      </h2>
                      <StatusBadge variant="success" size="sm">
                        {data.subscription?.status || "ACTIVE"}
                      </StatusBadge>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#92400E]">
                        Demo Tier
                      </span>
                    </div>
                    <p className="text-xs text-[#6B7280] mt-0.5">{data.plan.tagline}</p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-bold text-[#1A1A1A]">
                    ₹{data.plan.priceMonthly.toLocaleString("en-IN")} / month
                  </div>
                  <p className="text-[10px] text-[#9CA3AF]">
                    Renewal Date:{" "}
                    {new Date(data.subscription?.renewalDate || Date.now() + 31536000000).toLocaleDateString(
                      "en-IN",
                      { day: "numeric", month: "short", year: "numeric" }
                    )}
                  </p>
                </div>
              </div>

              {/* Usage Gauges Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
                {/* Flat Quota Gauge */}
                <div className="p-4 rounded-xl bg-[#F8F9FA] border border-[#E5E7EB] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#1A1A1A]">Registered Units</span>
                    <span className="text-xs font-bold text-[#4F46E5]">
                      {data.usage.flats.current} / {data.usage.flats.limit} Units
                    </span>
                  </div>
                  <div className="w-full bg-[#E5E7EB] h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-[#4F46E5] h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, data.usage.flats.percentage)}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-[#6B7280]">
                    {data.usage.flats.percentage}% of plan allowance allocated from live Flat records.
                  </p>
                </div>

                {/* Storage Allowance Gauge */}
                <div className="p-4 rounded-xl bg-[#F8F9FA] border border-[#E5E7EB] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#1A1A1A]">Vault Storage</span>
                    <span className="text-xs font-bold text-[#10B981]">
                      {data.usage.storage.currentMb} MB / {data.usage.storage.limitGb} GB
                    </span>
                  </div>
                  <div className="w-full bg-[#E5E7EB] h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-[#10B981] h-full rounded-full transition-all"
                      style={{ width: `${Math.max(2, Math.min(100, data.usage.storage.percentage))}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-[#6B7280]">
                    Cloudflare R2 private bucket storage for sale deeds, share certs &amp; NOCs.
                  </p>
                </div>

                {/* Committee Accounts Gauge */}
                <div className="p-4 rounded-xl bg-[#F8F9FA] border border-[#E5E7EB] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#1A1A1A]">Managing Committee Seats</span>
                    <span className="text-xs font-bold text-[#F59E0B]">
                      {data.usage.managementAccounts.current} / {data.usage.managementAccounts.limit} Seats
                    </span>
                  </div>
                  <div className="w-full bg-[#E5E7EB] h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-[#F59E0B] h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, data.usage.managementAccounts.percentage)}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-[#6B7280]">
                    Active Secretary, Chairman, Treasurer, and Manager logins.
                  </p>
                </div>
              </div>
            </AppCard>

            {/* Included Capabilities Matrix */}
            <AppCard className="p-6">
              <h3 className="text-sm font-bold text-[#1A1A1A] font-heading pb-3 mb-4 border-b border-[#F1F3F5]">
                Plan Features Included in {data.plan.name}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-[#F8F9FA] border border-[#E5E7EB] flex items-center gap-2.5">
                  <IonIcon name="checkmark-circle" size={18} className="text-[#10B981] shrink-0" />
                  <div>
                    <p className="font-bold text-[#1A1A1A]">Notification Channels</p>
                    <p className="text-[11px] text-[#6B7280]">
                      {data.plan.notificationChannels?.join(", ") || "In-App, Email"}
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#F8F9FA] border border-[#E5E7EB] flex items-center gap-2.5">
                  <IonIcon name="checkmark-circle" size={18} className="text-[#10B981] shrink-0" />
                  <div>
                    <p className="font-bold text-[#1A1A1A]">Allowed Workflows</p>
                    <p className="text-[11px] text-[#6B7280]">
                      {data.plan.allowedWorkflowTypes?.length || 4} Multi-Stage Workflow Templates
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#F8F9FA] border border-[#E5E7EB] flex items-center gap-2.5">
                  <IonIcon name="checkmark-circle" size={18} className="text-[#10B981] shrink-0" />
                  <div>
                    <p className="font-bold text-[#1A1A1A]">Support Level</p>
                    <p className="text-[11px] text-[#6B7280]">
                      {data.plan.supportLevel?.replace(/_/g, " ") || "Standard Email"}
                    </p>
                  </div>
                </div>
              </div>
            </AppCard>
          </div>
        )}

        {/* Change Demo Plan Modal */}
        <Modal
          isOpen={isUpgradeModalOpen}
          onClose={() => {
            if (!upgradeLoading) setIsUpgradeModalOpen(false);
          }}
          title="Change Society Demo Plan Tier"
        >
          <form onSubmit={handlePlanChange} className="space-y-4 text-xs">
            {feedback && (
              <div
                className={`p-3 rounded-xl ${
                  feedback.type === "success"
                    ? "bg-[#ECFDF5] border border-[#A7F3D0] text-[#047857]"
                    : "bg-[#FEF2F2] border border-[#FCA5A5] text-[#B91C1C]"
                }`}
              >
                {feedback.text}
              </div>
            )}

            <p className="text-[#6B7280] leading-relaxed">
              Select any tier to adjust your society&apos;s quotas and capabilities in the database.
            </p>

            <div className="space-y-2">
              {[
                { code: "DEMO", label: "Free Sandbox (25 Flats, 1 GB)" },
                { code: "STARTER", label: "Cooperative Starter (100 Flats, 5 GB)" },
                { code: "PROFESSIONAL", label: "Gated Community Pro (350 Flats, 25 GB)" },
                { code: "ENTERPRISE", label: "Large Township & Apex (2000 Flats, 100 GB)" },
              ].map((p) => (
                <label
                  key={p.code}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    selectedPlanCode === p.code
                      ? "bg-[#EEF2FF] border-[#4F46E5] text-[#1A1A1A]"
                      : "bg-white border-[#E5E7EB] text-[#6B7280]"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <input
                      type="radio"
                      name="planChoice"
                      value={p.code}
                      checked={selectedPlanCode === p.code}
                      onChange={() => setSelectedPlanCode(p.code)}
                      className="accent-[#4F46E5]"
                    />
                    <span className="font-bold">{p.label}</span>
                  </div>
                  {p.code === "PROFESSIONAL" && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#4F46E5] text-white">
                      Recommended
                    </span>
                  )}
                </label>
              ))}
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <AppButton
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsUpgradeModalOpen(false)}
                disabled={upgradeLoading}
              >
                Cancel
              </AppButton>
              <AppButton type="submit" variant="hero" size="sm" isLoading={upgradeLoading}>
                Confirm Plan Update
              </AppButton>
            </div>
          </form>
        </Modal>
      </div>
    </AppShell>
  );
}
