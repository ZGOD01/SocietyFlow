"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import {
  PageHeader,
  AppCard,
  StatusBadge,
  AppButton,
  IonIcon,
  SearchField,
  EmptyState,
  StatCard,
} from "@/components/ui";

interface RequestSummaryItem {
  id: string;
  requestId: string;
  serviceCode: string;
  serviceTitle: string;
  serviceCategory: string;
  flatNumber: string;
  applicantRole: "OWNER" | "TENANT";
  currentStatus: string;
  pendingActorType: string;
  isDraft: boolean;
  submittedAt?: string;
  createdAt: string;
  updatedAt: string;
  ownerAuthorizationStatus?: string;
  correctionNote?: string;
  attachmentsCount: number;
}

interface RequestsResponse {
  success: boolean;
  stats: {
    total: number;
    drafts: number;
    awaitingOwner: number;
    awaitingSociety: number;
    infoRequired: number;
    declined: number;
  };
  requests: RequestSummaryItem[];
}

const TABS = [
  { id: "ALL", label: "All Requests" },
  { id: "DRAFTS", label: "Drafts" },
  { id: "SUBMITTED", label: "In Review" },
  { id: "AWAITING_OWNER", label: "Awaiting Owner" },
  { id: "AWAITING_SOCIETY", label: "Awaiting Society" },
  { id: "INFO_REQUIRED", label: "Action Required" },
  { id: "COMPLETED", label: "Completed" },
  { id: "DECLINED", label: "Declined / Rejected" },
];

export default function ResidentRequestsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<RequestsResponse | null>(null);
  const [activeTab, setActiveTab] = useState("ALL");
  const [search, setSearch] = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (activeTab !== "ALL") params.append("tab", activeTab);
      if (search.trim()) params.append("search", search.trim());

      const res = await fetch(`/api/requests?${params.toString()}`);
      const json = await res.json();
      if (res.ok) {
        setData(json);
      } else {
        setFeedback({ type: "error", text: json.error || "Failed to load requests" });
      }
    } catch {
      setFeedback({ type: "error", text: "Network error loading requests" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (activeTab !== "ALL") params.append("tab", activeTab);
        if (search.trim()) params.append("search", search.trim());

        const res = await fetch(`/api/requests?${params.toString()}`);
        const json = await res.json();
        if (!ignore) {
          if (res.ok) {
            setData(json);
          } else {
            setFeedback({ type: "error", text: json.error || "Failed to load requests" });
          }
        }
      } catch {
        if (!ignore) {
          setFeedback({ type: "error", text: "Network error loading requests" });
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [activeTab, search]);

  const handleDeleteDraft = async (id: string, reqRef: string) => {
    if (!confirm(`Are you sure you want to delete draft ${reqRef}?`)) return;
    try {
      const res = await fetch(`/api/requests/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to delete draft");

      setFeedback({ type: "success", text: "Draft deleted successfully." });
      fetchRequests();
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "Error deleting draft",
      });
    }
  };

  const getStatusBadgeVariant = (
    status: string
  ): "success" | "warning" | "error" | "info" | "neutral" | "hero" => {
    switch (status) {
      case "APPROVED":
      case "COMPLETED":
        return "success";
      case "AWAITING_OWNER_AUTHORIZATION":
      case "AWAITING_SOCIETY_REVIEW":
      case "UNDER_REVIEW":
        return "warning";
      case "INFORMATION_REQUIRED":
        return "hero";
      case "OWNER_DECLINED":
      case "REJECTED":
        return "error";
      case "DRAFT":
      case "CANCELLED":
      default:
        return "neutral";
    }
  };

  const formatStatusLabel = (status: string): string => {
    switch (status) {
      case "AWAITING_OWNER_AUTHORIZATION":
        return "Awaiting Owner Auth";
      case "AWAITING_SOCIETY_REVIEW":
        return "Awaiting Society Review";
      case "INFORMATION_REQUIRED":
        return "Action Required";
      case "UNDER_REVIEW":
        return "Under Scrutiny";
      case "OWNER_DECLINED":
        return "Owner Declined";
      case "REJECTED":
        return "Rejected";
      case "DRAFT":
        return "Draft";
      case "CANCELLED":
        return "Cancelled";
      case "APPROVED":
        return "Approved";
      default:
        return status.replace(/_/g, " ");
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Page Header */}
        <PageHeader
          title="My Service Applications"
          description="Track status, submit requested information and communicate with flat owners and society officials"
          actions={
            <Link href="/services">
              <AppButton variant="primary" size="sm" leftIcon="add-circle-outline">
                New Service Request
              </AppButton>
            </Link>
          }
        />

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between ${
              feedback.type === "success"
                ? "bg-[#ECFDF5] border border-[#10B981] text-[#065F46]"
                : "bg-[#FFF1F2] border border-[#F43F5E] text-[#9F1239]"
            }`}
          >
            <span>{feedback.text}</span>
            <button onClick={() => setFeedback(null)} className="font-bold hover:underline">
              Dismiss
            </button>
          </div>
        )}

        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Total Applications"
            value={data?.stats.total ?? "—"}
            iconName="document-text-outline"
            subtitle="Lifetime Submissions"
          />
          <StatCard
            label="In Review"
            value={data ? data.stats.awaitingOwner + data.stats.awaitingSociety : "—"}
            iconName="time-outline"
            badgeVariant="warning"
            subtitle="Awaiting Approval"
          />
          <StatCard
            label="Action Required"
            value={data?.stats.infoRequired ?? "—"}
            iconName="alert-circle-outline"
            badgeVariant="hero"
            subtitle="Corrections Requested"
          />
          <StatCard
            label="Drafts Saved"
            value={data?.stats.drafts ?? "—"}
            iconName="save-outline"
            badgeVariant="neutral"
            subtitle="Unsubmitted Applications"
          />
        </div>

        {/* Controls: Search and Tabs */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <SearchField
              placeholder="Search by Request ID (e.g. SF-2026-000101) or service title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:max-w-md"
            />
            <div className="text-xs text-[#6B7280] font-semibold self-center">
              {data?.requests.length || 0} application{data?.requests.length === 1 ? "" : "s"} found
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-[#E5E7EB]">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3.5 py-2 text-xs font-bold whitespace-nowrap transition-all border-b-2 cursor-pointer ${
                    isActive
                      ? "border-[#4F46E5] text-[#4F46E5]"
                      : "border-transparent text-[#6B7280] hover:text-[#1A1A1A]"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Requests Table / Card List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <AppCard key={i} className="p-4 bg-white animate-pulse">
                <div className="h-4 bg-[#F3F4F6] rounded-md w-1/4 mb-2"></div>
                <div className="h-3 bg-[#F3F4F6] rounded-md w-1/2"></div>
              </AppCard>
            ))}
          </div>
        ) : !data || data.requests.length === 0 ? (
          <EmptyState
            title="No Applications Found"
            description={
              activeTab === "DRAFTS"
                ? "You have no saved drafts."
                : activeTab === "INFO_REQUIRED"
                ? "No applications currently require your input or correction."
                : search
                ? `No requests match '${search}'.`
                : "You haven't submitted any service requests yet."
            }
            iconName="document-text-outline"
            action={
              <Link href="/services">
                <AppButton variant="primary" size="sm" leftIcon="add-outline">
                  Browse Services
                </AppButton>
              </Link>
            }
          />
        ) : (
          <div className="space-y-3">
            {data.requests.map((r) => (
              <AppCard
                key={r.id}
                className="p-4 bg-white hover:border-[#C7D2FE] transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs"
              >
                {/* Left: Request Meta */}
                <div className="space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-bold text-xs text-[#1A1A1A] bg-[#F3F4F6] px-2 py-0.5 rounded-md">
                      {r.requestId}
                    </span>
                    <StatusBadge variant={getStatusBadgeVariant(r.currentStatus)}>
                      {formatStatusLabel(r.currentStatus)}
                    </StatusBadge>
                    <span className="text-[11px] font-semibold text-[#6B7280]">
                      Flat {r.flatNumber}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-[#EEF2FF] text-[#4F46E5]">
                      {r.applicantRole}
                    </span>
                  </div>

                  <h3 className="font-heading font-bold text-sm text-[#1A1A1A]">
                    {r.serviceTitle}
                  </h3>

                  {r.currentStatus === "INFORMATION_REQUIRED" && r.correctionNote && (
                    <div className="p-2 bg-[#FFFBEB] border border-[#FDE68A] rounded-lg text-xs text-[#92400E] font-medium flex items-start gap-1.5">
                      <IonIcon name="alert-circle-outline" size={14} className="mt-0.5 shrink-0" />
                      <span>
                        <span className="font-bold">Requested: </span>
                        {r.correctionNote}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-3 text-[11px] text-[#9CA3AF]">
                    <span>
                      {r.submittedAt
                        ? `Submitted ${new Date(r.submittedAt).toLocaleDateString()}`
                        : `Created ${new Date(r.createdAt).toLocaleDateString()}`}
                    </span>
                    <span>•</span>
                    <span>{r.attachmentsCount} attachment{r.attachmentsCount === 1 ? "" : "s"}</span>
                    <span>•</span>
                    <span className="text-[#6B7280]">
                      Pending with: <strong className="text-[#1A1A1A]">{r.pendingActorType.replace(/_/g, " ")}</strong>
                    </span>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {r.isDraft ? (
                    <>
                      <Link href={`/requests/new/${r.serviceCode}?draftId=${r.id}`}>
                        <AppButton size="sm" variant="primary" leftIcon="create-outline">
                          Resume Draft
                        </AppButton>
                      </Link>
                      <button
                        onClick={() => handleDeleteDraft(r.id, r.requestId)}
                        className="p-2 text-[#F43F5E] hover:bg-[#FFF1F2] rounded-lg transition-colors cursor-pointer"
                        title="Delete draft"
                      >
                        <IonIcon name="trash-outline" size={16} />
                      </button>
                    </>
                  ) : (
                    <Link href={`/requests/${r.requestId}`}>
                      <AppButton size="sm" variant="outline" leftIcon="eye-outline">
                        View & Track
                      </AppButton>
                    </Link>
                  )}
                </div>
              </AppCard>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
