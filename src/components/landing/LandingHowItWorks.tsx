import React from "react";
import { SectionHeading, AppCard, IconContainer } from "@/components/ui";

const steps = [
  {
    step: "01",
    title: "Society Tenant Onboarding",
    description:
      "Admin registers the cooperative society, configures wing layouts (A to E), sets up managing committee roles, and uploads foundational bylaws.",
    icon: "business-outline",
    variant: "hero-soft" as const,
  },
  {
    step: "02",
    title: "Unit Vault Provisioning",
    description:
      "Each flat gets an isolated digital vault. Registered sale agreements, index II, and share certificates are indexed and digitally watermarked.",
    icon: "shield-checkmark-outline",
    variant: "info" as const,
  },
  {
    step: "03",
    title: "Structured Request Pipeline",
    description:
      "Residents apply for sale NOCs, bank mortgage permits, or renovation authorizations with mandatory document checklists right from the mobile portal.",
    icon: "document-text-outline",
    variant: "warning" as const,
  },
  {
    step: "04",
    title: "Digital Committee Sign-Off",
    description:
      "Secretary, Chairman, and Treasurer review the audit trail, append digital sign-offs, and issue verifiable PDF certificates instantly.",
    icon: "checkmark-done-circle-outline",
    variant: "success" as const,
  },
];

export function LandingHowItWorks() {
  return (
    <section id="how-it-works" className="py-20 md:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Workflow Architecture"
          title="How SocietyFlow Operates"
          subtitle="A deterministic, multi-tenant lifecycle engineered to eliminate physical delays and compliance disputes."
          align="center"
          className="mb-16"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((item, idx) => (
            <AppCard
              key={idx}
              className="p-6 bg-white border-[#E5E7EB] hover:border-[#D1D5DB] flex flex-col justify-between gap-5 relative group"
            >
              <div className="flex items-center justify-between">
                <span className="text-3xl font-extrabold text-[#E5E7EB] font-heading group-hover:text-[#4F46E5] transition-colors">
                  {item.step}
                </span>
                <IconContainer
                  name={item.icon}
                  variant={item.variant}
                  size="md"
                />
              </div>

              <div>
                <h3 className="text-lg font-bold text-[#1A1A1A] font-heading mb-2">
                  {item.title}
                </h3>
                <p className="text-xs sm:text-sm text-[#6B7280] leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="pt-3 border-t border-[#F1F3F5] flex items-center justify-between text-xs text-[#9CA3AF]">
                <span>Phase {item.step}</span>
                <span className="text-[#4F46E5] font-semibold">Ready</span>
              </div>
            </AppCard>
          ))}
        </div>
      </div>
    </section>
  );
}
