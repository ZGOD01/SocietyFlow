import React from "react";
import { ModuleFoundationView } from "@/components/common/ModuleFoundationView";

export default function PartnerPortalPage() {
  return (
    <ModuleFoundationView
      moduleName="Auditor & Legal Partner Portal"
      routePath="/partner"
      iconName="briefcase-outline"
      summary="Third-party portal for Chartered Accountants, Statutory Auditors, and Real Estate Advocates conducting legal title due diligence"
      targetMilestone="Milestone 5: Statutory Audit Desk"
      demoStats={[
        { label: "Audit Quotas", value: "FY 2024-25" },
        { label: "Voucher Samples", value: "100% Digital" },
        { label: "CA Cert Status", value: "Grade 'A'" },
        { label: "Title Due Diligence", value: "Verified" },
      ]}
      architecturalComponents={[
        "src/types/index.ts (AUDITOR_PARTNER role contract)",
        "src/modules/documents/schema.ts (AUDIT_FINANCIALS category)",
        "src/config/navigation.ts (Auditor-restricted scope map)",
      ]}
      plannedIntegrations={[
        "Statutory Audit Balance Sheet Bulk Exporter",
        "Encrypted Temporary Read-Only Voucher Tokens",
        "Digital Signature Certificate (DSC) Token Integration",
      ]}
    />
  );
}
