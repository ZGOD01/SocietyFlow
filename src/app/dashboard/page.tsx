"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { AppShell } from "@/components/layout/AppShell";
import {
  StatCard,
  DocumentCard,
  AppCard,
  StatusBadge,
  IconContainer,
  AppButton,
  Modal,
  IonIcon,
} from "@/components/ui";
import { DocumentRecord } from "@/types";

// Demonstrative Owner documents
const OWNER_DOCUMENTS: DocumentRecord[] = [
  {
    id: "doc-owner-1",
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
    id: "doc-owner-2",
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
    id: "doc-owner-3",
    societyId: "soc-greenwood",
    flatId: "flat-c402",
    title: "Property_Tax_Assessment_Receipt_2024.pdf",
    category: "UTILITY_SANCTION",
    fileKey: "vault/c402/property_tax_2024.pdf",
    fileSize: 920000,
    mimeType: "application/pdf",
    uploadedBy: {
      userId: "usr-priya",
      userName: "Priya Mehta",
      userRole: "RESIDENT_OWNER",
    },
    status: "APPROVED",
    isSocietyPublic: false,
    version: 1,
    tags: ["PMC", "Property Tax", "Challan"],
    createdAt: "2024-04-10T11:20:00Z",
    updatedAt: "2024-04-10T11:20:00Z",
  },
];

// Demonstrative Tenant documents
const TENANT_DOCUMENTS: DocumentRecord[] = [
  {
    id: "doc-tenant-1",
    societyId: "soc-greenwood",
    flatId: "flat-b201",
    title: "Registered_Leave_License_Agreement_B201.pdf",
    category: "AGREEMENT",
    fileKey: "vault/b201/leave_license.pdf",
    fileSize: 3200000,
    mimeType: "application/pdf",
    uploadedBy: {
      userId: "usr-rahul",
      userName: "Rahul Joshi",
      userRole: "TENANT",
    },
    status: "VERIFIED",
    isSocietyPublic: false,
    version: 1,
    tags: ["Tenancy", "IGR Maharashtra", "11 Months"],
    createdAt: "2024-01-05T09:00:00Z",
    updatedAt: "2024-01-05T09:00:00Z",
    verifiedAt: "2024-01-07T16:00:00Z",
  },
  {
    id: "doc-tenant-2",
    societyId: "soc-greenwood",
    flatId: "flat-b201",
    title: "Police_Verification_Acknowledgement_Slip.pdf",
    category: "IDENTITY_VERIFICATION",
    fileKey: "vault/b201/police_verification.pdf",
    fileSize: 1100000,
    mimeType: "application/pdf",
    uploadedBy: {
      userId: "usr-rahul",
      userName: "Rahul Joshi",
      userRole: "TENANT",
    },
    status: "VERIFIED",
    isSocietyPublic: false,
    version: 1,
    tags: ["Police Verification", "Chaturshrungi PS", "Cleared"],
    createdAt: "2024-01-10T14:30:00Z",
    updatedAt: "2024-01-10T14:30:00Z",
  },
  {
    id: "doc-tenant-3",
    societyId: "soc-greenwood",
    flatId: "flat-b201",
    title: "Society_Move_In_Permission_NOC.pdf",
    category: "NOC_CERTIFICATE",
    fileKey: "vault/b201/move_in_noc.pdf",
    fileSize: 740000,
    mimeType: "application/pdf",
    uploadedBy: {
      userId: "usr-secretary",
      userName: "Managing Committee",
      userRole: "SOCIETY_ADMIN",
    },
    status: "APPROVED",
    isSocietyPublic: false,
    version: 1,
    tags: ["Move In", "Committee Signoff", "Deposit Paid"],
    createdAt: "2024-01-12T10:15:00Z",
    updatedAt: "2024-01-12T10:15:00Z",
  },
];

function DashboardContent() {
  const searchParams = useSearchParams();
  const initialView = searchParams.get("view") === "tenant" ? "tenant" : "owner";
  const [activeTab, setActiveTab] = useState<"owner" | "tenant">(initialView);
  const [selectedDoc, setSelectedDoc] = useState<DocumentRecord | null>(null);

  const isTenant = activeTab === "tenant";

  return (
    <AppShell>
      {/* Header and View Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {isTenant ? "Tenant Resident Portal" : "Property Owner Console"}
            </span>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
              {isTenant ? "Flat B-201" : "Flat C-402"}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading tracking-tight">
            {isTenant ? "Tenant Vault & Services" : "Owner Overview & Unit Vault"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Greenwood Residency CHS Ltd. • Registration No: PNA/PNA(1)/HSG/(TC)/14902/2019
          </p>
        </div>

        {/* Dynamic Role View Selector with Framer Motion layoutId */}
        <div className="flex items-center p-1.5 bg-white/90 backdrop-blur-md border border-slate-200 rounded-full self-start sm:self-auto shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveTab("owner")}
            className={`relative px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              !isTenant ? "text-white" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            {!isTenant && (
              <motion.div
                layoutId="dashboardTabIndicator"
                className="absolute inset-0 bg-slate-900 rounded-full shadow-xs"
                transition={{ type: "spring", stiffness: 450, damping: 32 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              <IonIcon name="home-outline" size={14} />
              <span>Owner View</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("tenant")}
            className={`relative px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              isTenant ? "text-white" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            {isTenant && (
              <motion.div
                layoutId="dashboardTabIndicator"
                className="absolute inset-0 bg-indigo-600 rounded-full shadow-xs"
                transition={{ type: "spring", stiffness: 450, damping: 32 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              <IonIcon name="key-outline" size={14} />
              <span>Tenant View</span>
            </span>
          </button>
        </div>
      </div>

      {/* Role Verification & Scoping Alert */}
      <AnimatePresence mode="wait">
        {isTenant ? (
          <motion.div
            key="tenant-alert"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="mb-6 p-4 rounded-2xl border border-sky-200/90 bg-sky-50/80 text-xs text-sky-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 backdrop-blur-xs shadow-2xs"
          >
            <div className="flex items-center gap-2.5">
              <IconContainer name="key-outline" variant="info" size="sm" />
              <div>
                <span className="font-bold">Active Tenancy Clearance:</span> Flat B-201 tenancy
                authorized by registered owner <span className="font-semibold text-slate-900">Rajesh S. Joshi</span>.
                Police verification acknowledged by managing committee.
              </div>
            </div>
            <StatusBadge variant="info" size="sm" dot pulse>
              Lease Active: Dec 2025
            </StatusBadge>
          </motion.div>
        ) : (
          <motion.div
            key="owner-alert"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="mb-6 p-4 rounded-2xl border border-emerald-200/90 bg-emerald-50/80 text-xs text-emerald-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 backdrop-blur-xs shadow-2xs"
          >
            <div className="flex items-center gap-2.5">
              <IconContainer name="shield-checkmark-outline" variant="success" size="sm" />
              <div>
                <span className="font-bold">Verified Title Ownership:</span> Priya Mehta holds registered
                ownership for Flat C-402 with 5 fully paid society shares (Certificate #042).
              </div>
            </div>
            <StatusBadge variant="success" size="sm" dot pulse>
              Title Verified
            </StatusBadge>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label={isTenant ? "Rental Documents" : "Personal Vault"}
          value={isTenant ? "3 Files" : "8 Files"}
          subtitle={isTenant ? "Agreement & Police Slip" : "Sale Deed & Share Cert"}
          iconName={isTenant ? "key-outline" : "folder-open-outline"}
          iconVariant="hero-soft"
          badgeText="Verified"
          badgeVariant="success"
        />
        <StatCard
          label="Society Library"
          value="240 Docs"
          subtitle="Bylaws, Rules, Notices"
          iconName="library-outline"
          iconVariant="info"
        />
        <StatCard
          label={isTenant ? "My Service Requests" : "Pending Approvals"}
          value={isTenant ? "1 Active" : "3"}
          subtitle={isTenant ? "Parking Pass in Review" : "1 Resale NOC pending"}
          iconName={isTenant ? "document-text-outline" : "checkmark-done-circle-outline"}
          iconVariant="warning"
          badgeText={isTenant ? "In Review" : "Action"}
          badgeVariant="warning"
        />
        <StatCard
          label={isTenant ? "Tenancy Period" : "Property Registry"}
          value={isTenant ? "11 Months" : "216 Units"}
          subtitle={isTenant ? "Expires: 31 Dec 2025" : "Wings A, B, C, D, E"}
          iconName="business-outline"
          iconVariant="neutral"
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 spans): Documents */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 font-heading">
                {isTenant ? "Tenant Vault Documents" : "Verified Vault & Property Records"}
              </h2>
              <p className="text-xs text-slate-500">
                {isTenant
                  ? "Access your registered rental agreement and move-in clearance"
                  : "Tamper-resistant property title deeds and share certificates"}
              </p>
            </div>
            <Link
              href="/documents"
              className="text-xs font-semibold text-indigo-600 hover:underline"
            >
              View All Vault →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(isTenant ? TENANT_DOCUMENTS : OWNER_DOCUMENTS).map((doc) => (
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

          {/* Role specific quick action notice */}
          {isTenant ? (
            <div className="p-5 rounded-2xl border border-slate-200/80 bg-white/90 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-3">
                <IconContainer name="person-outline" variant="hero-soft" size="sm" />
                <div>
                  <p className="text-xs font-bold text-slate-900">
                    Registered Landlord Contact
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Rajesh S. Joshi (Owner Unit B-201) • Phone: +91 98220 98765
                  </p>
                </div>
              </div>
              <AppButton
                variant="outline"
                size="sm"
                onClick={() =>
                  alert("[Tenant Action] Direct messaging with registered flat owner opens in Prompt 3.")
                }
              >
                Message Owner
              </AppButton>
            </div>
          ) : (
            <div className="p-5 rounded-2xl border border-slate-200/80 bg-white/90 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-3">
                <IconContainer name="shield-outline" variant="hero-soft" size="sm" />
                <div>
                  <p className="text-xs font-bold text-slate-900">
                    Bank-Ready Mortgage / Resale Package
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Generate one-click verified bundle for SBI, HDFC, or ICICI Home Loans.
                  </p>
                </div>
              </div>
              <Link href="/requests">
                <AppButton variant="outline" size="sm">
                  Apply for NOC
                </AppButton>
              </Link>
            </div>
          )}
        </div>

        {/* Right Column (1 span): Workflow & Role-Specific Information */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 font-heading">
              {isTenant ? "Tenant Requests" : "Approval Pipeline"}
            </h2>
            <Link
              href="/requests"
              className="text-xs font-semibold text-indigo-600 hover:underline"
            >
              All Requests →
            </Link>
          </div>

          <AppCard className="p-6 bg-white/90 backdrop-blur-md border border-slate-200/80 shadow-md space-y-4">
            {isTenant ? (
              /* Tenant Request Items */
              <div className="space-y-3.5">
                <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">
                      Four-Wheeler Parking Pass
                    </span>
                    <StatusBadge variant="warning" size="sm" dot>
                      Under Review
                    </StatusBadge>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Slot #B-201 • Slot Allocation Comm.
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200/60">
                    <span>Vehicle: MH-12-DE-4412</span>
                    <span className="text-amber-600 font-medium">Sec. Review</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">
                      Move-In NOC Authorization
                    </span>
                    <StatusBadge variant="success" size="sm" dot>
                      Cleared
                    </StatusBadge>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Security deposit acknowledged
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200/60">
                    <span>Issued 08 Jan 2024</span>
                    <span className="text-emerald-600 font-medium">Approved</span>
                  </div>
                </div>

                <div className="pt-2">
                  <Link href="/requests" className="block w-full">
                    <AppButton variant="gradient" size="sm" className="w-full" pill={false}>
                      Raise Tenant Request / Service
                    </AppButton>
                  </Link>
                </div>
              </div>
            ) : (
              /* Owner Request Items */
              <div className="space-y-3.5">
                <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">NOC: Resale Flat C-402</span>
                    <StatusBadge variant="warning" size="sm" dot>
                      In Committee
                    </StatusBadge>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Buyer: Vikram Patil • Bank: SBI Home Loans
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200/60">
                    <span>Signatures: 2 of 3</span>
                    <span className="text-amber-600 font-medium">Sec. Review</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">Renovation: Balcony Grill</span>
                    <StatusBadge variant="success" size="sm" dot>
                      Approved
                    </StatusBadge>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Flat C-402 • Architecture Guideline Met
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200/60">
                    <span>Signed by Chairman</span>
                    <span className="text-emerald-600 font-medium">Completed</span>
                  </div>
                </div>

                <div className="pt-2">
                  <Link href="/requests" className="block w-full">
                    <AppButton variant="secondary" size="sm" className="w-full" pill={false}>
                      Submit New Society Application
                    </AppButton>
                  </Link>
                </div>
              </div>
            )}
          </AppCard>

          {/* Statutory Scope Disclaimer */}
          <AppCard className="p-5 bg-slate-50/80 border border-slate-200/80 text-xs text-slate-600 space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold">
              <IconContainer name="lock-closed-outline" variant="neutral" size="sm" />
              <span>{isTenant ? "Tenant Access Boundary" : "Owner Governance Rights"}</span>
            </div>
            <p className="leading-relaxed">
              {isTenant
                ? "Statutory AGM voting rights, share capital ledgers, and property transfer NOCs are strictly restricted to registered unit owners under Maharashtra Cooperative Societies Act rules."
                : "Owner profiles hold full legal rights to participate in AGMs, inspect society audit statements, and nominate beneficiaries for share certificate transmission."}
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
          <div className="flex items-center justify-end gap-2 w-full">
            <AppButton variant="outline" size="sm" onClick={() => setSelectedDoc(null)}>
              Close
            </AppButton>
            <AppButton
              variant="gradient"
              size="sm"
              leftIcon="download-outline"
              onClick={() => {
                alert("Simulating Cloudflare R2 presigned download stream.");
                setSelectedDoc(null);
              }}
            >
              Download PDF
            </AppButton>
          </div>
        }
      >
        {selectedDoc && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Document ID:</span>
                <span className="font-mono text-slate-900 font-semibold">{selectedDoc.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Mime Type:</span>
                <span className="text-slate-900">{selectedDoc.mimeType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Storage Key:</span>
                <span className="font-mono text-indigo-600 truncate max-w-[200px]">
                  {selectedDoc.fileKey}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Security Level:</span>
                <span className="font-semibold text-slate-900">
                  {selectedDoc.isSocietyPublic ? "Public Society Notice" : "Confidential Unit Record"}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {selectedDoc.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100 text-[11px]"
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

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center text-xs text-slate-500">
          Loading SocietyFlow Console...
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
