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

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [societyCode, setSocietyCode] = useState("GREENWOOD-PUNE");
  const [flatNumber, setFlatNumber] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(
      "[Architecture Notice] Registration persistence connects to MongoDB Atlas with Auth.js email verification in Prompt 2. Click 'Explore Prototype' below to test the active console."
    );
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col justify-center items-center p-4 sm:p-6 text-[#1A1A1A]">
      <div className="w-full max-w-lg">
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
            Resident & Flat Unit Registration
          </p>
        </div>

        {/* Milestone Notice */}
        <div className="mb-4 p-3.5 rounded-xl border border-[#C7D2FE] bg-[#EEF2FF] text-xs text-[#4F46E5] flex items-center gap-2.5">
          <IconContainer
            name="business-outline"
            variant="hero-soft"
            size="sm"
            className="bg-white shrink-0"
          />
          <div>
            <span className="font-bold">Multi-Tenant Tenant Registration:</span> Flat
            provisioning schema defined in <code className="font-mono">src/modules/auth/schema.ts</code>.
          </div>
        </div>

        {/* Form Card */}
        <AppCard className="p-6 sm:p-8 bg-white border-[#E5E7EB] shadow-sm">
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#F1F3F5]">
            <h2 className="text-lg font-bold text-[#1A1A1A] font-heading">
              Enroll Your Unit
            </h2>
            <StatusBadge variant="hero" size="sm">
              Resident Access
            </StatusBadge>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField
              label="Full Legal Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Priya Mehta"
              leftIcon="person-outline"
              required
              helperText="Must match name on registered sale agreement"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
              />

              <FormField
                label="Mobile Number"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="98220 12345"
                leftIcon="phone-portrait-outline"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                label="Society Tenant Code"
                value={societyCode}
                onChange={(e) => setSocietyCode(e.target.value)}
                placeholder="SOCIETY-CODE"
                required
                helperText="Provided by Managing Committee"
              />

              <FormField
                label="Flat / Unit Number"
                value={flatNumber}
                onChange={(e) => setFlatNumber(e.target.value)}
                placeholder="e.g. C-402"
                required
              />
            </div>

            <label className="flex items-start gap-2.5 text-xs text-[#6B7280] pt-2 cursor-pointer">
              <input
                type="checkbox"
                required
                className="accent-[#4F46E5] rounded mt-0.5 w-3.5 h-3.5 shrink-0"
              />
              <span>
                I confirm I am the registered owner or authorized tenant of this
                unit under MCS Act bylaws.
              </span>
            </label>

            <AppButton
              type="submit"
              variant="hero"
              className="w-full mt-3"
              rightIcon="arrow-forward-outline"
            >
              Submit Registration
            </AppButton>
          </form>

          {/* Prototype shortcut */}
          <div className="mt-6 pt-5 border-t border-[#F1F3F5] text-center">
            <Link href="/dashboard" className="w-full block">
              <AppButton variant="outline" size="sm" className="w-full">
                Skip to Live Prototype Console
              </AppButton>
            </Link>
          </div>
        </AppCard>

        {/* Footer Link */}
        <div className="text-center mt-6 text-xs text-[#6B7280]">
          Already registered?{" "}
          <Link
            href="/login"
            className="text-[#4F46E5] font-semibold hover:underline"
          >
            Sign in to your account
          </Link>
        </div>
      </div>
    </div>
  );
}
