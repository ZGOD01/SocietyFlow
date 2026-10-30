import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IAuditEvent extends Document {
  societyId?: Types.ObjectId;
  userId?: Types.ObjectId;
  action: string;
  entityType?: string;
  entityId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

const AuditEventSchema = new Schema<IAuditEvent>(
  {
    societyId: {
      type: Schema.Types.ObjectId,
      ref: "Society",
      default: undefined,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: undefined,
      index: true,
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    entityType: {
      type: String,
      default: undefined,
    },
    entityId: {
      type: String,
      default: undefined,
    },
    details: {
      type: Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      default: undefined,
    },
    userAgent: {
      type: String,
      default: undefined,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

AuditEventSchema.index({ societyId: 1, createdAt: -1 });
AuditEventSchema.index({ userId: 1, createdAt: -1 });

export const AuditEvent: Model<IAuditEvent> =
  mongoose.models.AuditEvent || mongoose.model<IAuditEvent>("AuditEvent", AuditEventSchema);

export default AuditEvent;
