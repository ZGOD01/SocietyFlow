"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { IonIcon, StatusBadge, AppButton } from "@/components/ui";

interface TimelineEvent {
  action: string;
  actorRole?: string;
  actorName?: string;
  timestamp: string;
  statusTransition: string;
  comment?: string;
}

interface RegistrationData {
  id: string;
  applicantName: string;
  applicantEmail: string;
  role: string;
  societyName: string;
  societyCode: string;
  wingName: string;
  flatNumber: string;
  status: string;
  ownerApproval?: {
    status: string;
    comment?: string;
  };
  societyApproval?: {
    status: string;
    comment?: string;
  };
  onboardingStatus?: string;
  timeline: TimelineEvent[];
  rejectionReason?: string;
  moreInfoNote?: string;
  createdAt: string;
}

const FALLBACK_REGISTRATION: RegistrationData = {
  id: "pending-registration",
  applicantName: "Applicant Member",
  applicantEmail: "applicant@societyflow.com",
  role: "OWNER",
  societyName: "Registered Housing Society",
  societyCode: "ACTIVE",
  wingName: "Main Complex",
  flatNumber: "Unit",
  status: "PENDING_APPROVAL",
  ownerApproval: { status: "NOT_REQUIRED" },
  societyApproval: { status: "PENDING" },
  onboardingStatus: "PENDING_REGISTRATION_APPROVAL",
  timeline: [
    {
      action: "REGISTRATION_CREATED",
      actorRole: "APPLICANT",
      actorName: "Applicant Member",
      timestamp: new Date().toISOString(),
      statusTransition: "PENDING_APPROVAL",
      comment: "Registration submitted. Awaiting society management or administrator review.",
    },
  ],
  createdAt: new Date().toISOString(),
};

export default function PendingApprovalPage() {
  const router = useRouter();
  const [data, setData] = useState<RegistrationData | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const fetchStatus = useCallback(async () => {
    setIsChecking(true);
    try {
      const res = await fetch("/api/approvals/status");
      const resJson = await res.json();

      if (res.ok && resJson.found && resJson.request) {
        setData(resJson.request);

        const isManagement = [
          "MANAGEMENT",
          "SECRETARY",
          "CHAIRMAN",
          "TREASURER",
          "SOCIETY_MANAGER",
        ].includes(resJson.request.role);

        // If approved and management role, route immediately to management dashboard
        if (resJson.request.status === "APPROVED" && isManagement) {
          window.location.href = "/management/dashboard";
          return;
        }

        // If approved and requires documents, auto-redirect
        if (
          resJson.request.status === "APPROVED" &&
          resJson.request.onboardingStatus === "DOCUMENT_ONBOARDING_REQUIRED"
        ) {
          if (resJson.request.role === "TENANT") {
            window.location.href = "/onboarding/tenant-documents";
          } else {
            window.location.href = "/onboarding/owner-documents";
          }
        } else if (
          resJson.request.status === "APPROVED" &&
          resJson.request.onboardingStatus === "COMPLETED"
        ) {
          window.location.href = resJson.request.role === "TENANT" ? "/dashboard?view=tenant" : "/dashboard";
        }
      } else {
        setData(FALLBACK_REGISTRATION);
      }
    } catch {
      setData(FALLBACK_REGISTRATION);
    } finally {
      setIsChecking(false);
    }
  }, [router]);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3500);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const reg = data || FALLBACK_REGISTRATION;

  const isManagementRole = [
    "MANAGEMENT",
    "SECRETARY",
    "CHAIRMAN",
    "TREASURER",
    "SOCIETY_MANAGER",
  ].includes(reg.role);

  const renderStatusBadge = () => {
    switch (reg.status) {
      case "APPROVED":
        return (
          <StatusBadge variant="success" size="sm" dot>
            {isManagementRole ? "Approved — Ready for Dashboard" : "Approved — Action Required"}
          </StatusBadge>
        );
      case "OWNER_APPROVED_SOCIETY_PENDING":
        return <StatusBadge variant="warning" size="sm" dot>Owner Approved — Society Approval Pending</StatusBadge>;
      case "SOCIETY_APPROVED_OWNER_PENDING":
        return <StatusBadge variant="warning" size="sm" dot>Society Approved — Owner Approval Pending</StatusBadge>;
      case "MORE_INFO_REQUESTED":
        return <StatusBadge variant="warning" size="sm" dot>Information Requested</StatusBadge>;
      case "REJECTED":
        return <StatusBadge variant="error" size="sm" dot>Application Rejected</StatusBadge>;
      default:
        return <StatusBadge variant="warning" size="sm" dot>Verification Pending</StatusBadge>;
    }
  };

  const getStatusHeadline = () => {
    switch (reg.status) {
      case "APPROVED":
        return isManagementRole
          ? "Registration Approved — Proceed to Management Dashboard"
          : "Registration Approved — Proceed to Document Onboarding";
      case "OWNER_APPROVED_SOCIETY_PENDING":
        return "Owner Authorized — Society Approval Pending";
      case "SOCIETY_APPROVED_OWNER_PENDING":
        return "Society Approved — Owner Approval Pending";
      case "MORE_INFO_REQUESTED":
        return "Additional Information Required by Managing Committee";
      case "REJECTED":
        return "Registration Application Rejected";
      default:
        return "Society Association Under Review";
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] flex flex-col justify-between p-4 sm:p-6 lg:p-10">
      {/* Top Navbar */}
      <header className="w-full max-w-4xl mx-auto flex items-center justify-between pb-6 border-b border-[#E5E7EB]">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-xl bg-[#4F46E5] text-white flex items-center justify-center font-bold text-base font-heading shadow-xs">
            S
          </div>
          <span className="font-heading font-black text-lg tracking-[0.18em] text-[#1A1A1A] uppercase">
            SOCIETY<span className="text-[#4F46E5]">FLOW</span>
          </span>
        </Link>

        <div className="flex items-center gap-2.5">
          <Link href="/">
            <AppButton variant="ghost" size="sm" leftIcon="home-outline">
              Landing Page
            </AppButton>
          </Link>
          <Link href="/login">
            <AppButton variant="outline" size="sm">
              Sign In
            </AppButton>
          </Link>
        </div>
      </header>

      {/* Main Card */}
      <main className="w-full max-w-3xl mx-auto my-auto py-8">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-white border border-[#E5E7EB] shadow-[0_4px_24px_-2px_rgba(0,0,0,0.06)] overflow-hidden p-6 sm:p-9 space-y-6"
        >
          {/* Header Banner */}
          <div className="flex items-start gap-4">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${
                reg.status === "APPROVED"
                  ? "bg-[#ECFDF5] text-[#10B981] border-[#A7F3D0]"
                  : reg.status === "REJECTED"
                  ? "bg-[#FFF1F2] text-[#F43F5E] border-[#FECDD3]"
                  : "bg-[#FFFBEB] text-[#F59E0B] border-[#FDE68A]"
              }`}
            >
              <IonIcon
                name={
                  reg.status === "APPROVED"
                    ? "checkmark-done-circle-outline"
                    : reg.status === "REJECTED"
                    ? "close-circle-outline"
                    : "time-outline"
                }
                size={24}
                className={reg.status === "APPROVED" ? "" : "animate-pulse"}
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                {renderStatusBadge()}
                <span className="text-xs text-[#6B7280]">MCS Act 1960 Statutory Review</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black font-heading uppercase text-[#1A1A1A] tracking-tight">
                {getStatusHeadline()}
              </h1>
              <p className="text-xs sm:text-sm text-[#6B7280] leading-relaxed">
                Applicant: <strong>{reg.applicantName}</strong> ({reg.applicantEmail}). Target flat:{" "}
                <strong>{reg.wingName} - Flat #{reg.flatNumber}</strong> in{" "}
                <strong>{reg.societyName}</strong>.
              </p>
            </div>
          </div>

          {/* Action Callout if Approved */}
          {reg.status === "APPROVED" && (
            <div className="p-4 rounded-xl border border-[#A7F3D0] bg-[#ECFDF5] text-xs text-[#065F46] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <strong className="block font-bold text-sm text-[#065F46]">
                  {isManagementRole ? "Approval Granted by Platform Authority!" : "Approval Granted by Committee!"}
                </strong>
                <p className="text-[12px] text-[#047857] mt-0.5">
                  {isManagementRole
                    ? "Your society management registration has been approved. You can now access your management console."
                    : "Your registration has been approved. Submit your mandatory statutory document checklist to activate your dashboard."}
                </p>
              </div>

              <Link
                href={
                  isManagementRole
                    ? "/management/dashboard"
                    : reg.role === "TENANT"
                    ? "/onboarding/tenant-documents"
                    : "/onboarding/owner-documents"
                }
              >
                <AppButton variant="hero" size="sm" rightIcon="arrow-forward-outline">
                  {isManagementRole ? "Go to Management Dashboard" : "Go to Document Onboarding"}
                </AppButton>
              </Link>
            </div>
          )}

          {/* Rejection / More Info Notice */}
          {reg.status === "REJECTED" && (
            <div className="p-4 rounded-xl border border-[#FECDD3] bg-[#FFF1F2] text-xs text-[#9F1239] space-y-1">
              <strong className="block font-bold">Reason for Rejection:</strong>
              <p className="leading-relaxed">{reg.rejectionReason || "Managing committee declined registration."}</p>
            </div>
          )}

          {reg.status === "MORE_INFO_REQUESTED" && (
            <div className="p-4 rounded-xl border border-[#FDE68A] bg-[#FFFBEB] text-xs text-[#92400E] space-y-1">
              <strong className="block font-bold">Managing Committee Note:</strong>
              <p className="leading-relaxed">{reg.moreInfoNote || "Please submit title deed clarification."}</p>
            </div>
          )}

          {/* Dual Approval Matrix for Tenant */}
          {reg.role === "TENANT" && (
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280] block">
                Dual Authorization Status (Both Required for Activation):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div
                  className={`p-3.5 rounded-xl border flex items-center justify-between ${
                    reg.ownerApproval?.status === "APPROVED"
                      ? "bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46]"
                      : reg.ownerApproval?.status === "REJECTED"
                      ? "bg-[#FFF1F2] border-[#FECDD3] text-[#9F1239]"
                      : "bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]"
                  }`}
                >
                  <div className="space-y-0.5">
                    <span className="font-bold block">1. Property Owner</span>
                    <span className="text-[11px] text-[#6B7280]">Flat Title Holder Authorization</span>
                  </div>
                  <span className="font-bold text-xs uppercase">
                    {reg.ownerApproval?.status || "PENDING"}
                  </span>
                </div>

                <div
                  className={`p-3.5 rounded-xl border flex items-center justify-between ${
                    reg.societyApproval?.status === "APPROVED"
                      ? "bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46]"
                      : reg.societyApproval?.status === "REJECTED"
                      ? "bg-[#FFF1F2] border-[#FECDD3] text-[#9F1239]"
                      : "bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]"
                  }`}
                >
                  <div className="space-y-0.5">
                    <span className="font-bold block">2. Society Management</span>
                    <span className="text-[11px] text-[#6B7280]">Managing Committee Verification</span>
                  </div>
                  <span className="font-bold text-xs uppercase">
                    {reg.societyApproval?.status || "PENDING"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Staged Application Details */}
          <div className="rounded-xl border border-[#E5E7EB] bg-[#F8F9FA] p-5 space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280] block">
              Application Summary:
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-white border border-[#E5E7EB]">
                <span className="text-[#9CA3AF] block text-[10px] uppercase font-bold">
                  Registered Society:
                </span>
                <span className="font-bold text-[#1A1A1A] text-sm">{reg.societyName}</span>
                <span className="text-[11px] text-[#4F46E5] block font-mono">
                  Code: {reg.societyCode}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-white border border-[#E5E7EB]">
                <span className="text-[#9CA3AF] block text-[10px] uppercase font-bold">
                  Requested Role:
                </span>
                <span className="font-bold text-[#1A1A1A] text-sm">{reg.role}</span>
                <span className="text-[11px] text-[#6B7280] block">
                  Onboarding: {reg.onboardingStatus || "PENDING_APPROVAL"}
                </span>
              </div>

              <div className="sm:col-span-2 p-3 rounded-lg bg-white border border-[#E5E7EB] flex items-center justify-between">
                <div>
                  <span className="text-[#9CA3AF] block text-[10px] uppercase font-bold">
                    Requested Flat Unit:
                  </span>
                  <span className="font-bold text-[#1A1A1A] text-sm">
                    {reg.wingName} — Flat #{reg.flatNumber}
                  </span>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-[#F8F9FA] text-[#1A1A1A] font-semibold border border-[#E5E7EB]">
                  {reg.role}
                </span>
              </div>
            </div>
          </div>

          {/* Section 9: Approval Transparency Timeline */}
          <div className="space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280] block">
              Statutory Approval Timeline:
            </span>

            <div className="space-y-2.5">
              {reg.timeline && reg.timeline.length > 0 ? (
                reg.timeline.map((evt, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-[#E5E7EB] bg-white flex items-start gap-3 text-xs"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center shrink-0 mt-0.5">
                      <IonIcon
                        name={
                          evt.action === "REGISTRATION_CREATED"
                            ? "document-text-outline"
                            : evt.action === "SOCIETY_APPROVED"
                            ? "checkmark-circle-outline"
                            : evt.action === "OWNER_AUTHORIZED"
                            ? "key-outline"
                            : evt.action === "REJECTED"
                            ? "close-circle-outline"
                            : "hourglass-outline"
                        }
                        size={18}
                      />
                    </div>
                    <div className="space-y-0.5 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#1A1A1A]">
                          {evt.action.replace(/_/g, " ")}
                        </span>
                        <span className="text-[11px] text-[#9CA3AF]">
                          {new Date(evt.timestamp).toLocaleString("en-IN", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#6B7280]">
                        Actor: <strong>{evt.actorName || "System"}</strong> ({evt.actorRole || "System"}) • Transition: <span className="font-mono text-[#4F46E5]">{evt.statusTransition}</span>
                      </p>
                      {evt.comment && (
                        <p className="text-xs text-[#1A1A1A] bg-[#F8F9FA] p-2 rounded-lg mt-1 border border-[#F1F3F5]">
                          &ldquo;{evt.comment}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-3 rounded-xl bg-[#F8F9FA] text-xs text-[#6B7280] text-center border border-[#E5E7EB]">
                  No timeline events recorded yet.
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-[#E5E7EB] flex flex-col sm:flex-row items-center justify-between gap-3">
            <AppButton
              variant="hero"
              size="sm"
              onClick={fetchStatus}
              disabled={isChecking}
              leftIcon="sync-outline"
            >
              {isChecking ? "Checking Status..." : "Refresh Approval Status"}
            </AppButton>

            <div className="flex items-center gap-2">
              <Link href="/register">
                <AppButton variant="outline" size="sm">
                  Register Another Role
                </AppButton>
              </Link>
              <Link href="/login">
                <AppButton variant="ghost" size="sm">
                  Sign In
                </AppButton>
              </Link>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-4xl mx-auto text-center text-xs text-[#9CA3AF] pt-6">
        <span>© 2026 SocietyFlow • MCS Act 1960 Multi-Tenant Statutory Governance</span>
      </footer>
    </div>
  );
}
