"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import {
  PageHeader,
  AppCard,
  AppButton,
  IconContainer,
  IonIcon,
  SearchField,
  EmptyState,
  IonIconName,
} from "@/components/ui";

interface ServiceItem {
  id: string;
  code: string;
  title: string;
  description: string;
  category: "CERTIFICATES_NOC" | "PROPERTY" | "TENANT_OCCUPANCY" | "PERMISSIONS" | "GENERAL";
  eligibility: "OWNER" | "TENANT" | "BOTH";
  requiresOwnerAuthorization: boolean;
  estimatedProcessingDays: number;
  isActive: boolean;
  isDownstreamAvailable: boolean;
  downstreamNote?: string;
  requiredFieldsCount: number;
  requiredDocumentsCount: number;
  requiredDocuments: Array<{ code: string; title: string; required: boolean }>;
}

interface ServicesData {
  success: boolean;
  role: "OWNER" | "TENANT";
  isManagement: boolean;
  flats: Array<{
    id: string;
    flatNumber: string;
    floor: number;
    bhkType?: string;
    occupancyType: string;
  }>;
  services: ServiceItem[];
}

const CATEGORIES = [
  { id: "ALL", label: "All Services", icon: "apps-outline" },
  { id: "CERTIFICATES_NOC", label: "Certificates & NOCs", icon: "ribbon-outline" },
  { id: "PROPERTY", label: "Property", icon: "business-outline" },
  { id: "TENANT_OCCUPANCY", label: "Tenant & Occupancy", icon: "people-outline" },
  { id: "PERMISSIONS", label: "Permissions", icon: "shield-checkmark-outline" },
  { id: "GENERAL", label: "General", icon: "document-text-outline" },
];

export default function ServicesPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ServicesData | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    async function fetchServices() {
      try {
        setLoading(true);
        const res = await fetch("/api/services");
        const json = await res.json();
        if (!ignore) {
          if (res.ok) {
            setData(json);
          } else {
            setError(json.error || "Failed to load services catalogue");
          }
        }
      } catch {
        if (!ignore) {
          setError("Network error loading service catalogue");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }
    fetchServices();
    return () => {
      ignore = true;
    };
  }, []);

  const servicesList = data?.services;
  const filteredServices = useMemo(() => {
    if (!servicesList) return [];
    return servicesList.filter((s) => {
      const matchesCategory =
        selectedCategory === "ALL" || s.category === selectedCategory;
      const matchesSearch =
        searchQuery.trim() === "" ||
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.code.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [servicesList, selectedCategory, searchQuery]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "CERTIFICATES_NOC":
        return "ribbon-outline";
      case "PROPERTY":
        return "business-outline";
      case "TENANT_OCCUPANCY":
        return "people-outline";
      case "PERMISSIONS":
        return "shield-checkmark-outline";
      default:
        return "document-text-outline";
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Page Header */}
        <PageHeader
          title="Society Service Catalogue"
          description="Submit official applications, NOCs, permissions and letters with automated tracking"
          actions={
            <Link href="/requests">
              <AppButton variant="outline" size="sm" leftIcon="time-outline">
                My Requests History
              </AppButton>
            </Link>
          }
        />

        {/* Feedback Banner */}
        {error && (
          <div className="p-4 bg-[#FFF1F2] border border-[#F43F5E] text-[#F43F5E] rounded-xl text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Resident Authorized Units Banner */}
        {data && data.flats.length > 0 && (
          <div className="p-3.5 bg-[#EEF2FF] border border-[#C7D2FE] rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <IconContainer name="home-outline" variant="hero" size="sm" />
              <div>
                <span className="font-bold text-[#1A1A1A]">Authorized Units: </span>
                <span className="text-[#4F46E5] font-semibold">
                  {data.flats.map((f) => `Flat ${f.flatNumber} (${f.occupancyType})`).join(", ")}
                </span>
              </div>
            </div>
            <span className="text-[11px] font-bold text-[#4338CA] bg-white px-2.5 py-1 rounded-full border border-[#C7D2FE]">
              Role: {data.role}
            </span>
          </div>
        )}

        {/* Search & Category Tabs */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <SearchField
              placeholder="Search services (e.g. NOC, Move-in, Renovation, Loan)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:max-w-md"
            />
            <div className="text-xs text-[#6B7280] font-semibold self-center">
              Showing {filteredServices.length} available service{filteredServices.length === 1 ? "" : "s"}
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? "bg-[#1A1A1A] text-white shadow-2xs"
                      : "bg-[#F8F9FA] text-[#6B7280] hover:text-[#1A1A1A] hover:bg-[#F3F4F6] border border-[#E5E7EB]"
                  }`}
                >
                  <IonIcon name={cat.icon as IonIconName} size={13} />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Service Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((idx) => (
              <AppCard key={idx} className="p-5 space-y-3 animate-pulse bg-white">
                <div className="h-4 bg-[#F3F4F6] rounded-md w-3/4"></div>
                <div className="h-3 bg-[#F3F4F6] rounded-md w-full"></div>
                <div className="h-3 bg-[#F3F4F6] rounded-md w-2/3"></div>
                <div className="pt-4 flex justify-between">
                  <div className="h-6 bg-[#F3F4F6] rounded-full w-20"></div>
                  <div className="h-6 bg-[#F3F4F6] rounded-md w-24"></div>
                </div>
              </AppCard>
            ))}
          </div>
        ) : filteredServices.length === 0 ? (
          <EmptyState
            title="No Services Found"
            description={
              searchQuery
                ? `No service template matched '${searchQuery}'. Try clearing your search.`
                : "No active services are currently configured in this category."
            }
            iconName="search-outline"
            action={
              searchQuery ? (
                <AppButton
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("ALL");
                  }}
                >
                  Clear Filters
                </AppButton>
              ) : undefined
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredServices.map((service) => (
              <AppCard
                key={service.id}
                className="p-5 flex flex-col justify-between hover:border-[#C7D2FE] transition-all bg-white shadow-2xs"
              >
                <div className="space-y-3">
                  {/* Top Bar: Icon & Category */}
                  <div className="flex items-start justify-between gap-2">
                    <IconContainer
                      name={getCategoryIcon(service.category)}
                      variant={service.requiresOwnerAuthorization ? "warning" : "hero"}
                      size="md"
                    />
                    <div className="flex flex-wrap items-center gap-1.5 justify-end">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F3F4F6] text-[#6B7280]">
                        {service.eligibility === "BOTH"
                          ? "Owner & Tenant"
                          : `${service.eligibility} Only`}
                      </span>
                      {service.requiresOwnerAuthorization && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A] flex items-center gap-1">
                          <IonIcon name="key-outline" size={10} /> Owner Auth
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="font-heading font-bold text-sm text-[#1A1A1A] leading-snug">
                      {service.title}
                    </h3>
                    <p className="text-xs text-[#6B7280] mt-1.5 leading-relaxed line-clamp-2">
                      {service.description}
                    </p>
                  </div>

                  {/* Downstream notice (e.g. Ownership Transfer) */}
                  {!service.isDownstreamAvailable && (
                    <div className="p-2 bg-[#FFFBEB] border border-[#FDE68A] rounded-lg text-[11px] text-[#92400E] font-medium leading-relaxed">
                      <span className="font-bold">Intake Notice: </span>
                      {service.downstreamNote || "Downstream workflow will be enabled in a future release."}
                    </div>
                  )}

                  {/* Document Requirements Summary */}
                  <div className="pt-2 border-t border-[#F3F4F6] space-y-1">
                    <div className="text-[11px] font-bold text-[#6B7280] flex items-center justify-between">
                      <span>Required Attachments:</span>
                      <span className="text-[#1A1A1A]">
                        {service.requiredDocumentsCount > 0
                          ? `${service.requiredDocumentsCount} file${service.requiredDocumentsCount === 1 ? "" : "s"}`
                          : "None"}
                      </span>
                    </div>
                    {service.requiredDocuments.length > 0 && (
                      <p className="text-[11px] text-[#9CA3AF] truncate">
                        {service.requiredDocuments.map((d) => d.title).join(", ")}
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer Action & Processing Time */}
                <div className="pt-4 mt-4 border-t border-[#E5E7EB] flex items-center justify-between">
                  <span className="text-[11px] text-[#6B7280] flex items-center gap-1 font-medium">
                    <IonIcon name="time-outline" size={12} />
                    ~{service.estimatedProcessingDays} Days
                  </span>

                  <Link href={`/requests/new/${service.code}`}>
                    <AppButton size="sm" variant="primary" rightIcon="arrow-forward-outline">
                      Start Request
                    </AppButton>
                  </Link>
                </div>
              </AppCard>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
