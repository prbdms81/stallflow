"use client";

import { useState } from "react";
import { TrendingUp, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils";

interface HeatmapEntry {
  category: string;
  totalSlots: number;
  bookedSlots: number;
  availableSlots: number;
  fillRate: number;
  demandLevel: "HIGH" | "MEDIUM" | "LOW";
  avgPrice: number;
}

const demandConfig = {
  HIGH: { label: "HIGH", badgeVariant: "danger" as const, barColor: "bg-red-500", textColor: "text-red-600" },
  MEDIUM: { label: "MEDIUM", badgeVariant: "warning" as const, barColor: "bg-amber-500", textColor: "text-amber-600" },
  LOW: { label: "LOW", badgeVariant: "success" as const, barColor: "bg-green-500", textColor: "text-green-600" },
};

export default function DemandHeatmapPage() {
  const [city, setCity] = useState("");
  const [inputCity, setInputCity] = useState("");
  const [heatmap, setHeatmap] = useState<HeatmapEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  async function handleSearch() {
    const trimmed = inputCity.trim();
    if (!trimmed) return;
    setLoading(true);
    setError("");
    setSearched(false);
    try {
      const res = await fetch(`/api/demand-heatmap?city=${encodeURIComponent(trimmed)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setHeatmap(data.heatmap || []);
      setCity(data.city);
      setSearched(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-100 rounded-full mb-4">
          <TrendingUp className="h-7 w-7 text-indigo-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Category Demand Heatmap</h1>
        <p className="text-gray-500 text-lg">Find where demand is low and opportunity is high</p>
      </div>

      {/* City selector */}
      <div className="max-w-md mx-auto flex gap-3 mb-10">
        <input
          type="text"
          value={inputCity}
          onChange={(e) => setInputCity(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="Enter city (e.g. Hyderabad)"
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <Button onClick={handleSearch} disabled={loading || !inputCity.trim()}>
          {loading ? (
            <span className="flex items-center gap-2"><span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />Searching…</span>
          ) : (
            <span className="flex items-center gap-2"><Search className="h-4 w-4" />Search</span>
          )}
        </Button>
      </div>

      {error && (
        <div className="text-center text-red-600 mb-6 text-sm">{error}</div>
      )}

      {/* Results */}
      {searched && (
        <>
          {heatmap.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <TrendingUp className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="font-medium">No upcoming events found in <span className="font-semibold text-gray-700">{city}</span></p>
              <p className="text-sm mt-1">Try a different city or check back later.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Results for <span className="text-indigo-600">{city}</span>
                </h2>
                <span className="text-sm text-gray-500">{heatmap.length} categories</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {heatmap.map((entry) => {
                  const cfg = demandConfig[entry.demandLevel];
                  return (
                    <Card key={entry.category} className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-5">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="font-semibold text-gray-900 text-sm leading-tight">{entry.category}</h3>
                          <Badge variant={cfg.badgeVariant} className="text-xs ml-2 shrink-0">{cfg.label}</Badge>
                        </div>

                        {/* Fill rate bar */}
                        <div className="mb-3">
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Fill Rate</span>
                            <span className={cfg.textColor + " font-medium"}>{Math.round(entry.fillRate * 100)}%</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${cfg.barColor} transition-all`}
                              style={{ width: `${Math.round(entry.fillRate * 100)}%` }}
                            />
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-2 text-center text-xs">
                          <div className="bg-gray-50 rounded p-2">
                            <div className="font-semibold text-gray-900">{entry.totalSlots}</div>
                            <div className="text-gray-400">Total</div>
                          </div>
                          <div className="bg-red-50 rounded p-2">
                            <div className="font-semibold text-red-700">{entry.bookedSlots}</div>
                            <div className="text-gray-400">Booked</div>
                          </div>
                          <div className="bg-green-50 rounded p-2">
                            <div className="font-semibold text-green-700">{entry.availableSlots}</div>
                            <div className="text-gray-400">Available</div>
                          </div>
                        </div>

                        {entry.avgPrice > 0 && (
                          <div className="mt-3 pt-3 border-t text-sm text-gray-600">
                            Avg stall price: <span className="font-semibold text-indigo-600">{formatCurrency(entry.avgPrice)}</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <p className="text-xs text-gray-400 mt-6 text-center">
                Based on upcoming published events. LOW demand = more open slots for you.
              </p>
            </>
          )}
        </>
      )}

      {!searched && !loading && (
        <div className="text-center py-16 text-gray-400">
          <TrendingUp className="h-14 w-14 mx-auto mb-3 text-gray-200" />
          <p>Enter a city name to see category demand</p>
        </div>
      )}
    </div>
  );
}
