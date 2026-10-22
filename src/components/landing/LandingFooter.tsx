import React from "react";
import Link from "next/link";
import { IonIcon } from "@/components/ui";

export function LandingFooter() {
  return (
    <footer className="bg-slate-50 border-t border-slate-200 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-12 border-b border-slate-200">
          {/* Brand info */}
          <div className="space-y-4 md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center font-bold text-lg font-heading shadow-xs group-hover:scale-105 transition-transform">
                S
              </div>
              <span className="font-extrabold text-lg tracking-tight font-heading text-slate-900">
                Society<span className="text-indigo-600">Flow</span>
              </span>
            </Link>
            <p className="text-xs text-slate-500 leading-relaxed">
              Next-generation Digital Society Document & Approval Management Platform for cooperative
              housing societies, condominium associations, and residential complexes.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-600 font-semibold bg-emerald-50 px-3 py-1 rounded-full w-fit border border-emerald-100">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>MCS Act 1960 Compliant</span>
            </div>
          </div>

          {/* Module navigation */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">
              Platform Modules
            </h4>
            <ul className="space-y-2 text-xs text-slate-600 font-medium">
              <li>
                <Link href="/documents" className="hover:text-indigo-600 transition-colors">
                  Personal Document Vault
                </Link>
              </li>
              <li>
                <Link href="/society-documents" className="hover:text-indigo-600 transition-colors">
                  Society Document Library
                </Link>
              </li>
              <li>
                <Link href="/requests" className="hover:text-indigo-600 transition-colors">
                  Requests & NOCs
                </Link>
              </li>
              <li>
                <Link href="/approvals" className="hover:text-indigo-600 transition-colors">
                  Committee Approvals
                </Link>
              </li>
              <li>
                <Link href="/properties" className="hover:text-indigo-600 transition-colors">
                  Flats & Ownership Registry
                </Link>
              </li>
            </ul>
          </div>

          {/* Roles & Portals */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">
              Role Portals
            </h4>
            <ul className="space-y-2 text-xs text-slate-600 font-medium">
              <li>
                <Link href="/dashboard" className="hover:text-indigo-600 transition-colors">
                  Resident & Owner Portal
                </Link>
              </li>
              <li>
                <Link href="/management/dashboard" className="hover:text-indigo-600 transition-colors">
                  Managing Committee Console
                </Link>
              </li>
              <li>
                <Link href="/partner/dashboard" className="hover:text-indigo-600 transition-colors">
                  Auditor & Legal Partner Desk
                </Link>
              </li>
              <li>
                <Link href="/admin/dashboard" className="hover:text-indigo-600 transition-colors">
                  Platform Super Admin
                </Link>
              </li>
              <li>
                <Link href="/settings" className="hover:text-indigo-600 transition-colors">
                  Society Configuration
                </Link>
              </li>
            </ul>
          </div>

          {/* Stack & Governance */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">
              Architecture & Stack
            </h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li className="flex items-center gap-1.5">
                <IonIcon name="checkmark" className="text-indigo-600" size={14} />
                <span>Next.js 16 App Router (Turbopack)</span>
              </li>
              <li className="flex items-center gap-1.5">
                <IonIcon name="checkmark" className="text-indigo-600" size={14} />
                <span>Tailwind CSS Modern Tokens</span>
              </li>
              <li className="flex items-center gap-1.5">
                <IonIcon name="checkmark" className="text-indigo-600" size={14} />
                <span>Framer Motion Spring Physics</span>
              </li>
              <li className="flex items-center gap-1.5">
                <IonIcon name="checkmark" className="text-indigo-600" size={14} />
                <span>Strict TypeScript & Zod Validation</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© 2025 SocietyFlow. Digital Society Governance Platform. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/" className="hover:text-slate-800 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/" className="hover:text-slate-800 transition-colors">
              Terms of Governance
            </Link>
            <Link href="/dashboard" className="hover:text-indigo-600 transition-colors font-semibold">
              Live Console
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
