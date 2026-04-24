"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  ArrowLeftRight, MapPin, Calendar, Loader2, Zap,
  MessageCircle, Filter, TrendingDown, AlertTriangle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import toast from "react-hot-toast";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Transfer {
  id: string;
  price: number;
  reason: string | null;
  status: string;
  fromVendorId: string;
  createdAt: string;
  booking: {
    event: { id: string; title: string; startDate: string; endDate: string; venue: { name: string; area: string | null } };
    stall: { stallNumber: string; type: string; size: string; stallCategory: string | null; price: number };
    vendor: { name: string; vendorProfile: { businessName: string } | null };
  };
}

const areas = [
  "All Areas", "Gachibowli", "Kondapur", "Madhapur", "HITEC City",
  "Kukatpally", "Miyapur", "Manikonda", "Narsingi", "Banjara Hills",
  "Jubilee Hills", "Financial District", "Kompally",
];

export default function SwapPage() {
  const { data: session } = useSession();
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [areaFilter, setAreaFilter] = useState("All Areas");

  useEffect(() => {
    fetch("/api/stall-transfers?status=LISTED")
      .then((r) => r.json())
      .then((d) => setTransfers(d.transfers || []))
      .catch(() => setTransfers([]))
      .finally(() => setLoading(false));
  }, []);

  const handleClaim = async (transferId: string) => {
    if (!session) {
      toast.error("Please login to claim a stall");
      return;
    }
    try {
      const res = await fetch("/api/stall-transfers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transferId, action: "claim" }),
      });
      if (res.ok) {
        toast.success("Stall claimed! The vendor will confirm the transfer.");
        setTransfers(transfers.filter((t) => t.id !== transferId));
      } else {
        toast.error("Failed to claim stall");
      }
    } catch {
      toast.error("Something went wrong");
    }
  };

  const shareOnWhatsApp = (t: Transfer) => {
    const discount = Math.round(((t.booking.stall.price - t.price) / t.booking.stall.price) * 100);
    const msg = [
      `🔄 Stall Available — Last Minute Deal!`,
      ``,
      `Event: ${t.booking.event.title}`,
      `Venue: ${t.booking.event.venue.name}${t.booking.event.venue.area ? `, ${t.booking.event.venue.area}` : ""}`,
      `Date: ${formatDate(t.booking.event.startDate)}`,
      `Stall: #${t.booking.stall.stallNumber} (${t.booking.stall.type})`,
      ``,
      `Price: ${formatCurrency(t.price)}${discount > 0 ? ` (${discount}% off!)` : ""}`,
      t.reason ? `Reason: ${t.reason}` : "",
      ``,
      `Grab it on StallMate: ${window.location.origin}/swap`,
    ].filter(Boolean).join("\n");
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const getDaysUntilEvent = (dateStr: string) => {
    const diff = new Date(dateStr).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const filtered = areaFilter === "All Areas"
    ? transfers
    : transfers.filter((t) => t.booking.event.venue.area === areaFilter);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Stall Swap</h1>
        <p className="text-sm text-gray-500">Grab last-minute stalls at discounted prices</p>
      </div>

      {/* How it works banner */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-4 text-white mb-6">
        <div className="flex items-start gap-3">
          <Zap className="h-6 w-6 flex-shrink-0 mt-0.5" />
          <div>
            <h2 className="font-bold">Last-Minute Deals</h2>
            <p className="text-orange-100 text-sm mt-0.5">
              Vendors who can&apos;t attend list their stalls here — often at a discount.
              Grab one before it&apos;s gone!
            </p>
          </div>
        </div>
      </div>

      {/* Area filter */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2 -mx-4 px-4">
        <Filter className="h-4 w-4 text-gray-400 flex-shrink-0" />
        {areas.map((area) => (
          <button
            key={area}
            onClick={() => setAreaFilter(area)}
            className={`whitespace-nowrap px-3 py-2 rounded-full text-xs font-medium transition-colors ${
              areaFilter === area
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {area}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
        </div>
      ) : filtered.length > 0 ? (
        <div className="space-y-4">
          {filtered.map((t) => {
            const daysLeft = getDaysUntilEvent(t.booking.event.startDate);
            const discount = Math.round(((t.booking.stall.price - t.price) / t.booking.stall.price) * 100);
            const isUrgent = daysLeft <= 3;

            return (
              <Card key={t.id} className={isUrgent ? "border-orange-300 bg-orange-50/30" : ""}>
                <CardContent className="py-4">
                  {/* Urgency banner */}
                  {isUrgent && daysLeft > 0 && (
                    <div className="flex items-center gap-1.5 text-orange-600 text-xs font-semibold mb-2">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      {daysLeft === 0 ? "Event is TODAY!" : daysLeft === 1 ? "Event TOMORROW!" : `Only ${daysLeft} days left!`}
                    </div>
                  )}

                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900">{t.booking.event.title}</h3>
                      <div className="flex items-center text-xs text-gray-500 mt-1">
                        <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                        {t.booking.event.venue.name}
                        {t.booking.event.venue.area && <span className="text-gray-400 ml-1">· {t.booking.event.venue.area}</span>}
                      </div>
                      <div className="flex items-center text-xs text-gray-500 mt-0.5">
                        <Calendar className="h-3 w-3 mr-1 flex-shrink-0" />
                        {formatDate(t.booking.event.startDate)}
                      </div>

                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <Badge>#{t.booking.stall.stallNumber}</Badge>
                        <Badge variant="info">{t.booking.stall.type}</Badge>
                        {t.booking.stall.stallCategory && <Badge variant="success">{t.booking.stall.stallCategory}</Badge>}
                      </div>

                      {t.reason && (
                        <p className="text-xs text-gray-400 mt-2 italic">&quot;{t.reason}&quot;</p>
                      )}
                    </div>

                    <div className="text-right flex-shrink-0">
                      <div className="text-xl font-bold text-indigo-600">
                        {formatCurrency(t.price)}
                      </div>
                      {discount > 0 && (
                        <div className="flex items-center justify-end gap-1 mt-0.5">
                          <TrendingDown className="h-3 w-3 text-green-500" />
                          <span className="text-xs font-semibold text-green-600">{discount}% off</span>
                        </div>
                      )}
                      <div className="text-[10px] text-gray-400 line-through">
                        {formatCurrency(t.booking.stall.price)}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                    {session?.user?.id !== t.fromVendorId ? (
                      <Button size="sm" className="flex-1" onClick={() => handleClaim(t.id)}>
                        <ArrowLeftRight className="h-3.5 w-3.5 mr-1" /> Grab This Stall
                      </Button>
                    ) : (
                      <Badge variant="warning">Your listing</Badge>
                    )}
                    <button
                      onClick={() => shareOnWhatsApp(t)}
                      className="flex items-center justify-center gap-1 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-medium transition-colors"
                    >
                      <MessageCircle className="h-3.5 w-3.5" /> Share
                    </button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16">
          <ArrowLeftRight className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900">No stalls available</h3>
          <p className="text-gray-500 text-sm mt-1">
            {areaFilter !== "All Areas"
              ? `No swaps in ${areaFilter}. Try "All Areas".`
              : "Check back later — vendors list stalls here when they can't attend."}
          </p>
          {session && (
            <Link href="/dashboard/vendor/bookings" className="text-indigo-600 text-sm mt-3 inline-block hover:underline">
              Want to list your stall? Go to My Bookings →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
