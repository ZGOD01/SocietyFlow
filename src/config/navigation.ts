import { NavItem } from "@/types";

export const APP_NAV_ITEMS: NavItem[] = [
  // ──────────────────────────────────────────────
  // SUPER ADMIN ONLY: Strictly 2 minimal tabs requested
  // ──────────────────────────────────────────────
  {
    title: "Society Profile",
    href: "/admin/dashboard",
    iconName: "business-outline",
    allowedRoles: ["SUPER_ADMIN"],
    description: "Registered societies, locations, and wings",
  },
  {
    title: "Requests",
    href: "/admin/requests",
    iconName: "document-text-outline",
    allowedRoles: ["SUPER_ADMIN"],
    description: "All requests and approvals across registered societies",
  },

  // ──────────────────────────────────────────────
  // SHARED: Committee, Resident & Auditor
  // ──────────────────────────────────────────────
  {
    title: "Overview",
    href: "/dashboard",
    iconName: "grid-outline",
    allowedRoles: ["SOCIETY_ADMIN", "RESIDENT_OWNER", "TENANT", "AUDITOR_PARTNER"],
    description: "Personal and society status overview",
  },
  {
    title: "Profile",
    href: "/profile",
    iconName: "person-outline",
    allowedRoles: ["RESIDENT_OWNER", "TENANT", "SOCIETY_ADMIN", "AUDITOR_PARTNER"],
    description: "Personal credentials, registration specifications, and flat association",
  },

  // ──────────────────────────────────────────────
  // SOCIETY MANAGEMENT (Committee Officers)
  // ──────────────────────────────────────────────
  {
    title: "Management Console",
    href: "/management/dashboard",
    iconName: "shield-checkmark-outline",
    badge: "Mgmt",
    allowedRoles: ["SOCIETY_ADMIN"],
    description: "Managing committee oversight, approvals and verifications",
  },
  {
    title: "Flats & Residents",
    href: "/management/flats",
    iconName: "business-outline",
    allowedRoles: ["SOCIETY_ADMIN"],
    description: "Buildings, wings, flats and resident directory",
  },
  {
    title: "Approvals",
    href: "/management/approvals",
    iconName: "checkmark-done-circle-outline",
    allowedRoles: ["SOCIETY_ADMIN"],
    description: "Registration approvals and service request decisions",
  },
  {
    title: "Request Inbox",
    href: "/management/requests",
    iconName: "mail-unread-outline",
    allowedRoles: ["SOCIETY_ADMIN"],
    description: "Review submitted service requests from residents",
  },
  {
    title: "Society Profile",
    href: "/management/society",
    iconName: "information-circle-outline",
    allowedRoles: ["SOCIETY_ADMIN"],
    description: "Society identity, registration details and governance",
  },

  // ──────────────────────────────────────────────
  // RESIDENT (Owner & Tenant)
  // ──────────────────────────────────────────────
  {
    title: "My Flat",
    href: "/my-flat",
    iconName: "home-outline",
    allowedRoles: ["RESIDENT_OWNER", "TENANT"],
    description: "Your flat profile, title deeds and lease information",
  },
  {
    title: "My Documents",
    href: "/documents",
    iconName: "folder-open-outline",
    allowedRoles: ["RESIDENT_OWNER", "TENANT"],
    description: "Your verified unit agreements and certificates",
  },
  {
    title: "Services",
    href: "/services",
    iconName: "construct-outline",
    allowedRoles: ["RESIDENT_OWNER", "TENANT"],
    description: "Browse society service catalogue and apply for NOCs",
  },
  {
    title: "My Requests",
    href: "/requests",
    iconName: "document-text-outline",
    allowedRoles: ["RESIDENT_OWNER", "TENANT"],
    description: "Track your NOC and service applications",
  },

  // ──────────────────────────────────────────────
  // SHARED LIBRARY & NOTIFICATIONS
  // ──────────────────────────────────────────────
  {
    title: "Society Library",
    href: "/society-documents",
    iconName: "library-outline",
    allowedRoles: ["SOCIETY_ADMIN", "AUDITOR_PARTNER"],
    description: "Bylaws, minutes, audit reports, and notices",
  },
  {
    title: "Notifications",
    href: "/notifications",
    iconName: "notifications-outline",
    allowedRoles: ["SOCIETY_ADMIN", "AUDITOR_PARTNER"],
    description: "Notification center and alert history",
  },

  // ──────────────────────────────────────────────
  // AUDITOR / PARTNER
  // ──────────────────────────────────────────────
  {
    title: "Partner / Auditor",
    href: "/partner/dashboard",
    iconName: "briefcase-outline",
    badge: "Partner",
    allowedRoles: ["AUDITOR_PARTNER"],
    description: "Audit oversight and society referral tracking desk",
  },

  // ──────────────────────────────────────────────
  // SETTINGS (Non-superadmin roles)
  // ──────────────────────────────────────────────
  {
    title: "Settings",
    href: "/settings",
    iconName: "settings-outline",
    allowedRoles: ["SOCIETY_ADMIN", "AUDITOR_PARTNER"],
    description: "Profile, security, and notification settings",
  },
];
