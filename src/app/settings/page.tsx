"use client";

import React from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import {
  PageHeader,
  AppCard,
  FormField,
  StatusBadge,
  IconContainer,
  AppButton,
} from "@/components/ui";

export default function SettingsPage() {
  const [societyData, setSocietyData] = React.useState<{
    name: string;
    code: string;
    registrationNumber: string;
    address: string;
    city: string;
    state: string;
    pinCode: string;
  } | null>(null);

  React.useEffect(() => {
    fetch("/api/management/society")
      .then((res) => res.json())
      .then((data) => {
        if (data.society) {
          setSocietyData({
            name: data.society.name || "TEST SOCIETY CHS Ltd.",
            code: data.society.code || "TEST SOCIETY",
            registrationNumber: data.society.registrationNumber || "MH/TES/2024",
            address: data.society.address || "Main Complex, Pune",
            city: data.society.city || "Pune",
            state: data.society.state || "Maharashtra",
            pinCode: data.society.pinCode || "411045",
          });
        }
      })
      .catch(() => {});
  }, []);

  return (
    <AppShell>
      <PageHeader
        title="Society & Profile Settings"
        description="Configuration parameters, multi-tenant boundaries, and alert preferences"
        breadcrumbs={[
          { label: "Console", href: "/dashboard" },
          { label: "Settings" },
        ]}
        badge={
          <StatusBadge variant="neutral" size="sm">
            Config v1.0
          </StatusBadge>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Society Metadata Card */}
          <AppCard className="p-6 bg-white border-[#E5E7EB] space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-[#F1F3F5]">
              <IconContainer name="business-outline" variant="hero-soft" size="sm" />
              <div>
                <h3 className="text-sm font-bold text-[#1A1A1A]">
                  Society Institutional Profile
                </h3>
                <p className="text-xs text-[#6B7280]">
                  Official registration metadata as recorded with the Co-operative Registrar
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                label="Society Legal Name"
                defaultValue={societyData?.name || "TEST SOCIETY CHS Ltd."}
                key={societyData?.name}
                disabled
              />
              <FormField
                label="Cooperative Reg. Number"
                defaultValue={societyData?.registrationNumber || "MH/TES/2024"}
                key={societyData?.registrationNumber}
                disabled
              />
              <FormField
                label="Registered Address"
                defaultValue={societyData?.address || "Main Complex, Pune"}
                key={societyData?.address}
                disabled
              />
              <FormField
                label="State & Pin Code"
                defaultValue={`${societyData?.state || "Maharashtra"} - ${societyData?.pinCode || "411045"}`}
                key={societyData?.pinCode}
                disabled
              />
            </div>
          </AppCard>

          {/* User Preferences */}
          <AppCard className="p-6 bg-white border-[#E5E7EB] space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-[#F1F3F5]">
              <IconContainer name="notifications-outline" variant="neutral" size="sm" />
              <div>
                <h3 className="text-sm font-bold text-[#1A1A1A]">
                  Notification & Compliance Alerts
                </h3>
                <p className="text-xs text-[#6B7280]">
                  Automated notifications for committee approvals and vault uploads
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <label className="flex items-center justify-between p-3 rounded-xl border border-[#E5E7EB] bg-[#F8F9FA] cursor-pointer">
                <div>
                  <p className="font-bold text-[#1A1A1A]">NOC Application Status Alerts</p>
                  <p className="text-[#6B7280]">Receive email when a committee member signs your application</p>
                </div>
                <input type="checkbox" defaultChecked className="accent-[#4F46E5] w-4 h-4" />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl border border-[#E5E7EB] bg-[#F8F9FA] cursor-pointer">
                <div>
                  <p className="font-bold text-[#1A1A1A]">AGM & Resolution Broadcasts</p>
                  <p className="text-[#6B7280]">Instant notifications when official meeting minutes are published</p>
                </div>
                <input type="checkbox" defaultChecked className="accent-[#4F46E5] w-4 h-4" />
              </label>
            </div>

            <div className="pt-2">
              <Link href="/settings/notifications">
                <AppButton variant="secondary" size="sm" rightIcon="arrow-forward-outline">
                  Configure Email &amp; WhatsApp Channels
                </AppButton>
              </Link>
            </div>
          </AppCard>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-4">
          <AppCard className="p-5 bg-white border-[#E5E7EB] space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A]">
              Member Profile &amp; Vault
            </h4>
            <p className="text-xs text-[#6B7280]">
              Review verified society membership, allotted residential unit, onboarding property titles, and personal vault records.
            </p>
            <Link href="/profile" className="block">
              <AppButton variant="hero" size="sm" className="w-full" rightIcon="arrow-forward-outline">
                Open Member Profile
              </AppButton>
            </Link>
          </AppCard>

          <AppCard className="p-5 bg-white border-[#E5E7EB] space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A]">
              Multi-Tenant Authority
            </h4>
            <div className="p-3 bg-[#EEF2FF] rounded-xl text-xs text-[#4F46E5] space-y-1">
              <p className="font-bold">Tenant ID: {societyData?.code || "TEST SOCIETY"}</p>
              <p className="text-[#6B7280]">
                All database queries and document keys enforce this society partition.
              </p>
            </div>
          </AppCard>
        </div>
      </div>
    </AppShell>
  );
}
