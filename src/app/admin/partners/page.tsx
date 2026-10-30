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

interface PartnerAdminItem {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone?: string;
  organization: string;
  referralCode: string;
  partnerType: string;
  status: string;
  commissionModel: {
    type: string;
    rate: number;
    description?: string;
  };
  stats: {
    totalReferrals: number;
    activeSocieties: number;
    illustrativeEarned: number;
  };
  createdAt: string;
}

export default function AdminPartnersPage() {
  const [loading, setLoading] = useState(true);
  const [partners, setPartners] = useState<PartnerAdminItem[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<PartnerAdminItem | null>(null);
  const [editStatus, setEditStatus] = useState<"ACTIVE" | "PENDING" | "SUSPENDED">("ACTIVE");
  const [editRate, setEditRate] = useState<number>(5000);
  const [editType, setEditType] = useState<"FIXED" | "PERCENTAGE" | "RECURRING">("FIXED");
  const [adminNotes, setAdminNotes] = useState("");
  const [updating, setUpdating] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchPartners = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/partners");
      const data = await res.json();
      if (res.ok) {
        setPartners(data.partners || []);
      }
    } catch (err) {
      console.error("Admin partners error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  const handleUpdatePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPartner) return;

    setUpdating(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/admin/partners", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partnerId: selectedPartner.id,
          status: editStatus,
          commissionType: editType,
          commissionRate: editRate,
          notes: adminNotes.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update partner");

      setFeedback({ type: "success", text: data.message });
      fetchPartners();
      setTimeout(() => {
        setSelectedPartner(null);
        setFeedback(null);
      }, 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error updating partner";
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
              <span className="text-xs text-[#6B7280]">Section 15 Partner Controls</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-[#1A1A1A] font-heading">
              Channel Partner Network &amp; Commission Governance
            </h1>
            <p className="text-xs md:text-sm text-[#6B7280] mt-1 max-w-2xl">
              Inspect registered channel partners, activate/suspend partner accounts, monitor referral pipeline performance, and configure illustrative commission models.
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

        {/* Partners Table */}
        <AppCard className="p-6">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#F1F3F5]">
            <h2 className="text-sm font-bold text-[#1A1A1A] font-heading">
              Registered Channel Partners &amp; Affiliates ({partners.length})
            </h2>
            <span className="text-xs text-[#6B7280]">Real MongoDB Records</span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs text-[#6B7280]">
              <IonIcon name="sync-outline" size={24} className="animate-spin text-[#4F46E5] mx-auto mb-2" />
              <p>Loading channel partners...</p>
            </div>
          ) : partners.length === 0 ? (
            <div className="p-10 text-center text-xs text-[#6B7280]">
              No channel partners registered in network.
            </div>
          ) : (
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E5E7EB] text-[#6B7280]">
                    <th className="py-2.5 font-bold">Partner Name &amp; Practice</th>
                    <th className="py-2.5 font-bold">Referral Code</th>
                    <th className="py-2.5 font-bold">Category</th>
                    <th className="py-2.5 font-bold">Attributed Societies</th>
                    <th className="py-2.5 font-bold">Commission Model</th>
                    <th className="py-2.5 font-bold">Status</th>
                    <th className="py-2.5 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F3F5]">
                  {partners.map((p) => (
                    <tr key={p.id} className="hover:bg-[#F8F9FA] transition-colors">
                      <td className="py-3">
                        <p className="font-bold text-[#1A1A1A]">{p.name}</p>
                        <p className="text-[10px] text-[#6B7280]">{p.email}</p>
                      </td>
                      <td className="py-3">
                        <span className="font-mono font-bold text-[#4F46E5] px-2 py-0.5 rounded-lg bg-[#EEF2FF]">
                          {p.referralCode}
                        </span>
                      </td>
                      <td className="py-3 text-[#6B7280]">
                        {p.partnerType.replace(/_/g, " ")}
                      </td>
                      <td className="py-3">
                        <span className="font-semibold text-[#1A1A1A]">{p.stats.activeSocieties}</span>
                        <span className="text-[#9CA3AF]"> / {p.stats.totalReferrals} referred</span>
                      </td>
                      <td className="py-3">
                        <span className="font-bold text-[#1A1A1A]">
                          ₹{p.commissionModel.rate.toLocaleString("en-IN")}
                        </span>
                        <span className="text-[10px] text-[#6B7280] block">
                          {p.commissionModel.type} (Illustrative)
                        </span>
                      </td>
                      <td className="py-3">
                        <StatusBadge
                          variant={p.status === "ACTIVE" ? "success" : p.status === "SUSPENDED" ? "error" : "warning"}
                          size="sm"
                        >
                          {p.status}
                        </StatusBadge>
                      </td>
                      <td className="py-3 text-right">
                        <AppButton
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedPartner(p);
                            setEditStatus(p.status as any);
                            setEditRate(p.commissionModel.rate);
                            setEditType(p.commissionModel.type as any);
                          }}
                        >
                          Configure Terms
                        </AppButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </AppCard>

        {/* Configure Partner Terms Modal */}
        <Modal
          isOpen={!!selectedPartner}
          onClose={() => {
            if (!updating) setSelectedPartner(null);
          }}
          title={`Configure Terms: ${selectedPartner?.name || "Partner"}`}
        >
          <form onSubmit={handleUpdatePartner} className="space-y-4 text-xs">
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

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Partner Status">
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as any)}
                  className="w-full h-10 px-3 bg-white border border-[#E5E7EB] rounded-xl text-xs text-[#1A1A1A] focus:outline-none focus:border-[#4F46E5]"
                >
                  <option value="ACTIVE">Active (Can Refer)</option>
                  <option value="PENDING">Pending Review</option>
                  <option value="SUSPENDED">Suspended</option>
                </select>
              </FormField>

              <FormField label="Commission Incentive Type">
                <select
                  value={editType}
                  onChange={(e) => setEditType(e.target.value as any)}
                  className="w-full h-10 px-3 bg-white border border-[#E5E7EB] rounded-xl text-xs text-[#1A1A1A] focus:outline-none focus:border-[#4F46E5]"
                >
                  <option value="FIXED">Fixed Reward per Society</option>
                  <option value="PERCENTAGE">Percentage of Plan</option>
                  <option value="RECURRING">Recurring Annual Commission</option>
                </select>
              </FormField>
            </div>

            <FormField label="Illustrative Commission Amount (INR)">
              <input
                type="number"
                value={editRate}
                onChange={(e) => setEditRate(Number(e.target.value))}
                className="w-full h-10 px-3 bg-white border border-[#E5E7EB] rounded-xl text-xs text-[#1A1A1A] focus:outline-none focus:border-[#4F46E5]"
              />
            </FormField>

            <FormField label="Super Admin Remarks">
              <textarea
                rows={2}
                placeholder="Notes on partner agreement, audit credentials, or quota..."
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
                onClick={() => setSelectedPartner(null)}
                disabled={updating}
              >
                Cancel
              </AppButton>
              <AppButton type="submit" variant="hero" size="sm" isLoading={updating}>
                Save Terms
              </AppButton>
            </div>
          </form>
        </Modal>
      </div>
    </AppShell>
  );
}
