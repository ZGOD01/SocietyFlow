"use client";

import React, { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  PageHeader,
  AppCard,
  StatusBadge,
  AppButton,
  IconContainer,
  IonIcon,
} from "@/components/ui";

export default function ApprovalsPage() {
  const [items] = useState([
    {
      id: "appr-01",
      unit: "Wing B - 301",
      applicant: "Harish Deshmukh",
      type: "Property Transfer NOC",
      status: "2_OF_3_SIGNED",
      date: "14 Apr 2024",
      signers: [
        { role: "Treasurer", name: "Sunil Joshi", status: "SIGNED" },
        { role: "Secretary", name: "R. K. Sharma", status: "PENDING" },
        { role: "Chairman", name: "Anand Verma", status: "SIGNED" },
      ],
    },
    {
      id: "appr-02",
      unit: "Wing A - 104",
      applicant: "Sneha Kulkarni",
      type: "Balcony Solar Installation",
      status: "APPROVED",
      date: "08 Apr 2024",
      signers: [
        { role: "Treasurer", name: "Sunil Joshi", status: "SIGNED" },
        { role: "Secretary", name: "R. K. Sharma", status: "SIGNED" },
        { role: "Chairman", name: "Anand Verma", status: "SIGNED" },
      ],
    },
  ]);

  return (
    <AppShell>
      <PageHeader
        title="Managing Committee Approvals"
        description="Multi-signatory review console for Chairman, Secretary, and Treasurer"
        breadcrumbs={[
          { label: "Console", href: "/dashboard" },
          { label: "Committee Approvals" },
        ]}
        badge={
          <StatusBadge variant="warning" size="sm" dot>
            1 Action Pending
          </StatusBadge>
        }
      />

      {/* Scaffold Notice */}
      <div className="mb-6 p-4 rounded-xl border border-[#FDE68A] bg-[#FFFBEB] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-[#D97706]">
        <div className="flex items-center gap-2.5">
          <IconContainer name="shield-checkmark-outline" variant="warning" size="sm" />
          <div>
            <span className="font-bold text-[#1A1A1A]">Committee Sign-Off Engine:</span> Cryptographic
            signature verification and immutable audit trail will be integrated with Auth.js session tokens in Prompt 2.
          </div>
        </div>
        <StatusBadge variant="warning" size="sm">
          Scaffold Ready
        </StatusBadge>
      </div>

      <div className="space-y-4">
        {items.map((item) => (
          <AppCard key={item.id} className="p-5 sm:p-6 bg-white border-[#E5E7EB]">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-[#F1F3F5]">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-[#4F46E5] bg-[#EEF2FF] px-2.5 py-0.5 rounded-full">
                    {item.unit}
                  </span>
                  <span className="text-xs text-[#9CA3AF]">Applicant: {item.applicant}</span>
                </div>
                <h3 className="text-base font-bold text-[#1A1A1A] font-heading">
                  {item.type}
                </h3>
              </div>

              {item.status === "APPROVED" ? (
                <StatusBadge variant="success" dot>Fully Approved</StatusBadge>
              ) : (
                <StatusBadge variant="warning" dot>Awaiting Secretary</StatusBadge>
              )}
            </div>

            {/* Signers Progress Bar */}
            <div className="py-4">
              <p className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider mb-3">
                Signatory Quorum Status
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {item.signers.map((s, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border flex items-center justify-between ${
                      s.status === "SIGNED"
                        ? "bg-[#ECFDF5]/50 border-[#A7F3D0]"
                        : "bg-[#FFFBEB]/50 border-[#FDE68A]"
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold text-[#1A1A1A]">{s.role}</p>
                      <p className="text-[11px] text-[#6B7280]">{s.name}</p>
                    </div>
                    {s.status === "SIGNED" ? (
                      <IonIcon name="checkmark-circle" className="text-[#10B981]" size={18} />
                    ) : (
                      <span className="text-[10px] font-bold text-[#F59E0B] bg-white px-2 py-0.5 rounded-full border border-[#FDE68A]">
                        Pending
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-[#F1F3F5] flex items-center justify-between text-xs text-[#6B7280]">
              <span>Filed on: {item.date}</span>
              <div className="flex items-center gap-2">
                <AppButton
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    alert(
                      "[Prototype Notice] Committee sign-off will execute cryptographically once Auth.js session is verified."
                    )
                  }
                >
                  Review Dossier
                </AppButton>
                {item.status !== "APPROVED" && (
                  <AppButton
                    variant="hero"
                    size="sm"
                    onClick={() =>
                      alert(
                        "[Prototype Constraint] Multi-tenant committee approval will write to MongoDB audit collection in Prompt 2."
                      )
                    }
                  >
                    Append Digital Sign-off
                  </AppButton>
                )}
              </div>
            </div>
          </AppCard>
        ))}
      </div>
    </AppShell>
  );
}
