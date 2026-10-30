import { NextResponse } from "next/server";
import { clearSessionCookie, getServerSession, SESSION_COOKIE_NAME } from "@/lib/session";
import { AuditEvent } from "@/models";
import { connectDB } from "@/lib/db";

export async function POST() {
  try {
    const session = await getServerSession();

    if (session) {
      try {
        await connectDB();
        await AuditEvent.create({
          userId: session.id,
          action: "AUTH_LOGOUT",
          details: { email: session.email },
        });
      } catch (e) {
        // Log error silently, do not prevent logout
        console.warn("[Auth API] Failed to record logout audit event:", e);
      }
    }

    await clearSessionCookie();

    const response = NextResponse.json({
      success: true,
      message: "Logged out successfully.",
    });

    // Explicitly delete cookie on response with Path=/
    response.cookies.set(SESSION_COOKIE_NAME, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
      expires: new Date(0),
    });

    return response;
  } catch (err: unknown) {
    const error = err as Error;
    console.error("[Auth API] Logout error:", error);

    // Even if an unexpected error occurred, force wipe the session cookie
    const response = NextResponse.json(
      { error: error.message || "Failed to log out cleanly, but session cleared." },
      { status: 500 }
    );

    response.cookies.set(SESSION_COOKIE_NAME, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
      expires: new Date(0),
    });

    return response;
  }
}
