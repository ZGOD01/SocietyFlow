"use client";

import React, { useState, useEffect, Suspense, useTransition } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";

interface AuthorizationItem {
  id: string;
  requestId: string;
  serviceCode: string;
  serviceTitle: string;
  serviceCategory: string;
  flatNumber: string;
  tenantName: string;
  tenantEmail?: string;
  tenantPhone?: string;
  submittedAt: string;
  currentStatus: string;
  ownerAuthStatus: string;
  ownerComment?: string;
  decidedAt?: string;
  attachmentsCount: number;
}

interface Stats {
  pending: number;
  authorized: number;
  declined: number;
  infoRequested: number;
}

function OwnerAuthorizationsContent() {
  const [activeTab, setActiveTab] = useState<"PENDING" | "AUTHORIZED" | "DECLINED" | "INFO_REQUESTED" | "ALL">("PENDING");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<AuthorizationItem[]>([]);
  const [stats, setStats] = useState<Stats>({
    pending: 0,
    authorized: 0,
    declined: 0,
    infoRequested: 0,
  });
  const [error, setError] = useState<string | null>(null);

  // Review & Action Modal
  const [selectedItem, setSelectedItem] = useState<AuthorizationItem | null>(null);
  const [actionType, setActionType] = useState<"AUTHORIZE" | "DECLINE" | "REQUEST_INFO" | null>(null);
  const [actionComment, setActionComment] = useState("");
  const [submittingAction, setSubmittingAction] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const fetchAuthorizations = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(
        `/api/owner/authorizations?tab=${activeTab}${search ? `&search=${encodeURIComponent(search)}` : ""}`
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to load owner authorizations");
      }
      setItems(data.authorizations || []);
      setStats(data.stats || { pending: 0, authorized: 0, declined: 0, infoRequested: 0 });
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
          `/api/owner/authorizations?tab=${activeTab}${search ? `&search=${encodeURIComponent(search)}` : ""}`
        );
        const data = await res.json();
        if (!ignore) {
          if (!res.ok) {
            setError(data.error || "Failed to load authorizations");
          } else {
            setItems(data.authorizations || []);
            setStats(data.stats || { pending: 0, authorized: 0, declined: 0, infoRequested: 0 });
          }
        }
      } catch (err: unknown) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Error loading data");
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    load();
    return () => {
      ignore = true;
    };
  }, [activeTab, search]);

  const handleExecuteAction = async () => {
    if (!selectedItem || !actionType) return;
    if (actionType === "DECLINE" && !actionComment.trim()) {
      setActionError("A clear reason for declining authorization is required.");
      return;
    }
    if (actionType === "REQUEST_INFO" && !actionComment.trim()) {
      setActionError("Please explain what additional information or documents are needed.");
      return;
    }

    try {
      setSubmittingAction(true);
      setActionError(null);
      const res = await fetch("/api/owner/authorizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: selectedItem.requestId,
          action: actionType,
          comment: actionComment.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to execute owner action");
      }
      setActionSuccess(data.message || "Action recorded successfully");
      startTransition(() => {
        setTimeout(() => {
          setSelectedItem(null);
          setActionType(null);
          setActionComment("");
          setActionSuccess(null);
          fetchAuthorizations();
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
                <i className="icon-[ion--key-outline] text-sm" /> Owner Verification Routing
              </span>
              <span className="text-xs text-[#6B7280]">Prompt 7 Engine</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#1A1A1A] font-outfit tracking-tight">
              Owner Authorizations Inbox
            </h1>
            <p className="text-sm text-[#6B7280] mt-1 max-w-2xl">
              Review and authorize service requests initiated by tenants occupying your verified flats. 
              Only authorized requests are forwarded to Society Management for final processing.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl border border-[#E5E7EB] bg-white text-[#1A1A1A] hover:bg-[#F8F9FA] transition-colors shadow-sm"
            >
              <i className="icon-[ion--arrow-back-outline]" /> Owner Dashboard
            </Link>
            <Link
              href="/requests"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <i className="icon-[ion--document-text-outline]" /> My Requests
            </Link>
          </div>
        </div>

        {/* Notice Alert */}
        <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-900 leading-relaxed shadow-sm">
          <i className="icon-[ion--information-circle-outline] text-lg text-amber-700 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Owner Authorization vs. Society Approval:</span> Granting authorization acknowledges that your tenant has permission to solicit this service for your unit. The application will then route to Society Management for administrative review.
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => setActiveTab("PENDING")}
            className={`p-5 rounded-2xl border text-left transition-all ${
              activeTab === "PENDING"
                ? "bg-amber-500/10 border-amber-300 ring-2 ring-amber-400/20"
                : "bg-white border-[#E5E7EB] hover:border-gray-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Awaiting You</span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            </div>
            <div className="text-2xl font-extrabold text-[#1A1A1A] font-outfit mt-2">
              {stats.pending}
            </div>
            <p className="text-xs text-amber-700 font-medium mt-1">Pending Owner Review</p>
          </button>

          <button
            onClick={() => setActiveTab("AUTHORIZED")}
            className={`p-5 rounded-2xl border text-left transition-all ${
              activeTab === "AUTHORIZED"
                ? "bg-emerald-500/10 border-emerald-300 ring-2 ring-emerald-400/20"
                : "bg-white border-[#E5E7EB] hover:border-gray-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Authorized</span>
              <i className="icon-[ion--checkmark-circle-outline] text-emerald-600 text-lg" />
            </div>
            <div className="text-2xl font-extrabold text-[#1A1A1A] font-outfit mt-2">
              {stats.authorized}
            </div>
            <p className="text-xs text-emerald-700 font-medium mt-1">Sent to Society Queue</p>
          </button>

          <button
            onClick={() => setActiveTab("INFO_REQUESTED")}
            className={`p-5 rounded-2xl border text-left transition-all ${
              activeTab === "INFO_REQUESTED"
                ? "bg-blue-500/10 border-blue-300 ring-2 ring-blue-400/20"
                : "bg-white border-[#E5E7EB] hover:border-gray-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">More Info</span>
              <i className="icon-[ion--chatbubbles-outline] text-blue-600 text-lg" />
            </div>
            <div className="text-2xl font-extrabold text-[#1A1A1A] font-outfit mt-2">
              {stats.infoRequested}
            </div>
            <p className="text-xs text-blue-700 font-medium mt-1">Returned to Tenant</p>
          </button>

          <button
            onClick={() => setActiveTab("DECLINED")}
            className={`p-5 rounded-2xl border text-left transition-all ${
              activeTab === "DECLINED"
                ? "bg-rose-500/10 border-rose-300 ring-2 ring-rose-400/20"
                : "bg-white border-[#E5E7EB] hover:border-gray-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Declined</span>
              <i className="icon-[ion--close-circle-outline] text-rose-600 text-lg" />
            </div>
            <div className="text-2xl font-extrabold text-[#1A1A1A] font-outfit mt-2">
              {stats.declined}
            </div>
            <p className="text-xs text-rose-700 font-medium mt-1">Withheld Authorization</p>
          </button>
        </div>

        {/* Tab Controls & Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#F8F9FA] border border-[#E5E7EB] rounded-xl w-fit">
            {(
              [
                { key: "PENDING", label: `Pending (${stats.pending})` },
                { key: "AUTHORIZED", label: `Authorized (${stats.authorized})` },
                { key: "INFO_REQUESTED", label: `Clarifications (${stats.infoRequested})` },
                { key: "DECLINED", label: `Declined (${stats.declined})` },
                { key: "ALL", label: "All Records" },
              ] as const
            ).map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === t.key
                    ? "bg-white text-indigo-600 shadow-sm border border-[#E5E7EB]"
                    : "text-[#6B7280] hover:text-[#1A1A1A]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="relative min-w-[260px]">
            <i className="icon-[ion--search-outline] absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#9CA3AF]" />
            <input
              type="text"
              placeholder="Search request ID or service..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-[#E5E7EB] rounded-xl text-xs text-[#1A1A1A] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 shadow-sm"
            />
          </div>
        </div>

        {/* Content Table / List */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-16 text-center shadow-sm">
            <div className="inline-block animate-spin w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full mb-3" />
            <p className="text-xs text-[#6B7280] font-semibold">Loading authorization requests...</p>
          </div>
        ) : error ? (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center text-xs text-rose-700">
            <i className="icon-[ion--alert-circle-outline] text-xl mb-1 block" />
            {error}
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-16 text-center shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-[#F8F9FA] border border-[#E5E7EB] flex items-center justify-center mx-auto mb-3 text-indigo-600 text-xl">
              <i className="icon-[ion--shield-checkmark-outline]" />
            </div>
            <h3 className="text-sm font-bold text-[#1A1A1A] font-outfit">No Requests in this Queue</h3>
            <p className="text-xs text-[#6B7280] max-w-md mx-auto mt-1">
              There are currently no tenant applications matching this status filter for flats you own.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#1A1A1A]">
                <thead className="bg-[#F8F9FA] border-b border-[#E5E7EB] text-[#6B7280] font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3.5 px-4">Request Ref</th>
                    <th className="py-3.5 px-4">Service & Category</th>
                    <th className="py-3.5 px-4">Flat Unit</th>
                    <th className="py-3.5 px-4">Tenant Applicant</th>
                    <th className="py-3.5 px-4">Submitted Date</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-[#F8F9FA]/60 transition-colors">
                      <td className="py-4 px-4 font-mono font-bold text-indigo-600">
                        {item.requestId}
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-bold text-[#1A1A1A]">{item.serviceTitle}</div>
                        <div className="text-[11px] text-[#6B7280]">{item.serviceCategory}</div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-[#F8F9FA] border border-[#E5E7EB]">
                          <i className="icon-[ion--business-outline] text-indigo-600" /> Unit {item.flatNumber}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-semibold text-[#1A1A1A]">{item.tenantName}</div>
                        <div className="text-[11px] text-[#6B7280]">
                          {item.tenantEmail || item.tenantPhone || "Verified Tenant"}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-[#6B7280]">
                        {new Date(item.submittedAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-4 px-4">
                        {item.ownerAuthStatus === "PENDING" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> Awaiting Owner
                          </span>
                        )}
                        {item.ownerAuthStatus === "AUTHORIZED" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <i className="icon-[ion--checkmark-outline]" /> Authorized
                          </span>
                        )}
                        {item.ownerAuthStatus === "DECLINED" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            <i className="icon-[ion--close-outline]" /> Declined
                          </span>
                        )}
                        {item.ownerAuthStatus === "INFO_REQUESTED" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                            <i className="icon-[ion--help-circle-outline]" /> Info Requested
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/requests/${item.requestId}`}
                            className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-[#E5E7EB] bg-white text-[#1A1A1A] hover:bg-[#F8F9FA] shadow-sm transition-colors"
                          >
                            Dossier
                          </Link>

                          {item.ownerAuthStatus === "PENDING" && (
                            <button
                              onClick={() => {
                                setSelectedItem(item);
                                setActionType("AUTHORIZE");
                                setActionComment("");
                                setActionError(null);
                              }}
                              className="px-3 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition-colors"
                            >
                              Decide
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

        {/* Action Decision Modal */}
        {selectedItem && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-2xl max-w-lg w-full p-6 space-y-5 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-4">
                <div>
                  <span className="text-xs font-mono font-bold text-indigo-600">{selectedItem.requestId}</span>
                  <h3 className="text-lg font-bold text-[#1A1A1A] font-outfit mt-0.5">
                    Owner Authorization Review
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setSelectedItem(null);
                    setActionType(null);
                  }}
                  className="p-1 rounded-lg text-[#6B7280] hover:text-[#1A1A1A] hover:bg-[#F8F9FA]"
                >
                  <i className="icon-[ion--close-outline] text-xl" />
                </button>
              </div>

              {/* Summary box */}
              <div className="bg-[#F8F9FA] rounded-xl p-4 border border-[#E5E7EB] space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">Service:</span>
                  <span className="font-bold text-[#1A1A1A]">{selectedItem.serviceTitle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">Tenant Applicant:</span>
                  <span className="font-semibold text-[#1A1A1A]">{selectedItem.tenantName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">Target Flat:</span>
                  <span className="font-bold text-indigo-600">Unit {selectedItem.flatNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">Attached Vault Files:</span>
                  <span className="font-semibold text-[#1A1A1A]">{selectedItem.attachmentsCount} document(s)</span>
                </div>
              </div>

              {/* Action selection tabs */}
              <div>
                <label className="block text-xs font-bold text-[#1A1A1A] uppercase tracking-wider mb-2">
                  Select Decision
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActionType("AUTHORIZE");
                      setActionError(null);
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      actionType === "AUTHORIZE"
                        ? "bg-emerald-50 border-emerald-500 text-emerald-700 ring-2 ring-emerald-500/20"
                        : "bg-white border-[#E5E7EB] text-[#6B7280] hover:text-[#1A1A1A]"
                    }`}
                  >
                    <i className="icon-[ion--checkmark-circle-outline] mr-1 text-emerald-600" /> Authorize
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActionType("REQUEST_INFO");
                      setActionError(null);
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      actionType === "REQUEST_INFO"
                        ? "bg-blue-50 border-blue-500 text-blue-700 ring-2 ring-blue-500/20"
                        : "bg-white border-[#E5E7EB] text-[#6B7280] hover:text-[#1A1A1A]"
                    }`}
                  >
                    <i className="icon-[ion--help-circle-outline] mr-1 text-blue-600" /> Request Info
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActionType("DECLINE");
                      setActionError(null);
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      actionType === "DECLINE"
                        ? "bg-rose-50 border-rose-500 text-rose-700 ring-2 ring-rose-500/20"
                        : "bg-white border-[#E5E7EB] text-[#6B7280] hover:text-[#1A1A1A]"
                    }`}
                  >
                    <i className="icon-[ion--close-circle-outline] mr-1 text-rose-600" /> Decline
                  </button>
                </div>
              </div>

              {/* Comment field */}
              <div>
                <label className="block text-xs font-bold text-[#1A1A1A] mb-1">
                  {actionType === "AUTHORIZE"
                    ? "Authorization Note (Optional)"
                    : actionType === "DECLINE"
                    ? "Decline Reason (Mandatory)"
                    : "Information Required Instructions (Mandatory)"}
                </label>
                <textarea
                  rows={3}
                  value={actionComment}
                  onChange={(e) => setActionComment(e.target.value)}
                  placeholder={
                    actionType === "AUTHORIZE"
                      ? "e.g. Verified and approved for society submission."
                      : actionType === "DECLINE"
                      ? "e.g. Renovation scope exceeds permissible alterations."
                      : "e.g. Please attach latest rental agreement renewal and NOC copy."
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

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-[#E5E7EB] text-[#6B7280] hover:text-[#1A1A1A] hover:bg-[#F8F9FA]"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleExecuteAction}
                  disabled={submittingAction || !actionType}
                  className={`px-5 py-2 rounded-xl text-xs font-bold text-white shadow-sm transition-all flex items-center gap-1.5 ${
                    actionType === "AUTHORIZE"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : actionType === "DECLINE"
                      ? "bg-rose-600 hover:bg-rose-700"
                      : "bg-blue-600 hover:bg-blue-700"
                  } disabled:opacity-50`}
                >
                  {submittingAction ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving Decision...
                    </>
                  ) : (
                    <>
                      Confirm {actionType === "AUTHORIZE" ? "Authorization" : actionType === "DECLINE" ? "Decline" : "Clarification"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default function OwnerAuthorizationsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center text-xs font-semibold text-[#6B7280]">
          Loading authorizations inbox...
        </div>
      }
    >
      <OwnerAuthorizationsContent />
    </Suspense>
  );
}
