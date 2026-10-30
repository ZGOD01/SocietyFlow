"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  AppCard,
  FormField,
  AppButton,
  StatusBadge,
  IconContainer,
  IonIcon,
  Modal,
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
  const [societyCode, setSocietyCode] = useState("");
  const [matchedSocietyName, setMatchedSocietyName] = useState<string | null>(null);
  const [checkingSociety, setCheckingSociety] = useState(false);
  const [wing, setWing] = useState("Wing A");
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
  const [mgmtSocietyName, setMgmtSocietyName] = useState("");
  const [mgmtCity, setMgmtCity] = useState("Pune");
  const [mgmtState, setMgmtState] = useState("Maharashtra");
  const [mgmtPinCode, setMgmtPinCode] = useState("411045");
  const [mgmtAddress, setMgmtAddress] = useState("");
  const [mgmtWings, setMgmtWings] = useState("Wing A, Wing B");
  const [mgmtFloors, setMgmtFloors] = useState<number>(4);
  const [mgmtFlatsPerFloor, setMgmtFlatsPerFloor] = useState<number>(4);
  const [mgmtBhk, setMgmtBhk] = useState<string>("2 BHK");

  // Validation & Loading
  const router = useRouter();
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successModalData, setSuccessModalData] = useState<{
    title: string;
    message: string;
    role: string;
    society: string;
    unit: string;
  } | null>(null);

  // Live lookup to verify Society Code, Registration Number, Resolution Token, or Name
  React.useEffect(() => {
    if (selectedType === "MANAGEMENT" || !societyCode.trim() || societyCode.trim().length < 2) {
      setMatchedSocietyName(null);
      setCheckingSociety(false);
      return;
    }
    setCheckingSociety(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/society/lookup?code=${encodeURIComponent(societyCode.trim())}`);
        const data = await res.json();
        if (data.found && data.society) {
          setMatchedSocietyName(`${data.society.name} (${data.society.city || "Verified"})`);
        } else {
          setMatchedSocietyName(null);
        }
      } catch {
        setMatchedSocietyName(null);
      } finally {
        setCheckingSociety(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [societyCode, selectedType]);

  const accountTypes = [
    {
      id: "OWNER" as AccountType,
      title: "Property Owner",
      description:
        "Manage your property, personal documents, society documents and service requests.",
      icon: "home-outline",
      badge: "Title & Flat Owner",
      previewRoute: "/pending-approval",
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
      previewRoute: "/pending-approval",
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
      previewRoute: "/pending-approval",
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
        wing: wing || "Wing A",
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
        wing: wing || "Wing A",
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
        societyName: mgmtSocietyName || undefined,
        societyCode,
        city: mgmtCity || undefined,
        state: mgmtState || undefined,
        pinCode: mgmtPinCode || undefined,
        address: mgmtAddress || undefined,
        wings: mgmtWings || undefined,
        floorsPerWing: mgmtFloors,
        flatsPerFloor: mgmtFlatsPerFloor,
        bhkType: mgmtBhk,
        resolutionNumber: resolutionNumber || undefined,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    let payload: Record<string, unknown> = {};

    if (selectedType === "OWNER") {
      payload = {
        accountType: "OWNER",
        fullName,
        email,
        password,
        confirmPassword,
        phone: phone || undefined,
        societyJoiningMethod: ownerSocietyMethod,
        societyCode,
        wing: wing || "Wing A",
        flatNumber,
        ownershipType,
        termsAccepted,
      };
    } else if (selectedType === "TENANT") {
      payload = {
        accountType: "TENANT",
        fullName,
        email,
        password,
        confirmPassword,
        phone: phone || undefined,
        societyJoiningMethod: tenantSocietyMethod,
        societyCode,
        wing: wing || "Wing A",
        flatNumber,
        ownerName,
        ownerContact,
        leaseCommencement: leaseCommencement || undefined,
        termsAccepted,
      };
    } else if (selectedType === "MANAGEMENT") {
      payload = {
        accountType: "MANAGEMENT",
        fullName,
        email,
        password,
        confirmPassword,
        phone: phone || undefined,
        position: intendedPosition,
        societyName: mgmtSocietyName || undefined,
        societyCode,
        city: mgmtCity || undefined,
        state: mgmtState || undefined,
        pinCode: mgmtPinCode || undefined,
        address: mgmtAddress || undefined,
        wings: mgmtWings || undefined,
        floorsPerWing: mgmtFloors,
        flatsPerFloor: mgmtFlatsPerFloor,
        bhkType: mgmtBhk,
        resolutionNumber: resolutionNumber || undefined,
        termsAccepted,
      };
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setServerError(
          data.error || "Registration could not be completed. Please review your inputs."
        );
        setIsSubmitting(false);
        return;
      }

      setIsSubmitting(false);
      setSuccessModalData({
        title: "Registration Successful!",
        message:
          selectedType === "OWNER"
            ? "Your registration has been submitted successfully and is awaiting approval from Society Management. You will receive a notification when your account is approved."
            : selectedType === "TENANT"
            ? "Your registration has been submitted successfully and is awaiting approval from the Property Owner and Society Management."
            : "Your registration has been submitted successfully and is awaiting approval from Society Management.",
        role: selectedType,
        society: societyCode,
        unit: selectedType === "MANAGEMENT" ? intendedPosition : `${wing} - Flat ${flatNumber}`,
      });
      setShowSuccessModal(true);
      setStep(3);
    } catch (err: unknown) {
      setIsSubmitting(false);
      setServerError(
        "Network connection error: Unable to reach the server. Please check your internet connection or server status and try again."
      );
    }
  };

  const activeTypeMeta = accountTypes.find((t) => t.id === selectedType)!;

  return (
    <div className="min-h-screen bg-[#F4F5F7] py-10 sm:py-16 px-4 sm:px-6 lg:px-8 text-slate-900 relative overflow-hidden">
      <div className="max-w-3xl mx-auto">
        {/* Brand Header & Return Link */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-3 group">
            <span className="font-heading font-black text-2xl tracking-[0.2em] text-slate-950 uppercase group-hover:text-indigo-600 transition-colors">
              SOCIETYFLOW
            </span>
          </Link>
          <h1 className="text-2xl sm:text-4xl font-black font-heading uppercase tracking-tight text-slate-950">
            Create Your Society Account
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-md mx-auto">
            Choose your stakeholder role to configure verified permissions and isolated document vaults.
          </p>
        </div>

        {/* Step Indicator */}
        <div className="mb-8 flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
          <div
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
              step >= 1
                ? "bg-slate-950 text-white shadow-xs"
                : "bg-white text-slate-400 border border-slate-200"
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-white/20 text-white flex items-center justify-center text-[10px]">
              1
            </span>
            <span>Account Role</span>
          </div>
          <span className="text-slate-300">―</span>
          <div
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
              step >= 2
                ? "bg-slate-950 text-white shadow-xs"
                : "bg-white text-slate-400 border border-slate-200"
            }`}
          >
            <span
              className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                step >= 2 ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"
              }`}
            >
              2
            </span>
            <span>Registration Details</span>
          </div>
          <span className="text-slate-300">―</span>
          <div
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
              step === 3
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-white text-slate-400 border border-slate-200"
            }`}
          >
            <span
              className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                step === 3 ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"
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
                  variant="hero"
                  size="md"
                  pill
                  rightIcon="arrow-forward-outline"
                  onClick={() => setStep(2)}
                  className="w-full sm:w-auto shadow-xs"
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

                {serverError && (
                  <div className="mb-6 p-4 rounded-2xl border border-rose-200 bg-rose-50/90 text-xs text-rose-900 flex items-start gap-3 backdrop-blur-xs">
                    <div className="w-8 h-8 rounded-full bg-rose-100 border border-rose-200 flex items-center justify-center shrink-0 text-rose-600 mt-0.5">
                      <IonIcon name="alert-circle" size={18} />
                    </div>
                    <div className="flex-1">
                      <strong className="block text-rose-950 font-bold text-sm mb-1">
                        Unable to Complete Registration
                      </strong>
                      <p className="leading-relaxed text-rose-800 mb-2">{serverError}</p>
                      <div className="text-[11px] text-rose-700 bg-rose-100/60 rounded-lg p-2.5 border border-rose-200/50">
                        <span className="font-semibold">Troubleshooting tip:</span> If this is a connection issue, verify your internet connection or check your database settings in <code className="bg-rose-200/60 px-1 py-0.5 rounded font-mono">.env.local</code>.
                      </div>
                    </div>
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

                          <div>
                            <FormField
                              label="Society Code, Reg Number, or Token"
                              value={societyCode}
                              onChange={(e) => {
                                setSocietyCode(e.target.value);
                                if (errors.societyCode) setErrors({ ...errors, societyCode: undefined });
                              }}
                              placeholder="e.g. 123456789 or ABC-001 or Society Name"
                              leftIcon="business-outline"
                              required
                              error={errors.societyCode}
                              helperText="Enter either Society Code / Reg Number, Resolution Token, or Society Name"
                            />
                            {matchedSocietyName && (
                              <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                                <IonIcon name="checkmark-circle" size={16} className="text-emerald-600 shrink-0" />
                                <span>Matched Society: <strong>{matchedSocietyName}</strong></span>
                              </div>
                            )}
                            {checkingSociety && (
                              <div className="mt-1.5 text-[11px] text-slate-500 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                                Verifying society code / token...
                              </div>
                            )}
                          </div>
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
                            {errors.wing && (
                              <p className="text-[11px] text-rose-500 font-semibold mt-1">{errors.wing}</p>
                            )}
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

                          <div>
                            <FormField
                              label="Society Code, Reg Number, or Token"
                              value={societyCode}
                              onChange={(e) => {
                                setSocietyCode(e.target.value);
                                if (errors.societyCode) setErrors({ ...errors, societyCode: undefined });
                              }}
                              placeholder="e.g. 123456789 or ABC-001 or Society Name"
                              leftIcon="business-outline"
                              required
                              error={errors.societyCode}
                              helperText="Enter Society Code / Reg Number, Resolution Token, or Society Name"
                            />
                            {matchedSocietyName && (
                              <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                                <IonIcon name="checkmark-circle" size={16} className="text-emerald-600 shrink-0" />
                                <span>Matched Society: <strong>{matchedSocietyName}</strong></span>
                              </div>
                            )}
                            {checkingSociety && (
                              <div className="mt-1.5 text-[11px] text-slate-500 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                                Verifying society code / token...
                              </div>
                            )}
                          </div>
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
                            {errors.wing && (
                              <p className="text-[11px] text-rose-500 font-semibold mt-1">{errors.wing}</p>
                            )}
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

                        <div className="space-y-4">
                          <FormField
                            label="Society Legal Registered Name"
                            value={mgmtSocietyName}
                            onChange={(e) => setMgmtSocietyName(e.target.value)}
                            placeholder="e.g. Skyline Residency CHS Ltd."
                            leftIcon="business-outline"
                            helperText="Full cooperative housing society registered title"
                          />

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField
                              label="Society Registration Number / Code"
                              value={societyCode}
                              onChange={(e) => {
                                setSocietyCode(e.target.value);
                                if (errors.societyCode) setErrors({ ...errors, societyCode: undefined });
                              }}
                              placeholder="e.g. PNA/HSG/14902/2019"
                              leftIcon="document-text-outline"
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

                          {/* Dynamic Society Location Details */}
                          <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-3">
                            <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                              <IonIcon name="location-outline" size={15} className="text-indigo-600" />
                              Society Location & Wings Structure
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <FormField
                                label="City"
                                value={mgmtCity}
                                onChange={(e) => setMgmtCity(e.target.value)}
                                placeholder="e.g. Pune"
                              />
                              <FormField
                                label="State"
                                value={mgmtState}
                                onChange={(e) => setMgmtState(e.target.value)}
                                placeholder="e.g. Maharashtra"
                              />
                              <FormField
                                label="PIN Code"
                                value={mgmtPinCode}
                                onChange={(e) => setMgmtPinCode(e.target.value)}
                                placeholder="e.g. 411045"
                              />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <FormField
                                label="Street / Landmark Address"
                                value={mgmtAddress}
                                onChange={(e) => setMgmtAddress(e.target.value)}
                                placeholder="e.g. Plot 42, Senapati Bapat Road"
                              />
                              <FormField
                                label="Society Wings (comma-separated)"
                                value={mgmtWings}
                                onChange={(e) => setMgmtWings(e.target.value)}
                                placeholder="e.g. Wing A, Wing B, Wing C"
                                helperText="List all wings to populate the roster"
                              />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                              <FormField
                                label="Floors per Wing"
                                helperText="Vertical levels per tower"
                              >
                                <input
                                  type="number"
                                  min="1"
                                  max="100"
                                  value={mgmtFloors}
                                  onChange={(e) => setMgmtFloors(Math.max(1, Number(e.target.value)))}
                                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                                />
                              </FormField>

                              <FormField
                                label="Flats per Floor"
                                helperText="Residential units per floor"
                              >
                                <input
                                  type="number"
                                  min="1"
                                  max="30"
                                  value={mgmtFlatsPerFloor}
                                  onChange={(e) => setMgmtFlatsPerFloor(Math.max(1, Number(e.target.value)))}
                                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                                />
                              </FormField>

                              <FormField
                                label="Default Flat Config"
                                helperText="Initial unit layout style"
                              >
                                <select
                                  value={mgmtBhk}
                                  onChange={(e) => setMgmtBhk(e.target.value)}
                                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
                                >
                                  <option value="1 BHK">1 BHK</option>
                                  <option value="2 BHK">2 BHK</option>
                                  <option value="3 BHK">3 BHK</option>
                                  <option value="4 BHK">4 BHK</option>
                                </select>
                              </FormField>
                            </div>

                            {/* Live Generation Summary */}
                            <div className="p-2.5 bg-indigo-50/80 border border-indigo-100 rounded-xl flex items-center justify-between text-xs text-indigo-900">
                              <span className="font-semibold flex items-center gap-1.5">
                                <IonIcon name="business-outline" size={15} className="text-indigo-600" />
                                Dynamic Units Estimate:
                              </span>
                              <span className="font-mono font-bold text-indigo-700">
                                {mgmtWings.split(",").filter((w) => w.trim()).length * mgmtFloors * mgmtFlatsPerFloor} Flats
                                ({mgmtFloors * mgmtFlatsPerFloor} per wing across {mgmtWings.split(",").filter((w) => w.trim()).length} wings)
                              </span>
                            </div>
                          </div>
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
                      variant="hero"
                      size="md"
                      pill
                      rightIcon="arrow-forward-outline"
                      disabled={isSubmitting}
                      className="w-full sm:w-auto shadow-xs"
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

                {/* Architecture Staging Notice */}
                <div className="mt-6 p-4 rounded-xl border border-[#C7D2FE] bg-[#EEF2FF] text-xs text-[#1A1A1A] text-left max-w-md mx-auto flex items-start gap-3">
                  <IconContainer
                    name="shield-checkmark-outline"
                    variant="hero-soft"
                    size="sm"
                    className="bg-white shrink-0 mt-0.5"
                  />
                  <div>
                    <span className="font-bold block text-sm mb-0.5 text-[#1A1A1A]">Zero-Trust Association Staged</span>
                    <p className="leading-relaxed text-[#4B5563]">
                      Your credentials and association request have been validated against MCS Act 1960 domain schemas.
                      As mandated by Maharashtra Model Bylaws, flat access and committee permissions remain pending verification.
                    </p>
                  </div>
                </div>

                {/* Destination actions */}
                <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link href="/pending-approval" className="w-full sm:w-auto">
                    <AppButton
                      variant="hero"
                      size="md"
                      pill
                      rightIcon="arrow-forward-outline"
                      className="w-full sm:w-auto shadow-xs"
                    >
                      View Approval Status Desk
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

        {/* Modal: Registration Successful! */}
        <Modal
          isOpen={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
          title={successModalData?.title || "Registration Successful!"}
          description="Statutory Governance & Approval Clearance"
          maxWidth="md"
          footer={
            <div className="flex items-center justify-between w-full">
              <AppButton
                variant="outline"
                size="sm"
                onClick={() => router.push("/login")}
              >
                Go to Sign In
              </AppButton>
              <AppButton
                variant="hero"
                size="sm"
                rightIcon="arrow-forward-outline"
                onClick={() => router.push("/pending-approval")}
              >
                Approval Status Desk
              </AppButton>
            </div>
          }
        >
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46]">
              <div className="w-10 h-10 rounded-full bg-[#10B981] text-white flex items-center justify-center shrink-0">
                <IonIcon name="checkmark-done" size={22} />
              </div>
              <div className="space-y-0.5">
                <span className="text-xs font-bold uppercase tracking-wider block">
                  Status: PENDING_APPROVAL
                </span>
                <p className="text-xs text-[#047857]">
                  Account credentials initialized. Multi-tenant flat association staged.
                </p>
              </div>
            </div>

            <p className="text-sm text-[#1A1A1A] font-medium leading-relaxed bg-[#F8F9FA] p-4 rounded-xl border border-[#E5E7EB]">
              &ldquo;{successModalData?.message}&rdquo;
            </p>

            <div className="text-xs space-y-1.5 p-3 rounded-xl bg-white border border-[#E5E7EB]">
              <div className="flex justify-between text-[#6B7280]">
                <span>Society Code:</span>
                <span className="font-bold text-[#1A1A1A]">{successModalData?.society}</span>
              </div>
              <div className="flex justify-between text-[#6B7280]">
                <span>Associated Unit / Role:</span>
                <span className="font-bold text-[#4F46E5]">{successModalData?.unit}</span>
              </div>
              <div className="flex justify-between text-[#6B7280]">
                <span>Governance Protocol:</span>
                <span className="font-medium text-[#1A1A1A]">MCS Act 1960 Model Bylaws</span>
              </div>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}
