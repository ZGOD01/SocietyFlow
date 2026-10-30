import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { getServerSession } from "@/lib/session";
import { connectDB } from "@/lib/db";
import {
  ServiceRequest,
  Notification,
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

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") || "ALL";
    const search = searchParams.get("search")?.trim().toLowerCase();

    // Base filter: All non-draft requests in this society
    const baseFilter: Record<string, unknown> = {
      societyId: socObjectId,
      isDraft: false,
    };

    const filter: Record<string, unknown> = { ...baseFilter };

    switch (category.toUpperCase()) {
      case "AWAITING_REVIEW":
        filter.currentStatus = "AWAITING_SOCIETY_REVIEW";
        break;
      case "OWNER_AUTHORIZED":
        filter.currentStatus = "AWAITING_SOCIETY_REVIEW";
        filter["ownerAuthorization.status"] = "AUTHORIZED";
        break;
      case "INFO_REQUIRED":
        filter.currentStatus = "INFORMATION_REQUIRED";
        break;
      case "UNDER_REVIEW":
        filter.currentStatus = "UNDER_REVIEW";
        break;
      case "REJECTED":
        filter.currentStatus = "REJECTED";
        break;
      case "COMPLETED":
        filter.currentStatus = "APPROVED"; // or COMPLETED once approval engine is online
        break;
      default:
        // "ALL": show everything
        break;
    }

    if (search) {
      filter.$or = [
        { requestId: new RegExp(search, "i") },
        { serviceTitle: new RegExp(search, "i") },
        { serviceCode: new RegExp(search, "i") },
      ];
    }

    const requests = await ServiceRequest.find(filter)
      .populate("flatId", "flatNumber floor bhkType")
      .populate("applicantUserId", "name email phone")
      .sort({ createdAt: -1 })
      .lean();

    // Summary counts for management tabs
    const [
      totalCount,
      awaitingReviewCount,
      ownerAuthorizedCount,
      infoRequiredCount,
      underReviewCount,
      rejectedCount,
    ] = await Promise.all([
      ServiceRequest.countDocuments({ ...baseFilter }),
      ServiceRequest.countDocuments({ ...baseFilter, currentStatus: "AWAITING_SOCIETY_REVIEW" }),
      ServiceRequest.countDocuments({ ...baseFilter, currentStatus: "AWAITING_SOCIETY_REVIEW", "ownerAuthorization.status": "AUTHORIZED" }),
      ServiceRequest.countDocuments({ ...baseFilter, currentStatus: "INFORMATION_REQUIRED" }),
      ServiceRequest.countDocuments({ ...baseFilter, currentStatus: "UNDER_REVIEW" }),
      ServiceRequest.countDocuments({ ...baseFilter, currentStatus: "REJECTED" }),
    ]);

    return NextResponse.json({
      success: true,
      stats: {
        total: totalCount,
        awaitingReview: awaitingReviewCount,
        ownerAuthorized: ownerAuthorizedCount,
        infoRequired: infoRequiredCount,
        underReview: underReviewCount,
        rejected: rejectedCount,
      },
      requests: requests.map((r) => {
        const flatObj = r.flatId as unknown as { flatNumber?: string; floor?: number } | null;
        const applicantObj = r.applicantUserId as unknown as { name?: string; email?: string; phone?: string } | null;
        return {
          id: r._id.toString(),
          requestId: r.requestId,
          serviceCode: r.serviceCode,
          serviceTitle: r.serviceTitle,
          serviceCategory: r.serviceCategory,
          flatNumber: flatObj?.flatNumber || "Unit",
          applicantName: applicantObj?.name || "Applicant",
          applicantEmail: applicantObj?.email,
          applicantPhone: applicantObj?.phone,
          applicantRole: r.applicantRole,
          currentStatus: r.currentStatus,
          pendingActorType: r.pendingActorType,
          ownerAuthStatus: r.ownerAuthorization?.status,
          ownerName: r.ownerAuthorization?.ownerName,
          submittedAt: r.submittedAt || r.createdAt,
          updatedAt: r.updatedAt,
          attachmentsCount: r.attachments?.length || 0,
        };
      }),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load management requests";
    console.error("GET /api/management/requests error:", err);
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
    const userObjectId = new Types.ObjectId(session.id);

    const body = await req.json();
    const {
      requestId,
      action, // "REQUEST_CORRECTION" | "MARK_UNDER_REVIEW" | "REJECT"
      note = "",
      requestedFields = [],
      requestedDocCodes = [],
    } = body;

    if (!requestId) {
      return NextResponse.json(
        { error: "Request identifier is required" },
        { status: 400 }
      );
    }

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

    const actionTime = new Date();
    const flatNumber = (requestDoc.flatId as unknown as { flatNumber?: string })?.flatNumber || "Unit";

    // 1. ACTION: REQUEST_CORRECTION
    if (action === "REQUEST_CORRECTION") {
      if (!note.trim()) {
        return NextResponse.json(
          { error: "A clear explanation of required corrections is mandatory." },
          { status: 400 }
        );
      }

      const prevStatus = requestDoc.currentStatus;
      requestDoc.currentStatus = "INFORMATION_REQUIRED";
      requestDoc.returnWorkflowStage = "AWAITING_SOCIETY_REVIEW";
      requestDoc.pendingActorType = "APPLICANT";
      requestDoc.correctionRequest = {
        requestedByRole: "MANAGEMENT",
        requestedByUserId: userObjectId,
        requestedByName: session.name || "Society Committee",
        requestedAt: actionTime,
        note: note.trim(),
        requestedFields,
        requestedDocCodes,
      };

      requestDoc.timeline.push({
        action: "CORRECTIONS_REQUESTED_BY_MANAGEMENT",
        actorId: userObjectId,
        actorName: session.name || "Society Management",
        actorRole: "MANAGEMENT",
        timestamp: actionTime,
        comment: note.trim(),
        previousStatus: prevStatus,
        newStatus: "INFORMATION_REQUIRED",
      });

      await requestDoc.save();

      // Notify Applicant
      await Notification.create({
        userId: requestDoc.applicantUserId,
        societyId: socObjectId,
        title: `Information Requested: ${requestDoc.requestId}`,
        message: `Society Management requested corrections on '${requestDoc.serviceTitle}': "${note.trim()}". Please update your application.`,
        type: "action_required",
        eventType: "SERVICE_REQUEST_CORRECTION_REQUESTED",
        actionUrl: `/requests/${requestDoc.requestId}`,
      });

      await AuditEvent.create({
        societyId: socObjectId,
        userId: userObjectId,
        action: "SERVICE_REQUEST_CORRECTIONS_REQUESTED_BY_MANAGEMENT",
        entityType: "SERVICE_REQUEST",
        entityId: requestDoc.requestId,
        details: { flatNumber, note: note.trim() },
      });

      return NextResponse.json({
        success: true,
        message: `Corrections requested for request ${requestDoc.requestId}. Applicant notified.`,
        request: requestDoc,
      });
    }

    // 2. ACTION: MARK_UNDER_REVIEW
    if (action === "MARK_UNDER_REVIEW") {
      const prevStatus = requestDoc.currentStatus;
      requestDoc.currentStatus = "UNDER_REVIEW";
      requestDoc.pendingActorType = "SOCIETY_MANAGEMENT";

      requestDoc.timeline.push({
        action: "REVIEW_COMMENCED",
        actorId: userObjectId,
        actorName: session.name || "Society Management",
        actorRole: "MANAGEMENT",
        timestamp: actionTime,
        comment: note.trim() || "Application taken up for internal scrutiny by committee",
        previousStatus: prevStatus,
        newStatus: "UNDER_REVIEW",
      });

      await requestDoc.save();

      await AuditEvent.create({
        societyId: socObjectId,
        userId: userObjectId,
        action: "SERVICE_REQUEST_MARKED_UNDER_REVIEW",
        entityType: "SERVICE_REQUEST",
        entityId: requestDoc.requestId,
        details: { flatNumber },
      });

      return NextResponse.json({
        success: true,
        message: `Request ${requestDoc.requestId} status updated to Under Review.`,
        request: requestDoc,
      });
    }

    // 3. ACTION: REJECT
    if (action === "REJECT") {
      if (!note.trim()) {
        return NextResponse.json(
          { error: "A clear rejection reason must be recorded." },
          { status: 400 }
        );
      }

      const prevStatus = requestDoc.currentStatus;
      requestDoc.currentStatus = "REJECTED";
      requestDoc.pendingActorType = "NONE";

      requestDoc.timeline.push({
        action: "REQUEST_REJECTED",
        actorId: userObjectId,
        actorName: session.name || "Society Management",
        actorRole: "MANAGEMENT",
        timestamp: actionTime,
        comment: note.trim(),
        previousStatus: prevStatus,
        newStatus: "REJECTED",
      });

      await requestDoc.save();

      // Notify Applicant
      await Notification.create({
        userId: requestDoc.applicantUserId,
        societyId: socObjectId,
        title: `Request Rejected: ${requestDoc.requestId}`,
        message: `Your request for '${requestDoc.serviceTitle}' has been rejected by Society Management. Reason: "${note.trim()}".`,
        type: "warning",
        eventType: "SERVICE_REQUEST_OWNER_DECLINED",
        actionUrl: `/requests/${requestDoc.requestId}`,
      });

      await AuditEvent.create({
        societyId: socObjectId,
        userId: userObjectId,
        action: "SERVICE_REQUEST_REJECTED",
        entityType: "SERVICE_REQUEST",
        entityId: requestDoc.requestId,
        details: { flatNumber, reason: note.trim() },
      });

      return NextResponse.json({
        success: true,
        message: `Request ${requestDoc.requestId} has been rejected. Applicant notified.`,
        request: requestDoc,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to process management review";
    console.error("POST /api/management/requests error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
