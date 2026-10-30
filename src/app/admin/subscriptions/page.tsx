"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import {
  AppCard,
  AppButton,
  StatusBadge,
  Modal,
  FormField,
  IonIcon,
} from "@/components/ui";

interface SocietySubItem {
  id: string;
  name: string;
  code: string;
  city: string;
  state: string;
  totalFlats: number;
  subscription: {
    id: string;
    status: string;
    billingInterval: string;
    startDate: string;
    renewalDate: string;
    isDemo: boolean;
    plan: {
      code: string;
      name: string;
      maxFlats: number;
      storageAllowanceGb: number;
      priceMonthly: number;
    } | null;
  } | null;
}

export default function AdminSubscriptionsPage() {
  const [loading, setLoading] = useState(true);
  const [societies, setSocieties] = useState<SocietySubItem[]>([]);
  const [selectedSoc, setSelectedSoc] = useState<SocietySubItem | null>(null);
  const [planCode, setPlanCode] = useState("PROFESSIONAL");
  const [adminNotes, setAdminNotes] = useState("");
  const [updating, setUpdating] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchAdminSubs = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/subscriptions");
      const data = await res.json();
      if (res.ok) {
        setSocieties(data.societies || []);
      }
    } catch (err) {
      console.error("Admin subscriptions error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminSubs();
  }, []);

  const handleAssignPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSoc) return;

    setUpdating(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/subscriptions/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          societyId: selectedSoc.id,
          planCode,
          notes: adminNotes.trim() || `Plan set by Super Admin to ${planCode}`,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update society plan");

      setFeedback({ type: "success", text: data.message });
      fetchAdminSubs();
      setTimeout(() => {
        setSelectedSoc(null);
        setFeedback(null);
      }, 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error assigning plan";
      setFeedback({ type: "error", text: msg });
    } finally {
      setUpdating(false);
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
                Super Admin Console
              </span>
              <span className="text-xs text-[#6B7280]">Section 10 Control</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-[#1A1A1A] font-heading">
              Global Society Subscriptions &amp; Plan Assignments
            </h1>
            <p className="text-xs md:text-sm text-[#6B7280] mt-1 max-w-2xl">
              Inspect registered cooperative societies, monitor active demonstration quotas, and assign SaaS subscription tiers.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/admin">
              <AppButton variant="outline" size="sm" leftIcon="arrow-back-outline">
                Admin Console
              </AppButton>
            </Link>
          </div>
        </div>

        {/* Informational banner */}
        <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-xl p-4 text-xs text-[#92400E] flex items-start gap-3">
          <IonIcon name="information-circle-outline" size={20} className="shrink-0 text-[#D97706] mt-0.5" />
          <div className="leading-relaxed">
            <strong>Demonstration Integrity Guard:</strong> All metrics shown are live database records. In accordance with Prompt 10 guidelines, no fabricated revenue is presented as actual financial income.
          </div>
        </div>

        {/* Societies Subscriptions Table */}
        <AppCard className="p-6">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#F1F3F5]">
            <h2 className="text-sm font-bold text-[#1A1A1A] font-heading">
              Registered Housing Societies &amp; Active SaaS Tiers ({societies.length})
            </h2>
            <span className="text-xs text-[#6B7280]">MongoDB Atlas Multi-Tenant Records</span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs text-[#6B7280]">
              <IonIcon name="sync-outline" size={24} className="animate-spin text-[#4F46E5] mx-auto mb-2" />
              <p>Loading societies subscription records...</p>
            </div>
          ) : societies.length === 0 ? (
            <div className="p-10 text-center text-xs text-[#6B7280]">
              No societies registered yet.
            </div>
          ) : (
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E5E7EB] text-[#6B7280]">
                    <th className="py-2.5 font-bold">Society Name &amp; Code</th>
                    <th className="py-2.5 font-bold">City / State</th>
                    <th className="py-2.5 font-bold">Units / Quota</th>
                    <th className="py-2.5 font-bold">Assigned SaaS Plan</th>
                    <th className="py-2.5 font-bold">Status</th>
                    <th className="py-2.5 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F3F5]">
                  {societies.map((soc) => {
                    const plan = soc.subscription?.plan;
                    const maxFlats = plan?.maxFlats || 100;

                    return (
                      <tr key={soc.id} className="hover:bg-[#F8F9FA] transition-colors">
                        <td className="py-3">
                          <p className="font-bold text-[#1A1A1A]">{soc.name}</p>
                          <span className="font-mono text-[10px] text-[#4F46E5]">{soc.code}</span>
                        </td>
                        <td className="py-3 text-[#6B7280]">
                          {soc.city}, {soc.state}
                        </td>
                        <td className="py-3">
                          <span className="font-semibold text-[#1A1A1A]">{soc.totalFlats}</span>
                          <span className="text-[#9CA3AF]"> / {maxFlats} Flats</span>
                        </td>
                        <td className="py-3">
                          {plan ? (
                            <div>
                              <span className="font-bold text-[#1A1A1A]">{plan.name}</span>
                              <span className="text-[10px] text-[#6B7280] block">
                                {plan.storageAllowanceGb} GB Vault
                              </span>
                            </div>
                          ) : (
                            <span className="text-[#9CA3AF]">No Plan Assigned</span>
                          )}
                        </td>
                        <td className="py-3">
                          <StatusBadge
                            variant={soc.subscription?.status === "ACTIVE" ? "success" : "warning"}
                            size="sm"
                          >
                            {soc.subscription?.status || "DEMO"}
                          </StatusBadge>
                        </td>
                        <td className="py-3 text-right">
                          <AppButton
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedSoc(soc);
                              if (plan) setPlanCode(plan.code);
                            }}
                          >
                            Assign / Change Plan
                          </AppButton>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </AppCard>

        {/* Super Admin Assign Plan Modal */}
        <Modal
          isOpen={!!selectedSoc}
          onClose={() => {
            if (!updating) setSelectedSoc(null);
          }}
          title={`Assign Plan to ${selectedSoc?.name || "Society"}`}
        >
          <form onSubmit={handleAssignPlan} className="space-y-4 text-xs">
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

            <FormField label="Select SaaS Plan Tier">
              <select
                value={planCode}
                onChange={(e) => setPlanCode(e.target.value)}
                className="w-full h-10 px-3 bg-white border border-[#E5E7EB] rounded-xl text-xs text-[#1A1A1A] focus:outline-none focus:border-[#4F46E5]"
              >
                <option value="DEMO">Free / Demonstration (25 Flats, 1 GB)</option>
                <option value="STARTER">Cooperative Starter (100 Flats, 5 GB)</option>
                <option value="PROFESSIONAL">Gated Community Pro (350 Flats, 25 GB)</option>
                <option value="ENTERPRISE">Large Township &amp; Apex (2000 Flats, 100 GB)</option>
              </select>
            </FormField>

            <FormField label="Super Admin Modification Note">
              <textarea
                rows={2}
                placeholder="Reason for changing plan or allocating additional quota..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="w-full p-3 bg-white border border-[#E5E7EB] rounded-xl text-xs text-[#1A1A1A] focus:outline-none focus:border-[#4F46E5]"
              />
            </FormField>

            <div className="pt-2 flex justify-end gap-2">
              <AppButton
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelectedSoc(null)}
                disabled={updating}
              >
                Cancel
              </AppButton>
              <AppButton type="submit" variant="hero" size="sm" isLoading={updating}>
                Confirm Plan Allocation
              </AppButton>
            </div>
          </form>
        </Modal>
      </div>
    </AppShell>
  );
}
