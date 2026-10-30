import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import crypto from "crypto";
import { getServerSession } from "@/lib/session";
import { connectDB } from "@/lib/db";
import { DocumentModel } from "@/models";
import {
  validateFileMetadata,
  generateR2ObjectKey,
  uploadObjectDirect,
  getR2Config,
} from "@/lib/r2";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const displayName = (formData.get("displayName") as string) || "Attached Request Document";
    const category = (formData.get("category") as string) || "REQUEST_ATTACHMENT";
    const flatId = formData.get("flatId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate size and mime type
    const validation = validateFileMetadata(file.type, file.size, file.name);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const activeSocietyId =
      session.activeSocietyId || session.memberships?.[0]?.societyId;

    const documentId = `req-doc-${crypto.randomUUID()}`;
    const r2ObjectKey = generateR2ObjectKey({
      societyId: activeSocietyId,
      scope: "REQUEST",
      documentId,
      originalFilename: file.name,
    });

    const r2Config = getR2Config();
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // Upload to Cloudflare R2
    await uploadObjectDirect({
      r2ObjectKey,
      buffer: fileBuffer,
      mimeType: file.type,
    });

    // Save document metadata in MongoDB
    const docRecord = await DocumentModel.create({
      documentId,
      societyId: activeSocietyId ? new Types.ObjectId(activeSocietyId) : undefined,
      flatId: flatId && Types.ObjectId.isValid(flatId) ? new Types.ObjectId(flatId) : undefined,
      ownerUserId: new Types.ObjectId(session.id),
      scope: "REQUEST",
      category,
      originalFilename: file.name,
      displayName: displayName.trim(),
      mimeType: file.type,
      size: file.size,
      r2ObjectKey,
      r2Bucket: r2Config.bucketName,
      verificationStatus: "PENDING",
      version: 1,
      visibility: "PRIVATE",
      tags: ["service_request"],
      quarantineStatus: "CLEAN",
      isArchived: false,
    });

    return NextResponse.json({
      success: true,
      attachment: {
        documentId: docRecord.documentId,
        displayName: docRecord.displayName,
        originalFilename: docRecord.originalFilename,
        category: docRecord.category,
        size: docRecord.size,
        mimeType: docRecord.mimeType,
        r2ObjectKey: docRecord.r2ObjectKey,
        isRequired: false,
        uploadedAt: docRecord.createdAt,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to upload attachment";
    console.error("POST /api/requests/attachments error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
