import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { SESSION_COOKIE_NAME, SessionUser } from "@/lib/session";
import { COMMITTEE_ROLES, MembershipRole } from "@/lib/rbac";

function getSecretKey(): Uint8Array {
  const secret =
    process.env.AUTH_SECRET ||
    "societyflow_statutory_auth_secret_session_key_2026_min_32_chars";
  return new TextEncoder().encode(secret);
}

async function verifyToken(token: string): Promise<SessionUser | null> {
  try {
    const key = getSecretKey();
    const { payload } = await jwtVerify(token, key, {
      algorithms: ["HS256"],
    });
    if (payload && typeof payload.user === "object") {
      return payload.user as SessionUser;
    }
    return null;
  } catch {
    return null;
  }
}

// Protected route paths
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/management",
  "/admin",
  "/partner",
  "/properties",
  "/documents",
  "/requests",
  "/approvals",
  "/society-documents",
  "/settings",
  "/select-workspace",
  "/onboarding",
  "/ownership-transfer",
  "/my-flat",
  "/owner",
  "/services",
  "/notifications",
  "/profile",
];

export async function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;
  const isPreview = searchParams.get("preview") === "true";
  const isSwitchingAccount =
    searchParams.get("switch") === "true" ||
    searchParams.get("logout") === "true" ||
    searchParams.get("reauth") === "true" ||
    searchParams.get("force") === "true";

  // Check session cookie
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const user = token ? await verifyToken(token) : null;

  // 1. Auth routes (/login, /register) -> redirect to dashboard if already authenticated
  if (pathname === "/login" || pathname === "/register") {
    // If user explicitly asks to switch account or re-authenticate, allow login page to render
    if (isSwitchingAccount) {
      return NextResponse.next();
    }

    if (user && !isPreview) {
      if (user.isSuperAdmin) {
        return NextResponse.redirect(new URL("/admin/dashboard", req.url));
      }
      if (user.isPartner) {
        return NextResponse.redirect(new URL("/partner/dashboard", req.url));
      }
      const verified = user.memberships?.filter((m) => m.status === "VERIFIED") || [];
      if (verified.length === 0) {
        return NextResponse.redirect(new URL("/pending-approval", req.url));
      }
      const hasCommittee = verified.some((m) =>
        COMMITTEE_ROLES.includes(m.role as MembershipRole)
      );
      if (hasCommittee) {
        return NextResponse.redirect(new URL("/management/dashboard", req.url));
      }
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  // 2. Pending Approval page
  if (pathname === "/pending-approval") {
    if (!user && !isPreview) {
      return NextResponse.redirect(new URL("/login?redirect=/pending-approval", req.url));
    }
    return NextResponse.next();
  }

  // 3. Protected route check
  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );

  if (isProtected) {
    if (!user) {
      if (isPreview) {
        return NextResponse.next();
      }
      const redirectUrl = new URL("/login", req.url);
      redirectUrl.searchParams.set("redirect", pathname);
      if (token) {
        redirectUrl.searchParams.set("reason", "session_expired");
      }
      const response = NextResponse.redirect(redirectUrl);
      if (token) {
        response.cookies.set(SESSION_COOKIE_NAME, "", {
          path: "/",
          maxAge: 0,
          expires: new Date(0),
        });
      }
      return response;
    }

    // Role-specific route authorization
    if (pathname === "/dashboard" && user.isSuperAdmin && !isPreview) {
      return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    }

    if (pathname.startsWith("/admin")) {
      if (!user.isSuperAdmin && !isPreview) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    if (pathname.startsWith("/management")) {
      const isCommittee =
        user.isSuperAdmin ||
        (user.memberships || []).some(
          (m) =>
            m.status === "VERIFIED" &&
            COMMITTEE_ROLES.includes(m.role as MembershipRole)
        );
      if (!isCommittee && !isPreview) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    if (pathname.startsWith("/partner")) {
      const isAuditor =
        user.isSuperAdmin ||
        user.isPartner ||
        (user.memberships || []).some(
          (m) => m.status === "VERIFIED" && m.role === "PARTNER"
        );
      if (!isAuditor && !isPreview) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    if (pathname.startsWith("/owner")) {
      const isOwnerOrManagement =
        user.isSuperAdmin ||
        user.activeRole === "OWNER" ||
        (user.memberships || []).some(
          (m) =>
            m.status === "VERIFIED" &&
            (m.role === "OWNER" || COMMITTEE_ROLES.includes(m.role as MembershipRole))
        );
      if (!isOwnerOrManagement && !isPreview) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    // Non-admin/partner resident verification check
    if (
      !user.isSuperAdmin &&
      !user.isPartner &&
      !pathname.startsWith("/pending-approval") &&
      !pathname.startsWith("/select-workspace") &&
      !pathname.startsWith("/onboarding") &&
      !isPreview
    ) {
      const verified = user.memberships?.filter((m) => m.status === "VERIFIED") || [];
      if (verified.length === 0) {
        return NextResponse.redirect(new URL("/pending-approval", req.url));
      }

      // Check onboarding documents requirement
      if (user.onboardingStatus === "DOCUMENT_ONBOARDING_REQUIRED") {
        const primary = verified[0];
        const isOwner = primary?.role === "OWNER" || user.activeRole === "OWNER";
        const isTenant = primary?.role === "TENANT" || user.activeRole === "TENANT";
        const targetRoute = isOwner
          ? "/onboarding/owner-documents"
          : isTenant
          ? "/onboarding/tenant-documents"
          : null;

        if (targetRoute && !pathname.startsWith(targetRoute) && !pathname.startsWith("/api")) {
          return NextResponse.redirect(new URL(targetRoute, req.url));
        }
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/management/:path*",
    "/admin/:path*",
    "/partner/:path*",
    "/properties/:path*",
    "/documents/:path*",
    "/requests/:path*",
    "/approvals/:path*",
    "/society-documents/:path*",
    "/settings/:path*",
    "/select-workspace",
    "/pending-approval",
    "/onboarding/:path*",
    "/ownership-transfer/:path*",
    "/my-flat/:path*",
    "/owner/:path*",
    "/services/:path*",
    "/notifications/:path*",
    "/profile/:path*",
    "/login",
    "/register",
  ],
};
