import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { getServerSession } from "@/lib/session";
import { connectDB } from "@/lib/db";
import {
  ServiceRequest,
  Society,
  Flat,
  User,
  AuditEvent,
  GeneratedDocument,
  FlatOccupancy,
} from "@/models";
import { COMMITTEE_ROLES, MembershipRole } from "@/lib/rbac";
import {
  checkUserCanApproveStage,
  calculateStageSLA,
  sendApprovalNotification,
  initializeWorkflowOnRequest,
  UserEligibilityResult,
} from "@/lib/approvals/workflow-engine";
import { generatePresignedDownloadUrl } from "@/lib/r2";
import { generateSocietyCertificate } from "@/lib/pdf/generate-certificate";

export async function GET(
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

    if (!activeSocietyId) {
      return NextResponse.json(
        { error: "No active society context found" },
        { status: 400 }
      );
    }

    // Role check: Committee privileges in active society
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

    // Lookup request by requestId or MongoDB _id
    const requestDoc = await ServiceRequest.findOne({
      $or: [
        { requestId },
        { _id: Types.ObjectId.isValid(requestId) ? new Types.ObjectId(requestId) : null },
      ],
    })
      .populate("flatId", "flatNumber floor wingId")
      .populate("applicantUserId", "name email phone");

    if (!requestDoc) {
      return NextResponse.json({ error: "Service request not found" }, { status: 404 });
    }

    // Cross-society boundary check
    if (!isSuperAdmin && requestDoc.societyId.toString() !== activeSocietyId) {
      return NextResponse.json(
        { error: "Forbidden: You cannot review requests from another society" },
        { status: 403 }
      );
    }

    // Ensure workflow is initialized if in society review
    if (
      !requestDoc.approvalWorkflow &&
      ["AWAITING_SOCIETY_REVIEW", "UNDER_REVIEW", "APPROVED", "COMPLETED", "ISSUED"].includes(
        requestDoc.currentStatus
      )
    ) {
      await initializeWorkflowOnRequest(requestDoc);
      await requestDoc.save();
    }

    const society = await Society.findById(requestDoc.societyId).lean();
    const flatObj = requestDoc.flatId as unknown as { flatNumber?: string; floor?: number; wingId?: { name?: string } } | null;
    const applicantObj = requestDoc.applicantUserId as unknown as { name?: string; email?: string; phone?: string } | null;

    // Attach presigned download and view URLs for attached documents
    const enrichedAttachments = await Promise.all(
      (requestDoc.attachments || []).map(async (att) => {
        let viewUrl = "";
        let downloadUrl = "";
        try {
          const viewRes = await generatePresignedDownloadUrl({
            r2ObjectKey: att.r2ObjectKey,
            displayName: att.displayName || att.originalFilename,
            disposition: "inline",
            expiresInSeconds: 1800,
          });
          const dlRes = await generatePresignedDownloadUrl({
            r2ObjectKey: att.r2ObjectKey,
            displayName: att.displayName || att.originalFilename,
            disposition: "attachment",
            expiresInSeconds: 1800,
          });
          viewUrl = viewRes.downloadUrl;
          downloadUrl = dlRes.downloadUrl;
        } catch (err) {
          console.warn("[Presigned URL Error]", err);
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
          verificationStatus: att.verificationStatus || "PENDING",
          verifiedByName: att.verifiedByName,
          verifiedByRole: att.verifiedByRole,
          verifiedAt: att.verifiedAt,
          verificationComment: att.verificationComment,
          viewUrl,
          downloadUrl,
        };
      })
    );

    // Current stage calculation & eligibility
    const wf = requestDoc.approvalWorkflow;
    const currentStageIdx = wf?.currentStageIndex ?? 0;
    const stages = wf?.stages || [];
    const currentStage = stages[currentStageIdx] || null;

    let sla = { pendingDurationHours: 0, expectedCompletionDate: null as Date | null, isOverdue: false };
    let eligibility: UserEligibilityResult = { canApprove: false, roleUsed: "NONE", isDelegated: false };

    if (currentStage) {
      sla = calculateStageSLA(currentStage);
      eligibility = await checkUserCanApproveStage(
        session,
        requestDoc.societyId,
        currentStage,
        requestDoc.serviceCode
      );
    }

    // Generated document view URL if issued
    let generatedDocDetails = null;
    if (requestDoc.generatedDocument?.r2ObjectKey) {
      try {
        const { downloadUrl: pdfViewUrl } = await generatePresignedDownloadUrl({
          r2ObjectKey: requestDoc.generatedDocument.r2ObjectKey,
          displayName: requestDoc.generatedDocument.originalFilename,
          disposition: "inline",
          expiresInSeconds: 1800,
        });
        const docRaw = JSON.parse(JSON.stringify(requestDoc.generatedDocument));
        generatedDocDetails = {
          ...docRaw,
          viewUrl: pdfViewUrl,
        };
      } catch (e) {
        console.warn("[Generated Doc View URL Error]", e);
      }
    }

    return NextResponse.json({
      success: true,
      request: {
        id: requestDoc._id.toString(),
        requestId: requestDoc.requestId,
        serviceCode: requestDoc.serviceCode,
        serviceTitle: requestDoc.serviceTitle,
        serviceCategory: requestDoc.serviceCategory,
        currentStatus: requestDoc.currentStatus,
        pendingActorType: requestDoc.pendingActorType,
        submittedAt: requestDoc.submittedAt || requestDoc.createdAt,
        createdAt: requestDoc.createdAt,
        updatedAt: requestDoc.updatedAt,
        applicant: {
          id: requestDoc.applicantUserId?._id?.toString(),
          name: applicantObj?.name || (requestDoc.formData?.applicantName as string) || "Resident",
          email: applicantObj?.email,
          phone: applicantObj?.phone,
          role: requestDoc.applicantRole,
        },
        unit: {
          flatNumber: flatObj?.flatNumber || (requestDoc.formData?.flatNumber as string) || "Unit",
          floor: flatObj?.floor,
          wingName: (requestDoc.formData?.wingName as string) || (flatObj?.wingId?.name) || "",
          societyName: society?.name || "Society",
          societyRegNumber: society?.registrationNumber,
        },
        formData: requestDoc.formData,
        attachments: enrichedAttachments,
        approvalWorkflow: wf
          ? {
              workflowVersion: wf.workflowVersion,
              currentStageIndex: wf.currentStageIndex,
              isCompleted: wf.isCompleted,
              finalDecision: wf.finalDecision,
              requiresDocumentIssuance: wf.requiresDocumentIssuance,
              documentTemplateCode: wf.documentTemplateCode,
              stages: wf.stages.map((st) => ({
                stageIndex: st.stageIndex,
                stageKey: st.stageKey,
                stageName: st.stageName,
                stageType: st.stageType,
                allowedRoles: st.allowedRoles,
                approverLogic: st.approverLogic,
                expectedDays: st.expectedDays,
                status: st.status,
                startedAt: st.startedAt,
                completedAt: st.completedAt,
                dueDate: st.dueDate,
                isOverdue: calculateStageSLA(st).isOverdue,
                requiredSignersCount: st.requiredSignersCount,
                approvalsReceived: st.approvalsReceived,
                actionNotes: st.actionNotes,
              })),
            }
          : null,
        ownerAuthorization: requestDoc.ownerAuthorization,
        correctionRequest: requestDoc.correctionRequest,
        timeline: requestDoc.timeline,
        generatedDocument: generatedDocDetails,
        permissions: {
          canApproveStage:
            eligibility.canApprove &&
            ["AWAITING_SOCIETY_REVIEW", "UNDER_REVIEW"].includes(requestDoc.currentStatus),
          canReject:
            ["AWAITING_SOCIETY_REVIEW", "UNDER_REVIEW"].includes(requestDoc.currentStatus),
          canRequestInfo:
            ["AWAITING_SOCIETY_REVIEW", "UNDER_REVIEW"].includes(requestDoc.currentStatus),
          canVerifyDocuments: true,
          canIssueCertificate:
            Boolean(wf?.requiresDocumentIssuance) &&
            (currentStage?.stageType === "ISSUANCE" || currentStageIdx === (stages.length - 1)) &&
            eligibility.canApprove,
          officialRoleUsed: eligibility.roleUsed,
          isDelegated: eligibility.isDelegated,
          delegatorName: eligibility.delegatorName,
          ineligibilityReason: eligibility.reason,
        },
        sla,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load request review";
    console.error("[Management Approval Review GET Error]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
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

    if (!activeSocietyId) {
      return NextResponse.json(
        { error: "No active society context found" },
        { status: 400 }
      );
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

    const requestDoc = await ServiceRequest.findOne({
      $or: [
        { requestId },
        { _id: Types.ObjectId.isValid(requestId) ? new Types.ObjectId(requestId) : null },
      ],
    });

    if (!requestDoc) {
      return NextResponse.json({ error: "Service request not found" }, { status: 404 });
    }

    if (!isSuperAdmin && requestDoc.societyId.toString() !== activeSocietyId) {
      return NextResponse.json(
        { error: "Forbidden: You cannot modify requests for another society" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { action, comment, documentId, verificationStatus, requestedFields, requestedDocCodes } = body;

    const now = new Date();
    const actorName = session.name || "Society Committee Official";
    const baseRole = session.activeRole || "SECRETARY";

    // Ensure workflow state is initialized
    if (!requestDoc.approvalWorkflow) {
      await initializeWorkflowOnRequest(requestDoc);
    }

    const wf = requestDoc.approvalWorkflow!;
    const currentStageIdx = wf.currentStageIndex;
    const currentStage = wf.stages[currentStageIdx];

    // =========================================================================
    // ACTION 1: APPROVE_STAGE
    // =========================================================================
    if (action === "APPROVE_STAGE") {
      if (!currentStage) {
        return NextResponse.json({ error: "No active approval stage found" }, { status: 400 });
      }

      if (!["AWAITING_SOCIETY_REVIEW", "UNDER_REVIEW"].includes(requestDoc.currentStatus)) {
        return NextResponse.json(
          { error: `Cannot approve request in current status: ${requestDoc.currentStatus}` },
          { status: 400 }
        );
      }

      // Check caller eligibility & active delegation
      const eligibility = await checkUserCanApproveStage(
        session,
        requestDoc.societyId,
        currentStage,
        requestDoc.serviceCode
      );

      if (!eligibility.canApprove) {
        return NextResponse.json(
          { error: eligibility.reason || "Forbidden: You are not authorized for this approval stage" },
          { status: 403 }
        );
      }

      // Concurrency guard: check if user already approved this stage
      const alreadyApproved = currentStage.approvalsReceived?.some(
        (appr) => appr.actorId.toString() === session.id
      );

      if (alreadyApproved) {
        return NextResponse.json(
          { error: "Duplicate approval: You have already approved this stage" },
          { status: 409 }
        );
      }

      // Record approval entry
      currentStage.approvalsReceived.push({
        actorId: new Types.ObjectId(session.id),
        actorName,
        actorRole: eligibility.roleUsed,
        delegatedBy: eligibility.isDelegated ? eligibility.delegatorName : undefined,
        approvedAt: now,
        comment: comment || `Stage approved by ${eligibility.roleUsed}`,
      });

      // Check whether stage completion criteria is fulfilled
      const isComplete =
        currentStage.approverLogic === "ANY_ONE" ||
        currentStage.approvalsReceived.length >= (currentStage.requiredSignersCount || 1);

      if (isComplete) {
        currentStage.status = "APPROVED";
        currentStage.completedAt = now;

        const nextStageIdx = currentStageIdx + 1;
        if (nextStageIdx < wf.stages.length) {
          // Advance to next stage
          const nextStage = wf.stages[nextStageIdx];
          nextStage.status = "IN_PROGRESS";
          nextStage.startedAt = now;
          nextStage.dueDate = new Date(now.getTime() + nextStage.expectedDays * 24 * 60 * 60 * 1000);
          wf.currentStageIndex = nextStageIdx;
          requestDoc.currentStatus = "UNDER_REVIEW";

          // Add timeline entry
          requestDoc.timeline.push({
            action: `STAGE_APPROVED: ${currentStage.stageName}`,
            actorId: new Types.ObjectId(session.id),
            actorName,
            actorRole: eligibility.roleUsed,
            timestamp: now,
            comment: comment || `Approved stage '${currentStage.stageName}'. Advanced to '${nextStage.stageName}'.`,
            delegatedBy: eligibility.isDelegated ? eligibility.delegatorName : undefined,
            stageKey: currentStage.stageKey,
          });

          // Notify next approvers / applicant
          await sendApprovalNotification({
            userId: requestDoc.applicantUserId,
            societyId: requestDoc.societyId,
            title: `Request Progress: ${currentStage.stageName} Approved`,
            message: `Your request #${requestDoc.requestId} was approved at '${currentStage.stageName}' and advanced to '${nextStage.stageName}'.`,
            eventType: "SERVICE_REQUEST_STAGE_APPROVED",
            actionUrl: `/requests/${requestDoc.requestId}`,
          });
        } else {
          // Final stage reached
          wf.isCompleted = true;
          wf.finalDecision = "APPROVED";
          wf.finalDecidedAt = now;

          // If document issuance is NOT required, complete request now
          if (!wf.requiresDocumentIssuance) {
            requestDoc.currentStatus = "COMPLETED";
            requestDoc.pendingActorType = "NONE";
          } else {
            requestDoc.currentStatus = "APPROVED";
          }

          requestDoc.timeline.push({
            action: "REQUEST_FULLY_APPROVED",
            actorId: new Types.ObjectId(session.id),
            actorName,
            actorRole: eligibility.roleUsed,
            timestamp: now,
            comment: comment || "All configured approval stages have been successfully completed.",
            delegatedBy: eligibility.isDelegated ? eligibility.delegatorName : undefined,
            newStatus: requestDoc.currentStatus,
          });

          await sendApprovalNotification({
            userId: requestDoc.applicantUserId,
            societyId: requestDoc.societyId,
            title: "Service Request Approved",
            message: `Your service application #${requestDoc.requestId} has been fully approved by the Managing Committee.`,
            eventType: "SERVICE_REQUEST_FULLY_APPROVED",
            type: "success",
            actionUrl: `/requests/${requestDoc.requestId}`,
          });
        }
      }

      await requestDoc.save();

      await AuditEvent.create({
        societyId: requestDoc.societyId,
        userId: new Types.ObjectId(session.id),
        action: "SERVICE_REQUEST_STAGE_APPROVED",
        entityType: "ServiceRequest",
        entityId: requestDoc._id.toString(),
        details: {
          actorName,
          roleUsed: eligibility.roleUsed,
          stageKey: currentStage.stageKey,
          stageName: currentStage.stageName,
          requestId: requestDoc.requestId,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Stage '${currentStage.stageName}' approved successfully.`,
        currentStatus: requestDoc.currentStatus,
        nextStageIndex: wf.currentStageIndex,
      });
    }

    // =========================================================================
    // ACTION 2: REJECT
    // =========================================================================
    if (action === "REJECT") {
      if (!comment || comment.trim().length === 0) {
        return NextResponse.json({ error: "Rejection requires an explicit reason" }, { status: 400 });
      }

      if (currentStage) {
        currentStage.status = "REJECTED";
        currentStage.completedAt = now;
      }

      wf.isCompleted = true;
      wf.finalDecision = "REJECTED";
      wf.finalDecidedAt = now;

      requestDoc.currentStatus = "REJECTED";
      requestDoc.pendingActorType = "NONE";

      requestDoc.timeline.push({
        action: "REQUEST_REJECTED",
        actorId: new Types.ObjectId(session.id),
        actorName,
        actorRole: baseRole,
        timestamp: now,
        comment: comment.trim(),
        newStatus: "REJECTED",
      });

      await requestDoc.save();

      await sendApprovalNotification({
        userId: requestDoc.applicantUserId,
        societyId: requestDoc.societyId,
        title: "Service Request Rejected",
        message: `Your request #${requestDoc.requestId} was rejected by Society Management. Reason: ${comment.trim()}`,
        eventType: "SERVICE_REQUEST_REJECTED",
        type: "warning",
        actionUrl: `/requests/${requestDoc.requestId}`,
      });

      // If tenant request, also notify flat owner
      if (requestDoc.applicantRole === "TENANT" && requestDoc.flatId) {
        const ownerOcc = await FlatOccupancy.findOne({
          flatId: (requestDoc.flatId as any)._id || requestDoc.flatId,
          occupancyType: "OWNER",
          status: "APPROVED",
        }).lean();
        if (ownerOcc) {
          await sendApprovalNotification({
            userId: ownerOcc.userId,
            societyId: requestDoc.societyId,
            title: `Tenant Request Rejected: #${requestDoc.requestId}`,
            message: `Tenant request for Flat ${(requestDoc.flatId as any)?.flatNumber || ""} was rejected by Society Management. Reason: ${comment.trim()}`,
            eventType: "SERVICE_REQUEST_REJECTED",
            type: "info",
            actionUrl: `/properties`,
          });
        }
      }

      await AuditEvent.create({
        societyId: requestDoc.societyId,
        userId: new Types.ObjectId(session.id),
        action: "SERVICE_REQUEST_REJECTED",
        entityType: "ServiceRequest",
        entityId: requestDoc._id.toString(),
        details: {
          actorName,
          role: baseRole,
          reason: comment.trim(),
          requestId: requestDoc.requestId,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Request has been rejected and applicant notified.",
        currentStatus: "REJECTED",
      });
    }

    // =========================================================================
    // ACTION 3: REQUEST_CORRECTION
    // =========================================================================
    if (action === "REQUEST_CORRECTION") {
      if (!comment || comment.trim().length === 0) {
        return NextResponse.json(
          { error: "Explanation required when requesting more information or corrections" },
          { status: 400 }
        );
      }

      if (currentStage) {
        currentStage.status = "CORRECTION_REQUIRED";
      }

      requestDoc.currentStatus = "INFORMATION_REQUIRED";
      requestDoc.pendingActorType = "APPLICANT";
      requestDoc.correctionRequest = {
        requestedByRole: "MANAGEMENT",
        requestedByUserId: new Types.ObjectId(session.id),
        requestedByName: actorName,
        requestedAt: now,
        note: comment.trim(),
        requestedFields: requestedFields || [],
        requestedDocCodes: requestedDocCodes || [],
      };

      requestDoc.timeline.push({
        action: "INFORMATION_REQUIRED",
        actorId: new Types.ObjectId(session.id),
        actorName,
        actorRole: baseRole,
        timestamp: now,
        comment: comment.trim(),
        newStatus: "INFORMATION_REQUIRED",
      });

      await requestDoc.save();

      await sendApprovalNotification({
        userId: requestDoc.applicantUserId,
        societyId: requestDoc.societyId,
        title: "Information / Document Correction Required",
        message: `Society Management requested corrections on request #${requestDoc.requestId}: ${comment.trim()}`,
        eventType: "SERVICE_REQUEST_CORRECTION_REQUESTED",
        type: "action_required",
        actionUrl: `/requests/${requestDoc.requestId}`,
      });

      return NextResponse.json({
        success: true,
        message: "Correction request dispatched to applicant.",
        currentStatus: "INFORMATION_REQUIRED",
      });
    }

    // =========================================================================
    // ACTION 4: VERIFY_DOCUMENT
    // =========================================================================
    if (action === "VERIFY_DOCUMENT") {
      if (!documentId || !verificationStatus) {
        return NextResponse.json(
          { error: "documentId and verificationStatus (VERIFIED, CORRECTION_REQUIRED, REJECTED, PENDING) required" },
          { status: 400 }
        );
      }

      const attachment = requestDoc.attachments?.find((a) => a.documentId === documentId);
      if (!attachment) {
        return NextResponse.json({ error: "Attachment not found on this request" }, { status: 404 });
      }

      attachment.verificationStatus = verificationStatus;
      attachment.verifiedByUserId = new Types.ObjectId(session.id);
      attachment.verifiedByName = actorName;
      attachment.verifiedByRole = baseRole;
      attachment.verifiedAt = now;
      attachment.verificationComment = comment || undefined;

      requestDoc.timeline.push({
        action: `DOC_VERIFICATION: ${attachment.displayName}`,
        actorId: new Types.ObjectId(session.id),
        actorName,
        actorRole: baseRole,
        timestamp: now,
        comment: `Marked '${attachment.displayName}' as ${verificationStatus}${comment ? `: ${comment}` : ""}`,
      });

      await requestDoc.save();

      return NextResponse.json({
        success: true,
        message: `Attachment verification status updated to ${verificationStatus}`,
        documentId,
        verificationStatus,
      });
    }

    // =========================================================================
    // ACTION 5: ISSUE_DOCUMENT
    // =========================================================================
    if (action === "ISSUE_DOCUMENT") {
      const society = await Society.findById(requestDoc.societyId);
      if (!society) {
        return NextResponse.json({ error: "Society record not found" }, { status: 404 });
      }

      const flat = await Flat.findById(requestDoc.flatId).populate("wingId");
      const flatNumber = flat?.flatNumber || (requestDoc.formData?.flatNumber as string) || "Unit";
      const wingName = (flat?.wingId as unknown as { name?: string })?.name || (requestDoc.formData?.wingName as string) || "";

      const docTemplateCode =
        (body.documentTemplateCode as "HOME_LOAN_NOC" | "NO_DUES_CERT" | "ADDRESS_CONFIRMATION" | "GENERAL_SOCIETY_LETTER") ||
        (wf.documentTemplateCode as "HOME_LOAN_NOC" | "NO_DUES_CERT" | "ADDRESS_CONFIRMATION" | "GENERAL_SOCIETY_LETTER") ||
        (requestDoc.serviceCode === "HOME_LOAN_NOC" ? "HOME_LOAN_NOC" : "NO_DUES_CERT");

      // Generate the official PDF certificate
      const genDoc = await generateSocietyCertificate({
        request: requestDoc,
        society,
        documentType: docTemplateCode,
        signatoryUserId: session.id,
        signatoryName: actorName,
        signatoryRole: baseRole,
        flatNumber,
        wingName,
        purpose: (requestDoc.formData?.purpose as string) || requestDoc.serviceTitle,
        bankName: (requestDoc.formData?.bankName as string) || undefined,
      });

      // Update request state to COMPLETED / ISSUED
      requestDoc.generatedDocument = {
        documentRef: genDoc.documentRef,
        documentType: genDoc.documentType,
        r2ObjectKey: genDoc.r2ObjectKey,
        originalFilename: `${genDoc.documentRef}.pdf`,
        generatedAt: now,
        issuedAt: now,
        issuedByUserId: new Types.ObjectId(session.id),
        issuedByName: actorName,
        issuedByRole: baseRole,
        verificationToken: genDoc.verificationToken,
      };

      if (currentStage && currentStage.stageType === "ISSUANCE") {
        currentStage.status = "APPROVED";
        currentStage.completedAt = now;
      }

      wf.isCompleted = true;
      wf.finalDecision = "APPROVED";
      wf.finalDecidedAt = now;
      requestDoc.currentStatus = "COMPLETED";
      requestDoc.pendingActorType = "NONE";

      requestDoc.timeline.push({
        action: "DOCUMENT_ISSUED",
        actorId: new Types.ObjectId(session.id),
        actorName,
        actorRole: baseRole,
        timestamp: now,
        comment: `Official ${genDoc.title} (${genDoc.documentRef}) generated, digitally recorded, and released to resident.`,
        newStatus: "COMPLETED",
        metadata: {
          documentRef: genDoc.documentRef,
          verificationToken: genDoc.verificationToken,
        },
      });

      await requestDoc.save();

      // Notify resident that their official certificate is ready
      await sendApprovalNotification({
        userId: requestDoc.applicantUserId,
        societyId: requestDoc.societyId,
        title: "Official Document Issued",
        message: `Your ${genDoc.title} (Ref: ${genDoc.documentRef}) has been formally issued by Society Management and is ready for download in your vault.`,
        eventType: "SERVICE_REQUEST_DOCUMENT_ISSUED",
        type: "success",
        actionUrl: `/requests/${requestDoc.requestId}`,
      });

      // If tenant, also notify the property owner
      if (requestDoc.applicantRole === "TENANT" && requestDoc.flatId) {
        const ownerOcc = await FlatOccupancy.findOne({
          flatId: (requestDoc.flatId as any)._id || requestDoc.flatId,
          occupancyType: "OWNER",
          status: "APPROVED",
        }).lean();
        if (ownerOcc) {
          await sendApprovalNotification({
            userId: ownerOcc.userId,
            societyId: requestDoc.societyId,
            title: "Official Certificate Issued for Your Unit",
            message: `Official ${genDoc.title} has been issued for your flat ${(requestDoc.flatId as any)?.flatNumber || ""}.`,
            eventType: "SERVICE_REQUEST_DOCUMENT_ISSUED",
            type: "info",
            actionUrl: `/properties`,
          });
        }
      }

      await AuditEvent.create({
        societyId: requestDoc.societyId,
        userId: new Types.ObjectId(session.id),
        action: "DOCUMENT_ISSUED",
        entityType: "GeneratedDocument",
        entityId: genDoc._id.toString(),
        details: {
          documentRef: genDoc.documentRef,
          requestId: requestDoc.requestId,
          actorName,
          role: baseRole,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Official document ${genDoc.documentRef} generated and issued successfully.`,
        documentRef: genDoc.documentRef,
        verificationToken: genDoc.verificationToken,
        currentStatus: "COMPLETED",
      });
    }

    // =========================================================================
    // ACTION 6: ADD_COMMENT
    // =========================================================================
    if (action === "ADD_COMMENT") {
      if (!comment || comment.trim().length === 0) {
        return NextResponse.json({ error: "Comment text is required" }, { status: 400 });
      }

      const isInternal = Boolean(body.isInternalNote);

      requestDoc.timeline.push({
        action: isInternal ? "INTERNAL_NOTE_ADDED" : "COMMENT_ADDED",
        actorId: new Types.ObjectId(session.id),
        actorName,
        actorRole: baseRole,
        timestamp: now,
        comment: comment.trim(),
        isInternalNote: isInternal,
      });

      await requestDoc.save();

      return NextResponse.json({
        success: true,
        message: isInternal ? "Internal note added." : "Comment added to timeline.",
      });
    }

    return NextResponse.json({ error: `Unsupported action: ${action}` }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to execute approval action";
    console.error("[Management Approval Action POST Error]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
