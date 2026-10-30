"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import {
  AppCard,
  StatusBadge,
  AppButton,
  Modal,
  IonIcon,
  FormField,
  EmptyState,
} from "@/components/ui";

interface FlatProfileData {
  flat: {
    id: string;
    flatNumber: string;
    floor: number;
    carpetAreaSqFt?: number;
    bhkType?: string;
    shareCertificateNumber?: string;
    defaultOccupancyType: string;
    isActive: boolean;
    status: string;
    society?: {
      id: string;
      name: string;
      code: string;
      registrationNumber: string;
      address?: string;
    };
    societyName?: string;
    societyCode?: string;
    societyRegistration?: string;
    building?: { id: string; name: string };
    wing?: { id: string; name: string };
    wingName?: string;
    createdAt: string;
  };
  owner: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    ownershipType?: string;
    enrollmentDate: string;
    approvalStatus: string;
    verifiedAt?: string;
  } | null;
  tenant: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    leaseStartDate?: string;
    leaseEndDate?: string;
    occupancyStatus: string;
    ownerName?: string;
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
    correctionNote?: string;
    uploadedBy?: { name?: string; email?: string };
    createdAt: string;
    viewUrl: string;
    downloadUrl: string;
  }>;
  documents?: Array<any>;
  activityTimeline?: Array<{
    id: string;
    action: string;
    description: string;
    actorName: string;
    timestamp: string;
    type?: "REGISTRATION" | "AUDIT";
  }>;
  timeline?: Array<any>;
  associatedRequests?: Array<{
    id: string;
    role: string;
    status: string;
    createdAt: string;
    applicantName?: string;
  }>;
  requests?: Array<any>;
}

function FlatDetailContent() {
  const params = useParams();
  const flatId = params?.flatId as string;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<FlatProfileData | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Edit Flat Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editFlatNumber, setEditFlatNumber] = useState("");
  const [editFloor, setEditFloor] = useState<number>(1);
  const [editBhk, setEditBhk] = useState("");
  const [editArea, setEditArea] = useState<number | undefined>(undefined);
  const [editShareCert, setEditShareCert] = useState("");
  const [editOccupancy, setEditOccupancy] = useState("VACANT");
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Deactivate Modal
  const [deactivateModalOpen, setDeactivateModalOpen] = useState(false);
  const [deactivateReason, setDeactivateReason] = useState("");
  const [isDeactivating, setIsDeactivating] = useState(false);

  // Document Preview Modal
  const [previewDoc, setPreviewDoc] = useState<{
    displayName: string;
    viewUrl: string;
    mimeType: string;
  } | null>(null);

  const fetchFlatProfile = async () => {
    if (!flatId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/management/flats/${flatId}`);
      const json = await res.json();
      if (res.ok) {
        setData(json);
        setEditFlatNumber(json.flat.flatNumber);
        setEditFloor(json.flat.floor);
        setEditBhk(json.flat.bhkType || "2 BHK");
        setEditArea(json.flat.carpetAreaSqFt);
        setEditShareCert(json.flat.shareCertificateNumber || "");
        setEditOccupancy(json.flat.defaultOccupancyType || "VACANT");
      } else {
        setFeedback({ type: "error", text: json.error || "Failed to load flat dossier" });
      }
    } catch {
      setFeedback({ type: "error", text: "Network error loading flat profile" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    async function loadFlat() {
      if (!flatId) return;
      try {
        const res = await fetch(`/api/management/flats/${flatId}`);
        const json = await res.json();
        if (!ignore) {
          if (res.ok) {
            setData(json);
            setEditFlatNumber(json.flat.flatNumber);
            setEditFloor(json.flat.floor);
            setEditBhk(json.flat.bhkType || "2 BHK");
            setEditArea(json.flat.carpetAreaSqFt);
            setEditShareCert(json.flat.shareCertificateNumber || "");
            setEditOccupancy(json.flat.defaultOccupancyType || "VACANT");
          } else {
            setFeedback({ type: "error", text: json.error || "Failed to load flat dossier" });
          }
        }
      } catch {
        if (!ignore) {
          setFeedback({ type: "error", text: "Network error loading flat profile" });
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }
    loadFlat();
    return () => {
      ignore = true;
    };
  }, [flatId]);

  const handleUpdateFlat = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmittingEdit(true);
      const res = await fetch(`/api/management/flats/${flatId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flatNumber: editFlatNumber.trim().toUpperCase(),
          floor: Number(editFloor),
          bhkType: editBhk,
          carpetAreaSqFt: editArea ? Number(editArea) : undefined,
          shareCertificateNumber: editShareCert.trim() || undefined,
          defaultOccupancyType: editOccupancy,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to update flat");

      setFeedback({ type: "success", text: "Flat details updated successfully." });
      setEditModalOpen(false);
      fetchFlatProfile();
    } catch (err: unknown) {
      setFeedback({ type: "error", text: err instanceof Error ? err.message : "Error updating flat" });
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleDeactivate = async () => {
    try {
      setIsDeactivating(true);
      const res = await fetch(`/api/management/flats/${flatId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isActive: false,
          deactivationReason: deactivateReason.trim() || "Administrative deactivation",
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to deactivate flat");

      setFeedback({ type: "success", text: "Flat status updated to INACTIVE." });
      setDeactivateModalOpen(false);
      fetchFlatProfile();
    } catch (err: unknown) {
      setFeedback({ type: "error", text: err instanceof Error ? err.message : "Error deactivating flat" });
    } finally {
      setIsDeactivating(false);
    }
  };

  const isOccupied = !!data?.owner || !!data?.tenant;
  const propertyDocs: NonNullable<FlatProfileData["propertyDocuments"]> =
    data?.propertyDocuments || (data as any)?.documents || [];
  const activityTimeline: NonNullable<FlatProfileData["activityTimeline"]> =
    data?.activityTimeline || (data as any)?.timeline || [];
  const associatedRequests: NonNullable<FlatProfileData["associatedRequests"]> =
    data?.associatedRequests || (data as any)?.requests || [];
  const societyName = data?.flat?.society?.name || (data?.flat as any)?.societyName || "Registered Society";
  const societyCode = data?.flat?.society?.code || (data?.flat as any)?.societyCode || "DEFAULT";
  const societyReg = data?.flat?.society?.registrationNumber || (data?.flat as any)?.societyRegistration || "Pending";
  const wingName = data?.flat?.wing?.name || (data?.flat as any)?.wingName || "Wing A";

  return (
    <div className="space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-semibold text-[#6B7280]">
          <Link href="/management/flats" className="hover:text-[#4F46E5] flex items-center gap-1">
            <IonIcon name="arrow-back-outline" size={14} />
            <span>Flats Directory</span>
          </Link>
          <span className="text-[#9CA3AF]">/</span>
          <span className="text-[#1A1A1A] font-bold">
            Unit {data?.flat.flatNumber || "Details"}
          </span>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-4 rounded-xl border flex items-center justify-between text-sm ${
              feedback.type === "success"
                ? "bg-[#F0FDF4] border-[#BBF7D0] text-[#166534]"
                : "bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]"
            }`}
          >
            <div className="flex items-center gap-2">
              <IonIcon
                name={feedback.type === "success" ? "checkmark-circle" : "alert-circle"}
                size={20}
              />
              <span className="font-semibold">{feedback.text}</span>
            </div>
            <button
              onClick={() => setFeedback(null)}
              className="text-xs font-bold hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="space-y-4 animate-pulse">
            <div className="h-28 bg-white rounded-2xl border border-[#E5E7EB] p-6" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-4">
                <div className="h-64 bg-white rounded-2xl border border-[#E5E7EB]" />
                <div className="h-64 bg-white rounded-2xl border border-[#E5E7EB]" />
              </div>
              <div className="h-96 bg-white rounded-2xl border border-[#E5E7EB]" />
            </div>
          </div>
        )}

        {/* Page Content */}
        {!loading && data && (
          <>
            {/* Top Overview Banner Card */}
            <AppCard className="p-6 bg-white border border-[#E5E7EB] shadow-2xs rounded-2xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1A1A1A] font-heading tracking-tight">
                      Flat {data.flat.flatNumber}
                    </h1>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#EEF2FF] text-[#4F46E5] border border-[#C7D2FE]">
                      {wingName} • Floor {data.flat.floor ?? 1}
                    </span>
                    {!data.flat.isActive && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#FEF2F2] text-[#991B1B] border border-[#FECACA]">
                        Inactive Unit
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#6B7280]">
                    {societyName} ({societyCode}) • Reg: {societyReg}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <AppButton
                    variant="outline"
                    size="sm"
                    leftIcon="create-outline"
                    onClick={() => setEditModalOpen(true)}
                  >
                    Edit Flat Details
                  </AppButton>
                  {data.flat.isActive && (
                    <AppButton
                      variant="ghost"
                      size="sm"
                      leftIcon="trash-outline"
                      className="text-[#E11D48] hover:bg-[#FFF1F2]"
                      onClick={() => setDeactivateModalOpen(true)}
                    >
                      Deactivate Unit
                    </AppButton>
                  )}
                </div>
              </div>

              {/* Quick Spec Pills */}
              <div className="mt-5 pt-4 border-t border-[#F3F4F6] grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-[#9CA3AF] block mb-0.5">Configuration</span>
                  <span className="font-bold text-[#1A1A1A]">{data.flat.bhkType || "2 BHK"}</span>
                </div>
                <div>
                  <span className="text-[#9CA3AF] block mb-0.5">Carpet Area</span>
                  <span className="font-bold text-[#1A1A1A]">
                    {data.flat.carpetAreaSqFt ? `${data.flat.carpetAreaSqFt} sq ft` : "Not registered"}
                  </span>
                </div>
                <div>
                  <span className="text-[#9CA3AF] block mb-0.5">Share Certificate</span>
                  <span className="font-bold text-[#1A1A1A]">
                    {data.flat.shareCertificateNumber || "Pending Issuance"}
                  </span>
                </div>
                <div>
                  <span className="text-[#9CA3AF] block mb-0.5">Occupancy Status</span>
                  {data.tenant ? (
                    <StatusBadge variant="info">Tenant Occupied</StatusBadge>
                  ) : data.owner ? (
                    <StatusBadge variant="success">Owner Occupied</StatusBadge>
                  ) : (
                    <StatusBadge variant="warning">Vacant</StatusBadge>
                  )}
                </div>
              </div>
            </AppCard>

            {/* Main Content 2-Column Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Owner, Tenant, and Property Documents */}
              <div className="lg:col-span-2 space-y-6">
                {/* 1. Registered Owner Details */}
                <AppCard className="p-5 bg-white border border-[#E5E7EB] rounded-2xl shadow-2xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[#F3F4F6]">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center font-bold">
                        <IonIcon name="person-outline" size={18} />
                      </div>
                      <h2 className="text-base font-bold text-[#1A1A1A] font-heading">
                        Registered Property Owner
                      </h2>
                    </div>
                    {data.owner ? (
                      <StatusBadge variant="success">Verified Owner</StatusBadge>
                    ) : (
                      <span className="text-xs bg-[#F3F4F6] text-[#6B7280] font-semibold px-2.5 py-1 rounded-full border border-[#E5E7EB]">
                        No Registered Owner
                      </span>
                    )}
                  </div>

                  {data.owner ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-[#9CA3AF] block mb-0.5">Full Legal Name</span>
                        <span className="font-bold text-[#1A1A1A] text-sm">{data.owner.name}</span>
                      </div>
                      <div>
                        <span className="text-[#9CA3AF] block mb-0.5">Contact Email</span>
                        <span className="font-semibold text-[#1A1A1A]">{data.owner.email}</span>
                      </div>
                      <div>
                        <span className="text-[#9CA3AF] block mb-0.5">Contact Phone</span>
                        <span className="font-semibold text-[#1A1A1A]">
                          {data.owner.phone || "Not provided"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#9CA3AF] block mb-0.5">Ownership Title</span>
                        <span className="font-semibold text-[#1A1A1A]">
                          {data.owner.ownershipType || "Sole Owner"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#9CA3AF] block mb-0.5">Enrollment Date</span>
                        <span className="font-semibold text-[#1A1A1A]">
                          {new Date(data.owner.enrollmentDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#9CA3AF] block mb-0.5">Approval Date</span>
                        <span className="font-semibold text-[#1A1A1A]">
                          {data.owner.verifiedAt
                            ? new Date(data.owner.verifiedAt).toLocaleDateString()
                            : "Approved"}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-[#6B7280] italic py-2">
                      No active property owner linked to this flat. Owners can register and upload
                      onboarding documents for committee verification.
                    </p>
                  )}
                </AppCard>

                {/* 2. Tenant Occupancy Details */}
                <AppCard className="p-5 bg-white border border-[#E5E7EB] rounded-2xl shadow-2xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[#F3F4F6]">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-[#F0FDF4] text-[#166534] flex items-center justify-center font-bold">
                        <IonIcon name="key-outline" size={18} />
                      </div>
                      <h2 className="text-base font-bold text-[#1A1A1A] font-heading">
                        Tenant Occupancy Status
                      </h2>
                    </div>
                    {data.tenant ? (
                      <StatusBadge variant="info">Active Lease</StatusBadge>
                    ) : (
                      <span className="text-xs bg-[#F3F4F6] text-[#6B7280] font-semibold px-2.5 py-1 rounded-full border border-[#E5E7EB]">
                        No Active Tenant
                      </span>
                    )}
                  </div>

                  {data.tenant ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-[#9CA3AF] block mb-0.5">Tenant Name</span>
                        <span className="font-bold text-[#1A1A1A] text-sm">{data.tenant.name}</span>
                      </div>
                      <div>
                        <span className="text-[#9CA3AF] block mb-0.5">Contact Email</span>
                        <span className="font-semibold text-[#1A1A1A]">{data.tenant.email}</span>
                      </div>
                      <div>
                        <span className="text-[#9CA3AF] block mb-0.5">Contact Phone</span>
                        <span className="font-semibold text-[#1A1A1A]">
                          {data.tenant.phone || "Not provided"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#9CA3AF] block mb-0.5">Authorized By Owner</span>
                        <span className="font-semibold text-[#166534] flex items-center gap-1">
                          <IonIcon name="checkmark-circle" size={14} />
                          {data.tenant.ownerName || "Owner Authorized"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#9CA3AF] block mb-0.5">Lease Term</span>
                        <span className="font-semibold text-[#1A1A1A]">
                          {data.tenant.leaseStartDate
                            ? `${new Date(data.tenant.leaseStartDate).toLocaleDateString()} — ${
                                data.tenant.leaseEndDate
                                  ? new Date(data.tenant.leaseEndDate).toLocaleDateString()
                                  : "Ongoing"
                              }`
                            : "Standard Registered Agreement"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#9CA3AF] block mb-0.5">Society Approval</span>
                        <span className="font-semibold text-[#166534] flex items-center gap-1">
                          <IonIcon name="shield-checkmark" size={14} />
                          Dual Approval Completed
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-[#6B7280] italic py-2">
                      This unit currently has no active tenant occupancy recorded.
                    </p>
                  )}
                </AppCard>

                {/* 3. Property Documents Vault (Real Cloudflare R2 + MongoDB) */}
                <AppCard className="p-5 bg-white border border-[#E5E7EB] rounded-2xl shadow-2xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[#F3F4F6]">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center font-bold">
                        <IonIcon name="folder-outline" size={18} />
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-[#1A1A1A] font-heading">
                          Property Documents Vault
                        </h2>
                        <p className="text-[11px] text-[#6B7280]">
                          Sale Deed, Share Certificate &amp; Statutory Property Records
                        </p>
                      </div>
                    </div>
                    <span className="text-xs bg-[#F3F4F6] text-[#6B7280] font-bold px-2 py-0.5 rounded-full">
                      {propertyDocs.length} Documents
                    </span>
                  </div>

                  {propertyDocs.length > 0 ? (
                    <div className="space-y-3">
                      {propertyDocs.map((doc) => (
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
                            ) : doc.verificationStatus === "REJECTED" ? (
                              <StatusBadge variant="error">Needs Correction</StatusBadge>
                            ) : (
                              <StatusBadge variant="warning">Under Review</StatusBadge>
                            )}

                            {/* View Button */}
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

                            {/* Download Button */}
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
                      description="Property documents uploaded during owner registration or onboarding appear here automatically."
                      iconName="document-outline"
                    />
                  )}
                </AppCard>
              </div>

              {/* Right Column: Flat Activity Timeline & Associated Requests */}
              <div className="space-y-6">
                {/* Flat Activity Timeline */}
                <AppCard className="p-5 bg-white border border-[#E5E7EB] rounded-2xl shadow-2xs space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-[#F3F4F6]">
                    <div className="w-8 h-8 rounded-xl bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center font-bold">
                      <IonIcon name="time-outline" size={18} />
                    </div>
                    <h2 className="text-base font-bold text-[#1A1A1A] font-heading">
                      Flat Activity Audit
                    </h2>
                  </div>

                  {activityTimeline.length > 0 ? (
                    <div className="space-y-4">
                      {activityTimeline.map((item, index) => (
                        <div key={item.id || index} className="flex gap-3 text-xs">
                          <div className="flex flex-col items-center">
                            <div className="w-6 h-6 rounded-full bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center font-bold shrink-0">
                              <IonIcon name="checkmark-circle-outline" size={14} />
                            </div>
                            {index < activityTimeline.length - 1 && (
                              <div className="w-0.5 flex-1 bg-[#E5E7EB] my-1" />
                            )}
                          </div>
                          <div className="space-y-0.5 pb-2">
                            <p className="font-bold text-[#1A1A1A]">{item.description}</p>
                            <p className="text-[11px] text-[#6B7280]">
                              By <span className="font-semibold text-[#1A1A1A]">{item.actorName}</span> •{" "}
                              {new Date(item.timestamp).toLocaleString([], {
                                dateStyle: "short",
                                timeStyle: "short",
                              })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#6B7280] italic py-2">
                      No activity logs recorded for this flat yet.
                    </p>
                  )}
                </AppCard>

                {/* Associated Requests */}
                <AppCard className="p-5 bg-white border border-[#E5E7EB] rounded-2xl shadow-2xs space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-[#F3F4F6]">
                    <div className="w-8 h-8 rounded-xl bg-[#F0FDF4] text-[#166534] flex items-center justify-center font-bold">
                      <IonIcon name="document-text-outline" size={18} />
                    </div>
                    <h2 className="text-base font-bold text-[#1A1A1A] font-heading">
                      Registration Requests
                    </h2>
                  </div>

                  {associatedRequests.length > 0 ? (
                    <div className="space-y-2.5">
                      {associatedRequests.map((req) => (
                        <div
                          key={req.id}
                          className="p-3 rounded-xl border border-[#E5E7EB] bg-[#F8F9FA] text-xs flex items-center justify-between"
                        >
                          <div>
                            <p className="font-bold text-[#1A1A1A]">
                              {req.role} Registration
                            </p>
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
                      No pending or past registration requests.
                    </p>
                  )}
                </AppCard>
              </div>
            </div>

            {/* Modal: Edit Flat Details */}
            <Modal
              isOpen={editModalOpen}
              onClose={() => setEditModalOpen(false)}
              title={`Edit Flat ${data.flat.flatNumber}`}
            >
              <form onSubmit={handleUpdateFlat} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Flat Identifier *" id="edit-flat-num" required>
                    <input
                      type="text"
                      value={editFlatNumber}
                      onChange={(e) => setEditFlatNumber(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] bg-white text-xs font-bold uppercase"
                    />
                  </FormField>

                  <FormField label="Floor Number *" id="edit-floor-num" required>
                    <input
                      type="number"
                      min="0"
                      max="150"
                      value={editFloor}
                      onChange={(e) => setEditFloor(Number(e.target.value))}
                      required
                      className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] bg-white text-xs font-bold"
                    />
                  </FormField>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <FormField label="BHK Configuration" id="edit-bhk">
                    <select
                      value={editBhk}
                      onChange={(e) => setEditBhk(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] bg-white text-xs font-semibold"
                    >
                      <option value="1 RK">1 RK</option>
                      <option value="1 BHK">1 BHK</option>
                      <option value="2 BHK">2 BHK</option>
                      <option value="2.5 BHK">2.5 BHK</option>
                      <option value="3 BHK">3 BHK</option>
                      <option value="4 BHK">4 BHK</option>
                      <option value="Penthouse">Penthouse</option>
                      <option value="Commercial Shop">Commercial Shop</option>
                    </select>
                  </FormField>

                  <FormField label="Carpet Area (sq ft)" id="edit-area">
                    <input
                      type="number"
                      value={editArea ?? ""}
                      onChange={(e) =>
                        setEditArea(e.target.value ? Number(e.target.value) : undefined)
                      }
                      className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] bg-white text-xs"
                    />
                  </FormField>
                </div>

                <FormField label="Share Certificate Number" id="edit-share-cert">
                  <input
                    type="text"
                    value={editShareCert}
                    onChange={(e) => setEditShareCert(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] bg-white text-xs uppercase"
                  />
                </FormField>

                <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-end gap-2">
                  <AppButton
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditModalOpen(false)}
                  >
                    Cancel
                  </AppButton>
                  <AppButton
                    type="submit"
                    variant="primary"
                    size="sm"
                    isLoading={isSubmittingEdit}
                  >
                    Save Changes
                  </AppButton>
                </div>
              </form>
            </Modal>

            {/* Modal: Deactivate Confirmation (with Occupancy Protection) */}
            <Modal
              isOpen={deactivateModalOpen}
              onClose={() => setDeactivateModalOpen(false)}
              title={`Deactivate Flat ${data.flat.flatNumber}`}
            >
              <div className="space-y-4 text-xs">
                {isOccupied ? (
                  <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-xl text-[#991B1B] space-y-2">
                    <div className="flex items-center gap-2 font-bold text-sm">
                      <IonIcon name="alert-circle" size={18} />
                      <span>Deactivation Blocked: Active Residents Present</span>
                    </div>
                    <p className="leading-relaxed">
                      This unit currently has an active owner (<strong>{data.owner?.name}</strong>)
                      {data.tenant ? ` and active tenant (${data.tenant.name})` : ""}. Flats with
                      active verified members cannot be deactivated to protect historical occupancy and
                      financial records. Please conclude or transfer active memberships first.
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="text-[#4B5563] leading-relaxed">
                      Are you sure you want to deactivate <strong>Flat {data.flat.flatNumber}</strong>?
                      Deactivated flats will be excluded from active resident registries and directory
                      lookups.
                    </p>

                    <FormField label="Deactivation Reason *" id="deact-reason" required>
                      <input
                        type="text"
                        placeholder="e.g. Society redevelopment, structural merger"
                        value={deactivateReason}
                        onChange={(e) => setDeactivateReason(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] bg-white text-xs"
                      />
                    </FormField>
                  </>
                )}

                <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-end gap-2">
                  <AppButton
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeactivateModalOpen(false)}
                  >
                    Close
                  </AppButton>
                  {!isOccupied && (
                    <AppButton
                      type="button"
                      variant="primary"
                      size="sm"
                      className="bg-[#E11D48] hover:bg-[#BE123C]"
                      isLoading={isDeactivating}
                      onClick={handleDeactivate}
                    >
                      Confirm Deactivation
                    </AppButton>
                  )}
                </div>
              </div>
            </Modal>

            {/* Modal: Document Preview Modal */}
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
  );
}

export default function FlatDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center text-xs font-semibold text-[#6B7280]">
          Loading flat dossier...
        </div>
      }
    >
      <AppShell>
        <FlatDetailContent />
      </AppShell>
    </Suspense>
  );
}
