import { NextRequest, NextResponse } from "next/server";
import {
  getServerSessionWithMeta,
  createSessionToken,
  setSessionCookie,
  SESSION_COOKIE_NAME,
  DEFAULT_SESSION_MAX_AGE_SECONDS,
} from "@/lib/session";
import { connectDB } from "@/lib/db";
import { Society, SocietyMembership } from "@/models";

export async function GET(req: NextRequest) {
  try {
    const sessionMeta = await getServerSessionWithMeta();
    if (!sessionMeta || sessionMeta.remainingSeconds <= 0) {
      return NextResponse.json({
        authenticated: false,
        user: null,
        reason: "expired",
      });
    }

    const { user: session, remainingSeconds, maxAgeSeconds, expiresAt } = sessionMeta;

    await connectDB();

    let updated = false;

    if (session.isSuperAdmin) {
      // Super Admin has verified access to all active societies
      const allSocieties = await Society.find({ status: "ACTIVE" }).lean();
      const adminMemberships = allSocieties.map((s) => ({
        societyId: s._id.toString(),
        societyName: s.name,
        societyCode: s.code,
        role: "SUPER_ADMIN",
        status: "VERIFIED" as const,
      }));

      const currentIds = (session.memberships || []).map((m) => m.societyId).sort().join(",");
      const newIds = adminMemberships.map((m) => m.societyId).sort().join(",");
      if (currentIds !== newIds) {
        session.memberships = adminMemberships;
        updated = true;
      }

      // If activeSocietyId is invalid or points to a deleted society, point to first available
      const activeExists = allSocieties.some((s) => s._id.toString() === session.activeSocietyId);
      if (!activeExists && allSocieties.length > 0) {
        session.activeSocietyId = allSocieties[0]._id.toString();
        updated = true;
      }
    } else {
      // Refresh user memberships from DB so changes (e.g., approvals) reflect immediately
      const dbMemberships = await SocietyMembership.find({ userId: session.id })
        .populate<{ societyId: { _id: string; name: string; code: string } }>(
          "societyId",
          "name code"
        )
        .lean();

      if (dbMemberships && dbMemberships.length > 0) {
        const newMemberships = dbMemberships.map((m) => ({
          societyId: m.societyId?._id?.toString() || m.societyId?.toString() || "",
          societyName: m.societyId?.name || "Society",
          societyCode: m.societyId?.code || "DEFAULT",
          role: m.role,
          status: m.status,
        }));

        const verifiedMembership =
          dbMemberships.find((m) => m.status === "VERIFIED") || dbMemberships[0];
        if (verifiedMembership) {
          const sId =
            verifiedMembership.societyId?._id?.toString() ||
            verifiedMembership.societyId?.toString() ||
            "";
          if (sId && session.activeSocietyId !== sId) {
            session.activeSocietyId = sId;
            updated = true;
          }
          if (
            verifiedMembership.role &&
            session.activeRole !== verifiedMembership.role
          ) {
            session.activeRole = verifiedMembership.role;
            updated = true;
          }
        }

        const oldMembershipsStr = JSON.stringify(session.memberships || []);
        const newMembershipsStr = JSON.stringify(newMemberships);
        if (oldMembershipsStr !== newMembershipsStr) {
          session.memberships = newMemberships;
          updated = true;
        }
      }
    }

    const response = NextResponse.json({
      authenticated: true,
      user: session,
      sessionExpiry: {
        expiresAt,
        remainingSeconds,
        maxAgeSeconds,
      },
    });

    // Only update cookie if membership data actually changed, ensuring session duration is never truncated
    if (updated && remainingSeconds > 0) {
      const tokenDuration = Math.max(remainingSeconds, maxAgeSeconds || DEFAULT_SESSION_MAX_AGE_SECONDS);
      const refreshedToken = await createSessionToken(session, tokenDuration);
      await setSessionCookie(refreshedToken, tokenDuration);
      response.cookies.set(SESSION_COOKIE_NAME, refreshedToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: tokenDuration,
      });
    }

    return response;
  } catch (err: unknown) {
    const error = err as Error;
    console.error("[Auth API] Session query error:", error);
    return NextResponse.json(
      { authenticated: false, user: null, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/auth/session - Explicit heartbeat or session refresh when user stays active or clicks "Stay Logged In"
 */
export async function POST() {
  try {
    // Read session with 60s clock tolerance so user clicking near or at expiration is smoothly renewed
    const sessionMeta = await getServerSessionWithMeta({ clockTolerance: 60 });
    if (!sessionMeta) {
      return NextResponse.json(
        { authenticated: false, error: "Session has already expired." },
        { status: 401 }
      );
    }

    const { user: session } = sessionMeta;
    // Always grant full statutory session timeout (30m / 1800s minimum, 24h if remembered)
    const isRemembered = (sessionMeta.maxAgeSeconds || 0) >= 86400;
    const renewDuration = isRemembered ? 24 * 60 * 60 : DEFAULT_SESSION_MAX_AGE_SECONDS;

    // Issue refreshed token with full timeout duration
    const renewedToken = await createSessionToken(session, renewDuration);
    await setSessionCookie(renewedToken, renewDuration);

    const expiresAt = Date.now() + renewDuration * 1000;
    const response = NextResponse.json({
      authenticated: true,
      refreshed: true,
      user: session,
      sessionExpiry: {
        expiresAt,
        remainingSeconds: renewDuration,
        maxAgeSeconds: renewDuration,
      },
    });

    response.cookies.set(SESSION_COOKIE_NAME, renewedToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: renewDuration,
    });

    return response;
  } catch (err: unknown) {
    const error = err as Error;
    console.error("[Auth API] Session refresh error:", error);
    return NextResponse.json(
      { authenticated: false, error: error.message },
      { status: 500 }
    );
  }
}

