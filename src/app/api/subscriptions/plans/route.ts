import { NextResponse } from "next/server";
import { getAllSubscriptionPlans } from "@/lib/subscriptions/subscription-service";

export async function GET() {
  try {
    const plans = await getAllSubscriptionPlans();
    return NextResponse.json({ plans });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load subscription plans";
    console.error("[Subscription Plans GET Error]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
