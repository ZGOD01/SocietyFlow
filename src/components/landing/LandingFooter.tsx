import React from "react";
import Link from "next/link";
import { IonIcon } from "@/components/ui";

export function LandingFooter() {
  return (
    <footer className="bg-white border-t border-[#E5E7EB] pt-14 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-12 border-b border-[#F1F3F5]">
          {/* Brand info */}
          <div className="space-y-4 md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#4F46E5] text-white flex items-center justify-center font-bold text-lg font-heading shadow-sm">
                S
              </div>
              <span className="font-extrabold text-lg tracking-tight font-heading text-[#1A1A1A]">
                Society<span className="text-[#4F46E5]">Flow</span>
              </span>
            </Link>
            <p className="text-xs text-[#6B7280] leading-relaxed">
              Digital Society Document & Approval Management Platform for cooperative
              housing societies, condominium associations, and residential complexes.
            </p>
            <div className="flex items-center gap-2 text-xs text-[#10B981] font-medium">
              <span className="w-2 h-2 rounded-full bg-[#10B981]" />
              <span>Cooperative Societies Act Compliant</span>
            </div>
          </div>

          {/* Module navigation */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A] mb-3">
              Platform Modules
            </h4>
            <ul className="space-y-2 text-xs text-[#6B7280]">
              <li>
                <Link href="/documents" className="hover:text-[#4F46E5] transition-colors">
                  Personal Document Vault
                </Link>
              </li>
              <li>
                <Link href="/society-documents" className="hover:text-[#4F46E5] transition-colors">
                  Society Document Library
                </Link>
              </li>
              <li>
                <Link href="/requests" className="hover:text-[#4F46E5] transition-colors">
                  Requests & NOCs
                </Link>
              </li>
              <li>
                <Link href="/approvals" className="hover:text-[#4F46E5] transition-colors">
                  Committee Approvals
                </Link>
              </li>
              <li>
                <Link href="/properties" className="hover:text-[#4F46E5] transition-colors">
                  Flats & Ownership Registry
                </Link>
              </li>
            </ul>
          </div>

          {/* Roles & Portals */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A] mb-3">
              Role Portals
            </h4>
            <ul className="space-y-2 text-xs text-[#6B7280]">
              <li>
                <Link href="/dashboard" className="hover:text-[#4F46E5] transition-colors">
                  Resident & Owner Portal
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-[#4F46E5] transition-colors">
                  Managing Committee Console
                </Link>
              </li>
              <li>
                <Link href="/partner" className="hover:text-[#4F46E5] transition-colors">
                  Auditor & Legal Partner Desk
                </Link>
              </li>
              <li>
                <Link href="/settings" className="hover:text-[#4F46E5] transition-colors">
                  Society Configuration
                </Link>
              </li>
            </ul>
          </div>

          {/* Stack & Governance */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A] mb-3">
              Technical Stack
            </h4>
            <ul className="space-y-2 text-xs text-[#6B7280]">
              <li className="flex items-center gap-1.5">
                <IonIcon name="checkmark" className="text-[#4F46E5]" size={14} />
                <span>Next.js App Router (React 19)</span>
              </li>
              <li className="flex items-center gap-1.5">
                <IonIcon name="checkmark" className="text-[#4F46E5]" size={14} />
                <span>Tailwind CSS + Strict Tokens</span>
              </li>
              <li className="flex items-center gap-1.5">
                <IonIcon name="checkmark" className="text-[#4F46E5]" size={14} />
                <span>Ionicons Vector Design Authority</span>
              </li>
              <li className="flex items-center gap-1.5">
                <IonIcon name="checkmark" className="text-[#4F46E5]" size={14} />
                <span>TypeScript Strict Mode</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#9CA3AF]">
          <p>© 2025 SocietyFlow. Digital Society Document &amp; Approval Platform. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/" className="hover:text-[#1A1A1A] transition-colors">
              Privacy Policy
            </Link>
            <Link href="/" className="hover:text-[#1A1A1A] transition-colors">
              Terms of Governance
            </Link>
            <Link href="/dashboard" className="hover:text-[#4F46E5] transition-colors font-semibold">
              Live Console
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
