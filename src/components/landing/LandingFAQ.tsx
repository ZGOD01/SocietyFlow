"use client";

import React, { useState } from "react";
import { SectionHeading, AppCard, IonIcon } from "@/components/ui";

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const faqs: FAQItem[] = [
  {
    category: "Legal & Bank Acceptance",
    question: "Are SocietyFlow digital NOCs accepted by national banks for home loans?",
    answer:
      "Yes. Every digital NOC generated on SocietyFlow carries a cryptographic SHA-256 watermark and a verifiable QR code. Bank loan officers (SBI, HDFC, ICICI, Axis, Bank of Baroda) can scan the QR code to verify the managing committee's official resolution number, no-dues status, and signatory credentials in real time.",
  },
  {
    category: "Privacy & Permissions",
    question: "Can tenants view original share certificates or sale agreements of flat owners?",
    answer:
      "No. SocietyFlow enforces strict zero-trust permission isolation. Tenants are only granted access to their temporary tenancy agreement, police verification token, and society utility guidelines. Confidential property title deeds, nomination Form 14/15, and share certificates remain visible exclusively to the verified flat owner and Hon. Secretary.",
  },
  {
    category: "Committee Handover",
    question: "What happens when our society elects a new Managing Committee?",
    answer:
      "The handover is instantaneous and 100% digital. Unlike physical cupboards where files go missing during committee transitions, role credentials (Chairman, Secretary, Treasurer) are securely transferred in the Admin Console. The incoming committee receives immediate custody of the historical archive without a single missing resolution.",
  },
  {
    category: "Compliance & Auditing",
    question: "Does SocietyFlow comply with the Maharashtra Cooperative Societies Act 1960?",
    answer:
      "SocietyFlow was engineered strictly around the Model Bylaws of Cooperative Housing Societies. It maintains digital Form I (Register of Members), Form J (List of Members), Form 14 (Nomination Form records), and provides an audited export mode specifically formatted for statutory Chartered Accountants under Section 81.",
  },
  {
    category: "Historical Records",
    question: "Can we digitize physical society documents that are 10 to 25 years old?",
    answer:
      "Yes. Our document library supports historical batch uploading for old conveyance deeds, architectural blueprints, past AGM minutes, and handwritten share certificate registers. Each file is indexed by year, wing, and category for instant keyword retrieval.",
  },
  {
    category: "Data Security",
    question: "Where are our society's legal documents stored and how are they protected?",
    answer:
      "All documents are encrypted at rest using AES-256 encryption and hosted in geo-redundant object storage with strict access tokens. Cross-society data leakage is prevented at both the schema and server authorization levels.",
  },
];

export function LandingFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section id="faq" className="py-16 md:py-24 bg-transparent relative overflow-hidden">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Common Questions"
          title="Frequently Asked Questions"
          subtitle="Everything you need to know about society document vaults, digital NOC validity, and committee transitions."
          align="center"
          className="mb-12"
        />

        <div className="space-y-3.5">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <AppCard
                key={idx}
                className={`border transition-all duration-200 overflow-hidden ${
                  isOpen
                    ? "border-indigo-300 bg-indigo-50/20 shadow-xs"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggle(idx)}
                  className="w-full p-4 sm:p-5 flex items-center justify-between gap-4 text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md shrink-0">
                      {faq.category}
                    </span>
                    <h4 className="text-sm sm:text-base font-bold text-slate-900 font-heading">
                      {faq.question}
                    </h4>
                  </div>
                  <div className={`p-1.5 rounded-full text-slate-400 transition-transform duration-200 shrink-0 ${isOpen ? "rotate-180 text-indigo-600" : ""}`}>
                    <IonIcon name="chevron-down-outline" size={18} />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-4 pb-5 sm:px-5 sm:pb-5 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-indigo-100/60 pt-3">
                    {faq.answer}
                  </div>
                )}
              </AppCard>
            );
          })}
        </div>
      </div>
    </section>
  );
}
