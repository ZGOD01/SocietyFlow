import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IDocumentAccessGrant extends Document {
  documentId: Types.ObjectId;
  grantedToUserId?: Types.ObjectId;
  grantedToRole?: string;
  grantedBy: Types.ObjectId;
  permissions: ("VIEW" | "DOWNLOAD")[];
  expiresAt?: Date;
  revoked: boolean;
  revokedAt?: Date;
  revokedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const DocumentAccessGrantSchema = new Schema<IDocumentAccessGrant>(
  {
    documentId: {
      type: Schema.Types.ObjectId,
      ref: "Document",
      required: true,
      index: true,
    },
    grantedToUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: undefined,
      index: true,
    },
    grantedToRole: {
      type: String,
      default: undefined,
      index: true,
    },
    grantedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    permissions: {
      type: [String],
      enum: ["VIEW", "DOWNLOAD"],
      default: ["VIEW", "DOWNLOAD"],
    },
    expiresAt: {
      type: Date,
      default: undefined,
    },
    revoked: {
      type: Boolean,
      default: false,
      index: true,
    },
    revokedAt: {
      type: Date,
      default: undefined,
    },
    revokedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: undefined,
    },
  },
  {
    timestamps: true,
  }
);

export const DocumentAccessGrant: Model<IDocumentAccessGrant> =
  mongoose.models.DocumentAccessGrant ||
  mongoose.model<IDocumentAccessGrant>("DocumentAccessGrant", DocumentAccessGrantSchema);

export default DocumentAccessGrant;
