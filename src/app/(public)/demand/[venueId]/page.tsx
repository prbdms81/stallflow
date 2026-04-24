"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { ThumbsUp, Share2, CheckCircle2, ChevronDown, X } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

interface CategoryDef {
  name: string;
  emoji: string;
}

const CATEGORIES: CategoryDef[] = [
  { name: "Food & Beverages", emoji: "🍕" },
  { name: "Clothing & Fashion", emoji: "👗" },
  { name: "Jewellery & Accessories", emoji: "💍" },
  { name: "Plants & Nursery", emoji: "🌿" },
  { name: "Books & Stationery", emoji: "📚" },
  { name: "Beauty & Wellness", emoji: "🧴" },
  { name: "Home Decor", emoji: "🏠" },
  { name: "Toys & Games", emoji: "🎮" },
  { name: "Organic & Health Foods", emoji: "🥗" },
  { name: "Art & Crafts", emoji: "🎨" },
  { name: "Electronics & Gadgets", emoji: "💻" },
  { name: "Pet Supplies", emoji: "🐾" },
];

interface VoteCounts {
  [category: string]: number;
}

interface VoteForm {
  residentName: string;
  residentEmail: string;
  residentPhone: string;
  subcategory: string;
}

export default function DemandVotingPage() {
  const params = useParams<{ venueId: string }>();
  const venueId = params.venueId;

  const [venueName, setVenueName] = useState<string>("");
  const [loadingVenue, setLoadingVenue] = useState(true);
  const [voteCounts, setVoteCounts] = useState<VoteCounts>({});
  const [votedCategories, setVotedCategories] = useState<Set<string>>(new Set());
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState<VoteForm>({
    residentName: "",
    residentEmail: "",
    residentPhone: "",
    subcategory: "",
  });

  const fetchVenueName = useCallback(async () => {
    try {
      const res = await fetch(`/api/venues?id=${venueId}`);
      const data = await res.json();
      if (data.venue?.name) setVenueName(data.venue.name);
    } catch {
      // ignore
    } finally {
      setLoadingVenue(false);
    }
  }, [venueId]);

  const fetchVoteCounts = useCallback(async () => {
    try {
      const res = await fetch(`/api/demand-votes?venueId=${venueId}`);
      const data = await res.json();
      if (data.grouped) {
        const counts: VoteCounts = {};
        for (const g of data.grouped) {
          counts[g.category] = g.count;
        }
        setVoteCounts(counts);
      }
    } catch {
      // ignore
    }
  }, [venueId]);

  useEffect(() => {
    fetchVenueName();
    fetchVoteCounts();
  }, [fetchVenueName, fetchVoteCounts]);

  function handleCategoryClick(categoryName: string) {
    if (votedCategories.has(categoryName)) return;
    if (activeCategory === categoryName) {
      setActiveCategory(null);
    } else {
      setActiveCategory(categoryName);
      setForm({ residentName: "", residentEmail: "", residentPhone: "", subcategory: "" });
    }
  }

  async function handleVoteSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!activeCategory) return;

    if (!form.residentEmail && !form.residentPhone) {
      toast.error("Please enter your phone or email");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/demand-votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          venueId,
          category: activeCategory,
          subcategory: form.subcategory || undefined,
          residentName: form.residentName || undefined,
          residentEmail: form.residentEmail || undefined,
          residentPhone: form.residentPhone || undefined,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to submit vote");
        return;
      }

      // Optimistically update counts
      setVoteCounts((prev) => ({
        ...prev,
        [activeCategory]: (prev[activeCategory] || 0) + 1,
      }));
      setVotedCategories((prev) => {
        const next = new Set(Array.from(prev));
        next.add(activeCategory);
        return next;
      });
      setActiveCategory(null);
      toast.success("Vote submitted! Thank you.");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleShare() {
    const url = window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => toast.success("Link copied to clipboard!"));
    } else {
      toast.error("Copy this link: " + url);
    }
  }

  const totalVotes = Object.values(voteCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <Toaster position="top-center" />

      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              {loadingVenue ? (
                <div className="h-7 w-64 bg-gray-200 animate-pulse rounded mb-2" />
              ) : (
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
                  What vendors do you want at{" "}
                  <span className="text-indigo-600">{venueName || "this venue"}</span>?
                </h1>
              )}
              <p className="text-gray-500 mt-1 text-sm sm:text-base">
                Vote for the vendors you&apos;d love to see at your next community event
              </p>
              {totalVotes > 0 && (
                <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full font-medium">
                  <ThumbsUp className="h-3.5 w-3.5" />
                  {totalVotes} total votes cast
                </div>
              )}
            </div>
            <button
              onClick={handleShare}
              className="flex-shrink-0 flex items-center gap-2 text-sm text-indigo-600 border border-indigo-200 rounded-lg px-3 py-2 hover:bg-indigo-50 transition-colors"
            >
              <Share2 className="h-4 w-4" />
              <span className="hidden sm:inline">Share</span>
            </button>
          </div>
        </div>
      </div>

      {/* Category grid */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {CATEGORIES.map((cat) => {
            const count = voteCounts[cat.name] || 0;
            const voted = votedCategories.has(cat.name);
            const isActive = activeCategory === cat.name;

            return (
              <div key={cat.name} className="flex flex-col">
                {/* Category card */}
                <button
                  onClick={() => handleCategoryClick(cat.name)}
                  disabled={voted}
                  className={`
                    relative flex flex-col items-center justify-center gap-2 p-4 sm:p-5 rounded-2xl border-2 transition-all text-center
                    ${voted
                      ? "bg-green-50 border-green-300 cursor-default"
                      : isActive
                      ? "bg-indigo-50 border-indigo-400 shadow-md scale-[1.02]"
                      : "bg-white border-gray-200 hover:border-indigo-300 hover:shadow-md hover:scale-[1.01] cursor-pointer"
                    }
                  `}
                >
                  <span className="text-3xl sm:text-4xl">{cat.emoji}</span>
                  <span className={`text-xs sm:text-sm font-semibold leading-tight ${voted ? "text-green-700" : "text-gray-800"}`}>
                    {cat.name}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {voted ? (
                      <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Voted!
                      </span>
                    ) : (
                      <span className="text-xs text-gray-500">
                        {count > 0 ? `${count} vote${count !== 1 ? "s" : ""}` : "Be first to vote"}
                      </span>
                    )}
                    {!voted && (
                      <ChevronDown
                        className={`h-3.5 w-3.5 text-indigo-400 transition-transform ${isActive ? "rotate-180" : ""}`}
                      />
                    )}
                  </div>
                  {/* Active indicator dot */}
                  {isActive && (
                    <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-indigo-500" />
                  )}
                </button>

                {/* Slide-in vote form */}
                {isActive && (
                  <div className="mt-2 bg-white border border-indigo-200 rounded-2xl p-4 shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-gray-800">
                        Vote for {cat.name}
                      </h3>
                      <button
                        onClick={() => setActiveCategory(null)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <form onSubmit={handleVoteSubmit} className="space-y-2.5">
                      <input
                        type="text"
                        placeholder="Your name (optional)"
                        value={form.residentName}
                        onChange={(e) => setForm((f) => ({ ...f, residentName: e.target.value }))}
                        className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      />
                      <input
                        type="tel"
                        placeholder="Phone (required for dedup)"
                        value={form.residentPhone}
                        onChange={(e) => setForm((f) => ({ ...f, residentPhone: e.target.value }))}
                        className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      />
                      <input
                        type="email"
                        placeholder="Email (optional)"
                        value={form.residentEmail}
                        onChange={(e) => setForm((f) => ({ ...f, residentEmail: e.target.value }))}
                        className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      />
                      <input
                        type="text"
                        placeholder='Subcategory (e.g. South Indian Tiffins)'
                        value={form.subcategory}
                        onChange={(e) => setForm((f) => ({ ...f, subcategory: e.target.value }))}
                        className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      />
                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full bg-indigo-600 text-white text-xs font-semibold py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5"
                      >
                        {submitting ? (
                          <>
                            <span className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Submitting…
                          </>
                        ) : (
                          <>
                            <ThumbsUp className="h-3.5 w-3.5" />
                            Submit Vote
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-gray-400 mt-8">
          Your feedback helps venue managers bring the right vendors to your community events.
        </p>
      </div>
    </div>
  );
}
