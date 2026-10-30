import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import crypto from "crypto";
import { getServerSession } from "@/lib/session";
import { connectDB } from "@/lib/db";
import {
  DocumentModel,
  DocumentVersion,
  DocumentAuditEvent,
  OnboardingDocType,
} from "@/models";
import {
  isR2Configured,
  validateFileMetadata,
  generateR2ObjectKey,
  uploadObjectDirect,
  generatePresignedDownloadUrl,
} from "@/lib/r2";

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Query active onboarding documents uploaded by current user
    const docs = await DocumentModel.find({
      ownerUserId: new Types.ObjectId(session.id),
      onboardingDocType: { $exists: true, $ne: null },
      isArchived: false,
    }).sort({ createdAt: -1 });

    const enrichedDocs = await Promise.all(
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
          onboardingDocType: doc.onboardingDocType,
          displayName: doc.displayName,
          originalFilename: doc.originalFilename,
          size: doc.size,
          mimeType: doc.mimeType,
          version: doc.version,
          verificationStatus: doc.verificationStatus,
          correctionNote: doc.correctionNote,
          createdAt: doc.createdAt.toISOString(),
          viewUrl,
          downloadUrl,
        };
      })
    );

    const isOwner = session.activeRole === "OWNER";
    const uploadedTypes = new Set(docs.map((d) => d.onboardingDocType));

    const ownerRequired: OnboardingDocType[] = [
      "SHARE_CERTIFICATE",
      "SALE_DEED",
      "POSSESSION_LETTER",
    ];
    const tenantRequired: OnboardingDocType[] = [
      "LEAVE_LICENSE",
      "IDENTITY_PROOF",
      "POLICE_VERIFICATION",
    ];

    const requiredList = isOwner ? ownerRequired : tenantRequired;
    const allUploaded = requiredList.every((req) => uploadedTypes.has(req));

    return NextResponse.json({
      success: true,
      r2Configured: isR2Configured(),
      documents: enrichedDocs,
      allUploaded,
      role: session.activeRole,
      requiredCount: requiredList.length,
      uploadedCount: requiredList.filter((req) => uploadedTypes.has(req)).length,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load onboarding documents";
    console.error("[Onboarding GET Error]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const docType = formData.get("onboardingDocType") as OnboardingDocType | null;

    if (!file) {
      return NextResponse.json({ error: "No file was uploaded." }, { status: 400 });
    }
    if (!docType) {
      return NextResponse.json({ error: "Missing onboarding document category." }, { status: 400 });
    }

    // 1. File Validation
    const validation = validateFileMetadata(file.type, file.size, file.name);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    await connectDB();

    const buffer = Buffer.from(await file.arrayBuffer());
    const societyId = session.activeSocietyId
      ? new Types.ObjectId(session.activeSocietyId)
      : undefined;
    const flatId = session.occupancies?.[0]?.flatId
      ? new Types.ObjectId(session.occupancies[0].flatId)
      : undefined;

    const documentId = `doc_${crypto.randomUUID()}`;
    const r2ObjectKey = generateR2ObjectKey({
      societyId: session.activeSocietyId,
      scope: "PROPERTY",
      documentId,
      originalFilename: file.name,
    });

    // 2. Upload to Cloudflare R2 / Dev Storage
    const uploadRes = await uploadObjectDirect({
      r2ObjectKey,
      buffer,
      mimeType: file.type || "application/pdf",
    });

    // 3. Handle replacement if document of this type already exists for user
    const existingDoc = await DocumentModel.findOne({
      ownerUserId: new Types.ObjectId(session.id),
      onboardingDocType: docType,
      isArchived: false,
    });

    let newVersionNumber = 1;
    let savedDoc;

    if (existingDoc) {
      // Create version record of previous state
      await DocumentVersion.create({
        documentId: existingDoc._id,
        versionNumber: existingDoc.version,
        originalFilename: existingDoc.originalFilename,
        r2ObjectKey: existingDoc.r2ObjectKey,
        size: existingDoc.size,
        mimeType: existingDoc.mimeType,
        uploadedBy: new Types.ObjectId(session.id),
        changeNote: "Replaced during resident onboarding checklist.",
      });

      newVersionNumber = existingDoc.version + 1;

      // Update existing document with new storage key and details
      existingDoc.r2ObjectKey = r2ObjectKey;
      existingDoc.originalFilename = file.name;
      existingDoc.displayName = file.name;
      existingDoc.mimeType = file.type;
      existingDoc.size = file.size;
      existingDoc.version = newVersionNumber;
      existingDoc.verificationStatus = "PENDING";
      existingDoc.correctionNote = undefined;
      savedDoc = await existingDoc.save();
    } else {
      // Create new document record
      savedDoc = await DocumentModel.create({
        documentId,
        societyId,
        flatId,
        ownerUserId: new Types.ObjectId(session.id),
        scope: "PROPERTY",
        category: docType,
        originalFilename: file.name,
        displayName: file.name,
        mimeType: file.type,
        size: file.size,
        r2ObjectKey,
        r2Bucket: "societyflow-vault-docs",
        verificationStatus: "PENDING",
        version: 1,
        visibility: "MANAGEMENT_ONLY",
        onboardingDocType: docType,
        quarantineStatus: "CLEAN",
        isArchived: false,
      });
    }

    // 4. Audit Trail
    await DocumentAuditEvent.create({
      documentId: savedDoc._id,
      userId: new Types.ObjectId(session.id),
      action: existingDoc ? "REPLACE" : "UPLOAD",
      ipAddress: req.headers.get("x-forwarded-for") || undefined,
      userAgent: req.headers.get("user-agent") || undefined,
      details: {
        onboardingDocType: docType,
        filename: file.name,
        size: file.size,
        storageMode: uploadRes.storage,
        version: newVersionNumber,
      },
    });

    // 5. Check if all required onboarding documents are now present
    const isOwner = session.activeRole === "OWNER";
    const allUserDocs = await DocumentModel.find({
      ownerUserId: new Types.ObjectId(session.id),
      onboardingDocType: { $exists: true, $ne: null },
      isArchived: false,
    });

    const uploadedTypes = new Set(allUserDocs.map((d) => d.onboardingDocType));
    const ownerRequired: OnboardingDocType[] = [
      "SHARE_CERTIFICATE",
      "SALE_DEED",
      "POSSESSION_LETTER",
    ];
    const tenantRequired: OnboardingDocType[] = [
      "LEAVE_LICENSE",
      "IDENTITY_PROOF",
      "POLICE_VERIFICATION",
    ];
    const requiredList = isOwner ? ownerRequired : tenantRequired;
    const allUploaded = requiredList.every((reqType) => uploadedTypes.has(reqType));

    const { downloadUrl: viewUrl } = await generatePresignedDownloadUrl({
      r2ObjectKey,
      displayName: savedDoc.displayName,
      disposition: "inline",
    });

    return NextResponse.json({
      success: true,
      message: `Document for ${docType.replace(/_/g, " ")} uploaded successfully.`,
      document: {
        id: savedDoc._id.toString(),
        documentId: savedDoc.documentId,
        onboardingDocType: savedDoc.onboardingDocType,
        displayName: savedDoc.displayName,
        originalFilename: savedDoc.originalFilename,
        size: savedDoc.size,
        version: savedDoc.version,
        viewUrl,
      },
      allUploaded,
      r2Configured: isR2Configured(),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to upload document";
    console.error("[Onboarding Upload Error]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
