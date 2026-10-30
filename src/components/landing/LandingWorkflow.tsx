"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";


const workflowSteps = [
  {
    id: 1,
    title: "1. 1-Click Request Submission",
    subtitle: "Resident submits application with pre-validated checklist",
    tag: "Resident Portal",
    accentColor: "indigo",
    description:
      "Flat owners or tenants apply for Bank Mortgage NOCs, Flat Resale Clearances, or Balcony Solar Approvals. Mandatory statutory attachments (sale deed, buyer KYC) are validated prior to submission.",
    preview: {
      docType: "Resale Clearance NOC",
      applicant: "Priya Mehta • Flat C-402",
      buyer: "Vikram Patil",
      bank: "State Bank of India (Mortgage Division)",
      statusText: "Checklist Validated (4/4 Documents)",
      checklist: [
        "Form 20 Application Form",
        "Registered Agreement for Sale",
        "Index II Registration Receipt",
        "Buyer Government Identity KYC",
      ],
    },
  },
  {
    id: 2,
    title: "2. Automated Dues & Ledger Clearance",
    subtitle: "Real-time accounting ledger verification",
    tag: "Treasurer Auto-Check",
    accentColor: "emerald",
    description:
      "The system queries the society accounting ledger automatically. If maintenance dues are outstanding, a clearance prompt is triggered; if zero dues exist, the request is flagged cleared instantly.",
    preview: {
      docType: "Financial Ledger Clearance",
      applicant: "Flat C-402 (Priya Mehta)",
      buyer: "Maintenance Status: ₹0 Outstanding",
      bank: "Quarterly Sinking Fund: Paid",
      statusText: "Treasurer Clearance Auto-Approved",
      checklist: [
        "Q1-Q4 Maintenance Dues: ₹0 Due",
        "Sinking Fund Contribution: Up to Date",
        "Repair & Non-Occupancy Dues: Clear",
        "Form 14 Nominee Record: Validated",
      ],
    },
  },
  {
    id: 3,
    title: "3. Multi-Signatory Committee Quorum",
    subtitle: "Hon. Secretary & Chairman digital review and seal",
    tag: "Committee Governance",
    accentColor: "violet",
    description:
      "Secretary and Chairman receive notification on their mobile or desktop portals. They review the application, inspect the attached documents, and append cryptographically timestamped digital signatures.",
    preview: {
      docType: "Managing Committee Sign-off",
      applicant: "Resolution #AGM-2024-NOC-84",
      buyer: "Secretary: R. K. Sharma (Signed)",
      bank: "Chairman: Anand Verma (Approved)",
      statusText: "3/3 Quorum Achieved",
      checklist: [
        "Treasurer Dues Clearance: Attached",
        "Hon. Secretary Signature: Verified",
        "Society Chairman Seal: Appended",
        "Model Bylaw No. 38 Clause 7: Compliant",
      ],
    },
  },
  {
    id: 4,
    title: "4. Tamper-Proof Bank QR Issuance",
    subtitle: "Official PDF with verifiable cryptographic watermark",
    tag: "Public Verifiability",
    accentColor: "sky",
    description:
      "An official PDF certificate is generated with an embedded SHA-256 hash and scannable QR verification code. Bank loan officers verify society authenticity online in seconds.",
    preview: {
      docType: "Issued Official NOC #NOC-2025-C402",
      applicant: "Official Society Seal Applied",
      buyer: "Digital SHA-256: 7f83b165...d9069",
      bank: "Accepted by SBI, HDFC, ICICI, Axis",
      statusText: "100% Verifiable Online",
      checklist: [
        "Verifiable Dynamic QR Code Embedded",
        "Immutable Audit Timestamp Stamped",
        "Zero Chasing on WhatsApp",
        "Turnaround: 48 Hours (vs 21 Days)",
      ],
    },
  },
];

export function LandingWorkflow() {
  const [activeStep, setActiveStep] = useState(1);
  const currentStep = workflowSteps.find((s) => s.id === activeStep) || workflowSteps[0];

  return (
    <section id="how-it-works" className="py-16 md:py-24 bg-white border-y border-slate-200/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] sm:text-xs font-bold tracking-widest uppercase mb-3 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <span>Deterministic Lifecycle</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black font-heading uppercase tracking-tight text-slate-950 leading-tight">
            HOW A SOCIETY RUNS ON SOCIETYFLOW
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-2.5 font-normal leading-relaxed">
            From initial application to bank mortgage clearance in 48 hours instead of 3 weeks of lost paperwork.
          </p>
        </div>

        {/* Step Selector & Live Preview Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Interactive Step Buttons (Bright & Attractive Light Theme) */}
          <div className="lg:col-span-5 space-y-3">
            {workflowSteps.map((step) => {
              const isActive = activeStep === step.id;
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setActiveStep(step.id)}
                  className={`w-full text-left p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                    isActive
                      ? "bg-gradient-to-r from-indigo-50/90 via-white to-indigo-50/40 border-2 border-indigo-600 shadow-[0_10px_30px_-8px_rgba(99,102,241,0.22)] scale-[1.01]"
                      : "bg-slate-50/70 border-slate-200/90 hover:bg-white hover:border-slate-300 hover:shadow-sm text-slate-900"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${
                        isActive
                          ? "bg-indigo-600 text-white shadow-2xs"
                          : "bg-slate-200/70 text-slate-700"
                      }`}
                    >
                      {step.tag}
                    </span>
                    <span
                      className={`text-xs font-black uppercase tracking-wider ${
                        isActive ? "text-indigo-600" : "text-slate-400"
                      }`}
                    >
                      Step 0{step.id}
                    </span>
                  </div>
                  <h3
                    className={`text-sm sm:text-base font-black font-heading uppercase tracking-tight ${
                      isActive ? "text-slate-950" : "text-slate-800"
                    }`}
                  >
                    {step.title}
                  </h3>
                  <p
                    className={`text-xs mt-1 line-clamp-1 ${
                      isActive ? "text-indigo-900/80 font-medium" : "text-slate-500"
                    }`}
                  >
                    {step.subtitle}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Right Column: Live Animated Step Mockup (Bright & Attractive Light Design) */}
          <div className="lg:col-span-7">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStep}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.3 }}
                className="rounded-2xl sm:rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-white via-indigo-50/30 to-sky-50/30 text-slate-900 border-2 border-indigo-100 shadow-[0_20px_50px_-12px_rgba(99,102,241,0.15)] space-y-6 relative overflow-hidden"
              >
                {/* Subtle Ambient Radial Light Flare */}
                <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-200/20 rounded-full blur-3xl pointer-events-none -z-10" />

                {/* Top Badge & Header */}
                <div className="flex items-center justify-between border-b border-indigo-100/80 pb-4">
                  <div>
                    <span className="text-[10px] font-mono text-indigo-600 font-extrabold uppercase tracking-widest block">
                      Live Workflow Engine • Step 0{currentStep.id} of 04
                    </span>
                    <h4 className="text-lg sm:text-xl font-black font-heading uppercase tracking-tight text-slate-950 mt-1">
                      {currentStep.preview.docType}
                    </h4>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/90 shadow-2xs">
                    {currentStep.preview.statusText}
                  </span>
                </div>

                {/* Explanation Paragraph */}
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                  {currentStep.description}
                </p>

                {/* Simulated Metadata Box: Crisp Bright White Card */}
                <div className="p-4 sm:p-5 rounded-2xl bg-white border border-indigo-100/90 shadow-sm space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Party / Entity:
                      </span>
                      <p className="font-bold text-slate-950 mt-0.5 text-xs sm:text-sm">
                        {currentStep.preview.applicant}
                      </p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Verification Counterpart:
                      </span>
                      <p className="font-bold text-indigo-700 mt-0.5 text-xs sm:text-sm">
                        {currentStep.preview.buyer}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100">
                    <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block mb-2.5">
                      Statutory Requirements Checklist:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {currentStep.preview.checklist.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 p-2 rounded-lg bg-indigo-50/50 border border-indigo-100/60 text-slate-800"
                        >
                          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 shadow-2xs" />
                          <span className="text-[11px] font-semibold truncate">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bottom Timeline Progress Bar */}
                <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-indigo-100/60">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Auto-Audited MCS Act 1960</span>
                  </div>
                  <span className="font-mono text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
                    Turnaround: 48h Max
                  </span>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
