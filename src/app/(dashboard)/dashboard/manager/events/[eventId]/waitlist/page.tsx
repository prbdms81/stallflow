"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Bell, Clock, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import toast from "react-hot-toast";

interface WaitlistEntry {
  id: string;
  category: string | null;
  notified: boolean;
  createdAt: string;
  vendor: { id: string; name: string; email: string };
}

export default function WaitlistManagerPage() {
  const params = useParams();
  const eventId = params.eventId as string;

  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [notifying, setNotifying] = useState(false);

  const fetchEntries = useCallback(async () => {
    try {
      const res = await fetch(`/api/waitlist?eventId=${eventId}`);
      const data = await res.json();
      setEntries(data.entries || []);
    } catch {
      toast.error("Failed to load waitlist");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  const handleNotifyAll = async () => {
    setNotifying(true);
    try {
      const res = await fetch("/api/waitlist/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`Notified ${data.count} vendor${data.count !== 1 ? "s" : ""}`);
      fetchEntries();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to notify");
    } finally {
      setNotifying(false);
    }
  };

  const unnotifiedCount = entries.filter((e) => !e.notified).length;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href={`/dashboard/manager/events/${eventId}`}>
            <ArrowLeft className="h-5 w-5 text-gray-500 hover:text-gray-700" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              Waitlist
              {entries.length > 0 && (
                <span className="bg-indigo-100 text-indigo-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                  {entries.length}
                </span>
              )}
            </h1>
            <p className="text-sm text-gray-500">Vendors waiting for a stall to open</p>
          </div>
        </div>

        {unnotifiedCount > 0 && (
          <Button onClick={handleNotifyAll} disabled={notifying} size="sm">
            <Bell className="h-4 w-4 mr-2" />
            {notifying ? "Notifying..." : `Notify All (${unnotifiedCount})`}
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">No vendors on the waitlist yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {entries.map((entry, idx) => (
            <Card key={entry.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-semibold">
                    {idx + 1}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{entry.vendor.name}</div>
                    <div className="text-sm text-gray-500">{entry.vendor.email}</div>
                    {entry.category && (
                      <span className="inline-block mt-1 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {entry.category}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <div className="flex items-center text-xs text-gray-400 justify-end">
                    <Clock className="h-3 w-3 mr-1" />
                    {new Date(entry.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                  </div>
                  {entry.notified ? (
                    <span className="inline-flex items-center text-xs text-green-600 font-medium">
                      <Bell className="h-3 w-3 mr-1" /> Notified
                    </span>
                  ) : (
                    <span className="text-xs text-orange-500 font-medium">Pending notify</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
