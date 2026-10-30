import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/session";
import { getSocietySubscriptionData } from "@/lib/subscriptions/subscription-service";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const targetSocietyId =
      searchParams.get("societyId") ||
      session.activeSocietyId ||
      session.memberships?.[0]?.societyId;

    if (!targetSocietyId) {
      return NextResponse.json(
        { error: "No active society context found." },
        { status: 400 }
      );
    }

    const data = await getSocietySubscriptionData(targetSocietyId);
    return NextResponse.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load society subscription data";
    console.error("[Current Subscription GET Error]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
