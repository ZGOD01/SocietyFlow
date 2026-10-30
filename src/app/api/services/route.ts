import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { getServerSession } from "@/lib/session";
import { connectDB } from "@/lib/db";
import { Flat, FlatOccupancy, SocietyMembership } from "@/models";
import { getResidentServices } from "@/lib/services/service-catalogue";
import { COMMITTEE_ROLES, MembershipRole } from "@/lib/rbac";

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const activeSocietyId =
      session.activeSocietyId || session.memberships?.[0]?.societyId;

    if (!activeSocietyId) {
      return NextResponse.json(
        { error: "No active society context found" },
        { status: 400 }
      );
    }

    const socObjectId = new Types.ObjectId(activeSocietyId);

    // 1. Determine user's verified role in this society
    const isManagement = session.memberships?.some(
      (m) =>
        m.societyId === activeSocietyId &&
        m.status === "VERIFIED" &&
        COMMITTEE_ROLES.includes(m.role as MembershipRole)
    );

    // Check occupancies for this user in this society
    const userOccupancies = await FlatOccupancy.find({
      userId: new Types.ObjectId(session.id),
      societyId: socObjectId,
      status: "APPROVED",
    })
      .populate("flatId", "flatNumber floor bhkType")
      .lean();

    // Also check SocietyMembership role
    const activeMembership = await SocietyMembership.findOne({
      userId: new Types.ObjectId(session.id),
      societyId: socObjectId,
      status: "VERIFIED",
    }).lean();

    // Determine primary resident role: OWNER or TENANT (or both)
    const hasOwnerOccupancy = userOccupancies.some(
      (o) => o.occupancyType === "OWNER"
    );
    const hasTenantOccupancy = userOccupancies.some(
      (o) => o.occupancyType === "TENANT"
    );

    let effectiveRole: "OWNER" | "TENANT" = "OWNER";
    if (activeMembership?.role === "TENANT" || (hasTenantOccupancy && !hasOwnerOccupancy)) {
      effectiveRole = "TENANT";
    }

    // If management or superAdmin, allow browsing all services (treat as OWNER for broad eligibility)
    const roleForCatalogue = isManagement || session.isSuperAdmin ? "OWNER" : effectiveRole;

    const services = await getResidentServices(socObjectId, roleForCatalogue);

    // Fetch user's authorized flats
    const flatList = userOccupancies
      .filter((o) => o.flatId)
      .map((o) => {
        const flatObj = o.flatId as unknown as {
          _id: Types.ObjectId;
          flatNumber: string;
          floor: number;
          bhkType?: string;
        };
        return {
          id: flatObj._id.toString(),
          flatNumber: flatObj.flatNumber,
          floor: flatObj.floor,
          bhkType: flatObj.bhkType,
          occupancyType: o.occupancyType,
        };
      });

    // If user has no occupancy records yet, check if flat has currentOwnerId / currentTenantId
    if (flatList.length === 0) {
      const directFlats = await Flat.find({
        societyId: socObjectId,
        isActive: { $ne: false },
        $or: [
          { currentOwnerId: new Types.ObjectId(session.id) },
          { currentTenantId: new Types.ObjectId(session.id) },
        ],
      }).lean();

      directFlats.forEach((f) => {
        const isOwner = f.currentOwnerId?.toString() === session.id;
        flatList.push({
          id: f._id.toString(),
          flatNumber: f.flatNumber,
          floor: f.floor,
          bhkType: f.bhkType,
          occupancyType: isOwner ? "OWNER" : "TENANT",
        });
      });
    }

    return NextResponse.json({
      success: true,
      role: effectiveRole,
      isManagement,
      flats: flatList,
      services: services.map((s) => ({
        id: s._id.toString(),
        code: s.code,
        title: s.title,
        description: s.description,
        category: s.category,
        eligibility: s.eligibility,
        requiresOwnerAuthorization: s.requiresOwnerAuthorization,
        estimatedProcessingDays: s.estimatedProcessingDays,
        isActive: s.isActive,
        isDownstreamAvailable: s.isDownstreamAvailable,
        downstreamNote: s.downstreamNote,
        requiredFieldsCount: s.requiredFields?.length || 0,
        requiredDocumentsCount: s.requiredDocuments?.length || 0,
        requiredDocuments: s.requiredDocuments || [],
      })),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load services";
    console.error("GET /api/services error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
