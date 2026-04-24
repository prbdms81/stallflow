"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  AlertTriangle,
  Calendar as CalendarIcon,
  Clock,
  List,
  Grid3X3,
  CheckSquare,
  Square,
  Zap,
  Filter,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import { formatCurrency, formatDate } from "@/lib/utils";
import toast from "react-hot-toast";

interface CalendarEvent {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  basePrice: number;
  maxStalls: number;
  bookedStalls: number;
  eventType: string;
  status: string;
  venue: { name: string; area: string | null; city: string };
  category: { name: string };
}

interface ClashInfo {
  date: string;
  events: CalendarEvent[];
  reason: string; // "same-area" | "time-overlap" | "same-date"
}

const areaOptions = [
  { value: "", label: "All Areas" },
  { value: "Nallagandla", label: "Nallagandla" },
  { value: "Gachibowli", label: "Gachibowli" },
  { value: "Kondapur", label: "Kondapur" },
  { value: "Madhapur", label: "Madhapur" },
  { value: "Kukatpally", label: "Kukatpally" },
  { value: "Manikonda", label: "Manikonda" },
  { value: "Miyapur", label: "Miyapur" },
  { value: "Banjara Hills", label: "Banjara Hills" },
  { value: "Jubilee Hills", label: "Jubilee Hills" },
  { value: "HITEC City", label: "HITEC City" },
  { value: "Financial District", label: "Financial District" },
];

const typeOptions = [
  { value: "", label: "All Types" },
  { value: "WEEKDAY_CORPORATE", label: "Corporate" },
  { value: "WEEKEND_COMMUNITY", label: "Community" },
  { value: "WEDDING", label: "Wedding" },
  { value: "EXHIBITION", label: "Exhibition" },
  { value: "FESTIVAL", label: "Festival" },
];

const EVENT_TYPE_LABELS: Record<string, string> = {
  WEEKDAY_CORPORATE: "Corporate",
  WEEKEND_COMMUNITY: "Community",
  WEDDING: "Wedding",
  EXHIBITION: "Exhibition",
  FESTIVAL: "Festival",
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Check if two time ranges overlap (HH:MM format)
function timesOverlap(s1: string, e1: string, s2: string, e2: string): boolean {
  const toMin = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + (m || 0);
  };
  return toMin(s1) < toMin(e2) && toMin(s2) < toMin(e1);
}

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [areaFilter, setAreaFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");
  const [showFilters, setShowFilters] = useState(false);

  // Multi-select for quick apply
  const [selectedEventIds, setSelectedEventIds] = useState<Set<string>>(new Set());
  const [applyMode, setApplyMode] = useState(false);

  useEffect(() => {
    const monthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`;
    setLoading(true);
    fetch(`/api/events?status=PUBLISHED&limit=200&month=${monthStr}`)
      .then((r) => r.json())
      .then((d) => setEvents(d.events || []))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, [currentMonth, currentYear]);

  // Apply filters
  const filteredEvents = useMemo(() => {
    let result = events;
    if (areaFilter) result = result.filter((e) => e.venue.area?.includes(areaFilter));
    if (typeFilter) result = result.filter((e) => e.eventType === typeFilter);
    return result;
  }, [events, areaFilter, typeFilter]);

  // Map events to dates
  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    for (const e of filteredEvents) {
      const start = new Date(e.startDate);
      const end = new Date(e.endDate);
      const d = new Date(start);
      while (d <= end) {
        const key = d.toISOString().split("T")[0];
        if (!map[key]) map[key] = [];
        map[key].push(e);
        d.setDate(d.getDate() + 1);
      }
    }
    return map;
  }, [filteredEvents]);

  // Smart clash detection: same area + overlapping time
  const clashes = useMemo(() => {
    const result: Record<string, ClashInfo> = {};

    for (const [date, evts] of Object.entries(eventsByDate)) {
      if (evts.length < 2) continue;

      // Check for same-area clashes
      const areaGroups: Record<string, CalendarEvent[]> = {};
      for (const e of evts) {
        const area = e.venue.area || e.venue.city;
        if (!areaGroups[area]) areaGroups[area] = [];
        areaGroups[area].push(e);
      }

      for (const [area, areaEvts] of Object.entries(areaGroups)) {
        if (areaEvts.length >= 2) {
          result[date] = {
            date,
            events: evts,
            reason: `${areaEvts.length} events in ${area}`,
          };
          break;
        }
      }

      // Check for time overlaps
      if (!result[date]) {
        for (let i = 0; i < evts.length; i++) {
          for (let j = i + 1; j < evts.length; j++) {
            if (timesOverlap(evts[i].startTime, evts[i].endTime, evts[j].startTime, evts[j].endTime)) {
              result[date] = {
                date,
                events: evts,
                reason: "Overlapping time slots",
              };
              break;
            }
          }
          if (result[date]) break;
        }
      }

      // Fallback: just multiple events
      if (!result[date] && evts.length >= 2) {
        result[date] = {
          date,
          events: evts,
          reason: `${evts.length} events on same day`,
        };
      }
    }

    return result;
  }, [eventsByDate]);

  // Calendar grid
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
    setSelectedDate(null);
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
    setSelectedDate(null);
  };

  const toggleEventSelection = (eventId: string) => {
    setSelectedEventIds((prev) => {
      const next = new Set(prev);
      if (next.has(eventId)) next.delete(eventId);
      else next.add(eventId);
      return next;
    });
  };

  const handleQuickApply = () => {
    if (selectedEventIds.size === 0) {
      toast.error("Select at least one event");
      return;
    }
    // Navigate to first event's booking page with multi-apply param
    const ids = Array.from(selectedEventIds);
    const firstId = ids[0];
    window.location.href = `/events/${firstId}/book?also=${ids.slice(1).join(",")}`;
  };

  const selectedDateEvents = selectedDate ? eventsByDate[selectedDate] || [] : [];
  const selectedClash = selectedDate ? clashes[selectedDate] : undefined;

  // List view: all events sorted by date
  const listViewEvents = useMemo(() => {
    return [...filteredEvents].sort(
      (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );
  }, [filteredEvents]);

  const clashCount = Object.keys(clashes).length;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Event Calendar</h1>
          <p className="text-gray-600 mt-1">
            Plan your stall bookings — spot clashes before they happen
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            <button
              onClick={() => setViewMode("calendar")}
              className={`p-2 ${viewMode === "calendar" ? "bg-indigo-500 text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 ${viewMode === "list" ? "bg-indigo-500 text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={prevMonth}
            className="p-2.5 hover:bg-gray-100 rounded-lg"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h2 className="text-lg font-semibold text-gray-900 min-w-[160px] text-center">
            {MONTHS[currentMonth]} {currentYear}
          </h2>
          <button
            onClick={nextMonth}
            className="p-2.5 hover:bg-gray-100 rounded-lg"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors sm:hidden ${
            showFilters ? "bg-indigo-100 text-indigo-700" : "bg-gray-100 text-gray-600"
          }`}
        >
          <Filter className="h-4 w-4" /> Filters
        </button>

        <div className={`flex flex-wrap gap-3 ${showFilters ? "" : "hidden sm:flex"}`}>
          <div className="w-44">
            <Select
              options={areaOptions}
              value={areaFilter}
              onChange={(e) => setAreaFilter(e.target.value)}
              placeholder="Filter by area"
            />
          </div>
          <div className="w-36">
            <Select
              options={typeOptions}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              placeholder="Event type"
            />
          </div>
        </div>

        {/* Quick Apply toggle */}
        <button
          onClick={() => {
            setApplyMode(!applyMode);
            setSelectedEventIds(new Set());
          }}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ml-auto ${
            applyMode
              ? "bg-indigo-100 text-indigo-700 border border-indigo-300"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <Zap className="h-4 w-4" />
          Quick Apply
        </button>
      </div>

      {/* Quick Apply bar */}
      {applyMode && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-6 flex items-center justify-between">
          <div className="text-sm">
            <span className="font-medium text-indigo-800">
              {selectedEventIds.size} event{selectedEventIds.size !== 1 ? "s" : ""} selected
            </span>
            <span className="text-indigo-600 ml-2">
              Tap events to select, then apply to all at once
            </span>
          </div>
          <Button
            size="sm"
            onClick={handleQuickApply}
            disabled={selectedEventIds.size === 0}
          >
            Apply to {selectedEventIds.size} Event{selectedEventIds.size !== 1 ? "s" : ""}
          </Button>
        </div>
      )}

      {/* Clash Alert */}
      {clashCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">
              {clashCount} date{clashCount !== 1 ? "s" : ""} with clashing events
            </p>
            <p className="text-xs text-amber-600 mt-0.5">
              Amber dates have multiple events in the same area or overlapping times.
              Click to compare and choose wisely!
            </p>
          </div>
        </div>
      )}

      {/* ── CALENDAR VIEW ── */}
      {viewMode === "calendar" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-4">
                {loading ? (
                  <div className="h-80 flex items-center justify-center text-gray-400">
                    Loading events...
                  </div>
                ) : (
                  <>
                    {/* Day headers */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {DAYS.map((d) => (
                        <div
                          key={d}
                          className="text-center text-xs font-medium text-gray-500 py-2"
                        >
                          {d}
                        </div>
                      ))}
                    </div>

                    {/* Days */}
                    <div className="grid grid-cols-7 gap-1">
                      {Array.from({ length: firstDay }).map((_, i) => (
                        <div key={`empty-${i}`} className="h-20 sm:h-24" />
                      ))}

                      {Array.from({ length: daysInMonth }).map((_, i) => {
                        const day = i + 1;
                        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                        const dayEvents = eventsByDate[dateStr] || [];
                        const hasClash = clashes[dateStr] !== undefined;
                        const isSelected = selectedDate === dateStr;
                        const isToday =
                          dateStr === new Date().toISOString().split("T")[0];

                        return (
                          <button
                            key={day}
                            onClick={() => setSelectedDate(dateStr)}
                            className={`h-20 sm:h-24 p-1 rounded-lg border text-left transition-all ${
                              isSelected
                                ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200"
                                : hasClash
                                ? "border-amber-300 bg-amber-50 hover:bg-amber-100"
                                : dayEvents.length > 0
                                ? "border-green-200 bg-green-50 hover:bg-green-100"
                                : "border-gray-100 hover:bg-gray-50"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span
                                className={`text-xs font-medium ${
                                  isToday
                                    ? "bg-indigo-500 text-white w-5 h-5 rounded-full flex items-center justify-center"
                                    : "text-gray-700"
                                }`}
                              >
                                {day}
                              </span>
                              {hasClash && (
                                <AlertTriangle className="h-3 w-3 text-amber-500" />
                              )}
                            </div>
                            {dayEvents.length > 0 && (
                              <div className="mt-1 space-y-0.5">
                                {dayEvents.slice(0, 2).map((e) => (
                                  <div
                                    key={e.id}
                                    className={`text-[11px] truncate px-1 py-0.5 rounded ${
                                      hasClash
                                        ? "bg-amber-200 text-amber-800"
                                        : "bg-indigo-100 text-indigo-700"
                                    }`}
                                  >
                                    {e.title.slice(0, 15)}
                                  </div>
                                ))}
                                {dayEvents.length > 2 && (
                                  <div className="text-[11px] text-gray-500 pl-1">
                                    +{dayEvents.length - 2} more
                                  </div>
                                )}
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Selected Date Detail */}
          <div>
            {selectedDate ? (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-IN", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </h3>

                {selectedClash && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      <span className="text-sm text-amber-800 font-medium">
                        Clash Detected
                      </span>
                    </div>
                    <p className="text-xs text-amber-600">{selectedClash.reason}</p>
                  </div>
                )}

                {selectedDateEvents.length > 0 ? (
                  <div className="space-y-3">
                    {selectedDateEvents.map((event) => {
                      const stallsLeft = event.maxStalls - event.bookedStalls;
                      const isSelected = selectedEventIds.has(event.id);

                      return (
                        <div key={event.id}>
                          {applyMode ? (
                            <button
                              onClick={() => toggleEventSelection(event.id)}
                              className="w-full text-left"
                            >
                              <Card
                                className={`transition-all ${
                                  isSelected ? "ring-2 ring-indigo-400 border-indigo-300" : ""
                                }`}
                              >
                                <CardContent className="py-3">
                                  <div className="flex items-start gap-2">
                                    {isSelected ? (
                                      <CheckSquare className="h-5 w-5 text-indigo-500 flex-shrink-0 mt-0.5" />
                                    ) : (
                                      <Square className="h-5 w-5 text-gray-300 flex-shrink-0 mt-0.5" />
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <h4 className="font-medium text-gray-900 text-sm">
                                        {event.title}
                                      </h4>
                                      <EventCardDetails event={event} stallsLeft={stallsLeft} />
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </button>
                          ) : (
                            <Link href={`/events/${event.id}`}>
                              <Card hover className="mb-0">
                                <CardContent className="py-3">
                                  <h4 className="font-medium text-gray-900 text-sm">
                                    {event.title}
                                  </h4>
                                  <EventCardDetails event={event} stallsLeft={stallsLeft} />
                                </CardContent>
                              </Card>
                            </Link>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <CalendarIcon className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm">No events on this date</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <CalendarIcon className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">Click a date to see events</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── LIST VIEW ── */}
      {viewMode === "list" && (
        <div className="max-w-3xl">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="py-4">
                    <div className="h-5 bg-gray-200 rounded w-1/2 mb-2" />
                    <div className="h-4 bg-gray-100 rounded w-3/4" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : listViewEvents.length > 0 ? (
            <div className="space-y-3">
              {listViewEvents.map((event) => {
                const stallsLeft = event.maxStalls - event.bookedStalls;
                const dateStr = new Date(event.startDate).toISOString().split("T")[0];
                const hasClash = clashes[dateStr] !== undefined;
                const isSelected = selectedEventIds.has(event.id);

                return (
                  <div key={event.id} className="relative">
                    {hasClash && (
                      <div className="absolute -left-1 top-0 bottom-0 w-1 bg-amber-400 rounded-full" />
                    )}

                    {applyMode ? (
                      <button
                        onClick={() => toggleEventSelection(event.id)}
                        className="w-full text-left"
                      >
                        <Card
                          className={`transition-all ${
                            isSelected ? "ring-2 ring-indigo-400 border-indigo-300" : ""
                          }`}
                        >
                          <CardContent className="py-4">
                            <div className="flex items-start gap-3">
                              {isSelected ? (
                                <CheckSquare className="h-5 w-5 text-indigo-500 flex-shrink-0 mt-0.5" />
                              ) : (
                                <Square className="h-5 w-5 text-gray-300 flex-shrink-0 mt-0.5" />
                              )}
                              <div className="flex-1 min-w-0">
                                <ListEventContent event={event} stallsLeft={stallsLeft} hasClash={hasClash} />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </button>
                    ) : (
                      <Link href={`/events/${event.id}`}>
                        <Card hover>
                          <CardContent className="py-4">
                            <ListEventContent event={event} stallsLeft={stallsLeft} hasClash={hasClash} />
                          </CardContent>
                        </Card>
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 text-gray-400">
              <CalendarIcon className="h-12 w-12 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900">No events this month</h3>
              <p className="text-sm">Try changing the month or adjusting filters.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Event detail snippet for calendar sidebar
function EventCardDetails({
  event,
  stallsLeft,
}: {
  event: CalendarEvent;
  stallsLeft: number;
}) {
  return (
    <>
      <div className="flex items-center text-xs text-gray-500 mt-1 gap-2">
        <span className="flex items-center gap-0.5">
          <MapPin className="h-3 w-3" />
          {event.venue.area || event.venue.city}
        </span>
        <span className="flex items-center gap-0.5">
          <Clock className="h-3 w-3" />
          {event.startTime}–{event.endTime}
        </span>
      </div>
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-2">
          <Badge variant="info">{event.category.name}</Badge>
          <span className="text-[10px] text-gray-400">
            {EVENT_TYPE_LABELS[event.eventType] || event.eventType}
          </span>
        </div>
        <span className="text-sm font-medium text-indigo-600">
          {formatCurrency(event.basePrice)}
        </span>
      </div>
      <div className="flex items-center justify-between mt-1">
        <span
          className={`text-xs ${
            stallsLeft <= 3 ? "text-red-500 font-medium" : "text-gray-400"
          }`}
        >
          {stallsLeft > 0 ? `${stallsLeft} stalls left` : "Sold out"}
        </span>
      </div>
    </>
  );
}

// List view event content
function ListEventContent({
  event,
  stallsLeft,
  hasClash,
}: {
  event: CalendarEvent;
  stallsLeft: number;
  hasClash: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-medium text-gray-900">{event.title}</h4>
          {hasClash && (
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
          )}
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <CalendarIcon className="h-3.5 w-3.5" />
            {formatDate(event.startDate)}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {event.startTime}–{event.endTime}
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {event.venue.name}, {event.venue.area || event.venue.city}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="info">{event.category.name}</Badge>
          <Badge>{EVENT_TYPE_LABELS[event.eventType] || event.eventType}</Badge>
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <div className="text-lg font-bold text-indigo-600">
          {formatCurrency(event.basePrice)}
        </div>
        <span
          className={`text-xs ${
            stallsLeft <= 3 ? "text-red-500 font-medium" : "text-gray-500"
          }`}
        >
          {stallsLeft > 0 ? `${stallsLeft} stalls left` : "Sold out"}
        </span>
      </div>
    </div>
  );
}
