import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/session";
import { connectDB } from "@/lib/db";
import { OwnershipTransfer } from "@/models";
import { COMMITTEE_ROLES, MembershipRole } from "@/lib/rbac";
import { recordSocietyTransferDecision } from "@/lib/ownership/transfer-service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ transferId: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { transferId } = await params;
    await connectDB();

    const transfer = await OwnershipTransfer.findById(transferId);
    if (!transfer) {
      return NextResponse.json({ error: "Transfer record not found." }, { status: 404 });
    }

    // Must be verified committee member
    const committeeMembership = session.memberships?.find(
      (m) =>
        m.status === "VERIFIED" &&
        COMMITTEE_ROLES.includes(m.role as MembershipRole) &&
        m.societyId === transfer.societyId.toString()
    );

    if (!committeeMembership && !session.isSuperAdmin) {
      return NextResponse.json(
        { error: "Forbidden: Only authorized Society Management officials can record transfer decisions." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { action, comments } = body;

    if (!["APPROVE", "REQUEST_CORRECTION", "REJECT"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be 'APPROVE', 'REQUEST_CORRECTION', or 'REJECT'." },
        { status: 400 }
      );
    }

    const updated = await recordSocietyTransferDecision(
      {
        id: session.id,
        name: session.name,
        role: committeeMembership?.role || "SECRETARY",
      },
      transferId,
      action,
      comments
    );

    return NextResponse.json({
      success: true,
      message:
        action === "APPROVE"
          ? "Ownership transfer approved. Now pending final statutory completion."
          : action === "REQUEST_CORRECTION"
          ? "Correction request dispatched to current owner."
          : "Ownership transfer rejected.",
      status: updated.status,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to record transfer decision";
    console.error("[Ownership Transfer Decision Error]", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
