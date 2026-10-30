import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/session";
import { getSuperAdminDashboardData } from "@/lib/services/dashboard-service";

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session || !session.isSuperAdmin) {
      return NextResponse.json({ error: "Forbidden: Super Admin only" }, { status: 403 });
    }

    const data = await getSuperAdminDashboardData(session);
    return NextResponse.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch super admin data";
    console.error("[Dashboard Super Admin API Error]", message);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
