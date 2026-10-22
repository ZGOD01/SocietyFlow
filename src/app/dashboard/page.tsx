"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import {
  PageHeader,
  StatCard,
  DocumentCard,
  AppCard,
  StatusBadge,
  IconContainer,
  AppButton,
  Modal,
} from "@/components/ui";
import { DocumentRecord } from "@/types";

// Demonstrative prototype documents
const DEMO_DOCUMENTS: DocumentRecord[] = [
  {
    id: "doc-1",
    societyId: "soc-greenwood",
    flatId: "flat-c402",
    title: "Registered_Sale_Deed_C402.pdf",
    category: "AGREEMENT",
    fileKey: "vault/c402/sale_deed.pdf",
    fileSize: 4820000,
    mimeType: "application/pdf",
    uploadedBy: {
      userId: "usr-priya",
      userName: "Priya Mehta",
      userRole: "RESIDENT_OWNER",
    },
    status: "VERIFIED",
    isSocietyPublic: false,
    version: 1,
    tags: ["Registration", "Haveli-II", "Deed"],
    createdAt: "2024-01-15T10:30:00Z",
    updatedAt: "2024-01-15T10:30:00Z",
    verifiedAt: "2024-01-16T14:20:00Z",
  },
  {
    id: "doc-2",
    societyId: "soc-greenwood",
    flatId: "flat-c402",
    title: "Original_Share_Certificate_No_042.pdf",
    category: "SHARE_CERTIFICATE",
    fileKey: "vault/c402/share_cert.pdf",
    fileSize: 1840000,
    mimeType: "application/pdf",
    uploadedBy: {
      userId: "usr-secretary",
      userName: "Managing Committee",
      userRole: "SOCIETY_ADMIN",
    },
    status: "VERIFIED",
    isSocietyPublic: false,
    version: 1,
    tags: ["Share Capital", "Certificate", "Registered"],
    createdAt: "2024-02-01T12:00:00Z",
    updatedAt: "2024-02-01T12:00:00Z",
  },
  {
    id: "doc-3",
    societyId: "soc-greenwood",
    title: "Society_Model_Bylaws_2024.pdf",
    category: "BYLAWS",
    fileKey: "society/bylaws_2024.pdf",
    fileSize: 3100000,
    mimeType: "application/pdf",
    uploadedBy: {
      userId: "usr-admin",
      userName: "Managing Committee",
      userRole: "SOCIETY_ADMIN",
    },
    status: "APPROVED",
    isSocietyPublic: true,
    version: 2,
    tags: ["Bylaws", "Cooperative Act", "Rules"],
    createdAt: "2024-03-10T09:15:00Z",
    updatedAt: "2024-03-10T09:15:00Z",
  },
];

export default function DashboardPage() {
  const [selectedDoc, setSelectedDoc] = useState<DocumentRecord | null>(null);

  return (
    <AppShell>
      <PageHeader
        title="Society Overview & Vault"
        description="Greenwood Residency CHS Ltd. • Registration No: PNA/PNA(1)/HSG/(TC)/14902/2019"
        breadcrumbs={[{ label: "Overview" }]}
        badge={
          <StatusBadge variant="success" size="sm" dot>
            Tenant Active
          </StatusBadge>
        }
        actions={
          <div className="flex items-center gap-2.5">
            <Link href="/requests">
              <AppButton variant="outline" size="sm" leftIcon="add-outline">
                New Request
              </AppButton>
            </Link>
            <Link href="/documents">
              <AppButton variant="hero" size="sm" leftIcon="cloud-upload-outline">
                Open Vault
              </AppButton>
            </Link>
          </div>
        }
      />

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Personal Vault"
          value="8 Files"
          subtitle="All Deeds Verified"
          iconName="folder-open-outline"
          iconVariant="hero-soft"
          badgeText="100% OK"
          badgeVariant="success"
        />
        <StatCard
          label="Society Library"
          value="240 Docs"
          subtitle="Bylaws, Minutes, Audits"
          iconName="library-outline"
          iconVariant="info"
          trend={{ value: "12 new this month", positive: true }}
        />
        <StatCard
          label="Pending Approvals"
          value="3"
          subtitle="1 NOC Transfer pending"
          iconName="checkmark-done-circle-outline"
          iconVariant="warning"
          badgeText="Action"
          badgeVariant="warning"
        />
        <StatCard
          label="Property Registry"
          value="216 Units"
          subtitle="Wings A, B, C, D, E"
          iconName="business-outline"
          iconVariant="neutral"
        />
      </div>

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 spans): Verified Vault Documents */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#1A1A1A] font-heading">
                Recent Vault & Society Records
              </h2>
              <p className="text-xs text-[#6B7280]">
                Access-controlled documents with digital verification
              </p>
            </div>
            <Link
              href="/documents"
              className="text-xs font-semibold text-[#4F46E5] hover:underline"
            >
              View All Vault →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {DEMO_DOCUMENTS.map((doc) => (
              <DocumentCard
                key={doc.id}
                document={doc}
                onView={(d) => setSelectedDoc(d)}
                onDownload={(d) => {
                  alert(
                    `[Prototype Preview] Downloading encrypted document stream for ${d.title}. In production, this generates a presigned Cloudflare R2 URL.`
                  );
                }}
              />
            ))}
          </div>

          {/* Quick Notice banner */}
          <div className="p-4 rounded-xl border border-[#E5E7EB] bg-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <IconContainer name="shield-outline" variant="hero-soft" size="sm" />
              <div>
                <p className="text-xs font-bold text-[#1A1A1A]">
                  Statutory Audit FY 2024-25 Ready
                </p>
                <p className="text-[11px] text-[#6B7280]">
                  All voucher backups, bank reconciliation statements, and minutes verified.
                </p>
              </div>
            </div>
            <Link href="/society-documents">
              <AppButton variant="outline" size="sm">
                Inspect Audit
              </AppButton>
            </Link>
          </div>
        </div>

        {/* Right Column (1 span): Active Committee Approvals & Requests */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#1A1A1A] font-heading">
              Approval Pipeline
            </h2>
            <Link
              href="/requests"
              className="text-xs font-semibold text-[#4F46E5] hover:underline"
            >
              All Requests →
            </Link>
          </div>

          <AppCard className="p-5 bg-white border-[#E5E7EB] space-y-4">
            <div className="space-y-3.5">
              <div className="p-3 rounded-xl border border-[#E5E7EB] bg-[#F8F9FA] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#1A1A1A]">NOC: Resale Flat C-402</span>
                  <StatusBadge variant="warning" size="sm" dot>
                    In Committee
                  </StatusBadge>
                </div>
                <p className="text-[11px] text-[#6B7280]">
                  Buyer: Vikram Patil • Bank: SBI Home Loans
                </p>
                <div className="flex items-center justify-between text-[10px] text-[#9CA3AF] pt-1">
                  <span>Signatures: 2 of 3</span>
                  <span className="text-[#F59E0B] font-medium">Sec. Review</span>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-[#E5E7EB] bg-[#F8F9FA] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#1A1A1A]">Renovation: Balcony Grill</span>
                  <StatusBadge variant="success" size="sm" dot>
                    Approved
                  </StatusBadge>
                </div>
                <p className="text-[11px] text-[#6B7280]">
                  Flat B-102 • Architecture Guideline Met
                </p>
                <div className="flex items-center justify-between text-[10px] text-[#9CA3AF] pt-1">
                  <span>Signed by Chairman</span>
                  <span className="text-[#10B981] font-medium">Completed</span>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-[#E5E7EB] bg-[#F8F9FA] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#1A1A1A]">Tenant Police Verification</span>
                  <StatusBadge variant="info" size="sm" dot>
                    Verification
                  </StatusBadge>
                </div>
                <p className="text-[11px] text-[#6B7280]">
                  Flat D-701 • Verification slip attached
                </p>
                <div className="flex items-center justify-between text-[10px] text-[#9CA3AF] pt-1">
                  <span>Police Token #48291</span>
                  <span className="text-[#0EA5E9] font-medium">Submitted</span>
                </div>
              </div>
            </div>

            <Link href="/requests" className="block w-full">
              <AppButton variant="secondary" size="sm" className="w-full" pill={false}>
                Submit New Society Application
              </AppButton>
            </Link>
          </AppCard>

          {/* Multi-Tenant Security Spec */}
          <AppCard className="p-4 bg-[#F8F9FA] border-[#E5E7EB] text-xs text-[#6B7280] space-y-2">
            <div className="flex items-center gap-2 text-[#1A1A1A] font-bold">
              <IconContainer name="lock-closed-outline" variant="neutral" size="sm" />
              <span>Multi-Tenant Isolation Notice</span>
            </div>
            <p className="leading-relaxed">
              Every document and request is bound to <code className="text-[#4F46E5] font-mono">societyId: soc-greenwood</code>.
              Cross-society leakages are blocked at data model & server token levels.
            </p>
          </AppCard>
        </div>
      </div>

      {/* Document Detail Preview Modal */}
      <Modal
        isOpen={!!selectedDoc}
        onClose={() => setSelectedDoc(null)}
        title={selectedDoc?.title || "Document Details"}
        description={`Category: ${selectedDoc?.category} • Status: ${selectedDoc?.status}`}
        footer={
          <>
            <AppButton variant="outline" size="sm" onClick={() => setSelectedDoc(null)}>
              Close
            </AppButton>
            <AppButton
              variant="hero"
              size="sm"
              leftIcon="download-outline"
              onClick={() => {
                alert("Simulating Cloudflare R2 presigned download stream.");
                setSelectedDoc(null);
              }}
            >
              Download PDF
            </AppButton>
          </>
        }
      >
        {selectedDoc && (
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl border border-[#E5E7EB] bg-[#F8F9FA] space-y-2">
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Document ID:</span>
                <span className="font-mono text-[#1A1A1A] font-semibold">{selectedDoc.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Mime Type:</span>
                <span className="text-[#1A1A1A]">{selectedDoc.mimeType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B7280]">File Storage Key:</span>
                <span className="font-mono text-[#4F46E5] truncate max-w-[200px]">
                  {selectedDoc.fileKey}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Security Level:</span>
                <span className="font-semibold text-[#1A1A1A]">
                  {selectedDoc.isSocietyPublic ? "Public Society Notice" : "Confidential Unit Record"}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {selectedDoc.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-md bg-[#EEF2FF] text-[#4F46E5] font-medium"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </AppShell>
  );
}
