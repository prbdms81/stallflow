"use client";

import { useEffect, useState } from "react";
import { Award, ShieldCheck, Zap, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";

interface ScoreBreakdown {
  total: number;
  paymentScore: number;
  attendanceScore: number;
  reviewScore: number;
  docScore: number;
  tier: "Bronze" | "Silver" | "Gold" | "Platinum";
  perks: string[];
}

const TIER_STYLES: Record<string, { bg: string; text: string; border: string; icon: string }> = {
  Platinum: { bg: "from-violet-500 to-purple-600", text: "text-purple-700", border: "border-purple-200", icon: "💎" },
  Gold:     { bg: "from-amber-400 to-yellow-500", text: "text-amber-700",  border: "border-amber-200",  icon: "🏆" },
  Silver:   { bg: "from-gray-400 to-slate-500",   text: "text-slate-700",  border: "border-slate-200",  icon: "🥈" },
  Bronze:   { bg: "from-orange-400 to-amber-600", text: "text-orange-700", border: "border-orange-200", icon: "🥉" },
};

const SCORE_ITEMS = [
  { key: "paymentScore", label: "Payment History", max: 30, icon: <Zap className="h-3.5 w-3.5" /> },
  { key: "attendanceScore", label: "Attendance",     max: 25, icon: <Award className="h-3.5 w-3.5" /> },
  { key: "reviewScore",     label: "Reviews",        max: 25, icon: <Star className="h-3.5 w-3.5" /> },
  { key: "docScore",        label: "Documents",      max: 20, icon: <ShieldCheck className="h-3.5 w-3.5" /> },
] as const;

export default function VendorScoreCard({ userId }: { userId?: string }) {
  const [score, setScore] = useState<ScoreBreakdown | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const url = userId ? `/api/vendor-score?userId=${userId}` : "/api/vendor-score";
    fetch(url)
      .then((r) => r.json())
      .then((d) => setScore(d.score || null))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) return <div className="h-48 bg-gray-100 rounded-2xl animate-pulse" />;
  if (!score) return null;

  const style = TIER_STYLES[score.tier];
  const circumference = 2 * Math.PI * 42;
  const offset = circumference - (score.total / 100) * circumference;

  return (
    <Card className={`border ${style.border}`}>
      <CardContent className="py-5">
        <div className="flex items-start gap-4">
          {/* Score ring */}
          <div className="flex-shrink-0 flex flex-col items-center">
            <div className="relative w-24 h-24">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 96 96">
                <circle cx="48" cy="48" r="42" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                <circle
                  cx="48" cy="48" r="42" fill="none" strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={circumference} strokeDashoffset={offset}
                  stroke="url(#scoreGrad)" className="transition-all duration-1000"
                />
                <defs>
                  <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor={score.tier === "Platinum" ? "#8b5cf6" : score.tier === "Gold" ? "#f59e0b" : score.tier === "Silver" ? "#94a3b8" : "#f97316"} />
                    <stop offset="100%" stopColor={score.tier === "Platinum" ? "#7c3aed" : score.tier === "Gold" ? "#d97706" : score.tier === "Silver" ? "#64748b" : "#ea580c"} />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-gray-900">{score.total}</span>
                <span className="text-[10px] text-gray-400">/100</span>
              </div>
            </div>
            <span className={`mt-1 text-xs font-semibold ${style.text}`}>
              {style.icon} {score.tier}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 text-sm mb-2">Stallmate Score</p>
            <div className="space-y-1.5">
              {SCORE_ITEMS.map((item) => {
                const val = score[item.key];
                const pct = (val / item.max) * 100;
                return (
                  <div key={item.key} className="flex items-center gap-2 text-xs">
                    <span className="text-gray-400 w-3.5">{item.icon}</span>
                    <span className="text-gray-600 w-28 truncate">{item.label}</span>
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full bg-gradient-to-r ${style.bg}`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-gray-500 w-8 text-right">{val}/{item.max}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {score.perks.length > 0 && (
          <div className="mt-4 pt-3 border-t">
            <p className="text-xs font-medium text-gray-500 mb-1.5">Unlocked Perks</p>
            <div className="flex flex-wrap gap-1.5">
              {score.perks.map((perk) => (
                <span key={perk} className={`text-xs px-2 py-0.5 rounded-full border ${style.border} ${style.text} bg-white`}>
                  {perk}
                </span>
              ))}
            </div>
          </div>
        )}

        <p className="text-xs text-gray-400 mt-3">
          Score updates after each completed event. Improve by completing payments on time, attending events, and keeping documents verified.
        </p>
      </CardContent>
    </Card>
  );
}
