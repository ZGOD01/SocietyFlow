import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IDocumentVersion extends Document {
  documentId: Types.ObjectId;
  versionNumber: number;
  originalFilename: string;
  r2ObjectKey: string;
  size: number;
  mimeType: string;
  uploadedBy: Types.ObjectId;
  changeNote?: string;
  createdAt: Date;
}

const DocumentVersionSchema = new Schema<IDocumentVersion>(
  {
    documentId: {
      type: Schema.Types.ObjectId,
      ref: "Document",
      required: true,
      index: true,
    },
    versionNumber: {
      type: Number,
      required: true,
    },
    originalFilename: {
      type: String,
      required: true,
      trim: true,
    },
    r2ObjectKey: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
      min: 0,
    },
    mimeType: {
      type: String,
      required: true,
      trim: true,
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    changeNote: {
      type: String,
      trim: true,
      default: undefined,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

DocumentVersionSchema.index({ documentId: 1, versionNumber: -1 });

export const DocumentVersion: Model<IDocumentVersion> =
  mongoose.models.DocumentVersion ||
  mongoose.model<IDocumentVersion>("DocumentVersion", DocumentVersionSchema);

export default DocumentVersion;
