"use client";

import React, { useState } from "react";
import { SectionHeading, IonIcon } from "@/components/ui";

export function LandingCalculator() {
  const [flatCount, setFlatCount] = useState<number>(180);
  const [activeTab, setActiveTab] = useState<"calculator" | "comparison">("calculator");

  // Calculations based on actual Indian cooperative housing society metrics
  const annualPaperSaved = Math.round(flatCount * 450); // ₹450 per flat/yr in paper, print, photocopying & couriers
  const committeeHoursSaved = Math.round(flatCount * 2.4); // 2.4 hours saved per flat per year
  const nocTurnaroundDays = 2; // down from 21 days
  const auditFinesPrevented = flatCount >= 100 ? "₹25,000+" : "₹10,000+";

  return (
    <section id="calculator" className="py-16 md:py-24 bg-transparent border-b border-slate-200/60 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Tangible Society Impact"
          title="See Real Savings for Your Housing Society"
          subtitle="Calculate exact administrative hours, courier costs, and turnaround times eliminated by digitizing your society's vault and approvals."
          align="center"
          className="mb-10"
        />

        {/* View Switcher */}
        <div className="flex items-center justify-center mb-10">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-full border border-slate-200">
            <button
              type="button"
              onClick={() => setActiveTab("calculator")}
              className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all ${
                activeTab === "calculator"
                  ? "bg-white text-indigo-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Interactive Savings Calculator
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("comparison")}
              className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all ${
                activeTab === "comparison"
                  ? "bg-white text-indigo-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              WhatsApp Chaos vs SocietyFlow
            </button>
          </div>
        </div>

        {activeTab === "calculator" && (
          <div className="max-w-4xl mx-auto bg-slate-50/70 rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
            {/* Slider Control */}
            <div className="mb-8 p-5 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div>
                  <label htmlFor="flat-slider" className="text-sm font-bold text-slate-900">
                    How many units / flats are in your society?
                  </label>
                  <p className="text-xs text-slate-500">
                    Slide to match your society&apos;s wing and flat count
                  </p>
                </div>
                <div className="flex items-baseline gap-1 bg-indigo-50 px-3.5 py-1.5 rounded-xl border border-indigo-200 self-start sm:self-auto">
                  <span className="text-xl sm:text-2xl font-black text-indigo-700 font-heading">
                    {flatCount}
                  </span>
                  <span className="text-xs font-semibold text-indigo-600">Flats</span>
                </div>
              </div>

              <input
                id="flat-slider"
                type="range"
                min="30"
                max="600"
                step="10"
                value={flatCount}
                onChange={(e) => setFlatCount(Number(e.target.value))}
                className="w-full accent-indigo-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
              />

              <div className="flex justify-between text-[11px] text-slate-400 mt-2 font-medium">
                <span>30 Flats (Boutique Building)</span>
                <span>180 Flats (Medium Complex)</span>
                <span>600 Flats (Mega Township)</span>
              </div>
            </div>

            {/* Calculated Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Metric 1 */}
              <div className="p-4 bg-white rounded-xl border border-slate-200 flex flex-col justify-between gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    NOC Turnaround
                  </span>
                  <span className="p-1 rounded-md bg-emerald-50 text-emerald-600">
                    <IonIcon name="time-outline" size={16} />
                  </span>
                </div>
                <div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-extrabold text-slate-900 font-heading">
                      {nocTurnaroundDays} Days
                    </span>
                    <span className="text-xs text-slate-400 line-through">21 Days</span>
                  </div>
                  <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">
                    90% faster committee sign-off
                  </p>
                </div>
              </div>

              {/* Metric 2 */}
              <div className="p-4 bg-white rounded-xl border border-slate-200 flex flex-col justify-between gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Paper & Courier Saved
                  </span>
                  <span className="p-1 rounded-md bg-indigo-50 text-indigo-600">
                    <IonIcon name="document-text-outline" size={16} />
                  </span>
                </div>
                <div>
                  <span className="text-2xl font-extrabold text-indigo-600 font-heading">
                    ₹{annualPaperSaved.toLocaleString("en-IN")}
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Zero physical photocopying & speed-posts
                  </p>
                </div>
              </div>

              {/* Metric 3 */}
              <div className="p-4 bg-white rounded-xl border border-slate-200 flex flex-col justify-between gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Committee Time Saved
                  </span>
                  <span className="p-1 rounded-md bg-sky-50 text-sky-600">
                    <IonIcon name="people-outline" size={16} />
                  </span>
                </div>
                <div>
                  <span className="text-2xl font-extrabold text-slate-900 font-heading">
                    {committeeHoursSaved} Hours/yr
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    For Secretary, Chairman & Treasurer
                  </p>
                </div>
              </div>

              {/* Metric 4 */}
              <div className="p-4 bg-white rounded-xl border border-slate-200 flex flex-col justify-between gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Audit Penalty Risk
                  </span>
                  <span className="p-1 rounded-md bg-emerald-50 text-emerald-600">
                    <IonIcon name="shield-checkmark-outline" size={16} />
                  </span>
                </div>
                <div>
                  <span className="text-2xl font-extrabold text-emerald-600 font-heading">
                    Zero Fines
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Prevents {auditFinesPrevented} MCS Act penalties
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
              <span className="flex items-center gap-1.5 font-medium">
                <IonIcon name="checkmark-circle" className="text-emerald-500" size={15} />
                Calculated per Maharashtra Cooperative Societies Act 1960 Model Bylaw benchmarks.
              </span>
              <a
                href="#features"
                className="text-indigo-600 font-bold hover:underline shrink-0"
              >
                Inspect Module Features →
              </a>
            </div>
          </div>
        )}

        {activeTab === "comparison" && (
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* The Chaotic Traditional Way */}
            <div className="p-6 rounded-2xl border border-rose-200 bg-rose-50/30 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-rose-200">
                <IonIcon name="close-outline" className="text-rose-600" size={20} />
                <h4 className="text-base font-bold text-rose-950 font-heading">
                  The Traditional Paper & WhatsApp Chaos
                </h4>
              </div>
              <ul className="space-y-3 text-xs sm:text-sm text-slate-700">
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-500 font-bold">✕</span>
                  <span>
                    <strong>Lost Share Certificates:</strong> Physical paper certificates misplaced in cupboards during owner succession.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-500 font-bold">✕</span>
                  <span>
                    <strong>3-4 Week NOC Delays:</strong> Chasing Secretary on WhatsApp while bank loan approvals expire.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-500 font-bold">✕</span>
                  <span>
                    <strong>Untracked Tenants:</strong> Renters move in without police verification or registered rent agreements.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-500 font-bold">✕</span>
                  <span>
                    <strong>Audit Season Panic:</strong> Missing physical receipts and unverified resolutions trigger registrar notices.
                  </span>
                </li>
              </ul>
            </div>

            {/* The SocietyFlow Standard */}
            <div className="p-6 rounded-2xl border border-emerald-200 bg-emerald-50/30 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-emerald-200">
                <IonIcon name="checkmark-circle" className="text-emerald-600" size={20} />
                <h4 className="text-base font-bold text-emerald-950 font-heading">
                  The SocietyFlow Standard
                </h4>
              </div>
              <ul className="space-y-3 text-xs sm:text-sm text-slate-700">
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>
                    <strong>Permanent Unit Vault:</strong> Encrypted digital vault for every flat with certified Form I & J share register.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>
                    <strong>48-Hour Digital NOCs:</strong> Multi-signatory digital sign-off with tamper-proof QR verification for banks.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>
                    <strong>Automated KYC Check:</strong> Move-ins require mandatory tenant verification token upload before access.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>
                    <strong>1-Click Auditor Portal:</strong> Chartered Accountants access watermarked balance sheets and minutes directly.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
