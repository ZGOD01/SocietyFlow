import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/session";
import { listAllSocietiesWithSubscriptions } from "@/lib/subscriptions/subscription-service";

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session || !session.isSuperAdmin) {
      return NextResponse.json(
        { error: "Forbidden: Super Admin authority required." },
        { status: 403 }
      );
    }

    const societies = await listAllSocietiesWithSubscriptions();
    return NextResponse.json({ societies });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load admin subscriptions list";
    console.error("[Admin Subscriptions GET Error]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
