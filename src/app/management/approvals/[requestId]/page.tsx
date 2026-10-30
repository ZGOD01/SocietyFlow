"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useParams } from "next/navigation";
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

interface AttachmentItem {
  documentId: string;
  displayName: string;
  originalFilename: string;
  category: string;
  size: number;
  mimeType: string;
  isRequired: boolean;
  uploadedAt: string;
  verificationStatus: "PENDING" | "VERIFIED" | "CORRECTION_REQUIRED" | "REJECTED";
  verifiedByName?: string;
  verifiedByRole?: string;
  verifiedAt?: string;
  verificationComment?: string;
  viewUrl?: string;
  downloadUrl?: string;
}

interface ApprovalStageItem {
  stageIndex: number;
  stageKey: string;
  stageName: string;
  stageType: string;
  allowedRoles: string[];
  approverLogic: string;
  expectedDays: number;
  status: string;
  startedAt?: string;
  completedAt?: string;
  dueDate?: string;
  isOverdue?: boolean;
  requiredSignersCount?: number;
  approvalsReceived: Array<{
    actorName: string;
    actorRole: string;
    delegatedBy?: string;
    approvedAt: string;
    comment?: string;
  }>;
  actionNotes?: string;
}

interface RequestReviewDossier {
  id: string;
  requestId: string;
  serviceCode: string;
  serviceTitle: string;
  serviceCategory: string;
  currentStatus: string;
  pendingActorType: string;
  submittedAt: string;
  applicant: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    role: "OWNER" | "TENANT";
  };
  unit: {
    flatNumber: string;
    floor?: number;
    wingName: string;
    societyName: string;
    societyRegNumber?: string;
  };
  formData: Record<string, unknown>;
  attachments: AttachmentItem[];
  approvalWorkflow: {
    workflowVersion: number;
    currentStageIndex: number;
    isCompleted: boolean;
    finalDecision?: string;
    requiresDocumentIssuance?: boolean;
    documentTemplateCode?: string;
    stages: ApprovalStageItem[];
  } | null;
  ownerAuthorization?: {
    status: string;
    ownerName?: string;
    decidedAt?: string;
    comment?: string;
  };
  correctionRequest?: {
    requestedByName?: string;
    requestedAt?: string;
    note?: string;
  };
  timeline: Array<{
    action: string;
    actorName: string;
    actorRole: string;
    timestamp: string;
    comment?: string;
    delegatedBy?: string;
    isInternalNote?: boolean;
  }>;
  generatedDocument?: {
    documentRef: string;
    documentType: string;
    title?: string;
    issuedByName?: string;
    issuedByRole?: string;
    issuedAt?: string;
    verificationToken?: string;
    viewUrl?: string;
  };
  permissions: {
    canApproveStage: boolean;
    canReject: boolean;
    canRequestInfo: boolean;
    canVerifyDocuments: boolean;
    canIssueCertificate: boolean;
    officialRoleUsed: string;
    isDelegated: boolean;
    delegatorName?: string;
    ineligibilityReason?: string;
  };
  sla: {
    pendingDurationHours: number;
    expectedCompletionDate: string | null;
    isOverdue: boolean;
  };
}

function RequestReviewContent() {
  const router = useRouter();
  const routeParams = useParams();
  const requestId = (routeParams?.requestId as string) || "";
  const [dossier, setDossier] = useState<RequestReviewDossier | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Action modals state
  const [activeModal, setActiveModal] = useState<"APPROVE" | "REJECT" | "CORRECTION" | "ISSUE" | "COMMENT" | null>(null);
  const [actionComment, setActionComment] = useState("");
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [actionProcessing, setActionProcessing] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [actionErrorMsg, setActionErrorMsg] = useState<string | null>(null);

  const loadDossier = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/management/approvals/${requestId}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Failed to load request details.");
        return;
      }
      setDossier(data.request);
    } catch (err) {
      setError("Network error loading review dossier.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDossier();
  }, [requestId]);

  const handleExecuteAction = async (actionType: string) => {
    setActionProcessing(true);
    setActionSuccessMsg(null);
    setActionErrorMsg(null);

    try {
      const payload: Record<string, unknown> = {
        action: actionType,
        comment: actionComment.trim(),
        isInternalNote,
      };

      const res = await fetch(`/api/management/approvals/${requestId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const resJson = await res.json();
      if (!res.ok || !resJson.success) {
        setActionErrorMsg(resJson.error || "Action execution failed.");
        setActionProcessing(false);
        return;
      }

      setActionSuccessMsg(resJson.message || "Action recorded successfully.");
      setTimeout(() => {
        setActiveModal(null);
        setActionComment("");
        setActionSuccessMsg(null);
        loadDossier();
      }, 1200);
    } catch (e) {
      setActionErrorMsg("Failed to communicate with server.");
    } finally {
      setActionProcessing(false);
    }
  };

  const handleVerifyDocument = async (
    docId: string,
    status: "VERIFIED" | "CORRECTION_REQUIRED" | "REJECTED"
  ) => {
    try {
      const res = await fetch(`/api/management/approvals/${requestId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "VERIFY_DOCUMENT",
          documentId: docId,
          verificationStatus: status,
        }),
      });
      const data = await res.json();
      if (data.success) {
        loadDossier();
      }
    } catch (e) {
      console.error("[Doc Verify Error]", e);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center">
        <IonIcon name="sync-outline" className="animate-spin text-3xl text-indigo-600 mb-2" />
        <p className="text-sm text-gray-500 font-medium">Loading Approval Dossier #{requestId}...</p>
      </div>
    );
  }

  if (error || !dossier) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-gray-200">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3 text-red-600">
          <IonIcon name="alert-circle-outline" className="text-2xl" />
        </div>
        <h3 className="text-base font-bold text-gray-900">Access Denied or Not Found</h3>
        <p className="text-xs text-gray-600 mt-1 max-w-sm mx-auto">{error}</p>
        <div className="mt-4">
          <Link href="/management/approvals">
            <AppButton variant="outline" size="sm">
              Return to Inbox
            </AppButton>
          </Link>
        </div>
      </div>
    );
  }

  const currentStageIdx = dossier.approvalWorkflow?.currentStageIndex ?? 0;
  const stages = dossier.approvalWorkflow?.stages || [];
  const currentStage = stages[currentStageIdx] || null;

  return (
    <div className="space-y-6 pb-20">
      {/* Top Header */}
      <PageHeader
        title={`Review Request #${dossier.requestId}`}
        description={`${dossier.serviceTitle} • ${dossier.unit.societyName}`}
        breadcrumbs={[
          { label: "Console", href: "/management/dashboard" },
          { label: "Approvals", href: "/management/approvals" },
          { label: `#${dossier.requestId}` },
        ]}
        badge={
          <div className="flex items-center gap-2">
            <StatusBadge
              variant={
                dossier.currentStatus === "COMPLETED" || dossier.currentStatus === "APPROVED"
                  ? "success"
                  : dossier.currentStatus === "REJECTED"
                  ? "error"
                  : dossier.currentStatus === "INFORMATION_REQUIRED"
                  ? "warning"
                  : "hero"
              }
              size="sm"
            >
              {dossier.currentStatus.replace(/_/g, " ")}
            </StatusBadge>
            {dossier.sla.isOverdue && (
              <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">
                SLA OVERDUE
              </span>
            )}
          </div>
        }
      />

      {/* Delegation Notice Banner if applicable */}
      {dossier.permissions.isDelegated && (
        <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-2xl flex items-center gap-3">
          <IonIcon name="key-outline" className="text-amber-700 text-xl" />
          <div className="text-xs text-amber-900">
            <strong>Delegated Authority Active:</strong> You are authorized to review and sign this stage under official authority delegated by <strong>{dossier.permissions.delegatorName || "Committee Official"}</strong>.
          </div>
        </div>
      )}

      {/* Main Grid: Left Dossier vs Right Timeline & Action Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Applicant, Form Data, Attachments */}
        <div className="lg:col-span-2 space-y-6">
          {/* Applicant & Unit Summary Card */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <IonIcon name="person-outline" className="text-indigo-600" />
              Applicant & Property Dossier
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-gray-50 rounded-xl space-y-1">
                <span className="text-gray-500 font-medium">Applicant Name</span>
                <p className="text-sm font-bold text-gray-900">{dossier.applicant.name}</p>
                <span className="inline-block bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-semibold text-[10px]">
                  {dossier.applicant.role} OF RECORD
                </span>
                {dossier.applicant.email && (
                  <p className="text-gray-600 pt-1">Email: {dossier.applicant.email}</p>
                )}
                {dossier.applicant.phone && (
                  <p className="text-gray-600">Phone: {dossier.applicant.phone}</p>
                )}
              </div>

              <div className="p-3 bg-gray-50 rounded-xl space-y-1">
                <span className="text-gray-500 font-medium">Flat & Wing</span>
                <p className="text-sm font-bold text-gray-900">
                  {dossier.unit.wingName ? `${dossier.unit.wingName} - ` : ""}Flat {dossier.unit.flatNumber}
                </p>
                <p className="text-gray-600 font-medium">{dossier.unit.societyName}</p>
                {dossier.unit.societyRegNumber && (
                  <p className="text-[11px] text-gray-500">Reg: {dossier.unit.societyRegNumber}</p>
                )}
              </div>
            </div>

            {dossier.ownerAuthorization && dossier.applicant.role === "TENANT" && (
              <div className="p-3 rounded-xl border border-gray-200 bg-gray-50 text-xs">
                <span className="font-semibold text-gray-700 block">Owner Authorization Status:</span>
                <div className="flex items-center gap-2 mt-1">
                  <StatusBadge
                    variant={dossier.ownerAuthorization.status === "AUTHORIZED" ? "success" : "warning"}
                    size="sm"
                  >
                    {dossier.ownerAuthorization.status}
                  </StatusBadge>
                  <span className="text-gray-600">
                    By {dossier.ownerAuthorization.ownerName || "Flat Owner"}
                    {dossier.ownerAuthorization.decidedAt
                      ? ` on ${new Date(dossier.ownerAuthorization.decidedAt).toLocaleDateString()}`
                      : ""}
                  </span>
                </div>
                {dossier.ownerAuthorization.comment && (
                  <p className="text-gray-500 italic mt-1">&ldquo;{dossier.ownerAuthorization.comment}&rdquo;</p>
                )}
              </div>
            )}
          </div>

          {/* Application Form Fields */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <IonIcon name="document-text-outline" className="text-indigo-600" />
              Application Submission Data
            </h3>

            {Object.keys(dossier.formData || {}).length === 0 ? (
              <p className="text-xs text-gray-500">No additional form fields entered.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {Object.entries(dossier.formData).map(([k, val]) => (
                  <div key={k} className="p-2.5 bg-gray-50 rounded-xl">
                    <span className="text-gray-500 font-medium capitalize">
                      {k.replace(/([A-Z])/g, " $1").trim()}
                    </span>
                    <p className="text-gray-900 font-bold mt-0.5">
                      {typeof val === "boolean" ? (val ? "Yes" : "No") : String(val)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Attached Documents & Verification Console */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <IonIcon name="attach-outline" className="text-indigo-600" />
                Attached Documents ({dossier.attachments.length})
              </h3>
              <span className="text-xs text-gray-500">Stored privately in Cloudflare R2</span>
            </div>

            {dossier.attachments.length === 0 ? (
              <p className="text-xs text-gray-500 italic">No files attached to this request.</p>
            ) : (
              <div className="space-y-3">
                {dossier.attachments.map((doc) => (
                  <div
                    key={doc.documentId}
                    className="p-4 rounded-xl border border-gray-200 bg-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <IonIcon name="document-outline" className="text-indigo-600 text-lg" />
                        <span className="font-bold text-xs text-gray-900">{doc.displayName}</span>
                        <StatusBadge
                          variant={
                            doc.verificationStatus === "VERIFIED"
                              ? "success"
                              : doc.verificationStatus === "REJECTED"
                              ? "error"
                              : doc.verificationStatus === "CORRECTION_REQUIRED"
                              ? "warning"
                              : "neutral"
                          }
                          size="sm"
                        >
                          {doc.verificationStatus || "PENDING"}
                        </StatusBadge>
                      </div>
                      <p className="text-[11px] text-gray-500">
                        {doc.originalFilename} • {(doc.size / 1024).toFixed(0)} KB • {doc.category}
                      </p>
                      {doc.verifiedByName && (
                        <p className="text-[11px] text-gray-600">
                          Checked by {doc.verifiedByName} ({doc.verifiedByRole})
                          {doc.verificationComment ? `: "${doc.verificationComment}"` : ""}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {doc.viewUrl && (
                        <a href={doc.viewUrl} target="_blank" rel="noopener noreferrer">
                          <AppButton variant="outline" size="sm">
                            <IonIcon name="eye-outline" className="mr-1" />
                            View
                          </AppButton>
                        </a>
                      )}
                      {doc.downloadUrl && (
                        <a href={doc.downloadUrl} download>
                          <AppButton variant="outline" size="sm">
                            <IonIcon name="download-outline" className="mr-1" />
                            Download
                          </AppButton>
                        </a>
                      )}

                      {/* Document Verification Marking (Section 5) */}
                      {dossier.permissions.canVerifyDocuments && (
                        <div className="flex items-center gap-1 border-l pl-2 border-gray-300">
                          <button
                            onClick={() => handleVerifyDocument(doc.documentId, "VERIFIED")}
                            title="Mark Verified"
                            className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800 hover:bg-emerald-200 text-xs font-bold"
                          >
                            <IonIcon name="checkmark" />
                          </button>
                          <button
                            onClick={() => handleVerifyDocument(doc.documentId, "CORRECTION_REQUIRED")}
                            title="Require Correction"
                            className="p-1.5 rounded-lg bg-amber-100 text-amber-800 hover:bg-amber-200 text-xs font-bold"
                          >
                            <IonIcon name="alert" />
                          </button>
                          <button
                            onClick={() => handleVerifyDocument(doc.documentId, "REJECTED")}
                            title="Reject Attachment"
                            className="p-1.5 rounded-lg bg-red-100 text-red-800 hover:bg-red-200 text-xs font-bold"
                          >
                            <IonIcon name="close" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Issued Certificate Section if generated */}
          {dossier.generatedDocument && (
            <div className="bg-emerald-50 border-2 border-emerald-300 p-5 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <IonIcon name="ribbon-outline" className="text-emerald-700 text-2xl" />
                  <div>
                    <h4 className="text-sm font-bold text-emerald-950">
                      Official Certificate Issued ({dossier.generatedDocument.documentRef})
                    </h4>
                    <p className="text-xs text-emerald-800">
                      Digitally recorded in SocietyFlow & Cloudflare R2
                    </p>
                  </div>
                </div>

                {dossier.generatedDocument.viewUrl && (
                  <a
                    href={dossier.generatedDocument.viewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <AppButton variant="primary" size="sm">
                      <IonIcon name="eye-outline" className="mr-1.5" />
                      View Certificate
                    </AppButton>
                  </a>
                )}
              </div>

              <div className="text-xs text-emerald-900 flex flex-wrap gap-x-4 gap-y-1">
                <span>
                  <strong>Signatory:</strong> {dossier.generatedDocument.issuedByName} ({dossier.generatedDocument.issuedByRole})
                </span>
                <span>
                  <strong>Issued On:</strong>{" "}
                  {dossier.generatedDocument.issuedAt
                    ? new Date(dossier.generatedDocument.issuedAt).toLocaleDateString()
                    : "Today"}
                </span>
                <span>
                  <strong>Public QR Verify:</strong>{" "}
                  <Link
                    href={`/verify/${dossier.generatedDocument.verificationToken || dossier.generatedDocument.documentRef}`}
                    className="underline font-bold text-emerald-900"
                    target="_blank"
                  >
                    Validate Record
                  </Link>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Workflow Stepper, Timeline & Official Action Console */}
        <div className="space-y-6">
          {/* Action Console Box */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <IonIcon name="shield-outline" className="text-indigo-600" />
              Official Action Console
            </h3>

            {/* Stage Status Card */}
            {currentStage && (
              <div className="p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-100 text-xs space-y-1">
                <span className="font-semibold text-indigo-900 uppercase tracking-wide block">
                  Stage {currentStage.stageIndex + 1}: {currentStage.stageName}
                </span>
                <p className="text-gray-700">
                  Required Role: <strong>{currentStage.allowedRoles.join(" or ")}</strong>
                </p>
                <p className="text-gray-600">
                  Target SLA: {currentStage.expectedDays} day(s) • Logic: {currentStage.approverLogic}
                </p>
              </div>
            )}

            {/* Permission Check Warnings */}
            {!dossier.permissions.canApproveStage &&
              ["AWAITING_SOCIETY_REVIEW", "UNDER_REVIEW"].includes(dossier.currentStatus) && (
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-600">
                  <IonIcon name="lock-closed-outline" className="text-gray-400 mr-1 align-middle" />
                  {dossier.permissions.ineligibilityReason ||
                    "This stage requires an official with the configured role. You may review the request or record internal notes."}
                </div>
              )}

            {/* Decision Buttons */}
            <div className="space-y-2 pt-1">
              {dossier.permissions.canApproveStage && (
                <AppButton
                  variant="primary"
                  className="w-full justify-center"
                  onClick={() => {
                    setActionComment("");
                    setActiveModal("APPROVE");
                  }}
                >
                  <IonIcon name="checkmark-circle-outline" className="mr-1.5 text-base" />
                  Approve Current Stage
                </AppButton>
              )}

              {dossier.permissions.canIssueCertificate && !dossier.generatedDocument && (
                <AppButton
                  variant="primary"
                  className="w-full justify-center bg-emerald-600 hover:bg-emerald-700 border-emerald-600"
                  onClick={() => {
                    setActionComment("");
                    setActiveModal("ISSUE");
                  }}
                >
                  <IonIcon name="ribbon-outline" className="mr-1.5 text-base" />
                  Generate & Issue Certificate
                </AppButton>
              )}

              {dossier.permissions.canRequestInfo && (
                <AppButton
                  variant="outline"
                  className="w-full justify-center text-amber-700 border-amber-300 hover:bg-amber-50"
                  onClick={() => {
                    setActionComment("");
                    setActiveModal("CORRECTION");
                  }}
                >
                  <IonIcon name="alert-circle-outline" className="mr-1.5 text-base" />
                  Request Information / Correction
                </AppButton>
              )}

              {dossier.permissions.canReject && (
                <AppButton
                  variant="outline"
                  className="w-full justify-center text-red-700 border-red-300 hover:bg-red-50"
                  onClick={() => {
                    setActionComment("");
                    setActiveModal("REJECT");
                  }}
                >
                  <IonIcon name="close-circle-outline" className="mr-1.5 text-base" />
                  Reject Request
                </AppButton>
              )}

              <AppButton
                variant="outline"
                className="w-full justify-center"
                onClick={() => {
                  setActionComment("");
                  setIsInternalNote(false);
                  setActiveModal("COMMENT");
                }}
              >
                <IonIcon name="chatbox-outline" className="mr-1.5 text-base" />
                Add Official Note / Comment
              </AppButton>
            </div>
          </div>

          {/* Visual Approval Timeline */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <IonIcon name="git-commit-outline" className="text-indigo-600" />
              Approval Workflow Sequence
            </h3>

            <div className="space-y-4 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
              {stages.map((st, idx) => {
                const isPassed = st.status === "APPROVED";
                const isCurrent = idx === currentStageIdx && !dossier.approvalWorkflow?.isCompleted;
                const isRejected = st.status === "REJECTED";

                return (
                  <div key={st.stageKey} className="relative flex items-start gap-3 pl-1">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold z-10 ${
                        isPassed
                          ? "bg-emerald-500 text-white"
                          : isRejected
                          ? "bg-red-500 text-white"
                          : isCurrent
                          ? "bg-indigo-600 text-white ring-4 ring-indigo-100"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {isPassed ? "✓" : isRejected ? "✕" : idx + 1}
                    </div>

                    <div className="flex-1 text-xs space-y-0.5">
                      <div className="flex items-center justify-between">
                        <strong className="text-gray-900">{st.stageName}</strong>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            isPassed
                              ? "bg-emerald-100 text-emerald-800"
                              : isRejected
                              ? "bg-red-100 text-red-800"
                              : isCurrent
                              ? "bg-indigo-100 text-indigo-800"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {st.status}
                        </span>
                      </div>
                      <p className="text-gray-500 text-[11px]">
                        Authorized: {st.allowedRoles.join(", ")}
                      </p>

                      {st.approvalsReceived && st.approvalsReceived.length > 0 && (
                        <div className="pt-1 space-y-1">
                          {st.approvalsReceived.map((appr, aIdx) => (
                            <div key={aIdx} className="bg-gray-50 p-2 rounded-lg border border-gray-100 text-[11px]">
                              <span className="font-semibold text-gray-900">{appr.actorName}</span> (
                              {appr.actorRole})
                              {appr.delegatedBy && (
                                <span className="text-amber-700 block font-medium">
                                  via delegation from {appr.delegatedBy}
                                </span>
                              )}
                              {appr.comment && <p className="text-gray-600 italic mt-0.5">&ldquo;{appr.comment}&rdquo;</p>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Audit & Decision Log */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <IonIcon name="receipt-outline" className="text-indigo-600" />
              Activity History
            </h3>

            <div className="space-y-2 max-h-72 overflow-y-auto text-xs pr-1">
              {dossier.timeline.map((event, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 space-y-0.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <strong className="text-gray-900">{event.action}</strong>
                    <span className="text-gray-400">
                      {new Date(event.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <p className="text-gray-600">
                    {event.actorName} ({event.actorRole})
                    {event.delegatedBy ? ` [Delegated: ${event.delegatedBy}]` : ""}
                  </p>
                  {event.comment && <p className="text-gray-700 italic pt-0.5">&ldquo;{event.comment}&rdquo;</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ACTION MODAL DIALOG */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900">
                {activeModal === "APPROVE"
                  ? `Approve Stage: ${currentStage?.stageName}`
                  : activeModal === "REJECT"
                  ? "Reject Service Request"
                  : activeModal === "CORRECTION"
                  ? "Request Information / Documents"
                  : activeModal === "ISSUE"
                  ? "Generate & Issue Official Certificate"
                  : "Add Official Note"}
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <IonIcon name="close-outline" className="text-2xl" />
              </button>
            </div>

            {actionSuccessMsg && (
              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-semibold">
                {actionSuccessMsg}
              </div>
            )}

            {actionErrorMsg && (
              <div className="p-3 bg-red-50 text-red-800 rounded-xl text-xs font-semibold">
                {actionErrorMsg}
              </div>
            )}

            {activeModal === "ISSUE" ? (
              <div className="space-y-2 text-xs text-gray-600">
                <p>
                  Generating an official society certificate with registered letterhead, applicant details, signatory credentials, and an embedded verification QR code.
                </p>
                <div className="p-3 bg-amber-50 text-amber-900 rounded-xl text-[11px] border border-amber-200 font-medium">
                  DEMONSTRATION PROTOTYPE: SocietyFlow electronic certificate. Not a statutory digital signature under the Information Technology Act.
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-700 block">
                  {activeModal === "REJECT"
                    ? "Mandatory Rejection Reason:"
                    : activeModal === "CORRECTION"
                    ? "Explanation of Missing Information / Corrections Required:"
                    : "Decision Comment / Endorsement Note (Optional):"}
                </label>
                <textarea
                  rows={3}
                  value={actionComment}
                  onChange={(e) => setActionComment(e.target.value)}
                  placeholder="Enter detailed reason or notes..."
                  className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600 text-gray-900"
                />

                {activeModal === "COMMENT" && (
                  <label className="flex items-center gap-2 text-xs text-gray-700 pt-1">
                    <input
                      type="checkbox"
                      checked={isInternalNote}
                      onChange={(e) => setIsInternalNote(e.target.checked)}
                      className="rounded text-indigo-600"
                    />
                    <span>Mark as Internal Committee Note (hidden from applicant)</span>
                  </label>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <AppButton
                variant="outline"
                size="sm"
                onClick={() => setActiveModal(null)}
                disabled={actionProcessing}
              >
                Cancel
              </AppButton>

              <AppButton
                variant={
                  activeModal === "REJECT"
                    ? "primary"
                    : activeModal === "CORRECTION"
                    ? "outline"
                    : "primary"
                }
                className={
                  activeModal === "REJECT"
                    ? "bg-red-600 hover:bg-red-700 border-red-600 text-white"
                    : activeModal === "ISSUE"
                    ? "bg-emerald-600 hover:bg-emerald-700 border-emerald-600 text-white"
                    : ""
                }
                size="sm"
                onClick={() => {
                  if (activeModal === "APPROVE") handleExecuteAction("APPROVE_STAGE");
                  else if (activeModal === "REJECT") handleExecuteAction("REJECT");
                  else if (activeModal === "CORRECTION") handleExecuteAction("REQUEST_CORRECTION");
                  else if (activeModal === "ISSUE") handleExecuteAction("ISSUE_DOCUMENT");
                  else if (activeModal === "COMMENT") handleExecuteAction("ADD_COMMENT");
                }}
                disabled={
                  actionProcessing ||
                  (activeModal === "REJECT" && !actionComment.trim()) ||
                  (activeModal === "CORRECTION" && !actionComment.trim())
                }
              >
                {actionProcessing ? "Processing..." : "Confirm & Record"}
              </AppButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RequestReviewPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8F9FA] p-8 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-sm font-medium">Loading Approval Dossier...</p>
          </div>
        </div>
      }
    >
      <AppShell>
        <RequestReviewContent />
      </AppShell>
    </Suspense>
  );
}
