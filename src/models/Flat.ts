import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type DefaultOccupancyType = "OWNER_OCCUPIED" | "TENANT_OCCUPIED" | "VACANT";
export type FlatStatus = "ACTIVE" | "INACTIVE";

export interface IFlat extends Document {
  societyId: Types.ObjectId;
  wingId?: Types.ObjectId;
  buildingId?: Types.ObjectId;
  flatNumber: string;
  floor: number;
  bhkType?: string;
  carpetAreaSqFt?: number;
  defaultOccupancyType: DefaultOccupancyType;
  shareCertificateNumber?: string;
  currentOwnerId?: Types.ObjectId;
  currentTenantId?: Types.ObjectId;
  isActive: boolean;
  status: FlatStatus;
  deactivatedAt?: Date;
  deactivationReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FlatSchema = new Schema<IFlat>(
  {
    societyId: {
      type: Schema.Types.ObjectId,
      ref: "Society",
      required: true,
      index: true,
    },
    wingId: {
      type: Schema.Types.ObjectId,
      ref: "Wing",
      required: false,
      default: undefined,
      index: true,
    },
    buildingId: {
      type: Schema.Types.ObjectId,
      ref: "Building",
      required: false,
      default: undefined,
      index: true,
    },
    flatNumber: {
      type: String,
      required: [true, "Flat / Unit number is required"],
      trim: true,
    },
    floor: {
      type: Number,
      required: true,
      default: 1,
    },
    bhkType: {
      type: String,
      trim: true,
      default: undefined,
    },
    carpetAreaSqFt: {
      type: Number,
      default: undefined,
    },
    defaultOccupancyType: {
      type: String,
      enum: ["OWNER_OCCUPIED", "TENANT_OCCUPIED", "VACANT"],
      default: "VACANT",
      index: true,
    },
    shareCertificateNumber: {
      type: String,
      trim: true,
      default: undefined,
    },
    currentOwnerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: undefined,
      index: true,
    },
    currentTenantId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: undefined,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
      index: true,
    },
    deactivatedAt: {
      type: Date,
      default: undefined,
    },
    deactivationReason: {
      type: String,
      trim: true,
      default: undefined,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for high performance and duplicate prevention
FlatSchema.index({ societyId: 1, wingId: 1, flatNumber: 1 });
FlatSchema.index({ societyId: 1, buildingId: 1, flatNumber: 1 });
FlatSchema.index({ societyId: 1, floor: 1 });
FlatSchema.index({ societyId: 1, defaultOccupancyType: 1 });

export const Flat: Model<IFlat> =
  mongoose.models.Flat || mongoose.model<IFlat>("Flat", FlatSchema);

export default Flat;
