"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import {
  PageHeader,
  AppCard,
  StatusBadge,
  AppButton,
  IconContainer,
  IonIcon,
} from "@/components/ui";

interface WorkflowStage {
  stageIndex: number;
  stageKey: string;
  stageName: string;
  stageType: "VERIFICATION" | "APPROVAL" | "ISSUANCE";
  allowedRoles: string[];
  approverLogic: "ANY_ONE" | "ALL_REQUIRED";
  expectedDays: number;
  description?: string;
  requiredSignersCount?: number;
}

interface WorkflowServiceItem {
  serviceCode: string;
  serviceTitle: string;
  serviceCategory: string;
  requiresOwnerAuthorization: boolean;
  workflowId: string | null;
  version: number;
  isCustomized: boolean;
  stages: WorkflowStage[];
  requiresDocumentIssuance: boolean;
  documentTemplateCode?: string;
  publishedAt: string | null;
  publishedByName: string;
}

const AVAILABLE_ROLES = [
  "SECRETARY",
  "CHAIRMAN",
  "TREASURER",
  "SOCIETY_MANAGER",
  "SUPER_ADMIN",
];

function WorkflowsConfigContent() {
  const [workflows, setWorkflows] = useState<WorkflowServiceItem[]>([]);
  const [selectedCode, setSelectedCode] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Active editing state
  const [stages, setStages] = useState<WorkflowStage[]>([]);
  const [requiresDoc, setRequiresDoc] = useState(false);
  const [templateCode, setTemplateCode] = useState<string>("HOME_LOAN_NOC");

  const loadWorkflows = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/management/workflows");
      const data = await res.json();
      if (data.success && data.workflows?.length > 0) {
        setWorkflows(data.workflows);
        const initial = data.workflows[0];
        setSelectedCode(initial.serviceCode);
        setStages(initial.stages || []);
        setRequiresDoc(initial.requiresDocumentIssuance);
        setTemplateCode(initial.documentTemplateCode || "HOME_LOAN_NOC");
      }
    } catch (e) {
      console.error("[Workflows Fetch Error]", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkflows();
  }, []);

  const handleSelectService = (code: string) => {
    setSelectedCode(code);
    const item = workflows.find((w) => w.serviceCode === code);
    if (item) {
      setStages(JSON.parse(JSON.stringify(item.stages || [])));
      setRequiresDoc(item.requiresDocumentIssuance);
      setTemplateCode(item.documentTemplateCode || "HOME_LOAN_NOC");
      setMessage(null);
    }
  };

  const handleAddStage = () => {
    const newIdx = stages.length;
    const newStage: WorkflowStage = {
      stageIndex: newIdx,
      stageKey: `stage_${newIdx + 1}_${Date.now().toString().slice(-4)}`,
      stageName: `Review Stage ${newIdx + 1}`,
      stageType: "APPROVAL",
      allowedRoles: ["SECRETARY"],
      approverLogic: "ANY_ONE",
      expectedDays: 3,
      description: "Official committee review step",
      requiredSignersCount: 1,
    };
    setStages([...stages, newStage]);
  };

  const handleRemoveStage = (index: number) => {
    if (stages.length <= 1) {
      setMessage({ type: "error", text: "At least one workflow stage is required." });
      return;
    }
    const filtered = stages.filter((_, idx) => idx !== index);
    const reindexed = filtered.map((s, idx) => ({ ...s, stageIndex: idx }));
    setStages(reindexed);
  };

  const handleUpdateStage = (index: number, field: keyof WorkflowStage, val: unknown) => {
    const updated = [...stages];
    updated[index] = { ...updated[index], [field]: val };
    setStages(updated);
  };

  const handleToggleRole = (stageIndex: number, role: string) => {
    const updated = [...stages];
    const currentRoles = updated[stageIndex].allowedRoles || [];
    if (currentRoles.includes(role)) {
      if (currentRoles.length === 1) {
        setMessage({ type: "error", text: "Each stage must have at least one authorized role." });
        return;
      }
      updated[stageIndex].allowedRoles = currentRoles.filter((r) => r !== role);
    } else {
      updated[stageIndex].allowedRoles = [...currentRoles, role];
    }
    setStages(updated);
  };

  const handlePublishWorkflow = async () => {
    setSaving(true);
    setMessage(null);

    const currentSvc = workflows.find((w) => w.serviceCode === selectedCode);
    if (!currentSvc) return;

    try {
      const res = await fetch("/api/management/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceCode: selectedCode,
          serviceTitle: currentSvc.serviceTitle,
          stages,
          requiresDocumentIssuance: requiresDoc,
          documentTemplateCode: requiresDoc ? templateCode : undefined,
        }),
      });

      const resJson = await res.json();
      if (!res.ok || !resJson.success) {
        setMessage({ type: "error", text: resJson.error || "Failed to publish workflow." });
        setSaving(false);
        return;
      }

      setMessage({
        type: "success",
        text: `Workflow published successfully (Version ${resJson.workflow?.version}). In-flight requests remain safe on their existing snapshot.`,
      });

      // Reload list
      loadWorkflows();
    } catch {
      setMessage({ type: "error", text: "Network error publishing workflow." });
    } finally {
      setSaving(false);
    }
  };

  const selectedService = workflows.find((w) => w.serviceCode === selectedCode);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Approval Workflow Configuration"
        description="Design multi-stage approval sequences, assign committee roles, and set processing SLAs per service"
        breadcrumbs={[
          { label: "Console", href: "/management/dashboard" },
          { label: "Approvals", href: "/management/approvals" },
          { label: "Workflows" },
        ]}
        actions={
          <Link href="/management/approvals">
            <AppButton variant="outline" size="sm">
              <IonIcon name="arrow-back-outline" className="mr-1.5" />
              Return to Inbox
            </AppButton>
          </Link>
        }
      />

      {loading ? (
        <div className="p-16 text-center bg-white rounded-2xl border border-gray-200">
          <IonIcon name="sync-outline" className="animate-spin text-3xl text-indigo-600 mb-2" />
          <p className="text-sm text-gray-500 font-medium">Loading Society Workflows...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Service Selector Sidebar */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Society Services ({workflows.length})
            </h3>
            <div className="space-y-1 max-h-[70vh] overflow-y-auto pr-1">
              {workflows.map((svc) => (
                <button
                  key={svc.serviceCode}
                  onClick={() => handleSelectService(svc.serviceCode)}
                  className={`w-full text-left p-3 rounded-xl transition-all text-xs ${
                    selectedCode === svc.serviceCode
                      ? "bg-indigo-50 border border-indigo-200 text-indigo-950 font-bold"
                      : "hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate">{svc.serviceTitle}</span>
                    <span className="text-[10px] text-gray-400 font-mono">v{svc.version}</span>
                  </div>
                  <span className="text-[10px] text-gray-500 block mt-0.5">{svc.serviceCategory}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Right Workflow Stage Editor */}
          <div className="lg:col-span-3 space-y-6">
            {selectedService && (
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 border-gray-200">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-gray-900">{selectedService.serviceTitle}</h3>
                      <span className="bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold">
                        v{selectedService.version}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Service Code: <span className="font-mono">{selectedService.serviceCode}</span> •{" "}
                      {selectedService.isCustomized ? "Society Customized" : "Standard Template"}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <AppButton
                      variant="outline"
                      size="sm"
                      onClick={handleAddStage}
                    >
                      <IonIcon name="add-circle-outline" className="mr-1.5" />
                      Add Stage
                    </AppButton>
                    <AppButton
                      variant="primary"
                      size="sm"
                      onClick={handlePublishWorkflow}
                      disabled={saving}
                    >
                      <IonIcon name="cloud-upload-outline" className="mr-1.5" />
                      {saving ? "Publishing..." : "Publish Version"}
                    </AppButton>
                  </div>
                </div>

                {message && (
                  <div
                    className={`p-3.5 rounded-xl text-xs font-semibold ${
                      message.type === "success"
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        : "bg-red-50 text-red-800 border border-red-200"
                    }`}
                  >
                    {message.text}
                  </div>
                )}

                {/* Stages List */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Sequential Approval Sequence ({stages.length} Stages)
                  </h4>

                  {stages.map((st, idx) => (
                    <div
                      key={st.stageKey}
                      className="p-4 rounded-2xl border border-gray-200 bg-gray-50/70 space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                            {idx + 1}
                          </span>
                          <input
                            type="text"
                            value={st.stageName}
                            onChange={(e) => handleUpdateStage(idx, "stageName", e.target.value)}
                            className="bg-white border border-gray-300 rounded-lg px-2.5 py-1 text-xs font-bold text-gray-900 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <select
                            value={st.stageType}
                            onChange={(e) =>
                              handleUpdateStage(idx, "stageType", e.target.value as "VERIFICATION" | "APPROVAL" | "ISSUANCE")
                            }
                            className="bg-white border border-gray-300 rounded-lg px-2.5 py-1 text-xs text-gray-800 font-medium"
                          >
                            <option value="VERIFICATION">Document Verification</option>
                            <option value="APPROVAL">Committee Approval</option>
                            <option value="ISSUANCE">Document Issuance</option>
                          </select>

                          {stages.length > 1 && (
                            <button
                              onClick={() => handleRemoveStage(idx)}
                              className="text-red-500 hover:text-red-700 p-1"
                              title="Delete stage"
                            >
                              <IonIcon name="trash-outline" className="text-base" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Settings Row */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div>
                          <label className="text-gray-500 font-medium block mb-1">Approver Logic:</label>
                          <select
                            value={st.approverLogic}
                            onChange={(e) =>
                              handleUpdateStage(idx, "approverLogic", e.target.value as "ANY_ONE" | "ALL_REQUIRED")
                            }
                            className="w-full bg-white border border-gray-300 rounded-lg px-2 py-1.5 text-xs text-gray-900"
                          >
                            <option value="ANY_ONE">Any One Authorized Official</option>
                            <option value="ALL_REQUIRED">All Required Signatories</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-gray-500 font-medium block mb-1">Target Processing SLA:</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min={1}
                              max={30}
                              value={st.expectedDays}
                              onChange={(e) =>
                                handleUpdateStage(idx, "expectedDays", parseInt(e.target.value, 10) || 1)
                              }
                              className="w-20 bg-white border border-gray-300 rounded-lg px-2 py-1.5 text-xs text-gray-900"
                            />
                            <span className="text-gray-500">days</span>
                          </div>
                        </div>

                        <div>
                          <label className="text-gray-500 font-medium block mb-1">Stage Key (Internal):</label>
                          <input
                            type="text"
                            value={st.stageKey}
                            onChange={(e) => handleUpdateStage(idx, "stageKey", e.target.value)}
                            className="w-full bg-white border border-gray-300 rounded-lg px-2 py-1.5 text-xs font-mono text-gray-600"
                          />
                        </div>
                      </div>

                      {/* Authorized Roles Toggle */}
                      <div>
                        <label className="text-gray-500 font-medium text-xs block mb-1.5">
                          Authorized Committee Roles (Who may sign this stage):
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {AVAILABLE_ROLES.map((role) => {
                            const isSelected = st.allowedRoles?.includes(role);
                            return (
                              <button
                                key={role}
                                type="button"
                                onClick={() => handleToggleRole(idx, role)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                                  isSelected
                                    ? "bg-indigo-600 text-white"
                                    : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-100"
                                }`}
                              >
                                {role}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Output Document Issuance Section */}
                <div className="p-4 rounded-2xl border border-gray-200 bg-gray-50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-gray-900">Certificate Generation & Release</h4>
                      <p className="text-[11px] text-gray-500">
                        Automatically prepare an official PDF certificate upon final approval.
                      </p>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={requiresDoc}
                        onChange={(e) => setRequiresDoc(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600" />
                    </label>
                  </div>

                  {requiresDoc && (
                    <div className="pt-2 flex items-center gap-3 text-xs">
                      <span className="text-gray-700 font-medium">Select Certificate Template:</span>
                      <select
                        value={templateCode}
                        onChange={(e) => setTemplateCode(e.target.value)}
                        className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-xs text-gray-900 font-semibold"
                      >
                        <option value="HOME_LOAN_NOC">Home Loan NOC Template</option>
                        <option value="NO_DUES_CERT">No-Dues Certificate Template</option>
                        <option value="ADDRESS_CONFIRMATION">Address Confirmation Letter</option>
                        <option value="GENERAL_SOCIETY_LETTER">General Society Letter</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function WorkflowsConfigPage() {
  return (
    <AppShell>
      <Suspense
        fallback={
          <div className="min-h-screen bg-[#F8F9FA] p-8 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-sm font-medium">Loading Workflow Editor...</p>
            </div>
          </div>
        }
      >
        <WorkflowsConfigContent />
      </Suspense>
    </AppShell>
  );
}
