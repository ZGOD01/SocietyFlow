import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/session";
import { connectDB } from "@/lib/db";
import {
  Society,
  Building,
  Wing,
  Flat,
  SocietyMembership,
  AuditEvent,
} from "@/models";
import { COMMITTEE_ROLES, MembershipRole } from "@/lib/rbac";

interface PopulatedCommitteeMember {
  _id: { toString(): string };
  role: string;
  status: string;
  resolutionNumber?: string;
  joinedAt?: Date | string;
  createdAt?: Date | string;
  userId?: {
    _id?: { toString(): string };
    name?: string;
    email?: string;
    phone?: string;
    avatar?: string;
    toString(): string;
  };
}

interface BuildingLean {
  _id: { toString(): string };
  name: string;
  code?: string;
  floors?: number;
}

interface WingLean {
  _id: { toString(): string };
  buildingId?: { toString(): string };
  name: string;
  floors?: number;
  flatsPerFloor?: number;
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

    if (!activeSocietyId) {
      return NextResponse.json(
        { error: "No active society context found." },
        { status: 400 }
      );
    }

    const isSuperAdmin = session.isSuperAdmin;
    const isCommitteeOfSociety = session.memberships?.some(
      (m) =>
        m.societyId === activeSocietyId &&
        m.status === "VERIFIED" &&
        COMMITTEE_ROLES.includes(m.role as MembershipRole)
    );

    if (!isSuperAdmin && !isCommitteeOfSociety) {
      return NextResponse.json(
        { error: "Forbidden: Committee privileges required." },
        { status: 403 }
      );
    }

    const society = await Society.findById(activeSocietyId).lean();
    if (!society) {
      return NextResponse.json({ error: "Society not found." }, { status: 404 });
    }

    // Buildings & Wings
    const buildings = await Building.find({ societyId: activeSocietyId, isActive: true })
      .sort({ name: 1 })
      .lean();

    const wings = await Wing.find({ societyId: activeSocietyId, isActive: true })
      .sort({ name: 1 })
      .lean();

    // Counts
    const totalFlatsCount = await Flat.countDocuments({ societyId: activeSocietyId, isActive: true });
    const registeredOwnersCount = await Flat.countDocuments({
      societyId: activeSocietyId,
      isActive: true,
      currentOwnerId: { $exists: true, $ne: null },
    });
    const activeTenantsCount = await Flat.countDocuments({
      societyId: activeSocietyId,
      isActive: true,
      currentTenantId: { $exists: true, $ne: null },
    });
    const vacantCount = await Flat.countDocuments({
      societyId: activeSocietyId,
      isActive: true,
      currentOwnerId: null,
      currentTenantId: null,
    });

    // Committee Members
    const committeeMemberships = await SocietyMembership.find({
      societyId: activeSocietyId,
      status: "VERIFIED",
      role: { $in: COMMITTEE_ROLES },
    })
      .populate("userId", "name email phone avatar")
      .sort({ role: 1, joinedAt: 1 })
      .lean();

    const committeeRoster = (committeeMemberships as unknown as PopulatedCommitteeMember[]).map((m) => ({
      membershipId: m._id.toString(),
      role: m.role,
      status: m.status,
      resolutionNumber: m.resolutionNumber,
      joinedAt: m.joinedAt || m.createdAt,
      user: {
        id: m.userId?._id?.toString() || m.userId?.toString(),
        name: m.userId?.name || "Official",
        email: m.userId?.email || "",
        phone: m.userId?.phone || "",
        avatar: m.userId?.avatar,
      },
    }));

    // Structure mapping
    const buildingsWithWings = (buildings as unknown as BuildingLean[]).map((b) => {
      const bWings = (wings as unknown as WingLean[]).filter((w) => w.buildingId?.toString() === b._id.toString());
      return {
        id: b._id.toString(),
        name: b.name,
        code: b.code,
        floors: b.floors,
        totalWings: bWings.length,
        wings: bWings.map((w) => ({
          id: w._id.toString(),
          name: w.name,
          floors: w.floors,
          flatsPerFloor: w.flatsPerFloor,
        })),
      };
    });

    return NextResponse.json({
      success: true,
      society: {
        id: society._id.toString(),
        name: society.name,
        code: society.code,
        registrationNumber: society.registrationNumber,
        state: society.state,
        district: society.district,
        city: society.city,
        pinCode: society.pinCode,
        address: society.address,
        contactEmail: society.contactEmail || session.email,
        contactPhone: society.contactPhone || session.phone || "",
        status: society.status,
        settings: society.settings,
        createdAt: society.createdAt,
      },
      stats: {
        totalBuildings: buildings.length,
        totalWings: wings.length,
        totalFlats: totalFlatsCount,
        registeredOwners: registeredOwnersCount,
        activeTenants: activeTenantsCount,
        vacantFlats: vacantCount,
      },
      structure: buildingsWithWings,
      committee: committeeRoster,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load society profile";
    console.error("GET /api/management/society error:", err);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
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
        { error: "No active society context found." },
        { status: 400 }
      );
    }

    const isSuperAdmin = session.isSuperAdmin;
    const isCommitteeOfSociety = session.memberships?.some(
      (m) =>
        m.societyId === activeSocietyId &&
        m.status === "VERIFIED" &&
        COMMITTEE_ROLES.includes(m.role as MembershipRole)
    );

    if (!isSuperAdmin && !isCommitteeOfSociety) {
      return NextResponse.json(
        { error: "Forbidden: Committee privileges required." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      name,
      registrationNumber,
      address,
      city,
      pinCode,
      district,
      state,
      contactEmail,
      contactPhone,
      settings,
    } = body;

    const existingSociety = await Society.findById(activeSocietyId);
    if (!existingSociety) {
      return NextResponse.json({ error: "Society not found." }, { status: 404 });
    }

    const updates: Record<string, unknown> = {};
    if (name && typeof name === "string") updates.name = name.trim();
    if (registrationNumber && typeof registrationNumber === "string")
      updates.registrationNumber = registrationNumber.trim();
    if (address !== undefined) updates.address = address?.trim();
    if (city && typeof city === "string") updates.city = city.trim();
    if (pinCode && typeof pinCode === "string") updates.pinCode = pinCode.trim();
    if (district !== undefined) updates.district = district?.trim();
    if (state !== undefined) updates.state = state?.trim();
    if (contactEmail !== undefined) updates.contactEmail = contactEmail?.trim()?.toLowerCase();
    if (contactPhone !== undefined) updates.contactPhone = contactPhone?.trim();
    if (settings && typeof settings === "object") {
      updates.settings = {
        ...existingSociety.settings,
        ...settings,
      };
    }

    const updatedSociety = await Society.findByIdAndUpdate(
      activeSocietyId,
      { $set: updates },
      { new: true, runValidators: true }
    ).lean();

    // Log Audit Event
    await AuditEvent.create({
      societyId: activeSocietyId,
      userId: session.id,
      action: "SOCIETY_PROFILE_UPDATED",
      entityType: "SOCIETY",
      entityId: activeSocietyId,
      details: {
        updatedFields: Object.keys(updates),
        updatedBy: session.name || session.email,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Society details updated successfully",
      society: updatedSociety,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update society details";
    console.error("PATCH /api/management/society error:", err);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
