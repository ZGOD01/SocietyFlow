import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type DocumentScope = "PRIVATE" | "PROPERTY" | "SOCIETY" | "REQUEST";
export type DocumentVerificationStatus = "PENDING" | "VERIFIED" | "CORRECTION_REQUESTED" | "REJECTED";
export type DocumentVisibility = "ALL_RESIDENTS" | "OWNERS_ONLY" | "TENANTS_ONLY" | "MANAGEMENT_ONLY" | "PRIVATE";
export type OnboardingDocType =
  | "SHARE_CERTIFICATE"
  | "SALE_DEED"
  | "POSSESSION_LETTER"
  | "LEAVE_LICENSE"
  | "IDENTITY_PROOF"
  | "POLICE_VERIFICATION";

export interface IDocument extends Document {
  documentId: string;
  societyId?: Types.ObjectId;
  flatId?: Types.ObjectId;
  ownerUserId: Types.ObjectId;
  scope: DocumentScope;
  category: string;
  originalFilename: string;
  displayName: string;
  mimeType: string;
  size: number;
  r2ObjectKey: string;
  r2Bucket: string;
  verificationStatus: DocumentVerificationStatus;
  version: number;
  visibility: DocumentVisibility;
  onboardingDocType?: OnboardingDocType;
  description?: string;
  tags: string[];
  quarantineStatus: "CLEAN" | "SCAN_PENDING" | "QUARANTINED";
  isArchived: boolean;
  correctionNote?: string;
  verifiedBy?: Types.ObjectId;
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DocumentSchema = new Schema<IDocument>(
  {
    documentId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    societyId: {
      type: Schema.Types.ObjectId,
      ref: "Society",
      default: undefined,
      index: true,
    },
    flatId: {
      type: Schema.Types.ObjectId,
      ref: "Flat",
      default: undefined,
      index: true,
    },
    ownerUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    scope: {
      type: String,
      enum: ["PRIVATE", "PROPERTY", "SOCIETY", "REQUEST"],
      required: true,
      default: "PRIVATE",
      index: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    originalFilename: {
      type: String,
      required: true,
      trim: true,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
    },
    mimeType: {
      type: String,
      required: true,
      trim: true,
    },
    size: {
      type: Number,
      required: true,
      min: 0,
    },
    r2ObjectKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    r2Bucket: {
      type: String,
      required: true,
      default: "societyflow-vault-docs",
    },
    verificationStatus: {
      type: String,
      enum: ["PENDING", "VERIFIED", "CORRECTION_REQUESTED", "REJECTED"],
      default: "PENDING",
      index: true,
    },
    version: {
      type: Number,
      default: 1,
      min: 1,
    },
    visibility: {
      type: String,
      enum: ["ALL_RESIDENTS", "OWNERS_ONLY", "TENANTS_ONLY", "MANAGEMENT_ONLY", "PRIVATE"],
      default: "PRIVATE",
      index: true,
    },
    onboardingDocType: {
      type: String,
      enum: [
        "SHARE_CERTIFICATE",
        "SALE_DEED",
        "POSSESSION_LETTER",
        "LEAVE_LICENSE",
        "IDENTITY_PROOF",
        "POLICE_VERIFICATION",
      ],
      default: undefined,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      default: undefined,
    },
    tags: {
      type: [String],
      default: [],
    },
    quarantineStatus: {
      type: String,
      enum: ["CLEAN", "SCAN_PENDING", "QUARANTINED"],
      default: "CLEAN",
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },
    correctionNote: {
      type: String,
      trim: true,
      default: undefined,
    },
    verifiedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: undefined,
    },
    verifiedAt: {
      type: Date,
      default: undefined,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for common queries
DocumentSchema.index({ ownerUserId: 1, scope: 1, isArchived: 1 });
DocumentSchema.index({ flatId: 1, scope: 1 });
DocumentSchema.index({ societyId: 1, scope: 1, visibility: 1 });
DocumentSchema.index({ ownerUserId: 1, onboardingDocType: 1 });

export const DocumentModel: Model<IDocument> =
  mongoose.models.Document || mongoose.model<IDocument>("Document", DocumentSchema);

export default DocumentModel;
