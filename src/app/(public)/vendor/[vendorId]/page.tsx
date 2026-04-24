"use client";

import { useState, useEffect, use } from "react";
import { Star, MapPin, Award, Share2, Calendar } from "lucide-react";

interface VendorProfile {
  id: string;
  name: string;
  bio: string | null;
  profileImage: string | null;
  category: string | null;
  phone: string | null;
}

interface ReviewItem {
  id: string;
  reviewerName: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

interface PastEvent {
  title: string;
  startDate: string;
}

interface VendorData {
  profile: VendorProfile;
  vendorScore: number;
  tier: "Bronze" | "Silver" | "Gold" | "Platinum";
  avgRating: number;
  totalReviews: number;
  totalBookings: number;
  reviews: ReviewItem[];
  pastEvents: PastEvent[];
}

const TIER_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  Bronze:   { bg: "bg-amber-100",   text: "text-amber-800",   border: "border-amber-300" },
  Silver:   { bg: "bg-slate-100",   text: "text-slate-700",   border: "border-slate-300" },
  Gold:     { bg: "bg-yellow-100",  text: "text-yellow-800",  border: "border-yellow-400" },
  Platinum: { bg: "bg-purple-100",  text: "text-purple-800",  border: "border-purple-400" },
};

function scoreBarColor(score: number): string {
  if (score >= 85) return "bg-purple-500";
  if (score >= 65) return "bg-green-500";
  if (score >= 40) return "bg-yellow-400";
  return "bg-red-400";
}

function StarRow({ rating, size = 4 }: { rating: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`h-${size} w-${size} ${
            n <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200 fill-gray-200"
          }`}
        />
      ))}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 animate-pulse space-y-4">
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-full bg-gray-200" />
        <div className="flex-1 space-y-2">
          <div className="h-5 bg-gray-200 rounded w-48" />
          <div className="h-4 bg-gray-200 rounded w-32" />
          <div className="h-4 bg-gray-200 rounded w-24" />
        </div>
      </div>
      <div className="h-8 bg-gray-200 rounded w-full" />
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-gray-200 rounded-xl" />
        ))}
      </div>
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-gray-200 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export default function VendorProfilePage({
  params,
}: {
  params: Promise<{ vendorId: string }>;
}) {
  const { vendorId } = use(params);
  const [data, setData] = useState<VendorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`/api/vendor-profile/${vendorId}`)
      .then(async (res) => {
        if (res.status === 404) { setNotFound(true); return; }
        const json = await res.json();
        setData(json);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [vendorId]);

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (loading) return <Skeleton />;

  if (notFound || !data) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <Award className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <h2 className="text-lg font-semibold text-gray-800">Vendor not found</h2>
        <p className="text-sm text-gray-500 mt-1">This profile may not exist or has been removed.</p>
      </div>
    );
  }

  const { profile, vendorScore, tier, avgRating, totalReviews, totalBookings, reviews, pastEvents } = data;
  const tierStyle = TIER_STYLES[tier] ?? TIER_STYLES.Bronze;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* ── Header ── */}
      <div className="flex items-start gap-4">
        {/* Avatar */}
        {profile.profileImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.profileImage}
            alt={profile.name}
            className="w-20 h-20 rounded-full object-cover border-2 border-indigo-200 flex-shrink-0"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-indigo-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
            {getInitials(profile.name)}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h1 className="text-xl font-bold text-gray-900 leading-tight">{profile.name}</h1>
            <button
              onClick={handleShare}
              className="flex items-center gap-1 px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex-shrink-0"
            >
              <Share2 className="h-3.5 w-3.5" />
              {copied ? "Copied!" : "Share"}
            </button>
          </div>

          {/* Tier badge */}
          <span
            className={`inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${tierStyle.bg} ${tierStyle.text} ${tierStyle.border}`}
          >
            <Award className="h-3 w-3" /> {tier}
          </span>

          <div className="flex flex-wrap items-center gap-3 mt-2">
            {profile.category && (
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <MapPin className="h-3.5 w-3.5" /> {profile.category}
              </span>
            )}
          </div>

          {profile.bio && (
            <p className="mt-2 text-sm text-gray-600 leading-relaxed line-clamp-3">{profile.bio}</p>
          )}
        </div>
      </div>

      {/* ── Trust Score bar ── */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-700">Trust Score</span>
          <span className="text-lg font-bold text-gray-900">{vendorScore}<span className="text-xs text-gray-400 font-normal">/100</span></span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
          <div
            className={`h-3 rounded-full transition-all ${scoreBarColor(vendorScore)}`}
            style={{ width: `${vendorScore}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-gray-400">
          <span>0</span>
          <span className="text-red-400">40</span>
          <span className="text-yellow-500">65</span>
          <span className="text-green-500">85</span>
          <span>100</span>
        </div>
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-indigo-50 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-indigo-700">{totalBookings}</div>
          <div className="text-[11px] text-indigo-500 mt-0.5">Total Events</div>
        </div>
        <div className="bg-yellow-50 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-yellow-600">{avgRating > 0 ? avgRating.toFixed(1) : "—"}</div>
          <div className="flex justify-center mt-1">
            <StarRow rating={Math.round(avgRating)} size={3} />
          </div>
          <div className="text-[11px] text-yellow-500 mt-0.5">Avg Rating</div>
        </div>
        <div className="bg-green-50 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-green-700">{totalReviews}</div>
          <div className="text-[11px] text-green-500 mt-0.5">Reviews</div>
        </div>
      </div>

      {/* ── Reviews ── */}
      <div>
        <h2 className="text-base font-semibold text-gray-800 mb-3">Recent Reviews</h2>
        {reviews.length === 0 ? (
          <p className="text-sm text-gray-400 italic">No reviews yet.</p>
        ) : (
          <div className="space-y-3">
            {reviews.map((review) => (
              <div key={review.id} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-gray-900">{review.reviewerName}</span>
                  <StarRow rating={review.rating} size={4} />
                </div>
                {review.comment && (
                  <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>
                )}
                <p className="text-[11px] text-gray-400 mt-1.5">
                  {new Date(review.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Past Events ── */}
      {pastEvents.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-gray-800 mb-3">Past Events</h2>
          <div className="space-y-2">
            {pastEvents.map((event, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3"
              >
                <Calendar className="h-4 w-4 text-indigo-400 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-800">{event.title}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(event.startDate).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Footer spacer ── */}
      <div className="h-6" />
    </div>
  );
}
