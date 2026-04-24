"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Calendar, Users, CreditCard, Plus, Eye, MessageCircle, Copy, Check, Link2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { formatCurrency, formatDate, getEventTypeLabel } from "@/lib/utils";
import toast from "react-hot-toast";

interface DashboardEvent {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  eventType: string;
  status: string;
  maxStalls: number;
  bookedStalls: number;
  basePrice: number;
  viewCount: number;
  shareToken: string | null;
  venue: { name: string; city: string };
}

interface Booking {
  id: string;
  bookingNumber: string;
  status: string;
  totalAmount: number;
  paymentStatus: string;
  createdAt: string;
  vendor: { name: string; email: string };
  stall: { stallNumber: string };
  event: { title: string; startDate: string; venue: { name: string; city: string } };
}

export default function ManagerDashboard() {
  const [events, setEvents] = useState<DashboardEvent[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [, setLoading] = useState(true);
  const [generatingToken, setGeneratingToken] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/events?status=DRAFT,PUBLISHED,LIVE").then((r) => r.json()),
      fetch("/api/bookings").then((r) => r.json()),
    ])
      .then(([evData, bkData]) => {
        setEvents(evData.events || []);
        setBookings(bkData.bookings || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalRevenue = bookings
    .filter((b) => b.paymentStatus === "PAID")
    .reduce((sum, b) => sum + b.totalAmount, 0);

  const totalBookings = bookings.length;
  const totalViews = events.reduce((sum, e) => sum + e.viewCount, 0);

  const generateShareLink = async (event: DashboardEvent) => {
    if (event.shareToken) {
      // Already has token, share directly
      shareViaWhatsApp(event, event.shareToken);
      return;
    }

    setGeneratingToken(event.id);
    try {
      const res = await fetch(`/api/events/${event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ generateShareToken: true }),
      });

      const data = await res.json();
      if (data.shareToken) {
        // Update local state
        setEvents((prev) =>
          prev.map((e) => (e.id === event.id ? { ...e, shareToken: data.shareToken } : e))
        );
        shareViaWhatsApp(event, data.shareToken);
      } else {
        toast.error("Failed to generate share link");
      }
    } catch {
      toast.error("Failed to generate share link");
    } finally {
      setGeneratingToken(null);
    }
  };

  const shareViaWhatsApp = (event: DashboardEvent, token: string) => {
    const bookUrl = `${window.location.origin}/book/${token}`;
    const stallsLeft = event.maxStalls - event.bookedStalls;
    const message = [
      `${event.title}`,
      `${event.venue.name}, ${event.venue.city}`,
      `${formatDate(event.startDate)}`,
      `Stalls from ${formatCurrency(event.basePrice)}`,
      ``,
      `${stallsLeft} stalls available!`,
      `Book now (no app needed):`,
      bookUrl,
    ].join("\n");

    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
  };

  const copyShareLink = (event: DashboardEvent) => {
    if (!event.shareToken) return;
    const url = `${window.location.origin}/book/${event.shareToken}`;
    navigator.clipboard.writeText(url);
    setCopiedId(event.id);
    toast.success("Link copied!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Event Manager Dashboard</h1>
          <p className="text-gray-500">Manage your events and track bookings</p>
        </div>
        <Link href="/dashboard/manager/events/new">
          <Button>
            <Plus className="h-4 w-4 mr-1" /> Create Event
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Active Events",
            value: events.filter((e) => ["PUBLISHED", "LIVE"].includes(e.status)).length,
            icon: Calendar,
            color: "text-indigo-600 bg-indigo-50",
          },
          { label: "Total Bookings", value: totalBookings, icon: Users, color: "text-green-600 bg-green-50" },
          { label: "Revenue", value: formatCurrency(totalRevenue), icon: CreditCard, color: "text-purple-600 bg-purple-50" },
          { label: "Event Views", value: totalViews, icon: Eye, color: "text-orange-600 bg-orange-50" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center space-x-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-sm text-gray-500">{stat.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* My Events */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-900">My Events</h2>
        </CardHeader>
        <CardContent>
          {events.length > 0 ? (
            <div className="divide-y">
              {events.map((event) => (
                <div key={event.id} className="py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{event.title}</span>
                        <Badge
                          variant={
                            event.status === "PUBLISHED"
                              ? "info"
                              : event.status === "LIVE"
                              ? "success"
                              : "default"
                          }
                        >
                          {event.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-500">
                        {event.venue.name}, {event.venue.city} | {formatDate(event.startDate)} |{" "}
                        {getEventTypeLabel(event.eventType)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {event.bookedStalls}/{event.maxStalls} booked
                      </div>
                      <Link
                        href={`/dashboard/manager/events/${event.id}/stalls`}
                        className="text-xs text-indigo-600 hover:underline"
                      >
                        Manage Stalls
                      </Link>
                    </div>
                  </div>

                  {/* WhatsApp share row */}
                  {event.status === "PUBLISHED" && (
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => generateShareLink(event)}
                        disabled={generatingToken === event.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        {generatingToken === event.id ? "Generating..." : "Share on WhatsApp"}
                      </button>

                      {event.shareToken && (
                        <button
                          onClick={() => copyShareLink(event)}
                          className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-lg text-xs font-medium transition-colors"
                        >
                          {copiedId === event.id ? (
                            <Check className="h-3.5 w-3.5 text-green-500" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                          Copy Link
                        </button>
                      )}

                      {event.shareToken && (
                        <Link
                          href={`/book/${event.shareToken}`}
                          target="_blank"
                          className="flex items-center gap-1 text-xs text-gray-400 hover:text-indigo-600"
                        >
                          <Link2 className="h-3 w-3" /> Preview
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No events yet. Create your first event!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Bookings */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-900">Recent Bookings</h2>
        </CardHeader>
        <CardContent>
          {bookings.length > 0 ? (
            <div className="divide-y">
              {bookings.slice(0, 5).map((booking) => (
                <div key={booking.id} className="flex items-center justify-between py-3">
                  <div>
                    <div className="font-medium text-sm">{booking.vendor.name}</div>
                    <div className="text-xs text-gray-500">
                      {booking.event.title} | Stall #{booking.stall.stallNumber} |{" "}
                      {formatDate(booking.createdAt)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{formatCurrency(booking.totalAmount)}</div>
                    <Badge variant={booking.paymentStatus === "PAID" ? "success" : "warning"}>
                      {booking.paymentStatus}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-8 text-gray-500">No bookings yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
