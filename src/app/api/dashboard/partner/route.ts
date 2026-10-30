import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/session";
import { getPartnerDashboardData } from "@/lib/services/dashboard-service";

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session || (!session.isPartner && !session.isSuperAdmin)) {
      return NextResponse.json({ error: "Forbidden: Partner desk only" }, { status: 403 });
    }

    const data = await getPartnerDashboardData(session);
    return NextResponse.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch partner data";
    console.error("[Dashboard Partner API Error]", message);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
