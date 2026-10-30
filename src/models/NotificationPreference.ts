import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface INotificationCategoriesPreference {
  registrations: boolean;
  serviceRequests: boolean;
  approvals: boolean;
  reminders: boolean;
}

export interface INotificationPreference extends Document {
  userId: Types.ObjectId;
  emailEnabled: boolean;
  emailCategories: INotificationCategoriesPreference;
  whatsappEnabled: boolean;
  whatsappCategories: INotificationCategoriesPreference;
  whatsappPhoneNumber?: string;
  whatsappConsentGiven: boolean;
  whatsappConsentDate?: Date;
  reminderFrequencyHours: number;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationCategoriesSchema = new Schema(
  {
    registrations: { type: Boolean, default: true },
    serviceRequests: { type: Boolean, default: true },
    approvals: { type: Boolean, default: true },
    reminders: { type: Boolean, default: true },
  },
  { _id: false }
);

const NotificationPreferenceSchema = new Schema<INotificationPreference>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    emailEnabled: {
      type: Boolean,
      default: true,
    },
    emailCategories: {
      type: NotificationCategoriesSchema,
      default: () => ({
        registrations: true,
        serviceRequests: true,
        approvals: true,
        reminders: true,
      }),
    },
    whatsappEnabled: {
      type: Boolean,
      default: false, // Strict opt-in
    },
    whatsappCategories: {
      type: NotificationCategoriesSchema,
      default: () => ({
        registrations: true,
        serviceRequests: true,
        approvals: true,
        reminders: true,
      }),
    },
    whatsappPhoneNumber: {
      type: String,
      trim: true,
    },
    whatsappConsentGiven: {
      type: Boolean,
      default: false,
    },
    whatsappConsentDate: {
      type: Date,
    },
    reminderFrequencyHours: {
      type: Number,
      default: 24, // Once every 24 hours
      min: 6,
      max: 168,
    },
  },
  {
    timestamps: true,
  }
);

export const NotificationPreference: Model<INotificationPreference> =
  mongoose.models.NotificationPreference ||
  mongoose.model<INotificationPreference>(
    "NotificationPreference",
    NotificationPreferenceSchema
  );

export default NotificationPreference;
