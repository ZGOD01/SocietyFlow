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

interface VaultDocument {
  id: string;
  documentId: string;
  displayName: string;
  originalFilename: string;
  category: string;
  scope: "PRIVATE" | "PROPERTY" | "SOCIETY";
  size: number;
  mimeType: string;
  version: number;
  verificationStatus: string;
  visibility: string;
  description?: string;
  isOwner: boolean;
  createdAt: string;
  updatedAt: string;
  viewUrl?: string;
  downloadUrl?: string;
}

const CATEGORIES = [
  { label: "All Categories", value: "ALL" },
  { label: "Identity Documents", value: "IDENTITY_PROOF" },
  { label: "Property Documents", value: "PROPERTY" },
  { label: "Agreements", value: "AGREEMENT" },
  { label: "Certificates", value: "CERTIFICATE" },
  { label: "Financial Records", value: "FINANCIAL" },
  { label: "Other Vault Files", value: "OTHER" },
];

export default function DocumentVaultPage() {
  const [activeTab, setActiveTab] = useState<"MY_DOCS" | "PROPERTY_DOCS" | "ALL">("MY_DOCS");
  const [documents, setDocuments] = useState<VaultDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [r2Configured, setR2Configured] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "name" | "size">("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Upload Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadCategory, setUploadCategory] = useState("IDENTITY_PROOF");
  const [uploadScope, setUploadScope] = useState<"PRIVATE" | "PROPERTY">("PRIVATE");
  const [uploadDesc, setUploadDesc] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);

  // Preview Modal State
  const [previewDoc, setPreviewDoc] = useState<VaultDocument | null>(null);

  // Rename Modal State
  const [renameDoc, setRenameDoc] = useState<VaultDocument | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Replace Modal State
  const [replaceDoc, setReplaceDoc] = useState<VaultDocument | null>(null);
  const [replaceFile, setReplaceFile] = useState<File | null>(null);
  const [changeNote, setChangeNote] = useState("");
  const [isReplacing, setIsReplacing] = useState(false);

  // Delete Modal State
  const [deleteDoc, setDeleteDoc] = useState<VaultDocument | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const replaceInputRef = useRef<HTMLInputElement | null>(null);

  const fetchDocuments = useCallback(async () => {
    try {
      const scopeFilter =
        activeTab === "MY_DOCS"
          ? "PRIVATE"
          : activeTab === "PROPERTY_DOCS"
          ? "PROPERTY"
          : "ALL";

      const queryParams = new URLSearchParams({
        scope: scopeFilter,
        category: selectedCategory,
        sort: sortBy,
      });
      if (searchQuery.trim()) {
        queryParams.append("search", searchQuery.trim());
      }

      const res = await fetch(`/api/documents?${queryParams.toString()}`);
      const data = await res.json();
      if (res.ok && data.documents) {
        setDocuments(data.documents);
        setR2Configured(data.r2Configured);
      }
    } catch {
      console.error("Failed to load vault documents");
    } finally {
      setLoading(false);
    }
  }, [activeTab, selectedCategory, searchQuery, sortBy]);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      try {
        const scopeFilter =
          activeTab === "MY_DOCS"
            ? "PRIVATE"
            : activeTab === "PROPERTY_DOCS"
            ? "PROPERTY"
            : "ALL";

        const queryParams = new URLSearchParams({
          scope: scopeFilter,
          category: selectedCategory,
          sort: sortBy,
        });
        if (searchQuery.trim()) {
          queryParams.append("search", searchQuery.trim());
        }

        const res = await fetch(`/api/documents?${queryParams.toString()}`);
        const data = await res.json();
        if (!ignore && res.ok && data.documents) {
          setDocuments(data.documents);
          setR2Configured(data.r2Configured);
        }
      } catch {
        console.error("Failed to load vault documents");
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
  }, [activeTab, selectedCategory, searchQuery, sortBy]);

  // Handle Upload
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      setFormError("Please select a file to upload.");
      return;
    }
    if (uploadFile.size > 10 * 1024 * 1024) {
      setFormError("File size exceeds 10 MB limit.");
      return;
    }

    setIsUploading(true);
    setFormError(null);
    setUploadProgress(20);

    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("displayName", uploadTitle.trim() || uploadFile.name);
      formData.append("category", uploadCategory);
      formData.append("scope", uploadScope);
      formData.append("description", uploadDesc.trim());

      setUploadProgress(60);
      const res = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      });

      setUploadProgress(90);
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Failed to upload document.");
        setIsUploading(false);
        return;
      }

      setUploadProgress(100);
      setIsUploadModalOpen(false);
      setUploadFile(null);
      setUploadTitle("");
      setUploadDesc("");
      await fetchDocuments();
    } catch {
      setFormError("Network error during file upload.");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Handle Rename
  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameDoc || !newTitle.trim()) return;

    setIsUpdating(true);
    try {
      const res = await fetch(`/api/documents/${renameDoc.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: newTitle.trim(),
          description: newDesc.trim(),
        }),
      });
      if (res.ok) {
        setRenameDoc(null);
        await fetchDocuments();
      }
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle Replace File
  const handleReplaceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replaceDoc || !replaceFile) return;

    setIsReplacing(true);
    try {
      const formData = new FormData();
      formData.append("file", replaceFile);
      if (changeNote.trim()) {
        formData.append("changeNote", changeNote.trim());
      }

      const res = await fetch(`/api/documents/${replaceDoc.id}/replace`, {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        setReplaceDoc(null);
        setReplaceFile(null);
        setChangeNote("");
        await fetchDocuments();
      }
    } finally {
      setIsReplacing(false);
    }
  };

  // Handle Delete
  const handleDeleteSubmit = async () => {
    if (!deleteDoc) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/documents/${deleteDoc.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDeleteDoc(null);
        await fetchDocuments();
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Page Header */}
        <PageHeader
          title="Digital Document Vault"
          description="Private personal records and property-linked documents encrypted with Cloudflare R2 object storage."
          badge={
            <StatusBadge variant={r2Configured ? "success" : "warning"} size="sm" dot>
              {r2Configured ? "R2 Cloud Active" : "Local Storage Mode"}
            </StatusBadge>
          }
          actions={
            <AppButton
              variant="hero"
              size="sm"
              leftIcon="add-outline"
              onClick={() => setIsUploadModalOpen(true)}
            >
              Upload to Vault
            </AppButton>
          }
        />

        {/* R2 Credentials Notice */}
        {!r2Configured && (
          <div className="p-3.5 rounded-xl border border-[#FDE68A] bg-[#FFFBEB] text-xs text-[#92400E] flex items-start gap-2.5">
            <IonIcon name="information-circle" size={18} className="text-[#F59E0B] shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold block text-[#92400E]">Cloudflare R2 Setup Notice</span>
              <p className="text-[11px] text-[#B45309] leading-relaxed">
                Vault is running in development storage mode. To activate private Cloudflare R2 object storage, provide <code>R2_ACCOUNT_ID</code>, <code>R2_ACCESS_KEY_ID</code>, <code>R2_SECRET_ACCESS_KEY</code>, and <code>R2_BUCKET_NAME</code> in your environment.
              </p>
            </div>
          </div>
        )}

        {/* Vault Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-[#E5E7EB] pb-3 text-xs overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("MY_DOCS")}
            className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === "MY_DOCS"
                ? "bg-[#1A1A1A] text-white shadow-xs"
                : "text-[#6B7280] hover:text-[#1A1A1A] hover:bg-slate-100"
            }`}
          >
            <IonIcon name="lock-closed-outline" size={14} />
            <span>My Documents (Personal Vault)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("PROPERTY_DOCS")}
            className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === "PROPERTY_DOCS"
                ? "bg-[#1A1A1A] text-white shadow-xs"
                : "text-[#6B7280] hover:text-[#1A1A1A] hover:bg-slate-100"
            }`}
          >
            <IonIcon name="home-outline" size={14} />
            <span>Property Documents (Flat Vault)</span>
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-[#F8F9FA] p-3 rounded-2xl border border-[#E5E7EB]">
          <div className="flex-1 max-w-md">
            <SearchField
              placeholder="Search documents by name, category, or note..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap text-xs">
            {/* Category Selector */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 rounded-xl border border-[#E5E7EB] bg-white text-xs text-[#1A1A1A] outline-none"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>

            {/* Sort Selector */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "newest" | "oldest" | "name" | "size")}
              className="px-3 py-2 rounded-xl border border-[#E5E7EB] bg-white text-xs text-[#1A1A1A] outline-none"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name">Name (A-Z)</option>
              <option value="size">File Size</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center border border-[#E5E7EB] rounded-xl overflow-hidden bg-white">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`p-2 transition-colors ${
                  viewMode === "grid" ? "bg-[#EEF2FF] text-[#4F46E5]" : "text-[#6B7280]"
                }`}
                title="Grid View"
              >
                <IonIcon name="grid-outline" size={16} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`p-2 transition-colors ${
                  viewMode === "list" ? "bg-[#EEF2FF] text-[#4F46E5]" : "text-[#6B7280]"
                }`}
                title="List View"
              >
                <IonIcon name="list-outline" size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Documents Content */}
        {loading ? (
          <div className="py-16 text-center text-xs text-[#9CA3AF]">
            Loading vault documents...
          </div>
        ) : documents.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#E5E7EB] bg-white p-12 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center mx-auto">
              <IonIcon name="folder-open-outline" size={28} />
            </div>
            <h3 className="font-bold text-sm text-[#1A1A1A]">No documents found in this vault section</h3>
            <p className="text-xs text-[#6B7280] max-w-sm mx-auto">
              {activeTab === "MY_DOCS"
                ? "Your personal vault is private. Upload contracts, identity cards, or certificates anytime."
                : "No property documents indexed for this unit yet."}
            </p>
            <div className="pt-2">
              <AppButton
                variant="primary"
                size="sm"
                leftIcon="cloud-upload-outline"
                onClick={() => setIsUploadModalOpen(true)}
              >
                Upload Document Now
              </AppButton>
            </div>
          </div>
        ) : viewMode === "grid" ? (
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

                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F8F9FA] text-[#6B7280] border border-[#E5E7EB]">
                        v{doc.version}
                      </span>
                      {doc.scope === "PROPERTY" ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EEF2FF] text-[#4F46E5]">
                          Property
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F8F9FA] text-[#1A1A1A] border border-[#E5E7EB]">
                          Private
                        </span>
                      )}
                    </div>
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

                {/* Actions */}
                <div className="pt-3 border-t border-[#F1F3F5] flex items-center justify-between gap-1 flex-wrap">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setPreviewDoc(doc)}
                      className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#4F46E5] hover:bg-[#EEF2FF] transition-colors"
                      title="View Document"
                    >
                      <IonIcon name="eye-outline" size={16} />
                    </button>

                    {doc.downloadUrl && (
                      <a
                        href={doc.downloadUrl}
                        download={doc.displayName}
                        className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#4F46E5] hover:bg-[#EEF2FF] transition-colors"
                        title="Download Document"
                      >
                        <IonIcon name="download-outline" size={16} />
                      </a>
                    )}
                  </div>

                  {doc.isOwner && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setReplaceDoc(doc);
                          setReplaceFile(null);
                        }}
                        className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#4F46E5] hover:bg-[#EEF2FF] transition-colors"
                        title="Replace File"
                      >
                        <IonIcon name="repeat-outline" size={16} />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setRenameDoc(doc);
                          setNewTitle(doc.displayName);
                          setNewDesc(doc.description || "");
                        }}
                        className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#1A1A1A] hover:bg-slate-100 transition-colors"
                        title="Rename Document"
                      >
                        <IonIcon name="create-outline" size={16} />
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeleteDoc(doc)}
                        className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#F43F5E] hover:bg-[#FFF1F2] transition-colors"
                        title="Delete Document"
                      >
                        <IonIcon name="trash-outline" size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-[#E5E7EB] bg-white overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8F9FA] border-b border-[#E5E7EB] text-[#6B7280] uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Document</th>
                    <th className="py-3 px-4">Scope</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Size</th>
                    <th className="py-3 px-4">Version</th>
                    <th className="py-3 px-4">Uploaded</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F3F5]">
                  {documents.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <IonIcon
                            name={
                              doc.mimeType.includes("pdf")
                                ? "document-text-outline"
                                : "image-outline"
                            }
                            size={16}
                            className="text-[#4F46E5] shrink-0"
                          />
                          <span className="font-bold text-[#1A1A1A]">{doc.displayName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F8F9FA] text-[#1A1A1A] border border-[#E5E7EB]">
                          {doc.scope}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#6B7280]">{doc.category.replace(/_/g, " ")}</td>
                      <td className="py-3 px-4 text-[#6B7280]">
                        {(doc.size / (1024 * 1024)).toFixed(2)} MB
                      </td>
                      <td className="py-3 px-4 font-mono text-[#4F46E5]">v{doc.version}</td>
                      <td className="py-3 px-4 text-[#9CA3AF]">
                        {new Date(doc.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setPreviewDoc(doc)}
                            className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#4F46E5] hover:bg-[#EEF2FF]"
                            title="View"
                          >
                            <IonIcon name="eye-outline" size={15} />
                          </button>
                          {doc.downloadUrl && (
                            <a
                              href={doc.downloadUrl}
                              download={doc.displayName}
                              className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#4F46E5] hover:bg-[#EEF2FF]"
                              title="Download"
                            >
                              <IonIcon name="download-outline" size={15} />
                            </a>
                          )}
                          {doc.isOwner && (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setRenameDoc(doc);
                                  setNewTitle(doc.displayName);
                                  setNewDesc(doc.description || "");
                                }}
                                className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#1A1A1A] hover:bg-slate-100"
                                title="Rename"
                              >
                                <IonIcon name="create-outline" size={15} />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteDoc(doc)}
                                className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#F43F5E] hover:bg-[#FFF1F2]"
                                title="Delete"
                              >
                                <IonIcon name="trash-outline" size={15} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* UPLOAD MODAL */}
        <Modal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          title="Upload to Document Vault"
          description="Upload files up to 10 MB in PDF, JPG, or PNG format."
          maxWidth="md"
        >
          <form onSubmit={handleUploadSubmit} className="space-y-4 py-1 text-xs">
            {formError && (
              <div className="p-3 rounded-xl bg-[#FFF1F2] border border-[#FECDD3] text-[#BE123C] text-xs">
                {formError}
              </div>
            )}

            <div>
              <label className="font-bold text-[#1A1A1A] block mb-1">Choose File *</label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                ref={uploadInputRef}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    setUploadFile(f);
                    if (!uploadTitle) setUploadTitle(f.name);
                  }
                }}
                className="w-full p-2 rounded-xl border border-[#E5E7EB] text-xs bg-white"
              />
              {uploadFile && (
                <p className="text-[11px] text-[#6B7280] mt-1">
                  Selected: {uploadFile.name} ({(uploadFile.size / (1024 * 1024)).toFixed(2)} MB)
                </p>
              )}
            </div>

            <FormField
              label="Document Title"
              placeholder="e.g. Electricity_Bill_April_2026.pdf"
              value={uploadTitle}
              onChange={(e) => setUploadTitle(e.target.value)}
            />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-[#1A1A1A] block mb-1">Vault Scope *</label>
                <select
                  value={uploadScope}
                  onChange={(e) => setUploadScope(e.target.value as "PRIVATE" | "PROPERTY")}
                  className="w-full p-2.5 rounded-xl border border-[#E5E7EB] bg-white text-xs outline-none focus:ring-1 focus:ring-[#4F46E5]"
                >
                  <option value="PRIVATE">Personal Vault (Private)</option>
                  <option value="PROPERTY">Property Vault (Flat Linked)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-[#1A1A1A] block mb-1">Category *</label>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#E5E7EB] bg-white text-xs outline-none focus:ring-1 focus:ring-[#4F46E5]"
                >
                  <option value="IDENTITY_PROOF">Identity Documents</option>
                  <option value="PROPERTY">Property Documents</option>
                  <option value="AGREEMENT">Agreements</option>
                  <option value="CERTIFICATE">Certificates</option>
                  <option value="FINANCIAL">Financial Records</option>
                  <option value="OTHER">Other Vault Files</option>
                </select>
              </div>
            </div>

            <div>
              <label className="font-bold text-[#1A1A1A] block mb-1">Description / Notes</label>
              <textarea
                rows={2}
                placeholder="Optional notes or index details..."
                value={uploadDesc}
                onChange={(e) => setUploadDesc(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-[#E5E7EB] bg-white text-xs outline-none focus:ring-1 focus:ring-[#4F46E5]"
              />
            </div>

            {isUploading && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] text-[#6B7280]">
                  <span>Uploading to Cloudflare R2...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-[#4F46E5] h-1.5 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-[#F1F3F5] flex justify-end gap-2">
              <AppButton
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsUploadModalOpen(false)}
              >
                Cancel
              </AppButton>
              <AppButton
                type="submit"
                variant="primary"
                size="sm"
                disabled={isUploading || !uploadFile}
              >
                {isUploading ? "Uploading..." : "Save to Vault"}
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
            description={`Version ${previewDoc.version} • ${(previewDoc.size / (1024 * 1024)).toFixed(2)} MB • ${previewDoc.category}`}
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

              <div className="flex justify-between items-center pt-2">
                <span className="text-[11px] text-[#9CA3AF]">
                  Uploaded on {new Date(previewDoc.createdAt).toLocaleDateString()}
                </span>
                <div className="flex gap-2">
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
            </div>
          </Modal>
        )}

        {/* RENAME MODAL */}
        {renameDoc && (
          <Modal
            isOpen={Boolean(renameDoc)}
            onClose={() => setRenameDoc(null)}
            title="Edit Document Details"
            description="Update title and notes for this document record."
            maxWidth="sm"
          >
            <form onSubmit={handleRenameSubmit} className="space-y-3 py-1 text-xs">
              <FormField
                label="Display Name *"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />

              <div>
                <label className="font-bold text-[#1A1A1A] block mb-1">Notes / Description</label>
                <textarea
                  rows={2}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#E5E7EB] bg-white text-xs outline-none focus:ring-1 focus:ring-[#4F46E5]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-[#F1F3F5]">
                <AppButton
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setRenameDoc(null)}
                >
                  Cancel
                </AppButton>
                <AppButton type="submit" variant="primary" size="sm" disabled={isUpdating}>
                  {isUpdating ? "Saving..." : "Save Changes"}
                </AppButton>
              </div>
            </form>
          </Modal>
        )}

        {/* REPLACE FILE MODAL */}
        {replaceDoc && (
          <Modal
            isOpen={Boolean(replaceDoc)}
            onClose={() => setReplaceDoc(null)}
            title={`Replace File — ${replaceDoc.displayName}`}
            description={`Upload a new file version. Previous version (v${replaceDoc.version}) will be preserved in history.`}
            maxWidth="sm"
          >
            <form onSubmit={handleReplaceSubmit} className="space-y-3 py-1 text-xs">
              <div>
                <label className="font-bold text-[#1A1A1A] block mb-1">Select New File *</label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  ref={replaceInputRef}
                  onChange={(e) => setReplaceFile(e.target.files?.[0] || null)}
                  className="w-full p-2 rounded-xl border border-[#E5E7EB] text-xs bg-white"
                />
              </div>

              <div>
                <label className="font-bold text-[#1A1A1A] block mb-1">Change Reason</label>
                <input
                  type="text"
                  placeholder="e.g. Scanned higher resolution copy"
                  value={changeNote}
                  onChange={(e) => setChangeNote(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#E5E7EB] bg-white text-xs outline-none focus:ring-1 focus:ring-[#4F46E5]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-[#F1F3F5]">
                <AppButton
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setReplaceDoc(null)}
                >
                  Cancel
                </AppButton>
                <AppButton
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isReplacing || !replaceFile}
                >
                  {isReplacing ? "Uploading Version..." : "Confirm Replacement"}
                </AppButton>
              </div>
            </form>
          </Modal>
        )}

        {/* DELETE CONFIRMATION MODAL */}
        {deleteDoc && (
          <Modal
            isOpen={Boolean(deleteDoc)}
            onClose={() => setDeleteDoc(null)}
            title="Delete Document"
            description="Are you sure you want to remove this document from your vault?"
            maxWidth="sm"
          >
            <div className="space-y-4 py-1 text-xs">
              <p className="text-[#6B7280]">
                Deleting <strong className="text-[#1A1A1A]">{deleteDoc.displayName}</strong> will archive the record and delete its storage object. This action cannot be undone.
              </p>

              <div className="pt-2 flex justify-end gap-2 border-t border-[#F1F3F5]">
                <AppButton
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteDoc(null)}
                >
                  Keep Document
                </AppButton>
                <AppButton
                  type="button"
                  variant="danger"
                  size="sm"
                  disabled={isDeleting}
                  onClick={handleDeleteSubmit}
                >
                  {isDeleting ? "Deleting..." : "Yes, Delete"}
                </AppButton>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </AppShell>
  );
}
