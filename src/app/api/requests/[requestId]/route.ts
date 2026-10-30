import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { getServerSession } from "@/lib/session";
import { connectDB } from "@/lib/db";
import {
  ServiceRequest,
  Society,
  Notification,
  AuditEvent,
  SocietyMembership,
} from "@/models";
import { generatePresignedDownloadUrl } from "@/lib/r2";
import { COMMITTEE_ROLES, MembershipRole } from "@/lib/rbac";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { requestId } = await params;
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

    // Look up by requestId (e.g. SF-2026-000101) or MongoDB _id
    let reqDoc = null;
    if (Types.ObjectId.isValid(requestId)) {
      reqDoc = await ServiceRequest.findById(requestId)
        .populate("flatId", "flatNumber floor bhkType currentOwnerId currentTenantId")
        .populate("applicantUserId", "name email phone")
        .lean();
    }
    if (!reqDoc) {
      reqDoc = await ServiceRequest.findOne({
        requestId,
        societyId: socObjectId,
      })
        .populate("flatId", "flatNumber floor bhkType currentOwnerId currentTenantId")
        .populate("applicantUserId", "name email phone")
        .lean();
    }

    if (!reqDoc) {
      return NextResponse.json({ error: "Service request not found" }, { status: 404 });
    }

    // Security Check: Enforce cross-society isolation
    if (reqDoc.societyId.toString() !== activeSocietyId) {
      return NextResponse.json(
        { error: "Forbidden: You cannot access requests from another society" },
        { status: 403 }
      );
    }

    // Authorization: Must be applicant, or flat owner, or society committee member, or SuperAdmin
    const isApplicant = reqDoc.applicantUserId?._id?.toString() === session.id;
    const isOwnerOfFlat =
      (reqDoc.flatId as unknown as { currentOwnerId?: Types.ObjectId })?.currentOwnerId?.toString() === session.id ||
      reqDoc.ownerAuthorization?.ownerUserId?.toString() === session.id;

    const isManagement = session.memberships?.some(
      (m) =>
        m.societyId === activeSocietyId &&
        m.status === "VERIFIED" &&
        COMMITTEE_ROLES.includes(m.role as MembershipRole)
    );

    if (!isApplicant && !isOwnerOfFlat && !isManagement && !session.isSuperAdmin) {
      return NextResponse.json(
        { error: "Forbidden: You are not authorized to view this request" },
        { status: 403 }
      );
    }

    // Generate signed preview & download URLs for each attached document
    const enrichedAttachments = await Promise.all(
      (reqDoc.attachments || []).map(async (att) => {
        let viewUrl = "";
        let downloadUrl = "";
        try {
          const viewRes = await generatePresignedDownloadUrl({
            r2ObjectKey: att.r2ObjectKey,
            displayName: att.displayName,
            disposition: "inline",
          });
          viewUrl = viewRes.downloadUrl;

          const dlRes = await generatePresignedDownloadUrl({
            r2ObjectKey: att.r2ObjectKey,
            displayName: att.displayName,
            disposition: "attachment",
          });
          downloadUrl = dlRes.downloadUrl;
        } catch (r2Err) {
          console.warn("Could not generate presigned url for attachment:", r2Err);
        }

        return {
          documentId: att.documentId,
          displayName: att.displayName,
          originalFilename: att.originalFilename,
          category: att.category,
          size: att.size,
          mimeType: att.mimeType,
          isRequired: att.isRequired,
          uploadedAt: att.uploadedAt,
          viewUrl,
          downloadUrl,
        };
      })
    );

    // Filter internal notes if resident
    const filteredTimeline = (reqDoc.timeline || [])
      .filter((ev) => isManagement || session.isSuperAdmin || !ev.isInternalNote)
      .map((ev) => ({
        action: ev.action,
        actorName: ev.actorName,
        actorRole: ev.actorRole,
        timestamp: ev.timestamp,
        comment: ev.comment,
        previousStatus: ev.previousStatus,
        newStatus: ev.newStatus,
      }));

    // Generate signed URLs for generated certificate if present
    let enrichedGeneratedDoc = null;
    if (reqDoc.generatedDocument?.r2ObjectKey) {
      try {
        const viewRes = await generatePresignedDownloadUrl({
          r2ObjectKey: reqDoc.generatedDocument.r2ObjectKey,
          displayName: reqDoc.generatedDocument.originalFilename,
          disposition: "inline",
          expiresInSeconds: 1800,
        });
        const dlRes = await generatePresignedDownloadUrl({
          r2ObjectKey: reqDoc.generatedDocument.r2ObjectKey,
          displayName: reqDoc.generatedDocument.originalFilename,
          disposition: "attachment",
          expiresInSeconds: 1800,
        });
        const docObj = JSON.parse(JSON.stringify(reqDoc.generatedDocument));
        enrichedGeneratedDoc = {
          ...docObj,
          viewUrl: viewRes.downloadUrl,
          downloadUrl: dlRes.downloadUrl,
        };
      } catch (err) {
        console.warn("[Presigned URL Error for Generated Certificate]", err);
      }
    }

    const society = await Society.findById(reqDoc.societyId).select("name code").lean();

    return NextResponse.json({
      success: true,
      request: {
        id: reqDoc._id.toString(),
        requestId: reqDoc.requestId,
        serviceCode: reqDoc.serviceCode,
        serviceTitle: reqDoc.serviceTitle,
        serviceCategory: reqDoc.serviceCategory,
        serviceSnapshot: reqDoc.serviceSnapshot,
        formData: reqDoc.formData || {},
        currentStatus: reqDoc.currentStatus,
        pendingActorType: reqDoc.pendingActorType,
        returnWorkflowStage: reqDoc.returnWorkflowStage,
        isDraft: reqDoc.isDraft,
        submittedAt: reqDoc.submittedAt,
        createdAt: reqDoc.createdAt,
        updatedAt: reqDoc.updatedAt,
        ownerAuthorization: reqDoc.ownerAuthorization,
        correctionRequest: reqDoc.correctionRequest,
        attachments: enrichedAttachments,
        timeline: filteredTimeline,
        generatedDocument: enrichedGeneratedDoc,
        approvalWorkflow: reqDoc.approvalWorkflow,
      },
      society: {
        id: society?._id.toString(),
        name: society?.name,
        code: society?.code,
      },
      flat: reqDoc.flatId,
      applicant: reqDoc.applicantUserId,
      permissions: {
        isApplicant,
        isOwnerOfFlat,
        isManagement: isManagement || session.isSuperAdmin,
        canResolveCorrection: isApplicant && reqDoc.currentStatus === "INFORMATION_REQUIRED",
        canCancel: isApplicant && reqDoc.currentStatus !== "CANCELLED" && reqDoc.currentStatus !== "REJECTED",
        canAuthorize: isOwnerOfFlat && reqDoc.currentStatus === "AWAITING_OWNER_AUTHORIZATION",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load request details";
    console.error("GET /api/requests/[requestId] error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { requestId } = await params;
    await connectDB();

    const activeSocietyId =
      session.activeSocietyId || session.memberships?.[0]?.societyId;

    const socObjectId = new Types.ObjectId(activeSocietyId);
    const userObjectId = new Types.ObjectId(session.id);

    // Find request
    let requestDoc = null;
    if (Types.ObjectId.isValid(requestId)) {
      requestDoc = await ServiceRequest.findById(requestId);
    }
    if (!requestDoc) {
      requestDoc = await ServiceRequest.findOne({
        requestId,
        societyId: socObjectId,
      });
    }

    if (!requestDoc) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    const isApplicant = requestDoc.applicantUserId.toString() === session.id;
    if (!isApplicant && !session.isSuperAdmin) {
      return NextResponse.json(
        { error: "Only the applicant can modify this request" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { action, updatedFormData, newAttachments, cancelReason } = body;

    // A. CANCEL REQUEST
    if (action === "CANCEL") {
      if (requestDoc.currentStatus === "CANCELLED" || requestDoc.currentStatus === "REJECTED") {
        return NextResponse.json(
          { error: "Request cannot be cancelled in its current state" },
          { status: 400 }
        );
      }

      const prevStatus = requestDoc.currentStatus;
      requestDoc.currentStatus = "CANCELLED";
      requestDoc.pendingActorType = "NONE";
      requestDoc.timeline.push({
        action: "REQUEST_CANCELLED",
        actorId: userObjectId,
        actorName: session.name || session.email,
        actorRole: requestDoc.applicantRole,
        timestamp: new Date(),
        comment: cancelReason || "Cancelled by applicant",
        previousStatus: prevStatus,
        newStatus: "CANCELLED",
      });

      await requestDoc.save();

      await AuditEvent.create({
        societyId: socObjectId,
        userId: userObjectId,
        action: "SERVICE_REQUEST_CANCELLED",
        entityType: "SERVICE_REQUEST",
        entityId: requestDoc.requestId,
        details: { reason: cancelReason },
      });

      return NextResponse.json({
        success: true,
        message: "Service request cancelled successfully",
        request: requestDoc,
      });
    }

    // B. RESUBMIT CORRECTIONS (when in INFORMATION_REQUIRED state)
    if (action === "RESUBMIT_CORRECTIONS") {
      if (requestDoc.currentStatus !== "INFORMATION_REQUIRED") {
        return NextResponse.json(
          { error: "Request is not currently awaiting corrections" },
          { status: 400 }
        );
      }

      // Merge updated form data
      if (updatedFormData && typeof updatedFormData === "object") {
        requestDoc.formData = {
          ...requestDoc.formData,
          ...updatedFormData,
        };
      }

      // Append any new or replaced attachments
      if (Array.isArray(newAttachments) && newAttachments.length > 0) {
        requestDoc.attachments = [...requestDoc.attachments, ...newAttachments];
      }

      // Return to prior workflow stage
      const targetStage =
        requestDoc.returnWorkflowStage ||
        (requestDoc.applicantRole === "TENANT" && requestDoc.ownerAuthorization?.status === "INFO_REQUESTED"
          ? "AWAITING_OWNER_AUTHORIZATION"
          : "AWAITING_SOCIETY_REVIEW");

      const targetPendingActor = targetStage === "AWAITING_OWNER_AUTHORIZATION" ? "OWNER" : "SOCIETY_MANAGEMENT";

      const previousStatus = requestDoc.currentStatus;
      requestDoc.currentStatus = targetStage;
      requestDoc.pendingActorType = targetPendingActor;

      requestDoc.timeline.push({
        action: "CORRECTIONS_RESUBMITTED",
        actorId: userObjectId,
        actorName: session.name || session.email,
        actorRole: requestDoc.applicantRole,
        timestamp: new Date(),
        comment: "Applicant responded to information request and resubmitted application",
        previousStatus,
        newStatus: targetStage,
      });

      await requestDoc.save();

      // Notify the pending reviewer
      if (targetStage === "AWAITING_OWNER_AUTHORIZATION" && requestDoc.ownerAuthorization?.ownerUserId) {
        await Notification.create({
          userId: requestDoc.ownerAuthorization.ownerUserId,
          societyId: socObjectId,
          title: `Corrections Resubmitted: ${requestDoc.requestId}`,
          message: `Tenant has provided the requested information for '${requestDoc.serviceTitle}'. Please review and authorize.`,
          type: "action_required",
          eventType: "SERVICE_REQUEST_RESUBMITTED",
          actionUrl: `/owner/authorizations`,
        });
      } else {
        // Notify society management
        const committeeMembers = await SocietyMembership.find({
          societyId: socObjectId,
          status: "VERIFIED",
          role: { $in: COMMITTEE_ROLES },
        }).select("userId").lean();

        for (const m of committeeMembers) {
          await Notification.create({
            userId: m.userId,
            societyId: socObjectId,
            title: `Corrections Resubmitted: ${requestDoc.requestId}`,
            message: `Applicant has updated required details for '${requestDoc.serviceTitle}'.`,
            type: "info",
            eventType: "SERVICE_REQUEST_RESUBMITTED",
            actionUrl: `/management/requests`,
          });
        }
      }

      await AuditEvent.create({
        societyId: socObjectId,
        userId: userObjectId,
        action: "SERVICE_REQUEST_CORRECTIONS_RESUBMITTED",
        entityType: "SERVICE_REQUEST",
        entityId: requestDoc.requestId,
        details: { targetStage },
      });

      return NextResponse.json({
        success: true,
        message: `Corrections submitted. Request returned to ${targetStage.replace(/_/g, " ").toLowerCase()}.`,
        request: requestDoc,
      });
    }

    // C. UPDATE DRAFT
    if (requestDoc.isDraft && requestDoc.currentStatus === "DRAFT") {
      if (updatedFormData) requestDoc.formData = updatedFormData;
      if (newAttachments) requestDoc.attachments = newAttachments;
      await requestDoc.save();

      return NextResponse.json({
        success: true,
        message: "Draft updated successfully",
        request: requestDoc,
      });
    }

    return NextResponse.json(
      { error: "Invalid action or request state" },
      { status: 400 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update service request";
    console.error("PATCH /api/requests/[requestId] error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { requestId } = await params;
    await connectDB();

    const requestDoc = await ServiceRequest.findOne({
      $or: [
        { _id: Types.ObjectId.isValid(requestId) ? new Types.ObjectId(requestId) : null },
        { requestId },
      ],
      applicantUserId: new Types.ObjectId(session.id),
    });

    if (!requestDoc) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    // Only allow deletion of DRAFT requests
    if (requestDoc.currentStatus !== "DRAFT") {
      return NextResponse.json(
        { error: "Only draft requests can be deleted. Use Cancel for submitted requests." },
        { status: 400 }
      );
    }

    await ServiceRequest.findByIdAndDelete(requestDoc._id);

    return NextResponse.json({
      success: true,
      message: "Application draft deleted successfully.",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete draft";
    console.error("DELETE /api/requests/[requestId] error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
