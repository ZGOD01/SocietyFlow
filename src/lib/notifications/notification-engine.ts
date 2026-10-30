import mongoose, { Types } from "mongoose";
import {
  Notification,
  NotificationEventType,
  NotificationCategory,
  NotificationType,
  NotificationPreference,
  NotificationDelivery,
  User,
} from "@/models";
import { sendEmailNotification } from "./email-service";
import { sendWhatsAppNotification } from "./whatsapp-service";

export interface RecipientInfo {
  userId: string | Types.ObjectId;
  email?: string;
  phone?: string;
  name?: string;
}

export interface DispatchNotificationParams {
  eventType: NotificationEventType;
  category: NotificationCategory;
  type?: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  societyId?: string | Types.ObjectId;
  recipients: Array<RecipientInfo | string | Types.ObjectId>;
  idempotencyKey?: string;
  metadata?: Record<string, unknown>;
}

export interface DispatchNotificationResult {
  inAppCount: number;
  emailDispatched: number;
  whatsappDispatched: number;
  skippedCount: number;
  deliveries: Array<{
    recipientId: string;
    notificationId?: string;
    emailStatus?: string;
    whatsappStatus?: string;
  }>;
}

/**
 * Maps notification category to preference key
 */
function getCategoryPreferenceKey(
  category: NotificationCategory
): "registrations" | "serviceRequests" | "approvals" | "reminders" {
  switch (category) {
    case "REGISTRATION":
      return "registrations";
    case "SERVICE_REQUEST":
      return "serviceRequests";
    case "APPROVAL":
      return "approvals";
    case "REMINDER":
      return "reminders";
    default:
      return "serviceRequests";
  }
}

/**
 * Centralized Notification Dispatcher for SocietyFlow
 * Ensures reliable in-app persistence, preference validation, and non-blocking email/whatsapp delivery
 */
export async function dispatchNotification(
  params: DispatchNotificationParams
): Promise<DispatchNotificationResult> {
  const {
    eventType,
    category,
    type = "info",
    title,
    message,
    actionUrl,
    societyId,
    recipients,
    idempotencyKey,
    metadata,
  } = params;

  const result: DispatchNotificationResult = {
    inAppCount: 0,
    emailDispatched: 0,
    whatsappDispatched: 0,
    skippedCount: 0,
    deliveries: [],
  };

  if (!recipients || recipients.length === 0) {
    return result;
  }

  // Normalize recipient list
  const normalizedRecipients: RecipientInfo[] = recipients.map((r) => {
    if (typeof r === "string" || r instanceof Types.ObjectId) {
      return { userId: r };
    }
    return r;
  });

  // Deduplicate recipients by userId
  const recipientMap = new Map<string, RecipientInfo>();
  for (const r of normalizedRecipients) {
    recipientMap.set(r.userId.toString(), r);
  }

  const uniqueRecipients = Array.from(recipientMap.values());

  for (const recipient of uniqueRecipients) {
    const userIdObj =
      typeof recipient.userId === "string"
        ? new Types.ObjectId(recipient.userId)
        : recipient.userId;

    const recipientUserIdStr = userIdObj.toString();
    const specificIdempotencyKey = idempotencyKey
      ? `${idempotencyKey}_${recipientUserIdStr}`
      : undefined;

    // 1. Idempotency check: prevent duplicate notifications on API retries
    if (specificIdempotencyKey && mongoose.connection.readyState === 1) {
      const existing = await Notification.findOne({
        userId: userIdObj,
        idempotencyKey: specificIdempotencyKey,
      }).lean();

      if (existing) {
        result.skippedCount++;
        result.deliveries.push({
          recipientId: recipientUserIdStr,
          notificationId: existing._id.toString(),
          emailStatus: existing.deliverySummary?.emailStatus || "SKIPPED",
          whatsappStatus: existing.deliverySummary?.whatsappStatus || "SKIPPED",
        });
        continue;
      }
    }

    // 2. Fetch user profile if email or phone is missing
    let userEmail = recipient.email;
    let userPhone = recipient.phone;
    let userName = recipient.name;

    if ((!userEmail || !userPhone || !userName) && mongoose.connection.readyState === 1) {
      try {
        const userDoc = await User.findById(userIdObj).lean();
        if (userDoc) {
          userEmail = userEmail || userDoc.email;
          userPhone = userPhone || userDoc.phone;
          userName = userName || userDoc.name;
        }
      } catch (err) {
        console.warn("[Notification Engine] Failed to fetch user profile:", err);
      }
    }

    // 3. Create persistent In-App Notification record
    let notificationDoc = null;
    if (mongoose.connection.readyState === 1) {
      try {
        notificationDoc = await Notification.create({
          userId: userIdObj,
          societyId: societyId ? new Types.ObjectId(societyId.toString()) : undefined,
          title,
          message,
          type,
          category,
          eventType,
          actionUrl,
          idempotencyKey: specificIdempotencyKey,
          metadata,
          read: false,
          deliverySummary: {},
        });
        result.inAppCount++;
      } catch (err) {
        console.error("[Notification Engine] In-app notification creation failed:", err);
      }
    }

    const notificationId = notificationDoc?._id || new Types.ObjectId();
    const societyIdObj = societyId
      ? new Types.ObjectId(societyId.toString())
      : undefined;

    // 4. Fetch user Notification Preferences
    let preferences = null;
    if (mongoose.connection.readyState === 1) {
      try {
        preferences = await NotificationPreference.findOne({
          userId: userIdObj,
        }).lean();
      } catch (err) {
        console.warn("[Notification Engine] Error reading preferences:", err);
      }
    }

    const prefCategoryKey = getCategoryPreferenceKey(category);

    const emailAllowed = preferences
      ? preferences.emailEnabled && preferences.emailCategories?.[prefCategoryKey] !== false
      : true; // Default allowed

    const whatsappAllowed = preferences
      ? preferences.whatsappEnabled &&
        preferences.whatsappConsentGiven &&
        preferences.whatsappCategories?.[prefCategoryKey] !== false
      : false; // Strict opt-in default

    const targetPhone = preferences?.whatsappPhoneNumber || userPhone;

    let finalEmailStatus: string = "SKIPPED";
    let finalWhatsAppStatus: string = "SKIPPED";

    // 5. Dispatch Email (Non-blocking external call)
    if (userEmail && emailAllowed) {
      try {
        const emailRes = await sendEmailNotification({
          to: userEmail,
          subject: `${title} — SocietyFlow`,
          title,
          message,
          actionUrl,
          recipientName: userName,
          category,
          metadata,
        });

        finalEmailStatus = emailRes.status;
        if (emailRes.success) result.emailDispatched++;

        if (mongoose.connection.readyState === 1) {
          await NotificationDelivery.create({
            notificationId,
            recipientId: userIdObj,
            recipientContact: userEmail,
            societyId: societyIdObj,
            eventType,
            channel: "EMAIL",
            status: emailRes.status,
            attemptCount: 1,
            providerReference: emailRes.providerId,
            failureReason: emailRes.error,
            sentAt: emailRes.success ? new Date() : undefined,
          });
        }
      } catch (err: unknown) {
        finalEmailStatus = "FAILED";
        console.error("[Notification Engine] Email dispatch error:", err);
      }
    } else {
      finalEmailStatus = userEmail ? "SKIPPED" : "NOT_CONFIGURED";
      if (mongoose.connection.readyState === 1 && userEmail) {
        await NotificationDelivery.create({
          notificationId,
          recipientId: userIdObj,
          recipientContact: userEmail,
          societyId: societyIdObj,
          eventType,
          channel: "EMAIL",
          status: "SKIPPED",
          attemptCount: 0,
          failureReason: "Disabled in recipient preferences",
        });
      }
    }

    // 6. Dispatch WhatsApp (Non-blocking external call)
    if (targetPhone && whatsappAllowed) {
      try {
        const waRes = await sendWhatsAppNotification({
          toPhoneNumber: targetPhone,
          title,
          message,
          actionUrl,
          recipientConsentGiven: preferences?.whatsappConsentGiven ?? true,
        });

        finalWhatsAppStatus = waRes.status;
        if (waRes.success) result.whatsappDispatched++;

        if (mongoose.connection.readyState === 1) {
          await NotificationDelivery.create({
            notificationId,
            recipientId: userIdObj,
            recipientContact: targetPhone,
            societyId: societyIdObj,
            eventType,
            channel: "WHATSAPP",
            status: waRes.status,
            attemptCount: 1,
            providerReference: waRes.providerId,
            failureReason: waRes.error,
            sentAt: waRes.success ? new Date() : undefined,
          });
        }
      } catch (err: unknown) {
        finalWhatsAppStatus = "FAILED";
        console.error("[Notification Engine] WhatsApp dispatch error:", err);
      }
    } else {
      finalWhatsAppStatus = targetPhone
        ? !whatsappAllowed
          ? "SKIPPED"
          : "NOT_CONFIGURED"
        : "NOT_CONFIGURED";

      if (mongoose.connection.readyState === 1 && targetPhone) {
        await NotificationDelivery.create({
          notificationId,
          recipientId: userIdObj,
          recipientContact: targetPhone,
          societyId: societyIdObj,
          eventType,
          channel: "WHATSAPP",
          status: finalWhatsAppStatus as any,
          attemptCount: 0,
          failureReason: !whatsappAllowed
            ? "Disabled or consent missing in recipient preferences"
            : "Recipient phone number missing",
        });
      }
    }

    // 7. Update notification deliverySummary
    if (notificationDoc && mongoose.connection.readyState === 1) {
      try {
        await Notification.findByIdAndUpdate(notificationDoc._id, {
          $set: {
            deliverySummary: {
              emailStatus: finalEmailStatus as any,
              whatsappStatus: finalWhatsAppStatus as any,
            },
          },
        });
      } catch (err) {
        console.warn("[Notification Engine] Delivery summary update error:", err);
      }
    }

    result.deliveries.push({
      recipientId: recipientUserIdStr,
      notificationId: notificationDoc?._id?.toString(),
      emailStatus: finalEmailStatus,
      whatsappStatus: finalWhatsAppStatus,
    });
  }

  return result;
}
