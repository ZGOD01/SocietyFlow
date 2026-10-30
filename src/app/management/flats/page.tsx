"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import {
  PageHeader,
  StatCard,
  AppCard,
  StatusBadge,
  AppButton,
  Modal,
  IonIcon,
  FormField,
  SearchField,
  EmptyState,
} from "@/components/ui";

interface FlatItem {
  id: string;
  flatNumber: string;
  floor: number;
  carpetAreaSqFt?: number;
  bhkType?: string;
  shareCertificateNumber?: string;
  defaultOccupancyType: string;
  occupancyType?: string;
  isActive: boolean;
  status: string;
  wing?: { id: string; name: string };
  wingName?: string;
  building?: { id: string; name: string };
  currentOwner?: { id: string; name: string; email: string; phone?: string };
  currentTenant?: { id: string; name: string; email: string; phone?: string };
  owner?: { id: string; name: string; email: string; phone?: string };
  tenant?: { id: string; name: string; email: string; phone?: string };
  ownerStatus: string;
  tenantStatus: string;
  pendingApprovalsCount: number;
  propertyDocCount: number;
}

interface DirectoryResponse {
  success: boolean;
  stats: {
    totalFlats: number;
    registeredOwners: number;
    activeTenants: number;
    vacantFlats: number;
  };
  flats: FlatItem[];
  wings: Array<{ id: string; name: string }>;
  buildings: Array<{ id: string; name: string }>;
}

export default function FlatsDirectoryPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DirectoryResponse | null>(null);
  const [search, setSearch] = useState("");
  const [selectedWing, setSelectedWing] = useState("ALL");
  const [selectedOccupancy, setSelectedOccupancy] = useState("ALL");
  const [selectedFloor, setSelectedFloor] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ACTIVE");
  const [viewMode, setViewMode] = useState<"GRID" | "TABLE">("GRID");

  // Add Flat Modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addBuildingId, setAddBuildingId] = useState("");
  const [addWingId, setAddWingId] = useState("");
  const [addFlatNumber, setAddFlatNumber] = useState("");
  const [addFloor, setAddFloor] = useState<number>(1);
  const [addBhk, setAddBhk] = useState("2 BHK");
  const [addArea, setAddArea] = useState<number | undefined>(undefined);
  const [addShareCert, setAddShareCert] = useState("");
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);

  // Bulk Generate Modal
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [genBuildingId, setGenBuildingId] = useState("");
  const [genWingId, setGenWingId] = useState("");
  const [genStartFloor, setGenStartFloor] = useState(1);
  const [genEndFloor, setGenEndFloor] = useState(4);
  const [genFlatsPerFloor, setGenFlatsPerFloor] = useState(4);
  const [genPattern, setGenPattern] = useState<"FLOOR_UNIT" | "WING_FLOOR_UNIT">("WING_FLOOR_UNIT");
  const [genPrefix, setGenPrefix] = useState("");
  const [genBhk, setGenBhk] = useState("2 BHK");
  const [genArea, setGenArea] = useState<number | undefined>(undefined);
  const [isSubmittingGen, setIsSubmittingGen] = useState(false);

  // Add Wing Modal
  const [addWingModalOpen, setAddWingModalOpen] = useState(false);
  const [newWingName, setNewWingName] = useState("");
  const [newWingBuildingId, setNewWingBuildingId] = useState("");
  const [newWingFloors, setNewWingFloors] = useState<number>(4);
  const [newWingFlatsPerFloor, setNewWingFlatsPerFloor] = useState<number>(4);
  const [isSubmittingWing, setIsSubmittingWing] = useState(false);

  // Feedback banner
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchFlats = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (selectedWing !== "ALL") params.append("wingId", selectedWing);
      if (selectedOccupancy !== "ALL") params.append("occupancy", selectedOccupancy);
      if (selectedFloor !== "ALL") params.append("floor", selectedFloor);
      if (selectedStatus !== "ALL") params.append("status", selectedStatus);

      const res = await fetch(`/api/management/flats?${params.toString()}`);
      const json = await res.json();
      if (res.ok) {
        setData(json);
      } else {
        setFeedback({ type: "error", text: json.error || "Failed to load flats" });
      }
    } catch {
      setFeedback({ type: "error", text: "Network error loading flats directory" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    async function loadDirectory() {
      try {
        const params = new URLSearchParams();
        if (selectedWing !== "ALL") params.append("wingId", selectedWing);
        if (selectedOccupancy !== "ALL") params.append("occupancy", selectedOccupancy);
        if (selectedFloor !== "ALL") params.append("floor", selectedFloor);
        if (selectedStatus !== "ALL") params.append("status", selectedStatus);

        const res = await fetch(`/api/management/flats?${params.toString()}`);
        const json = await res.json();
        if (!ignore) {
          if (res.ok) {
            setData(json);
            if (json.wings && json.wings.length > 0 && !addWingId) {
              setAddWingId(json.wings[0].id);
              setGenWingId(json.wings[0].id);
              setGenPrefix(json.wings[0].name.replace(/Wing\s*/i, "").trim());
            }
            if (json.buildings && json.buildings.length > 0 && !addBuildingId) {
              setAddBuildingId(json.buildings[0].id);
              setGenBuildingId(json.buildings[0].id);
            }
          } else {
            setFeedback({ type: "error", text: json.error || "Failed to load flats" });
          }
        }
      } catch {
        if (!ignore) {
          setFeedback({ type: "error", text: "Network error loading flats directory" });
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }
    loadDirectory();
    return () => {
      ignore = true;
    };
  }, [selectedWing, selectedOccupancy, selectedFloor, selectedStatus, addWingId, addBuildingId]);

  // Handle Search submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchFlats();
  };

  // Preview generated flats calculation
  const generatedPreview = useMemo(() => {
    const list: string[] = [];
    const s = Math.max(0, Number(genStartFloor));
    const e = Math.max(s, Number(genEndFloor));
    const perFloor = Math.min(20, Math.max(1, Number(genFlatsPerFloor)));
    const pfx = genPrefix.trim();

    for (let fl = s; fl <= e; fl++) {
      for (let u = 1; u <= perFloor; u++) {
        const uStr = u < 10 ? `0${u}` : `${u}`;
        if (genPattern === "WING_FLOOR_UNIT" && pfx) {
          list.push(`${pfx}-${fl}${uStr}`);
        } else {
          list.push(`${fl}${uStr}`);
        }
      }
    }
    return list;
  }, [genStartFloor, genEndFloor, genFlatsPerFloor, genPattern, genPrefix]);

  const handleCreateFlat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addFlatNumber.trim() || !addFloor) {
      setFeedback({ type: "error", text: "Please enter a valid Flat Number and Floor" });
      return;
    }

    try {
      setIsSubmittingAdd(true);
      const res = await fetch("/api/management/flats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE_FLAT",
          buildingId: addBuildingId || undefined,
          wingId: addWingId || undefined,
          flatNumber: addFlatNumber.trim().toUpperCase(),
          floor: Number(addFloor),
          bhkType: addBhk,
          carpetAreaSqFt: addArea ? Number(addArea) : undefined,
          shareCertificateNumber: addShareCert?.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to add flat");
      }

      setFeedback({
        type: "success",
        text: `Flat ${addFlatNumber.toUpperCase()} added successfully to the register.`,
      });
      setAddModalOpen(false);
      setAddFlatNumber("");
      fetchFlats();
    } catch (err: unknown) {
      setFeedback({ type: "error", text: err instanceof Error ? err.message : "Error creating flat" });
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  const handleBulkGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmittingGen(true);
      const res = await fetch("/api/management/flats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "GENERATE_FLATS",
          buildingId: genBuildingId || undefined,
          wingId: genWingId || undefined,
          startFloor: Number(genStartFloor),
          endFloor: Number(genEndFloor),
          flatsPerFloor: Number(genFlatsPerFloor),
          numberingPattern: genPattern,
          prefix: genPrefix.trim(),
          bhkType: genBhk,
          carpetAreaSqFt: genArea ? Number(genArea) : undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Bulk generation failed");
      }

      setFeedback({
        type: "success",
        text: `Bulk generation executed: ${json.summary.inserted} new units added (${json.summary.skipped} existing duplicates safely preserved).`,
      });
      setGenerateModalOpen(false);
      fetchFlats();
    } catch (err: unknown) {
      setFeedback({ type: "error", text: err instanceof Error ? err.message : "Error generating flats" });
    } finally {
      setIsSubmittingGen(false);
    }
  };

  const handleCreateWing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWingName.trim()) {
      setFeedback({ type: "error", text: "Please enter a valid Wing Name (e.g. Wing A)" });
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
          buildingId: newWingBuildingId || undefined,
          totalFloors: Number(newWingFloors) || 1,
          flatsPerFloor: Number(newWingFlatsPerFloor) || 4,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to add wing");
      }

      setFeedback({
        type: "success",
        text: `Wing "${newWingName.trim()}" created successfully. You can now add or auto-generate flats for it!`,
      });
      setAddWingModalOpen(false);
      setNewWingName("");
      // Refresh directory and preselect new wing
      if (json.wing?._id) {
        setAddWingId(json.wing._id);
        setGenWingId(json.wing._id);
        setGenPrefix(json.wing.name.replace(/Wing\s*/i, "").trim());
      }
      fetchFlats();
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "Error creating wing",
      });
    } finally {
      setIsSubmittingWing(false);
    }
  };

  // Group flats by Wing
  const flatsList = data?.flats;
  const groupedFlats = useMemo(() => {
    if (!flatsList) return {};
    return flatsList.reduce((acc, flat) => {
      const wingKey = flat.wing?.name || flat.wingName || "Main Complex";
      if (!acc[wingKey]) acc[wingKey] = [];
      acc[wingKey].push(flat);
      return acc;
    }, {} as Record<string, FlatItem[]>);
  }, [flatsList]);

  // Floor options for filter
  const floorOptions = useMemo(() => {
    if (!flatsList) return [];
    const set = new Set<number>();
    flatsList.forEach((f) => set.add(f.floor));
    return Array.from(set).sort((a, b) => a - b);
  }, [flatsList]);

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Page Header */}
        <PageHeader
          title="Flats Directory & Structure"
          description="Centralized management of society buildings, wings, flat generation, and unit occupancy status."
          badge="Prompt 6"
          actions={
            <div className="flex flex-wrap items-center gap-2.5">
              <AppButton
                variant="outline"
                size="sm"
                leftIcon="business-outline"
                onClick={() => setAddWingModalOpen(true)}
              >
                + Add Wing
              </AppButton>
              <AppButton
                variant="outline"
                size="sm"
                leftIcon="add-circle-outline"
                onClick={() => setAddModalOpen(true)}
              >
                Add Flat Manually
              </AppButton>
              <AppButton
                variant="primary"
                size="sm"
                leftIcon="flash-outline"
                onClick={() => setGenerateModalOpen(true)}
              >
                Auto-Generate Flats
              </AppButton>
            </div>
          }
        />

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-4 rounded-xl border flex items-center justify-between text-sm ${
              feedback.type === "success"
                ? "bg-[#F0FDF4] border-[#BBF7D0] text-[#166534]"
                : "bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]"
            }`}
          >
            <div className="flex items-center gap-2">
              <IonIcon
                name={feedback.type === "success" ? "checkmark-circle" : "alert-circle"}
                size={20}
              />
              <span className="font-semibold">{feedback.text}</span>
            </div>
            <button
              onClick={() => setFeedback(null)}
              className="text-xs font-bold hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Summary Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Total Flats"
            value={data?.stats.totalFlats ?? "—"}
            iconName="business-outline"
            subtitle={data ? "Registered Society Units" : undefined}
          />
          <StatCard
            label="Registered Owners"
            value={data?.stats.registeredOwners ?? "—"}
            iconName="people-outline"
            badgeVariant="success"
            subtitle={data ? "Verified Ownership Records" : undefined}
          />
          <StatCard
            label="Active Tenants"
            value={data?.stats.activeTenants ?? "—"}
            iconName="key-outline"
            badgeVariant="info"
            subtitle={data ? "Dual-Approved Leases" : undefined}
          />
          <StatCard
            label="Vacant / Unassigned"
            value={data?.stats.vacantFlats ?? "—"}
            iconName="home-outline"
            badgeVariant="warning"
            subtitle={data ? "Available for Onboarding" : undefined}
          />
        </div>

        {/* Filter Controls Bar */}
        <AppCard className="p-4 bg-white border border-[#E5E7EB] shadow-2xs">
          <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md flex items-center gap-2">
              <SearchField
                placeholder="Search by flat number (e.g. A-101, 204)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full"
              />
              <AppButton type="submit" variant="outline" size="sm">
                Search
              </AppButton>
            </form>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* Wing Filter */}
              <div className="flex items-center gap-1.5 bg-[#F8F9FA] px-2.5 py-1.5 rounded-xl border border-[#E5E7EB]">
                <span className="font-semibold text-[#6B7280]">Wing:</span>
                <select
                  value={selectedWing}
                  onChange={(e) => setSelectedWing(e.target.value)}
                  className="bg-transparent font-bold text-[#1A1A1A] outline-hidden cursor-pointer"
                >
                  <option value="ALL">All Wings</option>
                  {data?.wings.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Floor Filter */}
              <div className="flex items-center gap-1.5 bg-[#F8F9FA] px-2.5 py-1.5 rounded-xl border border-[#E5E7EB]">
                <span className="font-semibold text-[#6B7280]">Floor:</span>
                <select
                  value={selectedFloor}
                  onChange={(e) => setSelectedFloor(e.target.value)}
                  className="bg-transparent font-bold text-[#1A1A1A] outline-hidden cursor-pointer"
                >
                  <option value="ALL">All Floors</option>
                  {floorOptions.map((fl) => (
                    <option key={fl} value={String(fl)}>
                      Floor {fl}
                    </option>
                  ))}
                </select>
              </div>

              {/* Occupancy Filter */}
              <div className="flex items-center gap-1.5 bg-[#F8F9FA] px-2.5 py-1.5 rounded-xl border border-[#E5E7EB]">
                <span className="font-semibold text-[#6B7280]">Occupancy:</span>
                <select
                  value={selectedOccupancy}
                  onChange={(e) => setSelectedOccupancy(e.target.value)}
                  className="bg-transparent font-bold text-[#1A1A1A] outline-hidden cursor-pointer"
                >
                  <option value="ALL">All Status</option>
                  <option value="OWNER_OCCUPIED">Owner Occupied</option>
                  <option value="TENANT_OCCUPIED">Tenant Occupied</option>
                  <option value="VACANT">Vacant</option>
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1.5 bg-[#F8F9FA] px-2.5 py-1.5 rounded-xl border border-[#E5E7EB]">
                <span className="font-semibold text-[#6B7280]">Status:</span>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="bg-transparent font-bold text-[#1A1A1A] outline-hidden cursor-pointer"
                >
                  <option value="ALL">All Units</option>
                  <option value="ACTIVE">Active Units</option>
                  <option value="INACTIVE">Decommissioned</option>
                </select>
              </div>

              {/* Grid / Table View Switcher */}
              <div className="flex items-center bg-[#F3F4F6] p-1 rounded-xl border border-[#E5E7EB] ml-auto">
                <button
                  type="button"
                  onClick={() => setViewMode("GRID")}
                  className={`p-1.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                    viewMode === "GRID"
                      ? "bg-white text-[#4F46E5] shadow-2xs font-bold"
                      : "text-[#6B7280] hover:text-[#1A1A1A]"
                  }`}
                  title="Grid View"
                >
                  <IonIcon name="grid-outline" size={16} />
                  <span className="hidden sm:inline text-[11px]">Grid</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("TABLE")}
                  className={`p-1.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                    viewMode === "TABLE"
                      ? "bg-white text-[#4F46E5] shadow-2xs font-bold"
                      : "text-[#6B7280] hover:text-[#1A1A1A]"
                  }`}
                  title="Table View"
                >
                  <IonIcon name="list-outline" size={16} />
                  <span className="hidden sm:inline text-[11px]">Table</span>
                </button>
              </div>
            </div>
          </div>
        </AppCard>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-pulse">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className="h-44 bg-white rounded-2xl border border-[#E5E7EB] p-5 space-y-3"
              >
                <div className="h-4 bg-[#F3F4F6] rounded-md w-1/3" />
                <div className="h-6 bg-[#F3F4F6] rounded-md w-1/2" />
                <div className="h-4 bg-[#F3F4F6] rounded-md w-2/3" />
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && (!data?.flats || data.flats.length === 0) && (
          <EmptyState
            title="No flats found matching criteria"
            description="Use 'Auto-Generate Flats' to create standard floor layouts or 'Add Flat Manually' to register an individual unit."
            iconName="business-outline"
            action={
              <AppButton variant="primary" size="sm" onClick={() => setGenerateModalOpen(true)}>
                Generate Units Now
              </AppButton>
            }
          />
        )}

        {/* Flats View (Grid / Table) */}
        {!loading && data?.flats && data.flats.length > 0 && (
          <>
            {viewMode === "GRID" ? (
              <div className="space-y-8">
                {Object.entries(groupedFlats).map(([wingTitle, wingFlats]) => (
                  <div key={wingTitle} className="space-y-3">
                    <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-2">
                      <div className="flex items-center gap-2">
                        <IonIcon name="layers-outline" size={18} className="text-[#4F46E5]" />
                        <h2 className="text-base font-bold text-[#1A1A1A] font-heading">
                          {wingTitle}
                        </h2>
                        <span className="text-xs bg-[#EEF2FF] text-[#4F46E5] font-semibold px-2 py-0.5 rounded-full border border-[#C7D2FE]">
                          {wingFlats.length} Units
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {wingFlats.map((flat) => {
                        const owner = flat.currentOwner || flat.owner;
                        const tenant = flat.currentTenant || flat.tenant;
                        const isOwnerOccupied = Boolean(owner && !tenant);
                        const isTenantOccupied = Boolean(tenant);

                        return (
                          <Link
                            key={flat.id}
                            href={`/management/flats/${flat.id}`}
                            className="group block"
                          >
                            <AppCard className="p-4 bg-white hover:border-[#4F46E5] hover:shadow-md transition-all rounded-2xl relative border border-[#E5E7EB] flex flex-col justify-between h-full group-hover:-translate-y-0.5">
                              {/* Pending Approvals Indicator */}
                              {flat.pendingApprovalsCount > 0 && (
                                <div className="absolute top-3 right-3 flex items-center gap-1 bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] text-[10px] font-bold px-2 py-0.5 rounded-full">
                                  <IonIcon name="time-outline" size={12} />
                                  <span>{flat.pendingApprovalsCount} Pending</span>
                                </div>
                              )}

                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-semibold text-[#6B7280]">
                                    Floor {flat.floor} • {flat.wing?.name || flat.wingName || "Main Complex"}
                                  </span>
                                </div>

                                <div className="flex items-baseline gap-2 mb-2">
                                  <h3 className="text-xl font-extrabold text-[#1A1A1A] font-heading group-hover:text-[#4F46E5] transition-colors">
                                    {flat.flatNumber}
                                  </h3>
                                  {flat.bhkType && (
                                    <span className="text-[11px] font-medium text-[#6B7280]">
                                      {flat.bhkType}
                                    </span>
                                  )}
                                </div>

                                {/* Occupancy Badge */}
                                <div className="mb-3">
                                  {isTenantOccupied ? (
                                    <StatusBadge variant="info">Tenant Occupied</StatusBadge>
                                  ) : isOwnerOccupied ? (
                                    <StatusBadge variant="success">Owner Occupied</StatusBadge>
                                  ) : (
                                    <StatusBadge variant="warning">Vacant</StatusBadge>
                                  )}
                                </div>

                                {/* Resident Info Snippet */}
                                <div className="space-y-1 text-xs text-[#4B5563] pt-2 border-t border-[#F3F4F6]">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[#9CA3AF]">Owner:</span>
                                    <span className="font-semibold text-[#1A1A1A] truncate max-w-[130px]">
                                      {owner?.name || "Unassigned"}
                                    </span>
                                  </div>

                                  {tenant && (
                                    <div className="flex items-center justify-between">
                                      <span className="text-[#9CA3AF]">Tenant:</span>
                                      <span className="font-semibold text-[#1A1A1A] truncate max-w-[130px]">
                                        {tenant.name}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="mt-4 pt-2 border-t border-[#F3F4F6] flex items-center justify-between text-[11px] text-[#6B7280]">
                                <span className="flex items-center gap-1">
                                  <IonIcon name="document-text-outline" size={13} />
                                  {flat.propertyDocCount} Docs
                                </span>
                                <span className="font-bold text-[#4F46E5] group-hover:underline flex items-center gap-0.5">
                                  Inspect <IonIcon name="arrow-forward-outline" size={12} />
                                </span>
                              </div>
                            </AppCard>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Table View */
              <AppCard className="overflow-hidden border border-[#E5E7EB] bg-white rounded-2xl shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#F8F9FA] border-b border-[#E5E7EB] text-[#6B7280] font-bold uppercase tracking-wider">
                        <th className="py-3 px-4">Flat #</th>
                        <th className="py-3 px-4">Wing</th>
                        <th className="py-3 px-4">Floor</th>
                        <th className="py-3 px-4">BHK / Area</th>
                        <th className="py-3 px-4">Occupancy</th>
                        <th className="py-3 px-4">Registered Owner</th>
                        <th className="py-3 px-4">Active Tenant</th>
                        <th className="py-3 px-4">Documents</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E7EB]">
                      {data.flats.map((flat) => {
                        const owner = flat.currentOwner || flat.owner;
                        const tenant = flat.currentTenant || flat.tenant;

                        return (
                          <tr
                            key={flat.id}
                            className="hover:bg-[#F9FAFB] transition-colors cursor-pointer"
                          >
                            <td className="py-3 px-4 font-bold text-[#1A1A1A] text-sm">
                              <Link
                                href={`/management/flats/${flat.id}`}
                                className="hover:text-[#4F46E5] flex items-center gap-1.5"
                              >
                                <span>{flat.flatNumber}</span>
                                {flat.pendingApprovalsCount > 0 && (
                                  <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
                                )}
                              </Link>
                            </td>
                            <td className="py-3 px-4 font-semibold text-[#4B5563]">
                              {flat.wing?.name || flat.wingName || "Main Complex"}
                            </td>
                            <td className="py-3 px-4 text-[#4B5563]">Floor {flat.floor}</td>
                            <td className="py-3 px-4 text-[#6B7280]">
                              {flat.bhkType || "—"}{" "}
                              {flat.carpetAreaSqFt ? `(${flat.carpetAreaSqFt} sq ft)` : ""}
                            </td>
                            <td className="py-3 px-4">
                              {tenant ? (
                                <StatusBadge variant="info">Tenant Occupied</StatusBadge>
                              ) : owner ? (
                                <StatusBadge variant="success">Owner Occupied</StatusBadge>
                              ) : (
                                <StatusBadge variant="warning">Vacant</StatusBadge>
                              )}
                            </td>
                            <td className="py-3 px-4 font-medium text-[#1A1A1A]">
                              {owner ? (
                                <div>
                                  <p className="font-semibold">{owner.name}</p>
                                  <p className="text-[10px] text-[#9CA3AF]">
                                    {owner.email}
                                  </p>
                                </div>
                              ) : (
                                <span className="text-[#9CA3AF] italic">Unassigned</span>
                              )}
                            </td>
                            <td className="py-3 px-4 font-medium text-[#1A1A1A]">
                              {tenant ? (
                                <div>
                                  <p className="font-semibold">{tenant.name}</p>
                                  <p className="text-[10px] text-[#9CA3AF]">
                                    {tenant.email}
                                  </p>
                                </div>
                              ) : (
                                <span className="text-[#9CA3AF]">—</span>
                              )}
                            </td>
                          <td className="py-3 px-4 text-[#6B7280]">
                            <span className="flex items-center gap-1">
                              <IonIcon name="document-text-outline" size={13} />
                              {flat.propertyDocCount}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Link href={`/management/flats/${flat.id}`}>
                              <AppButton variant="ghost" size="sm">
                                Inspect
                              </AppButton>
                            </Link>
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </AppCard>
            )}
          </>
        )}

        {/* Modal: Add Flat Manually */}
        <Modal
          isOpen={addModalOpen}
          onClose={() => setAddModalOpen(false)}
          title="Add Flat Manually"
        >
          <form onSubmit={handleCreateFlat} className="space-y-4 text-xs">
            <p className="text-[#6B7280] leading-relaxed">
              Register a specific physical housing unit within the society structure. Duplicates within
              the same wing are strictly prevented.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Building" id="add-building">
                <select
                  value={addBuildingId}
                  onChange={(e) => setAddBuildingId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] bg-white text-xs font-semibold"
                >
                  <option value="">Select Building (Optional)</option>
                  {data?.buildings.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Wing" id="add-wing">
                <select
                  value={addWingId}
                  onChange={(e) => setAddWingId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] bg-white text-xs font-semibold"
                >
                  <option value="">No Wing / Standalone</option>
                  {data?.wings.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Flat Identifier *" id="add-flat-number" required>
                <input
                  type="text"
                  placeholder="e.g. A-101 or 101"
                  value={addFlatNumber}
                  onChange={(e) => setAddFlatNumber(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] bg-white text-xs font-bold uppercase"
                />
              </FormField>

              <FormField label="Floor Number *" id="add-floor" required>
                <input
                  type="number"
                  min="0"
                  max="150"
                  value={addFloor}
                  onChange={(e) => setAddFloor(Number(e.target.value))}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] bg-white text-xs font-bold"
                />
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Configuration / BHK" id="add-bhk">
                <select
                  value={addBhk}
                  onChange={(e) => setAddBhk(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] bg-white text-xs font-semibold"
                >
                  <option value="1 RK">1 RK</option>
                  <option value="1 BHK">1 BHK</option>
                  <option value="2 BHK">2 BHK</option>
                  <option value="2.5 BHK">2.5 BHK</option>
                  <option value="3 BHK">3 BHK</option>
                  <option value="4 BHK">4 BHK</option>
                  <option value="Penthouse">Penthouse</option>
                  <option value="Commercial Shop">Commercial Shop</option>
                </select>
              </FormField>

              <FormField label="Carpet Area (sq ft)" id="add-area">
                <input
                  type="number"
                  placeholder="e.g. 785"
                  value={addArea ?? ""}
                  onChange={(e) => setAddArea(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] bg-white text-xs"
                />
              </FormField>
            </div>

            <FormField label="Share Certificate Number" id="add-share-cert">
              <input
                type="text"
                placeholder="e.g. SC-0104"
                value={addShareCert}
                onChange={(e) => setAddShareCert(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] bg-white text-xs uppercase"
              />
            </FormField>

            <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-end gap-2">
              <AppButton
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setAddModalOpen(false)}
              >
                Cancel
              </AppButton>
              <AppButton
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isSubmittingAdd}
              >
                Create Flat
              </AppButton>
            </div>
          </form>
        </Modal>

        {/* Modal: Bulk Auto-Generate Flats */}
        <Modal
          isOpen={generateModalOpen}
          onClose={() => setGenerateModalOpen(false)}
          title="Auto-Generate Flats (Idempotent Bulk Generation)"
        >
          <form onSubmit={handleBulkGenerate} className="space-y-4 text-xs">
            <p className="text-[#6B7280] leading-relaxed">
              Batch create standard floor layouts. If any generated flat already exists in the database,
              it will be safely skipped to guarantee idempotency and avoid overwriting existing data.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Target Building" id="gen-building">
                <select
                  value={genBuildingId}
                  onChange={(e) => setGenBuildingId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] bg-white text-xs font-semibold"
                >
                  <option value="">Standalone / Main Building</option>
                  {data?.buildings.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Target Wing" id="gen-wing">
                <select
                  value={genWingId}
                  onChange={(e) => {
                    setGenWingId(e.target.value);
                    const selected = data?.wings.find((w) => w.id === e.target.value);
                    if (selected) {
                      setGenPrefix(selected.name.replace(/Wing\s*/i, "").trim());
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] bg-white text-xs font-semibold"
                >
                  <option value="">No Wing</option>
                  {data?.wings.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <FormField label="Start Floor" id="gen-start-floor" required>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={genStartFloor}
                  onChange={(e) => setGenStartFloor(Number(e.target.value))}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] bg-white text-xs font-bold"
                />
              </FormField>

              <FormField label="End Floor" id="gen-end-floor" required>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={genEndFloor}
                  onChange={(e) => setGenEndFloor(Number(e.target.value))}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] bg-white text-xs font-bold"
                />
              </FormField>

              <FormField label="Flats Per Floor" id="gen-per-floor" required>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={genFlatsPerFloor}
                  onChange={(e) => setGenFlatsPerFloor(Number(e.target.value))}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] bg-white text-xs font-bold"
                />
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Numbering Pattern" id="gen-pattern">
                <select
                  value={genPattern}
                  onChange={(e) =>
                    setGenPattern(e.target.value as "FLOOR_UNIT" | "WING_FLOOR_UNIT")
                  }
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] bg-white text-xs font-semibold"
                >
                  <option value="WING_FLOOR_UNIT">Wing Prefix (e.g. A-101, A-102)</option>
                  <option value="FLOOR_UNIT">Direct Number (e.g. 101, 102)</option>
                </select>
              </FormField>

              <FormField label="Prefix (e.g. A, B, T1)" id="gen-prefix">
                <input
                  type="text"
                  placeholder="e.g. A"
                  value={genPrefix}
                  onChange={(e) => setGenPrefix(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] bg-white text-xs font-bold uppercase"
                />
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Default Layout (BHK)" id="gen-bhk">
                <select
                  value={genBhk}
                  onChange={(e) => setGenBhk(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] bg-white text-xs font-semibold"
                >
                  <option value="1 RK">1 RK</option>
                  <option value="1 BHK">1 BHK</option>
                  <option value="2 BHK">2 BHK</option>
                  <option value="3 BHK">3 BHK</option>
                  <option value="4+ BHK">4+ BHK</option>
                  <option value="Penthouse">Penthouse</option>
                  <option value="Shop / Commercial">Shop / Commercial</option>
                </select>
              </FormField>

              <FormField label="Carpet Area (sq.ft)" id="gen-area">
                <input
                  type="number"
                  placeholder="e.g. 850"
                  value={genArea ?? ""}
                  onChange={(e) => setGenArea(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] bg-white text-xs font-bold"
                />
              </FormField>
            </div>

            {/* Live Generation Preview */}
            <div className="p-3 bg-[#EEF2FF] border border-[#C7D2FE] rounded-xl space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-[#4F46E5]">
                <span>Generation Plan Preview:</span>
                <span>{generatedPreview.length} Units Candidate</span>
              </div>
              <p className="text-[11px] text-[#4338CA] leading-relaxed">
                Sample: {generatedPreview.slice(0, 8).join(", ")}
                {generatedPreview.length > 8 ? ` ... and ${generatedPreview.length - 8} more` : ""}
              </p>
            </div>

            <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-end gap-2">
              <AppButton
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setGenerateModalOpen(false)}
              >
                Cancel
              </AppButton>
              <AppButton
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isSubmittingGen}
              >
                Confirm &amp; Generate ({generatedPreview.length} Flats)
              </AppButton>
            </div>
          </form>
        </Modal>
      </div>
    </AppShell>
  );
}
