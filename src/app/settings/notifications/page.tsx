"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import {
  AppCard,
  AppButton,
  StatusBadge,
  IconContainer,
  IonIcon,
} from "@/components/ui";

interface PreferencesState {
  emailEnabled: boolean;
  emailCategories: {
    registrations: boolean;
    serviceRequests: boolean;
    approvals: boolean;
    reminders: boolean;
  };
  whatsappEnabled: boolean;
  whatsappCategories: {
    registrations: boolean;
    serviceRequests: boolean;
    approvals: boolean;
    reminders: boolean;
  };
  whatsappPhoneNumber: string;
  whatsappConsentGiven: boolean;
  reminderFrequencyHours: number;
}

function NotificationSettingsContent() {
  const [prefs, setPrefs] = useState<PreferencesState>({
    emailEnabled: true,
    emailCategories: {
      registrations: true,
      serviceRequests: true,
      approvals: true,
      reminders: true,
    },
    whatsappEnabled: false,
    whatsappCategories: {
      registrations: true,
      serviceRequests: true,
      approvals: true,
      reminders: true,
    },
    whatsappPhoneNumber: "",
    whatsappConsentGiven: false,
    reminderFrequencyHours: 24,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [reminderJobRunning, setReminderJobRunning] = useState(false);
  const [reminderJobResult, setReminderJobResult] = useState<string | null>(null);

  useEffect(() => {
    async function loadPreferences() {
      try {
        const res = await fetch("/api/notifications/preferences");
        const data = await res.json();
        if (data.success && data.preferences) {
          setPrefs({
            emailEnabled: data.preferences.emailEnabled ?? true,
            emailCategories: data.preferences.emailCategories || {
              registrations: true,
              serviceRequests: true,
              approvals: true,
              reminders: true,
            },
            whatsappEnabled: data.preferences.whatsappEnabled ?? false,
            whatsappCategories: data.preferences.whatsappCategories || {
              registrations: true,
              serviceRequests: true,
              approvals: true,
              reminders: true,
            },
            whatsappPhoneNumber: data.preferences.whatsappPhoneNumber || "",
            whatsappConsentGiven: data.preferences.whatsappConsentGiven ?? false,
            reminderFrequencyHours: data.preferences.reminderFrequencyHours || 24,
          });
        }
      } catch (err) {
        console.error("Failed to load notification preferences:", err);
      } finally {
        setLoading(false);
      }
    }
    loadPreferences();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMessage(null);

    // Validation: If enabling WhatsApp, consent is mandatory
    if (prefs.whatsappEnabled && !prefs.whatsappConsentGiven) {
      setStatusMessage({
        type: "error",
        text: "Explicit consent is required to enable WhatsApp notifications under Meta policies.",
      });
      setSaving(false);
      return;
    }

    if (prefs.whatsappEnabled && !prefs.whatsappPhoneNumber.trim()) {
      setStatusMessage({
        type: "error",
        text: "Please enter a valid mobile number for WhatsApp alerts.",
      });
      setSaving(false);
      return;
    }

    try {
      const res = await fetch("/api/notifications/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMessage({
          type: "success",
          text: "Notification preferences saved successfully.",
        });
      } else {
        setStatusMessage({
          type: "error",
          text: data.error || "Failed to update notification preferences.",
        });
      }
    } catch {
      setStatusMessage({
        type: "error",
        text: "Network error saving notification preferences.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRunRemindersJob = async () => {
    setReminderJobRunning(true);
    setReminderJobResult(null);
    try {
      const res = await fetch("/api/cron/reminders", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        const s = data.summary;
        setReminderJobResult(
          `Reminders job completed: ${s.totalDispatched} alerts dispatched (${s.pendingOwnerAuthorizations} owner auths, ${s.pendingSocietyRegistrations} registrations, ${s.pendingStageApprovals} approvals, ${s.overdueRequests} overdue requests).`
        );
      } else {
        setReminderJobResult(data.error || "Failed to run reminders check.");
      }
    } catch {
      setReminderJobResult("Error executing reminders job.");
    } finally {
      setReminderJobRunning(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/notifications"
              className="text-xs text-indigo-600 hover:underline flex items-center gap-1 font-semibold"
            >
              <IonIcon name="arrow-back" />
              <span>Notification Center</span>
            </Link>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1A1A1A] font-['Outfit'] mt-1">
            Notification Settings & Delivery Channels
          </h1>
          <p className="text-sm text-[#6B7280]">
            Customize multi-channel alerts across In-App, Email (Resend), and WhatsApp. Essential in-app alerts are always preserved.
          </p>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
            statusMessage.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <IonIcon
            name={statusMessage.type === "success" ? "checkmark-circle" : "alert-circle"}
            className="text-base shrink-0"
          />
          <span>{statusMessage.text}</span>
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center text-gray-400">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-medium text-gray-500">Loading settings...</p>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          {/* SECTION 1: IN-APP ALERTS (GUARANTEED) */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl shrink-0">
                <IonIcon name="notifications" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 font-['Outfit']">
                  In-App Notification Center
                </h3>
                <p className="text-xs text-gray-500">
                  Core statutory alerts, request status changes, and official decisions.
                </p>
              </div>
            </div>
            <div className="pt-2 text-xs text-emerald-700 bg-emerald-50 p-3 rounded-xl border border-emerald-100 flex items-center gap-2">
              <IonIcon name="shield-checkmark" className="text-base" />
              <span>
                <strong>Always Active:</strong> All critical governance updates and approval actions are immutably archived in your personal SocietyFlow portal.
              </span>
            </div>
          </div>

          {/* SECTION 2: EMAIL ALERTS (RESEND) */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl shrink-0">
                  <IonIcon name="mail" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 font-['Outfit']">
                    Email Notifications (Resend)
                  </h3>
                  <p className="text-xs text-gray-500">
                    Receive clean, branded status digests to your verified account email.
                  </p>
                </div>
              </div>

              {/* Master Email Toggle */}
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={prefs.emailEnabled}
                  onChange={(e) =>
                    setPrefs((p) => ({ ...p, emailEnabled: e.target.checked }))
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {prefs.emailEnabled && (
              <div className="pt-3 border-t border-gray-100 space-y-2.5">
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-2">
                  Email Categories
                </span>

                {[
                  {
                    key: "registrations" as const,
                    label: "Registration Updates",
                    desc: "Owner & Tenant application submissions, approvals, and decisions.",
                  },
                  {
                    key: "serviceRequests" as const,
                    label: "Service Requests",
                    desc: "Status transitions, information requests, and document issuance alerts.",
                  },
                  {
                    key: "approvals" as const,
                    label: "Approval Alerts",
                    desc: "Committee action-required notices and stage progress updates.",
                  },
                  {
                    key: "reminders" as const,
                    label: "Reminders & Overdue Alerts",
                    desc: "Target SLA notices and periodic pending task digests.",
                  },
                ].map((item) => (
                  <label
                    key={item.key}
                    className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={prefs.emailCategories[item.key]}
                      onChange={(e) =>
                        setPrefs((p) => ({
                          ...p,
                          emailCategories: {
                            ...p.emailCategories,
                            [item.key]: e.target.checked,
                          },
                        }))
                      }
                      className="mt-0.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-gray-900 block">{item.label}</span>
                      <span className="text-gray-500">{item.desc}</span>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* SECTION 3: WHATSAPP CLOUD API (META TEST MODE) */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl shrink-0">
                  <IonIcon name="logo-whatsapp" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-gray-900 font-['Outfit']">
                      WhatsApp Instant Alerts
                    </h3>
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                      Test Mode
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Official Meta WhatsApp Cloud API integration for time-sensitive notifications.
                  </p>
                </div>
              </div>

              {/* Master WhatsApp Toggle */}
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={prefs.whatsappEnabled}
                  onChange={(e) =>
                    setPrefs((p) => ({ ...p, whatsappEnabled: e.target.checked }))
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {prefs.whatsappEnabled && (
              <div className="pt-3 border-t border-gray-100 space-y-4">
                {/* Privacy & Prototype Disclaimer Notice */}
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <IonIcon name="shield" />
                    <span>Meta Cloud API Test Guidelines</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-amber-800">
                    In compliance with Prompt 10 instructions, WhatsApp delivery operates in official test mode without incurring sponsor charges. Never send confidential PINs or documents over WhatsApp.
                  </p>
                </div>

                {/* Mobile Phone Number */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    WhatsApp Phone Number (E.164 International Format)
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={prefs.whatsappPhoneNumber}
                    onChange={(e) =>
                      setPrefs((p) => ({ ...p, whatsappPhoneNumber: e.target.value }))
                    }
                    className="w-full max-w-sm px-3.5 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    Include country code (e.g. +91 for India).
                  </p>
                </div>

                {/* Mandatory Consent Checkbox (Section 12 mandate) */}
                <label className="flex items-start gap-3 p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prefs.whatsappConsentGiven}
                    onChange={(e) =>
                      setPrefs((p) => ({
                        ...p,
                        whatsappConsentGiven: e.target.checked,
                      }))
                    }
                    className="mt-0.5 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-emerald-950 block">
                      Opt-in Consent for WhatsApp Messages
                    </span>
                    <span className="text-emerald-800 text-[11px] leading-relaxed">
                      I authorize SocietyFlow to dispatch transactional status updates, stage approvals, and reminders to this mobile number via WhatsApp. I can revoke this consent at any time.
                    </span>
                  </div>
                </label>

                {/* Category Checkboxes */}
                <div className="space-y-2 pt-1">
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                    WhatsApp Alert Types
                  </span>

                  {[
                    {
                      key: "registrations" as const,
                      label: "Registration Milestones",
                    },
                    {
                      key: "serviceRequests" as const,
                      label: "Service Application Updates & Issuance",
                    },
                    {
                      key: "approvals" as const,
                      label: "Committee Stage Approvals Required",
                    },
                    {
                      key: "reminders" as const,
                      label: "SLA Overdue & Pending Task Alerts",
                    },
                  ].map((item) => (
                    <label
                      key={item.key}
                      className="flex items-center gap-2.5 text-xs text-gray-700 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={prefs.whatsappCategories[item.key]}
                        onChange={(e) =>
                          setPrefs((p) => ({
                            ...p,
                            whatsappCategories: {
                              ...p.whatsappCategories,
                              [item.key]: e.target.checked,
                            },
                          }))
                        }
                        className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* SECTION 4: AUTOMATED REMINDERS & SLA MONITORING */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-xl shrink-0">
                <IonIcon name="time" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 font-['Outfit']">
                  Automated Reminders & SLA Job
                </h3>
                <p className="text-xs text-gray-500">
                  Periodic scheduler for pending owner authorizations, overdue service requests, and expiring leases.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Reminder Frequency Throttling
                </label>
                <select
                  value={prefs.reminderFrequencyHours}
                  onChange={(e) =>
                    setPrefs((p) => ({
                      ...p,
                      reminderFrequencyHours: parseInt(e.target.value, 10),
                    }))
                  }
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={12}>Every 12 Hours</option>
                  <option value={24}>Once Every 24 Hours (Recommended)</option>
                  <option value={48}>Every 48 Hours</option>
                  <option value={168}>Once Weekly</option>
                </select>
                <p className="text-[11px] text-gray-400 mt-1">
                  Prevents duplicate alert spam to responsible committee members.
                </p>
              </div>

              <div className="flex flex-col justify-end">
                <AppButton
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRunRemindersJob}
                  disabled={reminderJobRunning}
                  className="w-full justify-center"
                >
                  <IonIcon
                    name={reminderJobRunning ? "sync-outline" : "flash-outline"}
                    className={`mr-1.5 ${reminderJobRunning ? "animate-spin" : ""}`}
                  />
                  {reminderJobRunning ? "Executing Reminders..." : "Run Reminders Check Now"}
                </AppButton>
                <p className="text-[11px] text-gray-400 mt-1 text-center">
                  Protected endpoint: <code>/api/cron/reminders</code>
                </p>
              </div>
            </div>

            {reminderJobResult && (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 flex items-start gap-2">
                <IonIcon name="information-circle" className="text-indigo-600 text-sm mt-0.5" />
                <span className="leading-relaxed">{reminderJobResult}</span>
              </div>
            )}
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <Link href="/notifications">
              <AppButton type="button" variant="ghost" size="sm">
                Cancel
              </AppButton>
            </Link>

            <AppButton
              type="submit"
              variant="primary"
              size="md"
              disabled={saving}
              className="bg-[#4F46E5] text-white hover:bg-indigo-700"
            >
              <IonIcon name="save-outline" className="mr-1.5" />
              {saving ? "Saving Changes..." : "Save Preferences"}
            </AppButton>
          </div>
        </form>
      )}
    </div>
  );
}

export default function NotificationSettingsPage() {
  return (
    <AppShell>
      <Suspense
        fallback={
          <div className="min-h-screen bg-[#F8F9FA] p-8 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-sm font-medium">Loading Preferences...</p>
            </div>
          </div>
        }
      >
        <NotificationSettingsContent />
      </Suspense>
    </AppShell>
  );
}
