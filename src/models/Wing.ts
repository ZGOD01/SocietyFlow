import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IWing extends Document {
  societyId: Types.ObjectId;
  buildingId?: Types.ObjectId;
  name: string;
  totalFloors?: number;
  flatsPerFloor?: number;
  totalFlats: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const WingSchema = new Schema<IWing>(
  {
    societyId: {
      type: Schema.Types.ObjectId,
      ref: "Society",
      required: true,
      index: true,
    },
    buildingId: {
      type: Schema.Types.ObjectId,
      ref: "Building",
      default: undefined,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Wing name or code is required (e.g. Wing A, Wing C)"],
      trim: true,
    },
    totalFloors: {
      type: Number,
      default: 1,
      min: 1,
    },
    flatsPerFloor: {
      type: Number,
      default: 4,
      min: 1,
    },
    totalFlats: {
      type: Number,
      default: 0,
      min: 0,
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

WingSchema.index({ societyId: 1, name: 1 }, { unique: true });

export const Wing: Model<IWing> =
  mongoose.models.Wing || mongoose.model<IWing>("Wing", WingSchema);

export default Wing;
