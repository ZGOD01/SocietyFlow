"use client";

import React, { useState } from "react";
import { IonIcon } from "@/components/ui";

export function LandingMetrics() {
  const [flatCount, setFlatCount] = useState<number>(180);

  const annualPaperSaved = Math.round(flatCount * 450);
  const committeeHoursSaved = Math.round(flatCount * 2.4);

  return (
    <section id="savings" className="py-16 md:py-24 bg-slate-50 border-y border-slate-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Editorial Heading */}
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] sm:text-xs font-bold tracking-widest uppercase mb-3 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-indigo-500" />
            <span>ROI & Efficiency</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black font-heading uppercase tracking-tight text-slate-950 leading-tight">
            CALCULATE YOUR SOCIETY&apos;S SAVINGS
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-2.5 font-normal leading-relaxed">
            See the exact administrative hours, courier costs, and turnaround days eliminated by moving to verified digital vaults.
          </p>
        </div>

        {/* Interactive Slider & Metrics Grid */}
        <div className="rounded-2xl sm:rounded-3xl p-6 sm:p-10 bg-white border border-slate-200/90 shadow-sm space-y-8">
          {/* Slider Controls */}
          <div className="space-y-4 pb-6 border-b border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <label htmlFor="units-slider" className="text-sm font-black text-slate-950 uppercase tracking-wide font-heading">
                  Number of Residential Units in Society:
                </label>
                <p className="text-xs text-slate-500 mt-0.5">
                  Slide to adjust your complex size across all wings
                </p>
              </div>
              <div className="flex items-baseline gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white self-start sm:self-auto shadow-md shadow-indigo-500/20">
                <span className="text-2xl font-black font-heading">{flatCount}</span>
                <span className="text-xs font-bold text-indigo-200 uppercase">Flats</span>
              </div>
            </div>

            <input
              id="units-slider"
              type="range"
              min="30"
              max="600"
              step="10"
              value={flatCount}
              onChange={(e) => setFlatCount(Number(e.target.value))}
              className="w-full accent-indigo-600 h-2 bg-slate-100 rounded-lg cursor-pointer"
            />

            <div className="flex justify-between text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
              <span>30 Flats (Boutique)</span>
              <span>180 Flats (Mid-Rise)</span>
              <span>600 Flats (Mega Complex)</span>
            </div>
          </div>

          {/* 4 Impact Numbers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  NOC Turnaround
                </span>
                <IonIcon name="time-outline" className="text-emerald-600" size={18} />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-950 font-heading">48 Hrs</span>
                <span className="text-xs text-slate-400 line-through">21 Days</span>
              </div>
              <p className="text-[11px] text-emerald-600 font-bold">90% faster clearance</p>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Courier & Print Saved
                </span>
                <IonIcon name="document-text-outline" className="text-indigo-600" size={18} />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-950 font-heading">
                  ₹{annualPaperSaved.toLocaleString("en-IN")}
                </span>
                <span className="text-xs text-slate-400">/ yr</span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Zero paper cupboards</p>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Committee Time Saved
                </span>
                <IonIcon name="people-outline" className="text-sky-600" size={18} />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-950 font-heading">
                  {committeeHoursSaved}
                </span>
                <span className="text-xs text-slate-400">Hours / yr</span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Hon. Secretary & Chairman</p>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Audit Penalty Risk
                </span>
                <IonIcon name="shield-checkmark-outline" className="text-emerald-600" size={18} />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-emerald-600 font-heading">₹0</span>
                <span className="text-xs text-slate-400">Risk</span>
              </div>
              <p className="text-[11px] text-emerald-600 font-bold">Model Bylaw compliant</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
