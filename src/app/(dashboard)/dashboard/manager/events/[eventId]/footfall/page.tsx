"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Users, TrendingUp, Clock, QrCode, Download } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import QRCode from "qrcode";

interface FootfallData {
  total: number;
  peakHour: string | null;
  hourly: Record<string, number>;
  recent: { id: string; name: string | null; checkedAt: string }[];
}

export default function FootfallPage() {
  const { eventId } = useParams();
  const [data, setData] = useState<FootfallData | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [loading, setLoading] = useState(true);

  const checkInUrl =
    typeof window !== "undefined" ? `${window.location.origin}/checkin/${eventId}` : "";

  const load = useCallback(() => {
    fetch(`/api/footfall?eventId=${eventId}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, [eventId]);

  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    if (checkInUrl) {
      QRCode.toDataURL(checkInUrl, { width: 256, margin: 2 }).then(setQrDataUrl).catch(() => {});
    }
  }, [checkInUrl]);

  const maxHourly = data ? Math.max(...Object.values(data.hourly), 1) : 1;
  const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Footfall Tracker</h1>
        <p className="text-sm text-gray-500">Live visitor count. Refreshes every 30 seconds.</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="text-center py-5">
            <Users className="h-6 w-6 text-indigo-500 mx-auto mb-1" />
            <div className="text-3xl font-bold text-gray-900">{data?.total ?? "—"}</div>
            <div className="text-xs text-gray-500">Total Visitors</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="text-center py-5">
            <TrendingUp className="h-6 w-6 text-green-500 mx-auto mb-1" />
            <div className="text-3xl font-bold text-gray-900">
              {data?.hourly ? Math.max(...Object.values(data.hourly)) : "—"}
            </div>
            <div className="text-xs text-gray-500">Peak Hour Count</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="text-center py-5">
            <Clock className="h-6 w-6 text-amber-500 mx-auto mb-1" />
            <div className="text-2xl font-bold text-gray-900">{data?.peakHour ?? "—"}</div>
            <div className="text-xs text-gray-500">Peak Hour</div>
          </CardContent>
        </Card>
      </div>

      {/* QR Code */}
      <Card>
        <CardContent className="py-5">
          <div className="flex flex-col sm:flex-row items-center gap-5">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="Check-in QR" className="w-28 h-28 rounded-lg border flex-shrink-0" />
            ) : (
              <div className="w-28 h-28 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                <QrCode className="h-10 w-10 text-gray-300" />
              </div>
            )}
            <div className="flex-1 min-w-0 text-center sm:text-left">
              <p className="font-semibold text-gray-900">Entry QR Code</p>
              <p className="text-sm text-gray-500 mt-1">
                Print and place at the event entry. Visitors scan to check in.
                No app download required — works in browser.
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {qrDataUrl && (
                  <a
                    href={qrDataUrl}
                    download="entry-qr.png"
                    className="flex items-center gap-1.5 text-xs bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-100"
                  >
                    <Download className="h-3.5 w-3.5" /> Download QR
                  </a>
                )}
                <a
                  href={checkInUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-gray-500 hover:text-indigo-600 px-3 py-1.5 rounded-lg border hover:border-indigo-200"
                >
                  Preview check-in page →
                </a>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hourly bar chart */}
      {data && Object.keys(data.hourly).length > 0 && (
        <Card>
          <CardContent className="py-5">
            <h3 className="font-semibold text-gray-900 mb-4">Visitor Arrivals by Hour</h3>
            <div className="flex items-end gap-0.5 h-28">
              {hours.map((h) => {
                const count = data.hourly[h] || 0;
                const heightPct = (count / maxHourly) * 100;
                return (
                  <div key={h} className="flex-1 flex flex-col items-center gap-0.5" title={`${h}: ${count} visitors`}>
                    <div
                      className="w-full bg-indigo-400 rounded-t-sm transition-all hover:bg-indigo-600"
                      style={{ height: `${Math.max(heightPct, count > 0 ? 4 : 0)}%` }}
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>12am</span><span>6am</span><span>12pm</span><span>6pm</span><span>11pm</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent check-ins */}
      {data && data.recent.length > 0 && (
        <Card>
          <CardContent className="py-4">
            <h3 className="font-semibold text-gray-900 mb-3">Recent Check-ins</h3>
            <div className="space-y-2">
              {data.recent.map((c) => (
                <div key={c.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-indigo-50 flex items-center justify-center text-xs font-medium text-indigo-600">
                      {c.name ? c.name.charAt(0).toUpperCase() : "?"}
                    </div>
                    <span className="text-gray-700">{c.name || "Anonymous"}</span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(c.checkedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {loading && !data && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      )}
    </div>
  );
}
