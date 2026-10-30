import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/session";
import { connectDB } from "@/lib/db";
import {
  RegistrationRequest,
  FlatOccupancy,
  Flat,
  SocietyMembership,
  User,
  Notification,
  AuditEvent,
} from "@/models";
import { dispatchNotification } from "@/lib/notifications";

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Find all flats where the caller is a verified APPROVED owner
    const verifiedOwnerFlats = await FlatOccupancy.find({
      userId: session.id,
      occupancyType: "OWNER",
      status: "APPROVED",
    }).select("flatId").lean();

    const flatIds = verifiedOwnerFlats.map((f) => f.flatId);

    if (flatIds.length === 0) {
      return NextResponse.json({ success: true, requests: [] });
    }

    // Find all tenant requests for these flats
    const requests = await RegistrationRequest.find({
      role: "TENANT",
      flatId: { $in: flatIds },
    })
      .sort({ createdAt: -1 })
      .lean();

    const mapped = requests.map((r) => ({
      id: r._id.toString(),
      applicantName: r.applicantName,
      applicantEmail: r.applicantEmail,
      applicantPhone: r.applicantPhone,
      role: r.role,
      societyId: r.societyId.toString(),
      wingName: r.wingName,
      flatNumber: r.flatNumber,
      leaseStartDate: r.leaseStartDate,
      leaseEndDate: r.leaseEndDate,
      status: r.status,
      ownerApproval: r.ownerApproval,
      societyApproval: r.societyApproval,
      timeline: r.timeline,
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
    }));

    return NextResponse.json({ success: true, requests: mapped });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load owner approvals";
    console.error("[Owner Approvals GET Error]", message);
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

    if (!requestId || !action || !["APPROVE", "REJECT"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid payload: requestId and action (APPROVE, REJECT) required." },
        { status: 400 }
      );
    }

    const regRequest = await RegistrationRequest.findById(requestId);
    if (!regRequest) {
      return NextResponse.json({ error: "Registration request not found." }, { status: 404 });
    }

    if (regRequest.role !== "TENANT") {
      return NextResponse.json({ error: "Only tenant registrations require property owner authorization." }, { status: 400 });
    }

    // Prevent tenant self-authorization: Applicant cannot approve their own registration
    if (regRequest.applicantId.toString() === session.id) {
      return NextResponse.json(
        { error: "Security violation: You cannot self-authorize your own tenancy application." },
        { status: 403 }
      );
    }

    // Security Check: Caller MUST be a verified approved owner of this specific flat
    const isOwnerOfFlat = await FlatOccupancy.findOne({
      userId: session.id,
      flatId: regRequest.flatId,
      occupancyType: "OWNER",
      status: "APPROVED",
    });

    if (!isOwnerOfFlat) {
      return NextResponse.json(
        { error: "Forbidden: You are not the verified property owner of this flat." },
        { status: 403 }
      );
    }

    const now = new Date();
    const actorRole = "OWNER";
    const actorName = session.name || "Flat Owner";

    if (action === "APPROVE") {
      regRequest.ownerApproval = {
        status: "APPROVED",
        decidedBy: session.id as unknown as import("mongoose").Types.ObjectId,
        decidedAt: now,
        comment: comment || "Approved by Property Owner",
      };

      if (regRequest.societyApproval.status === "APPROVED") {
        // Both approvals complete!
        regRequest.status = "APPROVED";
        regRequest.onboardingStatus = "DOCUMENT_ONBOARDING_REQUIRED";

        regRequest.timeline.push(
          {
            action: "OWNER_AUTHORIZED",
            actorId: session.id as unknown as import("mongoose").Types.ObjectId,
            actorRole,
            actorName,
            timestamp: now,
            statusTransition: "APPROVED",
            comment: comment || "Property Owner authorized tenancy. Dual approval complete.",
          },
          {
            action: "MEMBERSHIP_ACTIVATED",
            actorId: session.id as unknown as import("mongoose").Types.ObjectId,
            actorRole,
            actorName,
            timestamp: now,
            statusTransition: "DOCUMENT_ONBOARDING_REQUIRED",
            comment: "Tenant membership activated for document onboarding.",
          }
        );

        await regRequest.save();

        await SocietyMembership.findOneAndUpdate(
          { userId: regRequest.applicantId, societyId: regRequest.societyId, role: "TENANT" },
          {
            $set: {
              status: "VERIFIED",
              approvedBy: session.id,
              approvedAt: now,
            },
          }
        );

        if (regRequest.flatId) {
          await FlatOccupancy.findOneAndUpdate(
            { flatId: regRequest.flatId, userId: regRequest.applicantId, occupancyType: "TENANT" },
            {
              $set: {
                status: "APPROVED",
                verifiedBy: session.id,
                verifiedAt: now,
                leaseStartDate: regRequest.leaseStartDate,
                leaseEndDate: regRequest.leaseEndDate,
              },
            }
          );

          await Flat.findByIdAndUpdate(regRequest.flatId, {
            $set: {
              currentTenantId: regRequest.applicantId,
              defaultOccupancyType: "TENANT_OCCUPIED",
            },
          });
        }

        await User.findByIdAndUpdate(regRequest.applicantId, {
          $set: { onboardingStatus: "DOCUMENT_ONBOARDING_REQUIRED" },
        });

        // Multi-channel notification dispatch
        await dispatchNotification({
          eventType: "TENANT_REGISTRATION_COMPLETED",
          category: "REGISTRATION",
          type: "success",
          title: "Registration Fully Approved",
          message: "Registration fully approved. Log in to upload your required documents.",
          actionUrl: "/onboarding/tenant-documents",
          societyId: regRequest.societyId,
          recipients: [regRequest.applicantId],
          idempotencyKey: `TENANT_REG_FULL_APPR_${regRequest._id.toString()}`,
        });

        await dispatchNotification({
          eventType: "TENANT_REGISTRATION_COMPLETED",
          category: "REGISTRATION",
          type: "success",
          title: "Tenant Registration Approved",
          message: `Tenant registration approved and activated for your flat ${regRequest.wingName || ""}-${regRequest.flatNumber}.`,
          actionUrl: "/properties",
          societyId: regRequest.societyId,
          recipients: [session.id],
          idempotencyKey: `OWNER_TENANT_ACTIVATED_${regRequest._id.toString()}`,
        });

        return NextResponse.json({
          success: true,
          message: "Tenant authorized. Dual approval fulfilled, tenancy activated.",
          status: "APPROVED",
        });
      } else {
        // Owner approved, society is still pending
        regRequest.status = "OWNER_APPROVED_SOCIETY_PENDING";
        regRequest.timeline.push({
          action: "OWNER_AUTHORIZED",
          actorId: session.id as unknown as import("mongoose").Types.ObjectId,
          actorRole,
          actorName,
          timestamp: now,
          statusTransition: "OWNER_APPROVED_SOCIETY_PENDING",
          comment: comment || "Property Owner authorized tenancy. Awaiting Society Management approval.",
        });

        await regRequest.save();

        // Notify Tenant
        await dispatchNotification({
          eventType: "TENANT_OWNER_APPROVED",
          category: "REGISTRATION",
          type: "info",
          title: "Owner Authorization Completed",
          message: "Your property owner has authorized your registration. Society approval is still pending.",
          actionUrl: "/pending-approval",
          societyId: regRequest.societyId,
          recipients: [regRequest.applicantId],
          idempotencyKey: `TENANT_OWNER_APPR_${regRequest._id.toString()}`,
        });

        // Notify Management that Owner authorized
        const committee = await SocietyMembership.find({
          societyId: regRequest.societyId,
          role: { $in: ["SECRETARY", "CHAIRMAN", "TREASURER", "SOCIETY_MANAGER"] },
          status: "VERIFIED",
        }).select("userId").lean();

        if (committee.length > 0) {
          await dispatchNotification({
            eventType: "TENANT_OWNER_APPROVED",
            category: "APPROVAL",
            type: "action_required",
            title: "Owner Authorization Completed",
            message: `Owner authorization completed for tenant registration of Flat ${regRequest.wingName || ""}-${regRequest.flatNumber}. Society approval pending.`,
            actionUrl: "/management/approvals",
            societyId: regRequest.societyId,
            recipients: committee.map((c) => c.userId),
            idempotencyKey: `MGMT_TENANT_OWNER_DONE_${regRequest._id.toString()}`,
          });
        }

        return NextResponse.json({
          success: true,
          message: "Owner authorized. Tenancy remains pending until Society Management approves.",
          status: "OWNER_APPROVED_SOCIETY_PENDING",
        });
      }
    } else if (action === "REJECT") {
      regRequest.status = "REJECTED";
      regRequest.rejectionReason = comment || "Property owner rejected tenant authorization.";
      regRequest.ownerApproval = {
        status: "REJECTED",
        decidedBy: session.id as unknown as import("mongoose").Types.ObjectId,
        decidedAt: now,
        comment: comment || "Rejected by Property Owner",
      };

      regRequest.timeline.push({
        action: "REJECTED",
        actorId: session.id as unknown as import("mongoose").Types.ObjectId,
        actorRole,
        actorName,
        timestamp: now,
        statusTransition: "REJECTED",
        comment: comment || "Property Owner rejected tenant authorization.",
      });

      await regRequest.save();

      await SocietyMembership.findOneAndUpdate(
        { userId: regRequest.applicantId, societyId: regRequest.societyId },
        { $set: { status: "REJECTED", notes: comment || "Rejected by Property Owner" } }
      );

      if (regRequest.flatId) {
        await FlatOccupancy.findOneAndUpdate(
          { flatId: regRequest.flatId, userId: regRequest.applicantId },
          { $set: { status: "REJECTED", rejectionReason: comment || "Rejected by Property Owner" } }
        );
      }

      await dispatchNotification({
        eventType: "TENANT_OWNER_REJECTED",
        category: "REGISTRATION",
        type: "warning",
        title: "Tenant Authorization Declined",
        message: comment || "Your property owner has declined your registration.",
        actionUrl: "/pending-approval",
        societyId: regRequest.societyId,
        recipients: [regRequest.applicantId],
        idempotencyKey: `TENANT_OWNER_REJ_${regRequest._id.toString()}`,
      });

      await AuditEvent.create({
        societyId: regRequest.societyId,
        userId: session.id,
        action: "TENANT_AUTHORIZATION_REJECTED",
        entityType: "RegistrationRequest",
        entityId: regRequest._id.toString(),
        details: {
          applicantId: regRequest.applicantId.toString(),
          flatNumber: regRequest.flatNumber,
          rejectedBy: session.name,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Tenant authorization rejected.",
        status: "REJECTED",
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to process owner approval action";
    console.error("[Owner Approvals POST Error]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
