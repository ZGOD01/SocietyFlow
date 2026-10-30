import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { NotificationDelivery } from "@/models";
import { verifyMetaWebhookSignature } from "@/lib/notifications/whatsapp-service";

/**
 * Meta WhatsApp Cloud API Webhook Verification Challenge (GET)
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const expectedToken =
    process.env.WHATSAPP_VERIFY_TOKEN || "societyflow_webhook_verify_token_2026";

  if (mode === "subscribe" && token === expectedToken) {
    return new Response(challenge || "", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  return NextResponse.json({ error: "Forbidden: Invalid verify token" }, { status: 403 });
}

/**
 * Meta WhatsApp Cloud API Delivery Receipts & Status Updates (POST)
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-hub-signature-256");

    // Verify webhook signature if WHATSAPP_APP_SECRET is configured
    if (process.env.WHATSAPP_APP_SECRET) {
      const isValid = verifyMetaWebhookSignature(rawBody, signature);
      if (!isValid) {
        console.warn("[WhatsApp Webhook] Invalid HMAC signature received");
        return NextResponse.json(
          { error: "Unauthorized: Invalid webhook signature" },
          { status: 401 }
        );
      }
    }

    const payload = JSON.parse(rawBody || "{}");

    await connectDB();

    let processedCount = 0;

    // Meta status updates structure: entry[].changes[].value.statuses[]
    const entries = payload.entry || [];
    for (const entry of entries) {
      const changes = entry.changes || [];
      for (const change of changes) {
        const statuses = change.value?.statuses || [];
        for (const statusItem of statuses) {
          const messageId = statusItem.id;
          const status = statusItem.status; // "sent", "delivered", "read", "failed"
          const timestamp = statusItem.timestamp
            ? new Date(parseInt(statusItem.timestamp, 10) * 1000)
            : new Date();

          if (!messageId) continue;

          let mappedStatus: "SENT" | "DELIVERED" | "FAILED" | null = null;
          if (status === "delivered" || status === "read") {
            mappedStatus = "DELIVERED";
          } else if (status === "failed") {
            mappedStatus = "FAILED";
          } else if (status === "sent") {
            mappedStatus = "SENT";
          }

          if (mappedStatus) {
            const updateDoc: Record<string, unknown> = {
              status: mappedStatus,
            };
            if (mappedStatus === "DELIVERED") {
              updateDoc.deliveredAt = timestamp;
            } else if (mappedStatus === "FAILED") {
              updateDoc.failureReason =
                statusItem.errors?.[0]?.title || "WhatsApp message delivery failed";
            }

            await NotificationDelivery.findOneAndUpdate(
              { providerReference: messageId },
              { $set: updateDoc }
            );
            processedCount++;
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      processed: processedCount,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Error processing WhatsApp webhook";
    console.error("[WhatsApp Webhook Error]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
