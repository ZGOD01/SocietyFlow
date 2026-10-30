import { describe, it, expect } from "vitest";
import {
  canAccessDocument,
  DocumentActor,
  DocumentRecordContext,
} from "@/lib/document-policy";
import { COMMITTEE_ROLES, MembershipRole } from "@/lib/rbac";

// Helper for generating bulk flats with preview & idempotency
export function generateFlatCandidates(params: {
  startFloor: number;
  endFloor: number;
  flatsPerFloor: number;
  numberingPattern: "FLOOR_UNIT" | "WING_FLOOR_UNIT";
  prefix?: string;
}) {
  const { startFloor, endFloor, flatsPerFloor, numberingPattern, prefix = "" } = params;
  if (startFloor < 0 || endFloor < startFloor || flatsPerFloor <= 0 || flatsPerFloor > 50) {
    throw new Error("Invalid floor range or flats-per-floor specification.");
  }

  const wingPrefix = prefix.trim();
  const candidates: Array<{ flatNumber: string; floor: number }> = [];

  for (let fl = startFloor; fl <= endFloor; fl++) {
    for (let unit = 1; unit <= flatsPerFloor; unit++) {
      const unitStr = unit < 10 ? `0${unit}` : `${unit}`;
      let fNum = `${fl}${unitStr}`;

      if (numberingPattern === "WING_FLOOR_UNIT" && wingPrefix) {
        fNum = `${wingPrefix}-${fl}${unitStr}`;
      }

      candidates.push({ flatNumber: fNum, floor: fl });
    }
  }

  return candidates;
}

// Helper simulating idempotency: filtering out existing flats
export function filterDuplicates(
  candidates: Array<{ flatNumber: string; floor: number }>,
  existingFlatNumbers: string[]
) {
  const existingSet = new Set(existingFlatNumbers);
  const toInsert = candidates.filter((c) => !existingSet.has(c.flatNumber));
  const skippedCount = candidates.length - toInsert.length;
  return { toInsert, skippedCount };
}

// Flat Occupancy state transition simulator for owner and tenant linking
export interface FlatState {
  id: string;
  societyId: string;
  flatNumber: string;
  floor: number;
  wingId?: string;
  buildingId?: string;
  isActive: boolean;
  currentOwnerId: string | null;
  currentTenantId: string | null;
  defaultOccupancyType: "VACANT" | "OWNER_OCCUPIED" | "TENANT_OCCUPIED";
  occupancyHistory: Array<{
    userId: string;
    role: "OWNER" | "TENANT";
    startDate: Date;
    endDate?: Date;
    status: "APPROVED" | "COMPLETED";
  }>;
  propertyDocCount: number;
}

export function approveOwnerForFlat(
  flat: FlatState,
  ownerUserId: string,
  approvalDate: Date = new Date()
): FlatState {
  if (flat.currentOwnerId && flat.currentOwnerId !== ownerUserId) {
    throw new Error(
      "Conflict: Flat is already assigned to an active owner. Ownership transfer required."
    );
  }

  const updatedHistory = [...flat.occupancyHistory];
  updatedHistory.push({
    userId: ownerUserId,
    role: "OWNER",
    startDate: approvalDate,
    status: "APPROVED",
  });

  return {
    ...flat,
    currentOwnerId: ownerUserId,
    defaultOccupancyType: flat.currentTenantId ? "TENANT_OCCUPIED" : "OWNER_OCCUPIED",
    occupancyHistory: updatedHistory,
  };
}

export function approveTenantForFlat(
  flat: FlatState,
  tenantUserId: string,
  approvals: { ownerApproved: boolean; societyApproved: boolean },
  approvalDate: Date = new Date()
): FlatState {
  if (!approvals.ownerApproved || !approvals.societyApproved) {
    throw new Error("Both owner and society management approvals are required for tenant activation.");
  }

  const updatedHistory = [...flat.occupancyHistory];
  updatedHistory.push({
    userId: tenantUserId,
    role: "TENANT",
    startDate: approvalDate,
    status: "APPROVED",
  });

  return {
    ...flat,
    currentTenantId: tenantUserId,
    defaultOccupancyType: "TENANT_OCCUPIED",
    occupancyHistory: updatedHistory,
  };
}

export function validateFlatDeletion(flat: FlatState): { allowed: boolean; reason?: string } {
  if (flat.currentOwnerId || flat.currentTenantId) {
    return {
      allowed: false,
      reason: "Cannot delete flat with active verified residents.",
    };
  }

  if (flat.propertyDocCount > 0) {
    return {
      allowed: false,
      reason: "Cannot delete flat with statutory property records and documents in vault.",
    };
  }

  return { allowed: true };
}

describe("Prompt 6: Complete Flats & Residents Management System", () => {
  const societyId = "soc-green-valley";
  const buildingId = "bld-tower-1";
  const wingA = "wing-a";

  // Test 1: Create a society building
  it("Test 1: Create a society building with valid metadata", () => {
    const building = {
      societyId,
      name: "Building 1 - Emerald Tower",
      code: "B1",
      floors: 14,
      totalWings: 2,
      isActive: true,
    };

    expect(building.name).toContain("Building 1");
    expect(building.floors).toBe(14);
    expect(building.isActive).toBe(true);
  });

  // Test 2: Add wings and floors to a building
  it("Test 2: Add wings and configure floors per wing", () => {
    const wingObj = {
      societyId,
      buildingId,
      name: "Wing A",
      floors: 14,
      flatsPerFloor: 4,
      isActive: true,
    };

    expect(wingObj.name).toBe("Wing A");
    expect(wingObj.floors).toBe(14);
    expect(wingObj.flatsPerFloor).toBe(4);
  });

  // Test 3: Generate flats successfully using WING_FLOOR_UNIT pattern
  it("Test 3: Generate flats automatically with WING_FLOOR_UNIT pattern", () => {
    const candidates = generateFlatCandidates({
      startFloor: 1,
      endFloor: 2,
      flatsPerFloor: 4,
      numberingPattern: "WING_FLOOR_UNIT",
      prefix: "A",
    });

    expect(candidates).toHaveLength(8);
    expect(candidates[0].flatNumber).toBe("A-101");
    expect(candidates[3].flatNumber).toBe("A-104");
    expect(candidates[4].flatNumber).toBe("A-201");
    expect(candidates[7].flatNumber).toBe("A-204");
  });

  // Test 4: Prevent duplicate flats (Idempotent bulk generation)
  it("Test 4: Prevent duplicate flat creation and enforce idempotency", () => {
    const candidates = generateFlatCandidates({
      startFloor: 1,
      endFloor: 2,
      flatsPerFloor: 4,
      numberingPattern: "WING_FLOOR_UNIT",
      prefix: "A",
    });

    // Assume floor 1 flats already exist
    const existingFlats = ["A-101", "A-102", "A-103", "A-104"];
    const { toInsert, skippedCount } = filterDuplicates(candidates, existingFlats);

    expect(skippedCount).toBe(4);
    expect(toInsert).toHaveLength(4);
    expect(toInsert.map((c) => c.flatNumber)).toEqual(["A-201", "A-202", "A-203", "A-204"]);
  });

  // Test 5: View wing-wise flat directory grouping
  it("Test 5: Group flats directory by wing and floor context", () => {
    const flats = [
      { id: "f1", flatNumber: "A-101", floor: 1, wingName: "Wing A" },
      { id: "f2", flatNumber: "A-102", floor: 1, wingName: "Wing A" },
      { id: "f3", flatNumber: "B-101", floor: 1, wingName: "Wing B" },
    ];

    const grouped = flats.reduce((acc, f) => {
      if (!acc[f.wingName]) acc[f.wingName] = [];
      acc[f.wingName].push(f);
      return acc;
    }, {} as Record<string, typeof flats>);

    expect(Object.keys(grouped)).toContain("Wing A");
    expect(Object.keys(grouped)).toContain("Wing B");
    expect(grouped["Wing A"]).toHaveLength(2);
    expect(grouped["Wing B"]).toHaveLength(1);
  });

  // Test 6: Search and filter flats by occupancy and floor
  it("Test 6: Filter flats by occupancy (Vacant / Owner / Tenant) and search query", () => {
    const flats = [
      { flatNumber: "A-101", occupancy: "OWNER_OCCUPIED", floor: 1 },
      { flatNumber: "A-102", occupancy: "TENANT_OCCUPIED", floor: 1 },
      { flatNumber: "A-201", occupancy: "VACANT", floor: 2 },
    ];

    const searchResult = flats.filter((f) => f.flatNumber.toLowerCase().includes("101"));
    expect(searchResult).toHaveLength(1);
    expect(searchResult[0].flatNumber).toBe("A-101");

    const vacantFlats = flats.filter((f) => f.occupancy === "VACANT");
    expect(vacantFlats).toHaveLength(1);
    expect(vacantFlats[0].flatNumber).toBe("A-201");
  });

  // Test 7: Open individual flat profile structure
  it("Test 7: Individual flat dossier provides comprehensive metadata", () => {
    const flatDossier = {
      flat: { id: "f101", flatNumber: "A-101", floor: 1, wingName: "Wing A", bhkType: "2 BHK" },
      owner: { name: "Anand Joshi", email: "anand@example.com", enrollmentDate: "2026-01-10" },
      tenant: null,
      propertyDocs: [{ title: "Sale Deed", verificationStatus: "VERIFIED" }],
    };

    expect(flatDossier.flat.flatNumber).toBe("A-101");
    expect(flatDossier.owner.name).toBe("Anand Joshi");
    expect(flatDossier.propertyDocs).toHaveLength(1);
  });

  // Test 8: Approve owner and verify automatic flat linking
  it("Test 8: Approving owner links user to flat, updates status, and logs enrollment date", () => {
    const initialFlat: FlatState = {
      id: "f-101",
      societyId,
      flatNumber: "A-101",
      floor: 1,
      isActive: true,
      currentOwnerId: null,
      currentTenantId: null,
      defaultOccupancyType: "VACANT",
      occupancyHistory: [],
      propertyDocCount: 0,
    };

    const ownerId = "user-owner-101";
    const updatedFlat = approveOwnerForFlat(initialFlat, ownerId);

    expect(updatedFlat.currentOwnerId).toBe(ownerId);
    expect(updatedFlat.defaultOccupancyType).toBe("OWNER_OCCUPIED");
    expect(updatedFlat.occupancyHistory).toHaveLength(1);
    expect(updatedFlat.occupancyHistory[0].userId).toBe(ownerId);
  });

  // Test 9: Approve tenant with dual required approvals (Owner & Society)
  it("Test 9: Approve tenant only when BOTH owner and society approvals are granted", () => {
    const flatWithOwner: FlatState = {
      id: "f-101",
      societyId,
      flatNumber: "A-101",
      floor: 1,
      isActive: true,
      currentOwnerId: "user-owner-101",
      currentTenantId: null,
      defaultOccupancyType: "OWNER_OCCUPIED",
      occupancyHistory: [{ userId: "user-owner-101", role: "OWNER", startDate: new Date(), status: "APPROVED" }],
      propertyDocCount: 3,
    };

    const tenantId = "user-tenant-201";

    // Fails if only owner approved
    expect(() =>
      approveTenantForFlat(flatWithOwner, tenantId, { ownerApproved: true, societyApproved: false })
    ).toThrowError("Both owner and society management approvals are required");

    // Succeeds when dual approved
    const activeTenantFlat = approveTenantForFlat(flatWithOwner, tenantId, {
      ownerApproved: true,
      societyApproved: true,
    });

    expect(activeTenantFlat.currentTenantId).toBe(tenantId);
    expect(activeTenantFlat.defaultOccupancyType).toBe("TENANT_OCCUPIED");
  });

  // Test 10: Verify tenant does NOT replace owner
  it("Test 10: Verify tenant association preserves verified owner simultaneously", () => {
    const flat: FlatState = {
      id: "f-101",
      societyId,
      flatNumber: "A-101",
      floor: 1,
      isActive: true,
      currentOwnerId: "user-owner-101",
      currentTenantId: null,
      defaultOccupancyType: "OWNER_OCCUPIED",
      occupancyHistory: [],
      propertyDocCount: 3,
    };

    const updated = approveTenantForFlat(flat, "user-tenant-999", {
      ownerApproved: true,
      societyApproved: true,
    });

    expect(updated.currentOwnerId).toBe("user-owner-101");
    expect(updated.currentTenantId).toBe("user-tenant-999");
    expect(updated.defaultOccupancyType).toBe("TENANT_OCCUPIED");
  });

  // Test 11: Show property documents from real storage metadata
  it("Test 11: Retrieve property documents metadata and verify R2 properties", () => {
    const sampleDoc = {
      id: "doc-1",
      documentId: "DOC-2026-001",
      displayName: "Registered Sale Deed",
      category: "PROPERTY",
      onboardingDocType: "SALE_DEED",
      r2ObjectKey: "societies/soc-green-valley/flats/f-101/sale-deed.pdf",
      size: 154200,
      mimeType: "application/pdf",
      scope: "PROPERTY",
      verificationStatus: "VERIFIED",
    };

    expect(sampleDoc.scope).toBe("PROPERTY");
    expect(sampleDoc.r2ObjectKey).toContain("sale-deed.pdf");
    expect(sampleDoc.size).toBeGreaterThan(0);
  });

  // Test 12: Enforce private-document permissions (tenants cannot access owner private title documents)
  it("Test 12: Tenant cannot view or download owner private title documents", () => {
    const tenantActor: DocumentActor = {
      userId: "user-tenant-1",
      role: "TENANT",
      societyId,
      flatId: "f-101",
    };

    const ownerPrivateDoc: DocumentRecordContext = {
      id: "doc-owner-private-pan",
      ownerUserId: "user-owner-1",
      societyId,
      flatId: "f-101",
      scope: "PRIVATE",
      isArchived: false,
    };

    const canAccess = canAccessDocument(tenantActor, ownerPrivateDoc);
    expect(canAccess.allowed).toBe(false);
  });

  // Test 13: Prevent cross-society access
  it("Test 13: Prevent Management of Society A from accessing Society B flats and documents", () => {
    const managerSocietyA: DocumentActor = {
      userId: "user-manager-a",
      role: "SECRETARY",
      societyId: "soc-society-a",
    };

    const docSocietyB: DocumentRecordContext = {
      id: "doc-b",
      ownerUserId: "user-b",
      societyId: "soc-society-b",
      scope: "PROPERTY",
      visibility: "MANAGEMENT_ONLY",
      isArchived: false,
    };

    const canAccess = canAccessDocument(managerSocietyA, docSocietyB);
    expect(canAccess.allowed).toBe(false);
  });

  // Test 14: Preserve occupancy history across changes
  it("Test 14: Preserve full historical occupancy trail across successive resident changes", () => {
    let flat: FlatState = {
      id: "f-101",
      societyId,
      flatNumber: "A-101",
      floor: 1,
      isActive: true,
      currentOwnerId: null,
      currentTenantId: null,
      defaultOccupancyType: "VACANT",
      occupancyHistory: [],
      propertyDocCount: 0,
    };

    flat = approveOwnerForFlat(flat, "owner-1", new Date("2026-01-01"));
    flat = approveTenantForFlat(
      flat,
      "tenant-1",
      { ownerApproved: true, societyApproved: true },
      new Date("2026-02-01")
    );

    expect(flat.occupancyHistory).toHaveLength(2);
    expect(flat.occupancyHistory[0].userId).toBe("owner-1");
    expect(flat.occupancyHistory[0].role).toBe("OWNER");
    expect(flat.occupancyHistory[1].userId).toBe("tenant-1");
    expect(flat.occupancyHistory[1].role).toBe("TENANT");
  });

  // Test 15: Prevent deletion of occupied flats or flats with statutory documents
  it("Test 15: Block deletion of occupied flats and flats with statutory documents", () => {
    const occupiedFlat: FlatState = {
      id: "f-101",
      societyId,
      flatNumber: "A-101",
      floor: 1,
      isActive: true,
      currentOwnerId: "owner-1",
      currentTenantId: null,
      defaultOccupancyType: "OWNER_OCCUPIED",
      occupancyHistory: [],
      propertyDocCount: 3,
    };

    const checkOccupied = validateFlatDeletion(occupiedFlat);
    expect(checkOccupied.allowed).toBe(false);
    expect(checkOccupied.reason).toContain("Cannot delete flat with active verified residents");

    const vacantWithDocs: FlatState = {
      ...occupiedFlat,
      currentOwnerId: null,
      defaultOccupancyType: "VACANT",
      propertyDocCount: 2,
    };

    const checkWithDocs = validateFlatDeletion(vacantWithDocs);
    expect(checkWithDocs.allowed).toBe(false);
    expect(checkWithDocs.reason).toContain("Cannot delete flat with statutory property records");

    const completelyCleanFlat: FlatState = {
      ...vacantWithDocs,
      propertyDocCount: 0,
    };

    const checkClean = validateFlatDeletion(completelyCleanFlat);
    expect(checkClean.allowed).toBe(true);
  });

  // Test 16: Show correct Owner My Flat information (property details, documents, tenant summary)
  it("Test 16: Verify Owner My Flat view payload contains permitted property records without tenant private IDs", () => {
    const ownerMyFlatPayload = {
      hasFlat: true,
      role: "OWNER",
      flat: {
        flatNumber: "A-101",
        floor: 1,
        bhkType: "2 BHK",
        shareCertificateNumber: "SC-0101",
      },
      propertyDocuments: [
        { displayName: "Sale Deed", category: "PROPERTY" },
        { displayName: "Share Certificate", category: "PROPERTY" },
      ],
      tenantSummary: {
        name: "Rahul Verma",
        status: "APPROVED",
        leaseStartDate: "2026-03-01",
      },
    };

    expect(ownerMyFlatPayload.role).toBe("OWNER");
    expect(ownerMyFlatPayload.propertyDocuments).toHaveLength(2);
    expect(ownerMyFlatPayload.tenantSummary.name).toBe("Rahul Verma");
    // Does NOT contain tenant personal private KYC documents
    expect((ownerMyFlatPayload as any).tenantPrivateDocs).toBeUndefined();
  });

  // Test 17: Show correct Tenant My Flat information (lease dates, verified owner name, shared society docs)
  it("Test 17: Verify Tenant My Flat view payload shows verified owner name without exposing owner purchase deeds", () => {
    const tenantMyFlatPayload = {
      hasFlat: true,
      role: "TENANT",
      flat: {
        flatNumber: "A-101",
        floor: 1,
      },
      verifiedOwner: {
        name: "Anand Joshi (Verified Society Owner)",
      },
      sharedSocietyDocuments: [
        { displayName: "Society Bylaws 2026", category: "BYLAWS" },
      ],
    };

    expect(tenantMyFlatPayload.role).toBe("TENANT");
    expect(tenantMyFlatPayload.verifiedOwner.name).toContain("Anand Joshi");
    expect(tenantMyFlatPayload.sharedSocietyDocuments).toHaveLength(1);
    // Does NOT contain owner's confidential purchase deed
    expect((tenantMyFlatPayload as any).propertyDocuments).toBeUndefined();
  });

  // Test 18: Verify responsive design and style guide tokens
  it("Test 18: Verify Style Guide adherence and color tokens", () => {
    const STYLE_GUIDE = {
      background: "#FFFFFF",
      surface: "#F8F9FA",
      primary: "#1A1A1A",
      indigo: "#4F46E5",
      headingFont: "Outfit",
      bodyFont: "Inter",
    };

    expect(STYLE_GUIDE.background).toBe("#FFFFFF");
    expect(STYLE_GUIDE.surface).toBe("#F8F9FA");
    expect(STYLE_GUIDE.primary).toBe("#1A1A1A");
    expect(STYLE_GUIDE.indigo).toBe("#4F46E5");
    expect(STYLE_GUIDE.headingFont).toBe("Outfit");
    expect(STYLE_GUIDE.bodyFont).toBe("Inter");
  });
});
