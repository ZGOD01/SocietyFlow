import { z } from "zod";

export const uploadDocumentSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(120),
  category: z.enum([
    "BYLAWS",
    "MEETING_MINUTES",
    "AUDIT_FINANCIALS",
    "AGREEMENT",
    "SHARE_CERTIFICATE",
    "NOC_CERTIFICATE",
    "IDENTITY_VERIFICATION",
    "UTILITY_SANCTION",
    "MISCELLANEOUS",
  ]),
  flatId: z.string().optional(),
  isSocietyPublic: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
});

export const requestCreationSchema = z.object({
  requestType: z.enum([
    "NOC_TRANSFER",
    "NOC_MORTGAGE",
    "TENANT_VERIFICATION",
    "RENOVATION_PERMISSION",
    "PARKING_SLOT",
    "ADDRESS_PROOF",
  ]),
  title: z.string().min(5, "Title must be descriptive").max(140),
  description: z.string().min(20, "Provide detailed explanation for your request"),
  urgency: z.enum(["LOW", "NORMAL", "HIGH"]).default("NORMAL"),
  attachedDocumentIds: z.array(z.string()).default([]),
});

export type UploadDocumentInput = z.infer<typeof uploadDocumentSchema>;
export type RequestCreationInput = z.infer<typeof requestCreationSchema>;
