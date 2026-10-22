"use client";

import React, { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  PageHeader,
  SearchField,
  DocumentCard,
  AppButton,
  Modal,
  FormField,
  StatusBadge,
  IconContainer,
} from "@/components/ui";
import { DocumentRecord } from "@/types";

const PERSONAL_VAULT_DOCS: DocumentRecord[] = [
  {
    id: "vault-1",
    societyId: "soc-greenwood",
    flatId: "flat-c402",
    title: "Registered_Agreement_Haveli_II.pdf",
    category: "AGREEMENT",
    fileKey: "vault/c402/agreement_registered.pdf",
    fileSize: 5240000,
    mimeType: "application/pdf",
    uploadedBy: {
      userId: "usr-priya",
      userName: "Priya Mehta",
      userRole: "RESIDENT_OWNER",
    },
    status: "VERIFIED",
    isSocietyPublic: false,
    version: 1,
    tags: ["Registration", "Haveli-II", "Stamp Duty"],
    createdAt: "2024-01-10T11:00:00Z",
    updatedAt: "2024-01-10T11:00:00Z",
    verifiedAt: "2024-01-11T16:00:00Z",
  },
  {
    id: "vault-2",
    societyId: "soc-greenwood",
    flatId: "flat-c402",
    title: "Share_Certificate_Original_C402.pdf",
    category: "SHARE_CERTIFICATE",
    fileKey: "vault/c402/share_cert_042.pdf",
    fileSize: 1840000,
    mimeType: "application/pdf",
    uploadedBy: {
      userId: "usr-admin",
      userName: "Managing Committee",
      userRole: "SOCIETY_ADMIN",
    },
    status: "VERIFIED",
    isSocietyPublic: false,
    version: 1,
    tags: ["Share Capital", "Certificate #042"],
    createdAt: "2024-01-12T10:00:00Z",
    updatedAt: "2024-01-12T10:00:00Z",
  },
  {
    id: "vault-3",
    societyId: "soc-greenwood",
    flatId: "flat-c402",
    title: "PMC_Property_Tax_Receipt_2024.pdf",
    category: "UTILITY_SANCTION",
    fileKey: "vault/c402/pmc_tax_receipt.pdf",
    fileSize: 890000,
    mimeType: "application/pdf",
    uploadedBy: {
      userId: "usr-priya",
      userName: "Priya Mehta",
      userRole: "RESIDENT_OWNER",
    },
    status: "VERIFIED",
    isSocietyPublic: false,
    version: 1,
    tags: ["PMC", "Property Tax", "FY24"],
    createdAt: "2024-04-18T14:20:00Z",
    updatedAt: "2024-04-18T14:20:00Z",
  },
  {
    id: "vault-4",
    societyId: "soc-greenwood",
    flatId: "flat-c402",
    title: "NOC_Mortgage_State_Bank_India.pdf",
    category: "NOC_CERTIFICATE",
    fileKey: "vault/c402/noc_sbi_mortgage.pdf",
    fileSize: 420000,
    mimeType: "application/pdf",
    uploadedBy: {
      userId: "usr-secretary",
      userName: "Secretary Office",
      userRole: "SOCIETY_ADMIN",
    },
    status: "APPROVED",
    isSocietyPublic: false,
    version: 1,
    tags: ["NOC", "Home Loan", "SBI"],
    createdAt: "2024-02-14T09:30:00Z",
    updatedAt: "2024-02-14T09:30:00Z",
  },
];

export default function DocumentsVaultPage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [activeDoc, setActiveDoc] = useState<DocumentRecord | null>(null);

  const filteredDocs = PERSONAL_VAULT_DOCS.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(search.toLowerCase()) ||
      doc.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory =
      selectedCategory === "ALL" || doc.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <AppShell>
      <PageHeader
        title="Personal Document Vault"
        description="Encrypted, watermarked property records for Flat C-402 (Wing C, 4th Floor)"
        breadcrumbs={[
          { label: "Console", href: "/dashboard" },
          { label: "Personal Vault" },
        ]}
        badge={
          <StatusBadge variant="hero" size="sm">
            Unit C-402
          </StatusBadge>
        }
        actions={
          <AppButton
            variant="hero"
            size="sm"
            leftIcon="cloud-upload-outline"
            onClick={() => setIsUploadModalOpen(true)}
          >
            Deposit Document
          </AppButton>
        }
      />

      {/* Vault Status Banner */}
      <div className="mb-6 p-4 rounded-xl border border-[#E5E7EB] bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-[#6B7280]">
        <div className="flex items-center gap-2.5">
          <IconContainer name="shield-checkmark-outline" variant="success" size="sm" />
          <div>
            <span className="font-bold text-[#1A1A1A]">Vault Verification Status:</span> 4
            of 4 core legal documents have been authenticated by the Society Secretary.
          </div>
        </div>
        <StatusBadge variant="success" size="sm" dot>
          100% Compliant
        </StatusBadge>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <SearchField
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onClear={() => setSearch("")}
          placeholder="Search by title, deed number, tag..."
        />

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { id: "ALL", label: "All Vault" },
            { id: "AGREEMENT", label: "Sale Deed" },
            { id: "SHARE_CERTIFICATE", label: "Share Cert." },
            { id: "NOC_CERTIFICATE", label: "NOCs" },
            { id: "UTILITY_SANCTION", label: "Tax / Sanctions" },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? "bg-[#1A1A1A] text-white"
                  : "bg-white text-[#6B7280] border border-[#E5E7EB] hover:text-[#1A1A1A]"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Documents */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredDocs.map((doc) => (
          <DocumentCard
            key={doc.id}
            document={doc}
            onView={(d) => setActiveDoc(d)}
            onDownload={(d) => {
              alert(
                `[Prototype Notice] In production, ${d.title} fetches a secure, presigned token directly from Cloudflare R2.`
              );
            }}
          />
        ))}
      </div>

      {/* Deposit Document Modal (Scaffolded upload flow without fake persistence) */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Deposit Document to Unit Vault"
        description="Upload a PDF or scan to Flat C-402's permanent encrypted vault"
        footer={
          <>
            <AppButton
              variant="outline"
              size="sm"
              onClick={() => setIsUploadModalOpen(false)}
            >
              Cancel
            </AppButton>
            <AppButton
              variant="hero"
              size="sm"
              onClick={() => {
                alert(
                  "[Prototype Constraint] Backend persistence is scheduled for Prompt 2 with Auth.js and MongoDB Atlas + Cloudflare R2. This form illustrates the exact schema validation."
                );
                setIsUploadModalOpen(false);
              }}
            >
              Validate & Upload
            </AppButton>
          </>
        }
      >
        <div className="space-y-4">
          <FormField
            label="Document Title"
            placeholder="e.g. Registered_Sale_Deed_Haveli_II.pdf"
            required
            helperText="Provide official designation matching physical records"
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]">
              Document Category <span className="text-[#F43F5E]">*</span>
            </label>
            <select className="h-11 px-3.5 bg-white text-sm rounded-xl border border-[#E5E7EB] outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5]">
              <option value="AGREEMENT">Registered Agreement / Sale Deed</option>
              <option value="SHARE_CERTIFICATE">Share Certificate</option>
              <option value="NOC_CERTIFICATE">Society / Bank NOC</option>
              <option value="UTILITY_SANCTION">Tax / Utility Sanction</option>
              <option value="IDENTITY_VERIFICATION">Police / KYC Verification</option>
            </select>
          </div>

          <FormField
            label="Metadata Tags"
            placeholder="e.g. Haveli, StampDuty, SBI"
            helperText="Comma separated search terms for audit discovery"
          />

          <div className="p-6 border-2 border-dashed border-[#E5E7EB] rounded-xl bg-[#F8F9FA] text-center">
            <IconContainer
              name="cloud-upload-outline"
              variant="hero-soft"
              size="md"
              className="mb-2"
            />
            <p className="text-xs font-bold text-[#1A1A1A]">
              Drag & Drop PDF or Scanned Document
            </p>
            <p className="text-[11px] text-[#9CA3AF] mt-1">
              Supports PDF, PNG, JPG up to 25MB (Encrypted at rest)
            </p>
          </div>
        </div>
      </Modal>

      {/* Inspect Document Modal */}
      <Modal
        isOpen={!!activeDoc}
        onClose={() => setActiveDoc(null)}
        title={activeDoc?.title || "Document Details"}
        description={`Category: ${activeDoc?.category} • Status: ${activeDoc?.status}`}
        footer={
          <AppButton variant="outline" size="sm" onClick={() => setActiveDoc(null)}>
            Close View
          </AppButton>
        }
      >
        {activeDoc && (
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-[#F8F9FA] rounded-xl border border-[#E5E7EB] space-y-1.5">
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Registered Flat:</span>
                <span className="font-semibold text-[#1A1A1A]">Wing C - 402</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Verification Officer:</span>
                <span className="text-[#1A1A1A]">Society Secretary</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Storage Key:</span>
                <span className="font-mono text-[#4F46E5] truncate max-w-[200px]">
                  {activeDoc.fileKey}
                </span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </AppShell>
  );
}
