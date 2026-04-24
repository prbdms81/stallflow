"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  MapPin,
  Calendar,
  Tag,
  Users,
  TrendingUp,
  Search,
} from "lucide-react";

interface DiscoverEvent {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  venueName: string;
  venueCity: string;
  availableStalls: number;
  minPrice: number | null;
  categories: string[];
  alreadyApplied: boolean;
}

function formatDateRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" };
  if (s.toDateString() === e.toDateString()) {
    return s.toLocaleDateString("en-IN", opts);
  }
  return `${s.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} – ${e.toLocaleDateString("en-IN", opts)}`;
}

function StallBadge({ count }: { count: number }) {
  if (count === 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
        <Users className="h-3 w-3" />
        No stalls left
      </span>
    );
  }
  if (count <= 5) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
        <Users className="h-3 w-3" />
        {count} stall{count > 1 ? "s" : ""} left
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
      <Users className="h-3 w-3" />
      {count} stalls available
    </span>
  );
}

function CardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse">
      <div className="h-5 bg-gray-200 rounded w-3/4 mb-3" />
      <div className="h-4 bg-gray-100 rounded w-1/2 mb-4" />
      <div className="h-4 bg-gray-100 rounded w-2/3 mb-2" />
      <div className="h-4 bg-gray-100 rounded w-1/3 mb-4" />
      <div className="flex gap-2 mb-4">
        <div className="h-6 bg-gray-100 rounded-full w-16" />
        <div className="h-6 bg-gray-100 rounded-full w-20" />
      </div>
      <div className="h-9 bg-gray-200 rounded-lg w-full" />
    </div>
  );
}

export default function DiscoverEventsPage() {
  const [events, setEvents] = useState<DiscoverEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [cityInput, setCityInput] = useState("");
  const [categoryInput, setCategoryInput] = useState("");
  const [activeCity, setActiveCity] = useState("");
  const [activeCategory, setActiveCategory] = useState("");

  const fetchEvents = useCallback(
    async (city: string, category: string) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (city) params.set("city", city);
        if (category) params.set("category", category);
        const res = await fetch(`/api/vendor/discover?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setEvents(data.events ?? []);
      } catch {
        toast.error("Could not load events. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchEvents("", "");
  }, [fetchEvents]);

  const handleSearch = () => {
    setActiveCity(cityInput.trim());
    setActiveCategory(categoryInput.trim());
    fetchEvents(cityInput.trim(), categoryInput.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-indigo-600" />
            Discover Events
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Find events to grow your business
          </p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Filter by city..."
            value={cityInput}
            onChange={(e) => setCityInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>
        <div className="relative flex-1">
          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Filter by category..."
            value={categoryInput}
            onChange={(e) => setCategoryInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>
        <button
          onClick={handleSearch}
          className="flex items-center justify-center gap-2 px-5 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Search className="h-4 w-4" />
          Search
        </button>
      </div>

      {/* Active filter chips */}
      {(activeCity || activeCategory) && (
        <div className="flex flex-wrap gap-2 text-xs">
          {activeCity && (
            <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full">
              <MapPin className="h-3 w-3" />
              {activeCity}
            </span>
          )}
          {activeCategory && (
            <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full">
              <Tag className="h-3 w-3" />
              {activeCategory}
            </span>
          )}
          <button
            onClick={() => {
              setCityInput("");
              setCategoryInput("");
              setActiveCity("");
              setActiveCategory("");
              fetchEvents("", "");
            }}
            className="text-gray-400 hover:text-gray-600 underline"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-5xl mb-4">🔍</div>
          <h2 className="text-lg font-semibold text-gray-700">
            No events found
          </h2>
          <p className="text-gray-400 text-sm mt-1 max-w-xs">
            {activeCity || activeCategory
              ? "Try adjusting your filters to see more events."
              : "There are no upcoming published events right now. Check back soon!"}
          </p>
          {(activeCity || activeCategory) && (
            <button
              onClick={() => {
                setCityInput("");
                setCategoryInput("");
                setActiveCity("");
                setActiveCategory("");
                fetchEvents("", "");
              }}
              className="mt-4 text-sm text-indigo-600 underline"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((ev) => (
            <div
              key={ev.id}
              className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col gap-3"
            >
              {/* Title + applied badge */}
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-base font-semibold text-gray-900 leading-snug line-clamp-2">
                  {ev.title}
                </h3>
                {ev.alreadyApplied && (
                  <span className="shrink-0 text-xs font-medium bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                    Applied
                  </span>
                )}
              </div>

              {/* Venue */}
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                <span className="truncate">
                  {ev.venueName}, {ev.venueCity}
                </span>
              </div>

              {/* Date */}
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <Calendar className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                <span>{formatDateRange(ev.startDate, ev.endDate)}</span>
              </div>

              {/* Stall availability + min price */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <StallBadge count={ev.availableStalls} />
                {ev.minPrice !== null && (
                  <span className="text-sm font-medium text-gray-700">
                    From ₹{ev.minPrice.toLocaleString("en-IN")}
                  </span>
                )}
              </div>

              {/* Category chips */}
              {ev.categories.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {ev.categories.slice(0, 4).map((cat) => (
                    <span
                      key={cat}
                      className="inline-flex items-center gap-0.5 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
                    >
                      <Tag className="h-2.5 w-2.5" />
                      {cat}
                    </span>
                  ))}
                  {ev.categories.length > 4 && (
                    <span className="text-xs text-gray-400">
                      +{ev.categories.length - 4} more
                    </span>
                  )}
                </div>
              )}

              {/* CTA */}
              {ev.alreadyApplied ? (
                <Link
                  href={`/events/${ev.id}`}
                  className="mt-auto block text-center text-sm font-medium border border-indigo-200 text-indigo-600 rounded-lg px-4 py-2 hover:bg-indigo-50 transition-colors"
                >
                  View Event
                </Link>
              ) : (
                <Link
                  href={`/events/${ev.id}`}
                  className="mt-auto block text-center text-sm font-medium bg-indigo-600 text-white rounded-lg px-4 py-2 hover:bg-indigo-700 transition-colors"
                >
                  Apply Now
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
