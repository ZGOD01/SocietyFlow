"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { SectionHeading, AppCard, IconContainer, StatusBadge, IonIcon } from "@/components/ui";

const trustBadges = [
  {
    icon: "shield-checkmark-outline",
    title: "Bank-Recognized Digital NOCs",
    description:
      "Every generated NOC includes an embedded cryptographic verification QR code. Mortgage lenders (SBI, HDFC, ICICI, Axis) verify committee authenticity instantly online.",
    badge: "100% Accepted",
    variant: "hero" as const,
  },
  {
    icon: "document-text-outline",
    title: "MCS Act 1960 Compliance",
    description:
      "Engineered strictly in alignment with Maharashtra Model Bylaw No. 38 for flat transfers and Section 81 for statutory financial accounting and audit submissions.",
    badge: "Statutory Law",
    variant: "success" as const,
  },
  {
    icon: "lock-closed-outline",
    title: "Multi-Tenant Zero-Trust Vaults",
    description:
      "Each cooperative society and each individual flat operates in a cryptographically isolated tenant partition. Tenants cannot access owner share certificates.",
    badge: "AES-256 Encrypted",
    variant: "info" as const,
  },
  {
    icon: "time-outline",
    title: "Immutable Digital Audit Trail",
    description:
      "Every signature, document upload, and committee decision is permanently logged with tamper-evident timestamps, preventing retroactive alterations.",
    badge: "Tamper-Proof",
    variant: "warning" as const,
  },
];

export function LandingSecurityTrust() {
  return (
    <section className="py-16 md:py-24 bg-slate-50/40 border-y border-slate-200/80 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Security & Legal Verifiability"
          title="Bank-Ready Verification & Statutory Compliance"
          subtitle="Why mortgage lenders, registrar offices, and cooperative housing societies trust SocietyFlow's digital governance engine."
          align="center"
          className="mb-14"
        />

        {/* 3D Cryptographic Society Vault Seal Spotlight Card */}
        <div className="mb-12 p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-8">
          <div className="relative w-44 h-44 sm:w-56 sm:h-56 shrink-0 rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 flex items-center justify-center p-2">
            <Image
              src="/vault-seal.jpg"
              alt="Cryptographic Society Vault Verified Document Seal"
              fill
              className="object-contain p-2 hover:scale-105 transition-transform duration-500"
              sizes="224px"
            />
          </div>

          <div className="space-y-4 text-center md:text-left flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold">
              <IonIcon name="ribbon-outline" size={14} />
              <span>Cryptographic Governance Standard</span>
            </div>

            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-heading">
              Tamper-Proof Digital Seal for Every Society Record
            </h3>

            <p className="text-sm text-slate-600 leading-relaxed max-w-2xl">
              Physical stamps and signatures are routinely forged or misplaced during property resale disputes. 
              SocietyFlow issues every NOC and Share Certificate with a mathematically verifiable cryptographic seal, 
              guaranteed by multi-party committee approval quorum and public-key SHA-256 validation.
            </p>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-1">
              <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-3 py-1 rounded-full flex items-center gap-1.5">
                <IonIcon name="checkmark-circle" className="text-emerald-500" size={14} />
                SBI & HDFC Pre-Approved
              </span>
              <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-3 py-1 rounded-full flex items-center gap-1.5">
                <IonIcon name="checkmark-circle" className="text-emerald-500" size={14} />
                Model Bylaw No. 38 Format
              </span>
              <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-3 py-1 rounded-full flex items-center gap-1.5">
                <IonIcon name="checkmark-circle" className="text-emerald-500" size={14} />
                Section 81 Audit Ready
              </span>
            </div>
          </div>
        </div>

        {/* 4 Architectural Pillar Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
          {trustBadges.map((badge, idx) => (
            <AppCard
              key={idx}
              className="p-5 sm:p-6 bg-white border-slate-200 hover:border-indigo-300 transition-all flex flex-col justify-between gap-4 shadow-2xs group"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <IconContainer
                    name={badge.icon}
                    variant={badge.variant}
                    size="md"
                    className="group-hover:scale-105 transition-transform"
                  />
                  <StatusBadge variant={badge.variant} size="sm">
                    {badge.badge}
                  </StatusBadge>
                </div>

                <h3 className="text-base font-bold text-slate-900 font-heading mb-2">
                  {badge.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {badge.description}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600">
                <IonIcon name="checkmark-circle" size={14} />
                <span>Verified Standard</span>
              </div>
            </AppCard>
          ))}
        </div>

        {/* Verification Architecture Banner */}
        <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-md border border-slate-800">
          <div className="space-y-2 text-center md:text-left">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider bg-white/10 px-3 py-1 rounded-full">
              Legal & Audit Protection
            </span>
            <h4 className="text-lg sm:text-xl font-bold font-heading text-white">
              Are you a Managing Committee Member or Society Resident?
            </h4>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              Sign in to manage your society&apos;s vaults, or enroll your cooperative housing society today to eliminate physical document loss forever.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link href="/login">
              <button
                type="button"
                className="px-4 py-2.5 rounded-full text-xs sm:text-sm font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all"
              >
                Sign In to Account
              </button>
            </Link>
            <Link href="/register">
              <button
                type="button"
                className="px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold bg-indigo-500 hover:bg-indigo-400 text-white shadow-sm transition-all"
              >
                Enroll Society Free →
              </button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
