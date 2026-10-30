import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/session";
import { connectDB } from "@/lib/db";
import { DocumentModel, DocumentAuditEvent } from "@/models";
import { getObjectDirect } from "@/lib/r2";
import { COMMITTEE_ROLES, MembershipRole } from "@/lib/rbac";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");
    const filename = searchParams.get("filename") || "document";
    const disposition = searchParams.get("disp") === "attachment" ? "attachment" : "inline";

    if (!key) {
      return NextResponse.json({ error: "Missing storage object key" }, { status: 400 });
    }

    await connectDB();

    // Find document record in database to verify permissions
    const doc = await DocumentModel.findOne({ r2ObjectKey: key, isArchived: false });
    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Permission Verification
    const isOwner = doc.ownerUserId.toString() === session.id;
    const isSuperAdmin = session.isSuperAdmin;
    const isSameSociety = doc.societyId && session.activeSocietyId && doc.societyId.toString() === session.activeSocietyId;
    const isManagement = isSameSociety && session.memberships?.some(
      (m) =>
        m.status === "VERIFIED" &&
        COMMITTEE_ROLES.includes(m.role as MembershipRole)
    );

    let hasAccess = false;

    if (isSuperAdmin || isOwner) {
      hasAccess = true;
    } else if (doc.scope === "PRIVATE") {
      hasAccess = false; // Never allow management access to unshared private files
    } else if (doc.scope === "PROPERTY") {
      // Management of the same society can view property records
      if (isManagement) {
        hasAccess = true;
      }
    } else if (doc.scope === "SOCIETY") {
      if (isSameSociety) {
        if (doc.visibility === "ALL_RESIDENTS") hasAccess = true;
        else if (doc.visibility === "OWNERS_ONLY" && (session.activeRole === "OWNER" || isManagement)) hasAccess = true;
        else if (doc.visibility === "TENANTS_ONLY" && (session.activeRole === "TENANT" || isManagement)) hasAccess = true;
        else if (doc.visibility === "MANAGEMENT_ONLY" && isManagement) hasAccess = true;
      }
    }

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to access this document." },
        { status: 403 }
      );
    }

    // Retrieve file buffer
    const fileData = await getObjectDirect(key);
    if (!fileData) {
      return NextResponse.json(
        { error: "Object data could not be retrieved from storage." },
        { status: 404 }
      );
    }

    // Audit Event
    await DocumentAuditEvent.create({
      documentId: doc._id,
      userId: session.id,
      action: disposition === "attachment" ? "DOWNLOAD" : "VIEW",
      ipAddress: req.headers.get("x-forwarded-for") || undefined,
      userAgent: req.headers.get("user-agent") || undefined,
      details: {
        filename,
        scope: doc.scope,
      },
    });

    const safeFilename = filename.replace(/[^\w.-]/g, "_");
    const headers = new Headers();
    headers.set("Content-Type", fileData.mimeType);
    headers.set("Content-Disposition", `${disposition}; filename="${safeFilename}"`);
    headers.set("Content-Length", fileData.buffer.length.toString());
    headers.set("Cache-Control", "private, no-cache, no-store, max-age=0");

    return new NextResponse(fileData.buffer as unknown as BodyInit, {
      status: 200,
      headers,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to stream document";
    console.error("[Download Stream Error]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
