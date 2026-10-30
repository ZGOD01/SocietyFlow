import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/session";
import {
  listAllPartnersForAdmin,
  updatePartnerStatus,
} from "@/lib/partners/partner-service";

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session || !session.isSuperAdmin) {
      return NextResponse.json(
        { error: "Forbidden: Super Admin authority required." },
        { status: 403 }
      );
    }

    const partners = await listAllPartnersForAdmin();
    return NextResponse.json({ partners });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load admin partners";
    console.error("[Admin Partners GET Error]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session || !session.isSuperAdmin) {
      return NextResponse.json(
        { error: "Forbidden: Super Admin authority required." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { partnerId, status, commissionType, commissionRate, notes } = body;

    if (!partnerId) {
      return NextResponse.json({ error: "Partner ID is required." }, { status: 400 });
    }

    const updated = await updatePartnerStatus(partnerId, {
      status,
      commissionType,
      commissionRate,
      notes,
    });

    return NextResponse.json({
      success: true,
      message: "Partner status and terms updated.",
      partner: updated,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update partner";
    console.error("[Admin Partners PATCH Error]", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
