import mongoose, { Types } from "mongoose";
import {
  ApprovalWorkflow,
  IApprovalWorkflow,
  IApprovalWorkflowStage,
} from "@/models/ApprovalWorkflow";
import { ApprovalDelegation } from "@/models/ApprovalDelegation";
import {
  ServiceRequest,
  IServiceRequest,
  IApprovalStageState,
  IApprovalWorkflowState,
} from "@/models/ServiceRequest";
import { SocietyMembership } from "@/models/SocietyMembership";
import { AuditEvent } from "@/models/AuditEvent";
import { Notification, NotificationEventType } from "@/models/Notification";
import { SessionUser } from "@/lib/session";
import { dispatchNotification } from "@/lib/notifications/notification-engine";

/**
 * Standard default workflow templates for society services.
 */
export const DEFAULT_SERVICE_WORKFLOWS: Record<
  string,
  {
    stages: IApprovalWorkflowStage[];
    requiresDocumentIssuance: boolean;
    documentTemplateCode?: "HOME_LOAN_NOC" | "NO_DUES_CERT" | "ADDRESS_CONFIRMATION" | "GENERAL_SOCIETY_LETTER";
  }
> = {
  HOME_LOAN_NOC: {
    requiresDocumentIssuance: true,
    documentTemplateCode: "HOME_LOAN_NOC",
    stages: [
      {
        stageIndex: 0,
        stageKey: "mgr_verification",
        stageName: "Manager Verification",
        stageType: "VERIFICATION",
        allowedRoles: ["SOCIETY_MANAGER", "SECRETARY", "SUPER_ADMIN"],
        approverLogic: "ANY_ONE",
        expectedDays: 2,
        description: "Verify applicant ownership documents, loan sanction letter, and bank details.",
        requiredSignersCount: 1,
      },
      {
        stageIndex: 1,
        stageKey: "secretary_approval",
        stageName: "Secretary Approval",
        stageType: "APPROVAL",
        allowedRoles: ["SECRETARY", "SUPER_ADMIN"],
        approverLogic: "ANY_ONE",
        expectedDays: 3,
        description: "Secretary reviews flat standing and endorses NOC issuance.",
        requiredSignersCount: 1,
      },
      {
        stageIndex: 2,
        stageKey: "chairman_approval",
        stageName: "Chairman Approval",
        stageType: "APPROVAL",
        allowedRoles: ["CHAIRMAN", "SUPER_ADMIN"],
        approverLogic: "ANY_ONE",
        expectedDays: 3,
        description: "Final executive committee sanction from Society Chairman.",
        requiredSignersCount: 1,
      },
      {
        stageIndex: 3,
        stageKey: "doc_issuance",
        stageName: "Document Issuance",
        stageType: "ISSUANCE",
        allowedRoles: ["SECRETARY", "CHAIRMAN", "SOCIETY_MANAGER", "SUPER_ADMIN"],
        approverLogic: "ANY_ONE",
        expectedDays: 1,
        description: "Generate and formally release digitally signed Home Loan NOC.",
        requiredSignersCount: 1,
      },
    ],
  },
  NO_DUES_CERT: {
    requiresDocumentIssuance: true,
    documentTemplateCode: "NO_DUES_CERT",
    stages: [
      {
        stageIndex: 0,
        stageKey: "treasurer_verification",
        stageName: "Treasurer Verification",
        stageType: "VERIFICATION",
        allowedRoles: ["TREASURER", "SUPER_ADMIN"],
        approverLogic: "ANY_ONE",
        expectedDays: 2,
        description: "Verify maintenance dues, interest, penalties, and outstanding society ledger.",
        requiredSignersCount: 1,
      },
      {
        stageIndex: 1,
        stageKey: "secretary_approval",
        stageName: "Secretary Approval",
        stageType: "APPROVAL",
        allowedRoles: ["SECRETARY", "SUPER_ADMIN"],
        approverLogic: "ANY_ONE",
        expectedDays: 2,
        description: "Secretary confirms financial clearance and approves certificate release.",
        requiredSignersCount: 1,
      },
      {
        stageIndex: 2,
        stageKey: "doc_issuance",
        stageName: "Document Issuance",
        stageType: "ISSUANCE",
        allowedRoles: ["SECRETARY", "TREASURER", "SOCIETY_MANAGER", "SUPER_ADMIN"],
        approverLogic: "ANY_ONE",
        expectedDays: 1,
        description: "Generate and release official Society No-Dues Certificate.",
        requiredSignersCount: 1,
      },
    ],
  },
  RENOVATION_PERMISSION: {
    requiresDocumentIssuance: false,
    stages: [
      {
        stageIndex: 0,
        stageKey: "mgr_verification",
        stageName: "Manager Verification",
        stageType: "VERIFICATION",
        allowedRoles: ["SOCIETY_MANAGER", "SUPER_ADMIN"],
        approverLogic: "ANY_ONE",
        expectedDays: 3,
        description: "Inspect architectural plan, contractor indemnity bond, and work schedule.",
        requiredSignersCount: 1,
      },
      {
        stageIndex: 1,
        stageKey: "secretary_approval",
        stageName: "Secretary Approval",
        stageType: "APPROVAL",
        allowedRoles: ["SECRETARY", "CHAIRMAN", "SUPER_ADMIN"],
        approverLogic: "ANY_ONE",
        expectedDays: 3,
        description: "Committee approval for flat modification and work hours.",
        requiredSignersCount: 1,
      },
    ],
  },
  ADDRESS_CONFIRMATION: {
    requiresDocumentIssuance: true,
    documentTemplateCode: "ADDRESS_CONFIRMATION",
    stages: [
      {
        stageIndex: 0,
        stageKey: "mgr_verification",
        stageName: "Manager Verification",
        stageType: "VERIFICATION",
        allowedRoles: ["SOCIETY_MANAGER", "SECRETARY", "SUPER_ADMIN"],
        approverLogic: "ANY_ONE",
        expectedDays: 2,
        description: "Verify registered flat occupancy and government identity proof.",
        requiredSignersCount: 1,
      },
      {
        stageIndex: 1,
        stageKey: "secretary_approval",
        stageName: "Secretary Approval",
        stageType: "APPROVAL",
        allowedRoles: ["SECRETARY", "CHAIRMAN", "SUPER_ADMIN"],
        approverLogic: "ANY_ONE",
        expectedDays: 2,
        description: "Secretary approves address confirmation letter.",
        requiredSignersCount: 1,
      },
      {
        stageIndex: 2,
        stageKey: "doc_issuance",
        stageName: "Document Issuance",
        stageType: "ISSUANCE",
        allowedRoles: ["SECRETARY", "CHAIRMAN", "SOCIETY_MANAGER", "SUPER_ADMIN"],
        approverLogic: "ANY_ONE",
        expectedDays: 1,
        description: "Generate and release official Society Address Confirmation letter.",
        requiredSignersCount: 1,
      },
    ],
  },
  DEFAULT_APPROVAL: {
    requiresDocumentIssuance: false,
    stages: [
      {
        stageIndex: 0,
        stageKey: "committee_review",
        stageName: "Managing Committee Review",
        stageType: "APPROVAL",
        allowedRoles: ["SECRETARY", "CHAIRMAN", "TREASURER", "SOCIETY_MANAGER", "SUPER_ADMIN"],
        approverLogic: "ANY_ONE",
        expectedDays: 3,
        description: "Review and approve service request.",
        requiredSignersCount: 1,
      },
    ],
  },
};

/**
 * Retrieve or automatically seed the active approval workflow for a specific society & service.
 */
export async function getOrCreateWorkflowForService(
  societyId: Types.ObjectId | string,
  serviceCode: string,
  serviceTitle?: string
): Promise<IApprovalWorkflow> {
  const socId = typeof societyId === "string" ? new Types.ObjectId(societyId) : societyId;

  let workflow = await ApprovalWorkflow.findOne({
    societyId: socId,
    serviceCode,
    isActive: true,
  }).sort({ version: -1 });

  if (workflow) {
    return workflow;
  }

  // Lookup template configuration
  const template =
    DEFAULT_SERVICE_WORKFLOWS[serviceCode] || DEFAULT_SERVICE_WORKFLOWS.DEFAULT_APPROVAL;

  workflow = await ApprovalWorkflow.create({
    societyId: socId,
    serviceCode,
    serviceTitle: serviceTitle || serviceCode.replace(/_/g, " "),
    version: 1,
    isActive: true,
    stages: template.stages,
    requiresDocumentIssuance: template.requiresDocumentIssuance,
    documentTemplateCode: template.documentTemplateCode,
    publishedAt: new Date(),
  });

  return workflow;
}

/**
 * Initialize a service request's approval workflow snapshot when entering society review.
 * Preserves the workflow snapshot so subsequent template edits do not disrupt in-flight applications.
 */
export async function initializeWorkflowOnRequest(
  request: IServiceRequest,
  workflowDoc?: IApprovalWorkflow
): Promise<IServiceRequest> {
  const workflow =
    workflowDoc || (await getOrCreateWorkflowForService(request.societyId, request.serviceCode, request.serviceTitle));

  const now = new Date();

  const stages: IApprovalStageState[] = workflow.stages.map((st, idx) => {
    const isFirst = idx === 0;
    const dueDate = new Date(now.getTime() + st.expectedDays * 24 * 60 * 60 * 1000);
    return {
      stageIndex: st.stageIndex,
      stageKey: st.stageKey,
      stageName: st.stageName,
      stageType: st.stageType,
      allowedRoles: st.allowedRoles,
      approverLogic: st.approverLogic,
      expectedDays: st.expectedDays,
      status: isFirst ? "IN_PROGRESS" : "PENDING",
      startedAt: isFirst ? now : undefined,
      dueDate: isFirst ? dueDate : undefined,
      isOverdue: false,
      requiredSignersCount: st.requiredSignersCount || 1,
      approvalsReceived: [],
      actionNotes: st.description,
    };
  });

  const workflowSnapshot: IApprovalWorkflowState = {
    workflowId: workflow._id as Types.ObjectId,
    workflowVersion: workflow.version,
    stages,
    currentStageIndex: 0,
    isCompleted: false,
    requiresDocumentIssuance: workflow.requiresDocumentIssuance,
    documentTemplateCode: workflow.documentTemplateCode,
  };

  request.approvalWorkflow = workflowSnapshot;
  return request;
}

export interface UserEligibilityResult {
  canApprove: boolean;
  roleUsed: string;
  isDelegated: boolean;
  delegationId?: string;
  delegatorName?: string;
  reason?: string;
}

/**
 * Check if an authenticated user is eligible to approve the current stage of a request.
 * Takes into account verified society committee membership and active temporary delegations.
 */
export async function checkUserCanApproveStage(
  user: SessionUser,
  societyId: string | Types.ObjectId,
  stage: IApprovalStageState,
  serviceCode: string
): Promise<UserEligibilityResult> {
  const socIdStr = societyId.toString();

  // Super Admin bypass
  if (user.isSuperAdmin) {
    return {
      canApprove: true,
      roleUsed: "SUPER_ADMIN",
      isDelegated: false,
    };
  }

  // 1. Check direct verified membership in the society
  const userMembership = user.memberships?.find(
    (m) => m.societyId === socIdStr && m.status === "VERIFIED"
  );

  if (userMembership && stage.allowedRoles.includes(userMembership.role)) {
    return {
      canApprove: true,
      roleUsed: userMembership.role,
      isDelegated: false,
    };
  }

  // 2. Check active temporary delegations (if DB connected)
  if (mongoose.connection && mongoose.connection.readyState === 1) {
    const now = new Date();
    const userObjectId = new Types.ObjectId(user.id);
    const socObjectId = new Types.ObjectId(socIdStr);

    const activeDelegation = await ApprovalDelegation.findOne({
      societyId: socObjectId,
      delegateUserId: userObjectId,
      status: "ACTIVE",
      startDate: { $lte: now },
      endDate: { $gte: now },
    });

    if (activeDelegation) {
      // Check service scope
      const matchesService =
        !activeDelegation.serviceCodes ||
        activeDelegation.serviceCodes.length === 0 ||
        activeDelegation.serviceCodes.includes(serviceCode);

      // Check stage scope
      const matchesStage =
        !activeDelegation.stageKeys ||
        activeDelegation.stageKeys.length === 0 ||
        activeDelegation.stageKeys.includes(stage.stageKey);

      // Check delegated role authority
      const roleMatches = stage.allowedRoles.includes(activeDelegation.delegatedAuthorityRole);

      if (matchesService && matchesStage && roleMatches) {
        return {
          canApprove: true,
          roleUsed: activeDelegation.delegatedAuthorityRole,
          isDelegated: true,
          delegationId: activeDelegation._id.toString(),
          delegatorName: activeDelegation.delegatorName,
        };
      }
    }
  }

  return {
    canApprove: false,
    roleUsed: userMembership?.role || "NONE",
    isDelegated: false,
    reason: `Current stage '${stage.stageName}' requires one of: [${stage.allowedRoles.join(", ")}]. User has role '${userMembership?.role || "UNVERIFIED"}' with no matching active delegation.`,
  };
}

/**
 * Calculate dynamic overdue status and pending duration for a stage.
 */
export function calculateStageSLA(stage: IApprovalStageState): {
  pendingDurationHours: number;
  expectedCompletionDate: Date | null;
  isOverdue: boolean;
} {
  if (!stage.startedAt) {
    return {
      pendingDurationHours: 0,
      expectedCompletionDate: null,
      isOverdue: false,
    };
  }

  const now = new Date();
  const started = new Date(stage.startedAt);
  const pendingDurationHours = Math.max(
    0,
    Math.round((now.getTime() - started.getTime()) / (1000 * 60 * 60))
  );

  const dueDate = stage.dueDate
    ? new Date(stage.dueDate)
    : new Date(started.getTime() + stage.expectedDays * 24 * 60 * 60 * 1000);

  const isOverdue = stage.status === "IN_PROGRESS" && now.getTime() > dueDate.getTime();

  return {
    pendingDurationHours,
    expectedCompletionDate: dueDate,
    isOverdue,
  };
}

/**
 * Dispatch notification event safely.
 */
export async function sendApprovalNotification({
  userId,
  societyId,
  title,
  message,
  eventType,
  actionUrl,
  type = "info",
}: {
  userId: Types.ObjectId | string;
  societyId: Types.ObjectId | string;
  title: string;
  message: string;
  eventType: NotificationEventType;
  actionUrl?: string;
  type?: "info" | "warning" | "success" | "action_required";
}) {
  try {
    await dispatchNotification({
      eventType,
      category: "APPROVAL",
      type,
      title,
      message,
      actionUrl,
      societyId,
      recipients: [userId],
    });
  } catch (err) {
    console.warn("[sendApprovalNotification Warning]", err);
  }
}
