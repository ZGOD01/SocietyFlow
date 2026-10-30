"use client";

import React, { useState, useEffect, Suspense, useTransition } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";

interface ManagementRequestItem {
  id: string;
  requestId: string;
  serviceCode: string;
  serviceTitle: string;
  serviceCategory: string;
  flatNumber: string;
  applicantName: string;
  applicantEmail?: string;
  applicantPhone?: string;
  applicantRole: "OWNER" | "TENANT";
  currentStatus: string;
  pendingActorType: string;
  ownerAuthStatus?: string;
  ownerName?: string;
  submittedAt: string;
  updatedAt: string;
  attachmentsCount: number;
}

interface ManagementStats {
  total: number;
  awaitingReview: number;
  ownerAuthorized: number;
  infoRequired: number;
  underReview: number;
  rejected: number;
}

function ManagementRequestsContent() {
  const [category, setCategory] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<ManagementRequestItem[]>([]);
  const [stats, setStats] = useState<ManagementStats>({
    total: 0,
    awaitingReview: 0,
    ownerAuthorized: 0,
    infoRequired: 0,
    underReview: 0,
    rejected: 0,
  });
  const [error, setError] = useState<string | null>(null);

  // Review Modal State
  const [selectedReq, setSelectedReq] = useState<ManagementRequestItem | null>(null);
  const [mgmtAction, setMgmtAction] = useState<"REQUEST_CORRECTION" | "MARK_UNDER_REVIEW" | "REJECT" | null>(null);
  const [actionNote, setActionNote] = useState("");
  const [submittingAction, setSubmittingAction] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const fetchManagementQueue = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(
        `/api/management/requests?category=${category}${search ? `&search=${encodeURIComponent(search)}` : ""}`
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to load management queue");
      }
      setRequests(data.requests || []);
      setStats(data.stats || {
        total: 0,
        awaitingReview: 0,
        ownerAuthorized: 0,
        infoRequired: 0,
        underReview: 0,
        rejected: 0,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error loading data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(
          `/api/management/requests?category=${category}${search ? `&search=${encodeURIComponent(search)}` : ""}`
        );
        const data = await res.json();
        if (!ignore) {
          if (!res.ok) {
            setError(data.error || "Failed to load requests");
          } else {
            setRequests(data.requests || []);
            setStats(data.stats || {
              total: 0,
              awaitingReview: 0,
              ownerAuthorized: 0,
              infoRequired: 0,
              underReview: 0,
              rejected: 0,
            });
          }
        }
      } catch (err: unknown) {
        if (!ignore) setError(err instanceof Error ? err.message : "Error loading data");
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    load();
    return () => {
      ignore = true;
    };
  }, [category, search]);

  const handleExecuteMgmtAction = async () => {
    if (!selectedReq || !mgmtAction) return;

    if (mgmtAction === "REQUEST_CORRECTION" && !actionNote.trim()) {
      setActionError("Please describe the specific corrections or documents required from the applicant.");
      return;
    }
    if (mgmtAction === "REJECT" && !actionNote.trim()) {
      setActionError("A mandatory rejection explanation must be provided.");
      return;
    }

    try {
      setSubmittingAction(true);
      setActionError(null);
      const res = await fetch("/api/management/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: selectedReq.requestId,
          action: mgmtAction,
          note: actionNote.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to execute management action");
      }
      setActionSuccess(data.message || "Action updated successfully");
      startTransition(() => {
        setTimeout(() => {
          setSelectedReq(null);
          setMgmtAction(null);
          setActionNote("");
          setActionSuccess(null);
          fetchManagementQueue();
        }, 1200);
      });
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Failed to record decision");
    } finally {
      setSubmittingAction(false);
    }
  };

  return (
    <AppShell>
      <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 font-sans">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5E7EB] pb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                <i className="icon-[ion--mail-unread-outline] text-sm" /> Society Management Queue
              </span>
              <span className="text-xs text-[#6B7280]">Prompt 7 Engine</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#1A1A1A] font-outfit tracking-tight">
              Society Service Request Inbox
            </h1>
            <p className="text-sm text-[#6B7280] mt-1 max-w-2xl">
              Inspect submitted resident applications, verify attached documents from the vault, and issue correction directives.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/management/services"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl border border-[#E5E7EB] bg-white text-[#1A1A1A] hover:bg-[#F8F9FA] transition-colors shadow-sm"
            >
              <i className="icon-[ion--construct-outline]" /> Configure Services
            </Link>
            <Link
              href="/management/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <i className="icon-[ion--shield-checkmark-outline]" /> Management Console
            </Link>
          </div>
        </div>

        {/* Phase Scope Clarification */}
        <div className="bg-[#F8F9FA] border border-[#E5E7EB] rounded-2xl p-4 flex items-start gap-3 text-xs text-[#6B7280] leading-relaxed shadow-sm">
          <i className="icon-[ion--shield-outline] text-lg text-indigo-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-[#1A1A1A]">Operational Workflow Note:</span> In Prompt 7, committee members can scrutinize incoming requests, mark them Under Review, request applicant corrections, or reject non-compliant applications. Formal multi-level approvals, digital seal sign-offs, and certificate issuance will be unlocked in Prompt 8.
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <button
            onClick={() => setCategory("ALL")}
            className={`p-4 rounded-xl border text-left transition-all ${
              category === "ALL" ? "bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-400/20" : "bg-white border-[#E5E7EB] hover:border-gray-300"
            }`}
          >
            <div className="text-[11px] font-semibold text-[#6B7280] uppercase">All Active</div>
            <div className="text-xl font-extrabold text-[#1A1A1A] font-outfit mt-1">{stats.total}</div>
          </button>

          <button
            onClick={() => setCategory("AWAITING_REVIEW")}
            className={`p-4 rounded-xl border text-left transition-all ${
              category === "AWAITING_REVIEW" ? "bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-400/20" : "bg-white border-[#E5E7EB] hover:border-gray-300"
            }`}
          >
            <div className="text-[11px] font-semibold text-indigo-700 uppercase">Awaiting Review</div>
            <div className="text-xl font-extrabold text-indigo-700 font-outfit mt-1">{stats.awaitingReview}</div>
          </button>

          <button
            onClick={() => setCategory("OWNER_AUTHORIZED")}
            className={`p-4 rounded-xl border text-left transition-all ${
              category === "OWNER_AUTHORIZED" ? "bg-emerald-50 border-emerald-300 ring-2 ring-emerald-400/20" : "bg-white border-[#E5E7EB] hover:border-gray-300"
            }`}
          >
            <div className="text-[11px] font-semibold text-emerald-700 uppercase">Owner Authorized</div>
            <div className="text-xl font-extrabold text-emerald-700 font-outfit mt-1">{stats.ownerAuthorized}</div>
          </button>

          <button
            onClick={() => setCategory("UNDER_REVIEW")}
            className={`p-4 rounded-xl border text-left transition-all ${
              category === "UNDER_REVIEW" ? "bg-purple-50 border-purple-300 ring-2 ring-purple-400/20" : "bg-white border-[#E5E7EB] hover:border-gray-300"
            }`}
          >
            <div className="text-[11px] font-semibold text-purple-700 uppercase">Under Review</div>
            <div className="text-xl font-extrabold text-purple-700 font-outfit mt-1">{stats.underReview}</div>
          </button>

          <button
            onClick={() => setCategory("INFO_REQUIRED")}
            className={`p-4 rounded-xl border text-left transition-all ${
              category === "INFO_REQUIRED" ? "bg-amber-50 border-amber-300 ring-2 ring-amber-400/20" : "bg-white border-[#E5E7EB] hover:border-gray-300"
            }`}
          >
            <div className="text-[11px] font-semibold text-amber-700 uppercase">Info Required</div>
            <div className="text-xl font-extrabold text-amber-700 font-outfit mt-1">{stats.infoRequired}</div>
          </button>

          <button
            onClick={() => setCategory("REJECTED")}
            className={`p-4 rounded-xl border text-left transition-all ${
              category === "REJECTED" ? "bg-rose-50 border-rose-300 ring-2 ring-rose-400/20" : "bg-white border-[#E5E7EB] hover:border-gray-300"
            }`}
          >
            <div className="text-[11px] font-semibold text-rose-700 uppercase">Rejected</div>
            <div className="text-xl font-extrabold text-rose-700 font-outfit mt-1">{stats.rejected}</div>
          </button>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#F8F9FA] border border-[#E5E7EB] rounded-xl">
            {[
              { key: "ALL", label: "All Requests" },
              { key: "AWAITING_REVIEW", label: `Awaiting (${stats.awaitingReview})` },
              { key: "OWNER_AUTHORIZED", label: `Owner-Auth (${stats.ownerAuthorized})` },
              { key: "UNDER_REVIEW", label: `Scrutiny (${stats.underReview})` },
              { key: "INFO_REQUIRED", label: `Needs Correction (${stats.infoRequired})` },
              { key: "REJECTED", label: `Rejected (${stats.rejected})` },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setCategory(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  category === tab.key
                    ? "bg-white text-indigo-600 shadow-sm border border-[#E5E7EB]"
                    : "text-[#6B7280] hover:text-[#1A1A1A]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative min-w-[280px]">
            <i className="icon-[ion--search-outline] absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#9CA3AF]" />
            <input
              type="text"
              placeholder="Search by ID, service, or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-[#E5E7EB] rounded-xl text-xs text-[#1A1A1A] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 shadow-sm"
            />
          </div>
        </div>

        {/* Requests Table */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-16 text-center shadow-sm">
            <div className="inline-block animate-spin w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full mb-3" />
            <p className="text-xs text-[#6B7280] font-semibold">Loading management queue...</p>
          </div>
        ) : error ? (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center text-xs text-rose-700">
            <i className="icon-[ion--alert-circle-outline] text-xl mb-1 block" />
            {error}
          </div>
        ) : requests.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-16 text-center shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-[#F8F9FA] border border-[#E5E7EB] flex items-center justify-center mx-auto mb-3 text-indigo-600 text-xl">
              <i className="icon-[ion--file-tray-outline]" />
            </div>
            <h3 className="text-sm font-bold text-[#1A1A1A] font-outfit">Inbox Clear</h3>
            <p className="text-xs text-[#6B7280] max-w-md mx-auto mt-1">
              No submitted service requests currently match the selected filter.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#1A1A1A]">
                <thead className="bg-[#F8F9FA] border-b border-[#E5E7EB] text-[#6B7280] font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3.5 px-4">Request Ref</th>
                    <th className="py-3.5 px-4">Service</th>
                    <th className="py-3.5 px-4">Unit</th>
                    <th className="py-3.5 px-4">Applicant</th>
                    <th className="py-3.5 px-4">Role</th>
                    <th className="py-3.5 px-4">Owner Route</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Submitted</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {requests.map((req) => (
                    <tr key={req.id} className="hover:bg-[#F8F9FA]/60 transition-colors">
                      <td className="py-4 px-4 font-mono font-bold text-indigo-600">
                        {req.requestId}
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-bold text-[#1A1A1A]">{req.serviceTitle}</div>
                        <div className="text-[11px] text-[#6B7280]">{req.serviceCategory}</div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-bold text-[#1A1A1A]">Unit {req.flatNumber}</span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-semibold text-[#1A1A1A]">{req.applicantName}</div>
                        <div className="text-[11px] text-[#6B7280]">{req.applicantEmail || req.applicantPhone}</div>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                            req.applicantRole === "OWNER"
                              ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                              : "bg-teal-50 text-teal-700 border border-teal-200"
                          }`}
                        >
                          {req.applicantRole}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        {req.ownerAuthStatus === "AUTHORIZED" && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                            <i className="icon-[ion--checkmark-circle-outline]" /> Authorized
                          </span>
                        )}
                        {req.ownerAuthStatus === "PENDING" && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> Pending
                          </span>
                        )}
                        {!req.ownerAuthStatus && (
                          <span className="text-[11px] text-[#9CA3AF]">Direct Route</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        {req.currentStatus === "AWAITING_SOCIETY_REVIEW" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            Awaiting Review
                          </span>
                        )}
                        {req.currentStatus === "UNDER_REVIEW" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                            Under Review
                          </span>
                        )}
                        {req.currentStatus === "INFORMATION_REQUIRED" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            Correction Req
                          </span>
                        )}
                        {req.currentStatus === "REJECTED" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            Rejected
                          </span>
                        )}
                        {req.currentStatus === "AWAITING_OWNER_AUTHORIZATION" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-yellow-50 text-yellow-700 border border-yellow-200">
                            With Owner
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-[#6B7280]">
                        {new Date(req.submittedAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/requests/${req.requestId}`}
                            className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-[#E5E7EB] bg-white text-[#1A1A1A] hover:bg-[#F8F9FA] shadow-sm transition-colors"
                          >
                            Inspect Dossier
                          </Link>

                          {["AWAITING_SOCIETY_REVIEW", "UNDER_REVIEW"].includes(req.currentStatus) && (
                            <button
                              onClick={() => {
                                setSelectedReq(req);
                                setMgmtAction("MARK_UNDER_REVIEW");
                                setActionNote("");
                                setActionError(null);
                              }}
                              className="px-2.5 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition-colors"
                            >
                              Review
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Management Action Modal */}
        {selectedReq && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-2xl max-w-lg w-full p-6 space-y-5 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-4">
                <div>
                  <span className="text-xs font-mono font-bold text-indigo-600">{selectedReq.requestId}</span>
                  <h3 className="text-lg font-bold text-[#1A1A1A] font-outfit mt-0.5">
                    Scrutinize Application
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setSelectedReq(null);
                    setMgmtAction(null);
                  }}
                  className="p-1 rounded-lg text-[#6B7280] hover:text-[#1A1A1A] hover:bg-[#F8F9FA]"
                >
                  <i className="icon-[ion--close-outline] text-xl" />
                </button>
              </div>

              {/* Summary */}
              <div className="bg-[#F8F9FA] rounded-xl p-4 border border-[#E5E7EB] space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">Service:</span>
                  <span className="font-bold text-[#1A1A1A]">{selectedReq.serviceTitle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">Unit:</span>
                  <span className="font-bold text-indigo-600">Flat {selectedReq.flatNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">Applicant:</span>
                  <span className="font-semibold text-[#1A1A1A]">{selectedReq.applicantName} ({selectedReq.applicantRole})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">Vault Attachments:</span>
                  <span className="font-semibold text-[#1A1A1A]">{selectedReq.attachmentsCount} document(s)</span>
                </div>
              </div>

              {/* Actions Choice */}
              <div>
                <label className="block text-xs font-bold text-[#1A1A1A] uppercase tracking-wider mb-2">
                  Select Action
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMgmtAction("MARK_UNDER_REVIEW");
                      setActionError(null);
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      mgmtAction === "MARK_UNDER_REVIEW"
                        ? "bg-purple-50 border-purple-500 text-purple-700 ring-2 ring-purple-500/20"
                        : "bg-white border-[#E5E7EB] text-[#6B7280] hover:text-[#1A1A1A]"
                    }`}
                  >
                    <i className="icon-[ion--search-circle-outline] mr-1 text-purple-600" /> Scrutinize
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMgmtAction("REQUEST_CORRECTION");
                      setActionError(null);
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      mgmtAction === "REQUEST_CORRECTION"
                        ? "bg-amber-50 border-amber-500 text-amber-700 ring-2 ring-amber-500/20"
                        : "bg-white border-[#E5E7EB] text-[#6B7280] hover:text-[#1A1A1A]"
                    }`}
                  >
                    <i className="icon-[ion--construct-outline] mr-1 text-amber-600" /> Correction
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMgmtAction("REJECT");
                      setActionError(null);
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      mgmtAction === "REJECT"
                        ? "bg-rose-50 border-rose-500 text-rose-700 ring-2 ring-rose-500/20"
                        : "bg-white border-[#E5E7EB] text-[#6B7280] hover:text-[#1A1A1A]"
                    }`}
                  >
                    <i className="icon-[ion--close-circle-outline] mr-1 text-rose-600" /> Reject
                  </button>
                </div>
              </div>

              {/* Note / Reason Field */}
              <div>
                <label className="block text-xs font-bold text-[#1A1A1A] mb-1">
                  {mgmtAction === "MARK_UNDER_REVIEW"
                    ? "Scrutiny Note (Optional)"
                    : mgmtAction === "REQUEST_CORRECTION"
                    ? "Requested Corrections (Mandatory)"
                    : "Rejection Reason (Mandatory)"}
                </label>
                <textarea
                  rows={3}
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                  placeholder={
                    mgmtAction === "MARK_UNDER_REVIEW"
                      ? "e.g. Scrutinizing maintenance accounts before NOC clearance."
                      : mgmtAction === "REQUEST_CORRECTION"
                      ? "e.g. Please re-upload a clearer copy of the sale deed index II."
                      : "e.g. Outstanding maintenance dues exceeding permissible grace period."
                  }
                  className="w-full p-3 bg-white border border-[#E5E7EB] rounded-xl text-xs text-[#1A1A1A] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              {actionError && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-700 flex items-center gap-2">
                  <i className="icon-[ion--alert-circle-outline]" /> {actionError}
                </div>
              )}

              {actionSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-700 flex items-center gap-2">
                  <i className="icon-[ion--checkmark-circle-outline]" /> {actionSuccess}
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-[#E5E7EB]">
                <Link
                  href={`/requests/${selectedReq.requestId}`}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  <i className="icon-[ion--open-outline]" /> Open Full Dossier
                </Link>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedReq(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold border border-[#E5E7EB] text-[#6B7280] hover:text-[#1A1A1A] hover:bg-[#F8F9FA]"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleExecuteMgmtAction}
                    disabled={submittingAction || !mgmtAction}
                    className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {submittingAction ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>Confirm Action</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default function ManagementRequestsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center text-xs font-semibold text-[#6B7280]">
          Loading society management request queue...
        </div>
      }
    >
      <ManagementRequestsContent />
    </Suspense>
  );
}
