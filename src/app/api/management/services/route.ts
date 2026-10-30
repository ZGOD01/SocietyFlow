import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { getServerSession } from "@/lib/session";
import { connectDB } from "@/lib/db";
import { ServiceDefinition, AuditEvent } from "@/models";
import { ensureSocietyServices } from "@/lib/services/service-catalogue";
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

    const isManagement = session.memberships?.some(
      (m) =>
        m.societyId === activeSocietyId &&
        m.status === "VERIFIED" &&
        COMMITTEE_ROLES.includes(m.role as MembershipRole)
    );

    if (!session.isSuperAdmin && !isManagement) {
      return NextResponse.json(
        { error: "Forbidden: Committee privileges required" },
        { status: 403 }
      );
    }

    const socObjectId = new Types.ObjectId(activeSocietyId);
    await ensureSocietyServices(socObjectId);

    const services = await ServiceDefinition.find({ societyId: socObjectId })
      .sort({ category: 1, title: 1 })
      .lean();

    return NextResponse.json({
      success: true,
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
        requiredFields: s.requiredFields || [],
        requiredDocuments: s.requiredDocuments || [],
        version: s.version,
        updatedAt: s.updatedAt,
      })),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load management services";
    console.error("GET /api/management/services error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
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
        { error: "No active society context found" },
        { status: 400 }
      );
    }

    const isManagement = session.memberships?.some(
      (m) =>
        m.societyId === activeSocietyId &&
        m.status === "VERIFIED" &&
        COMMITTEE_ROLES.includes(m.role as MembershipRole)
    );

    if (!session.isSuperAdmin && !isManagement) {
      return NextResponse.json(
        { error: "Forbidden: Committee privileges required" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      serviceId,
      title,
      description,
      eligibility,
      requiresOwnerAuthorization,
      estimatedProcessingDays,
      isActive,
      requiredFields,
      requiredDocuments,
    } = body;

    if (!serviceId) {
      return NextResponse.json(
        { error: "Service ID is required" },
        { status: 400 }
      );
    }

    const existingService = await ServiceDefinition.findOne({
      _id: new Types.ObjectId(serviceId),
      societyId: new Types.ObjectId(activeSocietyId),
    });

    if (!existingService) {
      return NextResponse.json(
        { error: "Service definition not found" },
        { status: 404 }
      );
    }

    // Apply updates
    if (typeof title === "string" && title.trim()) existingService.title = title.trim();
    if (typeof description === "string" && description.trim()) existingService.description = description.trim();
    if (["OWNER", "TENANT", "BOTH"].includes(eligibility)) existingService.eligibility = eligibility;
    if (typeof requiresOwnerAuthorization === "boolean")
      existingService.requiresOwnerAuthorization = requiresOwnerAuthorization;
    if (typeof estimatedProcessingDays === "number" && estimatedProcessingDays > 0)
      existingService.estimatedProcessingDays = estimatedProcessingDays;
    if (typeof isActive === "boolean") existingService.isActive = isActive;
    if (Array.isArray(requiredFields)) existingService.requiredFields = requiredFields;
    if (Array.isArray(requiredDocuments)) existingService.requiredDocuments = requiredDocuments;

    existingService.version += 1;
    await existingService.save();

    // Audit Log
    await AuditEvent.create({
      societyId: new Types.ObjectId(activeSocietyId),
      userId: new Types.ObjectId(session.id),
      action: "SERVICE_TEMPLATE_CONFIGURED",
      entityType: "SERVICE_DEFINITION",
      entityId: existingService._id.toString(),
      details: {
        serviceCode: existingService.code,
        version: existingService.version,
        updatedBy: session.name || session.email,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Service '${existingService.title}' updated successfully to version ${existingService.version}`,
      service: existingService,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update service configuration";
    console.error("PATCH /api/management/services error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
