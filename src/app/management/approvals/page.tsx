"use client";

import React, { useState, useEffect, Suspense, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import {
  PageHeader,
  AppCard,
  StatusBadge,
  AppButton,
  IconContainer,
  IonIcon,
} from "@/components/ui";

interface ApprovalRequestItem {
  id: string;
  requestId: string;
  serviceCode: string;
  serviceTitle: string;
  serviceCategory: string;
  applicantName: string;
  applicantRole: "OWNER" | "TENANT";
  societyName: string;
  wingName: string;
  flatNumber: string;
  submissionDate: string;
  currentStatus: string;
  currentStage: {
    stageIndex: number;
    stageKey: string;
    stageName: string;
    stageType: string;
    allowedRoles: string[];
    status: string;
    dueDate?: string;
    approvalsReceivedCount: number;
    requiredSignersCount: number;
  } | null;
  sla: {
    pendingDurationHours: number;
    expectedCompletionDate: string | null;
    isOverdue: boolean;
  };
  canCurrentOfficialApprove: boolean;
  officialRoleUsed: string;
  isDelegatedAuthority: boolean;
  unverifiedDocsCount: number;
  totalDocsCount: number;
  hasGeneratedDocument: boolean;
  generatedDocumentRef?: string;
}

interface RegistrationRequestItem {
  id: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone?: string;
  role: string;
  societyId?: string;
  societyName?: string;
  societyCode?: string;
  managementPosition?: string;
  flatNumber: string;
  wingName: string;
  status: string;
  createdAt: string;
  onboardingStatus?: string;
  existingOccupancy?: {
    isConflict?: boolean;
    ownerName?: string;
  } | null;
}

interface QueueStats {
  all: number;
  pendingMyApproval: number;
  awaitingOtherOfficials: number;
  documentVerification: number;
  informationRequired: number;
  approved: number;
  rejected: number;
  completed: number;
  overdueCount: number;
}

function ApprovalsInboxContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Mode: "SERVICE" vs "REGISTRATION"
  const [queueMode, setQueueMode] = useState<"SERVICE" | "REGISTRATION">("SERVICE");
  const [activeTab, setActiveTab] = useState<string>("PENDING_MY_APPROVAL");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const [serviceRequests, setServiceRequests] = useState<ApprovalRequestItem[]>([]);
  const [registrationRequests, setRegistrationRequests] = useState<RegistrationRequestItem[]>([]);
  const [stats, setStats] = useState<QueueStats>({
    all: 0,
    pendingMyApproval: 0,
    awaitingOtherOfficials: 0,
    documentVerification: 0,
    informationRequired: 0,
    approved: 0,
    rejected: 0,
    completed: 0,
    overdueCount: 0,
  });

  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const handleRegistrationAction = async (requestId: string, action: "APPROVE" | "REJECT") => {
    setActionLoadingId(requestId);
    try {
      const res = await fetch("/api/management/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          action,
          comment:
            action === "APPROVE"
              ? "Approved by Platform Administrator"
              : "Rejected by Platform Administrator",
        }),
      });
      const data = await res.json();
      if (data.success) {
        await loadData();
      } else {
        alert(data.error || "Failed to process registration");
      }
    } catch (e) {
      console.error(e);
      alert("An error occurred while processing approval.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      if (queueMode === "SERVICE") {
        const queryParams = new URLSearchParams();
        queryParams.set("type", "SERVICE");
        queryParams.set("tab", activeTab);
        if (searchQuery.trim()) queryParams.set("search", searchQuery.trim());

        const res = await fetch(`/api/management/approvals?${queryParams.toString()}`);
        const data = await res.json();
        if (data.success) {
          setServiceRequests(data.requests || []);
          if (data.stats) setStats(data.stats);
        }
      } else {
        const res = await fetch(`/api/management/approvals?type=REGISTRATION`);
        const data = await res.json();
        if (data.success) {
          setRegistrationRequests(data.requests || []);
        }
      }
    } catch (err) {
      console.error("[Approval Inbox Fetch Error]", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [queueMode, activeTab]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const tabs = [
    { key: "PENDING_MY_APPROVAL", label: "Pending My Approval", count: stats.pendingMyApproval, highlight: true },
    { key: "AWAITING_OTHER_OFFICIALS", label: "Awaiting Others", count: stats.awaitingOtherOfficials },
    { key: "DOCUMENT_VERIFICATION", label: "Document Verification", count: stats.documentVerification },
    { key: "INFORMATION_REQUIRED", label: "Info Required", count: stats.informationRequired },
    { key: "ALL", label: "All Requests", count: stats.all },
    { key: "APPROVED", label: "Approved", count: stats.approved },
    { key: "COMPLETED", label: "Completed / Issued", count: stats.completed },
    { key: "REJECTED", label: "Rejected", count: stats.rejected },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Society Approvals Engine"
        description="Multi-signatory remote review console for Managing Committee, Secretary, Chairman & Treasurer"
        breadcrumbs={[
          { label: "Console", href: "/management/dashboard" },
          { label: "Approvals Inbox" },
        ]}
        actions={
          <div className="flex items-center gap-3">
            <Link href="/management/workflows">
              <AppButton variant="outline" size="sm">
                <IonIcon name="git-network-outline" className="mr-1.5" />
                Configure Workflows
              </AppButton>
            </Link>
            <Link href="/management/approvals">
              <AppButton variant="primary" size="sm" onClick={() => loadData()}>
                <IonIcon name="refresh-outline" className="mr-1.5" />
                Refresh
              </AppButton>
            </Link>
          </div>
        }
      />

      {/* Mode Separation: Service Requests vs Resident Registrations */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-3 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 mr-2">Queue Domain:</span>
          <button
            onClick={() => {
              setQueueMode("SERVICE");
              setActiveTab("PENDING_MY_APPROVAL");
            }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              queueMode === "SERVICE"
                ? "bg-[#4F46E5] text-white shadow-sm"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <IonIcon name="document-text-outline" className="mr-1.5 align-middle" />
            Service Approvals
          </button>
          <button
            onClick={() => setQueueMode("REGISTRATION")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              queueMode === "REGISTRATION"
                ? "bg-[#4F46E5] text-white shadow-sm"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <IonIcon name="people-outline" className="mr-1.5 align-middle" />
            Registration Approvals
          </button>
        </div>

        {stats.overdueCount > 0 && queueMode === "SERVICE" && (
          <div className="flex items-center gap-2 bg-red-50 text-red-700 px-3 py-1.5 rounded-xl border border-red-200 text-xs font-semibold">
            <IonIcon name="alert-circle" className="text-red-600 text-base" />
            <span>{stats.overdueCount} Request{stats.overdueCount > 1 ? "s" : ""} Overdue SLA Target</span>
          </div>
        )}
      </div>

      {queueMode === "SERVICE" && (
        <>
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Action Required</span>
                <IconContainer name="flash-outline" variant="hero" size="sm" />
              </div>
              <div className="mt-2 text-2xl font-bold text-gray-900">{stats.pendingMyApproval}</div>
              <p className="text-xs text-indigo-600 font-medium mt-1">Pending Your Stage Approval</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Doc Verification</span>
                <IconContainer name="shield-checkmark-outline" variant="warning" size="sm" />
              </div>
              <div className="mt-2 text-2xl font-bold text-gray-900">{stats.documentVerification}</div>
              <p className="text-xs text-amber-600 font-medium mt-1">Pending Document Checks</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Awaiting Committee</span>
                <IconContainer name="time-outline" variant="neutral" size="sm" />
              </div>
              <div className="mt-2 text-2xl font-bold text-gray-900">{stats.awaitingOtherOfficials}</div>
              <p className="text-xs text-gray-500 font-medium mt-1">Assigned to Other Officials</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Completed / Issued</span>
                <IconContainer name="checkmark-done-circle-outline" variant="success" size="sm" />
              </div>
              <div className="mt-2 text-2xl font-bold text-gray-900">{stats.completed}</div>
              <p className="text-xs text-emerald-600 font-medium mt-1">Certificates Released</p>
            </div>
          </div>

          {/* Tabbed Navigation */}
          <div className="border-b border-gray-200 overflow-x-auto">
            <div className="flex space-x-2 min-w-max pb-2">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
                    activeTab === t.key
                      ? "bg-gray-900 text-white shadow-sm"
                      : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                  }`}
                >
                  <span>{t.label}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      activeTab === t.key
                        ? "bg-white/20 text-white"
                        : t.highlight && t.count > 0
                        ? "bg-indigo-100 text-indigo-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {t.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Search & Filter Bar */}
          <form onSubmit={handleSearchSubmit} className="flex gap-3">
            <div className="relative flex-1">
              <IonIcon
                name="search-outline"
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg"
              />
              <input
                type="text"
                placeholder="Search by Request ID, applicant, flat, or service name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5] text-gray-900"
              />
            </div>
            <AppButton variant="primary" type="submit" size="md">
              Search
            </AppButton>
          </form>

          {/* Service Requests List */}
          {loading ? (
            <div className="p-12 text-center text-gray-500 bg-white rounded-2xl border border-gray-200">
              <IonIcon name="sync-outline" className="animate-spin text-3xl text-indigo-600 mb-2" />
              <p className="text-sm">Loading service approval queue...</p>
            </div>
          ) : serviceRequests.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-gray-200">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400">
                <IonIcon name="checkmark-done-outline" className="text-2xl" />
              </div>
              <h3 className="text-base font-semibold text-gray-900">No requests in this queue</h3>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                There are currently no service applications matching the selected criteria.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {serviceRequests.map((item) => (
                <div
                  key={item.id}
                  className={`bg-white p-5 rounded-2xl border transition-all hover:shadow-md ${
                    item.sla.isOverdue
                      ? "border-red-300 bg-red-50/20"
                      : item.canCurrentOfficialApprove
                      ? "border-indigo-200 hover:border-indigo-300"
                      : "border-gray-200"
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-gray-900 bg-gray-100 px-2.5 py-1 rounded-md">
                          #{item.requestId}
                        </span>
                        <StatusBadge
                          variant={
                            item.currentStatus === "COMPLETED" || item.currentStatus === "APPROVED"
                              ? "success"
                              : item.currentStatus === "REJECTED"
                              ? "error"
                              : item.currentStatus === "INFORMATION_REQUIRED"
                              ? "warning"
                              : "neutral"
                          }
                          size="sm"
                        >
                          {item.currentStatus.replace(/_/g, " ")}
                        </StatusBadge>

                        {item.sla.isOverdue && (
                          <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                            <IonIcon name="time-outline" /> OVERDUE SLA
                          </span>
                        )}

                        {item.canCurrentOfficialApprove && (
                          <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                            <IonIcon name="shield-checkmark" /> READY FOR YOUR DECISION
                          </span>
                        )}

                        {item.isDelegatedAuthority && (
                          <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            DELEGATED AUTHORITY
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-bold text-gray-900">{item.serviceTitle}</h4>
                        <span className="text-xs text-gray-500 font-medium">({item.serviceCategory})</span>
                      </div>

                      <div className="text-xs text-gray-600 flex flex-wrap items-center gap-x-4 gap-y-1">
                        <span>
                          <strong className="text-gray-900">Applicant:</strong> {item.applicantName} ({item.applicantRole})
                        </span>
                        <span>
                          <strong className="text-gray-900">Unit:</strong> {item.wingName ? `${item.wingName} - ` : ""}Flat {item.flatNumber}
                        </span>
                        <span>
                          <strong className="text-gray-900">Submitted:</strong>{" "}
                          {new Date(item.submissionDate).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Stage & Approver info */}
                    <div className="flex flex-col md:items-end justify-center gap-2 border-t md:border-t-0 pt-3 md:pt-0 border-gray-100">
                      {item.currentStage ? (
                        <div className="text-left md:text-right">
                          <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">
                            Current Stage ({item.currentStage.stageIndex + 1})
                          </span>
                          <span className="text-xs font-bold text-indigo-700">
                            {item.currentStage.stageName}
                          </span>
                          <p className="text-[11px] text-gray-500">
                            Required: {item.currentStage.allowedRoles.join(" / ")}
                          </p>
                        </div>
                      ) : (
                        <div className="text-xs text-gray-500">Workflow Finalized</div>
                      )}

                      <div className="flex items-center gap-2 mt-1">
                        <Link href={`/management/approvals/${item.requestId}`}>
                          <AppButton
                            variant={item.canCurrentOfficialApprove ? "primary" : "outline"}
                            size="sm"
                          >
                            <IonIcon name="open-outline" className="mr-1.5" />
                            {item.canCurrentOfficialApprove ? "Review & Decide" : "View Dossier"}
                          </AppButton>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* REGISTRATION APPROVALS VIEW (Separated Console) */}
      {queueMode === "REGISTRATION" && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start gap-3">
            <IonIcon name="information-circle" className="text-amber-600 text-xl mt-0.5" />
            <div className="text-xs text-amber-800">
              <strong className="block font-bold mb-0.5">Registration Approvals Queue</strong>
              Reviewing owner and tenant property registration requests. Service request approvals are managed in the Service Approvals queue.
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-gray-500 bg-white rounded-2xl border border-gray-200">
              <IonIcon name="sync-outline" className="animate-spin text-3xl text-indigo-600 mb-2" />
              <p className="text-sm">Loading registration requests...</p>
            </div>
          ) : registrationRequests.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-gray-200">
              <p className="text-sm text-gray-500">No pending registration requests found.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {registrationRequests.map((r) => {
                const isPendingAction =
                  r.status === "PENDING_APPROVAL" ||
                  r.status === "PENDING" ||
                  r.status.includes("PENDING");
                const isLoading = actionLoadingId === r.id;

                return (
                  <div
                    key={r.id}
                    className="bg-white p-5 rounded-2xl border border-gray-200 hover:shadow-sm transition-all"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-gray-900 text-sm">
                            {r.applicantName}
                          </span>
                          <StatusBadge
                            variant={
                              r.role === "OWNER"
                                ? "hero"
                                : r.role === "MANAGEMENT"
                                ? "info"
                                : "neutral"
                            }
                            size="sm"
                          >
                            {r.role}
                          </StatusBadge>
                          {r.societyName && (
                            <span className="text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-full">
                              {r.societyName}
                            </span>
                          )}
                          <StatusBadge
                            variant={
                              r.status === "APPROVED"
                                ? "success"
                                : r.status === "REJECTED"
                                ? "error"
                                : "warning"
                            }
                            size="sm"
                          >
                            {r.status.replace(/_/g, " ")}
                          </StatusBadge>
                        </div>
                        <p className="text-xs text-gray-600">
                          {r.role === "MANAGEMENT"
                            ? `Position: ${r.managementPosition || "Society Manager"} • Unit: ${r.wingName || "Main Complex"} - ${r.flatNumber || "Office"}`
                            : `Flat: ${r.wingName ? `${r.wingName} - ` : ""}#${r.flatNumber}`}
                          {" • "}
                          Email: <strong className="text-gray-800">{r.applicantEmail}</strong>
                          {r.applicantPhone ? ` • Phone: ${r.applicantPhone}` : ""}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isPendingAction ? (
                          <>
                            <AppButton
                              variant="primary"
                              size="sm"
                              disabled={isLoading}
                              onClick={() => handleRegistrationAction(r.id, "APPROVE")}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                              <IonIcon name="checkmark-circle-outline" className="mr-1.5" />
                              {isLoading ? "Approving..." : "Approve Account"}
                            </AppButton>
                            <AppButton
                              variant="outline"
                              size="sm"
                              disabled={isLoading}
                              onClick={() => handleRegistrationAction(r.id, "REJECT")}
                              className="text-rose-600 hover:bg-rose-50 border-rose-200"
                            >
                              <IonIcon name="close-circle-outline" className="mr-1.5" />
                              Reject
                            </AppButton>
                          </>
                        ) : (
                          <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                            <IonIcon name="checkmark-done" /> Verified &amp; Active
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ApprovalsInboxPage() {
  return (
    <AppShell>
      <Suspense
        fallback={
          <div className="min-h-screen bg-[#F8F9FA] p-8 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-sm font-medium">Loading Approval Console...</p>
            </div>
          </div>
        }
      >
        <ApprovalsInboxContent />
      </Suspense>
    </AppShell>
  );
}
