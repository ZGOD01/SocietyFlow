import React from "react";
import Link from "next/link";
import { AppButton, IonIcon } from "@/components/ui";

export function LandingCTA() {
  return (
    <section className="py-20 bg-[#F8F9FA] border-t border-[#E5E7EB]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-8 sm:p-14 text-center shadow-[0_4px_16px_rgba(0,0,0,0.04)] relative overflow-hidden">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#EEF2FF] text-[#4F46E5] text-xs font-semibold mb-6">
            <IonIcon name="sparkles-outline" size={15} />
            <span>Sponsor & Committee Review Ready</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-[#1A1A1A] font-heading tracking-tight mb-4">
            Experience the Future of Society Governance
          </h2>

          <p className="text-base sm:text-lg text-[#6B7280] max-w-2xl mx-auto mb-8 font-normal">
            Step directly into the interactive SocietyFlow prototype console.
            Inspect the multi-tenant architecture, explore the document vaults,
            and review the approval pipeline.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/dashboard" className="w-full sm:w-auto">
              <AppButton
                variant="hero"
                size="lg"
                pill
                rightIcon="arrow-forward-outline"
                className="w-full sm:w-auto"
              >
                Launch Prototype Console
              </AppButton>
            </Link>
            <Link href="/login" className="w-full sm:w-auto">
              <AppButton
                variant="outline"
                size="lg"
                pill
                leftIcon="lock-closed-outline"
                className="w-full sm:w-auto"
              >
                View Auth Gateway
              </AppButton>
            </Link>
          </div>

          <div className="mt-8 pt-8 border-t border-[#F1F3F5] flex flex-wrap items-center justify-center gap-6 text-xs text-[#9CA3AF]">
            <span>Next.js 16 App Router</span>
            <span>•</span>
            <span>Tailwind CSS</span>
            <span>•</span>
            <span>TypeScript Strict</span>
            <span>•</span>
            <span>Multi-Tenant Isolated</span>
          </div>
        </div>
      </div>
    </section>
  );
}
