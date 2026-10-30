import { NextResponse } from "next/server";
import {
  getServerSession,
  createSessionToken,
  setSessionCookie,
  SESSION_COOKIE_NAME,
  DEFAULT_SESSION_MAX_AGE_SECONDS,
  SessionUser,
} from "@/lib/session";
import { connectDB } from "@/lib/db";
import { RegistrationRequest, Society, SocietyMembership, FlatOccupancy, Wing } from "@/models";

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Find the latest registration request for this applicant
    const regRequest = await RegistrationRequest.findOne({
      applicantId: session.id,
    })
      .sort({ createdAt: -1 })
      .lean();

    if (!regRequest) {
      return NextResponse.json({
        found: false,
        message: "No registration request found for this account.",
      });
    }

    const society = await Society.findById(regRequest.societyId)
      .select("name code registrationNumber city")
      .lean();

    // Proactively refresh the session cookie if registration was approved
    let updatedToken: string | null = null;
    const isApproved = regRequest.status === "APPROVED";
    const sessionNeedsRefresh =
      isApproved &&
      (!session.memberships?.some((m) => m.status === "VERIFIED") ||
        session.onboardingStatus !== regRequest.onboardingStatus);

    if (sessionNeedsRefresh) {
      const dbMemberships = await SocietyMembership.find({ userId: session.id })
        .populate<{ societyId: { _id: string; name: string; code: string } }>(
          "societyId",
          "name code"
        )
        .lean();

      const memberships = dbMemberships.map((m) => ({
        societyId: m.societyId?._id?.toString() || m.societyId?.toString() || "",
        societyName: m.societyId?.name || society?.name || "Society",
        societyCode: m.societyId?.code || society?.code || "DEFAULT",
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
        let wingName = regRequest.wingName || "Wing A";
        if (occ.flatId?.wingId) {
          const wing = await Wing.findById(occ.flatId.wingId).select("name").lean();
          if (wing) wingName = wing.name;
        }
        occupancies.push({
          flatId: occ.flatId?._id?.toString() || occ.flatId?.toString() || "",
          societyId: occ.societyId?.toString() || "",
          wing: wingName,
          flatNumber: occ.flatId?.flatNumber || regRequest.flatNumber || "Unit",
          occupancyType: occ.occupancyType,
          status: occ.status,
        });
      }

      const activeMembership =
        memberships.find((m) => m.status === "VERIFIED") || memberships[0];

      const updatedSession: SessionUser = {
        ...session,
        activeRole: (activeMembership?.role as SessionUser["activeRole"]) || regRequest.role,
        activeSocietyId: activeMembership?.societyId || regRequest.societyId.toString(),
        onboardingStatus: (regRequest.onboardingStatus as SessionUser["onboardingStatus"]) || "DOCUMENT_ONBOARDING_REQUIRED",
        memberships:
          memberships.length > 0
            ? memberships
            : [
                {
                  societyId: regRequest.societyId.toString(),
                  societyName: society?.name || "Society",
                  societyCode: society?.code || "DEFAULT",
                  role: regRequest.role,
                  status: "VERIFIED",
                },
              ],
        occupancies: occupancies.length > 0 ? occupancies : session.occupancies,
      };

      updatedToken = await createSessionToken(updatedSession);
      await setSessionCookie(updatedToken);
    }

    const response = NextResponse.json({
      found: true,
      request: {
        id: regRequest._id.toString(),
        applicantName: regRequest.applicantName,
        applicantEmail: regRequest.applicantEmail,
        applicantPhone: regRequest.applicantPhone,
        role: regRequest.role,
        societyId: regRequest.societyId.toString(),
        societyName: society?.name || "Cooperative Housing Society",
        societyCode: society?.code || "PENDING",
        societyRegNumber: society?.registrationNumber || "",
        wingName: regRequest.wingName,
        flatNumber: regRequest.flatNumber,
        ownershipType: regRequest.ownershipType,
        leaseStartDate: regRequest.leaseStartDate,
        leaseEndDate: regRequest.leaseEndDate,
        ownerName: regRequest.ownerName,
        status: regRequest.status,
        ownerApproval: regRequest.ownerApproval,
        societyApproval: regRequest.societyApproval,
        onboardingStatus: regRequest.onboardingStatus,
        timeline: regRequest.timeline,
        rejectionReason: regRequest.rejectionReason,
        moreInfoNote: regRequest.moreInfoNote,
        createdAt: regRequest.createdAt ? new Date(regRequest.createdAt).toISOString() : new Date().toISOString(),
      },
    });

    if (updatedToken) {
      response.cookies.set(SESSION_COOKIE_NAME, updatedToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: DEFAULT_SESSION_MAX_AGE_SECONDS,
      });
    }

    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to retrieve approval status";
    console.error("[Approval Status GET Error]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
