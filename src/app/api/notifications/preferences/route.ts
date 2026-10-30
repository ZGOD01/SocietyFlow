import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/session";
import { connectDB } from "@/lib/db";
import { NotificationPreference, User } from "@/models";

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    let pref = await NotificationPreference.findOne({ userId: session.id }).lean();

    if (!pref) {
      // Fetch user phone from User model if available
      const user = await User.findById(session.id).lean();

      pref = await NotificationPreference.create({
        userId: session.id,
        emailEnabled: true,
        emailCategories: {
          registrations: true,
          serviceRequests: true,
          approvals: true,
          reminders: true,
        },
        whatsappEnabled: false,
        whatsappCategories: {
          registrations: true,
          serviceRequests: true,
          approvals: true,
          reminders: true,
        },
        whatsappPhoneNumber: user?.phone || "",
        whatsappConsentGiven: false,
        reminderFrequencyHours: 24,
      });
    }

    return NextResponse.json({
      success: true,
      preferences: {
        id: pref._id.toString(),
        userId: pref.userId.toString(),
        emailEnabled: pref.emailEnabled,
        emailCategories: pref.emailCategories,
        whatsappEnabled: pref.whatsappEnabled,
        whatsappCategories: pref.whatsappCategories,
        whatsappPhoneNumber: pref.whatsappPhoneNumber || "",
        whatsappConsentGiven: pref.whatsappConsentGiven,
        whatsappConsentDate: pref.whatsappConsentDate,
        reminderFrequencyHours: pref.reminderFrequencyHours || 24,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load preferences";
    console.error("[Notification Preferences GET Error]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const body = await req.json();
    const {
      emailEnabled,
      emailCategories,
      whatsappEnabled,
      whatsappCategories,
      whatsappPhoneNumber,
      whatsappConsentGiven,
      reminderFrequencyHours,
    } = body;

    const updateFields: Record<string, unknown> = {};

    if (typeof emailEnabled === "boolean") {
      updateFields.emailEnabled = emailEnabled;
    }
    if (emailCategories && typeof emailCategories === "object") {
      updateFields.emailCategories = {
        registrations: Boolean(emailCategories.registrations),
        serviceRequests: Boolean(emailCategories.serviceRequests),
        approvals: Boolean(emailCategories.approvals),
        reminders: Boolean(emailCategories.reminders),
      };
    }

    if (typeof whatsappEnabled === "boolean") {
      updateFields.whatsappEnabled = whatsappEnabled;
    }
    if (whatsappCategories && typeof whatsappCategories === "object") {
      updateFields.whatsappCategories = {
        registrations: Boolean(whatsappCategories.registrations),
        serviceRequests: Boolean(whatsappCategories.serviceRequests),
        approvals: Boolean(whatsappCategories.approvals),
        reminders: Boolean(whatsappCategories.reminders),
      };
    }
    if (typeof whatsappPhoneNumber === "string") {
      updateFields.whatsappPhoneNumber = whatsappPhoneNumber.trim();
    }
    if (typeof whatsappConsentGiven === "boolean") {
      updateFields.whatsappConsentGiven = whatsappConsentGiven;
      if (whatsappConsentGiven) {
        updateFields.whatsappConsentDate = new Date();
      }
    }
    if (typeof reminderFrequencyHours === "number") {
      updateFields.reminderFrequencyHours = Math.max(6, Math.min(168, reminderFrequencyHours));
    }

    const updated = await NotificationPreference.findOneAndUpdate(
      { userId: session.id },
      { $set: updateFields },
      { new: true, upsert: true }
    );

    return NextResponse.json({
      success: true,
      message: "Notification preferences updated successfully.",
      preferences: {
        id: updated._id.toString(),
        userId: updated.userId.toString(),
        emailEnabled: updated.emailEnabled,
        emailCategories: updated.emailCategories,
        whatsappEnabled: updated.whatsappEnabled,
        whatsappCategories: updated.whatsappCategories,
        whatsappPhoneNumber: updated.whatsappPhoneNumber || "",
        whatsappConsentGiven: updated.whatsappConsentGiven,
        whatsappConsentDate: updated.whatsappConsentDate,
        reminderFrequencyHours: updated.reminderFrequencyHours,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update preferences";
    console.error("[Notification Preferences PUT Error]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
