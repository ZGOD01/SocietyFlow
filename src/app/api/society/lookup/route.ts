import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Society } from "@/models";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code") || searchParams.get("q") || "";

    await connectDB();

    if (!code.trim()) {
      // Return list of all active registered societies
      const societies = await Society.find({ status: "ACTIVE" })
        .select("name code registrationNumber resolutionNumber inviteToken city state totalWings totalFlats")
        .sort({ name: 1 })
        .limit(30)
        .lean();

      return NextResponse.json({
        found: true,
        societies,
      });
    }

    const raw = code.trim();
    const escaped = raw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const exactRegex = new RegExp(`^${escaped}$`, "i");
    const partialRegex = new RegExp(escaped, "i");

    let society = await Society.findOne({
      status: "ACTIVE",
      $or: [
        { code: raw },
        { code: raw.toUpperCase() },
        { code: exactRegex },
        { registrationNumber: raw },
        { registrationNumber: raw.toUpperCase() },
        { registrationNumber: exactRegex },
        { resolutionNumber: raw },
        { resolutionNumber: raw.toUpperCase() },
        { resolutionNumber: exactRegex },
        { inviteToken: raw },
        { inviteToken: raw.toUpperCase() },
        { inviteToken: exactRegex },
        { name: exactRegex },
      ],
    })
      .select("name code registrationNumber resolutionNumber inviteToken city state totalWings totalFlats")
      .lean();

    if (!society) {
      // Try partial name match
      society = await Society.findOne({
        status: "ACTIVE",
        name: partialRegex,
      })
        .select("name code registrationNumber resolutionNumber inviteToken city state totalWings totalFlats")
        .lean();
    }

    if (!society) {
      return NextResponse.json(
        { error: `No active society found matching "${raw}". Please verify the Society Code, Registration ID, or Token with your society office.`, found: false },
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
