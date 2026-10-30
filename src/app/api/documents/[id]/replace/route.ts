import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { getServerSession } from "@/lib/session";
import { connectDB } from "@/lib/db";
import {
  DocumentModel,
  DocumentVersion,
  DocumentAuditEvent,
} from "@/models";
import {
  validateFileMetadata,
  generateR2ObjectKey,
  uploadObjectDirect,
  generatePresignedDownloadUrl,
} from "@/lib/r2";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const changeNote = (formData.get("changeNote") as string)?.trim();

    if (!file) {
      return NextResponse.json({ error: "No replacement file provided." }, { status: 400 });
    }

    const validation = validateFileMetadata(file.type, file.size, file.name);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

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
    if (!isOwner && !session.isSuperAdmin) {
      return NextResponse.json({ error: "Forbidden: You cannot replace this document." }, { status: 403 });
    }

    // 1. Archive current version to DocumentVersion collection
    await DocumentVersion.create({
      documentId: doc._id,
      versionNumber: doc.version,
      originalFilename: doc.originalFilename,
      r2ObjectKey: doc.r2ObjectKey,
      size: doc.size,
      mimeType: doc.mimeType,
      uploadedBy: new Types.ObjectId(session.id),
      changeNote: changeNote || `Replaced with new file ${file.name}`,
    });

    // 2. Upload new version to R2 / storage
    const buffer = Buffer.from(await file.arrayBuffer());
    const newR2ObjectKey = generateR2ObjectKey({
      societyId: doc.societyId?.toString(),
      scope: doc.scope,
      documentId: doc.documentId,
      originalFilename: file.name,
    });

    await uploadObjectDirect({
      r2ObjectKey: newR2ObjectKey,
      buffer,
      mimeType: file.type || "application/pdf",
    });

    // 3. Update DocumentModel record
    const nextVersion = doc.version + 1;
    doc.version = nextVersion;
    doc.r2ObjectKey = newR2ObjectKey;
    doc.originalFilename = file.name;
    doc.displayName = file.name;
    doc.mimeType = file.type;
    doc.size = file.size;
    doc.verificationStatus = "PENDING"; // Needs re-verification after replacement
    doc.correctionNote = undefined;
    await doc.save();

    // 4. Audit Trail
    await DocumentAuditEvent.create({
      documentId: doc._id,
      userId: new Types.ObjectId(session.id),
      action: "REPLACE",
      ipAddress: req.headers.get("x-forwarded-for") || undefined,
      userAgent: req.headers.get("user-agent") || undefined,
      details: {
        newVersion: nextVersion,
        filename: file.name,
        size: file.size,
        changeNote,
      },
    });

    const { downloadUrl: viewUrl } = await generatePresignedDownloadUrl({
      r2ObjectKey: doc.r2ObjectKey,
      displayName: doc.displayName,
      disposition: "inline",
    });

    return NextResponse.json({
      success: true,
      message: `Document updated to Version ${nextVersion}.`,
      document: {
        id: doc._id.toString(),
        documentId: doc.documentId,
        displayName: doc.displayName,
        version: doc.version,
        size: doc.size,
        mimeType: doc.mimeType,
        viewUrl,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to replace document";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
