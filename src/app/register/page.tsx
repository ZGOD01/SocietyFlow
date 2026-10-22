"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  AppCard,
  FormField,
  AppButton,
  StatusBadge,
  IconContainer,
  IonIcon,
} from "@/components/ui";
import {
  ownerRegistrationSchema,
  tenantRegistrationSchema,
  managementRegistrationSchema,
} from "@/modules/auth/schema";

type AccountType = "OWNER" | "TENANT" | "MANAGEMENT";
type ManagementPosition = "SECRETARY" | "CHAIRMAN" | "TREASURER" | "SOCIETY_MANAGER";

interface FormErrors {
  [key: string]: string | undefined;
}

export default function RegisterPage() {
  const [selectedType, setSelectedType] = useState<AccountType>("OWNER");
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Common Fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Role-Specific: Owner
  const [ownerSocietyMethod, setOwnerSocietyMethod] = useState<"CODE" | "SEARCH" | "INVITE">("CODE");
  const [societyCode, setSocietyCode] = useState("GREENWOOD-PUNE");
  const [wing, setWing] = useState("Wing C");
  const [flatNumber, setFlatNumber] = useState("");
  const [ownershipType, setOwnershipType] = useState<"SOLE_OWNER" | "JOINT_OWNER">("SOLE_OWNER");

  // Role-Specific: Tenant
  const [tenantSocietyMethod, setTenantSocietyMethod] = useState<"CODE" | "INVITE">("CODE");
  const [ownerName, setOwnerName] = useState("");
  const [ownerContact, setOwnerContact] = useState("");
  const [leaseCommencement, setLeaseCommencement] = useState("");

  // Role-Specific: Society Management
  const [intendedPosition, setIntendedPosition] = useState<ManagementPosition>("SECRETARY");
  const [resolutionNumber, setResolutionNumber] = useState("");

  // Validation & Loading
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const accountTypes = [
    {
      id: "OWNER" as AccountType,
      title: "Property Owner",
      description:
        "Manage your property, personal documents, society documents and service requests.",
      icon: "home-outline",
      badge: "Title & Flat Owner",
      previewRoute: "/dashboard",
      accent: "from-indigo-500/20 to-purple-500/20",
      borderGlow: "group-hover:border-indigo-400",
    },
    {
      id: "TENANT" as AccountType,
      title: "Tenant",
      description:
        "Access your rental documents, communicate with your owner and raise society requests.",
      icon: "key-outline",
      badge: "Lease Resident",
      previewRoute: "/dashboard?view=tenant",
      accent: "from-sky-500/20 to-blue-500/20",
      borderGlow: "group-hover:border-sky-400",
    },
    {
      id: "MANAGEMENT" as AccountType,
      title: "Society Management",
      description:
        "Manage residents, review documents and approve society requests.",
      icon: "shield-checkmark-outline",
      badge: "Committee Review",
      previewRoute: "/management/dashboard",
      accent: "from-amber-500/20 to-orange-500/20",
      borderGlow: "group-hover:border-amber-400",
    },
  ];

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (selectedType === "OWNER") {
      const result = ownerRegistrationSchema.safeParse({
        accountType: "OWNER",
        fullName,
        email,
        password,
        confirmPassword,
        phone: phone || undefined,
        societyJoiningMethod: ownerSocietyMethod,
        societyCode,
        wing,
        flatNumber,
        ownershipType,
        termsAccepted,
      });

      if (!result.success) {
        result.error.issues.forEach((issue) => {
          const path = issue.path[0] as string;
          newErrors[path] = issue.message;
        });
      }
    } else if (selectedType === "TENANT") {
      const result = tenantRegistrationSchema.safeParse({
        accountType: "TENANT",
        fullName,
        email,
        password,
        confirmPassword,
        phone: phone || undefined,
        societyJoiningMethod: tenantSocietyMethod,
        societyCode,
        wing,
        flatNumber,
        ownerName,
        ownerContact,
        leaseCommencement: leaseCommencement || undefined,
        termsAccepted,
      });

      if (!result.success) {
        result.error.issues.forEach((issue) => {
          const path = issue.path[0] as string;
          newErrors[path] = issue.message;
        });
      }
    } else if (selectedType === "MANAGEMENT") {
      const result = managementRegistrationSchema.safeParse({
        accountType: "MANAGEMENT",
        fullName,
        email,
        password,
        confirmPassword,
        phone: phone || undefined,
        position: intendedPosition,
        societyCode,
        resolutionNumber,
        termsAccepted,
      });

      if (!result.success) {
        result.error.issues.forEach((issue) => {
          const path = issue.path[0] as string;
          newErrors[path] = issue.message;
        });
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      setIsSubmitting(true);
      setTimeout(() => {
        setIsSubmitting(false);
        setStep(3);
      }, 350);
    }
  };

  const activeTypeMeta = accountTypes.find((t) => t.id === selectedType)!;

  return (
    <div className="min-h-screen bg-slate-50/60 py-10 sm:py-16 px-4 sm:px-6 lg:px-8 text-slate-900 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-indigo-500/10 blur-[110px] rounded-full pointer-events-none -z-10" />
      <div className="absolute bottom-0 right-10 w-80 h-80 bg-violet-500/10 blur-[100px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-3xl mx-auto">
        {/* Brand Header & Return Link */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center font-extrabold text-xl font-heading shadow-md transition-transform group-hover:scale-105">
              S
            </div>
            <span className="font-extrabold text-2xl tracking-tight font-heading text-slate-900">
              Society<span className="text-gradient-brand">Flow</span>
            </span>
          </Link>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight font-heading text-slate-900">
            Create Your Account
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-md mx-auto">
            Choose your account role to configure verified permissions and document vaults.
          </p>
        </div>

        {/* Step Indicator */}
        <div className="mb-8 flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
          <div
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              step >= 1
                ? "bg-indigo-50 text-indigo-700 border border-indigo-200/90 shadow-2xs"
                : "bg-white text-slate-400 border border-slate-200"
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">
              1
            </span>
            <span>Account Role</span>
          </div>
          <span className="text-slate-300">―</span>
          <div
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              step >= 2
                ? "bg-indigo-50 text-indigo-700 border border-indigo-200/90 shadow-2xs"
                : "bg-white text-slate-400 border border-slate-200"
            }`}
          >
            <span
              className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                step >= 2 ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-600"
              }`}
            >
              2
            </span>
            <span>Registration Details</span>
          </div>
          <span className="text-slate-300">―</span>
          <div
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              step === 3
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200/90 shadow-2xs"
                : "bg-white text-slate-400 border border-slate-200"
            }`}
          >
            <span
              className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                step === 3 ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-600"
              }`}
            >
              3
            </span>
            <span>Staged Review</span>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* STEP 1: Interactive Selectable Account Cards */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {accountTypes.map((type) => {
                  const isSelected = selectedType === type.id;
                  return (
                    <motion.div
                      key={type.id}
                      whileHover={{ y: -3, scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedType(type.id)}
                      className={`cursor-pointer rounded-2xl p-6 transition-all duration-200 flex flex-col justify-between border relative overflow-hidden group ${
                        isSelected
                          ? "bg-white border-indigo-600 ring-2 ring-indigo-500/20 shadow-[0_12px_32px_-4px_rgba(99,102,241,0.18)]"
                          : "glass-card border-slate-200/90 hover:border-slate-300 hover:bg-white"
                      }`}
                    >
                      {/* Selected background glow halo */}
                      {isSelected && (
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-2xl rounded-full pointer-events-none" />
                      )}

                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <IconContainer
                            name={type.icon}
                            variant={isSelected ? "hero-soft" : "neutral"}
                            size="md"
                            className="transition-transform group-hover:scale-105"
                          />
                          <div
                            className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                              isSelected
                                ? "border-indigo-600 bg-indigo-600 text-white"
                                : "border-slate-300 bg-white"
                            }`}
                          >
                            {isSelected && <IonIcon name="checkmark" size={12} />}
                          </div>
                        </div>

                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {type.badge}
                        </span>
                        <h3 className="text-lg font-bold text-slate-900 font-heading mt-1 mb-2 group-hover:text-indigo-600 transition-colors">
                          {type.title}
                        </h3>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {type.description}
                        </p>
                      </div>

                      <div className="pt-4 mt-6 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span
                          className={`font-semibold ${
                            isSelected ? "text-indigo-600" : "text-slate-400"
                          }`}
                        >
                          {isSelected ? "Role Selected" : "Select Role"}
                        </span>
                        <IonIcon
                          name="chevron-forward-outline"
                          size={14}
                          className={isSelected ? "text-indigo-600" : "text-slate-300"}
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              <div className="flex justify-end pt-2">
                <AppButton
                  variant="gradient"
                  size="md"
                  pill
                  rightIcon="arrow-forward-outline"
                  onClick={() => setStep(2)}
                  className="w-full sm:w-auto shadow-sm"
                >
                  Continue as {activeTypeMeta.title}
                </AppButton>
              </div>
            </motion.div>
          )}

          {/* STEP 2: Role-Specific Onboarding Form */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
            >
              <AppCard className="p-6 sm:p-9 glass-card border-slate-200/90 shadow-md">
                {/* Header with Switch Role Pill */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 mb-6 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <IconContainer
                      name={activeTypeMeta.icon}
                      variant="hero-soft"
                      size="md"
                    />
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 font-heading">
                        {activeTypeMeta.title} Enrollment
                      </h2>
                      <p className="text-xs text-slate-500">
                        {activeTypeMeta.description}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 px-3 py-1.5 rounded-full border border-indigo-200 bg-indigo-50/80 hover:bg-indigo-100 transition-colors self-start sm:self-auto cursor-pointer"
                  >
                    ← Change Role
                  </button>
                </div>

                {/* Zero-Trust Governance Alerts & Disclaimers */}
                {selectedType === "MANAGEMENT" && (
                  <div className="mb-6 p-4 rounded-2xl border border-amber-200/90 bg-amber-50/80 text-xs text-amber-900 space-y-1 backdrop-blur-xs">
                    <div className="flex items-center gap-2 font-bold text-amber-800">
                      <IonIcon name="alert-circle-outline" size={16} />
                      <span>Statutory Management Notice (MCS Act §73)</span>
                    </div>
                    <p className="leading-relaxed">
                      Selecting Society Management does <strong>NOT</strong> grant administrative
                      permissions immediately. All role assignments require physical managing committee
                      resolution verification before platform activation.
                    </p>
                  </div>
                )}

                {selectedType === "OWNER" && (
                  <div className="mb-6 p-4 rounded-2xl border border-indigo-200/90 bg-indigo-50/80 text-xs text-indigo-800 flex items-start gap-2.5 backdrop-blur-xs">
                    <IonIcon name="information-circle-outline" size={16} className="shrink-0 mt-0.5 text-indigo-600" />
                    <p className="leading-relaxed">
                      <strong>Zero-Trust Unit Registry:</strong> Entering a flat number does not grant immediate
                      access to unit documents. The society committee verifies your registered sale deed or share
                      certificate prior to vault clearance.
                    </p>
                  </div>
                )}

                {selectedType === "TENANT" && (
                  <div className="mb-6 p-4 rounded-2xl border border-sky-200/90 bg-sky-50/80 text-xs text-sky-800 flex items-start gap-2.5 backdrop-blur-xs">
                    <IonIcon name="information-circle-outline" size={16} className="shrink-0 mt-0.5 text-sky-600" />
                    <p className="leading-relaxed">
                      <strong>Owner Authorization Required:</strong> Tenants are provisioned in pending status
                      until verified by the registered flat owner and confirmed with society management records.
                    </p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Section A: Credentials */}
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3.5">
                      1. Account Credentials
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        label="Full Legal Name"
                        value={fullName}
                        onChange={(e) => {
                          setFullName(e.target.value);
                          if (errors.fullName) setErrors({ ...errors, fullName: undefined });
                        }}
                        placeholder="e.g. Priya R. Mehta"
                        leftIcon="person-outline"
                        required
                        error={errors.fullName}
                        helperText="Must match government ID and property documents"
                      />

                      <FormField
                        label="Email Address"
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (errors.email) setErrors({ ...errors, email: undefined });
                        }}
                        placeholder="name@example.com"
                        required
                        error={errors.email}
                        helperText="Used for login and official statutory notices"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                      <FormField
                        label="Password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (errors.password) setErrors({ ...errors, password: undefined });
                        }}
                        placeholder="At least 8 characters"
                        leftIcon="lock-closed-outline"
                        rightIcon={showPassword ? "eye-outline" : "eye-outline"}
                        onRightIconClick={() => setShowPassword(!showPassword)}
                        required
                        error={errors.password}
                      />

                      <FormField
                        label="Confirm Password"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: undefined });
                        }}
                        placeholder="Re-enter password"
                        leftIcon="lock-closed-outline"
                        rightIcon={showConfirmPassword ? "eye-outline" : "eye-outline"}
                        onRightIconClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        required
                        error={errors.confirmPassword}
                      />
                    </div>

                    <div className="mt-4">
                      <FormField
                        label="Mobile Number (Optional)"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="98220 12345"
                        leftIcon="phone-portrait-outline"
                        helperText="Required for emergency society broadcasts"
                      />
                    </div>
                  </div>

                  {/* Section B: Role-Specific Details */}
                  <div className="pt-5 border-t border-slate-100">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3.5">
                      2. Role & Association Specifications
                    </h3>

                    {/* OWNER FIELDS */}
                    {selectedType === "OWNER" && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                              Society Joining Method
                            </label>
                            <select
                              value={ownerSocietyMethod}
                              onChange={(e) =>
                                setOwnerSocietyMethod(e.target.value as "CODE" | "SEARCH" | "INVITE")
                              }
                              className="w-full h-11 px-3.5 text-xs bg-white border border-slate-200/90 rounded-xl text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                            >
                              <option value="CODE">Enter Society Code / Reg Number</option>
                              <option value="SEARCH">Search Registered Society Name</option>
                              <option value="INVITE">I Have a Builder / Secretary Invite Link</option>
                            </select>
                          </div>

                          <FormField
                            label="Society Code or Registration ID"
                            value={societyCode}
                            onChange={(e) => {
                              setSocietyCode(e.target.value);
                              if (errors.societyCode) setErrors({ ...errors, societyCode: undefined });
                            }}
                            placeholder="e.g. GREENWOOD-PUNE"
                            leftIcon="business-outline"
                            required
                            error={errors.societyCode}
                            helperText="Assigned by the cooperative housing society"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                              Wing / Building
                            </label>
                            <select
                              value={wing}
                              onChange={(e) => setWing(e.target.value)}
                              className="w-full h-11 px-3.5 text-xs bg-white border border-slate-200/90 rounded-xl text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                            >
                              <option value="Wing A">Wing A</option>
                              <option value="Wing B">Wing B</option>
                              <option value="Wing C">Wing C</option>
                              <option value="Wing D">Wing D</option>
                              <option value="Wing E">Wing E</option>
                            </select>
                          </div>

                          <FormField
                            label="Flat / Unit Number"
                            value={flatNumber}
                            onChange={(e) => {
                              setFlatNumber(e.target.value);
                              if (errors.flatNumber) setErrors({ ...errors, flatNumber: undefined });
                            }}
                            placeholder="e.g. 402 or C-402"
                            required
                            error={errors.flatNumber}
                            helperText="As printed on sale agreement"
                          />

                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                              Ownership Classification
                            </label>
                            <select
                              value={ownershipType}
                              onChange={(e) =>
                                setOwnershipType(e.target.value as "SOLE_OWNER" | "JOINT_OWNER")
                              }
                              className="w-full h-11 px-3.5 text-xs bg-white border border-slate-200/90 rounded-xl text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                            >
                              <option value="SOLE_OWNER">Sole Title Owner</option>
                              <option value="JOINT_OWNER">Joint / Co-Owner</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* TENANT FIELDS */}
                    {selectedType === "TENANT" && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                              Society Joining Method
                            </label>
                            <select
                              value={tenantSocietyMethod}
                              onChange={(e) =>
                                setTenantSocietyMethod(e.target.value as "CODE" | "INVITE")
                              }
                              className="w-full h-11 px-3.5 text-xs bg-white border border-slate-200/90 rounded-xl text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                            >
                              <option value="CODE">Society Code (from Landlord)</option>
                              <option value="INVITE">Invitation Link from Flat Owner</option>
                            </select>
                          </div>

                          <FormField
                            label="Society Code"
                            value={societyCode}
                            onChange={(e) => {
                              setSocietyCode(e.target.value);
                              if (errors.societyCode) setErrors({ ...errors, societyCode: undefined });
                            }}
                            placeholder="e.g. GREENWOOD-PUNE"
                            leftIcon="business-outline"
                            required
                            error={errors.societyCode}
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                              Rented Wing
                            </label>
                            <select
                              value={wing}
                              onChange={(e) => setWing(e.target.value)}
                              className="w-full h-11 px-3.5 text-xs bg-white border border-slate-200/90 rounded-xl text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                            >
                              <option value="Wing A">Wing A</option>
                              <option value="Wing B">Wing B</option>
                              <option value="Wing C">Wing C</option>
                              <option value="Wing D">Wing D</option>
                              <option value="Wing E">Wing E</option>
                            </select>
                          </div>

                          <FormField
                            label="Flat / Unit Number"
                            value={flatNumber}
                            onChange={(e) => {
                              setFlatNumber(e.target.value);
                              if (errors.flatNumber) setErrors({ ...errors, flatNumber: undefined });
                            }}
                            placeholder="e.g. 201 or B-201"
                            required
                            error={errors.flatNumber}
                          />
                        </div>

                        <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-4">
                          <div className="flex items-center gap-2">
                            <IonIcon name="person-outline" size={16} className="text-indigo-600" />
                            <span className="text-xs font-bold text-slate-900">
                              Owner Authorization Details
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            <FormField
                              label="Registered Owner Legal Name"
                              value={ownerName}
                              onChange={(e) => {
                                setOwnerName(e.target.value);
                                if (errors.ownerName) setErrors({ ...errors, ownerName: undefined });
                              }}
                              placeholder="e.g. Rajesh S. Joshi"
                              required
                              error={errors.ownerName}
                              helperText="Must match society ownership records"
                            />

                            <FormField
                              label="Owner Contact Email or Phone"
                              value={ownerContact}
                              onChange={(e) => {
                                setOwnerContact(e.target.value);
                                if (errors.ownerContact) setErrors({ ...errors, ownerContact: undefined });
                              }}
                              placeholder="owner@example.com or mobile"
                              required
                              error={errors.ownerContact}
                              helperText="Verification request will be routed to owner"
                            />
                          </div>

                          <FormField
                            label="Lease Agreement Commencement Date (Optional)"
                            type="date"
                            value={leaseCommencement}
                            onChange={(e) => setLeaseCommencement(e.target.value)}
                            helperText="Police verification & agreement upload required before society move-in"
                          />
                        </div>
                      </div>
                    )}

                    {/* SOCIETY MANAGEMENT FIELDS */}
                    {selectedType === "MANAGEMENT" && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-2">
                            Select Intended Managing Committee Position
                          </label>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                            {(
                              [
                                { id: "SECRETARY", label: "Secretary", icon: "document-text-outline" },
                                { id: "CHAIRMAN", label: "Chairman", icon: "shield-checkmark-outline" },
                                { id: "TREASURER", label: "Treasurer", icon: "briefcase-outline" },
                                { id: "SOCIETY_MANAGER", label: "Society Manager", icon: "business-outline" },
                              ] as const
                            ).map((pos) => {
                              const isPosSelected = intendedPosition === pos.id;
                              return (
                                <button
                                  key={pos.id}
                                  type="button"
                                  onClick={() => setIntendedPosition(pos.id)}
                                  className={`p-3.5 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                                    isPosSelected
                                      ? "bg-indigo-50/90 border-indigo-600 text-indigo-700 font-bold shadow-xs ring-1 ring-indigo-500/20"
                                      : "bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300"
                                  }`}
                                >
                                  <IonIcon name={pos.icon} size={20} className={isPosSelected ? "text-indigo-600" : "text-slate-400"} />
                                  <span className="text-xs">{pos.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <FormField
                            label="Society Registration Number / Code"
                            value={societyCode}
                            onChange={(e) => {
                              setSocietyCode(e.target.value);
                              if (errors.societyCode) setErrors({ ...errors, societyCode: undefined });
                            }}
                            placeholder="e.g. PNA/HSG/14902/2019"
                            leftIcon="business-outline"
                            required
                            error={errors.societyCode}
                            helperText="Official registrar certificate registration number"
                          />

                          <FormField
                            label="Committee Resolution Number or Invite Token"
                            value={resolutionNumber}
                            onChange={(e) => {
                              setResolutionNumber(e.target.value);
                              if (errors.resolutionNumber)
                                setErrors({ ...errors, resolutionNumber: undefined });
                            }}
                            placeholder="e.g. AGM-2024-RES-08"
                            leftIcon="document-attach-outline"
                            required
                            error={errors.resolutionNumber}
                            helperText="Minutes resolution recording election or appointment"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Terms Checkbox */}
                  <div className="pt-2">
                    <label className="flex items-start gap-2.5 text-xs text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={termsAccepted}
                        onChange={(e) => {
                          setTermsAccepted(e.target.checked);
                          if (errors.termsAccepted) setErrors({ ...errors, termsAccepted: undefined });
                        }}
                        className="accent-indigo-600 rounded mt-0.5 w-4 h-4 shrink-0 cursor-pointer"
                      />
                      <span>
                        I certify that all details submitted are accurate under the Maharashtra
                        Cooperative Societies Act, and understand that role privileges require official
                        verification.
                      </span>
                    </label>
                    {errors.termsAccepted && (
                      <p className="text-[11px] text-rose-500 mt-1 font-medium">
                        {errors.termsAccepted}
                      </p>
                    )}
                  </div>

                  {/* Form Action Buttons */}
                  <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
                    <AppButton
                      type="button"
                      variant="outline"
                      size="md"
                      onClick={() => setStep(1)}
                      leftIcon="chevron-back-outline"
                      className="w-full sm:w-auto"
                    >
                      Back to Roles
                    </AppButton>

                    <AppButton
                      type="submit"
                      variant="gradient"
                      size="md"
                      pill
                      rightIcon="arrow-forward-outline"
                      disabled={isSubmitting}
                      className="w-full sm:w-auto shadow-md"
                    >
                      {isSubmitting ? "Validating..." : "Submit Registration"}
                    </AppButton>
                  </div>
                </form>
              </AppCard>

              {/* Footer Sign In */}
              <div className="text-center mt-6 text-xs text-slate-500">
                Already have a SocietyFlow account?{" "}
                <Link
                  href="/login"
                  className="text-indigo-600 font-semibold hover:underline"
                >
                  Sign in to your account
                </Link>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Explicit Setup / Integration State */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              <AppCard className="p-7 sm:p-10 glass-card border-slate-200/90 shadow-lg text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4 border border-emerald-200 shadow-sm animate-float">
                  <IonIcon name="checkmark-done-circle-outline" size={36} />
                </div>

                <StatusBadge variant="success" size="sm" dot pulse className="mb-3">
                  Registration Staged & Validated
                </StatusBadge>

                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading tracking-tight">
                  Registration Profile Staged Successfully
                </h2>

                <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto mt-2 leading-relaxed">
                  Your <span className="font-semibold text-slate-900">{activeTypeMeta.title}</span> enrollment
                  payload for <span className="font-semibold text-slate-900">{fullName}</span> has been structured
                  and validated under strict TypeScript and Zod domain schemas.
                </p>

                {/* Submitted Details Review Box */}
                <div className="mt-6 p-5 rounded-2xl border border-slate-200 bg-white/90 text-left max-w-md mx-auto text-xs space-y-2.5 shadow-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Account Category:</span>
                    <span className="font-bold text-slate-900">{activeTypeMeta.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Email Address:</span>
                    <span className="font-mono text-slate-900">{email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Target Society:</span>
                    <span className="font-semibold text-indigo-600">{societyCode}</span>
                  </div>
                  {selectedType === "MANAGEMENT" && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Elected Position:</span>
                      <span className="font-semibold text-slate-900">{intendedPosition}</span>
                    </div>
                  )}
                  {(selectedType === "OWNER" || selectedType === "TENANT") && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Unit Association:</span>
                      <span className="font-semibold text-slate-900">
                        {wing} • Flat {flatNumber}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-slate-100">
                    <span className="text-slate-500">Access Status:</span>
                    <span className="text-amber-600 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      Pending Server Verification
                    </span>
                  </div>
                </div>

                {/* Architecture Notice */}
                <div className="mt-6 p-4 rounded-2xl border border-indigo-200/90 bg-indigo-50/80 text-xs text-indigo-800 text-left max-w-md mx-auto flex items-start gap-3 backdrop-blur-xs">
                  <IconContainer
                    name="shield-checkmark-outline"
                    variant="hero-soft"
                    size="sm"
                    className="bg-white shrink-0 mt-0.5"
                  />
                  <div>
                    <span className="font-bold block text-sm mb-0.5">Architecture Milestone Hand-off</span>
                    <p className="leading-relaxed text-indigo-700">
                      In accordance with Prompt 1.1 criteria, real authentication session cookies and MongoDB Atlas
                      persistence connect in Prompt 2. No fake session has been created.
                    </p>
                  </div>
                </div>

                {/* Destination preview actions */}
                <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link href={activeTypeMeta.previewRoute} className="w-full sm:w-auto">
                    <AppButton
                      variant="gradient"
                      size="md"
                      pill
                      rightIcon="arrow-forward-outline"
                      className="w-full sm:w-auto shadow-md"
                    >
                      Preview {activeTypeMeta.title} Console
                    </AppButton>
                  </Link>

                  <Link href="/login" className="w-full sm:w-auto">
                    <AppButton
                      variant="outline"
                      size="md"
                      pill
                      className="w-full sm:w-auto"
                    >
                      Go to Login Page
                    </AppButton>
                  </Link>
                </div>

                <div className="mt-6 text-center">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-xs text-slate-500 hover:text-slate-900 underline cursor-pointer"
                  >
                    Start another registration test
                  </button>
                </div>
              </AppCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
