"use client";

import React, { useState, useEffect, Suspense, useTransition } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";

interface ServiceFieldDef {
  code: string;
  label: string;
  type: "text" | "number" | "date" | "select" | "checkbox" | "textarea";
  required: boolean;
  placeholder?: string;
  options?: string[];
  helpText?: string;
}

interface ServiceDocDef {
  code: string;
  name: string;
  required: boolean;
  description?: string;
}

interface ServiceConfigItem {
  id: string;
  code: string;
  title: string;
  description: string;
  category: string;
  eligibility: "OWNER" | "TENANT" | "BOTH";
  requiresOwnerAuthorization: boolean;
  estimatedProcessingDays: number;
  isActive: boolean;
  isDownstreamAvailable: boolean;
  downstreamNote?: string;
  requiredFields: ServiceFieldDef[];
  requiredDocuments: ServiceDocDef[];
  version: number;
  updatedAt: string;
}

const CATEGORIES = [
  "Certificates & NOCs",
  "Property",
  "Tenant & Occupancy",
  "Permissions",
  "General",
] as const;

function ManagementServicesContent() {
  const [services, setServices] = useState<ServiceConfigItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [search, setSearch] = useState("");

  // Edit / Config Modal
  const [editingService, setEditingService] = useState<ServiceConfigItem | null>(null);
  const [editForm, setEditForm] = useState<{
    title: string;
    description: string;
    eligibility: "OWNER" | "TENANT" | "BOTH";
    requiresOwnerAuthorization: boolean;
    estimatedProcessingDays: number;
    isActive: boolean;
    requiredFields: ServiceFieldDef[];
    requiredDocuments: ServiceDocDef[];
  }>({
    title: "",
    description: "",
    eligibility: "BOTH",
    requiresOwnerAuthorization: false,
    estimatedProcessingDays: 3,
    isActive: true,
    requiredFields: [],
    requiredDocuments: [],
  });
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const fetchServices = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/management/services");
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to load services");
      }
      setServices(data.services || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error fetching services");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/management/services");
        const data = await res.json();
        if (!ignore) {
          if (!res.ok) {
            setError(data.error || "Failed to load services");
          } else {
            setServices(data.services || []);
          }
        }
      } catch (err: unknown) {
        if (!ignore) setError(err instanceof Error ? err.message : "Error fetching services");
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    load();
    return () => {
      ignore = true;
    };
  }, []);

  const openEditModal = (service: ServiceConfigItem) => {
    setEditingService(service);
    setEditForm({
      title: service.title,
      description: service.description,
      eligibility: service.eligibility,
      requiresOwnerAuthorization: service.requiresOwnerAuthorization,
      estimatedProcessingDays: service.estimatedProcessingDays || 3,
      isActive: service.isActive,
      requiredFields: JSON.parse(JSON.stringify(service.requiredFields || [])),
      requiredDocuments: JSON.parse(JSON.stringify(service.requiredDocuments || [])),
    });
    setSaveSuccess(null);
    setSaveError(null);
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;

    if (!editForm.title.trim()) {
      setSaveError("Service title is required");
      return;
    }

    try {
      setSaving(true);
      setSaveError(null);
      setSaveSuccess(null);

      const res = await fetch("/api/management/services", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: editingService.id,
          ...editForm,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update service");
      }

      setSaveSuccess(data.message || "Service template updated successfully");
      startTransition(() => {
        setTimeout(() => {
          setEditingService(null);
          setSaveSuccess(null);
          fetchServices();
        }, 1200);
      });
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  // Quick Toggle Active State
  const handleToggleActive = async (service: ServiceConfigItem) => {
    try {
      const res = await fetch("/api/management/services", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: service.id,
          isActive: !service.isActive,
        }),
      });
      if (res.ok) {
        setServices((prev) =>
          prev.map((s) => (s.id === service.id ? { ...s, isActive: !s.isActive } : s))
        );
      }
    } catch (err) {
      console.error("Toggle error:", err);
    }
  };

  // Manage Dynamic Fields in Edit Modal
  const addField = () => {
    const code = `field_${Date.now().toString(36)}`;
    setEditForm((prev) => ({
      ...prev,
      requiredFields: [
        ...prev.requiredFields,
        {
          code,
          label: "New Information Field",
          type: "text",
          required: true,
          placeholder: "",
        },
      ],
    }));
  };

  const removeField = (index: number) => {
    setEditForm((prev) => ({
      ...prev,
      requiredFields: prev.requiredFields.filter((_, i) => i !== index),
    }));
  };

  const updateField = (index: number, updates: Partial<ServiceFieldDef>) => {
    setEditForm((prev) => ({
      ...prev,
      requiredFields: prev.requiredFields.map((f, i) => (i === index ? { ...f, ...updates } : f)),
    }));
  };

  // Manage Dynamic Docs in Edit Modal
  const addDoc = () => {
    const code = `DOC_${Date.now().toString(36).toUpperCase()}`;
    setEditForm((prev) => ({
      ...prev,
      requiredDocuments: [
        ...prev.requiredDocuments,
        {
          code,
          name: "Required Vault Document",
          required: true,
          description: "Upload or attach from digital vault",
        },
      ],
    }));
  };

  const removeDoc = (index: number) => {
    setEditForm((prev) => ({
      ...prev,
      requiredDocuments: prev.requiredDocuments.filter((_, i) => i !== index),
    }));
  };

  const updateDoc = (index: number, updates: Partial<ServiceDocDef>) => {
    setEditForm((prev) => ({
      ...prev,
      requiredDocuments: prev.requiredDocuments.map((d, i) => (i === index ? { ...d, ...updates } : d)),
    }));
  };

  const filteredServices = services.filter((s) => {
    const matchesCat = selectedCategory === "ALL" || s.category === selectedCategory;
    const matchesSearch =
      !search ||
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.code.toLowerCase().includes(search.toLowerCase()) ||
      s.description.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <AppShell>
      <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 font-sans">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5E7EB] pb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                <i className="icon-[ion--construct-outline] text-sm" /> Society Administration
              </span>
              <span className="text-xs text-[#6B7280]">Prompt 7 Engine</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#1A1A1A] font-outfit tracking-tight">
              Service Catalogue Configuration
            </h1>
            <p className="text-sm text-[#6B7280] mt-1 max-w-2xl">
              Enable, disable, and customize service intake requirements independently for your society. 
              Changes update template versions without modifying historical or in-flight applications.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/management/requests"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl border border-[#E5E7EB] bg-white text-[#1A1A1A] hover:bg-[#F8F9FA] transition-colors shadow-sm"
            >
              <i className="icon-[ion--mail-unread-outline]" /> Request Inbox
            </Link>
            <Link
              href="/services"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <i className="icon-[ion--eye-outline]" /> Resident View
            </Link>
          </div>
        </div>

        {/* Immutability Banner */}
        <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-4 flex items-start gap-3 text-xs text-indigo-950 leading-relaxed shadow-sm">
          <i className="icon-[ion--shield-checkmark-outline] text-lg text-indigo-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Template Versioning Guarantee:</span> Updating field requirements or document checklists increments the service template version. Submitted requests retain an immutable snapshot of requirements at time of submission.
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#F8F9FA] border border-[#E5E7EB] rounded-xl">
            <button
              onClick={() => setSelectedCategory("ALL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedCategory === "ALL"
                  ? "bg-white text-indigo-600 shadow-sm border border-[#E5E7EB]"
                  : "text-[#6B7280] hover:text-[#1A1A1A]"
              }`}
            >
              All Categories ({services.length})
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedCategory === cat
                    ? "bg-white text-indigo-600 shadow-sm border border-[#E5E7EB]"
                    : "text-[#6B7280] hover:text-[#1A1A1A]"
                }`}
              >
                {cat} ({services.filter((s) => s.category === cat).length})
              </button>
            ))}
          </div>

          <div className="relative min-w-[260px]">
            <i className="icon-[ion--search-outline] absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#9CA3AF]" />
            <input
              type="text"
              placeholder="Filter services by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-[#E5E7EB] rounded-xl text-xs text-[#1A1A1A] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 shadow-sm"
            />
          </div>
        </div>

        {/* Services List / Cards */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-16 text-center shadow-sm">
            <div className="inline-block animate-spin w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full mb-3" />
            <p className="text-xs text-[#6B7280] font-semibold">Loading configurable service catalog...</p>
          </div>
        ) : error ? (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center text-xs text-rose-700">
            <i className="icon-[ion--alert-circle-outline] text-xl mb-1 block" />
            {error}
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-16 text-center shadow-sm">
            <h3 className="text-sm font-bold text-[#1A1A1A] font-outfit">No Services Found</h3>
            <p className="text-xs text-[#6B7280] mt-1">Try resetting the category filter or search query.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredServices.map((service) => (
              <div
                key={service.id}
                className={`bg-white rounded-2xl border transition-all shadow-sm flex flex-col justify-between ${
                  service.isActive ? "border-[#E5E7EB] hover:shadow-md" : "border-gray-200 opacity-60 bg-gray-50/50"
                }`}
              >
                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">
                      {service.category}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#F8F9FA] text-[#6B7280] border border-[#E5E7EB]">
                        v{service.version}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleToggleActive(service)}
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full border transition-colors ${
                          service.isActive
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                            : "bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200"
                        }`}
                      >
                        {service.isActive ? "Active" : "Disabled"}
                      </button>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-[#1A1A1A] font-outfit">
                    {service.title}
                  </h3>

                  <p className="text-xs text-[#6B7280] line-clamp-2 leading-relaxed">
                    {service.description}
                  </p>

                  {/* Metadata Chips */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
                    <span className="px-2 py-0.5 rounded-md bg-[#F8F9FA] border border-[#E5E7EB] font-semibold text-[#1A1A1A]">
                      Eligibility: {service.eligibility}
                    </span>
                    {service.requiresOwnerAuthorization && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 font-semibold">
                        Owner Auth Required
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100 font-semibold">
                      ~{service.estimatedProcessingDays} days
                    </span>
                  </div>

                  {/* Checklists counts */}
                  <div className="text-[11px] text-[#6B7280] pt-2 border-t border-[#E5E7EB] flex items-center justify-between">
                    <span>
                      <strong className="text-[#1A1A1A]">{service.requiredFields.length}</strong> Form Fields
                    </span>
                    <span>
                      <strong className="text-[#1A1A1A]">{service.requiredDocuments.length}</strong> Required Docs
                    </span>
                  </div>

                  {!service.isDownstreamAvailable && (
                    <div className="p-2 rounded-lg bg-amber-50 text-amber-800 text-[11px] border border-amber-200">
                      <span className="font-bold">Notice:</span> {service.downstreamNote || "Downstream processing not available in this phase."}
                    </div>
                  )}
                </div>

                <div className="px-5 py-3 bg-[#F8F9FA] border-t border-[#E5E7EB] rounded-b-2xl flex items-center justify-between">
                  <Link
                    href={`/requests/new/${service.id}`}
                    target="_blank"
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    <i className="icon-[ion--eye-outline]" /> Preview Form
                  </Link>

                  <button
                    onClick={() => openEditModal(service)}
                    className="px-3 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition-colors flex items-center gap-1"
                  >
                    <i className="icon-[ion--construct-outline]" /> Configure
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Configuration Edit Modal */}
        {editingService && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95">
              {/* Modal Header */}
              <div className="p-6 border-b border-[#E5E7EB] flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-indigo-600">
                      {editingService.code} (v{editingService.version})
                    </span>
                    <span className="text-xs text-[#6B7280]">• {editingService.category}</span>
                  </div>
                  <h3 className="text-lg font-bold text-[#1A1A1A] font-outfit mt-0.5">
                    Configure Service Template
                  </h3>
                </div>
                <button
                  onClick={() => setEditingService(null)}
                  className="p-1 rounded-lg text-[#6B7280] hover:text-[#1A1A1A] hover:bg-[#F8F9FA]"
                >
                  <i className="icon-[ion--close-outline] text-xl" />
                </button>
              </div>

              {/* Modal Body (Scrollable) */}
              <form onSubmit={handleSaveConfig} className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
                {/* Basic Details */}
                <div className="space-y-4">
                  <h4 className="font-bold text-[#1A1A1A] uppercase tracking-wider text-[11px] border-b border-[#E5E7EB] pb-1">
                    Basic Settings
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-[#1A1A1A] mb-1">Service Title</label>
                      <input
                        type="text"
                        value={editForm.title}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-xl text-xs text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                        required
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-[#1A1A1A] mb-1">Eligible Applicants</label>
                      <select
                        value={editForm.eligibility}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            eligibility: e.target.value as "OWNER" | "TENANT" | "BOTH",
                          })
                        }
                        className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-xl text-xs text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                      >
                        <option value="BOTH">Both Owners and Tenants</option>
                        <option value="OWNER">Owners Only</option>
                        <option value="TENANT">Tenants Only</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-[#1A1A1A] mb-1">Description</label>
                    <textarea
                      rows={2}
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-xl text-xs text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-[#1A1A1A] mb-1">
                        Estimated Processing (Business Days)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={60}
                        value={editForm.estimatedProcessingDays}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            estimatedProcessingDays: parseInt(e.target.value) || 3,
                          })
                        }
                        className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-xl text-xs text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                      />
                    </div>

                    <div className="flex flex-col justify-end space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer font-semibold text-[#1A1A1A]">
                        <input
                          type="checkbox"
                          checked={editForm.requiresOwnerAuthorization}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              requiresOwnerAuthorization: e.target.checked,
                            })
                          }
                          className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                        />
                        Require Flat Owner Authorization for Tenant Requests
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer font-semibold text-[#1A1A1A]">
                        <input
                          type="checkbox"
                          checked={editForm.isActive}
                          onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                          className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                        />
                        Service Active and Available in Resident Catalogue
                      </label>
                    </div>
                  </div>
                </div>

                {/* Dynamic Form Fields Builder */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-1">
                    <h4 className="font-bold text-[#1A1A1A] uppercase tracking-wider text-[11px]">
                      Configured Application Fields ({editForm.requiredFields.length})
                    </h4>
                    <button
                      type="button"
                      onClick={addField}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                    >
                      <i className="icon-[ion--add-circle-outline]" /> Add Field
                    </button>
                  </div>

                  <div className="space-y-2">
                    {editForm.requiredFields.map((field, idx) => (
                      <div
                        key={field.code}
                        className="p-3 bg-[#F8F9FA] border border-[#E5E7EB] rounded-xl flex items-center gap-2"
                      >
                        <input
                          type="text"
                          value={field.label}
                          onChange={(e) => updateField(idx, { label: e.target.value })}
                          placeholder="Field Label"
                          className="flex-1 px-2.5 py-1.5 bg-white border border-[#E5E7EB] rounded-lg text-xs text-[#1A1A1A]"
                        />

                        <select
                          value={field.type}
                          onChange={(e) =>
                            updateField(idx, {
                              type: e.target.value as ServiceFieldDef["type"],
                            })
                          }
                          className="px-2 py-1.5 bg-white border border-[#E5E7EB] rounded-lg text-xs text-[#1A1A1A]"
                        >
                          <option value="text">Text</option>
                          <option value="number">Number</option>
                          <option value="date">Date</option>
                          <option value="textarea">Textarea</option>
                          <option value="checkbox">Checkbox</option>
                        </select>

                        <label className="flex items-center gap-1 text-[11px] font-semibold text-[#6B7280]">
                          <input
                            type="checkbox"
                            checked={field.required}
                            onChange={(e) => updateField(idx, { required: e.target.checked })}
                            className="rounded text-indigo-600"
                          />
                          Req
                        </label>

                        <button
                          type="button"
                          onClick={() => removeField(idx)}
                          className="p-1 text-rose-500 hover:text-rose-700"
                        >
                          <i className="icon-[ion--trash-outline] text-base" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Required Documents Checklist Builder */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-1">
                    <h4 className="font-bold text-[#1A1A1A] uppercase tracking-wider text-[11px]">
                      Required Documents Checklist ({editForm.requiredDocuments.length})
                    </h4>
                    <button
                      type="button"
                      onClick={addDoc}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                    >
                      <i className="icon-[ion--add-circle-outline]" /> Add Document Requirement
                    </button>
                  </div>

                  <div className="space-y-2">
                    {editForm.requiredDocuments.map((doc, idx) => (
                      <div
                        key={doc.code}
                        className="p-3 bg-[#F8F9FA] border border-[#E5E7EB] rounded-xl flex items-center gap-2"
                      >
                        <input
                          type="text"
                          value={doc.name}
                          onChange={(e) => updateDoc(idx, { name: e.target.value })}
                          placeholder="Document Title"
                          className="flex-1 px-2.5 py-1.5 bg-white border border-[#E5E7EB] rounded-lg text-xs text-[#1A1A1A]"
                        />

                        <label className="flex items-center gap-1 text-[11px] font-semibold text-[#6B7280]">
                          <input
                            type="checkbox"
                            checked={doc.required}
                            onChange={(e) => updateDoc(idx, { required: e.target.checked })}
                            className="rounded text-indigo-600"
                          />
                          Mandatory
                        </label>

                        <button
                          type="button"
                          onClick={() => removeDoc(idx)}
                          className="p-1 text-rose-500 hover:text-rose-700"
                        >
                          <i className="icon-[ion--trash-outline] text-base" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {saveError && (
                  <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-700 flex items-center gap-2">
                    <i className="icon-[ion--alert-circle-outline]" /> {saveError}
                  </div>
                )}

                {saveSuccess && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-700 flex items-center gap-2">
                    <i className="icon-[ion--checkmark-circle-outline]" /> {saveSuccess}
                  </div>
                )}

                {/* Modal Footer */}
                <div className="pt-4 border-t border-[#E5E7EB] flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingService(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold border border-[#E5E7EB] text-[#6B7280] hover:text-[#1A1A1A] hover:bg-[#F8F9FA]"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {saving ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Publishing Version...
                      </>
                    ) : (
                      <>Publish Template Updates</>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default function ManagementServicesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center text-xs font-semibold text-[#6B7280]">
          Loading service catalogue configuration...
        </div>
      }
    >
      <ManagementServicesContent />
    </Suspense>
  );
}
