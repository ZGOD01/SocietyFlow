import { describe, it, expect } from "vitest";
import { formatFileSize, formatDate, cn } from "@/lib/utils";
import { APP_NAV_ITEMS } from "@/config/navigation";
import { loginSchema, registerSchema } from "@/modules/auth/schema";
import { uploadDocumentSchema } from "@/modules/documents/schema";
import { societyConfigSchema } from "@/modules/domain-schemas";

describe("Utility Functions", () => {
  it("formats file sizes accurately", () => {
    expect(formatFileSize(0)).toBe("0 Bytes");
    expect(formatFileSize(1024)).toBe("1 KB");
    expect(formatFileSize(1024 * 1024 * 4.5)).toBe("4.5 MB");
  });

  it("formats dates in Indian localized style", () => {
    const formatted = formatDate("2024-01-15T00:00:00Z");
    expect(formatted).toContain("2024");
    expect(formatted).toContain("Jan");
  });

  it("merges class names correctly with twMerge", () => {
    expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
  });
});

describe("Role-Aware Navigation", () => {
  it("restricts admin console to authorized roles", () => {
    const adminItem = APP_NAV_ITEMS.find((item) => item.href === "/admin");
    expect(adminItem).toBeDefined();
    expect(adminItem?.allowedRoles).toContain("SUPER_ADMIN");
    expect(adminItem?.allowedRoles).not.toContain("TENANT");
  });

  it("permits all roles to view overview dashboard", () => {
    const dashboardItem = APP_NAV_ITEMS.find((item) => item.href === "/dashboard");
    expect(dashboardItem?.allowedRoles).toContain("RESIDENT_OWNER");
    expect(dashboardItem?.allowedRoles).toContain("SOCIETY_ADMIN");
    expect(dashboardItem?.allowedRoles).toContain("AUDITOR_PARTNER");
  });
});

describe("Domain Validation Schemas", () => {
  it("validates login inputs with strict emails and passwords", () => {
    const invalid = loginSchema.safeParse({ email: "invalid", password: "123" });
    expect(invalid.success).toBe(false);

    const valid = loginSchema.safeParse({
      email: "resident@greenwood.com",
      password: "StrongPassword123!",
    });
    expect(valid.success).toBe(true);
  });

  it("validates resident registration inputs", () => {
    const valid = registerSchema.safeParse({
      fullName: "Priya Mehta",
      email: "priya.mehta@example.com",
      password: "SecurePassword123!",
      phone: "9822012345",
      societyCode: "GREENWOOD-PUNE",
      flatNumber: "C-402",
      termsAccepted: true,
    });
    expect(valid.success).toBe(true);

    const invalid = registerSchema.safeParse({
      fullName: "P",
      email: "invalid",
      termsAccepted: false,
    });
    expect(invalid.success).toBe(false);
  });

  it("validates document upload schemas", () => {
    const valid = uploadDocumentSchema.safeParse({
      title: "Registered_Deed.pdf",
      category: "AGREEMENT",
      isSocietyPublic: false,
      tags: ["Registration", "Title"],
    });
    expect(valid.success).toBe(true);

    const invalid = uploadDocumentSchema.safeParse({
      title: "No",
      category: "INVALID_CAT",
    });
    expect(invalid.success).toBe(false);
  });

  it("validates society registration configuration", () => {
    const valid = societyConfigSchema.safeParse({
      name: "Greenwood Heights CHS Ltd.",
      registrationNumber: "PNA/HSG/12345/2020",
      totalWings: 5,
      totalFlats: 216,
      address: {
        street: "Baner Road",
        city: "Pune",
        state: "Maharashtra",
        postalCode: "411045",
      },
    });
    expect(valid.success).toBe(true);
  });
});
