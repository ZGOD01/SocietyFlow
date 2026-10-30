import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type MembershipRole =
  | "OWNER"
  | "TENANT"
  | "SECRETARY"
  | "CHAIRMAN"
  | "TREASURER"
  | "SOCIETY_MANAGER"
  | "PARTNER"
  | "SUPER_ADMIN";

export type MembershipStatus = "PENDING" | "VERIFIED" | "REJECTED" | "SUSPENDED";

export interface ISocietyMembership extends Document {
  userId: Types.ObjectId;
  societyId: Types.ObjectId;
  role: MembershipRole;
  status: MembershipStatus;
  resolutionNumber?: string;
  notes?: string;
  approvedBy?: Types.ObjectId;
  approvedAt?: Date;
  joinedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SocietyMembershipSchema = new Schema<ISocietyMembership>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    societyId: {
      type: Schema.Types.ObjectId,
      ref: "Society",
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: [
        "OWNER",
        "TENANT",
        "SECRETARY",
        "CHAIRMAN",
        "TREASURER",
        "SOCIETY_MANAGER",
        "PARTNER",
        "SUPER_ADMIN",
      ],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "VERIFIED", "REJECTED", "SUSPENDED"],
      default: "PENDING",
      index: true,
    },
    resolutionNumber: {
      type: String,
      trim: true,
      default: undefined,
    },
    notes: {
      type: String,
      trim: true,
      default: undefined,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: undefined,
    },
    approvedAt: {
      type: Date,
      default: undefined,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to support multiple societies and multi-role lookups
SocietyMembershipSchema.index({ userId: 1, societyId: 1, role: 1 }, { unique: true });
SocietyMembershipSchema.index({ societyId: 1, status: 1 });

export const SocietyMembership: Model<ISocietyMembership> =
  mongoose.models.SocietyMembership ||
  mongoose.model<ISocietyMembership>("SocietyMembership", SocietyMembershipSchema);

export default SocietyMembership;
