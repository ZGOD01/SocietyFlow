"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { IonIcon, StatusBadge, IconContainer } from "@/components/ui";

type SimulatorMode = "noc-flow" | "vault-viewer" | "wing-roster";

export function InteractiveHeroSimulator() {
  const [mode, setMode] = useState<SimulatorMode>("noc-flow");

  // State for NOC Flow Simulator
  const [isSignSecretary, setIsSignSecretary] = useState(true);
  const [isSignChairman, setIsSignChairman] = useState(false);

  // State for Vault Viewer
  const [activeDocIndex, setActiveDocIndex] = useState(0);

  const vaultDocs = [
    {
      id: "DOC-SC-042",
      title: "Original_Share_Certificate_Flat_C402.pdf",
      category: "Share Certificate",
      size: "1.8 MB",
      issuedDate: "14 Jan 2024",
      status: "VERIFIED",
      flat: "Wing C • Flat 402",
      owner: "Priya Mehta",
      sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      details: "Form I & J registered share allotment under Maharashtra Co-op Societies Act 1960.",
    },
    {
      id: "DOC-AGR-881",
      title: "Registered_Sale_Deed_Haveli_II.pdf",
      category: "Registered Agreement",
      size: "6.4 MB",
      issuedDate: "02 Feb 2020",
      status: "AUTHENTICATED",
      flat: "Wing C • Flat 402",
      owner: "Priya Mehta",
      sha256: "7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
      details: "Haveli-II Sub-Registrar stamp duty paid. Index-II scan certified.",
    },
    {
      id: "DOC-AUDIT-24",
      title: "Statutory_Audit_Report_FY23_24_Grade_A.pdf",
      category: "Audited Financials",
      size: "4.2 MB",
      issuedDate: "18 Jun 2024",
      status: "AUDITED",
      flat: "Society-Wide Archive",
      owner: "V. & Associates Chartered Accountants",
      sha256: "bc62d4b80d9e36da29c16c5d4d9f11731f36052c72401a76c23c0fb5a9cd2b6d",
      details: "Certified Grade 'A' compliance with Section 81 of the MCS Act.",
    },
    {
      id: "DOC-FIRE-2025",
      title: "Fire_Safety_Fitness_NOC_2025.pdf",
      category: "Municipal Sanction",
      size: "1.1 MB",
      issuedDate: "10 Jan 2025",
      status: "COMPLIANT",
      flat: "All Wings (A to E)",
      owner: "Chief Fire Officer Pune Municipal Corp",
      sha256: "ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb",
      details: "Annual inspection passed for fire risers, yard hydrants, and dual pumps.",
    },
  ];

  // State for Wing Roster
  const [selectedWing, setSelectedWing] = useState<"A" | "B" | "C">("C");
  const wingUnits = {
    A: [
      { unit: "A-101", owner: "Sunil Joshi", status: "Self-Occupied", dues: "₹0 Clear", cert: "SC-001" },
      { unit: "A-102", owner: "Deepak Ranade", status: "Rented (KYC Verified)", dues: "₹0 Clear", cert: "SC-002" },
      { unit: "A-103", owner: "Anita Deshpande", status: "Self-Occupied", dues: "₹0 Clear", cert: "SC-003" },
      { unit: "A-104", owner: "Sneha Kulkarni", status: "Self-Occupied", dues: "₹0 Clear", cert: "SC-004" },
    ],
    B: [
      { unit: "B-201", owner: "Vikram Patil", status: "Self-Occupied", dues: "₹0 Clear", cert: "SC-028" },
      { unit: "B-202", owner: "Rohan Gokhale", status: "Rented", dues: "₹0 Clear", cert: "SC-029" },
      { unit: "B-301", owner: "Harish Deshmukh", status: "Transfer Pending", dues: "₹0 Clear", cert: "SC-030" },
      { unit: "B-302", owner: "Amit Shinde", status: "Self-Occupied", dues: "₹0 Clear", cert: "SC-031" },
    ],
    C: [
      { unit: "C-401", owner: "Rajesh Bhatia", status: "Self-Occupied", dues: "₹0 Clear", cert: "SC-041" },
      { unit: "C-402", owner: "Priya Mehta", status: "Self-Occupied", dues: "₹0 Clear", cert: "SC-042" },
      { unit: "C-403", owner: "Tanmay Sen", status: "Rented (KYC Verified)", dues: "₹0 Clear", cert: "SC-043" },
      { unit: "C-404", owner: "Vivek Narayanan", status: "Self-Occupied", dues: "₹0 Clear", cert: "SC-044" },
    ],
  };

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200/90 shadow-[0_16px_40px_rgba(15,23,42,0.06),0_1px_3px_rgba(0,0,0,0.03)] overflow-hidden">
      {/* Top Application Bar with Interactive Tab Switcher */}
      <div className="bg-slate-50/90 px-4 sm:px-6 py-3.5 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          <span className="ml-2 text-xs font-bold text-slate-800 font-heading">
            Greenwood Heights CHS Ltd.
          </span>
          <span className="text-[11px] text-slate-400 hidden md:inline">
            • Reg: PNA/PNA(1)/HSG/14902
          </span>
        </div>

        {/* Live Mode Switcher */}
        <div className="flex items-center p-1 bg-white rounded-xl border border-slate-200/80 shadow-2xs self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setMode("noc-flow")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              mode === "noc-flow"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <IonIcon name="checkmark-done-circle-outline" size={14} />
            <span>Live NOC Approval</span>
          </button>
          <button
            type="button"
            onClick={() => setMode("vault-viewer")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              mode === "vault-viewer"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <IonIcon name="folder-open-outline" size={14} />
            <span>Unit Vault</span>
          </button>
          <button
            type="button"
            onClick={() => setMode("wing-roster")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              mode === "wing-roster"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <IonIcon name="business-outline" size={14} />
            <span>Wing Roster</span>
          </button>
        </div>
      </div>

      {/* Interactive Display Area */}
      <div className="p-4 sm:p-6 lg:p-7 bg-gradient-to-b from-white via-slate-50/40 to-white">
        <AnimatePresence mode="wait">
          {/* MODE 1: LIVE NOC APPROVAL SIMULATOR */}
          {mode === "noc-flow" && (
            <motion.div
              key="noc-flow"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Header Explanation */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
                      Interactive Simulation
                    </span>
                    <span className="text-xs text-slate-500">
                      NOC Request #SF-2025-084
                    </span>
                  </div>
                  <h4 className="text-base sm:text-lg font-bold text-slate-900 font-heading">
                    Bank Mortgage & Flat Resale NOC: Flat C-402
                  </h4>
                  <p className="text-xs text-slate-500">
                    Applicant: Priya Mehta • Buyer: Vikram Patil • Bank: State Bank of India
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Quorum:</span>
                  <StatusBadge
                    variant={isSignSecretary && isSignChairman ? "success" : "warning"}
                    size="sm"
                    dot
                  >
                    {isSignSecretary && isSignChairman
                      ? "3 of 3 Signatures Complete"
                      : isSignSecretary
                      ? "2 of 3 Signed (Awaiting Chairman)"
                      : "1 of 3 Signed"}
                  </StatusBadge>
                </div>
              </div>

              {/* 3 Interactive Committee Signatory Checkpoints */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {/* Signer 1: Treasurer (Auto Cleared) */}
                <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 flex flex-col justify-between gap-2.5">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                        1. Society Treasurer
                      </span>
                      <p className="text-sm font-bold text-slate-900 mt-0.5">
                        Sunil Joshi
                      </p>
                    </div>
                    <IonIcon name="checkmark-circle" className="text-emerald-600" size={20} />
                  </div>
                  <div className="text-xs text-slate-600 bg-white/80 p-2 rounded-lg border border-emerald-100">
                    <p className="font-semibold text-emerald-700">✓ No-Dues Verified</p>
                    <p className="text-[11px] text-slate-500">
                      Maintenance paid through Q4 (₹0 due)
                    </p>
                  </div>
                  <span className="text-[10px] text-emerald-600 font-medium">
                    Auto-Signed • 14 Feb 10:30 AM
                  </span>
                </div>

                {/* Signer 2: Secretary (Interactive Toggle) */}
                <div
                  className={`p-4 rounded-xl border transition-all flex flex-col justify-between gap-2.5 ${
                    isSignSecretary
                      ? "border-emerald-200 bg-emerald-50/40"
                      : "border-amber-200 bg-amber-50/40"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                        2. Hon. Secretary
                      </span>
                      <p className="text-sm font-bold text-slate-900 mt-0.5">
                        R. K. Sharma
                      </p>
                    </div>
                    <IonIcon
                      name={isSignSecretary ? "checkmark-circle" : "time-outline"}
                      className={isSignSecretary ? "text-emerald-600" : "text-amber-500"}
                      size={20}
                    />
                  </div>
                  <div className="text-xs bg-white/80 p-2 rounded-lg border border-slate-100">
                    <p className="font-semibold text-slate-800">Sale Agreement & Form 20</p>
                    <p className="text-[11px] text-slate-500">
                      Stamp Duty #MH-PNA-4491 Checked
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsSignSecretary(!isSignSecretary)}
                    className={`w-full py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                      isSignSecretary
                        ? "bg-slate-200 text-slate-700 hover:bg-slate-300"
                        : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-2xs"
                    }`}
                  >
                    {isSignSecretary ? "Signed (Click to Undo)" : "Click to Sign as Secretary"}
                  </button>
                </div>

                {/* Signer 3: Chairman (Interactive Toggle) */}
                <div
                  className={`p-4 rounded-xl border transition-all flex flex-col justify-between gap-2.5 ${
                    isSignChairman
                      ? "border-emerald-200 bg-emerald-50/40"
                      : "border-indigo-200 bg-indigo-50/30"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                        3. Society Chairman
                      </span>
                      <p className="text-sm font-bold text-slate-900 mt-0.5">
                        Anand Verma
                      </p>
                    </div>
                    <IonIcon
                      name={isSignChairman ? "checkmark-circle" : "key-outline"}
                      className={isSignChairman ? "text-emerald-600" : "text-indigo-600"}
                      size={20}
                    />
                  </div>
                  <div className="text-xs bg-white/80 p-2 rounded-lg border border-slate-100">
                    <p className="font-semibold text-slate-800">Final Committee Sanction</p>
                    <p className="text-[11px] text-slate-500">
                      Model Bylaw No. 38 Compliance
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (!isSignSecretary) {
                        setIsSignSecretary(true);
                      }
                      setIsSignChairman(!isSignChairman);
                    }}
                    className={`w-full py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                      isSignChairman
                        ? "bg-slate-200 text-slate-700 hover:bg-slate-300"
                        : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-2xs animate-pulse-glow"
                    }`}
                  >
                    {isSignChairman ? "Signed (Click to Revoke)" : "Click to Approve & Seal"}
                  </button>
                </div>
              </div>

              {/* Dynamic Live Certificate Preview Box */}
              <div className="p-4 sm:p-5 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold shrink-0">
                    <IonIcon name="shield-checkmark-outline" size={26} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 font-heading">
                        Verifiable Digital Certificate #NOC-2025-C402
                      </span>
                      {isSignChairman && isSignSecretary ? (
                        <StatusBadge variant="success" size="sm">
                          Official Seal Ready
                        </StatusBadge>
                      ) : (
                        <StatusBadge variant="warning" size="sm">
                          In Progress
                        </StatusBadge>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {isSignChairman && isSignSecretary
                        ? "Both Secretary and Chairman signatures verified with SHA-256 tamper-proof watermark. Bank can verify instantly via QR code."
                        : "Click 'Click to Approve & Seal' above to experience how digital signatures instantly seal and issue the certificate."}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignSecretary(true);
                      setIsSignChairman(true);
                    }}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-50 shadow-2xs transition-colors"
                  >
                    Fast-Forward Approval ⚡
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* MODE 2: LIVE UNIT VAULT EXPLORER */}
          {mode === "vault-viewer" && (
            <motion.div
              key="vault-viewer"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div>
                  <h4 className="text-base font-bold text-slate-900 font-heading">
                    Flat C-402 Digital Vault • Permanent Repository
                  </h4>
                  <p className="text-xs text-slate-500">
                    Click any document below to inspect watermarked metadata and verification tokens
                  </p>
                </div>
                <StatusBadge variant="hero" size="sm">
                  Encrypted at Rest (AES-256)
                </StatusBadge>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Document Selector List */}
                <div className="lg:col-span-5 space-y-2">
                  {vaultDocs.map((doc, idx) => {
                    const isSelected = activeDocIndex === idx;
                    return (
                      <div
                        key={doc.id}
                        onClick={() => setActiveDocIndex(idx)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? "bg-indigo-50/70 border-indigo-300 shadow-xs"
                            : "bg-white border-slate-200/80 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <IconContainer
                            name="document-text-outline"
                            variant={isSelected ? "hero" : "hero-soft"}
                            size="sm"
                          />
                          <div className="truncate">
                            <p className="text-xs font-bold text-slate-900 truncate">
                              {doc.title}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              {doc.category} • {doc.size}
                            </p>
                          </div>
                        </div>
                        <StatusBadge
                          variant={isSelected ? "hero" : "neutral"}
                          size="sm"
                        >
                          {doc.status}
                        </StatusBadge>
                      </div>
                    );
                  })}
                </div>

                {/* Document Detail Preview Pane */}
                <div className="lg:col-span-7 p-4 sm:p-5 rounded-xl border border-slate-200/90 bg-white flex flex-col justify-between shadow-2xs">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
                          {vaultDocs[activeDocIndex].category}
                        </span>
                        <h5 className="text-sm font-bold text-slate-900 mt-1">
                          {vaultDocs[activeDocIndex].title}
                        </h5>
                      </div>
                      <StatusBadge variant="success" size="sm" dot>
                        Verified Record
                      </StatusBadge>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {vaultDocs[activeDocIndex].details}
                    </p>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
                      <div>
                        <span className="text-slate-400 text-[11px]">Allotted Unit:</span>
                        <p className="font-semibold text-slate-800">
                          {vaultDocs[activeDocIndex].flat}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px]">Verified Party:</span>
                        <p className="font-semibold text-slate-800">
                          {vaultDocs[activeDocIndex].owner}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px]">Date Indexed:</span>
                        <p className="text-slate-700">{vaultDocs[activeDocIndex].issuedDate}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px]">File Key:</span>
                        <p className="text-slate-700 font-mono text-[10px]">
                          {vaultDocs[activeDocIndex].id}
                        </p>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/70 text-[10px] text-slate-500 font-mono break-all">
                      <span className="text-slate-400 font-sans block mb-0.5">
                        SHA-256 Tamper-Evident Hash:
                      </span>
                      {vaultDocs[activeDocIndex].sha256}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-emerald-600 font-semibold flex items-center gap-1">
                      <IonIcon name="shield-checkmark" size={14} />
                      Zero-Loss Guarantee
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        alert(
                          `Simulating Cloudflare R2 download for ${vaultDocs[activeDocIndex].title}. In production, generates signed temporary token.`
                        )
                      }
                      className="px-3 py-1 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors"
                    >
                      Download Copy
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* MODE 3: LIVE WING ROSTER & OCCUPANCY */}
          {mode === "wing-roster" && (
            <motion.div
              key="wing-roster"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h4 className="text-base font-bold text-slate-900 font-heading">
                    Multi-Wing Unit & Share Register
                  </h4>
                  <p className="text-xs text-slate-500">
                    Statutory Form I & J compliance with tenant police verification tracking
                  </p>
                </div>

                {/* Wing Buttons */}
                <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg">
                  {(["A", "B", "C"] as const).map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => setSelectedWing(w)}
                      className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                        selectedWing === w
                          ? "bg-white text-indigo-700 shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Wing {w}
                    </button>
                  ))}
                </div>
              </div>

              {/* Roster Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {wingUnits[selectedWing].map((unit) => (
                  <div
                    key={unit.unit}
                    className="p-3.5 rounded-xl border border-slate-200/80 bg-white hover:border-indigo-300 transition-all flex flex-col justify-between gap-2 shadow-2xs"
                  >
                    <div className="flex items-start justify-between">
                      <span className="text-xs font-extrabold text-slate-900 font-heading bg-slate-100 px-2 py-0.5 rounded-md">
                        {unit.unit}
                      </span>
                      <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                        {unit.cert}
                      </span>
                    </div>

                    <div>
                      <p className="text-xs font-bold text-slate-800">{unit.owner}</p>
                      <p className="text-[11px] text-slate-500">{unit.status}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <span className="text-emerald-700 font-semibold">{unit.dues}</span>
                      <span className="text-slate-400">Vault OK ✓</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-100 text-xs text-indigo-900 flex items-center justify-between">
                <span>
                  Wing {selectedWing} has <strong>100% verified share certificates</strong> and zero unregistered tenancies.
                </span>
                <span className="text-xs font-bold text-indigo-700">Audit Ready</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
