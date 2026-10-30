import { NextRequest, NextResponse } from "next/server";
import { getServerSession, createSessionToken, setSessionCookie } from "@/lib/session";
import { getRoleRedirectUrl } from "@/lib/rbac";

import { connectDB } from "@/lib/db";
import { Society } from "@/models";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const targetSocietyId = body.targetSocietyId || body.societyId;
    const targetRole = body.targetRole || body.role;

    if (!targetSocietyId) {
      return NextResponse.json(
        { error: "Target society ID is required" },
        { status: 400 }
      );
    }

    await connectDB();
    const society = await Society.findById(targetSocietyId).lean();

    // Verify user belongs to the target society
    const targetMembership = session.memberships?.find(
      (m) =>
        m.societyId === targetSocietyId &&
        (!targetRole || m.role === targetRole)
    );

    if (!targetMembership && !session.isSuperAdmin) {
      return NextResponse.json(
        { error: "You do not have membership in this target society." },
        { status: 403 }
      );
    }

    if (targetMembership && targetMembership.status !== "VERIFIED" && !session.isSuperAdmin) {
      return NextResponse.json(
        { error: `Your membership in this society is not verified yet. Status: ${targetMembership.status}` },
        { status: 403 }
      );
    }

    const updatedMemberships = [...(session.memberships || [])];

    if (session.isSuperAdmin && society) {
      const existingIdx = updatedMemberships.findIndex((m) => m.societyId === targetSocietyId);
      const superMembership = {
        societyId: society._id.toString(),
        societyName: society.name,
        societyCode: society.code,
        role: targetRole || "SUPER_ADMIN",
        status: "VERIFIED" as const,
      };
      if (existingIdx >= 0) {
        updatedMemberships[existingIdx] = superMembership;
      } else {
        updatedMemberships.unshift(superMembership);
      }
    }

    const updatedUser = {
      ...session,
      activeSocietyId: targetSocietyId,
      activeRole: targetMembership?.role || targetRole || session.activeRole,
      memberships: updatedMemberships,
    };

    const token = await createSessionToken(updatedUser);
    await setSessionCookie(token);

    const redirectUrl = getRoleRedirectUrl(updatedUser);

    return NextResponse.json({
      success: true,
      user: updatedUser,
      redirectUrl,
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error("[Auth API] Switch society error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to switch workspace." },
      { status: 500 }
    );
  }
}
