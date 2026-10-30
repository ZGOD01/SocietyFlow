import mongoose, { Schema, Document, Model } from "mongoose";

export type PlanCode = "DEMO" | "STARTER" | "PROFESSIONAL" | "ENTERPRISE";

export interface ISubscriptionPlan extends Document {
  code: PlanCode;
  name: string;
  tagline: string;
  priceMonthly: number; // In INR (illustrative)
  priceAnnual: number;  // In INR (illustrative)
  maxFlats: number;
  storageAllowanceGb: number;
  maxManagementAccounts: number;
  allowedWorkflowTypes: string[];
  notificationChannels: string[];
  reportingFeatures: string[];
  supportLevel: string;
  isPopular?: boolean;
  isDemonstrationOnly: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionPlanSchema = new Schema<ISubscriptionPlan>(
  {
    code: {
      type: String,
      enum: ["DEMO", "STARTER", "PROFESSIONAL", "ENTERPRISE"],
      required: true,
      unique: true,
      uppercase: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    tagline: {
      type: String,
      required: true,
      trim: true,
    },
    priceMonthly: {
      type: Number,
      required: true,
      default: 0,
    },
    priceAnnual: {
      type: Number,
      required: true,
      default: 0,
    },
    maxFlats: {
      type: Number,
      required: true,
      default: 50,
    },
    storageAllowanceGb: {
      type: Number,
      required: true,
      default: 2,
    },
    maxManagementAccounts: {
      type: Number,
      required: true,
      default: 3,
    },
    allowedWorkflowTypes: {
      type: [String],
      default: ["STANDARD_NOC", "MAINTENANCE"],
    },
    notificationChannels: {
      type: [String],
      default: ["IN_APP", "EMAIL"],
    },
    reportingFeatures: {
      type: [String],
      default: ["BASIC_REPORTS"],
    },
    supportLevel: {
      type: String,
      default: "STANDARD_EMAIL",
    },
    isPopular: {
      type: Boolean,
      default: false,
    },
    isDemonstrationOnly: {
      type: Boolean,
      default: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const SubscriptionPlan: Model<ISubscriptionPlan> =
  mongoose.models.SubscriptionPlan ||
  mongoose.model<ISubscriptionPlan>("SubscriptionPlan", SubscriptionPlanSchema);

export default SubscriptionPlan;
