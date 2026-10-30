import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { getServerSession } from "@/lib/session";
import { connectDB } from "@/lib/db";
import {
  OwnershipTransfer,
  FlatOccupancy,
  Flat,
  Society,
  SocietyMembership,
} from "@/models";
import { COMMITTEE_ROLES, MembershipRole } from "@/lib/rbac";
import { initiateOwnershipTransfer } from "@/lib/ownership/transfer-service";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const societyId = searchParams.get("societyId") || session.activeSocietyId;
    const filterRole = searchParams.get("role"); // "OWNER" | "MANAGEMENT" | "INCOMING"

    const isCommittee = session.memberships?.some(
      (m) =>
        m.status === "VERIFIED" &&
        COMMITTEE_ROLES.includes(m.role as MembershipRole) &&
        (!societyId || m.societyId === societyId)
    );

    const userObjectId = new Types.ObjectId(session.id);
    const userEmail = session.email.toLowerCase();

    const query: Record<string, unknown> = {};

    if (filterRole === "MANAGEMENT" && isCommittee) {
      if (societyId) query.societyId = new Types.ObjectId(societyId);
    } else if (filterRole === "INCOMING") {
      query.$or = [
        { "proposedOwner.email": userEmail },
        { "proposedOwner.existingUserId": userObjectId },
      ];
    } else if (filterRole === "OWNER") {
      query.currentOwnerId = userObjectId;
    } else {
      // Default: transfers related to this user
      if (isCommittee && societyId) {
        query.societyId = new Types.ObjectId(societyId);
      } else {
        query.$or = [
          { currentOwnerId: userObjectId },
          { "proposedOwner.email": userEmail },
          { "proposedOwner.existingUserId": userObjectId },
        ];
      }
    }

    const transfers = await OwnershipTransfer.find(query)
      .populate("flatId", "flatNumber floor bhkType shareCertificateNumber")
      .populate("societyId", "name code city")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      transfers: transfers.map((t) => ({
        id: t._id.toString(),
        societyId: t.societyId,
        flat: t.flatId,
        currentOwner: {
          id: t.currentOwnerId.toString(),
          name: t.currentOwnerName,
          email: t.currentOwnerEmail,
        },
        proposedOwner: t.proposedOwner,
        transferType: t.transferType,
        reason: t.reason,
        effectiveDate: t.effectiveDate,
        status: t.status,
        newOwnerAccepted: t.newOwnerAccepted,
        newOwnerAcceptedAt: t.newOwnerAcceptedAt,
        documentsCount: t.documents?.length || 0,
        activeTenanciesCount: t.activeTenancies?.length || 0,
        createdAt: t.createdAt,
      })),
      isCommittee,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load ownership transfers";
    console.error("[Ownership Transfer GET Error]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      societyId,
      flatId,
      transferType,
      reason,
      effectiveDate,
      proposedOwner,
      documents,
    } = body;

    if (!societyId || !flatId || !reason || !proposedOwner?.name || !proposedOwner?.email) {
      return NextResponse.json(
        { error: "Society, Flat, Reason, and Proposed Owner (name and email) are required." },
        { status: 400 }
      );
    }

    const transfer = await initiateOwnershipTransfer(
      { id: session.id, name: session.name, email: session.email },
      {
        societyId,
        flatId,
        transferType: transferType || "SALE",
        reason,
        effectiveDate,
        proposedOwner: {
          name: proposedOwner.name,
          email: proposedOwner.email,
          phone: proposedOwner.phone || "",
        },
        documents: documents || [],
      }
    );

    return NextResponse.json({
      success: true,
      message: "Ownership transfer initiated successfully. Awaiting new owner acceptance.",
      transferId: transfer._id.toString(),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to initiate transfer";
    console.error("[Ownership Transfer POST Error]", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
