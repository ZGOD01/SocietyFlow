import { z } from "zod";

export const societyConfigSchema = z.object({
  name: z.string().min(3).max(120),
  registrationNumber: z.string().min(5),
  totalWings: z.number().int().min(1).max(20),
  totalFlats: z.number().int().min(1).max(2000),
  address: z.object({
    street: z.string().min(3),
    city: z.string().min(2),
    state: z.string().min(2),
    postalCode: z.string().regex(/^[0-9]{6}$/, "Must be valid 6-digit PIN code"),
  }),
});

export const flatUnitSchema = z.object({
  societyId: z.string().min(1),
  wing: z.string().min(1).max(10),
  flatNumber: z.string().min(1).max(15),
  floor: z.number().int(),
  carpetAreaSqFt: z.number().positive(),
  ownerName: z.string().min(2),
  ownerEmail: z.string().email(),
  ownerPhone: z.string().regex(/^[0-9]{10}$/),
  occupancyStatus: z.enum(["SELF_OCCUPIED", "RENTED", "VACANT"]),
  shareCertificateNumber: z.string().optional(),
});

export const approvalActionSchema = z.object({
  requestId: z.string().min(1),
  signerRole: z.enum(["CHAIRMAN", "SECRETARY", "TREASURER"]),
  action: z.enum(["SIGN_APPROVE", "REJECT", "REQUEST_CLARIFICATION"]),
  decisionNotes: z.string().max(500).optional(),
});

export const ownershipTransferSchema = z.object({
  societyId: z.string().min(1),
  flatId: z.string().min(1),
  currentOwnerName: z.string().min(2),
  transfereeName: z.string().min(2),
  transfereeEmail: z.string().email(),
  transfereePhone: z.string().regex(/^[0-9]{10}$/),
  saleDeedRegistrationNumber: z.string().min(5),
  transferFeePaid: z.boolean(),
  shareCapitalTransferred: z.boolean(),
});

export const notificationPreferenceSchema = z.object({
  userId: z.string().min(1),
  emailAlerts: z.boolean().default(true),
  smsAlerts: z.boolean().default(false),
  whatsappAlerts: z.boolean().default(true),
  digestFrequency: z.enum(["INSTANT", "DAILY", "WEEKLY"]).default("INSTANT"),
});

export const subscriptionPlanSchema = z.object({
  societyId: z.string().min(1),
  plan: z.enum(["BASIC", "STANDARD", "ENTERPRISE"]),
  billingCycle: z.enum(["MONTHLY", "ANNUAL"]),
  maxUnits: z.number().int().positive(),
  cloudStorageGb: z.number().positive(),
});

export type SocietyConfigInput = z.infer<typeof societyConfigSchema>;
export type FlatUnitInput = z.infer<typeof flatUnitSchema>;
export type ApprovalActionInput = z.infer<typeof approvalActionSchema>;
export type OwnershipTransferInput = z.infer<typeof ownershipTransferSchema>;
export type NotificationPreferenceInput = z.infer<typeof notificationPreferenceSchema>;
export type SubscriptionPlanInput = z.infer<typeof subscriptionPlanSchema>;
