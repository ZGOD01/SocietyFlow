import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type OccupancyType = "OWNER" | "TENANT";
export type OccupancyStatus = "PENDING" | "APPROVED" | "REJECTED" | "ENDED";
export type OwnershipType = "SOLE_OWNER" | "JOINT_OWNER";

export interface IFlatOccupancy extends Document {
  flatId: Types.ObjectId;
  userId: Types.ObjectId;
  societyId: Types.ObjectId;
  occupancyType: OccupancyType;
  status: OccupancyStatus;
  ownershipType: OwnershipType;
  leaseStartDate?: Date;
  leaseEndDate?: Date;
  ownerName?: string;
  ownerContact?: string;
  verifiedBy?: Types.ObjectId;
  verifiedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FlatOccupancySchema = new Schema<IFlatOccupancy>(
  {
    flatId: {
      type: Schema.Types.ObjectId,
      ref: "Flat",
      required: true,
      index: true,
    },
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
    occupancyType: {
      type: String,
      enum: ["OWNER", "TENANT"],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED", "ENDED"],
      default: "PENDING",
      index: true,
    },
    ownershipType: {
      type: String,
      enum: ["SOLE_OWNER", "JOINT_OWNER"],
      default: "SOLE_OWNER",
    },
    leaseStartDate: {
      type: Date,
      default: undefined,
    },
    leaseEndDate: {
      type: Date,
      default: undefined,
    },
    ownerName: {
      type: String,
      trim: true,
      default: undefined,
    },
    ownerContact: {
      type: String,
      trim: true,
      default: undefined,
    },
    verifiedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: undefined,
    },
    verifiedAt: {
      type: Date,
      default: undefined,
    },
    rejectionReason: {
      type: String,
      trim: true,
      default: undefined,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
FlatOccupancySchema.index({ flatId: 1, userId: 1 }, { unique: true });
FlatOccupancySchema.index({ societyId: 1, status: 1 });
FlatOccupancySchema.index({ userId: 1, status: 1 });

export const FlatOccupancy: Model<IFlatOccupancy> =
  mongoose.models.FlatOccupancy ||
  mongoose.model<IFlatOccupancy>("FlatOccupancy", FlatOccupancySchema);

export default FlatOccupancy;
