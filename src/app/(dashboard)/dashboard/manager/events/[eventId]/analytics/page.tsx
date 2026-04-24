"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  TrendingUp,
  Users,
  Star,
  Zap,
  Award,
  BarChart2,
  ArrowLeft,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface CategoryRevenue {
  category: string;
  amount: number;
}

interface TopVendor {
  name: string;
  amount: number;
  stallNumber: string;
}

interface AnalyticsData {
  stallOccupancy: {
    total: number;
    booked: number;
    available: number;
    occupancyPct: number;
  };
  revenue: {
    total: number;
    avgPerStall: number;
    byCategory: CategoryRevenue[];
  };
  vendorBreakdown: TopVendor[];
  ratings: {
    avgRating: number;
    totalReviews: number;
  };
  footfall: number;
  utilityRevenue: number;
  sponsorRevenue: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

// ── Stat Card ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  color: string;
}

function StatCard({ label, value, sub, icon, color }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-start gap-4 shadow-sm">
      <div className={`p-3 rounded-lg ${color}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
          {label}
        </p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5 truncate">
          {value}
        </p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AnalyticsDashboardPage() {
  const params = useParams();
  const eventId = params.eventId as string;

  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/events/${eventId}/analytics`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load analytics");
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Loading ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading analytics...</p>
        </div>
      </div>
    );
  }

  // ── Error ───────────────────────────────────────────────────────────────────

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 font-medium">{error || "No data found"}</p>
          <button
            onClick={fetchData}
            className="mt-3 text-sm text-indigo-600 hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  const { stallOccupancy, revenue, vendorBreakdown, ratings, footfall, utilityRevenue, sponsorRevenue } = data;

  // Max category amount for bar scaling
  const maxCatAmount =
    revenue.byCategory.length > 0
      ? Math.max(...revenue.byCategory.map((c) => c.amount))
      : 1;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link
            href="/dashboard/manager"
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
            title="Back to manager dashboard"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Event Analytics</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Post-event performance overview
            </p>
          </div>
        </div>

        {/* ── Stats Row ─────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <StatCard
            label="Total Revenue"
            value={fmt(revenue.total)}
            sub={`Avg ${fmt(revenue.avgPerStall)} / stall`}
            icon={<TrendingUp size={20} className="text-emerald-600" />}
            color="bg-emerald-50"
          />
          <StatCard
            label="Stall Occupancy"
            value={`${stallOccupancy.occupancyPct}%`}
            sub={`${stallOccupancy.booked} / ${stallOccupancy.total} stalls`}
            icon={<BarChart2 size={20} className="text-indigo-600" />}
            color="bg-indigo-50"
          />
          <StatCard
            label="Footfall"
            value={footfall.toLocaleString("en-IN")}
            sub="Visitor check-ins"
            icon={<Users size={20} className="text-blue-600" />}
            color="bg-blue-50"
          />
          <StatCard
            label="Avg Rating"
            value={
              ratings.totalReviews > 0
                ? `${ratings.avgRating} / 5`
                : "No reviews"
            }
            sub={
              ratings.totalReviews > 0
                ? `${ratings.totalReviews} vendor review${ratings.totalReviews !== 1 ? "s" : ""}`
                : undefined
            }
            icon={<Star size={20} className="text-amber-500" />}
            color="bg-amber-50"
          />
          <StatCard
            label="Utility Revenue"
            value={fmt(utilityRevenue)}
            sub="Electricity / water billing"
            icon={<Zap size={20} className="text-yellow-600" />}
            color="bg-yellow-50"
          />
          <StatCard
            label="Sponsor Revenue"
            value={fmt(sponsorRevenue)}
            sub="Payments received"
            icon={<Award size={20} className="text-purple-600" />}
            color="bg-purple-50"
          />
        </div>

        {/* ── Two-column section: Occupancy + Revenue by Category ──────────── */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">

          {/* Occupancy Visual */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-5">
              Stall Occupancy
            </h2>

            {/* Big number */}
            <div className="text-center mb-6">
              <span className="text-5xl font-extrabold text-indigo-600">
                {stallOccupancy.booked}
              </span>
              <span className="text-2xl text-gray-400 font-medium">
                /{stallOccupancy.total}
              </span>
              <p className="text-sm text-gray-500 mt-1">stalls booked</p>
            </div>

            {/* Colored bar */}
            <div className="w-full h-5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${stallOccupancy.occupancyPct}%`,
                  background:
                    stallOccupancy.occupancyPct >= 80
                      ? "#10b981"
                      : stallOccupancy.occupancyPct >= 50
                      ? "#6366f1"
                      : "#f59e0b",
                }}
              />
            </div>

            {/* Legend */}
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span className="flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full bg-indigo-500" />
                Booked ({stallOccupancy.booked})
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full bg-gray-200" />
                Available ({stallOccupancy.available})
              </span>
            </div>
          </div>

          {/* Revenue by Category */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-5">
              Revenue by Category
            </h2>

            {revenue.byCategory.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">
                No category data available
              </p>
            ) : (
              <div className="space-y-4">
                {revenue.byCategory
                  .sort((a, b) => b.amount - a.amount)
                  .map((cat) => {
                    const pct = Math.round((cat.amount / maxCatAmount) * 100);
                    return (
                      <div key={cat.category}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-medium text-gray-700 truncate max-w-[60%]">
                            {cat.category}
                          </span>
                          <span className="text-gray-500 shrink-0">
                            {fmt(cat.amount)}
                          </span>
                        </div>
                        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>

        {/* ── Top Vendors Table ─────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-5">
            Top Vendors by Revenue
          </h2>

          {vendorBreakdown.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">
              No confirmed bookings yet
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase pb-2 pr-4 w-8">
                      #
                    </th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase pb-2 pr-4">
                      Vendor
                    </th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase pb-2 pr-4">
                      Stall
                    </th>
                    <th className="text-right text-xs font-semibold text-gray-500 uppercase pb-2">
                      Amount Paid
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {vendorBreakdown.map((vendor, i) => (
                    <tr
                      key={`${vendor.name}-${i}`}
                      className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-3 pr-4 text-gray-400 font-mono text-xs">
                        {i + 1}
                      </td>
                      <td className="py-3 pr-4 font-medium text-gray-800">
                        {vendor.name}
                      </td>
                      <td className="py-3 pr-4 text-gray-500">
                        <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded font-mono">
                          {vendor.stallNumber}
                        </span>
                      </td>
                      <td className="py-3 text-right font-semibold text-emerald-600">
                        {fmt(vendor.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
