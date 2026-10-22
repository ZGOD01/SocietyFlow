export type UserRole =
  | "SUPER_ADMIN"
  | "SOCIETY_ADMIN"
  | "RESIDENT_OWNER"
  | "TENANT"
  | "AUDITOR_PARTNER";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  societyId?: string;
  flatId?: string;
  avatarUrl?: string;
}

export interface SocietyTenant {
  id: string;
  name: string;
  registrationNumber: string;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
  };
  totalWings: number;
  totalFlats: number;
  activePlan: "BASIC" | "STANDARD" | "ENTERPRISE";
  createdAt: string;
}

export interface FlatRecord {
  id: string;
  societyId: string;
  wing: string;
  flatNumber: string;
  floor: number;
  carpetAreaSqFt: number;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  occupancyStatus: "SELF_OCCUPIED" | "RENTED" | "VACANT";
  shareCertificateNumber?: string;
  possessionDate: string;
}

export type DocumentCategory =
  | "BYLAWS"
  | "MEETING_MINUTES"
  | "AUDIT_FINANCIALS"
  | "AGREEMENT"
  | "SHARE_CERTIFICATE"
  | "NOC_CERTIFICATE"
  | "IDENTITY_VERIFICATION"
  | "UTILITY_SANCTION"
  | "MISCELLANEOUS";

export type DocumentStatus =
  | "VERIFIED"
  | "PENDING_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "ARCHIVED";

export interface DocumentRecord {
  id: string;
  societyId: string;
  flatId?: string;
  title: string;
  category: DocumentCategory;
  fileKey: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: {
    userId: string;
    userName: string;
    userRole: UserRole;
  };
  status: DocumentStatus;
  isSocietyPublic: boolean;
  version: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  verifiedAt?: string;
}

export type RequestType =
  | "NOC_TRANSFER"
  | "NOC_MORTGAGE"
  | "TENANT_VERIFICATION"
  | "RENOVATION_PERMISSION"
  | "PARKING_SLOT"
  | "ADDRESS_PROOF";

export type RequestStatus =
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "ADDITIONAL_INFO_REQUIRED"
  | "APPROVED"
  | "REJECTED";

export interface SocietyRequest {
  id: string;
  societyId: string;
  flatId: string;
  requestedBy: {
    userId: string;
    userName: string;
    flatNumber: string;
  };
  requestType: RequestType;
  title: string;
  description: string;
  status: RequestStatus;
  urgency: "LOW" | "NORMAL" | "HIGH";
  submittedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  decisionNotes?: string;
  requiredDocuments: string[];
  attachedDocumentIds: string[];
}

export interface NavItem {
  title: string;
  href: string;
  iconName: string;
  badge?: string;
  allowedRoles: UserRole[];
  description?: string;
}
