import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type ServiceRequestStatus =
  | "DRAFT"
  | "AWAITING_OWNER_AUTHORIZATION"
  | "AWAITING_SOCIETY_REVIEW"
  | "INFORMATION_REQUIRED"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "COMPLETED"
  | "ISSUED"
  | "OWNER_DECLINED"
  | "REJECTED"
  | "CANCELLED";

export type PendingActorType = "NONE" | "APPLICANT" | "OWNER" | "SOCIETY_MANAGEMENT";

export type OwnerAuthStatus = "PENDING" | "AUTHORIZED" | "DECLINED" | "INFO_REQUESTED" | "NOT_REQUIRED";

import type { ApprovalStageType, ApproverLogic } from "./ApprovalWorkflow";
export type ApprovalStageStatus = "PENDING" | "IN_PROGRESS" | "APPROVED" | "REJECTED" | "CORRECTION_REQUIRED" | "SKIPPED";

export interface IApprovalStageState {
  stageIndex: number;
  stageKey: string;
  stageName: string;
  stageType: ApprovalStageType;
  allowedRoles: string[];
  approverLogic: ApproverLogic;
  expectedDays: number;
  status: ApprovalStageStatus;
  startedAt?: Date;
  completedAt?: Date;
  dueDate?: Date;
  isOverdue?: boolean;
  requiredSignersCount?: number;
  approvalsReceived: Array<{
    actorId: Types.ObjectId;
    actorName: string;
    actorRole: string;
    delegatedBy?: string;
    approvedAt: Date;
    comment?: string;
  }>;
  actionNotes?: string;
}

export interface IApprovalWorkflowState {
  workflowId?: Types.ObjectId;
  workflowVersion: number;
  stages: IApprovalStageState[];
  currentStageIndex: number;
  isCompleted: boolean;
  requiresDocumentIssuance?: boolean;
  documentTemplateCode?: string;
  finalDecision?: "APPROVED" | "REJECTED";
  finalDecidedAt?: Date;
}

export interface IRequestAttachment {
  documentId: string;
  displayName: string;
  originalFilename: string;
  category: string;
  size: number;
  mimeType: string;
  r2ObjectKey: string;
  isRequired: boolean;
  uploadedAt: Date;
  verificationStatus?: "PENDING" | "VERIFIED" | "CORRECTION_REQUIRED" | "REJECTED";
  verifiedByUserId?: Types.ObjectId;
  verifiedByName?: string;
  verifiedByRole?: string;
  verifiedAt?: Date;
  verificationComment?: string;
}

export interface IRequestTimelineEvent {
  action: string;
  actorId?: Types.ObjectId;
  actorName: string;
  actorRole: string;
  timestamp: Date;
  comment?: string;
  isInternalNote?: boolean;
  previousStatus?: string;
  newStatus?: string;
  delegatedBy?: string;
  stageKey?: string;
  metadata?: Record<string, unknown>;
}

export interface IServiceRequest extends Document {
  requestId: string;
  societyId: Types.ObjectId;
  flatId: Types.ObjectId;
  applicantUserId: Types.ObjectId;
  applicantRole: "OWNER" | "TENANT";
  serviceDefinitionId: Types.ObjectId;
  serviceCode: string;
  serviceTitle: string;
  serviceCategory: string;
  serviceSnapshot: Record<string, unknown>;
  formData: Record<string, unknown>;
  attachments: IRequestAttachment[];
  currentStatus: ServiceRequestStatus;
  pendingActorType: PendingActorType;
  returnWorkflowStage?: "AWAITING_OWNER_AUTHORIZATION" | "AWAITING_SOCIETY_REVIEW";
  ownerAuthorization: {
    status: OwnerAuthStatus;
    ownerUserId?: Types.ObjectId;
    ownerName?: string;
    decidedAt?: Date;
    comment?: string;
  };
  correctionRequest?: {
    requestedByRole?: "OWNER" | "MANAGEMENT";
    requestedByUserId?: Types.ObjectId;
    requestedByName?: string;
    requestedAt?: Date;
    note?: string;
    requestedFields?: string[];
    requestedDocCodes?: string[];
  };
  approvalWorkflow?: IApprovalWorkflowState;
  generatedDocument?: {
    documentRef: string;
    documentType: string;
    r2ObjectKey: string;
    originalFilename: string;
    generatedAt: Date;
    issuedAt?: Date;
    issuedByUserId?: Types.ObjectId;
    issuedByName?: string;
    issuedByRole?: string;
    verificationToken?: string;
  };
  timeline: IRequestTimelineEvent[];
  isDraft: boolean;
  submittedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const RequestAttachmentSchema = new Schema<IRequestAttachment>(
  {
    documentId: { type: String, required: true },
    displayName: { type: String, required: true },
    originalFilename: { type: String, required: true },
    category: { type: String, required: true },
    size: { type: Number, required: true },
    mimeType: { type: String, required: true },
    r2ObjectKey: { type: String, required: true },
    isRequired: { type: Boolean, default: false },
    uploadedAt: { type: Date, default: Date.now },
    verificationStatus: {
      type: String,
      enum: ["PENDING", "VERIFIED", "CORRECTION_REQUIRED", "REJECTED"],
      default: "PENDING",
    },
    verifiedByUserId: { type: Schema.Types.ObjectId, ref: "User" },
    verifiedByName: { type: String },
    verifiedByRole: { type: String },
    verifiedAt: { type: Date },
    verificationComment: { type: String },
  },
  { _id: false }
);

const RequestTimelineEventSchema = new Schema<IRequestTimelineEvent>(
  {
    action: { type: String, required: true },
    actorId: { type: Schema.Types.ObjectId, ref: "User" },
    actorName: { type: String, required: true },
    actorRole: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    comment: { type: String },
    isInternalNote: { type: Boolean, default: false },
    previousStatus: { type: String },
    newStatus: { type: String },
    delegatedBy: { type: String },
    stageKey: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  { _id: false }
);

const ApprovalStageStateSchema = new Schema<IApprovalStageState>(
  {
    stageIndex: { type: Number, required: true },
    stageKey: { type: String, required: true },
    stageName: { type: String, required: true },
    stageType: {
      type: String,
      enum: ["VERIFICATION", "APPROVAL", "ISSUANCE"],
      default: "APPROVAL",
    },
    allowedRoles: [{ type: String, required: true }],
    approverLogic: {
      type: String,
      enum: ["ANY_ONE", "ALL_REQUIRED"],
      default: "ANY_ONE",
    },
    expectedDays: { type: Number, default: 3 },
    status: {
      type: String,
      enum: ["PENDING", "IN_PROGRESS", "APPROVED", "REJECTED", "CORRECTION_REQUIRED", "SKIPPED"],
      default: "PENDING",
    },
    startedAt: { type: Date },
    completedAt: { type: Date },
    dueDate: { type: Date },
    isOverdue: { type: Boolean, default: false },
    requiredSignersCount: { type: Number, default: 1 },
    approvalsReceived: [
      {
        actorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        actorName: { type: String, required: true },
        actorRole: { type: String, required: true },
        delegatedBy: { type: String },
        approvedAt: { type: Date, default: Date.now },
        comment: { type: String },
      },
    ],
    actionNotes: { type: String },
  },
  { _id: false }
);

const ApprovalWorkflowStateSchema = new Schema<IApprovalWorkflowState>(
  {
    workflowId: { type: Schema.Types.ObjectId, ref: "ApprovalWorkflow" },
    workflowVersion: { type: Number, default: 1 },
    stages: [ApprovalStageStateSchema],
    currentStageIndex: { type: Number, default: 0 },
    isCompleted: { type: Boolean, default: false },
    requiresDocumentIssuance: { type: Boolean, default: false },
    documentTemplateCode: { type: String },
    finalDecision: { type: String, enum: ["APPROVED", "REJECTED"] },
    finalDecidedAt: { type: Date },
  },
  { _id: false }
);

const GeneratedDocumentSubSchema = new Schema(
  {
    documentRef: { type: String, required: true },
    documentType: { type: String, required: true },
    r2ObjectKey: { type: String, required: true },
    originalFilename: { type: String, required: true },
    generatedAt: { type: Date, default: Date.now },
    issuedAt: { type: Date },
    issuedByUserId: { type: Schema.Types.ObjectId, ref: "User" },
    issuedByName: { type: String },
    issuedByRole: { type: String },
    verificationToken: { type: String },
  },
  { _id: false }
);

const ServiceRequestSchema = new Schema<IServiceRequest>(
  {
    requestId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    societyId: {
      type: Schema.Types.ObjectId,
      ref: "Society",
      required: true,
      index: true,
    },
    flatId: {
      type: Schema.Types.ObjectId,
      ref: "Flat",
      required: true,
      index: true,
    },
    applicantUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    applicantRole: {
      type: String,
      enum: ["OWNER", "TENANT"],
      required: true,
      index: true,
    },
    serviceDefinitionId: {
      type: Schema.Types.ObjectId,
      ref: "ServiceDefinition",
      required: true,
      index: true,
    },
    serviceCode: {
      type: String,
      required: true,
      index: true,
    },
    serviceTitle: {
      type: String,
      required: true,
    },
    serviceCategory: {
      type: String,
      required: true,
      index: true,
    },
    serviceSnapshot: {
      type: Schema.Types.Mixed,
      required: true,
    },
    formData: {
      type: Schema.Types.Mixed,
      default: {},
    },
    attachments: [RequestAttachmentSchema],
    currentStatus: {
      type: String,
      enum: [
        "DRAFT",
        "AWAITING_OWNER_AUTHORIZATION",
        "AWAITING_SOCIETY_REVIEW",
        "INFORMATION_REQUIRED",
        "UNDER_REVIEW",
        "APPROVED",
        "COMPLETED",
        "ISSUED",
        "OWNER_DECLINED",
        "REJECTED",
        "CANCELLED",
      ],
      default: "DRAFT",
      index: true,
    },
    pendingActorType: {
      type: String,
      enum: ["NONE", "APPLICANT", "OWNER", "SOCIETY_MANAGEMENT"],
      default: "NONE",
      index: true,
    },
    returnWorkflowStage: {
      type: String,
      enum: ["AWAITING_OWNER_AUTHORIZATION", "AWAITING_SOCIETY_REVIEW"],
      default: undefined,
    },
    ownerAuthorization: {
      status: {
        type: String,
        enum: ["PENDING", "AUTHORIZED", "DECLINED", "INFO_REQUESTED", "NOT_REQUIRED"],
        default: "NOT_REQUIRED",
        index: true,
      },
      ownerUserId: { type: Schema.Types.ObjectId, ref: "User", index: true },
      ownerName: { type: String },
      decidedAt: { type: Date },
      comment: { type: String },
    },
    correctionRequest: {
      requestedByRole: { type: String, enum: ["OWNER", "MANAGEMENT"] },
      requestedByUserId: { type: Schema.Types.ObjectId, ref: "User" },
      requestedByName: { type: String },
      requestedAt: { type: Date },
      note: { type: String },
      requestedFields: [{ type: String }],
      requestedDocCodes: [{ type: String }],
    },
    approvalWorkflow: {
      type: ApprovalWorkflowStateSchema,
      default: undefined,
    },
    generatedDocument: {
      type: GeneratedDocumentSubSchema,
      default: undefined,
    },
    timeline: [RequestTimelineEventSchema],
    isDraft: {
      type: Boolean,
      default: true,
      index: true,
    },
    submittedAt: {
      type: Date,
      default: undefined,
    },
  },
  {
    timestamps: true,
  }
);

// Compound queries for performant filtering and security isolation
ServiceRequestSchema.index({ societyId: 1, currentStatus: 1, createdAt: -1 });
ServiceRequestSchema.index({ applicantUserId: 1, currentStatus: 1, createdAt: -1 });
ServiceRequestSchema.index({ flatId: 1, currentStatus: 1 });
ServiceRequestSchema.index({
  "ownerAuthorization.ownerUserId": 1,
  "ownerAuthorization.status": 1,
  createdAt: -1,
});
ServiceRequestSchema.index({
  societyId: 1,
  "approvalWorkflow.stages.isOverdue": 1,
});

export const ServiceRequest: Model<IServiceRequest> =
  mongoose.models.ServiceRequest ||
  mongoose.model<IServiceRequest>("ServiceRequest", ServiceRequestSchema);

export default ServiceRequest;
