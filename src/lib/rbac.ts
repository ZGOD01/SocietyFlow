import { SessionUser } from "./session";
import { MembershipRole } from "@/models/SocietyMembership";
export type { MembershipRole };

export const COMMITTEE_ROLES: MembershipRole[] = [
  "SECRETARY",
  "CHAIRMAN",
  "TREASURER",
  "SOCIETY_MANAGER",
];

export const RESIDENT_ROLES: MembershipRole[] = ["OWNER", "TENANT"];

export const ALL_ROLES: MembershipRole[] = [
  "OWNER",
  "TENANT",
  "SECRETARY",
  "CHAIRMAN",
  "TREASURER",
  "SOCIETY_MANAGER",
  "PARTNER",
  "SUPER_ADMIN",
];

/**
 * Check if a session user has a verified membership in a specific society with optional role checks.
 */
export function hasVerifiedSocietyAccess(
  user: SessionUser,
  societyId: string,
  allowedRoles?: MembershipRole[]
): boolean {
  if (user.isSuperAdmin) {
    return true;
  }

  const membership = user.memberships.find(
    (m) => m.societyId === societyId && m.status === "VERIFIED"
  );

  if (!membership) {
    return false;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    return allowedRoles.includes(membership.role as MembershipRole);
  }

  return true;
}

/**
 * Check if a session user is an authorized occupant/owner of a specific flat.
 */
export function hasAuthorizedFlatAccess(
  user: SessionUser,
  societyId: string,
  flatId: string
): boolean {
  if (user.isSuperAdmin) {
    return true;
  }

  // Committee members have administrative oversight for flats within their verified society
  const isCommittee = user.memberships.some(
    (m) =>
      m.societyId === societyId &&
      m.status === "VERIFIED" &&
      COMMITTEE_ROLES.includes(m.role as MembershipRole)
  );

  if (isCommittee) {
    return true;
  }

  // Direct flat occupancy check
  if (!user.occupancies || user.occupancies.length === 0) {
    return false;
  }

  return user.occupancies.some(
    (occ) =>
      occ.societyId === societyId &&
      occ.flatId === flatId &&
      occ.status === "APPROVED"
  );
}

/**
 * Determine the primary landing route for a user based on their verified memberships.
 */
export function getRoleRedirectUrl(user: SessionUser): string {
  if (user.isSuperAdmin) {
    return "/admin/dashboard";
  }

  if (user.isPartner) {
    return "/partner/dashboard";
  }

  const verifiedMemberships = user.memberships.filter((m) => m.status === "VERIFIED");

  if (verifiedMemberships.length === 0) {
    return "/pending-approval";
  }

  // Document onboarding requirement for newly approved residents
  if (user.onboardingStatus === "DOCUMENT_ONBOARDING_REQUIRED") {
    const primary = verifiedMemberships[0];
    if (primary?.role === "TENANT") {
      return "/onboarding/tenant-documents";
    }
    if (primary?.role === "OWNER") {
      return "/onboarding/owner-documents";
    }
  }

  // If user belongs to multiple distinct societies or has multiple verified roles, direct to workspace chooser
  const distinctSocieties = new Set(verifiedMemberships.map((m) => m.societyId));
  if (distinctSocieties.size > 1 || verifiedMemberships.length > 2) {
    return "/select-workspace";
  }

  const primary = verifiedMemberships[0];

  if (
    COMMITTEE_ROLES.includes(primary.role as MembershipRole) ||
    primary.role === "MANAGEMENT"
  ) {
    return "/management/dashboard";
  }

  if (primary.role === "TENANT") {
    return "/dashboard?view=tenant";
  }

  return "/dashboard";
}
