import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IGeneratedDocument extends Document {
  documentRef: string; // e.g. "SF-NOC-2026-A1B2C3"
  verificationToken: string; // URL-safe unique reference used in QR code & public verify page
  societyId: Types.ObjectId;
  serviceRequestId: Types.ObjectId;
  requestId: string;
  applicantUserId: Types.ObjectId;
  applicantName: string;
  flatId: Types.ObjectId;
  flatNumber: string;
  wingName?: string;
  documentType: "HOME_LOAN_NOC" | "NO_DUES_CERT" | "ADDRESS_CONFIRMATION" | "GENERAL_SOCIETY_LETTER";
  title: string;
  r2ObjectKey: string;
  fileSize: number;
  mimeType: string;
  issuedAt: Date;
  issuedByUserId: Types.ObjectId;
  issuedByName: string;
  issuedByRole: string;
  verificationCount: number;
  lastVerifiedAt?: Date;
  isDemonstrationPrototype: boolean;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const GeneratedDocumentSchema = new Schema<IGeneratedDocument>(
  {
    documentRef: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    verificationToken: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    societyId: {
      type: Schema.Types.ObjectId,
      ref: "Society",
      required: true,
      index: true,
    },
    serviceRequestId: {
      type: Schema.Types.ObjectId,
      ref: "ServiceRequest",
      required: true,
      index: true,
    },
    requestId: {
      type: String,
      required: true,
      index: true,
    },
    applicantUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    applicantName: {
      type: String,
      required: true,
    },
    flatId: {
      type: Schema.Types.ObjectId,
      ref: "Flat",
      required: true,
    },
    flatNumber: {
      type: String,
      required: true,
    },
    wingName: {
      type: String,
    },
    documentType: {
      type: String,
      enum: ["HOME_LOAN_NOC", "NO_DUES_CERT", "ADDRESS_CONFIRMATION", "GENERAL_SOCIETY_LETTER"],
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    r2ObjectKey: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    mimeType: {
      type: String,
      default: "application/pdf",
    },
    issuedAt: {
      type: Date,
      default: Date.now,
    },
    issuedByUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    issuedByName: {
      type: String,
      required: true,
    },
    issuedByRole: {
      type: String,
      required: true,
    },
    verificationCount: {
      type: Number,
      default: 0,
    },
    lastVerifiedAt: {
      type: Date,
    },
    isDemonstrationPrototype: {
      type: Boolean,
      default: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

GeneratedDocumentSchema.index({ societyId: 1, documentType: 1 });
GeneratedDocumentSchema.index({ applicantUserId: 1, createdAt: -1 });

export const GeneratedDocument: Model<IGeneratedDocument> =
  mongoose.models.GeneratedDocument ||
  mongoose.model<IGeneratedDocument>("GeneratedDocument", GeneratedDocumentSchema);

export default GeneratedDocument;
