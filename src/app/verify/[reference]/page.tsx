"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { IonIcon } from "@/components/ui/IonIcon";

interface VerificationRecord {
  documentRef: string;
  documentType: string;
  title: string;
  issueDate: string;
  issuingSociety: {
    name: string;
    registrationNumber: string;
    city: string;
    state: string;
  };
  authorizedSignatory: {
    name: string;
    role: string;
  };
  status: string;
  isDemonstrationPrototype: boolean;
  verificationCount: number;
  disclaimer: string;
}

function PublicDocumentVerificationContent() {
  const routeParams = useParams();
  const reference = (routeParams?.reference as string) || "";
  const [record, setRecord] = useState<VerificationRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!reference) return;
    async function verifyDoc() {
      try {
        const res = await fetch(`/api/verify/${reference}`);
        const data = await res.json();
        if (!res.ok || !data.verified) {
          setError(data.message || data.error || "Document record not found.");
          return;
        }
        setRecord(data.record);
      } catch {
        setError("Network error while validating document record.");
      } finally {
        setLoading(false);
      }
    }
    verifyDoc();
  }, [reference]);

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] flex flex-col justify-between p-4 sm:p-8">
      {/* Brand Header */}
      <div className="max-w-md w-full mx-auto text-center pt-4 pb-2">
        <Link href="/" className="inline-flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-[#4F46E5] text-white flex items-center justify-center font-bold text-lg shadow-sm">
            SF
          </div>
          <span className="font-bold text-xl tracking-tight text-gray-900">SocietyFlow</span>
        </Link>
        <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider font-semibold">
          Public Certificate Registry
        </p>
      </div>

      {/* Main Verification Card */}
      <div className="max-w-md w-full mx-auto my-auto">
        {loading ? (
          <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm text-center space-y-3">
            <IonIcon name="sync-outline" className="animate-spin text-3xl text-indigo-600" />
            <p className="text-sm font-medium text-gray-600">Verifying document reference...</p>
          </div>
        ) : error || !record ? (
          <div className="bg-white p-8 rounded-3xl border border-red-200 shadow-sm text-center space-y-4">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-600">
              <IonIcon name="close-circle-outline" className="text-3xl" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Unverified Record</h2>
            <p className="text-xs text-gray-600 leading-relaxed">{error}</p>
            <div className="pt-2">
              <span className="text-[11px] font-mono text-gray-400 bg-gray-100 px-3 py-1 rounded-md block truncate">
                Ref: {reference}
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-gray-200 shadow-md overflow-hidden">
            {/* Status Banner */}
            <div className="bg-emerald-600 text-white p-5 text-center space-y-1">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-1">
                <IonIcon name="checkmark-circle" className="text-2xl text-white" />
              </div>
              <h2 className="text-base font-bold tracking-tight">Verified SocietyFlow Record</h2>
              <p className="text-xs text-emerald-100">
                Official document issued & registered in society records
              </p>
            </div>

            <div className="p-6 space-y-5">
              {/* Reference & Title */}
              <div className="text-center pb-3 border-b border-gray-100">
                <span className="font-mono text-xs font-bold bg-indigo-50 text-indigo-800 px-3 py-1 rounded-md">
                  {record.documentRef}
                </span>
                <h3 className="text-base font-bold text-gray-900 mt-2">{record.title}</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Issued on{" "}
                  {new Date(record.issueDate).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>

              {/* Minimal Non-Sensitive Details (Section 13 Compliance) */}
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1.5 border-b border-gray-100">
                  <span className="text-gray-500 font-medium">Issuing Society</span>
                  <span className="font-bold text-gray-900 text-right">{record.issuingSociety.name}</span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-gray-100">
                  <span className="text-gray-500 font-medium">Registration No.</span>
                  <span className="font-mono text-gray-700">{record.issuingSociety.registrationNumber}</span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-gray-100">
                  <span className="text-gray-500 font-medium">Location</span>
                  <span className="text-gray-700">
                    {record.issuingSociety.city}, {record.issuingSociety.state}
                  </span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-gray-100">
                  <span className="text-gray-500 font-medium">Authorized Signatory</span>
                  <span className="font-bold text-gray-900">
                    {record.authorizedSignatory.name} ({record.authorizedSignatory.role})
                  </span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-gray-100">
                  <span className="text-gray-500 font-medium">Total Verifications</span>
                  <span className="font-mono text-gray-600">{record.verificationCount} scan(s)</span>
                </div>
              </div>

              {/* Prototype & Legal Disclaimer Box (Prompt 8 Mandate) */}
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-[11px] text-amber-900 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <IonIcon name="alert-circle" className="text-amber-700 text-sm" />
                  <span>DEMONSTRATION PROTOTYPE</span>
                </div>
                <p className="leading-relaxed text-amber-800">
                  {record.disclaimer}
                </p>
              </div>

              {/* Privacy Notice */}
              <p className="text-[10px] text-gray-400 text-center leading-normal">
                To protect resident privacy, full personal contact details, property financial accounts, and underlying documents are accessible only to authenticated authorized parties.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="max-w-md w-full mx-auto text-center pt-4 text-xs text-gray-400">
        &copy; {new Date().getFullYear()} SocietyFlow • Digital Governance Platform
      </div>
    </div>
  );
}

export default function PublicDocumentVerificationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center text-xs font-semibold text-[#6B7280]">
          Verifying certificate...
        </div>
      }
    >
      <PublicDocumentVerificationContent />
    </Suspense>
  );
}
