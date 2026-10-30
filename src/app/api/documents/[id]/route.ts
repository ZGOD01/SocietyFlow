import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { getServerSession } from "@/lib/session";
import { connectDB } from "@/lib/db";
import { DocumentModel, DocumentAuditEvent } from "@/models";
import {
  generatePresignedDownloadUrl,
  deleteObjectDirect,
} from "@/lib/r2";
import { COMMITTEE_ROLES, MembershipRole } from "@/lib/rbac";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();

    const doc = await DocumentModel.findOne({
      $or: [
        { _id: Types.ObjectId.isValid(id) ? new Types.ObjectId(id) : undefined },
        { documentId: id },
      ],
      isArchived: false,
    });

    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Permission check
    const isOwner = doc.ownerUserId.toString() === session.id;
    const isSuperAdmin = session.isSuperAdmin;
    const isSameSociety =
      doc.societyId &&
      session.activeSocietyId &&
      doc.societyId.toString() === session.activeSocietyId;
    const isManagement =
      isSameSociety &&
      session.memberships?.some(
        (m) =>
          m.status === "VERIFIED" &&
          COMMITTEE_ROLES.includes(m.role as MembershipRole)
      );

    let canAccess = false;
    if (isSuperAdmin || isOwner) {
      canAccess = true;
    } else if (doc.scope === "PRIVATE") {
      canAccess = false;
    } else if (doc.scope === "PROPERTY" && isManagement) {
      canAccess = true;
    } else if (doc.scope === "SOCIETY" && isSameSociety) {
      if (doc.visibility === "ALL_RESIDENTS") canAccess = true;
      else if (doc.visibility === "OWNERS_ONLY" && (session.activeRole === "OWNER" || isManagement)) canAccess = true;
      else if (doc.visibility === "TENANTS_ONLY" && (session.activeRole === "TENANT" || isManagement)) canAccess = true;
      else if (doc.visibility === "MANAGEMENT_ONLY" && isManagement) canAccess = true;
    }

    if (!canAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

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

    return NextResponse.json({
      success: true,
      document: {
        id: doc._id.toString(),
        documentId: doc.documentId,
        displayName: doc.displayName,
        originalFilename: doc.originalFilename,
        category: doc.category,
        scope: doc.scope,
        size: doc.size,
        mimeType: doc.mimeType,
        version: doc.version,
        verificationStatus: doc.verificationStatus,
        visibility: doc.visibility,
        description: doc.description,
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString(),
        viewUrl,
        downloadUrl,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load document";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { displayName, description, category } = body;

    await connectDB();

    const doc = await DocumentModel.findOne({
      $or: [
        { _id: Types.ObjectId.isValid(id) ? new Types.ObjectId(id) : undefined },
        { documentId: id },
      ],
      isArchived: false,
    });

    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Only document owner or super admin can edit metadata
    if (doc.ownerUserId.toString() !== session.id && !session.isSuperAdmin) {
      return NextResponse.json({ error: "Forbidden: You cannot modify this document." }, { status: 403 });
    }

    if (displayName?.trim()) {
      doc.displayName = displayName.trim();
    }
    if (typeof description === "string") {
      doc.description = description.trim();
    }
    if (category?.trim()) {
      doc.category = category.trim();
    }

    await doc.save();

    await DocumentAuditEvent.create({
      documentId: doc._id,
      userId: new Types.ObjectId(session.id),
      action: "RENAME",
      ipAddress: req.headers.get("x-forwarded-for") || undefined,
      userAgent: req.headers.get("user-agent") || undefined,
      details: {
        newDisplayName: doc.displayName,
        newCategory: doc.category,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Document updated successfully.",
      document: {
        id: doc._id.toString(),
        displayName: doc.displayName,
        category: doc.category,
        description: doc.description,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update document";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();

    const doc = await DocumentModel.findOne({
      $or: [
        { _id: Types.ObjectId.isValid(id) ? new Types.ObjectId(id) : undefined },
        { documentId: id },
      ],
      isArchived: false,
    });

    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const isOwner = doc.ownerUserId.toString() === session.id;
    const isSuperAdmin = session.isSuperAdmin;

    // Protection: Required onboarding documents cannot be deleted if active
    if (doc.onboardingDocType) {
      return NextResponse.json(
        { error: "Cannot delete statutory onboarding documents. Use the 'Replace Document' option instead." },
        { status: 400 }
      );
    }

    if (!isOwner && !isSuperAdmin) {
      return NextResponse.json({ error: "Forbidden: You cannot delete this document." }, { status: 403 });
    }

    // Soft delete / archive
    doc.isArchived = true;
    await doc.save();

    // Optionally delete from R2
    await deleteObjectDirect(doc.r2ObjectKey);

    await DocumentAuditEvent.create({
      documentId: doc._id,
      userId: new Types.ObjectId(session.id),
      action: "DELETE",
      ipAddress: req.headers.get("x-forwarded-for") || undefined,
      userAgent: req.headers.get("user-agent") || undefined,
      details: {
        filename: doc.originalFilename,
        scope: doc.scope,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Document deleted successfully.",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete document";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
