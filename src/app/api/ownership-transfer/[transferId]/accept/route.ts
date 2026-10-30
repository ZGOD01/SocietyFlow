import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/session";
import { respondToTransferInvitation } from "@/lib/ownership/transfer-service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ transferId: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { transferId } = await params;
    const body = await req.json();
    const { accept, comments } = body;

    const transfer = await respondToTransferInvitation(
      { id: session.id, email: session.email, name: session.name },
      transferId,
      accept !== false,
      comments
    );

    return NextResponse.json({
      success: true,
      message: accept !== false
        ? "Ownership transfer accepted successfully. Transferred to Society Management for document verification."
        : "Ownership transfer declined.",
      status: transfer.status,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to process invitation response";
    console.error("[Ownership Transfer Accept POST Error]", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
