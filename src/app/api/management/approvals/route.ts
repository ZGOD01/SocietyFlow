import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { getServerSession, SessionUser } from "@/lib/session";
import { connectDB } from "@/lib/db";
import {
  RegistrationRequest,
  SocietyMembership,
  FlatOccupancy,
  Flat,
  User,
  AuditEvent,
  Notification,
  ServiceRequest,
  Society,
} from "@/models";
import { COMMITTEE_ROLES, MembershipRole } from "@/lib/rbac";
import {
  checkUserCanApproveStage,
  calculateStageSLA,
  initializeWorkflowOnRequest,
} from "@/lib/approvals/workflow-engine";
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
        { error: "No active society found for management user." },
        { status: 400 }
      );
    }

    // Role verification: Super Admin or verified Committee member of THIS society
    const isSuperAdmin = session.isSuperAdmin;
    const isCommitteeOfSociety = session.memberships?.some(
      (m) =>
        m.societyId === activeSocietyId &&
        m.status === "VERIFIED" &&
        COMMITTEE_ROLES.includes(m.role as MembershipRole)
    );

    if (!isSuperAdmin && !isCommitteeOfSociety) {
      return NextResponse.json(
        { error: "Forbidden: Committee privileges required for this society." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const queueType = searchParams.get("type") || "SERVICE"; // "SERVICE" | "REGISTRATION"
    const tab = (searchParams.get("tab") || "ALL").toUpperCase();
    const search = searchParams.get("search")?.trim().toLowerCase();
    const category = searchParams.get("category"); // optional service category filter
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "25", 10)));
    const socObjectId = new Types.ObjectId(activeSocietyId);

    // =========================================================================
    // 1. REGISTRATION APPROVALS QUEUE (Preserving Prompts 3 & 4 compatibility)
    // =========================================================================
    if (queueType === "REGISTRATION") {
      const roleFilter = searchParams.get("role");
      const query: Record<string, unknown> = isSuperAdmin
        ? {}
        : { societyId: socObjectId };
      if (roleFilter && ["OWNER", "TENANT", "MANAGEMENT"].includes(roleFilter)) {
        query.role = roleFilter;
      }
      if (search) {
        query.$or = [
          { applicantName: new RegExp(search, "i") },
          { applicantEmail: new RegExp(search, "i") },
          { flatNumber: new RegExp(search, "i") },
        ];
      }

      const requests = await RegistrationRequest.find(query)
        .populate("societyId", "name code")
        .sort({ createdAt: -1 })
        .lean();

      const enrichedRequests = await Promise.all(
        requests.map(async (r) => {
          let existingOccupancy = null;
          if (r.flatId) {
            const currentOwner = await FlatOccupancy.findOne({
              flatId: r.flatId,
              occupancyType: "OWNER",
              status: "APPROVED",
            })
              .populate("userId", "name email phone")
              .lean();

            if (currentOwner) {
              const ownerUserId =
                (currentOwner.userId as any)?._id?.toString() ||
                (typeof currentOwner.userId === "string" ? currentOwner.userId : "");
              const applicantUserId = r.applicantId?.toString() || "";

              const isSameOwner = Boolean(ownerUserId && applicantUserId && ownerUserId === applicantUserId);
              const isConflict =
                r.role === "OWNER" &&
                r.status !== "APPROVED" &&
                Boolean(ownerUserId) &&
                !isSameOwner;

              existingOccupancy = {
                type: "OWNER",
                ownerName:
                  (currentOwner.userId as unknown as { name?: string })?.name ||
                  currentOwner.ownerName ||
                  "Current Owner",
                ownerEmail:
                  (currentOwner.userId as unknown as { email?: string })?.email || "N/A",
                isConflict,
              };
            }
          }

          const socInfo = r.societyId as unknown as { _id?: Types.ObjectId; name?: string; code?: string } | null;

          return {
            id: r._id.toString(),
            applicantId: r.applicantId?.toString(),
            applicantName: r.applicantName,
            applicantEmail: r.applicantEmail,
            applicantPhone: r.applicantPhone,
            role: r.role,
            societyId: socInfo?._id ? socInfo._id.toString() : r.societyId?.toString(),
            societyName: socInfo?.name || "Society",
            societyCode: socInfo?.code || "",
            wingName: r.wingName,
            flatNumber: r.flatNumber,
            ownershipType: r.ownershipType,
            leaseStartDate: r.leaseStartDate,
            leaseEndDate: r.leaseEndDate,
            ownerName: r.ownerName,
            ownerContact: r.ownerContact,
            managementPosition: r.managementPosition,
            resolutionNumber: r.resolutionNumber,
            status: r.status,
            ownerApproval: r.ownerApproval,
            societyApproval: r.societyApproval,
            onboardingStatus: r.onboardingStatus,
            timeline: r.timeline,
            rejectionReason: r.rejectionReason,
            moreInfoNote: r.moreInfoNote,
            existingOccupancy,
            createdAt: r.createdAt
              ? new Date(r.createdAt).toISOString()
              : new Date().toISOString(),
          };
        })
      );

      return NextResponse.json({
        success: true,
        type: "REGISTRATION",
        requests: enrichedRequests,
      });
    }

    // =========================================================================
    // 2. SERVICE APPROVALS QUEUE (Prompt 8 Core Inbox)
    // =========================================================================
    const society = await Society.findById(socObjectId).lean();

    // Query non-draft service requests for this society
    const baseFilter: Record<string, unknown> = {
      societyId: socObjectId,
      isDraft: false,
    };

    if (category && category !== "ALL") {
      baseFilter.serviceCategory = category;
    }

    // Load candidate requests
    const allRequests = await ServiceRequest.find(baseFilter)
      .populate("flatId", "flatNumber floor wingId")
      .populate("applicantUserId", "name email phone")
      .sort({ createdAt: -1 });

    // Ensure all requests reaching society review have an initialized workflow snapshot
    for (const reqDoc of allRequests) {
      if (
        !reqDoc.approvalWorkflow &&
        ["AWAITING_SOCIETY_REVIEW", "UNDER_REVIEW", "APPROVED", "COMPLETED", "ISSUED"].includes(
          reqDoc.currentStatus
        )
      ) {
        await initializeWorkflowOnRequest(reqDoc);
        await reqDoc.save();
      }
    }

    // Enrich and calculate dynamic SLA & approval eligibility for current caller
    const processedItems = await Promise.all(
      allRequests.map(async (doc) => {
        const r = doc.toObject();
        const flatObj = r.flatId as unknown as { flatNumber?: string; floor?: number; wingId?: { name?: string } } | null;
        const applicantObj = r.applicantUserId as unknown as { name?: string; email?: string; phone?: string } | null;

        const currentStageIdx = r.approvalWorkflow?.currentStageIndex ?? 0;
        const stages = r.approvalWorkflow?.stages || [];
        const currentStage = stages[currentStageIdx] || null;

        let sla = { pendingDurationHours: 0, expectedCompletionDate: null as Date | null, isOverdue: false };
        let eligibility = { canApprove: false, roleUsed: "NONE", isDelegated: false };

        if (currentStage) {
          sla = calculateStageSLA(currentStage);
          if (["AWAITING_SOCIETY_REVIEW", "UNDER_REVIEW"].includes(r.currentStatus)) {
            eligibility = await checkUserCanApproveStage(session, socObjectId, currentStage, r.serviceCode);
          }
        }

        // Count pending / verified attachments
        const attachments = r.attachments || [];
        const unverifiedDocsCount = attachments.filter(
          (a) => !a.verificationStatus || a.verificationStatus === "PENDING"
        ).length;

        return {
          id: r._id.toString(),
          requestId: r.requestId,
          serviceCode: r.serviceCode,
          serviceTitle: r.serviceTitle,
          serviceCategory: r.serviceCategory,
          applicantName: applicantObj?.name || (r.formData?.applicantName as string) || "Resident",
          applicantEmail: applicantObj?.email,
          applicantPhone: applicantObj?.phone,
          applicantRole: r.applicantRole,
          societyName: society?.name || "Society",
          wingName: (r.formData?.wingName as string) || (flatObj?.wingId?.name) || "",
          flatNumber: flatObj?.flatNumber || (r.formData?.flatNumber as string) || "Flat",
          submissionDate: r.submittedAt || r.createdAt,
          currentStatus: r.currentStatus,
          pendingActorType: r.pendingActorType,
          currentStage: currentStage
            ? {
                stageIndex: currentStage.stageIndex,
                stageKey: currentStage.stageKey,
                stageName: currentStage.stageName,
                stageType: currentStage.stageType,
                allowedRoles: currentStage.allowedRoles,
                status: currentStage.status,
                startedAt: currentStage.startedAt,
                dueDate: currentStage.dueDate,
                approvalsReceivedCount: currentStage.approvalsReceived?.length || 0,
                requiredSignersCount: currentStage.requiredSignersCount || 1,
              }
            : null,
          sla: {
            pendingDurationHours: sla.pendingDurationHours,
            expectedCompletionDate: sla.expectedCompletionDate,
            isOverdue: sla.isOverdue,
          },
          canCurrentOfficialApprove: eligibility.canApprove,
          officialRoleUsed: eligibility.roleUsed,
          isDelegatedAuthority: eligibility.isDelegated,
          unverifiedDocsCount,
          totalDocsCount: attachments.length,
          hasGeneratedDocument: Boolean(r.generatedDocument?.documentRef),
          generatedDocumentRef: r.generatedDocument?.documentRef,
          updatedAt: r.updatedAt,
        };
      })
    );

    // Compute metric counts for tabs
    const stats = {
      all: processedItems.length,
      pendingMyApproval: processedItems.filter(
        (i) => i.canCurrentOfficialApprove && ["AWAITING_SOCIETY_REVIEW", "UNDER_REVIEW"].includes(i.currentStatus)
      ).length,
      awaitingOtherOfficials: processedItems.filter(
        (i) => !i.canCurrentOfficialApprove && ["AWAITING_SOCIETY_REVIEW", "UNDER_REVIEW"].includes(i.currentStatus)
      ).length,
      documentVerification: processedItems.filter(
        (i) =>
          ["AWAITING_SOCIETY_REVIEW", "UNDER_REVIEW"].includes(i.currentStatus) &&
          (i.currentStage?.stageType === "VERIFICATION" || i.unverifiedDocsCount > 0)
      ).length,
      informationRequired: processedItems.filter((i) => i.currentStatus === "INFORMATION_REQUIRED").length,
      approved: processedItems.filter((i) => i.currentStatus === "APPROVED").length,
      rejected: processedItems.filter((i) => i.currentStatus === "REJECTED").length,
      completed: processedItems.filter((i) => ["COMPLETED", "ISSUED"].includes(i.currentStatus)).length,
      overdueCount: processedItems.filter(
        (i) => i.sla.isOverdue && ["AWAITING_SOCIETY_REVIEW", "UNDER_REVIEW"].includes(i.currentStatus)
      ).length,
    };

    // Filter items based on active tab
    let filtered = processedItems;
    switch (tab) {
      case "PENDING_MY_APPROVAL":
        filtered = processedItems.filter(
          (i) => i.canCurrentOfficialApprove && ["AWAITING_SOCIETY_REVIEW", "UNDER_REVIEW"].includes(i.currentStatus)
        );
        break;
      case "AWAITING_OTHER_OFFICIALS":
        filtered = processedItems.filter(
          (i) => !i.canCurrentOfficialApprove && ["AWAITING_SOCIETY_REVIEW", "UNDER_REVIEW"].includes(i.currentStatus)
        );
        break;
      case "DOCUMENT_VERIFICATION":
        filtered = processedItems.filter(
          (i) =>
            ["AWAITING_SOCIETY_REVIEW", "UNDER_REVIEW"].includes(i.currentStatus) &&
            (i.currentStage?.stageType === "VERIFICATION" || i.unverifiedDocsCount > 0)
        );
        break;
      case "INFORMATION_REQUIRED":
        filtered = processedItems.filter((i) => i.currentStatus === "INFORMATION_REQUIRED");
        break;
      case "APPROVED":
        filtered = processedItems.filter((i) => i.currentStatus === "APPROVED");
        break;
      case "REJECTED":
        filtered = processedItems.filter((i) => i.currentStatus === "REJECTED");
        break;
      case "COMPLETED":
        filtered = processedItems.filter((i) => ["COMPLETED", "ISSUED"].includes(i.currentStatus));
        break;
      case "ALL":
      default:
        filtered = processedItems;
        break;
    }

    // Apply search filter if provided
    if (search) {
      filtered = filtered.filter(
        (i) =>
          i.requestId.toLowerCase().includes(search) ||
          i.serviceTitle.toLowerCase().includes(search) ||
          i.applicantName.toLowerCase().includes(search) ||
          i.flatNumber.toLowerCase().includes(search) ||
          i.serviceCode.toLowerCase().includes(search)
      );
    }

    // Sort: Overdue & Actionable first, then most recently submitted
    filtered.sort((a, b) => {
      if (a.sla.isOverdue && !b.sla.isOverdue) return -1;
      if (!a.sla.isOverdue && b.sla.isOverdue) return 1;
      return new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime();
    });

    const totalMatching = filtered.length;
    const paginatedItems = filtered.slice((page - 1) * limit, page * limit);

    return NextResponse.json({
      success: true,
      type: "SERVICE",
      stats,
      activeTab: tab,
      pagination: {
        page,
        limit,
        total: totalMatching,
        totalPages: Math.ceil(totalMatching / limit) || 1,
      },
      requests: paginatedItems,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load approval requests";
    console.error("[Management Approvals GET Error]", message);
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

    const body = await req.json();
    const { requestId, action, comment } = body;

    if (!requestId || !action) {
      return NextResponse.json(
        { error: "Invalid payload: requestId and action required." },
        { status: 400 }
      );
    }

    // Check if this is a RegistrationRequest (Prompts 3/4)
    const regRequest = await RegistrationRequest.findById(requestId);
    if (regRequest) {
      return handleRegistrationRequestAction(session, regRequest, action, comment);
    }

    // Otherwise, check if this is a ServiceRequest
    const serviceReq = await ServiceRequest.findOne({
      $or: [
        { _id: Types.ObjectId.isValid(requestId) ? new Types.ObjectId(requestId) : null },
        { requestId },
      ],
    });

    if (!serviceReq) {
      return NextResponse.json({ error: "Approval request not found." }, { status: 404 });
    }

    return NextResponse.json({
      error: "Service request actions must be executed via /api/management/approvals/[requestId]",
    }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to process approval action";
    console.error("[Management Approvals POST Error]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Handler for registration requests (preserving existing Prompts 3/4 behavior)
async function handleRegistrationRequestAction(
  session: SessionUser,
  regRequest: InstanceType<typeof RegistrationRequest>,
  action: string,
  comment?: string
) {
  const activeSocietyId = session.activeSocietyId || session.memberships?.[0]?.societyId;

  if (!session.isSuperAdmin && regRequest.societyId.toString() !== activeSocietyId) {
    return NextResponse.json(
      { error: "Unauthorized: You cannot approve registrations for another society." },
      { status: 403 }
    );
  }

  const isSuperAdmin = session.isSuperAdmin;
  const isCommittee = session.memberships?.some(
    (m: { societyId: string; status: string; role: string }) =>
      m.societyId === regRequest.societyId.toString() &&
      m.status === "VERIFIED" &&
      COMMITTEE_ROLES.includes(m.role as MembershipRole)
  );

  if (!isSuperAdmin && !isCommittee) {
    return NextResponse.json(
      { error: "Forbidden: Committee privileges required to review registrations." },
      { status: 403 }
    );
  }

  const now = new Date();
  const actorRole = session.activeRole || "SECRETARY";
  const actorName = session.name || "Society Committee";

  if (action === "APPROVE") {
    if (regRequest.role === "OWNER" && regRequest.flatId) {
      const existingApprovedOwner = await FlatOccupancy.findOne({
        flatId: regRequest.flatId,
        occupancyType: "OWNER",
        status: "APPROVED",
        userId: { $ne: regRequest.applicantId },
      });

      if (existingApprovedOwner) {
        return NextResponse.json(
          {
            error:
              "Conflict detected: This flat currently has another verified owner registered. An authorized ownership-transfer or reassignment process is required before approval.",
          },
          { status: 409 }
        );
      }
    }

    regRequest.societyApproval = {
      status: "APPROVED",
      decidedBy: session.id as unknown as Types.ObjectId,
      decidedAt: now,
      comment: comment || "Approved by Society Management",
    };

    // Staging transition: If applicant is TENANT and owner has not approved yet,
    // do NOT activate tenancy until owner authorizes.
    if (regRequest.role === "TENANT" && regRequest.ownerApproval?.status !== "APPROVED") {
      regRequest.status = "SOCIETY_APPROVED_OWNER_PENDING";
      regRequest.onboardingStatus = "PENDING_REGISTRATION_APPROVAL";

      regRequest.timeline.push({
        action: "SOCIETY_APPROVED",
        actorId: session.id as unknown as Types.ObjectId,
        actorRole,
        actorName,
        timestamp: now,
        statusTransition: "SOCIETY_APPROVED_OWNER_PENDING",
        comment: comment || "Managing committee verified tenant application. Awaiting property owner authorization.",
      });

      await regRequest.save();

      await AuditEvent.create({
        societyId: regRequest.societyId,
        userId: new Types.ObjectId(session.id),
        action: "REGISTRATION_SOCIETY_APPROVED_PENDING_OWNER",
        entityType: "RegistrationRequest",
        entityId: regRequest._id.toString(),
        details: {
          applicantName: regRequest.applicantName,
          role: regRequest.role,
          flatId: regRequest.flatId?.toString(),
        },
      });

      await dispatchNotification({
        eventType: "TENANT_SOCIETY_APPROVED",
        category: "REGISTRATION",
        type: "info",
        title: "Society Approval Completed",
        message: "Society approval completed. Waiting for property owner authorization.",
        actionUrl: "/pending-approval",
        societyId: regRequest.societyId,
        recipients: [regRequest.applicantId],
        idempotencyKey: `MGMT_TENANT_SOC_OK_${regRequest._id.toString()}`,
      });

      return NextResponse.json({
        success: true,
        message: "Society verification approved. Tenancy remains pending until property owner authorizes.",
        status: "SOCIETY_APPROVED_OWNER_PENDING",
      });
    }

    // Both approvals fulfilled (or OWNER registration)
    regRequest.status = "APPROVED";
    regRequest.onboardingStatus = "DOCUMENT_ONBOARDING_REQUIRED";

    regRequest.timeline.push({
      action: "SOCIETY_APPROVED",
      actorId: session.id as unknown as Types.ObjectId,
      actorRole,
      actorName,
      timestamp: now,
      statusTransition: "APPROVED",
      comment:
        comment ||
        (regRequest.role === "TENANT"
          ? "Managing committee verified tenant application. Dual approval complete."
          : "Managing committee verified property owner credentials."),
    });

    await regRequest.save();

    const targetMembershipRole: MembershipRole =
      regRequest.role === "TENANT"
        ? "TENANT"
        : regRequest.role === "MANAGEMENT"
        ? "SOCIETY_MANAGER"
        : "OWNER";

    await SocietyMembership.findOneAndUpdate(
      {
        userId: regRequest.applicantId,
        societyId: regRequest.societyId,
        role: targetMembershipRole,
      },
      {
        $set: {
          status: "VERIFIED",
          approvedBy: session.id,
          approvedAt: now,
          notes: comment || "Approved by Managing Committee",
        },
      },
      { upsert: true }
    );

    if (regRequest.flatId) {
      await FlatOccupancy.findOneAndUpdate(
        { flatId: regRequest.flatId, userId: regRequest.applicantId },
        {
          $set: {
            status: "APPROVED",
            approvedBy: session.id,
            approvedAt: now,
          },
        },
        { upsert: true }
      );

      // Update active unit record
      if (regRequest.role === "TENANT") {
        await Flat.findByIdAndUpdate(regRequest.flatId, {
          $set: {
            currentTenantId: regRequest.applicantId,
            defaultOccupancyType: "TENANT_OCCUPIED",
          },
        });
      } else if (regRequest.role === "OWNER") {
        await Flat.findByIdAndUpdate(regRequest.flatId, {
          $set: {
            currentOwnerId: regRequest.applicantId,
            defaultOccupancyType: "OWNER_OCCUPIED",
          },
        });
      }
    }

    // Ensure User profile reflects mandatory document onboarding upon fresh login
    await User.findByIdAndUpdate(regRequest.applicantId, {
      $set: { onboardingStatus: "DOCUMENT_ONBOARDING_REQUIRED" },
    });

    await AuditEvent.create({
      societyId: regRequest.societyId,
      userId: new Types.ObjectId(session.id),
      action: "REGISTRATION_APPROVED",
      entityType: "RegistrationRequest",
      entityId: regRequest._id.toString(),
      details: {
        applicantName: regRequest.applicantName,
        role: regRequest.role,
        flatId: regRequest.flatId?.toString(),
      },
    });

    // Multi-channel notifications
    if (regRequest.role === "TENANT") {
      await dispatchNotification({
        eventType: "TENANT_REGISTRATION_COMPLETED",
        category: "REGISTRATION",
        type: "success",
        title: "Registration Fully Approved",
        message: "Registration fully approved. Log in to upload your required documents.",
        actionUrl: "/onboarding/tenant-documents",
        societyId: regRequest.societyId,
        recipients: [regRequest.applicantId],
        idempotencyKey: `MGMT_TENANT_FULL_${regRequest._id.toString()}`,
      });

      // Notify verified flat owner
      if (regRequest.flatId) {
        const ownerOcc = await FlatOccupancy.findOne({
          flatId: regRequest.flatId,
          occupancyType: "OWNER",
          status: "APPROVED",
        }).lean();
        if (ownerOcc) {
          await dispatchNotification({
            eventType: "TENANT_REGISTRATION_COMPLETED",
            category: "REGISTRATION",
            type: "success",
            title: "Tenant Registration Approved",
            message: `Tenant registration approved and activated for Flat ${regRequest.wingName || ""}-${regRequest.flatNumber}.`,
            actionUrl: "/properties",
            societyId: regRequest.societyId,
            recipients: [ownerOcc.userId],
            idempotencyKey: `MGMT_OWNER_NOTIFY_${regRequest._id.toString()}`,
          });
        }
      }
    } else {
      // Owner registration approved
      await dispatchNotification({
        eventType: "OWNER_REGISTRATION_APPROVED",
        category: "REGISTRATION",
        type: "success",
        title: "Registration Approved",
        message: "Your SocietyFlow registration has been approved. Log in to complete your document onboarding.",
        actionUrl: "/onboarding/owner-documents",
        societyId: regRequest.societyId,
        recipients: [regRequest.applicantId],
        idempotencyKey: `MGMT_OWNER_APPR_${regRequest._id.toString()}`,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Registration approved successfully.",
      status: "APPROVED",
    });
  } else if (action === "REQUEST_INFO") {
    regRequest.status = "MORE_INFO_REQUESTED";
    regRequest.moreInfoNote = comment || "More information requested by committee.";
    regRequest.timeline.push({
      action: "MORE_INFO_REQUESTED",
      actorId: session.id as unknown as Types.ObjectId,
      actorRole,
      actorName,
      timestamp: now,
      statusTransition: "MORE_INFO_REQUESTED",
      comment: comment || "More information requested by committee.",
    });
    await regRequest.save();

    await dispatchNotification({
      eventType: "MORE_INFO_REQUESTED",
      category: "REGISTRATION",
      type: "action_required",
      title: "More Information Required",
      message: comment || "Managing committee requested additional information for your registration.",
      actionUrl: "/pending-approval",
      societyId: regRequest.societyId,
      recipients: [regRequest.applicantId],
      idempotencyKey: `MGMT_INFO_REQ_${regRequest._id.toString()}`,
    });

    return NextResponse.json({
      success: true,
      message: "Information request sent to applicant.",
      status: "MORE_INFO_REQUESTED",
    });
  } else if (action === "REJECT") {
    regRequest.status = "REJECTED";
    regRequest.rejectionReason = comment || "Rejected by committee.";
    regRequest.societyApproval = {
      status: "REJECTED",
      decidedBy: session.id as unknown as Types.ObjectId,
      decidedAt: now,
      comment: comment || "Rejected by committee",
    };
    regRequest.timeline.push({
      action: "REJECTED",
      actorId: session.id as unknown as Types.ObjectId,
      actorRole,
      actorName,
      timestamp: now,
      statusTransition: "REJECTED",
      comment: comment || "Application rejected by managing committee.",
    });
    await regRequest.save();

    await SocietyMembership.findOneAndUpdate(
      { userId: regRequest.applicantId, societyId: regRequest.societyId },
      { $set: { status: "REJECTED", notes: comment || "Rejected by managing committee" } }
    );

    if (regRequest.flatId) {
      await FlatOccupancy.findOneAndUpdate(
        { flatId: regRequest.flatId, userId: regRequest.applicantId },
        { $set: { status: "REJECTED" } }
      );
    }

    await dispatchNotification({
      eventType: regRequest.role === "TENANT" ? "TENANT_SOCIETY_REJECTED" : "OWNER_REGISTRATION_REJECTED",
      category: "REGISTRATION",
      type: "warning",
      title: "Registration Requires Attention",
      message: "Your registration requires attention. Open SocietyFlow to view the decision.",
      actionUrl: "/pending-approval",
      societyId: regRequest.societyId,
      recipients: [regRequest.applicantId],
      idempotencyKey: `MGMT_REJ_${regRequest._id.toString()}`,
    });

    return NextResponse.json({
      success: true,
      message: "Registration application rejected.",
      status: "REJECTED",
    });
  }

  return NextResponse.json({ error: "Unhandled action" }, { status: 400 });
}
