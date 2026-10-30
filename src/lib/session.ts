import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export const SESSION_COOKIE_NAME = "societyflow_session";

// Default statutory session timeout: 30 minutes (1800 seconds)
// Configurable via SESSION_MAX_AGE_SECONDS environment variable
export const DEFAULT_SESSION_MAX_AGE_SECONDS = parseInt(
  process.env.SESSION_MAX_AGE_SECONDS || "1800",
  10
);

// Backward-compatibility alias
export const SESSION_MAX_AGE_SECONDS = DEFAULT_SESSION_MAX_AGE_SECONDS;

export interface SessionMembershipInfo {
  societyId: string;
  societyName: string;
  societyCode: string;
  role: string;
  status: "PENDING" | "VERIFIED" | "REJECTED" | "SUSPENDED";
}

export interface SessionOccupancyInfo {
  flatId: string;
  societyId: string;
  wing: string;
  flatNumber: string;
  occupancyType: "OWNER" | "TENANT";
  status: "PENDING" | "APPROVED" | "REJECTED" | "ENDED";
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  phone?: string;
  isSuperAdmin: boolean;
  isPartner: boolean;
  activeSocietyId?: string;
  activeRole?: string;
  onboardingStatus?: "PENDING_REGISTRATION_APPROVAL" | "DOCUMENT_ONBOARDING_REQUIRED" | "COMPLETED";
  memberships: SessionMembershipInfo[];
  occupancies?: SessionOccupancyInfo[];
}

function getSecretKey(): Uint8Array {
  const secret =
    process.env.AUTH_SECRET ||
    "societyflow_statutory_auth_secret_session_key_2026_min_32_chars";
  return new TextEncoder().encode(secret);
}

/**
 * Generate a signed JWT session token with explicit lifetime.
 */
export async function createSessionToken(
  user: SessionUser,
  maxAgeSeconds: number = DEFAULT_SESSION_MAX_AGE_SECONDS
): Promise<string> {
  const key = getSecretKey();
  const nowSec = Math.floor(Date.now() / 1000);
  return new SignJWT({ user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(nowSec)
    .setExpirationTime(nowSec + maxAgeSeconds)
    .setSubject(user.id)
    .sign(key);
}

/**
 * Verify a JWT session token and return the decoded SessionUser.
 * Rejects expired tokens automatically.
 */
export async function verifySessionToken(token: string): Promise<SessionUser | null> {
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

/**
 * Verify a JWT session token and return both the SessionUser and expiration metadata.
 */
export async function verifySessionTokenWithMeta(
  token: string,
  options?: { clockTolerance?: number }
): Promise<{
  user: SessionUser;
  expiresAt: number; // in milliseconds
  remainingSeconds: number;
  maxAgeSeconds: number;
} | null> {
  try {
    const key = getSecretKey();
    const { payload } = await jwtVerify(token, key, {
      algorithms: ["HS256"],
      clockTolerance: options?.clockTolerance,
    });

    if (payload && typeof payload.user === "object") {
      const nowSec = Math.floor(Date.now() / 1000);
      const expSec =
        typeof payload.exp === "number"
          ? payload.exp
          : nowSec + DEFAULT_SESSION_MAX_AGE_SECONDS;
      const iatSec = typeof payload.iat === "number" ? payload.iat : expSec - DEFAULT_SESSION_MAX_AGE_SECONDS;
      const maxAgeSeconds = Math.max(1, expSec - iatSec);
      const remainingSeconds = Math.max(0, expSec - nowSec);

      return {
        user: payload.user as SessionUser,
        expiresAt: expSec * 1000,
        remainingSeconds,
        maxAgeSeconds,
      };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Retrieve the current authenticated session on the server.
 */
export async function getServerSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) {
      return null;
    }
    return await verifySessionToken(token);
  } catch (err: unknown) {
    // Don't log Next.js internal prerender bailout signals
    const isPrerenderBailout =
      typeof err === "object" && err !== null && "digest" in err;
    if (!isPrerenderBailout) {
      console.error("[Session] Error retrieving server session:", err);
    }
    return null;
  }
}

/**
 * Retrieve current authenticated session with expiration metadata.
 */
export async function getServerSessionWithMeta(
  options?: { clockTolerance?: number }
): Promise<{
  user: SessionUser;
  expiresAt: number;
  remainingSeconds: number;
  maxAgeSeconds: number;
} | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) {
      return null;
    }
    return await verifySessionTokenWithMeta(token, options);
  } catch (err: unknown) {
    const isPrerenderBailout =
      typeof err === "object" && err !== null && "digest" in err;
    if (!isPrerenderBailout) {
      console.error("[Session] Error retrieving server session with meta:", err);
    }
    return null;
  }
}

/**
 * Set the session HTTP-only cookie.
 */
export async function setSessionCookie(
  token: string,
  maxAgeSeconds: number = DEFAULT_SESSION_MAX_AGE_SECONDS
): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: maxAgeSeconds,
  });
}

/**
 * Remove the session HTTP-only cookie on logout.
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });
  cookieStore.delete({
    name: SESSION_COOKIE_NAME,
    path: "/",
  });
  cookieStore.delete(SESSION_COOKIE_NAME);
}
