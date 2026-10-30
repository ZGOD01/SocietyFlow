import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/session";
import { COMMITTEE_ROLES, MembershipRole } from "@/lib/rbac";
import { assignSocietySubscriptionPlan } from "@/lib/subscriptions/subscription-service";
import { PlanCode } from "@/models/SubscriptionPlan";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { societyId, planCode, notes } = body;

    const targetSocietyId = societyId || session.activeSocietyId || session.memberships?.[0]?.societyId;

    if (!targetSocietyId || !planCode) {
      return NextResponse.json(
        { error: "Society ID and Plan Code are required." },
        { status: 400 }
      );
    }

    // Authorization: Super Admin or verified Committee member of that society (Section 17)
    const isCommittee = session.memberships?.some(
      (m) =>
        m.status === "VERIFIED" &&
        COMMITTEE_ROLES.includes(m.role as MembershipRole) &&
        m.societyId === targetSocietyId
    );

    if (!isCommittee && !session.isSuperAdmin) {
      return NextResponse.json(
        { error: "Forbidden: Ordinary residents cannot modify society subscription plans. Managing Committee or Super Admin authority required." },
        { status: 403 }
      );
    }

    const updatedSub = await assignSocietySubscriptionPlan(
      targetSocietyId,
      planCode as PlanCode,
      { id: session.id, name: session.name },
      notes
    );

    return NextResponse.json({
      success: true,
      message: `Society demo subscription upgraded to ${planCode}.`,
      subscription: updatedSub,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to assign subscription plan";
    console.error("[Assign Subscription POST Error]", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
