import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/session";
import { getOrCreatePartnerProfile } from "@/lib/partners/partner-service";

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const partner = await getOrCreatePartnerProfile({
      id: session.id,
      name: session.name,
      email: session.email,
      phone: session.phone,
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const referralLink = `${appUrl}/onboarding/society-setup?ref=${partner.referralCode}`;

    return NextResponse.json({
      partner,
      referralLink,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load partner profile";
    console.error("[Partner Profile GET Error]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
