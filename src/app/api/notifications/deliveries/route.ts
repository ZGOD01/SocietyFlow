import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/session";
import { connectDB } from "@/lib/db";
import { NotificationDelivery } from "@/models";
import { COMMITTEE_ROLES } from "@/lib/rbac";

function maskContact(contact: string): string {
  if (!contact) return "";
  if (contact.includes("@")) {
    const [user, domain] = contact.split("@");
    const maskedUser =
      user.length > 2 ? `${user.slice(0, 2)}***` : `${user[0]}***`;
    return `${maskedUser}@${domain}`;
  }
  // Phone number masking
  const digits = contact.replace(/\D/g, "");
  if (digits.length >= 8) {
    return `+${digits.slice(0, 2)}*****${digits.slice(-4)}`;
  }
  return "*****";
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const activeSocietyId =
      session.activeSocietyId || session.memberships?.[0]?.societyId;

    if (!activeSocietyId && !session.isSuperAdmin) {
      return NextResponse.json({ error: "Active society required" }, { status: 400 });
    }

    const isAuthorized =
      session.isSuperAdmin ||
      session.memberships?.some(
        (m) =>
          m.societyId.toString() === activeSocietyId?.toString() &&
          COMMITTEE_ROLES.includes(m.role as any)
      );

    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Forbidden: Committee management access required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const channel = searchParams.get("channel");
    const status = searchParams.get("status");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);

    const filter: Record<string, unknown> = {};
    if (activeSocietyId && !session.isSuperAdmin) {
      filter.societyId = activeSocietyId;
    }
    if (channel && channel !== "ALL") {
      filter.channel = channel;
    }
    if (status && status !== "ALL") {
      filter.status = status;
    }

    const deliveries = await NotificationDelivery.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const mapped = deliveries.map((d) => ({
      id: d._id.toString(),
      notificationId: d.notificationId.toString(),
      recipientContact: maskContact(d.recipientContact),
      eventType: d.eventType,
      channel: d.channel,
      status: d.status,
      attemptCount: d.attemptCount,
      providerReference: d.providerReference || null,
      failureReason: d.failureReason || null,
      sentAt: d.sentAt ? new Date(d.sentAt).toISOString() : null,
      deliveredAt: d.deliveredAt ? new Date(d.deliveredAt).toISOString() : null,
      createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : new Date().toISOString(),
    }));

    return NextResponse.json({
      success: true,
      deliveries: mapped,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load delivery logs";
    console.error("[Notification Deliveries GET Error]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
