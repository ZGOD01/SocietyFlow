import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/session";
import { connectDB } from "@/lib/db";
import {
  SocietyMembership,
  FlatOccupancy,
  DocumentModel,
} from "@/models";
import { COMMITTEE_ROLES, MembershipRole } from "@/lib/rbac";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const activeSocietyId =
      session.activeSocietyId || session.memberships?.[0]?.societyId;

    if (!activeSocietyId) {
      return NextResponse.json({ error: "No active society found." }, { status: 400 });
    }

    const isManagement = session.isSuperAdmin || session.memberships?.some(
      (m) =>
        m.societyId === activeSocietyId &&
        m.status === "VERIFIED" &&
        COMMITTEE_ROLES.includes(m.role as MembershipRole)
    );

    if (!isManagement) {
      return NextResponse.json(
        { error: "Forbidden: Management privileges required to view resident directory." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const tab = searchParams.get("tab") || "ALL"; // "ALL" | "OWNERS" | "TENANTS" | "PENDING" | "INACTIVE"
    const search = searchParams.get("search")?.trim().toLowerCase();
    const wingId = searchParams.get("wingId");

    // Build query for memberships
    const membershipQuery: Record<string, unknown> = {
      societyId: activeSocietyId,
    };

    if (tab === "OWNERS") {
      membershipQuery.role = "OWNER";
      membershipQuery.status = "VERIFIED";
    } else if (tab === "TENANTS") {
      membershipQuery.role = "TENANT";
      membershipQuery.status = "VERIFIED";
    } else if (tab === "PENDING") {
      membershipQuery.status = "PENDING";
    } else if (tab === "INACTIVE") {
      membershipQuery.status = { $in: ["REJECTED", "SUSPENDED"] };
    }

    const [memberships, allOccupancies, allPropertyDocs] = await Promise.all([
      SocietyMembership.find(membershipQuery)
        .populate("userId", "name email phone avatarUrl onboardingStatus createdAt")
        .sort({ createdAt: -1 })
        .lean(),
      FlatOccupancy.find({ societyId: activeSocietyId })
        .populate({
          path: "flatId",
          populate: { path: "wingId", select: "name" },
        })
        .lean(),
      DocumentModel.find({
        societyId: activeSocietyId,
        scope: "PROPERTY",
        isArchived: false,
      }).lean(),
    ]);

    interface PopulatedUserRef {
      _id: { toString(): string };
      name?: string;
      email?: string;
      phone?: string;
      avatarUrl?: string;
      onboardingStatus?: string;
      createdAt?: string | Date;
    }

    interface PopulatedFlatRef {
      _id: { toString(): string };
      flatNumber?: string;
      floor?: number;
      wingId?: { _id: { toString(): string }; name?: string };
    }

    const residents = memberships
      .map((m) => {
        const u = m.userId as unknown as PopulatedUserRef | undefined;
        if (!u) return null;

        // Find active or matching occupancy
        const userOccs = allOccupancies.filter(
          (o) => o.userId?.toString() === u._id.toString()
        );
        const activeOcc = userOccs.find((o) => o.status === "APPROVED") || userOccs[0];
        const flatObj = activeOcc?.flatId as unknown as PopulatedFlatRef | undefined;

        // Compute onboarding document status
        const userDocs = allPropertyDocs.filter(
          (d) => d.ownerUserId?.toString() === u._id.toString()
        );

        let docStatus = "NOT_STARTED";
        if (u.onboardingStatus === "COMPLETED") {
          docStatus = "COMPLETED";
        } else if (userDocs.length > 0) {
          const hasCorrection = userDocs.some(
            (d) => d.verificationStatus === "CORRECTION_REQUESTED"
          );
          docStatus = hasCorrection ? "CORRECTION_REQUESTED" : "PENDING_REVIEW";
        }

        return {
          id: m._id.toString(),
          userId: u._id.toString(),
          name: u.name || "Resident",
          email: u.email || "",
          phone: u.phone || "+91 98765 43210",
          avatarUrl: u.avatarUrl,
          role: m.role,
          membershipStatus: m.status,
          enrollmentDate: m.createdAt
            ? new Date(m.createdAt).toISOString()
            : u.createdAt
            ? new Date(u.createdAt).toISOString()
            : new Date().toISOString(),
          flat: flatObj
            ? {
                id: flatObj._id.toString(),
                flatNumber: flatObj.flatNumber || "N/A",
                floor: flatObj.floor || 1,
                wingName: flatObj.wingId?.name || "Wing A",
                wingId: flatObj.wingId?._id?.toString(),
              }
            : null,
          occupancyType: activeOcc?.occupancyType || m.role,
          documentStatus: docStatus,
          documentCount: userDocs.length,
          leaseDates:
            activeOcc?.leaseStartDate && activeOcc?.leaseEndDate
              ? {
                  start: new Date(activeOcc.leaseStartDate).toISOString(),
                  end: new Date(activeOcc.leaseEndDate).toISOString(),
                }
              : undefined,
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null)
      .filter((r) => {
        if (wingId && wingId !== "ALL" && r.flat?.wingId !== wingId) {
          return false;
        }
        if (search) {
          return (
            r.name.toLowerCase().includes(search) ||
            r.email.toLowerCase().includes(search) ||
            (r.flat?.flatNumber && r.flat.flatNumber.toLowerCase().includes(search)) ||
            (r.flat?.wingName && r.flat.wingName.toLowerCase().includes(search))
          );
        }
        return true;
      });

    // Counts for tabs
    const allMembers = await SocietyMembership.find({ societyId: activeSocietyId }).lean();
    const counts = {
      all: allMembers.length,
      owners: allMembers.filter((m) => m.role === "OWNER" && m.status === "VERIFIED").length,
      tenants: allMembers.filter((m) => m.role === "TENANT" && m.status === "VERIFIED").length,
      pending: allMembers.filter((m) => m.status === "PENDING").length,
      inactive: allMembers.filter((m) => ["REJECTED", "SUSPENDED"].includes(m.status)).length,
    };

    return NextResponse.json({
      success: true,
      counts,
      residents,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load residents registry";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
