"use client";

import { useEffect, useState } from "react";
import { TrendingUp, Lightbulb, Target, BarChart2, ChevronRight } from "lucide-react";
import Link from "next/link";

type DiscoverEvent = {
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
};

type Prediction = {
  eventId: string;
  eventTitle: string;
  eventDate: string;
  venueCity: string;
  venueName: string;
  predictedMin: number;
  predictedMax: number;
  predictedAvg: number;
  venueAvg: number;
  categoryAvg: number;
  vendorAvg: number;
  sampleSize: number;
  confidence: "LOW" | "MEDIUM" | "HIGH";
  insights: string[];
};

function formatINR(amount: number): string {
  if (amount === 0) return "—";
  return "₹" + Math.round(amount).toLocaleString("en-IN");
}

function ConfidenceBadge({ confidence }: { confidence: "LOW" | "MEDIUM" | "HIGH" }) {
  const map = {
    LOW: "bg-red-100 text-red-700 border-red-200",
    MEDIUM: "bg-yellow-100 text-yellow-700 border-yellow-200",
    HIGH: "bg-green-100 text-green-700 border-green-200",
  };
  return (
    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${map[confidence]}`}>
      {confidence} CONFIDENCE
    </span>
  );
}

function DataBar({
  label,
  value,
  maxValue,
  color,
}: {
  label: string;
  value: number;
  maxValue: number;
  color: string;
}) {
  const pct = maxValue > 0 ? Math.min((value / maxValue) * 100, 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">{label}</span>
        <span className="font-semibold text-gray-800">{formatINR(value)}</span>
      </div>
      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function PredictionSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6 animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-48" />
      <div className="h-16 bg-gray-100 rounded-xl" />
      <div className="space-y-3">
        <div className="h-4 bg-gray-100 rounded w-full" />
        <div className="h-4 bg-gray-100 rounded w-5/6" />
        <div className="h-4 bg-gray-100 rounded w-4/6" />
      </div>
    </div>
  );
}

export default function RevenuePredictPage() {
  const [events, setEvents] = useState<DiscoverEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [predicting, setPredicting] = useState(false);
  const [predError, setPredError] = useState<string | null>(null);

  // Fetch upcoming events vendor hasn't booked
  useEffect(() => {
    fetch("/api/vendor/discover")
      .then((r) => r.json())
      .then((d) => {
        const filtered = (d.events as DiscoverEvent[]).filter((e) => !e.alreadyApplied);
        setEvents(filtered);
      })
      .catch(() => setEvents([]))
      .finally(() => setEventsLoading(false));
  }, []);

  // Fetch prediction when event selected
  useEffect(() => {
    if (!selectedEventId) {
      setPrediction(null);
      return;
    }
    setPredicting(true);
    setPredError(null);
    setPrediction(null);
    fetch(`/api/vendor/revenue-predict?eventId=${selectedEventId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setPredError(d.error);
        else setPrediction(d);
      })
      .catch(() => setPredError("Failed to fetch prediction"))
      .finally(() => setPredicting(false));
  }, [selectedEventId]);

  const maxBar =
    prediction
      ? Math.max(prediction.venueAvg, prediction.categoryAvg, prediction.vendorAvg, prediction.predictedAvg, 1)
      : 1;

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-indigo-600" />
          Revenue Predictor
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          See your expected earnings before you book
        </p>
      </div>

      {/* Event Selector */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select an upcoming event
        </label>
        {eventsLoading ? (
          <div className="h-10 bg-gray-100 rounded-lg animate-pulse" />
        ) : events.length === 0 ? (
          <p className="text-sm text-gray-400">No upcoming events available to predict.</p>
        ) : (
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">-- Choose an event --</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.title} — {ev.venueName}, {ev.venueCity} (
                {new Date(ev.startDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })})
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Empty state */}
      {!selectedEventId && !eventsLoading && (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center">
          <Target className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Select an event to see revenue prediction</p>
        </div>
      )}

      {/* Loading skeleton */}
      {predicting && <PredictionSkeleton />}

      {/* Error */}
      {predError && (
        <div className="bg-red-50 border border-red-100 rounded-xl px-5 py-4 text-sm text-red-600">
          {predError}
        </div>
      )}

      {/* Prediction card */}
      {prediction && !predicting && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Top band */}
          <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-5 text-white">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-indigo-200 text-xs font-medium uppercase tracking-wider">
                  Predicted Earnings Range
                </p>
                <p className="text-4xl font-extrabold tracking-tight mt-1">
                  {formatINR(prediction.predictedMin)} – {formatINR(prediction.predictedMax)}
                </p>
                <p className="text-indigo-200 text-sm mt-1">
                  Avg estimate: {formatINR(prediction.predictedAvg)}
                </p>
              </div>
              <ConfidenceBadge confidence={prediction.confidence} />
            </div>
          </div>

          <div className="px-6 py-5 space-y-6">
            {/* Event info */}
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <BarChart2 className="h-4 w-4 text-indigo-400" />
              <span>
                {prediction.eventTitle} · {prediction.venueName}, {prediction.venueCity} ·{" "}
                {new Date(prediction.eventDate).toLocaleDateString("en-IN", {
                  weekday: "short",
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>

            {/* Data bars */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Data Breakdown ({prediction.sampleSize} data points)
              </p>
              <DataBar
                label="Venue average"
                value={prediction.venueAvg}
                maxValue={maxBar}
                color="bg-indigo-500"
              />
              <DataBar
                label="Category average"
                value={prediction.categoryAvg}
                maxValue={maxBar}
                color="bg-violet-500"
              />
              <DataBar
                label="Your average"
                value={prediction.vendorAvg}
                maxValue={maxBar}
                color="bg-emerald-500"
              />
            </div>

            {/* Insights */}
            {prediction.insights.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Insights
                </p>
                <ul className="space-y-2">
                  {prediction.insights.map((insight, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <Lightbulb className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
                      {insight}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* CTA */}
            <div className="pt-2 border-t">
              <Link
                href={`/events/${prediction.eventId}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
              >
                Book This Event
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
