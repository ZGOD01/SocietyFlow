import { NextRequest, NextResponse } from "next/server";
import { connectDB, formatDBError } from "@/lib/db";
import {
  User,
  Society,
  Wing,
  Flat,
  SocietyMembership,
  FlatOccupancy,
  AuditEvent,
  MembershipRole,
  RegistrationRequest,
  Notification,
} from "@/models";
import { dispatchNotification } from "@/lib/notifications";
import { hashPassword } from "@/lib/auth-passwords";
import {
  createSessionToken,
  setSessionCookie,
  SESSION_COOKIE_NAME,
  DEFAULT_SESSION_MAX_AGE_SECONDS,
  SessionUser,
  SessionMembershipInfo,
  SessionOccupancyInfo,
} from "@/lib/session";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  ownerRegistrationSchema,
  tenantRegistrationSchema,
  managementRegistrationSchema,
  registerSchema,
} from "@/modules/auth/schema";

export async function POST(req: NextRequest) {
  try {
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "127.0.0.1";

    // Rate Limiting Protection (Max 5 registrations per 10 minutes per IP)
    const rateCheck = checkRateLimit(`register:${clientIp}`, 5, 600);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: "Too many registration attempts. Please try again later.",
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const accountType = body.accountType || "OWNER";

    // Validate payload against role-specific schema
    let validatedData: Record<string, unknown>;

    if (accountType === "OWNER") {
      const parsed = ownerRegistrationSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Validation failed", details: parsed.error.issues },
          { status: 400 }
        );
      }
      validatedData = parsed.data;
    } else if (accountType === "TENANT") {
      const parsed = tenantRegistrationSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Validation failed", details: parsed.error.issues },
          { status: 400 }
        );
      }
      validatedData = parsed.data;
    } else if (accountType === "MANAGEMENT") {
      const parsed = managementRegistrationSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Validation failed", details: parsed.error.issues },
          { status: 400 }
        );
      }
      validatedData = parsed.data;
    } else {
      const parsed = registerSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Validation failed", details: parsed.error.issues },
          { status: 400 }
        );
      }
      validatedData = parsed.data;
    }

    await connectDB();

    const normalizedEmail = (validatedData.email as string).toLowerCase().trim();

    // Check existing user
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return NextResponse.json(
        {
          error: "An account with this email already exists. Please sign in instead.",
        },
        { status: 409 }
      );
    }

    // Check for duplicate unresolved registration request
    const existingPendingRequest = await RegistrationRequest.findOne({
      applicantEmail: normalizedEmail,
      status: {
        $in: [
          "PENDING_APPROVAL",
          "OWNER_APPROVED_SOCIETY_PENDING",
          "SOCIETY_APPROVED_OWNER_PENDING",
        ],
      },
    });
    if (existingPendingRequest) {
      return NextResponse.json(
        {
          error: "An active registration application for this email is already awaiting verification.",
        },
        { status: 409 }
      );
    }

    // Hash password securely (bcrypt, 12 rounds)
    const hashedPassword = await hashPassword(validatedData.password as string);

    // Create User record with initial PENDING_REGISTRATION_APPROVAL onboarding status
    const user = await User.create({
      name: (validatedData.fullName as string).trim(),
      email: normalizedEmail,
      password: hashedPassword,
      phone: (validatedData.phone as string) || undefined,
      status: "ACTIVE",
      onboardingStatus: "PENDING_REGISTRATION_APPROVAL",
      isSuperAdmin: false,
      isPartner: false,
    });

    // Society Resolution by code, registration number, or name
    let rawCode = ((validatedData.societyCode as string) || "").trim();
    const inputName = (validatedData.societyName as string)?.trim() || (rawCode ? `${rawCode.replace(/-/g, " ")} CHS Ltd.` : "Housing Society CHS Ltd.");
    const inputCity = (validatedData.city as string)?.trim() || "Pune";
    const inputState = (validatedData.state as string)?.trim() || "Maharashtra";
    const inputPin = (validatedData.pinCode as string)?.trim() || "411045";
    const inputAddress = (validatedData.address as string)?.trim() || "";
    const resolution = (validatedData.resolutionNumber as string)?.trim() || undefined;

    // Parse wing names and dynamic structure parameters
    const wingsStr = (validatedData.wings as string)?.trim() || "";
    const parsedWings = wingsStr
      ? wingsStr.split(",").map((w) => w.trim()).filter(Boolean)
      : ["Wing A", "Wing B"];

    const floorsPerWing = Math.max(1, Math.min(100, Number(validatedData.floorsPerWing) || 4));
    const flatsPerFloor = Math.max(1, Math.min(30, Number(validatedData.flatsPerFloor) || 4));
    const bhkType = (validatedData.bhkType as string) || "2 BHK";

    let society = null;
    let isNewSocietyRegistration = false;

    if (accountType === "MANAGEMENT") {
      // If code was not provided, auto-generate a unique code from society name
      if (!rawCode || rawCode.toUpperCase() === "GREENWOOD-PUNE") {
        const cleanPfx = inputName.replace(/[^a-zA-Z0-9]/g, "").slice(0, 6).toUpperCase() || "SOC";
        rawCode = `${cleanPfx}-${Math.floor(100 + Math.random() * 900)}`;
      }

      const escapedCode = rawCode.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const codeRegex = new RegExp(`^${escapedCode}$`, "i");

      // Check if a society with this exact code or registration number already exists
      const existingSociety = await Society.findOne({
        $or: [
          { code: codeRegex },
          { registrationNumber: codeRegex },
        ],
      });

      if (existingSociety) {
        // If an existing society has this code but has a DIFFERENT name, reject to prevent hijacking
        const existingNameClean = existingSociety.name.trim().toLowerCase();
        const inputNameClean = inputName.trim().toLowerCase();

        if (existingNameClean !== inputNameClean) {
          return NextResponse.json(
            {
              error: `The Society Code or Registration ID "${rawCode}" is already registered to "${existingSociety.name}". Please provide a unique Registration Code for "${inputName}".`,
            },
            { status: 409 }
          );
        }
        // If exact same name and code, they are adding a committee member to that same society
        society = existingSociety;
      }

      if (!society) {
        // Create brand new isolated Housing Society
        isNewSocietyRegistration = true;
        society = await Society.create({
          name: inputName,
          code: rawCode.toUpperCase(),
          registrationNumber: rawCode.toUpperCase(),
          city: inputCity,
          state: inputState,
          pinCode: inputPin,
          address: inputAddress,
          resolutionNumber: resolution,
          inviteToken: resolution,
          totalWings: parsedWings.length > 0 ? parsedWings.length : 1,
          totalFlats: parsedWings.length * floorsPerWing * flatsPerFloor,
          contactEmail: normalizedEmail,
          contactPhone: (validatedData.phone as string) || undefined,
          status: "PENDING", // Zero-trust: pending Super Admin approval
        });

        // Create Wing and Flat records dynamically in MongoDB
        for (const wName of parsedWings) {
          const wing = await Wing.create({
            societyId: society._id,
            name: wName,
            totalFloors: floorsPerWing,
            flatsPerFloor: flatsPerFloor,
            totalFlats: floorsPerWing * flatsPerFloor,
          });

          const wingPfx = wName.replace(/Wing\s*/i, "").trim() || "A";
          for (let fl = 1; fl <= floorsPerWing; fl++) {
            for (let u = 1; u <= flatsPerFloor; u++) {
              const uStr = u < 10 ? `0${u}` : `${u}`;
              const flatNum = `${wingPfx}-${fl}${uStr}`;
              await Flat.create({
                societyId: society._id,
                wingId: wing._id,
                flatNumber: flatNum,
                floor: fl,
                bhkType,
                defaultOccupancyType: "VACANT",
                isActive: true,
                status: "ACTIVE",
              });
            }
          }
        }
      }
    } else {
      // OWNER or TENANT: Must link to an existing registered active society
      if (!rawCode) rawCode = "GREENWOOD-PUNE";
      const escapedCode = rawCode.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const codeRegex = new RegExp(`^${escapedCode}$`, "i");

      society = await Society.findOne({
        $or: [
          { code: rawCode },
          { code: rawCode.toUpperCase() },
          { code: codeRegex },
          { registrationNumber: rawCode },
          { registrationNumber: rawCode.toUpperCase() },
          { registrationNumber: codeRegex },
          { name: codeRegex },
          { name: rawCode },
        ],
      });

      if (!society) {
        // Also try partial name match for active societies
        society = await Society.findOne({
          name: { $regex: new RegExp(escapedCode, "i") },
          status: "ACTIVE",
        });
      }

      if (!society) {
        return NextResponse.json(
          {
            error: `Society "${rawCode}" was not found. Please verify the Society Code or Registration ID (e.g. ABC/DEF/001) with your society management committee.`,
          },
          { status: 404 }
        );
      }
    }

    const memberships: SessionMembershipInfo[] = [];
    const occupancies: SessionOccupancyInfo[] = [];

    // Role-specific associations
    if (accountType === "OWNER") {
      const wingName = ((validatedData.wing as string) || "Wing A").trim();
      const flatNum = ((validatedData.flatNumber as string) || "101").trim();

      // Find or create Wing
      let wing = await Wing.findOne({
        societyId: society._id,
        $or: [
          { name: wingName },
          { name: new RegExp(`^${wingName}$`, "i") },
          { name: `Wing ${wingName.replace(/Wing\s*/i, "")}` },
        ],
      });
      if (!wing) {
        wing = await Wing.create({
          societyId: society._id,
          name: wingName,
          totalFlats: 1,
        });
      }

      // Find or create Flat
      let flat = await Flat.findOne({
        societyId: society._id,
        wingId: wing._id,
        $or: [
          { flatNumber: flatNum },
          { flatNumber: flatNum.toUpperCase() },
          { flatNumber: new RegExp(`^${flatNum}$`, "i") },
        ],
      });
      if (!flat) {
        const floorNum = parseInt(flatNum.replace(/\D/g, "")[0] || "1", 10) || 1;
        flat = await Flat.create({
          societyId: society._id,
          wingId: wing._id,
          flatNumber: flatNum,
          floor: floorNum,
          defaultOccupancyType: "OWNER_OCCUPIED",
        });
      }

      // Check if flat already has an active verified owner (conflict check)
      const existingActiveOwner = await FlatOccupancy.findOne({
        flatId: flat._id,
        occupancyType: "OWNER",
        status: "APPROVED",
      });

      // Create SocietyMembership with PENDING status (requires committee approval)
      const membership = await SocietyMembership.create({
        userId: user._id,
        societyId: society._id,
        role: "OWNER",
        status: "PENDING",
        notes: existingActiveOwner
          ? "Owner registration conflict: Flat currently has another verified owner record. Reassignment review needed."
          : "Self-registered property owner. Flat title deed pending verification.",
      });

      // Create FlatOccupancy with PENDING status
      const occupancy = await FlatOccupancy.create({
        flatId: flat._id,
        userId: user._id,
        societyId: society._id,
        occupancyType: "OWNER",
        ownershipType: (validatedData.ownershipType as "SOLE_OWNER" | "JOINT_OWNER") || "SOLE_OWNER",
        status: "PENDING",
      });

      // Create persistent RegistrationRequest
      await RegistrationRequest.create({
        applicantId: user._id,
        applicantName: user.name,
        applicantEmail: user.email,
        applicantPhone: user.phone,
        role: "OWNER",
        societyId: society._id,
        wingId: wing._id,
        wingName: wing.name,
        flatId: flat._id,
        flatNumber: flat.flatNumber,
        ownershipType: (validatedData.ownershipType as "SOLE_OWNER" | "JOINT_OWNER") || "SOLE_OWNER",
        status: "PENDING_APPROVAL",
        ownerApproval: {
          status: "NOT_REQUIRED",
        },
        societyApproval: {
          status: "PENDING",
        },
        onboardingStatus: "PENDING_REGISTRATION_APPROVAL",
        timeline: [
          {
            action: "REGISTRATION_CREATED",
            actorId: user._id,
            actorRole: "OWNER",
            actorName: user.name,
            timestamp: new Date(),
            statusTransition: "PENDING_APPROVAL",
            comment: existingActiveOwner
              ? "Owner registration submitted with existing occupancy notice. Awaiting managing committee title deed review."
              : "Owner registration submitted successfully. Awaiting managing committee review.",
          },
        ],
      });

      // 1. Notify Applicant (Owner)
      await dispatchNotification({
        eventType: "OWNER_REGISTRATION_SUBMITTED",
        category: "REGISTRATION",
        type: "info",
        title: "Owner Registration Submitted",
        message: "Registration submitted successfully. Waiting for Society Management approval.",
        actionUrl: "/pending-approval",
        societyId: society._id,
        recipients: [user._id],
        idempotencyKey: `REG_SUBMIT_OWNER_${user._id.toString()}`,
      });

      // 2. Find society committee members and emit notification to Management
      const committeeMemberships = await SocietyMembership.find({
        societyId: society._id,
        role: { $in: ["SECRETARY", "CHAIRMAN", "TREASURER", "SOCIETY_MANAGER"] },
        status: "VERIFIED",
      }).select("userId").lean();

      if (committeeMemberships.length > 0) {
        await dispatchNotification({
          eventType: "OWNER_REGISTRATION_SUBMITTED",
          category: "REGISTRATION",
          type: "action_required",
          title: "New Owner Registration",
          message: `New Owner Registration — Flat ${wing.name}-${flat.flatNumber} requires verification.`,
          actionUrl: "/management/approvals",
          societyId: society._id,
          recipients: committeeMemberships.map((cm) => cm.userId),
          idempotencyKey: `REG_ALERT_MGMT_${user._id.toString()}`,
        });
      }

      memberships.push({
        societyId: society._id.toString(),
        societyName: society.name,
        societyCode: society.code,
        role: membership.role,
        status: membership.status,
      });

      occupancies.push({
        flatId: flat._id.toString(),
        societyId: society._id.toString(),
        wing: wing.name,
        flatNumber: flat.flatNumber,
        occupancyType: occupancy.occupancyType,
        status: occupancy.status,
      });
    } else if (accountType === "TENANT") {
      const wingName = ((validatedData.wing as string) || "Wing A").trim();
      const flatNum = ((validatedData.flatNumber as string) || "101").trim();

      let wing = await Wing.findOne({
        societyId: society._id,
        $or: [
          { name: wingName },
          { name: new RegExp(`^${wingName}$`, "i") },
          { name: `Wing ${wingName.replace(/Wing\s*/i, "")}` },
        ],
      });
      if (!wing) {
        wing = await Wing.create({
          societyId: society._id,
          name: wingName,
          totalFlats: 1,
        });
      }

      let flat = await Flat.findOne({
        societyId: society._id,
        wingId: wing._id,
        $or: [
          { flatNumber: flatNum },
          { flatNumber: flatNum.toUpperCase() },
          { flatNumber: new RegExp(`^${flatNum}$`, "i") },
        ],
      });
      if (!flat) {
        const floorNum = parseInt(flatNum.replace(/\D/g, "")[0] || "1", 10) || 1;
        flat = await Flat.create({
          societyId: society._id,
          wingId: wing._id,
          flatNumber: flatNum,
          floor: floorNum,
          defaultOccupancyType: "TENANT_OCCUPIED",
        });
      }

      const membership = await SocietyMembership.create({
        userId: user._id,
        societyId: society._id,
        role: "TENANT",
        status: "PENDING",
        notes: "Registered tenant. Awaiting dual authorization from Property Owner and Society Management.",
      });

      const occupancy = await FlatOccupancy.create({
        flatId: flat._id,
        userId: user._id,
        societyId: society._id,
        occupancyType: "TENANT",
        status: "PENDING",
        ownerName: (validatedData.ownerName as string) || undefined,
        ownerContact: (validatedData.ownerContact as string) || undefined,
      });

      // Create persistent RegistrationRequest with dual approvals required
      await RegistrationRequest.create({
        applicantId: user._id,
        applicantName: user.name,
        applicantEmail: user.email,
        applicantPhone: user.phone,
        role: "TENANT",
        societyId: society._id,
        wingId: wing._id,
        wingName: wing.name,
        flatId: flat._id,
        flatNumber: flat.flatNumber,
        ownerName: (validatedData.ownerName as string) || undefined,
        ownerContact: (validatedData.ownerContact as string) || undefined,
        status: "PENDING_APPROVAL",
        ownerApproval: {
          status: "PENDING",
        },
        societyApproval: {
          status: "PENDING",
        },
        onboardingStatus: "PENDING_REGISTRATION_APPROVAL",
        timeline: [
          {
            action: "REGISTRATION_CREATED",
            actorId: user._id,
            actorRole: "TENANT",
            actorName: user.name,
            timestamp: new Date(),
            statusTransition: "PENDING_APPROVAL",
            comment: "Tenant registration submitted. Requires independent approvals from Property Owner and Society Management.",
          },
        ],
      });

      // 1. Notify Applicant (Tenant)
      await dispatchNotification({
        eventType: "TENANT_REGISTRATION_SUBMITTED",
        category: "REGISTRATION",
        type: "info",
        title: "Tenant Registration Submitted",
        message: "Registration submitted. Waiting for Owner and Society Management approval.",
        actionUrl: "/pending-approval",
        societyId: society._id,
        recipients: [user._id],
        idempotencyKey: `REG_SUBMIT_TENANT_${user._id.toString()}`,
      });

      // 2. Notify verified Flat Owner if present
      const verifiedOwnerOcc = await FlatOccupancy.findOne({
        flatId: flat._id,
        occupancyType: "OWNER",
        status: "APPROVED",
      });

      if (verifiedOwnerOcc) {
        await dispatchNotification({
          eventType: "TENANT_OWNER_APPROVAL_REQUIRED",
          category: "APPROVAL",
          type: "action_required",
          title: "Tenant Authorization Required",
          message: `New tenant registration requires your authorization for Flat ${wing.name}-${flat.flatNumber}.`,
          actionUrl: "/owner/authorizations",
          societyId: society._id,
          recipients: [verifiedOwnerOcc.userId],
          idempotencyKey: `REG_ALERT_OWNER_${user._id.toString()}`,
        });
      }

      // 3. Notify Society Management
      const committeeMemberships = await SocietyMembership.find({
        societyId: society._id,
        role: { $in: ["SECRETARY", "CHAIRMAN", "TREASURER", "SOCIETY_MANAGER"] },
        status: "VERIFIED",
      }).select("userId").lean();

      if (committeeMemberships.length > 0) {
        await dispatchNotification({
          eventType: "TENANT_SOCIETY_APPROVAL_REQUIRED",
          category: "APPROVAL",
          type: "action_required",
          title: "Tenant Registration Review",
          message: `Tenant registration requires society verification for Flat ${wing.name}-${flat.flatNumber}.`,
          actionUrl: "/management/approvals",
          societyId: society._id,
          recipients: committeeMemberships.map((cm) => cm.userId),
          idempotencyKey: `REG_ALERT_TENANT_MGMT_${user._id.toString()}`,
        });
      }

      memberships.push({
        societyId: society._id.toString(),
        societyName: society.name,
        societyCode: society.code,
        role: membership.role,
        status: membership.status,
      });

      occupancies.push({
        flatId: flat._id.toString(),
        societyId: society._id.toString(),
        wing: wing.name,
        flatNumber: flat.flatNumber,
        occupancyType: occupancy.occupancyType,
        status: occupancy.status,
      });
    } else if (accountType === "MANAGEMENT") {
      const position = ((validatedData.position as string) || "SECRETARY") as MembershipRole;
      const resolution = (validatedData.resolutionNumber as string) || undefined;

      // Management cannot self-assign permissions: remains PENDING until verified
      const membership = await SocietyMembership.create({
        userId: user._id,
        societyId: society._id,
        role: position,
        status: "PENDING",
        resolutionNumber: resolution,
        notes: "Committee member registration request. Awaiting administrative confirmation.",
      });

      await RegistrationRequest.create({
        applicantId: user._id,
        applicantName: user.name,
        applicantEmail: user.email,
        applicantPhone: user.phone,
        role: "MANAGEMENT",
        societyId: society._id,
        wingName: "Main Complex",
        flatNumber: "Office",
        managementPosition: position,
        resolutionNumber: resolution,
        isNewSociety: isNewSocietyRegistration,
        proposedSocietyName: inputName,
        proposedCity: inputCity,
        proposedState: inputState,
        proposedWings: parsedWings.join(", "),
        proposedFlatsCount: parsedWings.length * floorsPerWing * flatsPerFloor,
        status: "PENDING_APPROVAL",
        ownerApproval: {
          status: "NOT_REQUIRED",
        },
        societyApproval: {
          status: "PENDING",
        },
        onboardingStatus: "PENDING_REGISTRATION_APPROVAL",
        timeline: [
          {
            action: "REGISTRATION_CREATED",
            actorId: user._id,
            actorRole: position,
            actorName: user.name,
            timestamp: new Date(),
            statusTransition: "PENDING_APPROVAL",
            comment: isNewSocietyRegistration
              ? `New society registration application for "${inputName}" submitted by ${user.name}. Awaiting Super Admin society clearance.`
              : `Committee role application for ${position} submitted. Awaiting Super Admin or committee clearance.`,
          },
        ],
      });

      memberships.push({
        societyId: society._id.toString(),
        societyName: society.name,
        societyCode: society.code,
        role: membership.role as string,
        status: membership.status as "PENDING" | "VERIFIED" | "REJECTED" | "SUSPENDED",
      });
    }

    // Audit Event
    await AuditEvent.create({
      societyId: society._id,
      userId: user._id,
      action: "AUTH_REGISTER_SUCCESS",
      entityType: "User",
      entityId: user._id.toString(),
      details: {
        accountType,
        societyCode: society.code,
        email: user.email,
        membershipStatus: "PENDING",
      },
      ipAddress: clientIp,
      userAgent: req.headers.get("user-agent") || undefined,
    });

    // Create session token and set secure HTTP-only cookie
    const sessionUser: SessionUser = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      phone: user.phone,
      isSuperAdmin: !!user.isSuperAdmin,
      isPartner: !!user.isPartner,
      activeSocietyId: society._id.toString(),
      activeRole: memberships[0]?.role || "OWNER",
      onboardingStatus: "PENDING_REGISTRATION_APPROVAL",
      memberships,
      occupancies,
    };

    const token = await createSessionToken(sessionUser);
    await setSessionCookie(token);

    const response = NextResponse.json({
      success: true,
      accountStatus: "PENDING_APPROVAL",
      accountType,
      message:
        accountType === "OWNER"
          ? "Your registration has been submitted successfully and is awaiting approval from Society Management. You will receive a notification when your account is approved."
          : accountType === "TENANT"
          ? "Your registration has been submitted successfully and is awaiting approval from the Property Owner and Society Management."
          : "Your registration has been submitted successfully and is awaiting statutory committee verification.",
      user: sessionUser,
      redirectUrl: "/pending-approval",
    });

    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: DEFAULT_SESSION_MAX_AGE_SECONDS,
    });

    return response;
  } catch (err: unknown) {
    const error = err as Error;
    console.error("[Auth API] Register error:", error);
    const friendlyMessage = formatDBError(error);
    return NextResponse.json(
      {
        error:
          friendlyMessage ||
          "An unexpected error occurred during registration. Please try again.",
      },
      { status: 500 }
    );
  }
}
