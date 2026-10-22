"use client";

import React, { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  PageHeader,
  AppCard,
  StatusBadge,
  AppButton,
  IconContainer,
  Modal,
  FormField,
  IonIcon,
} from "@/components/ui";
import { SocietyRequest } from "@/types";
import { formatDate } from "@/lib/utils";

const SAMPLE_REQUESTS: SocietyRequest[] = [
  {
    id: "req-101",
    societyId: "soc-greenwood",
    flatId: "flat-c402",
    requestedBy: {
      userId: "usr-priya",
      userName: "Priya Mehta",
      flatNumber: "C-402",
    },
    requestType: "NOC_TRANSFER",
    title: "Application for No Objection Certificate for Property Transfer",
    description:
      "Requesting statutory society NOC in favor of purchaser Vikram Patil along with no-dues verification.",
    status: "UNDER_REVIEW",
    urgency: "HIGH",
    submittedAt: "2024-04-12T10:00:00Z",
    requiredDocuments: ["Registered Sale Agreement", "Index II", "Buyer KYC"],
    attachedDocumentIds: ["doc-1"],
  },
  {
    id: "req-102",
    societyId: "soc-greenwood",
    flatId: "flat-c402",
    requestedBy: {
      userId: "usr-priya",
      userName: "Priya Mehta",
      flatNumber: "C-402",
    },
    requestType: "RENOVATION_PERMISSION",
    title: "Interior Bathroom Tiling & Kitchen Piping Modification",
    description:
      "Minor plumbing upgrade. Work scheduled between 10 AM to 6 PM with zero structural column modifications.",
    status: "APPROVED",
    urgency: "NORMAL",
    submittedAt: "2024-03-01T08:30:00Z",
    reviewedBy: "Secretary (R. K. Sharma)",
    reviewedAt: "2024-03-03T11:00:00Z",
    requiredDocuments: ["Contractor ID", "Plumbing Blueprint"],
    attachedDocumentIds: [],
  },
  {
    id: "req-103",
    societyId: "soc-greenwood",
    flatId: "flat-c402",
    requestedBy: {
      userId: "usr-priya",
      userName: "Priya Mehta",
      flatNumber: "C-402",
    },
    requestType: "PARKING_SLOT",
    title: "Allotment of Additional Two-Wheeler Slot in Wing C Basement",
    description:
      "Electric scooter purchase; requesting assignment of allotted EV charging point in Stilt Bay #14.",
    status: "SUBMITTED",
    urgency: "LOW",
    submittedAt: "2024-04-15T14:15:00Z",
    requiredDocuments: ["Vehicle RC Copy"],
    attachedDocumentIds: [],
  },
];

export default function RequestsPage() {
  const [requests] = useState<SocietyRequest[]>(SAMPLE_REQUESTS);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <StatusBadge variant="success" dot>Approved</StatusBadge>;
      case "UNDER_REVIEW":
        return <StatusBadge variant="warning" dot>Committee Review</StatusBadge>;
      case "REJECTED":
        return <StatusBadge variant="error" dot>Rejected</StatusBadge>;
      default:
        return <StatusBadge variant="info" dot>Submitted</StatusBadge>;
    }
  };

  return (
    <AppShell>
      <PageHeader
        title="Applications & Service Requests"
        description="Formal digital requests submitted by Flat C-402 to the Managing Committee"
        breadcrumbs={[
          { label: "Console", href: "/dashboard" },
          { label: "My Requests" },
        ]}
        badge={
          <StatusBadge variant="info" size="sm">
            {requests.length} Requests Filed
          </StatusBadge>
        }
        actions={
          <AppButton
            variant="hero"
            size="sm"
            leftIcon="add-outline"
            onClick={() => setIsNewModalOpen(true)}
          >
            Create New Application
          </AppButton>
        }
      />

      {/* Requests List */}
      <div className="space-y-4">
        {requests.map((req) => (
          <AppCard key={req.id} className="p-5 sm:p-6 bg-white border-[#E5E7EB]">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-[#F1F3F5]">
              <div className="flex items-start gap-3">
                <IconContainer
                  name="document-text-outline"
                  variant={req.urgency === "HIGH" ? "warning" : "hero-soft"}
                  size="md"
                />
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">
                      {req.requestType.replace(/_/g, " ")}
                    </span>
                    <span className="text-[#9CA3AF]">•</span>
                    <span className="text-xs text-[#9CA3AF]">
                      ID: {req.id}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-[#1A1A1A] font-heading">
                    {req.title}
                  </h3>
                </div>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto">
                {getStatusBadge(req.status)}
              </div>
            </div>

            <p className="text-sm text-[#6B7280] my-3 leading-relaxed">
              {req.description}
            </p>

            <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#6B7280]">
              <div className="flex items-center gap-4">
                <span>Submitted: {formatDate(req.submittedAt)}</span>
                {req.reviewedBy && (
                  <span className="text-[#10B981] font-medium">
                    Reviewer: {req.reviewedBy}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <AppButton
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    alert(
                      `[Prototype Preview] Request ${req.id} audit trail: 2 signatures recorded. MongoDB & Auth.js integration scheduled for Prompt 2.`
                    )
                  }
                >
                  Inspect Trail
                </AppButton>
              </div>
            </div>
          </AppCard>
        ))}
      </div>

      {/* New Application Modal */}
      <Modal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        title="Submit Society Application"
        description="Select the request category and provide supporting documentation"
        footer={
          <>
            <AppButton
              variant="outline"
              size="sm"
              onClick={() => setIsNewModalOpen(false)}
            >
              Cancel
            </AppButton>
            <AppButton
              variant="hero"
              size="sm"
              onClick={() => {
                alert(
                  "[Prototype Constraint] Backend submission connects to MongoDB Atlas in Prompt 2. Validation schema and contracts are ready."
                );
                setIsNewModalOpen(false);
              }}
            >
              Submit Application
            </AppButton>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]">
              Application Type <span className="text-[#F43F5E]">*</span>
            </label>
            <select className="h-11 px-3.5 bg-white text-sm rounded-xl border border-[#E5E7EB] outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5]">
              <option value="NOC_TRANSFER">NOC for Property Sale / Transfer</option>
              <option value="NOC_MORTGAGE">NOC for Home Loan / Bank Mortgage</option>
              <option value="TENANT_VERIFICATION">Tenant Verification & Agreement Registration</option>
              <option value="RENOVATION_PERMISSION">Interior Renovation / Modification Permit</option>
              <option value="PARKING_SLOT">Parking Slot Allotment</option>
            </select>
          </div>

          <FormField
            label="Subject Line"
            placeholder="e.g. Request for No Dues & NOC for Bank Loan"
            required
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]">
              Detailed Explanation <span className="text-[#F43F5E]">*</span>
            </label>
            <textarea
              rows={4}
              placeholder="State the purpose, required timeline, and relevant party details..."
              className="p-3 text-sm rounded-xl border border-[#E5E7EB] outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] bg-white resize-none"
            />
          </div>

          <div className="p-3 bg-[#EEF2FF] rounded-xl text-xs text-[#4F46E5] flex items-center gap-2">
            <IonIcon name="information-circle-outline" size={18} />
            <span>
              Standard turnaround by Managing Committee is 3-5 business days.
            </span>
          </div>
        </div>
      </Modal>
    </AppShell>
  );
}
