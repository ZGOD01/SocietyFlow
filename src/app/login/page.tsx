"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import {
  FormField,
  AppButton,
  IonIcon,
  Modal,
} from "@/components/ui";
import { loginSchema } from "@/modules/auth/schema";

interface LoginErrors {
  email?: string;
  password?: string;
}

type RoleTab = "OWNER" | "TENANT" | "COMMITTEE" | "AUDITOR" | "SUPER_ADMIN";

const ROLE_INFO: Record<
  RoleTab,
  {
    label: string;
    icon: string;
    badge: string;
    placeholder: string;
    helper: string;
    dashboardRoute: string;
  }
> = {
  OWNER: {
    label: "Flat Owner",
    icon: "home-outline",
    badge: "Title Deed & Unit Vault",
    placeholder: "e.g. resident@society.com",
    helper: "Use your registered flat owner email to access your title vault and NOC requests",
    dashboardRoute: "/dashboard",
  },
  TENANT: {
    label: "Tenant",
    icon: "key-outline",
    badge: "Registered Tenant",
    placeholder: "e.g. tenant@domain.com",
    helper: "Use your lease-registered email to view rental records and pass requests",
    dashboardRoute: "/dashboard?view=tenant",
  },
  COMMITTEE: {
    label: "Committee",
    icon: "shield-checkmark-outline",
    badge: "Executive Desk",
    placeholder: "e.g. secretary@society.com",
    helper: "Secretary, Chairman, or Treasurer authorized society console email",
    dashboardRoute: "/management/dashboard",
  },
  AUDITOR: {
    label: "Auditor",
    icon: "document-text-outline",
    badge: "Statutory Desk",
    placeholder: "e.g. auditor@firm.com",
    helper: "Certified cooperative society auditor or empanelled legal partner email",
    dashboardRoute: "/partner/dashboard",
  },
  SUPER_ADMIN: {
    label: "Super Admin",
    icon: "shield-outline",
    badge: "Root Platform Authority",
    placeholder: "e.g. admin@platform.com",
    helper: "Root administrator credentials for global multi-tenant cluster management and oversight",
    dashboardRoute: "/admin/dashboard",
  },
};

export default function LoginPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<RoleTab>("OWNER");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<LoginErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [sessionExpiredNotice, setSessionExpiredNotice] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [activeSession, setActiveSession] = useState<{
    name: string;
    email: string;
    activeRole?: string;
    isSuperAdmin?: boolean;
    isPartner?: boolean;
  } | null>(null);

  useEffect(() => {
    const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    const isSwitch = params?.get("switch") === "true" || params?.get("logout") === "true";
    const isExpired = params?.get("reason") === "session_expired" || params?.get("reason") === "timeout";

    if (isExpired) {
      setSessionExpiredNotice(true);
      fetch("/api/auth/logout", { method: "POST" })
        .then(() => setActiveSession(null))
        .catch(() => {});
    } else if (isSwitch) {
      // Clear server session when switching accounts
      fetch("/api/auth/logout", { method: "POST" })
        .then(() => setActiveSession(null))
        .catch(() => {});
    } else {
      // Check if user is already authenticated
      fetch("/api/auth/session")
        .then((res) => res.json())
        .then((data) => {
          if (data.authenticated && data.user) {
            setActiveSession(data.user);
          }
        })
        .catch(() => {});
    }
  }, []);

  const handleRoleSelect = (role: RoleTab) => {
    setSelectedRole(role);
    setServerError(null);
    if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
    if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    const result = loginSchema.safeParse({
      email,
      password,
      rememberMe,
    });

    if (!result.success) {
      const fieldErrors: LoginErrors = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof LoginErrors;
        fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, rememberMe }),
      });

      const data = await res.json();

      if (!res.ok) {
        setServerError(
          data.error || "Authentication failed. Please verify your email and password."
        );
        setIsSubmitting(false);
        return;
      }

      // Hard navigation ensures fresh cookies and state across role dashboards
      window.location.href = data.redirectUrl || "/dashboard";
    } catch {
      setServerError("Unable to reach authentication server. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#F8F9FA] text-[#1A1A1A] flex flex-col justify-between overflow-x-hidden">
      {/* Top Floating Navigation Header */}
      <header className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 pt-5 sm:pt-6 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white text-[#1A1A1A] text-xs font-semibold border border-[#E5E7EB] shadow-[0_1px_2px_rgba(0,0,0,0.05)] hover:border-[#4F46E5] hover:text-[#4F46E5] transition-all"
        >
          <IonIcon name="arrow-back-outline" size={14} />
          <span>Back to Overview</span>
        </Link>

        {/* Brand Lockup */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-xl bg-[#4F46E5] text-white flex items-center justify-center font-bold text-base font-heading shadow-xs group-hover:scale-105 transition-transform">
            S
          </div>
          <span className="font-heading font-black text-lg tracking-[0.18em] text-[#1A1A1A] uppercase">
            SOCIETY<span className="text-[#4F46E5]">FLOW</span>
          </span>
        </Link>

        {/* Statutory Trust Chip */}
        <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ECFDF5] text-[#10B981] text-[11px] font-bold border border-[#A7F3D0]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
          <span>MCS Act 1960 Aligned</span>
        </div>
      </header>

      {/* Main Content: Centered Auth Showcase */}
      <main className="relative z-10 w-full max-w-xl mx-auto px-4 sm:px-6 py-8 sm:py-12 flex flex-col items-center justify-center my-auto">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="w-full"
        >
          {/* Main Card */}
          <div className="rounded-2xl bg-white border border-[#E5E7EB] shadow-[0_4px_24px_-2px_rgba(0,0,0,0.06)] overflow-hidden p-6 sm:p-9">
            {/* Header Lockup */}
            <div className="text-center space-y-2 mb-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EEF2FF] border border-[#C7D2FE] text-[#4F46E5] text-[11px] font-bold uppercase tracking-wider">
                <IonIcon name="lock-closed-outline" size={13} />
                <span>Secured Society Vault Access</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black font-heading uppercase tracking-tight text-[#1A1A1A]">
                Welcome Back
              </h1>
              <p className="text-xs sm:text-sm text-[#6B7280] max-w-md mx-auto leading-relaxed">
                Enter your credentials to securely access your housing society records, unit deeds, and digital approvals.
              </p>
            </div>

            {/* Active Session Notification / Switcher Banner */}
            {activeSession && (
              <div className="mb-6 p-4 rounded-xl border border-[#C7D2FE] bg-[#EEF2FF] text-xs text-[#1A1A1A] space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <IonIcon name="shield-checkmark" size={18} className="text-[#4F46E5] shrink-0" />
                    <div>
                      <span className="font-bold text-[#1A1A1A]">Currently Logged In: </span>
                      <span className="text-[#4F46E5] font-semibold">{activeSession.name}</span>
                      <p className="text-[11px] text-[#6B7280]">
                        {activeSession.email} • Role:{" "}
                        <strong className="text-[#1A1A1A]">
                          {activeSession.isSuperAdmin ? "Platform Super Admin" : activeSession.activeRole || "Member"}
                        </strong>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1 border-t border-[#C7D2FE]/60">
                  <Link
                    href={
                      activeSession.isSuperAdmin
                        ? "/admin/dashboard"
                        : activeSession.isPartner
                        ? "/partner/dashboard"
                        : "/dashboard"
                    }
                    className="px-3 py-1.5 text-xs font-bold rounded-lg bg-[#4F46E5] text-white hover:bg-[#4338CA] transition-colors"
                  >
                    Go to {activeSession.isSuperAdmin ? "Super Admin" : "Dashboard"} →
                  </Link>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await fetch("/api/auth/logout", { method: "POST" });
                      } finally {
                        setActiveSession(null);
                        setEmail("");
                        setPassword("");
                      }
                    }}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-[#E5E7EB] text-[#F43F5E] hover:bg-[#FFF1F2] transition-colors cursor-pointer"
                  >
                    Sign Out to Login as Different User
                  </button>
                </div>
              </div>
            )}

            {/* Role Context Selector (Tabs) */}
            <div className="mb-6">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6B7280] mb-2 text-center">
                Select Your Role Portal:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 p-1 rounded-xl bg-[#F8F9FA] border border-[#E5E7EB]">
                {(Object.keys(ROLE_INFO) as RoleTab[]).map((role) => {
                  const info = ROLE_INFO[role];
                  const isSelected = selectedRole === role;
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => handleRoleSelect(role)}
                      className={`relative py-2 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        isSelected
                          ? "bg-white text-[#4F46E5] shadow-xs border border-[#E5E7EB] font-bold"
                          : "text-[#6B7280] hover:text-[#1A1A1A] hover:bg-white/60"
                      }`}
                    >
                      <IonIcon
                        name={info.icon}
                        size={14}
                        className={isSelected ? "text-[#4F46E5]" : "text-[#9CA3AF]"}
                      />
                      <span className="truncate">{info.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Dynamic Role Helper Note */}
              <div className="mt-2 text-center">
                <span className="text-[11px] text-[#6B7280]">
                  Portal Scope:{" "}
                  <strong className="text-[#1A1A1A]">{ROLE_INFO[selectedRole].badge}</strong>
                </span>
              </div>
            </div>

            {/* Session Expired Notice */}
            {sessionExpiredNotice && (
              <div className="mb-5 p-3.5 rounded-xl border border-[#FDE68A] bg-[#FEF3C7] text-xs text-[#92400E] flex items-start gap-2.5 shadow-sm animate-in fade-in duration-300">
                <IonIcon name="time-outline" size={18} className="text-[#D97706] shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold block text-[#78350F]">Session Timed Out</span>
                  <p className="text-[11px] text-[#92400E] leading-relaxed">
                    Your login session has expired due to time elapsed / inactivity. The account has been logged out for your security. Please log in again to continue.
                  </p>
                </div>
              </div>
            )}

            {/* Server Error Alert */}
            {serverError && (
              <div className="mb-5 p-3.5 rounded-xl border border-[#FECDD3] bg-[#FFF1F2] text-xs text-[#9F1239] flex items-start gap-2.5">
                <IonIcon name="alert-circle" size={17} className="text-[#F43F5E] shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold block text-[#9F1239]">Authentication Notice</span>
                  <p className="text-[11px] text-[#BE123C] leading-relaxed">{serverError}</p>
                </div>
              </div>
            )}

            {/* Authentication Form */}
            <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
              <div>
                <FormField
                  label="Registered Society Email"
                  type="email"
                  name="user_email"
                  autoComplete="new-password"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                    if (serverError) setServerError(null);
                  }}
                  placeholder={ROLE_INFO[selectedRole].placeholder}
                  leftIcon="mail-outline"
                  required
                  error={errors.email}
                  helperText={ROLE_INFO[selectedRole].helper}
                />
              </div>

              <div>
                <FormField
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  name="user_password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                    if (serverError) setServerError(null);
                  }}
                  placeholder="Enter your password"
                  leftIcon="lock-closed-outline"
                  rightIcon={showPassword ? "eye-off-outline" : "eye-outline"}
                  onRightIconClick={() => setShowPassword(!showPassword)}
                  required
                  error={errors.password}
                  helperText="Minimum 8 characters"
                />
              </div>

              {/* Remember Me & Forgot Password Row */}
              <div className="flex items-center justify-between text-xs text-[#6B7280] pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none group">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="accent-[#4F46E5] rounded w-4 h-4 cursor-pointer"
                  />
                  <span className="group-hover:text-[#1A1A1A] transition-colors">
                    Remember on this device
                  </span>
                </label>

                <button
                  type="button"
                  onClick={() => setShowForgotPasswordModal(true)}
                  className="text-[#4F46E5] hover:underline font-semibold cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>

              {/* Submit Button */}
              <AppButton
                type="submit"
                variant="hero"
                size="md"
                className="w-full mt-2"
                pill={false}
                disabled={isSubmitting}
                rightIcon={isSubmitting ? undefined : "arrow-forward-outline"}
                leftIcon={isSubmitting ? "sync-outline" : undefined}
              >
                {isSubmitting ? "Signing In..." : "Sign In to Society Vault"}
              </AppButton>
            </form>
            

            {/* Switch to Registration */}
            <div className="text-center pt-5 text-xs text-[#6B7280]">
              New society, flat owner, or committee member?{" "}
              <Link
                href="/register"
                className="text-[#4F46E5] font-bold hover:underline"
              >
                Register Your Society / Account →
              </Link>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Footer Notice */}
      <footer className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 py-5 text-center text-xs text-[#6B7280] flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-[#E5E7EB]">
        <span>© 2026 SocietyFlow Statutory Governance Platform. All rights reserved.</span>
        <div className="flex items-center gap-4 text-[#9CA3AF] text-[11px]">
          <Link href="/" className="hover:text-[#1A1A1A]">
            Landing Page
          </Link>
          <span>•</span>
          <Link href="/register" className="hover:text-[#1A1A1A]">
            Registration
          </Link>
          <span>•</span>
          <Link href="/dashboard" className="hover:text-[#1A1A1A]">
            Dashboards
          </Link>
        </div>
      </footer>

      {/* Forgot Password Modal */}
      <Modal
        isOpen={showForgotPasswordModal}
        onClose={() => setShowForgotPasswordModal(false)}
        title="Password Recovery"
        description="Self-service recovery for registered society members"
        footer={
          <div className="flex items-center justify-end w-full">
            <AppButton
              variant="primary"
              size="sm"
              onClick={() => setShowForgotPasswordModal(false)}
            >
              Understood
            </AppButton>
          </div>
        }
      >
        <div className="space-y-3 text-xs text-[#6B7280] leading-relaxed">
          <p>
            Housing society accounts are tied to verified flat ownership or tenancy records under MCS Act 1960.
          </p>
          <div className="p-3.5 rounded-xl border border-[#E5E7EB] bg-[#F8F9FA] space-y-1.5 text-[#1A1A1A]">
            <div className="font-bold">Recovery Procedures:</div>
            <ul className="list-disc pl-4 space-y-1 text-[11px] text-[#4B5563]">
              <li>
                <strong>Flat Owners &amp; Tenants:</strong> Request a reset link sent to your registered email address or contact your society honorary secretary.
              </li>
              <li>
                <strong>Committee Members:</strong> Secondary verification via registered mobile number or society general body resolution.
              </li>
            </ul>
          </div>
          <p className="text-[11px] text-[#9CA3AF]">
            Self-service password recovery is enabled for registered society emails.
          </p>
        </div>
      </Modal>
    </div>
  );
}
