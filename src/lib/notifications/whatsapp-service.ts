import crypto from "crypto";
import { DeliveryStatus } from "@/models/NotificationDelivery";

export interface SendWhatsAppPayload {
  toPhoneNumber: string;
  title: string;
  message: string;
  actionUrl?: string;
  recipientConsentGiven?: boolean;
}

export interface WhatsAppSendResult {
  success: boolean;
  status: DeliveryStatus;
  providerId?: string;
  error?: string;
}

/**
 * Format phone number to clean E.164 digits without plus or hyphens
 */
export function formatPhoneNumberE164(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  // If Indian mobile without country code (10 digits starting with 6-9), prepend 91
  if (digits.length === 10 && /^[6-9]/.test(digits)) {
    return `91${digits}`;
  }
  return digits;
}

/**
 * Validates Meta Webhook HMAC SHA-256 signature
 */
export function verifyMetaWebhookSignature(
  rawBody: string,
  signatureHeader: string | null
): boolean {
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  if (!appSecret || !signatureHeader) {
    return false;
  }

  const parts = signatureHeader.split("=");
  if (parts.length !== 2 || parts[0] !== "sha256") {
    return false;
  }

  const expectedSignature = parts[1];
  const calculatedSignature = crypto
    .createHmac("sha256", appSecret)
    .update(rawBody)
    .digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(calculatedSignature, "utf-8"),
      Buffer.from(expectedSignature, "utf-8")
    );
  } catch {
    return false;
  }
}

/**
 * Send WhatsApp notification via Meta WhatsApp Cloud API
 */
export async function sendWhatsAppNotification(
  payload: SendWhatsAppPayload
): Promise<WhatsAppSendResult> {
  const isEnabled = process.env.WHATSAPP_ENABLED === "true";
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!isEnabled) {
    return {
      success: false,
      status: "SKIPPED",
      error: "WhatsApp messaging is disabled (WHATSAPP_ENABLED is false).",
    };
  }

  if (!accessToken || !phoneNumberId || accessToken.trim() === "" || phoneNumberId.trim() === "") {
    return {
      success: false,
      status: "NOT_CONFIGURED",
      error: "WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID is not configured.",
    };
  }

  // Require opt-in consent for WhatsApp messaging
  if (payload.recipientConsentGiven === false) {
    return {
      success: false,
      status: "SKIPPED",
      error: "Recipient has not consented to WhatsApp alerts in notification settings.",
    };
  }

  const cleanPhone = formatPhoneNumberE164(payload.toPhoneNumber);
  if (cleanPhone.length < 10 || cleanPhone.length > 15) {
    return {
      success: false,
      status: "FAILED",
      error: `Invalid recipient phone number format: ${payload.toPhoneNumber}`,
    };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const fullActionUrl = payload.actionUrl
    ? payload.actionUrl.startsWith("http")
      ? payload.actionUrl
      : `${appUrl}${payload.actionUrl}`
    : `${appUrl}/notifications`;

  // Compose concise, privacy-conscious text message
  // Section 11 mandate: Never include PAN, Aadhaar, password or private attachments
  const bodyText = `SocietyFlow: ${payload.title}\n\n${payload.message}\n\nOpen securely in portal: ${fullActionUrl}`;

  try {
    const metaApiUrl = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;
    const response = await fetch(metaApiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: cleanPhone,
        type: "text",
        text: {
          preview_url: false,
          body: bodyText,
        },
      }),
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      const errorMsg = data.error?.message || "WhatsApp Meta Cloud API rejected message request";
      console.warn("[Meta WhatsApp API Warning]", errorMsg);
      return {
        success: false,
        status: "FAILED",
        error: errorMsg,
      };
    }

    const messageId = data.messages?.[0]?.id;
    return {
      success: true,
      status: "SENT",
      providerId: messageId,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Network error contacting Meta WhatsApp API";
    console.error("[Meta WhatsApp Error]", msg);
    return {
      success: false,
      status: "FAILED",
      error: msg,
    };
  }
}
