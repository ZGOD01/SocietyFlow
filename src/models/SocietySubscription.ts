import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type SubscriptionStatus = "ACTIVE" | "TRIAL" | "EXPIRED" | "SUSPENDED";

export interface ISocietySubscription extends Document {
  societyId: Types.ObjectId;
  planId: Types.ObjectId;
  status: SubscriptionStatus;
  billingInterval: "MONTHLY" | "ANNUAL";
  startDate: Date;
  renewalDate: Date;
  assignedBy?: Types.ObjectId;
  assignedByName?: string;
  isDemo: boolean;
  customFlatLimit?: number;
  customStorageLimitGb?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SocietySubscriptionSchema = new Schema<ISocietySubscription>(
  {
    societyId: {
      type: Schema.Types.ObjectId,
      ref: "Society",
      required: true,
      unique: true,
      index: true,
    },
    planId: {
      type: Schema.Types.ObjectId,
      ref: "SubscriptionPlan",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "TRIAL", "EXPIRED", "SUSPENDED"],
      default: "ACTIVE",
      index: true,
    },
    billingInterval: {
      type: String,
      enum: ["MONTHLY", "ANNUAL"],
      default: "ANNUAL",
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    renewalDate: {
      type: Date,
      default: () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
    },
    assignedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: undefined,
    },
    assignedByName: {
      type: String,
      default: undefined,
    },
    isDemo: {
      type: Boolean,
      default: true,
    },
    customFlatLimit: {
      type: Number,
      default: undefined,
    },
    customStorageLimitGb: {
      type: Number,
      default: undefined,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export const SocietySubscription: Model<ISocietySubscription> =
  mongoose.models.SocietySubscription ||
  mongoose.model<ISocietySubscription>("SocietySubscription", SocietySubscriptionSchema);

export default SocietySubscription;
