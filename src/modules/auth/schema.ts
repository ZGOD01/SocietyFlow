import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  rememberMe: z.boolean().default(false),
});

// Base registration schema preserving existing interface for test compatibility
export const registerSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone: z.string().regex(/^[0-9]{10}$/, "Enter a valid 10-digit mobile number").optional(),
  societyCode: z.string().min(3, "Society registration code is required"),
  flatNumber: z.string().min(1, "Flat or unit number is required").optional(),
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms of governance",
  }),
});

// Role-specific registration schemas
export const ownerRegistrationSchema = z.object({
  accountType: z.literal("OWNER"),
  fullName: z.string().min(2, "Full legal name must be at least 2 characters"),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  phone: z.preprocess(
    (val) => (val === "" || val === null ? undefined : val),
    z.string().min(10, "Enter a valid phone number").optional()
  ),
  societyJoiningMethod: z.enum(["CODE", "SEARCH", "INVITE"]).default("CODE"),
  societyCode: z.string().min(3, "Society registration code or name is required"),
  wing: z.string().min(1, "Wing is required"),
  flatNumber: z.string().min(1, "Flat / Unit number is required"),
  ownershipType: z.enum(["SOLE_OWNER", "JOINT_OWNER"]).default("SOLE_OWNER"),
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms of governance",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const tenantRegistrationSchema = z.object({
  accountType: z.literal("TENANT"),
  fullName: z.string().min(2, "Full legal name must be at least 2 characters"),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  phone: z.preprocess(
    (val) => (val === "" || val === null ? undefined : val),
    z.string().min(10, "Enter a valid phone number").optional()
  ),
  societyJoiningMethod: z.enum(["CODE", "INVITE"]).default("CODE"),
  societyCode: z.string().min(3, "Society registration code is required"),
  wing: z.string().min(1, "Wing is required"),
  flatNumber: z.string().min(1, "Flat / Unit number is required"),
  ownerName: z.string().min(2, "Registered owner full name is required"),
  ownerContact: z.string().min(5, "Owner contact email or phone is required"),
  leaseCommencement: z.string().optional(),
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms of governance",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const managementRegistrationSchema = z.object({
  accountType: z.literal("MANAGEMENT"),
  fullName: z.string().min(2, "Full legal name must be at least 2 characters"),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  phone: z.preprocess(
    (val) => (val === "" || val === null ? undefined : val),
    z.string().min(10, "Enter a valid phone number").optional()
  ),
  position: z.enum(["SECRETARY", "CHAIRMAN", "TREASURER", "SOCIETY_MANAGER"], {
    error: "Select your intended managing committee position",
  }),
  societyName: z.string().min(2, "Society name must be at least 2 characters").optional(),
  societyCode: z.string().min(3, "Society registration code / number is required"),
  city: z.string().optional(),
  state: z.string().optional(),
  pinCode: z.string().optional(),
  address: z.string().optional(),
  wings: z.string().optional(),
  floorsPerWing: z.coerce.number().min(1).max(100).optional(),
  flatsPerFloor: z.coerce.number().min(1).max(30).optional(),
  bhkType: z.string().optional(),
  resolutionNumber: z.string().min(2, "Committee resolution or invite token is required"),
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms of governance",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type OwnerRegistrationInput = z.infer<typeof ownerRegistrationSchema>;
export type TenantRegistrationInput = z.infer<typeof tenantRegistrationSchema>;
export type ManagementRegistrationInput = z.infer<typeof managementRegistrationSchema>;
