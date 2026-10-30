"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import {
  StatCard,
  AppCard,
  StatusBadge,
  AppButton,
  Modal,
  FormField,
  IonIcon,
} from "@/components/ui";

interface PartnerProfile {
  _id: string;
  partnerName: string;
  partnerEmail: string;
  partnerPhone?: string;
  organizationName?: string;
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
    pendingVerifications: number;
    illustrativeEarned: number;
  };
}

interface ReferralItem {
  id: string;
  referralCode: string;
  societyName: string;
  societyCity: string;
  contactPerson: string;
  contactEmail: string;
  status: string;
  demoSubscriptionPlan?: string;
  illustrativeCommission: number;
  activatedAt?: string;
  createdAt: string;
  notes?: string;
}

export default function PartnerDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [partner, setPartner] = useState<PartnerProfile | null>(null);
  const [referralLink, setReferralLink] = useState("");
  const [referrals, setReferrals] = useState<ReferralItem[]>([]);
  const [copied, setCopied] = useState(false);

  // New Referral Modal
  const [isReferralModalOpen, setIsReferralModalOpen] = useState(false);
  const [socName, setSocName] = useState("");
  const [socCity, setSocCity] = useState("Pune");
  const [contactPerson, setContactPerson] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [demoPlan, setDemoPlan] = useState("PROFESSIONAL");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchPartnerData = async () => {
    try {
      setLoading(true);
      const [profRes, refRes] = await Promise.all([
        fetch("/api/partner/profile"),
        fetch("/api/partner/referrals"),
      ]);

      const profData = await profRes.json();
      const refData = await refRes.json();

      if (profRes.ok) {
        setPartner(profData.partner);
        setReferralLink(profData.referralLink);
      }
      if (refRes.ok) {
        setReferrals(refData.referrals || []);
      }
    } catch (err) {
      console.error("Partner dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartnerData();
  }, []);

  const handleCopyLink = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmitReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/partner/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          societyName: socName.trim(),
          societyCity: socCity.trim(),
          contactPerson: contactPerson.trim(),
          contactEmail: contactEmail.trim(),
          contactPhone: contactPhone.trim(),
          demoSubscriptionPlan: demoPlan,
          notes: notes.trim(),
        }),
      });

      const resJson = await res.json();
      if (!res.ok) throw new Error(resJson.error || "Failed to register referral");

      setFeedback({ type: "success", text: resJson.message });
      fetchPartnerData();
      setTimeout(() => {
        setIsReferralModalOpen(false);
        setFeedback(null);
        setSocName("");
        setContactPerson("");
        setContactEmail("");
        setContactPhone("");
        setNotes("");
      }, 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error registering referral";
      setFeedback({ type: "error", text: msg });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVATED":
        return <StatusBadge variant="success" size="sm">Activated</StatusBadge>;
      case "PENDING_VERIFICATION":
      case "REGISTRATION_STARTED":
        return <StatusBadge variant="warning" size="sm">{status.replace(/_/g, " ")}</StatusBadge>;
      case "REFERRED":
        return <StatusBadge variant="info" size="sm">Referred</StatusBadge>;
      case "REJECTED":
      case "INACTIVE":
        return <StatusBadge variant="error" size="sm">{status}</StatusBadge>;
      default:
        return <StatusBadge variant="neutral" size="sm">{status}</StatusBadge>;
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
                Channel Partner Portal
              </span>
              <span className="text-xs text-[#6B7280]">
                {partner?.partnerType?.replace(/_/g, " ") || "Channel Partner"}
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-[#1A1A1A] font-heading">
              Society Onboarding &amp; Referral Desk
            </h1>
            <p className="text-xs md:text-sm text-[#6B7280] mt-1 max-w-2xl">
              Track referred housing societies, monitor demonstration onboarding milestones, and generate custom referral attribution links.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <AppButton
              variant="hero"
              size="md"
              leftIcon="add-outline"
              onClick={() => setIsReferralModalOpen(true)}
            >
              Submit New Referral
            </AppButton>
          </div>
        </div>

        {/* Real Metrics Cards (Section 11) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Referrals"
            value={`${partner?.stats.totalReferrals || referrals.length} Societies`}
            subtitle="Registered in Pipeline"
            iconName="business-outline"
            iconVariant="hero-soft"
          />
          <StatCard
            label="Societies Onboarded"
            value={`${partner?.stats.activeSocieties || 0} Activated`}
            subtitle="Active Demonstrations"
            iconName="shield-checkmark-outline"
            iconVariant="success"
            badgeText="Live"
            badgeVariant="success"
          />
          <StatCard
            label="Pending Pipeline"
            value={`${partner?.stats.pendingVerifications || 0} In Progress`}
            subtitle="Awaiting Verification"
            iconName="hourglass-outline"
            iconVariant="warning"
          />
          <StatCard
            label="Demo Commission"
            value={`₹${(partner?.stats.illustrativeEarned || 0).toLocaleString("en-IN")}`}
            subtitle="Illustrative Simulation"
            iconName="ribbon-outline"
            iconVariant="info"
            badgeText="Demo Only"
            badgeVariant="info"
          />
        </div>

        {/* Partner Referral Code & Link Card (Section 12) */}
        <AppCard className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#F1F3F5]">
            <div>
              <h2 className="text-sm font-bold text-[#1A1A1A] font-heading">
                Your Exclusive Referral Attribution Code
              </h2>
              <p className="text-xs text-[#6B7280] mt-0.5">
                Share this referral link with housing society managing committees to automatically track attribution.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-extrabold px-3 py-1.5 rounded-xl bg-[#EEF2FF] text-[#4F46E5] border border-[#C7D2FE]">
                {partner?.referralCode || "SOCIETYFLOW-PARTNER-001"}
              </span>
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center gap-2">
            <input
              type="text"
              readOnly
              value={referralLink || "http://localhost:3000/onboarding/society-setup?ref=SOCIETYFLOW-PARTNER-001"}
              className="w-full h-10 px-3 bg-[#F8F9FA] border border-[#E5E7EB] rounded-xl text-xs font-mono text-[#1A1A1A] focus:outline-none"
            />
            <AppButton
              variant={copied ? "primary" : "outline"}
              size="sm"
              leftIcon={copied ? "checkmark-outline" : "copy-outline"}
              onClick={handleCopyLink}
              className="shrink-0"
            >
              {copied ? "Copied Link!" : "Copy Referral Link"}
            </AppButton>
          </div>
        </AppCard>

        {/* Privacy Notice (Section 13) */}
        <div className="bg-[#F8F9FA] border border-[#E5E7EB] rounded-xl p-4 text-xs text-[#6B7280] flex items-start gap-3">
          <IonIcon name="lock-closed-outline" size={18} className="shrink-0 text-[#4F46E5] mt-0.5" />
          <div className="leading-relaxed">
            <strong>Partner Privacy Protection:</strong> Partners have oversight of society onboarding status and milestone activations. Access to resident identity documents, private title deeds, and confidential committee approvals is strictly isolated and restricted to authorized society officials.
          </div>
        </div>

        {/* Referrals Pipeline Table (Section 13) */}
        <AppCard className="p-6">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#F1F3F5]">
            <h2 className="text-sm font-bold text-[#1A1A1A] font-heading">
              Society Referral Tracking Roster ({referrals.length})
            </h2>
            <span className="text-xs text-[#6B7280]">Live Attributions</span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs text-[#6B7280]">
              <IonIcon name="sync-outline" size={24} className="animate-spin text-[#4F46E5] mx-auto mb-2" />
              <p>Loading referral pipeline...</p>
            </div>
          ) : referrals.length === 0 ? (
            <div className="p-10 text-center text-xs text-[#6B7280] space-y-2">
              <p className="font-bold text-[#1A1A1A]">No Referrals Registered Yet</p>
              <p>Click &quot;Submit New Referral&quot; or share your referral link to begin tracking society onboardings.</p>
            </div>
          ) : (
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E5E7EB] text-[#6B7280]">
                    <th className="py-2.5 font-bold">Society Name</th>
                    <th className="py-2.5 font-bold">City</th>
                    <th className="py-2.5 font-bold">Contact Person</th>
                    <th className="py-2.5 font-bold">Referral Date</th>
                    <th className="py-2.5 font-bold">Status</th>
                    <th className="py-2.5 font-bold text-right">Demo Commission</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F3F5]">
                  {referrals.map((r) => (
                    <tr key={r.id} className="hover:bg-[#F8F9FA] transition-colors">
                      <td className="py-3">
                        <p className="font-bold text-[#1A1A1A]">{r.societyName}</p>
                        <span className="font-mono text-[10px] text-[#6B7280]">{r.referralCode}</span>
                      </td>
                      <td className="py-3 text-[#6B7280]">{r.societyCity}</td>
                      <td className="py-3">
                        <p className="text-[#1A1A1A] font-medium">{r.contactPerson}</p>
                        <p className="text-[10px] text-[#6B7280]">{r.contactEmail}</p>
                      </td>
                      <td className="py-3 text-[#6B7280]">
                        {new Date(r.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-3">{getStatusBadge(r.status)}</td>
                      <td className="py-3 text-right">
                        <span className="font-bold text-[#1A1A1A]">
                          ₹{r.illustrativeCommission.toLocaleString("en-IN")}
                        </span>
                        <span className="text-[9px] text-[#9CA3AF] block">(Illustrative)</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </AppCard>

        {/* Submit Referral Modal */}
        <Modal
          isOpen={isReferralModalOpen}
          onClose={() => {
            if (!submitting) setIsReferralModalOpen(false);
          }}
          title="Register New Society Referral"
        >
          <form onSubmit={handleSubmitReferral} className="space-y-4 text-xs">
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
              <FormField label="Society Name" required>
                <input
                  type="text"
                  placeholder="e.g. Greenwood Estates CHS"
                  value={socName}
                  onChange={(e) => setSocName(e.target.value)}
                  required
                  className="w-full h-10 px-3 bg-white border border-[#E5E7EB] rounded-xl text-xs text-[#1A1A1A] focus:outline-none focus:border-[#4F46E5]"
                />
              </FormField>

              <FormField label="City" required>
                <input
                  type="text"
                  placeholder="e.g. Pune"
                  value={socCity}
                  onChange={(e) => setSocCity(e.target.value)}
                  required
                  className="w-full h-10 px-3 bg-white border border-[#E5E7EB] rounded-xl text-xs text-[#1A1A1A] focus:outline-none focus:border-[#4F46E5]"
                />
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Committee Contact Person" required>
                <input
                  type="text"
                  placeholder="e.g. Rajesh S. Joshi"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  required
                  className="w-full h-10 px-3 bg-white border border-[#E5E7EB] rounded-xl text-xs text-[#1A1A1A] focus:outline-none focus:border-[#4F46E5]"
                />
              </FormField>

              <FormField label="Contact Email" required>
                <input
                  type="email"
                  placeholder="secretary@greenwood.in"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  required
                  className="w-full h-10 px-3 bg-white border border-[#E5E7EB] rounded-xl text-xs text-[#1A1A1A] focus:outline-none focus:border-[#4F46E5]"
                />
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Contact Phone">
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full h-10 px-3 bg-white border border-[#E5E7EB] rounded-xl text-xs text-[#1A1A1A] focus:outline-none focus:border-[#4F46E5]"
                />
              </FormField>

              <FormField label="Target Demo Plan">
                <select
                  value={demoPlan}
                  onChange={(e) => setDemoPlan(e.target.value)}
                  className="w-full h-10 px-3 bg-white border border-[#E5E7EB] rounded-xl text-xs text-[#1A1A1A] focus:outline-none focus:border-[#4F46E5]"
                >
                  <option value="STARTER">Cooperative Starter</option>
                  <option value="PROFESSIONAL">Gated Community Pro</option>
                  <option value="ENTERPRISE">Large Township &amp; Apex</option>
                </select>
              </FormField>
            </div>

            <FormField label="Notes / Orientation Remarks">
              <textarea
                rows={2}
                placeholder="Mention managing committee requirements, total flats, or legal audit timeline..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-3 bg-white border border-[#E5E7EB] rounded-xl text-xs text-[#1A1A1A] focus:outline-none focus:border-[#4F46E5]"
              />
            </FormField>

            <div className="pt-2 flex justify-end gap-2">
              <AppButton
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsReferralModalOpen(false)}
                disabled={submitting}
              >
                Cancel
              </AppButton>
              <AppButton type="submit" variant="hero" size="sm" isLoading={submitting}>
                Register Referral
              </AppButton>
            </div>
          </form>
        </Modal>
      </div>
    </AppShell>
  );
}
