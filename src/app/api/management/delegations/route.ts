import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { getServerSession } from "@/lib/session";
import { connectDB } from "@/lib/db";
import { ApprovalDelegation } from "@/models/ApprovalDelegation";
import { SocietyMembership } from "@/models/SocietyMembership";
import { User } from "@/models/User";
import { AuditEvent } from "@/models/AuditEvent";
import { sendApprovalNotification } from "@/lib/approvals/workflow-engine";
import { COMMITTEE_ROLES, MembershipRole } from "@/lib/rbac";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const activeSocietyId =
      session.activeSocietyId || session.memberships?.[0]?.societyId;

    if (!activeSocietyId) {
      return NextResponse.json({ error: "No active society context found" }, { status: 400 });
    }

    const isSuperAdmin = session.isSuperAdmin;
    const isCommittee = session.memberships?.some(
      (m) =>
        m.societyId === activeSocietyId &&
        m.status === "VERIFIED" &&
        COMMITTEE_ROLES.includes(m.role as MembershipRole)
    );

    if (!isSuperAdmin && !isCommittee) {
      return NextResponse.json(
        { error: "Forbidden: Committee privileges required" },
        { status: 403 }
      );
    }

    const socObjectId = new Types.ObjectId(activeSocietyId);

    // Fetch delegations
    const delegations = await ApprovalDelegation.find({
      societyId: socObjectId,
    })
      .sort({ createdAt: -1 })
      .lean();

    // Auto update expired status
    const now = new Date();
    const processed = delegations.map((d) => {
      let currentStatus = d.status;
      if (currentStatus === "ACTIVE" && new Date(d.endDate) < now) {
        currentStatus = "EXPIRED";
      }
      return {
        id: d._id.toString(),
        delegatorUserId: d.delegatorUserId.toString(),
        delegatorName: d.delegatorName,
        delegatorRole: d.delegatorRole,
        delegateUserId: d.delegateUserId.toString(),
        delegateName: d.delegateName,
        delegateRole: d.delegateRole,
        delegatedAuthorityRole: d.delegatedAuthorityRole,
        serviceCodes: d.serviceCodes || [],
        stageKeys: d.stageKeys || [],
        startDate: d.startDate,
        endDate: d.endDate,
        status: currentStatus,
        reason: d.reason,
        revokedAt: d.revokedAt,
        revocationReason: d.revocationReason,
        createdAt: d.createdAt,
      };
    });

    // Also fetch eligible committee members in this society who can act as delegates
    const verifiedMemberships = await SocietyMembership.find({
      societyId: socObjectId,
      status: "VERIFIED",
    })
      .populate("userId", "name email phone")
      .lean();

    const eligibleDelegates = verifiedMemberships
      .filter((m) => m.userId && (m.userId as unknown as { _id?: unknown })._id)
      .map((m) => {
        const u = m.userId as unknown as { _id: Types.ObjectId; name: string; email: string };
        return {
          userId: u._id.toString(),
          name: u.name,
          email: u.email,
          role: m.role,
        };
      });

    return NextResponse.json({
      success: true,
      delegations: processed,
      eligibleDelegates,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load delegations";
    console.error("[Delegations GET Error]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

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
      return NextResponse.json({ error: "No active society context found" }, { status: 400 });
    }

    const socObjectId = new Types.ObjectId(activeSocietyId);

    // Verify delegator is an authorized committee official
    const userMembership = session.memberships?.find(
      (m) => m.societyId === activeSocietyId && m.status === "VERIFIED"
    );

    const isCommittee =
      session.isSuperAdmin ||
      (userMembership && ["CHAIRMAN", "SECRETARY", "TREASURER"].includes(userMembership.role));

    if (!isCommittee) {
      return NextResponse.json(
        { error: "Forbidden: Only Chairman, Secretary, or Treasurer can delegate approval authority." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      delegateUserId,
      delegatedAuthorityRole,
      startDate,
      endDate,
      reason,
      serviceCodes,
      stageKeys,
    } = body;

    if (!delegateUserId || !startDate || !endDate || !reason) {
      return NextResponse.json(
        { error: "Missing required fields: delegateUserId, startDate, endDate, and reason are required." },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
      return NextResponse.json(
        { error: "Invalid date range: End date must be strictly after start date." },
        { status: 400 }
      );
    }

    // Verify that the delegate is a legitimate verified member of this society
    const delegateMembership = await SocietyMembership.findOne({
      societyId: socObjectId,
      userId: new Types.ObjectId(delegateUserId),
      status: "VERIFIED",
    }).populate("userId", "name email");

    if (!delegateMembership || !delegateMembership.userId) {
      return NextResponse.json(
        { error: "Delegate must be a verified member of this society. Arbitrary or unverified users cannot receive approval authority." },
        { status: 400 }
      );
    }

    const delegateUser = delegateMembership.userId as unknown as { _id: Types.ObjectId; name: string };
    const delegatorRole = userMembership?.role || session.activeRole || "CHAIRMAN";
    const delegatedRole = delegatedAuthorityRole || delegatorRole;

    const delegation = await ApprovalDelegation.create({
      societyId: socObjectId,
      delegatorUserId: new Types.ObjectId(session.id),
      delegatorName: session.name || "Society Official",
      delegatorRole,
      delegateUserId: delegateUser._id,
      delegateName: delegateUser.name,
      delegateRole: delegateMembership.role,
      delegatedAuthorityRole: delegatedRole,
      serviceCodes: Array.isArray(serviceCodes) ? serviceCodes : [],
      stageKeys: Array.isArray(stageKeys) ? stageKeys : [],
      startDate: start,
      endDate: end,
      status: "ACTIVE",
      reason: reason.trim(),
    });

    await AuditEvent.create({
      societyId: socObjectId,
      userId: new Types.ObjectId(session.id),
      action: "APPROVAL_DELEGATION_GRANTED",
      entityType: "ApprovalDelegation",
      entityId: delegation._id.toString(),
      details: {
        delegatorRole,
        delegateUserId: delegateUser._id.toString(),
        delegateName: delegateUser.name,
        delegatedAuthorityRole: delegatedRole,
        startDate: start,
        endDate: end,
        reason: reason.trim(),
      },
    });

    // Notify delegate
    await sendApprovalNotification({
      userId: delegateUser._id,
      societyId: socObjectId,
      title: "Temporary Approval Authority Delegated",
      message: `${session.name} has delegated ${delegatedRole} approval authority to you from ${start.toLocaleDateString()} to ${end.toLocaleDateString()}. Reason: ${reason.trim()}`,
      eventType: "SERVICE_REQUEST_DELEGATION_ASSIGNED",
      actionUrl: "/management/approvals",
    });

    return NextResponse.json({
      success: true,
      message: `Approval authority successfully delegated to ${delegateUser.name}.`,
      delegation,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create delegation";
    console.error("[Delegations POST Error]", message);
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
    const delegationId = searchParams.get("id");
    const reason = searchParams.get("reason") || "Revoked by delegating official";

    if (!delegationId) {
      return NextResponse.json({ error: "delegation id required" }, { status: 400 });
    }

    const delegation = await ApprovalDelegation.findById(delegationId);
    if (!delegation) {
      return NextResponse.json({ error: "Delegation not found" }, { status: 404 });
    }

    // Only delegator or Super Admin can revoke
    if (!session.isSuperAdmin && delegation.delegatorUserId.toString() !== session.id) {
      return NextResponse.json(
        { error: "Forbidden: Only the delegating official or Super Admin can revoke this delegation." },
        { status: 403 }
      );
    }

    delegation.status = "REVOKED";
    delegation.revokedAt = new Date();
    delegation.revokedByUserId = new Types.ObjectId(session.id);
    delegation.revocationReason = reason;
    await delegation.save();

    await AuditEvent.create({
      societyId: delegation.societyId,
      userId: new Types.ObjectId(session.id),
      action: "APPROVAL_DELEGATION_REVOKED",
      entityType: "ApprovalDelegation",
      entityId: delegation._id.toString(),
      details: {
        delegateName: delegation.delegateName,
        reason,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Delegation to ${delegation.delegateName} revoked successfully.`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to revoke delegation";
    console.error("[Delegations DELETE Error]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
