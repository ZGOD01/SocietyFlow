import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { AmbientBackground } from "@/components/landing/AmbientBackground";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingBentoGrid } from "@/components/landing/LandingBentoGrid";
import { LandingWorkflow } from "@/components/landing/LandingWorkflow";
import { LandingRoles } from "@/components/landing/LandingRoles";
import { LandingMetrics } from "@/components/landing/LandingMetrics";
import { LandingPricingFAQ } from "@/components/landing/LandingPricingFAQ";
import { LandingCTA } from "@/components/landing/LandingCTA";
import { LandingFooter } from "@/components/landing/LandingFooter";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white flex flex-col relative selection:bg-[#EEF2FF] selection:text-[#4F46E5]">
      <LandingNavbar />
      <AmbientBackground />
      <main className="flex-1">
        {/* Luxury Architectural Hero Card (Preserved & Approved) */}
        <LandingHero />

        {/* 1. Core Architecture Bento Grid (shadcn UI & Motion) */}
        <LandingBentoGrid />

        {/* 2. Interactive Governance Workflow (4-Step Lifecycle) */}
        <LandingWorkflow />

        {/* 3. Tailored Stakeholder Roles (Committee, Residents, Auditors) */}
        <LandingRoles />

        {/* 4. Interactive Savings & Efficiency Calculator */}
        <LandingMetrics />

        {/* 5. Predictable Pricing & Frequently Asked Questions */}
        <LandingPricingFAQ />

        {/* 6. High-Impact Closing CTA Banner */}
        <LandingCTA />
      </main>
      <LandingFooter />
    </div>
  );
}
