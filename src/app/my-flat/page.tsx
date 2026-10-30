"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import {
  PageHeader,
  AppCard,
  StatusBadge,
  AppButton,
  Modal,
  IonIcon,
  EmptyState,
} from "@/components/ui";

interface MyFlatData {
  success: boolean;
  hasFlat: boolean;
  message?: string;
  role?: "OWNER" | "TENANT";
  flat?: {
    id: string;
    flatNumber: string;
    floor: number;
    carpetAreaSqFt?: number;
    bhkType?: string;
    shareCertificateNumber?: string;
    wingName: string;
    buildingName?: string;
    societyName: string;
    societyCode: string;
    societyRegistration: string;
    occupancyType: string;
    ownershipType?: string;
  };
  owner?: {
    enrollmentDate: string;
  };
  tenant?: {
    leaseStartDate?: string;
    leaseEndDate?: string;
    enrollmentDate: string;
    status: string;
  };
  verifiedOwner?: {
    name: string;
  };
  tenantSummary?: {
    name: string;
    leaseStartDate?: string;
    leaseEndDate?: string;
    status: string;
    verifiedAt?: string;
  } | null;
  propertyDocuments?: Array<{
    id: string;
    documentId: string;
    displayName: string;
    originalFilename: string;
    category: string;
    onboardingDocType?: string;
    size: number;
    mimeType: string;
    version: number;
    verificationStatus: string;
    viewUrl: string;
    downloadUrl: string;
  }>;
  tenantDocuments?: Array<{
    id: string;
    documentId: string;
    displayName: string;
    originalFilename: string;
    category: string;
    size: number;
    mimeType: string;
    version: number;
    verificationStatus: string;
    viewUrl: string;
    downloadUrl: string;
  }>;
  sharedSocietyDocuments?: Array<{
    id: string;
    documentId: string;
    displayName: string;
    originalFilename: string;
    category: string;
    size: number;
    mimeType: string;
    version: number;
    viewUrl: string;
    downloadUrl: string;
  }>;
  recentRequests?: Array<{
    id: string;
    role: string;
    status: string;
    createdAt: string;
  }>;
}

export default function MyFlatPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<MyFlatData | null>(null);
  const [previewDoc, setPreviewDoc] = useState<{
    displayName: string;
    viewUrl: string;
    mimeType: string;
  } | null>(null);

  useEffect(() => {
    let ignore = false;
    async function loadMyFlat() {
      try {
        const res = await fetch("/api/my-flat");
        const json = await res.json();
        if (!ignore) {
          setData(json);
        }
      } catch (err) {
        console.error("Error loading my flat:", err);
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }
    loadMyFlat();
    return () => {
      ignore = true;
    };
  }, []);

  const isOwner = data?.role === "OWNER";
  const isTenant = data?.role === "TENANT";

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Page Header */}
        <PageHeader
          title={isTenant ? "My Rented Flat" : "My Flat & Property Vault"}
          description={
            isTenant
              ? "Your active lease occupancy, authorized society documents and verified agreements."
              : "Your verified unit property profile, statutory title deeds, and tenant occupancy status."
          }
          badge={isTenant ? "Tenant Resident" : "Property Owner"}
          actions={
            <div className="flex items-center gap-2">
              <Link href="/documents">
                <AppButton variant="outline" size="sm" leftIcon="folder-open-outline">
                  Personal Vault
                </AppButton>
              </Link>
              <Link href="/requests">
                <AppButton variant="primary" size="sm" leftIcon="document-text-outline">
                  New Application
                </AppButton>
              </Link>
            </div>
          }
        />

        {/* Loading State */}
        {loading && (
          <div className="space-y-4 animate-pulse">
            <div className="h-32 bg-white rounded-2xl border border-[#E5E7EB] p-6" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 h-64 bg-white rounded-2xl border border-[#E5E7EB]" />
              <div className="h-64 bg-white rounded-2xl border border-[#E5E7EB]" />
            </div>
          </div>
        )}

        {/* No Flat Association State */}
        {!loading && (!data?.hasFlat || !data?.flat) && (
          <EmptyState
            title="No Active Flat Association Found"
            description="Your account is not currently linked to an approved housing unit in this society. If you recently registered, please check your pending approval status."
            iconName="home-outline"
            action={
              <Link href="/pending-approval">
                <AppButton variant="primary" size="sm">
                  View Registration Approvals
                </AppButton>
              </Link>
            }
          />
        )}

        {/* Verified Flat Profile */}
        {!loading && data?.hasFlat && data.flat && (
          <>
            {/* Overview Banner Card */}
            <AppCard className="p-6 bg-white border border-[#E5E7EB] rounded-2xl shadow-2xs">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1A1A1A] font-heading tracking-tight">
                      Flat {data.flat.flatNumber}
                    </h1>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#EEF2FF] text-[#4F46E5] border border-[#C7D2FE]">
                      {data.flat.wingName} • Floor {data.flat.floor}
                    </span>
                    <StatusBadge variant="success">
                      {isOwner ? "Owner Occupied / Owned" : "Active Tenant"}
                    </StatusBadge>
                  </div>
                  <p className="text-xs text-[#6B7280]">
                    {data.flat.societyName} ({data.flat.societyCode}) • Registration:{" "}
                    {data.flat.societyRegistration}
                  </p>
                </div>

                <div className="text-right text-xs">
                  <span className="text-[#9CA3AF] block mb-0.5">Enrollment Status</span>
                  <span className="font-bold text-[#166534] flex items-center gap-1 md:justify-end">
                    <IonIcon name="checkmark-done-circle" size={16} />
                    Statutory Member Verified
                  </span>
                </div>
              </div>

              {/* Specs Grid */}
              <div className="mt-5 pt-4 border-t border-[#F3F4F6] grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-[#9CA3AF] block mb-0.5">Configuration</span>
                  <span className="font-bold text-[#1A1A1A]">{data.flat.bhkType || "2 BHK"}</span>
                </div>
                <div>
                  <span className="text-[#9CA3AF] block mb-0.5">Carpet Area</span>
                  <span className="font-bold text-[#1A1A1A]">
                    {data.flat.carpetAreaSqFt ? `${data.flat.carpetAreaSqFt} sq ft` : "Registered standard"}
                  </span>
                </div>
                {isOwner && (
                  <div>
                    <span className="text-[#9CA3AF] block mb-0.5">Share Certificate #</span>
                    <span className="font-bold text-[#1A1A1A]">
                      {data.flat.shareCertificateNumber || "Registered on Record"}
                    </span>
                  </div>
                )}
                {isTenant && (
                  <div>
                    <span className="text-[#9CA3AF] block mb-0.5">Verified Owner</span>
                    <span className="font-bold text-[#1A1A1A]">
                      {data.verifiedOwner?.name || "Property Owner"}
                    </span>
                  </div>
                )}
                <div>
                  <span className="text-[#9CA3AF] block mb-0.5">
                    {isOwner ? "Member Enrollment Date" : "Lease Period"}
                  </span>
                  <span className="font-bold text-[#1A1A1A]">
                    {isOwner
                      ? data.owner?.enrollmentDate
                        ? new Date(data.owner.enrollmentDate).toLocaleDateString()
                        : "Verified Member"
                      : data.tenant?.leaseStartDate
                      ? `${new Date(data.tenant.leaseStartDate).toLocaleDateString()} — ${
                          data.tenant.leaseEndDate
                            ? new Date(data.tenant.leaseEndDate).toLocaleDateString()
                            : "Ongoing"
                        }`
                      : "Registered Active Term"}
                  </span>
                </div>
              </div>
            </AppCard>

            {/* Layout: OWNER VIEW */}
            {isOwner && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left 2 Cols: Statutory Documents & Other Property Docs */}
                <div className="lg:col-span-2 space-y-6">
                  <AppCard className="p-5 bg-white border border-[#E5E7EB] rounded-2xl shadow-2xs space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-[#F3F4F6]">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center font-bold">
                          <IonIcon name="ribbon-outline" size={18} />
                        </div>
                        <div>
                          <h2 className="text-base font-bold text-[#1A1A1A] font-heading">
                            Property Documents Vault
                          </h2>
                          <p className="text-[11px] text-[#6B7280]">
                            Share Certificate, Sale Deed, Possession Letter &amp; Registered Property Records
                          </p>
                        </div>
                      </div>
                      <span className="text-xs bg-[#EEF2FF] text-[#4F46E5] font-bold px-2 py-0.5 rounded-full">
                        {(data.propertyDocuments || (data as unknown as { documents?: unknown[] })?.documents)?.length || 0} Files
                      </span>
                    </div>

                    {(data.propertyDocuments && data.propertyDocuments.length > 0) ||
                    ((data as unknown as { documents?: typeof data.propertyDocuments })?.documents &&
                      (data as unknown as { documents?: typeof data.propertyDocuments })!.documents!.length > 0) ? (
                      <div className="space-y-3">
                        {(
                          data.propertyDocuments ||
                          (data as unknown as { documents?: typeof data.propertyDocuments })?.documents ||
                          []
                        ).map((doc) => (
                          <div
                            key={doc.id}
                            className="p-3.5 rounded-xl border border-[#E5E7EB] hover:border-[#C7D2FE] bg-[#F8F9FA] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-white border border-[#E5E7EB] text-[#4F46E5] flex items-center justify-center font-bold shrink-0">
                                <IonIcon
                                  name={
                                    doc.mimeType?.includes("pdf")
                                      ? "document-text-outline"
                                      : "image-outline"
                                  }
                                  size={20}
                                />
                              </div>
                              <div>
                                <p className="font-bold text-[#1A1A1A]">{doc.displayName}</p>
                                <p className="text-[11px] text-[#6B7280]">
                                  {doc.originalFilename} • {(doc.size / 1024).toFixed(1)} KB • v{doc.version}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-center">
                              {doc.verificationStatus === "VERIFIED" ? (
                                <StatusBadge variant="success">Verified</StatusBadge>
                              ) : (
                                <StatusBadge variant="warning">Under Review</StatusBadge>
                              )}

                              <button
                                type="button"
                                onClick={() =>
                                  setPreviewDoc({
                                    displayName: doc.displayName,
                                    viewUrl: doc.viewUrl,
                                    mimeType: doc.mimeType,
                                  })
                                }
                                className="px-2.5 py-1.5 rounded-lg border border-[#E5E7EB] bg-white hover:bg-[#F3F4F6] text-[#4F46E5] font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <IonIcon name="eye-outline" size={14} />
                                <span>View</span>
                              </button>

                              <a
                                href={doc.downloadUrl}
                                download={doc.originalFilename}
                                className="px-2.5 py-1.5 rounded-lg border border-[#E5E7EB] bg-white hover:bg-[#F3F4F6] text-[#1A1A1A] font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <IonIcon name="download-outline" size={14} />
                                <span>Download</span>
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyState
                        title="No Property Documents Uploaded"
                        description="Uploaded onboarding property documents will appear here once submitted."
                        iconName="document-outline"
                      />
                    )}
                  </AppCard>
                </div>

                {/* Right Column: Registered Tenant Summary & Requests */}
                <div className="space-y-6">
                  {/* Tenant Summary (Safe: no private identity documents exposed) */}
                  <AppCard className="p-5 bg-white border border-[#E5E7EB] rounded-2xl shadow-2xs space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-[#F3F4F6]">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-[#F0FDF4] text-[#166534] flex items-center justify-center font-bold">
                          <IonIcon name="key-outline" size={18} />
                        </div>
                        <h2 className="text-base font-bold text-[#1A1A1A] font-heading">
                          Registered Tenant Summary
                        </h2>
                      </div>
                    </div>

                    {data.tenantSummary ? (
                      <div className="space-y-3 text-xs">
                        <div>
                          <span className="text-[#9CA3AF] block mb-0.5">Tenant Name</span>
                          <span className="font-bold text-[#1A1A1A] text-sm">
                            {data.tenantSummary.name}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#9CA3AF] block mb-0.5">Lease Term</span>
                          <span className="font-semibold text-[#1A1A1A]">
                            {data.tenantSummary.leaseStartDate
                              ? `${new Date(data.tenantSummary.leaseStartDate).toLocaleDateString()} — ${
                                  data.tenantSummary.leaseEndDate
                                    ? new Date(data.tenantSummary.leaseEndDate).toLocaleDateString()
                                    : "Ongoing"
                                }`
                              : "Approved Lease"}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#9CA3AF] block mb-0.5">Approval Status</span>
                          <span className="font-semibold text-[#166534] flex items-center gap-1">
                            <IonIcon name="shield-checkmark" size={14} />
                            Dual Approval Verified
                          </span>
                        </div>
                        <p className="text-[10px] text-[#6B7280] italic pt-1 border-t border-[#F3F4F6]">
                          Personal identification documents of tenants remain confidential per digital
                          privacy policies.
                        </p>
                      </div>
                    ) : (
                      <div className="py-4 text-center text-xs text-[#6B7280] space-y-1">
                        <IonIcon name="home-outline" size={24} className="text-[#9CA3AF] mx-auto mb-1" />
                        <p className="font-semibold text-[#1A1A1A]">Self-Occupied Unit</p>
                        <p className="text-[11px]">No active tenant registration is linked to this flat.</p>
                      </div>
                    )}
                  </AppCard>

                  {/* Flat Requests History */}
                  <AppCard className="p-5 bg-white border border-[#E5E7EB] rounded-2xl shadow-2xs space-y-4">
                    <div className="flex items-center gap-2 pb-3 border-b border-[#F3F4F6]">
                      <div className="w-8 h-8 rounded-xl bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center font-bold">
                        <IonIcon name="document-text-outline" size={18} />
                      </div>
                      <h2 className="text-base font-bold text-[#1A1A1A] font-heading">
                        Flat Activity &amp; Requests
                      </h2>
                    </div>

                    {data.recentRequests && data.recentRequests.length > 0 ? (
                      <div className="space-y-2.5 text-xs">
                        {data.recentRequests.map((req) => (
                          <div
                            key={req.id}
                            className="p-3 rounded-xl border border-[#E5E7EB] bg-[#F8F9FA] flex items-center justify-between"
                          >
                            <div>
                              <p className="font-bold text-[#1A1A1A]">{req.role} Registration</p>
                              <p className="text-[10px] text-[#6B7280]">
                                {new Date(req.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-[#E5E7EB] text-[#4F46E5]">
                              {req.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-[#6B7280] italic py-2">
                        No recent requests recorded for this unit.
                      </p>
                    )}
                  </AppCard>
                </div>
              </div>
            )}

            {/* Layout: TENANT VIEW */}
            {isTenant && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left 2 Cols: Tenant Documents & Authorized Shared Society Documents */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Tenant's own documents */}
                  <AppCard className="p-5 bg-white border border-[#E5E7EB] rounded-2xl shadow-2xs space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-[#F3F4F6]">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center font-bold">
                          <IonIcon name="folder-outline" size={18} />
                        </div>
                        <div>
                          <h2 className="text-base font-bold text-[#1A1A1A] font-heading">
                            My Rental Documents
                          </h2>
                          <p className="text-[11px] text-[#6B7280]">
                            Registered Rental Agreement &amp; Move-in Verification
                          </p>
                        </div>
                      </div>
                      <span className="text-xs bg-[#EEF2FF] text-[#4F46E5] font-bold px-2 py-0.5 rounded-full">
                        {data.tenantDocuments?.length || 0} Files
                      </span>
                    </div>

                    {data.tenantDocuments && data.tenantDocuments.length > 0 ? (
                      <div className="space-y-3">
                        {data.tenantDocuments.map((doc) => (
                          <div
                            key={doc.id}
                            className="p-3.5 rounded-xl border border-[#E5E7EB] hover:border-[#C7D2FE] bg-[#F8F9FA] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-white border border-[#E5E7EB] text-[#4F46E5] flex items-center justify-center font-bold shrink-0">
                                <IonIcon name="document-text-outline" size={20} />
                              </div>
                              <div>
                                <p className="font-bold text-[#1A1A1A]">{doc.displayName}</p>
                                <p className="text-[11px] text-[#6B7280]">
                                  {doc.originalFilename} • {(doc.size / 1024).toFixed(1)} KB
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-center">
                              {doc.verificationStatus === "VERIFIED" ? (
                                <StatusBadge variant="success">Verified</StatusBadge>
                              ) : (
                                <StatusBadge variant="warning">Under Review</StatusBadge>
                              )}

                              <button
                                type="button"
                                onClick={() =>
                                  setPreviewDoc({
                                    displayName: doc.displayName,
                                    viewUrl: doc.viewUrl,
                                    mimeType: doc.mimeType,
                                  })
                                }
                                className="px-2.5 py-1.5 rounded-lg border border-[#E5E7EB] bg-white hover:bg-[#F3F4F6] text-[#4F46E5] font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <IonIcon name="eye-outline" size={14} />
                                <span>View</span>
                              </button>

                              <a
                                href={doc.downloadUrl}
                                download={doc.originalFilename}
                                className="px-2.5 py-1.5 rounded-lg border border-[#E5E7EB] bg-white hover:bg-[#F3F4F6] text-[#1A1A1A] font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <IonIcon name="download-outline" size={14} />
                                <span>Download</span>
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyState
                        title="No Lease Documents Uploaded"
                        description="Your uploaded rental agreement appears here."
                        iconName="document-outline"
                      />
                    )}
                  </AppCard>

                  {/* Shared Society Documents for Tenants */}
                  <AppCard className="p-5 bg-white border border-[#E5E7EB] rounded-2xl shadow-2xs space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-[#F3F4F6]">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-[#F0FDF4] text-[#166534] flex items-center justify-center font-bold">
                          <IonIcon name="library-outline" size={18} />
                        </div>
                        <div>
                          <h2 className="text-base font-bold text-[#1A1A1A] font-heading">
                            Authorized Society Documents
                          </h2>
                          <p className="text-[11px] text-[#6B7280]">
                            Bylaws, Clubhouse Rules, Parking Guidelines &amp; Community Notices
                          </p>
                        </div>
                      </div>
                      <span className="text-xs bg-[#F3F4F6] text-[#6B7280] font-bold px-2 py-0.5 rounded-full">
                        {data.sharedSocietyDocuments?.length || 0} Files
                      </span>
                    </div>

                    {data.sharedSocietyDocuments && data.sharedSocietyDocuments.length > 0 ? (
                      <div className="space-y-3">
                        {data.sharedSocietyDocuments.map((doc) => (
                          <div
                            key={doc.id}
                            className="p-3.5 rounded-xl border border-[#E5E7EB] hover:border-[#BBF7D0] bg-[#F8F9FA] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-white border border-[#E5E7EB] text-[#166534] flex items-center justify-center font-bold shrink-0">
                                <IonIcon name="document-text-outline" size={20} />
                              </div>
                              <div>
                                <p className="font-bold text-[#1A1A1A]">{doc.displayName}</p>
                                <p className="text-[11px] text-[#6B7280]">
                                  {doc.category.replace(/_/g, " ")} • {(doc.size / 1024).toFixed(1)} KB
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-center">
                              <button
                                type="button"
                                onClick={() =>
                                  setPreviewDoc({
                                    displayName: doc.displayName,
                                    viewUrl: doc.viewUrl,
                                    mimeType: doc.mimeType,
                                  })
                                }
                                className="px-2.5 py-1.5 rounded-lg border border-[#E5E7EB] bg-white hover:bg-[#F3F4F6] text-[#166534] font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <IonIcon name="eye-outline" size={14} />
                                <span>View</span>
                              </button>

                              <a
                                href={doc.downloadUrl}
                                download={doc.originalFilename}
                                className="px-2.5 py-1.5 rounded-lg border border-[#E5E7EB] bg-white hover:bg-[#F3F4F6] text-[#1A1A1A] font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <IonIcon name="download-outline" size={14} />
                                <span>Download</span>
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-[#6B7280] italic py-2">
                        No public society documents published yet.
                      </p>
                    )}
                  </AppCard>
                </div>

                {/* Right Column: Verified Owner Card & Privacy Shield */}
                <div className="space-y-6">
                  <AppCard className="p-5 bg-white border border-[#E5E7EB] rounded-2xl shadow-2xs space-y-4">
                    <div className="flex items-center gap-2 pb-3 border-b border-[#F3F4F6]">
                      <div className="w-8 h-8 rounded-xl bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center font-bold">
                        <IonIcon name="shield-checkmark-outline" size={18} />
                      </div>
                      <h2 className="text-base font-bold text-[#1A1A1A] font-heading">
                        Verified Ownership
                      </h2>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div>
                        <span className="text-[#9CA3AF] block mb-0.5">Property Owner</span>
                        <span className="font-bold text-[#1A1A1A] text-sm">
                          {data.verifiedOwner?.name || "Verified Society Member"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#9CA3AF] block mb-0.5">Authorization Status</span>
                        <span className="font-semibold text-[#166534] flex items-center gap-1">
                          <IonIcon name="checkmark-circle" size={14} />
                          Owner Authorized &amp; Society Approved
                        </span>
                      </div>
                    </div>

                    <div className="p-3 bg-[#EEF2FF] border border-[#C7D2FE] rounded-xl text-[11px] text-[#4338CA] space-y-1">
                      <div className="flex items-center gap-1 font-bold">
                        <IonIcon name="lock-closed" size={14} />
                        <span>Privacy Protection Active</span>
                      </div>
                      <p className="leading-relaxed">
                        Per SocietyFlow bylaws, statutory property sale deeds and ownership title
                        records remain protected and are accessible solely by the verified property owner
                        and managing committee.
                      </p>
                    </div>
                  </AppCard>
                </div>
              </div>
            )}

            {/* Document Preview Modal */}
            <Modal
              isOpen={!!previewDoc}
              onClose={() => setPreviewDoc(null)}
              title={previewDoc?.displayName || "Document Preview"}
            >
              <div className="space-y-3">
                {previewDoc?.mimeType?.includes("pdf") ? (
                  <iframe
                    src={previewDoc.viewUrl}
                    className="w-full h-[65vh] rounded-xl border border-[#E5E7EB]"
                    title={previewDoc.displayName}
                  />
                ) : (
                  <div className="max-h-[65vh] overflow-auto flex items-center justify-center p-2 bg-[#F8F9FA] rounded-xl border border-[#E5E7EB]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previewDoc?.viewUrl}
                      alt={previewDoc?.displayName}
                      className="max-w-full max-h-[60vh] object-contain rounded-lg"
                    />
                  </div>
                )}
                <div className="flex justify-between items-center text-xs pt-2">
                  <span className="text-[#6B7280]">
                    Powered by Cloudflare R2 Secure Object Vault
                  </span>
                  <a
                    href={previewDoc?.viewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#4F46E5] font-bold hover:underline flex items-center gap-1"
                  >
                    Open in New Window <IonIcon name="open-outline" size={12} />
                  </a>
                </div>
              </div>
            </Modal>
          </>
        )}
      </div>
    </AppShell>
  );
}
