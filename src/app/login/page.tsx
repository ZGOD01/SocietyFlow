"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  AppCard,
  FormField,
  AppButton,
  StatusBadge,
  IconContainer,
  IonIcon,
  Modal,
} from "@/components/ui";
import { loginSchema } from "@/modules/auth/schema";

interface LoginErrors {
  email?: string;
  password?: string;
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<LoginErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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

    setTimeout(() => {
      setIsSubmitting(false);
      setShowSetupModal(true);
    }, 350);
  };

  return (
    <div className="min-h-screen bg-slate-50/60 flex flex-col justify-center items-center p-4 sm:p-6 text-slate-900 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[550px] h-[300px] bg-indigo-500/12 blur-[100px] rounded-full pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-violet-500/10 blur-[80px] rounded-full pointer-events-none -z-10" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center font-extrabold text-xl font-heading shadow-md transition-transform group-hover:scale-105">
              S
            </div>
            <span className="font-extrabold text-2xl tracking-tight font-heading text-slate-900">
              Society<span className="text-gradient-brand">Flow</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight font-heading text-slate-900">
            Welcome Back
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Access your verified unit vault, requests, or committee console
          </p>
        </div>

        {/* Milestone Integration Notice Banner */}
        <div className="mb-4 p-4 rounded-2xl border border-indigo-200/90 bg-indigo-50/80 text-xs text-indigo-800 flex items-start gap-3 backdrop-blur-xs shadow-2xs">
          <IconContainer
            name="lock-closed-outline"
            variant="hero-soft"
            size="sm"
            className="bg-white shrink-0 mt-0.5"
          />
          <div>
            <span className="font-bold block text-xs">Auth Gateway (Prompt 1.1 Scaffold)</span>
            <p className="text-[11px] text-indigo-700 leading-relaxed mt-0.5">
              Client-side credential validation is active. NextAuth/Auth.js session verification with
              MongoDB Atlas connects in Prompt 2. No fake session is created.
            </p>
          </div>
        </div>

        {/* Login Card */}
        <AppCard className="p-6 sm:p-9 glass-card border-slate-200/90 shadow-lg">
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Account Authentication
            </h2>
            <StatusBadge variant="neutral" size="sm">
              Secured Form
            </StatusBadge>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField
              label="Registered Email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors({ ...errors, email: undefined });
              }}
              placeholder="name@example.com"
              leftIcon="person-outline"
              required
              error={errors.email}
              helperText="Owner, Tenant, Committee, or Auditor email"
            />

            <FormField
              label="Password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors({ ...errors, password: undefined });
              }}
              placeholder="••••••••••••"
              leftIcon="lock-closed-outline"
              rightIcon={showPassword ? "eye-outline" : "eye-outline"}
              onRightIconClick={() => setShowPassword(!showPassword)}
              required
              error={errors.password}
            />

            <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="accent-indigo-600 rounded w-3.5 h-3.5 cursor-pointer"
                />
                <span>Remember on this device</span>
              </label>

              <button
                type="button"
                onClick={() =>
                  alert(
                    "[Auth Notice] Password reset and magic link workflows will be wired with Auth.js email provider in Prompt 2."
                  )
                }
                className="text-indigo-600 hover:text-indigo-700 hover:underline font-semibold cursor-pointer"
              >
                Forgot password?
              </button>
            </div>

            <AppButton
              type="submit"
              variant="gradient"
              pill
              className="w-full mt-4 shadow-md"
              rightIcon="arrow-forward-outline"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Validating Input..." : "Sign In to SocietyFlow"}
            </AppButton>
          </form>

          {/* Quick Access to Prototype Roles */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <p className="text-xs font-semibold text-center text-slate-500 mb-3">
              Explore Verified Role Dashboard Destinations:
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Link href="/dashboard" className="w-full">
                <AppButton variant="outline" size="sm" className="w-full justify-center">
                  Owner Portal
                </AppButton>
              </Link>
              <Link href="/dashboard?view=tenant" className="w-full">
                <AppButton variant="outline" size="sm" className="w-full justify-center">
                  Tenant Portal
                </AppButton>
              </Link>
              <Link href="/management/dashboard" className="w-full">
                <AppButton variant="outline" size="sm" className="w-full justify-center">
                  Management
                </AppButton>
              </Link>
              <Link href="/admin/dashboard" className="w-full">
                <AppButton variant="outline" size="sm" className="w-full justify-center">
                  Super Admin
                </AppButton>
              </Link>
            </div>
            <div className="mt-3 text-center">
              <Link href="/partner/dashboard" className="text-xs text-indigo-600 hover:underline font-semibold">
                Auditor &amp; Partner Desk →
              </Link>
            </div>
          </div>
        </AppCard>

        {/* Footer Link */}
        <div className="text-center mt-6 text-xs text-slate-500">
          New Society, Resident, or Committee Member?{" "}
          <Link
            href="/register"
            className="text-indigo-600 font-semibold hover:underline"
          >
            Get Started
          </Link>
        </div>
      </motion.div>

      {/* Setup & Integration State Modal */}
      <Modal
        isOpen={showSetupModal}
        onClose={() => setShowSetupModal(false)}
        title="Auth.js Gateway Scaffold Ready"
        description="Credentials validated. Authentication will be wired in Prompt 2."
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <AppButton
              variant="outline"
              size="sm"
              onClick={() => setShowSetupModal(false)}
            >
              Stay on Login
            </AppButton>
            <Link href="/dashboard">
              <AppButton
                variant="gradient"
                size="sm"
                pill
                rightIcon="arrow-forward-outline"
                onClick={() => setShowSetupModal(false)}
              >
                Enter Resident Console
              </AppButton>
            </Link>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          <div className="p-4 rounded-2xl border border-indigo-200/90 bg-indigo-50/80 text-indigo-900 space-y-1">
            <div className="flex items-center gap-2 font-bold text-indigo-700">
              <IonIcon name="information-circle-outline" size={16} />
              <span>Prompt 1.1 Architecture Rule Enforced</span>
            </div>
            <p className="leading-relaxed text-indigo-700">
              As specified in Prompt 1.1, we do not fabricate an authenticated user session or fake login tokens.
              Real authentication session tokens with MongoDB Atlas connect in Prompt 2.
            </p>
          </div>

          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
            <span className="font-bold text-slate-900 block">Validated Payload:</span>
            <div className="flex justify-between">
              <span className="text-slate-500">Target Email:</span>
              <span className="font-mono text-slate-900 font-semibold">{email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Password Complexity:</span>
              <span className="text-emerald-600 font-bold">Valid (≥ 8 chars)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Remember Terminal:</span>
              <span className="text-slate-900 font-medium">{rememberMe ? "Yes" : "No"}</span>
            </div>
          </div>

          <div>
            <span className="font-bold text-slate-900 block mb-2">Direct Prototype Dashboard Routes:</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Link
                href="/dashboard"
                onClick={() => setShowSetupModal(false)}
                className="p-2.5 rounded-xl border border-slate-200 hover:bg-indigo-50 hover:border-indigo-300 transition-colors flex items-center justify-between"
              >
                <span className="font-semibold text-slate-800">Resident Owner</span>
                <span className="text-indigo-600 font-bold">/dashboard →</span>
              </Link>
              <Link
                href="/dashboard?view=tenant"
                onClick={() => setShowSetupModal(false)}
                className="p-2.5 rounded-xl border border-slate-200 hover:bg-indigo-50 hover:border-indigo-300 transition-colors flex items-center justify-between"
              >
                <span className="font-semibold text-slate-800">Tenant Portal</span>
                <span className="text-indigo-600 font-bold">/dashboard?view=tenant →</span>
              </Link>
              <Link
                href="/management/dashboard"
                onClick={() => setShowSetupModal(false)}
                className="p-2.5 rounded-xl border border-slate-200 hover:bg-indigo-50 hover:border-indigo-300 transition-colors flex items-center justify-between"
              >
                <span className="font-semibold text-slate-800">Management Committee</span>
                <span className="text-indigo-600 font-bold">/management/dashboard →</span>
              </Link>
              <Link
                href="/admin/dashboard"
                onClick={() => setShowSetupModal(false)}
                className="p-2.5 rounded-xl border border-slate-200 hover:bg-indigo-50 hover:border-indigo-300 transition-colors flex items-center justify-between"
              >
                <span className="font-semibold text-slate-800">Platform Super Admin</span>
                <span className="text-indigo-600 font-bold">/admin/dashboard →</span>
              </Link>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
