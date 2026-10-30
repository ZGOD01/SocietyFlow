"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import {
  AppCard,
  AppButton,
  IconContainer,
  IonIcon,
  FormField,
  Modal,
  EmptyState,
} from "@/components/ui";

interface FormFieldItem {
  id: string;
  label: string;
  type: "text" | "number" | "date" | "select" | "checkbox" | "textarea";
  required: boolean;
  options?: string[];
  placeholder?: string;
  helpText?: string;
}

interface DocChecklistItem {
  code: string;
  title: string;
  description: string;
  required: boolean;
}

interface ServiceData {
  id: string;
  code: string;
  title: string;
  description: string;
  category: string;
  eligibility: string;
  requiresOwnerAuthorization: boolean;
  estimatedProcessingDays: number;
  isDownstreamAvailable: boolean;
  downstreamNote?: string;
  requiredFields: FormFieldItem[];
  requiredDocuments: DocChecklistItem[];
  version: number;
}

interface AuthorizedFlat {
  id: string;
  flatNumber: string;
  floor: number;
  bhkType?: string;
  role: "OWNER" | "TENANT";
}

interface AttachedDoc {
  documentId: string;
  displayName: string;
  originalFilename: string;
  category: string;
  size: number;
  mimeType: string;
  r2ObjectKey?: string;
  isRequired: boolean;
}

function NewRequestFormContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const serviceId = params?.serviceId as string;
  const draftIdParam = searchParams.get("draftId");

  const [loading, setLoading] = useState(true);
  const [service, setService] = useState<ServiceData | null>(null);
  const [society, setSociety] = useState<{ id: string; name: string; code: string } | null>(null);
  const [applicant, setApplicant] = useState<{ id: string; name: string; email: string; phone?: string } | null>(null);
  const [flats, setFlats] = useState<AuthorizedFlat[]>([]);
  const [selectedFlatId, setSelectedFlatId] = useState("");

  // Stepper state
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;

  // Dynamic form values
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [alternatePhone, setAlternatePhone] = useState("");

  // Attachments
  const [attachments, setAttachments] = useState<AttachedDoc[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadTargetCategory, setUploadTargetCategory] = useState("");
  const [uploadTargetTitle, setUploadTargetTitle] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  // Vault picker modal
  const [vaultModalOpen, setVaultModalOpen] = useState(false);
  const [vaultDocs, setVaultDocs] = useState<Array<{
    documentId: string;
    displayName: string;
    category: string;
    size: number;
    mimeType: string;
    r2ObjectKey: string;
  }>>([]);
  const [loadingVault, setLoadingVault] = useState(false);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [confirmedDeclaration, setConfirmedDeclaration] = useState(false);

  useEffect(() => {
    let ignore = false;
    async function fetchInitialData() {
      try {
        setLoading(true);
        const res = await fetch(`/api/services/${serviceId}`);
        const json = await res.json();
        if (!ignore) {
          if (res.ok) {
            setService(json.service);
            setSociety(json.society);
            setApplicant(json.applicant);
            setFlats(json.authorizedFlats);
            if (json.authorizedFlats.length > 0) {
              setSelectedFlatId(json.authorizedFlats[0].id);
            }

            // If resuming a draft, load the draft record
            if (draftIdParam) {
              const draftRes = await fetch(`/api/requests/${draftIdParam}`);
              const draftJson = await draftRes.json();
              if (draftRes.ok && draftJson.request) {
                setFormData(draftJson.request.formData || {});
                setAttachments(draftJson.request.attachments || []);
                if (draftJson.request.flatId) {
                  setSelectedFlatId(
                    draftJson.request.flatId._id?.toString() ||
                    draftJson.request.flatId.toString()
                  );
                }
              }
            }
          } else {
            setFeedback({ type: "error", text: json.error || "Failed to load service template" });
          }
        }
      } catch {
        if (!ignore) {
          setFeedback({ type: "error", text: "Network error loading request form" });
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }
    fetchInitialData();
    return () => {
      ignore = true;
    };
  }, [serviceId, draftIdParam]);

  const selectedFlat = flats.find((f) => f.id === selectedFlatId) || flats[0];
  const applicantRole = selectedFlat?.role || "OWNER";
  const willRequireOwnerAuth =
    applicantRole === "TENANT" && service?.requiresOwnerAuthorization === true;

  // Handle Form field change
  const handleFieldChange = (fieldId: string, val: unknown) => {
    setFormData((prev) => ({ ...prev, [fieldId]: val }));
  };

  // Step 3 validation
  const validateStep3 = () => {
    if (!service?.requiredFields) return true;
    for (const f of service.requiredFields) {
      if (f.required) {
        const val = formData[f.id];
        if (val === undefined || val === null || val === "" || (f.type === "checkbox" && val !== true)) {
          setFeedback({ type: "error", text: `Please fill in required field: ${f.label}` });
          return false;
        }
      }
    }
    setFeedback(null);
    return true;
  };

  // Step 4 validation (documents)
  const validateStep4 = () => {
    if (!service?.requiredDocuments) return true;
    for (const reqDoc of service.requiredDocuments) {
      if (reqDoc.required) {
        const hasAttached = attachments.some(
          (att) =>
            att.category === reqDoc.code ||
            att.displayName.toLowerCase().includes(reqDoc.title.toLowerCase())
        );
        if (!hasAttached) {
          setFeedback({
            type: "error",
            text: `Mandatory document '${reqDoc.title}' must be attached before proceeding.`,
          });
          return false;
        }
      }
    }
    setFeedback(null);
    return true;
  };

  // Step Navigation
  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!selectedFlatId) {
        setFeedback({ type: "error", text: "Please select an applicable flat." });
        return;
      }
      setFeedback(null);
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setFeedback(null);
      setCurrentStep(3);
    } else if (currentStep === 3) {
      if (validateStep3()) setCurrentStep(4);
    } else if (currentStep === 4) {
      if (validateStep4()) setCurrentStep(5);
    }
  };

  // Save as Draft
  const handleSaveDraft = async () => {
    if (!service || !selectedFlatId) return;
    try {
      setIsSavingDraft(true);
      setFeedback(null);

      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draftId: draftIdParam || undefined,
          serviceId: service.id,
          flatId: selectedFlatId,
          formData,
          attachments,
          isDraft: true,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to save draft");

      setFeedback({
        type: "success",
        text: "Application draft saved to MongoDB. You can resume anytime from My Requests.",
      });
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "Error saving draft",
      });
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Final Submit Application
  const handleSubmitApplication = async () => {
    if (!service || !selectedFlatId) return;
    if (!confirmedDeclaration) {
      setFeedback({
        type: "error",
        text: "Please confirm that the submitted information and attached documents are accurate.",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      setFeedback(null);

      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draftId: draftIdParam || undefined,
          serviceId: service.id,
          flatId: selectedFlatId,
          formData: {
            ...formData,
            alternatePhone: alternatePhone || undefined,
          },
          attachments,
          isDraft: false,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Submission failed");

      setFeedback({
        type: "success",
        text: json.message || `Request ${json.requestId} submitted successfully.`,
      });

      // Redirect to detailed request tracking page
      setTimeout(() => {
        router.push(`/requests/${json.requestId}`);
      }, 1500);
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "Error submitting application",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Upload file directly to Cloudflare R2
  const handleUploadFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;

    try {
      setIsUploading(true);
      setFeedback(null);

      const fd = new FormData();
      fd.append("file", uploadFile);
      fd.append("displayName", uploadTargetTitle || uploadFile.name);
      fd.append("category", uploadTargetCategory || "REQUEST_ATTACHMENT");
      if (selectedFlatId) fd.append("flatId", selectedFlatId);

      const res = await fetch("/api/requests/attachments", {
        method: "POST",
        body: fd,
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Upload failed");

      setAttachments((prev) => [...prev, json.attachment]);
      setUploadModalOpen(false);
      setUploadFile(null);
      setUploadTargetCategory("");
      setUploadTargetTitle("");
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "Error uploading document",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Open Vault picker modal
  const handleOpenVaultPicker = async (categoryCode: string, title: string) => {
    try {
      setUploadTargetCategory(categoryCode);
      setUploadTargetTitle(title);
      setVaultModalOpen(true);
      setLoadingVault(true);

      const res = await fetch("/api/documents?scope=ALL");
      const json = await res.json();
      if (res.ok && json.documents) {
        setVaultDocs(json.documents);
      }
    } catch {
      // ignore
    } finally {
      setLoadingVault(false);
    }
  };

  const handleAttachFromVault = (doc: {
    documentId: string;
    displayName: string;
    originalFilename?: string;
    category?: string;
    size?: number;
    mimeType?: string;
    r2ObjectKey?: string;
  }) => {
    const already = attachments.some((a) => a.documentId === doc.documentId);
    if (!already) {
      setAttachments((prev) => [
        ...prev,
        {
          documentId: doc.documentId,
          displayName: doc.displayName,
          originalFilename: doc.originalFilename || doc.displayName,
          category: uploadTargetCategory || doc.category || "VAULT_ATTACHMENT",
          size: doc.size || 0,
          mimeType: doc.mimeType || "application/pdf",
          r2ObjectKey: doc.r2ObjectKey,
          isRequired: false,
        },
      ]);
    }
    setVaultModalOpen(false);
  };

  const handleRemoveAttachment = (docId: string) => {
    setAttachments((prev) => prev.filter((a) => a.documentId !== docId));
  };

  if (loading) {
    return (
      <AppShell>
        <div className="p-12 text-center text-xs font-semibold text-[#6B7280]">
          Loading dynamic service request form...
        </div>
      </AppShell>
    );
  }

  if (!service) {
    return (
      <AppShell>
        <EmptyState
          title="Service Unavailable"
          description="The requested service template could not be loaded."
          iconName="alert-circle-outline"
          action={
            <Link href="/services">
              <AppButton variant="primary" size="sm">
                Back to Catalogue
              </AppButton>
            </Link>
          }
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-semibold text-[#6B7280]">
          <Link href="/services" className="hover:text-[#4F46E5] flex items-center gap-1">
            <IonIcon name="arrow-back-outline" size={14} />
            <span>Service Catalogue</span>
          </Link>
          <span className="text-[#9CA3AF]">/</span>
          <span className="text-[#1A1A1A] font-bold">{service.title}</span>
        </div>

        {/* Wizard Progress Bar */}
        <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-2xs space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-[#1A1A1A]">
              Step {currentStep} of {totalSteps}:{" "}
              {currentStep === 1 && "Service & Unit"}
              {currentStep === 2 && "Applicant Details"}
              {currentStep === 3 && "Service Information"}
              {currentStep === 4 && "Document Checklist"}
              {currentStep === 5 && "Review & Submit"}
            </span>
            <div className="flex items-center gap-2">
              <AppButton
                variant="ghost"
                size="sm"
                onClick={handleSaveDraft}
                disabled={isSavingDraft}
                leftIcon="save-outline"
              >
                {isSavingDraft ? "Saving..." : "Save Draft"}
              </AppButton>
            </div>
          </div>

          {/* Stepper Dots & Line */}
          <div className="grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5].map((step) => {
              const isPast = currentStep > step;
              const isCurrent = currentStep === step;
              return (
                <div key={step} className="space-y-1">
                  <div
                    className={`h-1.5 rounded-full transition-all ${
                      isPast
                        ? "bg-[#10B981]"
                        : isCurrent
                        ? "bg-[#4F46E5]"
                        : "bg-[#E5E7EB]"
                    }`}
                  />
                  <div className="text-[10px] text-center font-bold text-[#6B7280] hidden sm:block">
                    {step === 1 && "Unit"}
                    {step === 2 && "Applicant"}
                    {step === 3 && "Details"}
                    {step === 4 && "Docs"}
                    {step === 5 && "Submit"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between ${
              feedback.type === "success"
                ? "bg-[#ECFDF5] border border-[#10B981] text-[#065F46]"
                : "bg-[#FFF1F2] border border-[#F43F5E] text-[#9F1239]"
            }`}
          >
            <div className="flex items-center gap-2">
              <IonIcon
                name={
                  feedback.type === "success"
                    ? "checkmark-circle-outline"
                    : "alert-circle-outline"
                }
                size={16}
              />
              <span>{feedback.text}</span>
            </div>
            <button
              onClick={() => setFeedback(null)}
              className="text-xs font-bold hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* STEP 1: SERVICE & APPLICABLE FLAT */}
        {currentStep === 1 && (
          <AppCard className="p-6 bg-white space-y-6 shadow-2xs">
            <div className="space-y-1 border-b border-[#E5E7EB] pb-4">
              <span className="text-[11px] font-bold text-[#4F46E5] uppercase tracking-wider">
                Step 1 of 5
              </span>
              <h2 className="font-heading font-bold text-lg text-[#1A1A1A]">
                Service Details & Unit Selection
              </h2>
              <p className="text-xs text-[#6B7280]">
                Confirm the society unit this application is submitted for.
              </p>
            </div>

            <div className="p-4 bg-[#F8F9FA] rounded-xl border border-[#E5E7EB] space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#1A1A1A] text-sm">{service.title}</span>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#EEF2FF] text-[#4F46E5]">
                  {service.category.replace(/_/g, " ")}
                </span>
              </div>
              <p className="text-[#6B7280] leading-relaxed">{service.description}</p>
            </div>

            <div className="space-y-4">
              <FormField label="Applicable Housing Society" id="soc-name">
                <input
                  type="text"
                  disabled
                  value={society?.name || "Society"}
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] bg-[#F3F4F6] text-xs font-semibold text-[#1A1A1A]"
                />
              </FormField>

              <FormField label="Select Applicable Flat / Unit" id="flat-select" required>
                <select
                  value={selectedFlatId}
                  onChange={(e) => setSelectedFlatId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] bg-white text-xs font-bold text-[#1A1A1A]"
                >
                  {flats.map((f) => (
                    <option key={f.id} value={f.id}>
                      Flat {f.flatNumber} (Floor {f.floor}) — Role: {f.role}
                    </option>
                  ))}
                </select>
              </FormField>

              {/* Routing Notice */}
              <div
                className={`p-3.5 rounded-xl border text-xs font-medium leading-relaxed ${
                  willRequireOwnerAuth
                    ? "bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]"
                    : "bg-[#F0FDF4] border-[#BBF7D0] text-[#166534]"
                }`}
              >
                {willRequireOwnerAuth ? (
                  <div className="flex items-start gap-2">
                    <IonIcon name="key-outline" size={16} className="mt-0.5 shrink-0" />
                    <div>
                      <span className="font-bold">Owner Authorization Required: </span>
                      Because you are applying as a Tenant, this request will first be routed to
                      the verified flat owner for formal authorization before entering the
                      Society Management review queue.
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2">
                    <IonIcon
                      name="shield-checkmark-outline"
                      size={16}
                      className="mt-0.5 shrink-0"
                    />
                    <div>
                      <span className="font-bold">Direct Society Review: </span>
                      This application will be routed directly to the Society Managing Committee
                      upon submission.
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-[#E5E7EB] flex justify-end">
              <AppButton variant="primary" size="sm" onClick={handleNextStep} rightIcon="arrow-forward-outline">
                Next: Applicant Details
              </AppButton>
            </div>
          </AppCard>
        )}

        {/* STEP 2: APPLICANT INFORMATION */}
        {currentStep === 2 && (
          <AppCard className="p-6 bg-white space-y-6 shadow-2xs">
            <div className="space-y-1 border-b border-[#E5E7EB] pb-4">
              <span className="text-[11px] font-bold text-[#4F46E5] uppercase tracking-wider">
                Step 2 of 5
              </span>
              <h2 className="font-heading font-bold text-lg text-[#1A1A1A]">
                Applicant Information
              </h2>
              <p className="text-xs text-[#6B7280]">
                Verified applicant details auto-populated from official membership records.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Applicant Full Name" id="applicant-name">
                <input
                  type="text"
                  disabled
                  value={applicant?.name || ""}
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] bg-[#F3F4F6] text-xs font-bold text-[#1A1A1A]"
                />
              </FormField>

              <FormField label="Verified Resident Role" id="applicant-role">
                <input
                  type="text"
                  disabled
                  value={`Verified ${applicantRole}`}
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] bg-[#F3F4F6] text-xs font-bold text-[#1A1A1A]"
                />
              </FormField>

              <FormField label="Registered Email Address" id="applicant-email">
                <input
                  type="email"
                  disabled
                  value={applicant?.email || ""}
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] bg-[#F3F4F6] text-xs font-semibold text-[#1A1A1A]"
                />
              </FormField>

              <FormField label="Alternate / Emergency Contact Number" id="alt-phone">
                <input
                  type="tel"
                  placeholder="e.g. +91 98765 43210 (Optional)"
                  value={alternatePhone}
                  onChange={(e) => setAlternatePhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] bg-white text-xs font-semibold text-[#1A1A1A]"
                />
              </FormField>
            </div>

            <div className="pt-4 border-t border-[#E5E7EB] flex items-center justify-between">
              <AppButton variant="ghost" size="sm" onClick={() => setCurrentStep(1)} leftIcon="arrow-back-outline">
                Back
              </AppButton>
              <AppButton variant="primary" size="sm" onClick={handleNextStep} rightIcon="arrow-forward-outline">
                Next: Service Details
              </AppButton>
            </div>
          </AppCard>
        )}

        {/* STEP 3: SERVICE-SPECIFIC INFORMATION */}
        {currentStep === 3 && (
          <AppCard className="p-6 bg-white space-y-6 shadow-2xs">
            <div className="space-y-1 border-b border-[#E5E7EB] pb-4">
              <span className="text-[11px] font-bold text-[#4F46E5] uppercase tracking-wider">
                Step 3 of 5
              </span>
              <h2 className="font-heading font-bold text-lg text-[#1A1A1A]">
                Application Details: {service.title}
              </h2>
              <p className="text-xs text-[#6B7280]">
                Provide the required factual information for this application.
              </p>
            </div>

            {service.requiredFields.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#6B7280] bg-[#F8F9FA] rounded-xl border border-[#E5E7EB]">
                No additional custom fields are required for this service template. Proceed to
                the document attachment step.
              </div>
            ) : (
              <div className="space-y-4">
                {service.requiredFields.map((field) => (
                  <div key={field.id} className="space-y-1">
                    <FormField
                      label={field.label}
                      id={`field-${field.id}`}
                      required={field.required}
                      helperText={field.helpText}
                    >
                      {field.type === "textarea" ? (
                        <textarea
                          rows={3}
                          placeholder={field.placeholder}
                          value={String(formData[field.id] ?? "")}
                          onChange={(e) => handleFieldChange(field.id, e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] bg-white text-xs font-medium text-[#1A1A1A]"
                        />
                      ) : field.type === "select" ? (
                        <select
                          value={String(formData[field.id] ?? "")}
                          onChange={(e) => handleFieldChange(field.id, e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] bg-white text-xs font-semibold text-[#1A1A1A]"
                        >
                          <option value="">-- Please Select --</option>
                          {(field.options || []).map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : field.type === "checkbox" ? (
                        <label className="flex items-center gap-2 cursor-pointer mt-1">
                          <input
                            type="checkbox"
                            checked={formData[field.id] === true}
                            onChange={(e) => handleFieldChange(field.id, e.target.checked)}
                            className="w-4 h-4 text-[#4F46E5] rounded-md border-[#D1D5DB]"
                          />
                          <span className="text-xs font-semibold text-[#1A1A1A]">
                            {field.placeholder || "I confirm and agree to this condition"}
                          </span>
                        </label>
                      ) : (
                        <input
                          type={field.type}
                          placeholder={field.placeholder}
                          value={String(formData[field.id] ?? "")}
                          onChange={(e) =>
                            handleFieldChange(
                              field.id,
                              field.type === "number" ? Number(e.target.value) : e.target.value
                            )
                          }
                          className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] bg-white text-xs font-semibold text-[#1A1A1A]"
                        />
                      )}
                    </FormField>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-4 border-t border-[#E5E7EB] flex items-center justify-between">
              <AppButton variant="ghost" size="sm" onClick={() => setCurrentStep(2)} leftIcon="arrow-back-outline">
                Back
              </AppButton>
              <AppButton variant="primary" size="sm" onClick={handleNextStep} rightIcon="arrow-forward-outline">
                Next: Document Checklist
              </AppButton>
            </div>
          </AppCard>
        )}

        {/* STEP 4: DOCUMENTS CHECKLIST & ATTACHMENTS */}
        {currentStep === 4 && (
          <AppCard className="p-6 bg-white space-y-6 shadow-2xs">
            <div className="space-y-1 border-b border-[#E5E7EB] pb-4">
              <span className="text-[11px] font-bold text-[#4F46E5] uppercase tracking-wider">
                Step 4 of 5
              </span>
              <h2 className="font-heading font-bold text-lg text-[#1A1A1A]">
                Required Document Attachments
              </h2>
              <p className="text-xs text-[#6B7280]">
                Attach verified documents from your personal vault or upload new files to
                Cloudflare R2.
              </p>
            </div>

            {/* Checklist items */}
            {service.requiredDocuments.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider">
                  Checklist Requirements
                </h3>
                <div className="space-y-2">
                  {service.requiredDocuments.map((reqDoc) => {
                    const isAttached = attachments.some(
                      (a) =>
                        a.category === reqDoc.code ||
                        a.displayName.toLowerCase().includes(reqDoc.title.toLowerCase())
                    );

                    return (
                      <div
                        key={reqDoc.code}
                        className={`p-3.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
                          isAttached
                            ? "bg-[#F0FDF4] border-[#BBF7D0]"
                            : "bg-[#F8F9FA] border-[#E5E7EB]"
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#1A1A1A]">{reqDoc.title}</span>
                            {reqDoc.required ? (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[#FFF1F2] text-[#9F1239]">
                                Mandatory
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[#F3F4F6] text-[#6B7280]">
                                Optional
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-[#6B7280]">{reqDoc.description}</p>
                        </div>

                        <div className="flex items-center gap-2">
                          {isAttached ? (
                            <span className="text-[11px] font-bold text-[#166534] flex items-center gap-1">
                              <IonIcon name="checkmark-circle-outline" size={14} /> Attached
                            </span>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <AppButton
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenVaultPicker(reqDoc.code, reqDoc.title)}
                              >
                                From Vault
                              </AppButton>
                              <AppButton
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={() => {
                                  setUploadTargetCategory(reqDoc.code);
                                  setUploadTargetTitle(reqDoc.title);
                                  setUploadModalOpen(true);
                                }}
                              >
                                Upload
                              </AppButton>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Attached Documents List */}
            <div className="space-y-3 pt-3 border-t border-[#E5E7EB]">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider">
                  Attached Files ({attachments.length})
                </h3>
                <AppButton
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setUploadTargetCategory("REQUEST_ATTACHMENT");
                    setUploadTargetTitle("Additional Document");
                    setUploadModalOpen(true);
                  }}
                  leftIcon="cloud-upload-outline"
                >
                  Upload File
                </AppButton>
              </div>

              {attachments.length === 0 ? (
                <div className="p-4 bg-[#F8F9FA] rounded-xl border border-dashed border-[#D1D5DB] text-center text-xs text-[#6B7280]">
                  No files attached yet. Use the buttons above to attach files.
                </div>
              ) : (
                <div className="space-y-2">
                  {attachments.map((att) => (
                    <div
                      key={att.documentId}
                      className="p-3 bg-white rounded-xl border border-[#E5E7EB] flex items-center justify-between text-xs shadow-2xs"
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

                      <button
                        type="button"
                        onClick={() => handleRemoveAttachment(att.documentId)}
                        className="text-[#F43F5E] hover:text-[#9F1239] p-1.5 rounded-lg hover:bg-[#FFF1F2] cursor-pointer"
                        title="Remove attachment"
                      >
                        <IonIcon name="trash-outline" size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-[#E5E7EB] flex items-center justify-between">
              <AppButton variant="ghost" size="sm" onClick={() => setCurrentStep(3)} leftIcon="arrow-back-outline">
                Back
              </AppButton>
              <AppButton variant="primary" size="sm" onClick={handleNextStep} rightIcon="arrow-forward-outline">
                Next: Review & Submit
              </AppButton>
            </div>
          </AppCard>
        )}

        {/* STEP 5: REVIEW & SUBMIT */}
        {currentStep === 5 && (
          <AppCard className="p-6 bg-white space-y-6 shadow-2xs">
            <div className="space-y-1 border-b border-[#E5E7EB] pb-4">
              <span className="text-[11px] font-bold text-[#4F46E5] uppercase tracking-wider">
                Step 5 of 5
              </span>
              <h2 className="font-heading font-bold text-lg text-[#1A1A1A]">
                Review & Confirm Application
              </h2>
              <p className="text-xs text-[#6B7280]">
                Review all entered details and attached documents prior to official submission.
              </p>
            </div>

            {/* Summary Box */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-[#F8F9FA] rounded-xl border border-[#E5E7EB] text-xs">
              <div>
                <span className="text-[#6B7280] font-semibold">Service:</span>
                <p className="font-bold text-[#1A1A1A] mt-0.5">{service.title}</p>
              </div>
              <div>
                <span className="text-[#6B7280] font-semibold">Unit:</span>
                <p className="font-bold text-[#1A1A1A] mt-0.5">Flat {selectedFlat?.flatNumber}</p>
              </div>
              <div>
                <span className="text-[#6B7280] font-semibold">Applicant Role:</span>
                <p className="font-bold text-[#4F46E5] mt-0.5">{applicantRole}</p>
              </div>
              <div>
                <span className="text-[#6B7280] font-semibold">Review Route:</span>
                <p className="font-bold text-[#1A1A1A] mt-0.5">
                  {willRequireOwnerAuth ? "Flat Owner First" : "Direct Society"}
                </p>
              </div>
            </div>

            {/* Form Fields Data Table */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider">
                Submitted Application Data
              </h3>
              <div className="bg-white rounded-xl border border-[#E5E7EB] divide-y divide-[#E5E7EB] text-xs">
                {service.requiredFields.map((f) => (
                  <div key={f.id} className="p-3 flex items-start justify-between gap-4">
                    <span className="text-[#6B7280] font-semibold w-1/3">{f.label}</span>
                    <span className="font-bold text-[#1A1A1A] w-2/3 text-right">
                      {formData[f.id] === true
                        ? "Yes / Confirmed"
                        : formData[f.id] === false
                        ? "No"
                        : String(formData[f.id] ?? "—")}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Attached Documents Table */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider">
                Attached Documents ({attachments.length})
              </h3>
              <div className="bg-white rounded-xl border border-[#E5E7EB] divide-y divide-[#E5E7EB] text-xs">
                {attachments.map((att) => (
                  <div key={att.documentId} className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <IonIcon name="document-attach-outline" size={14} className="text-[#4F46E5]" />
                      <span className="font-bold text-[#1A1A1A]">{att.displayName}</span>
                    </div>
                    <span className="text-[#6B7280]">{(att.size / 1024).toFixed(1)} KB</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Declaration Checkbox */}
            <label className="p-4 bg-[#F8F9FA] rounded-xl border border-[#E5E7EB] flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={confirmedDeclaration}
                onChange={(e) => setConfirmedDeclaration(e.target.checked)}
                className="w-4 h-4 text-[#4F46E5] rounded-md border-[#D1D5DB] mt-0.5"
              />
              <span className="text-xs text-[#1A1A1A] leading-relaxed">
                I hereby declare that all information provided in this application and the attached
                documents are true, authentic, and complete to the best of my knowledge.
              </span>
            </label>

            {/* Final Action Buttons */}
            <div className="pt-4 border-t border-[#E5E7EB] flex items-center justify-between">
              <AppButton variant="ghost" size="sm" onClick={() => setCurrentStep(4)} leftIcon="arrow-back-outline">
                Back
              </AppButton>
              <div className="flex items-center gap-2">
                <AppButton
                  variant="outline"
                  size="sm"
                  onClick={handleSaveDraft}
                  disabled={isSavingDraft || isSubmitting}
                >
                  {isSavingDraft ? "Saving..." : "Save Draft"}
                </AppButton>
                <AppButton
                  variant="primary"
                  size="sm"
                  onClick={handleSubmitApplication}
                  disabled={isSubmitting || !confirmedDeclaration}
                  leftIcon="send-outline"
                >
                  {isSubmitting ? "Submitting..." : "Submit Application"}
                </AppButton>
              </div>
            </div>
          </AppCard>
        )}

        {/* MODAL 1: UPLOAD DIRECTLY TO CLOUDFLARE R2 */}
        <Modal
          isOpen={uploadModalOpen}
          onClose={() => setUploadModalOpen(false)}
          title={`Upload ${uploadTargetTitle || "Document"}`}
        >
          <form onSubmit={handleUploadFile} className="space-y-4 text-xs">
            <p className="text-[#6B7280]">
              Upload an authorized PDF or clear image file (Max 10 MB). The file will be stored
              privately in Cloudflare R2 object storage.
            </p>

            <FormField label="Document Name" id="doc-display-name">
              <input
                type="text"
                value={uploadTargetTitle}
                onChange={(e) => setUploadTargetTitle(e.target.value)}
                placeholder="e.g. Bank Sanction Letter"
                required
                className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] bg-white text-xs font-semibold"
              />
            </FormField>

            <FormField label="Select File (PDF, JPG, PNG)" id="doc-file" required>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                required
                className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] bg-white text-xs"
              />
            </FormField>

            <div className="pt-3 border-t border-[#E5E7EB] flex justify-end gap-2">
              <AppButton type="button" variant="ghost" size="sm" onClick={() => setUploadModalOpen(false)}>
                Cancel
              </AppButton>
              <AppButton type="submit" variant="primary" size="sm" disabled={isUploading || !uploadFile}>
                {isUploading ? "Uploading to R2..." : "Upload & Attach"}
              </AppButton>
            </div>
          </form>
        </Modal>

        {/* MODAL 2: PICK FROM USER'S VAULT */}
        <Modal
          isOpen={vaultModalOpen}
          onClose={() => setVaultModalOpen(false)}
          title="Select Document from Vault"
        >
          <div className="space-y-4 text-xs">
            <p className="text-[#6B7280]">
              Choose from existing documents stored in your private digital document vault.
            </p>

            {loadingVault ? (
              <div className="p-6 text-center text-[#6B7280]">Loading your vault documents...</div>
            ) : vaultDocs.length === 0 ? (
              <div className="p-6 text-center text-[#6B7280] bg-[#F8F9FA] rounded-xl border">
                No documents found in your vault. You can upload a new file instead.
              </div>
            ) : (
              <div className="max-h-64 overflow-y-auto space-y-2">
                {vaultDocs.map((doc) => (
                  <div
                    key={doc.documentId}
                    className="p-3 rounded-xl border border-[#E5E7EB] hover:border-[#4F46E5] bg-white flex items-center justify-between transition-all"
                  >
                    <div>
                      <p className="font-bold text-[#1A1A1A]">{doc.displayName}</p>
                      <p className="text-[11px] text-[#6B7280]">
                        {doc.category} • {(doc.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <AppButton
                      size="sm"
                      variant="outline"
                      onClick={() => handleAttachFromVault(doc)}
                    >
                      Attach
                    </AppButton>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-3 border-t border-[#E5E7EB] flex justify-end">
              <AppButton variant="ghost" size="sm" onClick={() => setVaultModalOpen(false)}>
                Close
              </AppButton>
            </div>
          </div>
        </Modal>
      </div>
    </AppShell>
  );
}

export default function NewRequestPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center text-xs font-semibold text-[#6B7280]">
          Loading service application wizard...
        </div>
      }
    >
      <NewRequestFormContent />
    </Suspense>
  );
}
