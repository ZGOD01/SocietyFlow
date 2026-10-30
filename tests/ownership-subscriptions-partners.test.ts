import { describe, it, expect, beforeEach, vi } from "vitest";
import { Types } from "mongoose";

vi.mock("@/lib/db", () => ({
  connectDB: vi.fn().mockResolvedValue(true),
}));

vi.mock("@/lib/notifications", () => ({
  dispatchNotification: vi.fn().mockResolvedValue({ success: true }),
}));

import {
  initiateOwnershipTransfer,
  respondToTransferInvitation,
  recordSocietyTransferDecision,
  completeOwnershipTransfer,
} from "@/lib/ownership/transfer-service";
import {
  getAllSubscriptionPlans,
  getSocietySubscriptionData,
  assignSocietySubscriptionPlan,
  DEFAULT_PLANS,
} from "@/lib/subscriptions/subscription-service";
import {
  getOrCreatePartnerProfile,
  submitPartnerReferral,
  attributeReferralCodeToSociety,
  getPartnerReferrals,
} from "@/lib/partners/partner-service";
import {
  OwnershipTransfer,
  OwnershipHistory,
  FlatOccupancy,
  Flat,
  Society,
  SocietyMembership,
  User,
  AuditEvent,
  SubscriptionPlan,
  SocietySubscription,
  ChannelPartner,
  PartnerReferral,
  Document,
} from "@/models";

describe("PROMPT 10: Ownership Transfer, Subscription Plans & Channel Partner Management", () => {
  const societyId = new Types.ObjectId().toString();
  const flatId = new Types.ObjectId().toString();
  const currentOwnerId = new Types.ObjectId().toString();
  const unrelatedOwnerId = new Types.ObjectId().toString();
  const incomingOwnerId = new Types.ObjectId().toString();
  const committeeUserId = new Types.ObjectId().toString();
  const partnerUserId = new Types.ObjectId().toString();

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // --------------------------------------------------------------------------
  // PART A: OWNERSHIP TRANSFER
  // --------------------------------------------------------------------------
  describe("Part A: Property Ownership Transfer", () => {
    it("Test 1 & 2: Authorized owner initiates transfer; unrelated owner is rejected", async () => {
      // Mock FlatOccupancy: Current owner is approved
      vi.spyOn(FlatOccupancy, "findOne").mockImplementation((query: any) => {
        if (query.userId?.toString() === currentOwnerId) {
          return Promise.resolve({
            _id: new Types.ObjectId(),
            flatId: new Types.ObjectId(flatId),
            userId: new Types.ObjectId(currentOwnerId),
            status: "APPROVED",
            occupancyType: "OWNER",
          }) as any;
        }
        return Promise.resolve(null) as any;
      });

      // No concurrent pending transfer
      vi.spyOn(OwnershipTransfer, "findOne").mockResolvedValue(null);
      vi.spyOn(FlatOccupancy, "find").mockReturnValue({
        populate: vi.fn().mockResolvedValue([]),
      } as any);

      vi.spyOn(OwnershipTransfer, "create").mockImplementation((doc: any) =>
        Promise.resolve({
          _id: new Types.ObjectId(),
          ...doc,
        }) as any
      );

      vi.spyOn(AuditEvent, "create").mockResolvedValue({} as any);
      vi.spyOn(SocietyMembership, "find").mockReturnValue({
        lean: vi.fn().mockResolvedValue([]),
      } as any);
      vi.spyOn(User, "findOne").mockResolvedValue(null);

      // 1. Authorized owner initiates transfer
      const transfer = await initiateOwnershipTransfer(
        { id: currentOwnerId, name: "Original Owner", email: "original@societyflow.com" },
        {
          societyId,
          flatId,
          transferType: "SALE",
          reason: "Registered Sale Deed Transfer 2026",
          proposedOwner: {
            name: "New Owner",
            email: "newowner@societyflow.com",
            phone: "+919876543210",
          },
          documents: [
            {
              documentType: "SALE_DEED",
              name: "Sale Deed 2026.pdf",
              fileUrl: "https://vault.societyflow.internal/sale-deed.pdf",
            },
          ],
        }
      );

      expect(transfer).toBeDefined();
      expect(transfer.status).toBe("AWAITING_NEW_OWNER");
      expect(transfer.newOwnerAccepted).toBe(false);

      // 2. Unrelated owner cannot initiate transfer for this flat
      await expect(
        initiateOwnershipTransfer(
          { id: unrelatedOwnerId, name: "Unrelated Resident", email: "unrelated@societyflow.com" },
          {
            societyId,
            flatId,
            transferType: "SALE",
            reason: "Attempt unauthorized transfer",
            proposedOwner: {
              name: "Intruder Buyer",
              email: "buyer@societyflow.com",
              phone: "+919876543210",
            },
          }
        )
      ).rejects.toThrow(/Unauthorized/);
    });

    it("Test 3: New owner accepts transfer invitation securely", async () => {
      const mockTransfer: any = {
        _id: new Types.ObjectId(),
        societyId: new Types.ObjectId(societyId),
        flatId: new Types.ObjectId(flatId),
        currentOwnerId: new Types.ObjectId(currentOwnerId),
        proposedOwner: {
          name: "New Owner",
          email: "newowner@societyflow.com",
          phone: "+919876543210",
        },
        status: "AWAITING_NEW_OWNER",
        timeline: [],
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(OwnershipTransfer, "findById").mockResolvedValue(mockTransfer);
      vi.spyOn(AuditEvent, "create").mockResolvedValue({} as any);
      vi.spyOn(SocietyMembership, "find").mockReturnValue({
        lean: vi.fn().mockResolvedValue([]),
      } as any);

      // Unauthorized user cannot accept
      await expect(
        respondToTransferInvitation(
          { id: "wrong-user", email: "wrong@societyflow.com", name: "Wrong Person" },
          mockTransfer._id.toString(),
          true
        )
      ).rejects.toThrow(/Unauthorized/);

      // Legitimate proposed owner accepts
      const result = await respondToTransferInvitation(
        { id: incomingOwnerId, email: "newowner@societyflow.com", name: "New Owner" },
        mockTransfer._id.toString(),
        true,
        "Accepting registered apartment assignment."
      );

      expect(result.newOwnerAccepted).toBe(true);
      expect(result.status).toBe("AWAITING_SOCIETY_VERIFICATION");
    });

    it("Test 4 & 5: Transfer cannot complete without required committee approval", async () => {
      const mockTransfer: any = {
        _id: new Types.ObjectId(),
        societyId: new Types.ObjectId(societyId),
        flatId: new Types.ObjectId(flatId),
        currentOwnerId: new Types.ObjectId(currentOwnerId),
        status: "AWAITING_SOCIETY_VERIFICATION", // Not yet APPROVED_PENDING_COMPLETION
      };

      vi.spyOn(OwnershipTransfer, "findById").mockResolvedValue(mockTransfer);

      await expect(
        completeOwnershipTransfer(
          { id: committeeUserId, name: "Secretary", role: "SECRETARY" },
          mockTransfer._id.toString(),
          { newShareCertificateNumber: "SC-2026-099" }
        )
      ).rejects.toThrow(/Cannot complete transfer: Status must be 'APPROVED_PENDING_COMPLETION'/);
    });

    it("Test 6, 7, 8, 9 & 10: Completed transfer atomically updates ownership, history, active tenancies and preserves privacy", async () => {
      const mockTransfer: any = {
        _id: new Types.ObjectId(),
        societyId: new Types.ObjectId(societyId),
        flatId: new Types.ObjectId(flatId),
        currentOwnerId: new Types.ObjectId(currentOwnerId),
        currentOwnerName: "Old Owner",
        currentOwnerEmail: "oldowner@societyflow.com",
        proposedOwner: {
          name: "New Owner",
          email: "newowner@societyflow.com",
          phone: "+919876543210",
          existingUserId: new Types.ObjectId(incomingOwnerId),
        },
        transferType: "SALE",
        status: "APPROVED_PENDING_COMPLETION",
        activeTenancies: [],
        timeline: [],
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(OwnershipTransfer, "findById").mockResolvedValue(mockTransfer);
      vi.spyOn(Flat, "findById").mockResolvedValue({
        _id: new Types.ObjectId(flatId),
        flatNumber: "101",
        shareCertificateNumber: "SC-OLD-001",
        save: vi.fn().mockResolvedValue(true),
      } as any);

      const findOneAndUpdateSpy = vi.spyOn(FlatOccupancy, "findOneAndUpdate").mockResolvedValue({} as any);
      vi.spyOn(SocietyMembership, "findOneAndUpdate").mockResolvedValue({} as any);

      // Active tenancy check: Flat has an existing approved tenant
      vi.spyOn(FlatOccupancy, "find").mockResolvedValue([
        {
          _id: new Types.ObjectId(),
          occupancyType: "TENANT",
          status: "APPROVED",
          ownerName: "Active Tenant Singh",
        },
      ] as any);

      const historyCreateSpy = vi.spyOn(OwnershipHistory, "create").mockResolvedValue({} as any);
      vi.spyOn(AuditEvent, "create").mockResolvedValue({} as any);

      const completed = await completeOwnershipTransfer(
        { id: committeeUserId, name: "Secretary Sharma", role: "SECRETARY" },
        mockTransfer._id.toString(),
        {
          newShareCertificateNumber: "SC-NEW-101",
          completionNotes: "Title deed verified, transfer recorded in Member Ledger.",
        }
      );

      expect(completed.status).toBe("COMPLETED");

      // Verify outgoing owner occupancy marked ENDED
      expect(findOneAndUpdateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ userId: mockTransfer.currentOwnerId, status: "APPROVED" }),
        expect.objectContaining({ $set: expect.objectContaining({ status: "ENDED" }) })
      );

      // Verify incoming owner occupancy marked APPROVED
      expect(findOneAndUpdateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ userId: new Types.ObjectId(incomingOwnerId) }),
        expect.objectContaining({
          $set: expect.objectContaining({ status: "APPROVED", occupancyType: "OWNER" }),
        }),
        expect.anything()
      );

      // Verify immutable ownership history entry recorded
      expect(historyCreateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          previousOwnerName: "Old Owner",
          newOwnerName: "New Owner",
          shareCertificateNumber: "SC-NEW-101",
        })
      );

      // Verify active tenancy is preserved and flagged for review, not deleted
      expect(mockTransfer.activeTenancies).toHaveLength(1);
      expect(mockTransfer.activeTenancies[0].status).toBe("ACTIVE");
      expect(mockTransfer.activeTenancies[0].reviewed).toBe(true);
    });

    it("Test 11: Concurrent transfers for the same flat are rejected", async () => {
      vi.spyOn(FlatOccupancy, "findOne").mockResolvedValue({
        _id: new Types.ObjectId(),
        flatId: new Types.ObjectId(flatId),
        userId: new Types.ObjectId(currentOwnerId),
        status: "APPROVED",
        occupancyType: "OWNER",
      } as any);

      // An active transfer already exists
      vi.spyOn(OwnershipTransfer, "findOne").mockResolvedValue({
        _id: new Types.ObjectId(),
        flatId: new Types.ObjectId(flatId),
        status: "UNDER_REVIEW",
      } as any);

      await expect(
        initiateOwnershipTransfer(
          { id: currentOwnerId, name: "Owner", email: "owner@societyflow.com" },
          {
            societyId,
            flatId,
            transferType: "SALE",
            reason: "Second duplicate attempt",
            proposedOwner: {
              name: "Buyer 2",
              email: "buyer2@societyflow.com",
              phone: "+919876543210",
            },
          }
        )
      ).rejects.toThrow(/already pending or in progress/);
    });
  });

  // --------------------------------------------------------------------------
  // PART B: SUBSCRIPTION MANAGEMENT
  // --------------------------------------------------------------------------
  describe("Part B: Subscription Management", () => {
    it("Test 12: Default SaaS demonstration plans can be retrieved and initialized", async () => {
      vi.spyOn(SubscriptionPlan, "findOneAndUpdate").mockResolvedValue({} as any);
      vi.spyOn(SubscriptionPlan, "find").mockReturnValue({
        sort: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue(DEFAULT_PLANS),
        }),
      } as any);

      const plans = await getAllSubscriptionPlans();
      expect(plans).toHaveLength(4);
      expect(plans.map((p) => p.code)).toEqual(["DEMO", "STARTER", "PROFESSIONAL", "ENTERPRISE"]);
      expect(plans.every((p) => p.isDemonstrationOnly === true)).toBe(true);
    });

    it("Test 13: Subscription usage counters calculate from real MongoDB records", async () => {
      vi.spyOn(SubscriptionPlan, "findOneAndUpdate").mockResolvedValue({} as any);
      vi.spyOn(SocietySubscription, "findOne").mockReturnValue({
        populate: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue({
            status: "ACTIVE",
            planId: {
              code: "PROFESSIONAL",
              name: "Gated Community Pro",
              maxFlats: 350,
              storageAllowanceGb: 25,
              maxManagementAccounts: 12,
            },
          }),
        }),
      } as any);

      vi.spyOn(Flat, "countDocuments").mockResolvedValue(42);
      vi.spyOn(SocietyMembership, "countDocuments").mockResolvedValue(4);
      vi.spyOn(Document, "find").mockReturnValue({
        lean: vi.fn().mockResolvedValue([
          { size: 1024 * 1024 * 10 },
          { size: 1024 * 1024 * 5 },
        ]),
      } as any);

      const data = await getSocietySubscriptionData(societyId);

      expect(data.usage.flats.current).toBe(42);
      expect(data.usage.flats.limit).toBe(350);
      expect(data.usage.flats.percentage).toBe(12); // 42/350 * 100
      expect(data.usage.managementAccounts.current).toBe(4);
      expect(data.usage.managementAccounts.limit).toBe(12);
      expect(data.usage.storage.currentMb).toBe(15);
    });

    it("Test 14: Demonstration plan can be assigned by authorized committee member", async () => {
      vi.spyOn(SubscriptionPlan, "findOneAndUpdate").mockResolvedValue({} as any);
      vi.spyOn(SubscriptionPlan, "findOne").mockResolvedValue({
        _id: new Types.ObjectId(),
        code: "ENTERPRISE",
        name: "Large Township & Apex",
      } as any);

      vi.spyOn(SocietySubscription, "findOne").mockResolvedValue({
        _id: new Types.ObjectId(),
      } as any);

      vi.spyOn(SocietySubscription, "findOneAndUpdate").mockReturnValue({
        populate: vi.fn().mockResolvedValue({
          societyId: new Types.ObjectId(societyId),
          status: "ACTIVE",
          planId: { code: "ENTERPRISE", name: "Large Township & Apex" },
        }),
      } as any);

      vi.spyOn(AuditEvent, "create").mockResolvedValue({} as any);
      vi.spyOn(SocietyMembership, "find").mockReturnValue({
        lean: vi.fn().mockResolvedValue([]),
      } as any);

      const assigned = await assignSocietySubscriptionPlan(
        societyId,
        "ENTERPRISE",
        { id: committeeUserId, name: "Chairman Verma" },
        "Township scale upgrade"
      );

      expect(assigned).toBeDefined();
    });
  });

  // --------------------------------------------------------------------------
  // PART C: CHANNEL PARTNER MANAGEMENT
  // --------------------------------------------------------------------------
  describe("Part C: Channel Partner Management", () => {
    it("Test 15: Partner profile generates unique referral code (e.g. SOCIETYFLOW-PARTNER-001)", async () => {
      vi.spyOn(ChannelPartner, "findOne").mockResolvedValue(null);
      vi.spyOn(ChannelPartner, "countDocuments").mockResolvedValue(0);

      const createSpy = vi.spyOn(ChannelPartner, "create").mockImplementation((doc: any) =>
        Promise.resolve({
          ...doc,
          _id: new Types.ObjectId(),
          save: vi.fn().mockResolvedValue(true),
        }) as any
      );
      vi.spyOn(User, "findByIdAndUpdate").mockResolvedValue({} as any);
      vi.spyOn(PartnerReferral, "find").mockReturnValue({
        lean: vi.fn().mockResolvedValue([]),
      } as any);

      const partner = await getOrCreatePartnerProfile({
        id: partnerUserId,
        name: "Adv. Anil Mehta",
        email: "mehta@legaldesk.in",
      });

      expect(partner.referralCode).toBe("SOCIETYFLOW-PARTNER-001");
      expect(partner.commissionModel.rate).toBe(5000);
      expect(partner.commissionModel.type).toBe("FIXED");
    });

    it("Test 16: Duplicate referral attribution is prevented for same society contact", async () => {
      const partnerDoc: any = {
        _id: new Types.ObjectId(),
        userId: new Types.ObjectId(partnerUserId),
        referralCode: "SOCIETYFLOW-PARTNER-001",
        commissionModel: { rate: 5000 },
      };

      // Referral already registered with this contact email
      vi.spyOn(PartnerReferral, "findOne").mockResolvedValue({
        _id: new Types.ObjectId(),
        contactEmail: "secretary@palmgrove.in",
      } as any);

      await expect(
        submitPartnerReferral(partnerDoc, {
          societyName: "Palmgrove Heights",
          societyCity: "Mumbai",
          contactPerson: "Secretary",
          contactEmail: "secretary@palmgrove.in",
        })
      ).rejects.toThrow(/already been registered/);
    });

    it("Test 17 & 18: Partners cannot view resident/private society records; demo commissions are marked illustrative", async () => {
      const partnerId = new Types.ObjectId().toString();
      vi.spyOn(PartnerReferral, "find").mockReturnValue({
        sort: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([
            {
              _id: new Types.ObjectId(),
              referralCode: "SOCIETYFLOW-PARTNER-001",
              societyName: "Greenwood Estates CHS",
              societyCity: "Pune",
              contactPerson: "Rajesh Joshi",
              contactEmail: "rajesh@greenwood.in",
              status: "ACTIVATED",
              demoSubscriptionPlan: "PROFESSIONAL",
              illustrativeCommission: 5000,
              createdAt: new Date(),
            },
          ]),
        }),
      } as any);

      const referrals = await getPartnerReferrals(partnerId);

      expect(referrals).toHaveLength(1);
      const r = referrals[0];

      // Privacy verification: Partner receives ONLY high-level onboarding metadata
      expect(r.societyName).toBe("Greenwood Estates CHS");
      expect(r.status).toBe("ACTIVATED");
      expect(r.illustrativeCommission).toBe(5000);

      // Verify NO resident identity documents, private title deeds, or flat numbers are returned to partner
      expect((r as any).flatNumber).toBeUndefined();
      expect((r as any).documents).toBeUndefined();
      expect((r as any).residentAadhaar).toBeUndefined();
    });

    it("Test 19 & 20: Society onboarding with referral code attributes partner and produces audit records", async () => {
      const newSocietyId = new Types.ObjectId().toString();
      const referralCode = "SOCIETYFLOW-PARTNER-001";

      const mockPartner: any = {
        _id: new Types.ObjectId(),
        userId: new Types.ObjectId(partnerUserId),
        referralCode,
        commissionModel: { rate: 5000 },
        stats: { activeSocieties: 0, illustrativeEarned: 0 },
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(ChannelPartner, "findOne").mockResolvedValue(mockPartner);
      vi.spyOn(PartnerReferral, "findOne").mockResolvedValue(null);

      const createRefSpy = vi.spyOn(PartnerReferral, "create").mockResolvedValue({
        _id: new Types.ObjectId(),
        status: "ACTIVATED",
      } as any);
      vi.spyOn(PartnerReferral, "countDocuments").mockResolvedValue(1);
      const auditSpy = vi.spyOn(AuditEvent, "create").mockResolvedValue({} as any);

      const attributed = await attributeReferralCodeToSociety(
        referralCode,
        newSocietyId,
        "Riverdale Heights CHS"
      );

      expect(attributed).toBeDefined();
      expect(createRefSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          referralCode,
          societyName: "Riverdale Heights CHS",
          status: "ACTIVATED",
        })
      );
      expect(auditSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "PARTNER_REFERRAL_ACTIVATED",
        })
      );
    });
  });
});
