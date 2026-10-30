import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type ServiceCategory =
  | "CERTIFICATES_NOC"
  | "PROPERTY"
  | "TENANT_OCCUPANCY"
  | "PERMISSIONS"
  | "GENERAL";

export type ServiceEligibility = "OWNER" | "TENANT" | "BOTH";

export type FieldInputType =
  | "text"
  | "number"
  | "date"
  | "select"
  | "checkbox"
  | "textarea";

export interface IFormFieldDefinition {
  id: string;
  label: string;
  type: FieldInputType;
  required: boolean;
  options?: string[];
  placeholder?: string;
  helpText?: string;
  condition?: {
    fieldId: string;
    equals: string | boolean;
  };
}

export interface IRequiredDocumentDefinition {
  code: string;
  title: string;
  description: string;
  required: boolean;
  allowedMimeTypes?: string[];
}

export interface IServiceDefinition extends Document {
  code: string;
  title: string;
  description: string;
  category: ServiceCategory;
  eligibility: ServiceEligibility;
  requiresOwnerAuthorization: boolean;
  estimatedProcessingDays: number;
  isActive: boolean;
  isDownstreamAvailable: boolean;
  downstreamNote?: string;
  requiredFields: IFormFieldDefinition[];
  requiredDocuments: IRequiredDocumentDefinition[];
  version: number;
  societyId?: Types.ObjectId; // null for system defaults, populated for society customized overrides
  createdAt: Date;
  updatedAt: Date;
}

const FormFieldSchema = new Schema<IFormFieldDefinition>(
  {
    id: { type: String, required: true },
    label: { type: String, required: true },
    type: {
      type: String,
      enum: ["text", "number", "date", "select", "checkbox", "textarea"],
      default: "text",
    },
    required: { type: Boolean, default: false },
    options: [{ type: String }],
    placeholder: { type: String },
    helpText: { type: String },
    condition: {
      fieldId: { type: String },
      equals: { type: Schema.Types.Mixed },
    },
  },
  { _id: false }
);

const RequiredDocumentSchema = new Schema<IRequiredDocumentDefinition>(
  {
    code: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    required: { type: Boolean, default: true },
    allowedMimeTypes: [{ type: String }],
  },
  { _id: false }
);

const ServiceDefinitionSchema = new Schema<IServiceDefinition>(
  {
    code: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: [
        "CERTIFICATES_NOC",
        "PROPERTY",
        "TENANT_OCCUPANCY",
        "PERMISSIONS",
        "GENERAL",
      ],
      required: true,
      index: true,
    },
    eligibility: {
      type: String,
      enum: ["OWNER", "TENANT", "BOTH"],
      default: "BOTH",
      index: true,
    },
    requiresOwnerAuthorization: {
      type: Boolean,
      default: false,
      index: true,
    },
    estimatedProcessingDays: {
      type: Number,
      default: 7,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isDownstreamAvailable: {
      type: Boolean,
      default: true,
    },
    downstreamNote: {
      type: String,
    },
    requiredFields: [FormFieldSchema],
    requiredDocuments: [RequiredDocumentSchema],
    version: {
      type: Number,
      default: 1,
    },
    societyId: {
      type: Schema.Types.ObjectId,
      ref: "Society",
      default: undefined,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

ServiceDefinitionSchema.index({ societyId: 1, code: 1 }, { unique: true });

export const ServiceDefinition: Model<IServiceDefinition> =
  mongoose.models.ServiceDefinition ||
  mongoose.model<IServiceDefinition>("ServiceDefinition", ServiceDefinitionSchema);

export default ServiceDefinition;
