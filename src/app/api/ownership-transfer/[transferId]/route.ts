import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { getServerSession } from "@/lib/session";
import { connectDB } from "@/lib/db";
import { OwnershipTransfer, SocietyMembership } from "@/models";
import { COMMITTEE_ROLES, MembershipRole } from "@/lib/rbac";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ transferId: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { transferId } = await params;
    if (!Types.ObjectId.isValid(transferId)) {
      return NextResponse.json({ error: "Invalid transfer ID." }, { status: 400 });
    }

    await connectDB();

    const transfer = await OwnershipTransfer.findById(transferId)
      .populate("flatId")
      .populate("societyId", "name code city registrationNumber")
      .lean();

    if (!transfer) {
      return NextResponse.json({ error: "Ownership transfer record not found." }, { status: 404 });
    }

    const userId = session.id;
    const userEmail = session.email.toLowerCase();

    // Check if committee member
    const isCommittee = session.memberships?.some(
      (m) =>
        m.status === "VERIFIED" &&
        COMMITTEE_ROLES.includes(m.role as MembershipRole) &&
        m.societyId === transfer.societyId?._id?.toString()
    );

    const isCurrentOwner = transfer.currentOwnerId.toString() === userId;
    const isProposedOwner =
      transfer.proposedOwner.email.toLowerCase() === userEmail ||
      (transfer.proposedOwner.existingUserId &&
        transfer.proposedOwner.existingUserId.toString() === userId);

    if (!isCommittee && !isCurrentOwner && !isProposedOwner && !session.isSuperAdmin) {
      return NextResponse.json(
        { error: "Access denied. You are not authorized to view this property transfer record." },
        { status: 403 }
      );
    }

    return NextResponse.json({
      transfer,
      userRole: isCommittee
        ? "COMMITTEE"
        : isCurrentOwner
        ? "CURRENT_OWNER"
        : isProposedOwner
        ? "PROPOSED_OWNER"
        : "ADMIN",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load transfer details";
    console.error("[Ownership Transfer Detail GET Error]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
