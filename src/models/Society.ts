import mongoose, { Schema, Document, Model } from "mongoose";

export type SocietyStatus = "ACTIVE" | "PENDING" | "INACTIVE";

export interface ISociety extends Document {
  name: string;
  code: string;
  registrationNumber: string;
  state: string;
  district?: string;
  city: string;
  pinCode: string;
  address?: string;
  contactEmail?: string;
  contactPhone?: string;
  resolutionNumber?: string;
  inviteToken?: string;
  totalBuildings?: number;
  totalFlats: number;
  totalWings: number;
  status: SocietyStatus;
  settings?: {
    requireCommitteeApproval?: boolean;
    allowDirectTenantInvites?: boolean;
    digitalSignaturesEnabled?: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const SocietySchema = new Schema<ISociety>(
  {
    name: {
      type: String,
      required: [true, "Society legal registered name is required"],
      trim: true,
      minlength: 3,
      maxlength: 150,
    },
    code: {
      type: String,
      required: [true, "Unique society code is required"],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    registrationNumber: {
      type: String,
      required: [true, "Statutory registration number is required (e.g. under MCS Act 1960)"],
      trim: true,
      index: true,
    },
    state: {
      type: String,
      required: true,
      default: "Maharashtra",
      trim: true,
    },
    district: {
      type: String,
      trim: true,
      default: "Pune",
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    pinCode: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    contactEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    contactPhone: {
      type: String,
      trim: true,
    },
    resolutionNumber: {
      type: String,
      trim: true,
    },
    inviteToken: {
      type: String,
      trim: true,
    },
    totalBuildings: {
      type: Number,
      default: 1,
      min: 1,
    },
    totalFlats: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalWings: {
      type: Number,
      default: 1,
      min: 0,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "PENDING", "INACTIVE"],
      default: "ACTIVE",
      index: true,
    },
    settings: {
      requireCommitteeApproval: {
        type: Boolean,
        default: true,
      },
      allowDirectTenantInvites: {
        type: Boolean,
        default: true,
      },
      digitalSignaturesEnabled: {
        type: Boolean,
        default: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

export const Society: Model<ISociety> =
  mongoose.models.Society || mongoose.model<ISociety>("Society", SocietySchema);

export default Society;
