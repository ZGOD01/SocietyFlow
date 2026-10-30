import { Resend } from "resend";
import { DeliveryStatus } from "@/models/NotificationDelivery";

let resendClient: Resend | null = null;

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey.trim() === "" || apiKey === "re_123456789") {
    return null;
  }
  if (!resendClient) {
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

export interface SendEmailPayload {
  to: string;
  subject: string;
  title: string;
  message: string;
  actionUrl?: string;
  actionText?: string;
  recipientName?: string;
  category?: string;
  metadata?: Record<string, unknown>;
}

export interface EmailSendResult {
  success: boolean;
  status: DeliveryStatus;
  providerId?: string;
  error?: string;
}

export async function sendEmailNotification(
  payload: SendEmailPayload
): Promise<EmailSendResult> {
  const client = getResendClient();
  if (!client) {
    return {
      success: false,
      status: "NOT_CONFIGURED",
      error: "RESEND_API_KEY is not configured or is a placeholder.",
    };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const fromEmail =
    process.env.RESEND_FROM_EMAIL || "SocietyFlow <onboarding@resend.dev>";

  const fullActionUrl = payload.actionUrl
    ? payload.actionUrl.startsWith("http")
      ? payload.actionUrl
      : `${appUrl}${payload.actionUrl}`
    : `${appUrl}/notifications`;

  const actionText = payload.actionText || "Open in SocietyFlow";

  // Build clean, professional email compliant with SPPU_Notes_Style_Guide.md
  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${payload.title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8F9FA; margin: 0; padding: 24px 12px; color: #1A1A1A; }
    .container { max-width: 560px; margin: 0 auto; background: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 14px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
    .header { padding: 24px 28px; border-bottom: 1px solid #E5E7EB; background: #FFFFFF; }
    .brand { font-size: 18px; font-weight: 700; color: #1A1A1A; letter-spacing: -0.02em; display: inline-block; }
    .brand-accent { color: #4F46E5; }
    .badge { display: inline-block; padding: 4px 10px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; border-radius: 9999px; background: #EEF2FF; color: #4F46E5; margin-bottom: 12px; }
    .body-content { padding: 32px 28px; }
    .heading { font-size: 20px; font-weight: 700; color: #1A1A1A; line-height: 1.3; margin: 0 0 14px 0; }
    .text { font-size: 14px; line-height: 1.6; color: #4B5563; margin: 0 0 24px 0; }
    .btn-container { margin: 28px 0; }
    .btn { display: inline-block; background-color: #4F46E5; color: #FFFFFF !important; font-size: 13px; font-weight: 600; text-decoration: none; padding: 11px 24px; border-radius: 9999px; letter-spacing: 0.01em; }
    .details-box { background: #F8F9FA; border: 1px solid #E5E7EB; border-radius: 10px; padding: 14px 18px; margin: 20px 0; font-size: 13px; color: #374151; }
    .footer { padding: 20px 28px; background: #F8F9FA; border-top: 1px solid #E5E7EB; font-size: 11px; color: #9CA3AF; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <span class="brand">Society<span class="brand-accent">Flow</span></span>
    </div>
    <div class="body-content">
      <span class="badge">${payload.category || "NOTIFICATION"}</span>
      <h1 class="heading">${payload.title}</h1>
      <p class="text">${payload.message}</p>
      
      <div class="btn-container">
        <a href="${fullActionUrl}" class="btn" target="_blank">${actionText} &rarr;</a>
      </div>

      <div class="details-box">
        <strong>Notice:</strong> For security and resident privacy, confidential details and attached documents are accessible only after authenticating into SocietyFlow.
      </div>
    </div>
    <div class="footer">
      This is an automated governance alert from SocietyFlow for ${payload.to}.<br>
      To manage your notification channels, open Settings &gt; Notifications in your dashboard.
    </div>
  </div>
</body>
</html>
  `;

  try {
    const data = await client.emails.send({
      from: fromEmail,
      to: [payload.to],
      subject: payload.subject,
      html: htmlContent,
    });

    if (data.error) {
      console.warn("[Resend Warning]", data.error);
      return {
        success: false,
        status: "FAILED",
        error: data.error.message || "Failed to send email via Resend",
      };
    }

    return {
      success: true,
      status: "SENT",
      providerId: data.data?.id,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Network error contacting Resend API";
    console.error("[Resend Error]", msg);
    return {
      success: false,
      status: "FAILED",
      error: msg,
    };
  }
}
