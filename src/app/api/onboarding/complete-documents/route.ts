import { NextResponse } from "next/server";
import {
  getServerSession,
  setSessionCookie,
  createSessionToken,
  SESSION_COOKIE_NAME,
  DEFAULT_SESSION_MAX_AGE_SECONDS,
  SessionUser,
} from "@/lib/session";
import { connectDB } from "@/lib/db";
import {
  User,
  RegistrationRequest,
  AuditEvent,
  SocietyMembership,
  FlatOccupancy,
  Flat,
  Wing,
} from "@/models";

export async function POST() {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Update User onboardingStatus to COMPLETED
    const updatedUser = await User.findByIdAndUpdate(
      session.id,
      { $set: { onboardingStatus: "COMPLETED" } },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    // Ensure SocietyMembership is VERIFIED
    await SocietyMembership.updateMany(
      { userId: session.id },
      { $set: { status: "VERIFIED" } }
    );

    // Ensure FlatOccupancy is APPROVED
    await FlatOccupancy.updateMany(
      { userId: session.id },
      { $set: { status: "APPROVED" } }
    );

    // Update RegistrationRequest onboardingStatus
    const regRequest = await RegistrationRequest.findOneAndUpdate(
      { applicantId: session.id },
      {
        $set: { onboardingStatus: "COMPLETED", status: "APPROVED" },
        $push: {
          timeline: {
            action: "MEMBERSHIP_ACTIVATED",
            actorId: session.id,
            actorRole: session.activeRole || "RESIDENT",
            actorName: session.name,
            timestamp: new Date(),
            statusTransition: "COMPLETED",
            comment: "Statutory document checklist submitted by resident. Access to resident dashboard unlocked.",
          },
        },
      },
      { new: true }
    );

    // Also link Flat ownership if flatId exists
    if (regRequest?.flatId) {
      if (session.activeRole === "TENANT" || regRequest.role === "TENANT") {
        await Flat.findByIdAndUpdate(regRequest.flatId, {
          $set: {
            currentTenantId: session.id,
            defaultOccupancyType: "TENANT_OCCUPIED",
          },
        });
      } else {
        await Flat.findByIdAndUpdate(regRequest.flatId, {
          $set: {
            currentOwnerId: session.id,
            defaultOccupancyType: "OWNER_OCCUPIED",
          },
        });
      }
    }

    // Audit Event
    await AuditEvent.create({
      societyId: session.activeSocietyId || regRequest?.societyId || undefined,
      userId: session.id,
      action: "ONBOARDING_DOCUMENTS_SUBMITTED",
      entityType: "User",
      entityId: session.id,
      details: {
        role: session.activeRole,
        email: session.email,
      },
    });

    // Re-fetch memberships & occupancies to build fully verified session
    const dbMemberships = await SocietyMembership.find({ userId: session.id })
      .populate<{ societyId: { _id: string; name: string; code: string } }>(
        "societyId",
        "name code"
      )
      .lean();

    const memberships = dbMemberships.map((m) => ({
      societyId: m.societyId?._id?.toString() || m.societyId?.toString() || "",
      societyName: m.societyId?.name || "Society",
      societyCode: m.societyId?.code || "DEFAULT",
      role: m.role,
      status: m.status,
    }));

    const dbOccupancies = await FlatOccupancy.find({ userId: session.id })
      .populate<{ flatId: { _id: string; flatNumber: string; wingId: string } }>(
        "flatId",
        "flatNumber wingId"
      )
      .lean();

    const occupancies = [];
    for (const occ of dbOccupancies) {
      let wingName = regRequest?.wingName || "Wing A";
      if (occ.flatId?.wingId) {
        const wing = await Wing.findById(occ.flatId.wingId).select("name").lean();
        if (wing) wingName = wing.name;
      }
      occupancies.push({
        flatId: occ.flatId?._id?.toString() || occ.flatId?.toString() || "",
        societyId: occ.societyId?.toString() || "",
        wing: wingName,
        flatNumber: occ.flatId?.flatNumber || regRequest?.flatNumber || "Unit",
        occupancyType: occ.occupancyType,
        status: occ.status,
      });
    }

    const activeMembership =
      memberships.find((m) => m.status === "VERIFIED") || memberships[0];

    const updatedSession: SessionUser = {
      ...session,
      activeRole: (activeMembership?.role as SessionUser["activeRole"]) || session.activeRole || "OWNER",
      activeSocietyId: activeMembership?.societyId || session.activeSocietyId,
      onboardingStatus: "COMPLETED",
      memberships:
        memberships.length > 0
          ? memberships
          : [
              {
                societyId: session.activeSocietyId || "",
                societyName: "Society",
                societyCode: "DEFAULT",
                role: session.activeRole || "OWNER",
                status: "VERIFIED",
              },
            ],
      occupancies: occupancies.length > 0 ? occupancies : session.occupancies,
    };

    const newToken = await createSessionToken(updatedSession);
    await setSessionCookie(newToken);

    const isTenant = updatedSession.activeRole === "TENANT";
    const redirectUrl = isTenant ? "/dashboard?view=tenant" : "/dashboard";

    const response = NextResponse.json({
      success: true,
      message: "Document submission checklist completed successfully.",
      redirectUrl,
    });

    response.cookies.set(SESSION_COOKIE_NAME, newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: DEFAULT_SESSION_MAX_AGE_SECONDS,
    });

    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to complete document onboarding";
    console.error("[Onboarding Complete API Error]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
