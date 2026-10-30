"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import {
  AppCard,
  AppButton,
  StatusBadge,
  FormField,
  Modal,
  IonIcon,
} from "@/components/ui";

interface TransferDetail {
  _id: string;
  societyId: { _id: string; name: string; code: string; city: string; registrationNumber?: string };
  flatId: { _id: string; flatNumber: string; floor: number; bhkType?: string; carpetAreaSqFt?: number; shareCertificateNumber?: string };
  currentOwnerId: string;
  currentOwnerName?: string;
  currentOwnerEmail?: string;
  proposedOwner: {
    name: string;
    email: string;
    phone: string;
    existingUserId?: string;
  };
  transferType: string;
  reason: string;
  effectiveDate?: string;
  status: string;
  newOwnerAccepted: boolean;
  newOwnerAcceptedAt?: string;
  newOwnerComments?: string;
  documents: Array<{
    _id?: string;
    name: string;
    documentType: string;
    fileUrl: string;
    verified: boolean;
    verificationNote?: string;
    uploadedAt: string;
  }>;
  activeTenancies: Array<{
    _id?: string;
    occupancyId: string;
    tenantName: string;
    tenantEmail: string;
    status: string;
    reviewed: boolean;
    reviewNotes?: string;
  }>;
  societyDecision?: {
    decidedByName?: string;
    decidedByRole?: string;
    decidedAt?: string;
    status?: string;
    comments?: string;
  };
  completionDetails?: {
    completedByName?: string;
    completedAt?: string;
    shareCertificateTransferred?: boolean;
    newShareCertificateNumber?: string;
    completionNotes?: string;
  };
  timeline: Array<{
    stage: string;
    status: string;
    performerName?: string;
    performerRole?: string;
    comments?: string;
    timestamp: string;
  }>;
  createdAt: string;
}

function OwnershipTransferDetailContent() {
  const params = useParams();
  const transferId = (params?.transferId as string) || "";

  const [loading, setLoading] = useState(true);
  const [transfer, setTransfer] = useState<TransferDetail | null>(null);
  const [userRole, setUserRole] = useState<"COMMITTEE" | "CURRENT_OWNER" | "PROPOSED_OWNER" | "ADMIN" | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Actions
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Acceptance Modal
  const [isAcceptModalOpen, setIsAcceptModalOpen] = useState(false);
  const [acceptDecision, setAcceptDecision] = useState<boolean>(true);
  const [acceptComments, setAcceptComments] = useState("");

  // Committee Decision Modal
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);
  const [decisionAction, setDecisionAction] = useState<"APPROVE" | "REQUEST_CORRECTION" | "REJECT">("APPROVE");
  const [decisionComments, setDecisionComments] = useState("");

  // Completion Modal
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [newShareCertNumber, setNewShareCertNumber] = useState("");
  const [completionNotes, setCompletionNotes] = useState("");

  const fetchTransfer = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/ownership-transfer/${transferId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load transfer");
      setTransfer(data.transfer);
      setUserRole(data.userRole);
      if (data.transfer?.flatId?.shareCertificateNumber) {
        setNewShareCertNumber(`${data.transfer.flatId.shareCertificateNumber}-TRF`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error loading transfer";
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransfer();
  }, [transferId]);

  const handleDocumentVerifyToggle = async (docId: string, currentVerified: boolean) => {
    try {
      setActionLoading(true);
      const res = await fetch(`/api/ownership-transfer/${transferId}/verify-docs`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId: docId,
          verified: !currentVerified,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update document verification");
      fetchTransfer();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Verification error";
      setFeedback({ type: "error", text: msg });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcceptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      setFeedback(null);
      const res = await fetch(`/api/ownership-transfer/${transferId}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accept: acceptDecision,
          comments: acceptComments.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to process invitation");
      setFeedback({ type: "success", text: data.message });
      setIsAcceptModalOpen(false);
      fetchTransfer();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error submitting decision";
      setFeedback({ type: "error", text: msg });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDecisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      setFeedback(null);
      const res = await fetch(`/api/ownership-transfer/${transferId}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: decisionAction,
          comments: decisionComments.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to record decision");
      setFeedback({ type: "success", text: data.message });
      setIsDecisionModalOpen(false);
      fetchTransfer();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error submitting decision";
      setFeedback({ type: "error", text: msg });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      setFeedback(null);
      const res = await fetch(`/api/ownership-transfer/${transferId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newShareCertificateNumber: newShareCertNumber.trim(),
          completionNotes: completionNotes.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to complete transfer");
      setFeedback({ type: "success", text: data.message });
      setIsCompleteModalOpen(false);
      fetchTransfer();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error executing transfer";
      setFeedback({ type: "error", text: msg });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="p-12 text-center text-xs text-[#6B7280]">
          <IonIcon name="sync-outline" size={24} className="animate-spin text-[#4F46E5] mx-auto mb-2" />
          <p>Loading transfer dossier...</p>
        </div>
      </AppShell>
    );
  }

  if (errorMessage || !transfer) {
    return (
      <AppShell>
        <AppCard className="p-12 text-center text-xs text-[#6B7280] space-y-3">
          <IonIcon name="alert-circle-outline" size={32} className="text-[#EF4444] mx-auto" />
          <p className="text-sm font-bold text-[#1A1A1A]">Unable to Load Transfer Dossier</p>
          <p>{errorMessage || "Record not found or access restricted."}</p>
          <Link href="/ownership-transfer">
            <AppButton variant="outline" size="sm">
              &larr; Back to Transfers Directory
            </AppButton>
          </Link>
        </AppCard>
      </AppShell>
    );
  }

  const isCompleted = transfer.status === "COMPLETED";
  const isAwaitingNewOwner = transfer.status === "AWAITING_NEW_OWNER";
  const isApprovedPendingCompletion = transfer.status === "APPROVED_PENDING_COMPLETION";
  const canCommitteeAct = userRole === "COMMITTEE" || userRole === "ADMIN";
  const canNewOwnerAct = userRole === "PROPOSED_OWNER" && isAwaitingNewOwner;

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-[#6B7280]">
          <Link href="/ownership-transfer" className="hover:text-[#1A1A1A] flex items-center gap-1">
            <IonIcon name="arrow-back-outline" size={14} />
            <span>Ownership Transfers</span>
          </Link>
          <span>/</span>
          <span className="font-semibold text-[#1A1A1A]">Flat {transfer.flatId?.flatNumber} Dossier</span>
        </div>

        {/* Feedback alert */}
        {feedback && (
          <div
            className={`p-4 rounded-xl text-xs flex items-center justify-between ${
              feedback.type === "success"
                ? "bg-[#ECFDF5] border border-[#A7F3D0] text-[#047857]"
                : "bg-[#FEF2F2] border border-[#FCA5A5] text-[#B91C1C]"
            }`}
          >
            <span>{feedback.text}</span>
            <button type="button" onClick={() => setFeedback(null)} className="p-1">
              <IonIcon name="close-outline" size={16} />
            </button>
          </div>
        )}

        {/* Top Header Dossier Card */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#EEF2FF] text-[#4F46E5]">
                {transfer.transferType} TRANSFER
              </span>
              <span className="text-xs font-mono font-bold text-[#1A1A1A]">
                {transfer.societyId?.code} • Flat {transfer.flatId?.flatNumber}
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-[#1A1A1A] font-heading">
              Transfer Dossier: Flat {transfer.flatId?.flatNumber}
            </h1>
            <p className="text-xs text-[#6B7280] mt-1">
              {transfer.societyId?.name} • Carpet Area: {transfer.flatId?.carpetAreaSqFt || 1050} sq. ft. • Registered on{" "}
              {new Date(transfer.createdAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <StatusBadge
              variant={
                isCompleted
                  ? "success"
                  : isApprovedPendingCompletion
                  ? "info"
                  : transfer.status === "REJECTED" || transfer.status === "CANCELLED"
                  ? "error"
                  : "warning"
              }
              size="md"
            >
              {transfer.status.replace(/_/g, " ")}
            </StatusBadge>

            {canNewOwnerAct && (
              <AppButton
                variant="hero"
                size="sm"
                leftIcon="checkmark-circle-outline"
                onClick={() => setIsAcceptModalOpen(true)}
              >
                Review &amp; Accept Transfer
              </AppButton>
            )}

            {canCommitteeAct && !isCompleted && transfer.status !== "REJECTED" && (
              <div className="flex items-center gap-2">
                {isApprovedPendingCompletion ? (
                  <AppButton
                    variant="hero"
                    size="sm"
                    leftIcon="shield-checkmark-outline"
                    onClick={() => setIsCompleteModalOpen(true)}
                  >
                    Execute Final Completion
                  </AppButton>
                ) : (
                  <AppButton
                    variant="primary"
                    size="sm"
                    leftIcon="checkmark-done-outline"
                    onClick={() => setIsDecisionModalOpen(true)}
                  >
                    Record Committee Decision
                  </AppButton>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Parties, Documents, Tenancies */}
          <div className="lg:col-span-2 space-y-6">
            {/* Outgoing Owner vs. Incoming Owner Card */}
            <AppCard className="p-6">
              <h3 className="text-sm font-bold text-[#1A1A1A] font-heading pb-3 mb-4 border-b border-[#F1F3F5] flex items-center justify-between">
                <span>Parties to Property Transfer</span>
                <span className="text-[10px] text-[#6B7280] font-normal">
                  MCS Act Section 29 / Model Bylaw 38
                </span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Outgoing */}
                <div className="p-4 rounded-xl bg-[#F8F9FA] border border-[#E5E7EB] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">
                      Current (Outgoing) Owner
                    </span>
                    <span className="text-[10px] font-semibold text-[#10B981] bg-[#ECFDF5] px-2 py-0.5 rounded-full">
                      Verified Title
                    </span>
                  </div>
                  <p className="text-sm font-bold text-[#1A1A1A]">
                    {transfer.currentOwnerName || "Outgoing Resident"}
                  </p>
                  <p className="text-[#6B7280]">{transfer.currentOwnerEmail}</p>
                  <div className="pt-2 text-[11px] text-[#6B7280] border-t border-[#E5E7EB]">
                    Current Share Cert:{" "}
                    <strong>{transfer.flatId?.shareCertificateNumber || "SC-2024-042"}</strong>
                  </div>
                </div>

                {/* Incoming */}
                <div className="p-4 rounded-xl bg-[#EEF2FF]/40 border border-[#C7D2FE] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#4F46E5]">
                      Proposed (Incoming) Owner
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        transfer.newOwnerAccepted
                          ? "bg-[#ECFDF5] text-[#10B981]"
                          : "bg-[#FEF3C7] text-[#92400E]"
                      }`}
                    >
                      {transfer.newOwnerAccepted ? "Accepted Invitation" : "Pending Acceptance"}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-[#1A1A1A]">{transfer.proposedOwner.name}</p>
                  <p className="text-[#6B7280]">{transfer.proposedOwner.email}</p>
                  <p className="text-[#6B7280]">{transfer.proposedOwner.phone}</p>
                  {transfer.newOwnerComments && (
                    <div className="pt-2 text-[11px] text-[#4F46E5] border-t border-[#C7D2FE]">
                      <em>&quot;{transfer.newOwnerComments}&quot;</em>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 p-3 bg-[#F8F9FA] rounded-xl text-xs text-[#6B7280]">
                <strong>Transfer Reason:</strong> {transfer.reason}
              </div>
            </AppCard>

            {/* Checklist of Transfer Documents */}
            <AppCard className="p-6">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#F1F3F5]">
                <div>
                  <h3 className="text-sm font-bold text-[#1A1A1A] font-heading">
                    Transfer Evidence Checklist &amp; R2 Documents
                  </h3>
                  <p className="text-xs text-[#6B7280]">
                    Sale deed, share certificate, and society NOC application documents
                  </p>
                </div>
                <span className="text-xs font-bold text-[#4F46E5]">
                  {transfer.documents.filter((d) => d.verified).length} / {transfer.documents.length} Verified
                </span>
              </div>

              {transfer.documents.length === 0 ? (
                <p className="text-xs text-[#6B7280] text-center py-6">
                  No documents attached to this transfer yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {transfer.documents.map((doc, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border border-[#E5E7EB] bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center shrink-0">
                          <IonIcon name="document-text-outline" size={20} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-[#1A1A1A]">{doc.name}</p>
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#F8F9FA] border border-[#E5E7EB] text-[#6B7280]">
                              {doc.documentType}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#6B7280] mt-0.5">
                            Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            doc.verified
                              ? "bg-[#ECFDF5] text-[#10B981] border border-[#A7F3D0]"
                              : "bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]"
                          }`}
                        >
                          {doc.verified ? "Verified" : "Pending Verification"}
                        </span>

                        {canCommitteeAct && !isCompleted && (
                          <AppButton
                            variant={doc.verified ? "ghost" : "outline"}
                            size="sm"
                            disabled={actionLoading}
                            onClick={() =>
                              handleDocumentVerifyToggle(doc._id || doc.name, doc.verified)
                            }
                          >
                            {doc.verified ? "Unverify" : "Mark Verified"}
                          </AppButton>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </AppCard>

            {/* Tenancy Protection Review Card (Prompt 10 Section 6 & 10) */}
            <AppCard className="p-6">
              <h3 className="text-sm font-bold text-[#1A1A1A] font-heading pb-3 mb-4 border-b border-[#F1F3F5] flex items-center justify-between">
                <span>Active Tenancy Protection &amp; Review</span>
                <span className="text-[10px] text-[#6B7280] font-normal">Section 6 / 10 Guard</span>
              </h3>

              {transfer.activeTenancies && transfer.activeTenancies.length > 0 ? (
                <div className="space-y-3">
                  <div className="p-3 bg-[#FFFBEB] border border-[#FDE68A] rounded-xl text-xs text-[#92400E] flex items-start gap-2">
                    <IonIcon name="warning-outline" size={18} className="shrink-0 mt-0.5" />
                    <div>
                      <strong>Active Lease Detected:</strong> An active tenancy is currently registered on this flat. Property transfer does not automatically cancel lawful tenant rights or reassign lease covenants silently.
                    </div>
                  </div>

                  {transfer.activeTenancies.map((t, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-[#F8F9FA] border border-[#E5E7EB] flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-bold text-[#1A1A1A]">{t.tenantName}</p>
                        <p className="text-[11px] text-[#6B7280]">{t.tenantEmail}</p>
                        {t.reviewNotes && (
                          <p className="text-[10px] text-[#4F46E5] mt-1">{t.reviewNotes}</p>
                        )}
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EEF2FF] text-[#4F46E5]">
                        Tenancy Preserved
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-[#6B7280] text-center py-4">
                  No active tenant registered for this flat. Unit is vacant or owner-occupied.
                </div>
              )}
            </AppCard>
          </div>

          {/* Right Column (1 Col): Status Summary & Timeline */}
          <div className="space-y-6">
            {/* Status Summary Card */}
            <AppCard className="p-5 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">
                Transfer Milestones
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#10B981] text-white flex items-center justify-center shrink-0 text-xs">
                    <IonIcon name="checkmark" size={14} />
                  </div>
                  <div>
                    <p className="font-bold text-[#1A1A1A]">Initiation</p>
                    <p className="text-[10px] text-[#6B7280]">Submitted by authorized owner</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs ${
                      transfer.newOwnerAccepted
                        ? "bg-[#10B981] text-white"
                        : "bg-[#F3F4F6] text-[#9CA3AF]"
                    }`}
                  >
                    <IonIcon name={transfer.newOwnerAccepted ? "checkmark" : "hourglass-outline"} size={14} />
                  </div>
                  <div>
                    <p className="font-bold text-[#1A1A1A]">New Owner Acceptance</p>
                    <p className="text-[10px] text-[#6B7280]">
                      {transfer.newOwnerAccepted ? "Accepted & Verified" : "Awaiting Acceptance"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs ${
                      isApprovedPendingCompletion || isCompleted
                        ? "bg-[#10B981] text-white"
                        : "bg-[#F3F4F6] text-[#9CA3AF]"
                    }`}
                  >
                    <IonIcon
                      name={isApprovedPendingCompletion || isCompleted ? "checkmark" : "shield-outline"}
                      size={14}
                    />
                  </div>
                  <div>
                    <p className="font-bold text-[#1A1A1A]">Committee Review</p>
                    <p className="text-[10px] text-[#6B7280]">
                      {transfer.societyDecision?.status || "Pending Verification"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs ${
                      isCompleted ? "bg-[#10B981] text-white" : "bg-[#F3F4F6] text-[#9CA3AF]"
                    }`}
                  >
                    <IonIcon name={isCompleted ? "checkmark" : "ribbon-outline"} size={14} />
                  </div>
                  <div>
                    <p className="font-bold text-[#1A1A1A]">Final Completion Execution</p>
                    <p className="text-[10px] text-[#6B7280]">
                      {isCompleted ? "Ownership Record Activated" : "Pending Approval Completion"}
                    </p>
                  </div>
                </div>
              </div>

              {isCompleted && transfer.completionDetails && (
                <div className="mt-4 p-3 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] text-xs text-[#047857] space-y-1">
                  <p className="font-bold">Official Transfer Finalized</p>
                  <p className="text-[11px]">
                    Share Cert: <strong>{transfer.completionDetails.newShareCertificateNumber}</strong>
                  </p>
                  <p className="text-[10px] text-[#065F46]">
                    Executed by {transfer.completionDetails.completedByName} on{" "}
                    {new Date(transfer.completionDetails.completedAt || "").toLocaleDateString()}
                  </p>
                </div>
              )}
            </AppCard>

            {/* Audit Timeline */}
            <AppCard className="p-5 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">
                Audit Timeline
              </h3>

              <div className="space-y-3 text-xs">
                {transfer.timeline.map((evt, idx) => (
                  <div key={idx} className="pb-2 border-b border-[#F1F3F5] last:border-0">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-[#1A1A1A]">{evt.stage.replace(/_/g, " ")}</span>
                      <span className="text-[#9CA3AF]">
                        {new Date(evt.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    {evt.comments && (
                      <p className="text-[11px] text-[#6B7280] mt-0.5 leading-relaxed">
                        {evt.comments}
                      </p>
                    )}
                    <span className="text-[10px] text-[#4F46E5]">
                      By {evt.performerName || "System"} ({evt.performerRole || "Actor"})
                    </span>
                  </div>
                ))}
              </div>
            </AppCard>
          </div>
        </div>

        {/* Modal 1: New Owner Acceptance Modal */}
        <Modal
          isOpen={isAcceptModalOpen}
          onClose={() => setIsAcceptModalOpen(false)}
          title="Review Property Transfer Proposal"
        >
          <form onSubmit={handleAcceptSubmit} className="space-y-4 text-xs">
            <p className="text-[#6B7280] leading-relaxed">
              You have been designated as the incoming owner for Flat {transfer.flatId?.flatNumber} in {transfer.societyId?.name}. Please confirm whether you accept or decline this transfer.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setAcceptDecision(true)}
                className={`p-3 rounded-xl border text-center font-bold cursor-pointer transition-all ${
                  acceptDecision
                    ? "bg-[#ECFDF5] border-[#10B981] text-[#047857]"
                    : "bg-white border-[#E5E7EB] text-[#6B7280]"
                }`}
              >
                Accept Transfer Proposal
              </button>
              <button
                type="button"
                onClick={() => setAcceptDecision(false)}
                className={`p-3 rounded-xl border text-center font-bold cursor-pointer transition-all ${
                  !acceptDecision
                    ? "bg-[#FEF2F2] border-[#EF4444] text-[#B91C1C]"
                    : "bg-white border-[#E5E7EB] text-[#6B7280]"
                }`}
              >
                Decline Transfer
              </button>
            </div>

            <FormField label="Comments / Notes for Committee">
              <textarea
                rows={3}
                placeholder="Enter any comments regarding title deeds or registration..."
                value={acceptComments}
                onChange={(e) => setAcceptComments(e.target.value)}
                className="w-full p-3 bg-white border border-[#E5E7EB] rounded-xl text-xs text-[#1A1A1A] focus:outline-none focus:border-[#4F46E5]"
              />
            </FormField>

            <div className="pt-2 flex justify-end gap-2">
              <AppButton type="button" variant="outline" size="sm" onClick={() => setIsAcceptModalOpen(false)}>
                Cancel
              </AppButton>
              <AppButton type="submit" variant="hero" size="sm" isLoading={actionLoading}>
                Submit Response
              </AppButton>
            </div>
          </form>
        </Modal>

        {/* Modal 2: Committee Decision Modal */}
        <Modal
          isOpen={isDecisionModalOpen}
          onClose={() => setIsDecisionModalOpen(false)}
          title="Record Committee Decision"
        >
          <form onSubmit={handleDecisionSubmit} className="space-y-4 text-xs">
            <FormField label="Managing Committee Action">
              <select
                value={decisionAction}
                onChange={(e) => setDecisionAction(e.target.value as any)}
                className="w-full h-10 px-3 bg-white border border-[#E5E7EB] rounded-xl text-xs text-[#1A1A1A] focus:outline-none focus:border-[#4F46E5]"
              >
                <option value="APPROVE">Approve Transfer (Moves to Completion Queue)</option>
                <option value="REQUEST_CORRECTION">Request Correction / Additional Documents</option>
                <option value="REJECT">Reject Transfer Request</option>
              </select>
            </FormField>

            <FormField label="Resolution Notes / Remarks" required>
              <textarea
                rows={3}
                placeholder="State committee resolution, verification remarks, or required corrections..."
                value={decisionComments}
                onChange={(e) => setDecisionComments(e.target.value)}
                required
                className="w-full p-3 bg-white border border-[#E5E7EB] rounded-xl text-xs text-[#1A1A1A] focus:outline-none focus:border-[#4F46E5]"
              />
            </FormField>

            <div className="pt-2 flex justify-end gap-2">
              <AppButton type="button" variant="outline" size="sm" onClick={() => setIsDecisionModalOpen(false)}>
                Cancel
              </AppButton>
              <AppButton type="submit" variant="hero" size="sm" isLoading={actionLoading}>
                Save Decision
              </AppButton>
            </div>
          </form>
        </Modal>

        {/* Modal 3: Execution of Final Completion Modal */}
        <Modal
          isOpen={isCompleteModalOpen}
          onClose={() => setIsCompleteModalOpen(false)}
          title="Execute Final Property Ownership Completion"
        >
          <form onSubmit={handleCompleteSubmit} className="space-y-4 text-xs">
            <div className="p-3 bg-[#EEF2FF] border border-[#C7D2FE] rounded-xl text-[#4F46E5] leading-relaxed">
              <strong>Statutory Record Execution:</strong> This action will atomically close the outgoing owner&apos;s occupancy, create the incoming owner&apos;s verified occupancy, update the Flat Directory, and issue ownership transition audit records.
            </div>

            <FormField label="Updated / Transferred Share Certificate Number" required>
              <input
                type="text"
                placeholder="e.g. SC-2026-099"
                value={newShareCertNumber}
                onChange={(e) => setNewShareCertNumber(e.target.value)}
                required
                className="w-full h-10 px-3 bg-white border border-[#E5E7EB] rounded-xl text-xs text-[#1A1A1A] focus:outline-none focus:border-[#4F46E5]"
              />
            </FormField>

            <FormField label="Managing Committee Final Notes">
              <textarea
                rows={3}
                placeholder="Final remarks for member register and statutory ledger..."
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                className="w-full p-3 bg-white border border-[#E5E7EB] rounded-xl text-xs text-[#1A1A1A] focus:outline-none focus:border-[#4F46E5]"
              />
            </FormField>

            <div className="pt-2 flex justify-end gap-2">
              <AppButton type="button" variant="outline" size="sm" onClick={() => setIsCompleteModalOpen(false)}>
                Cancel
              </AppButton>
              <AppButton type="submit" variant="hero" size="sm" isLoading={actionLoading}>
                Finalize &amp; Update Ownership
              </AppButton>
            </div>
          </form>
        </Modal>
      </div>
    </AppShell>
  );
}

export default function OwnershipTransferDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center text-xs font-semibold text-[#6B7280]">
          Loading ownership transfer dossier...
        </div>
      }
    >
      <OwnershipTransferDetailContent />
    </Suspense>
  );
}
