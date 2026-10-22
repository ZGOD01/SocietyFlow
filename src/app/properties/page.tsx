"use client";

import React, { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  PageHeader,
  SearchField,
  AppCard,
  StatusBadge,
  AppButton,
  IconContainer,
} from "@/components/ui";
import { FlatRecord } from "@/types";

const SAMPLE_FLATS: FlatRecord[] = [
  {
    id: "flat-101",
    societyId: "soc-greenwood",
    wing: "Wing A",
    flatNumber: "A-101",
    floor: 1,
    carpetAreaSqFt: 1140,
    ownerName: "Sunil Joshi",
    ownerEmail: "sunil.joshi@example.com",
    ownerPhone: "+91 98230 11223",
    occupancyStatus: "SELF_OCCUPIED",
    shareCertificateNumber: "SC-001",
    possessionDate: "2019-11-01",
  },
  {
    id: "flat-102",
    societyId: "soc-greenwood",
    wing: "Wing A",
    flatNumber: "A-102",
    floor: 1,
    carpetAreaSqFt: 1140,
    ownerName: "Deepak Ranade",
    ownerEmail: "deepak.r@example.com",
    ownerPhone: "+91 98221 44556",
    occupancyStatus: "RENTED",
    shareCertificateNumber: "SC-002",
    possessionDate: "2019-11-15",
  },
  {
    id: "flat-402",
    societyId: "soc-greenwood",
    wing: "Wing C",
    flatNumber: "C-402",
    floor: 4,
    carpetAreaSqFt: 1420,
    ownerName: "Priya Mehta",
    ownerEmail: "priya.mehta@example.com",
    ownerPhone: "+91 99220 88776",
    occupancyStatus: "SELF_OCCUPIED",
    shareCertificateNumber: "SC-042",
    possessionDate: "2020-02-10",
  },
  {
    id: "flat-301",
    societyId: "soc-greenwood",
    wing: "Wing B",
    flatNumber: "B-301",
    floor: 3,
    carpetAreaSqFt: 980,
    ownerName: "Harish Deshmukh",
    ownerEmail: "harish.d@example.com",
    ownerPhone: "+91 98901 33221",
    occupancyStatus: "SELF_OCCUPIED",
    shareCertificateNumber: "SC-029",
    possessionDate: "2020-01-20",
  },
];

export default function PropertiesPage() {
  const [search, setSearch] = useState("");
  const [activeWing, setActiveWing] = useState("ALL");

  const filteredFlats = SAMPLE_FLATS.filter((f) => {
    const matchesSearch =
      f.flatNumber.toLowerCase().includes(search.toLowerCase()) ||
      f.ownerName.toLowerCase().includes(search.toLowerCase()) ||
      f.shareCertificateNumber?.toLowerCase().includes(search.toLowerCase());
    const matchesWing = activeWing === "ALL" || f.wing === activeWing;
    return matchesSearch && matchesWing;
  });

  return (
    <AppShell>
      <PageHeader
        title="Flats & Ownership Registry"
        description="Official statutory share allotment roster and occupancy registry"
        breadcrumbs={[
          { label: "Console", href: "/dashboard" },
          { label: "Properties & Flats" },
        ]}
        badge={
          <StatusBadge variant="info" size="sm">
            216 Total Units
          </StatusBadge>
        }
        actions={
          <AppButton
            variant="hero"
            size="sm"
            leftIcon="add-outline"
            onClick={() =>
              alert("[Prototype Preview] Master unit importing will support Excel/CSV batch uploads in Prompt 4.")
            }
          >
            Register Unit
          </AppButton>
        }
      />

      {/* Search and Wing Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <SearchField
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onClear={() => setSearch("")}
          placeholder="Search flat number, owner name, certificate #..."
        />

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {["ALL", "Wing A", "Wing B", "Wing C"].map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => setActiveWing(w)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                activeWing === w
                  ? "bg-[#1A1A1A] text-white"
                  : "bg-white text-[#6B7280] border border-[#E5E7EB] hover:text-[#1A1A1A]"
              }`}
            >
              {w === "ALL" ? "All Wings (216)" : w}
            </button>
          ))}
        </div>
      </div>

      {/* Roster Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredFlats.map((flat) => (
          <AppCard key={flat.id} className="p-5 bg-white border-[#E5E7EB]">
            <div className="flex items-start justify-between pb-3 border-b border-[#F1F3F5]">
              <div className="flex items-center gap-3">
                <IconContainer name="home-outline" variant="hero-soft" size="sm" />
                <div>
                  <h3 className="text-base font-bold text-[#1A1A1A] font-heading">
                    {flat.flatNumber}
                  </h3>
                  <p className="text-xs text-[#6B7280]">
                    {flat.wing} • Floor {flat.floor} • {flat.carpetAreaSqFt} sq.ft
                  </p>
                </div>
              </div>
              <StatusBadge
                variant={flat.occupancyStatus === "SELF_OCCUPIED" ? "success" : "info"}
                size="sm"
              >
                {flat.occupancyStatus.replace("_", " ")}
              </StatusBadge>
            </div>

            <div className="py-3 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-[#9CA3AF]">Owner:</span>
                <p className="font-semibold text-[#1A1A1A]">{flat.ownerName}</p>
              </div>
              <div>
                <span className="text-[#9CA3AF]">Share Certificate:</span>
                <p className="font-mono font-semibold text-[#4F46E5]">
                  {flat.shareCertificateNumber}
                </p>
              </div>
              <div>
                <span className="text-[#9CA3AF]">Contact:</span>
                <p className="text-[#6B7280]">{flat.ownerPhone}</p>
              </div>
              <div>
                <span className="text-[#9CA3AF]">Possession Date:</span>
                <p className="text-[#6B7280]">{flat.possessionDate}</p>
              </div>
            </div>

            <div className="pt-3 border-t border-[#F1F3F5] flex items-center justify-between text-xs">
              <span className="text-[#10B981] font-medium flex items-center gap-1">
                ✓ Title Record Verified
              </span>
              <AppButton
                variant="outline"
                size="sm"
                onClick={() =>
                  alert(`[Prototype Preview] Navigating to isolated vault for ${flat.flatNumber}`)
                }
              >
                Inspect Vault
              </AppButton>
            </div>
          </AppCard>
        ))}
      </div>
    </AppShell>
  );
}
