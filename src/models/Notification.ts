import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type NotificationType = "info" | "warning" | "success" | "action_required";

export type NotificationCategory =
  | "REGISTRATION"
  | "SERVICE_REQUEST"
  | "APPROVAL"
  | "SYSTEM"
  | "REMINDER"
  | "OWNERSHIP_TRANSFER"
  | "SUBSCRIPTION"
  | "PARTNER";

export type NotificationEventType =
  // Prompt 10 events
  | "TRANSFER_INITIATED"
  | "NEW_OWNER_INVITED"
  | "NEW_OWNER_ACCEPTED"
  | "TRANSFER_VERIFICATION_REQUIRED"
  | "TRANSFER_CORRECTION_REQUIRED"
  | "TRANSFER_APPROVED"
  | "TRANSFER_REJECTED"
  | "TRANSFER_COMPLETED"
  | "SOCIETY_PLAN_ASSIGNED"
  | "SOCIETY_PLAN_CHANGED"
  | "PARTNER_REFERRAL_CREATED"
  | "PARTNER_REFERRAL_ACTIVATED"
  // Prompt 9 standard events
  | "OWNER_REGISTRATION_SUBMITTED"
  | "OWNER_REGISTRATION_APPROVED"
  | "OWNER_REGISTRATION_REJECTED"
  | "TENANT_REGISTRATION_SUBMITTED"
  | "TENANT_OWNER_APPROVAL_REQUIRED"
  | "TENANT_OWNER_APPROVED"
  | "TENANT_OWNER_REJECTED"
  | "TENANT_SOCIETY_APPROVAL_REQUIRED"
  | "TENANT_SOCIETY_APPROVED"
  | "TENANT_SOCIETY_REJECTED"
  | "TENANT_REGISTRATION_COMPLETED"
  | "REQUEST_SUBMITTED"
  | "REQUEST_OWNER_AUTHORIZATION_REQUIRED"
  | "REQUEST_OWNER_AUTHORIZED"
  | "REQUEST_OWNER_DECLINED"
  | "REQUEST_CORRECTION_REQUIRED"
  | "REQUEST_RESUBMITTED"
  | "REQUEST_SOCIETY_REVIEW_REQUIRED"
  | "REQUEST_STAGE_APPROVED"
  | "REQUEST_REJECTED"
  | "REQUEST_FULLY_APPROVED"
  | "REQUEST_DOCUMENT_ISSUED"
  | "APPROVAL_REMINDER"
  | "APPROVAL_OVERDUE"
  | "DOCUMENT_EXPIRY_REMINDER"
  // Legacy / existing compatibility events
  | "REGISTRATION_SUBMITTED"
  | "OWNER_APPROVAL_PENDING"
  | "SOCIETY_APPROVAL_PENDING"
  | "REGISTRATION_APPROVED"
  | "REGISTRATION_REJECTED"
  | "MORE_INFO_REQUESTED"
  | "TENANT_APPROVAL_REQUESTED"
  | "MEMBERSHIP_ACTIVATED"
  | "SOCIETY_SETUP_COMPLETE"
  | "SERVICE_REQUEST_SUBMITTED"
  | "SERVICE_REQUEST_OWNER_AUTH_PENDING"
  | "SERVICE_REQUEST_OWNER_AUTHORIZED"
  | "SERVICE_REQUEST_OWNER_DECLINED"
  | "SERVICE_REQUEST_CORRECTION_REQUESTED"
  | "SERVICE_REQUEST_RESUBMITTED"
  | "SERVICE_REQUEST_SOCIETY_RECEIVED"
  | "SERVICE_REQUEST_CANCELLED"
  | "SERVICE_REQUEST_VERIFICATION_REQUIRED"
  | "SERVICE_REQUEST_APPROVAL_REQUIRED"
  | "SERVICE_REQUEST_STAGE_APPROVED"
  | "SERVICE_REQUEST_NEXT_STAGE_ACTIVATED"
  | "SERVICE_REQUEST_REJECTED"
  | "SERVICE_REQUEST_FULLY_APPROVED"
  | "SERVICE_REQUEST_DOCUMENT_READY"
  | "SERVICE_REQUEST_DOCUMENT_ISSUED"
  | "SERVICE_REQUEST_DELEGATION_ASSIGNED"
  | "SERVICE_REQUEST_APPROVAL_OVERDUE"
  | "GENERAL";

export interface INotificationDeliverySummary {
  emailStatus?: "PENDING" | "SENT" | "DELIVERED" | "FAILED" | "SKIPPED" | "NOT_CONFIGURED";
  whatsappStatus?: "PENDING" | "SENT" | "DELIVERED" | "FAILED" | "SKIPPED" | "NOT_CONFIGURED";
}

export interface INotification extends Document {
  userId: Types.ObjectId;
  societyId?: Types.ObjectId;
  title: string;
  message: string;
  type: NotificationType;
  category: NotificationCategory;
  eventType: NotificationEventType;
  actionUrl?: string;
  read: boolean;
  readAt?: Date;
  idempotencyKey?: string;
  deliverySummary?: INotificationDeliverySummary;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    societyId: {
      type: Schema.Types.ObjectId,
      ref: "Society",
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["info", "warning", "success", "action_required"],
      default: "info",
    },
    category: {
      type: String,
      enum: ["REGISTRATION", "SERVICE_REQUEST", "APPROVAL", "SYSTEM", "REMINDER"],
      default: "SYSTEM",
      index: true,
    },
    eventType: {
      type: String,
      required: true,
      default: "GENERAL",
      index: true,
    },
    actionUrl: {
      type: String,
      trim: true,
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
    },
    idempotencyKey: {
      type: String,
      sparse: true,
      index: true,
    },
    deliverySummary: {
      emailStatus: {
        type: String,
        enum: ["PENDING", "SENT", "DELIVERED", "FAILED", "SKIPPED", "NOT_CONFIGURED"],
      },
      whatsappStatus: {
        type: String,
        enum: ["PENDING", "SENT", "DELIVERED", "FAILED", "SKIPPED", "NOT_CONFIGURED"],
      },
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
NotificationSchema.index({ societyId: 1, category: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, idempotencyKey: 1 }, { unique: true, sparse: true });

export const Notification: Model<INotification> =
  mongoose.models.Notification ||
  mongoose.model<INotification>("Notification", NotificationSchema);

export default Notification;
