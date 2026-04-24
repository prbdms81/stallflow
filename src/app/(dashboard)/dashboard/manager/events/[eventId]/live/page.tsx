"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import {
  RefreshCw,
  Users,
  CheckCircle,
  Clock,
  Store,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import Button from "@/components/ui/Button";

// ─── Types ───────────────────────────────────────────────────────────────────

interface CheckedInVendor {
  bookingId: string;
  vendorName: string;
  stallNumber: string;
  checkInTime: string;
}

interface NotCheckedInVendor {
  bookingId: string;
  vendorName: string;
  stallNumber: string;
  bookingStatus: string;
}

interface ActivityItem {
  type: "booking" | "gate_pass";
  id: string;
  label: string;
  timestamp: string;
  meta: string;
}

interface LiveData {
  totalStalls: number;
  availableStalls: number;
  bookedStalls: number;
  confirmedBookings: number;
  pendingBookings: number;
  checkedIn: CheckedInVendor[];
  notCheckedIn: NotCheckedInVendor[];
  recentActivity: ActivityItem[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(date: string): string {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

function formatTime(date: string): string {
  return new Date(date).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 py-5">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-sm text-gray-500">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LiveDashboardPage() {
  const params = useParams();
  const eventId = params.eventId as string;

  const [data, setData] = useState<LiveData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [secondsSince, setSecondsSince] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(
    async (showLoading = false) => {
      if (showLoading) setLoading(true);
      try {
        const res = await fetch(`/api/events/${eventId}/live`);
        if (!res.ok) {
          const body = await res.json();
          throw new Error(body.error || "Failed to load");
        }
        const json: LiveData = await res.json();
        setData(json);
        setLastUpdated(new Date());
        setSecondsSince(0);
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    },
    [eventId]
  );

  // Initial load + 30s polling
  useEffect(() => {
    fetchData(true);
    intervalRef.current = setInterval(() => fetchData(false), 30_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchData]);

  // "Last updated X seconds ago" ticker
  useEffect(() => {
    tickRef.current = setInterval(() => {
      setSecondsSince((s) => s + 1);
    }, 1000);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, []);

  const checkInPct =
    data && data.confirmedBookings > 0
      ? Math.round((data.checkedIn.length / data.confirmedBookings) * 100)
      : 0;

  // ── Render ───────────────────────────────────────────────────────────────

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <RefreshCw className="w-8 h-8 animate-spin" />
          <p>Loading live dashboard…</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center text-red-500">
          <p className="font-semibold">Error loading dashboard</p>
          <p className="text-sm mt-1">{error}</p>
          <Button className="mt-4" onClick={() => fetchData(true)}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">
            Live Operations
          </h1>
          {/* Pulsing LIVE badge */}
          <span className="flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            LIVE
          </span>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-sm text-gray-400">
              Last updated: {secondsSince}s ago
            </span>
          )}
          <Button
            onClick={() => fetchData(false)}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          label="Total Stalls"
          value={data!.totalStalls}
          icon={Store}
          color="bg-blue-500"
        />
        <StatCard
          label="Booked"
          value={data!.bookedStalls}
          icon={Users}
          color="bg-indigo-500"
        />
        <StatCard
          label="Checked In"
          value={data!.checkedIn.length}
          icon={CheckCircle}
          color="bg-green-500"
        />
        <StatCard
          label="Pending Payment"
          value={data!.pendingBookings}
          icon={Clock}
          color="bg-amber-500"
        />
      </div>

      {/* Check-in Progress */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-800">Check-in Progress</h2>
        </CardHeader>
        <CardContent className="space-y-2 py-5">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>
              {data!.checkedIn.length} of {data!.confirmedBookings} confirmed
              vendors checked in
            </span>
            <span className="font-semibold">{checkInPct}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
            <div
              className="h-4 rounded-full bg-green-500 transition-all duration-500"
              style={{ width: `${checkInPct}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Two-column tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Checked In */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Checked In ({data!.checkedIn.length})
            </h2>
          </CardHeader>
          <CardContent className="p-0">
            {data!.checkedIn.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">
                No vendors checked in yet
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                    <tr>
                      <th className="px-4 py-2 text-left">Vendor</th>
                      <th className="px-4 py-2 text-left">Stall</th>
                      <th className="px-4 py-2 text-left">Check-in</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data!.checkedIn.map((v) => (
                      <tr key={v.bookingId} className="hover:bg-gray-50">
                        <td className="px-4 py-2 font-medium text-gray-800">
                          {v.vendorName}
                        </td>
                        <td className="px-4 py-2 text-gray-600">
                          #{v.stallNumber}
                        </td>
                        <td className="px-4 py-2 text-gray-500">
                          {formatTime(v.checkInTime)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Not Yet Arrived */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              Not Yet Arrived ({data!.notCheckedIn.length})
            </h2>
          </CardHeader>
          <CardContent className="p-0">
            {data!.notCheckedIn.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">
                All confirmed vendors have checked in
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                    <tr>
                      <th className="px-4 py-2 text-left">Vendor</th>
                      <th className="px-4 py-2 text-left">Stall</th>
                      <th className="px-4 py-2 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data!.notCheckedIn.map((v) => (
                      <tr key={v.bookingId} className="hover:bg-gray-50">
                        <td className="px-4 py-2 font-medium text-gray-800">
                          {v.vendorName}
                        </td>
                        <td className="px-4 py-2 text-gray-600">
                          #{v.stallNumber}
                        </td>
                        <td className="px-4 py-2">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                              v.bookingStatus === "CONFIRMED"
                                ? "bg-green-100 text-green-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {v.bookingStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Feed */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-800">Recent Activity</h2>
        </CardHeader>
        <CardContent className="py-3">
          {data!.recentActivity.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">
              No activity yet
            </p>
          ) : (
            <ul className="space-y-3">
              {data!.recentActivity.map((item) => (
                <li key={`${item.type}-${item.id}`} className="flex gap-3">
                  <div
                    className={`mt-0.5 flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                      item.type === "gate_pass"
                        ? "bg-green-500"
                        : "bg-blue-400"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 font-medium truncate">
                      {item.label}
                    </p>
                    <p className="text-xs text-gray-500">{item.meta}</p>
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0 pt-0.5">
                    {timeAgo(item.timestamp)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
