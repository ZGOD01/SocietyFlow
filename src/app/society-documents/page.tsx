"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  PageHeader,
  SearchField,
  AppButton,
  Modal,
  FormField,
  StatusBadge,
  IonIcon,
} from "@/components/ui";

interface SocietyDocument {
  id: string;
  documentId: string;
  displayName: string;
  originalFilename: string;
  category: string;
  size: number;
  mimeType: string;
  visibility: "ALL_RESIDENTS" | "OWNERS_ONLY" | "TENANTS_ONLY" | "MANAGEMENT_ONLY";
  description?: string;
  version: number;
  createdAt: string;
  viewUrl?: string;
  downloadUrl?: string;
}

const SOCIETY_CATEGORIES = [
  { label: "All Society Records", value: "ALL" },
  { label: "Registration Certificate", value: "REGISTRATION_CERTIFICATE" },
  { label: "Society Bye-laws", value: "BYLAWS" },
  { label: "Official Notices", value: "OFFICIAL_NOTICE" },
  { label: "Circulars", value: "CIRCULAR" },
  { label: "Blank Forms & Templates", value: "BLANK_FORM" },
  { label: "Rules & Policies", value: "RULES_POLICIES" },
  { label: "Other Official Files", value: "OTHER" },
];

export default function SocietyDocumentsPage() {
  const [documents, setDocuments] = useState<SocietyDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [isManagement, setIsManagement] = useState(false);
  const [r2Configured, setR2Configured] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  // Publish Modal
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [publishFile, setPublishFile] = useState<File | null>(null);
  const [publishTitle, setPublishTitle] = useState("");
  const [publishCategory, setPublishCategory] = useState("OFFICIAL_NOTICE");
  const [publishVisibility, setPublishVisibility] = useState<
    "ALL_RESIDENTS" | "OWNERS_ONLY" | "TENANTS_ONLY" | "MANAGEMENT_ONLY"
  >("ALL_RESIDENTS");
  const [publishDesc, setPublishDesc] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  // Preview Modal
  const [previewDoc, setPreviewDoc] = useState<SocietyDocument | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const fetchDocuments = useCallback(async () => {
    try {
      const params = new URLSearchParams({ category: selectedCategory });
      if (searchQuery.trim()) {
        params.append("search", searchQuery.trim());
      }

      const res = await fetch(`/api/society-documents?${params.toString()}`);
      const data = await res.json();
      if (res.ok && data.documents) {
        setDocuments(data.documents);
        setIsManagement(data.isManagement);
        setR2Configured(data.r2Configured);
      }
    } catch {
      console.error("Failed to load society documents");
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchQuery]);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      try {
        const params = new URLSearchParams({ category: selectedCategory });
        if (searchQuery.trim()) {
          params.append("search", searchQuery.trim());
        }

        const res = await fetch(`/api/society-documents?${params.toString()}`);
        const data = await res.json();
        if (!ignore && res.ok && data.documents) {
          setDocuments(data.documents);
          setIsManagement(data.isManagement);
          setR2Configured(data.r2Configured);
        }
      } catch {
        console.error("Failed to load society documents");
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };
    load();
    return () => {
      ignore = true;
    };
  }, [selectedCategory, searchQuery]);

  const handlePublishSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publishFile) {
      setPublishError("Please choose a file to publish.");
      return;
    }
    if (publishFile.size > 10 * 1024 * 1024) {
      setPublishError("File size exceeds 10 MB limit.");
      return;
    }

    setIsPublishing(true);
    setPublishError(null);

    try {
      const formData = new FormData();
      formData.append("file", publishFile);
      formData.append("displayName", publishTitle.trim() || publishFile.name);
      formData.append("category", publishCategory);
      formData.append("visibility", publishVisibility);
      formData.append("description", publishDesc.trim());

      const res = await fetch("/api/society-documents", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setPublishError(data.error || "Failed to publish society document.");
        setIsPublishing(false);
        return;
      }

      setIsPublishModalOpen(false);
      setPublishFile(null);
      setPublishTitle("");
      setPublishDesc("");
      await fetchDocuments();
    } catch {
      setPublishError("Network error publishing document.");
    } finally {
      setIsPublishing(false);
    }
  };

  const getVisibilityBadge = (vis: string) => {
    switch (vis) {
      case "ALL_RESIDENTS":
        return <StatusBadge variant="success" size="sm">All Residents</StatusBadge>;
      case "OWNERS_ONLY":
        return <StatusBadge variant="neutral" size="sm">Owners Only</StatusBadge>;
      case "TENANTS_ONLY":
        return <StatusBadge variant="neutral" size="sm">Tenants Only</StatusBadge>;
      case "MANAGEMENT_ONLY":
        return <StatusBadge variant="warning" size="sm">Management Only</StatusBadge>;
      default:
        return null;
    }
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <PageHeader
          title="Society Document Library"
          description="Official cooperative bylaws, statutory certificates, general body meeting notices, and administrative circulars."
          badge={
            <StatusBadge variant={r2Configured ? "neutral" : "warning"} size="sm" dot>
              {r2Configured ? "Published Archive" : "Local Storage Mode"}
            </StatusBadge>
          }
          actions={
            isManagement ? (
              <AppButton
                variant="hero"
                size="sm"
                leftIcon="cloud-upload-outline"
                onClick={() => setIsPublishModalOpen(true)}
              >
                Publish Official Document
              </AppButton>
            ) : undefined
          }
        />

        {/* Filter Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-[#F8F9FA] p-3 rounded-2xl border border-[#E5E7EB]">
          <div className="flex-1 max-w-md">
            <SearchField
              placeholder="Search circulars, bylaws, forms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 rounded-xl border border-[#E5E7EB] bg-white text-xs text-[#1A1A1A] outline-none"
            >
              {SOCIETY_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Documents Grid */}
        {loading ? (
          <div className="py-16 text-center text-xs text-[#9CA3AF]">
            Loading society library...
          </div>
        ) : documents.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#E5E7EB] bg-white p-12 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center mx-auto">
              <IonIcon name="library-outline" size={28} />
            </div>
            <h3 className="font-bold text-sm text-[#1A1A1A]">No society documents published</h3>
            <p className="text-xs text-[#6B7280] max-w-sm mx-auto">
              {isManagement
                ? "As Managing Committee, you can publish registration certificates, bye-laws, and circulars for residents."
                : "Your society committee has not published any official notices or documents under this category yet."}
            </p>
            {isManagement && (
              <div className="pt-2">
                <AppButton
                  variant="primary"
                  size="sm"
                  leftIcon="cloud-upload-outline"
                  onClick={() => setIsPublishModalOpen(true)}
                >
                  Publish Document
                </AppButton>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="rounded-2xl border border-[#E5E7EB] bg-white p-5 flex flex-col justify-between space-y-4 hover:border-[#C7D2FE] hover:shadow-xs transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 pb-3 border-b border-[#F1F3F5]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center shrink-0">
                        <IonIcon
                          name={
                            doc.mimeType.includes("pdf")
                              ? "document-text-outline"
                              : "image-outline"
                          }
                          size={18}
                        />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider block">
                          {doc.category.replace(/_/g, " ")}
                        </span>
                        <h4 className="font-bold text-xs text-[#1A1A1A] truncate" title={doc.displayName}>
                          {doc.displayName}
                        </h4>
                      </div>
                    </div>

                    <div className="shrink-0">{getVisibilityBadge(doc.visibility)}</div>
                  </div>

                  {doc.description && (
                    <p className="text-[11px] text-[#6B7280] mt-2 line-clamp-2">
                      {doc.description}
                    </p>
                  )}

                  <div className="mt-3 flex items-center justify-between text-[11px] text-[#9CA3AF]">
                    <span>{(doc.size / (1024 * 1024)).toFixed(2)} MB</span>
                    <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#F1F3F5] flex items-center justify-between gap-2">
                  <AppButton
                    type="button"
                    variant="outline"
                    size="sm"
                    leftIcon="eye-outline"
                    onClick={() => setPreviewDoc(doc)}
                  >
                    View
                  </AppButton>

                  {doc.downloadUrl && (
                    <a href={doc.downloadUrl} download={doc.displayName}>
                      <AppButton
                        type="button"
                        variant="ghost"
                        size="sm"
                        leftIcon="download-outline"
                      >
                        Download
                      </AppButton>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* PUBLISH MODAL FOR MANAGEMENT */}
        <Modal
          isOpen={isPublishModalOpen}
          onClose={() => setIsPublishModalOpen(false)}
          title="Publish Official Society Document"
          description="Publish official records to the society library for residents or committee members."
          maxWidth="md"
        >
          <form onSubmit={handlePublishSubmit} className="space-y-4 py-1 text-xs">
            {publishError && (
              <div className="p-3 rounded-xl bg-[#FFF1F2] border border-[#FECDD3] text-[#BE123C] text-xs">
                {publishError}
              </div>
            )}

            <div>
              <label className="font-bold text-[#1A1A1A] block mb-1">Select File *</label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                ref={fileInputRef}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    setPublishFile(f);
                    if (!publishTitle) setPublishTitle(f.name);
                  }
                }}
                className="w-full p-2 rounded-xl border border-[#E5E7EB] text-xs bg-white"
              />
              {publishFile && (
                <p className="text-[11px] text-[#6B7280] mt-1">
                  Selected: {publishFile.name} ({(publishFile.size / (1024 * 1024)).toFixed(2)} MB)
                </p>
              )}
            </div>

            <FormField
              label="Document Title"
              placeholder="e.g. Society_Bylaws_2026_Approved.pdf"
              value={publishTitle}
              onChange={(e) => setPublishTitle(e.target.value)}
            />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-[#1A1A1A] block mb-1">Document Category *</label>
                <select
                  value={publishCategory}
                  onChange={(e) => setPublishCategory(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#E5E7EB] bg-white text-xs outline-none focus:ring-1 focus:ring-[#4F46E5]"
                >
                  <option value="REGISTRATION_CERTIFICATE">Registration Certificate</option>
                  <option value="BYLAWS">Society Bye-laws</option>
                  <option value="OFFICIAL_NOTICE">Official Notice</option>
                  <option value="CIRCULAR">Administrative Circular</option>
                  <option value="BLANK_FORM">Blank Form / Template</option>
                  <option value="RULES_POLICIES">Rules &amp; Policies</option>
                  <option value="OTHER">Other Society Document</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-[#1A1A1A] block mb-1">Visibility Audience *</label>
                <select
                  value={publishVisibility}
                  onChange={(e) =>
                    setPublishVisibility(
                      e.target.value as "ALL_RESIDENTS" | "OWNERS_ONLY" | "TENANTS_ONLY" | "MANAGEMENT_ONLY"
                    )
                  }
                  className="w-full p-2.5 rounded-xl border border-[#E5E7EB] bg-white text-xs outline-none focus:ring-1 focus:ring-[#4F46E5]"
                >
                  <option value="ALL_RESIDENTS">All Verified Residents</option>
                  <option value="OWNERS_ONLY">Owners Only</option>
                  <option value="TENANTS_ONLY">Tenants Only</option>
                  <option value="MANAGEMENT_ONLY">Management Only</option>
                </select>
              </div>
            </div>

            <div>
              <label className="font-bold text-[#1A1A1A] block mb-1">Description / Summary</label>
              <textarea
                rows={2}
                placeholder="Brief summary or notice explanation..."
                value={publishDesc}
                onChange={(e) => setPublishDesc(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-[#E5E7EB] bg-white text-xs outline-none focus:ring-1 focus:ring-[#4F46E5]"
              />
            </div>

            <div className="pt-3 border-t border-[#F1F3F5] flex justify-end gap-2">
              <AppButton
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsPublishModalOpen(false)}
              >
                Cancel
              </AppButton>
              <AppButton
                type="submit"
                variant="primary"
                size="sm"
                disabled={isPublishing || !publishFile}
              >
                {isPublishing ? "Publishing..." : "Publish to Library"}
              </AppButton>
            </div>
          </form>
        </Modal>

        {/* PREVIEW MODAL */}
        {previewDoc && (
          <Modal
            isOpen={Boolean(previewDoc)}
            onClose={() => setPreviewDoc(null)}
            title={previewDoc.displayName}
            description={`Version ${previewDoc.version} • ${(previewDoc.size / (1024 * 1024)).toFixed(2)} MB • Published on ${new Date(previewDoc.createdAt).toLocaleDateString()}`}
            maxWidth="lg"
          >
            <div className="space-y-4">
              <div className="w-full h-[460px] bg-slate-50 border border-slate-200 rounded-xl overflow-hidden flex items-center justify-center">
                {previewDoc.mimeType.includes("pdf") ? (
                  <iframe
                    src={previewDoc.viewUrl}
                    className="w-full h-full border-none"
                    title={previewDoc.displayName}
                  />
                ) : previewDoc.mimeType.includes("image") ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={previewDoc.viewUrl}
                    alt={previewDoc.displayName}
                    className="max-h-full max-w-full object-contain p-2"
                  />
                ) : (
                  <div className="text-center p-6 space-y-2">
                    <IonIcon name="document-outline" size={48} className="text-slate-400 mx-auto" />
                    <p className="text-xs text-slate-600">
                      Inline preview not available for {previewDoc.mimeType}.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                {previewDoc.downloadUrl && (
                  <a href={previewDoc.downloadUrl} download={previewDoc.displayName}>
                    <AppButton variant="primary" size="sm" leftIcon="download-outline">
                      Download
                    </AppButton>
                  </a>
                )}
                <AppButton variant="outline" size="sm" onClick={() => setPreviewDoc(null)}>
                  Close
                </AppButton>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </AppShell>
  );
}
