import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { getServerSession } from "@/lib/session";
import { connectDB } from "@/lib/db";
import { ServiceDefinition, FlatOccupancy, Flat, Society, User } from "@/models";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ serviceId: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { serviceId } = await params;
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

    // Look up service either by MongoDB ObjectId or by slug code
    let service = null;
    if (Types.ObjectId.isValid(serviceId)) {
      service = await ServiceDefinition.findById(serviceId).lean();
    }
    if (!service) {
      service = await ServiceDefinition.findOne({
        code: serviceId,
        $or: [{ societyId: socObjectId }, { societyId: null }],
      }).lean();
    }

    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    // Verify society details
    const society = await Society.findById(socObjectId).lean();

    // Verify user details
    const user = await User.findById(session.id).lean();

    // Fetch user's authorized flats in this society
    const occupancies = await FlatOccupancy.find({
      userId: new Types.ObjectId(session.id),
      societyId: socObjectId,
      status: "APPROVED",
    })
      .populate("flatId", "flatNumber floor bhkType buildingId wingId")
      .lean();

    const flats = occupancies
      .filter((o) => o.flatId)
      .map((o) => {
        const f = o.flatId as unknown as {
          _id: Types.ObjectId;
          flatNumber: string;
          floor: number;
          bhkType?: string;
        };
        return {
          id: f._id.toString(),
          flatNumber: f.flatNumber,
          floor: f.floor,
          bhkType: f.bhkType,
          role: o.occupancyType,
        };
      });

    // Check direct flat association if no occupancy record exists
    if (flats.length === 0) {
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
        flats.push({
          id: f._id.toString(),
          flatNumber: f.flatNumber,
          floor: f.floor,
          bhkType: f.bhkType,
          role: isOwner ? "OWNER" : "TENANT",
        });
      });
    }

    return NextResponse.json({
      success: true,
      service: {
        id: service._id.toString(),
        code: service.code,
        title: service.title,
        description: service.description,
        category: service.category,
        eligibility: service.eligibility,
        requiresOwnerAuthorization: service.requiresOwnerAuthorization,
        estimatedProcessingDays: service.estimatedProcessingDays,
        isDownstreamAvailable: service.isDownstreamAvailable,
        downstreamNote: service.downstreamNote,
        requiredFields: service.requiredFields || [],
        requiredDocuments: service.requiredDocuments || [],
        version: service.version,
      },
      society: {
        id: society?._id.toString(),
        name: society?.name,
        code: society?.code,
      },
      applicant: {
        id: session.id,
        name: user?.name || session.name,
        email: user?.email || session.email,
        phone: user?.phone,
      },
      authorizedFlats: flats,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load service definition";
    console.error("GET /api/services/[serviceId] error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
