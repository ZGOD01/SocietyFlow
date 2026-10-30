import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/session";
import { connectDB } from "@/lib/db";
import {
  SocietyMembership,
  User,
  AuditEvent,
  Notification,
  Society,
} from "@/models";
import { COMMITTEE_ROLES, MembershipRole } from "@/lib/rbac";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const activeSocietyId =
      session.activeSocietyId || session.memberships?.[0]?.societyId;

    if (!activeSocietyId) {
      return NextResponse.json({ error: "No active society found." }, { status: 400 });
    }

    // Role check: Only Chairman, Secretary, or Super Admin can invite/assign committee members
    const isSuperAdmin = session.isSuperAdmin;
    const isAuthorizedInviter = session.memberships?.some(
      (m) =>
        m.societyId === activeSocietyId &&
        m.status === "VERIFIED" &&
        ["SECRETARY", "CHAIRMAN"].includes(m.role)
    );

    if (!isSuperAdmin && !isAuthorizedInviter) {
      return NextResponse.json(
        { error: "Forbidden: Only Secretary or Chairman can assign committee permissions." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, email, role } = body;

    if (!email || !role || !COMMITTEE_ROLES.includes(role as MembershipRole)) {
      return NextResponse.json(
        { error: "Valid email and valid committee role (SECRETARY, CHAIRMAN, TREASURER, SOCIETY_MANAGER) required." },
        { status: 400 }
      );
    }

    const normEmail = email.toLowerCase().trim();
    let targetUser = await User.findOne({ email: normEmail });

    if (!targetUser) {
      targetUser = await User.create({
        name: name?.trim() || `${role} Member`,
        email: normEmail,
        password: "TemporaryPassword@2026",
        status: "ACTIVE",
        onboardingStatus: "COMPLETED",
      });
    }

    const society = await Society.findById(activeSocietyId);

    // Assign verified membership
    await SocietyMembership.findOneAndUpdate(
      { userId: targetUser._id, societyId: activeSocietyId, role },
      {
        $set: {
          status: "VERIFIED",
          approvedBy: session.id,
          approvedAt: new Date(),
          notes: `Committee member assigned by ${session.name} (${session.activeRole}).`,
        },
      },
      { upsert: true }
    );

    await Notification.create({
      userId: targetUser._id,
      societyId: activeSocietyId,
      title: "Committee Member Assignment",
      message: `You have been appointed as ${role} for ${society?.name || "your housing society"}. Your committee permissions are now active.`,
      type: "action_required",
      eventType: "SOCIETY_SETUP_COMPLETE",
      actionUrl: "/management/dashboard",
    });

    await AuditEvent.create({
      societyId: activeSocietyId,
      userId: session.id,
      action: "COMMITTEE_MEMBER_ASSIGNED",
      entityType: "SocietyMembership",
      entityId: targetUser._id.toString(),
      details: {
        assignedEmail: normEmail,
        assignedRole: role,
        assignedBy: session.name,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Committee role ${role} assigned successfully to ${normEmail}.`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to invite committee member";
    console.error("[Invite Committee POST Error]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
