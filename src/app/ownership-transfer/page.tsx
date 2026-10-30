"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import {
  AppCard,
  AppButton,
  StatusBadge,
  FormField,
  Modal,
  IonIcon,
} from "@/components/ui";

interface TransferItem {
  id: string;
  societyId: { _id?: string; name?: string; code?: string; city?: string } | string;
  flat: { _id?: string; flatNumber: string; floor: number; bhkType?: string; shareCertificateNumber?: string } | null;
  currentOwner: { id: string; name?: string; email?: string };
  proposedOwner: { name: string; email: string; phone: string };
  transferType: string;
  reason: string;
  effectiveDate?: string;
  status: string;
  newOwnerAccepted: boolean;
  documentsCount: number;
  activeTenanciesCount: number;
  createdAt: string;
}

interface UserFlat {
  id: string;
  societyId: string;
  societyName: string;
  wing: string;
  flatNumber: string;
}

export default function OwnershipTransferPage() {
  const [loading, setLoading] = useState(true);
  const [transfers, setTransfers] = useState<TransferItem[]>([]);
  const [isCommittee, setIsCommittee] = useState(false);
  const [activeTab, setActiveTab] = useState<"MY_TRANSFERS" | "INCOMING" | "COMMITTEE_QUEUE">("MY_TRANSFERS");

  // Wizard Modal
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [userFlats, setUserFlats] = useState<UserFlat[]>([]);
  const [selectedFlatId, setSelectedFlatId] = useState("");
  const [transferType, setTransferType] = useState<"SALE" | "GIFT" | "INHERITANCE" | "RELINQUISHMENT" | "OTHER">("SALE");
  const [reason, setReason] = useState("");
  const [effectiveDate, setEffectiveDate] = useState("");
  const [proposedName, setProposedName] = useState("");
  const [proposedEmail, setProposedEmail] = useState("");
  const [proposedPhone, setProposedPhone] = useState("");
  const [documents, setDocuments] = useState<Array<{ documentType: string; name: string; fileUrl: string }>>([]);
  const [newDocType, setNewDocType] = useState("SALE_DEED");
  const [newDocName, setNewDocName] = useState("");
  const [newDocUrl, setNewDocUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [wizardError, setWizardError] = useState<string | null>(null);
  const [wizardSuccess, setWizardSuccess] = useState<string | null>(null);

  const fetchTransfers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/ownership-transfer");
      const data = await res.json();
      if (res.ok) {
        setTransfers(data.transfers || []);
        setIsCommittee(!!data.isCommittee);
        if (data.isCommittee && data.transfers.length > 0) {
          setActiveTab("COMMITTEE_QUEUE");
        }
      }
    } catch (err) {
      console.error("Error loading transfers:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserFlats = async () => {
    try {
      const res = await fetch("/api/dashboard/resident");
      const resData = await res.json();
      if (res.ok && resData.flat) {
        setUserFlats([
          {
            id: resData.flat.id,
            societyId: resData.society.id,
            societyName: resData.society.name,
            wing: resData.flat.wing,
            flatNumber: resData.flat.flatNumber,
          },
        ]);
        setSelectedFlatId(resData.flat.id);
      }
    } catch (err) {
      console.error("Error loading flats:", err);
    }
  };

  useEffect(() => {
    fetchTransfers();
    fetchUserFlats();
  }, []);

  const handleAddDocument = () => {
    if (!newDocName.trim() || !newDocUrl.trim()) return;
    setDocuments([
      ...documents,
      {
        documentType: newDocType,
        name: newDocName.trim(),
        fileUrl: newDocUrl.trim(),
      },
    ]);
    setNewDocName("");
    setNewDocUrl("");
  };

  const handleRemoveDoc = (index: number) => {
    setDocuments(documents.filter((_, i) => i !== index));
  };

  const handleInitiateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWizardError(null);

    const selectedFlat = userFlats.find((f) => f.id === selectedFlatId) || userFlats[0];
    if (!selectedFlat) {
      setWizardError("Please select a flat to transfer.");
      return;
    }

    if (!proposedName.trim() || !proposedEmail.trim()) {
      setWizardError("Proposed new owner full name and email are required.");
      return;
    }

    if (!reason.trim()) {
      setWizardError("Please state the reason or details for this property transfer.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/ownership-transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          societyId: selectedFlat.societyId,
          flatId: selectedFlat.id,
          transferType,
          reason,
          effectiveDate: effectiveDate || undefined,
          proposedOwner: {
            name: proposedName.trim(),
            email: proposedEmail.trim(),
            phone: proposedPhone.trim(),
          },
          documents,
        }),
      });

      const resJson = await res.json();
      if (!res.ok) throw new Error(resJson.error || "Failed to initiate transfer");

      setWizardSuccess(resJson.message);
      fetchTransfers();
      setTimeout(() => {
        setIsWizardOpen(false);
        setWizardStep(1);
        setWizardSuccess(null);
        setProposedName("");
        setProposedEmail("");
        setProposedPhone("");
        setReason("");
        setDocuments([]);
      }, 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error initiating transfer";
      setWizardError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "success";
      case "APPROVED_PENDING_COMPLETION":
        return "info";
      case "AWAITING_NEW_OWNER":
      case "AWAITING_SOCIETY_VERIFICATION":
      case "UNDER_REVIEW":
        return "warning";
      case "INFORMATION_REQUIRED":
        return "warning";
      case "REJECTED":
      case "CANCELLED":
        return "error";
      default:
        return "neutral";
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-xs">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#EEF2FF] text-[#4F46E5] border border-[#C7D2FE]">
                Property Registry
              </span>
              <span className="text-xs text-[#6B7280]">Prompt 10 Module</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-[#1A1A1A] font-heading">
              Property Ownership Transfer
            </h1>
            <p className="text-xs md:text-sm text-[#6B7280] mt-1 max-w-2xl">
              Initiate, verify, and execute statutory apartment ownership transfers. Incorporates new owner acceptance, title deed verification, share certificate records, and tenant protection.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <AppButton
              variant="hero"
              size="md"
              leftIcon="add-outline"
              onClick={() => setIsWizardOpen(true)}
            >
              Initiate Transfer
            </AppButton>
          </div>
        </div>

        {/* Statutory Disclaimer */}
        <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-xl p-4 text-xs text-[#92400E] flex items-start gap-3">
          <IonIcon name="information-circle-outline" size={20} className="shrink-0 text-[#D97706] mt-0.5" />
          <div className="leading-relaxed">
            <strong>Prototype Compliance Notice:</strong> SocietyFlow records internal cooperative housing society membership and flat directory transitions. Official government property registration, sub-registrar stamp duty, and legal conveyancing must be performed according to applicable statutory law.
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 border-b border-[#E5E7EB] pb-3 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("MY_TRANSFERS")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "MY_TRANSFERS"
                ? "bg-[#1A1A1A] text-white"
                : "bg-[#F8F9FA] text-[#6B7280] hover:text-[#1A1A1A]"
            }`}
          >
            <IonIcon name="send-outline" size={16} />
            <span>Transfers Initiated by Me</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("INCOMING")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "INCOMING"
                ? "bg-[#1A1A1A] text-white"
                : "bg-[#F8F9FA] text-[#6B7280] hover:text-[#1A1A1A]"
            }`}
          >
            <IonIcon name="mail-unread-outline" size={16} />
            <span>Proposed to Me (Incoming)</span>
          </button>

          {isCommittee && (
            <button
              type="button"
              onClick={() => setActiveTab("COMMITTEE_QUEUE")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "COMMITTEE_QUEUE"
                  ? "bg-[#4F46E5] text-white"
                  : "bg-[#F8F9FA] text-[#6B7280] hover:text-[#1A1A1A]"
              }`}
            >
              <IonIcon name="shield-checkmark-outline" size={16} />
              <span>Society Committee Queue</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
                {transfers.length}
              </span>
            </button>
          )}
        </div>

        {/* Content Table / List */}
        {loading ? (
          <div className="p-12 text-center text-xs text-[#6B7280]">
            <IonIcon name="sync-outline" size={24} className="animate-spin text-[#4F46E5] mx-auto mb-2" />
            <p>Loading ownership transfer records...</p>
          </div>
        ) : transfers.length === 0 ? (
          <AppCard className="p-12 text-center text-xs text-[#6B7280] space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center mx-auto">
              <IonIcon name="swap-horizontal-outline" size={28} />
            </div>
            <p className="text-sm font-bold text-[#1A1A1A]">No Ownership Transfers Found</p>
            <p className="max-w-md mx-auto leading-relaxed">
              You do not have any pending or completed property ownership transfer requests. If you are selling or gifting your flat, click &quot;Initiate Transfer&quot; to begin.
            </p>
            <div className="pt-2">
              <AppButton variant="hero" size="sm" onClick={() => setIsWizardOpen(true)}>
                Start New Transfer
              </AppButton>
            </div>
          </AppCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {transfers.map((trf) => {
              const socName = typeof trf.societyId === "object" ? trf.societyId?.name : "Cooperative Society";
              const flatNo = trf.flat?.flatNumber || "Unit";

              return (
                <AppCard
                  key={trf.id}
                  className="p-5 flex flex-col justify-between hover:border-[#D1D5DB] transition-all border border-[#E5E7EB]"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2 pb-2 border-b border-[#F1F3F5]">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EEF2FF] text-[#4F46E5]">
                            Flat {flatNo}
                          </span>
                          <span className="text-[10px] font-mono font-bold text-[#6B7280]">
                            {trf.transferType}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-[#1A1A1A] font-heading truncate max-w-[200px]">
                          {socName}
                        </h3>
                      </div>
                      <StatusBadge variant={getStatusBadgeVariant(trf.status)} size="sm">
                        {trf.status.replace(/_/g, " ")}
                      </StatusBadge>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-[#6B7280]">Current Owner:</span>
                        <span className="font-semibold text-[#1A1A1A] truncate max-w-[150px]">
                          {trf.currentOwner?.name || "Current Owner"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#6B7280]">Proposed Owner:</span>
                        <span className="font-semibold text-[#1A1A1A] truncate max-w-[150px]">
                          {trf.proposedOwner.name}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#6B7280]">New Owner Accepted:</span>
                        <span className={trf.newOwnerAccepted ? "text-[#10B981] font-bold" : "text-[#F59E0B] font-bold"}>
                          {trf.newOwnerAccepted ? "Accepted" : "Pending"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#6B7280]">Documents Attached:</span>
                        <span className="font-medium text-[#1A1A1A]">{trf.documentsCount} files</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-[#F1F3F5] flex items-center justify-between">
                    <span className="text-[10px] text-[#9CA3AF]">
                      {new Date(trf.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    <Link href={`/ownership-transfer/${trf.id}`}>
                      <AppButton variant="outline" size="sm" rightIcon="arrow-forward-outline">
                        View Details
                      </AppButton>
                    </Link>
                  </div>
                </AppCard>
              );
            })}
          </div>
        )}

        {/* Transfer Initiation Modal Wizard */}
        <Modal
          isOpen={isWizardOpen}
          onClose={() => {
            if (!isSubmitting) setIsWizardOpen(false);
          }}
          title={`Initiate Property Ownership Transfer (Step ${wizardStep} of 3)`}
        >
          <form onSubmit={handleInitiateSubmit} className="space-y-4 text-xs">
            {wizardError && (
              <div className="p-3 bg-[#FEF2F2] border border-[#FCA5A5] rounded-xl text-[#B91C1C]">
                {wizardError}
              </div>
            )}
            {wizardSuccess && (
              <div className="p-3 bg-[#ECFDF5] border border-[#A7F3D0] rounded-xl text-[#047857]">
                {wizardSuccess}
              </div>
            )}

            {/* Step 1: Flat & Transfer Reason */}
            {wizardStep === 1 && (
              <div className="space-y-3">
                <FormField
                  label="Select Authorized Unit (You can only transfer units where you are an approved owner)"
                >
                  <select
                    value={selectedFlatId}
                    onChange={(e) => setSelectedFlatId(e.target.value)}
                    className="w-full h-10 px-3 bg-white border border-[#E5E7EB] rounded-xl text-xs text-[#1A1A1A] focus:outline-none focus:border-[#4F46E5]"
                  >
                    {userFlats.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.societyName} — {f.wing} Flat {f.flatNumber}
                      </option>
                    ))}
                  </select>
                </FormField>

                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Transfer Legal Type">
                    <select
                      value={transferType}
                      onChange={(e) => setTransferType(e.target.value as any)}
                      className="w-full h-10 px-3 bg-white border border-[#E5E7EB] rounded-xl text-xs text-[#1A1A1A] focus:outline-none focus:border-[#4F46E5]"
                    >
                      <option value="SALE">Registered Sale</option>
                      <option value="GIFT">Gift Deed</option>
                      <option value="INHERITANCE">Inheritance / Succession</option>
                      <option value="RELINQUISHMENT">Relinquishment Deed</option>
                      <option value="OTHER">Other Statutory Assignment</option>
                    </select>
                  </FormField>

                  <FormField label="Target Effective Date (Optional)">
                    <input
                      type="date"
                      value={effectiveDate}
                      onChange={(e) => setEffectiveDate(e.target.value)}
                      className="w-full h-10 px-3 bg-white border border-[#E5E7EB] rounded-xl text-xs text-[#1A1A1A] focus:outline-none focus:border-[#4F46E5]"
                    />
                  </FormField>
                </div>

                <FormField label="Transfer Reason & Statement">
                  <textarea
                    rows={3}
                    placeholder="Enter details of sale agreement, registration reference, or reason for title deed transfer..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full p-3 bg-white border border-[#E5E7EB] rounded-xl text-xs text-[#1A1A1A] focus:outline-none focus:border-[#4F46E5]"
                  />
                </FormField>

                <div className="pt-2 flex justify-end">
                  <AppButton
                    type="button"
                    variant="hero"
                    size="sm"
                    onClick={() => {
                      if (!reason.trim()) {
                        setWizardError("Please enter the reason/statement for this transfer.");
                        return;
                      }
                      setWizardError(null);
                      setWizardStep(2);
                    }}
                  >
                    Next: Proposed Owner Details &rarr;
                  </AppButton>
                </div>
              </div>
            )}

            {/* Step 2: Proposed New Owner */}
            {wizardStep === 2 && (
              <div className="space-y-3">
                <div className="p-3 bg-[#EEF2FF] border border-[#C7D2FE] rounded-xl text-[#4F46E5]">
                  An invitation will be sent to the proposed new owner. They must review and accept before Society Management begins document verification.
                </div>

                <FormField label="Proposed Owner Full Name" required>
                  <input
                    type="text"
                    placeholder="e.g. Ramesh Chandra Sharma"
                    value={proposedName}
                    onChange={(e) => setProposedName(e.target.value)}
                    className="w-full h-10 px-3 bg-white border border-[#E5E7EB] rounded-xl text-xs text-[#1A1A1A] focus:outline-none focus:border-[#4F46E5]"
                  />
                </FormField>

                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Proposed Owner Email" required>
                    <input
                      type="email"
                      placeholder="ramesh@example.com"
                      value={proposedEmail}
                      onChange={(e) => setProposedEmail(e.target.value)}
                      className="w-full h-10 px-3 bg-white border border-[#E5E7EB] rounded-xl text-xs text-[#1A1A1A] focus:outline-none focus:border-[#4F46E5]"
                    />
                  </FormField>

                  <FormField label="Contact Phone">
                    <input
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={proposedPhone}
                      onChange={(e) => setProposedPhone(e.target.value)}
                      className="w-full h-10 px-3 bg-white border border-[#E5E7EB] rounded-xl text-xs text-[#1A1A1A] focus:outline-none focus:border-[#4F46E5]"
                    />
                  </FormField>
                </div>

                <div className="pt-2 flex justify-between">
                  <AppButton
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setWizardStep(1)}
                  >
                    &larr; Back
                  </AppButton>
                  <AppButton
                    type="button"
                    variant="hero"
                    size="sm"
                    onClick={() => {
                      if (!proposedName.trim() || !proposedEmail.trim()) {
                        setWizardError("Proposed owner name and email are required.");
                        return;
                      }
                      setWizardError(null);
                      setWizardStep(3);
                    }}
                  >
                    Next: Supporting Documents &rarr;
                  </AppButton>
                </div>
              </div>
            )}

            {/* Step 3: Supporting Documents & Submission */}
            {wizardStep === 3 && (
              <div className="space-y-4">
                <div className="p-3 bg-[#F8F9FA] border border-[#E5E7EB] rounded-xl space-y-2">
                  <p className="font-bold text-[#1A1A1A]">Attach Transfer Documents</p>
                  <p className="text-[#6B7280]">
                    Upload or attach Sale Deed, Share Certificate copy, or No-Dues receipts.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                    <select
                      value={newDocType}
                      onChange={(e) => setNewDocType(e.target.value)}
                      className="h-9 px-2 bg-white border border-[#E5E7EB] rounded-lg text-xs"
                    >
                      <option value="SALE_DEED">Sale Deed</option>
                      <option value="SHARE_CERTIFICATE">Share Certificate</option>
                      <option value="NOC_APPLICATION">NOC Application</option>
                      <option value="IDENTITY_PROOF">Identity Proof</option>
                      <option value="OTHER">Other Supporting File</option>
                    </select>

                    <input
                      type="text"
                      placeholder="Document title (e.g. Registered Sale Deed 2026)"
                      value={newDocName}
                      onChange={(e) => setNewDocName(e.target.value)}
                      className="h-9 px-3 bg-white border border-[#E5E7EB] rounded-lg text-xs"
                    />

                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="File URL / R2 Key"
                        value={newDocUrl}
                        onChange={(e) => setNewDocUrl(e.target.value)}
                        className="h-9 px-3 bg-white border border-[#E5E7EB] rounded-lg text-xs flex-1"
                      />
                      <AppButton
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={handleAddDocument}
                      >
                        Add
                      </AppButton>
                    </div>
                  </div>
                </div>

                {/* Attached Documents List */}
                {documents.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="font-bold text-[#1A1A1A]">Checklist to be Verified ({documents.length}):</p>
                    {documents.map((d, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg bg-white border border-[#E5E7EB] flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <IonIcon name="document-text-outline" size={16} className="text-[#4F46E5]" />
                          <div>
                            <p className="font-bold text-[#1A1A1A]">{d.name}</p>
                            <span className="text-[10px] text-[#6B7280]">{d.documentType}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveDoc(idx)}
                          className="text-[#EF4444] hover:text-[#DC2626] p-1"
                        >
                          <IonIcon name="trash-outline" size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-between">
                  <AppButton
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setWizardStep(2)}
                    disabled={isSubmitting}
                  >
                    &larr; Back
                  </AppButton>
                  <AppButton
                    type="submit"
                    variant="hero"
                    size="sm"
                    isLoading={isSubmitting}
                  >
                    Submit Transfer Request
                  </AppButton>
                </div>
              </div>
            )}
          </form>
        </Modal>
      </div>
    </AppShell>
  );
}
