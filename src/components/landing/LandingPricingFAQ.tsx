"use client";

import React, { useState } from "react";
import { IonIcon } from "@/components/ui";
import Link from "next/link";

const pricingTiers = [
  {
    name: "Community Starter",
    eyebrow: "Free Pilot",
    price: "₹0",
    period: "for 60 days",
    desc: "For newly elected managing committees testing digital vaults and NOC issuance.",
    features: [
      "Up to 50 residential units",
      "Encrypted personal document vaults",
      "Central society document archive",
      "Basic NOC & transfer workflows",
    ],
    popular: false,
    cta: "Start Free Pilot",
  },
  {
    name: "Standard Society",
    eyebrow: "Most Popular",
    price: "₹15",
    period: "per flat / month",
    desc: "Complete statutory compliance, 3-signer digital quorum, and multi-wing isolation.",
    features: [
      "Unlimited residential & commercial units",
      "Secretary & Chairman 3-signer quorum",
      "Bank mortgage & resale NOC generation",
      "Share certificate & deed indexing",
      "Audit trail export for statutory CA",
    ],
    popular: true,
    cta: "Register Your Society",
  },
  {
    name: "Enterprise Complex",
    eyebrow: "Townships",
    price: "₹25",
    period: "per flat / month",
    desc: "For large cooperative townships, federations, and high-rise clusters.",
    features: [
      "All Standard features included",
      "Dedicated statutory auditor desk",
      "Historical file scanning & indexing support",
      "Custom Section 73 MCS Act compliance",
      "Dedicated account manager",
    ],
    popular: false,
    cta: "Contact Committee Desk",
  },
];

const faqs = [
  {
    q: "Are SocietyFlow digital NOCs accepted by national banks for home loans?",
    a: "Yes. Every digital NOC generated carries a cryptographic SHA-256 watermark and a verifiable QR code. Bank loan officers (SBI, HDFC, ICICI, Axis) verify committee authenticity online in seconds.",
  },
  {
    q: "Can tenants view original share certificates or sale agreements of flat owners?",
    a: "No. SocietyFlow enforces strict zero-trust permission isolation. Tenants can only view their own registered lease agreement and police verification token. Property deeds and share certificates remain visible exclusively to the verified owner and Hon. Secretary.",
  },
  {
    q: "What happens when our society elects a new Managing Committee?",
    a: "The handover is instantaneous and 100% digital. Unlike physical cupboards where files go missing during elections, committee credentials (Chairman, Secretary, Treasurer) are transferred securely in the console with complete historical audit custody.",
  },
  {
    q: "Does SocietyFlow comply with the Maharashtra Cooperative Societies Act 1960?",
    a: "Yes. SocietyFlow was engineered strictly around Model Bylaw No. 38 for flat transfers and Section 81 for financial audits, maintaining official digital Form I (Register of Members) and Form J records.",
  },
];

export function LandingPricingFAQ() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <section id="pricing" className="py-16 md:py-24 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] sm:text-xs font-bold tracking-widest uppercase mb-3 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-indigo-500" />
          <span>Fair & Predictable</span>
        </div>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black font-heading uppercase tracking-tight text-slate-950 leading-tight">
          TRANSPARENT SOCIETY PRICING
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 mt-2.5 font-normal leading-relaxed">
          No hidden convenience charges. Billed directly to the society maintenance account.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch mb-20">
        {pricingTiers.map((tier, idx) => (
          <div
            key={idx}
            className={`rounded-2xl sm:rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 relative text-slate-950 ${
              tier.popular
                ? "bg-gradient-to-b from-white via-indigo-50/40 to-indigo-50/70 border-2 border-indigo-600 shadow-[0_20px_50px_-10px_rgba(99,102,241,0.22)] scale-[1.02]"
                : "bg-white border border-slate-200/90 shadow-sm hover:border-slate-300"
            }`}
          >
            {tier.popular && (
              <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-indigo-600 text-white text-[10px] font-black uppercase tracking-wider shadow-md shadow-indigo-500/25">
                Recommended for Societies
              </span>
            )}

            <div>
              <div className="flex items-center justify-between mb-4">
                <span
                  className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${
                    tier.popular
                      ? "bg-indigo-100 text-indigo-800 border border-indigo-200"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {tier.eyebrow}
                </span>
              </div>

              <h3 className="text-xl font-black font-heading uppercase tracking-tight text-slate-950">
                {tier.name}
              </h3>
              <p className="text-xs mt-1.5 mb-6 leading-relaxed text-slate-600">
                {tier.desc}
              </p>

              <div className="flex items-baseline gap-1.5 pb-6 mb-6 border-b border-slate-200/80">
                <span className="text-4xl font-black font-heading text-slate-950">{tier.price}</span>
                <span className="text-xs text-slate-500 font-medium">
                  {tier.period}
                </span>
              </div>

              <ul className="space-y-3 text-xs mb-8">
                {tier.features.map((feat, fIdx) => (
                  <li key={fIdx} className="flex items-start gap-2.5">
                    <IonIcon
                      name="checkmark-circle"
                      size={16}
                      className="text-emerald-500 shrink-0 mt-0.5"
                    />
                    <span className="text-slate-700 font-medium">{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Link href="/register" className="w-full block">
              <button
                type="button"
                className={`w-full py-3 px-5 rounded-full text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  tier.popular
                    ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/25 hover:scale-[1.02]"
                    : "bg-slate-950 text-white hover:bg-slate-800 shadow-xs"
                }`}
              >
                <span>{tier.cta}</span>
                <IonIcon name="arrow-forward-outline" size={14} />
              </button>
            </Link>
          </div>
        ))}
      </div>

      <div id="faq" className="max-w-3xl mx-auto pt-6">
        <h3 className="text-xl sm:text-2xl font-black font-heading uppercase tracking-tight text-slate-950 text-center mb-8">
          FREQUENTLY ASKED QUESTIONS
        </h3>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-2xs transition-all hover:border-indigo-200"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-4 sm:p-5 flex items-center justify-between gap-4 text-left cursor-pointer"
                >
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 font-heading">
                    {faq.q}
                  </h4>
                  <IonIcon
                    name="chevron-down-outline"
                    size={16}
                    className={`text-slate-400 transition-transform ${isOpen ? "rotate-180 text-indigo-600" : ""}`}
                  />
                </button>
                {isOpen && (
                  <div className="px-4 pb-5 sm:px-5 sm:pb-5 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
