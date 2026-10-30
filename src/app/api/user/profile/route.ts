import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/session";
import { connectDB } from "@/lib/db";
import {
  User,
  Society,
  SocietyMembership,
  FlatOccupancy,
  RegistrationRequest,
  DocumentModel,
} from "@/models";
import { generatePresignedDownloadUrl } from "@/lib/r2";

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const user = await User.findById(session.id).lean();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Latest registration request for applicant profile details
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const regRequest: any = await RegistrationRequest.findOne({ applicantId: user._id })
      .sort({ createdAt: -1 })
      .lean();

    // Active society
    const activeSocietyId = session.activeSocietyId || session.memberships?.[0]?.societyId;
    let society = null;
    if (activeSocietyId) {
      society = await Society.findById(activeSocietyId).lean();
    }
    if (!society && regRequest?.societyId) {
      society = await Society.findById(regRequest.societyId).lean();
    }
    if (!society) {
      society = await Society.findOne({ status: "ACTIVE" }).lean();
    }

    // Membership for this society
    const membership = await SocietyMembership.findOne({
      userId: user._id,
      ...(society ? { societyId: society._id } : {}),
    }).lean();

    // Flat occupancy for this user
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let rawOccupancy: any = await FlatOccupancy.findOne({
      userId: user._id,
      status: "APPROVED",
    })
      .populate({
        path: "flatId",
        populate: [
          { path: "wingId", select: "name" },
          { path: "buildingId", select: "name" },
        ],
      })
      .lean();

    if (!rawOccupancy) {
      rawOccupancy = await FlatOccupancy.findOne({
        userId: user._id,
      })
        .populate({
          path: "flatId",
          populate: [
            { path: "wingId", select: "name" },
            { path: "buildingId", select: "name" },
          ],
        })
        .lean();
    }

    const flatInfo = rawOccupancy?.flatId
      ? {
          id: rawOccupancy.flatId._id?.toString() || "",
          flatNumber: rawOccupancy.flatId.flatNumber || regRequest?.flatNumber || "",
          floor: rawOccupancy.flatId.floor || 1,
          wingName: rawOccupancy.flatId.wingId?.name || regRequest?.wingName || "Wing A",
          buildingName: rawOccupancy.flatId.buildingId?.name || "Main Complex",
          configuration: rawOccupancy.flatId.configuration || "2 BHK",
          occupancyType: rawOccupancy.occupancyType || regRequest?.role || "OWNER",
          ownershipType:
            rawOccupancy.ownershipType ||
            regRequest?.ownershipType ||
            (membership?.role === "OWNER" || session.activeRole === "RESIDENT_OWNER"
              ? "SOLE_OWNER"
              : null),
          leaseStartDate: rawOccupancy.leaseStartDate || regRequest?.leaseStartDate || null,
          leaseEndDate: rawOccupancy.leaseEndDate || regRequest?.leaseEndDate || null,
          ownerName: rawOccupancy.ownerName || regRequest?.ownerName || null,
          ownerContact: rawOccupancy.ownerContact || regRequest?.ownerContact || null,
        }
      : regRequest?.flatNumber
      ? {
          id: regRequest.flatId?.toString() || "",
          flatNumber: regRequest.flatNumber,
          floor: 1,
          wingName: regRequest.wingName || "Wing A",
          buildingName: "Main Complex",
          configuration: "2 BHK",
          occupancyType: regRequest.role || "OWNER",
          ownershipType: regRequest.ownershipType || "SOLE_OWNER",
          leaseStartDate: regRequest.leaseStartDate || null,
          leaseEndDate: regRequest.leaseEndDate || null,
          ownerName: regRequest.ownerName || null,
          ownerContact: regRequest.ownerContact || null,
        }
      : null;

    // Fetch Onboarding / Property Documents uploaded by this user
    const onboardingDocs = await DocumentModel.find({
      ownerUserId: user._id,
      scope: "PROPERTY",
      isArchived: false,
    }).sort({ createdAt: -1 });

    const enrichedOnboardingDocs = await Promise.all(
      onboardingDocs.map(async (doc) => {
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
          version: doc.version,
          verificationStatus: doc.verificationStatus,
          correctionNote: doc.correctionNote,
          createdAt: doc.createdAt.toISOString(),
          viewUrl,
          downloadUrl,
        };
      })
    );

    // Fetch Personal Private Documents summary for this user
    const personalDocs = await DocumentModel.find({
      ownerUserId: user._id,
      scope: "PRIVATE",
      isArchived: false,
    }).sort({ createdAt: -1 });

    const totalPersonalBytes = personalDocs.reduce((acc, d) => acc + (d.size || 0), 0);
    const categorySet = new Set(personalDocs.map((d) => d.category));

    const enrichedPersonalDocs = await Promise.all(
      personalDocs.slice(0, 10).map(async (doc) => {
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
          size: doc.size,
          mimeType: doc.mimeType,
          createdAt: doc.createdAt.toISOString(),
          viewUrl,
          downloadUrl,
        };
      })
    );

    const contactPhone = user.phone || regRequest?.applicantPhone || "";

    return NextResponse.json({
      success: true,
      profile: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: contactPhone,
        role: membership?.role || session.activeRole || "OWNER",
        status: membership?.status || user.status || "VERIFIED",
        onboardingStatus: user.onboardingStatus || regRequest?.onboardingStatus || "COMPLETED",
        enrollmentDate: (membership?.joinedAt || membership?.createdAt || user.createdAt || new Date()).toISOString(),
        lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
        accountCreated: user.createdAt ? user.createdAt.toISOString() : null,
        managementPosition: regRequest?.managementPosition || null,
        resolutionNumber: membership?.resolutionNumber || regRequest?.resolutionNumber || null,
        societyJoiningMethod: regRequest?.societyJoiningMethod || "CODE",
      },
      society: society
        ? {
            id: society._id.toString(),
            name: society.name,
            code: society.code,
            registrationNumber: society.registrationNumber,
            address: typeof society.address === "string" ? society.address : "Baner Road, Pune, Maharashtra",
            city: society.city || "Pune",
            state: society.state || "Maharashtra",
            pinCode: society.pinCode || "411045",
          }
        : null,
      flat: flatInfo,
      onboardingDocuments: enrichedOnboardingDocs,
      personalSummary: {
        totalCount: personalDocs.length,
        totalBytes: totalPersonalBytes,
        categoriesCount: categorySet.size,
        recentDocuments: enrichedPersonalDocs,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load user profile";
    console.error("[Profile API Error]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
