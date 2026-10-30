import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type DeliveryChannel = "IN_APP" | "EMAIL" | "WHATSAPP";

export type DeliveryStatus =
  | "PENDING"
  | "SENT"
  | "DELIVERED"
  | "FAILED"
  | "RETRY_PENDING"
  | "SKIPPED"
  | "NOT_CONFIGURED";

export interface INotificationDelivery extends Document {
  notificationId: Types.ObjectId;
  recipientId: Types.ObjectId;
  recipientContact: string;
  societyId?: Types.ObjectId;
  eventType: string;
  channel: DeliveryChannel;
  status: DeliveryStatus;
  attemptCount: number;
  providerReference?: string;
  failureReason?: string;
  metadata?: Record<string, unknown>;
  lastAttemptedAt: Date;
  sentAt?: Date;
  deliveredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationDeliverySchema = new Schema<INotificationDelivery>(
  {
    notificationId: {
      type: Schema.Types.ObjectId,
      ref: "Notification",
      required: true,
      index: true,
    },
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    recipientContact: {
      type: String,
      required: true,
      trim: true,
    },
    societyId: {
      type: Schema.Types.ObjectId,
      ref: "Society",
      index: true,
    },
    eventType: {
      type: String,
      required: true,
      index: true,
    },
    channel: {
      type: String,
      enum: ["IN_APP", "EMAIL", "WHATSAPP"],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: [
        "PENDING",
        "SENT",
        "DELIVERED",
        "FAILED",
        "RETRY_PENDING",
        "SKIPPED",
        "NOT_CONFIGURED",
      ],
      required: true,
      default: "PENDING",
      index: true,
    },
    attemptCount: {
      type: Number,
      default: 1,
    },
    providerReference: {
      type: String,
      trim: true,
    },
    failureReason: {
      type: String,
      trim: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
    lastAttemptedAt: {
      type: Date,
      default: Date.now,
    },
    sentAt: {
      type: Date,
    },
    deliveredAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

NotificationDeliverySchema.index({ recipientId: 1, channel: 1, createdAt: -1 });
NotificationDeliverySchema.index({ societyId: 1, status: 1, createdAt: -1 });
NotificationDeliverySchema.index({ providerReference: 1 }, { sparse: true });

export const NotificationDelivery: Model<INotificationDelivery> =
  mongoose.models.NotificationDelivery ||
  mongoose.model<INotificationDelivery>(
    "NotificationDelivery",
    NotificationDeliverySchema
  );

export default NotificationDelivery;
