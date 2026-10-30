import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/session";
import { connectDB } from "@/lib/db";
import {
  RegistrationRequest,
  ServiceRequest,
  SocietyMembership,
  FlatOccupancy,
  Flat,
} from "@/models";
import { COMMITTEE_ROLES } from "@/lib/rbac";
import { dispatchNotification } from "@/lib/notifications";

export async function GET(req: NextRequest) {
  return handleReminders(req);
}

export async function POST(req: NextRequest) {
  return handleReminders(req);
}

async function handleReminders(req: NextRequest) {
  try {
    // 1. Verify Authorization: Either CRON_SECRET or Management Session
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET || "societyflow_reminders_cron_secret_2026";
    const isCronAuthorized = authHeader === `Bearer ${cronSecret}`;

    let isManagementAuthorized = false;
    let triggeringUserId: string | null = null;

    if (!isCronAuthorized) {
      const session = await getServerSession();
      if (session) {
        triggeringUserId = session.id;
        const activeSocietyId =
          session.activeSocietyId || session.memberships?.[0]?.societyId;
        isManagementAuthorized =
          session.isSuperAdmin ||
          session.memberships?.some(
            (m) =>
              m.societyId.toString() === activeSocietyId?.toString() &&
              COMMITTEE_ROLES.includes(m.role as any)
          );
      }
    }

    if (!isCronAuthorized && !isManagementAuthorized) {
      return NextResponse.json(
        { error: "Unauthorized: Valid CRON_SECRET or Management role required" },
        { status: 401 }
      );
    }

    await connectDB();

    const todayStr = new Date().toISOString().slice(0, 10);
    const summary = {
      pendingOwnerAuthorizations: 0,
      pendingSocietyRegistrations: 0,
      pendingStageApprovals: 0,
      overdueRequests: 0,
      expiringDocuments: 0,
      totalDispatched: 0,
    };

    // --------------------------------------------------------------------------
    // A. Pending Owner Authorizations (Tenant registration waiting on owner)
    // --------------------------------------------------------------------------
    const pendingTenantRegs = await RegistrationRequest.find({
      role: "TENANT",
      status: "PENDING_APPROVAL",
      "ownerApproval.status": "PENDING",
      flatId: { $exists: true },
    }).lean();

    for (const reg of pendingTenantRegs) {
      if (!reg.flatId) continue;
      // Find property owner of this flat
      const ownerOccupancy: any = await FlatOccupancy.findOne({
        flatId: reg.flatId,
        occupancyType: "OWNER",
        status: "APPROVED",
      }).lean();

      if (ownerOccupancy) {
        const idempotencyKey = `REMINDER_TENANT_REG_OWNER_${reg._id.toString()}_${todayStr}`;
        const res = await dispatchNotification({
          eventType: "APPROVAL_REMINDER",
          category: "REMINDER",
          type: "action_required",
          title: "Reminder: Tenant Registration Awaiting Your Authorization",
          message: `Tenant registration for Flat ${reg.wingName || ""}-${reg.flatNumber} requires your authorization.`,
          actionUrl: `/owner/authorizations`,
          societyId: reg.societyId,
          recipients: [ownerOccupancy.userId],
          idempotencyKey,
        });

        if (res.inAppCount > 0 || res.emailDispatched > 0) {
          summary.pendingOwnerAuthorizations++;
          summary.totalDispatched++;
        }
      }
    }

    // --------------------------------------------------------------------------
    // B. Pending Society Registration Approvals (Owner or authorized tenant)
    // --------------------------------------------------------------------------
    const pendingSocietyRegs = await RegistrationRequest.find({
      status: "PENDING_APPROVAL",
      $or: [
        { role: "OWNER", "societyApproval.status": "PENDING" },
        {
          role: "TENANT",
          "ownerApproval.status": "APPROVED",
          "societyApproval.status": "PENDING",
        },
      ],
    }).lean();

    for (const reg of pendingSocietyRegs) {
      // Find society managers / secretary
      const managers = await SocietyMembership.find({
        societyId: reg.societyId,
        role: { $in: ["SECRETARY", "CHAIRMAN", "SOCIETY_MANAGER"] },
        status: "VERIFIED",
      }).lean();

      if (managers.length > 0) {
        const idempotencyKey = `REMINDER_SOCIETY_REG_${reg._id.toString()}_${todayStr}`;
        const res = await dispatchNotification({
          eventType: "APPROVAL_REMINDER",
          category: "REMINDER",
          type: "action_required",
          title: `Reminder: Registration Review for Flat ${reg.wingName || ""}-${reg.flatNumber}`,
          message: `${reg.role} registration for Flat ${reg.wingName || ""}-${reg.flatNumber} is pending managing committee review.`,
          actionUrl: `/management/approvals`,
          societyId: reg.societyId,
          recipients: managers.map((m) => m.userId),
          idempotencyKey,
        });

        if (res.inAppCount > 0 || res.emailDispatched > 0) {
          summary.pendingSocietyRegistrations++;
          summary.totalDispatched++;
        }
      }
    }

    // --------------------------------------------------------------------------
    // C. Pending Service Request Stage Approvals & Overdue Requests
    // --------------------------------------------------------------------------
    const pendingServiceRequests = await ServiceRequest.find({
      status: { $in: ["UNDER_REVIEW", "PENDING_VERIFICATION"] },
      "approvalWorkflow.stages": { $exists: true },
    }).lean();

    const now = new Date();

    for (const sReq of pendingServiceRequests) {
      const activeStage = sReq.approvalWorkflow?.stages?.find(
        (st) => st.status === "IN_PROGRESS"
      );

      if (activeStage && activeStage.allowedRoles?.length > 0) {
        // Calculate overdue status
        const startedAt = activeStage.startedAt ? new Date(activeStage.startedAt) : sReq.createdAt;
        const expectedDays = activeStage.expectedDays || 3;
        const dueDate = new Date(new Date(startedAt).getTime() + expectedDays * 24 * 60 * 60 * 1000);
        const isOverdue = now.getTime() > dueDate.getTime();

        // Find officials matching allowedRoles for this stage
        const targetOfficials = await SocietyMembership.find({
          societyId: sReq.societyId,
          role: { $in: activeStage.allowedRoles as any },
          status: "VERIFIED",
        }).lean();

        if (targetOfficials.length > 0) {
          const eventType = isOverdue ? "APPROVAL_OVERDUE" : "APPROVAL_REMINDER";
          const idempotencyKey = `${eventType}_REQ_${sReq._id.toString()}_STAGE_${activeStage.stageIndex}_${todayStr}`;

          const res = await dispatchNotification({
            eventType,
            category: "REMINDER",
            type: isOverdue ? "warning" : "action_required",
            title: isOverdue
              ? `OVERDUE: Service Request ${sReq.requestId} Requires Action`
              : `Reminder: Service Request ${sReq.requestId} Pending Your Approval`,
            message: `Request for "${sReq.serviceTitle}" (${activeStage.stageName}) is ${
              isOverdue ? "overdue target SLA" : "waiting for your stage review"
            }.`,
            actionUrl: `/management/approvals/${sReq._id.toString()}`,
            societyId: sReq.societyId,
            recipients: (targetOfficials as any[]).map((o) => o.userId),
            idempotencyKey,
          });

          if (res.inAppCount > 0 || res.emailDispatched > 0) {
            if (isOverdue) summary.overdueRequests++;
            else summary.pendingStageApprovals++;
            summary.totalDispatched++;
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      triggeredBy: isCronAuthorized ? "CRON_SCHEDULER" : `USER_${triggeringUserId}`,
      summary,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error executing reminder job";
    console.error("[Reminders Job Error]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
