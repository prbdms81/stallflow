"use client";

import { useState, useEffect, useCallback } from "react";
import { Award, Gift, Copy, Share2, Star, TrendingUp } from "lucide-react";
import toast from "react-hot-toast";

interface RecentBooking {
  id: string;
  eventName: string;
  amount: number;
  date: string;
  pointsEarned: number;
}

interface LoyaltyData {
  points: number;
  tier: string;
  confirmedBookingsCount: number;
  nextTierAt: number | null;
  referralCode: string;
  recentBookings: RecentBooking[];
}

const TIER_COLORS: Record<string, { bg: string; text: string; border: string; bar: string }> = {
  Bronze: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-300",
    bar: "bg-amber-500",
  },
  Silver: {
    bg: "bg-slate-50",
    text: "text-slate-700",
    border: "border-slate-300",
    bar: "bg-slate-500",
  },
  Gold: {
    bg: "bg-yellow-50",
    text: "text-yellow-700",
    border: "border-yellow-400",
    bar: "bg-yellow-500",
  },
  Platinum: {
    bg: "bg-indigo-50",
    text: "text-indigo-700",
    border: "border-indigo-400",
    bar: "bg-indigo-600",
  },
};

const TIER_BENEFITS = [
  {
    name: "Bronze",
    range: "0 – 499 pts",
    perks: ["Basic listing visibility", "Standard email support"],
    color: TIER_COLORS.Bronze,
  },
  {
    name: "Silver",
    range: "500 – 1,999 pts",
    perks: ["Priority in search results", "Dedicated email support"],
    color: TIER_COLORS.Silver,
  },
  {
    name: "Gold",
    range: "2,000 – 4,999 pts",
    perks: ["Featured vendor badge", "Dedicated phone support"],
    color: TIER_COLORS.Gold,
  },
  {
    name: "Platinum",
    range: "5,000+ pts",
    perks: ["Top placement in search", "Free subscription month"],
    color: TIER_COLORS.Platinum,
  },
];

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function LoyaltyPage() {
  const [data, setData] = useState<LoyaltyData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchLoyalty = useCallback(async () => {
    try {
      const res = await fetch("/api/vendor/loyalty");
      if (!res.ok) throw new Error("Failed to fetch loyalty data");
      const json = await res.json();
      setData(json);
    } catch {
      toast.error("Could not load loyalty data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLoyalty();
  }, [fetchLoyalty]);

  const referralLink =
    data
      ? `${window.location.origin}?ref=${data.referralCode}`
      : "";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      toast.success("Referral link copied!");
    } catch {
      toast.error("Could not copy link");
    }
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(
      `Join StallMate — the platform for stall vendors at events! Use my referral link: ${referralLink}`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!data) return null;

  const tierColors = TIER_COLORS[data.tier] ?? TIER_COLORS.Bronze;
  const progressPct =
    data.nextTierAt !== null
      ? Math.min(100, Math.round((data.points / data.nextTierAt) * 100))
      : 100;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Award className="h-7 w-7 text-indigo-600" />
        <h1 className="text-2xl font-bold text-gray-900">Loyalty Program</h1>
      </div>

      {/* Points & Tier Card */}
      <div className={`rounded-2xl border-2 ${tierColors.border} ${tierColors.bg} p-6 space-y-4`}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Your Points</p>
            <p className="text-5xl font-extrabold text-gray-900 mt-1">
              {data.points.toLocaleString()}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {data.confirmedBookingsCount} confirmed booking
              {data.confirmedBookingsCount !== 1 ? "s" : ""} × 100 pts
            </p>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold border ${tierColors.border} ${tierColors.text} ${tierColors.bg}`}
          >
            <Star className="h-4 w-4" />
            {data.tier}
          </span>
        </div>

        {/* Progress bar */}
        {data.nextTierAt !== null ? (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-500">
              <span>{data.points} pts</span>
              <span>Next tier at {data.nextTierAt.toLocaleString()} pts</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-2.5 rounded-full transition-all ${tierColors.bar}`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <p className="text-xs text-gray-500">
              {(data.nextTierAt - data.points).toLocaleString()} pts to reach the next tier
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-indigo-600">
            <TrendingUp className="h-4 w-4" />
            <span className="text-sm font-medium">You&apos;ve reached the highest tier!</span>
          </div>
        )}
      </div>

      {/* Tier Benefits */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Award className="h-5 w-5 text-indigo-600" />
          Tier Benefits
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {TIER_BENEFITS.map((t) => {
            const isActive = t.name === data.tier;
            return (
              <div
                key={t.name}
                className={`rounded-xl border-2 p-4 transition-all ${
                  isActive
                    ? `${t.color.border} ${t.color.bg}`
                    : "border-gray-100 bg-gray-50"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-sm font-bold ${
                      isActive ? t.color.text : "text-gray-600"
                    }`}
                  >
                    {t.name}
                  </span>
                  <span className="text-xs text-gray-400">{t.range}</span>
                  {isActive && (
                    <span className="text-xs font-semibold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full ml-1">
                      Current
                    </span>
                  )}
                </div>
                <ul className="space-y-1">
                  {t.perks.map((perk) => (
                    <li key={perk} className="text-xs text-gray-600 flex items-start gap-1.5">
                      <span className={`mt-0.5 ${isActive ? t.color.text : "text-gray-400"}`}>
                        ✓
                      </span>
                      {perk}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>

      {/* Referral Section */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Gift className="h-5 w-5 text-indigo-600" />
          Refer &amp; Earn
        </h2>
        <p className="text-sm text-gray-500">
          Share your referral link with other vendors. When they join StallMate, you both grow
          together on the platform.
        </p>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Your Referral Link
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 font-mono truncate">
              {referralLink}
            </div>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors whitespace-nowrap"
            >
              <Copy className="h-4 w-4" />
              Copy
            </button>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleWhatsApp}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
          >
            <Share2 className="h-4 w-4" />
            Share on WhatsApp
          </button>
        </div>

        <p className="text-xs text-gray-400">
          Your referral code: <span className="font-mono font-semibold">{data.referralCode}</span>
        </p>
      </div>

      {/* Points History */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-indigo-600" />
          Recent Points Earned
        </h2>

        {data.recentBookings.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">
            No confirmed bookings yet. Complete your first booking to start earning points!
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {data.recentBookings.map((b) => (
              <li key={b.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-gray-800">{b.eventName}</p>
                  <p className="text-xs text-gray-400">{formatDate(b.date)}</p>
                </div>
                <span className="text-sm font-bold text-green-600">
                  +{b.pointsEarned} pts
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
