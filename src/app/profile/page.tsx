"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import {
  PageHeader,
  AppCard,
  StatusBadge,
  AppButton,
  IconContainer,
  IonIcon,
  Modal,
} from "@/components/ui";

interface ProfileDoc {
  id: string;
  displayName: string;
  originalFilename: string;
  category: string;
  onboardingDocType?: string;
  size: number;
  mimeType: string;
  version?: number;
  verificationStatus?: string;
  correctionNote?: string;
  createdAt: string;
  viewUrl: string;
  downloadUrl: string;
}

interface ProfileData {
  profile: {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: string;
    status: string;
    onboardingStatus: string;
    enrollmentDate: string;
    lastLoginAt: string | null;
    accountCreated: string | null;
    managementPosition: string | null;
    resolutionNumber: string | null;
    societyJoiningMethod: string;
  };
  society: {
    id: string;
    name: string;
    code: string;
    registrationNumber: string;
    address: string;
    city?: string;
    state?: string;
    pinCode?: string;
  } | null;
  flat: {
    id: string;
    flatNumber: string;
    floor: number;
    wingName: string;
    buildingName?: string;
    configuration?: string;
    occupancyType?: string;
    ownershipType?: string;
    leaseStartDate?: string | null;
    leaseEndDate?: string | null;
    ownerName?: string | null;
    ownerContact?: string | null;
  } | null;
  onboardingDocuments: ProfileDoc[];
  personalSummary: {
    totalCount: number;
    totalBytes: number;
    categoriesCount: number;
    recentDocuments: ProfileDoc[];
  };
}

export default function ProfilePage() {
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [previewDoc, setPreviewDoc] = useState<ProfileDoc | null>(null);

  useEffect(() => {
    fetch("/api/user/profile")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load profile data");
        return res.json();
      })
      .then((resJson) => {
        if (resJson.success) {
          setData(resJson);
        }
      })
      .catch((err) => console.error("Profile load error:", err))
      .finally(() => setLoading(false));
  }, []);

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return "0 KB";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const isImage = (mimeType?: string) =>
    mimeType?.startsWith("image/") || false;
  const isPdf = (mimeType?: string) => mimeType === "application/pdf";

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case "OWNER":
      case "RESIDENT_OWNER":
        return "Property Owner";
      case "TENANT":
        return "Tenant Resident";
      case "SECRETARY":
        return "Honorary Secretary";
      case "CHAIRMAN":
        return "Society Chairman";
      case "TREASURER":
        return "Society Treasurer";
      case "SOCIETY_MANAGER":
        return "Society Manager";
      case "SOCIETY_ADMIN":
        return "Society Management";
      case "SUPER_ADMIN":
        return "Platform Administrator";
      case "AUDITOR_PARTNER":
      case "PARTNER":
        return "Auditor / Channel Partner";
      default:
        return role;
    }
  };

  const getOwnershipLabel = (ownershipType?: string) => {
    if (ownershipType === "JOINT_OWNER") return "Joint Owner";
    return "Sole Title Owner";
  };

  const isManagement = [
    "SOCIETY_ADMIN",
    "SECRETARY",
    "CHAIRMAN",
    "TREASURER",
    "SOCIETY_MANAGER",
  ].includes(data?.profile.role || "");

  return (
    <AppShell>
      <PageHeader
        title="Member Profile &amp; Account Details"
        description="Comprehensive personal credentials, residential unit specifications, and statutory association"
        breadcrumbs={[
          { label: "Console", href: "/dashboard" },
          { label: "Member Profile" },
        ]}
        badge={
          <StatusBadge variant="success" size="sm" dot>
            {data?.profile.status === "VERIFIED"
              ? isManagement
                ? "Verified Officer"
                : "Verified Resident"
              : "Active Member"}
          </StatusBadge>
        }
        actions={
          <div className="flex gap-2">
            <Link href="/documents">
              <AppButton variant="outline" size="sm" leftIcon="folder-open-outline">
                Document Vault
              </AppButton>
            </Link>
            {isManagement ? (
              <Link href="/management/dashboard">
                <AppButton variant="hero" size="sm" leftIcon="shield-checkmark-outline">
                  Management Console
                </AppButton>
              </Link>
            ) : data?.flat ? (
              <Link href="/my-flat">
                <AppButton variant="hero" size="sm" leftIcon="home-outline">
                  My Flat
                </AppButton>
              </Link>
            ) : null}
          </div>
        }
      />

      {loading ? (
        <div className="p-16 text-center text-sm text-[#6B7280]">
          <div className="inline-block animate-spin w-9 h-9 border-3 border-[#4F46E5] border-t-transparent rounded-full mb-3" />
          <p className="font-medium text-[#1A1A1A]">Loading member profile and account specifications...</p>
          <p className="text-xs text-[#9CA3AF] mt-1">Retrieving registration details and statutory verification</p>
        </div>
      ) : !data ? (
        <AppCard className="p-8 text-center bg-white border-[#E5E7EB]">
          <p className="text-sm text-[#6B7280]">Unable to load profile information.</p>
        </AppCard>
      ) : (
        <div className="space-y-8">
          {/* PROFILE HERO HEADER */}
          <AppCard className="p-6 bg-gradient-to-r from-white via-[#F8FAFC] to-[#EEF2FF] border-[#E5E7EB] shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-[#4F46E5] text-white flex items-center justify-center font-bold text-2xl shadow-md shrink-0">
                  {data.profile.name ? data.profile.name.charAt(0).toUpperCase() : "U"}
                </div>
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className="text-xl font-black font-heading text-[#1A1A1A]">
                      {data.profile.name}
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#EEF2FF] text-[#4F46E5] border border-[#C7D2FE]">
                      {getRoleDisplayName(data.profile.role)}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] flex items-center gap-1">
                      <IonIcon name="checkmark-circle" size={14} />
                      MCS Act 1960 Verified
                    </span>
                  </div>
                  <p className="text-xs text-[#6B7280] mt-1 flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-[#4F46E5] font-semibold">{data.profile.email}</span>
                    <span>•</span>
                    <span>
                      {data.society?.name || "Registered Housing Society"} ({data.society?.code || "SOCIETY"})
                    </span>
                    {data.flat && (
                      <>
                        <span>•</span>
                        <span className="font-bold text-[#1A1A1A]">
                          Unit {data.flat.wingName} - #{data.flat.flatNumber}
                        </span>
                      </>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="bg-white/80 backdrop-blur-xs px-4 py-2.5 rounded-xl border border-[#E5E7EB] text-right">
                  <span className="text-[10px] uppercase font-bold text-[#6B7280] block">Member Since</span>
                  <span className="text-xs font-bold font-mono text-[#1A1A1A]">
                    {new Date(data.profile.enrollmentDate).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>
            </div>
          </AppCard>

          {/* SECTION 1: ACCOUNT CREDENTIALS & LOGIN DETAILS (Matches Registration Form Section 1) */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <span className="w-6 h-6 rounded-full bg-[#4F46E5] text-white flex items-center justify-center font-bold text-xs">
                1
              </span>
              <h3 className="text-sm font-bold font-heading text-[#1A1A1A] uppercase tracking-wider">
                Account Credentials &amp; Login Details
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Full Legal Name */}
              <AppCard className="p-4 bg-white border-[#E5E7EB] space-y-1">
                <span className="text-[11px] font-semibold text-[#6B7280] block">
                  Full Legal Name
                </span>
                <p className="text-sm font-bold text-[#1A1A1A]">
                  {data.profile.name}
                </p>
                <p className="text-[10px] text-[#9CA3AF]">
                  Must match government ID and property documents
                </p>
              </AppCard>

              {/* Email Address */}
              <AppCard className="p-4 bg-white border-[#E5E7EB] space-y-1">
                <span className="text-[11px] font-semibold text-[#6B7280] block">
                  Email Address (Login ID)
                </span>
                <p className="text-sm font-bold text-[#1A1A1A] font-mono truncate">
                  {data.profile.email}
                </p>
                <p className="text-[10px] text-[#9CA3AF]">
                  Used for login and official statutory notices
                </p>
              </AppCard>

              {/* Mobile Phone */}
              <AppCard className="p-4 bg-white border-[#E5E7EB] space-y-1">
                <span className="text-[11px] font-semibold text-[#6B7280] block">
                  Mobile Number
                </span>
                <p className="text-sm font-bold text-[#1A1A1A] font-mono">
                  {data.profile.phone ? data.profile.phone : (
                    <span className="text-[#9CA3AF] font-normal italic">Not provided</span>
                  )}
                </p>
                <p className="text-[10px] text-[#9CA3AF]">
                  Required for emergency society broadcasts
                </p>
              </AppCard>

              {/* Password & Security */}
              <AppCard className="p-4 bg-white border-[#E5E7EB] space-y-1">
                <span className="text-[11px] font-semibold text-[#6B7280] block">
                  Password &amp; Security
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-mono tracking-widest text-[#1A1A1A]">
                    ••••••••••••
                  </span>
                  <span className="text-[10px] font-bold text-[#059669] bg-[#ECFDF5] px-1.5 py-0.5 rounded">
                    Secured
                  </span>
                </div>
                <p className="text-[10px] text-[#9CA3AF]">
                  Argon2 / BCrypt statutory hash encryption
                </p>
              </AppCard>
            </div>
          </div>

          {/* SECTION 2: ROLE & ASSOCIATION SPECIFICATIONS (Matches Registration Form Section 2) */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <span className="w-6 h-6 rounded-full bg-[#4F46E5] text-white flex items-center justify-center font-bold text-xs">
                2
              </span>
              <h3 className="text-sm font-bold font-heading text-[#1A1A1A] uppercase tracking-wider">
                Role &amp; Association Specifications
              </h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Society Specifications */}
              <AppCard className="p-5 bg-white border-[#E5E7EB] space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-[#F1F3F5]">
                  <IconContainer name="business-outline" variant="hero-soft" size="sm" />
                  <div>
                    <h4 className="text-sm font-bold font-heading text-[#1A1A1A]">
                      Registered Housing Society
                    </h4>
                    <p className="text-[11px] text-[#6B7280]">MCS Act 1960 Allotment</p>
                  </div>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-[#6B7280] block text-[11px]">Society Name</span>
                    <span className="font-bold text-sm text-[#1A1A1A]">
                      {data.society?.name || "Registered Housing Society"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#6B7280]">Society Code:</span>
                    <span className="font-mono font-bold text-[#4F46E5] bg-[#EEF2FF] px-2 py-0.5 rounded">
                      {data.society?.code || "ABC/DEF/001"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#6B7280]">Registration ID:</span>
                    <span className="font-mono font-semibold text-[#1A1A1A]">
                      {data.society?.registrationNumber || data.society?.code || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#6B7280] block text-[11px]">Society Location</span>
                    <span className="text-[#1A1A1A] font-medium">
                      {data.society?.address || "Maharashtra, India"}
                    </span>
                  </div>
                </div>
              </AppCard>

              {/* Unit & Flat Specifications */}
              <AppCard className="p-5 bg-white border-[#E5E7EB] space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-[#F1F3F5]">
                  <IconContainer name="home-outline" variant="neutral" size="sm" />
                  <div>
                    <h4 className="text-sm font-bold font-heading text-[#1A1A1A]">
                      Unit &amp; Flat Allotment
                    </h4>
                    <p className="text-[11px] text-[#6B7280]">Residential Unit Record</p>
                  </div>
                </div>

                {data.flat ? (
                  <div className="space-y-3 text-xs">
                    <div className="p-3 bg-[#F8F9FA] rounded-xl border border-[#E5E7EB] flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-[#4F46E5] uppercase block">
                          {data.flat.wingName || "Wing A"}
                        </span>
                        <span className="text-xl font-black font-heading text-[#1A1A1A]">
                          #{data.flat.flatNumber}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-[#6B7280] block">Floor Level</span>
                        <span className="text-sm font-bold text-[#1A1A1A]">
                          Floor {data.flat.floor}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[#6B7280]">Configuration:</span>
                      <span className="font-semibold text-[#1A1A1A]">
                        {data.flat.configuration || "2 BHK"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[#6B7280]">Occupancy Type:</span>
                      <StatusBadge variant="hero" size="sm">
                        {data.flat.occupancyType || (data.profile.role === "OWNER" ? "OWNER" : "TENANT")}
                      </StatusBadge>
                    </div>

                    {data.profile.role === "OWNER" && (
                      <div className="flex items-center justify-between pt-1 border-t border-[#F1F3F5]">
                        <span className="text-[#6B7280]">Ownership Classification:</span>
                        <span className="font-bold text-[#4F46E5]">
                          {getOwnershipLabel(data.flat.ownershipType)}
                        </span>
                      </div>
                    )}
                  </div>
                ) : isManagement ? (
                  <div className="space-y-3 text-xs">
                    <div className="p-3 bg-[#EEF2FF] rounded-xl border border-[#C7D2FE] flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-[#4F46E5] uppercase block">
                          Managing Committee
                        </span>
                        <span className="text-sm font-black font-heading text-[#1A1A1A]">
                          Society Secretariat Office
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-[#6B7280] block">Jurisdiction</span>
                        <span className="text-xs font-bold text-[#4F46E5]">Full Society Complex</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[#6B7280]">Administrative Role:</span>
                      <StatusBadge variant="hero" size="sm">
                        {getRoleDisplayName(data.profile.role)}
                      </StatusBadge>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[#6B7280]">Governance Framework:</span>
                      <span className="font-semibold text-[#1A1A1A]">MCS Act 1960 Bye-Laws</span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-[#F1F3F5]">
                      <span className="text-[#6B7280]">Operational Status:</span>
                      <span className="font-bold text-[#059669]">Active Officer</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-[#F8F9FA] rounded-xl text-center text-xs text-[#6B7280]">
                    No residential unit allocated yet.
                  </div>
                )}
              </AppCard>

              {/* Tenancy or Management Specifications */}
              <AppCard className="p-5 bg-white border-[#E5E7EB] space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-[#F1F3F5]">
                  <IconContainer name="ribbon-outline" variant="hero-soft" size="sm" />
                  <div>
                    <h4 className="text-sm font-bold font-heading text-[#1A1A1A]">
                      {data.profile.role === "TENANT"
                        ? "Lease Agreement Terms"
                        : data.profile.role === "OWNER"
                        ? "Statutory Ownership Status"
                        : "Committee Position"}
                    </h4>
                    <p className="text-[11px] text-[#6B7280]">MCS Act 1960 Regulatory Record</p>
                  </div>
                </div>

                <div className="space-y-3 text-xs">
                  {data.profile.role === "TENANT" ? (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-[#6B7280]">Landlord / Owner:</span>
                        <span className="font-bold text-[#1A1A1A]">
                          {data.flat?.ownerName || "Registered Owner"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#6B7280]">Owner Contact:</span>
                        <span className="font-mono text-[#1A1A1A]">
                          {data.flat?.ownerContact || "On record"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#6B7280]">Lease Commencement:</span>
                        <span className="font-medium text-[#1A1A1A]">
                          {data.flat?.leaseStartDate
                            ? new Date(data.flat.leaseStartDate).toLocaleDateString("en-IN")
                            : "Registered on record"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#6B7280]">Police Verification:</span>
                        <span className="font-bold text-[#059669]">Uploaded &amp; Verified</span>
                      </div>
                    </>
                  ) : data.profile.role === "OWNER" ? (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-[#6B7280]">Title Registration:</span>
                        <span className="font-bold text-[#059669]">Active on Society Roll</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#6B7280]">Share Certificate:</span>
                        <span className="font-semibold text-[#1A1A1A]">Registered On Record</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#6B7280]">Voting Rights:</span>
                        <span className="font-bold text-[#4F46E5]">Full Voting Member</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#6B7280]">Onboarding Status:</span>
                        <StatusBadge variant="success" size="sm">
                          {data.profile.onboardingStatus || "COMPLETED"}
                        </StatusBadge>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-[#6B7280]">Designation:</span>
                        <span className="font-bold text-[#4F46E5]">
                          {data.profile.managementPosition || data.profile.role}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#6B7280]">Resolution Number:</span>
                        <span className="font-mono font-semibold text-[#1A1A1A]">
                          {data.profile.resolutionNumber || "MC/RES/2026/01"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#6B7280]">Signing Authority:</span>
                        <span className="font-bold text-[#059669]">Authorized Signatory</span>
                      </div>
                    </>
                  )}
                </div>
              </AppCard>
            </div>
          </div>

          {/* SECTION 3: STATUTORY ONBOARDING DOCUMENTS */}
          <AppCard className="p-6 bg-white border-[#E5E7EB] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#F1F3F5]">
              <div className="flex items-center gap-3">
                <IconContainer name="shield-checkmark-outline" variant="hero-soft" size="sm" />
                <div>
                  <h3 className="text-base font-bold font-heading text-[#1A1A1A]">
                    Statutory Onboarding Property Documents
                  </h3>
                  <p className="text-xs text-[#6B7280]">
                    Official title and lease documents verified with Society Management
                  </p>
                </div>
              </div>
              <span className="text-xs font-semibold text-[#4F46E5] bg-[#EEF2FF] px-3 py-1 rounded-full w-fit">
                {data.onboardingDocuments.length} Verified Submissions
              </span>
            </div>

            {data.onboardingDocuments.length === 0 ? (
              <div className="p-8 text-center bg-[#F8F9FA] rounded-xl border border-[#E5E7EB]">
                <p className="text-xs text-[#6B7280] mb-3">
                  {isManagement
                    ? "Managing Committee administrative credentials active on society roll."
                    : "No statutory onboarding documents uploaded yet."}
                </p>
                <Link
                  href={
                    isManagement
                      ? "/management/flats"
                      : data.profile.role === "OWNER"
                      ? "/onboarding/owner-documents"
                      : "/onboarding/tenant-documents"
                  }
                >
                  <AppButton variant="hero" size="sm">
                    {isManagement ? "View Society Flats & Residents" : "Complete Document Onboarding"}
                  </AppButton>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#E5E7EB] text-[#6B7280] uppercase tracking-wider text-[10px]">
                      <th className="pb-3 font-bold">Document Title &amp; File</th>
                      <th className="pb-3 font-bold">Statutory Category</th>
                      <th className="pb-3 font-bold">Uploaded Date</th>
                      <th className="pb-3 font-bold">File Size</th>
                      <th className="pb-3 font-bold">Verification Status</th>
                      <th className="pb-3 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F3F5]">
                    {data.onboardingDocuments.map((doc) => (
                      <tr key={doc.id} className="hover:bg-[#F8F9FA] transition-colors">
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-2.5">
                            <IonIcon
                              name={isPdf(doc.mimeType) ? "document-text" : "image"}
                              size={18}
                              className={isPdf(doc.mimeType) ? "text-[#EF4444]" : "text-[#4F46E5]"}
                            />
                            <div>
                              <p className="font-bold text-[#1A1A1A]">{doc.displayName}</p>
                              <p className="text-[10px] text-[#9CA3AF] font-mono">{doc.originalFilename}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 pr-4 font-medium text-[#4F46E5]">
                          {doc.category}
                        </td>
                        <td className="py-3 pr-4 text-[#6B7280]">
                          {new Date(doc.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="py-3 pr-4 text-[#6B7280] font-mono">
                          {formatFileSize(doc.size)}
                        </td>
                        <td className="py-3 pr-4">
                          <StatusBadge
                            variant={
                              doc.verificationStatus === "VERIFIED"
                                ? "success"
                                : doc.verificationStatus === "CORRECTION_REQUESTED"
                                ? "error"
                                : "warning"
                            }
                            size="sm"
                            dot
                          >
                            {doc.verificationStatus === "CORRECTION_REQUESTED"
                              ? "Correction Required"
                              : doc.verificationStatus || "Pending Review"}
                          </StatusBadge>
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <AppButton
                              variant="outline"
                              size="sm"
                              leftIcon="eye-outline"
                              onClick={() => setPreviewDoc(doc)}
                            >
                              View
                            </AppButton>
                            <a href={doc.downloadUrl} download={doc.originalFilename}>
                              <AppButton variant="outline" size="sm" leftIcon="download-outline">
                                Download
                              </AppButton>
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </AppCard>

          {/* SECTION 4: PERSONAL VAULT QUICK SUMMARY */}
          <AppCard className="p-6 bg-white border-[#E5E7EB] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#F1F3F5]">
              <div className="flex items-center gap-3">
                <IconContainer name="lock-closed-outline" variant="hero" size="sm" />
                <div>
                  <h3 className="text-base font-bold font-heading text-[#1A1A1A]">
                    Private Document Vault Summary
                  </h3>
                  <p className="text-xs text-[#6B7280]">
                    Encrypted personal records strictly isolated to your profile.
                  </p>
                </div>
              </div>

              <Link href="/documents">
                <AppButton variant="hero" size="sm" rightIcon="arrow-forward-outline">
                  Open Personal Vault
                </AppButton>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-[#F8F9FA] border border-[#E5E7EB] flex items-center gap-3">
                <IconContainer name="documents-outline" variant="hero-soft" size="sm" />
                <div>
                  <span className="text-[11px] text-[#6B7280] block font-medium">Stored Files</span>
                  <span className="text-xl font-black text-[#1A1A1A]">
                    {data.personalSummary.totalCount} Documents
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#F8F9FA] border border-[#E5E7EB] flex items-center gap-3">
                <IconContainer name="cloud-done-outline" variant="neutral" size="sm" />
                <div>
                  <span className="text-[11px] text-[#6B7280] block font-medium">Encrypted Storage</span>
                  <span className="text-xl font-black text-[#1A1A1A]">
                    {formatFileSize(data.personalSummary.totalBytes)}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#F8F9FA] border border-[#E5E7EB] flex items-center gap-3">
                <IconContainer name="albums-outline" variant="hero-soft" size="sm" />
                <div>
                  <span className="text-[11px] text-[#6B7280] block font-medium">Active Categories</span>
                  <span className="text-xl font-black text-[#4F46E5]">
                    {data.personalSummary.categoriesCount} Folders
                  </span>
                </div>
              </div>
            </div>
          </AppCard>
        </div>
      )}

      {/* DOCUMENT PREVIEW MODAL */}
      {previewDoc && (
        <Modal
          isOpen={true}
          onClose={() => setPreviewDoc(null)}
          title={previewDoc.displayName}
          description={`${previewDoc.category} • ${formatFileSize(previewDoc.size)}`}
          maxWidth="lg"
        >
          <div className="space-y-4">
            <div className="w-full bg-[#1A1A1A] rounded-xl overflow-hidden min-h-[360px] max-h-[540px] flex items-center justify-center p-2">
              {isImage(previewDoc.mimeType) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewDoc.viewUrl}
                  alt={previewDoc.displayName}
                  className="max-h-[500px] w-auto max-w-full object-contain rounded-lg"
                />
              ) : isPdf(previewDoc.mimeType) ? (
                <iframe
                  src={previewDoc.viewUrl}
                  title={previewDoc.displayName}
                  className="w-full h-[500px] rounded-lg bg-white"
                />
              ) : (
                <div className="text-center p-8 text-white">
                  <IonIcon name="document-text" size={48} className="text-[#9CA3AF] mb-3" />
                  <p className="text-sm font-semibold">{previewDoc.originalFilename}</p>
                  <p className="text-xs text-[#9CA3AF] mt-1">Preview not available inline for this format.</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-[#6B7280]">
                Uploaded: {new Date(previewDoc.createdAt).toLocaleString("en-IN")}
              </span>
              <a href={previewDoc.downloadUrl} download={previewDoc.originalFilename}>
                <AppButton variant="hero" size="sm" leftIcon="download-outline">
                  Download Original
                </AppButton>
              </a>
            </div>
          </div>
        </Modal>
      )}
    </AppShell>
  );
}
