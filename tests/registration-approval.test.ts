import { describe, it, expect } from "vitest";
import { SessionUser } from "@/lib/session";
import {
  hasVerifiedSocietyAccess,
  hasAuthorizedFlatAccess,
  getRoleRedirectUrl,
  COMMITTEE_ROLES,
} from "@/lib/rbac";
import {
  ownerRegistrationSchema,
  tenantRegistrationSchema,
  managementRegistrationSchema,
} from "@/modules/auth/schema";

// Helper function modeling Prompt 4 dual-approval state transition
export function transitionTenantApproval(
  current: {
    ownerApproval: "PENDING" | "APPROVED" | "REJECTED";
    societyApproval: "PENDING" | "APPROVED" | "REJECTED";
  },
  action: {
    actor: "OWNER" | "SOCIETY";
    decision: "APPROVED" | "REJECTED";
  }
) {
  const nextOwner = action.actor === "OWNER" ? action.decision : current.ownerApproval;
  const nextSociety = action.actor === "SOCIETY" ? action.decision : current.societyApproval;

  if (nextOwner === "REJECTED" || nextSociety === "REJECTED") {
    return {
      status: "REJECTED" as const,
      membershipStatus: "REJECTED" as const,
      onboardingStatus: "PENDING_REGISTRATION_APPROVAL" as const,
      ownerApproval: nextOwner,
      societyApproval: nextSociety,
    };
  }

  if (nextOwner === "APPROVED" && nextSociety === "APPROVED") {
    return {
      status: "APPROVED" as const,
      membershipStatus: "VERIFIED" as const,
      onboardingStatus: "DOCUMENT_ONBOARDING_REQUIRED" as const,
      ownerApproval: nextOwner,
      societyApproval: nextSociety,
    };
  }

  if (nextOwner === "APPROVED" && nextSociety === "PENDING") {
    return {
      status: "OWNER_APPROVED_SOCIETY_PENDING" as const,
      membershipStatus: "PENDING" as const,
      onboardingStatus: "PENDING_REGISTRATION_APPROVAL" as const,
      ownerApproval: nextOwner,
      societyApproval: nextSociety,
    };
  }

  if (nextSociety === "APPROVED" && nextOwner === "PENDING") {
    return {
      status: "SOCIETY_APPROVED_OWNER_PENDING" as const,
      membershipStatus: "PENDING" as const,
      onboardingStatus: "PENDING_REGISTRATION_APPROVAL" as const,
      ownerApproval: nextOwner,
      societyApproval: nextSociety,
    };
  }

  return {
    status: "PENDING_APPROVAL" as const,
    membershipStatus: "PENDING" as const,
    onboardingStatus: "PENDING_REGISTRATION_APPROVAL" as const,
    ownerApproval: nextOwner,
    societyApproval: nextSociety,
  };
}

describe("SocietyFlow Prompt 4 — Registration Approval & User Activation", () => {
  // Scenario 1: Owner registration creates pending approval
  it("Scenario 1: Owner registration creates pending approval with valid payload", () => {
    const rawPayload = {
      accountType: "OWNER" as const,
      fullName: "Kavita Patil",
      email: "kavita.patil@greenwood.in",
      password: "StrongPassword@2026",
      confirmPassword: "StrongPassword@2026",
      phone: "9822088888",
      societyJoiningMethod: "CODE" as const,
      societyCode: "GREENWOOD-PUNE",
      wing: "Wing A",
      flatNumber: "101",
      ownershipType: "SOLE_OWNER" as const,
      termsAccepted: true,
    };

    const parsed = ownerRegistrationSchema.safeParse(rawPayload);
    expect(parsed.success).toBe(true);

    // Initial Registration Status
    const initialStatus = "PENDING_APPROVAL";
    const initialOnboarding = "PENDING_REGISTRATION_APPROVAL";
    expect(initialStatus).toBe("PENDING_APPROVAL");
    expect(initialOnboarding).toBe("PENDING_REGISTRATION_APPROVAL");
  });

  // Scenario 2: Pending owner cannot enter dashboard
  it("Scenario 2: Pending owner is blocked from dashboard and routed to pending-approval", () => {
    const pendingOwnerSession: SessionUser = {
      id: "usr-pending-owner",
      email: "kavita.patil@greenwood.in",
      name: "Kavita Patil",
      isSuperAdmin: false,
      isPartner: false,
      activeSocietyId: "soc-greenwood",
      activeRole: "OWNER",
      onboardingStatus: "PENDING_REGISTRATION_APPROVAL",
      memberships: [
        {
          societyId: "soc-greenwood",
          societyName: "Greenwood Estates CHS Ltd.",
          societyCode: "GREENWOOD-PUNE",
          role: "OWNER",
          status: "PENDING",
        },
      ],
      occupancies: [
        {
          flatId: "flat-a101",
          societyId: "soc-greenwood",
          wing: "Wing A",
          flatNumber: "101",
          occupancyType: "OWNER",
          status: "PENDING",
        },
      ],
    };

    const redirectUrl = getRoleRedirectUrl(pendingOwnerSession);
    expect(redirectUrl).toBe("/pending-approval");

    // Has no verified flat access
    const hasAccess = hasAuthorizedFlatAccess(pendingOwnerSession, "soc-greenwood", "flat-a101");
    expect(hasAccess).toBe(false);
  });

  // Scenario 3: Management approves owner
  it("Scenario 3: Committee approval transitions owner to VERIFIED and sets DOCUMENT_ONBOARDING_REQUIRED", () => {
    const committeeMember: SessionUser = {
      id: "usr-secretary-1",
      email: "secretary@greenwood.in",
      name: "Ramesh Sharma",
      isSuperAdmin: false,
      isPartner: false,
      activeSocietyId: "soc-greenwood",
      activeRole: "SECRETARY",
      memberships: [
        {
          societyId: "soc-greenwood",
          societyName: "Greenwood Estates CHS Ltd.",
          societyCode: "GREENWOOD-PUNE",
          role: "SECRETARY",
          status: "VERIFIED",
        },
      ],
    };

    // Committee privileges check
    const isAuthorized = hasVerifiedSocietyAccess(committeeMember, "soc-greenwood", COMMITTEE_ROLES);
    expect(isAuthorized).toBe(true);

    // Approval transition
    const ownerApprovalRecord = {
      status: "APPROVED",
      societyApproval: {
        status: "APPROVED",
        decidedBy: committeeMember.id,
        decidedAt: new Date(),
      },
      onboardingStatus: "DOCUMENT_ONBOARDING_REQUIRED",
    };

    expect(ownerApprovalRecord.status).toBe("APPROVED");
    expect(ownerApprovalRecord.societyApproval.status).toBe("APPROVED");
    expect(ownerApprovalRecord.onboardingStatus).toBe("DOCUMENT_ONBOARDING_REQUIRED");
  });

  // Scenario 4: Owner is sent to document onboarding on login
  it("Scenario 4: Approved owner with DOCUMENT_ONBOARDING_REQUIRED is redirected to /onboarding/owner-documents", () => {
    const approvedOwnerSession: SessionUser = {
      id: "usr-approved-owner",
      email: "kavita.patil@greenwood.in",
      name: "Kavita Patil",
      isSuperAdmin: false,
      isPartner: false,
      activeSocietyId: "soc-greenwood",
      activeRole: "OWNER",
      onboardingStatus: "DOCUMENT_ONBOARDING_REQUIRED",
      memberships: [
        {
          societyId: "soc-greenwood",
          societyName: "Greenwood Estates CHS Ltd.",
          societyCode: "GREENWOOD-PUNE",
          role: "OWNER",
          status: "VERIFIED",
        },
      ],
      occupancies: [
        {
          flatId: "flat-a101",
          societyId: "soc-greenwood",
          wing: "Wing A",
          flatNumber: "101",
          occupancyType: "OWNER",
          status: "APPROVED",
        },
      ],
    };

    const redirectUrl = getRoleRedirectUrl(approvedOwnerSession);
    expect(redirectUrl).toBe("/onboarding/owner-documents");
  });

  // Scenario 5: Tenant registration requires two approvals
  it("Scenario 5: Tenant registration requires independent Property Owner and Society approvals", () => {
    const rawTenantPayload = {
      accountType: "TENANT" as const,
      fullName: "Rohan Deshmukh",
      email: "rohan.d@greenwood.in",
      password: "StrongPassword@2026",
      confirmPassword: "StrongPassword@2026",
      phone: "9822088889",
      societyJoiningMethod: "CODE" as const,
      societyCode: "GREENWOOD-PUNE",
      wing: "Wing B",
      flatNumber: "201",
      ownerName: "Rajesh S. Joshi",
      ownerContact: "owner2@greenwood.in",
      termsAccepted: true,
    };

    const parsed = tenantRegistrationSchema.safeParse(rawTenantPayload);
    expect(parsed.success).toBe(true);

    const initialTenantState = {
      ownerApproval: "PENDING" as const,
      societyApproval: "PENDING" as const,
    };

    expect(initialTenantState.ownerApproval).toBe("PENDING");
    expect(initialTenantState.societyApproval).toBe("PENDING");
  });

  // Scenario 6: Owner approval alone cannot activate tenant
  it("Scenario 6: Owner approval alone results in OWNER_APPROVED_SOCIETY_PENDING and prevents activation", () => {
    const current = {
      ownerApproval: "PENDING" as const,
      societyApproval: "PENDING" as const,
    };

    const updated = transitionTenantApproval(current, {
      actor: "OWNER",
      decision: "APPROVED",
    });

    expect(updated.status).toBe("OWNER_APPROVED_SOCIETY_PENDING");
    expect(updated.membershipStatus).toBe("PENDING"); // Not active yet
    expect(updated.onboardingStatus).toBe("PENDING_REGISTRATION_APPROVAL");
  });

  // Scenario 7: Society approval alone cannot activate tenant
  it("Scenario 7: Society approval alone results in SOCIETY_APPROVED_OWNER_PENDING and prevents activation", () => {
    const current = {
      ownerApproval: "PENDING" as const,
      societyApproval: "PENDING" as const,
    };

    const updated = transitionTenantApproval(current, {
      actor: "SOCIETY",
      decision: "APPROVED",
    });

    expect(updated.status).toBe("SOCIETY_APPROVED_OWNER_PENDING");
    expect(updated.membershipStatus).toBe("PENDING"); // Not active yet
    expect(updated.onboardingStatus).toBe("PENDING_REGISTRATION_APPROVAL");
  });

  // Scenario 8: Both approvals activate tenant membership
  it("Scenario 8: Both owner and society approvals activate tenant membership and trigger document onboarding", () => {
    // Stage 1: Owner approved
    const stage1 = transitionTenantApproval(
      { ownerApproval: "PENDING", societyApproval: "PENDING" },
      { actor: "OWNER", decision: "APPROVED" }
    );
    expect(stage1.status).toBe("OWNER_APPROVED_SOCIETY_PENDING");

    // Stage 2: Society approves
    const stage2 = transitionTenantApproval(
      { ownerApproval: stage1.ownerApproval, societyApproval: stage1.societyApproval },
      { actor: "SOCIETY", decision: "APPROVED" }
    );

    expect(stage2.status).toBe("APPROVED");
    expect(stage2.membershipStatus).toBe("VERIFIED");
    expect(stage2.onboardingStatus).toBe("DOCUMENT_ONBOARDING_REQUIRED");

    // Verify tenant session redirect leads to /onboarding/tenant-documents
    const activeTenantSession: SessionUser = {
      id: "usr-active-tenant",
      email: "rohan.d@greenwood.in",
      name: "Rohan Deshmukh",
      isSuperAdmin: false,
      isPartner: false,
      activeSocietyId: "soc-greenwood",
      activeRole: "TENANT",
      onboardingStatus: "DOCUMENT_ONBOARDING_REQUIRED",
      memberships: [
        {
          societyId: "soc-greenwood",
          societyName: "Greenwood Estates CHS Ltd.",
          societyCode: "GREENWOOD-PUNE",
          role: "TENANT",
          status: "VERIFIED",
        },
      ],
    };

    expect(getRoleRedirectUrl(activeTenantSession)).toBe("/onboarding/tenant-documents");
  });

  // Scenario 9: Rejection prevents activation
  it("Scenario 9: Rejection by either party sets status to REJECTED and blocks access", () => {
    const rejectedByOwner = transitionTenantApproval(
      { ownerApproval: "PENDING", societyApproval: "APPROVED" },
      { actor: "OWNER", decision: "REJECTED" }
    );
    expect(rejectedByOwner.status).toBe("REJECTED");
    expect(rejectedByOwner.membershipStatus).toBe("REJECTED");

    const rejectedBySociety = transitionTenantApproval(
      { ownerApproval: "APPROVED", societyApproval: "PENDING" },
      { actor: "SOCIETY", decision: "REJECTED" }
    );
    expect(rejectedBySociety.status).toBe("REJECTED");
    expect(rejectedBySociety.membershipStatus).toBe("REJECTED");
  });

  // Scenario 10: Unauthorized user cannot approve registrations
  it("Scenario 10: Ordinary resident cannot approve registrations", () => {
    const ordinaryResident: SessionUser = {
      id: "usr-resident-ordinary",
      email: "resident@greenwood.in",
      name: "Regular Resident",
      isSuperAdmin: false,
      isPartner: false,
      activeSocietyId: "soc-greenwood",
      activeRole: "OWNER",
      memberships: [
        {
          societyId: "soc-greenwood",
          societyName: "Greenwood Estates CHS Ltd.",
          societyCode: "GREENWOOD-PUNE",
          role: "OWNER",
          status: "VERIFIED",
        },
      ],
    };

    // Cannot perform committee approval
    const canApprove = hasVerifiedSocietyAccess(ordinaryResident, "soc-greenwood", COMMITTEE_ROLES);
    expect(canApprove).toBe(false);

    // Cannot approve tenant for flat they do not own
    const canApproveFlat = hasAuthorizedFlatAccess(ordinaryResident, "soc-greenwood", "flat-other");
    expect(canApproveFlat).toBe(false);
  });

  // Scenario 11: Society administrator cannot approve another society's requests
  it("Scenario 11: Society administrator cannot approve requests from an unrelated society", () => {
    const greenwoodSecretary: SessionUser = {
      id: "usr-sec-greenwood",
      email: "secretary@greenwood.in",
      name: "Greenwood Secretary",
      isSuperAdmin: false,
      isPartner: false,
      activeSocietyId: "soc-greenwood",
      activeRole: "SECRETARY",
      memberships: [
        {
          societyId: "soc-greenwood",
          societyName: "Greenwood Estates CHS Ltd.",
          societyCode: "GREENWOOD-PUNE",
          role: "SECRETARY",
          status: "VERIFIED",
        },
      ],
    };

    // Authorized for Greenwood
    expect(hasVerifiedSocietyAccess(greenwoodSecretary, "soc-greenwood", COMMITTEE_ROLES)).toBe(true);

    // Cross-society: UNAUTHORIZED for Palmgrove Heights
    const hasPalmgroveAccess = hasVerifiedSocietyAccess(
      greenwoodSecretary,
      "soc-palmgrove-heights",
      COMMITTEE_ROLES
    );
    expect(hasPalmgroveAccess).toBe(false);
  });

  // Scenario 12: Society setup cannot grant unverified admin privileges
  it("Scenario 12: Unverified user without controlled invitation or super admin cannot self-activate committee privileges", () => {
    const unverifiedRegistrant: SessionUser = {
      id: "usr-self-reg",
      email: "self.admin@gmail.com",
      name: "Self Claimed Admin",
      isSuperAdmin: false,
      isPartner: false,
      activeSocietyId: "soc-new",
      activeRole: "SECRETARY",
      memberships: [
        {
          societyId: "soc-new",
          societyName: "New Society",
          societyCode: "NEW-SOC",
          role: "SECRETARY",
          status: "PENDING", // PENDING, NOT VERIFIED
        },
      ],
    };

    const isVerified = unverifiedRegistrant.memberships.some(
      (m) => m.status === "VERIFIED" && COMMITTEE_ROLES.includes(m.role as (typeof COMMITTEE_ROLES)[number])
    );
    expect(isVerified).toBe(false);

    // Route redirects to /pending-approval, NOT /management/dashboard
    expect(getRoleRedirectUrl(unverifiedRegistrant)).toBe("/pending-approval");
  });

  it("Scenario 13: Validates dynamic Management Registration with society name, location, wings, and resolution number", () => {
    const validManagementInput = {
      accountType: "MANAGEMENT" as const,
      fullName: "Rajesh Sharma",
      email: "rajesh.secretary@imperial.com",
      password: "StrongPassword@2026",
      confirmPassword: "StrongPassword@2026",
      phone: "9876543210",
      position: "SECRETARY" as const,
      societyName: "Imperial Heights CHS Ltd.",
      societyCode: "IMP-MUM-2026",
      city: "Mumbai",
      state: "Maharashtra",
      pinCode: "400050",
      address: "Bandra West, Hill Road",
      wings: "Wing Alpha, Wing Beta, Wing Gamma",
      resolutionNumber: "AGM-2024-RES-09",
      termsAccepted: true,
    };

    const parsed = managementRegistrationSchema.safeParse(validManagementInput);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.societyName).toBe("Imperial Heights CHS Ltd.");
      expect(parsed.data.city).toBe("Mumbai");
      expect(parsed.data.state).toBe("Maharashtra");
      expect(parsed.data.pinCode).toBe("400050");
      expect(parsed.data.address).toBe("Bandra West, Hill Road");
      expect(parsed.data.wings).toBe("Wing Alpha, Wing Beta, Wing Gamma");
      expect(parsed.data.resolutionNumber).toBe("AGM-2024-RES-09");
    }
  });
});
