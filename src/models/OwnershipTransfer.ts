import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type OwnershipTransferType =
  | "SALE"
  | "GIFT"
  | "INHERITANCE"
  | "RELINQUISHMENT"
  | "OTHER";

export type OwnershipTransferStatus =
  | "DRAFT"
  | "AWAITING_NEW_OWNER"
  | "AWAITING_SOCIETY_VERIFICATION"
  | "UNDER_REVIEW"
  | "INFORMATION_REQUIRED"
  | "APPROVED_PENDING_COMPLETION"
  | "COMPLETED"
  | "REJECTED"
  | "CANCELLED";

export interface ITransferDocument {
  documentId?: Types.ObjectId;
  documentType: string;
  name: string;
  fileUrl: string;
  verified: boolean;
  verificationNote?: string;
  uploadedAt: Date;
}

export interface ITenancyReviewFlag {
  occupancyId: Types.ObjectId;
  tenantName: string;
  tenantEmail: string;
  leaseStartDate?: Date;
  leaseEndDate?: Date;
  status: string;
  reviewed: boolean;
  reviewNotes?: string;
}

export interface ITransferTimelineEvent {
  stage: string;
  status: string;
  performedBy?: Types.ObjectId;
  performerName?: string;
  performerRole?: string;
  comments?: string;
  timestamp: Date;
}

export interface IOwnershipTransfer extends Document {
  societyId: Types.ObjectId;
  flatId: Types.ObjectId;
  currentOwnerId: Types.ObjectId;
  currentOwnerName?: string;
  currentOwnerEmail?: string;
  proposedOwner: {
    name: string;
    email: string;
    phone: string;
    existingUserId?: Types.ObjectId;
  };
  transferType: OwnershipTransferType;
  reason: string;
  effectiveDate?: Date;
  status: OwnershipTransferStatus;
  
  // New Owner Acceptance
  newOwnerAccepted: boolean;
  newOwnerAcceptedAt?: Date;
  newOwnerComments?: string;
  invitationToken?: string;

  // Documents
  documents: ITransferDocument[];

  // Tenant Review
  activeTenancies: ITenancyReviewFlag[];

  // Society Verification & Decision
  societyDecision?: {
    decidedBy?: Types.ObjectId;
    decidedByName?: string;
    decidedByRole?: string;
    decidedAt?: Date;
    status?: "APPROVED" | "REJECTED" | "CORRECTION_REQUIRED";
    comments?: string;
  };

  // Completion
  completionDetails?: {
    completedBy?: Types.ObjectId;
    completedByName?: string;
    completedAt?: Date;
    shareCertificateTransferred?: boolean;
    newShareCertificateNumber?: string;
    completionNotes?: string;
  };

  timeline: ITransferTimelineEvent[];
  createdAt: Date;
  updatedAt: Date;
}

const TransferDocumentSchema = new Schema<ITransferDocument>(
  {
    documentId: { type: Schema.Types.ObjectId, ref: "Document", default: undefined },
    documentType: { type: String, required: true },
    name: { type: String, required: true },
    fileUrl: { type: String, required: true },
    verified: { type: Boolean, default: false },
    verificationNote: { type: String, default: undefined },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const TenancyReviewFlagSchema = new Schema<ITenancyReviewFlag>(
  {
    occupancyId: { type: Schema.Types.ObjectId, ref: "FlatOccupancy", required: true },
    tenantName: { type: String, required: true },
    tenantEmail: { type: String, required: true },
    leaseStartDate: { type: Date, default: undefined },
    leaseEndDate: { type: Date, default: undefined },
    status: { type: String, default: "ACTIVE" },
    reviewed: { type: Boolean, default: false },
    reviewNotes: { type: String, default: undefined },
  },
  { _id: true }
);

const TimelineEventSchema = new Schema<ITransferTimelineEvent>(
  {
    stage: { type: String, required: true },
    status: { type: String, required: true },
    performedBy: { type: Schema.Types.ObjectId, ref: "User", default: undefined },
    performerName: { type: String, default: undefined },
    performerRole: { type: String, default: undefined },
    comments: { type: String, default: undefined },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const OwnershipTransferSchema = new Schema<IOwnershipTransfer>(
  {
    societyId: {
      type: Schema.Types.ObjectId,
      ref: "Society",
      required: true,
      index: true,
    },
    flatId: {
      type: Schema.Types.ObjectId,
      ref: "Flat",
      required: true,
      index: true,
    },
    currentOwnerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    currentOwnerName: {
      type: String,
      default: undefined,
    },
    currentOwnerEmail: {
      type: String,
      default: undefined,
    },
    proposedOwner: {
      name: { type: String, required: true, trim: true },
      email: { type: String, required: true, lowercase: true, trim: true },
      phone: { type: String, required: true, trim: true },
      existingUserId: { type: Schema.Types.ObjectId, ref: "User", default: undefined },
    },
    transferType: {
      type: String,
      enum: ["SALE", "GIFT", "INHERITANCE", "RELINQUISHMENT", "OTHER"],
      default: "SALE",
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    effectiveDate: {
      type: Date,
      default: undefined,
    },
    status: {
      type: String,
      enum: [
        "DRAFT",
        "AWAITING_NEW_OWNER",
        "AWAITING_SOCIETY_VERIFICATION",
        "UNDER_REVIEW",
        "INFORMATION_REQUIRED",
        "APPROVED_PENDING_COMPLETION",
        "COMPLETED",
        "REJECTED",
        "CANCELLED",
      ],
      default: "AWAITING_NEW_OWNER",
      index: true,
    },
    newOwnerAccepted: {
      type: Boolean,
      default: false,
    },
    newOwnerAcceptedAt: {
      type: Date,
      default: undefined,
    },
    newOwnerComments: {
      type: String,
      default: undefined,
    },
    invitationToken: {
      type: String,
      default: undefined,
      index: true,
    },
    documents: [TransferDocumentSchema],
    activeTenancies: [TenancyReviewFlagSchema],
    societyDecision: {
      decidedBy: { type: Schema.Types.ObjectId, ref: "User" },
      decidedByName: { type: String },
      decidedByRole: { type: String },
      decidedAt: { type: Date },
      status: { type: String, enum: ["APPROVED", "REJECTED", "CORRECTION_REQUIRED"] },
      comments: { type: String },
    },
    completionDetails: {
      completedBy: { type: Schema.Types.ObjectId, ref: "User" },
      completedByName: { type: String },
      completedAt: { type: Date },
      shareCertificateTransferred: { type: Boolean, default: false },
      newShareCertificateNumber: { type: String },
      completionNotes: { type: String },
    },
    timeline: [TimelineEventSchema],
  },
  {
    timestamps: true,
  }
);

// High performance query indexes
OwnershipTransferSchema.index({ societyId: 1, status: 1 });
OwnershipTransferSchema.index({ flatId: 1, status: 1 });
OwnershipTransferSchema.index({ currentOwnerId: 1, status: 1 });
OwnershipTransferSchema.index({ "proposedOwner.email": 1, status: 1 });

export const OwnershipTransfer: Model<IOwnershipTransfer> =
  mongoose.models.OwnershipTransfer ||
  mongoose.model<IOwnershipTransfer>("OwnershipTransfer", OwnershipTransferSchema);

export default OwnershipTransfer;
