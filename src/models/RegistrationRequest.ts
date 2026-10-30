import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type RegistrationRole = "OWNER" | "TENANT" | "MANAGEMENT";

export type ApprovalDecision = "PENDING" | "APPROVED" | "REJECTED" | "MORE_INFO_REQUESTED" | "NOT_REQUIRED";

export type OverallRegistrationStatus =
  | "PENDING_APPROVAL"
  | "OWNER_APPROVED_SOCIETY_PENDING"
  | "SOCIETY_APPROVED_OWNER_PENDING"
  | "APPROVED"
  | "REJECTED"
  | "MORE_INFO_REQUESTED";

export type OnboardingStatus =
  | "PENDING_REGISTRATION_APPROVAL"
  | "DOCUMENT_ONBOARDING_REQUIRED"
  | "COMPLETED";

export interface ITimelineEvent {
  action:
    | "REGISTRATION_CREATED"
    | "OWNER_AUTHORIZED"
    | "SOCIETY_APPROVED"
    | "MORE_INFO_REQUESTED"
    | "REJECTED"
    | "MEMBERSHIP_ACTIVATED";
  actorId?: Types.ObjectId;
  actorRole?: string;
  actorName?: string;
  timestamp: Date;
  statusTransition: string;
  comment?: string;
}

export interface IRegistrationRequest extends Document {
  applicantId: Types.ObjectId;
  applicantName: string;
  applicantEmail: string;
  applicantPhone?: string;
  role: RegistrationRole;
  societyId: Types.ObjectId;
  wingId?: Types.ObjectId;
  wingName: string;
  flatId?: Types.ObjectId;
  flatNumber: string;
  ownershipType?: "SOLE_OWNER" | "JOINT_OWNER";
  leaseStartDate?: Date;
  leaseEndDate?: Date;
  ownerName?: string;
  ownerContact?: string;
  managementPosition?: string;
  resolutionNumber?: string;

  status: OverallRegistrationStatus;
  ownerApproval: {
    status: ApprovalDecision;
    decidedBy?: Types.ObjectId;
    decidedAt?: Date;
    comment?: string;
  };
  societyApproval: {
    status: ApprovalDecision;
    decidedBy?: Types.ObjectId;
    decidedAt?: Date;
    comment?: string;
  };
  onboardingStatus: OnboardingStatus;
  timeline: ITimelineEvent[];
  rejectionReason?: string;
  moreInfoNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TimelineEventSchema = new Schema<ITimelineEvent>(
  {
    action: {
      type: String,
      enum: [
        "REGISTRATION_CREATED",
        "OWNER_AUTHORIZED",
        "SOCIETY_APPROVED",
        "MORE_INFO_REQUESTED",
        "REJECTED",
        "MEMBERSHIP_ACTIVATED",
      ],
      required: true,
    },
    actorId: { type: Schema.Types.ObjectId, ref: "User" },
    actorRole: { type: String, trim: true },
    actorName: { type: String, trim: true },
    timestamp: { type: Date, default: Date.now },
    statusTransition: { type: String, required: true },
    comment: { type: String, trim: true },
  },
  { _id: false }
);

const RegistrationRequestSchema = new Schema<IRegistrationRequest>(
  {
    applicantId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    applicantName: {
      type: String,
      required: true,
      trim: true,
    },
    applicantEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    applicantPhone: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ["OWNER", "TENANT", "MANAGEMENT"],
      required: true,
      index: true,
    },
    societyId: {
      type: Schema.Types.ObjectId,
      ref: "Society",
      required: true,
      index: true,
    },
    wingId: {
      type: Schema.Types.ObjectId,
      ref: "Wing",
    },
    wingName: {
      type: String,
      required: true,
      trim: true,
    },
    flatId: {
      type: Schema.Types.ObjectId,
      ref: "Flat",
      index: true,
    },
    flatNumber: {
      type: String,
      required: true,
      trim: true,
    },
    ownershipType: {
      type: String,
      enum: ["SOLE_OWNER", "JOINT_OWNER"],
      default: "SOLE_OWNER",
    },
    leaseStartDate: { type: Date },
    leaseEndDate: { type: Date },
    ownerName: { type: String, trim: true },
    ownerContact: { type: String, trim: true },
    managementPosition: { type: String, trim: true },
    resolutionNumber: { type: String, trim: true },

    status: {
      type: String,
      enum: [
        "PENDING_APPROVAL",
        "OWNER_APPROVED_SOCIETY_PENDING",
        "SOCIETY_APPROVED_OWNER_PENDING",
        "APPROVED",
        "REJECTED",
        "MORE_INFO_REQUESTED",
      ],
      default: "PENDING_APPROVAL",
      index: true,
    },
    ownerApproval: {
      status: {
        type: String,
        enum: ["PENDING", "APPROVED", "REJECTED", "MORE_INFO_REQUESTED", "NOT_REQUIRED"],
        default: "NOT_REQUIRED",
      },
      decidedBy: { type: Schema.Types.ObjectId, ref: "User" },
      decidedAt: { type: Date },
      comment: { type: String, trim: true },
    },
    societyApproval: {
      status: {
        type: String,
        enum: ["PENDING", "APPROVED", "REJECTED", "MORE_INFO_REQUESTED", "NOT_REQUIRED"],
        default: "PENDING",
      },
      decidedBy: { type: Schema.Types.ObjectId, ref: "User" },
      decidedAt: { type: Date },
      comment: { type: String, trim: true },
    },
    onboardingStatus: {
      type: String,
      enum: [
        "PENDING_REGISTRATION_APPROVAL",
        "DOCUMENT_ONBOARDING_REQUIRED",
        "COMPLETED",
      ],
      default: "PENDING_REGISTRATION_APPROVAL",
      index: true,
    },
    timeline: [TimelineEventSchema],
    rejectionReason: { type: String, trim: true },
    moreInfoNote: { type: String, trim: true },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for fast lookups & anti-duplicate checks
RegistrationRequestSchema.index({ societyId: 1, status: 1 });
RegistrationRequestSchema.index({ applicantId: 1, societyId: 1, role: 1 });
RegistrationRequestSchema.index({ flatId: 1, status: 1 });

export const RegistrationRequest: Model<IRegistrationRequest> =
  mongoose.models.RegistrationRequest ||
  mongoose.model<IRegistrationRequest>("RegistrationRequest", RegistrationRequestSchema);

export default RegistrationRequest;
