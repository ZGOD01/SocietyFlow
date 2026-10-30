import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type PartnerType =
  | "LEGAL_ADVISOR"
  | "CHARTERED_ACCOUNTANT"
  | "SOCIETY_MANAGER"
  | "BUILDER_ASSOCIATE"
  | "AFFILIATE";

export type PartnerStatus = "PENDING" | "ACTIVE" | "SUSPENDED";

export interface IChannelPartner extends Document {
  userId: Types.ObjectId;
  partnerName: string;
  partnerEmail: string;
  partnerPhone?: string;
  organizationName?: string;
  referralCode: string;
  partnerType: PartnerType;
  status: PartnerStatus;
  commissionModel: {
    type: "FIXED" | "PERCENTAGE" | "RECURRING";
    rate: number; // e.g. 10 (%) or 5000 (INR)
    description?: string;
  };
  stats: {
    totalReferrals: number;
    activeSocieties: number;
    pendingVerifications: number;
    illustrativeEarned: number;
  };
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ChannelPartnerSchema = new Schema<IChannelPartner>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    partnerName: {
      type: String,
      required: true,
      trim: true,
    },
    partnerEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    partnerPhone: {
      type: String,
      trim: true,
    },
    organizationName: {
      type: String,
      trim: true,
    },
    referralCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    partnerType: {
      type: String,
      enum: [
        "LEGAL_ADVISOR",
        "CHARTERED_ACCOUNTANT",
        "SOCIETY_MANAGER",
        "BUILDER_ASSOCIATE",
        "AFFILIATE",
      ],
      default: "CHARTERED_ACCOUNTANT",
    },
    status: {
      type: String,
      enum: ["PENDING", "ACTIVE", "SUSPENDED"],
      default: "ACTIVE",
      index: true,
    },
    commissionModel: {
      type: {
        type: String,
        enum: ["FIXED", "PERCENTAGE", "RECURRING"],
        default: "FIXED",
      },
      rate: {
        type: Number,
        default: 5000, // Illustrative INR per onboarded society
      },
      description: {
        type: String,
        default: "Illustrative demonstration incentive model (non-payable)",
      },
    },
    stats: {
      totalReferrals: { type: Number, default: 0 },
      activeSocieties: { type: Number, default: 0 },
      pendingVerifications: { type: Number, default: 0 },
      illustrativeEarned: { type: Number, default: 0 },
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

export const ChannelPartner: Model<IChannelPartner> =
  mongoose.models.ChannelPartner ||
  mongoose.model<IChannelPartner>("ChannelPartner", ChannelPartnerSchema);

export default ChannelPartner;
