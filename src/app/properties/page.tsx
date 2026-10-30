"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PropertiesPage() {
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (!data.authenticated || !data.user) {
          router.replace("/login?redirect=/properties");
          return;
        }

        const user = data.user;
        const committeeRoles = [
          "SECRETARY",
          "CHAIRMAN",
          "TREASURER",
          "COMMITTEE_MEMBER",
          "SOCIETY_MANAGER",
        ];

        const isManagement =
          user.isSuperAdmin ||
          (user.activeRole && committeeRoles.includes(user.activeRole)) ||
          user.memberships?.some(
            (m: any) =>
              m.status === "VERIFIED" && committeeRoles.includes(m.role)
          );

        if (isManagement) {
          router.replace("/management/flats");
        } else {
          router.replace("/my-flat");
        }
      })
      .catch(() => {
        router.replace("/dashboard");
      });
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center bg-[#F8F9FA]">
      <div className="flex items-center gap-3 text-sm text-[#71717A]">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#4F46E5] border-t-transparent" />
        <span>Navigating to property units...</span>
      </div>
    </div>
  );
}
