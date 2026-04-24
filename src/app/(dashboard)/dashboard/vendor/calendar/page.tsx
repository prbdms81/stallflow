"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, AlertTriangle, X, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";

interface CalendarEvent {
  id: string;
  eventTitle: string;
  startDate: string;
  endDate: string;
  venueName: string;
  stallNumber: string;
  status: string;
}

interface ConflictPair {
  bookingIdA: string;
  bookingIdB: string;
  eventTitleA: string;
  eventTitleB: string;
  overlapStart: string;
  overlapEnd: string;
}

const STATUS_COLORS: Record<string, string> = {
  CONFIRMED: "bg-green-100 text-green-800 border-green-200",
  PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
  CANCELLED: "bg-gray-100 text-gray-500 border-gray-200",
};

const STATUS_DOT: Record<string, string> = {
  CONFIRMED: "bg-green-500",
  PENDING: "bg-yellow-400",
  CANCELLED: "bg-gray-400",
};

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function eventOnDay(ev: CalendarEvent, day: Date): boolean {
  const start = new Date(ev.startDate);
  const end = new Date(ev.endDate);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  return day >= start && day <= end;
}

export default function VendorCalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [conflicts, setConflicts] = useState<ConflictPair[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  useEffect(() => {
    fetch("/api/vendor-calendar")
      .then((r) => r.json())
      .then((data) => {
        setEvents(data.events || []);
        setConflicts(data.conflicts || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  // Build calendar grid
  const firstDay = new Date(viewYear, viewMonth, 1);
  const lastDay = new Date(viewYear, viewMonth + 1, 0);
  const startOffset = firstDay.getDay(); // 0=Sun
  const totalCells = Math.ceil((startOffset + lastDay.getDate()) / 7) * 7;

  const cells: (Date | null)[] = [];
  for (let i = 0; i < totalCells; i++) {
    const dayNum = i - startOffset + 1;
    if (dayNum < 1 || dayNum > lastDay.getDate()) {
      cells.push(null);
    } else {
      cells.push(new Date(viewYear, viewMonth, dayNum));
    }
  }

  // Conflict day set (dates as YYYY-MM-DD strings)
  const conflictDates = new Set<string>();
  for (const c of conflicts) {
    const start = new Date(c.overlapStart);
    const end = new Date(c.overlapEnd);
    const cur = new Date(start);
    while (cur <= end) {
      conflictDates.add(cur.toISOString().slice(0, 10));
      cur.setDate(cur.getDate() + 1);
    }
  }

  if (loading) {
    return (
      <div className="p-6 animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-48" />
        <div className="h-64 bg-gray-200 rounded" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center space-x-3">
        <Calendar className="h-6 w-6 text-indigo-600" />
        <h1 className="text-2xl font-bold text-gray-900">Event Calendar</h1>
      </div>

      {/* Conflict warnings */}
      {conflicts.length > 0 && (
        <div className="space-y-2">
          {conflicts.map((c, i) => (
            <div key={i} className="flex items-start space-x-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm">
              <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-medium text-amber-800">Overlapping bookings: </span>
                <span className="text-amber-700">
                  &ldquo;{c.eventTitleA}&rdquo; and &ldquo;{c.eventTitleB}&rdquo; overlap on{" "}
                  {new Date(c.overlapStart).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  {!isSameDay(new Date(c.overlapStart), new Date(c.overlapEnd)) && (
                    <> – {new Date(c.overlapEnd).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</>
                  )}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Calendar card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-semibold text-gray-900">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </h2>
            <button
              onClick={nextMonth}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700"
              aria-label="Next month"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Day headers */}
          <div className="grid grid-cols-7 mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-px bg-gray-100 rounded-lg overflow-hidden">
            {cells.map((day, idx) => {
              if (!day) {
                return <div key={idx} className="bg-gray-50 min-h-[72px]" />;
              }

              const dayStr = day.toISOString().slice(0, 10);
              const isToday = isSameDay(day, today);
              const isConflict = conflictDates.has(dayStr);
              const dayEvents = events.filter((ev) => eventOnDay(ev, day));

              return (
                <div
                  key={idx}
                  className={`bg-white min-h-[72px] p-1 ${isConflict ? "ring-1 ring-inset ring-amber-400 bg-amber-50/30" : ""}`}
                >
                  <div className={`text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full ${
                    isToday ? "bg-indigo-600 text-white" : "text-gray-700"
                  }`}>
                    {day.getDate()}
                  </div>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 2).map((ev) => (
                      <button
                        key={ev.id}
                        onClick={() => setSelectedEvent(ev)}
                        className={`w-full text-left text-xs px-1.5 py-0.5 rounded border truncate ${STATUS_COLORS[ev.status] ?? "bg-indigo-100 text-indigo-800 border-indigo-200"}`}
                        title={ev.eventTitle}
                      >
                        {ev.eventTitle}
                      </button>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-xs text-gray-400 pl-1">+{dayEvents.length - 2} more</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mt-4 pt-3 border-t text-xs text-gray-600">
            {[["CONFIRMED", "Confirmed"], ["PENDING", "Pending"], ["CANCELLED", "Cancelled"]].map(([status, label]) => (
              <div key={status} className="flex items-center gap-1.5">
                <div className={`w-2.5 h-2.5 rounded-full ${STATUS_DOT[status]}`} />
                {label}
              </div>
            ))}
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded border border-amber-400 bg-amber-50" />
              Conflict
            </div>
          </div>
        </CardContent>
      </Card>

      {/* No upcoming events */}
      {events.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-200" />
          <p>No upcoming bookings</p>
        </div>
      )}

      {/* Event detail popup */}
      {selectedEvent && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedEvent(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <h3 className="font-bold text-gray-900 text-lg leading-tight pr-4">{selectedEvent.eventTitle}</h3>
              <button
                onClick={() => setSelectedEvent(null)}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 shrink-0"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Status</span>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[selectedEvent.status] ?? ""}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[selectedEvent.status] ?? "bg-gray-400"}`} />
                  {selectedEvent.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Venue</span>
                <span className="font-medium text-gray-900">{selectedEvent.venueName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Stall #</span>
                <span className="font-medium text-gray-900">{selectedEvent.stallNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Start</span>
                <span className="text-gray-700">
                  {new Date(selectedEvent.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">End</span>
                <span className="text-gray-700">
                  {new Date(selectedEvent.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
