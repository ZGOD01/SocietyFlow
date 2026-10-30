"use client";

import React from "react";
import { motion } from "motion/react";
import { SectionHeading, AppCard, IconContainer } from "@/components/ui";

const steps = [
  {
    step: "01",
    title: "Society Tenant Onboarding",
    description:
      "Admin registers the cooperative society, configures wing layouts (A to E), sets up managing committee roles, and uploads foundational bylaws.",
    icon: "business-outline",
    variant: "hero-soft" as const,
    gradient: "from-indigo-500 to-indigo-600",
  },
  {
    step: "02",
    title: "Unit Vault Provisioning",
    description:
      "Each flat gets an isolated digital vault. Registered sale agreements, index II, and share certificates are indexed and digitally watermarked.",
    icon: "shield-checkmark-outline",
    variant: "info" as const,
    gradient: "from-sky-500 to-blue-600",
  },
  {
    step: "03",
    title: "Structured Request Pipeline",
    description:
      "Residents apply for sale NOCs, bank mortgage permits, or renovation authorizations with mandatory document checklists right from their mobile portal.",
    icon: "document-text-outline",
    variant: "warning" as const,
    gradient: "from-amber-500 to-orange-600",
  },
  {
    step: "04",
    title: "Digital Committee Sign-Off",
    description:
      "Secretary, Chairman, and Treasurer review the audit trail, append digital sign-offs, and issue verifiable PDF certificates instantly.",
    icon: "checkmark-done-circle-outline",
    variant: "success" as const,
    gradient: "from-emerald-500 to-teal-600",
  },
];

export function LandingHowItWorks() {
  return (
    <section id="how-it-works" className="py-20 md:py-32 bg-transparent relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-1/2 right-0 w-80 h-80 bg-indigo-500/8 blur-[90px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Deterministic Lifecycle"
          title="How SocietyFlow Operates"
          subtitle="A deterministic, multi-tenant lifecycle engineered to eliminate physical delays and compliance disputes."
          align="center"
          className="mb-16"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {steps.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
            >
              <AppCard
                variant="interactive"
                className="p-6 sm:p-7 glass-card h-full flex flex-col justify-between gap-6 relative group overflow-hidden border-slate-200"
              >
                {/* Top Subtle Gradient Accents */}
                <div
                  className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${item.gradient} opacity-80 group-hover:h-1.5 transition-all duration-300`}
                />

                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-3xl font-extrabold text-slate-200 font-heading group-hover:text-indigo-600 transition-colors">
                      {item.step}
                    </span>
                    <IconContainer
                      name={item.icon}
                      variant={item.variant}
                      size="md"
                      className="shadow-2xs group-hover:scale-105 transition-transform"
                    />
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 font-heading mb-2.5 group-hover:text-indigo-950 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span className="font-medium">Step {item.step}</span>
                  <span className="text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-full text-[11px]">
                    Active Engine
                  </span>
                </div>
              </AppCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
