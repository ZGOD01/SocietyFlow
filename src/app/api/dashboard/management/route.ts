import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/session";
import { getManagementDashboardData } from "@/lib/services/dashboard-service";

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await getManagementDashboardData(session);
    return NextResponse.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch management dashboard data";
    console.error("[Dashboard Management API Error]", message);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
