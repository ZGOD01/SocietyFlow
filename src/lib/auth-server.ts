import "server-only";
import { redirect } from "next/navigation";
import { getServerSession, SessionUser } from "./session";
import { hasVerifiedSocietyAccess, hasAuthorizedFlatAccess, MembershipRole } from "./rbac";

export class UnauthorizedError extends Error {
  constructor(message: string = "Authentication required") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  constructor(message: string = "Access denied") {
    super(message);
    this.name = "ForbiddenError";
  }
}

/**
 * Require an authenticated session in Server Components or Server Actions.
 * Redirects to /login if not authenticated.
 */
export async function requireAuth(): Promise<SessionUser> {
  const session = await getServerSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}

/**
 * Require a verified role in Server Components or Route Handlers.
 */
export async function requireRole(allowedRoles: MembershipRole[]): Promise<SessionUser> {
  const session = await requireAuth();

  if (session.isSuperAdmin) {
    return session;
  }

  const hasRole = session.memberships.some(
    (m) => m.status === "VERIFIED" && allowedRoles.includes(m.role as MembershipRole)
  );

  if (!hasRole) {
    throw new ForbiddenError(
      `Access denied. Requires one of the following verified roles: ${allowedRoles.join(", ")}`
    );
  }

  return session;
}

/**
 * Require verified membership within a specific society.
 */
export async function requireSocietyMembership(
  societyId: string,
  allowedRoles?: MembershipRole[]
): Promise<SessionUser> {
  const session = await requireAuth();

  if (!hasVerifiedSocietyAccess(session, societyId, allowedRoles)) {
    throw new ForbiddenError(
      `Access denied. You do not have verified access to society: ${societyId}`
    );
  }

  return session;
}

/**
 * Require authorized flat access.
 */
export async function requireFlatAccess(
  societyId: string,
  flatId: string
): Promise<SessionUser> {
  const session = await requireAuth();

  if (!hasAuthorizedFlatAccess(session, societyId, flatId)) {
    throw new ForbiddenError(
      `Access denied. You are not authorized to access records for flat: ${flatId}`
    );
  }

  return session;
}
