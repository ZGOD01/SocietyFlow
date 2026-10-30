import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/session";
import { connectDB } from "@/lib/db";
import {
  Flat,
  Wing,
  Building,
  Society,
  FlatOccupancy,
  RegistrationRequest,
  DocumentModel,
  AuditEvent,
} from "@/models";
import { COMMITTEE_ROLES, MembershipRole } from "@/lib/rbac";

export async function GET(req: NextRequest) {
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

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim().toLowerCase();
    const wingId = searchParams.get("wingId");
    const buildingId = searchParams.get("buildingId");
    const floor = searchParams.get("floor");
    const occupancy = searchParams.get("occupancy");
    const status = searchParams.get("status") || "ACTIVE";

    const query: Record<string, unknown> = {
      societyId: activeSocietyId,
    };

    if (status !== "ALL") {
      query.isActive = status === "ACTIVE";
    }

    if (wingId && wingId !== "ALL") {
      query.wingId = wingId;
    }

    if (buildingId && buildingId !== "ALL") {
      query.buildingId = buildingId;
    }

    if (floor && floor !== "ALL") {
      query.floor = Number(floor);
    }

    if (occupancy && occupancy !== "ALL") {
      query.defaultOccupancyType = occupancy;
    }

    // Self-healing: if society has wings registered but 0 flats, populate initial units dynamically
    const currentFlatsCount = await Flat.countDocuments({ societyId: activeSocietyId });
    if (currentFlatsCount === 0) {
      const societyWings = await Wing.find({ societyId: activeSocietyId });
      if (societyWings.length > 0) {
        let totalCreated = 0;
        for (const w of societyWings) {
          const floors = w.totalFloors || 4;
          const perFloor = w.flatsPerFloor || 4;
          const wingPfx = w.name.replace(/Wing\s*/i, "").trim() || "A";

          for (let fl = 1; fl <= floors; fl++) {
            for (let u = 1; u <= perFloor; u++) {
              const uStr = u < 10 ? `0${u}` : `${u}`;
              const flatNum = `${wingPfx}-${fl}${uStr}`;
              await Flat.create({
                societyId: activeSocietyId,
                wingId: w._id,
                flatNumber: flatNum,
                floor: fl,
                bhkType: "2 BHK",
                defaultOccupancyType: "VACANT",
                isActive: true,
                status: "ACTIVE",
              });
              totalCreated++;
            }
          }

          await Wing.findByIdAndUpdate(w._id, {
            totalFloors: floors,
            flatsPerFloor: perFloor,
            totalFlats: floors * perFloor,
          });
        }

        await Society.findByIdAndUpdate(activeSocietyId, {
          totalFlats: totalCreated,
        });
      }
    }

    // Fetch flats
    const flats = await Flat.find(query)
      .populate("wingId", "name")
      .populate("buildingId", "name")
      .populate("currentOwnerId", "name email phone")
      .populate("currentTenantId", "name email phone")
      .sort({ floor: 1, flatNumber: 1 })
      .lean();

    // Fetch active occupancies for these flats
    const flatIds = flats.map((f) => f._id);
    const [occupancies, allRequests, docCounts] = await Promise.all([
      FlatOccupancy.find({
        flatId: { $in: flatIds },
      })
        .populate("userId", "name email phone")
        .sort({ updatedAt: -1, createdAt: -1 })
        .lean(),
      RegistrationRequest.find({
        flatId: { $in: flatIds },
      })
        .sort({ updatedAt: -1, createdAt: -1 })
        .lean(),
      DocumentModel.aggregate([
        {
          $match: {
            flatId: { $in: flatIds },
            scope: "PROPERTY",
            isArchived: false,
          },
        },
        {
          $group: {
            _id: "$flatId",
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const docCountMap = new Map<string, number>();
    docCounts.forEach((dc) => {
      docCountMap.set(dc._id.toString(), dc.count);
    });

    const pendingRequestMap = new Map<string, number>();
    allRequests.forEach((pr) => {
      if (
        pr.flatId &&
        [
          "PENDING_APPROVAL",
          "OWNER_APPROVED_SOCIETY_PENDING",
          "SOCIETY_APPROVED_OWNER_PENDING",
        ].includes(pr.status)
      ) {
        pendingRequestMap.set(
          pr.flatId.toString(),
          (pendingRequestMap.get(pr.flatId.toString()) || 0) + 1
        );
      }
    });

    // Enrich flats
    interface PopulatedRef {
      _id: { toString(): string };
      name?: string;
      email?: string;
      phone?: string;
    }

    const enrichedFlats = flats
      .map((flat) => {
        const flatOccs = occupancies.filter(
          (o) => o.flatId?.toString() === flat._id.toString()
        );
        const ownerOcc =
          flatOccs.find(
            (o) =>
              o.occupancyType === "OWNER" &&
              o.status === "APPROVED"
          ) || flatOccs.find((o) => o.occupancyType === "OWNER");
        const tenantOcc =
          flatOccs.find(
            (o) =>
              o.occupancyType === "TENANT" &&
              o.status === "APPROVED"
          ) || flatOccs.find((o) => o.occupancyType === "TENANT");

        const ownerUser = flat.currentOwnerId as unknown as PopulatedRef | undefined;
        const tenantUser = flat.currentTenantId as unknown as PopulatedRef | undefined;
        const wing = flat.wingId as unknown as PopulatedRef | undefined;
        const building = flat.buildingId as unknown as PopulatedRef | undefined;

        // Check for approved registration requests for this flat as fallback
        const flatRequests = allRequests.filter(
          (r) => r.flatId?.toString() === flat._id.toString()
        );
        const approvedOwnerReq = flatRequests.find(
          (r) =>
            r.role === "OWNER" &&
            (r.status === "APPROVED" || r.onboardingStatus === "COMPLETED")
        );
        const approvedTenantReq = flatRequests.find(
          (r) =>
            r.role === "TENANT" &&
            (r.status === "APPROVED" || r.onboardingStatus === "COMPLETED")
        );

        let ownerInfo = ownerOcc?.userId
          ? {
              id: (ownerOcc.userId as unknown as PopulatedRef)._id.toString(),
              name: (ownerOcc.userId as unknown as PopulatedRef).name || "Owner",
              email: (ownerOcc.userId as unknown as PopulatedRef).email,
              phone: (ownerOcc.userId as unknown as PopulatedRef).phone,
              ownershipType: ownerOcc.ownershipType,
              status: "REGISTERED",
            }
          : ownerUser
          ? {
              id: ownerUser._id.toString(),
              name: ownerUser.name || "Owner",
              email: ownerUser.email,
              phone: ownerUser.phone,
              status: "REGISTERED",
            }
          : approvedOwnerReq
          ? {
              id: approvedOwnerReq.applicantId?.toString() || "",
              name: approvedOwnerReq.applicantName,
              email: approvedOwnerReq.applicantEmail,
              phone: approvedOwnerReq.applicantPhone,
              ownershipType: approvedOwnerReq.ownershipType,
              status: "REGISTERED",
            }
          : null;

        let tenantInfo = tenantOcc?.userId
          ? {
              id: (tenantOcc.userId as unknown as PopulatedRef)._id.toString(),
              name: (tenantOcc.userId as unknown as PopulatedRef).name || "Tenant",
              email: (tenantOcc.userId as unknown as PopulatedRef).email,
              phone: (tenantOcc.userId as unknown as PopulatedRef).phone,
              leaseStartDate: tenantOcc.leaseStartDate,
              leaseEndDate: tenantOcc.leaseEndDate,
              status: "ACTIVE",
            }
          : tenantUser
          ? {
              id: tenantUser._id.toString(),
              name: tenantUser.name || "Tenant",
              email: tenantUser.email,
              phone: tenantUser.phone,
              status: "ACTIVE",
            }
          : approvedTenantReq
          ? {
              id: approvedTenantReq.applicantId?.toString() || "",
              name: approvedTenantReq.applicantName,
              email: approvedTenantReq.applicantEmail,
              phone: approvedTenantReq.applicantPhone,
              status: "ACTIVE",
            }
          : null;

        const computedOccupancyType = tenantInfo
          ? "TENANT_OCCUPIED"
          : ownerInfo
          ? "OWNER_OCCUPIED"
          : flat.defaultOccupancyType || "VACANT";

        // Proactively synchronize Flat model if owner exists
        if (ownerInfo && !flat.currentOwnerId) {
          Flat.findByIdAndUpdate(flat._id, {
            $set: {
              currentOwnerId: ownerInfo.id,
              defaultOccupancyType: computedOccupancyType,
            },
          }).exec().catch(() => {});
        }

        const hasPendingApproval = Boolean(
          (pendingRequestMap.get(flat._id.toString()) || 0) > 0
        );

        const wingName = wing?.name || "Wing A";
        const wingIdStr = wing?._id ? wing._id.toString() : flat.wingId?.toString() || "";

        return {
          id: flat._id.toString(),
          flatNumber: flat.flatNumber,
          floor: flat.floor,
          wing: {
            id: wingIdStr,
            name: wingName,
          },
          wingName,
          wingId: wingIdStr,
          building: building
            ? { id: building._id.toString(), name: building.name }
            : undefined,
          buildingName: building?.name,
          buildingId: building?._id ? building._id.toString() : flat.buildingId?.toString(),
          carpetAreaSqFt: flat.carpetAreaSqFt,
          bhkType: flat.bhkType,
          occupancyType: computedOccupancyType,
          defaultOccupancyType: computedOccupancyType,
          shareCertificateNumber: flat.shareCertificateNumber,
          owner: ownerInfo,
          currentOwner: ownerInfo,
          tenant: tenantInfo,
          currentTenant: tenantInfo,
          ownerStatus: ownerInfo ? "REGISTERED" : "UNASSIGNED",
          tenantStatus: tenantInfo ? "ACTIVE" : "NONE",
          documentCount: docCountMap.get(flat._id.toString()) || 0,
          propertyDocCount: docCountMap.get(flat._id.toString()) || 0,
          pendingApprovals: hasPendingApproval,
          pendingApprovalsCount: pendingRequestMap.get(flat._id.toString()) || 0,
          isActive: flat.isActive !== false,
          status: flat.status || (flat.isActive !== false ? "ACTIVE" : "INACTIVE"),
          createdAt: flat.createdAt ? new Date(flat.createdAt).toISOString() : new Date().toISOString(),
        };
      })
      .filter((f) => {
        if (!search) return true;
        return (
          f.flatNumber.toLowerCase().includes(search) ||
          f.wingName.toLowerCase().includes(search) ||
          f.owner?.name?.toLowerCase().includes(search) ||
          f.tenant?.name?.toLowerCase().includes(search)
        );
      });

    // Metrics for the whole society calculated dynamically from enriched flats
    const registeredOwners = enrichedFlats.filter(
      (f) => f.currentOwner || f.owner || f.defaultOccupancyType === "OWNER_OCCUPIED"
    ).length;

    const activeTenants = enrichedFlats.filter(
      (f) => f.currentTenant || f.tenant || f.defaultOccupancyType === "TENANT_OCCUPIED"
    ).length;

    const vacantFlats = enrichedFlats.filter(
      (f) => !(f.currentOwner || f.owner) && !(f.currentTenant || f.tenant)
    ).length;

    // Filter metadata options
    const [wingsList, buildingsList] = await Promise.all([
      Wing.find({ societyId: activeSocietyId, isActive: { $ne: false } }).sort({ name: 1 }).lean(),
      Building.find({ societyId: activeSocietyId, isActive: { $ne: false } }).sort({ name: 1 }).lean(),
    ]);

    return NextResponse.json({
      success: true,
      stats: {
        totalFlats: flats.length,
        registeredOwners,
        activeTenants,
        vacantFlats,
      },
      flats: enrichedFlats,
      wings: wingsList.map((w) => ({ id: w._id.toString(), name: w.name })),
      buildings: buildingsList.map((b) => ({ id: b._id.toString(), name: b.name })),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load flats directory";
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

    // 1. ADD SINGLE FLAT MANUALLY
    if (action === "CREATE_FLAT") {
      const {
        buildingId,
        wingId,
        flatNumber,
        floor,
        carpetAreaSqFt,
        bhkType,
        shareCertificateNumber,
        defaultOccupancyType = "VACANT",
      } = body;

      if (!flatNumber?.trim() || !floor) {
        return NextResponse.json(
          { error: "Flat number and floor are required." },
          { status: 400 }
        );
      }

      const cleanFlatNumber = flatNumber.trim().toUpperCase();

      // Duplicate prevention within building/wing context
      const existingQuery: Record<string, unknown> = {
        societyId: activeSocietyId,
        flatNumber: cleanFlatNumber,
      };
      if (wingId) existingQuery.wingId = wingId;
      if (buildingId) existingQuery.buildingId = buildingId;

      const existingFlat = await Flat.findOne(existingQuery);
      if (existingFlat) {
        return NextResponse.json(
          {
            error: `Flat "${cleanFlatNumber}" already exists in this wing/building.`,
          },
          { status: 409 }
        );
      }

      const flat = await Flat.create({
        societyId: activeSocietyId,
        wingId: wingId || undefined,
        buildingId: buildingId || undefined,
        flatNumber: cleanFlatNumber,
        floor: Number(floor),
        carpetAreaSqFt: carpetAreaSqFt ? Number(carpetAreaSqFt) : undefined,
        bhkType: bhkType?.trim(),
        shareCertificateNumber: shareCertificateNumber?.trim(),
        defaultOccupancyType,
        isActive: true,
        status: "ACTIVE",
      });

      // Update counters
      if (wingId) {
        await Wing.findByIdAndUpdate(wingId, { $inc: { totalFlats: 1 } });
      }
      await Society.findByIdAndUpdate(activeSocietyId, { $inc: { totalFlats: 1 } });

      await AuditEvent.create({
        societyId: activeSocietyId,
        userId: session.id,
        action: "FLAT_CREATED",
        entityType: "Flat",
        entityId: flat._id.toString(),
        details: { flatNumber: cleanFlatNumber, floor, wingId, buildingId },
      });

      return NextResponse.json({ success: true, flat });
    }

    // 2. AUTO-GENERATE FLATS (BULK GENERATION - IDEMPOTENT)
    if (action === "GENERATE_FLATS") {
      const {
        buildingId,
        wingId,
        startFloor = 1,
        endFloor = 10,
        flatsPerFloor = 4,
        numberingPattern = "FLOOR_UNIT", // "FLOOR_UNIT" (101, 102) | "WING_FLOOR_UNIT" (A-101, A-102)
        prefix = "",
        carpetAreaSqFt,
        bhkType,
      } = body;

      const sFloor = Number(startFloor);
      const eFloor = Number(endFloor);
      const perFloor = Number(flatsPerFloor);

      if (sFloor < 0 || eFloor < sFloor || perFloor <= 0 || perFloor > 50) {
        return NextResponse.json(
          { error: "Invalid floor range or flats-per-floor specification." },
          { status: 400 }
        );
      }

      let wingPrefix = prefix.trim();
      if (!wingPrefix && wingId) {
        const wing = await Wing.findById(wingId).lean();
        if (wing?.name) {
          wingPrefix = wing.name.replace(/Wing\s*/i, "").trim();
        }
      }

      const generatedCandidates: Array<{
        flatNumber: string;
        floor: number;
      }> = [];

      for (let fl = sFloor; fl <= eFloor; fl++) {
        for (let unit = 1; unit <= perFloor; unit++) {
          const unitStr = unit < 10 ? `0${unit}` : `${unit}`;
          let fNum = `${fl}${unitStr}`;

          if (numberingPattern === "WING_FLOOR_UNIT" && wingPrefix) {
            fNum = `${wingPrefix}-${fl}${unitStr}`;
          }

          generatedCandidates.push({ flatNumber: fNum, floor: fl });
        }
      }

      // Check existing flats in this wing/society to prevent duplicates
      const existingFlats = await Flat.find({
        societyId: activeSocietyId,
        ...(wingId ? { wingId } : {}),
        flatNumber: { $in: generatedCandidates.map((c) => c.flatNumber) },
      }).lean();

      const existingSet = new Set(existingFlats.map((ef) => ef.flatNumber));

      const newFlatsToInsert = generatedCandidates
        .filter((c) => !existingSet.has(c.flatNumber))
        .map((c) => ({
          societyId: activeSocietyId,
          wingId: wingId || undefined,
          buildingId: buildingId || undefined,
          flatNumber: c.flatNumber,
          floor: c.floor,
          carpetAreaSqFt: carpetAreaSqFt ? Number(carpetAreaSqFt) : undefined,
          bhkType: bhkType?.trim(),
          defaultOccupancyType: "VACANT",
          isActive: true,
          status: "ACTIVE",
        }));

      if (newFlatsToInsert.length > 0) {
        await Flat.insertMany(newFlatsToInsert);

        if (wingId) {
          await Wing.findByIdAndUpdate(wingId, {
            $inc: { totalFlats: newFlatsToInsert.length },
            totalFloors: eFloor,
            flatsPerFloor: perFloor,
          });
        }

        await Society.findByIdAndUpdate(activeSocietyId, {
          $inc: { totalFlats: newFlatsToInsert.length },
        });

        await AuditEvent.create({
          societyId: activeSocietyId,
          userId: session.id,
          action: "FLATS_BULK_GENERATED",
          entityType: "Flat",
          details: {
            wingId,
            buildingId,
            generatedCount: newFlatsToInsert.length,
            skippedExistingCount: existingSet.size,
            startFloor: sFloor,
            endFloor: eFloor,
          },
        });
      }

      return NextResponse.json({
        success: true,
        generatedCount: newFlatsToInsert.length,
        skippedCount: existingSet.size,
        totalAttempted: generatedCandidates.length,
        message: `Successfully generated ${newFlatsToInsert.length} flats (${existingSet.size} existing units skipped).`,
      });
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to execute flats operation";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
