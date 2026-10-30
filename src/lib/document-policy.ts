/**
 * Pure policy and validation engine for SocietyFlow Document Vault (Prompt 5).
 * Framework-independent and testable across node and browser runtimes.
 */

export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
] as const;

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB maximum per document

export const MANDATORY_OWNER_DOCS = [
  "SHARE_CERTIFICATE",
  "SALE_DEED",
  "POSSESSION_LETTER",
] as const;

export const MANDATORY_TENANT_DOCS = [
  "RENT_AGREEMENT",
  "ID_PROOF",
] as const;

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export function validateDocumentFile(
  mimeType: string,
  sizeBytes: number,
  originalFilename?: string
): FileValidationResult {
  if (sizeBytes <= 0) {
    return { valid: false, error: "File cannot be empty (0 bytes)." };
  }

  if (sizeBytes > MAX_FILE_SIZE_BYTES) {
    const sizeMb = (sizeBytes / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File size (${sizeMb} MB) exceeds maximum allowed 10 MB limit.`,
    };
  }

  const normalizedMime = mimeType.toLowerCase();
  const isAllowedMime = ALLOWED_MIME_TYPES.some(
    (allowed) =>
      normalizedMime === allowed ||
      (allowed === "image/jpg" && normalizedMime === "image/jpeg") ||
      (allowed === "image/jpeg" && normalizedMime === "image/jpg")
  );

  if (!isAllowedMime) {
    return {
      valid: false,
      error: `Unsupported file type (${mimeType}). Only PDF, JPG, and PNG files are accepted.`,
    };
  }

  if (originalFilename) {
    const ext = originalFilename.split(".").pop()?.toLowerCase();
    const allowedExtensions = ["pdf", "jpg", "jpeg", "png"];
    if (!ext || !allowedExtensions.includes(ext)) {
      return {
        valid: false,
        error: `File extension .${ext} is prohibited. Allowed extensions are .pdf, .jpg, and .png.`,
      };
    }
  }

  return { valid: true };
}

export interface OnboardingEvaluation {
  isComplete: boolean;
  uploadedCount: number;
  totalRequired: number;
  pendingTypes: string[];
  redirectUrl: string;
}

export function evaluateOwnerOnboarding(uploadedTypes: string[]): OnboardingEvaluation {
  const uploadedSet = new Set(uploadedTypes);
  const pending = MANDATORY_OWNER_DOCS.filter((docType) => !uploadedSet.has(docType));

  const isComplete = pending.length === 0;
  return {
    isComplete,
    uploadedCount: MANDATORY_OWNER_DOCS.length - pending.length,
    totalRequired: MANDATORY_OWNER_DOCS.length,
    pendingTypes: pending,
    redirectUrl: isComplete ? "/dashboard" : "/onboarding/owner-documents",
  };
}

export function evaluateTenantOnboarding(
  uploadedTypes: string[],
  policeVerificationMandatory: boolean = false
): OnboardingEvaluation {
  const required = policeVerificationMandatory
    ? [...MANDATORY_TENANT_DOCS, "POLICE_VERIFICATION"]
    : [...MANDATORY_TENANT_DOCS];

  const uploadedSet = new Set(uploadedTypes);
  const pending = required.filter((docType) => !uploadedSet.has(docType));

  const isComplete = pending.length === 0;
  return {
    isComplete,
    uploadedCount: required.length - pending.length,
    totalRequired: required.length,
    pendingTypes: pending,
    redirectUrl: isComplete ? "/dashboard" : "/onboarding/tenant-documents",
  };
}

export interface DocumentActor {
  userId: string;
  role: string;
  societyId: string;
  flatId?: string;
  isSuperAdmin?: boolean;
}

export interface DocumentRecordContext {
  id: string;
  ownerUserId: string;
  societyId: string;
  flatId?: string;
  scope: "PRIVATE" | "PROPERTY" | "SOCIETY" | "REQUEST";
  visibility?: "ALL_RESIDENTS" | "OWNERS_ONLY" | "TENANTS_ONLY" | "MANAGEMENT_ONLY";
  onboardingDocType?: string;
  isArchived?: boolean;
}

const COMMITTEE_ROLES = ["SECRETARY", "CHAIRMAN", "TREASURER", "SOCIETY_MANAGER", "COMMITTEE_MEMBER"];

export function canAccessDocument(
  actor: DocumentActor,
  doc: DocumentRecordContext
): { allowed: boolean; reason?: string } {
  if (actor.isSuperAdmin) {
    return { allowed: true };
  }

  // Cross-society boundary check
  if (actor.societyId !== doc.societyId) {
    return {
      allowed: false,
      reason: "Forbidden: Cross-society document access is strictly prohibited.",
    };
  }

  // 1. PRIVATE SCOPE: Personal Vault
  // Strictly isolated to the document owner. Management and other residents have NO access.
  if (doc.scope === "PRIVATE") {
    if (actor.userId === doc.ownerUserId) {
      return { allowed: true };
    }
    return {
      allowed: false,
      reason: "Forbidden: Personal vault documents are private and not accessible by management or other residents.",
    };
  }

  // 2. PROPERTY SCOPE: Flat-linked statutory titles
  // Accessible to:
  // - Document owner (the uploader)
  // - Authorized occupant of the same flat
  // - Authorized society management for official inspection
  if (doc.scope === "PROPERTY") {
    const isOwner = actor.userId === doc.ownerUserId;
    const isSameFlat = Boolean(actor.flatId && doc.flatId && actor.flatId === doc.flatId);
    const isManagement = COMMITTEE_ROLES.includes(actor.role);

    if (isOwner || isSameFlat || isManagement) {
      return { allowed: true };
    }

    return {
      allowed: false,
      reason: "Forbidden: Property documents are restricted to flat owners, occupants, and society management.",
    };
  }

  // 3. SOCIETY SCOPE: Official published library
  if (doc.scope === "SOCIETY") {
    const isManagement = COMMITTEE_ROLES.includes(actor.role);
    const isOwner = actor.role === "OWNER";
    const isTenant = actor.role === "TENANT";

    const visibility = doc.visibility || "ALL_RESIDENTS";

    if (visibility === "ALL_RESIDENTS") {
      return { allowed: true };
    }

    if (visibility === "MANAGEMENT_ONLY") {
      return isManagement
        ? { allowed: true }
        : { allowed: false, reason: "Forbidden: Document is restricted to Managing Committee." };
    }

    if (visibility === "OWNERS_ONLY") {
      return isOwner || isManagement
        ? { allowed: true }
        : { allowed: false, reason: "Forbidden: Document is restricted to Property Owners." };
    }

    if (visibility === "TENANTS_ONLY") {
      return isTenant || isManagement
        ? { allowed: true }
        : { allowed: false, reason: "Forbidden: Document is restricted to Tenants." };
    }
  }

  // Default fallback
  return { allowed: false, reason: "Forbidden: Unauthorized document access." };
}

export function canDeleteDocument(
  actor: DocumentActor,
  doc: DocumentRecordContext
): { allowed: boolean; reason?: string } {
  if (actor.isSuperAdmin) {
    return { allowed: true };
  }

  // Only the owner can initiate deletion
  if (actor.userId !== doc.ownerUserId) {
    return {
      allowed: false,
      reason: "Forbidden: Only the document owner can delete personal files.",
    };
  }

  // Statutory onboarding documents cannot be deleted; they must be replaced
  if (doc.onboardingDocType || doc.scope === "PROPERTY") {
    return {
      allowed: false,
      reason: "Forbidden: Statutory onboarding documents are preserved for audit and cannot be deleted. Please use file replacement.",
    };
  }

  if (doc.scope === "SOCIETY") {
    const isManagement = COMMITTEE_ROLES.includes(actor.role);
    if (!isManagement) {
      return {
        allowed: false,
        reason: "Forbidden: Only Managing Committee can remove published society documents.",
      };
    }
  }

  return { allowed: true };
}
