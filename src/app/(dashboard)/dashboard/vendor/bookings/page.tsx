"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { formatCurrency, formatDate } from "@/lib/utils";
import toast from "react-hot-toast";

interface Booking {
  id: string;
  bookingNumber: string;
  status: string;
  totalAmount: number;
  amount: number;
  tax: number;
  parkingCharges: number;
  paymentStatus: string;
  createdAt: string;
  event: { id: string; title: string; startDate: string; endDate: string; venue: { name: string; city: string } };
  stall: { stallNumber: string; type: string; size: string };
  parkingSlot: { slotNumber: string; type: string } | null;
}

export default function VendorBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    const params = filter ? `?status=${filter}` : "";
    fetch(`/api/bookings${params}`)
      .then((res) => res.json())
      .then((data) => setBookings(data.bookings || []))
      .catch(() => setBookings([]))
      .finally(() => setLoading(false));
  }, [filter]);

  const handleCancel = async (bookingId: string) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;

    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });

      if (res.ok) {
        toast.success("Booking cancelled");
        setBookings(bookings.map((b) => b.id === bookingId ? { ...b, status: "CANCELLED" } : b));
      } else {
        toast.error("Failed to cancel");
      }
    } catch {
      toast.error("Something went wrong");
    }
  };

  const statusVariant = (s: string) =>
    s === "CONFIRMED" ? "success" : s === "PENDING" ? "warning" : s === "CANCELLED" ? "danger" : "default";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
        <p className="text-gray-500">View and manage your stall bookings</p>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {["", "PENDING", "CONFIRMED", "CANCELLED"].map((f) => (
          <button
            key={f}
            onClick={() => { setFilter(f); setLoading(true); }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === f ? "bg-indigo-600 text-white" : "bg-white border text-gray-600 hover:bg-gray-50"
            }`}
          >
            {f || "All"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent><div className="h-20 bg-gray-200 rounded" /></CardContent>
            </Card>
          ))}
        </div>
      ) : bookings.length > 0 ? (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <Card key={booking.id}>
              <CardContent>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">{booking.event.title}</span>
                      <Badge variant={statusVariant(booking.status)}>{booking.status}</Badge>
                    </div>
                    <div className="text-sm text-gray-500">
                      Booking #{booking.bookingNumber} | Stall #{booking.stall.stallNumber} ({booking.stall.type} - {booking.stall.size} ft)
                    </div>
                    <div className="text-sm text-gray-500">
                      {booking.event.venue.name}, {booking.event.venue.city} | {formatDate(booking.event.startDate)}
                    </div>
                    {booking.parkingSlot && (
                      <div className="text-sm text-gray-500">
                        Parking: Slot {booking.parkingSlot.slotNumber} ({booking.parkingSlot.type.replace("_", " ")})
                      </div>
                    )}
                  </div>
                  <div className="text-right space-y-2">
                    <div className="text-xl font-bold text-indigo-600">{formatCurrency(booking.totalAmount)}</div>
                    <div className="text-xs text-gray-500">
                      Payment: <Badge variant={booking.paymentStatus === "PAID" ? "success" : "warning"}>{booking.paymentStatus}</Badge>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Link href={`/events/${booking.event.id}`}>
                        <Button variant="outline" size="sm">View Event</Button>
                      </Link>
                      {booking.status === "PENDING" && (
                        <Button variant="danger" size="sm" onClick={() => handleCancel(booking.id)}>
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12 text-gray-500">
            <p>No bookings found.</p>
            <Link href="/events" className="text-indigo-600 hover:underline text-sm mt-2 inline-block">
              Browse Events
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
