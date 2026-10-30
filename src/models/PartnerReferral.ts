import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type ReferralStatus =
  | "REFERRED"
  | "REGISTRATION_STARTED"
  | "PENDING_VERIFICATION"
  | "ACTIVATED"
  | "INACTIVE"
  | "REJECTED";

export interface IPartnerReferral extends Document {
  partnerId: Types.ObjectId;
  partnerUserId: Types.ObjectId;
  referralCode: string;
  societyName: string;
  societyCity: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone?: string;
  societyId?: Types.ObjectId;
  status: ReferralStatus;
  demoSubscriptionPlan?: string;
  illustrativeCommission: number;
  activatedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PartnerReferralSchema = new Schema<IPartnerReferral>(
  {
    partnerId: {
      type: Schema.Types.ObjectId,
      ref: "ChannelPartner",
      required: true,
      index: true,
    },
    partnerUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    referralCode: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    societyName: {
      type: String,
      required: true,
      trim: true,
    },
    societyCity: {
      type: String,
      required: true,
      trim: true,
    },
    contactPerson: {
      type: String,
      required: true,
      trim: true,
    },
    contactEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    contactPhone: {
      type: String,
      trim: true,
    },
    societyId: {
      type: Schema.Types.ObjectId,
      ref: "Society",
      default: undefined,
      index: true,
    },
    status: {
      type: String,
      enum: [
        "REFERRED",
        "REGISTRATION_STARTED",
        "PENDING_VERIFICATION",
        "ACTIVATED",
        "INACTIVE",
        "REJECTED",
      ],
      default: "REFERRED",
      index: true,
    },
    demoSubscriptionPlan: {
      type: String,
      default: "PROFESSIONAL",
    },
    illustrativeCommission: {
      type: Number,
      default: 5000, // Illustrative INR for demonstration
    },
    activatedAt: {
      type: Date,
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

// Indexes
PartnerReferralSchema.index({ partnerId: 1, status: 1 });
PartnerReferralSchema.index({ contactEmail: 1, referralCode: 1 });

export const PartnerReferral: Model<IPartnerReferral> =
  mongoose.models.PartnerReferral ||
  mongoose.model<IPartnerReferral>("PartnerReferral", PartnerReferralSchema);

export default PartnerReferral;
