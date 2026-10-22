"use client";

import React from "react";
import { DocumentRecord } from "@/types";
import { AppCard } from "./AppCard";
import { StatusBadge, BadgeVariant } from "./StatusBadge";
import { IconContainer } from "./IconContainer";
import { IonIcon } from "./IonIcon";
import { formatDate, formatFileSize } from "@/lib/utils";

export interface DocumentCardProps {
  document: DocumentRecord;
  onView?: (doc: DocumentRecord) => void;
  onDownload?: (doc: DocumentRecord) => void;
  className?: string;
}

export function DocumentCard({
  document,
  onView,
  onDownload,
  className,
}: DocumentCardProps) {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "BYLAWS":
        return "library-outline";
      case "MEETING_MINUTES":
        return "reader-outline";
      case "AUDIT_FINANCIALS":
        return "briefcase-outline";
      case "SHARE_CERTIFICATE":
      case "NOC_CERTIFICATE":
        return "shield-checkmark-outline";
      case "IDENTITY_VERIFICATION":
        return "person-outline";
      default:
        return "document-text-outline";
    }
  };

  const getStatusVariant = (status: string): BadgeVariant => {
    switch (status) {
      case "VERIFIED":
      case "APPROVED":
        return "success";
      case "PENDING_REVIEW":
        return "warning";
      case "REJECTED":
        return "error";
      default:
        return "neutral";
    }
  };

  return (
    <AppCard
      variant="interactive"
      className={className}
      onClick={() => onView?.(document)}
    >
      <div className="p-5 flex flex-col justify-between h-full gap-4">
        {/* Top bar: Icon and Status */}
        <div className="flex items-start justify-between gap-3">
          <IconContainer
            name={getCategoryIcon(document.category)}
            variant={document.status === "VERIFIED" ? "hero-soft" : "neutral"}
            size="md"
          />
          <StatusBadge
            variant={getStatusVariant(document.status)}
            size="sm"
            dot
          >
            {document.status.replace("_", " ")}
          </StatusBadge>
        </div>

        {/* Content: Title & category */}
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">
            {document.category.replace(/_/g, " ")}
          </span>
          <h3 className="text-base font-bold text-[#1A1A1A] line-clamp-1 group-hover:text-[#4F46E5] transition-colors">
            {document.title}
          </h3>
          <p className="text-xs text-[#9CA3AF]">
            Uploaded by {document.uploadedBy.userName}
          </p>
        </div>

        {/* Metadata Footer */}
        <div className="pt-3 border-t border-[#F1F3F5] flex items-center justify-between text-xs text-[#6B7280]">
          <span className="flex items-center gap-1 font-medium">
            <IonIcon name="time-outline" size={14} className="text-[#9CA3AF]" />
            {formatDate(document.createdAt)}
          </span>
          <div className="flex items-center gap-3">
            <span>{formatFileSize(document.fileSize)}</span>
            {onDownload && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDownload(document);
                }}
                className="text-[#9CA3AF] hover:text-[#4F46E5] p-1 rounded-md transition-colors"
                title="Download document"
                aria-label="Download document"
              >
                <IonIcon name="download-outline" size={15} />
              </button>
            )}
          </div>
        </div>
      </div>
    </AppCard>
  );
}
