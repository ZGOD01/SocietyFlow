"use client";

import React, { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  PageHeader,
  SearchField,
  DocumentCard,
  StatusBadge,
  AppButton,
  IconContainer,
} from "@/components/ui";
import { DocumentRecord } from "@/types";

const SOCIETY_RECORDS: DocumentRecord[] = [
  {
    id: "soc-doc-1",
    societyId: "soc-greenwood",
    title: "Model_Bylaws_Approved_Amendments_2024.pdf",
    category: "BYLAWS",
    fileKey: "society/bylaws/bylaws_2024_rev2.pdf",
    fileSize: 4200000,
    mimeType: "application/pdf",
    uploadedBy: {
      userId: "usr-admin",
      userName: "Managing Committee",
      userRole: "SOCIETY_ADMIN",
    },
    status: "APPROVED",
    isSocietyPublic: true,
    version: 2,
    tags: ["Bylaws", "Cooperative Act", "Amendments"],
    createdAt: "2024-01-05T10:00:00Z",
    updatedAt: "2024-01-05T10:00:00Z",
  },
  {
    id: "soc-doc-2",
    societyId: "soc-greenwood",
    title: "Statutory_Audit_Report_Grade_A_FY23_24.pdf",
    category: "AUDIT_FINANCIALS",
    fileKey: "society/audit/statutory_audit_fy24.pdf",
    fileSize: 6800000,
    mimeType: "application/pdf",
    uploadedBy: {
      userId: "usr-auditor",
      userName: "V. & Associates Chartered Accountants",
      userRole: "AUDITOR_PARTNER",
    },
    status: "VERIFIED",
    isSocietyPublic: true,
    version: 1,
    tags: ["Audit", "Balance Sheet", "Grade A"],
    createdAt: "2024-06-20T15:30:00Z",
    updatedAt: "2024-06-20T15:30:00Z",
  },
  {
    id: "soc-doc-3",
    societyId: "soc-greenwood",
    title: "Annual_General_Body_Meeting_Minutes_Sept_2024.pdf",
    category: "MEETING_MINUTES",
    fileKey: "society/minutes/agm_minutes_sept_2024.pdf",
    fileSize: 2400000,
    mimeType: "application/pdf",
    uploadedBy: {
      userId: "usr-sec",
      userName: "Secretary Office",
      userRole: "SOCIETY_ADMIN",
    },
    status: "APPROVED",
    isSocietyPublic: true,
    version: 1,
    tags: ["AGM", "Minutes", "Resolutions"],
    createdAt: "2024-09-28T18:00:00Z",
    updatedAt: "2024-09-28T18:00:00Z",
  },
  {
    id: "soc-doc-4",
    societyId: "soc-greenwood",
    title: "Deemed_Conveyance_Order_District_Dy_Registrar.pdf",
    category: "AGREEMENT",
    fileKey: "society/legal/conveyance_order_ddr.pdf",
    fileSize: 9100000,
    mimeType: "application/pdf",
    uploadedBy: {
      userId: "usr-legal",
      userName: "Society Legal Counsel",
      userRole: "AUDITOR_PARTNER",
    },
    status: "VERIFIED",
    isSocietyPublic: true,
    version: 1,
    tags: ["Deemed Conveyance", "Land Title", "DDR Pune"],
    createdAt: "2023-11-14T12:00:00Z",
    updatedAt: "2023-11-14T12:00:00Z",
  },
];

export default function SocietyDocumentsPage() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  const filtered = SOCIETY_RECORDS.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
    const matchesCat =
      categoryFilter === "ALL" || item.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <AppShell>
      <PageHeader
        title="Society Document Library"
        description="Public and committee-level statutory archives for Greenwood Residency CHS"
        breadcrumbs={[
          { label: "Console", href: "/dashboard" },
          { label: "Society Library" },
        ]}
        badge={
          <StatusBadge variant="success" size="sm" dot>
            Audited Repository
          </StatusBadge>
        }
        actions={
          <AppButton
            variant="hero"
            size="sm"
            leftIcon="cloud-upload-outline"
            onClick={() =>
              alert(
                "[Prototype Constraint] Document upload connects to Cloudflare R2 via Next.js server route in Prompt 3."
              )
            }
          >
            Deposit Society Archive
          </AppButton>
        }
      />

      {/* Info Notice */}
      <div className="mb-6 p-4 rounded-xl border border-[#E5E7EB] bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-[#6B7280]">
        <div className="flex items-center gap-2.5">
          <IconContainer name="library-outline" variant="hero-soft" size="sm" />
          <div>
            <span className="font-bold text-[#1A1A1A]">Statutory Transparency:</span> All
            registered members hold read access to approved AGM minutes and certified audit statements.
          </div>
        </div>
        <StatusBadge variant="neutral" size="sm">
          MCS Act Sec. 32
        </StatusBadge>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <SearchField
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onClear={() => setSearch("")}
          placeholder="Search bylaws, resolution numbers, financial years..."
        />

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { id: "ALL", label: "All Archives" },
            { id: "BYLAWS", label: "Bylaws" },
            { id: "AUDIT_FINANCIALS", label: "Audit Reports" },
            { id: "MEETING_MINUTES", label: "AGM / EGM Minutes" },
            { id: "AGREEMENT", label: "Conveyance Title" },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                categoryFilter === cat.id
                  ? "bg-[#1A1A1A] text-white"
                  : "bg-white text-[#6B7280] border border-[#E5E7EB] hover:text-[#1A1A1A]"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Document Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((doc) => (
          <DocumentCard
            key={doc.id}
            document={doc}
            onView={(d) => alert(`Viewing archive metadata: ${d.title}`)}
            onDownload={(d) =>
              alert(`[Prototype Notice] Cloudflare R2 secure presigned link for ${d.title}`)
            }
          />
        ))}
      </div>
    </AppShell>
  );
}
