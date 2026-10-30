import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/session";
import { connectDB } from "@/lib/db";
import { Notification } from "@/models";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const status = searchParams.get("status"); // "ALL", "UNREAD", "READ"
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);
    const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = { userId: session.id };

    if (category && category !== "ALL") {
      filter.category = category;
    }

    if (status === "UNREAD") {
      filter.read = false;
    } else if (status === "READ") {
      filter.read = true;
    }

    const [notifications, totalCount, unreadCount] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments(filter),
      Notification.countDocuments({
        userId: session.id,
        read: false,
      }),
    ]);

    const mapped = notifications.map((n) => ({
      id: n._id.toString(),
      title: n.title,
      message: n.message,
      type: n.type,
      category: n.category || "SYSTEM",
      eventType: n.eventType,
      actionUrl: n.actionUrl,
      read: n.read,
      readAt: n.readAt ? new Date(n.readAt).toISOString() : null,
      deliverySummary: n.deliverySummary || {},
      createdAt: n.createdAt ? new Date(n.createdAt).toISOString() : new Date().toISOString(),
    }));

    return NextResponse.json({
      success: true,
      unreadCount,
      totalCount,
      page,
      limit,
      notifications: mapped,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load notifications";
    console.error("[Notifications GET Error]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const body = await req.json();
    const { notificationId, markAllRead } = body;

    const now = new Date();

    if (markAllRead) {
      await Notification.updateMany(
        { userId: session.id, read: false },
        { $set: { read: true, readAt: now } }
      );
      return NextResponse.json({ success: true, message: "All notifications marked as read." });
    }

    if (notificationId) {
      const updated = await Notification.findOneAndUpdate(
        { _id: notificationId, userId: session.id },
        { $set: { read: true, readAt: now } },
        { new: true }
      );

      if (!updated) {
        return NextResponse.json({ error: "Notification not found or access denied." }, { status: 404 });
      }

      return NextResponse.json({ success: true, message: "Notification marked as read." });
    }

    return NextResponse.json({ error: "notificationId or markAllRead required." }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update notification";
    console.error("[Notifications PATCH Error]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const notificationId = searchParams.get("id");

    if (!notificationId) {
      return NextResponse.json({ error: "id parameter required." }, { status: 400 });
    }

    const deleted = await Notification.findOneAndDelete({
      _id: notificationId,
      userId: session.id,
    });

    if (!deleted) {
      return NextResponse.json({ error: "Notification not found or access denied." }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Notification deleted." });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete notification";
    console.error("[Notifications DELETE Error]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
