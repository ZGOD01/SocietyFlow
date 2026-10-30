"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  AppButton,
  FormField,
  StatusBadge,
  IconContainer,
  IonIcon,
} from "@/components/ui";

export default function SocietySetupWizardPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Society Details
  const [societyName, setSocietyName] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("Pune");
  const [state, setState] = useState("Maharashtra");
  const [pinCode, setPinCode] = useState("411045");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [invitationCode, setInvitationCode] = useState("SF-INVITE-2026");

  // Step 2: Society Structure
  const [buildingName, setBuildingName] = useState("");
  const [wingsCount, setWingsCount] = useState<number>(3);
  const [floorsPerWing, setFloorsPerWing] = useState<number>(10);
  const [flatsPerFloor, setFlatsPerFloor] = useState<number>(4);
  const [flatPattern, setFlatPattern] = useState<string>("FLOOR_UNIT (e.g. 101, 102, 201)");

  // Step 3: Committee Members
  const [secretaryEmail, setSecretaryEmail] = useState("");
  const [chairmanEmail, setChairmanEmail] = useState("");
  const [treasurerEmail, setTreasurerEmail] = useState("");
  const [managerEmail, setManagerEmail] = useState("");

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{
    societyCode: string;
    totalFlats: number;
  } | null>(null);

  const totalCalculatedFlats = wingsCount * floorsPerWing * flatsPerFloor;

  const handleNext = () => {
    setServerError(null);
    if (currentStep === 1) {
      if (!societyName.trim()) {
        setServerError("Please enter your society name.");
        return;
      }
      if (!registrationNumber.trim()) {
        setServerError("Please enter your society registration number.");
        return;
      }
      if (!city.trim()) {
        setServerError("Please enter city.");
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (wingsCount < 1 || floorsPerWing < 1 || flatsPerFloor < 1) {
        setServerError("Wings, floors, and units per floor must be at least 1.");
        return;
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      setCurrentStep(4);
    }
  };

  const handlePrev = () => {
    setServerError(null);
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as 1 | 2 | 3 | 4);
    }
  };

  const handleActivateSociety = async () => {
    setIsSubmitting(true);
    setServerError(null);

    const payload = {
      societyName,
      registrationNumber,
      address,
      city,
      state,
      pinCode,
      contactEmail,
      contactPhone,
      invitationCode,

      buildingName: buildingName.trim() || `${societyName} Tower`,
      wingsCount,
      floorsPerWing,
      flatsPerFloor,
      wingNames: Array.from({ length: wingsCount }, (_, i) => `Wing ${String.fromCharCode(65 + i)}`),

      secretaryEmail,
      chairmanEmail,
      treasurerEmail,
      managerEmail,
    };

    try {
      const res = await fetch("/api/society/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setServerError(data.error || "Failed to initialize society structure.");
        setIsSubmitting(false);
        return;
      }

      setSuccessInfo({
        societyCode: data.society.code,
        totalFlats: data.society.totalFlats,
      });
      setIsSubmitting(false);
    } catch {
      setServerError("Network error while creating society. Please retry.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] flex flex-col justify-between p-4 sm:p-6 lg:p-10">
      {/* Top Header */}
      <header className="w-full max-w-4xl mx-auto flex items-center justify-between pb-6 border-b border-[#E5E7EB]">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#4F46E5] text-white flex items-center justify-center font-bold text-base font-heading">
            S
          </div>
          <span className="font-heading font-black text-lg tracking-[0.18em] text-[#1A1A1A] uppercase">
            SOCIETY<span className="text-[#4F46E5]">FLOW</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <StatusBadge variant="hero" size="sm">
            Society Onboarding Wizard
          </StatusBadge>
          <span className="text-xs text-[#6B7280]">Step {currentStep} of 4</span>
        </div>
      </header>

      {/* Main Wizard */}
      <main className="w-full max-w-3xl mx-auto my-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-white border border-[#E5E7EB] shadow-[0_4px_24px_-2px_rgba(0,0,0,0.06)] overflow-hidden p-6 sm:p-9 space-y-6"
        >
          {/* Wizard Stepper Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-[#6B7280]">
              <span className={currentStep >= 1 ? "text-[#4F46E5]" : ""}>1. Details</span>
              <span className={currentStep >= 2 ? "text-[#4F46E5]" : ""}>2. Structure</span>
              <span className={currentStep >= 3 ? "text-[#4F46E5]" : ""}>3. Committee</span>
              <span className={currentStep >= 4 ? "text-[#4F46E5]" : ""}>4. Activate</span>
            </div>
            <div className="h-1.5 w-full bg-[#F1F3F5] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#4F46E5] transition-all duration-300"
                style={{ width: `${(currentStep / 4) * 100}%` }}
              />
            </div>
          </div>

          {/* Success Activated Banner */}
          {successInfo ? (
            <div className="py-6 space-y-6 text-center">
              <div className="w-16 h-16 rounded-full bg-[#ECFDF5] text-[#10B981] flex items-center justify-center mx-auto border border-[#A7F3D0]">
                <IonIcon name="checkmark-done-circle" size={36} />
              </div>

              <div className="space-y-1">
                <StatusBadge variant="success" size="sm" dot>
                  Society Activated
                </StatusBadge>
                <h2 className="text-2xl font-bold font-heading text-[#1A1A1A]">
                  {societyName} is Live!
                </h2>
                <p className="text-sm text-[#6B7280] max-w-md mx-auto">
                  Your housing society has been established under Maharashtra Co-operative Societies Act 1960. Assigned code:{" "}
                  <strong className="text-[#4F46E5] font-mono">{successInfo.societyCode}</strong>.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#F8F9FA] border border-[#E5E7EB] max-w-sm mx-auto text-xs space-y-2 text-left">
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">Total Residential Units:</span>
                  <span className="font-bold text-[#1A1A1A]">{successInfo.totalFlats} Flats</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">Wings Initialized:</span>
                  <span className="font-bold text-[#1A1A1A]">{wingsCount} Wings</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">Registration Authority:</span>
                  <span className="font-bold text-[#1A1A1A]">{registrationNumber}</span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <AppButton
                  variant="hero"
                  size="md"
                  rightIcon="arrow-forward-outline"
                  onClick={() => router.push("/admin/dashboard")}
                >
                  Return to Society Profiles
                </AppButton>
                <AppButton
                  variant="outline"
                  size="md"
                  onClick={() => router.push("/management/dashboard")}
                >
                  Enter Management Console
                </AppButton>
              </div>
            </div>
          ) : (
            <div>
              {serverError && (
                <div className="mb-5 p-3.5 rounded-xl bg-[#FFF1F2] border border-[#FECDD3] text-xs text-[#BE123C] flex items-center gap-2">
                  <IonIcon name="alert-circle-outline" size={18} className="shrink-0" />
                  <span>{serverError}</span>
                </div>
              )}

              <AnimatePresence mode="wait">
                {/* STEP 1: Society Details */}
                {currentStep === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    className="space-y-4"
                  >
                    <div>
                      <h2 className="text-lg font-bold font-heading text-[#1A1A1A]">
                        Step 1: Society Details
                      </h2>
                      <p className="text-xs text-[#6B7280]">
                        Enter statutory registration details according to Maharashtra Co-operative Societies Act 1960.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <FormField
                          label="Society Full Name *"
                          placeholder="e.g. Greenwood Estates Co-operative Housing Society Ltd."
                          value={societyName}
                          onChange={(e) => setSocietyName(e.target.value)}
                        />
                      </div>

                      <FormField
                        label="Registration Number *"
                        placeholder="e.g. PNA/HSG/14902/2019"
                        value={registrationNumber}
                        onChange={(e) => setRegistrationNumber(e.target.value)}
                      />

                      <FormField
                        label="Controlled Invitation Code *"
                        placeholder="e.g. SF-INVITE-2026"
                        value={invitationCode}
                        onChange={(e) => setInvitationCode(e.target.value)}
                        helperText="Mandated by statutory rule: Super Admin clearance or controlled code."
                      />

                      <div className="sm:col-span-2">
                        <FormField
                          label="Address"
                          placeholder="Plot No, Street, Landmark"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                        />
                      </div>

                      <FormField
                        label="City *"
                        placeholder="Pune"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                      />

                      <FormField
                        label="State *"
                        placeholder="Maharashtra"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                      />

                      <FormField
                        label="Postal Pin Code"
                        placeholder="411045"
                        value={pinCode}
                        onChange={(e) => setPinCode(e.target.value)}
                      />

                      <FormField
                        label="Society Contact Email"
                        type="email"
                        placeholder="society.office@greenwood.in"
                        value={contactEmail}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setContactEmail(e.target.value)}
                      />

                      <FormField
                        label="Society Contact Phone"
                        type="tel"
                        placeholder="+91 98765 43210"
                        value={contactPhone}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setContactPhone(e.target.value)}
                      />
                    </div>
                  </motion.div>
                )}

                {/* STEP 2: Society Structure */}
                {currentStep === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    className="space-y-4"
                  >
                    <div>
                      <h2 className="text-lg font-bold font-heading text-[#1A1A1A]">
                        Step 2: Society Structure &amp; Flat Numbering
                      </h2>
                      <p className="text-xs text-[#6B7280]">
                        Define wings, floors, and flat patterns to automatically generate unit records.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <FormField
                          label="Building / Complex Name"
                          placeholder="e.g. Greenwood Residency Tower Complex"
                          value={buildingName}
                          onChange={(e) => setBuildingName(e.target.value)}
                        />
                      </div>

                      <FormField
                        label="Number of Wings"
                        type="number"
                        min="1"
                        max="12"
                        value={wingsCount.toString()}
                        onChange={(e) => setWingsCount(parseInt(e.target.value, 10) || 1)}
                      />

                      <FormField
                        label="Floors per Wing"
                        type="number"
                        min="1"
                        max="40"
                        value={floorsPerWing.toString()}
                        onChange={(e) => setFloorsPerWing(parseInt(e.target.value, 10) || 1)}
                      />

                      <FormField
                        label="Flats per Floor"
                        type="number"
                        min="1"
                        max="12"
                        value={flatsPerFloor.toString()}
                        onChange={(e) => setFlatsPerFloor(parseInt(e.target.value, 10) || 1)}
                      />

                      <FormField
                        label="Flat Numbering Pattern"
                        value={flatPattern}
                        onChange={(e) => setFlatPattern(e.target.value)}
                        helperText="Calculated total units: Wings × Floors × Flats/Floor"
                      />
                    </div>

                    <div className="p-4 rounded-xl bg-[#EEF2FF] border border-[#C7D2FE] flex items-center justify-between text-xs text-[#4338CA]">
                      <div className="flex items-center gap-2.5">
                        <IonIcon name="business-outline" size={20} />
                        <span>Calculated Total Residential Units:</span>
                      </div>
                      <span className="font-bold text-sm bg-white px-3 py-1 rounded-full border border-[#C7D2FE]">
                        {totalCalculatedFlats} Flats
                      </span>
                    </div>
                  </motion.div>
                )}

                {/* STEP 3: Committee Members */}
                {currentStep === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    className="space-y-4"
                  >
                    <div>
                      <h2 className="text-lg font-bold font-heading text-[#1A1A1A]">
                        Step 3: Managing Committee Members
                      </h2>
                      <p className="text-xs text-[#6B7280]">
                        Assign elected committee members to statutory governance seats.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        label="Secretary Email *"
                        placeholder="secretary@society.in"
                        value={secretaryEmail}
                        onChange={(e) => setSecretaryEmail(e.target.value)}
                        helperText="Authorized administrator for approvals and records."
                      />

                      <FormField
                        label="Chairman Email *"
                        placeholder="chairman@society.in"
                        value={chairmanEmail}
                        onChange={(e) => setChairmanEmail(e.target.value)}
                        helperText="Committee presiding authority for statutory NOCs."
                      />

                      <FormField
                        label="Treasurer Email"
                        placeholder="treasurer@society.in"
                        value={treasurerEmail}
                        onChange={(e) => setTreasurerEmail(e.target.value)}
                        helperText="Authorized signatory for billing and maintenance."
                      />

                      <FormField
                        label="Society Manager Email"
                        placeholder="manager@society.in"
                        value={managerEmail}
                        onChange={(e) => setManagerEmail(e.target.value)}
                        helperText="Estate operations coordinator."
                      />
                    </div>
                  </motion.div>
                )}

                {/* STEP 4: Review and Activate */}
                {currentStep === 4 && (
                  <motion.div
                    key="step4"
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    className="space-y-4"
                  >
                    <div>
                      <h2 className="text-lg font-bold font-heading text-[#1A1A1A]">
                        Step 4: Review &amp; Activate Society
                      </h2>
                      <p className="text-xs text-[#6B7280]">
                        Verify parameters before generating statutory database records.
                      </p>
                    </div>

                    <div className="rounded-xl border border-[#E5E7EB] bg-[#F8F9FA] p-5 space-y-3 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="p-3 rounded-lg bg-white border border-[#E5E7EB]">
                          <span className="text-[#9CA3AF] text-[10px] font-bold uppercase block">Society Name:</span>
                          <span className="font-bold text-sm text-[#1A1A1A]">{societyName}</span>
                          <span className="text-xs text-[#4F46E5] block font-mono">{registrationNumber}</span>
                        </div>

                        <div className="p-3 rounded-lg bg-white border border-[#E5E7EB]">
                          <span className="text-[#9CA3AF] text-[10px] font-bold uppercase block">Structure:</span>
                          <span className="font-bold text-sm text-[#1A1A1A]">{totalCalculatedFlats} Total Flats</span>
                          <span className="text-xs text-[#6B7280] block">{wingsCount} Wings • {floorsPerWing} Floors</span>
                        </div>

                        <div className="sm:col-span-2 p-3 rounded-lg bg-white border border-[#E5E7EB] space-y-1">
                          <span className="text-[#9CA3AF] text-[10px] font-bold uppercase block">Appointed Committee:</span>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                            <div><strong>Secretary:</strong> {secretaryEmail || "Current User"}</div>
                            <div><strong>Chairman:</strong> {chairmanEmail || "Designate"}</div>
                            <div><strong>Treasurer:</strong> {treasurerEmail || "Designate"}</div>
                            <div><strong>Manager:</strong> {managerEmail || "Designate"}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border border-[#C7D2FE] bg-[#EEF2FF] text-xs text-[#1A1A1A] flex items-start gap-3">
                      <IconContainer
                        name="shield-checkmark-outline"
                        variant="hero-soft"
                        size="sm"
                        className="bg-white shrink-0 mt-0.5"
                      />
                      <div>
                        <strong className="block font-bold mb-0.5">Statutory Activation Protocol</strong>
                        <p className="text-[#4B5563] leading-relaxed">
                          Clicking &ldquo;Activate Society Records&rdquo; will create real MongoDB collections for Society, Buildings, Wings, Flats, and verified Committee Memberships.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Navigation Controls */}
              <div className="pt-6 border-t border-[#E5E7EB] flex items-center justify-between gap-3">
                {currentStep > 1 ? (
                  <AppButton
                    variant="outline"
                    size="sm"
                    onClick={handlePrev}
                    leftIcon="arrow-back-outline"
                  >
                    Back
                  </AppButton>
                ) : (
                  <Link href="/admin/dashboard">
                    <AppButton variant="ghost" size="sm">
                      Cancel Setup
                    </AppButton>
                  </Link>
                )}

                {currentStep < 4 ? (
                  <AppButton
                    variant="hero"
                    size="md"
                    onClick={handleNext}
                    rightIcon="arrow-forward-outline"
                  >
                    Next Step
                  </AppButton>
                ) : (
                  <AppButton
                    variant="hero"
                    size="md"
                    onClick={handleActivateSociety}
                    disabled={isSubmitting}
                    rightIcon="checkmark-circle-outline"
                  >
                    {isSubmitting ? "Activating Records..." : "Activate Society Records"}
                  </AppButton>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-4xl mx-auto text-center text-xs text-[#9CA3AF]">
        <span>© 2026 SocietyFlow • Cooperative Housing Statutory Setup Wizard</span>
      </footer>
    </div>
  );
}
