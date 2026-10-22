"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  AppCard,
  FormField,
  AppButton,
  StatusBadge,
  IconContainer,
} from "@/components/ui";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(
      "[Architecture Notice] In accordance with milestone specifications, Auth.js credential and OAuth providers will be integrated in Prompt 2. Click 'Access Prototype Console' below to explore the application."
    );
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col justify-center items-center p-4 sm:p-6 text-[#1A1A1A]">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#4F46E5] text-white flex items-center justify-center font-bold text-xl font-heading shadow-sm">
              S
            </div>
            <span className="font-extrabold text-2xl tracking-tight font-heading">
              Society<span className="text-[#4F46E5]">Flow</span>
            </span>
          </Link>
          <p className="text-sm text-[#6B7280]">
            Digital Society Document & Approval Platform
          </p>
        </div>

        {/* Milestone Notice Banner */}
        <div className="mb-4 p-3.5 rounded-xl border border-[#C7D2FE] bg-[#EEF2FF] text-xs text-[#4F46E5] flex items-center gap-2.5">
          <IconContainer
            name="lock-closed-outline"
            variant="hero-soft"
            size="sm"
            className="bg-white shrink-0"
          />
          <div>
            <span className="font-bold">Auth Gateway Foundation:</span> Production
            Auth.js session verification integrates in Prompt 2.
          </div>
        </div>

        {/* Login Card */}
        <AppCard className="p-6 sm:p-8 bg-white border-[#E5E7EB] shadow-sm">
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#F1F3F5]">
            <h2 className="text-lg font-bold text-[#1A1A1A] font-heading">
              Sign In to Your Society
            </h2>
            <StatusBadge variant="neutral" size="sm">
              Tenant Auth
            </StatusBadge>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField
              label="Registered Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              leftIcon="person-outline"
              required
              helperText="Resident, Committee Member, or Auditor email"
            />

            <FormField
              label="Password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              leftIcon="lock-closed-outline"
              rightIcon={showPassword ? "eye-outline" : "eye-outline"}
              onRightIconClick={() => setShowPassword(!showPassword)}
              required
            />

            <div className="flex items-center justify-between text-xs text-[#6B7280]">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="accent-[#4F46E5] rounded w-3.5 h-3.5"
                />
                <span>Remember on this terminal</span>
              </label>
              <button
                type="button"
                onClick={() =>
                  alert("[Auth Notice] Password reset flows scheduled for Auth.js integration.")
                }
                className="text-[#4F46E5] hover:underline font-medium"
              >
                Forgot password?
              </button>
            </div>

            <AppButton
              type="submit"
              variant="hero"
              className="w-full mt-2"
              rightIcon="arrow-forward-outline"
            >
              Sign In
            </AppButton>
          </form>

          {/* Prototype Evaluation Shortcut */}
          <div className="mt-6 pt-5 border-t border-[#F1F3F5] text-center">
            <p className="text-xs text-[#6B7280] mb-3">
              Evaluating the sponsor prototype?
            </p>
            <Link href="/dashboard" className="w-full block">
              <AppButton variant="outline" size="sm" className="w-full">
                Enter Console Directly
              </AppButton>
            </Link>
          </div>
        </AppCard>

        {/* Footer Link */}
        <div className="text-center mt-6 text-xs text-[#6B7280]">
          New Society or Resident?{" "}
          <Link
            href="/register"
            className="text-[#4F46E5] font-semibold hover:underline"
          >
            Register your unit
          </Link>
        </div>
      </div>
    </div>
  );
}
