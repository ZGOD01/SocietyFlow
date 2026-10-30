"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import {
  PageHeader,
  StatCard,
  AppCard,
  StatusBadge,
  AppButton,
  Modal,
  IonIcon,
  FormField,
} from "@/components/ui";

interface SocietyData {
  id: string;
  name: string;
  code: string;
  registrationNumber: string;
  state: string;
  district?: string;
  city: string;
  pinCode: string;
  address?: string;
  contactEmail?: string;
  contactPhone?: string;
  status: string;
  settings?: {
    requireCommitteeApproval?: boolean;
    allowDirectTenantInvites?: boolean;
    digitalSignaturesEnabled?: boolean;
  };
  createdAt: string;
}

interface CommitteeMember {
  membershipId: string;
  role: string;
  status: string;
  resolutionNumber?: string;
  joinedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    avatar?: string;
  };
}

interface BuildingItem {
  id: string;
  name: string;
  code?: string;
  floors: number;
  totalWings: number;
  wings: Array<{
    id: string;
    name: string;
    floors: number;
    flatsPerFloor?: number;
  }>;
}

interface SocietyProfileResponse {
  success: boolean;
  society: SocietyData;
  stats: {
    totalBuildings: number;
    totalWings: number;
    totalFlats: number;
    registeredOwners: number;
    activeTenants: number;
    vacantFlats: number;
  };
  structure: BuildingItem[];
  committee: CommitteeMember[];
}

export default function SocietyProfileManagementPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<SocietyProfileResponse | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Edit Society Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [regNo, setRegNo] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [pinCode, setPinCode] = useState("");
  const [district, setDistrict] = useState("");
  const [state, setState] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [requireApproval, setRequireApproval] = useState(true);
  const [allowDirectInvites, setAllowDirectInvites] = useState(true);
  const [digitalSignatures, setDigitalSignatures] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchSociety = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/management/society");
      const json = await res.json();
      if (res.ok) {
        setData(json);
        const s = json.society;
        setName(s.name || "");
        setRegNo(s.registrationNumber || "");
        setAddress(s.address || "");
        setCity(s.city || "");
        setPinCode(s.pinCode || "");
        setDistrict(s.district || "Pune");
        setState(s.state || "Maharashtra");
        setContactEmail(s.contactEmail || "");
        setContactPhone(s.contactPhone || "");
        setRequireApproval(s.settings?.requireCommitteeApproval ?? true);
        setAllowDirectInvites(s.settings?.allowDirectTenantInvites ?? true);
        setDigitalSignatures(s.settings?.digitalSignaturesEnabled ?? true);
      } else {
        setFeedback({ type: "error", text: json.error || "Failed to load society profile" });
      }
    } catch {
      setFeedback({ type: "error", text: "Network error loading society profile" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    async function loadSociety() {
      try {
        const res = await fetch("/api/management/society");
        const json = await res.json();
        if (!ignore) {
          if (res.ok) {
            setData(json);
            const s = json.society;
            setName(s.name || "");
            setRegNo(s.registrationNumber || "");
            setAddress(s.address || "");
            setCity(s.city || "");
            setPinCode(s.pinCode || "");
            setDistrict(s.district || "Pune");
            setState(s.state || "Maharashtra");
            setContactEmail(s.contactEmail || "");
            setContactPhone(s.contactPhone || "");
            setRequireApproval(s.settings?.requireCommitteeApproval ?? true);
            setAllowDirectInvites(s.settings?.allowDirectTenantInvites ?? true);
            setDigitalSignatures(s.settings?.digitalSignaturesEnabled ?? true);
          } else {
            setFeedback({ type: "error", text: json.error || "Failed to load society profile" });
          }
        }
      } catch {
        if (!ignore) {
          setFeedback({ type: "error", text: "Network error loading society profile" });
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }
    loadSociety();
    return () => {
      ignore = true;
    };
  }, []);

  const handleUpdateSociety = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const res = await fetch("/api/management/society", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          registrationNumber: regNo.trim(),
          address: address.trim(),
          city: city.trim(),
          pinCode: pinCode.trim(),
          district: district.trim(),
          state: state.trim(),
          contactEmail: contactEmail.trim().toLowerCase(),
          contactPhone: contactPhone.trim(),
          settings: {
            requireCommitteeApproval: requireApproval,
            allowDirectTenantInvites: allowDirectInvites,
            digitalSignaturesEnabled: digitalSignatures,
          },
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to update society details");

      setFeedback({ type: "success", text: "Society information updated successfully." });
      setEditModalOpen(false);
      fetchSociety();
    } catch (err: unknown) {
      setFeedback({ type: "error", text: err instanceof Error ? err.message : "Error updating society details" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-semibold text-[#6B7280]">
          <Link href="/management/dashboard" className="hover:text-[#4F46E5] flex items-center gap-1">
            <IonIcon name="arrow-back-outline" size={14} />
            <span>Management Console</span>
          </Link>
          <span className="text-[#9CA3AF]">/</span>
          <span className="text-[#1A1A1A] font-bold">Society Profile &amp; Structure</span>
        </div>

        {/* Page Header */}
        <PageHeader
          title="Society Profile &amp; Governance"
          description="Legal registered details, physical tower architecture, unit metrics, and managing committee executive council."
          badge="Prompt 6"
          actions={
            <div className="flex items-center gap-2">
              <AppButton
                variant="outline"
                size="sm"
                leftIcon="create-outline"
                onClick={() => setEditModalOpen(true)}
              >
                Edit Society Info
              </AppButton>
              <Link href="/management/flats">
                <AppButton variant="primary" size="sm" leftIcon="business-outline">
                  Manage Flats
                </AppButton>
              </Link>
            </div>
          }
        />

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-4 rounded-xl border flex items-center justify-between text-sm ${
              feedback.type === "success"
                ? "bg-[#F0FDF4] border-[#BBF7D0] text-[#166534]"
                : "bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]"
            }`}
          >
            <div className="flex items-center gap-2">
              <IonIcon
                name={feedback.type === "success" ? "checkmark-circle" : "alert-circle"}
                size={20}
              />
              <span className="font-semibold">{feedback.text}</span>
            </div>
            <button
              onClick={() => setFeedback(null)}
              className="text-xs font-bold hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="space-y-4 animate-pulse">
            <div className="h-40 bg-white rounded-2xl border border-[#E5E7EB]" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 bg-white rounded-2xl border border-[#E5E7EB]" />
              ))}
            </div>
          </div>
        )}

        {/* Profile Content */}
        {!loading && data && (
          <>
            {/* Society Identity Card */}
            <AppCard className="p-6 bg-white border border-[#E5E7EB] rounded-2xl shadow-2xs">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-[#F3F4F6]">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <h1 className="text-2xl font-extrabold text-[#1A1A1A] font-heading">
                      {data.society.name}
                    </h1>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#EEF2FF] text-[#4F46E5] border border-[#C7D2FE]">
                      Code: {data.society.code}
                    </span>
                    <StatusBadge variant="success">{data.society.status}</StatusBadge>
                  </div>
                  <p className="text-xs text-[#6B7280]">
                    Statutory Registration Number:{" "}
                    <strong className="text-[#1A1A1A]">{data.society.registrationNumber}</strong>{" "}
                    (Maharashtra Co-operative Societies Act 1960)
                  </p>
                </div>

                <div className="text-right text-xs">
                  <span className="text-[#9CA3AF] block mb-0.5">Platform Managed Since</span>
                  <span className="font-bold text-[#1A1A1A]">
                    {new Date(data.society.createdAt).toLocaleDateString("en-IN", {
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>

              {/* Address and Contact Information */}
              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-[#9CA3AF] block mb-0.5 font-semibold">Registered Address</span>
                  <span className="font-medium text-[#1A1A1A]">
                    {data.society.address || "Not provided"}
                  </span>
                </div>
                <div>
                  <span className="text-[#9CA3AF] block mb-0.5 font-semibold">City &amp; Postal Code</span>
                  <span className="font-medium text-[#1A1A1A]">
                    {data.society.city || "Not specified"}{data.society.pinCode ? `, ${data.society.pinCode}` : ""}{data.society.state ? ` (${data.society.state})` : ""}
                  </span>
                </div>
                <div>
                  <span className="text-[#9CA3AF] block mb-0.5 font-semibold">Official Contact Email</span>
                  <span className="font-medium text-[#1A1A1A]">
                    {data.society.contactEmail || "Not provided"}
                  </span>
                </div>
                <div>
                  <span className="text-[#9CA3AF] block mb-0.5 font-semibold">Administrative Phone</span>
                  <span className="font-medium text-[#1A1A1A]">
                    {data.society.contactPhone || "Not provided"}
                  </span>
                </div>
              </div>
            </AppCard>

            {/* Metrics Overview */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              <StatCard
                label="Buildings"
                value={data.stats.totalBuildings}
                iconName="business-outline"
              />
              <StatCard
                label="Total Wings"
                value={data.stats.totalWings}
                iconName="layers-outline"
              />
              <StatCard
                label="Total Units"
                value={data.stats.totalFlats}
                iconName="grid-outline"
              />
              <StatCard
                label="Verified Owners"
                value={data.stats.registeredOwners}
                iconName="people-outline"
                badgeVariant="success"
              />
              <StatCard
                label="Active Tenants"
                value={data.stats.activeTenants}
                iconName="key-outline"
                badgeVariant="info"
              />
              <StatCard
                label="Vacant Units"
                value={data.stats.vacantFlats}
                iconName="home-outline"
                badgeVariant="warning"
              />
            </div>

            {/* Architecture & Managing Committee 2-Column Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Physical Architecture Hierarchy */}
              <AppCard className="p-5 bg-white border border-[#E5E7EB] rounded-2xl shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#F3F4F6]">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center font-bold">
                      <IonIcon name="business-outline" size={18} />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-[#1A1A1A] font-heading">
                        Building &amp; Wing Structure
                      </h2>
                      <p className="text-[11px] text-[#6B7280]">
                        Hierarchical tower and floor layout configured in the database
                      </p>
                    </div>
                  </div>
                  <Link href="/management/flats">
                    <span className="text-xs font-bold text-[#4F46E5] hover:underline">
                      View Directory →
                    </span>
                  </Link>
                </div>

                <div className="space-y-3">
                  {data.structure.map((b) => (
                    <div
                      key={b.id}
                      className="p-4 rounded-xl border border-[#E5E7EB] bg-[#F8F9FA] space-y-2.5 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#1A1A1A] text-sm">{b.name}</span>
                        <span className="text-[#6B7280]">
                          {b.floors} Floors • {b.totalWings} Wings
                        </span>
                      </div>

                      {b.wings.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-[#E5E7EB]">
                          {b.wings.map((w) => (
                            <div
                              key={w.id}
                              className="p-2.5 rounded-lg bg-white border border-[#E5E7EB] flex items-center justify-between"
                            >
                              <span className="font-semibold text-[#1A1A1A]">{w.name}</span>
                              <span className="text-[10px] text-[#6B7280]">
                                {w.floors} Floors ({w.flatsPerFloor || 4} units/floor)
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </AppCard>

              {/* Managing Committee Council */}
              <AppCard className="p-5 bg-white border border-[#E5E7EB] rounded-2xl shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#F3F4F6]">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-[#F0FDF4] text-[#166534] flex items-center justify-center font-bold">
                      <IonIcon name="ribbon-outline" size={18} />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-[#1A1A1A] font-heading">
                        Managing Committee Council
                      </h2>
                      <p className="text-[11px] text-[#6B7280]">
                        Elected statutory officers and managing committee members
                      </p>
                    </div>
                  </div>
                  <Link href="/management/dashboard">
                    <span className="text-xs font-bold text-[#4F46E5] hover:underline">
                      Appoint Seat →
                    </span>
                  </Link>
                </div>

                <div className="space-y-3">
                  {data.committee.map((m) => (
                    <div
                      key={m.membershipId}
                      className="p-3.5 rounded-xl border border-[#E5E7EB] bg-[#F8F9FA] flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#1A1A1A] text-white flex items-center justify-center font-bold text-xs shrink-0">
                          {m.user.name
                            .split(" ")
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join("")
                            .toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-[#1A1A1A]">{m.user.name}</p>
                          <p className="text-[11px] text-[#6B7280]">
                            {m.user.email} {m.user.phone ? `• ${m.user.phone}` : ""}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#EEF2FF] text-[#4F46E5] border border-[#C7D2FE]">
                          {m.role.replace(/_/g, " ")}
                        </span>
                        <p className="text-[10px] text-[#9CA3AF] mt-0.5">
                          Elected: {new Date(m.joinedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </AppCard>
            </div>

            {/* Modal: Edit Society Information */}
            <Modal
              isOpen={editModalOpen}
              onClose={() => setEditModalOpen(false)}
              title="Edit Society Information"
            >
              <form onSubmit={handleUpdateSociety} className="space-y-4 text-xs">
                <FormField label="Society Legal Registered Name *" id="soc-name" required>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] bg-white text-xs font-bold"
                  />
                </FormField>

                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Statutory Registration # *" id="soc-reg" required>
                    <input
                      type="text"
                      value={regNo}
                      onChange={(e) => setRegNo(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] bg-white text-xs font-mono font-bold"
                    />
                  </FormField>

                  <FormField label="City *" id="soc-city" required>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] bg-white text-xs"
                    />
                  </FormField>
                </div>

                <FormField label="Full Society Address" id="soc-addr">
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] bg-white text-xs"
                  />
                </FormField>

                <div className="grid grid-cols-3 gap-3">
                  <FormField label="Pin Code *" id="soc-pin" required>
                    <input
                      type="text"
                      value={pinCode}
                      onChange={(e) => setPinCode(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] bg-white text-xs"
                    />
                  </FormField>

                  <FormField label="District" id="soc-district">
                    <input
                      type="text"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] bg-white text-xs"
                    />
                  </FormField>

                  <FormField label="State" id="soc-state">
                    <input
                      type="text"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] bg-white text-xs"
                    />
                  </FormField>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Official Contact Email" id="soc-email">
                    <input
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] bg-white text-xs"
                    />
                  </FormField>

                  <FormField label="Office Phone" id="soc-phone">
                    <input
                      type="tel"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] bg-white text-xs"
                    />
                  </FormField>
                </div>

                {/* Governance Toggles */}
                <div className="pt-2 border-t border-[#E5E7EB] space-y-2">
                  <span className="font-bold text-[#1A1A1A] block">Statutory Governance Rules</span>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={requireApproval}
                      onChange={(e) => setRequireApproval(e.target.checked)}
                      className="rounded border-[#E5E7EB] text-[#4F46E5] focus:ring-[#4F46E5]"
                    />
                    <span>Require Committee verification for new resident registrations</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowDirectInvites}
                      onChange={(e) => setAllowDirectInvites(e.target.checked)}
                      className="rounded border-[#E5E7EB] text-[#4F46E5] focus:ring-[#4F46E5]"
                    />
                    <span>Allow verified property owners to authorize tenant onboarding directly</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={digitalSignatures}
                      onChange={(e) => setDigitalSignatures(e.target.checked)}
                      className="rounded border-[#E5E7EB] text-[#4F46E5] focus:ring-[#4F46E5]"
                    />
                    <span>Enable digital audit signing on statutory NOCs and society resolutions</span>
                  </label>
                </div>

                <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-end gap-2">
                  <AppButton
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditModalOpen(false)}
                  >
                    Cancel
                  </AppButton>
                  <AppButton
                    type="submit"
                    variant="primary"
                    size="sm"
                    isLoading={isSubmitting}
                  >
                    Save Changes
                  </AppButton>
                </div>
              </form>
            </Modal>
          </>
        )}
      </div>
    </AppShell>
  );
}
