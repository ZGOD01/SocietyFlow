import { NextRequest, NextResponse } from "next/server";
import { connectDB, formatDBError } from "@/lib/db";
import {
  User,
  SocietyMembership,
  FlatOccupancy,
  AuditEvent,
  Wing,
} from "@/models";
import { verifyPassword } from "@/lib/auth-passwords";
import {
  createSessionToken,
  setSessionCookie,
  SESSION_COOKIE_NAME,
  DEFAULT_SESSION_MAX_AGE_SECONDS,
  SessionUser,
  SessionMembershipInfo,
  SessionOccupancyInfo,
} from "@/lib/session";
import { checkRateLimit, resetRateLimit } from "@/lib/rate-limit";
import { getRoleRedirectUrl } from "@/lib/rbac";
import { loginSchema } from "@/modules/auth/schema";

export async function POST(req: NextRequest) {
  try {
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "127.0.0.1";

    const body = await req.json();

    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const email = parsed.data.email.toLowerCase().trim();
    const password = parsed.data.password;

    // Brute-force protection: Max 5 failed attempts per 15 minutes per IP + email
    const rateKey = `login:${clientIp}:${email}`;
    const rateCheck = checkRateLimit(rateKey, 5, 900);

    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error:
            "Too many login attempts. For security reasons, your account access has been temporarily throttled. Please try again in 15 minutes.",
        },
        { status: 429 }
      );
    }

    await connectDB();

    const user = await User.findOne({ email });

    if (!user) {
      await AuditEvent.create({
        action: "AUTH_LOGIN_FAILED_UNKNOWN_EMAIL",
        details: { email },
        ipAddress: clientIp,
        userAgent: req.headers.get("user-agent") || undefined,
      });

      return NextResponse.json(
        { error: "Invalid registered email or password." },
        { status: 401 }
      );
    }

    if (user.status === "SUSPENDED") {
      return NextResponse.json(
        {
          error:
            "Your account has been suspended by the statutory housing society administrator. Please contact your society office.",
        },
        { status: 403 }
      );
    }

    // Verify bcrypt password hash
    const isValidPassword = await verifyPassword(password, user.password);

    if (!isValidPassword) {
      await AuditEvent.create({
        userId: user._id,
        action: "AUTH_LOGIN_FAILED_BAD_PASSWORD",
        details: { email },
        ipAddress: clientIp,
        userAgent: req.headers.get("user-agent") || undefined,
      });

      return NextResponse.json(
        { error: "Invalid registered email or password." },
        { status: 401 }
      );
    }

    // Successful authentication: Reset brute-force limiter
    resetRateLimit(rateKey);

    // Update last login timestamp
    user.lastLoginAt = new Date();
    await user.save();

    // Fetch user memberships across societies
    const dbMemberships = await SocietyMembership.find({ userId: user._id })
      .populate<{ societyId: { _id: string; name: string; code: string } }>(
        "societyId",
        "name code"
      )
      .lean();

    const memberships: SessionMembershipInfo[] = dbMemberships.map((m) => ({
      societyId: m.societyId?._id?.toString() || m.societyId?.toString() || "",
      societyName: m.societyId?.name || "Society",
      societyCode: m.societyId?.code || "DEFAULT",
      role: m.role,
      status: m.status,
    }));

    // Fetch flat occupancies
    const dbOccupancies = await FlatOccupancy.find({ userId: user._id })
      .populate<{ flatId: { _id: string; flatNumber: string; wingId: string } }>(
        "flatId",
        "flatNumber wingId"
      )
      .lean();

    const occupancies: SessionOccupancyInfo[] = [];

    for (const occ of dbOccupancies) {
      let wingName = "Wing A";
      if (occ.flatId?.wingId) {
        const wing = await Wing.findById(occ.flatId.wingId).select("name").lean();
        if (wing) wingName = wing.name;
      }

      occupancies.push({
        flatId: occ.flatId?._id?.toString() || occ.flatId?.toString() || "",
        societyId: occ.societyId?.toString() || "",
        wing: wingName,
        flatNumber: occ.flatId?.flatNumber || "Unit",
        occupancyType: occ.occupancyType,
        status: occ.status,
      });
    }

    // Determine primary active society and role
    const activeMembership =
      memberships.find((m) => m.status === "VERIFIED") || memberships[0];

    const sessionUser: SessionUser = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      phone: user.phone,
      isSuperAdmin: !!user.isSuperAdmin,
      isPartner: !!user.isPartner,
      activeSocietyId: activeMembership?.societyId,
      activeRole: activeMembership?.role || "OWNER",
      onboardingStatus: user.onboardingStatus || (user.isSuperAdmin || user.isPartner ? "COMPLETED" : "PENDING_REGISTRATION_APPROVAL"),
      memberships,
      occupancies,
    };

    // Calculate redirect destination based on verified permissions
    const redirectUrl = getRoleRedirectUrl(sessionUser);

    // Calculate session duration: 24h if rememberMe is enabled, otherwise standard timeout (30m)
    const rememberMe = Boolean(parsed.data.rememberMe);
    const sessionMaxAge = rememberMe
      ? 24 * 60 * 60
      : DEFAULT_SESSION_MAX_AGE_SECONDS;

    // Create signed session token with expiration and set HTTP-only cookie
    const token = await createSessionToken(sessionUser, sessionMaxAge);
    await setSessionCookie(token, sessionMaxAge);

    // Audit log
    await AuditEvent.create({
      societyId: activeMembership?.societyId || undefined,
      userId: user._id,
      action: "AUTH_LOGIN_SUCCESS",
      details: {
        email: user.email,
        role: activeMembership?.role,
        redirectUrl,
        sessionMaxAgeSeconds: sessionMaxAge,
        rememberMe,
      },
      ipAddress: clientIp,
      userAgent: req.headers.get("user-agent") || undefined,
    });

    const response = NextResponse.json({
      success: true,
      user: sessionUser,
      redirectUrl,
      sessionExpiry: {
        maxAgeSeconds: sessionMaxAge,
        expiresAt: Date.now() + sessionMaxAge * 1000,
      },
    });

    // Ensure session cookie is explicitly attached to outgoing HTTP response
    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: sessionMaxAge,
    });

    return response;
  } catch (err: unknown) {
    const error = err as Error;
    console.error("[Auth API] Login error:", error);
    const friendlyMessage = formatDBError(error);
    return NextResponse.json(
      { error: friendlyMessage || "An unexpected error occurred during login." },
      { status: 500 }
    );
  }
}
