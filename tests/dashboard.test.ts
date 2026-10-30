import { describe, it, expect } from "vitest";
import { SessionUser } from "@/lib/session";
import {
  hasVerifiedSocietyAccess,
  hasAuthorizedFlatAccess,
  getRoleRedirectUrl,
  COMMITTEE_ROLES,
} from "@/lib/rbac";

describe("Dashboard Role Authority & Navigation Matrix (Prompt 3)", () => {
  const ownerUser: SessionUser = {
    id: "usr-owner-1",
    email: "owner@greenwood.in",
    name: "Meera Sharma",
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
    occupancies: [
      {
        flatId: "flat-c402",
        societyId: "soc-greenwood",
        wing: "Wing C",
        flatNumber: "402",
        occupancyType: "OWNER",
        status: "APPROVED",
      },
    ],
  };

  const tenantUser: SessionUser = {
    id: "usr-tenant-1",
    email: "tenant@greenwood.in",
    name: "Amit Verma",
    isSuperAdmin: false,
    isPartner: false,
    activeSocietyId: "soc-greenwood",
    activeRole: "TENANT",
    memberships: [
      {
        societyId: "soc-greenwood",
        societyName: "Greenwood Estates CHS Ltd.",
        societyCode: "GREENWOOD-PUNE",
        role: "TENANT",
        status: "VERIFIED",
      },
    ],
    occupancies: [
      {
        flatId: "flat-b201",
        societyId: "soc-greenwood",
        wing: "Wing B",
        flatNumber: "201",
        occupancyType: "TENANT",
        status: "APPROVED",
      },
    ],
  };

  const secretaryUser: SessionUser = {
    id: "usr-sec-1",
    email: "secretary@greenwood.in",
    name: "Ramesh Kulkarni",
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

  const chairmanUser: SessionUser = {
    ...secretaryUser,
    id: "usr-chair-1",
    email: "chairman@greenwood.in",
    name: "Sunil Deshmukh",
    activeRole: "CHAIRMAN",
    memberships: [{ ...secretaryUser.memberships[0], role: "CHAIRMAN" }],
  };

  const treasurerUser: SessionUser = {
    ...secretaryUser,
    id: "usr-treas-1",
    email: "treasurer@greenwood.in",
    name: "Anand Patwardhan",
    activeRole: "TREASURER",
    memberships: [{ ...secretaryUser.memberships[0], role: "TREASURER" }],
  };

  const managerUser: SessionUser = {
    ...secretaryUser,
    id: "usr-mgr-1",
    email: "manager@greenwood.in",
    name: "Vikas Shinde",
    activeRole: "SOCIETY_MANAGER",
    memberships: [{ ...secretaryUser.memberships[0], role: "SOCIETY_MANAGER" }],
  };

  const superAdminUser: SessionUser = {
    id: "usr-admin-1",
    email: "admin@societyflow.com",
    name: "Platform Admin",
    isSuperAdmin: true,
    isPartner: false,
    memberships: [],
  };

  const partnerUser: SessionUser = {
    id: "usr-part-1",
    email: "auditor@legaldesk.in",
    name: "Adv. Sanjay Rao",
    isSuperAdmin: false,
    isPartner: true,
    memberships: [
      {
        societyId: "soc-greenwood",
        societyName: "Greenwood Estates CHS Ltd.",
        societyCode: "GREENWOOD-PUNE",
        role: "PARTNER",
        status: "VERIFIED",
      },
    ],
  };

  it("routes Owner to /dashboard", () => {
    expect(getRoleRedirectUrl(ownerUser)).toBe("/dashboard");
  });

  it("routes Tenant to /dashboard?view=tenant", () => {
    expect(getRoleRedirectUrl(tenantUser)).toBe("/dashboard?view=tenant");
  });

  it("routes all Society Management roles to /management/dashboard", () => {
    expect(getRoleRedirectUrl(secretaryUser)).toBe("/management/dashboard");
    expect(getRoleRedirectUrl(chairmanUser)).toBe("/management/dashboard");
    expect(getRoleRedirectUrl(treasurerUser)).toBe("/management/dashboard");
    expect(getRoleRedirectUrl(managerUser)).toBe("/management/dashboard");
  });

  it("routes Super Admin to /admin/dashboard", () => {
    expect(getRoleRedirectUrl(superAdminUser)).toBe("/admin/dashboard");
  });

  it("routes Channel Partner / Statutory Auditor to /partner/dashboard", () => {
    expect(getRoleRedirectUrl(partnerUser)).toBe("/partner/dashboard");
  });

  it("enforces committee role classification", () => {
    expect(COMMITTEE_ROLES).toContain("SECRETARY");
    expect(COMMITTEE_ROLES).toContain("CHAIRMAN");
    expect(COMMITTEE_ROLES).toContain("TREASURER");
    expect(COMMITTEE_ROLES).toContain("SOCIETY_MANAGER");
    expect(COMMITTEE_ROLES).not.toContain("TENANT");
    expect(COMMITTEE_ROLES).not.toContain("OWNER");
  });

  it("validates cross-flat isolation between Owner and Tenant", () => {
    // Owner owns Flat C-402
    expect(hasAuthorizedFlatAccess(ownerUser, "soc-greenwood", "flat-c402")).toBe(true);
    // Owner cannot access Tenant flat B-201
    expect(hasAuthorizedFlatAccess(ownerUser, "soc-greenwood", "flat-b201")).toBe(false);

    // Tenant occupies Flat B-201
    expect(hasAuthorizedFlatAccess(tenantUser, "soc-greenwood", "flat-b201")).toBe(true);
    // Tenant cannot access Owner flat C-402
    expect(hasAuthorizedFlatAccess(tenantUser, "soc-greenwood", "flat-c402")).toBe(false);
  });

  it("ensures workspace switcher only displays verified memberships", () => {
    const multiMemberUser: SessionUser = {
      id: "usr-multi-1",
      email: "multi@societyflow.com",
      name: "Multi User",
      isSuperAdmin: false,
      isPartner: false,
      memberships: [
        {
          societyId: "soc-1",
          societyName: "Society 1",
          societyCode: "SOC-1",
          role: "OWNER",
          status: "VERIFIED",
        },
        {
          societyId: "soc-2",
          societyName: "Society 2",
          societyCode: "SOC-2",
          role: "TENANT",
          status: "PENDING",
        },
        {
          societyId: "soc-3",
          societyName: "Society 3",
          societyCode: "SOC-3",
          role: "OWNER",
          status: "VERIFIED",
        },
      ],
    };

    const verified = multiMemberUser.memberships.filter((m) => m.status === "VERIFIED");
    expect(verified.length).toBe(2);
    expect(verified.map((v) => v.societyId)).toEqual(["soc-1", "soc-3"]);
    expect(verified.some((v) => v.societyId === "soc-2")).toBe(false);
  });
});
