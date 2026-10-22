"use client";

import React from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { SectionHeading, AppCard, AppButton, IonIcon, StatusBadge } from "@/components/ui";

const plans = [
  {
    name: "Community Starter",
    eyebrow: "Free Pilot",
    price: "₹0",
    period: "for 60 days",
    description: "Ideal for new societies testing digital governance and personal document vaults.",
    features: [
      "Up to 50 residential units",
      "Encrypted personal document vault",
      "Public society document library",
      "Basic NOC & move-in requests",
      "Standard email notifications",
    ],
    buttonText: "Start Free Pilot",
    buttonVariant: "outline" as const,
    popular: false,
  },
  {
    name: "Standard Society",
    eyebrow: "Most Popular",
    price: "₹15",
    period: "per flat / month",
    description: "Comprehensive statutory compliance, committee approvals, and unit vaults.",
    features: [
      "Unlimited residential & commercial units",
      "Managing committee digital sign-off pipeline",
      "Share certificate & registered deed indexing",
      "Multi-wing permission isolation (A–E)",
      "Bank mortgage & resale NOC generation",
      "Priority phone & committee support",
    ],
    buttonText: "Register Your Society",
    buttonVariant: "gradient" as const,
    popular: true,
  },
  {
    name: "Enterprise Complex",
    eyebrow: "Townships & Federations",
    price: "₹25",
    period: "per flat / month",
    description: "Dedicated cluster architecture for large townships and multi-society federations.",
    features: [
      "All Standard features included",
      "Statutory Auditor & Legal Partner desk",
      "Custom Section 73 MCS Act compliance rules",
      "Dedicated account manager & SLA",
      "Historical physical file digitization support",
      "Custom domain & white-label branding",
    ],
    buttonText: "Contact Committee Desk",
    buttonVariant: "outline" as const,
    popular: false,
  },
];

export function LandingPricing() {
  return (
    <section id="pricing" className="py-20 md:py-32 bg-slate-50/50 border-t border-slate-200/80 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Transparent Governance Plans"
          title="Predictable Pricing for Cooperative Societies"
          subtitle="No hidden convenience fees. Fair per-flat pricing compliant with cooperative society financial regulations."
          align="center"
          className="mb-16"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              className="flex"
            >
              <AppCard
                variant="interactive"
                className={`p-7 sm:p-9 flex flex-col justify-between w-full transition-all relative ${
                  plan.popular
                    ? "bg-white border-indigo-500/80 ring-2 ring-indigo-500/20 shadow-[0_20px_50px_-10px_rgba(99,102,241,0.2)] scale-[1.02] z-10"
                    : "glass-card border-slate-200/90"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <StatusBadge variant="hero" size="sm" dot pulse>
                      Recommended for Societies
                    </StatusBadge>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      {plan.eyebrow}
                    </span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  </div>

                  <h3 className="text-2xl font-extrabold text-slate-900 font-heading">
                    {plan.name}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1.5 mb-6 leading-relaxed">
                    {plan.description}
                  </p>

                  <div className="flex items-baseline gap-1.5 pb-6 mb-6 border-b border-slate-100">
                    <span className="text-4xl sm:text-5xl font-extrabold text-slate-900 font-heading tracking-tight">
                      {plan.price}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      {plan.period}
                    </span>
                  </div>

                  <ul className="space-y-3.5 text-xs text-slate-800 mb-8">
                    {plan.features.map((feat, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-2.5">
                        <IonIcon
                          name="checkmark-circle"
                          size={16}
                          className="text-emerald-500 font-bold shrink-0 mt-0.5"
                        />
                        <span className="leading-relaxed">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <Link href="/register" className="w-full block">
                    <AppButton
                      variant={plan.buttonVariant}
                      size="md"
                      pill
                      className="w-full"
                      rightIcon={plan.popular ? "arrow-forward-outline" : undefined}
                    >
                      {plan.buttonText}
                    </AppButton>
                  </Link>
                  <p className="text-[10px] text-center text-slate-400 mt-3 font-medium">
                    Billed annually to Society Maintenance Account
                  </p>
                </div>
              </AppCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
