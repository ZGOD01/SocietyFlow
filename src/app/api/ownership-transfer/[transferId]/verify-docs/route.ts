import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { getServerSession } from "@/lib/session";
import { connectDB } from "@/lib/db";
import { OwnershipTransfer, AuditEvent } from "@/models";
import { COMMITTEE_ROLES, MembershipRole } from "@/lib/rbac";

export async function PATCH(
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
    const isCommittee = session.memberships?.some(
      (m) =>
        m.status === "VERIFIED" &&
        COMMITTEE_ROLES.includes(m.role as MembershipRole) &&
        m.societyId === transfer.societyId.toString()
    );

    if (!isCommittee && !session.isSuperAdmin) {
      return NextResponse.json(
        { error: "Forbidden: Only authorized Society Management may verify transfer documents." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { documentId, verified, verificationNote } = body;

    const docItem = transfer.documents.find(
      (d) => (d as unknown as { _id?: Types.ObjectId })._id?.toString() === documentId || d.name === documentId
    );

    if (!docItem) {
      return NextResponse.json({ error: "Target document not found in transfer checklist." }, { status: 404 });
    }

    docItem.verified = !!verified;
    if (verificationNote !== undefined) {
      docItem.verificationNote = verificationNote.trim();
    }

    transfer.timeline.push({
      stage: "DOCUMENT_VERIFICATION",
      status: transfer.status,
      performedBy: new Types.ObjectId(session.id),
      performerName: session.name,
      performerRole: "COMMITTEE",
      comments: `Document '${docItem.name}' marked as ${verified ? "VERIFIED" : "UNVERIFIED"}${
        verificationNote ? `: ${verificationNote}` : ""
      }`,
      timestamp: new Date(),
    });

    await transfer.save();

    await AuditEvent.create({
      societyId: transfer.societyId,
      userId: new Types.ObjectId(session.id),
      action: "OWNERSHIP_TRANSFER_DOCUMENT_VERIFIED",
      details: {
        transferId: transfer._id.toString(),
        documentName: docItem.name,
        verified,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Document '${docItem.name}' verification updated.`,
      documents: transfer.documents,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update document verification";
    console.error("[Ownership Transfer Doc Verification Error]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
