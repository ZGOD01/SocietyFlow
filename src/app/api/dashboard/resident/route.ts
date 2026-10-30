import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/session";
import { getResidentDashboardData } from "@/lib/services/dashboard-service";

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await getResidentDashboardData(session);
    return NextResponse.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch dashboard data";
    console.error("[Dashboard Resident API Error]", message);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
