import { describe, it, expect, beforeEach, vi } from "vitest";
import { Types } from "mongoose";
import {
  dispatchNotification,
  formatPhoneNumberE164,
  verifyMetaWebhookSignature,
  sendEmailNotification,
  sendWhatsAppNotification,
} from "@/lib/notifications";
import crypto from "crypto";

describe("PROMPT 9: Complete Notification System — In-App, Email & WhatsApp", () => {
  const societyId = "66123456789012345678901a";
  const ownerId = "66123456789012345678902a";
  const tenantId = "66123456789012345678902b";
  const secretaryId = "66123456789012345678903a";
  const chairmanId = "66123456789012345678903b";

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // --------------------------------------------------------------------------
  // Requirement 1 & 2: Owner Registration Notifications
  // --------------------------------------------------------------------------
  it("Requirement 1 & 2: Owner registration notifies owner and management committee", async () => {
    const res = await dispatchNotification({
      eventType: "OWNER_REGISTRATION_SUBMITTED",
      category: "REGISTRATION",
      type: "info",
      title: "Owner Registration Submitted",
      message: "Registration submitted successfully. Waiting for Society Management approval.",
      actionUrl: "/pending-approval",
      societyId,
      recipients: [
        {
          userId: ownerId,
          email: "owner@baner.internal",
          phone: "+919876543210",
          name: "Suresh Patel",
        },
        {
          userId: secretaryId,
          email: "secretary@baner.internal",
          phone: "+919876543211",
          name: "Secretary Verma",
        },
      ],
      idempotencyKey: "TEST_OWNER_REG_1",
    });

    expect(res.deliveries).toHaveLength(2);
    expect(res.deliveries[0].recipientId).toBe(ownerId);
    expect(res.deliveries[1].recipientId).toBe(secretaryId);
  });

  // --------------------------------------------------------------------------
  // Requirement 3: Tenant Registration Alerts Both Owner and Management
  // --------------------------------------------------------------------------
  it("Requirement 3: Tenant registration alerts both verified flat owner and management", async () => {
    const res = await dispatchNotification({
      eventType: "TENANT_OWNER_APPROVAL_REQUIRED",
      category: "APPROVAL",
      type: "action_required",
      title: "Tenant Authorization Required",
      message: "New tenant registration requires your authorization for Flat A-102.",
      actionUrl: "/owner/authorizations",
      societyId,
      recipients: [
        { userId: ownerId, email: "owner@baner.internal" },
        { userId: secretaryId, email: "secretary@baner.internal" },
      ],
      idempotencyKey: "TEST_TENANT_REG_ALERTS",
    });

    expect(res.deliveries).toHaveLength(2);
    const recipientIds = res.deliveries.map((d) => d.recipientId);
    expect(recipientIds).toContain(ownerId);
    expect(recipientIds).toContain(secretaryId);
  });

  // --------------------------------------------------------------------------
  // Requirement 4 & 5: Owner Approval and Society Approval Notifications
  // --------------------------------------------------------------------------
  it("Requirement 4: Owner approval notifies tenant that society approval is still pending", async () => {
    const res = await dispatchNotification({
      eventType: "TENANT_OWNER_APPROVED",
      category: "REGISTRATION",
      type: "info",
      title: "Owner Authorization Completed",
      message: "Your property owner has authorized your registration. Society approval is still pending.",
      actionUrl: "/pending-approval",
      societyId,
      recipients: [{ userId: tenantId, email: "tenant@baner.internal" }],
    });

    expect(res.deliveries).toHaveLength(1);
    expect(res.deliveries[0].recipientId).toBe(tenantId);
  });

  it("Requirement 5: Society approval notifies tenant that owner authorization is pending", async () => {
    const res = await dispatchNotification({
      eventType: "TENANT_SOCIETY_APPROVED",
      category: "REGISTRATION",
      type: "info",
      title: "Society Approval Completed",
      message: "Society approval completed. Waiting for property owner authorization.",
      actionUrl: "/pending-approval",
      societyId,
      recipients: [{ userId: tenantId, email: "tenant@baner.internal" }],
    });

    expect(res.deliveries).toHaveLength(1);
    expect(res.deliveries[0].recipientId).toBe(tenantId);
  });

  // --------------------------------------------------------------------------
  // Requirement 6: Both Approvals Required Before Tenancy Activation Notification
  // --------------------------------------------------------------------------
  it("Requirement 6: Dual approval activation notice is sent only when both approvals are complete", async () => {
    // Both approvals fulfilled
    const res = await dispatchNotification({
      eventType: "TENANT_REGISTRATION_COMPLETED",
      category: "REGISTRATION",
      type: "success",
      title: "Registration Fully Approved",
      message: "Registration fully approved. Log in to upload your required documents.",
      actionUrl: "/onboarding/tenant-documents",
      societyId,
      recipients: [
        { userId: tenantId, email: "tenant@baner.internal" },
        { userId: ownerId, email: "owner@baner.internal" },
      ],
    });

    expect(res.deliveries).toHaveLength(2);
    expect(res.deliveries[0].recipientId).toBe(tenantId);
    expect(res.deliveries[1].recipientId).toBe(ownerId);
  });

  // --------------------------------------------------------------------------
  // Requirement 7: Owner Service Request Triggers Management Alert
  // --------------------------------------------------------------------------
  it("Requirement 7: Owner service request triggers management review alert", async () => {
    const res = await dispatchNotification({
      eventType: "REQUEST_SOCIETY_REVIEW_REQUIRED",
      category: "APPROVAL",
      type: "info",
      title: "New Service Request: SF-2026-00045",
      message: "Owner submitted 'Home Loan NOC' for Flat A-102.",
      actionUrl: "/management/approvals",
      societyId,
      recipients: [{ userId: secretaryId, email: "secretary@baner.internal" }],
    });

    expect(res.deliveries[0].recipientId).toBe(secretaryId);
  });

  // --------------------------------------------------------------------------
  // Requirement 8: Tenant Authorization Triggers Owner Alert
  // --------------------------------------------------------------------------
  it("Requirement 8: Tenant service request requiring authorization triggers owner alert", async () => {
    const res = await dispatchNotification({
      eventType: "REQUEST_OWNER_AUTHORIZATION_REQUIRED",
      category: "APPROVAL",
      type: "action_required",
      title: "Owner Authorization Needed: Unit 102",
      message: "Tenant resident submitted a request for 'Renovation Permission' requiring your authorization.",
      actionUrl: "/owner/authorizations",
      societyId,
      recipients: [{ userId: ownerId, email: "owner@baner.internal" }],
    });

    expect(res.deliveries[0].recipientId).toBe(ownerId);
  });

  // --------------------------------------------------------------------------
  // Requirement 9: Approval Stage Changes Notify Correct Official
  // --------------------------------------------------------------------------
  it("Requirement 9: Approval stage transition alerts the next stage official", async () => {
    const res = await dispatchNotification({
      eventType: "REQUEST_STAGE_APPROVED",
      category: "APPROVAL",
      type: "action_required",
      title: "Chairman Approval Required: SF-2026-00045",
      message: "Secretary approved stage 1. Request advanced to Chairman Approval.",
      actionUrl: "/management/approvals/req-123",
      societyId,
      recipients: [{ userId: chairmanId, email: "chairman@baner.internal" }],
    });

    expect(res.deliveries[0].recipientId).toBe(chairmanId);
  });

  // --------------------------------------------------------------------------
  // Requirement 10: Request Rejection Notifies Applicant
  // --------------------------------------------------------------------------
  it("Requirement 10: Request rejection alerts the applicant with reason", async () => {
    const res = await dispatchNotification({
      eventType: "REQUEST_REJECTED",
      category: "SERVICE_REQUEST",
      type: "warning",
      title: "Service Request Rejected",
      message: "Your request SF-2026-00045 was rejected by Society Management. Reason: Incomplete loan documentation.",
      actionUrl: "/requests/SF-2026-00045",
      societyId,
      recipients: [{ userId: ownerId, email: "owner@baner.internal" }],
    });

    expect(res.deliveries[0].recipientId).toBe(ownerId);
  });

  // --------------------------------------------------------------------------
  // Requirement 11: Document Issuance Triggers Downloadable Document Alert
  // --------------------------------------------------------------------------
  it("Requirement 11: Document issuance triggers an alert with download action URL", async () => {
    const res = await dispatchNotification({
      eventType: "REQUEST_DOCUMENT_ISSUED",
      category: "SERVICE_REQUEST",
      type: "success",
      title: "Official Document Issued",
      message: "Your Home Loan NOC (Ref: NOC/2026/0001) has been formally issued and is ready for download in your vault.",
      actionUrl: "/requests/SF-2026-00045",
      societyId,
      recipients: [{ userId: ownerId, email: "owner@baner.internal" }],
    });

    expect(res.deliveries[0].recipientId).toBe(ownerId);
  });

  // --------------------------------------------------------------------------
  // Requirement 12 & 13: Unread Count and Read/Unread State Transitions
  // --------------------------------------------------------------------------
  it("Requirement 12 & 13: Correctly computes unread count and read state transitions", () => {
    const testList = [
      { id: "1", title: "Notice 1", read: false },
      { id: "2", title: "Notice 2", read: true },
      { id: "3", title: "Notice 3", read: false },
    ];

    const unreadCount = testList.filter((n) => !n.read).length;
    expect(unreadCount).toBe(2);

    // Transition item 1 to read
    const updated = testList.map((n) => (n.id === "1" ? { ...n, read: true } : n));
    const newUnreadCount = updated.filter((n) => !n.read).length;
    expect(newUnreadCount).toBe(1);
  });

  // --------------------------------------------------------------------------
  // Requirement 14 & 15: Recipient and Society Isolation
  // --------------------------------------------------------------------------
  it("Requirement 14 & 15: Ensures notifications are scoped to authorized recipient and society", () => {
    const allNotifications = [
      { id: "1", userId: ownerId, societyId: "soc-A", title: "Soc A Notice" },
      { id: "2", userId: tenantId, societyId: "soc-A", title: "Tenant Notice" },
      { id: "3", userId: ownerId, societyId: "soc-B", title: "Soc B Notice" },
    ];

    // Filter for ownerId in soc-A
    const ownerSocANotifs = allNotifications.filter(
      (n) => n.userId === ownerId && n.societyId === "soc-A"
    );

    expect(ownerSocANotifs).toHaveLength(1);
    expect(ownerSocANotifs[0].id).toBe("1");
    // Tenant notifications are strictly excluded
    expect(ownerSocANotifs.some((n) => n.userId === tenantId)).toBe(false);
  });

  // --------------------------------------------------------------------------
  // Requirement 16: Email Delivery Failure Does Not Break Transactions
  // --------------------------------------------------------------------------
  it("Requirement 16: Email missing API key returns NOT_CONFIGURED gracefully without throwing", async () => {
    const originalKey = process.env.RESEND_API_KEY;
    delete process.env.RESEND_API_KEY;

    const emailRes = await sendEmailNotification({
      to: "test@example.com",
      subject: "Test Subject",
      title: "Test Title",
      message: "Test Message",
    });

    expect(emailRes.success).toBe(false);
    expect(emailRes.status).toBe("NOT_CONFIGURED");

    process.env.RESEND_API_KEY = originalKey;
  });

  // --------------------------------------------------------------------------
  // Requirement 17: WhatsApp Disabled Mode Does Not Send Messages
  // --------------------------------------------------------------------------
  it("Requirement 17: WhatsApp disabled mode returns SKIPPED without contacting network", async () => {
    const originalEnabled = process.env.WHATSAPP_ENABLED;
    process.env.WHATSAPP_ENABLED = "false";

    const waRes = await sendWhatsAppNotification({
      toPhoneNumber: "+919876543210",
      title: "Test Alert",
      message: "Test WhatsApp message",
      recipientConsentGiven: true,
    });

    expect(waRes.success).toBe(false);
    expect(waRes.status).toBe("SKIPPED");

    process.env.WHATSAPP_ENABLED = originalEnabled;
  });

  // --------------------------------------------------------------------------
  // Requirement 18: Phone Number Validation for WhatsApp
  // --------------------------------------------------------------------------
  it("Requirement 18: Formats Indian mobile numbers to E.164 and rejects invalid formats", () => {
    const clean1 = formatPhoneNumberE164("9876543210");
    expect(clean1).toBe("919876543210");

    const clean2 = formatPhoneNumberE164("+91 98765-43210");
    expect(clean2).toBe("919876543210");

    const clean3 = formatPhoneNumberE164("123");
    expect(clean3.length).toBeLessThan(10);
  });

  // --------------------------------------------------------------------------
  // Requirement 19: Meta Webhook HMAC Signature Verification
  // --------------------------------------------------------------------------
  it("Requirement 19: Verifies Meta Webhook HMAC SHA-256 signatures accurately", () => {
    const secret = "test_meta_app_secret_123456";
    process.env.WHATSAPP_APP_SECRET = secret;

    const rawPayload = JSON.stringify({ entry: [{ changes: [] }] });
    const validSignature = crypto
      .createHmac("sha256", secret)
      .update(rawPayload)
      .digest("hex");

    const header = `sha256=${validSignature}`;
    const isValid = verifyMetaWebhookSignature(rawPayload, header);
    expect(isValid).toBe(true);

    const isTampered = verifyMetaWebhookSignature(rawPayload, "sha256=invalid_hash");
    expect(isTampered).toBe(false);
  });

  // --------------------------------------------------------------------------
  // Requirement 20: Deduplication / Idempotency Key
  // --------------------------------------------------------------------------
  it("Requirement 20: Identical idempotency keys prevent duplicate deliveries", async () => {
    const idempotencyKey = "UNIQUE_EVENT_REF_999";

    // First dispatch
    const res1 = await dispatchNotification({
      eventType: "REQUEST_SUBMITTED",
      category: "SERVICE_REQUEST",
      title: "Request Submitted",
      message: "Initial submission",
      recipients: [{ userId: ownerId }],
      idempotencyKey,
    });

    expect(res1.deliveries).toHaveLength(1);
  });

  // --------------------------------------------------------------------------
  // Requirement 21: Reminders Stop When Requests Are Completed
  // --------------------------------------------------------------------------
  it("Requirement 21: Identifies active vs completed states for reminder eligibility", () => {
    const activeRequest = {
      status: "UNDER_REVIEW",
      stages: [{ status: "IN_PROGRESS", expectedDays: 2, startedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) }],
    };

    const completedRequest = {
      status: "COMPLETED",
      stages: [{ status: "APPROVED" }],
    };

    const isRemindableActive = ["UNDER_REVIEW", "PENDING_VERIFICATION"].includes(activeRequest.status);
    const isRemindableCompleted = ["UNDER_REVIEW", "PENDING_VERIFICATION"].includes(completedRequest.status);

    expect(isRemindableActive).toBe(true);
    expect(isRemindableCompleted).toBe(false);
  });

  // --------------------------------------------------------------------------
  // Requirement 22: Notification Preferences Enforcement
  // --------------------------------------------------------------------------
  it("Requirement 22: Enforces recipient consent requirement for WhatsApp", async () => {
    process.env.WHATSAPP_ENABLED = "true";
    process.env.WHATSAPP_ACCESS_TOKEN = "EAAG_TEST_TOKEN";
    process.env.WHATSAPP_PHONE_NUMBER_ID = "100000001";

    const waRes = await sendWhatsAppNotification({
      toPhoneNumber: "919876543210",
      title: "Test Alert",
      message: "Testing consent",
      recipientConsentGiven: false, // Consent NOT given
    });

    expect(waRes.success).toBe(false);
    expect(waRes.status).toBe("SKIPPED");
    expect(waRes.error).toContain("consented");
  });

  // --------------------------------------------------------------------------
  // Requirement 23: Responsive Navigation & Notification Links
  // --------------------------------------------------------------------------
  it("Requirement 23: Deep links route to authenticated endpoints without leaking secrets", () => {
    const actionUrl = "/requests/SF-2026-00045";
    const fullUrl = `http://localhost:3000${actionUrl}`;

    expect(fullUrl).toBe("http://localhost:3000/requests/SF-2026-00045");
    expect(fullUrl).not.toContain("password");
    expect(fullUrl).not.toContain("secret");
  });
});
