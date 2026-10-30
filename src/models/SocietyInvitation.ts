import mongoose, { Schema, Document, Model, Types } from "mongoose";
import { MembershipRole } from "./SocietyMembership";

export type InvitationStatus = "PENDING" | "ACCEPTED" | "EXPIRED" | "REVOKED";

export interface ISocietyInvitation extends Document {
  societyId: Types.ObjectId;
  email: string;
  role: MembershipRole;
  flatId?: Types.ObjectId;
  token: string;
  inviterId: Types.ObjectId;
  status: InvitationStatus;
  expiresAt: Date;
  acceptedAt?: Date;
  acceptedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SocietyInvitationSchema = new Schema<ISocietyInvitation>(
  {
    societyId: {
      type: Schema.Types.ObjectId,
      ref: "Society",
      required: true,
      index: true,
    },
    email: {
      type: String,
      required: [true, "Invitee email address is required"],
      lowercase: true,
      trim: true,
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
      ],
      required: true,
    },
    flatId: {
      type: Schema.Types.ObjectId,
      ref: "Flat",
      default: undefined,
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    inviterId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "ACCEPTED", "EXPIRED", "REVOKED"],
      default: "PENDING",
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    acceptedAt: {
      type: Date,
      default: undefined,
    },
    acceptedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: undefined,
    },
  },
  {
    timestamps: true,
  }
);

export const SocietyInvitation: Model<ISocietyInvitation> =
  mongoose.models.SocietyInvitation ||
  mongoose.model<ISocietyInvitation>("SocietyInvitation", SocietyInvitationSchema);

export default SocietyInvitation;
