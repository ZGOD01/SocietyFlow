import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type DelegationStatus = "ACTIVE" | "REVOKED" | "EXPIRED";

export interface IApprovalDelegation extends Document {
  societyId: Types.ObjectId;
  delegatorUserId: Types.ObjectId;
  delegatorName: string;
  delegatorRole: string; // e.g. "CHAIRMAN", "SECRETARY", "TREASURER"
  delegateUserId: Types.ObjectId;
  delegateName: string;
  delegateRole: string; // existing role in society, e.g. "COMMITTEE_MEMBER", "VICE_CHAIRMAN"
  delegatedAuthorityRole: string; // the role granted, e.g. "CHAIRMAN"
  serviceCodes: string[]; // empty array means all services
  stageKeys: string[]; // empty array means all stages
  startDate: Date;
  endDate: Date;
  status: DelegationStatus;
  reason: string;
  revokedAt?: Date;
  revokedByUserId?: Types.ObjectId;
  revocationReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ApprovalDelegationSchema = new Schema<IApprovalDelegation>(
  {
    societyId: {
      type: Schema.Types.ObjectId,
      ref: "Society",
      required: true,
      index: true,
    },
    delegatorUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    delegatorName: {
      type: String,
      required: true,
    },
    delegatorRole: {
      type: String,
      required: true,
    },
    delegateUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    delegateName: {
      type: String,
      required: true,
    },
    delegateRole: {
      type: String,
      required: true,
    },
    delegatedAuthorityRole: {
      type: String,
      required: true,
    },
    serviceCodes: [{ type: String }],
    stageKeys: [{ type: String }],
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "REVOKED", "EXPIRED"],
      default: "ACTIVE",
      index: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    revokedAt: {
      type: Date,
    },
    revokedByUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    revocationReason: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

ApprovalDelegationSchema.index({ societyId: 1, delegateUserId: 1, status: 1 });
ApprovalDelegationSchema.index({ societyId: 1, delegatorUserId: 1, status: 1 });
ApprovalDelegationSchema.index({ endDate: 1, status: 1 });

export const ApprovalDelegation: Model<IApprovalDelegation> =
  mongoose.models.ApprovalDelegation ||
  mongoose.model<IApprovalDelegation>("ApprovalDelegation", ApprovalDelegationSchema);

export default ApprovalDelegation;
