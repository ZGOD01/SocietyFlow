import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import crypto from "crypto";
import { getServerSession } from "@/lib/session";
import { connectDB } from "@/lib/db";
import {
  DocumentModel,
  DocumentAuditEvent,
  DocumentVisibility,
} from "@/models";
import {
  isR2Configured,
  validateFileMetadata,
  generateR2ObjectKey,
  uploadObjectDirect,
  generatePresignedDownloadUrl,
} from "@/lib/r2";
import { COMMITTEE_ROLES, MembershipRole } from "@/lib/rbac";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!session.activeSocietyId) {
      return NextResponse.json({ documents: [], total: 0 });
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search")?.trim().toLowerCase();

    await connectDB();

    const isManagement = session.memberships?.some(
      (m) =>
        m.status === "VERIFIED" &&
        COMMITTEE_ROLES.includes(m.role as MembershipRole)
    );

    const visConditions: Record<string, unknown>[] = [{ visibility: "ALL_RESIDENTS" }];
    if (session.activeRole === "OWNER" || isManagement) {
      visConditions.push({ visibility: "OWNERS_ONLY" });
    }
    if (session.activeRole === "TENANT" || isManagement) {
      visConditions.push({ visibility: "TENANTS_ONLY" });
    }
    if (isManagement) {
      visConditions.push({ visibility: "MANAGEMENT_ONLY" });
    }

    const andConditions: Record<string, unknown>[] = [
      { societyId: new Types.ObjectId(session.activeSocietyId) },
      { scope: "SOCIETY" },
      { isArchived: false },
      { $or: visConditions },
    ];

    if (category && category !== "ALL") {
      andConditions.push({ category });
    }

    if (search) {
      andConditions.push({
        $or: [
          { displayName: { $regex: search, $options: "i" } },
          { originalFilename: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
        ],
      });
    }

    const docs = await DocumentModel.find({ $and: andConditions })
      .sort({ createdAt: -1 })
      .populate("ownerUserId", "name email");

    const enriched = await Promise.all(
      docs.map(async (doc) => {
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

        return {
          id: doc._id.toString(),
          documentId: doc.documentId,
          displayName: doc.displayName,
          originalFilename: doc.originalFilename,
          category: doc.category,
          size: doc.size,
          mimeType: doc.mimeType,
          visibility: doc.visibility,
          description: doc.description,
          version: doc.version,
          uploadedBy: doc.ownerUserId,
          createdAt: doc.createdAt.toISOString(),
          viewUrl,
          downloadUrl,
        };
      })
    );

    return NextResponse.json({
      success: true,
      documents: enriched,
      total: enriched.length,
      isManagement,
      r2Configured: isR2Configured(),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load society documents";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!session.activeSocietyId) {
      return NextResponse.json({ error: "No active society context." }, { status: 400 });
    }

    const isManagement = session.memberships?.some(
      (m) =>
        m.status === "VERIFIED" &&
        COMMITTEE_ROLES.includes(m.role as MembershipRole)
    );

    if (!isManagement && !session.isSuperAdmin) {
      return NextResponse.json(
        { error: "Forbidden: Only authorized Society Management can publish official society documents." },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const displayName = (formData.get("displayName") as string)?.trim();
    const category = (formData.get("category") as string)?.trim() || "OTHER";
    const visibility = (formData.get("visibility") as DocumentVisibility) || "ALL_RESIDENTS";
    const description = (formData.get("description") as string)?.trim();

    if (!file) {
      return NextResponse.json({ error: "Please select a file to publish." }, { status: 400 });
    }

    const validation = validateFileMetadata(file.type, file.size, file.name);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    await connectDB();

    const buffer = Buffer.from(await file.arrayBuffer());
    const documentId = `soc_doc_${crypto.randomUUID()}`;
    const r2ObjectKey = generateR2ObjectKey({
      societyId: session.activeSocietyId,
      scope: "SOCIETY",
      documentId,
      originalFilename: file.name,
    });

    const uploadRes = await uploadObjectDirect({
      r2ObjectKey,
      buffer,
      mimeType: file.type || "application/pdf",
    });

    const doc = await DocumentModel.create({
      documentId,
      societyId: new Types.ObjectId(session.activeSocietyId),
      ownerUserId: new Types.ObjectId(session.id),
      scope: "SOCIETY",
      category,
      originalFilename: file.name,
      displayName: displayName || file.name,
      mimeType: file.type,
      size: file.size,
      r2ObjectKey,
      r2Bucket: "societyflow-vault-docs",
      verificationStatus: "VERIFIED",
      version: 1,
      visibility,
      description,
      quarantineStatus: "CLEAN",
      isArchived: false,
    });

    await DocumentAuditEvent.create({
      documentId: doc._id,
      userId: new Types.ObjectId(session.id),
      action: "UPLOAD",
      ipAddress: req.headers.get("x-forwarded-for") || undefined,
      userAgent: req.headers.get("user-agent") || undefined,
      details: {
        filename: file.name,
        size: file.size,
        visibility,
        category,
        storageMode: uploadRes.storage,
      },
    });

    const { downloadUrl: viewUrl } = await generatePresignedDownloadUrl({
      r2ObjectKey,
      displayName: doc.displayName,
      disposition: "inline",
    });

    const { downloadUrl } = await generatePresignedDownloadUrl({
      r2ObjectKey,
      displayName: doc.displayName,
      disposition: "attachment",
    });

    return NextResponse.json({
      success: true,
      message: `Document "${doc.displayName}" published to Society Library.`,
      document: {
        id: doc._id.toString(),
        documentId: doc.documentId,
        displayName: doc.displayName,
        category: doc.category,
        visibility: doc.visibility,
        size: doc.size,
        createdAt: doc.createdAt.toISOString(),
        viewUrl,
        downloadUrl,
      },
      r2Configured: isR2Configured(),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to publish society document";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
