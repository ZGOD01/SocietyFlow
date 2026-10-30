import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/session";
import { connectDB } from "@/lib/db";
import { OwnershipTransfer } from "@/models";
import { COMMITTEE_ROLES, MembershipRole } from "@/lib/rbac";
import { completeOwnershipTransfer } from "@/lib/ownership/transfer-service";

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
        { error: "Forbidden: Only authorized Society Management officials can execute transfer completion." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { newShareCertificateNumber, completionNotes } = body;

    const completed = await completeOwnershipTransfer(
      {
        id: session.id,
        name: session.name,
        role: committeeMembership?.role || "SECRETARY",
      },
      transferId,
      {
        newShareCertificateNumber,
        completionNotes,
      }
    );

    return NextResponse.json({
      success: true,
      message: "Property ownership transfer completed successfully! Unit records and member registry updated.",
      status: completed.status,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to execute transfer completion";
    console.error("[Ownership Transfer Completion Error]", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
