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
  IonIcon,
  SearchField,
  EmptyState,
} from "@/components/ui";

type ResidentTab = "ALL" | "OWNERS" | "TENANTS" | "PENDING" | "INACTIVE";

interface ResidentItem {
  id: string;
  membershipId: string;
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  role: string;
  status: string;
  enrollmentDate: string;
  wingAndFlat?: string;
  flatId?: string;
  flatNumber?: string;
  wingName?: string;
  onboardingStatus?: string;
  documentCount?: number;
}

interface ResidentsApiResponse {
  success: boolean;
  stats: {
    total: number;
    owners: number;
    tenants: number;
    pending: number;
    inactive: number;
  };
  residents: ResidentItem[];
  wings: Array<{ id: string; name: string }>;
}

export default function ResidentsDirectoryPage() {
  const [activeTab, setActiveTab] = useState<ResidentTab>("ALL");
  const [search, setSearch] = useState("");
  const [selectedWing, setSelectedWing] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ResidentsApiResponse | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchResidents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (activeTab !== "ALL") params.append("tab", activeTab);
      if (search.trim()) params.append("search", search.trim());
      if (selectedWing !== "ALL") params.append("wingId", selectedWing);

      const res = await fetch(`/api/management/residents?${params.toString()}`);
      const json = await res.json();
      if (res.ok) {
        setData(json);
      } else {
        setFeedback({ type: "error", text: json.error || "Failed to load resident directory" });
      }
    } catch {
      setFeedback({ type: "error", text: "Network error loading residents roster" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    async function loadResidents() {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (activeTab !== "ALL") params.append("tab", activeTab);
        if (search.trim()) params.append("search", search.trim());
        if (selectedWing !== "ALL") params.append("wingId", selectedWing);

        const res = await fetch(`/api/management/residents?${params.toString()}`);
        const json = await res.json();
        if (!ignore) {
          if (res.ok) {
            setData(json);
          } else {
            setFeedback({ type: "error", text: json.error || "Failed to load resident directory" });
          }
        }
      } catch {
        if (!ignore) {
          setFeedback({ type: "error", text: "Network error loading residents roster" });
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }
    loadResidents();
    return () => {
      ignore = true;
    };
  }, [activeTab, selectedWing, search]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchResidents();
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const renderOnboardingBadge = (status?: string) => {
    switch (status) {
      case "COMPLETED":
        return <StatusBadge variant="success">Vault Complete</StatusBadge>;
      case "PENDING_REVIEW":
        return <StatusBadge variant="warning">Docs Under Review</StatusBadge>;
      case "CORRECTION_REQUESTED":
        return <StatusBadge variant="error">Action Required</StatusBadge>;
      default:
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F3F4F6] text-[#6B7280] border border-[#E5E7EB]">
            Onboarding Pending
          </span>
        );
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Page Header */}
        <PageHeader
          title="Residents & Membership Registry"
          description="Centralized society roster of verified property owners, approved tenants, and managing committee officers."
          badge="Prompt 6"
          actions={
            <div className="flex items-center gap-2">
              <Link href="/management/flats">
                <AppButton variant="outline" size="sm" leftIcon="business-outline">
                  Flats Directory
                </AppButton>
              </Link>
              <Link href="/approvals">
                <AppButton variant="primary" size="sm" leftIcon="checkmark-done-circle-outline">
                  Review Pending
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

        {/* Stat Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatCard
            label="Total Residents"
            value={data?.stats.total ?? "—"}
            iconName="people-outline"
            subtitle={data ? "All Society Members" : undefined}
          />
          <StatCard
            label="Property Owners"
            value={data?.stats.owners ?? "—"}
            iconName="key-outline"
            badgeVariant="success"
            subtitle={data ? "Verified Ownership" : undefined}
          />
          <StatCard
            label="Active Tenants"
            value={data?.stats.tenants ?? "—"}
            iconName="home-outline"
            badgeVariant="info"
            subtitle={data ? "Approved Leases" : undefined}
          />
          <StatCard
            label="Pending Review"
            value={data?.stats.pending ?? "—"}
            iconName="time-outline"
            badgeVariant="warning"
            subtitle={data ? "Requires Action" : undefined}
          />
          <StatCard
            label="Inactive / Suspended"
            value={data?.stats.inactive ?? "—"}
            iconName="close-circle-outline"
            badgeVariant="error"
            subtitle={data ? "Past Residents" : undefined}
          />
        </div>

        {/* Navigation Tabs and Filters */}
        <AppCard className="p-4 bg-white border border-[#E5E7EB] shadow-2xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#F3F4F6] pb-3">
            {/* Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
              {(
                [
                  { id: "ALL", label: "All Residents", count: data?.stats.total },
                  { id: "OWNERS", label: "Owners", count: data?.stats.owners },
                  { id: "TENANTS", label: "Tenants", count: data?.stats.tenants },
                  { id: "PENDING", label: "Pending", count: data?.stats.pending },
                  { id: "INACTIVE", label: "Inactive Members", count: data?.stats.inactive },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                    activeTab === tab.id
                      ? "bg-[#EEF2FF] text-[#4F46E5] border border-[#C7D2FE] shadow-2xs"
                      : "text-[#6B7280] hover:text-[#1A1A1A] hover:bg-[#F8F9FA]"
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        activeTab === tab.id
                          ? "bg-[#4F46E5] text-white"
                          : "bg-[#F3F4F6] text-[#6B7280]"
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Wing Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#6B7280]">Wing:</span>
              <select
                value={selectedWing}
                onChange={(e) => setSelectedWing(e.target.value)}
                className="bg-[#F8F9FA] px-2.5 py-1.5 rounded-xl border border-[#E5E7EB] text-xs font-bold text-[#1A1A1A] outline-hidden cursor-pointer"
              >
                <option value="ALL">All Wings</option>
                {data?.wings.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 max-w-md">
            <SearchField
              placeholder="Search resident by name, email or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full"
            />
            <AppButton type="submit" variant="outline" size="sm">
              Search
            </AppButton>
          </form>
        </AppCard>

        {/* Loading State */}
        {loading && (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-20 bg-white rounded-2xl border border-[#E5E7EB] p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3 w-1/3">
                  <div className="w-10 h-10 rounded-full bg-[#F3F4F6]" />
                  <div className="space-y-1 w-full">
                    <div className="h-4 bg-[#F3F4F6] rounded w-3/4" />
                    <div className="h-3 bg-[#F3F4F6] rounded w-1/2" />
                  </div>
                </div>
                <div className="h-4 bg-[#F3F4F6] rounded w-24" />
                <div className="h-4 bg-[#F3F4F6] rounded w-20" />
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && (!data?.residents || data.residents.length === 0) && (
          <EmptyState
            title="No residents found"
            description="No members match the current filter or search criteria."
            iconName="people-outline"
          />
        )}

        {/* Residents Roster Table */}
        {!loading && data?.residents && data.residents.length > 0 && (
          <AppCard className="overflow-hidden border border-[#E5E7EB] bg-white rounded-2xl shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F8F9FA] border-b border-[#E5E7EB] text-[#6B7280] font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-4">Resident Member</th>
                    <th className="py-3.5 px-4">Contact Info</th>
                    <th className="py-3.5 px-4">Flat Association</th>
                    <th className="py-3.5 px-4">Verified Role</th>
                    <th className="py-3.5 px-4">Enrollment Date</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Vault Documents</th>
                    <th className="py-3.5 px-4 text-right">Flat Profile</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {data.residents.map((r) => (
                    <tr key={r.membershipId || r.id} className="hover:bg-[#F9FAFB] transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#1A1A1A] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                            {getInitials(r.name)}
                          </div>
                          <div>
                            <p className="font-bold text-[#1A1A1A] text-sm">{r.name}</p>
                            <span className="text-[10px] text-[#6B7280]">
                              ID: {r.id.slice(-6).toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-[#4B5563]">
                        <p className="font-medium text-[#1A1A1A]">{r.email}</p>
                        <p className="text-[11px] text-[#9CA3AF]">{r.phone || "—"}</p>
                      </td>

                      <td className="py-3.5 px-4 font-bold text-[#1A1A1A]">
                        {r.flatNumber ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#EEF2FF] text-[#4F46E5] border border-[#C7D2FE]">
                            <IonIcon name="home-outline" size={13} />
                            {r.wingName ? `${r.wingName} - ` : ""}Flat {r.flatNumber}
                          </span>
                        ) : (
                          <span className="text-[#9CA3AF] italic">Unlinked Unit</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase border ${
                            r.role === "OWNER"
                              ? "bg-[#F0FDF4] text-[#166534] border-[#BBF7D0]"
                              : r.role === "TENANT"
                              ? "bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]"
                              : "bg-[#FAF5FF] text-[#6B21A8] border-[#E9D5FF]"
                          }`}
                        >
                          {r.role.replace(/_/g, " ")}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-[#6B7280]">
                        {new Date(r.enrollmentDate).toLocaleDateString()}
                      </td>

                      <td className="py-3.5 px-4">
                        {r.status === "VERIFIED" ? (
                          <StatusBadge variant="success">Verified</StatusBadge>
                        ) : r.status === "PENDING" ? (
                          <StatusBadge variant="warning">Pending Approval</StatusBadge>
                        ) : (
                          <StatusBadge variant="error">{r.status}</StatusBadge>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          {renderOnboardingBadge(r.onboardingStatus)}
                          {r.documentCount !== undefined && r.documentCount > 0 && (
                            <span className="text-[10px] text-[#6B7280] font-semibold">
                              ({r.documentCount})
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {r.flatId ? (
                          <Link href={`/management/flats/${r.flatId}`}>
                            <AppButton variant="ghost" size="sm">
                              Inspect Unit
                            </AppButton>
                          </Link>
                        ) : (
                          <span className="text-[#9CA3AF] text-[11px]">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </AppCard>
        )}
      </div>
    </AppShell>
  );
}
