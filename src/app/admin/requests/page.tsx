"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  PageHeader,
  StatCard,
  AppCard,
  StatusBadge,
  AppButton,
  IonIcon,
  Modal,
} from "@/components/ui";

interface RequestItem {
  id: string;
  requestNumber: string;
  type: "REGISTRATION" | "SERVICE" | "OWNERSHIP_TRANSFER";
  title: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone?: string;
  societyId: string;
  societyName: string;
  unitInfo: string;
  resolutionNumber?: string;
  managementPosition?: string;
  status: string;
  approvalStage: string;
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
  societies: any[];
  requests: RequestItem[];
}

export default function SuperAdminRequestsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AdminData | null>(null);

  // Decision & Processing State
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [decisionComment, setDecisionComment] = useState("");

  // Filter & Search states
  const [requestFilter, setRequestFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Inspect Request Modal
  const [selectedRequest, setSelectedRequest] = useState<RequestItem | null>(null);

  const fetchRequests = useCallback(() => {
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
        console.error("Super Admin requests fetch error:", err);
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
    fetchRequests();
  }, [fetchRequests]);

  const handleRequestDecision = async (
    reqId: string,
    reqType: "REGISTRATION" | "SERVICE" | "OWNERSHIP_TRANSFER",
    action: "APPROVE" | "REJECT",
    comment?: string
  ) => {
    try {
      setProcessingId(reqId);
      setActionNotice(null);
      const res = await fetch("/api/admin/requests/decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: reqId,
          type: reqType,
          action,
          comment: comment || decisionComment || undefined,
        }),
      });

      const resJson = await res.json();
      if (!res.ok) {
        alert(resJson.error || "Failed to process approval decision.");
        return;
      }

      setActionNotice(resJson.message);
      setDecisionComment("");
      if (selectedRequest && selectedRequest.id === reqId) {
        setSelectedRequest(null);
      }
      fetchRequests();
    } catch {
      alert("Network error processing decision.");
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

  const requests = data?.requests || [];

  // Filter requests
  const filteredRequests = requests.filter((r) => {
    const matchesFilter =
      requestFilter === "ALL" ||
      (requestFilter === "PENDING" &&
        (r.status.toUpperCase().includes("PENDING") ||
          r.status.toUpperCase().includes("REVIEW") ||
          r.status.toUpperCase().includes("AWAITING"))) ||
      (requestFilter === "APPROVED" &&
        (r.status.toUpperCase().includes("APPROVED") ||
          r.status.toUpperCase().includes("COMPLETED") ||
          r.status.toUpperCase().includes("ISSUED"))) ||
      (requestFilter === "REJECTED" &&
        (r.status.toUpperCase().includes("REJECT") ||
          r.status.toUpperCase().includes("DECLINE") ||
          r.status.toUpperCase().includes("CANCEL")));

    const matchesSearch =
      !searchQuery.trim() ||
      r.applicantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.requestNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.societyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.unitInfo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.resolutionNumber && r.resolutionNumber.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesFilter && matchesSearch;
  });

  const approvedCount = requests.filter(
    (r) =>
      r.status.toUpperCase().includes("APPROVED") ||
      r.status.toUpperCase().includes("COMPLETED") ||
      r.status.toUpperCase().includes("ISSUED")
  ).length;

  return (
    <AppShell>
      {/* Top Header */}
      <PageHeader
        title="Requests & Approvals"
        description="Platform authority decision desk: Verify, Approve, or Reject society requests"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Super Admin", href: "/admin/dashboard" },
          { label: "Requests", href: "/admin/requests" },
        ]}
        badge={
          <StatusBadge variant="hero" size="sm" dot pulse>
            Super Admin
          </StatusBadge>
        }
        actions={
          <div className="flex items-center gap-2">
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

      {/* Decision Notice Banner */}
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

      {/* Requests Specific KPI Metric Counters (3 clean cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard
          label="Total Requests"
          value={`${stats.totalRequests}`}
          subtitle="Registrations, NOCs & Transfers"
          iconName="document-text-outline"
          iconVariant="info"
        />

        <StatCard
          label="Pending Approvals"
          value={`${stats.pendingRequests}`}
          subtitle="Action required by Super Admin"
          iconName="time-outline"
          iconVariant="warning"
        />

        <StatCard
          label="Approved / Settled"
          value={`${approvedCount}`}
          subtitle="Completed decisions"
          iconName="checkmark-done-circle-outline"
          iconVariant="hero-soft"
        />
      </div>

      {/* Requests Content Area */}
      <div className="space-y-4">
        {/* Filter Bar & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-[#E5E7EB]">
          {/* Status Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto">
            {(["ALL", "PENDING", "APPROVED", "REJECTED"] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setRequestFilter(filter)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                  requestFilter === filter
                    ? "bg-[#4F46E5] text-white shadow-2xs"
                    : "text-[#6B7280] hover:text-[#1A1A1A] hover:bg-[#F3F4F6]"
                }`}
              >
                {filter === "ALL" && `All Requests (${requests.length})`}
                {filter === "PENDING" && `Pending Approvals (${stats.pendingRequests})`}
                {filter === "APPROVED" && `Approved (${approvedCount})`}
                {filter === "REJECTED" &&
                  `Rejected (${
                    requests.filter(
                      (r) =>
                        r.status.toUpperCase().includes("REJECT") ||
                        r.status.toUpperCase().includes("DECLINE") ||
                        r.status.toUpperCase().includes("CANCEL")
                    ).length
                  })`}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[240px]">
            <IonIcon
              name="search-outline"
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]"
            />
            <input
              type="text"
              placeholder="Search applicant, ID, flat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#4F46E5] focus:bg-white transition-all text-[#1A1A1A] placeholder:text-[#9CA3AF]"
            />
          </div>
        </div>

        {/* Requests List */}
        {requests.length === 0 ? (
          /* Clean Empty State UI for Requests */
          <AppCard className="p-10 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center mb-4">
              <IonIcon name="document-text-outline" size={32} />
            </div>
            <h3 className="text-lg font-bold text-[#1A1A1A] font-heading mb-1">
              No Approval Requests
            </h3>
            <p className="text-xs sm:text-sm text-[#6B7280] max-w-md mx-auto mb-2 leading-relaxed">
              There are currently no registration approvals, service NOCs, or ownership conveyance requests in the system queue.
            </p>
          </AppCard>
        ) : filteredRequests.length === 0 ? (
          <AppCard className="p-8 text-center text-[#6B7280] text-sm">
            No requests match your current search or filter.
          </AppCard>
        ) : (
          <div className="space-y-3">
            {filteredRequests.map((req) => {
              const isPending =
                req.status.toUpperCase().includes("PENDING") ||
                req.status.toUpperCase().includes("REVIEW") ||
                req.status.toUpperCase().includes("AWAITING");

              return (
                <AppCard key={req.id} className="p-4 hover:border-[#C7D2FE] transition-all">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#EEF2FF] text-[#4F46E5] font-bold">
                          {req.requestNumber}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F3F4F6] text-[#4B5563] uppercase">
                          {req.type.replace("_", " ")}
                        </span>
                        {req.resolutionNumber && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EEF2FF] text-[#4F46E5] border border-[#C7D2FE]">
                            Res: {req.resolutionNumber}
                          </span>
                        )}
                        <StatusBadge
                          variant={
                            req.status.toUpperCase().includes("APPROV")
                              ? "success"
                              : req.status.toUpperCase().includes("REJECT")
                              ? "error"
                              : "warning"
                          }
                          size="sm"
                        >
                          {req.status}
                        </StatusBadge>
                      </div>

                      <h5 className="text-sm font-bold text-[#1A1A1A]">{req.title}</h5>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#6B7280]">
                        <span className="flex items-center gap-1 text-[#4B5563] font-medium">
                          <IonIcon name="person-outline" size={13} />
                          {req.applicantName}
                        </span>
                        <span className="flex items-center gap-1">
                          <IonIcon name="business-outline" size={13} />
                          {req.societyName} ({req.unitInfo})
                        </span>
                        <span className="flex items-center gap-1 text-[#9CA3AF]">
                          <IonIcon name="time-outline" size={13} />
                          {new Date(req.createdAt).toLocaleDateString([], {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>

                      <div className="text-[11px] text-[#4F46E5] font-medium flex items-center gap-1 pt-1">
                        <IonIcon name="git-branch-outline" size={13} />
                        Stage: {req.approvalStage}
                      </div>
                    </div>

                    {/* Action Buttons: Verify / Approve / Reject */}
                    <div className="flex items-center gap-2 shrink-0 self-start lg:self-center">
                      {isPending && (
                        <>
                          <AppButton
                            variant="hero"
                            size="sm"
                            leftIcon="checkmark-circle-outline"
                            isLoading={processingId === req.id}
                            onClick={() => handleRequestDecision(req.id, req.type, "APPROVE")}
                          >
                            Verify &amp; Approve
                          </AppButton>
                          <AppButton
                            variant="outline"
                            size="sm"
                            leftIcon="close-circle-outline"
                            className="text-[#F43F5E] hover:bg-[#FFF1F2] border-[#FECDD3]"
                            isLoading={processingId === req.id}
                            onClick={() => handleRequestDecision(req.id, req.type, "REJECT")}
                          >
                            Reject
                          </AppButton>
                        </>
                      )}
                      <AppButton
                        variant="outline"
                        size="sm"
                        leftIcon="eye-outline"
                        onClick={() => setSelectedRequest(req)}
                      >
                        Inspect
                      </AppButton>
                    </div>
                  </div>
                </AppCard>
              );
            })}
          </div>
        )}
      </div>

      {/* Inspect Request Detail Modal */}
      {selectedRequest && (
        <Modal
          isOpen={Boolean(selectedRequest)}
          onClose={() => setSelectedRequest(null)}
          title={`Request Dossier: ${selectedRequest.requestNumber}`}
          description="Detailed metadata for platform audit & decision verification"
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-[#F8F9FA] rounded-xl border border-[#E5E7EB]">
              <div>
                <p className="text-[#9CA3AF] uppercase text-[10px] font-bold">Applicant</p>
                <p className="font-bold text-sm text-[#1A1A1A] mt-0.5">
                  {selectedRequest.applicantName}
                </p>
                <p className="text-[#6B7280]">{selectedRequest.applicantEmail}</p>
                {selectedRequest.applicantPhone && (
                  <p className="text-[#6B7280]">{selectedRequest.applicantPhone}</p>
                )}
              </div>
              <div>
                <p className="text-[#9CA3AF] uppercase text-[10px] font-bold">Society & Unit</p>
                <p className="font-bold text-sm text-[#1A1A1A] mt-0.5">
                  {selectedRequest.societyName}
                </p>
                <p className="text-[#4F46E5] font-semibold">{selectedRequest.unitInfo}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-white rounded-xl border border-[#E5E7EB]">
                <p className="text-[#9CA3AF] text-[10px] font-bold uppercase">Status</p>
                <div className="mt-1">
                  <StatusBadge
                    variant={
                      selectedRequest.status.toUpperCase().includes("APPROV")
                        ? "success"
                        : selectedRequest.status.toUpperCase().includes("REJECT")
                        ? "error"
                        : "warning"
                    }
                    size="sm"
                  >
                    {selectedRequest.status}
                  </StatusBadge>
                </div>
              </div>
              <div className="p-3 bg-white rounded-xl border border-[#E5E7EB]">
                <p className="text-[#9CA3AF] text-[10px] font-bold uppercase">Approval Stage</p>
                <p className="text-xs font-bold text-[#1A1A1A] mt-1">
                  {selectedRequest.approvalStage}
                </p>
              </div>
            </div>

            {selectedRequest.resolutionNumber && (
              <div className="p-3 bg-[#EEF2FF] rounded-xl border border-[#C7D2FE] flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase font-bold text-[#4338CA]">Committee Resolution / Invite Token</p>
                  <p className="font-mono font-bold text-sm text-[#312E81] mt-0.5">{selectedRequest.resolutionNumber}</p>
                </div>
                {selectedRequest.managementPosition && (
                  <span className="px-2.5 py-1 rounded-lg bg-white text-[#4338CA] font-bold text-xs border border-[#C7D2FE]">
                    Position: {selectedRequest.managementPosition}
                  </span>
                )}
              </div>
            )}

            <div className="p-3 bg-[#F8F9FA] rounded-xl border border-[#E5E7EB] flex items-center justify-between">
              <div>
                <p className="font-bold text-[#1A1A1A] text-xs">{selectedRequest.title}</p>
                <p className="text-[#6B7280] text-[11px] mt-0.5">
                  Submission Timestamp: {new Date(selectedRequest.createdAt).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Decision Notes Input (for pending requests) */}
            {(selectedRequest.status.toUpperCase().includes("PENDING") ||
              selectedRequest.status.toUpperCase().includes("REVIEW") ||
              selectedRequest.status.toUpperCase().includes("AWAITING")) && (
              <div className="space-y-1.5 pt-2 border-t border-[#E5E7EB]">
                <label className="text-[11px] font-bold text-[#4B5563]">
                  Super Admin Decision Remarks (Optional):
                </label>
                <input
                  type="text"
                  placeholder="e.g. Verified MCS Act compliance & resolution minutes."
                  value={decisionComment}
                  onChange={(e) => setDecisionComment(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#4F46E5] text-[#1A1A1A]"
                />
              </div>
            )}

            {/* Action Buttons in Modal Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-[#E5E7EB]">
              <AppButton
                variant="outline"
                size="sm"
                onClick={() => setSelectedRequest(null)}
              >
                Close Dossier
              </AppButton>

              {(selectedRequest.status.toUpperCase().includes("PENDING") ||
                selectedRequest.status.toUpperCase().includes("REVIEW") ||
                selectedRequest.status.toUpperCase().includes("AWAITING")) && (
                <div className="flex items-center gap-2">
                  <AppButton
                    variant="outline"
                    size="sm"
                    leftIcon="close-circle-outline"
                    className="text-[#F43F5E] hover:bg-[#FFF1F2] border-[#FECDD3]"
                    isLoading={processingId === selectedRequest.id}
                    onClick={() =>
                      handleRequestDecision(selectedRequest.id, selectedRequest.type, "REJECT")
                    }
                  >
                    Reject
                  </AppButton>
                  <AppButton
                    variant="hero"
                    size="sm"
                    leftIcon="checkmark-circle-outline"
                    isLoading={processingId === selectedRequest.id}
                    onClick={() =>
                      handleRequestDecision(selectedRequest.id, selectedRequest.type, "APPROVE")
                    }
                  >
                    Verify &amp; Approve
                  </AppButton>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}
    </AppShell>
  );
}
