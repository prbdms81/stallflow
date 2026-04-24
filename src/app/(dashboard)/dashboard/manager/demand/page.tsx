"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  BarChart2,
  Share2,
  Users,
  Lightbulb,
  TrendingUp,
  Calendar,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import toast, { Toaster } from "react-hot-toast";

interface VenueOption {
  id: string;
  name: string;
  city: string;
}

interface GroupedVote {
  category: string;
  count: number;
  subcategories: string[];
}

interface RecentVote {
  id: string;
  category: string;
  subcategory: string | null;
  createdAt: string;
}

interface DemandData {
  grouped: GroupedVote[];
  top3: string[];
  totalVotes: number;
  recentVotes: RecentVote[];
}

const CATEGORY_COLORS: Record<string, string> = {
  "Food & Beverages": "bg-orange-500",
  "Clothing & Fashion": "bg-pink-500",
  "Jewellery & Accessories": "bg-yellow-500",
  "Plants & Nursery": "bg-green-500",
  "Books & Stationery": "bg-blue-500",
  "Beauty & Wellness": "bg-purple-500",
  "Home Decor": "bg-teal-500",
  "Toys & Games": "bg-red-500",
  "Organic & Health Foods": "bg-lime-500",
  "Art & Crafts": "bg-indigo-500",
  "Electronics & Gadgets": "bg-cyan-500",
  "Pet Supplies": "bg-amber-500",
};

function getBarColor(category: string) {
  return CATEGORY_COLORS[category] || "bg-indigo-500";
}

export default function ManagerDemandPage() {
  const { data: session } = useSession();
  const [venues, setVenues] = useState<VenueOption[]>([]);
  const [selectedVenueId, setSelectedVenueId] = useState<string>("");
  const [demandData, setDemandData] = useState<DemandData | null>(null);
  const [loadingVenues, setLoadingVenues] = useState(true);
  const [loadingDemand, setLoadingDemand] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const qrRef = useRef<HTMLCanvasElement>(null);

  // Fetch venues managed by this user
  const fetchVenues = useCallback(async () => {
    if (!session?.user?.id) return;
    try {
      const res = await fetch("/api/venues");
      const data = await res.json();
      if (data.venues) {
        setVenues(
          data.venues.map((v: { id: string; name: string; city: string }) => ({
            id: v.id,
            name: v.name,
            city: v.city,
          }))
        );
      }
    } catch {
      // ignore
    } finally {
      setLoadingVenues(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    fetchVenues();
  }, [fetchVenues]);

  // Fetch demand data when venue changes
  const fetchDemand = useCallback(async (venueId: string) => {
    setLoadingDemand(true);
    setDemandData(null);
    setQrDataUrl("");
    try {
      const res = await fetch(`/api/demand-votes?venueId=${venueId}`);
      const data = await res.json();
      if (res.ok) {
        // Fetch recent raw votes
        const recentRes = await fetch(`/api/demand-votes/recent?venueId=${venueId}`);
        const recentData = recentRes.ok ? await recentRes.json() : { recentVotes: [] };

        setDemandData({
          grouped: data.grouped || [],
          top3: data.top3 || [],
          totalVotes: data.totalVotes || 0,
          recentVotes: recentData.recentVotes || [],
        });
      }
    } catch {
      toast.error("Failed to load demand data");
    } finally {
      setLoadingDemand(false);
    }
  }, []);

  // Generate QR code when venue is selected
  const generateQr = useCallback(async (venueId: string) => {
    try {
      const QRCode = (await import("qrcode")).default;
      const url = `${window.location.origin}/demand/${venueId}`;
      const dataUrl = await QRCode.toDataURL(url, {
        width: 200,
        margin: 2,
        color: { dark: "#4f46e5", light: "#ffffff" },
      });
      setQrDataUrl(dataUrl);
    } catch {
      // QR generation failed silently
    }
  }, []);

  useEffect(() => {
    if (selectedVenueId) {
      fetchDemand(selectedVenueId);
      generateQr(selectedVenueId);
    }
  }, [selectedVenueId, fetchDemand, generateQr]);

  function handleShareLink() {
    if (!selectedVenueId) return;
    const url = `${window.location.origin}/demand/${selectedVenueId}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => toast.success("Demand page link copied!"));
    } else {
      toast.error("Copy: " + url);
    }
  }

  const selectedVenue = venues.find((v) => v.id === selectedVenueId);
  const maxCount = demandData?.grouped?.[0]?.count || 1;
  const topCategory = demandData?.top3?.[0] || null;

  return (
    <div className="max-w-5xl mx-auto">
      <Toaster position="top-center" />

      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart2 className="h-6 w-6 text-indigo-600" />
            Resident Demand
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            See what vendors your residents want at each venue
          </p>
        </div>
        {selectedVenueId && (
          <div className="flex gap-2">
            <button
              onClick={handleShareLink}
              className="flex items-center gap-1.5 text-sm text-indigo-600 border border-indigo-200 rounded-lg px-3 py-2 hover:bg-indigo-50 transition-colors"
            >
              <Share2 className="h-4 w-4" />
              Share demand page
            </button>
          </div>
        )}
      </div>

      {/* Venue selector */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-6 shadow-sm">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Venue</label>
        {loadingVenues ? (
          <div className="h-10 bg-gray-100 animate-pulse rounded-lg" />
        ) : venues.length === 0 ? (
          <p className="text-sm text-gray-500">
            No venues found. <Link href="/dashboard/manager/venues" className="text-indigo-600 hover:underline">Create a venue</Link> first.
          </p>
        ) : (
          <select
            value={selectedVenueId}
            onChange={(e) => setSelectedVenueId(e.target.value)}
            className="w-full sm:w-80 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="">-- Choose a venue --</option>
            {venues.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} ({v.city})
              </option>
            ))}
          </select>
        )}
      </div>

      {selectedVenueId && (
        <>
          {loadingDemand ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-white rounded-2xl border animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              {/* Top insight card */}
              {topCategory && (
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl p-5 mb-6 shadow-lg">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-white/20 rounded-xl">
                      <Lightbulb className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-medium text-indigo-200 mb-1 flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" /> Top Insight
                      </div>
                      <p className="font-semibold text-base leading-snug">
                        Residents want{" "}
                        <span className="underline decoration-dotted">{topCategory}</span> most
                        {demandData && demandData.grouped.length > 0 && (
                          <span className="text-indigo-200 font-normal text-sm">
                            {" "}— {demandData.grouped[0].count} vote{demandData.grouped[0].count !== 1 ? "s" : ""}
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-indigo-200 mt-1">
                        {demandData?.totalVotes || 0} total votes across all categories
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Stats row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-2xl border p-4 shadow-sm text-center">
                  <div className="text-2xl font-bold text-indigo-600">{demandData?.totalVotes || 0}</div>
                  <div className="text-xs text-gray-500 mt-0.5 flex items-center justify-center gap-1">
                    <Users className="h-3 w-3" /> Total Votes
                  </div>
                </div>
                <div className="bg-white rounded-2xl border p-4 shadow-sm text-center">
                  <div className="text-2xl font-bold text-purple-600">{demandData?.grouped?.length || 0}</div>
                  <div className="text-xs text-gray-500 mt-0.5">Categories Voted</div>
                </div>
                <div className="bg-white rounded-2xl border p-4 shadow-sm text-center">
                  <div className="text-2xl font-bold text-green-600">{demandData?.top3?.length || 0}</div>
                  <div className="text-xs text-gray-500 mt-0.5">Top Categories</div>
                </div>
                <div className="bg-white rounded-2xl border p-4 shadow-sm text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {demandData?.grouped?.[0]?.count || 0}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">Top Category Votes</div>
                </div>
              </div>

              {/* Demand heatmap bar chart */}
              {demandData && demandData.grouped.length > 0 ? (
                <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 shadow-sm">
                  <h2 className="text-base font-semibold text-gray-900 mb-5 flex items-center gap-2">
                    <BarChart2 className="h-5 w-5 text-indigo-500" />
                    Demand Heatmap — {selectedVenue?.name}
                  </h2>
                  <div className="space-y-3">
                    {demandData.grouped.map((g) => {
                      const pct = Math.max(4, Math.round((g.count / maxCount) * 100));
                      return (
                        <div key={g.category}>
                          <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                            <span className="font-medium">{g.category}</span>
                            <span className="font-semibold text-gray-900">
                              {g.count} vote{g.count !== 1 ? "s" : ""}
                            </span>
                          </div>
                          <div className="h-5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-700 ${getBarColor(g.category)}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          {g.subcategories.length > 0 && (
                            <div className="text-xs text-gray-400 mt-0.5">
                              {g.subcategories.join(", ")}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-gray-200 p-10 mb-6 text-center shadow-sm">
                  <BarChart2 className="h-12 w-12 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No votes yet for this venue</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Share the demand page link with your residents to start collecting votes.
                  </p>
                </div>
              )}

              {/* Action buttons row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                {/* Share + QR card */}
                <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Share2 className="h-4 w-4 text-indigo-500" />
                    Share Demand Page
                  </h3>
                  <p className="text-xs text-gray-500 mb-3">
                    Share this link with residents to collect votes
                  </p>
                  <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 text-xs text-gray-600 font-mono mb-3 break-all">
                    {typeof window !== "undefined"
                      ? `${window.location.origin}/demand/${selectedVenueId}`
                      : `/demand/${selectedVenueId}`}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleShareLink}
                      className="flex-1 flex items-center justify-center gap-1.5 text-xs text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg px-3 py-2 transition-colors font-medium"
                    >
                      <Share2 className="h-3.5 w-3.5" />
                      Copy Link
                    </button>
                    <Link
                      href={`/demand/${selectedVenueId}`}
                      target="_blank"
                      className="flex items-center justify-center gap-1.5 text-xs text-indigo-600 border border-indigo-200 hover:bg-indigo-50 rounded-lg px-3 py-2 transition-colors font-medium"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Preview
                    </Link>
                  </div>
                  {/* QR Code */}
                  {qrDataUrl && (
                    <div className="mt-4 flex flex-col items-center">
                      <p className="text-xs text-gray-500 mb-2">Scan QR to open voting page</p>
                      <img
                        src={qrDataUrl}
                        alt="QR Code for demand voting page"
                        className="w-32 h-32 rounded-lg border border-indigo-100"
                      />
                      <a
                        href={qrDataUrl}
                        download={`demand-qr-${selectedVenueId}.png`}
                        className="mt-2 text-xs text-indigo-500 hover:underline"
                      >
                        Download QR
                      </a>
                    </div>
                  )}
                  <canvas ref={qrRef} className="hidden" />
                </div>

                {/* Create event card */}
                <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-green-500" />
                    Create Event Based on Demand
                  </h3>
                  <p className="text-xs text-gray-500 mb-4">
                    Use resident demand insights to plan your next event
                  </p>
                  {topCategory && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-4">
                      <p className="text-xs text-green-800 font-medium">
                        Recommended focus: <span className="font-bold">{topCategory}</span>
                      </p>
                      <p className="text-xs text-green-600 mt-0.5">
                        Based on {demandData?.grouped?.[0]?.count || 0} resident votes
                      </p>
                    </div>
                  )}
                  <Link
                    href={`/dashboard/manager/events/new${topCategory ? `?category=${encodeURIComponent(topCategory)}` : ""}`}
                    className="flex items-center justify-center gap-1.5 w-full text-xs text-white bg-green-600 hover:bg-green-700 rounded-lg px-3 py-2.5 transition-colors font-medium"
                  >
                    <Calendar className="h-3.5 w-3.5" />
                    Create Event
                  </Link>
                </div>
              </div>

              {/* Recent votes table */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-indigo-500" />
                    Recent Votes
                    <span className="text-xs text-gray-400 font-normal">(no personal info shown)</span>
                  </h2>
                </div>
                {demandData && demandData.grouped.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 text-left">
                          <th className="px-5 py-3 text-xs font-semibold text-gray-500">Category</th>
                          <th className="px-5 py-3 text-xs font-semibold text-gray-500">Subcategory</th>
                          <th className="px-5 py-3 text-xs font-semibold text-gray-500">Votes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {demandData.grouped.slice(0, 10).map((g) => (
                          <tr key={g.category} className="hover:bg-gray-50 transition-colors">
                            <td className="px-5 py-3 text-gray-800 font-medium text-xs">
                              {g.category}
                            </td>
                            <td className="px-5 py-3 text-gray-500 text-xs">
                              {g.subcategories.length > 0
                                ? g.subcategories.slice(0, 2).join(", ")
                                : <span className="text-gray-300">—</span>}
                            </td>
                            <td className="px-5 py-3">
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
                                <Users className="h-3 w-3" />
                                {g.count}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="px-5 py-8 text-center text-gray-400 text-sm">
                    No votes yet — share the demand page to start collecting.
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}

      {!selectedVenueId && !loadingVenues && (
        <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center">
          <BarChart2 className="h-12 w-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Select a venue to view demand insights</p>
          <p className="text-sm text-gray-400 mt-1">
            Share the voting page link with your community to collect resident preferences
          </p>
        </div>
      )}
    </div>
  );
}
