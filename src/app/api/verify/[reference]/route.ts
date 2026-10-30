import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { GeneratedDocument } from "@/models/GeneratedDocument";
import { Society } from "@/models/Society";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  try {
    const { reference } = await params;
    if (!reference) {
      return NextResponse.json({ error: "Verification reference required" }, { status: 400 });
    }

    await connectDB();

    // Query by verificationToken OR documentRef
    const doc = await GeneratedDocument.findOne({
      $or: [{ verificationToken: reference }, { documentRef: reference }],
    });

    if (!doc) {
      return NextResponse.json(
        {
          success: false,
          verified: false,
          error: "Document record not found in SocietyFlow registry.",
          message: "The requested document reference does not exist or has been decommissioned.",
        },
        { status: 404 }
      );
    }

    // Increment verification count
    doc.verificationCount = (doc.verificationCount || 0) + 1;
    doc.lastVerifiedAt = new Date();
    await doc.save();

    const society = await Society.findById(doc.societyId)
      .select("name registrationNumber address city state")
      .lean();

    // STRICT PRIVACY PROTECTION (Section 13):
    // Never expose resident identity documents, full personal phone/email, financial records,
    // or direct private download links to unauthenticated public visitors.
    return NextResponse.json({
      success: true,
      verified: true,
      record: {
        documentRef: doc.documentRef,
        documentType: doc.documentType,
        title: doc.title,
        issueDate: doc.issuedAt,
        issuingSociety: {
          name: society?.name || "Registered Housing Society",
          registrationNumber: society?.registrationNumber || "Registered Co-operative",
          city: society?.city || "",
          state: society?.state || "",
        },
        authorizedSignatory: {
          name: doc.issuedByName,
          role: doc.issuedByRole,
        },
        status: "VALID_REGISTERED_RECORD",
        isDemonstrationPrototype: doc.isDemonstrationPrototype,
        verificationCount: doc.verificationCount,
        disclaimer:
          "DEMONSTRATION PROTOTYPE: This record verifies the presence of an electronically generated workflow artifact in SocietyFlow. It does not constitute a statutory electronic signature under the Information Technology Act.",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Verification check failed";
    console.error("[Public QR Verification Error]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
