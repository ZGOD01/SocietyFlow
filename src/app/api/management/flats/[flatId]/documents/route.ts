import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { getServerSession } from "@/lib/session";
import { connectDB } from "@/lib/db";
import {
  Flat,
  FlatOccupancy,
  DocumentModel,
  DocumentVersion,
  DocumentAuditEvent,
  Notification,
} from "@/models";
import { COMMITTEE_ROLES, MembershipRole } from "@/lib/rbac";
import { generatePresignedDownloadUrl } from "@/lib/r2";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ flatId: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { flatId } = await params;
    await connectDB();

    // Verify user is management of this society
    const isManagement = session.memberships?.some(
      (m) =>
        m.status === "VERIFIED" &&
        COMMITTEE_ROLES.includes(m.role as MembershipRole)
    );

    if (!isManagement && !session.isSuperAdmin) {
      return NextResponse.json(
        { error: "Forbidden: Management privileges required." },
        { status: 403 }
      );
    }

    const flat = await Flat.findById(flatId)
      .populate("buildingId", "name")
      .populate("wingId", "name");

    if (!flat) {
      return NextResponse.json({ error: "Flat not found" }, { status: 404 });
    }

    // Check cross-society isolation: management cannot access flats of other societies
    if (
      !session.isSuperAdmin &&
      session.activeSocietyId &&
      flat.societyId.toString() !== session.activeSocietyId
    ) {
      return NextResponse.json(
        { error: "Forbidden: Cross-society access is prohibited." },
        { status: 403 }
      );
    }

    // Get registered occupancies
    const occupancies = await FlatOccupancy.find({
      flatId: flat._id,
      status: "APPROVED",
    }).populate("userId", "name email phone avatarUrl");

    // Get ONLY property documents (Never private personal vault files)
    const propertyDocs = await DocumentModel.find({
      flatId: flat._id,
      scope: "PROPERTY",
      isArchived: false,
    }).populate("ownerUserId", "name email");

    const enrichedDocs = await Promise.all(
      propertyDocs.map(async (doc) => {
        const { downloadUrl: viewUrl } = await generatePresignedDownloadUrl({
          r2ObjectKey: doc.r2ObjectKey,
          displayName: doc.displayName,
          disposition: "inline",
        });

        const { downloadUrl } = await generatePresignedDownloadUrl({
          r2ObjectKey: doc.r2ObjectKey,
          displayName: doc.displayName,
          disposition: "attachment",
        });

        // Fetch version history if any
        const versions = await DocumentVersion.find({ documentId: doc._id })
          .sort({ versionNumber: -1 })
          .populate("uploadedBy", "name email");

        return {
          id: doc._id.toString(),
          documentId: doc.documentId,
          displayName: doc.displayName,
          originalFilename: doc.originalFilename,
          category: doc.category,
          onboardingDocType: doc.onboardingDocType,
          size: doc.size,
          mimeType: doc.mimeType,
          version: doc.version,
          verificationStatus: doc.verificationStatus,
          correctionNote: doc.correctionNote,
          uploadedBy: doc.ownerUserId,
          createdAt: doc.createdAt.toISOString(),
          viewUrl,
          downloadUrl,
          versions: versions.map((v) => ({
            versionNumber: v.versionNumber,
            originalFilename: v.originalFilename,
            size: v.size,
            uploadedBy: v.uploadedBy,
            changeNote: v.changeNote,
            createdAt: v.createdAt.toISOString(),
          })),
        };
      })
    );

    return NextResponse.json({
      success: true,
      flat: {
        id: flat._id.toString(),
        flatNumber: flat.flatNumber,
        floor: flat.floor,
        buildingName: (flat.buildingId as { name?: string })?.name,
        wingName: (flat.wingId as { name?: string })?.name,
      },
      occupancies,
      documents: enrichedDocs,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load flat documents";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ flatId: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { flatId } = await params;
    const body = await req.json();
    const { documentId, action, correctionNote } = body;

    if (!documentId || !["VERIFY", "REQUEST_CORRECTION"].includes(action)) {
      return NextResponse.json({ error: "Invalid verification action." }, { status: 400 });
    }

    await connectDB();

    const isManagement = session.memberships?.some(
      (m) =>
        m.status === "VERIFIED" &&
        COMMITTEE_ROLES.includes(m.role as MembershipRole)
    );

    if (!isManagement && !session.isSuperAdmin) {
      return NextResponse.json({ error: "Forbidden: Management authorization required." }, { status: 403 });
    }

    const doc = await DocumentModel.findOne({
      _id: new Types.ObjectId(documentId),
      flatId: new Types.ObjectId(flatId),
      isArchived: false,
    });

    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    if (action === "VERIFY") {
      doc.verificationStatus = "VERIFIED";
      doc.verifiedBy = new Types.ObjectId(session.id);
      doc.verifiedAt = new Date();
      doc.correctionNote = undefined;
    } else {
      doc.verificationStatus = "CORRECTION_REQUESTED";
      doc.correctionNote = correctionNote?.trim() || "Managing committee requested a clearer document copy.";
    }

    await doc.save();

    // Audit Trail
    await DocumentAuditEvent.create({
      documentId: doc._id,
      userId: new Types.ObjectId(session.id),
      action: action === "VERIFY" ? "VERIFY" : "REQUEST_CORRECTION",
      ipAddress: req.headers.get("x-forwarded-for") || undefined,
      userAgent: req.headers.get("user-agent") || undefined,
      details: {
        verificationStatus: doc.verificationStatus,
        correctionNote: doc.correctionNote,
      },
    });

    // Notify document owner
    await Notification.create({
      userId: doc.ownerUserId,
      societyId: doc.societyId,
      title: action === "VERIFY" ? "Document Verified by Society" : "Document Correction Requested",
      message:
        action === "VERIFY"
          ? `Your document "${doc.displayName}" has been verified by the Managing Committee.`
          : `Managing Committee requested corrections for "${doc.displayName}": ${doc.correctionNote}`,
      type: action === "VERIFY" ? "success" : "action_required",
      eventType: action === "VERIFY" ? "GENERAL" : "MORE_INFO_REQUESTED",
      actionUrl: "/documents",
    });

    return NextResponse.json({
      success: true,
      message: `Document status updated to ${doc.verificationStatus}.`,
      verificationStatus: doc.verificationStatus,
      correctionNote: doc.correctionNote,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update document status";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
