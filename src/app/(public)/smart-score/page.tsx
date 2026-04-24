"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Brain, TrendingUp, Users, IndianRupee, MapPin, Star,
  Loader2, ChevronRight, Zap, Calendar,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils";

interface Community {
  id: string;
  name: string;
  area: string | null;
  type: string;
  familyCount: number;
  employeeCount: number;
  vendorRating: number;
  smartScore: number;
  avgSpendPerVisit: number;
  bestCategories: string | null;
  eventFrequency: string | null;
  _count: { events: number };
}

function ScoreRing({ score, size = 56 }: { score: number; size?: number }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? "#22c55e" : score >= 60 ? "#6366f1" : score >= 40 ? "#f59e0b" : "#ef4444";

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#f3f4f6" strokeWidth={4} />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={color} strokeWidth={4} strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold" style={{ color }}>{score}</span>
      </div>
    </div>
  );
}

function estimateROI(community: Community, stallCost: number): { revenue: number; roi: number; confidence: string } {
  // Simple ROI model based on available signals
  const footfall = community.type === "CORPORATE"
    ? community.employeeCount * 0.4
    : community.familyCount * 1.5;
  const spendPerVisitor = community.avgSpendPerVisit || (community.smartScore > 70 ? 200 : 120);
  const conversionRate = community.smartScore > 70 ? 0.12 : community.smartScore > 50 ? 0.08 : 0.05;
  const estimatedRevenue = Math.round(footfall * conversionRate * spendPerVisitor);
  const roi = stallCost > 0 ? Math.round(((estimatedRevenue - stallCost) / stallCost) * 100) : 0;
  const confidence = community._count.events >= 5 ? "High" : community._count.events >= 2 ? "Medium" : "Low";
  return { revenue: estimatedRevenue, roi, confidence };
}

export default function SmartScorePage() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [stallBudget, setStallBudget] = useState(5000);
  const [sortBy, setSortBy] = useState<"score" | "roi" | "footfall">("score");

  useEffect(() => {
    fetch("/api/communities?sort=smartScore")
      .then((r) => r.json())
      .then((d) => setCommunities(d.communities || []))
      .catch(() => setCommunities([]))
      .finally(() => setLoading(false));
  }, []);

  const withROI = communities.map((c) => ({
    ...c,
    ...estimateROI(c, stallBudget),
  }));

  const sorted = [...withROI].sort((a, b) =>
    sortBy === "roi" ? b.roi - a.roi :
    sortBy === "footfall" ? (b.familyCount + b.employeeCount) - (a.familyCount + a.employeeCount) :
    b.smartScore - a.smartScore
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Locality Smart Score</h1>
        <p className="text-sm text-gray-500">AI-powered ROI predictions for every community</p>
      </div>

      {/* Explainer */}
      <div className="bg-gradient-to-r from-violet-500 to-indigo-600 rounded-xl p-5 text-white mb-6">
        <div className="flex items-start gap-3">
          <Brain className="h-7 w-7 flex-shrink-0" />
          <div>
            <h2 className="font-bold text-lg">Where should you sell next?</h2>
            <p className="text-violet-100 text-sm mt-1">
              We analyze family count, past vendor earnings, ratings, and event frequency
              to predict which communities will give you the best ROI.
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="bg-white/20 px-2.5 py-1 rounded-full text-xs">Family demographics</span>
              <span className="bg-white/20 px-2.5 py-1 rounded-full text-xs">Past vendor sales</span>
              <span className="bg-white/20 px-2.5 py-1 rounded-full text-xs">Event frequency</span>
              <span className="bg-white/20 px-2.5 py-1 rounded-full text-xs">Vendor ratings</span>
            </div>
          </div>
        </div>
      </div>

      {/* Budget Input + Sort */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2 flex-1">
          <IndianRupee className="h-4 w-4 text-gray-400" />
          <input
            type="number"
            value={stallBudget}
            onChange={(e) => setStallBudget(parseInt(e.target.value) || 0)}
            className="bg-transparent text-sm font-medium text-gray-900 w-20 focus:outline-none"
            placeholder="Budget"
          />
          <span className="text-xs text-gray-400">stall budget</span>
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
          {(["score", "roi", "footfall"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              className={`px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                sortBy === s ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
              }`}
            >
              {s === "score" ? "Score" : s === "roi" ? "ROI" : "Footfall"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
        </div>
      ) : sorted.length > 0 ? (
        <div className="space-y-3">
          {sorted.map((c, idx) => {
            const categories: string[] = (() => { try { return JSON.parse(c.bestCategories || "[]"); } catch { return []; } })();
            return (
              <Link key={c.id} href={`/communities/${c.id}`}>
                <Card className={`hover:shadow-md transition-shadow cursor-pointer ${
                  idx === 0 ? "border-indigo-300 bg-indigo-50/20" : ""
                }`}>
                  <CardContent className="py-4">
                    <div className="flex items-start gap-3">
                      <ScoreRing score={c.smartScore} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900 truncate">{c.name}</h3>
                          {idx === 0 && <Badge variant="success">Top Pick</Badge>}
                        </div>
                        <div className="flex items-center text-xs text-gray-500 mt-0.5">
                          <MapPin className="h-3 w-3 mr-1" />
                          {c.area || "Hyderabad"}
                          <span className="mx-1.5">·</span>
                          <span className="capitalize">{c.type?.toLowerCase().replace("_", " ")}</span>
                        </div>

                        {/* Stats row */}
                        <div className="flex flex-wrap gap-3 mt-2">
                          <div className="flex items-center gap-1 text-xs">
                            <Users className="h-3 w-3 text-indigo-400" />
                            <span className="text-gray-600">
                              {c.type === "CORPORATE" ? `${c.employeeCount} employees` : `${c.familyCount} families`}
                            </span>
                          </div>
                          {c.vendorRating > 0 && (
                            <div className="flex items-center gap-1 text-xs">
                              <Star className="h-3 w-3 text-amber-400" />
                              <span className="text-gray-600">{c.vendorRating.toFixed(1)}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1 text-xs">
                            <Calendar className="h-3 w-3 text-green-400" />
                            <span className="text-gray-600">{c._count.events} events</span>
                          </div>
                          {c.eventFrequency && (
                            <div className="flex items-center gap-1 text-xs">
                              <Zap className="h-3 w-3 text-purple-400" />
                              <span className="text-gray-600">{c.eventFrequency}</span>
                            </div>
                          )}
                        </div>

                        {/* ROI prediction */}
                        <div className="flex items-center gap-3 mt-2 pt-2 border-t border-gray-100">
                          <div className="flex items-center gap-1">
                            <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                            <span className="text-xs font-semibold text-green-600">
                              ~{formatCurrency(c.revenue)} est. revenue
                            </span>
                          </div>
                          <div className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                            c.roi >= 100 ? "bg-green-100 text-green-700"
                            : c.roi >= 50 ? "bg-blue-100 text-blue-700"
                            : c.roi >= 0 ? "bg-gray-100 text-gray-600"
                            : "bg-red-100 text-red-600"
                          }`}>
                            {c.roi >= 0 ? "+" : ""}{c.roi}% ROI
                          </div>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                            c.confidence === "High" ? "bg-green-50 text-green-600"
                            : c.confidence === "Medium" ? "bg-amber-50 text-amber-600"
                            : "bg-gray-50 text-gray-500"
                          }`}>
                            {c.confidence} confidence
                          </span>
                        </div>

                        {/* Categories */}
                        {categories.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {categories.slice(0, 3).map((cat) => (
                              <span key={cat} className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded">
                                {cat}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-300 flex-shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16">
          <Brain className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900">No community data yet</h3>
          <p className="text-gray-500 text-sm mt-1">Smart scores will appear as communities host more events</p>
        </div>
      )}
    </div>
  );
}
