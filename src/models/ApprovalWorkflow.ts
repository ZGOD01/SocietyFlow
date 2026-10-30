import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type ApprovalStageType = "VERIFICATION" | "APPROVAL" | "ISSUANCE";
export type ApproverLogic = "ANY_ONE" | "ALL_REQUIRED";

export interface IApprovalWorkflowStage {
  stageIndex: number;
  stageKey: string;
  stageName: string;
  stageType: ApprovalStageType;
  allowedRoles: string[]; // e.g., ["SOCIETY_MANAGER", "SECRETARY", "CHAIRMAN", "TREASURER"]
  approverLogic: ApproverLogic;
  expectedDays: number;
  description?: string;
  requiredSignersCount?: number;
}

export interface IApprovalWorkflow extends Document {
  societyId: Types.ObjectId;
  serviceCode: string;
  serviceTitle: string;
  version: number;
  isActive: boolean;
  stages: IApprovalWorkflowStage[];
  requiresDocumentIssuance: boolean;
  documentTemplateCode?: "HOME_LOAN_NOC" | "NO_DUES_CERT" | "ADDRESS_CONFIRMATION" | "GENERAL_SOCIETY_LETTER";
  publishedByUserId?: Types.ObjectId;
  publishedByName?: string;
  publishedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ApprovalWorkflowStageSchema = new Schema<IApprovalWorkflowStage>(
  {
    stageIndex: { type: Number, required: true },
    stageKey: { type: String, required: true, trim: true },
    stageName: { type: String, required: true, trim: true },
    stageType: {
      type: String,
      enum: ["VERIFICATION", "APPROVAL", "ISSUANCE"],
      required: true,
      default: "APPROVAL",
    },
    allowedRoles: [{ type: String, required: true }],
    approverLogic: {
      type: String,
      enum: ["ANY_ONE", "ALL_REQUIRED"],
      default: "ANY_ONE",
    },
    expectedDays: { type: Number, default: 3, min: 1 },
    description: { type: String, trim: true },
    requiredSignersCount: { type: Number, default: 1 },
  },
  { _id: false }
);

const ApprovalWorkflowSchema = new Schema<IApprovalWorkflow>(
  {
    societyId: {
      type: Schema.Types.ObjectId,
      ref: "Society",
      required: true,
      index: true,
    },
    serviceCode: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    serviceTitle: {
      type: String,
      required: true,
      trim: true,
    },
    version: {
      type: Number,
      required: true,
      default: 1,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    stages: [ApprovalWorkflowStageSchema],
    requiresDocumentIssuance: {
      type: Boolean,
      default: false,
    },
    documentTemplateCode: {
      type: String,
      enum: ["HOME_LOAN_NOC", "NO_DUES_CERT", "ADDRESS_CONFIRMATION", "GENERAL_SOCIETY_LETTER"],
    },
    publishedByUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    publishedByName: {
      type: String,
    },
    publishedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

ApprovalWorkflowSchema.index({ societyId: 1, serviceCode: 1, version: -1 });
ApprovalWorkflowSchema.index({ societyId: 1, serviceCode: 1, isActive: 1 });

export const ApprovalWorkflow: Model<IApprovalWorkflow> =
  mongoose.models.ApprovalWorkflow ||
  mongoose.model<IApprovalWorkflow>("ApprovalWorkflow", ApprovalWorkflowSchema);

export default ApprovalWorkflow;
