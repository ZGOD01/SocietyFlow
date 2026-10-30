import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IOwnershipHistory extends Document {
  societyId: Types.ObjectId;
  flatId: Types.ObjectId;
  transferId?: Types.ObjectId;
  previousOwnerId: Types.ObjectId;
  previousOwnerName: string;
  previousOwnerEmail?: string;
  newOwnerId: Types.ObjectId;
  newOwnerName: string;
  newOwnerEmail?: string;
  transferType: string;
  effectiveDate: Date;
  completedAt: Date;
  completedBy: Types.ObjectId;
  shareCertificateNumber?: string;
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OwnershipHistorySchema = new Schema<IOwnershipHistory>(
  {
    societyId: {
      type: Schema.Types.ObjectId,
      ref: "Society",
      required: true,
      index: true,
    },
    flatId: {
      type: Schema.Types.ObjectId,
      ref: "Flat",
      required: true,
      index: true,
    },
    transferId: {
      type: Schema.Types.ObjectId,
      ref: "OwnershipTransfer",
      default: undefined,
      index: true,
    },
    previousOwnerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    previousOwnerName: {
      type: String,
      required: true,
      trim: true,
    },
    previousOwnerEmail: {
      type: String,
      trim: true,
    },
    newOwnerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    newOwnerName: {
      type: String,
      required: true,
      trim: true,
    },
    newOwnerEmail: {
      type: String,
      trim: true,
    },
    transferType: {
      type: String,
      required: true,
      default: "SALE",
    },
    effectiveDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    completedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    completedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    shareCertificateNumber: {
      type: String,
      trim: true,
    },
    remarks: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

OwnershipHistorySchema.index({ flatId: 1, completedAt: -1 });
OwnershipHistorySchema.index({ societyId: 1, completedAt: -1 });

export const OwnershipHistory: Model<IOwnershipHistory> =
  mongoose.models.OwnershipHistory ||
  mongoose.model<IOwnershipHistory>("OwnershipHistory", OwnershipHistorySchema);

export default OwnershipHistory;
