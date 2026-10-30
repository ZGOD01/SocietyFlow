import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/auth-passwords";
import {
  createSessionToken,
  verifySessionToken,
  verifySessionTokenWithMeta,
  DEFAULT_SESSION_MAX_AGE_SECONDS,
  SessionUser,
} from "@/lib/session";
import {
  hasVerifiedSocietyAccess,
  hasAuthorizedFlatAccess,
  getRoleRedirectUrl,
} from "@/lib/rbac";
import { checkRateLimit, resetRateLimit } from "@/lib/rate-limit";

describe("Password Hashing & Verification (bcryptjs)", () => {
  it("hashes password and verifies matching password successfully", async () => {
    const password = "SocietyFlow@Password2026!";
    const hash = await hashPassword(password);

    expect(hash).toBeDefined();
    expect(hash.startsWith("$2")).toBe(true); // bcrypt signature

    const isMatch = await verifyPassword(password, hash);
    expect(isMatch).toBe(true);
  });

  it("rejects incorrect passwords", async () => {
    const password = "CorrectPassword123!";
    const wrongPassword = "WrongPassword123!";
    const hash = await hashPassword(password);

    const isMatch = await verifyPassword(wrongPassword, hash);
    expect(isMatch).toBe(false);
  });
});

describe("JWT Session Tokens (jose)", () => {
  const mockUser: SessionUser = {
    id: "usr-123456789012345678901234",
    email: "meera.sharma@greenwood.in",
    name: "Meera Sharma",
    phone: "9822055555",
    isSuperAdmin: false,
    isPartner: false,
    activeSocietyId: "soc-greenwood-pune",
    activeRole: "OWNER",
    memberships: [
      {
        societyId: "soc-greenwood-pune",
        societyName: "Greenwood Estates CHS Ltd.",
        societyCode: "GREENWOOD-PUNE",
        role: "OWNER",
        status: "VERIFIED",
      },
    ],
    occupancies: [
      {
        flatId: "flat-c402",
        societyId: "soc-greenwood-pune",
        wing: "Wing C",
        flatNumber: "402",
        occupancyType: "OWNER",
        status: "APPROVED",
      },
    ],
  };

  it("creates and verifies a valid signed session token", async () => {
    const token = await createSessionToken(mockUser);
    expect(token).toBeDefined();
    expect(typeof token).toBe("string");

    const decoded = await verifySessionToken(token);
    expect(decoded).toBeDefined();
    expect(decoded?.email).toBe(mockUser.email);
    expect(decoded?.id).toBe(mockUser.id);
    expect(decoded?.activeRole).toBe("OWNER");
  });

  it("returns session metadata with expiration and remaining seconds", async () => {
    const duration = 1800; // 30 mins
    const token = await createSessionToken(mockUser, duration);
    const meta = await verifySessionTokenWithMeta(token);

    expect(meta).not.toBeNull();
    expect(meta?.user.email).toBe(mockUser.email);
    expect(meta?.maxAgeSeconds).toBe(duration);
    expect(meta?.remainingSeconds).toBeGreaterThan(1790);
    expect(meta?.expiresAt).toBeGreaterThan(Date.now());
  });

  it("rejects expired session tokens (timeout / time spent)", async () => {
    // Generate a token already expired in the past (-10 seconds)
    const expiredToken = await createSessionToken(mockUser, -10);

    const decoded = await verifySessionToken(expiredToken);
    expect(decoded).toBeNull();

    const decodedMeta = await verifySessionTokenWithMeta(expiredToken);
    expect(decodedMeta).toBeNull();
  });

  it("returns null for tampered or invalid tokens", async () => {
    const invalidToken = "eyJhbGciOiJIUzI1NiJ9.invalidpayload.tampered_signature";
    const result = await verifySessionToken(invalidToken);
    expect(result).toBeNull();
  });
});

describe("Role-Based Access Control (RBAC)", () => {
  const verifiedOwner: SessionUser = {
    id: "usr-owner-1",
    email: "owner@greenwood.in",
    name: "Meera Sharma",
    isSuperAdmin: false,
    isPartner: false,
    memberships: [
      {
        societyId: "soc-greenwood",
        societyName: "Greenwood CHS",
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

  const pendingResident: SessionUser = {
    id: "usr-pending-1",
    email: "pending@greenwood.in",
    name: "Kavita Patil",
    isSuperAdmin: false,
    isPartner: false,
    memberships: [
      {
        societyId: "soc-greenwood",
        societyName: "Greenwood CHS",
        societyCode: "GREENWOOD-PUNE",
        role: "OWNER",
        status: "PENDING",
      },
    ],
  };

  const secretaryUser: SessionUser = {
    id: "usr-secretary-1",
    email: "secretary@greenwood.in",
    name: "Ramesh Kulkarni",
    isSuperAdmin: false,
    isPartner: false,
    memberships: [
      {
        societyId: "soc-greenwood",
        societyName: "Greenwood CHS",
        societyCode: "GREENWOOD-PUNE",
        role: "SECRETARY",
        status: "VERIFIED",
      },
    ],
  };

  const superAdminUser: SessionUser = {
    id: "usr-admin-1",
    email: "admin@societyflow.com",
    name: "Super Admin",
    isSuperAdmin: true,
    isPartner: false,
    memberships: [],
  };

  it("validates society access strictly for verified memberships", () => {
    expect(hasVerifiedSocietyAccess(verifiedOwner, "soc-greenwood")).toBe(true);
    expect(hasVerifiedSocietyAccess(verifiedOwner, "soc-palmgrove")).toBe(false);

    // Pending resident cannot access until approved
    expect(hasVerifiedSocietyAccess(pendingResident, "soc-greenwood")).toBe(false);

    // Super admin bypasses
    expect(hasVerifiedSocietyAccess(superAdminUser, "soc-palmgrove")).toBe(true);
  });

  it("enforces role constraints within a society", () => {
    expect(hasVerifiedSocietyAccess(secretaryUser, "soc-greenwood", ["SECRETARY", "CHAIRMAN"])).toBe(true);
    expect(hasVerifiedSocietyAccess(verifiedOwner, "soc-greenwood", ["SECRETARY", "CHAIRMAN"])).toBe(false);
  });

  it("prevents residents from accessing unauthorized flats", () => {
    // Owner can access their own flat
    expect(hasAuthorizedFlatAccess(verifiedOwner, "soc-greenwood", "flat-c402")).toBe(true);

    // Owner CANNOT access neighbor's flat
    expect(hasAuthorizedFlatAccess(verifiedOwner, "soc-greenwood", "flat-a101")).toBe(false);

    // Secretary has supervisory access to flats in their verified society
    expect(hasAuthorizedFlatAccess(secretaryUser, "soc-greenwood", "flat-c402")).toBe(true);
  });

  it("routes users to correct destinations based on verified roles", () => {
    expect(getRoleRedirectUrl(verifiedOwner)).toBe("/dashboard");
    expect(getRoleRedirectUrl(secretaryUser)).toBe("/management/dashboard");
    expect(getRoleRedirectUrl(pendingResident)).toBe("/pending-approval");
    expect(getRoleRedirectUrl(superAdminUser)).toBe("/admin/dashboard");

    const tenantUser: SessionUser = {
      ...verifiedOwner,
      memberships: [{ ...verifiedOwner.memberships[0], role: "TENANT" }],
    };
    expect(getRoleRedirectUrl(tenantUser)).toBe("/dashboard?view=tenant");

    const multiSocietyUser: SessionUser = {
      ...verifiedOwner,
      memberships: [
        { ...verifiedOwner.memberships[0], societyId: "soc-1" },
        { ...verifiedOwner.memberships[0], societyId: "soc-2" },
      ],
    };
    expect(getRoleRedirectUrl(multiSocietyUser)).toBe("/select-workspace");
  });
});

describe("Brute Force Rate Limiting", () => {
  it("enforces maximum attempts and blocks after threshold", () => {
    const key = `test-limit-${Date.now()}`;
    const max = 3;

    expect(checkRateLimit(key, max, 10).allowed).toBe(true);
    expect(checkRateLimit(key, max, 10).allowed).toBe(true);
    expect(checkRateLimit(key, max, 10).allowed).toBe(true);

    // 4th attempt should be blocked
    const fourth = checkRateLimit(key, max, 10);
    expect(fourth.allowed).toBe(false);
    expect(fourth.remaining).toBe(0);

    // Reset clears the counter
    resetRateLimit(key);
    expect(checkRateLimit(key, max, 10).allowed).toBe(true);
  });
});

describe("Cross-Society Isolation & Partner Routing", () => {
  const partnerUser: SessionUser = {
    id: "usr-partner-1",
    email: "auditor@legaldesk.in",
    name: "Adv. Sanjay Rao",
    isSuperAdmin: false,
    isPartner: true,
    memberships: [
      {
        societyId: "soc-greenwood",
        societyName: "Greenwood CHS",
        societyCode: "GREENWOOD-PUNE",
        role: "PARTNER",
        status: "VERIFIED",
      },
    ],
  };

  const secretaryUser: SessionUser = {
    id: "usr-sec-1",
    email: "secretary@greenwood.in",
    name: "Ramesh Kulkarni",
    isSuperAdmin: false,
    isPartner: false,
    memberships: [
      {
        societyId: "soc-greenwood",
        societyName: "Greenwood CHS",
        societyCode: "GREENWOOD-PUNE",
        role: "SECRETARY",
        status: "VERIFIED",
      },
    ],
  };

  it("routes auditor / partner to /partner/dashboard", () => {
    expect(getRoleRedirectUrl(partnerUser)).toBe("/partner/dashboard");
  });

  it("strictly isolates committee authority to their own society", () => {
    // Secretary has supervisory access in Greenwood
    expect(hasVerifiedSocietyAccess(secretaryUser, "soc-greenwood")).toBe(true);
    expect(hasAuthorizedFlatAccess(secretaryUser, "soc-greenwood", "flat-c402")).toBe(true);

    // Secretary CANNOT supervise or access flats in Palmgrove
    expect(hasVerifiedSocietyAccess(secretaryUser, "soc-palmgrove")).toBe(false);
    expect(hasAuthorizedFlatAccess(secretaryUser, "soc-palmgrove", "flat-tower1001")).toBe(false);
  });

  it("prohibits flat owners in Society 1 from accessing flats in Society 2", () => {
    const ownerSociety1: SessionUser = {
      id: "usr-owner-s1",
      email: "owner@greenwood.in",
      name: "Meera Sharma",
      isSuperAdmin: false,
      isPartner: false,
      memberships: [
        {
          societyId: "soc-greenwood",
          societyName: "Greenwood CHS",
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

    expect(hasAuthorizedFlatAccess(ownerSociety1, "soc-greenwood", "flat-c402")).toBe(true);
    expect(hasAuthorizedFlatAccess(ownerSociety1, "soc-palmgrove", "flat-tower1001")).toBe(false);
  });
});

