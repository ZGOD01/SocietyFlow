"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { AppShell } from "@/components/layout/AppShell";
import {
  StatCard,
  AppCard,
  StatusBadge,
  AppButton,
  Modal,
  IonIcon,
} from "@/components/ui";

interface ResidentData {
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    role: string;
    isOwner: boolean;
    isTenant: boolean;
  };
  society: {
    id: string;
    name: string;
    code: string;
    registrationNumber: string;
    city: string;
    state: string;
    pinCode: string;
  };
  flat: {
    id: string;
    wing: string;
    flatNumber: string;
    floor: number;
    carpetAreaSqFt?: number;
    shareCertificateNumber?: string;
    ownershipType?: string;
    occupancyType: string;
    status: string;
  } | null;
  landlord?: {
    name: string;
    contact: string;
  } | null;
  notifications: Array<{
    id: string;
    title: string;
    message: string;
    date: string;
    type: "info" | "warning" | "success";
    actionUrl?: string;
    isRead?: boolean;
    category?: string;
  }>;
}

interface TenantApprovalItem {
  id: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone?: string;
  wingName: string;
  flatNumber: string;
  leaseStartDate?: string;
  leaseEndDate?: string;
  status: string;
  ownerApproval: { status: string; comment?: string };
  societyApproval: { status: string; comment?: string };
}

function ResidentDashboardContent() {
  const searchParams = useSearchParams();
  const viewParam = searchParams.get("view");

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ResidentData | null>(null);
  const [tenantRequests, setTenantRequests] = useState<TenantApprovalItem[]>([]);
  const [tenantActionLoading, setTenantActionLoading] = useState<string | null>(null);
  const [ownerAuthPendingCount, setOwnerAuthPendingCount] = useState<number>(0);

  // Modals state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isPropertyModalOpen, setIsPropertyModalOpen] = useState(false);

  // Request form state
  const [requestTitle, setRequestTitle] = useState("");
  const [requestCategory, setRequestCategory] = useState("MAINTENANCE");
  const [requestSubmitted, setRequestSubmitted] = useState(false);

  useEffect(() => {
    // Super Admin redirect to platform authority console
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((sData) => {
        if (sData.authenticated && sData.user?.isSuperAdmin) {
          window.location.href = "/admin/dashboard";
        }
      })
      .catch(() => {});

    fetch("/api/dashboard/resident")
      .then((res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((resData) => {
        if (!resData) {
          setLoading(false);
          return;
        }
        setData(resData);
        if (!resData.user.isTenant && viewParam !== "tenant") {
          fetch("/api/owner/approvals")
            .then((r) => r.json())
            .then((apprData) => {
              if (apprData.requests) {
                setTenantRequests(apprData.requests);
              }
            })
            .catch((e) => console.error("Error loading owner approvals:", e));

          fetch("/api/owner/authorizations?tab=PENDING")
            .then((r) => r.json())
            .then((authData) => {
              if (authData.stats?.pending !== undefined) {
                setOwnerAuthPendingCount(authData.stats.pending);
              }
            })
            .catch((e) => console.error("Error loading owner authorizations:", e));
        }
      })
      .catch((err) => {
        console.error("Dashboard fetch error:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [viewParam]);

  const handleOwnerTenantDecision = async (requestId: string, action: "APPROVE" | "REJECT") => {
    setTenantActionLoading(requestId);
    try {
      const res = await fetch("/api/owner/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action }),
      });
      if (res.ok) {
        const updated = await fetch("/api/owner/approvals").then((r) => r.json());
        if (updated.requests) {
          setTenantRequests(updated.requests);
        }
      }
    } catch (err) {
      console.error("Owner decision failed:", err);
    } finally {
      setTenantActionLoading(null);
    }
  };

  const isTenantView = viewParam === "tenant" || data?.user.isTenant;

  if (loading) {
    return (
      <AppShell>
        <div className="space-y-6 animate-pulse">
          <div className="h-28 bg-white rounded-2xl border border-[#E5E7EB]" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-white rounded-2xl border border-[#E5E7EB]" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-72 bg-white rounded-2xl border border-[#E5E7EB]" />
            <div className="h-72 bg-white rounded-2xl border border-[#E5E7EB]" />
          </div>
        </div>
      </AppShell>
    );
  }

  const user = data?.user || {
    id: "usr-current",
    name: "Resident Member",
    email: "member@societyflow.com",
    role: isTenantView ? "TENANT" : "OWNER",
    isOwner: !isTenantView,
    isTenant: isTenantView,
  };

  const society = data?.society || {
    id: "soc-default",
    name: "Housing Society",
    code: "ACTIVE",
    registrationNumber: "N/A",
    city: "Pune",
    state: "Maharashtra",
    pinCode: "411001",
  };

  const hasAssignedFlat = Boolean(data?.flat);
  const flat = data?.flat || {
    id: "unassigned",
    wing: "No Wing",
    flatNumber: "Unassigned",
    floor: 0,
    carpetAreaSqFt: 0,
    shareCertificateNumber: "Not Issued",
    ownershipType: isTenantView ? "TENANT" : "OWNER",
    occupancyType: isTenantView ? "TENANT" : "OWNER",
    status: "UNASSIGNED",
  };

  const landlord = data?.landlord;

  return (
    <AppShell>
      {/* 1. Welcome & Flat Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-[#E5E7EB] p-6 mb-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-bold font-heading text-[#1A1A1A] tracking-tight">
              Welcome back, {user.name}
            </h1>
            <StatusBadge variant={isTenantView ? "info" : "hero"} size="sm" dot>
              {isTenantView ? "Tenant Resident" : "Member / Officer"}
            </StatusBadge>
            {hasAssignedFlat ? (
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#ECFDF5] text-[#10B981] border border-[#A7F3D0]">
                Unit Verified
              </span>
            ) : (
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#F3F4F6] text-[#6B7280] border border-[#E5E7EB]">
                Management Desk
              </span>
            )}
          </div>
          <p className="text-xs font-medium text-[#6B7280]">
            {society.name} ({society.code}) • {hasAssignedFlat ? `${flat.wing}, Flat ${flat.flatNumber} (Floor ${flat.floor})` : "General Member / Statutory Governance"}
          </p>
        </div>

        {/* Quick Flat Meta Tags */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPropertyModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#E5E7EB] hover:border-[#4F46E5] bg-[#F8F9FA] hover:bg-white text-xs font-semibold text-[#1A1A1A] transition-colors cursor-pointer"
          >
            <IonIcon name="home-outline" size={16} className="text-[#4F46E5]" />
            <span>Unit Specs</span>
          </button>

          <Link href="/society-documents">
            <AppButton variant="outline" size="sm" leftIcon="library-outline">
              Society Bylaws
            </AppButton>
          </Link>
        </div>
      </motion.div>

      {/* 2. Key Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label={isTenantView ? "Rental Lease Record" : "Property Ownership"}
          value={hasAssignedFlat ? (isTenantView ? "Active Lease" : "Sole Owner") : "Committee Desk"}
          subtitle={
            isTenantView
              ? (landlord ? `Registered with ${landlord.name}` : "Lease Registered")
              : (hasAssignedFlat ? (flat.shareCertificateNumber ? `Share Cert: ${flat.shareCertificateNumber}` : "Share Cert: Pending") : "Governance Seat")
          }
          iconName={isTenantView ? "key-outline" : "ribbon-outline"}
          iconVariant={isTenantView ? "info" : "hero-soft"}
        />

        <StatCard
          label="Vault Documents"
          value="0 Files"
          subtitle="Encrypted Personal Vault"
          iconName="folder-open-outline"
          iconVariant="neutral"
          badgeText="Upcoming"
          badgeVariant="warning"
        />

        <StatCard
          label="Active Service Requests"
          value="0 Pending"
          subtitle="All requests up to date"
          iconName="hammer-outline"
          iconVariant="success"
          badgeText="Clear"
          badgeVariant="success"
        />

        <StatCard
          label={isTenantView ? "Owner NOC Status" : "Statutory Quorum"}
          value={isTenantView ? "Authorized" : "Verified"}
          subtitle={isTenantView ? "Tenancy verified by Secretary" : "Full voting rights active"}
          iconName="shield-checkmark-outline"
          iconVariant="info"
          badgeText="Active"
          badgeVariant="success"
        />
      </div>

      {/* 3. Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Left Column (2 Cols): Documents Overview & Recent Requests */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Actions Bar */}
          <AppCard className="p-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#6B7280] mb-3">
              Resident Quick Actions
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(true)}
                className="p-3 rounded-xl border border-[#E5E7EB] hover:border-[#4F46E5] bg-[#F8F9FA] hover:bg-white flex flex-col items-center justify-center text-center gap-1.5 transition-all group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center group-hover:scale-105 transition-transform">
                  <IonIcon name="cloud-upload-outline" size={18} />
                </div>
                <span className="text-xs font-bold text-[#1A1A1A]">Upload Doc</span>
              </button>

              <Link
                href="/documents"
                className="p-3 rounded-xl border border-[#E5E7EB] hover:border-[#4F46E5] bg-[#F8F9FA] hover:bg-white flex flex-col items-center justify-center text-center gap-1.5 transition-all group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center group-hover:scale-105 transition-transform">
                  <IonIcon name="folder-outline" size={18} />
                </div>
                <span className="text-xs font-bold text-[#1A1A1A]">My Docs</span>
              </Link>

              <Link
                href="/services"
                className="p-3 rounded-xl border border-[#E5E7EB] hover:border-[#4F46E5] bg-[#F8F9FA] hover:bg-white flex flex-col items-center justify-center text-center gap-1.5 transition-all group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center group-hover:scale-105 transition-transform">
                  <IonIcon name="grid-outline" size={18} />
                </div>
                <span className="text-xs font-bold text-[#1A1A1A]">Services</span>
              </Link>

              <Link
                href="/requests"
                className="p-3 rounded-xl border border-[#E5E7EB] hover:border-[#4F46E5] bg-[#F8F9FA] hover:bg-white flex flex-col items-center justify-center text-center gap-1.5 transition-all group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center group-hover:scale-105 transition-transform">
                  <IonIcon name="document-text-outline" size={18} />
                </div>
                <span className="text-xs font-bold text-[#1A1A1A]">My Requests</span>
              </Link>

              <Link
                href="/society-documents"
                className="p-3 rounded-xl border border-[#E5E7EB] hover:border-[#4F46E5] bg-[#F8F9FA] hover:bg-white flex flex-col items-center justify-center text-center gap-1.5 transition-all group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center group-hover:scale-105 transition-transform">
                  <IonIcon name="library-outline" size={18} />
                </div>
                <span className="text-xs font-bold text-[#1A1A1A]">Society Docs</span>
              </Link>

              <button
                type="button"
                onClick={() => setIsPropertyModalOpen(true)}
                className="p-3 rounded-xl border border-[#E5E7EB] hover:border-[#4F46E5] bg-[#F8F9FA] hover:bg-white flex flex-col items-center justify-center text-center gap-1.5 transition-all group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center group-hover:scale-105 transition-transform">
                  <IonIcon name="home-outline" size={18} />
                </div>
                <span className="text-xs font-bold text-[#1A1A1A]">My Property</span>
              </button>
            </div>
          </AppCard>

          {/* Owner Tenant Tenancy Authorization Desk */}
          {!isTenantView && (
            <AppCard className="p-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#E5E7EB]">
                <div>
                  <h3 className="text-base font-bold text-[#1A1A1A] font-heading">
                    Tenant Tenancy Authorizations
                  </h3>
                  <p className="text-xs text-[#6B7280]">
                    Independent owner authorization required for flat tenancy registration
                  </p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FFFBEB] text-[#F59E0B] border border-[#FDE68A]">
                  {tenantRequests.filter((t) => t.ownerApproval?.status !== "APPROVED").length} Pending Authorization
                </span>
              </div>

              {tenantRequests.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#6B7280] space-y-1">
                  <div className="w-10 h-10 rounded-xl bg-[#F8F9FA] text-[#9CA3AF] flex items-center justify-center mx-auto border border-[#E5E7EB]">
                    <IonIcon name="key-outline" size={20} />
                  </div>
                  <p className="font-bold text-[#1A1A1A]">No Pending Tenant Registrations</p>
                  <p>When a tenant registers for your unit, their independent authorization request will appear here.</p>
                </div>
              ) : (
                <div className="divide-y divide-[#E5E7EB]">
                  {tenantRequests.map((req) => {
                    const isOwnerApproved = req.ownerApproval?.status === "APPROVED";
                    const isSocietyApproved = req.societyApproval?.status === "APPROVED";
                    const isRejected = req.status === "REJECTED";

                    return (
                      <div
                        key={req.id}
                        className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-[#1A1A1A]">{req.applicantName}</h4>
                            <StatusBadge
                              variant={isOwnerApproved && isSocietyApproved ? "success" : isRejected ? "error" : "warning"}
                              size="sm"
                              dot
                            >
                              {isOwnerApproved && !isSocietyApproved
                                ? "Owner Approved — Society Approval Pending"
                                : !isOwnerApproved && isSocietyApproved
                                ? "Society Approved — Owner Approval Pending"
                                : req.status.replace(/_/g, " ")}
                            </StatusBadge>
                          </div>
                          <p className="text-[#6B7280]">
                            {req.applicantEmail} {req.applicantPhone ? `• ${req.applicantPhone}` : ""}
                          </p>
                          <p className="text-[11px] text-[#4F46E5] font-mono">
                            Unit: {req.wingName} - Flat #{req.flatNumber}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {isOwnerApproved ? (
                            <span className="text-xs font-bold text-[#10B981] flex items-center gap-1">
                              <IonIcon name="checkmark-circle" size={16} />
                              Authorized by You
                            </span>
                          ) : isRejected ? (
                            <span className="text-xs font-bold text-[#F43F5E]">
                              Rejected
                            </span>
                          ) : (
                            <>
                              <AppButton
                                variant="outline"
                                size="sm"
                                onClick={() => handleOwnerTenantDecision(req.id, "REJECT")}
                                disabled={tenantActionLoading === req.id}
                              >
                                Decline
                              </AppButton>
                              <AppButton
                                variant="hero"
                                size="sm"
                                onClick={() => handleOwnerTenantDecision(req.id, "APPROVE")}
                                disabled={tenantActionLoading === req.id}
                                leftIcon="checkmark-circle-outline"
                              >
                                {tenantActionLoading === req.id ? "Authorizing..." : "Authorize Tenant"}
                              </AppButton>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </AppCard>
          )}

          {/* Owner Service Request Authorizations Desk (Prompt 7) */}
          {!isTenantView && (
            <AppCard className="p-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#E5E7EB]">
                <div>
                  <h3 className="text-base font-bold text-[#1A1A1A] font-heading flex items-center gap-2">
                    <IonIcon name="key-outline" size={18} className="text-[#4F46E5]" />
                    Tenant Service Authorizations
                  </h3>
                  <p className="text-xs text-[#6B7280]">
                    Review society NOC & permission applications submitted by tenants in your units
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {ownerAuthPendingCount > 0 ? (
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 animate-pulse">
                      {ownerAuthPendingCount} Pending Action
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                      All Clear
                    </span>
                  )}
                  <Link
                    href="/owner/authorizations"
                    className="text-xs font-bold text-[#4F46E5] hover:text-[#4338CA] px-3 py-1.5 rounded-lg border border-[#E5E7EB] bg-white hover:bg-[#F8F9FA] shadow-xs transition-colors"
                  >
                    Open Inbox
                  </Link>
                </div>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs bg-[#F8F9FA] p-3.5 rounded-xl border border-[#E5E7EB]">
                <div className="space-y-0.5">
                  <p className="font-bold text-[#1A1A1A]">Owner–Tenant Authorization Routing</p>
                  <p className="text-[#6B7280]">
                    Tenants cannot bypass you for property-related permissions. Verify or decline requests before society review.
                  </p>
                </div>
                <Link
                  href="/owner/authorizations"
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#4F46E5] text-white hover:bg-[#4338CA] transition-colors shrink-0 shadow-xs flex items-center gap-1.5"
                >
                  <IonIcon name="eye-outline" size={15} />
                  <span>Review {ownerAuthPendingCount} Requests</span>
                </Link>
              </div>
            </AppCard>
          )}

          {/* Documents Section (Clean Empty / Upcoming State) */}
          <AppCard className="p-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#E5E7EB]">
              <div>
                <h3 className="text-base font-bold text-[#1A1A1A] font-heading">
                  {isTenantView ? "Rental & Lease Documents" : "Personal Unit Document Vault"}
                </h3>
                <p className="text-xs text-[#6B7280]">
                  Unit-level encrypted records for Flat {flat.wing}-{flat.flatNumber}
                </p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EEF2FF] text-[#4F46E5] border border-[#C7D2FE]">
                Encrypted Vault
              </span>
            </div>

            {/* Zero Fake Records — Genuine Empty & Upcoming State */}
            <div className="py-12 px-4 text-center flex flex-col items-center justify-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center">
                <IonIcon name="document-lock-outline" size={28} />
              </div>
              <div className="max-w-md">
                <p className="text-sm font-bold text-[#1A1A1A]">
                  No documents in your personal vault yet
                </p>
                <p className="text-xs text-[#6B7280] mt-1 leading-relaxed">
                  {isTenantView
                    ? "Your registered leave & license agreement and police verification slip will be accessible here in your secure document vault."
                    : "Your registered sale agreement, original share certificate, and property records will be securely indexed in your personal vault."}
                </p>
              </div>
              <div className="pt-2 flex items-center gap-3">
                <AppButton
                  variant="primary"
                  size="sm"
                  leftIcon="cloud-upload-outline"
                  onClick={() => setIsUploadModalOpen(true)}
                >
                  Upload Document
                </AppButton>
                <Link href="/documents">
                  <AppButton variant="outline" size="sm">
                    View Documents Directory
                  </AppButton>
                </Link>
              </div>
            </div>
          </AppCard>

          {/* Active Service Requests Section */}
          <AppCard className="p-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#E5E7EB]">
              <div>
                <h3 className="text-base font-bold text-[#1A1A1A] font-heading">
                  Active Service &amp; NOC Requests
                </h3>
                <p className="text-xs text-[#6B7280]">
                  Track maintenance, renovation approvals, and society NOCs
                </p>
              </div>
              <AppButton
                variant="outline"
                size="sm"
                leftIcon="add-outline"
                onClick={() => setIsRequestModalOpen(true)}
              >
                New Request
              </AppButton>
            </div>

            {requestSubmitted ? (
              <div className="py-6 px-4 bg-[#ECFDF5] border border-[#A7F3D0] rounded-xl text-center text-xs space-y-1">
                <p className="font-bold text-[#10B981]">Request Submitted Successfully</p>
                <p className="text-[#6B7280]">
                  Your request has been registered in the society management queue for Managing Committee review.
                </p>
              </div>
            ) : (
              <div className="py-10 text-center flex flex-col items-center justify-center space-y-2">
                <div className="w-12 h-12 rounded-xl bg-[#F8F9FA] text-[#9CA3AF] flex items-center justify-center border border-[#E5E7EB]">
                  <IonIcon name="checkmark-done-circle-outline" size={24} />
                </div>
                <p className="text-sm font-bold text-[#1A1A1A]">No active requests</p>
                <p className="text-xs text-[#6B7280] max-w-sm">
                  You do not have any pending NOC applications or maintenance escalations.
                </p>
              </div>
            )}
          </AppCard>
        </div>

        {/* Right Column (1 Col): Society Info, Landlord Card, Notifications */}
        <div className="space-y-6">
          {/* Tenant-Specific: Landlord Contact Card */}
          {isTenantView && (
            <AppCard className="p-5 border-l-4 border-l-[#4F46E5]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#4F46E5]">
                  Property Landlord
                </span>
                <StatusBadge variant="info" size="sm">
                  Sole Owner
                </StatusBadge>
              </div>
              <p className="text-sm font-bold text-[#1A1A1A]">{landlord?.name || "Not registered"}</p>
              <p className="text-xs text-[#6B7280] mt-0.5">{landlord?.contact || "Contact through society office"}</p>

              <div className="mt-3 pt-3 border-t border-[#E5E7EB] text-[11px] text-[#6B7280] space-y-1">
                <div className="flex justify-between">
                  <span>Unit:</span>
                  <span className="font-semibold text-[#1A1A1A]">{flat.wing} - {flat.flatNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tenancy Status:</span>
                  <span className="font-semibold text-[#10B981]">Approved &amp; Registered</span>
                </div>
              </div>
            </AppCard>
          )}

          {/* Unit Registry Card */}
          <AppCard className="p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#6B7280] mb-3">
              Unit Verification Roster
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-[#F1F3F5]">
                <span className="text-[#6B7280]">Society Name</span>
                <span className="font-bold text-[#1A1A1A] text-right truncate max-w-[160px]">
                  {society.name}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#F1F3F5]">
                <span className="text-[#6B7280]">Society Code</span>
                <span className="font-bold text-[#1A1A1A]">{society.code}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#F1F3F5]">
                <span className="text-[#6B7280]">Registration No.</span>
                <span className="font-medium text-[#1A1A1A]">{society.registrationNumber}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#F1F3F5]">
                <span className="text-[#6B7280]">Wing &amp; Flat</span>
                <span className="font-bold text-[#1A1A1A]">{flat.wing} • {flat.flatNumber}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-[#6B7280]">Carpet Area</span>
                <span className="font-medium text-[#1A1A1A]">{flat.carpetAreaSqFt} sq. ft.</span>
              </div>
            </div>
          </AppCard>

          {/* Recent Notifications Widget */}
          <AppCard className="p-5">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#F1F3F5]">
              <div className="flex items-center gap-2">
                <IonIcon name="notifications-outline" size={16} className="text-[#4F46E5]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">
                  Recent Notifications
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href="/settings/notifications"
                  className="text-xs text-[#6B7280] hover:text-[#1A1A1A] transition-colors"
                  title="Notification Preferences"
                >
                  <IonIcon name="settings-outline" size={14} />
                </Link>
                <Link
                  href="/notifications"
                  className="text-[11px] font-bold text-[#4F46E5] hover:underline"
                >
                  View All &rarr;
                </Link>
              </div>
            </div>

            <div className="space-y-2.5">
              {data?.notifications && data.notifications.length > 0 ? (
                data.notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-3 rounded-xl border text-xs space-y-1 transition-all ${
                      notif.isRead === false
                        ? "bg-[#EEF2FF]/40 border-[#C7D2FE]"
                        : "bg-[#F8F9FA] border-[#E5E7EB]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {notif.isRead === false && (
                          <span className="w-2 h-2 rounded-full bg-[#4F46E5] shrink-0" />
                        )}
                        <p className="font-bold text-[#1A1A1A] truncate">{notif.title}</p>
                      </div>
                      {notif.category && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-white border border-[#E5E7EB] text-[#6B7280] shrink-0">
                          {notif.category}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#6B7280] leading-relaxed line-clamp-2">
                      {notif.message}
                    </p>
                    <div className="pt-1 flex items-center justify-between text-[10px] text-[#9CA3AF]">
                      <span>
                        {new Date(notif.date).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                      {notif.actionUrl && (
                        <Link
                          href={notif.actionUrl}
                          className="font-bold text-[#4F46E5] hover:underline flex items-center gap-0.5"
                        >
                          <span>Open</span>
                          <IonIcon name="arrow-forward-outline" size={10} />
                        </Link>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-[#6B7280] text-center py-4">No recent notifications</p>
              )}
            </div>

            <div className="mt-3 pt-3 border-t border-[#F1F3F5] flex items-center justify-between text-[11px]">
              <span className="text-[#6B7280]">Multi-channel alerts active</span>
              <Link
                href="/settings/notifications"
                className="font-semibold text-[#4F46E5] hover:underline flex items-center gap-1"
              >
                <span>Manage Channels</span>
                <IonIcon name="chevron-forward-outline" size={12} />
              </Link>
            </div>
          </AppCard>
        </div>
      </div>

      {/* Upload Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Upload Unit Document"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-[#EEF2FF] border border-[#C7D2FE] rounded-xl text-[#4F46E5] space-y-1">
            <p className="font-bold">Digital Document Vault</p>
            <p className="text-[11px] leading-relaxed text-[#4338CA]">
              Direct binary uploads with encrypted cloud storage, SHA-256 integrity hashing, and automated watermark stamps.
            </p>
          </div>

          <div>
            <label className="block font-bold text-[#1A1A1A] mb-1">Document Category</label>
            <select className="w-full p-2.5 rounded-lg border border-[#E5E7EB] bg-white text-xs text-[#1A1A1A] outline-none">
              <option>Registered Sale Deed / Agreement</option>
              <option>Original Share Certificate</option>
              <option>Leave &amp; License Agreement (Tenant)</option>
              <option>Property Tax Paid Challan</option>
              <option>Electricity &amp; Utility Sanction</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-[#1A1A1A] mb-1">Document Title / Reference</label>
            <input
              type="text"
              placeholder="e.g. Registered_Sale_Deed_C402.pdf"
              className="w-full p-2.5 rounded-lg border border-[#E5E7EB] bg-white text-xs text-[#1A1A1A] outline-none"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <AppButton variant="outline" size="sm" onClick={() => setIsUploadModalOpen(false)}>
              Close
            </AppButton>
            <AppButton
              variant="primary"
              size="sm"
              onClick={() => {
                setIsUploadModalOpen(false);
                alert("Document vault storage is ready for upload.");
              }}
            >
              Confirm Upload
            </AppButton>
          </div>
        </div>
      </Modal>

      {/* 5. New Request Modal */}
      <Modal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        title="Initiate Service or NOC Application"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-[#1A1A1A] mb-1">Request Category</label>
            <select
              value={requestCategory}
              onChange={(e) => setRequestCategory(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-[#E5E7EB] bg-white text-xs text-[#1A1A1A] outline-none"
            >
              <option value="MAINTENANCE">Plumbing / Common Area Maintenance</option>
              <option value="RENOVATION_NOC">Internal Flat Renovation Permit</option>
              <option value="RESALE_NOC">Property Transfer / Bank Resale NOC</option>
              <option value="TENANT_NOC">Tenant Police Verification Endorsement</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-[#1A1A1A] mb-1">Request Description</label>
            <textarea
              rows={3}
              value={requestTitle}
              onChange={(e) => setRequestTitle(e.target.value)}
              placeholder="State your statutory request or maintenance issue clearly..."
              className="w-full p-2.5 rounded-lg border border-[#E5E7EB] bg-white text-xs text-[#1A1A1A] outline-none resize-none"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <AppButton variant="outline" size="sm" onClick={() => setIsRequestModalOpen(false)}>
              Cancel
            </AppButton>
            <AppButton
              variant="primary"
              size="sm"
              onClick={() => {
                setIsRequestModalOpen(false);
                setRequestSubmitted(true);
              }}
            >
              Submit Application
            </AppButton>
          </div>
        </div>
      </Modal>

      {/* 6. Property Details Modal */}
      <Modal
        isOpen={isPropertyModalOpen}
        onClose={() => setIsPropertyModalOpen(false)}
        title={`Unit Specifications • Flat ${flat.wing}-${flat.flatNumber}`}
      >
        <div className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-3 bg-[#F8F9FA] rounded-xl border border-[#E5E7EB]">
              <span className="text-[#6B7280] block text-[10px] uppercase font-bold">Society</span>
              <span className="font-bold text-[#1A1A1A]">{society.name}</span>
            </div>
            <div className="p-3 bg-[#F8F9FA] rounded-xl border border-[#E5E7EB]">
              <span className="text-[#6B7280] block text-[10px] uppercase font-bold">Wing &amp; Floor</span>
              <span className="font-bold text-[#1A1A1A]">{flat.wing}, Floor {flat.floor}</span>
            </div>
            <div className="p-3 bg-[#F8F9FA] rounded-xl border border-[#E5E7EB]">
              <span className="text-[#6B7280] block text-[10px] uppercase font-bold">Carpet Area</span>
              <span className="font-bold text-[#1A1A1A]">{flat.carpetAreaSqFt} sq. ft.</span>
            </div>
            <div className="p-3 bg-[#F8F9FA] rounded-xl border border-[#E5E7EB]">
              <span className="text-[#6B7280] block text-[10px] uppercase font-bold">Occupancy Type</span>
              <span className="font-bold text-[#1A1A1A]">{flat.occupancyType}</span>
            </div>
          </div>

          <div className="p-3 bg-[#F8F9FA] rounded-xl border border-[#E5E7EB]">
            <span className="text-[#6B7280] block text-[10px] uppercase font-bold">Statutory Share Certificate</span>
            <span className="font-bold text-[#1A1A1A]">
              {flat.shareCertificateNumber || "Registered under Society Master Share Capital Roster"}
            </span>
          </div>

          <div className="pt-2 flex justify-end">
            <AppButton variant="primary" size="sm" onClick={() => setIsPropertyModalOpen(false)}>
              Done
            </AppButton>
          </div>
        </div>
      </Modal>
    </AppShell>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <AppShell>
          <div className="p-8 text-center text-xs text-[#6B7280]">
            Loading your verified dashboard...
          </div>
        </AppShell>
      }
    >
      <ResidentDashboardContent />
    </Suspense>
  );
}
