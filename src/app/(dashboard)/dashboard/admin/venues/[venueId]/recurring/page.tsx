"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import Link from "next/link";

interface EventSlot {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  status: string;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function VenueRecurringPage() {
  const params = useParams();
  const venueId = params.venueId as string;
  const [events, setEvents] = useState<EventSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());

  useEffect(() => {
    fetch(`/api/venues/${venueId}/events`)
      .then((r) => r.json())
      .then((d) => setEvents(d.events || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [venueId]);

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  };

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const isBooked = (day: number) => {
    const d = new Date(year, month, day);
    return events.some((e) => {
      const from = new Date(e.startDate);
      const to = new Date(e.endDate);
      return d >= new Date(from.getFullYear(), from.getMonth(), from.getDate()) &&
        d <= new Date(to.getFullYear(), to.getMonth(), to.getDate());
    });
  };

  const getEvent = (day: number) => {
    const d = new Date(year, month, day);
    return events.find((e) => {
      const from = new Date(e.startDate);
      const to = new Date(e.endDate);
      return d >= new Date(from.getFullYear(), from.getMonth(), from.getDate()) &&
        d <= new Date(to.getFullYear(), to.getMonth(), to.getDate());
    });
  };

  const today = new Date();

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/admin" className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Venue Calendar</h1>
          <p className="text-gray-500 text-sm">See booked and available dates for your venue</p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <button onClick={prevMonth} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          </button>
          <span className="font-semibold text-gray-900">{MONTHS[month]} {year}</span>
          <button onClick={nextMonth} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <ChevronRight className="h-5 w-5 text-gray-600" />
          </button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-64 bg-gray-100 animate-pulse rounded-xl" />
          ) : (
            <>
              <div className="grid grid-cols-7 mb-2">
                {DAYS.map((d) => (
                  <div key={d} className="text-center text-xs font-medium text-gray-500 py-1">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                  const booked = isBooked(day);
                  const event = getEvent(day);
                  const isToday =
                    today.getDate() === day &&
                    today.getMonth() === month &&
                    today.getFullYear() === year;
                  return (
                    <div
                      key={day}
                      title={event ? event.title : "Available"}
                      className={`
                        relative h-10 flex items-center justify-center rounded-lg text-sm font-medium transition-colors
                        ${booked ? "bg-indigo-100 text-indigo-700 cursor-pointer hover:bg-indigo-200" : "bg-green-50 text-green-700 hover:bg-green-100"}
                        ${isToday ? "ring-2 ring-indigo-500" : ""}
                      `}
                    >
                      {day}
                      {booked && (
                        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-indigo-500" />
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-indigo-100 border border-indigo-200 inline-block" />
                  Booked
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-green-50 border border-green-200 inline-block" />
                  Available
                </span>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Upcoming events list */}
      {events.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-indigo-500" /> Upcoming Events
            </h3>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {events
                .filter((e) => new Date(e.endDate) >= new Date())
                .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
                .slice(0, 8)
                .map((e) => (
                  <div key={e.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900 text-sm">{e.title}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(e.startDate).toLocaleDateString("en-IN")} — {new Date(e.endDate).toLocaleDateString("en-IN")}
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      e.status === "PUBLISHED" ? "bg-green-100 text-green-700" :
                      e.status === "DRAFT" ? "bg-yellow-100 text-yellow-700" :
                      "bg-gray-100 text-gray-600"
                    }`}>
                      {e.status}
                    </span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
