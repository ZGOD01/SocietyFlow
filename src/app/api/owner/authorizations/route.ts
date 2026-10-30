import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { getServerSession } from "@/lib/session";
import { connectDB } from "@/lib/db";
import {
  ServiceRequest,
  Flat,
  FlatOccupancy,
  Notification,
  AuditEvent,
  SocietyMembership,
} from "@/models";
import { COMMITTEE_ROLES } from "@/lib/rbac";
import { dispatchNotification } from "@/lib/notifications";

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
      return NextResponse.json(
        { error: "No active society context found" },
        { status: 400 }
      );
    }

    const socObjectId = new Types.ObjectId(activeSocietyId);
    const userObjectId = new Types.ObjectId(session.id);

    // Find all flats owned by this user in this society
    const ownedFlats = await Flat.find({
      societyId: socObjectId,
      currentOwnerId: userObjectId,
      isActive: { $ne: false },
    }).select("_id");

    const ownedFlatOccupancies = await FlatOccupancy.find({
      societyId: socObjectId,
      userId: userObjectId,
      occupancyType: "OWNER",
      status: "APPROVED",
    }).select("flatId");

    const ownedFlatIds = Array.from(
      new Set([
        ...ownedFlats.map((f) => f._id.toString()),
        ...ownedFlatOccupancies.map((o) => o.flatId.toString()),
      ])
    ).map((id) => new Types.ObjectId(id));

    // If user owns no flats and is not super admin, return empty
    if (ownedFlatIds.length === 0 && !session.isSuperAdmin) {
      return NextResponse.json({
        success: true,
        stats: { pending: 0, authorized: 0, declined: 0, infoRequested: 0 },
        authorizations: [],
      });
    }

    const { searchParams } = new URL(req.url);
    const tab = searchParams.get("tab") || "PENDING";
    const search = searchParams.get("search")?.trim().toLowerCase();

    const baseFilter: Record<string, unknown> = {
      societyId: socObjectId,
      applicantRole: "TENANT",
      $or: [
        { "ownerAuthorization.ownerUserId": userObjectId },
        { flatId: { $in: ownedFlatIds } },
      ],
    };

    const filter: Record<string, unknown> = { ...baseFilter };

    switch (tab.toUpperCase()) {
      case "PENDING":
        filter["ownerAuthorization.status"] = "PENDING";
        filter.currentStatus = "AWAITING_OWNER_AUTHORIZATION";
        break;
      case "AUTHORIZED":
        filter["ownerAuthorization.status"] = "AUTHORIZED";
        break;
      case "DECLINED":
        filter["ownerAuthorization.status"] = "DECLINED";
        break;
      case "INFO_REQUESTED":
        filter["ownerAuthorization.status"] = "INFO_REQUESTED";
        break;
      default:
        // "ALL": show everything
        break;
    }

    if (search) {
      filter.$and = [
        {
          $or: [
            { requestId: new RegExp(search, "i") },
            { serviceTitle: new RegExp(search, "i") },
          ],
        },
      ];
    }

    const requests = await ServiceRequest.find(filter)
      .populate("flatId", "flatNumber floor bhkType")
      .populate("applicantUserId", "name email phone")
      .sort({ createdAt: -1 })
      .lean();

    // Summary counts
    const [pendingCount, authorizedCount, declinedCount, infoReqCount] =
      await Promise.all([
        ServiceRequest.countDocuments({
          ...baseFilter,
          "ownerAuthorization.status": "PENDING",
          currentStatus: "AWAITING_OWNER_AUTHORIZATION",
        }),
        ServiceRequest.countDocuments({
          ...baseFilter,
          "ownerAuthorization.status": "AUTHORIZED",
        }),
        ServiceRequest.countDocuments({
          ...baseFilter,
          "ownerAuthorization.status": "DECLINED",
        }),
        ServiceRequest.countDocuments({
          ...baseFilter,
          "ownerAuthorization.status": "INFO_REQUESTED",
        }),
      ]);

    return NextResponse.json({
      success: true,
      stats: {
        pending: pendingCount,
        authorized: authorizedCount,
        declined: declinedCount,
        infoRequested: infoReqCount,
      },
      authorizations: requests.map((r) => {
        const flatObj = r.flatId as unknown as { flatNumber?: string; floor?: number } | null;
        const tenantObj = r.applicantUserId as unknown as { name?: string; email?: string; phone?: string } | null;
        return {
          id: r._id.toString(),
          requestId: r.requestId,
          serviceCode: r.serviceCode,
          serviceTitle: r.serviceTitle,
          serviceCategory: r.serviceCategory,
          flatNumber: flatObj?.flatNumber || "Unit",
          tenantName: tenantObj?.name || "Tenant",
          tenantEmail: tenantObj?.email,
          tenantPhone: tenantObj?.phone,
          submittedAt: r.submittedAt || r.createdAt,
          currentStatus: r.currentStatus,
          ownerAuthStatus: r.ownerAuthorization?.status,
          ownerComment: r.ownerAuthorization?.comment,
          decidedAt: r.ownerAuthorization?.decidedAt,
          attachmentsCount: r.attachments?.length || 0,
        };
      }),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load owner authorizations";
    console.error("GET /api/owner/authorizations error:", err);
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
      return NextResponse.json(
        { error: "No active society context found" },
        { status: 400 }
      );
    }

    const socObjectId = new Types.ObjectId(activeSocietyId);
    const userObjectId = new Types.ObjectId(session.id);

    const body = await req.json();
    const {
      requestId,
      action, // "AUTHORIZE" | "DECLINE" | "REQUEST_INFO"
      comment = "",
      requestedFields = [],
      requestedDocCodes = [],
    } = body;

    if (!requestId) {
      return NextResponse.json(
        { error: "Request identifier is required" },
        { status: 400 }
      );
    }

    if (!["AUTHORIZE", "DECLINE", "REQUEST_INFO"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid owner action. Must be AUTHORIZE, DECLINE, or REQUEST_INFO." },
        { status: 400 }
      );
    }

    // Look up the request
    const requestDoc = await ServiceRequest.findOne({
      $or: [
        { _id: Types.ObjectId.isValid(requestId) ? new Types.ObjectId(requestId) : null },
        { requestId },
      ],
      societyId: socObjectId,
    }).populate("flatId");

    if (!requestDoc) {
      return NextResponse.json({ error: "Service request not found" }, { status: 404 });
    }

    // STRICT OWNER VERIFICATION: Caller must be the verified owner of this specific flat
    const flatDoc = await Flat.findById(requestDoc.flatId);
    if (!flatDoc) {
      return NextResponse.json({ error: "Flat record not found" }, { status: 404 });
    }

    const isCurrentOwner = flatDoc.currentOwnerId?.toString() === session.id;
    const isDesignatedInRequest = requestDoc.ownerAuthorization?.ownerUserId?.toString() === session.id;

    // Check FlatOccupancy for joint owners
    const ownerOccupancy = await FlatOccupancy.findOne({
      flatId: flatDoc._id,
      userId: userObjectId,
      occupancyType: "OWNER",
      status: "APPROVED",
    }).lean();

    if (!isCurrentOwner && !isDesignatedInRequest && !ownerOccupancy && !session.isSuperAdmin) {
      return NextResponse.json(
        {
          error: "Forbidden: You are not a verified owner of this flat. Only verified owners can authorize tenant requests.",
        },
        { status: 403 }
      );
    }

    const decisionTime = new Date();

    // 1. ACTION: AUTHORIZE
    if (action === "AUTHORIZE") {
      requestDoc.ownerAuthorization.status = "AUTHORIZED";
      requestDoc.ownerAuthorization.decidedAt = decisionTime;
      requestDoc.ownerAuthorization.comment = comment.trim();
      requestDoc.currentStatus = "AWAITING_SOCIETY_REVIEW";
      requestDoc.pendingActorType = "SOCIETY_MANAGEMENT";

      requestDoc.timeline.push({
        action: "OWNER_AUTHORIZED",
        actorId: userObjectId,
        actorName: session.name || "Flat Owner",
        actorRole: "OWNER",
        timestamp: decisionTime,
        comment: comment.trim() || "Owner authorized the tenant request",
        previousStatus: "AWAITING_OWNER_AUTHORIZATION",
        newStatus: "AWAITING_SOCIETY_REVIEW",
      });

      await requestDoc.save();

      // Notify Tenant
      // Multi-channel notifications
      await dispatchNotification({
        eventType: "REQUEST_OWNER_AUTHORIZED",
        category: "SERVICE_REQUEST",
        type: "success",
        title: `Owner Authorized: ${requestDoc.requestId}`,
        message: `Your flat owner has authorized your request for '${requestDoc.serviceTitle}'. It has now entered the Society Management review queue.`,
        actionUrl: `/requests/${requestDoc.requestId}`,
        societyId: socObjectId,
        recipients: [requestDoc.applicantUserId],
        idempotencyKey: `REQ_OWNER_AUTH_OK_${requestDoc.requestId}`,
      });

      // Notify Society Committee
      const committeeMembers = await SocietyMembership.find({
        societyId: socObjectId,
        status: "VERIFIED",
        role: { $in: COMMITTEE_ROLES },
      }).select("userId").lean();

      if (committeeMembers.length > 0) {
        await dispatchNotification({
          eventType: "REQUEST_SOCIETY_REVIEW_REQUIRED",
          category: "APPROVAL",
          type: "action_required",
          title: `Owner-Authorized Request: ${requestDoc.requestId}`,
          message: `Owner authorized tenant request '${requestDoc.serviceTitle}' for Unit ${flatDoc.flatNumber}. Ready for review.`,
          actionUrl: `/management/approvals/${requestDoc._id.toString()}`,
          societyId: socObjectId,
          recipients: committeeMembers.map((m) => m.userId),
          idempotencyKey: `REQ_OWNER_AUTH_MGMT_${requestDoc.requestId}`,
        });
      }

      await AuditEvent.create({
        societyId: socObjectId,
        userId: userObjectId,
        action: "SERVICE_REQUEST_OWNER_AUTHORIZED",
        entityType: "SERVICE_REQUEST",
        entityId: requestDoc.requestId,
        details: { flatNumber: flatDoc.flatNumber, comment },
      });

      return NextResponse.json({
        success: true,
        message: `Request ${requestDoc.requestId} authorized successfully and forwarded to Society Management.`,
        request: requestDoc,
      });
    }

    // 2. ACTION: DECLINE
    if (action === "DECLINE") {
      if (!comment.trim()) {
        return NextResponse.json(
          { error: "A clear decline reason is mandatory so the tenant understands why authorization was withheld." },
          { status: 400 }
        );
      }

      requestDoc.ownerAuthorization.status = "DECLINED";
      requestDoc.ownerAuthorization.decidedAt = decisionTime;
      requestDoc.ownerAuthorization.comment = comment.trim();
      requestDoc.currentStatus = "OWNER_DECLINED";
      requestDoc.pendingActorType = "NONE";

      requestDoc.timeline.push({
        action: "OWNER_DECLINED",
        actorId: userObjectId,
        actorName: session.name || "Flat Owner",
        actorRole: "OWNER",
        timestamp: decisionTime,
        comment: comment.trim(),
        previousStatus: "AWAITING_OWNER_AUTHORIZATION",
        newStatus: "OWNER_DECLINED",
      });

      await requestDoc.save();

      // Notify Tenant with explanation
      await dispatchNotification({
        eventType: "REQUEST_OWNER_DECLINED",
        category: "SERVICE_REQUEST",
        type: "warning",
        title: `Owner Declined: ${requestDoc.requestId}`,
        message: `Your flat owner declined authorization for '${requestDoc.serviceTitle}'. Reason: "${comment.trim()}". The request will not proceed to the society.`,
        actionUrl: `/requests/${requestDoc.requestId}`,
        societyId: socObjectId,
        recipients: [requestDoc.applicantUserId],
        idempotencyKey: `REQ_OWNER_DECLINE_${requestDoc.requestId}`,
      });

      await AuditEvent.create({
        societyId: socObjectId,
        userId: userObjectId,
        action: "SERVICE_REQUEST_OWNER_DECLINED",
        entityType: "SERVICE_REQUEST",
        entityId: requestDoc.requestId,
        details: { flatNumber: flatDoc.flatNumber, reason: comment.trim() },
      });

      return NextResponse.json({
        success: true,
        message: `Request ${requestDoc.requestId} has been declined. Tenant notified.`,
        request: requestDoc,
      });
    }

    // 3. ACTION: REQUEST_INFO
    if (action === "REQUEST_INFO") {
      if (!comment.trim()) {
        return NextResponse.json(
          { error: "Please provide specific details or instructions regarding the additional information required." },
          { status: 400 }
        );
      }

      requestDoc.ownerAuthorization.status = "INFO_REQUESTED";
      requestDoc.currentStatus = "INFORMATION_REQUIRED";
      requestDoc.returnWorkflowStage = "AWAITING_OWNER_AUTHORIZATION";
      requestDoc.pendingActorType = "APPLICANT";
      requestDoc.correctionRequest = {
        requestedByRole: "OWNER",
        requestedByUserId: userObjectId,
        requestedByName: session.name || "Flat Owner",
        requestedAt: decisionTime,
        note: comment.trim(),
        requestedFields,
        requestedDocCodes,
      };

      requestDoc.timeline.push({
        action: "MORE_INFO_REQUESTED_BY_OWNER",
        actorId: userObjectId,
        actorName: session.name || "Flat Owner",
        actorRole: "OWNER",
        timestamp: decisionTime,
        comment: comment.trim(),
        previousStatus: "AWAITING_OWNER_AUTHORIZATION",
        newStatus: "INFORMATION_REQUIRED",
      });

      await requestDoc.save();

      // Notify Tenant
      await Notification.create({
        userId: requestDoc.applicantUserId,
        societyId: socObjectId,
        title: `Action Required: Unit Owner Requested Information (${requestDoc.requestId})`,
        message: `Owner has requested clarification on '${requestDoc.serviceTitle}': "${comment.trim()}". Please update your application.`,
        type: "action_required",
        eventType: "SERVICE_REQUEST_CORRECTION_REQUESTED",
        actionUrl: `/requests/${requestDoc.requestId}`,
      });

      await AuditEvent.create({
        societyId: socObjectId,
        userId: userObjectId,
        action: "SERVICE_REQUEST_MORE_INFO_REQUESTED_BY_OWNER",
        entityType: "SERVICE_REQUEST",
        entityId: requestDoc.requestId,
        details: { flatNumber: flatDoc.flatNumber, note: comment.trim() },
      });

      return NextResponse.json({
        success: true,
        message: `Additional information requested from tenant for request ${requestDoc.requestId}.`,
        request: requestDoc,
      });
    }

    return NextResponse.json({ error: "Unhandled action" }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to process owner decision";
    console.error("POST /api/owner/authorizations error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
