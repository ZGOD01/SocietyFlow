import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Society } from "@/models";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.json(
        { error: "Society code query parameter is required" },
        { status: 400 }
      );
    }

    await connectDB();

    const society = await Society.findOne({
      code: code.trim().toUpperCase(),
      status: "ACTIVE",
    })
      .select("name code registrationNumber city state")
      .lean();

    if (!society) {
      return NextResponse.json(
        { error: "Society not found with specified code", found: false },
        { status: 404 }
      );
    }

    return NextResponse.json({
      found: true,
      society,
    });
  } catch (err: unknown) {
    const error = err as Error;
    const isPrerenderBailout =
      typeof err === "object" && err !== null && "digest" in err;
    if (!isPrerenderBailout) {
      console.error("[Society API] Lookup error:", error);
    }
    return NextResponse.json(
      { error: error.message || "Failed to lookup society", found: false },
      { status: 500 }
    );
  }
}
