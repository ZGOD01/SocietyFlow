"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  AppCard,
  AppButton,
  StatusBadge,
  IonIcon,
  Modal,
} from "@/components/ui";

interface UploadedDocMeta {
  id: string;
  documentId: string;
  onboardingDocType: string;
  displayName: string;
  originalFilename: string;
  size: number;
  mimeType: string;
  version: number;
  verificationStatus: string;
  correctionNote?: string;
  createdAt: string;
  viewUrl?: string;
  downloadUrl?: string;
}

interface OnboardingCardConfig {
  type: "SHARE_CERTIFICATE" | "SALE_DEED" | "POSSESSION_LETTER";
  title: string;
  statutoryCode: string;
  description: string;
  acceptedFormats: string;
}

const CARDS_CONFIG: OnboardingCardConfig[] = [
  {
    type: "SHARE_CERTIFICATE",
    title: "Society Share Certificate",
    statutoryCode: "MCS Act 1960 — Form I & II",
    description: "Statutory ten-share allotment certificate issued under the common seal of the society.",
    acceptedFormats: ".pdf, .jpg, .png (Max 10MB)",
  },
  {
    type: "SALE_DEED",
    title: "Registered Deed of Conveyance / Sale Deed",
    statutoryCode: "Registration Act 1908 — Index II",
    description: "Certified sub-registrar stamped deed confirming lawful title of the residential unit.",
    acceptedFormats: ".pdf (Max 10MB)",
  },
  {
    type: "POSSESSION_LETTER",
    title: "Possession Handover Letter",
    statutoryCode: "MOFA / RERA Compliance",
    description: "Physical handover letter issued by the builder / developer or previous lawful owner.",
    acceptedFormats: ".pdf, .jpg, .png (Max 10MB)",
  },
];

export default function OwnerDocumentsOnboardingPage() {
  const router = useRouter();
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, UploadedDocMeta>>({});
  const [loading, setLoading] = useState(true);
  const [r2Configured, setR2Configured] = useState<boolean>(true);
  const [uploadingType, setUploadingType] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [declarationChecked, setDeclarationChecked] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Preview Modal
  const [previewDoc, setPreviewDoc] = useState<UploadedDocMeta | null>(null);

  // Hidden file inputs
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const loadDocuments = useCallback(async () => {
    try {
      const res = await fetch("/api/documents/onboarding");
      const data = await res.json();
      if (res.ok && data.documents) {
        const docMap: Record<string, UploadedDocMeta> = {};
        for (const doc of data.documents) {
          docMap[doc.onboardingDocType] = doc;
        }
        setUploadedDocs(docMap);
        setR2Configured(data.r2Configured);
      }
    } catch {
      setServerError("Could not sync with document vault. Please check your network.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    const init = async () => {
      try {
        const res = await fetch("/api/documents/onboarding");
        const data = await res.json();
        if (!ignore && res.ok && data.documents) {
          const docMap: Record<string, UploadedDocMeta> = {};
          for (const doc of data.documents) {
            docMap[doc.onboardingDocType] = doc;
          }
          setUploadedDocs(docMap);
          setR2Configured(data.r2Configured);
        }
      } catch {
        if (!ignore) {
          setServerError("Could not sync with document vault. Please check your network.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };
    init();
    return () => {
      ignore = true;
    };
  }, []);

  const handleFileSelected = async (
    type: "SHARE_CERTIFICATE" | "SALE_DEED" | "POSSESSION_LETTER",
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setServerError(`File "${file.name}" exceeds the 10 MB limit.`);
      return;
    }

    setServerError(null);
    setSuccessMsg(null);
    setUploadingType(type);
    setUploadProgress(25);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("onboardingDocType", type);

      setUploadProgress(65);
      const res = await fetch("/api/documents/onboarding", {
        method: "POST",
        body: formData,
      });

      setUploadProgress(90);
      const result = await res.json();

      if (!res.ok) {
        setServerError(result.error || "Failed to upload document to vault.");
        setUploadingType(null);
        return;
      }

      setUploadProgress(100);
      setSuccessMsg(`"${file.name}" uploaded successfully.`);
      await loadDocuments();
    } catch {
      setServerError("Network error during file upload. Please retry.");
    } finally {
      setUploadingType(null);
      setUploadProgress(0);
      // Reset input value
      if (fileInputRefs.current[type]) {
        fileInputRefs.current[type]!.value = "";
      }
    }
  };

  const allUploaded = CARDS_CONFIG.every((card) => uploadedDocs[card.type]);

  const handleFinalizeOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allUploaded) {
      setServerError("Please upload all 3 mandatory statutory documents before proceeding.");
      return;
    }
    if (!declarationChecked) {
      setServerError("Please confirm the statutory truthfulness declaration.");
      return;
    }

    setIsSubmitting(true);
    setServerError(null);

    try {
      const res = await fetch("/api/onboarding/complete-documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      if (!res.ok) {
        setServerError(data.error || "Failed to finalize document onboarding checklist.");
        setIsSubmitting(false);
        return;
      }

      window.location.href = data.redirectUrl || "/dashboard";
    } catch {
      setServerError("Network error while submitting document checklist. Please retry.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] flex flex-col justify-between p-4 sm:p-6 lg:p-10">
      {/* Top Header */}
      <header className="w-full max-w-4xl mx-auto flex items-center justify-between pb-6 border-b border-[#E5E7EB]">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#4F46E5] text-white flex items-center justify-center font-bold text-base font-heading">
            S
          </div>
          <span className="font-heading font-black text-lg tracking-[0.18em] text-[#1A1A1A] uppercase">
            SOCIETY<span className="text-[#4F46E5]">FLOW</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <StatusBadge variant="success" size="sm" dot>
            Registration Approved
          </StatusBadge>
          <span className="text-xs text-[#6B7280]">Step 2 of 2: Document Vault</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="w-full max-w-3xl mx-auto my-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-white border border-[#E5E7EB] shadow-[0_4px_24px_-2px_rgba(0,0,0,0.06)] overflow-hidden p-6 sm:p-9 space-y-6"
        >
          {/* Header Banner */}
          <div className="flex items-start gap-4 pb-4 border-b border-[#F1F3F5]">
            <div className="w-12 h-12 rounded-xl bg-[#EEF2FF] text-[#4F46E5] border border-[#C7D2FE] flex items-center justify-center shrink-0">
              <IonIcon name="document-text-outline" size={24} />
            </div>
            <div className="space-y-1">
              <h1 className="text-xl sm:text-2xl font-black font-heading text-[#1A1A1A] tracking-tight">
                Mandatory Owner Document Onboarding
              </h1>
              <p className="text-xs sm:text-sm text-[#6B7280] leading-relaxed">
                Your society registration has been approved. As required by the Maharashtra Co-operative Societies Act 1960, please upload your mandatory property records to activate full Owner Dashboard access.
              </p>
            </div>
          </div>

          {/* R2 Configuration Advisory (Visible only if credentials not configured in environment) */}
          {!r2Configured && (
            <div className="p-3.5 rounded-xl border border-[#FDE68A] bg-[#FFFBEB] text-xs text-[#92400E] flex items-start gap-2.5">
              <IonIcon name="information-circle" size={18} className="text-[#F59E0B] shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold block text-[#92400E]">Local Storage Mode Active</span>
                <p className="text-[11px] text-[#B45309] leading-relaxed">
                  Cloudflare R2 credentials (<code>R2_ACCOUNT_ID</code>, <code>R2_ACCESS_KEY_ID</code>, <code>R2_SECRET_ACCESS_KEY</code>, <code>R2_BUCKET_NAME</code>) are not configured. Uploads are operating in local dev storage mode. Configure these in <code>.env.local</code> for private cloud persistence.
                </p>
              </div>
            </div>
          )}

          {serverError && (
            <div className="p-3.5 rounded-xl bg-[#FFF1F2] border border-[#FECDD3] text-xs text-[#BE123C] flex items-center gap-2">
              <IonIcon name="alert-circle-outline" size={18} className="shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] text-xs text-[#065F46] flex items-center gap-2">
              <IonIcon name="checkmark-circle-outline" size={18} className="shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Document Checklist Items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280] block">
                Required Property Documents (3 Mandatory Records):
              </span>
              <span className="text-xs font-bold text-[#4F46E5]">
                {Object.keys(uploadedDocs).length} of {CARDS_CONFIG.length} Uploaded
              </span>
            </div>

            {loading ? (
              <div className="py-8 text-center text-xs text-[#9CA3AF]">
                Loading document vault status...
              </div>
            ) : (
              CARDS_CONFIG.map((card) => {
                const uploaded = uploadedDocs[card.type];
                const isUploading = uploadingType === card.type;

                return (
                  <AppCard
                    key={card.type}
                    className={`p-4 sm:p-5 transition-all border ${
                      uploaded
                        ? "border-[#A7F3D0] bg-[#F0FDF4]/40"
                        : "border-[#E5E7EB] bg-white hover:border-[#C7D2FE]"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-[#1A1A1A]">
                            {card.title}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EEF2FF] text-[#4F46E5]">
                            {card.statutoryCode}
                          </span>
                          {uploaded ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#ECFDF5] text-[#10B981] border border-[#A7F3D0]">
                              Uploaded (v{uploaded.version})
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FFF1F2] text-[#F43F5E] border border-[#FECDD3]">
                              Mandatory
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-[#6B7280] leading-relaxed">
                          {card.description}
                        </p>

                        {uploaded && (
                          <div className="pt-1 flex items-center gap-3 text-[11px] text-[#4B5563]">
                            <span className="font-mono text-[#1A1A1A]">
                              {uploaded.displayName}
                            </span>
                            <span>•</span>
                            <span>{(uploaded.size / (1024 * 1024)).toFixed(2)} MB</span>
                            <span>•</span>
                            <span>{new Date(uploaded.createdAt).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        {/* Hidden Input */}
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          ref={(el) => {
                            fileInputRefs.current[card.type] = el;
                          }}
                          className="hidden"
                          onChange={(e) => handleFileSelected(card.type, e)}
                        />

                        {uploaded ? (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <AppButton
                              type="button"
                              variant="outline"
                              size="sm"
                              leftIcon="eye-outline"
                              onClick={() => setPreviewDoc(uploaded)}
                            >
                              View
                            </AppButton>

                            {uploaded.downloadUrl && (
                              <a
                                href={uploaded.downloadUrl}
                                download={uploaded.displayName}
                                className="inline-block"
                              >
                                <AppButton
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  leftIcon="download-outline"
                                >
                                  Download
                                </AppButton>
                              </a>
                            )}

                            <AppButton
                              type="button"
                              variant="ghost"
                              size="sm"
                              leftIcon="repeat-outline"
                              disabled={isUploading}
                              onClick={() => fileInputRefs.current[card.type]?.click()}
                            >
                              Replace
                            </AppButton>
                          </div>
                        ) : (
                          <AppButton
                            type="button"
                            variant="primary"
                            size="sm"
                            leftIcon="cloud-upload-outline"
                            disabled={isUploading}
                            onClick={() => fileInputRefs.current[card.type]?.click()}
                          >
                            {isUploading ? `Uploading ${uploadProgress}%` : "Choose File"}
                          </AppButton>
                        )}
                      </div>
                    </div>

                    {/* Upload progress bar */}
                    {isUploading && (
                      <div className="mt-3 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-[#4F46E5] h-1.5 transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    )}
                  </AppCard>
                );
              })
            )}
          </div>

          {/* Statutory Truthfulness Declaration */}
          <div className="pt-4 border-t border-[#F1F3F5]">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={declarationChecked}
                onChange={(e) => setDeclarationChecked(e.target.checked)}
                className="mt-0.5 rounded border-[#D1D5DB] text-[#4F46E5] focus:ring-[#4F46E5] cursor-pointer"
              />
              <span className="text-xs text-[#4B5563] leading-relaxed select-none">
                I hereby declare that all ownership documents uploaded under this checklist are genuine, lawful, and indexed under sub-registrar records.
              </span>
            </label>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-[#E5E7EB] flex flex-col sm:flex-row items-center justify-between gap-3">
            <Link href="/dashboard">
              <AppButton variant="ghost" size="sm" leftIcon="arrow-back-outline">
                Return to Console
              </AppButton>
            </Link>

            <AppButton
              type="button"
              variant="hero"
              size="md"
              disabled={!allUploaded || !declarationChecked || isSubmitting}
              onClick={handleFinalizeOnboarding}
              rightIcon="arrow-forward-outline"
            >
              {isSubmitting ? "Activating Dashboard..." : "Confirm & Enter Owner Dashboard"}
            </AppButton>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-4xl mx-auto text-center text-xs text-[#9CA3AF] pt-6">
        <span>© 2026 SocietyFlow • Encrypted Cloudflare R2 Document Vault</span>
      </footer>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewDoc && (
          <Modal
            isOpen={Boolean(previewDoc)}
            onClose={() => setPreviewDoc(null)}
            title={previewDoc.displayName}
            description={`Version ${previewDoc.version} • ${(previewDoc.size / (1024 * 1024)).toFixed(2)} MB`}
            maxWidth="lg"
          >
            <div className="space-y-4">
              <div className="w-full h-[460px] bg-slate-50 border border-slate-200 rounded-xl overflow-hidden flex items-center justify-center">
                {previewDoc.mimeType.includes("pdf") ? (
                  <iframe
                    src={previewDoc.viewUrl}
                    className="w-full h-full border-none"
                    title={previewDoc.displayName}
                  />
                ) : previewDoc.mimeType.includes("image") ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={previewDoc.viewUrl}
                    alt={previewDoc.displayName}
                    className="max-h-full max-w-full object-contain p-2"
                  />
                ) : (
                  <div className="text-center p-6 space-y-2">
                    <IonIcon name="document-outline" size={48} className="text-slate-400 mx-auto" />
                    <p className="text-xs text-slate-600">
                      Inline preview not available for {previewDoc.mimeType}.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                {previewDoc.downloadUrl && (
                  <a href={previewDoc.downloadUrl} download={previewDoc.displayName}>
                    <AppButton variant="primary" size="sm" leftIcon="download-outline">
                      Download File
                    </AppButton>
                  </a>
                )}
                <AppButton variant="outline" size="sm" onClick={() => setPreviewDoc(null)}>
                  Close
                </AppButton>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}
