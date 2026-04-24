"use client";

import { useEffect, useState } from "react";
import { BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";

interface MixItem {
  category: string;
  percentage: number;
  suggestedCount: number;
  reasoning: string;
}

interface Props {
  eventType: string;
  maxStalls: number;
}

const COLORS = [
  "bg-indigo-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-pink-500",
  "bg-sky-500",
  "bg-purple-500",
  "bg-orange-500",
];

export default function VendorMixPanel({ eventType, maxStalls }: Props) {
  const [mix, setMix] = useState<MixItem[]>([]);
  const [basedOnEvents, setBasedOnEvents] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!eventType) return;
    setLoading(true);
    fetch(`/api/vendor-mix?eventType=${eventType}&maxStalls=${maxStalls}`)
      .then((r) => r.json())
      .then((data) => {
        setMix(data.mix || []);
        setBasedOnEvents(data.basedOnEvents || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [eventType, maxStalls]);

  if (!eventType) return null;

  return (
    <Card className="border-indigo-100 bg-indigo-50/40">
      <CardHeader>
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-indigo-600" />
          <h3 className="font-semibold text-gray-800 text-sm">Vendor Mix Suggestion</h3>
          <span className="ml-auto text-xs text-gray-500">
            {basedOnEvents > 0
              ? `Based on ${basedOnEvents} past event${basedOnEvents > 1 ? "s" : ""}`
              : "Using default benchmarks"}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="text-sm text-gray-400 animate-pulse py-2">Loading suggestions...</div>
        ) : (
          mix.map((item, i) => (
            <div key={item.category}>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-gray-700">
                  {item.category.replace(/_/g, " ")}
                </span>
                <span className="text-gray-500">
                  {item.suggestedCount} stalls ({item.percentage}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full ${COLORS[i % COLORS.length]} transition-all duration-500`}
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-0.5">{item.reasoning}</p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
