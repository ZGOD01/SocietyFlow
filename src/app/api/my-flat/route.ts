import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { getServerSession } from "@/lib/session";
import { connectDB } from "@/lib/db";
import {
  FlatOccupancy,
  DocumentModel,
  RegistrationRequest,
} from "@/models";
import { generatePresignedDownloadUrl } from "@/lib/r2";

interface LeanDoc {
  _id: { toString(): string };
  r2ObjectKey: string;
  displayName: string;
  originalFilename?: string;
  category?: string;
  onboardingDocType?: string;
  size?: number;
  mimeType?: string;
  verificationStatus?: string;
  correctionNote?: string;
  createdAt: Date | string;
}

interface LeanTenantOccupancy {
  userId?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  leaseStartDate?: Date | string;
  leaseEndDate?: Date | string;
  status: string;
}

interface LeanRequest {
  _id: { toString(): string };
  role: string;
  applicantName?: string;
  status: string;
  createdAt: Date | string;
}

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const activeSocietyId =
      session.activeSocietyId || session.memberships?.[0]?.societyId;

    // Find the user's active occupancy
    const userOccupancy = await FlatOccupancy.findOne({
      userId: session.id,
      status: "APPROVED",
      ...(activeSocietyId ? { societyId: activeSocietyId } : {}),
    })
      .populate({
        path: "flatId",
        populate: [
          { path: "wingId", select: "name" },
          { path: "buildingId", select: "name" },
          { path: "societyId", select: "name code registrationNumber address" },
        ],
      })
      .lean();

    if (!userOccupancy || !userOccupancy.flatId) {
      return NextResponse.json({
        success: true,
        hasFlat: false,
        message: "No active flat association found for your account.",
      });
    }

    interface PopulatedOccupiedFlat {
      _id: { toString(): string };
      flatNumber: string;
      floor: number;
      carpetAreaSqFt?: number;
      bhkType?: string;
      shareCertificateNumber?: string;
      defaultOccupancyType: string;
      wingId?: { name?: string };
      buildingId?: { name?: string };
      societyId?: {
        _id: { toString(): string };
        name?: string;
        code?: string;
        registrationNumber?: string;
        address?: string;
      };
    }

    const flat = userOccupancy.flatId as unknown as PopulatedOccupiedFlat;
    const isOwner = userOccupancy.occupancyType === "OWNER";

    // Common Flat Info
    const flatInfo = {
      id: flat._id.toString(),
      flatNumber: flat.flatNumber,
      floor: flat.floor,
      carpetAreaSqFt: flat.carpetAreaSqFt,
      bhkType: flat.bhkType,
      wingName: flat.wingId?.name || "Wing A",
      buildingName: flat.buildingId?.name,
      societyName: flat.societyId?.name || "Greenwood Heights CHS Ltd.",
      societyCode: flat.societyId?.code || "GH-BANER",
      societyRegistration: flat.societyId?.registrationNumber || "PNA/PNA(1)/HSG/14902",
      occupancyType: userOccupancy.occupancyType,
      ownershipType: userOccupancy.ownershipType,
    };

    const flatObjId =
      typeof flat._id === "string"
        ? new Types.ObjectId(flat._id)
        : (flat._id as Types.ObjectId);
    const userObjId = new Types.ObjectId(session.id);

    if (isOwner) {
      // 1. OWNER VIEW:
      // Self-heal: ensure any onboarding property documents uploaded by this owner have flatId linked
      await DocumentModel.updateMany(
        {
          ownerUserId: userObjId,
          scope: "PROPERTY",
          $or: [{ flatId: { $exists: false } }, { flatId: null }],
        },
        { $set: { flatId: flatObjId } }
      ).exec().catch(() => {});

      // Show onboarding property documents + other property documents
      const propertyDocs = (await DocumentModel.find({
        $or: [
          { flatId: flatObjId },
          { flatId: flat._id.toString() },
          { ownerUserId: userObjId, scope: "PROPERTY" },
        ],
        scope: "PROPERTY",
        isArchived: false,
      })
        .sort({ createdAt: -1 })
        .lean()) as unknown as LeanDoc[];

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

          return {
            id: doc._id.toString(),
            displayName: doc.displayName,
            originalFilename: doc.originalFilename,
            category: doc.category,
            onboardingDocType: doc.onboardingDocType,
            size: doc.size,
            mimeType: doc.mimeType,
            verificationStatus: doc.verificationStatus,
            correctionNote: doc.correctionNote,
            createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : new Date(doc.createdAt).toISOString(),
            viewUrl,
            downloadUrl,
          };
        })
      );

      // Check if flat has an active tenant (WITHOUT exposing tenant private documents)
      const tenantOccupancy = (await FlatOccupancy.findOne({
        $or: [
          { flatId: flatObjId },
          { flatId: flat._id.toString() },
        ],
        occupancyType: "TENANT",
        status: "APPROVED",
      })
        .populate("userId", "name email phone")
        .lean()) as unknown as LeanTenantOccupancy | null;

      const tenantSummary = tenantOccupancy
        ? {
            name: tenantOccupancy.userId?.name || "Tenant",
            email: tenantOccupancy.userId?.email,
            phone: tenantOccupancy.userId?.phone,
            leaseStartDate: tenantOccupancy.leaseStartDate ? new Date(tenantOccupancy.leaseStartDate).toISOString() : undefined,
            leaseEndDate: tenantOccupancy.leaseEndDate ? new Date(tenantOccupancy.leaseEndDate).toISOString() : undefined,
            status: tenantOccupancy.status,
          }
        : null;

      // Flat related requests
      const requests = (await RegistrationRequest.find({ flatId: flat._id.toString() as unknown as string })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean()) as unknown as LeanRequest[];

      return NextResponse.json({
        success: true,
        hasFlat: true,
        role: "OWNER",
        flat: {
          ...flatInfo,
          shareCertificateNumber: flat.shareCertificateNumber,
        },
        membershipDate: userOccupancy.createdAt,
        documents: enrichedDocs,
        propertyDocuments: enrichedDocs,
        tenant: tenantSummary,
        recentRequests: requests.map((r) => ({
          id: r._id.toString(),
          role: r.role,
          applicantName: r.applicantName,
          status: r.status,
          createdAt: r.createdAt,
        })),
        requests: requests.map((r) => ({
          id: r._id.toString(),
          role: r.role,
          applicantName: r.applicantName,
          status: r.status,
          createdAt: r.createdAt,
        })),
      });
    } else {
      // 2. TENANT VIEW:
      // Show verified owner name, rental dates, tenant's own uploaded documents, authorized shared society documents
      // Never expose owner's ownership deeds or private share certificates!
      const ownerOccupancy = (await FlatOccupancy.findOne({
        flatId: flat._id.toString() as unknown as string,
        occupancyType: "OWNER",
        status: "APPROVED",
      })
        .populate("userId", "name email phone")
        .lean()) as unknown as LeanTenantOccupancy | null;

      const ownerName =
        ownerOccupancy?.userId?.name ||
        userOccupancy.ownerName ||
        "Property Owner";

      // Tenant's own documents (Leave & License, ID Proof)
      const tenantDocs = (await DocumentModel.find({
        ownerUserId: userObjId,
        $or: [
          { flatId: flatObjId },
          { flatId: flat._id.toString() },
          { flatId: { $exists: false } },
          { flatId: null },
        ],
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
        isArchived: false,
      }).sort({ createdAt: -1 }).lean()) as unknown as LeanDoc[];

      const enrichedTenantDocs = await Promise.all(
        tenantDocs.map(async (doc) => {
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
            displayName: doc.displayName,
            originalFilename: doc.originalFilename,
            category: doc.category,
            onboardingDocType: doc.onboardingDocType,
            size: doc.size,
            mimeType: doc.mimeType,
            verificationStatus: doc.verificationStatus,
            createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : new Date(doc.createdAt).toISOString(),
            viewUrl,
            downloadUrl,
          };
        })
      );

      // Shared Society Documents for Tenants
      const targetSocId = (flat.societyId?._id?.toString() || activeSocietyId) as unknown as string;
      const societyDocs = (await DocumentModel.find({
        societyId: targetSocId,
        scope: "SOCIETY",
        visibility: { $in: ["ALL_RESIDENTS", "TENANTS_ONLY"] },
        isArchived: false,
      })
        .sort({ createdAt: -1 })
        .limit(6)
        .lean()) as unknown as LeanDoc[];

      const enrichedSocietyDocs = await Promise.all(
        societyDocs.map(async (doc) => {
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
            displayName: doc.displayName,
            category: doc.category,
            createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : new Date(doc.createdAt).toISOString(),
            viewUrl,
            downloadUrl,
          };
        })
      );

      return NextResponse.json({
        success: true,
        hasFlat: true,
        role: "TENANT",
        flat: flatInfo,
        owner: {
          name: ownerName,
          contact: ownerOccupancy?.userId?.email || userOccupancy.ownerContact,
        },
        lease: {
          startDate: userOccupancy.leaseStartDate,
          endDate: userOccupancy.leaseEndDate,
        },
        tenantEnrollmentDate: userOccupancy.createdAt,
        documents: enrichedTenantDocs,
        tenantDocuments: enrichedTenantDocs,
        societyDocuments: enrichedSocietyDocs,
        sharedSocietyDocuments: enrichedSocietyDocs,
      });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load My Flat information";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
