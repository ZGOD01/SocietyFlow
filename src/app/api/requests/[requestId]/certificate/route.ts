import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { getServerSession } from "@/lib/session";
import { connectDB } from "@/lib/db";
import { ServiceRequest } from "@/models/ServiceRequest";
import { generatePresignedDownloadUrl } from "@/lib/r2";
import { COMMITTEE_ROLES, MembershipRole } from "@/lib/rbac";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { requestId } = await params;
    await connectDB();

    const requestDoc = await ServiceRequest.findOne({
      $or: [
        { requestId },
        { _id: Types.ObjectId.isValid(requestId) ? new Types.ObjectId(requestId) : null },
      ],
    });

    if (!requestDoc) {
      return NextResponse.json({ error: "Service request not found" }, { status: 404 });
    }

    // Authorization check:
    // User must be:
    // 1. The original applicant
    // 2. The flat owner
    // 3. A verified committee member of the request's society
    // 4. Super Admin
    const isApplicant = requestDoc.applicantUserId.toString() === session.id;
    const isOwner = requestDoc.ownerAuthorization?.ownerUserId?.toString() === session.id;
    const isCommitteeOfSociety = session.memberships?.some(
      (m) =>
        m.societyId === requestDoc.societyId.toString() &&
        m.status === "VERIFIED" &&
        COMMITTEE_ROLES.includes(m.role as MembershipRole)
    );

    if (!session.isSuperAdmin && !isApplicant && !isOwner && !isCommitteeOfSociety) {
      return NextResponse.json(
        { error: "Forbidden: You are not authorized to download this document" },
        { status: 403 }
      );
    }

    if (!requestDoc.generatedDocument?.r2ObjectKey) {
      return NextResponse.json(
        { error: "No certificate has been generated for this request yet" },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(req.url);
    const disposition = searchParams.get("disp") === "attachment" ? "attachment" : "inline";

    const { downloadUrl, isFallback } = await generatePresignedDownloadUrl({
      r2ObjectKey: requestDoc.generatedDocument.r2ObjectKey,
      displayName: requestDoc.generatedDocument.originalFilename,
      disposition,
      expiresInSeconds: 900, // 15 mins
    });

    return NextResponse.json({
      success: true,
      downloadUrl,
      isFallback,
      documentRef: requestDoc.generatedDocument.documentRef,
      documentType: requestDoc.generatedDocument.documentType,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to generate certificate download link";
    console.error("[Certificate Download Link Error]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
