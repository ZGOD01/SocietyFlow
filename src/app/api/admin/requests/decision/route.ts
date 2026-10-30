import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { getServerSession } from "@/lib/session";
import { connectDB } from "@/lib/db";
import {
  RegistrationRequest,
  ServiceRequest,
  OwnershipTransfer,
  Society,
  SocietyMembership,
  User,
  AuditEvent,
  Notification,
} from "@/models";
import { dispatchNotification } from "@/lib/notifications";
import { MembershipRole } from "@/lib/rbac";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session || !session.isSuperAdmin) {
      return NextResponse.json(
        { error: "Forbidden: Super Admin authority required." },
        { status: 403 }
      );
    }

    await connectDB();
    const body = await req.json();
    const { id, type, action, comment } = body;

    if (!id || !action || !["APPROVE", "REJECT"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid payload: id and action (APPROVE or REJECT) are required." },
        { status: 400 }
      );
    }

    const now = new Date();
    const isApprove = action === "APPROVE";

    // =========================================================================
    // 1. DIRECT SOCIETY APPROVAL (from Society Profile tab)
    // =========================================================================
    if (type === "SOCIETY") {
      const society = await Society.findById(id);
      if (!society) {
        return NextResponse.json({ error: "Society not found." }, { status: 404 });
      }

      society.status = isApprove ? "ACTIVE" : "INACTIVE";
      await society.save();

      // Update associated registration requests for this society
      await RegistrationRequest.updateMany(
        { societyId: society._id, status: "PENDING_APPROVAL" },
        {
          $set: {
            status: isApprove ? "APPROVED" : "REJECTED",
            onboardingStatus: isApprove ? "COMPLETED" : "PENDING_REGISTRATION_APPROVAL",
            "societyApproval.status": isApprove ? "APPROVED" : "REJECTED",
            "societyApproval.decidedBy": session.id,
            "societyApproval.decidedAt": now,
            "societyApproval.comment": comment || (isApprove ? "Approved by Platform Super Admin" : "Rejected by Platform Super Admin"),
          },
        }
      );

      // Verify committee memberships for this society
      await SocietyMembership.updateMany(
        {
          societyId: society._id,
          role: { $in: ["SECRETARY", "CHAIRMAN", "TREASURER", "SOCIETY_MANAGER"] },
        },
        {
          $set: {
            status: isApprove ? "VERIFIED" : "REJECTED",
            approvedBy: session.id,
            approvedAt: now,
            notes: comment || (isApprove ? "Verified by Super Admin" : "Rejected by Super Admin"),
          },
        }
      );

      // Update users associated with committee memberships
      const memberships = await SocietyMembership.find({ societyId: society._id }).lean();
      for (const m of memberships) {
        await User.findByIdAndUpdate(m.userId, {
          $set: {
            onboardingStatus: isApprove ? "COMPLETED" : "PENDING_REGISTRATION_APPROVAL",
            activeRole: m.role,
            activeSocietyId: society._id.toString(),
          },
        });
      }

      await AuditEvent.create({
        societyId: society._id,
        userId: new Types.ObjectId(session.id),
        action: isApprove ? "SUPER_ADMIN_SOCIETY_APPROVED" : "SUPER_ADMIN_SOCIETY_REJECTED",
        entityType: "Society",
        entityId: society._id.toString(),
        details: { action, comment, approvedBy: session.name },
      });

      return NextResponse.json({
        success: true,
        message: isApprove
          ? `Society "${society.name}" has been verified & approved. When management logs in, initial structure setup will launch.`
          : `Society "${society.name}" has been rejected.`,
        status: society.status,
      });
    }

    // =========================================================================
    // 2. REGISTRATION REQUEST APPROVAL (Owner, Tenant, or Management)
    // =========================================================================
    if (type === "REGISTRATION") {
      const regReq = await RegistrationRequest.findById(id);
      if (!regReq) {
        return NextResponse.json({ error: "Registration request not found." }, { status: 404 });
      }

      regReq.status = isApprove ? "APPROVED" : "REJECTED";
      regReq.onboardingStatus = isApprove ? "COMPLETED" : "PENDING_REGISTRATION_APPROVAL";
      regReq.societyApproval = {
        status: isApprove ? "APPROVED" : "REJECTED",
        decidedBy: session.id as unknown as Types.ObjectId,
        decidedAt: now,
        comment: comment || (isApprove ? "Verified and approved by Super Admin" : "Rejected by Super Admin"),
      };

      regReq.timeline.push({
        action: isApprove ? "SOCIETY_APPROVED" : "REJECTED",
        actorId: session.id as unknown as Types.ObjectId,
        actorRole: "SUPER_ADMIN",
        actorName: session.name || "Super Admin",
        timestamp: now,
        statusTransition: isApprove ? "APPROVED" : "REJECTED",
        comment: comment || (isApprove ? "Approved by Platform Super Admin" : "Rejected by Platform Super Admin"),
      });

      await regReq.save();

      // If Management Committee registration:
      if (regReq.role === "MANAGEMENT") {
        const targetRole = (regReq.managementPosition as MembershipRole) || "SECRETARY";

        // 1. Verify or create the SocietyMembership with verified status
        await SocietyMembership.findOneAndUpdate(
          {
            userId: regReq.applicantId,
            societyId: regReq.societyId,
          },
          {
            $set: {
              role: targetRole,
              status: isApprove ? "VERIFIED" : "REJECTED",
              resolutionNumber: regReq.resolutionNumber,
              approvedBy: session.id,
              approvedAt: now,
              notes: comment || (isApprove ? "Approved by Super Admin" : "Rejected by Super Admin"),
            },
          },
          { upsert: true }
        );

        // 2. Update the Society to ACTIVE so it can be managed
        if (isApprove) {
          await Society.findByIdAndUpdate(regReq.societyId, {
            $set: {
              status: "ACTIVE",
              resolutionNumber: regReq.resolutionNumber,
              inviteToken: regReq.resolutionNumber,
            },
          });
        }

        // 3. Update the User profile so next login routes directly to Management Dashboard
        await User.findByIdAndUpdate(regReq.applicantId, {
          $set: {
            onboardingStatus: isApprove ? "COMPLETED" : "PENDING_REGISTRATION_APPROVAL",
            activeRole: targetRole,
            activeSocietyId: regReq.societyId.toString(),
          },
        });
      } else {
        // Owner or Tenant registration
        const targetRole = regReq.role === "TENANT" ? "TENANT" : "OWNER";
        await SocietyMembership.findOneAndUpdate(
          {
            userId: regReq.applicantId,
            societyId: regReq.societyId,
          },
          {
            $set: {
              role: targetRole,
              status: isApprove ? "VERIFIED" : "REJECTED",
              approvedBy: session.id,
              approvedAt: now,
              notes: comment || "Reviewed by Platform Super Admin",
            },
          },
          { upsert: true }
        );

        await User.findByIdAndUpdate(regReq.applicantId, {
          $set: {
            onboardingStatus: isApprove ? "COMPLETED" : "PENDING_REGISTRATION_APPROVAL",
            activeRole: targetRole,
            activeSocietyId: regReq.societyId.toString(),
          },
        });
      }

      // Notify the applicant
      await dispatchNotification({
        eventType: isApprove ? "OWNER_REGISTRATION_APPROVED" : "OWNER_REGISTRATION_REJECTED",
        category: "REGISTRATION",
        type: isApprove ? "success" : "warning",
        title: isApprove ? "Registration Approved" : "Registration Rejected",
        message: isApprove
          ? `Your application for ${regReq.role} registration has been approved by Platform Super Admin.`
          : `Your application has been rejected. Note: ${comment || "Application does not meet platform criteria."}`,
        actionUrl: isApprove ? (regReq.role === "MANAGEMENT" ? "/management/dashboard" : "/dashboard") : "/login",
        societyId: regReq.societyId,
        recipients: [regReq.applicantId],
        idempotencyKey: `SUPER_ADMIN_REG_DECISION_${regReq._id.toString()}_${now.getTime()}`,
      }).catch((e) => console.warn("[Notification dispatch warning]", e));

      return NextResponse.json({
        success: true,
        message: isApprove ? "Application verified and approved successfully." : "Application rejected.",
        status: regReq.status,
      });
    }

    // =========================================================================
    // 3. SERVICE REQUEST APPROVAL
    // =========================================================================
    if (type === "SERVICE") {
      const srvReq = await ServiceRequest.findById(id);
      if (!srvReq) {
        return NextResponse.json({ error: "Service request not found." }, { status: 404 });
      }

      srvReq.currentStatus = isApprove ? "APPROVED" : "REJECTED";
      if (srvReq.approvalWorkflow?.stages) {
        const curIdx = srvReq.approvalWorkflow.currentStageIndex || 0;
        if (srvReq.approvalWorkflow.stages[curIdx]) {
          srvReq.approvalWorkflow.stages[curIdx].status = isApprove ? "APPROVED" : "REJECTED";
        }
        if (isApprove) {
          srvReq.approvalWorkflow.isCompleted = true;
          srvReq.approvalWorkflow.finalDecision = "APPROVED";
        } else {
          srvReq.approvalWorkflow.isCompleted = true;
          srvReq.approvalWorkflow.finalDecision = "REJECTED";
        }
      }

      srvReq.timeline.push({
        action: isApprove ? "STATUS_CHANGED_TO_APPROVED" : "STATUS_CHANGED_TO_REJECTED",
        actorId: new Types.ObjectId(session.id),
        actorRole: "SUPER_ADMIN",
        actorName: session.name || "Super Admin",
        timestamp: now,
        comment: comment || (isApprove ? "Approved by Super Admin" : "Rejected by Super Admin"),
      });

      await srvReq.save();

      return NextResponse.json({
        success: true,
        message: isApprove ? "Service request approved." : "Service request rejected.",
        status: srvReq.currentStatus,
      });
    }

    // =========================================================================
    // 4. OWNERSHIP TRANSFER APPROVAL
    // =========================================================================
    if (type === "OWNERSHIP_TRANSFER") {
      const transferReq = await OwnershipTransfer.findById(id);
      if (!transferReq) {
        return NextResponse.json({ error: "Transfer request not found." }, { status: 404 });
      }

      transferReq.status = isApprove ? "COMPLETED" : "REJECTED";
      await transferReq.save();

      return NextResponse.json({
        success: true,
        message: isApprove ? "Ownership transfer approved." : "Ownership transfer rejected.",
        status: transferReq.status,
      });
    }

    return NextResponse.json({ error: "Unsupported request type." }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to process decision";
    console.error("[Super Admin Decision Error]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
