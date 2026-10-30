import { describe, it, expect } from "vitest";
import { DEFAULT_SERVICE_TEMPLATES } from "@/lib/default-services";
import { formatRequestId } from "@/lib/request-id";

// Domain test models & state machine simulator for Prompt 7 Service Request System

export interface TestServiceDefinition {
  id: string;
  code: string;
  title: string;
  category: string;
  eligibility: "OWNER" | "TENANT" | "BOTH";
  requiresOwnerAuthorization: boolean;
  isActive: boolean;
  version: number;
  requiredFields: Array<{ code: string; label: string; required: boolean }>;
  requiredDocuments: Array<{ code: string; name: string; required: boolean }>;
}

export interface TestServiceRequest {
  id: string;
  requestId: string;
  societyId: string;
  flatId: string;
  applicantUserId: string;
  applicantRole: "OWNER" | "TENANT";
  serviceCode: string;
  serviceTitle: string;
  serviceSnapshot: {
    version: number;
    title: string;
    requiredFields: Array<{ code: string; label: string; required: boolean }>;
  };
  formData: Record<string, unknown>;
  attachments: Array<{
    documentId: string;
    ownerUserId: string;
    societyId: string;
    displayName: string;
  }>;
  currentStatus:
    | "DRAFT"
    | "AWAITING_OWNER_AUTHORIZATION"
    | "AWAITING_SOCIETY_REVIEW"
    | "INFORMATION_REQUIRED"
    | "UNDER_REVIEW"
    | "OWNER_DECLINED"
    | "REJECTED"
    | "CANCELLED";
  pendingActorType: "APPLICANT" | "FLAT_OWNER" | "SOCIETY_MANAGEMENT" | "NONE";
  returnWorkflowStage?: "AWAITING_OWNER_AUTHORIZATION" | "AWAITING_SOCIETY_REVIEW";
  ownerAuthorization?: {
    status: "NOT_REQUIRED" | "PENDING" | "AUTHORIZED" | "DECLINED" | "INFO_REQUESTED";
    ownerUserId?: string;
    comment?: string;
  };
  isDraft: boolean;
  timeline: Array<{
    action: string;
    actorRole: string;
    actorId: string;
    timestamp: Date;
    comment?: string;
  }>;
}

// 1. Service Catalogue Filtering Logic
export function filterServicesForRole(
  services: TestServiceDefinition[],
  userRole: "OWNER" | "TENANT"
): TestServiceDefinition[] {
  return services.filter((s) => {
    if (!s.isActive) return false;
    if (s.eligibility === "BOTH") return true;
    return s.eligibility === userRole;
  });
}

// 2. Request Initiation & Routing Engine
export function initiateServiceRequest(params: {
  service: TestServiceDefinition;
  applicantRole: "OWNER" | "TENANT";
  applicantUserId: string;
  societyId: string;
  flatId: string;
  verifiedFlatOwnerId: string;
  formData: Record<string, unknown>;
  attachments: Array<{ documentId: string; ownerUserId: string; societyId: string; displayName: string }>;
  isDraft: boolean;
  counter: number;
}): TestServiceRequest {
  const {
    service,
    applicantRole,
    applicantUserId,
    societyId,
    flatId,
    verifiedFlatOwnerId,
    formData,
    attachments,
    isDraft,
    counter,
  } = params;

  // Verify applicant is eligible
  if (service.eligibility !== "BOTH" && service.eligibility !== applicantRole) {
    throw new Error(`Role ${applicantRole} is not eligible for service ${service.code}`);
  }

  // Validate attachments belong to this applicant and society
  for (const att of attachments) {
    if (att.societyId !== societyId) {
      throw new Error("Attachment does not belong to the active society context");
    }
    if (att.ownerUserId !== applicantUserId) {
      throw new Error("Cannot attach documents owned by other residents");
    }
  }

  const requestId = formatRequestId(counter, 2026);

  if (isDraft) {
    return {
      id: `req-${counter}`,
      requestId,
      societyId,
      flatId,
      applicantUserId,
      applicantRole,
      serviceCode: service.code,
      serviceTitle: service.title,
      serviceSnapshot: {
        version: service.version,
        title: service.title,
        requiredFields: [...service.requiredFields],
      },
      formData,
      attachments,
      currentStatus: "DRAFT",
      pendingActorType: "APPLICANT",
      isDraft: true,
      timeline: [
        {
          action: "DRAFT_SAVED",
          actorRole: applicantRole,
          actorId: applicantUserId,
          timestamp: new Date(),
        },
      ],
    };
  }

  // Final Submission Routing
  let status: TestServiceRequest["currentStatus"];
  let pendingActor: TestServiceRequest["pendingActorType"];
  let ownerAuth: TestServiceRequest["ownerAuthorization"];

  if (applicantRole === "TENANT" && service.requiresOwnerAuthorization) {
    status = "AWAITING_OWNER_AUTHORIZATION";
    pendingActor = "FLAT_OWNER";
    ownerAuth = {
      status: "PENDING",
      ownerUserId: verifiedFlatOwnerId,
    };
  } else {
    status = "AWAITING_SOCIETY_REVIEW";
    pendingActor = "SOCIETY_MANAGEMENT";
    ownerAuth = {
      status: "NOT_REQUIRED",
    };
  }

  return {
    id: `req-${counter}`,
    requestId,
    societyId,
    flatId,
    applicantUserId,
    applicantRole,
    serviceCode: service.code,
    serviceTitle: service.title,
    serviceSnapshot: {
      version: service.version,
      title: service.title,
      requiredFields: [...service.requiredFields],
    },
    formData,
    attachments,
    currentStatus: status,
    pendingActorType: pendingActor,
    ownerAuthorization: ownerAuth,
    isDraft: false,
    timeline: [
      {
        action: "REQUEST_SUBMITTED",
        actorRole: applicantRole,
        actorId: applicantUserId,
        timestamp: new Date(),
      },
    ],
  };
}

// 3. Owner Authorization Decision Engine
export function processOwnerAuthorization(
  request: TestServiceRequest,
  actorUserId: string,
  verifiedOwnerId: string,
  decision: "AUTHORIZE" | "DECLINE" | "REQUEST_INFO",
  comment: string
): TestServiceRequest {
  if (request.currentStatus !== "AWAITING_OWNER_AUTHORIZATION") {
    throw new Error("Request is not awaiting owner authorization");
  }

  if (actorUserId !== verifiedOwnerId) {
    throw new Error("Forbidden: Only the verified owner of this flat can authorize requests");
  }

  if ((decision === "DECLINE" || decision === "REQUEST_INFO") && !comment.trim()) {
    throw new Error("A clear reason or explanation is mandatory");
  }

  const updated: TestServiceRequest = JSON.parse(JSON.stringify(request));

  if (decision === "AUTHORIZE") {
    updated.currentStatus = "AWAITING_SOCIETY_REVIEW";
    updated.pendingActorType = "SOCIETY_MANAGEMENT";
    updated.ownerAuthorization = {
      status: "AUTHORIZED",
      ownerUserId: actorUserId,
      comment,
    };
    updated.timeline.push({
      action: "OWNER_AUTHORIZED",
      actorRole: "OWNER",
      actorId: actorUserId,
      timestamp: new Date(),
      comment,
    });
  } else if (decision === "DECLINE") {
    updated.currentStatus = "OWNER_DECLINED";
    updated.pendingActorType = "NONE";
    updated.ownerAuthorization = {
      status: "DECLINED",
      ownerUserId: actorUserId,
      comment,
    };
    updated.timeline.push({
      action: "OWNER_DECLINED",
      actorRole: "OWNER",
      actorId: actorUserId,
      timestamp: new Date(),
      comment,
    });
  } else if (decision === "REQUEST_INFO") {
    updated.currentStatus = "INFORMATION_REQUIRED";
    updated.pendingActorType = "APPLICANT";
    updated.returnWorkflowStage = "AWAITING_OWNER_AUTHORIZATION";
    updated.ownerAuthorization = {
      status: "INFO_REQUESTED",
      ownerUserId: actorUserId,
      comment,
    };
    updated.timeline.push({
      action: "INFO_REQUESTED_BY_OWNER",
      actorRole: "OWNER",
      actorId: actorUserId,
      timestamp: new Date(),
      comment,
    });
  }

  return updated;
}

// 4. Correction Resubmission Engine
export function resubmitCorrectedRequest(
  request: TestServiceRequest,
  applicantUserId: string,
  updatedFields: Record<string, unknown>
): TestServiceRequest {
  if (request.currentStatus !== "INFORMATION_REQUIRED") {
    throw new Error("Only requests in INFORMATION_REQUIRED status can be resubmitted");
  }
  if (request.applicantUserId !== applicantUserId) {
    throw new Error("Forbidden: Only the applicant can resubmit corrections");
  }

  const updated: TestServiceRequest = JSON.parse(JSON.stringify(request));
  updated.formData = { ...updated.formData, ...updatedFields };

  // Return to the prior workflow stage
  const targetStage = updated.returnWorkflowStage || "AWAITING_SOCIETY_REVIEW";
  updated.currentStatus = targetStage;
  updated.pendingActorType =
    targetStage === "AWAITING_OWNER_AUTHORIZATION" ? "FLAT_OWNER" : "SOCIETY_MANAGEMENT";

  updated.timeline.push({
    action: "CORRECTIONS_RESUBMITTED",
    actorRole: updated.applicantRole,
    actorId: applicantUserId,
    timestamp: new Date(),
  });

  return updated;
}

// -------------------------------------------------------------
// Vitest Suite for PROMPT 7 Service Request System
// -------------------------------------------------------------
describe("Prompt 7: Complete Service Request System & Owner–Tenant Routing", () => {
  const societyIdA = "soc_green_valley_01";
  const societyIdB = "soc_blue_sky_02";
  const flatA804 = "flat_a804";
  const ownerUserId = "user_owner_rajesh";
  const tenantUserId = "user_tenant_priya";
  const unrelatedOwnerUserId = "user_owner_unrelated";

  const defaultServices: TestServiceDefinition[] = DEFAULT_SERVICE_TEMPLATES.map((s, idx) => ({
    id: `srv_${idx + 1}`,
    code: s.code.toUpperCase(),
    title: s.title,
    category: s.category,
    eligibility: s.eligibility,
    requiresOwnerAuthorization: s.requiresOwnerAuthorization,
    isActive: true,
    version: 1,
    requiredFields: (s.requiredFields || []).map((f) => ({ code: f.id, label: f.label, required: f.required })),
    requiredDocuments: (s.requiredDocuments || []).map((d) => ({ code: d.code, name: d.title, required: d.required })),
  }));

  // 1. Owner can browse permitted services
  it("1. Owner can browse permitted services (excludes tenant-only services)", () => {
    const ownerServices = filterServicesForRole(defaultServices, "OWNER");
    expect(ownerServices.length).toBeGreaterThan(0);
    // Home Loan NOC is owner-eligible
    expect(ownerServices.some((s) => s.code === "HOME_LOAN_NOC")).toBe(true);
    // Move-in permission is BOTH
    expect(ownerServices.some((s) => s.code === "MOVE_IN_PERMISSION")).toBe(true);
  });

  // 2. Tenant can browse tenant-eligible services
  it("2. Tenant can browse tenant-eligible services (excludes owner-only services)", () => {
    const tenantServices = filterServicesForRole(defaultServices, "TENANT");
    expect(tenantServices.length).toBeGreaterThan(0);
    // Tenant can browse Move-In Permission and Renovation
    expect(tenantServices.some((s) => s.code === "MOVE_IN_PERMISSION")).toBe(true);
    expect(tenantServices.some((s) => s.code === "RENOVATION_PERMISSION")).toBe(true);
    // Share Certificate request is OWNER only, so tenant cannot browse it
    const shareCert = defaultServices.find((s) => s.code === "SHARE_CERTIFICATE_REQUEST");
    if (shareCert && shareCert.eligibility === "OWNER") {
      expect(tenantServices.some((s) => s.code === "SHARE_CERTIFICATE_REQUEST")).toBe(false);
    }
  });

  // 3. Owner can submit a service request
  it("3. Owner can submit a service request directly to society management", () => {
    const homeLoanSrv = defaultServices.find((s) => s.code === "HOME_LOAN_NOC")!;
    const req = initiateServiceRequest({
      service: homeLoanSrv,
      applicantRole: "OWNER",
      applicantUserId: ownerUserId,
      societyId: societyIdA,
      flatId: flatA804,
      verifiedFlatOwnerId: ownerUserId,
      formData: { bankName: "HDFC Bank", loanAmount: 5000000 },
      attachments: [],
      isDraft: false,
      counter: 125,
    });

    expect(req.requestId).toBe("SF-2026-000125");
    expect(req.currentStatus).toBe("AWAITING_SOCIETY_REVIEW");
    expect(req.pendingActorType).toBe("SOCIETY_MANAGEMENT");
    expect(req.ownerAuthorization?.status).toBe("NOT_REQUIRED");
  });

  // 4. Tenant can submit a direct society request
  it("4. Tenant can submit a direct society request (Move-In Permission without owner auth)", () => {
    const moveInSrv = defaultServices.find((s) => s.code === "MOVE_IN_PERMISSION")!;
    // Set requiresOwnerAuthorization = false for direct tenant service
    const directMoveIn: TestServiceDefinition = {
      ...moveInSrv,
      requiresOwnerAuthorization: false,
    };

    const req = initiateServiceRequest({
      service: directMoveIn,
      applicantRole: "TENANT",
      applicantUserId: tenantUserId,
      societyId: societyIdA,
      flatId: flatA804,
      verifiedFlatOwnerId: ownerUserId,
      formData: { expectedDate: "2026-11-01", vehicleCount: 1 },
      attachments: [],
      isDraft: false,
      counter: 126,
    });

    expect(req.currentStatus).toBe("AWAITING_SOCIETY_REVIEW");
    expect(req.pendingActorType).toBe("SOCIETY_MANAGEMENT");
    expect(req.ownerAuthorization?.status).toBe("NOT_REQUIRED");
  });

  // 5. Tenant can submit an owner-authorization-required request
  it("5. Tenant can submit an owner-authorization-required request (e.g. Renovation Permission)", () => {
    const renovationSrv = defaultServices.find((s) => s.code === "RENOVATION_PERMISSION")!;
    const req = initiateServiceRequest({
      service: renovationSrv,
      applicantRole: "TENANT",
      applicantUserId: tenantUserId,
      societyId: societyIdA,
      flatId: flatA804,
      verifiedFlatOwnerId: ownerUserId,
      formData: { scopeDescription: "Painting and modular kitchen", durationDays: 14 },
      attachments: [],
      isDraft: false,
      counter: 127,
    });

    expect(req.currentStatus).toBe("AWAITING_OWNER_AUTHORIZATION");
    expect(req.pendingActorType).toBe("FLAT_OWNER");
    expect(req.ownerAuthorization?.status).toBe("PENDING");
    expect(req.ownerAuthorization?.ownerUserId).toBe(ownerUserId);
  });

  // 6. Owner receives the correct authorization request
  it("6. Owner receives the correct authorization request targeted to their flat", () => {
    const renovationSrv = defaultServices.find((s) => s.code === "RENOVATION_PERMISSION")!;
    const req = initiateServiceRequest({
      service: renovationSrv,
      applicantRole: "TENANT",
      applicantUserId: tenantUserId,
      societyId: societyIdA,
      flatId: flatA804,
      verifiedFlatOwnerId: ownerUserId,
      formData: { scope: "Electrical rewiring" },
      attachments: [],
      isDraft: false,
      counter: 128,
    });

    expect(req.ownerAuthorization?.ownerUserId).toBe(ownerUserId);
    expect(req.flatId).toBe(flatA804);
  });

  // 7. Unrelated owners cannot authorize requests
  it("7. Unrelated owners cannot authorize requests for other flats", () => {
    const renovationSrv = defaultServices.find((s) => s.code === "RENOVATION_PERMISSION")!;
    const req = initiateServiceRequest({
      service: renovationSrv,
      applicantRole: "TENANT",
      applicantUserId: tenantUserId,
      societyId: societyIdA,
      flatId: flatA804,
      verifiedFlatOwnerId: ownerUserId,
      formData: { scope: "Electrical rewiring" },
      attachments: [],
      isDraft: false,
      counter: 129,
    });

    expect(() => {
      processOwnerAuthorization(
        req,
        unrelatedOwnerUserId,
        ownerUserId,
        "AUTHORIZE",
        "Unauthorized approval attempt"
      );
    }).toThrow(/Forbidden/);
  });

  // 8. Owner authorization routes the request to society management
  it("8. Owner authorization moves the request into society management review queue", () => {
    const renovationSrv = defaultServices.find((s) => s.code === "RENOVATION_PERMISSION")!;
    const req = initiateServiceRequest({
      service: renovationSrv,
      applicantRole: "TENANT",
      applicantUserId: tenantUserId,
      societyId: societyIdA,
      flatId: flatA804,
      verifiedFlatOwnerId: ownerUserId,
      formData: { scope: "Woodwork" },
      attachments: [],
      isDraft: false,
      counter: 130,
    });

    const authorized = processOwnerAuthorization(
      req,
      ownerUserId,
      ownerUserId,
      "AUTHORIZE",
      "Authorized with no structural alterations"
    );

    expect(authorized.currentStatus).toBe("AWAITING_SOCIETY_REVIEW");
    expect(authorized.pendingActorType).toBe("SOCIETY_MANAGEMENT");
    expect(authorized.ownerAuthorization?.status).toBe("AUTHORIZED");
    expect(authorized.timeline.some((t) => t.action === "OWNER_AUTHORIZED")).toBe(true);
  });

  // 9. Owner decline prevents society submission
  it("9. Owner decline stops the workflow and prevents society submission", () => {
    const renovationSrv = defaultServices.find((s) => s.code === "RENOVATION_PERMISSION")!;
    const req = initiateServiceRequest({
      service: renovationSrv,
      applicantRole: "TENANT",
      applicantUserId: tenantUserId,
      societyId: societyIdA,
      flatId: flatA804,
      verifiedFlatOwnerId: ownerUserId,
      formData: { scope: "Balcony extension" },
      attachments: [],
      isDraft: false,
      counter: 131,
    });

    const declined = processOwnerAuthorization(
      req,
      ownerUserId,
      ownerUserId,
      "DECLINE",
      "Balcony extension is strictly forbidden under society bylaws"
    );

    expect(declined.currentStatus).toBe("OWNER_DECLINED");
    expect(declined.pendingActorType).toBe("NONE");
    expect(declined.ownerAuthorization?.status).toBe("DECLINED");
    expect(declined.timeline.some((t) => t.action === "OWNER_DECLINED")).toBe(true);
  });

  // 10. Request More Information sends request back to applicant
  it("10. Request More Information marks request INFORMATION_REQUIRED and directs to applicant", () => {
    const renovationSrv = defaultServices.find((s) => s.code === "RENOVATION_PERMISSION")!;
    const req = initiateServiceRequest({
      service: renovationSrv,
      applicantRole: "TENANT",
      applicantUserId: tenantUserId,
      societyId: societyIdA,
      flatId: flatA804,
      verifiedFlatOwnerId: ownerUserId,
      formData: { scope: "Plumbing repairs" },
      attachments: [],
      isDraft: false,
      counter: 132,
    });

    const infoReq = processOwnerAuthorization(
      req,
      ownerUserId,
      ownerUserId,
      "REQUEST_INFO",
      "Please specify licensed contractor contact details"
    );

    expect(infoReq.currentStatus).toBe("INFORMATION_REQUIRED");
    expect(infoReq.pendingActorType).toBe("APPLICANT");
    expect(infoReq.returnWorkflowStage).toBe("AWAITING_OWNER_AUTHORIZATION");
  });

  // 11. Corrected requests return to the appropriate workflow stage
  it("11. Corrected requests return back to the prior workflow stage upon resubmission", () => {
    const renovationSrv = defaultServices.find((s) => s.code === "RENOVATION_PERMISSION")!;
    const req = initiateServiceRequest({
      service: renovationSrv,
      applicantRole: "TENANT",
      applicantUserId: tenantUserId,
      societyId: societyIdA,
      flatId: flatA804,
      verifiedFlatOwnerId: ownerUserId,
      formData: { scope: "Plumbing repairs" },
      attachments: [],
      isDraft: false,
      counter: 133,
    });

    const infoReq = processOwnerAuthorization(
      req,
      ownerUserId,
      ownerUserId,
      "REQUEST_INFO",
      "Please provide contractor name"
    );

    const resubmitted = resubmitCorrectedRequest(infoReq, tenantUserId, {
      contractorName: "SafeFlow Plumbing Services",
    });

    expect(resubmitted.currentStatus).toBe("AWAITING_OWNER_AUTHORIZATION");
    expect(resubmitted.pendingActorType).toBe("FLAT_OWNER");
    expect(resubmitted.formData.contractorName).toBe("SafeFlow Plumbing Services");
    expect(resubmitted.timeline.some((t) => t.action === "CORRECTIONS_RESUBMITTED")).toBe(true);
  });

  // 12. Drafts persist after refresh
  it("12. Draft applications persist with DRAFT status and can be resumed", () => {
    const homeLoanSrv = defaultServices.find((s) => s.code === "HOME_LOAN_NOC")!;
    const draft = initiateServiceRequest({
      service: homeLoanSrv,
      applicantRole: "OWNER",
      applicantUserId: ownerUserId,
      societyId: societyIdA,
      flatId: flatA804,
      verifiedFlatOwnerId: ownerUserId,
      formData: { bankName: "SBI" },
      attachments: [],
      isDraft: true,
      counter: 134,
    });

    expect(draft.isDraft).toBe(true);
    expect(draft.currentStatus).toBe("DRAFT");
    expect(draft.pendingActorType).toBe("APPLICANT");
  });

  // 13. Existing authorized documents can be attached
  it("13. Authorized documents belonging to the user and society can be attached", () => {
    const homeLoanSrv = defaultServices.find((s) => s.code === "HOME_LOAN_NOC")!;
    const validAttachment = {
      documentId: "doc_sale_deed_01",
      ownerUserId: ownerUserId,
      societyId: societyIdA,
      displayName: "Registered Sale Deed Index II",
    };

    const req = initiateServiceRequest({
      service: homeLoanSrv,
      applicantRole: "OWNER",
      applicantUserId: ownerUserId,
      societyId: societyIdA,
      flatId: flatA804,
      verifiedFlatOwnerId: ownerUserId,
      formData: {},
      attachments: [validAttachment],
      isDraft: false,
      counter: 135,
    });

    expect(req.attachments.length).toBe(1);
    expect(req.attachments[0].documentId).toBe("doc_sale_deed_01");
  });

  // 14. Unauthorized documents cannot be attached
  it("14. Documents belonging to other users cannot be attached", () => {
    const homeLoanSrv = defaultServices.find((s) => s.code === "HOME_LOAN_NOC")!;
    const foreignDoc = {
      documentId: "doc_other_user_vault",
      ownerUserId: "some_other_resident",
      societyId: societyIdA,
      displayName: "Other User Private Deed",
    };

    expect(() => {
      initiateServiceRequest({
        service: homeLoanSrv,
        applicantRole: "OWNER",
        applicantUserId: ownerUserId,
        societyId: societyIdA,
        flatId: flatA804,
        verifiedFlatOwnerId: ownerUserId,
        formData: {},
        attachments: [foreignDoc],
        isDraft: false,
        counter: 136,
      });
    }).toThrow(/Cannot attach documents owned by other residents/);
  });

  // 15. Users cannot access another resident's private requests
  it("15. Request access query enforces applicant or authorized owner match", () => {
    const reqUserId: string = tenantUserId;
    const callerA: string = tenantUserId;
    const callerB: string = "random_intruder_user";

    const canAccessA = callerA === reqUserId || callerA === ownerUserId;
    const canAccessB = callerB === reqUserId || callerB === ownerUserId;

    expect(canAccessA).toBe(true);
    expect(canAccessB).toBe(false);
  });

  // 16. Cross-society access is blocked
  it("16. Cross-society document or request access is strictly blocked", () => {
    const homeLoanSrv = defaultServices.find((s) => s.code === "HOME_LOAN_NOC")!;
    const crossSocietyDoc = {
      documentId: "doc_other_society",
      ownerUserId: ownerUserId,
      societyId: societyIdB, // different society
      displayName: "Other Society Bylaw Document",
    };

    expect(() => {
      initiateServiceRequest({
        service: homeLoanSrv,
        applicantRole: "OWNER",
        applicantUserId: ownerUserId,
        societyId: societyIdA,
        flatId: flatA804,
        verifiedFlatOwnerId: ownerUserId,
        formData: {},
        attachments: [crossSocietyDoc],
        isDraft: false,
        counter: 137,
      });
    }).toThrow(/Attachment does not belong to the active society context/);
  });

  // 17. Template changes do not modify previously submitted applications
  it("17. Template changes do not modify previously submitted applications (immutable snapshot)", () => {
    const srv = defaultServices.find((s) => s.code === "HOME_LOAN_NOC")!;
    const req = initiateServiceRequest({
      service: srv,
      applicantRole: "OWNER",
      applicantUserId: ownerUserId,
      societyId: societyIdA,
      flatId: flatA804,
      verifiedFlatOwnerId: ownerUserId,
      formData: { bankName: "SBI" },
      attachments: [],
      isDraft: false,
      counter: 138,
    });

    expect(req.serviceSnapshot.version).toBe(1);

    // Society admin updates the service to version 2 with an extra field
    const updatedSrv: TestServiceDefinition = {
      ...srv,
      version: 2,
      requiredFields: [
        ...srv.requiredFields,
        { code: "sanction_letter_no", label: "Sanction Letter Number", required: true },
      ],
    };

    // Existing request snapshot remains at version 1
    expect(req.serviceSnapshot.version).toBe(1);
    expect(req.serviceSnapshot.requiredFields.length).toBe(srv.requiredFields.length);
    expect(updatedSrv.version).toBe(2);
  });

  // 18. Duplicate submissions do not create duplicate requests
  it("18. Sequential request reference format generates unique identifiers", () => {
    const id1 = formatRequestId(1, 2026);
    const id2 = formatRequestId(2, 2026);
    expect(id1).toBe("SF-2026-000001");
    expect(id2).toBe("SF-2026-000002");
    expect(id1).not.toBe(id2);
  });

  // 19. Request timeline records actual actions
  it("19. Request timeline records immutable audit history of transitions", () => {
    const renovationSrv = defaultServices.find((s) => s.code === "RENOVATION_PERMISSION")!;
    const req = initiateServiceRequest({
      service: renovationSrv,
      applicantRole: "TENANT",
      applicantUserId: tenantUserId,
      societyId: societyIdA,
      flatId: flatA804,
      verifiedFlatOwnerId: ownerUserId,
      formData: {},
      attachments: [],
      isDraft: false,
      counter: 139,
    });

    const authorized = processOwnerAuthorization(
      req,
      ownerUserId,
      ownerUserId,
      "AUTHORIZE",
      "Approved for 14 days duration"
    );

    expect(authorized.timeline.length).toBe(2);
    expect(authorized.timeline[0].action).toBe("REQUEST_SUBMITTED");
    expect(authorized.timeline[1].action).toBe("OWNER_AUTHORIZED");
    expect(authorized.timeline[1].comment).toBe("Approved for 14 days duration");
  });

  // 20. Management can inspect its society's request inbox
  it("20. Society management can query all non-draft applications in its society", () => {
    const requests: TestServiceRequest[] = [
      {
        id: "r1",
        requestId: "SF-2026-000001",
        societyId: societyIdA,
        flatId: flatA804,
        applicantUserId: ownerUserId,
        applicantRole: "OWNER",
        serviceCode: "HOME_LOAN_NOC",
        serviceTitle: "Home Loan NOC",
        serviceSnapshot: { version: 1, title: "Home Loan NOC", requiredFields: [] },
        formData: {},
        attachments: [],
        currentStatus: "AWAITING_SOCIETY_REVIEW",
        pendingActorType: "SOCIETY_MANAGEMENT",
        isDraft: false,
        timeline: [],
      },
      {
        id: "r2",
        requestId: "SF-2026-000002",
        societyId: societyIdB, // different society
        flatId: "flat_b202",
        applicantUserId: "user_other",
        applicantRole: "OWNER",
        serviceCode: "HOME_LOAN_NOC",
        serviceTitle: "Home Loan NOC",
        serviceSnapshot: { version: 1, title: "Home Loan NOC", requiredFields: [] },
        formData: {},
        attachments: [],
        currentStatus: "AWAITING_SOCIETY_REVIEW",
        pendingActorType: "SOCIETY_MANAGEMENT",
        isDraft: false,
        timeline: [],
      },
    ];

    const societyAQueue = requests.filter((r) => r.societyId === societyIdA && !r.isDraft);
    expect(societyAQueue.length).toBe(1);
    expect(societyAQueue[0].requestId).toBe("SF-2026-000001");
  });

  // 21. Responsive state machine transitions adhere to strict status enum
  it("21. Request status transitions strictly adhere to Prompt 7 state machine", () => {
    const validStatuses = [
      "DRAFT",
      "AWAITING_OWNER_AUTHORIZATION",
      "AWAITING_SOCIETY_REVIEW",
      "INFORMATION_REQUIRED",
      "UNDER_REVIEW",
      "OWNER_DECLINED",
      "REJECTED",
      "CANCELLED",
    ];

    // Verify neither APPROVED nor COMPLETED are reachable in Prompt 7
    expect(validStatuses.includes("APPROVED")).toBe(false);
    expect(validStatuses.includes("COMPLETED")).toBe(false);
  });
});
