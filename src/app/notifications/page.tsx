"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import {
  PageHeader,
  AppCard,
  StatusBadge,
  AppButton,
  IconContainer,
  IonIcon,
} from "@/components/ui";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "action_required";
  category: "REGISTRATION" | "SERVICE_REQUEST" | "APPROVAL" | "SYSTEM" | "REMINDER";
  eventType: string;
  actionUrl?: string;
  read: boolean;
  readAt?: string | null;
  createdAt: string;
  deliverySummary?: {
    emailStatus?: string;
    whatsappStatus?: string;
  };
}

function NotificationsContent() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "UNREAD" | "READ">("ALL");
  const [actionProcessing, setActionProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeCategory !== "ALL") params.set("category", activeCategory);
      if (statusFilter !== "ALL") params.set("status", statusFilter);

      const res = await fetch(`/api/notifications?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [activeCategory, statusFilter]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const handleMarkAllRead = async () => {
    setActionProcessing(true);
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
      setSuccessMessage("All notifications marked as read.");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    } finally {
      setActionProcessing(false);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications?id=${notificationId}`, {
        method: "DELETE",
      });
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  };

  const getCategoryBadgeVariant = (cat: string) => {
    switch (cat) {
      case "APPROVAL":
        return "hero";
      case "REGISTRATION":
        return "info";
      case "SERVICE_REQUEST":
        return "neutral";
      case "REMINDER":
        return "warning";
      default:
        return "neutral";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "action_required":
        return "alert-circle";
      case "warning":
        return "warning";
      case "success":
        return "checkmark-circle";
      default:
        return "notifications";
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-[#1A1A1A] font-['Outfit']">
              Notification Center
            </h1>
            {unreadCount > 0 && (
              <span className="bg-[#4F46E5] text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
                {unreadCount} Unread
              </span>
            )}
          </div>
          <p className="text-sm text-[#6B7280] mt-1">
            Real-time multi-channel alerts for registrations, service approvals, and reminders.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <AppButton
              variant="outline"
              size="sm"
              onClick={handleMarkAllRead}
              disabled={actionProcessing}
            >
              <IonIcon name="checkmark-done" className="mr-1.5" />
              Mark All as Read
            </AppButton>
          )}

          <Link href="/settings/notifications">
            <AppButton variant="secondary" size="sm">
              <IonIcon name="options-outline" className="mr-1.5" />
              Preferences
            </AppButton>
          </Link>
        </div>
      </div>

      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2 animate-fadeIn">
          <IonIcon name="checkmark-circle" className="text-emerald-600 text-base" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#F8F9FA] p-3 rounded-2xl border border-gray-200">
        {/* Category Pills */}
        <div className="flex flex-wrap gap-1.5">
          {[
            { key: "ALL", label: "All Categories" },
            { key: "REGISTRATION", label: "Registrations" },
            { key: "SERVICE_REQUEST", label: "Service Requests" },
            { key: "APPROVAL", label: "Approvals" },
            { key: "REMINDER", label: "Reminders" },
          ].map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-all ${
                activeCategory === cat.key
                  ? "bg-[#4F46E5] text-white shadow-sm"
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Read / Unread Filter */}
        <div className="flex items-center gap-1 self-end md:self-auto">
          {(["ALL", "UNREAD", "READ"] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors ${
                statusFilter === st
                  ? "bg-gray-900 text-white"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              {st === "ALL" ? "All" : st === "UNREAD" ? "Unread" : "Read"}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="py-20 text-center text-gray-400">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-medium text-gray-500">Loading notifications...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="py-20 text-center bg-white border border-gray-200 rounded-2xl p-8 space-y-3">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto text-xl">
            <IonIcon name="notifications-off-outline" />
          </div>
          <h3 className="text-base font-bold text-gray-900">No Notifications</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            {statusFilter === "UNREAD"
              ? "You have caught up on all unread alerts."
              : "No notification records found in this category."}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {notifications.map((n) => {
            const isUnread = !n.read;
            return (
              <div
                key={n.id}
                className={`group p-4 sm:p-5 rounded-2xl border transition-all ${
                  isUnread
                    ? "bg-white border-indigo-200 shadow-sm ring-1 ring-indigo-50"
                    : "bg-white/80 border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-start gap-3.5">
                  {/* Status Indicator Icon */}
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-base ${
                      n.type === "action_required"
                        ? "bg-amber-100 text-amber-700"
                        : n.type === "warning"
                        ? "bg-red-100 text-red-700"
                        : n.type === "success"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-indigo-50 text-indigo-600"
                    }`}
                  >
                    <IonIcon name={getTypeIcon(n.type)} />
                  </div>

                  {/* Body Copy */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-sm text-[#1A1A1A] font-['Outfit']">
                        {n.title}
                      </span>

                      {isUnread && (
                        <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
                      )}

                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                        {n.category}
                      </span>
                    </div>

                    <p className="text-xs text-[#4B5563] leading-relaxed">
                      {n.message}
                    </p>

                    {/* Metadata & Timestamp */}
                    <div className="flex flex-wrap items-center gap-3 pt-2 text-[11px] text-gray-400 font-medium">
                      <span>{new Date(n.createdAt).toLocaleString()}</span>

                      {/* Delivery summary tags */}
                      {n.deliverySummary?.emailStatus && (
                        <span className="flex items-center gap-1 text-[10px] text-gray-500">
                          <IonIcon name="mail-outline" />
                          <span>Email: {n.deliverySummary.emailStatus}</span>
                        </span>
                      )}

                      {n.deliverySummary?.whatsappStatus && (
                        <span className="flex items-center gap-1 text-[10px] text-gray-500">
                          <IonIcon name="logo-whatsapp" />
                          <span>WhatsApp: {n.deliverySummary.whatsappStatus}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-center">
                    {n.actionUrl && (
                      <Link
                        href={n.actionUrl}
                        onClick={() => {
                          if (isUnread) handleMarkAsRead(n.id);
                        }}
                      >
                        <AppButton variant="primary" size="sm">
                          <span>View</span>
                          <IonIcon name="arrow-forward" className="ml-1 text-xs" />
                        </AppButton>
                      </Link>
                    )}

                    {isUnread && (
                      <button
                        onClick={() => handleMarkAsRead(n.id)}
                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Mark as read"
                      >
                        <IonIcon name="checkmark" className="text-base" />
                      </button>
                    )}

                    <button
                      onClick={() => handleDeleteNotification(n.id)}
                      className="p-1.5 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Dismiss notification"
                    >
                      <IonIcon name="close" className="text-base" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function NotificationsPage() {
  return (
    <AppShell>
      <Suspense
        fallback={
          <div className="min-h-screen bg-[#F8F9FA] p-8 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-sm font-medium">Loading Notifications...</p>
            </div>
          </div>
        }
      >
        <NotificationsContent />
      </Suspense>
    </AppShell>
  );
}
