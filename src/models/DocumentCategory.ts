import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IDocumentCategory extends Document {
  name: string;
  code: string;
  scope: "PRIVATE" | "PROPERTY" | "SOCIETY" | "ALL";
  societyId?: Types.ObjectId;
  description?: string;
  iconName: string;
  isSystem: boolean;
  displayOrder: number;
  createdAt: Date;
}

const DocumentCategorySchema = new Schema<IDocumentCategory>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    scope: {
      type: String,
      enum: ["PRIVATE", "PROPERTY", "SOCIETY", "ALL"],
      default: "ALL",
      index: true,
    },
    societyId: {
      type: Schema.Types.ObjectId,
      ref: "Society",
      default: undefined,
      index: true,
    },
    description: {
      type: String,
      trim: true,
    },
    iconName: {
      type: String,
      default: "folder-outline",
    },
    isSystem: {
      type: Boolean,
      default: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const DocumentCategory: Model<IDocumentCategory> =
  mongoose.models.DocumentCategory ||
  mongoose.model<IDocumentCategory>("DocumentCategory", DocumentCategorySchema);

export default DocumentCategory;
