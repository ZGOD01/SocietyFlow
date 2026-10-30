import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { getServerSession } from "@/lib/session";
import { connectDB } from "@/lib/db";
import {
  ServiceRequest,
  ServiceDefinition,
  Flat,
  FlatOccupancy,
  User,
  Notification,
  AuditEvent,
  SocietyMembership,
} from "@/models";
import { generateNextRequestId } from "@/lib/request-id";
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

    const { searchParams } = new URL(req.url);
    const tab = searchParams.get("tab") || "ALL";
    const search = searchParams.get("search")?.trim().toLowerCase();

    // Base filter: Applicant must be the current user in this society
    const filter: Record<string, unknown> = {
      societyId: socObjectId,
      applicantUserId: userObjectId,
    };

    switch (tab.toUpperCase()) {
      case "DRAFTS":
        filter.currentStatus = "DRAFT";
        break;
      case "SUBMITTED":
        filter.currentStatus = {
          $in: ["AWAITING_OWNER_AUTHORIZATION", "AWAITING_SOCIETY_REVIEW", "UNDER_REVIEW"],
        };
        break;
      case "AWAITING_OWNER":
        filter.currentStatus = "AWAITING_OWNER_AUTHORIZATION";
        break;
      case "AWAITING_SOCIETY":
        filter.currentStatus = { $in: ["AWAITING_SOCIETY_REVIEW", "UNDER_REVIEW"] };
        break;
      case "INFO_REQUIRED":
        filter.currentStatus = "INFORMATION_REQUIRED";
        break;
      case "COMPLETED":
        filter.currentStatus = "APPROVED"; // or COMPLETED once enabled
        break;
      case "DECLINED":
        filter.currentStatus = { $in: ["OWNER_DECLINED", "REJECTED", "CANCELLED"] };
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
      .populate("flatId", "flatNumber floor")
      .sort({ createdAt: -1 })
      .lean();

    // Summary counts for tabs and metric cards
    const [
      totalCount,
      draftCount,
      awaitingOwnerCount,
      awaitingSocietyCount,
      infoRequiredCount,
      declinedCount,
    ] = await Promise.all([
      ServiceRequest.countDocuments({ societyId: socObjectId, applicantUserId: userObjectId }),
      ServiceRequest.countDocuments({ societyId: socObjectId, applicantUserId: userObjectId, currentStatus: "DRAFT" }),
      ServiceRequest.countDocuments({ societyId: socObjectId, applicantUserId: userObjectId, currentStatus: "AWAITING_OWNER_AUTHORIZATION" }),
      ServiceRequest.countDocuments({ societyId: socObjectId, applicantUserId: userObjectId, currentStatus: { $in: ["AWAITING_SOCIETY_REVIEW", "UNDER_REVIEW"] } }),
      ServiceRequest.countDocuments({ societyId: socObjectId, applicantUserId: userObjectId, currentStatus: "INFORMATION_REQUIRED" }),
      ServiceRequest.countDocuments({ societyId: socObjectId, applicantUserId: userObjectId, currentStatus: { $in: ["OWNER_DECLINED", "REJECTED", "CANCELLED"] } }),
    ]);

    return NextResponse.json({
      success: true,
      stats: {
        total: totalCount,
        drafts: draftCount,
        awaitingOwner: awaitingOwnerCount,
        awaitingSociety: awaitingSocietyCount,
        infoRequired: infoRequiredCount,
        declined: declinedCount,
      },
      requests: requests.map((r) => {
        const flatObj = r.flatId as unknown as { flatNumber?: string; floor?: number } | null;
        return {
          id: r._id.toString(),
          requestId: r.requestId,
          serviceCode: r.serviceCode,
          serviceTitle: r.serviceTitle,
          serviceCategory: r.serviceCategory,
          flatNumber: flatObj?.flatNumber || "Unit",
          applicantRole: r.applicantRole,
          currentStatus: r.currentStatus,
          pendingActorType: r.pendingActorType,
          isDraft: r.isDraft,
          submittedAt: r.submittedAt,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
          ownerAuthorizationStatus: r.ownerAuthorization?.status,
          correctionNote: r.correctionRequest?.note,
          attachmentsCount: r.attachments?.length || 0,
        };
      }),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load requests";
    console.error("GET /api/requests error:", err);
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
      draftId,
      serviceId,
      flatId,
      formData = {},
      attachments = [],
      isDraft = false,
    } = body;

    if (!serviceId) {
      return NextResponse.json(
        { error: "Service definition ID is required" },
        { status: 400 }
      );
    }

    if (!flatId) {
      return NextResponse.json(
        { error: "Applicable flat must be selected" },
        { status: 400 }
      );
    }

    // 1. Fetch Service Definition
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

    if (!service || !service.isActive) {
      return NextResponse.json(
        { error: "Selected service is invalid or currently disabled" },
        { status: 404 }
      );
    }

    // 2. Validate Flat Authorization & Applicant Role
    const targetFlat = await Flat.findOne({
      _id: new Types.ObjectId(flatId),
      societyId: socObjectId,
      isActive: { $ne: false },
    });

    if (!targetFlat) {
      return NextResponse.json(
        { error: "Selected flat not found in your active society" },
        { status: 404 }
      );
    }

    // Verify user is authorized for this flat
    const isOwnerByFlat = targetFlat.currentOwnerId?.toString() === session.id;
    const isTenantByFlat = targetFlat.currentTenantId?.toString() === session.id;

    // Check FlatOccupancy
    const approvedOccupancy = await FlatOccupancy.findOne({
      flatId: targetFlat._id,
      userId: userObjectId,
      societyId: socObjectId,
      status: "APPROVED",
    }).lean();

    const verifiedRole: "OWNER" | "TENANT" | null =
      isOwnerByFlat || approvedOccupancy?.occupancyType === "OWNER"
        ? "OWNER"
        : isTenantByFlat || approvedOccupancy?.occupancyType === "TENANT"
        ? "TENANT"
        : null;

    if (!verifiedRole && !session.isSuperAdmin) {
      return NextResponse.json(
        { error: "You are not an authorized owner or tenant of this flat" },
        { status: 403 }
      );
    }

    const applicantRole: "OWNER" | "TENANT" = verifiedRole || "OWNER";

    // 3. Check service eligibility
    if (service.eligibility !== "BOTH" && service.eligibility !== applicantRole) {
      return NextResponse.json(
        {
          error: `This service is reserved exclusively for ${service.eligibility}s. You are authorized as a ${applicantRole}.`,
        },
        { status: 403 }
      );
    }

    // 4. Handle Save as DRAFT
    if (isDraft) {
      let draftDoc;
      if (draftId && Types.ObjectId.isValid(draftId)) {
        draftDoc = await ServiceRequest.findOne({
          _id: new Types.ObjectId(draftId),
          applicantUserId: userObjectId,
          currentStatus: "DRAFT",
        });
      }

      if (draftDoc) {
        draftDoc.flatId = targetFlat._id;
        draftDoc.formData = formData;
        draftDoc.attachments = attachments;
        await draftDoc.save();
        return NextResponse.json({
          success: true,
          message: "Application draft saved successfully.",
          request: draftDoc,
        });
      } else {
        const generatedDraftRef = await generateNextRequestId();
        const newDraft = await ServiceRequest.create({
          requestId: generatedDraftRef,
          societyId: socObjectId,
          flatId: targetFlat._id,
          applicantUserId: userObjectId,
          applicantRole,
          serviceDefinitionId: service._id,
          serviceCode: service.code,
          serviceTitle: service.title,
          serviceCategory: service.category,
          serviceSnapshot: service.toObject ? service.toObject() : service,
          formData,
          attachments,
          currentStatus: "DRAFT",
          pendingActorType: "APPLICANT",
          isDraft: true,
          ownerAuthorization: {
            status: service.requiresOwnerAuthorization && applicantRole === "TENANT" ? "PENDING" : "NOT_REQUIRED",
          },
          timeline: [
            {
              action: "DRAFT_SAVED",
              actorId: userObjectId,
              actorName: session.name || session.email,
              actorRole: applicantRole,
              timestamp: new Date(),
              comment: "Application draft initiated by applicant",
            },
          ],
        });

        return NextResponse.json({
          success: true,
          message: "Application draft created successfully.",
          request: newDraft,
        });
      }
    }

    // 5. FINAL SUBMISSION VALIDATION
    // Validate required fields
    if (service.requiredFields && service.requiredFields.length > 0) {
      for (const field of service.requiredFields) {
        if (field.required) {
          const val = formData[field.id];
          if (val === undefined || val === null || val === "" || (field.type === "checkbox" && val !== true)) {
            return NextResponse.json(
              { error: `Required field '${field.label}' cannot be empty.` },
              { status: 400 }
            );
          }
        }
      }
    }

    // Validate required documents
    if (service.requiredDocuments && service.requiredDocuments.length > 0) {
      for (const reqDoc of service.requiredDocuments) {
        if (reqDoc.required) {
          const hasAttached = attachments.some(
            (att: { category?: string; displayName?: string }) =>
              att.category === reqDoc.code ||
              att.displayName?.toLowerCase().includes(reqDoc.title.toLowerCase())
          );
          if (!hasAttached) {
            return NextResponse.json(
              {
                error: `Mandatory document '${reqDoc.title}' must be attached before submitting.`,
              },
              { status: 400 }
            );
          }
        }
      }
    }

    // 6. WORKFLOW ROUTING DECISION
    let finalStatus: "AWAITING_OWNER_AUTHORIZATION" | "AWAITING_SOCIETY_REVIEW" = "AWAITING_SOCIETY_REVIEW";
    let pendingActor: "OWNER" | "SOCIETY_MANAGEMENT" = "SOCIETY_MANAGEMENT";
    const ownerAuthData: {
      status: "PENDING" | "NOT_REQUIRED";
      ownerUserId?: Types.ObjectId;
      ownerName?: string;
    } = { status: "NOT_REQUIRED" };

    if (applicantRole === "TENANT" && service.requiresOwnerAuthorization) {
      // Resolve flat's verified owner
      let ownerUser = null;
      if (targetFlat.currentOwnerId) {
        ownerUser = await User.findById(targetFlat.currentOwnerId).lean();
      } else {
        const ownerOcc = await FlatOccupancy.findOne({
          flatId: targetFlat._id,
          occupancyType: "OWNER",
          status: "APPROVED",
        }).lean();
        if (ownerOcc) {
          ownerUser = await User.findById(ownerOcc.userId).lean();
        }
      }

      if (!ownerUser) {
        return NextResponse.json(
          {
            error: "Unable to route request: No verified flat owner record is currently assigned to this unit. Please contact society management.",
          },
          { status: 422 }
        );
      }

      finalStatus = "AWAITING_OWNER_AUTHORIZATION";
      pendingActor = "OWNER";
      ownerAuthData.status = "PENDING";
      ownerAuthData.ownerUserId = ownerUser._id;
      ownerAuthData.ownerName = ownerUser.name;
    }

    // If an existing draft was submitted, update it; otherwise generate a new request
    let requestRecord;
    const submissionTimestamp = new Date();

    if (draftId && Types.ObjectId.isValid(draftId)) {
      requestRecord = await ServiceRequest.findOne({
        _id: new Types.ObjectId(draftId),
        applicantUserId: userObjectId,
      });
    }

    if (requestRecord) {
      requestRecord.flatId = targetFlat._id;
      requestRecord.formData = formData;
      requestRecord.attachments = attachments;
      requestRecord.currentStatus = finalStatus;
      requestRecord.pendingActorType = pendingActor;
      requestRecord.isDraft = false;
      requestRecord.submittedAt = submissionTimestamp;
      requestRecord.ownerAuthorization = ownerAuthData;
      requestRecord.timeline.push({
        action: "REQUEST_SUBMITTED",
        actorId: userObjectId,
        actorName: session.name || session.email,
        actorRole: applicantRole,
        timestamp: submissionTimestamp,
        comment: `Application submitted by ${applicantRole.toLowerCase()}`,
        newStatus: finalStatus,
      });
      await requestRecord.save();
    } else {
      const generatedRequestId = await generateNextRequestId();
      requestRecord = await ServiceRequest.create({
        requestId: generatedRequestId,
        societyId: socObjectId,
        flatId: targetFlat._id,
        applicantUserId: userObjectId,
        applicantRole,
        serviceDefinitionId: service._id,
        serviceCode: service.code,
        serviceTitle: service.title,
        serviceCategory: service.category,
        serviceSnapshot: service.toObject ? service.toObject() : service,
        formData,
        attachments,
        currentStatus: finalStatus,
        pendingActorType: pendingActor,
        isDraft: false,
        submittedAt: submissionTimestamp,
        ownerAuthorization: ownerAuthData,
        timeline: [
          {
            action: "REQUEST_SUBMITTED",
            actorId: userObjectId,
            actorName: session.name || session.email,
            actorRole: applicantRole,
            timestamp: submissionTimestamp,
            comment: `Application submitted by ${applicantRole.toLowerCase()}`,
            newStatus: finalStatus,
          },
        ],
      });
    }

    // 7. MULTI-CHANNEL NOTIFICATIONS DISPATCH
    // A. Notify Applicant of successful submission
    await dispatchNotification({
      eventType: "REQUEST_SUBMITTED",
      category: "SERVICE_REQUEST",
      type: "info",
      title: `Service Request ${requestRecord.requestId} Submitted`,
      message:
        finalStatus === "AWAITING_OWNER_AUTHORIZATION"
          ? `Your application for ${service.title} has been routed to flat owner ${ownerAuthData.ownerName} for authorization.`
          : `Your application for ${service.title} has been submitted to Society Management for review.`,
      actionUrl: `/requests/${requestRecord.requestId}`,
      societyId: socObjectId,
      recipients: [userObjectId],
      idempotencyKey: `REQ_SUBMIT_${requestRecord.requestId}`,
    });

    // B. If Owner Authorization required, notify the verified owner
    if (finalStatus === "AWAITING_OWNER_AUTHORIZATION" && ownerAuthData.ownerUserId) {
      await dispatchNotification({
        eventType: "REQUEST_OWNER_AUTHORIZATION_REQUIRED",
        category: "APPROVAL",
        type: "action_required",
        title: `Owner Authorization Needed: Unit ${targetFlat.flatNumber}`,
        message: `Tenant ${session.name || "Resident"} has submitted a request for '${service.title}' requiring your authorization.`,
        actionUrl: `/owner/authorizations`,
        societyId: socObjectId,
        recipients: [ownerAuthData.ownerUserId],
        idempotencyKey: `REQ_OWNER_AUTH_${requestRecord.requestId}`,
        metadata: {
          requestId: requestRecord.requestId,
          flatNumber: targetFlat.flatNumber,
        },
      });
    } else {
      // C. Notify Society Management queue
      const committeeMembers = await SocietyMembership.find({
        societyId: socObjectId,
        status: "VERIFIED",
        role: { $in: COMMITTEE_ROLES },
      }).select("userId").lean();

      if (committeeMembers.length > 0) {
        await dispatchNotification({
          eventType: "REQUEST_SOCIETY_REVIEW_REQUIRED",
          category: "APPROVAL",
          type: "info",
          title: `New Service Request: ${requestRecord.requestId}`,
          message: `${applicantRole === "OWNER" ? "Owner" : "Tenant"} submitted '${service.title}' for Flat ${targetFlat.flatNumber}.`,
          actionUrl: `/management/approvals`,
          societyId: socObjectId,
          recipients: committeeMembers.map((m) => m.userId),
          idempotencyKey: `REQ_MGMT_NEW_${requestRecord.requestId}`,
        });
      }
    }

    // 8. AUDIT LOG
    await AuditEvent.create({
      societyId: socObjectId,
      userId: userObjectId,
      action: "SERVICE_REQUEST_CREATED",
      entityType: "SERVICE_REQUEST",
      entityId: requestRecord.requestId,
      details: {
        serviceCode: service.code,
        flatNumber: targetFlat.flatNumber,
        role: applicantRole,
        initialStatus: finalStatus,
        requiresOwnerAuthorization: finalStatus === "AWAITING_OWNER_AUTHORIZATION",
      },
    });

    return NextResponse.json({
      success: true,
      message:
        finalStatus === "AWAITING_OWNER_AUTHORIZATION"
          ? `Request ${requestRecord.requestId} created. Routed to flat owner for authorization.`
          : `Request ${requestRecord.requestId} created and sent to Society Management.`,
      requestId: requestRecord.requestId,
      status: finalStatus,
      request: requestRecord,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create service request";
    console.error("POST /api/requests error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
