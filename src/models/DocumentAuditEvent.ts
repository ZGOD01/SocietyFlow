import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type DocumentAuditAction =
  | "UPLOAD"
  | "VIEW"
  | "DOWNLOAD"
  | "REPLACE"
  | "DELETE"
  | "VERIFY"
  | "REQUEST_CORRECTION"
  | "RENAME"
  | "ACCESS_REVOKED";

export interface IDocumentAuditEvent extends Document {
  documentId: Types.ObjectId;
  userId: Types.ObjectId;
  action: DocumentAuditAction;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, unknown>;
  timestamp: Date;
}

const DocumentAuditEventSchema = new Schema<IDocumentAuditEvent>(
  {
    documentId: {
      type: Schema.Types.ObjectId,
      ref: "Document",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    ipAddress: {
      type: String,
      default: undefined,
    },
    userAgent: {
      type: String,
      default: undefined,
    },
    details: {
      type: Schema.Types.Mixed,
      default: {},
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
  }
);

export const DocumentAuditEvent: Model<IDocumentAuditEvent> =
  mongoose.models.DocumentAuditEvent ||
  mongoose.model<IDocumentAuditEvent>("DocumentAuditEvent", DocumentAuditEventSchema);

export default DocumentAuditEvent;
