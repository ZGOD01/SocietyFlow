import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/session";
import {
  getOrCreatePartnerProfile,
  getPartnerReferrals,
  submitPartnerReferral,
} from "@/lib/partners/partner-service";

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

    const referrals = await getPartnerReferrals(partner._id.toString());
    return NextResponse.json({ referrals });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load referrals";
    console.error("[Partner Referrals GET Error]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const {
      societyName,
      societyCity,
      contactPerson,
      contactEmail,
      contactPhone,
      demoSubscriptionPlan,
      notes,
    } = body;

    if (!societyName || !societyCity || !contactPerson || !contactEmail) {
      return NextResponse.json(
        { error: "Society name, city, contact person, and contact email are required." },
        { status: 400 }
      );
    }

    const referral = await submitPartnerReferral(partner, {
      societyName,
      societyCity,
      contactPerson,
      contactEmail,
      contactPhone,
      demoSubscriptionPlan,
      notes,
    });

    return NextResponse.json({
      success: true,
      message: `Referral registered for ${societyName}. Tracking progress.`,
      referral,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to register referral";
    console.error("[Partner Referrals POST Error]", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
