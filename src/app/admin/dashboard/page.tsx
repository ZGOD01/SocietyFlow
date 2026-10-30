"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import {
  PageHeader,
  StatCard,
  AppCard,
  StatusBadge,
  AppButton,
  IonIcon,
} from "@/components/ui";

interface SocietyItem {
  id: string;
  name: string;
  code: string;
  registrationNumber: string;
  city: string;
  state?: string;
  pinCode?: string;
  address?: string;
  resolutionNumber?: string;
  inviteToken?: string;
  committeeHead?: string;
  committeeRole?: string;
  totalFlats: number;
  totalWings: number;
  wings: string[];
  status: string;
  createdAt: string;
}

interface AdminData {
  stats: {
    totalSocieties: number;
    totalFlats: number;
    totalUsers: number;
    totalPartners: number;
    auditLogCount: number;
    totalRequests: number;
    pendingRequests: number;
  };
  societies: SocietyItem[];
  requests: any[];
}

export default function SuperAdminSocietiesPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AdminData | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const fetchDashboard = useCallback(() => {
    fetch("/api/dashboard/admin")
      .then((res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((resData) => {
        if (resData) {
          setData(resData);
        } else {
          setData({
            stats: {
              totalSocieties: 0,
              totalFlats: 0,
              totalUsers: 1,
              totalPartners: 0,
              auditLogCount: 0,
              totalRequests: 0,
              pendingRequests: 0,
            },
            societies: [],
            requests: [],
          });
        }
      })
      .catch((err) => {
        console.error("Super Admin fetch error:", err);
        setData({
          stats: {
            totalSocieties: 0,
            totalFlats: 0,
            totalUsers: 1,
            totalPartners: 0,
            auditLogCount: 0,
            totalRequests: 0,
            pendingRequests: 0,
          },
          societies: [],
          requests: [],
        });
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handleSocietyDecision = async (socId: string, action: "APPROVE" | "REJECT") => {
    try {
      setProcessingId(socId);
      setActionNotice(null);
      const res = await fetch("/api/admin/requests/decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: socId, type: "SOCIETY", action }),
      });
      const resJson = await res.json();
      if (!res.ok) {
        alert(resJson.error || "Action could not be completed");
        return;
      }
      setActionNotice(resJson.message);
      fetchDashboard();
    } catch {
      alert("Network error processing decision");
    } finally {
      setProcessingId(null);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {
      console.error("[SuperAdmin] Logout error:", e);
    } finally {
      window.location.href = "/login?switch=true";
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="space-y-6 animate-pulse">
          <div className="h-24 bg-white rounded-2xl border border-[#E5E7EB]" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 bg-white rounded-2xl border border-[#E5E7EB]" />
            ))}
          </div>
          <div className="h-96 bg-white rounded-2xl border border-[#E5E7EB]" />
        </div>
      </AppShell>
    );
  }

  const stats = data?.stats || {
    totalSocieties: 0,
    totalFlats: 0,
    totalUsers: 1,
    totalPartners: 0,
    auditLogCount: 0,
    totalRequests: 0,
    pendingRequests: 0,
  };

  const societies = data?.societies || [];
  const totalWings = societies.reduce(
    (acc, s) => acc + (s.wings?.length || s.totalWings || 1),
    0
  );

  return (
    <AppShell>
      {/* Top Header */}
      <PageHeader
        title="Society Profile"
        description="Platform authority oversight for registered societies: Verify, Approve, or Reject"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Super Admin", href: "/admin/dashboard" },
          { label: "Society Profile", href: "/admin/dashboard" },
        ]}
        badge={
          <StatusBadge variant="hero" size="sm" dot pulse>
            Super Admin
          </StatusBadge>
        }
        actions={
          <div className="flex items-center gap-2">
            <Link href="/onboarding/society-setup">
              <AppButton variant="hero" size="sm" leftIcon="add-outline">
                 Register Society
              </AppButton>
            </Link>
            <AppButton
              variant="outline"
              size="sm"
              leftIcon="log-out-outline"
              onClick={handleLogout}
              className="text-[#F43F5E] hover:bg-[#FFF1F2] border-[#FECDD3]"
            >
              Sign Out
            </AppButton>
          </div>
        }
      />

      {/* Action Notification Banner */}
      {actionNotice && (
        <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800">
          <span className="flex items-center gap-2 font-medium">
            <IonIcon name="checkmark-circle" size={17} className="text-emerald-600 shrink-0" />
            {actionNotice}
          </span>
          <button
            type="button"
            onClick={() => setActionNotice(null)}
            className="text-emerald-700 hover:text-emerald-950 font-bold ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Society Specific KPI Metric Counters (3 clean cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard
          label="Registered Societies"
          value={`${stats.totalSocieties}`}
          subtitle="Managed through Society Login"
          iconName="business-outline"
          iconVariant="hero-soft"
        />

        <StatCard
          label="Total Wings"
          value={`${totalWings}`}
          subtitle="Across registered societies"
          iconName="grid-outline"
          iconVariant="info"
        />

        <StatCard
          label="Total Flats / Units"
          value={`${stats.totalFlats}`}
          subtitle="Residential & commercial units"
          iconName="home-outline"
          iconVariant="success"
        />
      </div>

      {/* Society Profile Directory View */}
      <div className="space-y-4">
        {societies.length === 0 ? (
          /* Clean Empty State UI (No Societies Registered Yet) */
          <AppCard className="p-10 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center mb-4">
              <IonIcon name="business-outline" size={32} />
            </div>
            <h3 className="text-lg font-bold text-[#1A1A1A] font-heading mb-1">
              No Societies Registered Yet
            </h3>
            <p className="text-xs sm:text-sm text-[#6B7280] max-w-md mx-auto mb-6 leading-relaxed">
              There are currently no cooperative housing societies registered on the platform. When a society registers via Society Management setup, its profile, location, and wing structure will appear here for verification.
            </p>
            <Link href="/onboarding/society-setup">
              <AppButton variant="hero" size="sm" leftIcon="add-outline">
                + Register Society
              </AppButton>
            </Link>
          </AppCard>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {societies.map((soc) => (
              <AppCard key={soc.id} className="p-5 hover:border-[#C7D2FE] transition-all">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Society Info: Name & Location */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h4 className="text-base font-bold text-[#1A1A1A] font-heading">
                        {soc.name}
                      </h4>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#F3F4F6] text-[#4B5563] font-bold">
                        {soc.code}
                      </span>
                      <StatusBadge
                        variant={soc.status === "ACTIVE" ? "success" : "warning"}
                        size="sm"
                      >
                        {soc.status === "ACTIVE" ? "VERIFIED & ACTIVE" : soc.status}
                      </StatusBadge>
                    </div>

                    {/* Location & Statutory Data */}
                    <div className="flex flex-wrap items-center gap-y-1.5 gap-x-4 text-xs text-[#4B5563]">
                      <span className="flex items-center gap-1.5">
                        <IonIcon name="location-outline" size={15} className="text-[#4F46E5]" />
                        <span>
                          <strong>Location:</strong> {soc.city}
                          {soc.state ? `, ${soc.state}` : ""}
                          {soc.pinCode ? ` - ${soc.pinCode}` : ""}
                          {soc.address ? ` (${soc.address})` : ""}
                        </span>
                      </span>
                      {soc.registrationNumber && (
                        <span className="flex items-center gap-1.5 text-[#6B7280]">
                          <IonIcon name="document-text-outline" size={14} />
                          <span>Reg No: {soc.registrationNumber}</span>
                        </span>
                      )}
                      {soc.resolutionNumber && (
                        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#EEF2FF] text-[#4338CA] border border-[#C7D2FE] font-medium text-[11px]">
                          <IonIcon name="document-attach-outline" size={13} className="text-[#4F46E5]" />
                          <span>Resolution / Token: <strong>{soc.resolutionNumber}</strong></span>
                        </span>
                      )}
                      {soc.committeeHead && soc.committeeHead !== "Management Committee" && (
                        <span className="flex items-center gap-1 text-[#047857] bg-[#ECFDF5] px-2 py-0.5 rounded-md border border-[#A7F3D0] text-[11px] font-medium">
                          <IonIcon name="shield-checkmark-outline" size={13} className="text-[#10B981]" />
                          <span>{soc.committeeRole || "Secretary"}: <strong>{soc.committeeHead}</strong></span>
                        </span>
                      )}
                    </div>

                    {/* Wings Breakdown */}
                    <div className="pt-2 border-t border-[#F3F4F6] flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-semibold text-[#1A1A1A] flex items-center gap-1">
                        <IonIcon name="grid-outline" size={14} className="text-[#6B7280]" />
                        Wings ({soc.totalWings || (soc.wings.length > 0 ? soc.wings.length : 1)}):
                      </span>
                      {soc.wings && soc.wings.length > 0 ? (
                        soc.wings.map((w, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md bg-[#EEF2FF] text-[#4F46E5] font-semibold text-[11px]"
                          >
                            {w}
                          </span>
                        ))
                      ) : (
                        <span className="text-[#9CA3AF] italic text-[11px]">
                          Default Main Wing
                        </span>
                      )}
                      <span className="text-[#9CA3AF] text-[11px] ml-2">
                        • {soc.totalFlats} Total Flats
                      </span>
                    </div>
                  </div>

                  {/* Super Admin Verification / Approval / Rejection Actions */}
                  <div className="flex items-center gap-2 self-start lg:self-center shrink-0">
                    {soc.status !== "ACTIVE" ? (
                      <>
                        <AppButton
                          variant="hero"
                          size="sm"
                          leftIcon="checkmark-circle-outline"
                          isLoading={processingId === soc.id}
                          onClick={() => handleSocietyDecision(soc.id, "APPROVE")}
                        >
                          Verify &amp; Approve
                        </AppButton>
                        <AppButton
                          variant="outline"
                          size="sm"
                          leftIcon="close-circle-outline"
                          className="text-[#F43F5E] hover:bg-[#FFF1F2] border-[#FECDD3]"
                          isLoading={processingId === soc.id}
                          onClick={() => handleSocietyDecision(soc.id, "REJECT")}
                        >
                          Reject
                        </AppButton>
                      </>
                    ) : (
                      <div className="flex items-center gap-2">
                        <AppButton
                          variant="secondary"
                          size="sm"
                          leftIcon="checkmark-done-circle"
                          className="bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 font-bold"
                          isLoading={processingId === soc.id}
                          onClick={() => handleSocietyDecision(soc.id, "APPROVE")}
                          title="Verified & Active (Click to re-verify society and memberships)"
                        >
                          Verified &amp; Active
                        </AppButton>
                        <AppButton
                          variant="outline"
                          size="sm"
                          className="text-[#6B7280] hover:text-[#F43F5E] hover:bg-[#FFF1F2] border-[#E5E7EB]"
                          isLoading={processingId === soc.id}
                          onClick={() => handleSocietyDecision(soc.id, "REJECT")}
                          title="Deactivate Society"
                        >
                          Deactivate
                        </AppButton>
                      </div>
                    )}
                  </div>
                </div>
              </AppCard>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
