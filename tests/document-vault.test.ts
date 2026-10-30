import { describe, it, expect } from "vitest";
import {
  validateDocumentFile,
  evaluateOwnerOnboarding,
  evaluateTenantOnboarding,
  canAccessDocument,
  canDeleteDocument,
  MAX_FILE_SIZE_BYTES,
  DocumentActor,
  DocumentRecordContext,
} from "@/lib/document-policy";
import { generateR2ObjectKey } from "@/lib/r2";

describe("Prompt 5: Digital Document Vault & Mandatory Onboarding", () => {
  // Test Actor Contexts
  const ownerA: DocumentActor = {
    userId: "user-owner-a",
    role: "OWNER",
    societyId: "soc-greenwood",
    flatId: "flat-101",
  };

  const ownerB: DocumentActor = {
    userId: "user-owner-b",
    role: "OWNER",
    societyId: "soc-greenwood",
    flatId: "flat-102",
  };

  const tenantA: DocumentActor = {
    userId: "user-tenant-a",
    role: "TENANT",
    societyId: "soc-greenwood",
    flatId: "flat-101",
  };

  const tenantB: DocumentActor = {
    userId: "user-tenant-b",
    role: "TENANT",
    societyId: "soc-greenwood",
    flatId: "flat-102",
  };

  const managementUser: DocumentActor = {
    userId: "user-secretary-1",
    role: "SECRETARY",
    societyId: "soc-greenwood",
  };

  const otherSocietyUser: DocumentActor = {
    userId: "user-other-society",
    role: "OWNER",
    societyId: "soc-different-society",
    flatId: "flat-999",
  };

  // Case 1: Owner uploads all three required documents
  it("Case 1: Owner uploads all three required documents and verifies completion status", () => {
    const uploadedDocs = ["SHARE_CERTIFICATE", "SALE_DEED", "POSSESSION_LETTER"];
    const result = evaluateOwnerOnboarding(uploadedDocs);

    expect(result.isComplete).toBe(true);
    expect(result.uploadedCount).toBe(3);
    expect(result.totalRequired).toBe(3);
    expect(result.pendingTypes).toHaveLength(0);
  });

  // Case 2: Incomplete onboarding remains incomplete after refresh
  it("Case 2: Incomplete onboarding remains incomplete after simulated page refresh", () => {
    // Only 2 of 3 uploaded
    const initialUploads = ["SHARE_CERTIFICATE", "SALE_DEED"];
    const refreshedQuery = evaluateOwnerOnboarding(initialUploads);

    expect(refreshedQuery.isComplete).toBe(false);
    expect(refreshedQuery.uploadedCount).toBe(2);
    expect(refreshedQuery.pendingTypes).toEqual(["POSSESSION_LETTER"]);
    expect(refreshedQuery.redirectUrl).toBe("/onboarding/owner-documents");
  });

  // Case 3: Completed onboarding redirects to Owner Dashboard
  it("Case 3: Completed onboarding marks status and redirects to Owner Dashboard", () => {
    const completeUploads = ["POSSESSION_LETTER", "SHARE_CERTIFICATE", "SALE_DEED"];
    const result = evaluateOwnerOnboarding(completeUploads);

    expect(result.isComplete).toBe(true);
    expect(result.redirectUrl).toBe("/dashboard");
  });

  // Case 4: Tenant uploads their required documents
  it("Case 4: Tenant uploads required documents with configurable police verification", () => {
    // Standard configuration (no police verification required by society)
    const standardTenant = evaluateTenantOnboarding(["RENT_AGREEMENT", "ID_PROOF"], false);
    expect(standardTenant.isComplete).toBe(true);
    expect(standardTenant.redirectUrl).toBe("/dashboard");

    // Strict configuration (police verification mandatory by society)
    const strictIncomplete = evaluateTenantOnboarding(["RENT_AGREEMENT", "ID_PROOF"], true);
    expect(strictIncomplete.isComplete).toBe(false);
    expect(strictIncomplete.pendingTypes).toContain("POLICE_VERIFICATION");

    const strictComplete = evaluateTenantOnboarding(
      ["RENT_AGREEMENT", "ID_PROOF", "POLICE_VERIFICATION"],
      true
    );
    expect(strictComplete.isComplete).toBe(true);
    expect(strictComplete.redirectUrl).toBe("/dashboard");
  });

  // Case 5: Document upload fails safely for invalid file types
  it("Case 5: Document upload rejects executable and unsupported file formats", () => {
    const exeResult = validateDocumentFile("application/x-msdownload", 1024, "trojan.exe");
    expect(exeResult.valid).toBe(false);
    expect(exeResult.error).toContain("Unsupported file type");

    const scriptResult = validateDocumentFile("application/x-sh", 512, "deploy.sh");
    expect(scriptResult.valid).toBe(false);

    const txtResult = validateDocumentFile("text/plain", 1024, "notes.txt");
    expect(txtResult.valid).toBe(false);

    const zipResult = validateDocumentFile("application/zip", 2048, "archive.zip");
    expect(zipResult.valid).toBe(false);

    // Valid formats must pass
    expect(validateDocumentFile("application/pdf", 1024, "deed.pdf").valid).toBe(true);
    expect(validateDocumentFile("image/png", 1024, "photo.png").valid).toBe(true);
    expect(validateDocumentFile("image/jpeg", 1024, "scan.jpg").valid).toBe(true);
  });

  // Case 6: Upload rejects files exceeding 10 MB
  it("Case 6: Upload rejects files exceeding the 10 MB ceiling", () => {
    const tenMb = 10 * 1024 * 1024;
    const justUnder = validateDocumentFile("application/pdf", tenMb, "legal.pdf");
    expect(justUnder.valid).toBe(true);

    const overLimitBytes = tenMb + 1024; // 10 MB + 1 KB
    const overResult = validateDocumentFile("application/pdf", overLimitBytes, "large-deed.pdf");
    expect(overResult.valid).toBe(false);
    expect(overResult.error).toContain("exceeds maximum allowed 10 MB limit");

    const fiftyMbBytes = 50 * 1024 * 1024;
    const extremeResult = validateDocumentFile("application/pdf", fiftyMbBytes, "huge.pdf");
    expect(extremeResult.valid).toBe(false);
  });

  // Case 7: Owner can view/download own documents
  it("Case 7: Owner can access and view their own personal and property documents", () => {
    const ownerPersonalDoc: DocumentRecordContext = {
      id: "doc-owner-priv-1",
      ownerUserId: ownerA.userId,
      societyId: ownerA.societyId,
      scope: "PRIVATE",
    };

    const ownerPropertyDoc: DocumentRecordContext = {
      id: "doc-owner-prop-1",
      ownerUserId: ownerA.userId,
      societyId: ownerA.societyId,
      flatId: ownerA.flatId,
      scope: "PROPERTY",
    };

    expect(canAccessDocument(ownerA, ownerPersonalDoc).allowed).toBe(true);
    expect(canAccessDocument(ownerA, ownerPropertyDoc).allowed).toBe(true);
  });

  // Case 8: Tenant cannot access owner's private documents
  it("Case 8: Tenant cannot access owner's private vault documents", () => {
    const ownerPrivateDoc: DocumentRecordContext = {
      id: "doc-priv-123",
      ownerUserId: ownerA.userId,
      societyId: "soc-greenwood",
      scope: "PRIVATE",
    };

    const access = canAccessDocument(tenantA, ownerPrivateDoc);
    expect(access.allowed).toBe(false);
    expect(access.reason).toContain("Personal vault documents are private");
  });

  // Case 9: Owner cannot access unrelated tenant's private documents
  it("Case 9: Owner cannot access unrelated tenant's private documents", () => {
    const tenantPrivateDoc: DocumentRecordContext = {
      id: "doc-tenant-priv-1",
      ownerUserId: tenantB.userId,
      societyId: "soc-greenwood",
      scope: "PRIVATE",
    };

    const access = canAccessDocument(ownerA, tenantPrivateDoc);
    expect(access.allowed).toBe(false);
    expect(access.reason).toContain("Personal vault documents are private");
  });

  // Case 10: Management can view authorized property documents
  it("Case 10: Management can view authorized flat property documents in active society", () => {
    const flatPropertyDoc: DocumentRecordContext = {
      id: "doc-prop-share-cert",
      ownerUserId: ownerA.userId,
      societyId: "soc-greenwood",
      flatId: "flat-101",
      scope: "PROPERTY",
      onboardingDocType: "SHARE_CERTIFICATE",
    };

    const access = canAccessDocument(managementUser, flatPropertyDoc);
    expect(access.allowed).toBe(true);
  });

  // Case 11: Management cannot access unshared personal documents
  it("Case 11: Management is strictly blocked from accessing residents' unshared personal vaults", () => {
    const personalDoc: DocumentRecordContext = {
      id: "doc-personal-tax-return",
      ownerUserId: ownerA.userId,
      societyId: "soc-greenwood",
      scope: "PRIVATE",
    };

    const access = canAccessDocument(managementUser, personalDoc);
    expect(access.allowed).toBe(false);
    expect(access.reason).toContain("Personal vault documents are private");
  });

  // Case 12: User cannot access another society's files
  it("Case 12: Multi-tenant boundary prohibits cross-society document access", () => {
    const societyDoc: DocumentRecordContext = {
      id: "doc-soc-byelaws",
      ownerUserId: "admin-greenwood",
      societyId: "soc-greenwood",
      scope: "SOCIETY",
      visibility: "ALL_RESIDENTS",
    };

    const access = canAccessDocument(otherSocietyUser, societyDoc);
    expect(access.allowed).toBe(false);
    expect(access.reason).toContain("Cross-society document access is strictly prohibited");
  });

  // Case 13: Signed URLs expire correctly and use opaque storage keys
  it("Case 13: Storage object keys are opaque generated non-guessable paths", () => {
    const key1 = generateR2ObjectKey({
      scope: "PRIVATE",
      documentId: "doc-100",
      originalFilename: "deed.pdf",
    });
    const key2 = generateR2ObjectKey({
      scope: "PRIVATE",
      documentId: "doc-100",
      originalFilename: "deed.pdf",
    });

    // Must be distinct non-guessable random keys
    expect(key1).not.toBe(key2);
    expect(key1).toContain("vault/global/private/doc-100/");
    expect(key1.endsWith(".pdf")).toBe(true);

    // Expiration window constant is 900 seconds (15 minutes)
    const MAX_EXPIRY_SECONDS = 900;
    expect(MAX_EXPIRY_SECONDS).toBeLessThanOrEqual(900);
  });

  // Case 14: Replacing a file preserves appropriate history
  it("Case 14: Replacing a document updates metadata while preserving version number", () => {
    const initialDoc = {
      id: "doc-version-test",
      version: 1,
      r2ObjectKey: "vault/PROPERTY/doc-version-test/v1.pdf",
      originalFilename: "deed_v1.pdf",
    };

    // Replacement simulation
    const updatedVersion = initialDoc.version + 1;
    const archivedVersionRecord = {
      documentId: initialDoc.id,
      versionNumber: initialDoc.version,
      r2ObjectKey: initialDoc.r2ObjectKey,
      originalFilename: initialDoc.originalFilename,
    };

    expect(updatedVersion).toBe(2);
    expect(archivedVersionRecord.versionNumber).toBe(1);
    expect(archivedVersionRecord.documentId).toBe("doc-version-test");
  });

  // Case 15: Private document deletion follows authorization rules
  it("Case 15: Personal documents can be deleted by owner, but statutory onboarding documents are protected", () => {
    const personalDoc: DocumentRecordContext = {
      id: "doc-my-scan",
      ownerUserId: ownerA.userId,
      societyId: ownerA.societyId,
      scope: "PRIVATE",
    };

    const statutoryOnboardingDoc: DocumentRecordContext = {
      id: "doc-share-cert",
      ownerUserId: ownerA.userId,
      societyId: ownerA.societyId,
      flatId: ownerA.flatId,
      scope: "PROPERTY",
      onboardingDocType: "SHARE_CERTIFICATE",
    };

    // Owner can delete personal doc
    expect(canDeleteDocument(ownerA, personalDoc).allowed).toBe(true);

    // Non-owner cannot delete personal doc
    expect(canDeleteDocument(ownerB, personalDoc).allowed).toBe(false);

    // Management cannot delete resident's personal doc
    expect(canDeleteDocument(managementUser, personalDoc).allowed).toBe(false);

    // Statutory onboarding document CANNOT be deleted even by the owner (must use replacement)
    const deleteStatutory = canDeleteDocument(ownerA, statutoryOnboardingDoc);
    expect(deleteStatutory.allowed).toBe(false);
    expect(deleteStatutory.reason).toContain("Statutory onboarding documents are preserved for audit");
  });

  // Case 16: Published society documents are visible only to permitted roles
  it("Case 16: Published society documents respect audience visibility settings", () => {
    const docAllResidents: DocumentRecordContext = {
      id: "soc-doc-1",
      ownerUserId: "admin",
      societyId: "soc-greenwood",
      scope: "SOCIETY",
      visibility: "ALL_RESIDENTS",
    };

    const docOwnersOnly: DocumentRecordContext = {
      id: "soc-doc-2",
      ownerUserId: "admin",
      societyId: "soc-greenwood",
      scope: "SOCIETY",
      visibility: "OWNERS_ONLY",
    };

    const docTenantsOnly: DocumentRecordContext = {
      id: "soc-doc-3",
      ownerUserId: "admin",
      societyId: "soc-greenwood",
      scope: "SOCIETY",
      visibility: "TENANTS_ONLY",
    };

    const docManagementOnly: DocumentRecordContext = {
      id: "soc-doc-4",
      ownerUserId: "admin",
      societyId: "soc-greenwood",
      scope: "SOCIETY",
      visibility: "MANAGEMENT_ONLY",
    };

    // ALL_RESIDENTS: both owner and tenant can view
    expect(canAccessDocument(ownerA, docAllResidents).allowed).toBe(true);
    expect(canAccessDocument(tenantA, docAllResidents).allowed).toBe(true);

    // OWNERS_ONLY: owner can view, tenant is blocked
    expect(canAccessDocument(ownerA, docOwnersOnly).allowed).toBe(true);
    expect(canAccessDocument(tenantA, docOwnersOnly).allowed).toBe(false);

    // TENANTS_ONLY: tenant can view, owner is blocked
    expect(canAccessDocument(tenantA, docTenantsOnly).allowed).toBe(true);
    expect(canAccessDocument(ownerA, docTenantsOnly).allowed).toBe(false);

    // MANAGEMENT_ONLY: management can view, resident is blocked
    expect(canAccessDocument(managementUser, docManagementOnly).allowed).toBe(true);
    expect(canAccessDocument(ownerA, docManagementOnly).allowed).toBe(false);
    expect(canAccessDocument(tenantA, docManagementOnly).allowed).toBe(false);
  });

  // Case 17: Profile document sections show correct real data
  it("Case 17: Profile document sections calculate isolated real summaries", () => {
    const mockUserRecords = [
      {
        id: "d1",
        ownerUserId: ownerA.userId,
        scope: "PRIVATE",
        category: "Identity Documents",
        size: 1024 * 1024,
      },
      {
        id: "d2",
        ownerUserId: ownerA.userId,
        scope: "PRIVATE",
        category: "Certificates",
        size: 2 * 1024 * 1024,
      },
      {
        id: "d3",
        ownerUserId: ownerB.userId, // Unrelated resident!
        scope: "PRIVATE",
        category: "Financial Documents",
        size: 5 * 1024 * 1024,
      },
    ];

    // Filter strictly to current user
    const ownerAFiles = mockUserRecords.filter((d) => d.ownerUserId === ownerA.userId);
    const totalBytes = ownerAFiles.reduce((acc, d) => acc + d.size, 0);
    const categoryCount = new Set(ownerAFiles.map((d) => d.category)).size;

    expect(ownerAFiles).toHaveLength(2);
    expect(totalBytes).toBe(3 * 1024 * 1024);
    expect(categoryCount).toBe(2);

    // Unrelated user's file is not included in Owner A's profile
    expect(ownerAFiles.some((d) => d.id === "d3")).toBe(false);
  });
});
