import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/session";
import { connectDB } from "@/lib/db";
import {
  Society,
  Building,
  Wing,
  Flat,
  AuditEvent,
} from "@/models";
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
        { error: "No active society found." },
        { status: 400 }
      );
    }

    const isManagement = session.isSuperAdmin || session.memberships?.some(
      (m) =>
        m.societyId === activeSocietyId &&
        m.status === "VERIFIED" &&
        COMMITTEE_ROLES.includes(m.role as MembershipRole)
    );

    if (!isManagement) {
      return NextResponse.json(
        { error: "Forbidden: Management privileges required." },
        { status: 403 }
      );
    }

    const [society, buildings, wings, flats] = await Promise.all([
      Society.findById(activeSocietyId).lean(),
      Building.find({ societyId: activeSocietyId, isActive: { $ne: false } }).sort({ name: 1 }).lean(),
      Wing.find({ societyId: activeSocietyId, isActive: { $ne: false } }).sort({ name: 1 }).lean(),
      Flat.find({ societyId: activeSocietyId, isActive: { $ne: false } }).lean(),
    ]);

    if (!society) {
      return NextResponse.json({ error: "Society not found." }, { status: 404 });
    }

    // Structure hierarchy: Buildings -> Wings -> Flats
    const structure = buildings.map((b) => {
      const buildingWings = wings.filter(
        (w) => w.buildingId?.toString() === b._id.toString()
      );

      const wingData = (buildingWings.length > 0 ? buildingWings : wings).map((w) => {
        const wingFlats = flats.filter(
          (f) => f.wingId?.toString() === w._id.toString()
        );

        // Group flats by floor
        const floorMap = new Map<number, number>();
        wingFlats.forEach((f) => {
          floorMap.set(f.floor, (floorMap.get(f.floor) || 0) + 1);
        });

        const floorDetails = Array.from(floorMap.entries())
          .sort(([a], [b]) => a - b)
          .map(([floor, count]) => ({ floor, flatCount: count }));

        return {
          id: w._id.toString(),
          name: w.name,
          totalFlats: wingFlats.length,
          totalFloors: w.totalFloors || floorDetails.length || 1,
          flatsPerFloor: w.flatsPerFloor || 4,
          floors: floorDetails,
        };
      });

      const buildingFlats = flats.filter(
        (f) => f.buildingId?.toString() === b._id.toString()
      );

      return {
        id: b._id.toString(),
        name: b.name,
        totalFloors: b.totalFloors,
        totalWings: wingData.length,
        totalFlats: buildingFlats.length || flats.length,
        description: b.description,
        wings: wingData,
      };
    });

    // Standalone wings not linked to a specific building
    const unlinkedWings = wings
      .filter((w) => !w.buildingId)
      .map((w) => {
        const wingFlats = flats.filter(
          (f) => f.wingId?.toString() === w._id.toString()
        );
        return {
          id: w._id.toString(),
          name: w.name,
          totalFlats: wingFlats.length,
          totalFloors: w.totalFloors || 1,
        };
      });

    return NextResponse.json({
      success: true,
      society: {
        id: society._id.toString(),
        name: society.name,
        code: society.code,
        registrationNumber: society.registrationNumber,
        totalBuildings: buildings.length,
        totalWings: wings.length,
        totalFlats: flats.length,
      },
      buildings: structure,
      unlinkedWings,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load society structure";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const activeSocietyId =
      session.activeSocietyId || session.memberships?.[0]?.societyId;

    if (!activeSocietyId) {
      return NextResponse.json({ error: "No active society found." }, { status: 400 });
    }

    const isManagement = session.isSuperAdmin || session.memberships?.some(
      (m) =>
        m.societyId === activeSocietyId &&
        m.status === "VERIFIED" &&
        COMMITTEE_ROLES.includes(m.role as MembershipRole)
    );

    if (!isManagement) {
      return NextResponse.json(
        { error: "Forbidden: Management privileges required." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { action } = body;

    if (action === "ADD_BUILDING") {
      const { name, totalFloors = 1, description } = body;
      if (!name?.trim()) {
        return NextResponse.json({ error: "Building name is required." }, { status: 400 });
      }

      const existing = await Building.findOne({
        societyId: activeSocietyId,
        name: name.trim(),
      });
      if (existing) {
        return NextResponse.json(
          { error: `Building "${name.trim()}" already exists in this society.` },
          { status: 409 }
        );
      }

      const building = await Building.create({
        societyId: activeSocietyId,
        name: name.trim(),
        totalFloors: Number(totalFloors) || 1,
        description: description?.trim(),
      });

      await AuditEvent.create({
        societyId: activeSocietyId,
        userId: session.id,
        action: "BUILDING_CREATED",
        entityType: "Building",
        entityId: building._id.toString(),
        details: { name: building.name, totalFloors: building.totalFloors },
      });

      return NextResponse.json({ success: true, building });
    }

    if (action === "ADD_WING") {
      const { name, buildingId, totalFloors = 1, flatsPerFloor = 4 } = body;
      if (!name?.trim()) {
        return NextResponse.json({ error: "Wing name is required." }, { status: 400 });
      }

      const existing = await Wing.findOne({
        societyId: activeSocietyId,
        name: name.trim(),
      });
      if (existing) {
        return NextResponse.json(
          { error: `Wing "${name.trim()}" already exists in this society.` },
          { status: 409 }
        );
      }

      const wing = await Wing.create({
        societyId: activeSocietyId,
        buildingId: buildingId || undefined,
        name: name.trim(),
        totalFloors: Number(totalFloors) || 1,
        flatsPerFloor: Number(flatsPerFloor) || 4,
      });

      await AuditEvent.create({
        societyId: activeSocietyId,
        userId: session.id,
        action: "WING_CREATED",
        entityType: "Wing",
        entityId: wing._id.toString(),
        details: { name: wing.name, buildingId, totalFloors },
      });

      return NextResponse.json({ success: true, wing });
    }

    if (action === "SETUP_INITIAL_STRUCTURE") {
      const {
        buildingName,
        wingNames = ["Wing A", "Wing B"],
        floorsPerWing = 4,
        flatsPerFloor = 4,
        bhkType = "2 BHK",
        pattern = "WING_FLOOR_UNIT",
      } = body;

      let building = null;
      if (buildingName?.trim()) {
        building = await Building.findOne({
          societyId: activeSocietyId,
          name: buildingName.trim(),
        });
        if (!building) {
          building = await Building.create({
            societyId: activeSocietyId,
            name: buildingName.trim(),
            totalFloors: Number(floorsPerWing) || 4,
          });
        }
      }

      let createdWingsCount = 0;
      let createdFlatsCount = 0;

      const wingsToCreate: string[] =
        Array.isArray(wingNames) && wingNames.length > 0
          ? wingNames
          : ["Wing A", "Wing B"];

      for (const wName of wingsToCreate) {
        const cleanName = String(wName).trim();
        if (!cleanName) continue;

        let wing = await Wing.findOne({
          societyId: activeSocietyId,
          name: cleanName,
        });

        if (!wing) {
          wing = await Wing.create({
            societyId: activeSocietyId,
            buildingId: building ? building._id : undefined,
            name: cleanName,
            totalFloors: Number(floorsPerWing) || 4,
            flatsPerFloor: Number(flatsPerFloor) || 4,
          });
          createdWingsCount++;
        }

        // Generate flats for this wing
        const wingPfx = cleanName.replace(/Wing\s*/i, "").trim();
        const totalF = Math.max(1, Number(floorsPerWing) || 4);
        const fPerFloor = Math.max(1, Number(flatsPerFloor) || 4);

        for (let fl = 1; fl <= totalF; fl++) {
          for (let u = 1; u <= fPerFloor; u++) {
            const uStr = u < 10 ? `0${u}` : `${u}`;
            const flatNum =
              pattern === "WING_FLOOR_UNIT" && wingPfx
                ? `${wingPfx}-${fl}${uStr}`
                : `${fl}${uStr}`;

            const existingFlat = await Flat.findOne({
              societyId: activeSocietyId,
              wingId: wing._id,
              flatNumber: flatNum,
            });

            if (!existingFlat) {
              await Flat.create({
                societyId: activeSocietyId,
                buildingId: building ? building._id : undefined,
                wingId: wing._id,
                flatNumber: flatNum,
                floor: fl,
                bhkType: bhkType || "2 BHK",
                defaultOccupancyType: "VACANT",
                isActive: true,
              });
              createdFlatsCount++;
            }
          }
        }
      }

      await Society.findByIdAndUpdate(activeSocietyId, {
        $inc: { totalFlats: createdFlatsCount, totalWings: createdWingsCount },
      });

      await AuditEvent.create({
        societyId: activeSocietyId,
        userId: session.id,
        action: "STRUCTURE_INITIALIZED",
        entityType: "Society",
        entityId: activeSocietyId,
        details: { createdWingsCount, createdFlatsCount, buildingName },
      });

      return NextResponse.json({
        success: true,
        message: `Initialized ${createdWingsCount} new wings and ${createdFlatsCount} flats.`,
        createdWingsCount,
        createdFlatsCount,
      });
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to execute structure action";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
