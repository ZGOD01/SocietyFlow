"use client";

import React, { useState } from "react";
import { motion } from "motion/react";
import { IonIcon } from "@/components/ui";
import Link from "next/link";

export function LandingBentoGrid() {
  // Interactive Quorum Simulation in Card 2
  const [quorumCount, setQuorumCount] = useState<number>(2);

  const toggleQuorum = () => {
    setQuorumCount((prev) => (prev >= 3 ? 1 : prev + 1));
  };

  // Interactive Document Selector in Card 1
  const [activeDoc, setActiveDoc] = useState<number>(0);
  const sampleDocs = [
    {
      title: "Registered_Sale_Deed_C402.pdf",
      type: "Title Deed",
      size: "6.4 MB",
      hash: "7f83b165...d9069",
      status: "Verified",
    },
    {
      title: "Share_Certificate_No_042.pdf",
      type: "Share Allotment",
      size: "1.8 MB",
      hash: "e3b0c442...2b855",
      status: "Official Seal",
    },
    {
      title: "Bank_Mortgage_NOC_SBI.pdf",
      type: "Resale Clearance",
      size: "820 KB",
      hash: "bc62d4b8...2b6d",
      status: "3/3 Quorum Signed",
    },
  ];

  // Interactive Search Query in Card 4
  const [searchQuery, setSearchQuery] = useState("");
  const archiveFiles = [
    { name: "Model_Bylaws_Approved_2023.pdf", cat: "Statutory Bylaws", year: "2023" },
    { name: "Statutory_Audit_Report_FY24.pdf", cat: "Audit Grade A", year: "2024" },
    { name: "AGM_Meeting_Minutes_Sept.pdf", cat: "Quorum Passed", year: "2024" },
    { name: "Municipal_Fire_Safety_NOC.pdf", cat: "Compliance", year: "2025" },
  ];

  const filteredArchive = archiveFiles.filter(
    (f) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.cat.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <section id="features" className="py-16 md:py-24 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Editorial Header */}
      <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] sm:text-xs font-bold tracking-widest uppercase mb-3 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          <span>Core Architecture</span>
        </div>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black font-heading uppercase tracking-tight text-slate-950 leading-tight">
          BUILT FOR SPEED, PROOF, AND STATUTORY TRUST
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 mt-2.5 font-normal leading-relaxed">
          Four engineered primitives that eliminate physical paperwork, missing share certificates,
          and committee WhatsApp disputes forever.
        </p>
      </div>

      {/* Bento Grid Container */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* CARD 1: Digital Resident Vault (Span 2 cols on lg) */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="lg:col-span-2 rounded-2xl sm:rounded-3xl p-6 sm:p-8 bg-white border border-slate-200/90 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all flex flex-col justify-between gap-6 relative overflow-hidden group"
        >
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/70 rounded-full blur-3xl pointer-events-none -z-10" />

          <div>
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shadow-2xs">
                  <IonIcon name="folder-open-outline" size={18} />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 block">
                    Zero-Trust Privacy
                  </span>
                  <h3 className="text-lg font-black text-slate-950 font-heading uppercase tracking-tight">
                    Encrypted Resident Document Vault
                  </h3>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                AES-256 Rest
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed max-w-xl">
              Each unit operates in cryptographic isolation. Flat owners store registered sale agreements,
              share certificates, and property tax receipts with mathematical permanence.
            </p>

            {/* Interactive Vault Document Previewer */}
            <div className="mt-5 p-3.5 sm:p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 pb-2 border-b border-slate-200/60">
                <span>Select file to inspect watermark:</span>
                <span className="font-mono text-[11px] text-indigo-600 font-bold">Wing C • Flat 402</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {sampleDocs.map((doc, idx) => {
                  const isSelected = activeDoc === idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveDoc(idx)}
                      className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-white border-2 border-indigo-600 shadow-sm"
                          : "bg-white/80 border-slate-200 hover:bg-white text-slate-600"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[9px] font-extrabold uppercase tracking-wider text-indigo-600 truncate">
                          {doc.type}
                        </span>
                        <span className="text-[9px] font-bold text-emerald-600">✓</span>
                      </div>
                      <p className="text-xs font-bold text-slate-900 truncate">{doc.title}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{doc.size}</p>
                    </button>
                  );
                })}
              </div>

              {/* Active Document Tamper-Evident Token */}
              <div className="p-3 rounded-xl bg-white border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Cryptographic Proof Stamp
                  </span>
                  <span className="font-mono text-[11px] font-bold text-slate-800">
                    SHA-256: {sampleDocs[activeDoc].hash}
                  </span>
                </div>
                <span className="self-start sm:self-auto px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold uppercase tracking-wider">
                  {sampleDocs[activeDoc].status}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100">
            <span>Bank-approved format (SBI, HDFC, ICICI, Axis)</span>
            <Link href="/register" className="font-bold text-indigo-600 hover:underline">
              Enroll Unit Vault →
            </Link>
          </div>
        </motion.div>

        {/* CARD 2: Quorum Governance Matrix (1 col on lg) */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="rounded-2xl sm:rounded-3xl p-6 sm:p-8 bg-white border border-slate-200/90 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all flex flex-col justify-between gap-5 group"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shadow-2xs">
                <IonIcon name="checkmark-done-circle-outline" size={18} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                Statutory Quorum
              </span>
            </div>

            <h3 className="text-lg font-black text-slate-950 font-heading uppercase tracking-tight">
              3-Signatory Digital Quorum
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mt-1">
              Never chase committee members on WhatsApp. NOC approvals require verifiable multi-step sign-offs.
            </p>

            {/* Interactive Quorum Stepper */}
            <div className="mt-5 space-y-2.5">
              {[
                { role: "Treasurer", name: "Sunil Joshi", done: quorumCount >= 1 },
                { role: "Secretary", name: "R. K. Sharma", done: quorumCount >= 2 },
                { role: "Chairman", name: "Anand Verma", done: quorumCount >= 3 },
              ].map((signer, sIdx) => (
                <div
                  key={sIdx}
                  className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
                    signer.done
                      ? "bg-emerald-50/60 border-emerald-200 text-slate-900"
                      : "bg-slate-50 border-slate-200/80 text-slate-400"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        signer.done ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {signer.done ? "✓" : sIdx + 1}
                    </span>
                    <div>
                      <p className="font-bold">{signer.role}</p>
                      <p className="text-[10px] text-slate-500">{signer.name}</p>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                      signer.done ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {signer.done ? "Signed" : "Pending"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <button
              type="button"
              onClick={toggleQuorum}
              className="w-full py-2.5 px-4 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-indigo-500/20 active:scale-98"
            >
              <IonIcon name="refresh-outline" size={14} />
              <span>Simulate Signatory: {quorumCount}/3</span>
            </button>
            <p className="text-[10px] text-center text-slate-400 mt-2 font-medium">
              Model Bylaw No. 38 Compliant
            </p>
          </div>
        </motion.div>

        {/* CARD 3: Model Bylaw Compliance Shield (1 col on lg) */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="rounded-2xl sm:rounded-3xl p-6 sm:p-8 bg-white border border-slate-200/90 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all flex flex-col justify-between gap-5 group"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shadow-2xs">
                <IonIcon name="shield-checkmark-outline" size={18} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                MCS Act 1960
              </span>
            </div>

            <h3 className="text-lg font-black text-slate-950 font-heading uppercase tracking-tight">
              Statutory Legal Readiness
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mt-1">
              Aligned with Section 81 for cooperative society accounting and Model Bylaw No. 38 for resale clearances.
            </p>

            <div className="mt-5 p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                <span>Compliance Score</span>
                <span className="text-emerald-600">100% Grade A</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full w-full rounded-full" />
              </div>

              <div className="space-y-1.5 pt-1 text-[11px] text-slate-600">
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span>Form I & J Member Register</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span>Section 73 Committee Mandate</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span>Tamper-evident decision audit log</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Zero audit penalty risk</span>
            <span className="font-bold text-emerald-700">Audit Ready</span>
          </div>
        </motion.div>

        {/* CARD 4: Instant Society Document Archive Search (Span 2 cols on lg) */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="lg:col-span-2 rounded-2xl sm:rounded-3xl p-6 sm:p-8 bg-white border border-slate-200/90 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all flex flex-col justify-between gap-6 group"
        >
          <div>
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shadow-2xs">
                  <IonIcon name="library-outline" size={18} />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 block">
                    Central Governance
                  </span>
                  <h3 className="text-lg font-black text-slate-950 font-heading uppercase tracking-tight">
                    Searchable Society Archive & Minutes
                  </h3>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase">
                Instant Index
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed max-w-xl">
              Eliminate lost paper files during managing committee elections. Search AGM resolutions,
              audited balance sheets, and municipal conveyance deeds in milliseconds.
            </p>

            {/* Live Interactive Search Box */}
            <div className="mt-5 space-y-3">
              <div className="relative">
                <IonIcon
                  name="search-outline"
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter official archive (e.g. Audit, Bylaws, Minutes, Fire)..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-700"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Filtered File Results */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {filteredArchive.slice(0, 4).map((file, fIdx) => (
                  <div
                    key={fIdx}
                    className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/60 hover:bg-white hover:border-indigo-200 transition-all flex items-center justify-between text-xs"
                  >
                    <div className="truncate mr-2">
                      <p className="font-bold text-slate-900 truncate">{file.name}</p>
                      <p className="text-[10px] text-slate-400">{file.cat} • {file.year}</p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100 shrink-0">
                      PDF
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100">
            <span>Historical files indexed by year & category</span>
            <Link href="/login" className="font-bold text-indigo-600 hover:underline">
              Access Document Library →
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
