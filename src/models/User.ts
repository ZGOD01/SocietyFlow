import mongoose, { Schema, Document, Model } from "mongoose";

export type UserStatus = "ACTIVE" | "PENDING" | "SUSPENDED";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  phone?: string;
  status: UserStatus;
  onboardingStatus?: "PENDING_REGISTRATION_APPROVAL" | "DOCUMENT_ONBOARDING_REQUIRED" | "COMPLETED";
  isSuperAdmin?: boolean;
  isPartner?: boolean;
  avatarUrl?: string;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      minlength: 2,
      maxlength: 120,
    },
    email: {
      type: String,
      required: [true, "Email address is required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 8,
    },
    phone: {
      type: String,
      trim: true,
      default: undefined,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "PENDING", "SUSPENDED"],
      default: "ACTIVE",
      index: true,
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
    isSuperAdmin: {
      type: Boolean,
      default: false,
      index: true,
    },
    isPartner: {
      type: Boolean,
      default: false,
      index: true,
    },
    avatarUrl: {
      type: String,
      default: undefined,
    },
    lastLoginAt: {
      type: Date,
      default: undefined,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent mongoose re-compilation during Fast Refresh in Next.js
export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
