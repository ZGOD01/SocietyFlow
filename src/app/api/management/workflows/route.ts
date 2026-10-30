import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { getServerSession } from "@/lib/session";
import { connectDB } from "@/lib/db";
import { ApprovalWorkflow, IApprovalWorkflowStage } from "@/models/ApprovalWorkflow";
import { ServiceDefinition } from "@/models/ServiceDefinition";
import { ServiceRequest } from "@/models/ServiceRequest";
import { AuditEvent } from "@/models/AuditEvent";
import { COMMITTEE_ROLES, MembershipRole } from "@/lib/rbac";
import { DEFAULT_SERVICE_WORKFLOWS } from "@/lib/approvals/workflow-engine";

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
      return NextResponse.json({ error: "No active society context found" }, { status: 400 });
    }

    const isSuperAdmin = session.isSuperAdmin;
    const isCommittee = session.memberships?.some(
      (m) =>
        m.societyId === activeSocietyId &&
        m.status === "VERIFIED" &&
        COMMITTEE_ROLES.includes(m.role as MembershipRole)
    );

    if (!isSuperAdmin && !isCommittee) {
      return NextResponse.json(
        { error: "Forbidden: Committee privileges required" },
        { status: 403 }
      );
    }

    const socObjectId = new Types.ObjectId(activeSocietyId);

    // Fetch existing active workflows for this society
    const workflows = await ApprovalWorkflow.find({
      societyId: socObjectId,
      isActive: true,
    }).sort({ serviceCode: 1 });

    // Fetch society service catalog
    const services = await ServiceDefinition.find({ isActive: true })
      .select("code title category requiresOwnerAuthorization defaultSlaDays")
      .sort({ title: 1 })
      .lean();

    // Map each service with its active workflow or fallback default template
    const mapped = services.map((svc) => {
      const existing = workflows.find((w) => w.serviceCode === svc.code);
      const defaultTemplate =
        DEFAULT_SERVICE_WORKFLOWS[svc.code] || DEFAULT_SERVICE_WORKFLOWS.DEFAULT_APPROVAL;

      return {
        serviceCode: svc.code,
        serviceTitle: svc.title,
        serviceCategory: svc.category,
        requiresOwnerAuthorization: svc.requiresOwnerAuthorization,
        workflowId: existing?._id?.toString() || null,
        version: existing?.version || 1,
        isCustomized: Boolean(existing),
        stages: existing ? existing.stages : defaultTemplate.stages,
        requiresDocumentIssuance: existing
          ? existing.requiresDocumentIssuance
          : defaultTemplate.requiresDocumentIssuance,
        documentTemplateCode: existing
          ? existing.documentTemplateCode
          : defaultTemplate.documentTemplateCode,
        publishedAt: existing?.publishedAt || null,
        publishedByName: existing?.publishedByName || "System Default",
      };
    });

    return NextResponse.json({
      success: true,
      workflows: mapped,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load workflows";
    console.error("[Workflows GET Error]", message);
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
      return NextResponse.json({ error: "No active society context found" }, { status: 400 });
    }

    const isSuperAdmin = session.isSuperAdmin;
    const isCommittee = session.memberships?.some(
      (m) =>
        m.societyId === activeSocietyId &&
        m.status === "VERIFIED" &&
        ["SECRETARY", "CHAIRMAN", "SOCIETY_MANAGER"].includes(m.role)
    );

    if (!isSuperAdmin && !isCommittee) {
      return NextResponse.json(
        { error: "Forbidden: Secretary, Chairman, or Manager privileges required to configure workflows" },
        { status: 403 }
      );
    }

    const socObjectId = new Types.ObjectId(activeSocietyId);
    const body = await req.json();
    const {
      serviceCode,
      serviceTitle,
      stages,
      requiresDocumentIssuance,
      documentTemplateCode,
    } = body;

    if (!serviceCode || !Array.isArray(stages) || stages.length === 0) {
      return NextResponse.json(
        { error: "Invalid workflow configuration: serviceCode and at least 1 stage required" },
        { status: 400 }
      );
    }

    // Validation 1: Prevent impossible / cyclic or empty role configurations
    for (let i = 0; i < stages.length; i++) {
      const st = stages[i];
      if (!st.stageName || !st.stageKey) {
        return NextResponse.json(
          { error: `Stage ${i + 1} must have a valid stageName and stageKey` },
          { status: 400 }
        );
      }
      if (!Array.isArray(st.allowedRoles) || st.allowedRoles.length === 0) {
        return NextResponse.json(
          { error: `Stage '${st.stageName}' must assign at least one authorized role` },
          { status: 400 }
        );
      }
      if (st.expectedDays && st.expectedDays < 1) {
        return NextResponse.json(
          { error: `Stage '${st.stageName}' processing period must be at least 1 day` },
          { status: 400 }
        );
      }
    }

    // Validation 2: Ensure distinct stage keys
    const stageKeys = stages.map((s) => s.stageKey);
    const uniqueKeys = new Set(stageKeys);
    if (uniqueKeys.size !== stageKeys.length) {
      return NextResponse.json(
        { error: "Duplicate stageKeys detected. Each stage key must be unique within the workflow." },
        { status: 400 }
      );
    }

    // Validation 3: Check if there are active in-flight requests that would be affected by deleted steps
    const activeRequests = await ServiceRequest.countDocuments({
      societyId: socObjectId,
      serviceCode,
      currentStatus: { $in: ["AWAITING_SOCIETY_REVIEW", "UNDER_REVIEW"] },
    });

    // Determine current version number
    const latestExisting = await ApprovalWorkflow.findOne({
      societyId: socObjectId,
      serviceCode,
    }).sort({ version: -1 });

    const newVersion = (latestExisting?.version || 0) + 1;

    // Deactivate previous versions
    await ApprovalWorkflow.updateMany(
      { societyId: socObjectId, serviceCode },
      { $set: { isActive: false } }
    );

    // Normalize stages with sequential indices
    const normalizedStages: IApprovalWorkflowStage[] = stages.map((st, idx) => ({
      stageIndex: idx,
      stageKey: st.stageKey,
      stageName: st.stageName,
      stageType: st.stageType || "APPROVAL",
      allowedRoles: st.allowedRoles,
      approverLogic: st.approverLogic || "ANY_ONE",
      expectedDays: Number(st.expectedDays) || 3,
      description: st.description || "",
      requiredSignersCount: Number(st.requiredSignersCount) || 1,
    }));

    // Create and publish new workflow version
    const newWorkflow = await ApprovalWorkflow.create({
      societyId: socObjectId,
      serviceCode,
      serviceTitle: serviceTitle || serviceCode.replace(/_/g, " "),
      version: newVersion,
      isActive: true,
      stages: normalizedStages,
      requiresDocumentIssuance: Boolean(requiresDocumentIssuance),
      documentTemplateCode: requiresDocumentIssuance ? documentTemplateCode : undefined,
      publishedByUserId: new Types.ObjectId(session.id),
      publishedByName: session.name || "Society Committee",
      publishedAt: new Date(),
    });

    await AuditEvent.create({
      societyId: socObjectId,
      userId: new Types.ObjectId(session.id),
      action: "APPROVAL_WORKFLOW_PUBLISHED",
      entityType: "ApprovalWorkflow",
      entityId: newWorkflow._id.toString(),
      details: {
        serviceCode,
        version: newVersion,
        stagesCount: normalizedStages.length,
        inFlightRequestsCount: activeRequests,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Workflow version ${newVersion} published successfully for ${serviceCode}.`,
      workflow: newWorkflow,
      inFlightRequestsCount: activeRequests,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to save workflow";
    console.error("[Workflows POST Error]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
