import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/session";
import { connectDB } from "@/lib/db";
import {
  Flat,
  Wing,
  FlatOccupancy,
  RegistrationRequest,
  DocumentModel,
  DocumentVersion,
  AuditEvent,
} from "@/models";
import { COMMITTEE_ROLES, MembershipRole } from "@/lib/rbac";
import { generatePresignedDownloadUrl } from "@/lib/r2";

type PopulatedRef = { _id?: { toString(): string }; name?: string; toString(): string };

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

    const flat = await Flat.findById(flatId)
      .populate("wingId", "name")
      .populate("buildingId", "name")
      .populate("societyId", "name code registrationNumber address");

    if (!flat) {
      return NextResponse.json({ error: "Flat not found" }, { status: 404 });
    }

    // Multi-tenant isolation: check cross-society boundary
    const activeSocietyId =
      session.activeSocietyId || session.memberships?.[0]?.societyId;
    const flatSocietyIdStr =
      (flat.societyId as any)?._id?.toString() ||
      (flat.societyId as any)?.toString() ||
      "";

    if (
      !session.isSuperAdmin &&
      activeSocietyId &&
      flatSocietyIdStr &&
      flatSocietyIdStr !== activeSocietyId
    ) {
      return NextResponse.json(
        { error: "Forbidden: Cross-society flat access is prohibited." },
        { status: 403 }
      );
    }

    // Role verification: Management or authorized resident of this flat
    const isManagement = session.isSuperAdmin || session.memberships?.some(
      (m) =>
        m.societyId === flatSocietyIdStr &&
        m.status === "VERIFIED" &&
        COMMITTEE_ROLES.includes(m.role as MembershipRole)
    );

    const isFlatResident = await FlatOccupancy.findOne({
      flatId: flat._id,
      userId: session.id,
      status: "APPROVED",
    });

    if (!isManagement && !isFlatResident) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to view this flat profile." },
        { status: 403 }
      );
    }

    // 1. Fetch Occupancies (Owner and Tenant)
    const occupancies = await FlatOccupancy.find({
      flatId: flat._id,
      status: { $in: ["APPROVED", "PENDING"] },
    })
      .populate("userId", "name email phone avatarUrl createdAt")
      .sort({ createdAt: -1 })
      .lean();

    const ownerOcc = occupancies.find((o) => o.occupancyType === "OWNER" && o.status === "APPROVED");
    const tenantOcc = occupancies.find((o) => o.occupancyType === "TENANT" && o.status === "APPROVED");

    interface PopulatedUser {
      _id: { toString(): string };
      name: string;
      email: string;
      phone?: string;
      createdAt?: string | Date;
    }

    const ownerDetails = ownerOcc?.userId
      ? {
          id: (ownerOcc.userId as unknown as PopulatedUser)._id.toString(),
          name: (ownerOcc.userId as unknown as PopulatedUser).name,
          email: (ownerOcc.userId as unknown as PopulatedUser).email,
          phone: (ownerOcc.userId as unknown as PopulatedUser).phone,
          ownershipType: ownerOcc.ownershipType,
          enrollmentDate: (ownerOcc.userId as unknown as PopulatedUser).createdAt
            ? new Date((ownerOcc.userId as unknown as PopulatedUser).createdAt!).toISOString()
            : new Date(ownerOcc.createdAt).toISOString(),
          approvalStatus: ownerOcc.status,
          verifiedAt: ownerOcc.verifiedAt ? new Date(ownerOcc.verifiedAt).toISOString() : undefined,
        }
      : null;

    const tenantDetails = tenantOcc?.userId
      ? {
          id: (tenantOcc.userId as unknown as PopulatedUser)._id.toString(),
          name: (tenantOcc.userId as unknown as PopulatedUser).name,
          email: (tenantOcc.userId as unknown as PopulatedUser).email,
          phone: (tenantOcc.userId as unknown as PopulatedUser).phone,
          leaseStartDate: tenantOcc.leaseStartDate ? new Date(tenantOcc.leaseStartDate).toISOString() : undefined,
          leaseEndDate: tenantOcc.leaseEndDate ? new Date(tenantOcc.leaseEndDate).toISOString() : undefined,
          occupancyStatus: tenantOcc.status,
          ownerName: ownerDetails?.name || tenantOcc.ownerName || "Property Owner",
          verifiedAt: tenantOcc.verifiedAt ? new Date(tenantOcc.verifiedAt).toISOString() : undefined,
        }
      : null;

    // 2. Property Documents (Authorized management access to PROPERTY scope only)
    const propertyDocs = await DocumentModel.find({
      flatId: flat._id,
      scope: "PROPERTY",
      isArchived: false,
    }).populate("ownerUserId", "name email").sort({ createdAt: -1 });

    const enrichedPropertyDocs = await Promise.all(
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

    // 3. Flat Activity History (from AuditEvent and Registration Requests)
    const [flatAudits, flatRequests] = await Promise.all([
      AuditEvent.find({
        $or: [
          { entityId: flat._id.toString() },
          { "details.flatNumber": flat.flatNumber },
          { "details.flatId": flat._id.toString() },
        ],
      })
        .populate("userId", "name role")
        .sort({ createdAt: -1 })
        .limit(20)
        .lean(),
      RegistrationRequest.find({ flatId: flat._id })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
    ]);

    const timelineEvents: Array<{
      id: string;
      action: string;
      description: string;
      actorName: string;
      actorRole: string;
      timestamp: string;
    }> = [];

    flatAudits.forEach((audit) => {
      interface PopulatedAuditUser {
        name?: string;
        role?: string;
      }
      const u = audit.userId as unknown as PopulatedAuditUser | undefined;
      timelineEvents.push({
        id: audit._id.toString(),
        action: audit.action,
        description:
          audit.action === "FLAT_CREATED"
            ? `Flat #${flat.flatNumber} added to registry.`
            : audit.action === "OWNER_REGISTRATION_APPROVED"
            ? `Owner registration approved.`
            : audit.action === "DOCUMENT_UPLOADED"
            ? `Property document uploaded.`
            : audit.action.replace(/_/g, " "),
        actorName: u?.name || "System Administrator",
        actorRole: u?.role || "MANAGEMENT",
        timestamp: new Date(audit.createdAt).toISOString(),
      });
    });

    // Also include registration request events if not duplicated
    flatRequests.forEach((reqItem) => {
      reqItem.timeline?.forEach((t, idx) => {
        timelineEvents.push({
          id: `${reqItem._id}-${idx}`,
          action: t.action,
          description: t.comment || `${t.action.replace(/_/g, " ")} (${reqItem.role})`,
          actorName: t.actorName || "Committee Official",
          actorRole: t.actorRole || "MANAGEMENT",
          timestamp: new Date(t.timestamp).toISOString(),
        });
      });
    });

    // Sort timeline descending
    timelineEvents.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    const wingObj = flat.wingId as any;
    const buildingObj = flat.buildingId as any;
    const societyObj = flat.societyId as any;

    const wingName = wingObj?.name || (flat as any).wingName || "Wing A";
    const buildingName = buildingObj?.name || "Main Complex";
    const societyName = societyObj?.name || session.memberships?.[0]?.societyName || "Registered Society";
    const societyCode = societyObj?.code || session.memberships?.[0]?.societyCode || "DEFAULT";
    const societyReg = societyObj?.registrationNumber || "Pending";
    const societyAddress = societyObj?.address || "";

    const requestList = flatRequests.map((r) => ({
      id: r._id.toString(),
      applicantName: r.applicantName,
      applicantEmail: r.applicantEmail,
      role: r.role,
      status: r.status,
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
    }));

    return NextResponse.json({
      success: true,
      flat: {
        id: flat._id.toString(),
        flatNumber: flat.flatNumber,
        floor: flat.floor ?? 1,
        wing: {
          id: wingObj?._id?.toString() || wingObj?.toString() || "",
          name: wingName,
        },
        wingName,
        wingId: wingObj?._id?.toString() || wingObj?.toString(),
        building: {
          id: buildingObj?._id?.toString() || buildingObj?.toString() || "",
          name: buildingName,
        },
        buildingName,
        buildingId: buildingObj?._id?.toString() || buildingObj?.toString(),
        society: {
          id: societyObj?._id?.toString() || societyObj?.toString() || session.activeSocietyId || "",
          name: societyName,
          code: societyCode,
          registrationNumber: societyReg,
          address: societyAddress,
        },
        societyName,
        societyCode,
        societyRegistration: societyReg,
        carpetAreaSqFt: flat.carpetAreaSqFt,
        bhkType: flat.bhkType,
        occupancyType: flat.defaultOccupancyType,
        shareCertificateNumber: flat.shareCertificateNumber,
        status: flat.status || (flat.isActive !== false ? "ACTIVE" : "INACTIVE"),
        isActive: flat.isActive !== false,
        createdAt: flat.createdAt ? new Date(flat.createdAt).toISOString() : new Date().toISOString(),
      },
      owner: ownerDetails,
      tenant: tenantDetails,
      occupancyHistory: occupancies.map((occ) => ({
        id: occ._id.toString(),
        occupancyType: occ.occupancyType,
        status: occ.status,
        userName: (occ.userId as unknown as PopulatedUser)?.name || "Resident",
        userEmail: (occ.userId as unknown as PopulatedUser)?.email,
        ownershipType: occ.ownershipType,
        leaseStartDate: occ.leaseStartDate,
        leaseEndDate: occ.leaseEndDate,
        createdAt: occ.createdAt,
      })),
      propertyDocuments: enrichedPropertyDocs,
      documents: enrichedPropertyDocs,
      activityTimeline: timelineEvents.slice(0, 25),
      timeline: timelineEvents.slice(0, 25),
      associatedRequests: requestList,
      requests: requestList,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load flat profile";
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
    await connectDB();

    const flat = await Flat.findById(flatId);
    if (!flat) {
      return NextResponse.json({ error: "Flat not found" }, { status: 404 });
    }

    const isManagement = session.isSuperAdmin || session.memberships?.some(
      (m) =>
        m.societyId === flat.societyId.toString() &&
        m.status === "VERIFIED" &&
        COMMITTEE_ROLES.includes(m.role as MembershipRole)
    );

    if (!isManagement) {
      return NextResponse.json(
        { error: "Forbidden: Management privileges required to edit flat details." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      flatNumber,
      floor,
      carpetAreaSqFt,
      bhkType,
      shareCertificateNumber,
      defaultOccupancyType,
      isActive,
      deactivationReason,
    } = body;

    // Check duplicate if flatNumber is being modified
    if (flatNumber && flatNumber.trim().toUpperCase() !== flat.flatNumber) {
      const cleanNum = flatNumber.trim().toUpperCase();
      const duplicate = await Flat.findOne({
        societyId: flat.societyId,
        wingId: flat.wingId,
        flatNumber: cleanNum,
        _id: { $ne: flat._id },
      });
      if (duplicate) {
        return NextResponse.json(
          { error: `Flat number "${cleanNum}" is already in use in this wing.` },
          { status: 409 }
        );
      }
      flat.flatNumber = cleanNum;
    }

    if (floor !== undefined) flat.floor = Number(floor);
    if (carpetAreaSqFt !== undefined) flat.carpetAreaSqFt = Number(carpetAreaSqFt);
    if (bhkType !== undefined) flat.bhkType = bhkType.trim();
    if (shareCertificateNumber !== undefined) flat.shareCertificateNumber = shareCertificateNumber.trim();
    if (defaultOccupancyType !== undefined) flat.defaultOccupancyType = defaultOccupancyType;

    // Deactivation validation: Cannot deactivate if occupied!
    if (isActive === false && flat.isActive) {
      const activeOccupants = await FlatOccupancy.countDocuments({
        flatId: flat._id,
        status: "APPROVED",
      });

      if (activeOccupants > 0) {
        return NextResponse.json(
          {
            error:
              "Cannot deactivate an occupied flat. All active owner/tenant occupancies must be concluded or transferred first.",
          },
          { status: 400 }
        );
      }

      flat.isActive = false;
      flat.status = "INACTIVE";
      flat.deactivatedAt = new Date();
      flat.deactivationReason = deactivationReason?.trim() || "Deactivated by Society Management";
    } else if (isActive === true && !flat.isActive) {
      flat.isActive = true;
      flat.status = "ACTIVE";
      flat.deactivatedAt = undefined;
      flat.deactivationReason = undefined;
    }

    await flat.save();

    await AuditEvent.create({
      societyId: flat.societyId,
      userId: session.id,
      action: "FLAT_UPDATED",
      entityType: "Flat",
      entityId: flat._id.toString(),
      details: {
        flatNumber: flat.flatNumber,
        floor: flat.floor,
        isActive: flat.isActive,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Flat details updated successfully.",
      flat,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update flat details";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
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

    const flat = await Flat.findById(flatId);
    if (!flat) {
      return NextResponse.json({ error: "Flat not found" }, { status: 404 });
    }

    const isManagement = session.isSuperAdmin || session.memberships?.some(
      (m) =>
        m.societyId === flat.societyId.toString() &&
        m.status === "VERIFIED" &&
        COMMITTEE_ROLES.includes(m.role as MembershipRole)
    );

    if (!isManagement) {
      return NextResponse.json(
        { error: "Forbidden: Management privileges required." },
        { status: 403 }
      );
    }

    // MANDATORY INTEGRITY CHECK:
    // Prevent deletion if flat has active members or associated historical documents!
    const [occupanciesCount, documentsCount] = await Promise.all([
      FlatOccupancy.countDocuments({
        flatId: flat._id,
        status: { $in: ["APPROVED", "PENDING"] },
      }),
      DocumentModel.countDocuments({
        flatId: flat._id,
        isArchived: false,
      }),
    ]);

    if (occupanciesCount > 0) {
      return NextResponse.json(
        {
          error:
            "Integrity constraint violation: Cannot delete a flat with registered owners or active tenants. Please deactivate the unit instead.",
        },
        { status: 409 }
      );
    }

    if (documentsCount > 0) {
      return NextResponse.json(
        {
          error:
            "Integrity constraint violation: Cannot delete a flat with statutory property document records.",
        },
        { status: 409 }
      );
    }

    // Safe to delete vacant unassociated flat
    await Flat.findByIdAndDelete(flatId);

    // Update wing and society counts
    if (flat.wingId) {
      await Wing.findByIdAndUpdate(flat.wingId, { $inc: { totalFlats: -1 } });
    }

    await AuditEvent.create({
      societyId: flat.societyId,
      userId: session.id,
      action: "FLAT_DELETED",
      entityType: "Flat",
      entityId: flat._id.toString(),
      details: { flatNumber: flat.flatNumber },
    });

    return NextResponse.json({
      success: true,
      message: `Flat #${flat.flatNumber} deleted successfully.`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete flat";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
