import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IBuilding extends Document {
  societyId: Types.ObjectId;
  name: string;
  totalFloors: number;
  totalWings?: number;
  totalFlats?: number;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BuildingSchema = new Schema<IBuilding>(
  {
    societyId: {
      type: Schema.Types.ObjectId,
      ref: "Society",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Building / Tower name is required"],
      trim: true,
    },
    totalFloors: {
      type: Number,
      default: 1,
      min: 1,
    },
    totalWings: {
      type: Number,
      default: 1,
      min: 0,
    },
    totalFlats: {
      type: Number,
      default: 0,
      min: 0,
    },
    description: {
      type: String,
      trim: true,
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

BuildingSchema.index({ societyId: 1, name: 1 }, { unique: true });

export const Building: Model<IBuilding> =
  mongoose.models.Building || mongoose.model<IBuilding>("Building", BuildingSchema);

export default Building;
