"use client";

import { useState, useEffect } from "react";
import {
  Building2, MapPin, Calendar, Users, Search,
  ChevronDown, ChevronUp, Star, Loader2, TrendingUp, Zap, History, Clock,
} from "lucide-react";
import { getVenueTypeLabel } from "@/lib/utils";
import Link from "next/link";
import toast from "react-hot-toast";
import { AvailabilityCalendar } from "@/components/dashboard/AvailabilityCalendar";

interface Venue {
  id: string;
  name: string;
  type: string;
  address: string;
  area: string;
  city: string;
  state: string;
  capacity: number;
  totalStallSlots: number;
  familyCount: number;
  employeeCount: number;
  bestCategories: string;
  contactName: string;
  contactPhone: string;
  vendorRating: number;
  smartScore: number;
  amenities: { name: string; isAvailable: boolean }[];
  _count: { events: number };
}

interface VenueDash {
  totalEvents: number;
  availableDays: number;
  topOrganizers: { organizerId: string; name: string; company: string | null; count: number }[];
  days: { date: string; busy: boolean; eventTitle?: string }[];
  upcomingEvents: { id: string; title: string; startDate: string; endDate: string; status: string }[];
}

interface PastEvent {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  eventType: string;
  maxStalls: number;
  bookedStalls: number;
  categories: string[];
  lastEventInfo: string | null;
  organizer: { name: string; company: string | null };
  reviewCount: number;
  avgRating: number | null;
  feedbackComments: string[];
}

const VENUE_TYPE_OPTS = [
  { value: "", label: "All Types" },
  { value: "GATED_COMMUNITY", label: "Gated Community" },
  { value: "CORPORATE_OFFICE", label: "Corporate Office" },
  { value: "CONVENTION_CENTER", label: "Convention Center" },
  { value: "WEDDING_HALL", label: "Wedding Hall" },
  { value: "OPEN_GROUND", label: "Open Ground" },
  { value: "OTHER", label: "Other" },
];

export default function ManagerVenuesPage() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [dashData, setDashData] = useState<Record<string, VenueDash>>({});
  const [dashLoading, setDashLoading] = useState<Record<string, boolean>>({});
  const [pastEventsData, setPastEventsData] = useState<Record<string, PastEvent[]>>({});
  const [pastEventsLoading, setPastEventsLoading] = useState<Record<string, boolean>>({});
  const [selectedPastId, setSelectedPastId] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/venues")
      .then((r) => r.json())
      .then((d) => setVenues(d.venues || []))
      .catch(() => toast.error("Failed to load venues"))
      .finally(() => setLoading(false));
  }, []);

  const loadDash = async (venueId: string) => {
    if (dashData[venueId]) return;
    setDashLoading((p) => ({ ...p, [venueId]: true }));
    try {
      const res = await fetch(`/api/venues/${venueId}/dashboard`);
      const data = await res.json();
      setDashData((p) => ({ ...p, [venueId]: data }));
    } catch {
      toast.error("Failed to load venue stats");
    } finally {
      setDashLoading((p) => ({ ...p, [venueId]: false }));
    }
  };

  const loadPastEvents = async (venueId: string) => {
    if (pastEventsData[venueId]) return;
    setPastEventsLoading((p) => ({ ...p, [venueId]: true }));
    try {
      const res = await fetch(`/api/venues/${venueId}/past-events`);
      const data = await res.json();
      setPastEventsData((p) => ({ ...p, [venueId]: data.pastEvents || [] }));
    } catch {
      toast.error("Failed to load past events");
    } finally {
      setPastEventsLoading((p) => ({ ...p, [venueId]: false }));
    }
  };

  const toggleExpand = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      loadDash(id);
      loadPastEvents(id);
    }
  };

  const filtered = venues.filter((v) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      v.name.toLowerCase().includes(q) ||
      v.city.toLowerCase().includes(q) ||
      v.area?.toLowerCase().includes(q);
    const matchesType = !typeFilter || v.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const cities = Array.from(new Set(venues.map((v) => v.city))).sort();

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Venue Marketplace</h1>
        <p className="text-sm text-gray-500">
          Browse all available venues — click any card to see availability, top organizers, and upcoming events
        </p>
      </div>

      {/* Summary pills */}
      {!loading && (
        <div className="flex flex-wrap gap-3">
          <div className="bg-indigo-50 text-indigo-700 text-sm font-medium px-4 py-2 rounded-full">
            {venues.length} venues listed
          </div>
          <div className="bg-green-50 text-green-700 text-sm font-medium px-4 py-2 rounded-full">
            {cities.length} cities
          </div>
          <div className="bg-orange-50 text-orange-700 text-sm font-medium px-4 py-2 rounded-full">
            {venues.reduce((s, v) => s + v.totalStallSlots, 0)} total stall slots
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, city or area…"
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
        >
          {VENUE_TYPE_OPTS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center">
          <Building2 className="h-12 w-12 mx-auto text-gray-300 mb-3" />
          <p className="font-medium text-gray-700">No venues found</p>
          <p className="text-sm text-gray-500 mt-1">
            {venues.length === 0
              ? "No venues are listed yet. Venue managers can add venues from their portal."
              : "Try adjusting your search or filters"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((venue) => {
            const dash = dashData[venue.id];
            const isExpanded = expandedId === venue.id;

            return (
              <div key={venue.id} className="bg-white rounded-xl border overflow-hidden hover:shadow-sm transition-shadow">
                {/* Card Header */}
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center flex-shrink-0">
                      <Building2 className="h-6 w-6 text-indigo-700" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-gray-900">{venue.name}</h3>
                          <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                            <MapPin className="h-3 w-3 flex-shrink-0" />
                            {venue.area ? `${venue.area}, ` : ""}{venue.city}
                          </div>
                        </div>
                        <span className="text-[11px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                          {getVenueTypeLabel(venue.type)}
                        </span>
                      </div>

                      {/* Stats row */}
                      <div className="flex flex-wrap items-center gap-4 mt-3">
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <Calendar className="h-3.5 w-3.5 text-indigo-500" />
                          <span className="font-medium">{venue._count.events}</span> events
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <Building2 className="h-3.5 w-3.5 text-green-500" />
                          <span className="font-medium">{venue.totalStallSlots}</span> stall slots
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <Users className="h-3.5 w-3.5 text-purple-500" />
                          <span className="font-medium">
                            {(venue.familyCount || 0) + (venue.employeeCount || 0)}
                          </span>{" "}
                          residents/employees
                        </div>
                        {venue.vendorRating > 0 && (
                          <div className="flex items-center gap-1 text-xs text-yellow-600">
                            <Star className="h-3.5 w-3.5 fill-yellow-400 stroke-yellow-400" />
                            <span className="font-medium">{venue.vendorRating.toFixed(1)}</span>
                          </div>
                        )}
                        {venue.smartScore > 0 && (
                          <div className="flex items-center gap-1 text-xs text-teal-600">
                            <Zap className="h-3.5 w-3.5" />
                            Smart Score: <span className="font-medium">{venue.smartScore}</span>
                          </div>
                        )}
                      </div>

                      {/* Amenities */}
                      {venue.amenities.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {venue.amenities.slice(0, 5).map((a) => (
                            <span key={a.name} className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                              {a.name}
                            </span>
                          ))}
                          {venue.amenities.length > 5 && (
                            <span className="text-[10px] text-gray-400">
                              +{venue.amenities.length - 5}
                            </span>
                          )}
                        </div>
                      )}

                      {venue.bestCategories && (
                        <p className="text-xs text-gray-500 mt-1.5">
                          Best for: <span className="text-indigo-600">{venue.bestCategories}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Action row */}
                  <div className="flex items-center justify-between mt-4 pt-3 border-t">
                    <Link
                      href={`/dashboard/manager/events/new?venueId=${venue.id}`}
                      className="flex items-center gap-1.5 bg-indigo-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      <TrendingUp className="h-3.5 w-3.5" /> Create Event Here
                    </Link>
                    <button
                      onClick={() => toggleExpand(venue.id)}
                      className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 transition-colors"
                    >
                      {isExpanded ? (
                        <><ChevronUp className="h-4 w-4" /> Hide details</>
                      ) : (
                        <><ChevronDown className="h-4 w-4" /> Availability & organizers</>
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded Stats */}
                {isExpanded && (
                  <div className="border-t px-5 py-5 bg-gray-50 space-y-5">
                    {dashLoading[venue.id] ? (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Loader2 className="h-4 w-4 animate-spin" /> Loading venue data…
                      </div>
                    ) : dash ? (
                      <>
                        {/* Summary chips */}
                        <div className="flex flex-wrap gap-3">
                          <div className="bg-white border rounded-lg px-3 py-2 text-center">
                            <div className="text-lg font-bold text-gray-900">{dash.totalEvents}</div>
                            <div className="text-[11px] text-gray-500">Total Events</div>
                          </div>
                          <div className="bg-white border rounded-lg px-3 py-2 text-center">
                            <div className="text-lg font-bold text-green-600">{dash.availableDays}</div>
                            <div className="text-[11px] text-gray-500">Free Days (60d)</div>
                          </div>
                          <div className="bg-white border rounded-lg px-3 py-2 text-center">
                            <div className="text-lg font-bold text-orange-600">{60 - dash.availableDays}</div>
                            <div className="text-[11px] text-gray-500">Booked Days (60d)</div>
                          </div>
                        </div>

                        {/* 60-day grid */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                              60-Day Availability
                            </h4>
                            <div className="flex items-center gap-3 text-[11px] text-gray-400">
                              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-green-400 inline-block" /> Free</span>
                              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-red-400 inline-block" /> Booked</span>
                            </div>
                          </div>
                          <AvailabilityCalendar days={dash.days} />
                        </div>

                        {/* Top Organizers */}
                        {dash.topOrganizers.length > 0 && (
                          <div>
                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                              Most Repeated Event Companies
                            </h4>
                            <div className="space-y-2">
                              {dash.topOrganizers.map((org, i) => (
                                <div key={org.organizerId} className="flex items-center gap-3">
                                  <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-[11px] font-bold text-indigo-700 flex-shrink-0">
                                    {i + 1}
                                  </div>
                                  <span className="text-sm text-gray-800 flex-1 min-w-0 truncate">
                                    {org.company || org.name}
                                    {org.company && <span className="text-gray-400 ml-1 text-xs">({org.name})</span>}
                                  </span>
                                  <span className="text-xs font-semibold text-indigo-600 flex-shrink-0">
                                    {org.count}×
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Upcoming events */}
                        {dash.upcomingEvents.length > 0 && (
                          <div>
                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                              Upcoming Events
                            </h4>
                            <div className="space-y-1.5">
                              {dash.upcomingEvents.slice(0, 4).map((e) => (
                                <div key={e.id} className="flex items-center justify-between text-sm">
                                  <span className="text-gray-700 truncate font-medium">{e.title}</span>
                                  <span className="text-xs text-gray-400 ml-2 flex-shrink-0">
                                    {new Date(e.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                                    {" – "}
                                    {new Date(e.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                                  </span>
                                </div>
                              ))}
                              {dash.upcomingEvents.length > 4 && (
                                <p className="text-xs text-gray-400">+{dash.upcomingEvents.length - 4} more upcoming</p>
                              )}
                            </div>
                          </div>
                        )}
                      </>
                    ) : null}

                    {/* Past Events Panel */}
                    <ManagerPastEventsSection
                      venueId={venue.id}
                      pastEvents={pastEventsData[venue.id] || []}
                      loading={pastEventsLoading[venue.id] || false}
                      selectedId={selectedPastId[venue.id] || ""}
                      onSelect={(id) => setSelectedPastId((p) => ({ ...p, [venue.id]: id }))}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ManagerPastEventsSection({
  venueId,
  pastEvents,
  loading,
  selectedId,
  onSelect,
}: {
  venueId: string;
  pastEvents: PastEvent[];
  loading: boolean;
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const selected = pastEvents.find((e) => e.id === selectedId) ?? null;
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="border-t pt-4 space-y-3">
      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
        <History className="h-3.5 w-3.5" /> Previous Events at this Venue
      </h4>

      {loading ? (
        <div className="text-sm text-gray-400 flex items-center gap-1.5">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading…
        </div>
      ) : pastEvents.length === 0 ? (
        <p className="text-sm text-gray-400">No past events recorded at this venue.</p>
      ) : (
        <>
          <div className="relative">
            <select
              value={selectedId}
              onChange={(e) => onSelect(e.target.value)}
              className="w-full appearance-none rounded-lg border border-gray-200 bg-white px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">— Select a past event to view details —</option>
              {pastEvents.map((pe) => (
                <option key={pe.id} value={pe.id}>
                  {pe.title} · {fmt(pe.startDate)}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>

          {selected && (
            <div className="bg-white rounded-lg border p-4 space-y-3 text-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-semibold text-gray-900">{selected.title}</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    Organised by{" "}
                    <span className="font-medium text-indigo-700">
                      {selected.organizer.company || selected.organizer.name}
                    </span>
                    {selected.organizer.company && ` (${selected.organizer.name})`}
                  </div>
                </div>
                {selected.avgRating !== null && (
                  <div className="flex items-center gap-1 text-yellow-600 flex-shrink-0">
                    <Star className="h-3.5 w-3.5 fill-yellow-400 stroke-yellow-400" />
                    <span className="font-medium">{selected.avgRating}</span>
                    <span className="text-xs text-gray-400">({selected.reviewCount})</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-gray-600">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-gray-400" />
                  {fmt(selected.startDate)}
                  {selected.startDate !== selected.endDate && ` – ${fmt(selected.endDate)}`}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-gray-400" />
                  {selected.startTime} – {selected.endTime}
                </div>
                <div>
                  <span className="text-gray-400">Stalls: </span>
                  <span className="font-medium text-gray-800">{selected.bookedStalls} / {selected.maxStalls}</span>
                </div>
                <div>
                  <span className="text-gray-400">Occupancy: </span>
                  <span className="font-medium text-gray-800">
                    {selected.maxStalls > 0
                      ? `${Math.round((selected.bookedStalls / selected.maxStalls) * 100)}%`
                      : "—"}
                  </span>
                </div>
              </div>

              {selected.categories.length > 0 && (
                <div>
                  <div className="text-xs text-gray-400 mb-1">Categories in this event:</div>
                  <div className="flex flex-wrap gap-1">
                    {selected.categories.map((c) => (
                      <span key={c} className="text-[11px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selected.feedbackComments.length > 0 && (
                <div>
                  <div className="text-xs text-gray-400 mb-1.5">Vendor feedback:</div>
                  <div className="space-y-1">
                    {selected.feedbackComments.map((c, i) => (
                      <p key={i} className="text-xs text-gray-600 bg-gray-50 rounded px-2 py-1 italic">
                        &ldquo;{c}&rdquo;
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {selected.lastEventInfo && (
                <div>
                  <div className="text-xs text-gray-400 mb-1">Organiser notes from last event:</div>
                  <p className="text-xs text-gray-600 bg-gray-50 rounded px-2 py-1">{selected.lastEventInfo}</p>
                </div>
              )}

              <Link
                href={`/dashboard/manager/events/new?venueId=${venueId}`}
                className="inline-flex items-center gap-1.5 text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700"
              >
                <Calendar className="h-3.5 w-3.5" /> Schedule next event here
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
