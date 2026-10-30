"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import {
  PageHeader,
  StatusBadge,
  AppButton,
  Modal,
  IonIcon,
  FormField,
} from "@/components/ui";

type CommitteePosition = "SECRETARY" | "CHAIRMAN" | "TREASURER" | "SOCIETY_MANAGER";
type DashboardTab = "PROFILE" | "REQUESTS" | "FLATS";
type RequestFilter = "ALL" | "PENDING" | "APPROVED" | "REJECTED";
type RoleFilter = "ALL" | "OWNER" | "TENANT";

interface RegistrationRequestItem {
  id: string;
  applicantId: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone?: string;
  role: "OWNER" | "TENANT" | "MANAGEMENT";
  societyId: string;
  wingName: string;
  flatNumber: string;
  ownershipType?: string;
  leaseStartDate?: string;
  leaseEndDate?: string;
  ownerName?: string;
  status: string;
  ownerApproval: { status: string; comment?: string };
  societyApproval: { status: string; comment?: string };
  onboardingStatus: string;
  createdAt: string;
  existingOccupancy?: {
    type: string;
    ownerName: string;
    ownerEmail: string;
    isConflict: boolean;
  } | null;
}

interface FlatItem {
  id: string;
  wing: string;
  wingId?: string;
  flatNumber: string;
  floor: number;
  bhkType?: string;
  occupancyType: string;
  occupantName?: string;
  owner?: { id: string; name: string; email: string; phone?: string };
  tenant?: { id: string; name: string; email: string; phone?: string };
  documentCount?: number;
}

interface WingItem {
  id: string;
  name: string;
  totalFloors?: number;
  totalFlats?: number;
}

interface FlatDossierDoc {
  id: string;
  documentId: string;
  displayName: string;
  originalFilename: string;
  category: string;
  size: number;
  mimeType: string;
  version: number;
  verificationStatus: string;
  correctionNote?: string;
  uploadedBy?: { name?: string; email?: string };
  createdAt: string;
  viewUrl: string;
  downloadUrl: string;
}

interface FlatDossierData {
  flat: {
    id: string;
    flatNumber: string;
    floor: number;
    buildingName?: string;
    wingName?: string;
  };
  occupancies: Array<{
    _id: string;
    occupancyType: string;
    status: string;
    userId: {
      name: string;
      email: string;
      phone?: string;
    };
  }>;
  documents: FlatDossierDoc[];
}

interface SocietyDocumentItem {
  id: string;
  displayName: string;
  originalFilename: string;
  category: string;
  size: number;
  mimeType: string;
  version: number;
  uploadedBy?: { name?: string; email?: string };
  createdAt: string;
  viewUrl: string;
  downloadUrl: string;
}

interface ManagementData {
  society: {
    id: string;
    name: string;
    code: string;
    registrationNumber: string;
    city: string;
    address?: string;
    state?: string;
    pinCode?: string;
    district?: string;
    contactEmail?: string;
    contactPhone?: string;
    createdAt?: string;
  };
  stats: {
    totalFlats: number;
    registeredResidents: number;
    pendingApprovals: number;
    totalWings: number;
  };
  wings?: WingItem[];
  activeRole: string;
  registrationRequests?: RegistrationRequestItem[];
  flatsList?: FlatItem[];
}

export default function ManagementDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [data, setData] = useState<ManagementData | null>(null);
  const [activeTab, setActiveTab] = useState<DashboardTab>("REQUESTS");
  const [activePosition, setActivePosition] = useState<CommitteePosition>("SECRETARY");

  // Requests Tab Filter State
  const [requestStatusFilter, setRequestStatusFilter] = useState<RequestFilter>("ALL");
  const [requestRoleFilter, setRequestRoleFilter] = useState<RoleFilter>("ALL");

  // Review Application Modal State
  const [selectedRequest, setSelectedRequest] = useState<RegistrationRequestItem | null>(null);
  const [reviewComment, setReviewComment] = useState("");
  const [actionProcessing, setActionProcessing] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Appoint Officer Modal State
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState<CommitteePosition>("TREASURER");
  const [isInviting, setIsInviting] = useState(false);
  const [inviteFeedback, setInviteFeedback] = useState<string | null>(null);

  // Edit Society Info Modal State
  const [isEditSocietyOpen, setIsEditSocietyOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editRegNo, setEditRegNo] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editDistrict, setEditDistrict] = useState("");
  const [editState, setEditState] = useState("");
  const [editPin, setEditPin] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [isSavingSociety, setIsSavingSociety] = useState(false);

  // Society Documents State (Profile Tab)
  const [societyDocs, setSocietyDocs] = useState<SocietyDocumentItem[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [isUploadDocOpen, setIsUploadDocOpen] = useState(false);
  const [uploadDocFile, setUploadDocFile] = useState<File | null>(null);
  const [uploadDocName, setUploadDocName] = useState("");
  const [uploadDocCategory, setUploadDocCategory] = useState("BYELAWS");
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);

  // Flats Tab State: Wings separation
  const [selectedWing, setSelectedWing] = useState<string>("ALL");
  const [flatOccupancyFilter, setFlatOccupancyFilter] = useState<string>("ALL");

  // Flat Inspection & Dossier Modal State
  const [selectedFlatForDossier, setSelectedFlatForDossier] = useState<FlatItem | null>(null);
  const [flatDossierLoading, setFlatDossierLoading] = useState(false);
  const [flatDossier, setFlatDossier] = useState<FlatDossierData | null>(null);
  const [dossierFeedback, setDossierFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [correctionTargetDocId, setCorrectionTargetDocId] = useState<string | null>(null);
  const [correctionNoteInput, setCorrectionNoteInput] = useState("");
  const [dossierActionProcessing, setDossierActionProcessing] = useState(false);
  const [dossierPreviewDoc, setDossierPreviewDoc] = useState<{
    displayName: string;
    category?: string;
    size?: number;
    mimeType?: string;
    viewUrl: string;
    downloadUrl: string;
    uploadedBy?: { name?: string; email?: string };
    originalFilename?: string;
  } | null>(null);

  // Setup Popup Modal ("Just before dashboard") State
  const [showInitialSetupModal, setShowInitialSetupModal] = useState(false);
  const [hasCheckedInitialSetup, setHasCheckedInitialSetup] = useState(false);
  const [setupBuildingName, setSetupBuildingName] = useState("");
  const [setupWingNames, setSetupWingNames] = useState("Wing A, Wing B");
  const [setupFloorsPerWing, setSetupFloorsPerWing] = useState(4);
  const [setupFlatsPerFloor, setSetupFlatsPerFloor] = useState(4);
  const [setupPattern, setSetupPattern] = useState<"WING_FLOOR_UNIT" | "FLOOR_UNIT">("WING_FLOOR_UNIT");
  const [setupBhk, setSetupBhk] = useState("2 BHK");
  const [isSubmittingSetup, setIsSubmittingSetup] = useState(false);

  // Add Flat Manually Modal State
  const [isAddFlatOpen, setIsAddFlatOpen] = useState(false);
  const [addFlatWingId, setAddFlatWingId] = useState("");
  const [addFlatNumber, setAddFlatNumber] = useState("");
  const [addFlatFloor, setAddFlatFloor] = useState(1);
  const [addFlatBhk, setAddFlatBhk] = useState("2 BHK");
  const [isSubmittingAddFlat, setIsSubmittingAddFlat] = useState(false);

  // Add Wing Modal State
  const [isAddWingOpen, setIsAddWingOpen] = useState(false);
  const [newWingName, setNewWingName] = useState("");
  const [newWingFloors, setNewWingFloors] = useState(4);
  const [newWingFlatsPerFloor, setNewWingFlatsPerFloor] = useState(4);
  const [isSubmittingWing, setIsSubmittingWing] = useState(false);

  // Global Feedback Alert
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/dashboard/management");
      if (!res.ok) {
        setData(null);
        return;
      }
      const resData: ManagementData = await res.json();
      if (!resData || !resData.society || !resData.society.id || !resData.society.name) {
        setData(null);
        return;
      }
      setData(resData);

      if (
        resData.activeRole &&
        ["SECRETARY", "CHAIRMAN", "TREASURER", "SOCIETY_MANAGER"].includes(resData.activeRole)
      ) {
        setActivePosition(resData.activeRole as CommitteePosition);
      }

      // Prepopulate edit modal state
      if (resData.society) {
        setEditName(resData.society.name || "");
        setEditRegNo(resData.society.registrationNumber || "");
        setEditAddress(resData.society.address || "");
        setEditCity(resData.society.city || "");
        setEditDistrict(resData.society.district || "");
        setEditState(resData.society.state || "Maharashtra");
        setEditPin(resData.society.pinCode || "");
        setEditEmail(resData.society.contactEmail || "");
        setEditPhone(resData.society.contactPhone || "");
        if (!setupBuildingName) {
          setSetupBuildingName(`${resData.society.name} Tower`);
        }
        if (resData.wings && resData.wings.length > 0) {
          setSetupWingNames(resData.wings.map((w: any) => w.name).join(", "));
        }
      }

      // Only show setup popup if the society structure has NOT been registered yet (both wings and flats are 0)
      const totalUnits = resData.flatsList?.length ?? 0;
      const totalWings = resData.wings?.length ?? 0;
      const isDismissed =
        typeof window !== "undefined" && resData.society?.id
          ? localStorage.getItem(`sf_setup_dismissed_${resData.society.id}`) === "true"
          : false;

      // If society already has wings or flats registered, do NOT show this popup
      if (
        resData.society?.id &&
        !hasCheckedInitialSetup &&
        !isDismissed &&
        totalWings === 0 &&
        totalUnits === 0
      ) {
        setShowInitialSetupModal(true);
        setHasCheckedInitialSetup(true);
      }

      // Default selected wing
      if (resData.wings && resData.wings.length > 0 && selectedWing === "ALL") {
        setSelectedWing(resData.wings[0].name);
      }
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const loadSocietyDocs = async () => {
    try {
      setLoadingDocs(true);
      const res = await fetch("/api/society-documents");
      if (!res.ok) return;
      const json = await res.json();
      if (json.documents) {
        setSocietyDocs(json.documents);
      }
    } catch {
      // Quiet fallback
    } finally {
      setLoadingDocs(false);
    }
  };

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((d) => {
        if (d?.user?.isSuperAdmin) {
          setIsSuperAdmin(true);
        }
      })
      .catch(() => {});
    loadData();
    loadSocietyDocs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDismissSetupModal = () => {
    setShowInitialSetupModal(false);
    if (data?.society?.id && typeof window !== "undefined") {
      try {
        localStorage.setItem(`sf_setup_dismissed_${data.society.id}`, "true");
      } catch {}
    }
    if (isSuperAdmin) {
      router.push("/admin/dashboard");
    }
  };

  // Inspect specific flat dossier (resident details + uploaded property documents)
  const openFlatDossier = async (flat: FlatItem) => {
    setSelectedFlatForDossier(flat);
    setFlatDossierLoading(true);
    setFlatDossier(null);
    setDossierFeedback(null);
    setCorrectionTargetDocId(null);
    setCorrectionNoteInput("");

    try {
      const res = await fetch(`/api/management/flats/${flat.id}/documents`);
      const resJson = await res.json();
      if (!res.ok) throw new Error(resJson.error || "Failed to load flat documents");
      setFlatDossier(resJson);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error loading flat dossier";
      setDossierFeedback({ type: "error", text: msg });
    } finally {
      setFlatDossierLoading(false);
    }
  };

  // Document verification within flat dossier
  const handleDocumentVerification = async (
    docId: string,
    action: "VERIFY" | "REQUEST_CORRECTION"
  ) => {
    if (!selectedFlatForDossier) return;
    if (action === "REQUEST_CORRECTION" && !correctionNoteInput.trim()) {
      setDossierFeedback({
        type: "error",
        text: "Please enter a correction note explaining what needs to be changed.",
      });
      return;
    }

    setDossierActionProcessing(true);
    setDossierFeedback(null);

    try {
      const res = await fetch(`/api/management/flats/${selectedFlatForDossier.id}/documents`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId: docId,
          action,
          correctionNote: action === "REQUEST_CORRECTION" ? correctionNoteInput.trim() : undefined,
        }),
      });

      const resJson = await res.json();
      if (!res.ok) throw new Error(resJson.error || "Failed to update verification status");

      setDossierFeedback({
        type: "success",
        text:
          action === "VERIFY"
            ? "Document verified and sealed successfully."
            : "Correction notice dispatched to resident.",
      });

      if (flatDossier) {
        setFlatDossier({
          ...flatDossier,
          documents: flatDossier.documents.map((d) =>
            d.id === docId
              ? {
                  ...d,
                  verificationStatus: action === "VERIFY" ? "VERIFIED" : "CORRECTION_REQUESTED",
                  correctionNote:
                    action === "REQUEST_CORRECTION" ? correctionNoteInput.trim() : d.correctionNote,
                }
              : d
          ),
        });
      }
      setCorrectionTargetDocId(null);
      setCorrectionNoteInput("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error verifying document";
      setDossierFeedback({ type: "error", text: msg });
    } finally {
      setDossierActionProcessing(false);
    }
  };

  // Approval actions on registration requests
  const handleReviewAction = async (action: "APPROVE" | "REQUEST_INFO" | "REJECT") => {
    if (!selectedRequest) return;
    setActionProcessing(true);
    setActionMessage(null);

    try {
      const res = await fetch("/api/management/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: selectedRequest.id,
          action,
          comment: reviewComment.trim() || undefined,
        }),
      });

      const resJson = await res.json();
      if (!res.ok) {
        setActionMessage({ type: "error", text: resJson.error || "Action could not be executed." });
        setActionProcessing(false);
        return;
      }

      setActionMessage({ type: "success", text: resJson.message || "Approval decision recorded." });
      setActionProcessing(false);
      setTimeout(() => {
        setSelectedRequest(null);
        setReviewComment("");
        setActionMessage(null);
        loadData();
      }, 1000);
    } catch {
      setActionMessage({ type: "error", text: "Network error while submitting approval decision." });
      setActionProcessing(false);
    }
  };

  // Appoint Committee Member
  const handleInviteCommittee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setIsInviting(true);
    setInviteFeedback(null);

    try {
      const res = await fetch("/api/management/invite-committee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: inviteName,
          email: inviteEmail,
          role: inviteRole,
        }),
      });

      const resJson = await res.json();
      if (!res.ok) {
        setInviteFeedback(resJson.error || "Failed to assign committee seat.");
        setIsInviting(false);
        return;
      }

      setInviteFeedback("Success: Committee seat assigned and credentials notified.");
      setIsInviting(false);
      setTimeout(() => {
        setIsInviteModalOpen(false);
        setInviteEmail("");
        setInviteName("");
        setInviteFeedback(null);
        loadData();
      }, 1200);
    } catch {
      setInviteFeedback("Network error while inviting member.");
      setIsInviting(false);
    }
  };

  // Update Society Profile
  const handleSaveSocietyProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSavingSociety(true);
      const res = await fetch("/api/management/society", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          registrationNumber: editRegNo.trim(),
          address: editAddress.trim(),
          city: editCity.trim(),
          district: editDistrict.trim(),
          state: editState.trim(),
          pinCode: editPin.trim(),
          contactEmail: editEmail.trim().toLowerCase(),
          contactPhone: editPhone.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to update society details");

      setFeedback({ type: "success", text: "Society details updated successfully." });
      setIsEditSocietyOpen(false);
      loadData();
    } catch (err: unknown) {
      setFeedback({ type: "error", text: err instanceof Error ? err.message : "Error saving society" });
    } finally {
      setIsSavingSociety(false);
    }
  };

  // Upload Society-wide Document
  const handleUploadSocietyDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadDocFile || !uploadDocName.trim()) {
      setFeedback({ type: "error", text: "Please select a file and enter a document title." });
      return;
    }

    try {
      setIsUploadingDoc(true);
      const formData = new FormData();
      formData.append("file", uploadDocFile);
      formData.append("displayName", uploadDocName.trim());
      formData.append("category", uploadDocCategory);
      formData.append("visibility", "ALL_RESIDENTS");

      const res = await fetch("/api/society-documents", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to upload society document");

      setFeedback({ type: "success", text: `Document "${uploadDocName}" uploaded successfully.` });
      setIsUploadDocOpen(false);
      setUploadDocFile(null);
      setUploadDocName("");
      loadSocietyDocs();
    } catch (err: unknown) {
      setFeedback({ type: "error", text: err instanceof Error ? err.message : "Error uploading document" });
    } finally {
      setIsUploadingDoc(false);
    }
  };

  // Submit Initial Structure Setup Popup Form ("Just before dashboard")
  const handleSubmitInitialSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    const wingsArray = setupWingNames
      .split(",")
      .map((w) => w.trim())
      .filter(Boolean);

    if (wingsArray.length === 0) {
      setFeedback({ type: "error", text: "Please specify at least one wing (e.g. Wing A, Wing B)" });
      return;
    }

    try {
      setIsSubmittingSetup(true);
      const res = await fetch("/api/management/structure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SETUP_INITIAL_STRUCTURE",
          buildingName: setupBuildingName.trim() || undefined,
          wingNames: wingsArray,
          floorsPerWing: Number(setupFloorsPerWing),
          flatsPerFloor: Number(setupFlatsPerFloor),
          pattern: setupPattern,
          bhkType: setupBhk,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Structure setup failed");

      setFeedback({
        type: "success",
        text: `Society structure initialized! Created ${json.createdWingsCount || wingsArray.length} wings and ${json.createdFlatsCount || 0} flats ready for onboarding.`,
      });
      setShowInitialSetupModal(false);
      if (data?.society?.id && typeof window !== "undefined") {
        try {
          localStorage.setItem(`sf_setup_dismissed_${data.society.id}`, "true");
        } catch {}
      }
      await loadData();
      setActiveTab("FLATS");
      if (isSuperAdmin) {
        setTimeout(() => {
          router.push("/admin/dashboard");
        }, 1200);
      }
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to initialize structure",
      });
    } finally {
      setIsSubmittingSetup(false);
    }
  };

  // Add Flat Manually
  const handleAddSingleFlat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addFlatNumber.trim()) {
      setFeedback({ type: "error", text: "Please enter a flat identifier (e.g. 101 or A-101)" });
      return;
    }

    try {
      setIsSubmittingAddFlat(true);
      const res = await fetch("/api/management/flats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE_FLAT",
          wingId: addFlatWingId || undefined,
          flatNumber: addFlatNumber.trim().toUpperCase(),
          floor: Number(addFlatFloor),
          bhkType: addFlatBhk,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to add flat");

      setFeedback({
        type: "success",
        text: `Flat ${addFlatNumber.toUpperCase()} registered successfully.`,
      });
      setIsAddFlatOpen(false);
      setAddFlatNumber("");
      loadData();
    } catch (err: unknown) {
      setFeedback({ type: "error", text: err instanceof Error ? err.message : "Error adding flat" });
    } finally {
      setIsSubmittingAddFlat(false);
    }
  };

  // Add Wing
  const handleAddWing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWingName.trim()) {
      setFeedback({ type: "error", text: "Please enter a wing name (e.g. Wing C)" });
      return;
    }

    try {
      setIsSubmittingWing(true);
      const res = await fetch("/api/management/structure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ADD_WING",
          name: newWingName.trim(),
          totalFloors: Number(newWingFloors) || 4,
          flatsPerFloor: Number(newWingFlatsPerFloor) || 4,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to create wing");

      setFeedback({
        type: "success",
        text: `Wing "${newWingName.trim()}" created successfully.`,
      });
      setIsAddWingOpen(false);
      setNewWingName("");
      loadData();
    } catch (err: unknown) {
      setFeedback({ type: "error", text: err instanceof Error ? err.message : "Error creating wing" });
    } finally {
      setIsSubmittingWing(false);
    }
  };

  const society = data?.society || {
    id: "default",
    name: "Housing Society",
    code: "ACTIVE",
    registrationNumber: "N/A",
    city: "Pune",
  };

  const stats = data?.stats || {
    totalFlats: 0,
    registeredResidents: 0,
    pendingApprovals: 0,
    totalWings: 1,
  };

  const allRequests = data?.registrationRequests || [];
  const filteredRequests = allRequests.filter((r) => {
    const matchStatus =
      requestStatusFilter === "ALL"
        ? true
        : requestStatusFilter === "PENDING"
        ? r.status.includes("PENDING")
        : r.status === requestStatusFilter;

    const matchRole =
      requestRoleFilter === "ALL" ? true : r.role === requestRoleFilter;

    return matchStatus && matchRole;
  });

  const wings = data?.wings || [];
  const flatsList = data?.flatsList || [];

  // Group flats by Wing
  const flatsByWing: Record<string, FlatItem[]> = {};
  flatsList.forEach((f) => {
    const w = f.wing || "Main Complex";
    if (!flatsByWing[w]) flatsByWing[w] = [];
    flatsByWing[w].push(f);
  });

  // Effective wings list (from wings or flatsByWing)
  const availableWingNames = Array.from(
    new Set([...wings.map((w) => w.name), ...Object.keys(flatsByWing)])
  ).filter(Boolean);

  const displayedFlats = useMemo(() => {
    let list =
      selectedWing === "ALL"
        ? flatsList
        : flatsList.filter((f) => (f.wing || "Main Complex") === selectedWing);

    if (flatOccupancyFilter !== "ALL") {
      list = list.filter((f) => f.occupancyType === flatOccupancyFilter);
    }

    return list.sort((a, b) => {
      if (a.floor !== b.floor) return a.floor - b.floor;
      return a.flatNumber.localeCompare(b.flatNumber, undefined, { numeric: true });
    });
  }, [flatsList, selectedWing, flatOccupancyFilter]);

  // Initial setup candidate calculation
  const setupPreviewCount = useMemo(() => {
    const count = setupWingNames.split(",").map((s) => s.trim()).filter(Boolean).length;
    return count * setupFloorsPerWing * setupFlatsPerFloor;
  }, [setupWingNames, setupFloorsPerWing, setupFlatsPerFloor]);

  if (loading) {
    return (
      <AppShell>
        <div className="space-y-4 animate-pulse">
          <div className="h-20 bg-white rounded-2xl border border-[#E5E7EB]" />
          <div className="h-16 bg-white rounded-xl border border-[#E5E7EB]" />
          <div className="h-64 bg-white rounded-2xl border border-[#E5E7EB]" />
        </div>
      </AppShell>
    );
  }

  // Clean empty state if no society is present in the database
  if (!data || !data.society || !data.society.id || !data.society.name) {
    return (
      <AppShell>
        <div className="space-y-6">
          <PageHeader
            title="Society Management Dashboard"
            description="Statutory Governance & Community Administration Desk"
          />

          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-12 text-center flex flex-col items-center justify-center shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center mb-4">
              <IonIcon name="business-outline" size={32} />
            </div>
            <h3 className="text-lg font-bold text-[#111827] font-heading mb-1.5">
              No Data Present
            </h3>
            <p className="text-sm text-[#6B7280] max-w-md mx-auto mb-6 leading-relaxed">
              There is currently no active society registered or configured for this management console.
            </p>
            <div className="flex items-center gap-3">
              <Link href="/onboarding/society-setup">
                <AppButton variant="hero" size="sm" leftIcon="add-outline">
                  + Register Society
                </AppButton>
              </Link>
              <AppButton variant="secondary" size="sm" leftIcon="refresh-outline" onClick={loadData}>
                Refresh
              </AppButton>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      {/* Page Header */}
      <PageHeader
        title={society.name}
        description={`Statutory Governance Desk • Reg: ${society.registrationNumber} • ${society.city}`}
        badge={
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#EEF2FF] border border-[#C7D2FE] text-[#4F46E5] text-xs font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4F46E5] animate-pulse" />
            <span>Acting as {activePosition.replace("_", " ")}</span>
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            {/* Quick Position Switcher */}
            <div className="hidden sm:flex items-center bg-[#F3F4F6] p-0.5 rounded-xl border border-[#E5E7EB] text-xs">
              {(
                [
                  { id: "SECRETARY", label: "Sec" },
                  { id: "CHAIRMAN", label: "Chair" },
                  { id: "TREASURER", label: "Treas" },
                  { id: "SOCIETY_MANAGER", label: "Mgr" },
                ] as const
              ).map((pos) => (
                <button
                  key={pos.id}
                  type="button"
                  onClick={() => setActivePosition(pos.id)}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    activePosition === pos.id
                      ? "bg-white text-[#4F46E5] shadow-xs"
                      : "text-[#6B7280] hover:text-[#1A1A1A]"
                  }`}
                  title={`Switch active desk view to ${pos.label}`}
                >
                  {pos.label}
                </button>
              ))}
            </div>

            {/* Back to Super Admin shortcut if viewing from Super Admin role */}
            {isSuperAdmin && (
              <Link href="/admin/dashboard">
                <AppButton
                  variant="outline"
                  size="sm"
                  leftIcon="arrow-back-outline"
                  className="text-[#4F46E5] border-[#C7D2FE] bg-[#EEF2FF] hover:bg-[#E0E7FF] font-bold"
                >
                  Back to Super Admin
                </AppButton>
              </Link>
            )}

            {/* Quick Setup Structure Button */}
            <AppButton
              variant="outline"
              size="sm"
              leftIcon="construct-outline"
              onClick={() => setShowInitialSetupModal(true)}
            >
              Quick Setup Wizard
            </AppButton>

            <AppButton
              variant="hero"
              size="sm"
              leftIcon="person-add-outline"
              onClick={() => setIsInviteModalOpen(true)}
            >
              Appoint Officer
            </AppButton>
          </div>
        }
      />

      {/* Global Feedback Banner */}
      {feedback && (
        <div
          className={`p-3.5 my-3 rounded-xl border flex items-center justify-between text-xs font-semibold ${
            feedback.type === "success"
              ? "bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46]"
              : "bg-[#FFF1F2] border-[#FECDD3] text-[#BE123C]"
          }`}
        >
          <div className="flex items-center gap-2">
            <IonIcon
              name={feedback.type === "success" ? "checkmark-circle" : "alert-circle"}
              size={18}
            />
            <span>{feedback.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs hover:opacity-70 p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Metric Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
        <div className="p-3 bg-white border border-[#E5E7EB] rounded-xl flex items-center gap-3 shadow-xs">
          <div className="w-9 h-9 rounded-lg bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center shrink-0">
            <IonIcon name="business-outline" size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-[#6B7280] uppercase truncate">Total Flats</p>
            <p className="text-base font-extrabold text-[#1A1A1A] leading-tight">
              {stats.totalFlats}{" "}
              <span className="text-[11px] font-normal text-[#9CA3AF]">
                in {availableWingNames.length || stats.totalWings} wing{availableWingNames.length === 1 ? "" : "s"}
              </span>
            </p>
          </div>
        </div>

        <div className="p-3 bg-white border border-[#E5E7EB] rounded-xl flex items-center gap-3 shadow-xs">
          <div className="w-9 h-9 rounded-lg bg-[#ECFDF5] text-[#10B981] flex items-center justify-center shrink-0">
            <IonIcon name="people-outline" size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-[#6B7280] uppercase truncate">Residents</p>
            <p className="text-base font-extrabold text-[#1A1A1A] leading-tight">
              {stats.registeredResidents}{" "}
              <span className="text-[11px] font-normal text-[#9CA3AF]">Verified</span>
            </p>
          </div>
        </div>

        <div className="p-3 bg-white border border-[#E5E7EB] rounded-xl flex items-center gap-3 shadow-xs">
          <div className="w-9 h-9 rounded-lg bg-[#FFFBEB] text-[#D97706] flex items-center justify-center shrink-0">
            <IonIcon name="mail-unread-outline" size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-[#6B7280] uppercase truncate">Pending</p>
            <p className="text-base font-extrabold text-[#D97706] leading-tight">
              {stats.pendingApprovals}{" "}
              <span className="text-[11px] font-normal text-[#9CA3AF]">Awaiting</span>
            </p>
          </div>
        </div>

        <div className="p-3 bg-white border border-[#E5E7EB] rounded-xl flex items-center gap-3 shadow-xs">
          <div className="w-9 h-9 rounded-lg bg-[#F3F4F6] text-[#4F46E5] flex items-center justify-center shrink-0">
            <IonIcon name="shield-checkmark-outline" size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-[#6B7280] uppercase truncate">Quorum</p>
            <p className="text-base font-extrabold text-[#10B981] leading-tight">
              Active{" "}
              <span className="text-[11px] font-normal text-[#9CA3AF]">MCS 1960</span>
            </p>
          </div>
        </div>
      </div>

      {/* 3 STRICT PRIMARY TABS: Profile, Request, Flat */}
      <div className="flex items-center justify-between border-b border-[#E5E7EB] mb-5">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {/* TAB 1: PROFILE */}
          <button
            type="button"
            onClick={() => setActiveTab("PROFILE")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "PROFILE"
                ? "bg-[#1A1A1A] text-white shadow-xs"
                : "bg-white text-[#6B7280] border border-[#E5E7EB] hover:bg-[#F9FAFB] hover:text-[#1A1A1A]"
            }`}
          >
            <IonIcon name="information-circle-outline" size={16} />
            <span>Profile</span>
          </button>

          {/* TAB 2: REQUEST */}
          <button
            type="button"
            onClick={() => setActiveTab("REQUESTS")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "REQUESTS"
                ? "bg-[#1A1A1A] text-white shadow-xs"
                : "bg-white text-[#6B7280] border border-[#E5E7EB] hover:bg-[#F9FAFB] hover:text-[#1A1A1A]"
            }`}
          >
            <IonIcon name="file-tray-full-outline" size={16} />
            <span>Request</span>
            {allRequests.length > 0 && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  activeTab === "REQUESTS" ? "bg-white/20 text-white" : "bg-[#F3F4F6] text-[#4F46E5]"
                }`}
              >
                {allRequests.length}
              </span>
            )}
          </button>

          {/* TAB 3: FLAT */}
          <button
            type="button"
            onClick={() => setActiveTab("FLATS")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "FLATS"
                ? "bg-[#1A1A1A] text-white shadow-xs"
                : "bg-white text-[#6B7280] border border-[#E5E7EB] hover:bg-[#F9FAFB] hover:text-[#1A1A1A]"
            }`}
          >
            <IonIcon name="business-outline" size={16} />
            <span>Flat</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === "FLATS" ? "bg-white/20 text-white" : "bg-[#F3F4F6] text-[#6B7280]"
              }`}
            >
              {flatsList.length}
            </span>
          </button>
        </div>

        {/* Tab Right Hint / Secondary Shortcut */}
        <div className="hidden sm:block pb-2 text-xs text-[#9CA3AF]">
          {activeTab === "PROFILE" && "Official Society Credentials & Document Vault"}
          {activeTab === "REQUESTS" && `${filteredRequests.length} requests in queue`}
          {activeTab === "FLATS" && `Inspecting ${displayedFlats.length} units`}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: PROFILE (Society Info & Society Related Documents) */}
      {/* ========================================================================= */}
      {activeTab === "PROFILE" && (
        <div className="space-y-6">
          {/* Top Row: Society Registered Information & Managing Committee */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Society Identity Card */}
            <div className="lg:col-span-2 p-5 bg-white rounded-2xl border border-[#E5E7EB] space-y-4 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-[#F1F3F5]">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center">
                    <IonIcon name="business" size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#1A1A1A]">{society.name}</h3>
                    <p className="text-[11px] text-[#6B7280]">
                      Registered Housing Society • Code: <span className="font-mono font-bold text-[#4F46E5]">{society.code}</span>
                    </p>
                  </div>
                </div>

                <AppButton
                  variant="outline"
                  size="sm"
                  leftIcon="create-outline"
                  onClick={() => setIsEditSocietyOpen(true)}
                >
                  Edit Profile
                </AppButton>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB]/60">
                  <span className="text-[10px] font-bold text-[#6B7280] uppercase block mb-1">
                    Registration Number
                  </span>
                  <span className="font-mono font-bold text-[#1A1A1A]">
                    {society.registrationNumber || "MCS/REG/PUNE-2026"}
                  </span>
                </div>

                <div className="p-3 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB]/60">
                  <span className="text-[10px] font-bold text-[#6B7280] uppercase block mb-1">
                    Location &amp; District
                  </span>
                  <span className="font-semibold text-[#1A1A1A]">
                    {society.city || "Pune"}, {society.district || "Pune"} ({society.state || "Maharashtra"})
                  </span>
                </div>

                <div className="p-3 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB]/60">
                  <span className="text-[10px] font-bold text-[#6B7280] uppercase block mb-1">
                    Postal Address &amp; PIN
                  </span>
                  <span className="font-semibold text-[#1A1A1A]">
                    {society.address ? `${society.address}${society.pinCode ? `, ${society.pinCode}` : ""}` : "Not provided"}
                  </span>
                </div>

                <div className="p-3 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB]/60">
                  <span className="text-[10px] font-bold text-[#6B7280] uppercase block mb-1">
                    Contact Email &amp; Phone
                  </span>
                  <span className="font-semibold text-[#1A1A1A]">
                    {society.contactEmail || "Not provided"}{society.contactPhone ? ` • ${society.contactPhone}` : ""}
                  </span>
                </div>
              </div>
            </div>

            {/* Committee Governance Seats */}
            <div className="p-5 bg-white rounded-2xl border border-[#E5E7EB] space-y-3 shadow-xs">
              <div className="flex items-center justify-between pb-2 border-b border-[#F1F3F5]">
                <h3 className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider">
                  Committee Council
                </h3>
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(true)}
                  className="text-[11px] font-bold text-[#4F46E5] hover:underline"
                >
                  + Appoint
                </button>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB]/60 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-[#1A1A1A]">Secretary</p>
                    <p className="text-[10px] text-[#6B7280]">Title deed &amp; verification officer</p>
                  </div>
                  <StatusBadge variant="success" size="sm">Active</StatusBadge>
                </div>

                <div className="p-2.5 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB]/60 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-[#1A1A1A]">Chairman</p>
                    <p className="text-[10px] text-[#6B7280]">Executive statutory signatory</p>
                  </div>
                  <StatusBadge variant="success" size="sm">Active</StatusBadge>
                </div>

                <div className="p-2.5 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB]/60 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-[#1A1A1A]">Treasurer</p>
                    <p className="text-[10px] text-[#6B7280]">Maintenance ledger &amp; audit desk</p>
                  </div>
                  <StatusBadge variant="success" size="sm">Active</StatusBadge>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section: Society Related Documents */}
          <div className="p-5 bg-white rounded-2xl border border-[#E5E7EB] space-y-4 shadow-xs">
            <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-[#F1F3F5]">
              <div>
                <h3 className="text-sm font-bold text-[#1A1A1A] flex items-center gap-2">
                  <IonIcon name="library-outline" size={18} className="text-[#4F46E5]" />
                  <span>Society Legal &amp; Statutory Documents Vault</span>
                </h3>
                <p className="text-xs text-[#6B7280]">
                  Official Model Bye-Laws, Registration Certificate, Audit Reports, and AGM Minutes.
                </p>
              </div>

              <AppButton
                variant="primary"
                size="sm"
                leftIcon="cloud-upload-outline"
                onClick={() => setIsUploadDocOpen(true)}
              >
                Upload Document
              </AppButton>
            </div>

            {loadingDocs ? (
              <div className="p-8 text-center text-xs text-[#6B7280]">
                <div className="inline-block animate-spin w-5 h-5 border-2 border-[#4F46E5] border-t-transparent rounded-full mb-2" />
                <p>Loading society documents...</p>
              </div>
            ) : societyDocs.length === 0 ? (
              <div className="p-8 text-center bg-[#F9FAFB] rounded-xl border border-dashed border-[#D1D5DB] space-y-2">
                <IonIcon name="document-text-outline" size={32} className="text-[#9CA3AF] mx-auto" />
                <p className="text-xs font-bold text-[#1A1A1A]">No Society Documents Published</p>
                <p className="text-[11px] text-[#6B7280] max-w-sm mx-auto">
                  Publish official Bye-Laws, Registration Certificates, or AGM resolutions to make them accessible to verified residents.
                </p>
                <div className="pt-2">
                  <AppButton
                    variant="outline"
                    size="sm"
                    leftIcon="cloud-upload-outline"
                    onClick={() => setIsUploadDocOpen(true)}
                  >
                    Upload First Document
                  </AppButton>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {societyDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-3.5 bg-white rounded-xl border border-[#E5E7EB] hover:border-[#C7D2FE] transition-all space-y-2 shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center shrink-0">
                          <IonIcon
                            name={doc.mimeType === "application/pdf" ? "document-text" : "image"}
                            size={18}
                          />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-[#1A1A1A] truncate">{doc.displayName}</h4>
                          <span className="text-[10px] text-[#6B7280] block truncate">
                            {doc.category} • {(doc.size / (1024 * 1024)).toFixed(2)} MB
                          </span>
                        </div>
                      </div>

                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#ECFDF5] text-[#065F46] shrink-0">
                        Official
                      </span>
                    </div>

                    <div className="pt-2 border-t border-[#F1F3F5] flex items-center justify-between text-xs">
                      <span className="text-[10px] text-[#9CA3AF]">
                        {new Date(doc.createdAt).toLocaleDateString()}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setDossierPreviewDoc(doc)}
                          className="px-2.5 py-1 rounded-lg bg-[#F3F4F6] hover:bg-[#EEF2FF] text-[#4F46E5] text-[11px] font-bold cursor-pointer transition-colors"
                        >
                          View
                        </button>
                        <a
                          href={doc.downloadUrl}
                          download={doc.originalFilename}
                          className="px-2.5 py-1 rounded-lg bg-[#F3F4F6] hover:bg-[#EEF2FF] text-[#1A1A1A] hover:text-[#4F46E5] text-[11px] font-bold cursor-pointer transition-colors"
                        >
                          Download
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: REQUEST (All Registration & Resident Requests: Approved/Rejected/Pending) */}
      {/* ========================================================================= */}
      {activeTab === "REQUESTS" && (
        <div className="space-y-4">
          {/* Request Status Filters */}
          <div className="flex items-center justify-between flex-wrap gap-2 bg-white p-3 rounded-2xl border border-[#E5E7EB] shadow-xs">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-[#6B7280] mr-1">Status:</span>
              {(
                [
                  { id: "ALL", label: "All Requests" },
                  { id: "PENDING", label: "Pending" },
                  { id: "APPROVED", label: "Approved" },
                  { id: "REJECTED", label: "Rejected" },
                ] as const
              ).map((f) => {
                const count = allRequests.filter((r) =>
                  f.id === "ALL" ? true : f.id === "PENDING" ? r.status.includes("PENDING") : r.status === f.id
                ).length;

                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setRequestStatusFilter(f.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      requestStatusFilter === f.id
                        ? "bg-[#1A1A1A] text-white shadow-xs"
                        : "bg-[#F9FAFB] text-[#6B7280] hover:text-[#1A1A1A]"
                    }`}
                  >
                    <span>{f.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        requestStatusFilter === f.id ? "bg-white/20 text-white" : "bg-[#E5E7EB] text-[#6B7280]"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Role Filter */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-xs font-bold text-[#6B7280]">Role:</span>
              {(["ALL", "OWNER", "TENANT"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRequestRoleFilter(r)}
                  className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer ${
                    requestRoleFilter === r
                      ? "bg-[#EEF2FF] text-[#4F46E5] font-bold"
                      : "text-[#6B7280] hover:text-[#1A1A1A]"
                  }`}
                >
                  {r === "ALL" ? "All Roles" : r}
                </button>
              ))}
            </div>
          </div>

          {filteredRequests.length === 0 ? (
            <div className="p-10 text-center bg-white border border-[#E5E7EB] rounded-2xl text-xs text-[#6B7280] space-y-2 shadow-xs">
              <IonIcon name="checkmark-done-circle-outline" size={36} className="text-[#10B981] mx-auto" />
              <p className="font-bold text-[#1A1A1A] text-sm">No Applications Match Filter</p>
              <p className="text-[11px]">No requests found under the selected status/role filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredRequests.map((req) => {
                const isConflict = !!req.existingOccupancy?.isConflict;
                const isApproved = req.status === "APPROVED";
                const isRejected = req.status === "REJECTED";

                return (
                  <div
                    key={req.id}
                    className={`p-4 rounded-2xl transition-all border shadow-xs ${
                      isConflict
                        ? "border-[#FDE68A] bg-[#FFFBEB]/40"
                        : "border-[#E5E7EB] bg-white hover:border-[#C7D2FE]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 pb-2.5 border-b border-[#F1F3F5]">
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-[10px] font-bold text-[#4F46E5] bg-[#EEF2FF] px-2 py-0.5 rounded-md">
                            {req.role}
                          </span>
                          <span className="text-xs font-bold font-mono text-[#1A1A1A]">
                            {req.wingName} • #{req.flatNumber}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-[#1A1A1A]">{req.applicantName}</h4>
                        <p className="text-[11px] text-[#6B7280] truncate max-w-[260px]">
                          {req.applicantEmail} {req.applicantPhone ? `• ${req.applicantPhone}` : ""}
                        </p>
                      </div>

                      <StatusBadge
                        variant={isApproved ? "success" : isRejected ? "error" : "warning"}
                        size="sm"
                        dot
                      >
                        {req.status}
                      </StatusBadge>
                    </div>

                    {isConflict && (
                      <div className="my-2 p-2 rounded-lg bg-[#FFFBEB] border border-[#FDE68A] text-[10px] text-[#92400E] flex items-center gap-1.5">
                        <IonIcon name="warning" size={14} className="text-[#F59E0B] shrink-0" />
                        <span>Conflict: Flat already registered to another owner</span>
                      </div>
                    )}

                    <div className="pt-2.5 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-[#9CA3AF]">
                        {new Date(req.createdAt).toLocaleDateString()}
                      </span>

                      <AppButton
                        variant={isApproved || isRejected ? "outline" : "hero"}
                        size="sm"
                        onClick={() => setSelectedRequest(req)}
                      >
                        {isApproved || isRejected ? "View Details" : "Review Request"}
                      </AppButton>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: FLAT (Wings Separated -> Flats Side-by-Side -> Click to Inspect) */}
      {/* ========================================================================= */}
      {activeTab === "FLATS" && (
        <div className="space-y-5">
          {/* Wing Separation Tabs Strip */}
          <div className="p-3.5 bg-white rounded-2xl border border-[#E5E7EB] shadow-xs space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <IonIcon name="layers-outline" size={18} className="text-[#4F46E5]" />
                <span className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider">
                  Select Wing / Structure:
                </span>
              </div>

              <div className="flex items-center gap-2">
                <AppButton
                  variant="outline"
                  size="sm"
                  leftIcon="add-outline"
                  onClick={() => setIsAddWingOpen(true)}
                >
                  + Add Wing
                </AppButton>
                <AppButton
                  variant="outline"
                  size="sm"
                  leftIcon="add-circle-outline"
                  onClick={() => setIsAddFlatOpen(true)}
                >
                  + Add Flat
                </AppButton>
              </div>
            </div>

            {/* Wing Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setSelectedWing("ALL")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  selectedWing === "ALL"
                    ? "bg-[#1A1A1A] text-white shadow-xs"
                    : "bg-[#F9FAFB] text-[#6B7280] border border-[#E5E7EB] hover:text-[#1A1A1A]"
                }`}
              >
                All Wings ({flatsList.length})
              </button>

              {availableWingNames.map((wName) => {
                const wingFlats = flatsByWing[wName] || [];
                const occupiedCount = wingFlats.filter((f) => f.occupancyType !== "VACANT").length;

                return (
                  <button
                    key={wName}
                    type="button"
                    onClick={() => setSelectedWing(wName)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-2 ${
                      selectedWing === wName
                        ? "bg-[#4F46E5] text-white shadow-xs"
                        : "bg-[#F9FAFB] text-[#6B7280] border border-[#E5E7EB] hover:text-[#1A1A1A]"
                    }`}
                  >
                    <span>{wName}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        selectedWing === wName
                          ? "bg-white/20 text-white"
                          : "bg-[#E5E7EB] text-[#4B5563]"
                      }`}
                    >
                      {occupiedCount}/{wingFlats.length}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Occupancy Filter Bar */}
          <div className="flex items-center justify-between text-xs text-[#6B7280] px-1">
            <div className="flex items-center gap-2">
              <span>Showing:</span>
              {(
                [
                  { id: "ALL", label: "All Units" },
                  { id: "OWNER_OCCUPIED", label: "Owner Occupied" },
                  { id: "TENANT_OCCUPIED", label: "Tenant Occupied" },
                  { id: "VACANT", label: "Vacant" },
                ] as const
              ).map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => setFlatOccupancyFilter(o.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer ${
                    flatOccupancyFilter === o.id
                      ? "bg-[#1A1A1A] text-white font-bold"
                      : "text-[#6B7280] hover:text-[#1A1A1A]"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>

            <span>
              {displayedFlats.length} unit{displayedFlats.length === 1 ? "" : "s"} listed
            </span>
          </div>

          {/* FLATS DISPLAYED SIDE BY SIDE IN GRID */}
          {displayedFlats.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-[#E5E7EB] shadow-xs space-y-3">
              <IonIcon name="business-outline" size={40} className="text-[#9CA3AF] mx-auto" />
              <h3 className="text-sm font-bold text-[#1A1A1A]">No Flats Found in this Wing</h3>
              <p className="text-xs text-[#6B7280] max-w-md mx-auto">
                No units have been registered under this wing yet. Use our Quick Setup Wizard to generate standard floor layouts instantly.
              </p>
              <div className="pt-2 flex items-center justify-center gap-2">
                <AppButton
                  variant="primary"
                  size="sm"
                  leftIcon="construct-outline"
                  onClick={() => setShowInitialSetupModal(true)}
                >
                  Setup Wings &amp; Flats
                </AppButton>
                <AppButton
                  variant="outline"
                  size="sm"
                  leftIcon="add-outline"
                  onClick={() => setIsAddFlatOpen(true)}
                >
                  Add Flat Manually
                </AppButton>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {displayedFlats.map((flat) => {
                const isVacant = flat.occupancyType === "VACANT";
                const isOwner = flat.occupancyType === "OWNER_OCCUPIED";
                const isTenant = flat.occupancyType === "TENANT_OCCUPIED";

                return (
                  <button
                    key={flat.id}
                    type="button"
                    onClick={() => openFlatDossier(flat)}
                    className="p-3.5 rounded-2xl border border-[#E5E7EB] bg-white hover:border-[#4F46E5] hover:shadow-md transition-all text-left flex flex-col justify-between group cursor-pointer relative"
                  >
                    <div>
                      {/* Top Wing & Document count indicator */}
                      <div className="flex items-center justify-between text-[10px] text-[#6B7280] mb-1">
                        <span className="font-semibold truncate max-w-[80px]">
                          {flat.wing || "Wing"}
                        </span>
                        {(flat.documentCount ?? 0) > 0 && (
                          <span
                            className="flex items-center gap-0.5 text-[9px] font-bold text-[#4F46E5] bg-[#EEF2FF] px-1.5 py-0.2 rounded"
                            title={`${flat.documentCount} documents stored in vault`}
                          >
                            <IonIcon name="document-text" size={10} />
                            <span>{flat.documentCount}</span>
                          </span>
                        )}
                      </div>

                      {/* Flat Number */}
                      <p className="font-black text-base text-[#1A1A1A] group-hover:text-[#4F46E5] transition-colors leading-tight">
                        #{flat.flatNumber}
                      </p>

                      {/* Occupant Name or Vacant Note */}
                      <p className="text-[11px] font-medium text-[#4B5563] truncate mt-1">
                        {flat.occupantName || (isVacant ? "Vacant Unit" : "Registered Occupant")}
                      </p>
                    </div>

                    {/* Bottom Floor & Occupancy Badge */}
                    <div className="pt-2 mt-2 border-t border-[#F1F3F5] flex items-center justify-between text-[10px]">
                      <span className="text-[#9CA3AF] font-medium">Fl {flat.floor}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded-md font-bold text-[9px] ${
                          isOwner
                            ? "bg-[#ECFDF5] text-[#065F46]"
                            : isTenant
                            ? "bg-[#EEF2FF] text-[#4338CA]"
                            : "bg-[#F3F4F6] text-[#6B7280]"
                        }`}
                      >
                        {isOwner ? "Owner" : isTenant ? "Tenant" : "Vacant"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* POPUP 1: SETUP STRUCTURE WIZARD ("Just before the dashboard") */}
      {/* ========================================================================= */}
      <Modal
        isOpen={showInitialSetupModal}
        onClose={handleDismissSetupModal}
        title="Initial Society Structure Setup"
        description="Configure wings, floors, and unit layouts dynamically for this society"
        maxWidth="lg"
      >
        <form onSubmit={handleSubmitInitialSetup} className="space-y-4 py-1 text-xs">
          <div className="p-3 bg-[#EEF2FF] border border-[#C7D2FE] rounded-xl text-[#3730A3] space-y-1">
            <p className="font-bold">Welcome to SocietyFlow Dynamic Setup!</p>
            <p className="text-[11px] leading-relaxed">
              When a new society account is created, wings and flats can be generated instantly. Fill in the basic structure parameters below to build your physical towers and units side by side.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Building / Complex Name" id="setup-building">
              <input
                type="text"
                placeholder="e.g. Greenwood Heights"
                value={setupBuildingName}
                onChange={(e) => setSetupBuildingName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] bg-white text-xs font-semibold"
              />
            </FormField>

            <FormField label="Wings to Create (Comma Separated) *" id="setup-wings" required>
              <input
                type="text"
                placeholder="e.g. Wing A, Wing B, Wing C"
                value={setupWingNames}
                onChange={(e) => setSetupWingNames(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] bg-white text-xs font-bold"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <FormField label="Floors per Wing *" id="setup-floors" required>
              <input
                type="number"
                min="1"
                max="100"
                value={setupFloorsPerWing}
                onChange={(e) => setSetupFloorsPerWing(Number(e.target.value))}
                required
                className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] bg-white text-xs font-bold"
              />
            </FormField>

            <FormField label="Flats per Floor *" id="setup-flats-floor" required>
              <input
                type="number"
                min="1"
                max="20"
                value={setupFlatsPerFloor}
                onChange={(e) => setSetupFlatsPerFloor(Number(e.target.value))}
                required
                className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] bg-white text-xs font-bold"
              />
            </FormField>

            <FormField label="Default Flat Config" id="setup-bhk">
              <select
                value={setupBhk}
                onChange={(e) => setSetupBhk(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] bg-white text-xs font-semibold"
              >
                <option value="1 BHK">1 BHK</option>
                <option value="2 BHK">2 BHK</option>
                <option value="3 BHK">3 BHK</option>
                <option value="4 BHK">4 BHK</option>
              </select>
            </FormField>
          </div>

          <FormField label="Numbering Pattern" id="setup-pattern">
            <select
              value={setupPattern}
              onChange={(e) => setSetupPattern(e.target.value as "WING_FLOOR_UNIT" | "FLOOR_UNIT")}
              className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] bg-white text-xs font-semibold"
            >
              <option value="WING_FLOOR_UNIT">Wing Prefix Style (e.g. A-101, A-102, B-101...)</option>
              <option value="FLOOR_UNIT">Direct Floor Style (e.g. 101, 102, 201...)</option>
            </select>
          </FormField>

          {/* Live Preview Box */}
          <div className="p-3 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] flex items-center justify-between">
            <span className="font-bold text-[#1A1A1A]">Generation Estimate:</span>
            <span className="font-mono font-bold text-[#4F46E5] text-xs">
              {setupPreviewCount} Flats will be generated dynamically
            </span>
          </div>

          <div className="pt-2 border-t border-[#F1F3F5] flex justify-end gap-2">
            <AppButton
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDismissSetupModal}
            >
              Skip for Now
            </AppButton>
            <AppButton
              type="submit"
              variant="hero"
              size="sm"
              isLoading={isSubmittingSetup}
            >
              Generate Structure &amp; Units
            </AppButton>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* POPUP 2: FLAT DOSSIER & PERSON DOCUMENTS MODAL */}
      {/* ========================================================================= */}
      {selectedFlatForDossier && (
        <Modal
          isOpen={true}
          onClose={() => {
            setSelectedFlatForDossier(null);
            setFlatDossier(null);
            setDossierFeedback(null);
            setCorrectionTargetDocId(null);
            setCorrectionNoteInput("");
          }}
          title={`Flat Dossier • ${selectedFlatForDossier.wing} #${selectedFlatForDossier.flatNumber}`}
          description={`Floor ${selectedFlatForDossier.floor} • Ownership Records & Uploaded Resident Documents`}
          maxWidth="xl"
        >
          <div className="space-y-4 py-1 text-xs">
            {dossierFeedback && (
              <div
                className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                  dossierFeedback.type === "success"
                    ? "bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46]"
                    : "bg-[#FFF1F2] border-[#FECDD3] text-[#BE123C]"
                }`}
              >
                <IonIcon
                  name={dossierFeedback.type === "success" ? "checkmark-circle" : "alert-circle"}
                  size={16}
                />
                <span>{dossierFeedback.text}</span>
              </div>
            )}

            {flatDossierLoading ? (
              <div className="py-8 text-center text-[#6B7280]">
                <div className="inline-block animate-spin w-6 h-6 border-2 border-[#4F46E5] border-t-transparent rounded-full mb-1.5" />
                <p>Loading ownership records &amp; documents...</p>
              </div>
            ) : !flatDossier ? (
              <div className="p-4 text-center text-[#6B7280]">
                Unable to load flat dossier details.
              </div>
            ) : (
              <div className="space-y-4">
                {/* 1. OCCUPANCY & RESIDENT IDENTITY */}
                <div className="p-3.5 rounded-xl bg-[#F8F9FA] border border-[#E5E7EB] space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280] block">
                    Who Owns / Resides in this Flat
                  </span>

                  {flatDossier.occupancies.length === 0 ? (
                    <div className="p-3 bg-white rounded-lg border border-[#E5E7EB] text-[#6B7280] italic">
                      No active resident registered to this unit yet. (Status: Vacant / Available for Onboarding)
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {flatDossier.occupancies.map((occ) => (
                        <div
                          key={occ._id}
                          className="p-3 bg-white rounded-xl border border-[#E5E7EB] flex items-center justify-between shadow-xs"
                        >
                          <div>
                            <span className="font-bold text-[#1A1A1A] block text-xs">
                              {occ.userId?.name || "Registered Resident"}
                            </span>
                            <span className="text-[11px] text-[#6B7280] block font-mono">
                              {occ.userId?.email}
                            </span>
                            {occ.userId?.phone && (
                              <span className="text-[10px] text-[#9CA3AF] block">
                                Ph: {occ.userId.phone}
                              </span>
                            )}
                          </div>
                          <StatusBadge variant="hero" size="sm">
                            {occ.occupancyType}
                          </StatusBadge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. UPLOADED DOCUMENTS (VIEW & DOWNLOAD) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-[#1A1A1A] text-xs">
                      Uploaded Documents for this Flat ({flatDossier.documents.length})
                    </h4>
                  </div>

                  {flatDossier.documents.length === 0 ? (
                    <div className="p-6 text-center bg-[#F8F9FA] rounded-xl border border-[#E5E7EB] text-[#6B7280]">
                      No documents uploaded for this flat yet.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                      {flatDossier.documents.map((doc) => (
                        <div
                          key={doc.id}
                          className="p-3 bg-white rounded-xl border border-[#E5E7EB] space-y-2 shadow-xs"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <IonIcon
                                name={doc.mimeType === "application/pdf" ? "document-text" : "image"}
                                size={20}
                                className={doc.mimeType === "application/pdf" ? "text-[#EF4444]" : "text-[#4F46E5]"}
                              />
                              <div className="min-w-0">
                                <span className="font-bold text-[#1A1A1A] block truncate text-xs">
                                  {doc.displayName}
                                </span>
                                <span className="text-[10px] text-[#6B7280] block truncate">
                                  {doc.category} • {(doc.size / (1024 * 1024)).toFixed(2)} MB • Uploaded by {doc.uploadedBy?.name || "Resident"}
                                </span>
                              </div>
                            </div>

                            <StatusBadge
                              variant={
                                doc.verificationStatus === "VERIFIED"
                                  ? "success"
                                  : doc.verificationStatus === "CORRECTION_REQUESTED"
                                  ? "error"
                                  : "warning"
                              }
                              size="sm"
                            >
                              {doc.verificationStatus === "CORRECTION_REQUESTED"
                                ? "Correction"
                                : doc.verificationStatus || "Pending"}
                            </StatusBadge>
                          </div>

                          {doc.correctionNote && (
                            <div className="p-2 rounded bg-[#FFF1F2] border border-[#FECDD3] text-[10px] text-[#BE123C]">
                              <strong>Correction Note:</strong> {doc.correctionNote}
                            </div>
                          )}

                          {/* ACTION BUTTONS: VIEW & DOWNLOAD */}
                          <div className="pt-1.5 border-t border-[#F1F3F5] flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-1.5">
                              <AppButton
                                variant="outline"
                                size="sm"
                                leftIcon="eye-outline"
                                onClick={() => setDossierPreviewDoc(doc)}
                              >
                                View
                              </AppButton>
                              <a href={doc.downloadUrl} download={doc.originalFilename}>
                                <AppButton variant="outline" size="sm" leftIcon="download-outline">
                                  Download
                                </AppButton>
                              </a>
                            </div>

                            <div className="flex items-center gap-1.5">
                              {doc.verificationStatus !== "VERIFIED" && (
                                <AppButton
                                  variant="hero"
                                  size="sm"
                                  leftIcon="checkmark-circle-outline"
                                  disabled={dossierActionProcessing}
                                  onClick={() => handleDocumentVerification(doc.id, "VERIFY")}
                                >
                                  Verify
                                </AppButton>
                              )}
                              <AppButton
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  if (correctionTargetDocId === doc.id) {
                                    setCorrectionTargetDocId(null);
                                    setCorrectionNoteInput("");
                                  } else {
                                    setCorrectionTargetDocId(doc.id);
                                    setCorrectionNoteInput(doc.correctionNote || "");
                                  }
                                }}
                              >
                                {correctionTargetDocId === doc.id ? "Cancel" : "Correction"}
                              </AppButton>
                            </div>
                          </div>

                          {correctionTargetDocId === doc.id && (
                            <div className="p-2.5 bg-[#FFFBEB] rounded-lg border border-[#FDE68A] space-y-2">
                              <textarea
                                value={correctionNoteInput}
                                onChange={(e) => setCorrectionNoteInput(e.target.value)}
                                placeholder="Explain what the resident needs to correct..."
                                rows={2}
                                className="w-full p-2 rounded border border-[#FCD34D] bg-white text-xs outline-none"
                              />
                              <div className="flex justify-end gap-1.5">
                                <AppButton
                                  variant="hero"
                                  size="sm"
                                  disabled={dossierActionProcessing || !correctionNoteInput.trim()}
                                  onClick={() => handleDocumentVerification(doc.id, "REQUEST_CORRECTION")}
                                >
                                  Send Notice
                                </AppButton>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* POPUP 3: INLINE DOCUMENT PREVIEW MODAL */}
      {/* ========================================================================= */}
      {dossierPreviewDoc && (
        <Modal
          isOpen={true}
          onClose={() => setDossierPreviewDoc(null)}
          title={dossierPreviewDoc.displayName}
          description={`${dossierPreviewDoc.category || "Document"} • ${(
            (dossierPreviewDoc.size || 0) /
            (1024 * 1024)
          ).toFixed(2)} MB`}
          maxWidth="lg"
        >
          <div className="space-y-3">
            <div className="w-full bg-[#1A1A1A] rounded-xl overflow-hidden min-h-[320px] max-h-[480px] flex items-center justify-center p-2">
              {dossierPreviewDoc.mimeType?.startsWith("image/") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={dossierPreviewDoc.viewUrl}
                  alt={dossierPreviewDoc.displayName}
                  className="max-h-[460px] w-auto max-w-full object-contain rounded-lg"
                />
              ) : dossierPreviewDoc.mimeType === "application/pdf" ? (
                <iframe
                  src={dossierPreviewDoc.viewUrl}
                  title={dossierPreviewDoc.displayName}
                  className="w-full h-[460px] rounded-lg bg-white"
                />
              ) : (
                <div className="text-center p-6 text-white">
                  <p className="text-xs text-[#9CA3AF]">Inline preview unavailable for this format.</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-[#6B7280]">
                Uploaded by: {dossierPreviewDoc.uploadedBy?.name || "Management / Resident"}
              </span>
              <a
                href={dossierPreviewDoc.downloadUrl}
                download={dossierPreviewDoc.originalFilename || dossierPreviewDoc.displayName}
              >
                <AppButton variant="hero" size="sm" leftIcon="download-outline">
                  Download File
                </AppButton>
              </a>
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* POPUP 4: REVIEW REGISTRATION REQUEST MODAL */}
      {/* ========================================================================= */}
      {selectedRequest && (
        <Modal
          isOpen={true}
          onClose={() => {
            setSelectedRequest(null);
            setActionMessage(null);
          }}
          title={`Review Application • ${selectedRequest.applicantName}`}
          description="Managing Committee Registration Clearance"
          maxWidth="md"
        >
          <div className="space-y-3 py-1 text-xs">
            {actionMessage && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                  actionMessage.type === "success"
                    ? "bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46]"
                    : "bg-[#FFF1F2] border-[#FECDD3] text-[#BE123C]"
                }`}
              >
                <IonIcon
                  name={actionMessage.type === "success" ? "checkmark-circle" : "alert-circle"}
                  size={18}
                />
                <span>{actionMessage.text}</span>
              </div>
            )}

            <div className="p-3.5 bg-[#F8F9FA] rounded-xl border border-[#E5E7EB] space-y-2">
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Applicant:</span>
                <span className="font-bold text-[#1A1A1A]">{selectedRequest.applicantName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Email:</span>
                <span className="font-medium text-[#1A1A1A]">{selectedRequest.applicantEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Requested Unit:</span>
                <span className="font-bold text-[#4F46E5]">
                  {selectedRequest.wingName} - Flat #{selectedRequest.flatNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Role:</span>
                <span className="font-bold text-[#1A1A1A]">{selectedRequest.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Current Status:</span>
                <span className="font-bold text-[#F59E0B]">{selectedRequest.status}</span>
              </div>
            </div>

            {selectedRequest.existingOccupancy?.isConflict && (
              <div className="p-2.5 bg-[#FFFBEB] border border-[#FDE68A] rounded-xl text-[#92400E] text-[11px] space-y-1">
                <strong className="block font-bold">Occupancy Conflict Notice:</strong>
                <span>
                  Flat {selectedRequest.flatNumber} is already registered to{" "}
                  <strong>{selectedRequest.existingOccupancy.ownerName}</strong> ({selectedRequest.existingOccupancy.ownerEmail}).
                </span>
              </div>
            )}

            {selectedRequest.status === "APPROVED" || selectedRequest.status === "REJECTED" ? (
              <div className="p-3 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] text-xs text-[#065F46] flex items-center gap-2">
                <IonIcon name="checkmark-done-circle" size={18} className="text-[#10B981] shrink-0" />
                <span>
                  This application has already been <strong>{selectedRequest.status.toLowerCase()}</strong>. No further action is required.
                </span>
              </div>
            ) : (
              <>
                <div>
                  <label className="font-bold text-[#1A1A1A] block mb-1">
                    Committee Decision Note:
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Add comments or instructions for the applicant..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#E5E7EB] text-xs focus:ring-1 focus:ring-[#4F46E5] outline-none"
                  />
                </div>

                <div className="pt-2 border-t border-[#F1F3F5] flex flex-wrap items-center justify-end gap-2">
                  <AppButton
                    variant="outline"
                    size="sm"
                    onClick={() => handleReviewAction("REJECT")}
                    disabled={actionProcessing}
                  >
                    Reject
                  </AppButton>
                  <AppButton
                    variant="outline"
                    size="sm"
                    onClick={() => handleReviewAction("REQUEST_INFO")}
                    disabled={actionProcessing}
                  >
                    Request Info
                  </AppButton>
                  <AppButton
                    variant="hero"
                    size="sm"
                    onClick={() => handleReviewAction("APPROVE")}
                    disabled={actionProcessing}
                    leftIcon="checkmark-circle-outline"
                  >
                    {actionProcessing ? "Processing..." : "Approve & Activate"}
                  </AppButton>
                </div>
              </>
            )}
          </div>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* POPUP 5: EDIT SOCIETY PROFILE MODAL */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isEditSocietyOpen}
        onClose={() => setIsEditSocietyOpen(false)}
        title="Edit Society Profile"
        description="Update official registered details and contact information"
        maxWidth="md"
      >
        <form onSubmit={handleSaveSocietyProfile} className="space-y-3 py-1 text-xs">
          <FormField label="Society Legal Name *" id="edit-name" required>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] bg-white text-xs font-bold"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Registration No *" id="edit-reg" required>
              <input
                type="text"
                value={editRegNo}
                onChange={(e) => setEditRegNo(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] bg-white text-xs font-mono font-bold"
              />
            </FormField>

            <FormField label="City *" id="edit-city" required>
              <input
                type="text"
                value={editCity}
                onChange={(e) => setEditCity(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] bg-white text-xs"
              />
            </FormField>
          </div>

          <FormField label="Address" id="edit-address">
            <input
              type="text"
              value={editAddress}
              onChange={(e) => setEditAddress(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] bg-white text-xs"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Contact Email" id="edit-email">
              <input
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] bg-white text-xs"
              />
            </FormField>

            <FormField label="Contact Phone" id="edit-phone">
              <input
                type="tel"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] bg-white text-xs"
              />
            </FormField>
          </div>

          <div className="pt-2 border-t border-[#F1F3F5] flex justify-end gap-2">
            <AppButton
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsEditSocietyOpen(false)}
            >
              Cancel
            </AppButton>
            <AppButton
              type="submit"
              variant="hero"
              size="sm"
              isLoading={isSavingSociety}
            >
              Save Profile
            </AppButton>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* POPUP 6: UPLOAD SOCIETY DOCUMENT MODAL */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isUploadDocOpen}
        onClose={() => setIsUploadDocOpen(false)}
        title="Upload Official Society Document"
        description="Publish society-level document to the official vault"
        maxWidth="md"
      >
        <form onSubmit={handleUploadSocietyDoc} className="space-y-3 py-1 text-xs">
          <FormField label="Document Title *" id="upload-name" required>
            <input
              type="text"
              placeholder="e.g. Model Bye-Laws 2026 or AGM Minutes Oct 2026"
              value={uploadDocName}
              onChange={(e) => setUploadDocName(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] bg-white text-xs font-bold"
            />
          </FormField>

          <FormField label="Document Category *" id="upload-category">
            <select
              value={uploadDocCategory}
              onChange={(e) => setUploadDocCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] bg-white text-xs font-semibold"
            >
              <option value="BYELAWS">Model Bye-Laws / Rulebook</option>
              <option value="SOCIETY_REGISTRATION">Society Registration Certificate</option>
              <option value="AUDIT_REPORT">Statutory Audit Report</option>
              <option value="AGM_MINUTES">AGM / EGM Minutes</option>
              <option value="NOC">NOC / Fire Safety Certificate</option>
              <option value="DEED">Conveyance / Title Deed</option>
              <option value="OTHER">Other Official Circular</option>
            </select>
          </FormField>

          <FormField label="File (PDF, PNG, JPG) *" id="upload-file" required>
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  setUploadDocFile(f);
                  if (!uploadDocName) setUploadDocName(f.name.replace(/\.[^/.]+$/, ""));
                }
              }}
              required
              className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] bg-white text-xs"
            />
          </FormField>

          <div className="pt-2 border-t border-[#F1F3F5] flex justify-end gap-2">
            <AppButton
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsUploadDocOpen(false)}
            >
              Cancel
            </AppButton>
            <AppButton
              type="submit"
              variant="hero"
              size="sm"
              isLoading={isUploadingDoc}
            >
              Upload &amp; Publish
            </AppButton>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* POPUP 7: ADD FLAT MANUALLY MODAL */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isAddFlatOpen}
        onClose={() => setIsAddFlatOpen(false)}
        title="Add Single Flat"
        description="Register an individual housing unit within the society structure"
        maxWidth="md"
      >
        <form onSubmit={handleAddSingleFlat} className="space-y-3 py-1 text-xs">
          <FormField label="Target Wing" id="single-wing">
            <select
              value={addFlatWingId}
              onChange={(e) => setAddFlatWingId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] bg-white text-xs font-semibold"
            >
              <option value="">No Wing / Standalone</option>
              {wings.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Flat Identifier *" id="single-flat-num" required>
              <input
                type="text"
                placeholder="e.g. 101 or A-101"
                value={addFlatNumber}
                onChange={(e) => setAddFlatNumber(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] bg-white text-xs font-bold uppercase"
              />
            </FormField>

            <FormField label="Floor Number *" id="single-floor" required>
              <input
                type="number"
                min="0"
                max="100"
                value={addFlatFloor}
                onChange={(e) => setAddFlatFloor(Number(e.target.value))}
                required
                className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] bg-white text-xs font-bold"
              />
            </FormField>
          </div>

          <FormField label="Configuration / BHK" id="single-bhk">
            <select
              value={addFlatBhk}
              onChange={(e) => setAddFlatBhk(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] bg-white text-xs font-semibold"
            >
              <option value="1 BHK">1 BHK</option>
              <option value="2 BHK">2 BHK</option>
              <option value="3 BHK">3 BHK</option>
              <option value="4 BHK">4 BHK</option>
              <option value="Penthouse">Penthouse</option>
            </select>
          </FormField>

          <div className="pt-2 border-t border-[#F1F3F5] flex justify-end gap-2">
            <AppButton
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddFlatOpen(false)}
            >
              Cancel
            </AppButton>
            <AppButton
              type="submit"
              variant="hero"
              size="sm"
              isLoading={isSubmittingAddFlat}
            >
              Register Flat
            </AppButton>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* POPUP 8: ADD WING MODAL */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isAddWingOpen}
        onClose={() => setIsAddWingOpen(false)}
        title="Add New Wing / Tower"
        description="Expand society physical architecture with a new wing"
        maxWidth="md"
      >
        <form onSubmit={handleAddWing} className="space-y-3 py-1 text-xs">
          <FormField label="Wing Name *" id="new-wing-name" required>
            <input
              type="text"
              placeholder="e.g. Wing C or Tower 2"
              value={newWingName}
              onChange={(e) => setNewWingName(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] bg-white text-xs font-bold"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Total Floors" id="new-wing-floors">
              <input
                type="number"
                min="1"
                max="100"
                value={newWingFloors}
                onChange={(e) => setNewWingFloors(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] bg-white text-xs font-bold"
              />
            </FormField>

            <FormField label="Flats Per Floor" id="new-wing-flats">
              <input
                type="number"
                min="1"
                max="20"
                value={newWingFlatsPerFloor}
                onChange={(e) => setNewWingFlatsPerFloor(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] bg-white text-xs font-bold"
              />
            </FormField>
          </div>

          <div className="pt-2 border-t border-[#F1F3F5] flex justify-end gap-2">
            <AppButton
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddWingOpen(false)}
            >
              Cancel
            </AppButton>
            <AppButton
              type="submit"
              variant="hero"
              size="sm"
              isLoading={isSubmittingWing}
            >
              Create Wing
            </AppButton>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* POPUP 9: APPOINT COMMITTEE MEMBER MODAL */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Appoint Committee Member"
        description="Assign statutory governance seat and committee console permissions"
        maxWidth="md"
      >
        <form onSubmit={handleInviteCommittee} className="space-y-3 py-1 text-xs">
          {inviteFeedback && (
            <div className="p-2.5 rounded-xl bg-[#EEF2FF] border border-[#C7D2FE] text-[#4338CA] text-xs">
              {inviteFeedback}
            </div>
          )}

          <div className="space-y-2.5">
            <FormField
              label="Full Name"
              placeholder="e.g. Ramesh Kulkarni"
              value={inviteName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInviteName(e.target.value)}
            />

            <FormField
              label="Email Address *"
              type="email"
              placeholder="e.g. treasurer@greenwood.in"
              value={inviteEmail}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInviteEmail(e.target.value)}
            />

            <div>
              <label className="font-bold text-[#1A1A1A] block mb-1">Elected Seat *</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as CommitteePosition)}
                className="w-full p-2.5 rounded-xl border border-[#E5E7EB] bg-white text-xs outline-none focus:ring-1 focus:ring-[#4F46E5]"
              >
                <option value="SECRETARY">Secretary</option>
                <option value="CHAIRMAN">Chairman</option>
                <option value="TREASURER">Treasurer</option>
                <option value="SOCIETY_MANAGER">Society Manager</option>
              </select>
            </div>
          </div>

          <div className="pt-2 border-t border-[#F1F3F5] flex justify-end gap-2">
            <AppButton
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsInviteModalOpen(false)}
            >
              Cancel
            </AppButton>
            <AppButton
              type="submit"
              variant="hero"
              size="sm"
              disabled={isInviting || !inviteEmail.trim()}
            >
              {isInviting ? "Assigning..." : "Assign Seat"}
            </AppButton>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
}
