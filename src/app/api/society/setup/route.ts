import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { getServerSession } from "@/lib/session";
import { connectDB } from "@/lib/db";
import {
  Society,
  Building,
  Wing,
  Flat,
  SocietyMembership,
  User,
  AuditEvent,
  Notification,
  ChannelPartner,
} from "@/models";
import { COMMITTEE_ROLES, MembershipRole } from "@/lib/rbac";
import { attributeReferralCodeToSociety } from "@/lib/partners/partner-service";
import { assignSocietySubscriptionPlan } from "@/lib/subscriptions/subscription-service";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const body = await req.json();
    const {
      // Step 1: Society Details
      societyName,
      registrationNumber,
      address,
      city,
      state,
      pinCode,
      invitationCode,

      // Step 2: Society Structure
      buildingName,
      wingsCount = 2,
      floorsPerWing = 10,
      flatsPerFloor = 4,
      wingNames = ["Wing A", "Wing B"],

      // Step 3: Committee Members
      secretaryEmail,
      chairmanEmail,
      treasurerEmail,
      managerEmail,
    } = body;

    // SECURITY CHECK:
    // "The initial society account must be verified/activated by the Platform Super Admin or an authorized controlled invitation.
    // Users must never gain society administrator privileges simply by selecting Society Management during registration."
    const isSuperAdmin = session.isSuperAdmin;
    const isVerifiedCommittee = session.memberships?.some(
      (m) =>
        m.status === "VERIFIED" &&
        COMMITTEE_ROLES.includes(m.role as MembershipRole)
    );
    const validControlledCodes = ["SF-INVITE-2026", "MAHA-GOV-REG-PUNE", "BUILDER-CLEARANCE-77"];
    let isPartnerCode = false;
    if (typeof invitationCode === "string" && invitationCode.trim()) {
      const pMatch = await ChannelPartner.findOne({ referralCode: invitationCode.trim().toUpperCase() });
      if (pMatch) isPartnerCode = true;
    }

    const hasControlledInvitation =
      (typeof invitationCode === "string" &&
        validControlledCodes.includes(invitationCode.trim().toUpperCase())) ||
      isPartnerCode;

    if (!isSuperAdmin && !isVerifiedCommittee && !hasControlledInvitation) {
      return NextResponse.json(
        {
          error:
            "Forbidden: Initial society setup requires Platform Super Admin authorization or a verified controlled invitation code. Self-activation without administrative clearance is prohibited.",
        },
        { status: 403 }
      );
    }

    if (!societyName || !registrationNumber || !city) {
      return NextResponse.json(
        { error: "Society name, registration number, and city are required." },
        { status: 400 }
      );
    }

    // Generate unique society code
    const baseCode = societyName
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 10);
    let code = `${baseCode}-${(city || "PUNE").toUpperCase()}`;
    const existing = await Society.findOne({ code });
    if (existing) {
      code = `${code}-${Math.floor(100 + Math.random() * 900)}`;
    }

    const totalFlats = wingsCount * floorsPerWing * flatsPerFloor;

    // 1. Create Society
    const society = await Society.create({
      name: societyName.trim(),
      code,
      registrationNumber: registrationNumber.trim(),
      address: address?.trim(),
      city: city.trim(),
      state: state?.trim() || "Maharashtra",
      pinCode: pinCode?.trim() || "411001",
      totalFlats,
      totalWings: wingsCount,
      status: "ACTIVE",
    });

    // 2. Create Building & Wings & Flats
    const building = await Building.create({
      societyId: society._id,
      name: buildingName?.trim() || `${societyName.trim()} Complex`,
      totalFloors: floorsPerWing,
    });

    for (let w = 0; w < wingsCount; w++) {
      const wName = wingNames[w] || `Wing ${String.fromCharCode(65 + w)}`;
      const wing = await Wing.create({
        societyId: society._id,
        buildingId: building._id,
        name: wName,
        totalFlats: floorsPerWing * flatsPerFloor,
      });

      // Generate Flats
      const flatDocs = [];
      for (let f = 1; f <= floorsPerWing; f++) {
        for (let u = 1; u <= flatsPerFloor; u++) {
          const flatNumber = `${f}0${u}`;
          flatDocs.push({
            societyId: society._id,
            buildingId: building._id,
            wingId: wing._id,
            flatNumber,
            floor: f,
            carpetAreaSqFt: 1050,
            defaultOccupancyType: "VACANT",
          });
        }
      }
      if (flatDocs.length > 0) {
        await Flat.insertMany(flatDocs);
      }
    }

    // 3. Assign Creator / Calling User as Secretary / Chairman if not already verified
    await SocietyMembership.findOneAndUpdate(
      { userId: new Types.ObjectId(session.id), societyId: society._id },
      {
        $set: {
          role: "SECRETARY" as MembershipRole,
          status: "VERIFIED",
          approvedBy: new Types.ObjectId(session.id),
          approvedAt: new Date(),
          notes: "Founding Secretary authorized via verified society setup wizard.",
        },
      },
      { upsert: true }
    );

    await User.findByIdAndUpdate(session.id, {
      $set: { onboardingStatus: "COMPLETED" },
    });

    // 4. Invite / Assign other committee members if provided
    const committeeAssignments: Array<{ email?: string; role: MembershipRole }> = [
      { email: secretaryEmail, role: "SECRETARY" },
      { email: chairmanEmail, role: "CHAIRMAN" },
      { email: treasurerEmail, role: "TREASURER" },
      { email: managerEmail, role: "SOCIETY_MANAGER" },
    ];

    for (const ca of committeeAssignments) {
      if (ca.email && ca.email.trim() && ca.email.toLowerCase().trim() !== session.email.toLowerCase()) {
        const normEmail = ca.email.toLowerCase().trim();
        let targetUser = await User.findOne({ email: normEmail });
        if (!targetUser) {
          // Staged user record
          targetUser = await User.create({
            name: `${ca.role.replace(/_/g, " ")} Designate`,
            email: normEmail,
            password: "TemporaryPassword@2026",
            status: "PENDING",
            onboardingStatus: "COMPLETED",
          });
        }

        await SocietyMembership.findOneAndUpdate(
          { userId: targetUser._id, societyId: society._id, role: ca.role },
          {
            $set: {
              status: "VERIFIED",
              approvedBy: new Types.ObjectId(session.id),
              approvedAt: new Date(),
              notes: "Appointed during initial society onboarding setup.",
            },
          },
          { upsert: true }
        );

        await Notification.create({
          userId: targetUser._id,
          societyId: society._id,
          title: "Appointed to Society Committee",
          message: `You have been appointed as ${ca.role} for ${society.name}. Access your management console.`,
          type: "action_required",
          eventType: "SOCIETY_SETUP_COMPLETE",
          actionUrl: "/management/dashboard",
        });
      }
    }

    // Audit Event
    await AuditEvent.create({
      societyId: society._id,
      userId: session.id,
      action: "SOCIETY_SETUP_COMPLETED",
      entityType: "Society",
      entityId: society._id.toString(),
      details: {
        societyCode: society.code,
        wingsCount,
        totalFlats,
        setupBy: session.name,
      },
    });

    // Attribute partner referral if provided
    if (typeof invitationCode === "string" && invitationCode.trim()) {
      await attributeReferralCodeToSociety(
        invitationCode.trim(),
        society._id.toString(),
        society.name
      ).catch((err) => console.error("Referral attribution error:", err));
    }

    // Assign initial demo subscription
    await assignSocietySubscriptionPlan(
      society._id.toString(),
      "PROFESSIONAL",
      { id: session.id, name: session.name },
      "Initial demo plan assigned upon society creation."
    ).catch((err) => console.error("Initial subscription error:", err));

    return NextResponse.json({
      success: true,
      message: `Society ${society.name} (${society.code}) created and activated with ${totalFlats} flats across ${wingsCount} wings.`,
      society: {
        id: society._id.toString(),
        name: society.name,
        code: society.code,
        totalFlats,
      },
      redirectUrl: "/management/dashboard",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to execute society setup";
    console.error("[Society Setup POST Error]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
