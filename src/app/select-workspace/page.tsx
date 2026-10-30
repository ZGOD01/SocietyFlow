"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { IonIcon, StatusBadge, AppButton } from "@/components/ui";

interface Membership {
  societyId: string;
  societyName: string;
  societyCode: string;
  unit?: string;
  role: string;
  status: "PENDING" | "VERIFIED" | "REJECTED" | "SUSPENDED";
  targetRoute: string;
}

const DEMO_WORKSPACES: Membership[] = [
  {
    societyId: "soc-greenwood",
    societyName: "Greenwood Residency CHS Ltd.",
    societyCode: "MH-PNA-14902-2019",
    unit: "Wing C • Flat 402",
    role: "Property Owner",
    status: "VERIFIED",
    targetRoute: "/dashboard",
  },
  {
    societyId: "soc-greenwood-mgmt",
    societyName: "Greenwood Residency CHS Ltd.",
    societyCode: "MH-PNA-14902-2019",
    unit: "Managing Committee",
    role: "Hon. Secretary",
    status: "VERIFIED",
    targetRoute: "/management/dashboard",
  },
  {
    societyId: "soc-silveroak",
    societyName: "Silver Oak Heights CHS",
    societyCode: "MH-PNA-28311-2021",
    unit: "Wing B • Flat 201",
    role: "Tenant",
    status: "VERIFIED",
    targetRoute: "/dashboard?view=tenant",
  },
  {
    societyId: "soc-auditor",
    societyName: "Pune District Housing Federation",
    societyCode: "MH-AUD-2024-001",
    unit: "Statutory Panel",
    role: "Empanelled Auditor",
    status: "VERIFIED",
    targetRoute: "/partner/dashboard",
  },
  {
    societyId: "soc-platform",
    societyName: "SocietyFlow Cloud Multi-Tenant",
    societyCode: "SYS-ROOT-CLUSTER",
    unit: "Platform Ops",
    role: "Super Admin",
    status: "VERIFIED",
    targetRoute: "/admin/dashboard",
  },
];

export default function SelectWorkspacePage() {
  const router = useRouter();
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [userEmail, setUserEmail] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          setUserEmail(data.user.email);
          if (data.user.memberships && data.user.memberships.length > 0) {
            const mapped = data.user.memberships.map((m: {
              societyId: string;
              societyName: string;
              societyCode: string;
              role: string;
              status: "PENDING" | "VERIFIED" | "REJECTED" | "SUSPENDED";
            }) => {
              let targetRoute = "/dashboard";
              if (["SECRETARY", "CHAIRMAN", "TREASURER", "SOCIETY_MANAGER"].includes(m.role)) {
                targetRoute = "/management/dashboard";
              } else if (m.role === "TENANT") {
                targetRoute = "/dashboard?view=tenant";
              }
              return {
                ...m,
                targetRoute,
              };
            });
            setMemberships(mapped);
          }
        }
        setLoading(false);
      })
      .catch(() => {
        setMemberships(DEMO_WORKSPACES);
        setLoading(false);
      });
  }, []);

  const handleSelectWorkspace = (item: Membership) => {
    if (item.status !== "VERIFIED") {
      router.push("/pending-approval");
      return;
    }

    setSwitching(item.societyId + item.role);
    router.push(item.targetRoute);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center text-[#6B7280] text-xs">
        <IonIcon name="sync-outline" size={24} className="animate-spin text-[#4F46E5] mb-2" />
        <span>Loading accessible society desks...</span>
      </div>
    );
  }

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
          <Link href="/dashboard">
            <AppButton variant="outline" size="sm" leftIcon="grid-outline">
              Console Overview
            </AppButton>
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="w-full max-w-2xl mx-auto my-auto py-8">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-white border border-[#E5E7EB] shadow-[0_4px_24px_-2px_rgba(0,0,0,0.06)] overflow-hidden p-6 sm:p-9 space-y-6"
        >
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EEF2FF] text-[#4F46E5] text-[11px] font-bold uppercase tracking-wider border border-[#C7D2FE]">
              <IonIcon name="business-outline" size={13} />
              <span>Multi-Tenant Identity Routing</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-heading uppercase text-[#1A1A1A] tracking-tight">
              Select Your Society Console
            </h1>
            <p className="text-xs sm:text-sm text-[#6B7280] max-w-md mx-auto">
              Account: <strong>{userEmail}</strong>. Select a verified society membership desk to launch your isolated console:
            </p>
          </div>

          <div className="space-y-2.5 pt-2">
            {memberships.map((membership, idx) => {
              const isVerified = membership.status === "VERIFIED";
              const key = membership.societyId + membership.role;
              const isSelected = switching === key;

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={isSelected}
                  onClick={() => handleSelectWorkspace(membership)}
                  className={`w-full p-4 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                    isVerified
                      ? "border-[#E5E7EB] hover:border-[#4F46E5] hover:bg-[#F8F9FA] shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
                      : "border-[#E5E7EB] bg-[#F8F9FA] opacity-80"
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        ["SECRETARY", "CHAIRMAN", "TREASURER", "SOCIETY_MANAGER", "Hon. Secretary"].includes(
                          membership.role
                        )
                          ? "bg-[#FFFBEB] text-[#F59E0B] border border-[#FDE68A]"
                          : membership.role === "Tenant"
                          ? "bg-[#F0F9FF] text-[#0EA5E9] border border-[#BAE6FD]"
                          : membership.role === "Super Admin"
                          ? "bg-[#1A1A1A] text-white"
                          : "bg-[#EEF2FF] text-[#4F46E5] border border-[#C7D2FE]"
                      }`}
                    >
                      <IonIcon
                        name={
                          ["SECRETARY", "CHAIRMAN", "TREASURER", "SOCIETY_MANAGER", "Hon. Secretary"].includes(
                            membership.role
                          )
                            ? "shield-checkmark"
                            : membership.role === "Tenant"
                            ? "key"
                            : membership.role === "Super Admin"
                            ? "construct"
                            : "home"
                        }
                        size={18}
                      />
                    </div>
                    <div>
                      <h3 className="font-bold text-[#1A1A1A] text-sm">
                        {membership.societyName}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] font-mono text-[#4F46E5] font-semibold">
                          {membership.societyCode}
                        </span>
                        <span className="text-[#D1D5DB]">•</span>
                        <span className="text-[11px] font-semibold text-[#6B7280]">
                          {membership.unit ? `${membership.unit} • ` : ""}
                          <strong className="text-[#1A1A1A]">{membership.role}</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <StatusBadge
                      variant={isVerified ? "success" : "warning"}
                      size="sm"
                    >
                      {isVerified ? "Verified" : "Pending"}
                    </StatusBadge>
                    <IonIcon
                      name="arrow-forward-outline"
                      size={16}
                      className="text-[#9CA3AF]"
                    />
                  </div>
                </button>
              );
            })}
          </div>

          <div className="pt-4 border-t border-[#E5E7EB] flex items-center justify-between text-xs text-[#6B7280]">
            <span>Need to link an additional society or flat?</span>
            <Link href="/register" className="text-[#4F46E5] font-bold hover:underline">
              + Register New Society Role
            </Link>
          </div>
        </motion.div>
      </main>

      <footer className="w-full max-w-4xl mx-auto text-center text-xs text-[#9CA3AF] pt-6">
        <span>© 2026 SocietyFlow • Logical Society Isolation Enforced</span>
      </footer>
    </div>
  );
}
