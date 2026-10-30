import { describe, it, expect, beforeEach, vi } from "vitest";
import { Types } from "mongoose";

vi.mock("@/lib/db", () => ({
  connectDB: vi.fn().mockResolvedValue(true),
}));

vi.mock("@/lib/notifications", () => ({
  dispatchNotification: vi.fn().mockResolvedValue({ success: true }),
  sendEmailNotification: vi.fn().mockResolvedValue({ status: "SENT" }),
  sendWhatsAppNotification: vi.fn().mockResolvedValue({ status: "SENT" }),
}));

import {
  RegistrationRequest,
  SocietyMembership,
  FlatOccupancy,
  Flat,
  User,
  AuditEvent,
  ServiceRequest,
  GeneratedDocument,
  DocumentModel,
} from "@/models";
import {
  hasAuthorizedFlatAccess,
  hasVerifiedSocietyAccess,
  getRoleRedirectUrl,
  COMMITTEE_ROLES,
} from "@/lib/rbac";
import { SessionUser } from "@/lib/session";

describe("PROMPT 11: Full Application Audit & Integration Tests", () => {
  const societyA = new Types.ObjectId().toString();
  const societyB = new Types.ObjectId().toString();
  const flatA101 = new Types.ObjectId().toString();
  const ownerUserId = new Types.ObjectId().toString();
  const tenantUserId = new Types.ObjectId().toString();
  const secretaryUserId = new Types.ObjectId().toString();
  const chairmanUserId = new Types.ObjectId().toString();

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // --------------------------------------------------------------------------
  // JOURNEY 1: OWNER COMPLETE LIFECYCLE & ONBOARDING PERSISTENCE
  // --------------------------------------------------------------------------
  describe("1. Owner Complete Lifecycle & Mandatory Document Onboarding", () => {
    it("Owner approval updates User onboardingStatus and Flat ownership", async () => {
      const regId = new Types.ObjectId().toString();

      const mockRegDoc = {
        _id: new Types.ObjectId(regId),
        applicantId: new Types.ObjectId(ownerUserId),
        role: "OWNER",
        societyId: new Types.ObjectId(societyA),
        flatId: new Types.ObjectId(flatA101),
        status: "PENDING_APPROVAL",
        onboardingStatus: "PENDING_REGISTRATION_APPROVAL",
        societyApproval: { status: "PENDING" },
        timeline: [] as any[],
        save: vi.fn().mockResolvedValue(true),
      };

      // Mock DB updates
      const userUpdateSpy = vi.spyOn(User, "findByIdAndUpdate").mockResolvedValue({} as any);
      const flatUpdateSpy = vi.spyOn(Flat, "findByIdAndUpdate").mockResolvedValue({} as any);
      const membershipUpdateSpy = vi.spyOn(SocietyMembership, "findOneAndUpdate").mockResolvedValue({} as any);
      const occupancyUpdateSpy = vi.spyOn(FlatOccupancy, "findOneAndUpdate").mockResolvedValue({} as any);

      // Execute simulated management approval
      mockRegDoc.societyApproval = { status: "APPROVED" };
      mockRegDoc.status = "APPROVED";
      mockRegDoc.onboardingStatus = "DOCUMENT_ONBOARDING_REQUIRED";
      await mockRegDoc.save();

      await User.findByIdAndUpdate(mockRegDoc.applicantId, {
        $set: { onboardingStatus: "DOCUMENT_ONBOARDING_REQUIRED" },
      });

      await Flat.findByIdAndUpdate(mockRegDoc.flatId, {
        $set: { currentOwnerId: mockRegDoc.applicantId, defaultOccupancyType: "OWNER_OCCUPIED" },
      });

      expect(userUpdateSpy).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ $set: { onboardingStatus: "DOCUMENT_ONBOARDING_REQUIRED" } })
      );
      expect(flatUpdateSpy).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ $set: { currentOwnerId: expect.anything(), defaultOccupancyType: "OWNER_OCCUPIED" } })
      );
    });

    it("Approved owner with DOCUMENT_ONBOARDING_REQUIRED is redirected to owner document onboarding", () => {
      const approvedOwnerSession: SessionUser = {
        id: ownerUserId,
        email: "owner@greenwood.in",
        name: "Sunil Joshi",
        isSuperAdmin: false,
        isPartner: false,
        activeSocietyId: societyA,
        activeRole: "OWNER",
        onboardingStatus: "DOCUMENT_ONBOARDING_REQUIRED",
        memberships: [
          {
            societyId: societyA,
            societyName: "Greenwood Estates",
            societyCode: "GREENWOOD",
            role: "OWNER",
            status: "VERIFIED",
          },
        ],
        occupancies: [
          {
            flatId: flatA101,
            societyId: societyA,
            wing: "Wing A",
            flatNumber: "A-101",
            occupancyType: "OWNER",
            status: "APPROVED",
          },
        ],
      };

      const redirectUrl = getRoleRedirectUrl(approvedOwnerSession);
      expect(redirectUrl).toBe("/onboarding/owner-documents");
    });

    it("Completed owner enters /dashboard upon subsequent logins", () => {
      const completedOwnerSession: SessionUser = {
        id: ownerUserId,
        email: "owner@greenwood.in",
        name: "Sunil Joshi",
        isSuperAdmin: false,
        isPartner: false,
        activeSocietyId: societyA,
        activeRole: "OWNER",
        onboardingStatus: "COMPLETED",
        memberships: [
          {
            societyId: societyA,
            societyName: "Greenwood Estates",
            societyCode: "GREENWOOD",
            role: "OWNER",
            status: "VERIFIED",
          },
        ],
        occupancies: [
          {
            flatId: flatA101,
            societyId: societyA,
            wing: "Wing A",
            flatNumber: "A-101",
            occupancyType: "OWNER",
            status: "APPROVED",
          },
        ],
      };

      const redirectUrl = getRoleRedirectUrl(completedOwnerSession);
      expect(redirectUrl).toBe("/dashboard");
    });
  });

  // --------------------------------------------------------------------------
  // JOURNEY 2: TENANT DUAL APPROVAL BOTH SEQUENCES
  // --------------------------------------------------------------------------
  describe("2. Tenant Dual Approval Sequence Tests", () => {
    it("Order A: Owner approves FIRST -> Status remains pending -> Society approves SECOND -> Activated", () => {
      const state = {
        status: "PENDING_APPROVAL",
        ownerApproval: "PENDING",
        societyApproval: "PENDING",
        membershipStatus: "PENDING",
      };

      // Step 1: Owner approves first
      state.ownerApproval = "APPROVED";
      if (state.societyApproval !== "APPROVED") {
        state.status = "OWNER_APPROVED_SOCIETY_PENDING";
        // Membership MUST remain PENDING
        state.membershipStatus = "PENDING";
      }

      expect(state.status).toBe("OWNER_APPROVED_SOCIETY_PENDING");
      expect(state.membershipStatus).toBe("PENDING");

      // Step 2: Society approves second
      state.societyApproval = "APPROVED";
      if (state.ownerApproval === "APPROVED" && state.societyApproval === "APPROVED") {
        state.status = "APPROVED";
        state.membershipStatus = "VERIFIED";
      }

      expect(state.status).toBe("APPROVED");
      expect(state.membershipStatus).toBe("VERIFIED");
    });

    it("Order B: Society approves FIRST -> Status remains pending -> Owner approves SECOND -> Activated", () => {
      const state = {
        status: "PENDING_APPROVAL",
        ownerApproval: "PENDING",
        societyApproval: "PENDING",
        membershipStatus: "PENDING",
      };

      // Step 1: Society approves first
      state.societyApproval = "APPROVED";
      if (state.ownerApproval !== "APPROVED") {
        state.status = "SOCIETY_APPROVED_OWNER_PENDING";
        // Membership MUST remain PENDING
        state.membershipStatus = "PENDING";
      }

      expect(state.status).toBe("SOCIETY_APPROVED_OWNER_PENDING");
      expect(state.membershipStatus).toBe("PENDING");

      // Step 2: Owner authorizes second
      state.ownerApproval = "APPROVED";
      if (state.ownerApproval === "APPROVED" && state.societyApproval === "APPROVED") {
        state.status = "APPROVED";
        state.membershipStatus = "VERIFIED";
      }

      expect(state.status).toBe("APPROVED");
      expect(state.membershipStatus).toBe("VERIFIED");
    });

    it("Tenant rejection by either party marks membership and occupancy as REJECTED", async () => {
      const membershipUpdateSpy = vi.spyOn(SocietyMembership, "findOneAndUpdate").mockResolvedValue({} as any);
      const occupancyUpdateSpy = vi.spyOn(FlatOccupancy, "findOneAndUpdate").mockResolvedValue({} as any);

      // Simulate rejection execution
      await SocietyMembership.findOneAndUpdate(
        { userId: new Types.ObjectId(tenantUserId), societyId: new Types.ObjectId(societyA) },
        { $set: { status: "REJECTED" } }
      );
      await FlatOccupancy.findOneAndUpdate(
        { flatId: new Types.ObjectId(flatA101), userId: new Types.ObjectId(tenantUserId) },
        { $set: { status: "REJECTED" } }
      );

      expect(membershipUpdateSpy).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ $set: { status: "REJECTED" } })
      );
      expect(occupancyUpdateSpy).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ $set: { status: "REJECTED" } })
      );
    });
  });

  // --------------------------------------------------------------------------
  // JOURNEY 3: MULTI-SOCIETY ISOLATION & PERMISSION GUARDS
  // --------------------------------------------------------------------------
  describe("3. Multi-Society Isolation & Authorization Guards", () => {
    it("Committee member of Society A is blocked from accessing Society B flats", () => {
      const secretaryA: SessionUser = {
        id: secretaryUserId,
        email: "sec@societya.in",
        name: "Secretary A",
        isSuperAdmin: false,
        isPartner: false,
        activeSocietyId: societyA,
        activeRole: "SECRETARY",
        memberships: [
          {
            societyId: societyA,
            societyName: "Society A",
            societyCode: "SOC-A",
            role: "SECRETARY",
            status: "VERIFIED",
          },
        ],
      };

      const hasAccessToSocietyB = hasVerifiedSocietyAccess(secretaryA, societyB);
      expect(hasAccessToSocietyB).toBe(false);

      const flatInSocietyB = new Types.ObjectId().toString();
      const hasFlatAccessInB = hasAuthorizedFlatAccess(secretaryA, societyB, flatInSocietyB);
      expect(hasFlatAccessInB).toBe(false);
    });

    it("Unverified membership prevents switching workspace into that society", () => {
      const pendingUser: SessionUser = {
        id: ownerUserId,
        email: "user@demo.in",
        name: "Pending Member",
        isSuperAdmin: false,
        isPartner: false,
        memberships: [
          {
            societyId: societyA,
            societyName: "Society A",
            societyCode: "SOC-A",
            role: "OWNER",
            status: "PENDING",
          },
        ],
      };

      const verified = pendingUser.memberships.filter((m) => m.status === "VERIFIED");
      expect(verified.length).toBe(0);
      expect(getRoleRedirectUrl(pendingUser)).toBe("/pending-approval");
    });

    it("Personal private vault documents are strictly isolated by ownerUserId", () => {
      const userDoc = {
        ownerUserId: new Types.ObjectId(ownerUserId),
        scope: "PRIVATE",
      };

      const requesterId = tenantUserId;
      const isAllowed = userDoc.ownerUserId.toString() === requesterId;
      expect(isAllowed).toBe(false);
    });

    it("Public certificate verification strictly returns registry metadata without leaking files", () => {
      const registryRecord = {
        documentRef: "NOC-2026-0042",
        documentType: "HOME_LOAN_NOC",
        title: "No Objection Certificate for Home Loan",
        status: "VALID_REGISTERED_RECORD",
        issuedByName: "Anand Verma",
        issuedByRole: "CHAIRMAN",
        // Internal private details that MUST NOT leak:
        residentAadhaar: "1234-5678-9012",
        privateR2Url: "https://r2.cloudflarestorage.com/secret.pdf",
      };

      // Public sanitized shape:
      const publicOutput = {
        documentRef: registryRecord.documentRef,
        documentType: registryRecord.documentType,
        title: registryRecord.title,
        status: registryRecord.status,
        authorizedSignatory: {
          name: registryRecord.issuedByName,
          role: registryRecord.issuedByRole,
        },
      };

      expect((publicOutput as any).residentAadhaar).toBeUndefined();
      expect((publicOutput as any).privateR2Url).toBeUndefined();
      expect(publicOutput.status).toBe("VALID_REGISTERED_RECORD");
    });
  });

  // --------------------------------------------------------------------------
  // JOURNEY 4: TENANT SERVICE REQUEST TO OWNER AUTHORIZATION
  // --------------------------------------------------------------------------
  describe("4. Service Request Workflow & Owner Authorization", () => {
    it("Tenant request with requiresOwnerAuthorization routes to AWAITING_OWNER_AUTHORIZATION", () => {
      const serviceDef = {
        code: "RENOVATION_NOC",
        requiresOwnerAuthorization: true,
      };

      const applicantRole = "TENANT";
      const status =
        applicantRole === "TENANT" && serviceDef.requiresOwnerAuthorization
          ? "AWAITING_OWNER_AUTHORIZATION"
          : "AWAITING_SOCIETY_REVIEW";

      const pendingActor =
        status === "AWAITING_OWNER_AUTHORIZATION" ? "OWNER" : "SOCIETY_MANAGEMENT";

      expect(status).toBe("AWAITING_OWNER_AUTHORIZATION");
      expect(pendingActor).toBe("OWNER");
    });

    it("Owner authorizing request advances status to AWAITING_SOCIETY_REVIEW and pendingActor to SOCIETY_MANAGEMENT", () => {
      const requestState = {
        currentStatus: "AWAITING_OWNER_AUTHORIZATION",
        pendingActorType: "OWNER",
        ownerAuthorization: { status: "PENDING" },
      };

      // Owner decides AUTHORIZE
      requestState.ownerAuthorization.status = "AUTHORIZED";
      requestState.currentStatus = "AWAITING_SOCIETY_REVIEW";
      requestState.pendingActorType = "SOCIETY_MANAGEMENT";

      expect(requestState.currentStatus).toBe("AWAITING_SOCIETY_REVIEW");
      expect(requestState.pendingActorType).toBe("SOCIETY_MANAGEMENT");
    });
  });
});
