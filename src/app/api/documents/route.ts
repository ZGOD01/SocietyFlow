import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import crypto from "crypto";
import { getServerSession } from "@/lib/session";
import { connectDB } from "@/lib/db";
import {
  DocumentModel,
  DocumentAuditEvent,
  DocumentScope,
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

    const { searchParams } = new URL(req.url);
    const scopeParam = searchParams.get("scope") as DocumentScope | "ALL" | null;
    const categoryParam = searchParams.get("category");
    const searchQuery = searchParams.get("search")?.trim().toLowerCase();
    const sortParam = searchParams.get("sort") || "newest";

    await connectDB();

    const isManagement = session.memberships?.some(
      (m) =>
        m.status === "VERIFIED" &&
        COMMITTEE_ROLES.includes(m.role as MembershipRole)
    );
    const activeSocietyId = session.activeSocietyId
      ? new Types.ObjectId(session.activeSocietyId)
      : undefined;
    const userFlatId = session.occupancies?.[0]?.flatId
      ? new Types.ObjectId(session.occupancies[0].flatId)
      : undefined;

    // Build filter based on user permissions
    const andFilters: Record<string, unknown>[] = [{ isArchived: false }];

    if (scopeParam === "PRIVATE") {
      // STRICT PRIVACY: Only current user can view their private documents
      andFilters.push({
        ownerUserId: new Types.ObjectId(session.id),
        scope: "PRIVATE",
      });
    } else if (scopeParam === "PROPERTY") {
      if (isManagement && activeSocietyId) {
        // Management can view all property documents in their society
        andFilters.push({
          societyId: activeSocietyId,
          scope: "PROPERTY",
        });
      } else if (session.activeRole === "TENANT") {
        // TENANTS: Only see documents they own / uploaded for their tenancy. Never show owner title documents!
        andFilters.push({
          ownerUserId: new Types.ObjectId(session.id),
          scope: "PROPERTY",
          onboardingDocType: {
            $nin: ["SHARE_CERTIFICATE", "SALE_DEED", "POSSESSION_LETTER"],
          },
          category: {
            $nin: [
              "SHARE_CERTIFICATE",
              "SALE_DEED",
              "POSSESSION_LETTER",
              "TITLE_DEED",
              "CONVEYANCE_DEED",
              "INDEX_II",
            ],
          },
        });
      } else if (userFlatId) {
        // Residents can only view property documents for their verified flat
        andFilters.push({
          flatId: userFlatId,
          scope: "PROPERTY",
        });
      } else {
        // Fallback to own documents if no flat associated
        andFilters.push({
          ownerUserId: new Types.ObjectId(session.id),
          scope: "PROPERTY",
        });
      }
    } else if (scopeParam === "SOCIETY") {
      if (!activeSocietyId) {
        return NextResponse.json({ documents: [], total: 0 });
      }

      const visibilityConditions: Record<string, unknown>[] = [
        { visibility: "ALL_RESIDENTS" },
      ];
      if (session.activeRole === "OWNER" || isManagement) {
        visibilityConditions.push({ visibility: "OWNERS_ONLY" });
      }
      if (session.activeRole === "TENANT" || isManagement) {
        visibilityConditions.push({ visibility: "TENANTS_ONLY" });
      }
      if (isManagement) {
        visibilityConditions.push({ visibility: "MANAGEMENT_ONLY" });
      }

      andFilters.push({
        societyId: activeSocietyId,
        scope: "SOCIETY",
        $or: visibilityConditions,
      });
    } else {
      // "ALL" or unspecified: return user's private docs + user's flat property docs + visible society docs
      const orBranches: Record<string, unknown>[] = [
        // 1. User's own private docs
        { ownerUserId: new Types.ObjectId(session.id), scope: "PRIVATE" },
      ];

      // 2. Property documents
      if (isManagement && activeSocietyId) {
        orBranches.push({ societyId: activeSocietyId, scope: "PROPERTY" });
      } else if (session.activeRole === "TENANT") {
        orBranches.push({
          ownerUserId: new Types.ObjectId(session.id),
          scope: "PROPERTY",
          onboardingDocType: {
            $nin: ["SHARE_CERTIFICATE", "SALE_DEED", "POSSESSION_LETTER"],
          },
          category: {
            $nin: [
              "SHARE_CERTIFICATE",
              "SALE_DEED",
              "POSSESSION_LETTER",
              "TITLE_DEED",
              "CONVEYANCE_DEED",
              "INDEX_II",
            ],
          },
        });
      } else if (userFlatId) {
        orBranches.push({ flatId: userFlatId, scope: "PROPERTY" });
      } else {
        orBranches.push({ ownerUserId: new Types.ObjectId(session.id), scope: "PROPERTY" });
      }

      // 3. Society documents
      if (activeSocietyId) {
        const visConds: Record<string, unknown>[] = [{ visibility: "ALL_RESIDENTS" }];
        if (session.activeRole === "OWNER" || isManagement) visConds.push({ visibility: "OWNERS_ONLY" });
        if (session.activeRole === "TENANT" || isManagement) visConds.push({ visibility: "TENANTS_ONLY" });
        if (isManagement) visConds.push({ visibility: "MANAGEMENT_ONLY" });

        orBranches.push({
          societyId: activeSocietyId,
          scope: "SOCIETY",
          $or: visConds,
        });
      }

      andFilters.push({ $or: orBranches });
    }

    if (categoryParam && categoryParam !== "ALL") {
      andFilters.push({ category: categoryParam });
    }

    if (searchQuery) {
      andFilters.push({
        $or: [
          { displayName: { $regex: searchQuery, $options: "i" } },
          { originalFilename: { $regex: searchQuery, $options: "i" } },
          { category: { $regex: searchQuery, $options: "i" } },
          { description: { $regex: searchQuery, $options: "i" } },
        ],
      });
    }

    const query = andFilters.length > 0 ? { $and: andFilters } : {};

    // Sort order
    let sortQuery: Record<string, 1 | -1> = { createdAt: -1 };
    if (sortParam === "oldest") sortQuery = { createdAt: 1 };
    else if (sortParam === "name") sortQuery = { displayName: 1 };
    else if (sortParam === "size") sortQuery = { size: -1 };

    const docs = await DocumentModel.find(query).sort(sortQuery).limit(100);

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
          scope: doc.scope,
          size: doc.size,
          mimeType: doc.mimeType,
          version: doc.version,
          verificationStatus: doc.verificationStatus,
          visibility: doc.visibility,
          description: doc.description,
          tags: doc.tags,
          isOwner: doc.ownerUserId.toString() === session.id,
          createdAt: doc.createdAt.toISOString(),
          updatedAt: doc.updatedAt.toISOString(),
          viewUrl,
          downloadUrl,
        };
      })
    );

    return NextResponse.json({
      success: true,
      documents: enriched,
      total: enriched.length,
      r2Configured: isR2Configured(),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load documents";
    console.error("[Documents GET Error]", message);
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
    const displayName = (formData.get("displayName") as string)?.trim();
    const category = (formData.get("category") as string)?.trim() || "OTHER";
    const scope = (formData.get("scope") as DocumentScope) || "PRIVATE";
    const visibility = (formData.get("visibility") as DocumentVisibility) || "PRIVATE";
    const description = (formData.get("description") as string)?.trim();

    if (!file) {
      return NextResponse.json({ error: "Please choose a file to upload." }, { status: 400 });
    }

    // Role check: Only committee members can upload society documents
    const isManagement = session.memberships?.some(
      (m) =>
        m.status === "VERIFIED" &&
        COMMITTEE_ROLES.includes(m.role as MembershipRole)
    );

    if (scope === "SOCIETY" && !isManagement && !session.isSuperAdmin) {
      return NextResponse.json(
        { error: "Forbidden: Only authorized Society Management can publish official society documents." },
        { status: 403 }
      );
    }

    // File validation
    const validation = validateFileMetadata(file.type, file.size, file.name);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    await connectDB();

    const buffer = Buffer.from(await file.arrayBuffer());
    const societyId = session.activeSocietyId
      ? new Types.ObjectId(session.activeSocietyId)
      : undefined;
    const flatId =
      scope === "PROPERTY" && session.occupancies?.[0]?.flatId
        ? new Types.ObjectId(session.occupancies[0].flatId)
        : undefined;

    const documentId = `doc_${crypto.randomUUID()}`;
    const r2ObjectKey = generateR2ObjectKey({
      societyId: session.activeSocietyId,
      scope,
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
      societyId,
      flatId,
      ownerUserId: new Types.ObjectId(session.id),
      scope,
      category,
      originalFilename: file.name,
      displayName: displayName || file.name,
      mimeType: file.type,
      size: file.size,
      r2ObjectKey,
      r2Bucket: "societyflow-vault-docs",
      verificationStatus: scope === "SOCIETY" ? "VERIFIED" : "PENDING",
      version: 1,
      visibility: scope === "SOCIETY" ? visibility : "PRIVATE",
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
        scope,
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
      message: "Document uploaded successfully to your vault.",
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
        createdAt: doc.createdAt.toISOString(),
        viewUrl,
        downloadUrl,
      },
      r2Configured: isR2Configured(),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to upload document";
    console.error("[Document POST Error]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
