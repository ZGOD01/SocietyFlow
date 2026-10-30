"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { SectionHeading, AppCard, IonIcon } from "@/components/ui";

const stakeholders = [
  {
    role: "Managing Committee",
    title: "Chairmen, Secretaries & Treasurers",
    badge: "Governance Engine",
    badgeVariant: "hero" as const,
    icon: "shield-checkmark-outline",
    iconVariant: "hero" as const,
    image: "/stakeholder-committee.jpg",
    imageAlt: "Society Chairman and Secretary reviewing digital records on tablets in conference room",
    description:
      "Automate statutory compliance, eliminate physical paperwork, and sign NOCs digitally with verified committee quorum.",
    benefits: [
      "Quorum sign-offs (2 of 3 required signatures)",
      "Zero lost AGM/EGM resolution files",
      "Automatic maintenance dues clearance checks",
      "Model Bylaw No. 38 statutory compliance",
    ],
    ctaText: "Register Your Committee",
    ctaHref: "/register",
  },
  {
    role: "Flat Owners & Residents",
    title: "Apartment Owners & Tenants",
    badge: "Personal Vault",
    badgeVariant: "success" as const,
    icon: "home-outline",
    iconVariant: "success" as const,
    image: "/stakeholder-resident.jpg",
    imageAlt: "Apartment owner holding smartphone with verified digital property deed",
    description:
      "A permanent, bank-ready digital vault for your registered sale deeds, share certificates, and 1-click NOC applications.",
    benefits: [
      "24/7 instant access to property deeds & tax receipts",
      "48-hour bank loan & resale NOC issuance",
      "Zero chasing committee members on WhatsApp",
      "Encrypted isolation between owner and tenant records",
    ],
    ctaText: "Enroll Your Unit",
    ctaHref: "/register",
  },
  {
    role: "Auditors & Advocates",
    title: "Chartered Accountants & Legal Counsel",
    badge: "Compliance Room",
    badgeVariant: "info" as const,
    icon: "briefcase-outline",
    iconVariant: "info" as const,
    image: "/stakeholder-auditor.jpg",
    imageAlt: "Chartered accountants reviewing society audited balance sheet and compliance charts",
    description:
      "A dedicated, read-only digital audit room to inspect vouchers, bank reconciliation, and title conveyance records.",
    benefits: [
      "1-click export for annual statutory MCS audits",
      "Tamper-proof SHA-256 timestamped audit trail",
      "Certified Grade 'A' compliance readiness",
      "Instant title due diligence during flat resales",
    ],
    ctaText: "Access Partner Portal",
    ctaHref: "/login",
  },
];

export function LandingStakeholders() {
  return (
    <section id="stakeholders" className="py-16 md:py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Purpose-Built Roles"
          title="Engineered for Every Society Stakeholder"
          subtitle="Whether you manage a 400-unit complex or own a single apartment, SocietyFlow provides dedicated interfaces tailored to your exact responsibilities."
          align="center"
          className="mb-14"
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {stakeholders.map((s, idx) => (
            <AppCard
              key={idx}
              className="bg-white border border-slate-200/90 hover:border-slate-400 hover:shadow-2xl transition-all duration-300 flex flex-col justify-between shadow-sm group relative rounded-2xl sm:rounded-3xl overflow-hidden"
            >
              {/* Unique Role Photography Banner */}
              <div className="relative w-full h-44 sm:h-48 overflow-hidden bg-slate-900">
                <Image
                  src={s.image}
                  alt={s.imageAlt}
                  fill
                  className="object-cover object-center group-hover:scale-105 transition-transform duration-700 brightness-95"
                  sizes="(max-width: 768px) 100vw, 380px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/30" />
                
                {/* Floating Role Pill Badge */}
                <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-black/60 text-white backdrop-blur-md border border-white/20">
                    {s.badge}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-md text-slate-900 flex items-center justify-center shadow-md">
                    <IonIcon name={s.icon} size={16} />
                  </div>
                </div>

                <div className="absolute bottom-3 left-4 right-4">
                  <span className="text-[10px] font-extrabold text-indigo-300 uppercase tracking-widest block drop-shadow-sm">
                    {s.role}
                  </span>
                  <h3 className="text-base sm:text-lg font-black text-white font-heading uppercase tracking-tight drop-shadow-md truncate">
                    {s.title}
                  </h3>
                </div>
              </div>

              <div className="p-5 sm:p-6 space-y-4 flex-1 flex flex-col justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                    {s.description}
                  </p>

                  <div className="pt-3 mt-3 border-t border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5">
                      Statutory Capabilities:
                    </p>
                    <ul className="space-y-2 text-xs text-slate-700 font-medium">
                      {s.benefits.map((b, bIdx) => (
                        <li key={bIdx} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <Link
                    href={s.ctaHref}
                    className="w-full py-3 px-5 rounded-full text-xs font-black uppercase tracking-wider bg-slate-950 text-white hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-sm group-hover:shadow-md cursor-pointer"
                  >
                    <span>{s.ctaText}</span>
                    <IonIcon name="arrow-forward-outline" size={14} />
                  </Link>
                </div>
              </div>
            </AppCard>
          ))}
        </div>
      </div>
    </section>
  );
}
