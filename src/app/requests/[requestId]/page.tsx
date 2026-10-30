"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import {
  AppCard,
  StatusBadge,
  AppButton,
  IconContainer,
  IonIcon,
  FormField,
  Modal,
  EmptyState,
} from "@/components/ui";

interface RequestDetailData {
  request: {
    id: string;
    requestId: string;
    serviceCode: string;
    serviceTitle: string;
    serviceCategory: string;
    serviceSnapshot: Record<string, unknown>;
    formData: Record<string, unknown>;
    currentStatus: string;
    pendingActorType: string;
    returnWorkflowStage?: string;
    isDraft: boolean;
    submittedAt?: string;
    createdAt: string;
    updatedAt: string;
    ownerAuthorization?: {
      status: string;
      ownerName?: string;
      decidedAt?: string;
      comment?: string;
    };
    correctionRequest?: {
      requestedByRole?: string;
      requestedByName?: string;
      requestedAt?: string;
      note?: string;
      requestedFields?: string[];
      requestedDocCodes?: string[];
    };
    attachments: Array<{
      documentId: string;
      displayName: string;
      originalFilename: string;
      category: string;
      size: number;
      mimeType: string;
      isRequired: boolean;
      viewUrl: string;
      downloadUrl: string;
    }>;
    generatedDocument?: {
      documentRef: string;
      documentType: string;
      originalFilename: string;
      generatedAt: string;
      issuedAt?: string;
      issuedByName?: string;
      issuedByRole?: string;
      verificationToken?: string;
      viewUrl?: string;
      downloadUrl?: string;
    };
    approvalWorkflow?: unknown;
    timeline: Array<{
      action: string;
      actorName: string;
      actorRole: string;
      timestamp: string;
      comment?: string;
      previousStatus?: string;
      newStatus?: string;
    }>;
  };
  society: { id: string; name: string; code: string };
  flat: {
    id: string;
    flatNumber: string;
    floor: number;
    bhkType?: string;
  };
  applicant: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  permissions: {
    isApplicant: boolean;
    isOwnerOfFlat: boolean;
    isManagement: boolean;
    canResolveCorrection: boolean;
    canCancel: boolean;
    canAuthorize: boolean;
  };
}

function RequestDetailContent() {
  const params = useParams();
  const requestId = params?.requestId as string;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<RequestDetailData | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Correction Drawer / Modal state
  const [correctionModalOpen, setCorrectionModalOpen] = useState(false);
  const [updatedFormData, setUpdatedFormData] = useState<Record<string, unknown>>({});
  const [correctionFile, setCorrectionFile] = useState<File | null>(null);
  const [correctionDocTitle, setCorrectionDocTitle] = useState("");
  const [isResubmitting, setIsResubmitting] = useState(false);

  // Document preview modal
  const [previewDoc, setPreviewDoc] = useState<{
    displayName: string;
    viewUrl: string;
    mimeType: string;
  } | null>(null);

  // Cancel modal
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);

  const fetchRequest = async () => {
    if (!requestId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/requests/${requestId}`);
      const json = await res.json();
      if (res.ok) {
        setData(json);
        setUpdatedFormData(json.request?.formData || {});
      } else {
        setFeedback({ type: "error", text: json.error || "Failed to load request dossier" });
      }
    } catch {
      setFeedback({ type: "error", text: "Network error loading request" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    async function load() {
      if (!requestId) return;
      try {
        setLoading(true);
        const res = await fetch(`/api/requests/${requestId}`);
        const json = await res.json();
        if (!ignore) {
          if (res.ok) {
            setData(json);
            setUpdatedFormData(json.request?.formData || {});
          } else {
            setFeedback({ type: "error", text: json.error || "Failed to load request dossier" });
          }
        }
      } catch {
        if (!ignore) {
          setFeedback({ type: "error", text: "Network error loading request" });
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
  }, [requestId]);

  const handleCancelRequest = async () => {
    try {
      setIsCancelling(true);
      const res = await fetch(`/api/requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CANCEL",
          cancelReason: cancelReason.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Cancellation failed");

      setFeedback({ type: "success", text: "Request cancelled successfully." });
      setCancelModalOpen(false);
      fetchRequest();
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "Error cancelling request",
      });
    } finally {
      setIsCancelling(false);
    }
  };

  const handleResubmitCorrections = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsResubmitting(true);
      setFeedback(null);

      // If a replacement document was uploaded, upload it to R2 first
      let newAttachments: Array<{
        documentId: string;
        displayName: string;
        originalFilename: string;
        category: string;
        size: number;
      }> = [];
      if (correctionFile) {
        const fd = new FormData();
        fd.append("file", correctionFile);
        fd.append("displayName", correctionDocTitle || correctionFile.name);
        fd.append("category", "CORRECTION_ATTACHMENT");
        if (data?.flat?.id) fd.append("flatId", data.flat.id);

        const uploadRes = await fetch("/api/requests/attachments", {
          method: "POST",
          body: fd,
        });
        const uploadJson = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadJson.error || "Document upload failed");
        newAttachments = [uploadJson.attachment];
      }

      const res = await fetch(`/api/requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "RESUBMIT_CORRECTIONS",
          updatedFormData,
          newAttachments,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to resubmit corrections");

      setFeedback({ type: "success", text: json.message || "Corrections submitted successfully." });
      setCorrectionModalOpen(false);
      setCorrectionFile(null);
      fetchRequest();
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "Error submitting corrections",
      });
    } finally {
      setIsResubmitting(false);
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
        return "Awaiting Flat Owner Authorization";
      case "AWAITING_SOCIETY_REVIEW":
        return "Awaiting Society Management Review";
      case "INFORMATION_REQUIRED":
        return "More Information Required";
      case "UNDER_REVIEW":
        return "Under Committee Scrutiny";
      case "OWNER_DECLINED":
        return "Owner Declined";
      case "REJECTED":
        return "Rejected by Society";
      case "DRAFT":
        return "Draft";
      case "CANCELLED":
        return "Cancelled";
      default:
        return status.replace(/_/g, " ");
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-xs font-semibold text-[#6B7280]">
        Loading service request dossier...
      </div>
    );
  }

  if (!data || !data.request) {
    return (
      <EmptyState
        title="Request Not Found"
        description="The requested service application does not exist or you do not have permission to view it."
        iconName="alert-circle-outline"
        action={
          <Link href="/requests">
            <AppButton variant="primary" size="sm">
              Back to Requests
            </AppButton>
          </Link>
        }
      />
    );
  }

  const { request, society, flat, applicant, permissions } = data;
  const isOwnerAuthorized = request.ownerAuthorization?.status === "AUTHORIZED";

  return (
    <div className="space-y-6">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-semibold text-[#6B7280]">
        <Link href="/requests" className="hover:text-[#4F46E5] flex items-center gap-1">
          <IonIcon name="arrow-back-outline" size={14} />
          <span>My Requests</span>
        </Link>
        <span className="text-[#9CA3AF]">/</span>
        <span className="font-mono text-[#1A1A1A] font-bold">{request.requestId}</span>
      </div>

      {/* Top Banner / Dossier Header */}
      <AppCard className="p-6 bg-white shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5E7EB] pb-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono font-bold text-sm bg-[#1A1A1A] text-white px-2.5 py-1 rounded-md">
                {request.requestId}
              </span>
              <StatusBadge variant={getStatusBadgeVariant(request.currentStatus)}>
                {formatStatusLabel(request.currentStatus)}
              </StatusBadge>
              <span className="text-xs font-bold text-[#4F46E5] bg-[#EEF2FF] px-2.5 py-1 rounded-md">
                {request.serviceCategory.replace(/_/g, " ")}
              </span>
            </div>
            <h1 className="font-heading font-bold text-xl text-[#1A1A1A]">
              {request.serviceTitle}
            </h1>
            <p className="text-xs text-[#6B7280]">
              {society.name} • Unit {flat.flatNumber} (Floor {flat.floor}) • Applicant: {applicant.name}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {permissions.canResolveCorrection && (
              <AppButton
                variant="primary"
                size="sm"
                onClick={() => setCorrectionModalOpen(true)}
                leftIcon="create-outline"
              >
                Resolve Corrections
              </AppButton>
            )}

            {permissions.canAuthorize && (
              <Link href="/owner/authorizations">
                <AppButton variant="primary" size="sm" leftIcon="key-outline">
                  Review Authorization
                </AppButton>
              </Link>
            )}

            {permissions.canCancel && (
              <AppButton
                variant="outline"
                size="sm"
                onClick={() => setCancelModalOpen(true)}
                className="text-[#F43F5E] hover:text-[#9F1239]"
              >
                Cancel Application
              </AppButton>
            )}
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-3 rounded-xl text-xs font-semibold flex items-center justify-between ${
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

        {/* ISSUED OFFICIAL CERTIFICATE BANNER & DOWNLOAD (Prompt 8) */}
        {request.generatedDocument && (
          <div className="p-5 bg-[#ECFDF5] border-2 border-[#10B981] rounded-2xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#10B981] text-white flex items-center justify-center text-xl shadow-sm">
                  <IonIcon name="ribbon-outline" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-[#065F46] uppercase tracking-wider block">
                    Official Society Certificate Issued
                  </span>
                  <h3 className="text-base font-bold text-[#064E3B]">
                    Ref No: {request.generatedDocument.documentRef}
                  </h3>
                  <p className="text-xs text-[#047857]">
                    Sanctioned by {request.generatedDocument.issuedByName || "Managing Committee"} ({request.generatedDocument.issuedByRole || "Official"})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {request.generatedDocument.viewUrl && (
                  <a href={request.generatedDocument.viewUrl} target="_blank" rel="noopener noreferrer">
                    <AppButton variant="outline" size="sm" leftIcon="eye-outline">
                      View Certificate
                    </AppButton>
                  </a>
                )}
                {request.generatedDocument.downloadUrl && (
                  <a href={request.generatedDocument.downloadUrl} download>
                    <AppButton variant="primary" size="sm" leftIcon="download-outline">
                      Download PDF
                    </AppButton>
                  </a>
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-[#A7F3D0] flex flex-wrap items-center justify-between gap-2 text-xs text-[#065F46]">
              <span>
                Issued on {new Date(request.generatedDocument.issuedAt || request.generatedDocument.generatedAt).toLocaleDateString()} • Recorded in your digital document vault
              </span>
              {request.generatedDocument.verificationToken && (
                <Link
                  href={`/verify/${request.generatedDocument.verificationToken}`}
                  target="_blank"
                  className="font-bold underline text-[#047857] hover:text-[#064E3B]"
                >
                  Verify QR Record →
                </Link>
              )}
            </div>
          </div>
        )}

        {/* ACTION REQUIRED BANNER */}
        {request.currentStatus === "INFORMATION_REQUIRED" && request.correctionRequest && (
          <div className="p-4 bg-[#FFFBEB] border border-[#FDE68A] rounded-xl space-y-2 text-xs text-[#92400E]">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm flex items-center gap-1.5">
                <IonIcon name="alert-circle-outline" size={16} />
                Action Required: Additional Information Requested
              </span>
              <span className="text-[11px] font-bold bg-white px-2 py-0.5 rounded-md border border-[#FDE68A]">
                Requested by: {request.correctionRequest.requestedByName || "Reviewer"} (
                {request.correctionRequest.requestedByRole})
              </span>
            </div>
            <p className="leading-relaxed font-medium">
              &quot;{request.correctionRequest.note}&quot;
            </p>
            {permissions.canResolveCorrection && (
              <div className="pt-2">
                <AppButton
                  size="sm"
                  variant="primary"
                  onClick={() => setCorrectionModalOpen(true)}
                  rightIcon="arrow-forward-outline"
                >
                  Update Application & Resubmit
                </AppButton>
              </div>
            )}
          </div>
        )}

        {/* OWNER DECLINED BANNER */}
        {request.currentStatus === "OWNER_DECLINED" && (
          <div className="p-4 bg-[#FFF1F2] border border-[#F43F5E] rounded-xl text-xs text-[#9F1239] space-y-1">
            <div className="font-bold text-sm flex items-center gap-1.5">
              <IonIcon name="close-circle-outline" size={16} />
              Owner Authorization Declined
            </div>
            <p className="leading-relaxed">
              Reason provided by flat owner: &quot;{request.ownerAuthorization?.comment || "No specific reason provided"}&quot;.
              This application has stopped and will not enter the society queue.
            </p>
          </div>
        )}

        {/* Metas Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs pt-1">
          <div>
            <span className="text-[#6B7280] font-semibold">Submitted Date:</span>
            <p className="font-bold text-[#1A1A1A] mt-0.5">
              {request.submittedAt
                ? new Date(request.submittedAt).toLocaleDateString()
                : "Not yet submitted"}
            </p>
          </div>
          <div>
            <span className="text-[#6B7280] font-semibold">Pending Actor:</span>
            <p className="font-bold text-[#4F46E5] mt-0.5">
              {request.pendingActorType.replace(/_/g, " ")}
            </p>
          </div>
          <div>
            <span className="text-[#6B7280] font-semibold">Owner Authorization:</span>
            <p className="font-bold text-[#1A1A1A] mt-0.5">
              {request.ownerAuthorization?.status === "AUTHORIZED"
                ? `Authorized by ${request.ownerAuthorization.ownerName || "Owner"}`
                : request.ownerAuthorization?.status === "PENDING"
                ? "Pending Flat Owner Action"
                : request.ownerAuthorization?.status === "DECLINED"
                ? "Declined by Flat Owner"
                : "Not Required (Direct Review)"}
            </p>
          </div>
          <div>
            <span className="text-[#6B7280] font-semibold">Attachments:</span>
            <p className="font-bold text-[#1A1A1A] mt-0.5">
              {request.attachments.length} Document{request.attachments.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>
      </AppCard>

      {/* Visual Routing Timeline Indicator */}
      <AppCard className="p-6 bg-white shadow-2xs space-y-4">
        <h3 className="font-heading font-bold text-sm text-[#1A1A1A] uppercase tracking-wider">
          Application Routing Progression
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          {/* Step 1: Submission */}
          <div className="p-3.5 rounded-xl border border-[#BBF7D0] bg-[#F0FDF4] space-y-1">
            <div className="flex items-center gap-1.5 text-[#166534] font-bold">
              <IonIcon name="checkmark-circle-outline" size={16} />
              <span>1. Application Submitted</span>
            </div>
            <p className="text-[11px] text-[#166534]">
              {request.submittedAt ? new Date(request.submittedAt).toLocaleDateString() : "Initiated"}
            </p>
          </div>

          {/* Step 2: Owner Auth (if applicable) */}
          <div
            className={`p-3.5 rounded-xl border space-y-1 ${
              request.ownerAuthorization?.status === "NOT_REQUIRED"
                ? "border-[#E5E7EB] bg-[#F8F9FA] text-[#6B7280]"
                : isOwnerAuthorized
                ? "border-[#BBF7D0] bg-[#F0FDF4] text-[#166534]"
                : request.ownerAuthorization?.status === "DECLINED"
                ? "border-[#F43F5E] bg-[#FFF1F2] text-[#9F1239]"
                : "border-[#FDE68A] bg-[#FFFBEB] text-[#92400E]"
            }`}
          >
            <div className="flex items-center gap-1.5 font-bold">
              <IonIcon
                name={
                  isOwnerAuthorized
                    ? "checkmark-circle-outline"
                    : request.ownerAuthorization?.status === "DECLINED"
                    ? "close-circle-outline"
                    : "key-outline"
                }
                size={16}
              />
              <span>2. Owner Authorization</span>
            </div>
            <p className="text-[11px]">
              {request.ownerAuthorization?.status === "NOT_REQUIRED"
                ? "Not required for this service"
                : isOwnerAuthorized
                ? `Authorized on ${new Date(request.ownerAuthorization?.decidedAt || "").toLocaleDateString()}`
                : request.ownerAuthorization?.status === "DECLINED"
                ? "Authorization declined"
                : "Awaiting flat owner review"}
            </p>
          </div>

          {/* Step 3: Society Review */}
          <div
            className={`p-3.5 rounded-xl border space-y-1 ${
              request.currentStatus === "AWAITING_SOCIETY_REVIEW" || request.currentStatus === "UNDER_REVIEW"
                ? "border-[#C7D2FE] bg-[#EEF2FF] text-[#4338CA]"
                : request.currentStatus === "INFORMATION_REQUIRED"
                ? "border-[#FDE68A] bg-[#FFFBEB] text-[#92400E]"
                : request.currentStatus === "REJECTED"
                ? "border-[#F43F5E] bg-[#FFF1F2] text-[#9F1239]"
                : request.currentStatus === "APPROVED"
                ? "border-[#BBF7D0] bg-[#F0FDF4] text-[#166534]"
                : "border-[#E5E7EB] bg-[#F8F9FA] text-[#6B7280]"
            }`}
          >
            <div className="flex items-center gap-1.5 font-bold">
              <IonIcon name="shield-checkmark-outline" size={16} />
              <span>3. Society Review</span>
            </div>
            <p className="text-[11px]">
              {request.currentStatus === "AWAITING_SOCIETY_REVIEW"
                ? "In society review queue"
                : request.currentStatus === "UNDER_REVIEW"
                ? "Under active scrutiny"
                : request.currentStatus === "INFORMATION_REQUIRED"
                ? "Corrections requested"
                : request.currentStatus === "REJECTED"
                ? "Rejected"
                : "Pending prior steps"}
            </p>
          </div>

          {/* Step 4: Decision & Issuance */}
          <div
            className={`p-3.5 rounded-xl border space-y-1 ${
              request.currentStatus === "APPROVED" || request.currentStatus === "COMPLETED"
                ? "border-[#BBF7D0] bg-[#F0FDF4] text-[#166534]"
                : "border-[#E5E7EB] bg-[#F8F9FA] text-[#6B7280]"
            }`}
          >
            <div className="flex items-center gap-1.5 font-bold">
              <IonIcon name="ribbon-outline" size={16} />
              <span>4. Decision & Sign-off</span>
            </div>
            <p className="text-[11px]">
              {request.currentStatus === "APPROVED"
                ? "Approved"
                : "Official decision in Prompt 8"}
            </p>
          </div>
        </div>
      </AppCard>

      {/* Submitted Application Fields Data */}
      <AppCard className="p-6 bg-white shadow-2xs space-y-4">
        <h3 className="font-heading font-bold text-sm text-[#1A1A1A] uppercase tracking-wider">
          Submitted Application Fields
        </h3>

        {Object.keys(request.formData || {}).length === 0 ? (
          <p className="text-xs text-[#6B7280]">No additional field values submitted.</p>
        ) : (
          <div className="bg-[#F8F9FA] rounded-xl border border-[#E5E7EB] divide-y divide-[#E5E7EB] text-xs">
            {Object.entries(request.formData).map(([k, v]) => (
              <div key={k} className="p-3 flex items-start justify-between gap-4">
                <span className="text-[#6B7280] font-semibold capitalize">
                  {k.replace(/([A-Z])/g, " $1").trim()}
                </span>
                <span className="font-bold text-[#1A1A1A] text-right">
                  {v === true ? "Yes" : v === false ? "No" : String(v)}
                </span>
              </div>
            ))}
          </div>
        )}
      </AppCard>

      {/* Attached Property & Application Documents */}
      <AppCard className="p-6 bg-white shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-heading font-bold text-sm text-[#1A1A1A] uppercase tracking-wider">
            Attached Documents ({request.attachments.length})
          </h3>
          <span className="text-xs text-[#6B7280]">Real Cloudflare R2 Storage</span>
        </div>

        {request.attachments.length === 0 ? (
          <p className="text-xs text-[#6B7280]">No document files attached.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {request.attachments.map((att) => (
              <div
                key={att.documentId}
                className="p-3.5 bg-[#F8F9FA] rounded-xl border border-[#E5E7EB] flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <IconContainer name="document-text-outline" variant="hero" size="sm" />
                  <div className="truncate">
                    <p className="font-bold text-[#1A1A1A] truncate">{att.displayName}</p>
                    <p className="text-[11px] text-[#6B7280]">
                      {att.originalFilename} • {(att.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {att.viewUrl && (
                    <button
                      onClick={() =>
                        setPreviewDoc({
                          displayName: att.displayName,
                          viewUrl: att.viewUrl,
                          mimeType: att.mimeType,
                        })
                      }
                      className="p-1.5 text-[#4F46E5] hover:bg-[#EEF2FF] rounded-lg transition-colors cursor-pointer"
                      title="Preview Document"
                    >
                      <IonIcon name="eye-outline" size={16} />
                    </button>
                  )}
                  {att.downloadUrl && (
                    <a
                      href={att.downloadUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 text-[#1A1A1A] hover:bg-[#E5E7EB] rounded-lg transition-colors cursor-pointer"
                      title="Download File"
                    >
                      <IonIcon name="download-outline" size={16} />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </AppCard>

      {/* Activity Timeline & Audit History */}
      <AppCard className="p-6 bg-white shadow-2xs space-y-4">
        <h3 className="font-heading font-bold text-sm text-[#1A1A1A] uppercase tracking-wider">
          Request Activity & Audit History
        </h3>

        <div className="relative border-l-2 border-[#E5E7EB] ml-3 space-y-4 text-xs">
          {request.timeline.map((event, idx) => (
            <div key={idx} className="relative pl-5">
              {/* Dot */}
              <div className="absolute -left-[7px] top-1 w-3 h-3 rounded-full bg-[#4F46E5] border-2 border-white" />

              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#1A1A1A]">
                    {event.action.replace(/_/g, " ")}
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-[#F3F4F6] text-[#6B7280]">
                    {event.actorRole}
                  </span>
                  <span className="text-[#9CA3AF] text-[11px]">
                    {new Date(event.timestamp).toLocaleString()}
                  </span>
                </div>

                <p className="text-[11px] text-[#6B7280]">Actor: {event.actorName}</p>

                {event.comment && (
                  <p className="p-2 mt-1 bg-[#F8F9FA] rounded-lg border border-[#E5E7EB] text-xs text-[#1A1A1A] italic">
                    &quot;{event.comment}&quot;
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </AppCard>

      {/* MODAL 1: RESOLVE CORRECTIONS */}
      <Modal
        isOpen={correctionModalOpen}
        onClose={() => setCorrectionModalOpen(false)}
        title="Submit Requested Information"
      >
        <form onSubmit={handleResubmitCorrections} className="space-y-4 text-xs">
          <p className="text-[#6B7280]">
            Update the necessary application fields or attach replacement documents as requested by
            the reviewer.
          </p>

          <div className="p-3 bg-[#FFFBEB] border border-[#FDE68A] rounded-xl text-xs text-[#92400E]">
            <span className="font-bold">Reviewer Note: </span>
            {request.correctionRequest?.note}
          </div>

          {/* Form fields to edit */}
          <div className="space-y-3">
            <h4 className="font-bold text-[#1A1A1A]">Edit Application Values:</h4>
            {Object.keys(request.formData || {}).map((k) => (
              <FormField key={k} label={k.replace(/([A-Z])/g, " $1")} id={`edit-${k}`}>
                <input
                  type="text"
                  value={String(updatedFormData[k] ?? "")}
                  onChange={(e) =>
                    setUpdatedFormData((prev) => ({ ...prev, [k]: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] bg-white text-xs font-semibold"
                />
              </FormField>
            ))}
          </div>

          {/* Optional replacement file upload */}
          <div className="space-y-2 pt-2 border-t border-[#E5E7EB]">
            <h4 className="font-bold text-[#1A1A1A]">Attach Replacement / Extra Document:</h4>
            <FormField label="Document Title" id="corr-title">
              <input
                type="text"
                placeholder="e.g. Revised Sanction Letter"
                value={correctionDocTitle}
                onChange={(e) => setCorrectionDocTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] bg-white text-xs font-semibold"
              />
            </FormField>
            <FormField label="Select File (PDF, JPG, PNG)" id="corr-file">
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setCorrectionFile(e.target.files?.[0] || null)}
                className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] bg-white text-xs"
              />
            </FormField>
          </div>

          <div className="pt-3 border-t border-[#E5E7EB] flex justify-end gap-2">
            <AppButton
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setCorrectionModalOpen(false)}
            >
              Cancel
            </AppButton>
            <AppButton
              type="submit"
              variant="primary"
              size="sm"
              disabled={isResubmitting}
              leftIcon="send-outline"
            >
              {isResubmitting ? "Resubmitting..." : "Resubmit Application"}
            </AppButton>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: CANCEL APPLICATION */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Cancel Service Application"
      >
        <div className="space-y-4 text-xs">
          <p className="text-[#6B7280]">
            Are you sure you want to cancel this application? Once cancelled, the request will be
            closed and cannot be reopened.
          </p>

          <FormField label="Cancellation Reason (Optional)" id="cancel-reason">
            <textarea
              rows={3}
              placeholder="e.g. No longer required"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] bg-white text-xs font-semibold"
            />
          </FormField>

          <div className="pt-3 border-t border-[#E5E7EB] flex justify-end gap-2">
            <AppButton variant="ghost" size="sm" onClick={() => setCancelModalOpen(false)}>
              Keep Request
            </AppButton>
            <AppButton
              variant="outline"
              size="sm"
              onClick={handleCancelRequest}
              disabled={isCancelling}
              className="text-[#F43F5E] border-[#F43F5E]"
            >
              {isCancelling ? "Cancelling..." : "Confirm Cancellation"}
            </AppButton>
          </div>
        </div>
      </Modal>

      {/* MODAL 3: DOCUMENT PREVIEW */}
      <Modal
        isOpen={!!previewDoc}
        onClose={() => setPreviewDoc(null)}
        title={previewDoc?.displayName || "Document Preview"}
      >
        <div className="space-y-3">
          <div className="border border-[#E5E7EB] rounded-xl overflow-hidden bg-[#F8F9FA] flex items-center justify-center min-h-[350px]">
            {previewDoc?.mimeType.includes("image") ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={previewDoc.viewUrl}
                alt={previewDoc.displayName}
                className="max-h-[500px] w-auto object-contain"
              />
            ) : previewDoc?.mimeType.includes("pdf") ? (
              <iframe
                src={previewDoc.viewUrl}
                title={previewDoc.displayName}
                className="w-full h-[500px] border-none"
              />
            ) : (
              <p className="text-xs text-[#6B7280]">Preview format not supported</p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <AppButton variant="ghost" size="sm" onClick={() => setPreviewDoc(null)}>
              Close
            </AppButton>
            <a
              href={previewDoc?.viewUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-[#4F46E5] font-bold hover:underline self-center"
            >
              Open in New Window
            </a>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function RequestDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center text-xs font-semibold text-[#6B7280]">
          Loading service request dossier...
        </div>
      }
    >
      <AppShell>
        <RequestDetailContent />
      </AppShell>
    </Suspense>
  );
}
