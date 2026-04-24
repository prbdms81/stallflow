"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Calendar, ShoppingBag, CreditCard, TrendingUp, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import VendorScoreCard from "@/components/ui/VendorScoreCard";

interface Booking {
  id: string;
  bookingNumber: string;
  status: string;
  totalAmount: number;
  paymentStatus: string;
  createdAt: string;
  event: { id: string; title: string; startDate: string; venue: { name: string; city: string } };
  stall: { stallNumber: string; type: string; size: string };
}

export default function VendorDashboard() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/bookings")
      .then((res) => res.json())
      .then((data) => setBookings(data.bookings || []))
      .catch(() => setBookings([]))
      .finally(() => setLoading(false));
  }, []);

  const confirmed = bookings.filter((b) => b.status === "CONFIRMED").length;
  const pending = bookings.filter((b) => b.status === "PENDING").length;
  const totalSpent = bookings
    .filter((b) => b.paymentStatus === "PAID")
    .reduce((sum, b) => sum + b.totalAmount, 0);

  const statusVariant = (s: string) =>
    s === "CONFIRMED" ? "success" : s === "PENDING" ? "warning" : s === "CANCELLED" ? "danger" : "default";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Vendor Dashboard</h1>
        <p className="text-gray-500">Manage your stall bookings</p>
      </div>

      {/* Stallmate Score */}
      <VendorScoreCard />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Bookings", value: bookings.length, icon: ShoppingBag, color: "text-indigo-600 bg-indigo-50" },
          { label: "Confirmed", value: confirmed, icon: Calendar, color: "text-green-600 bg-green-50" },
          { label: "Pending", value: pending, icon: CreditCard, color: "text-yellow-600 bg-yellow-50" },
          { label: "Total Spent", value: formatCurrency(totalSpent), icon: TrendingUp, color: "text-purple-600 bg-purple-50" },
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

      {/* Recent Bookings */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <h2 className="font-semibold text-gray-900">Recent Bookings</h2>
          <Link href="/dashboard/vendor/bookings" className="text-sm text-indigo-600 hover:underline flex items-center">
            View All <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse flex justify-between py-3">
                  <div className="h-5 bg-gray-200 rounded w-1/3" />
                  <div className="h-5 bg-gray-200 rounded w-1/6" />
                </div>
              ))}
            </div>
          ) : bookings.length > 0 ? (
            <div className="divide-y">
              {bookings.slice(0, 5).map((booking) => (
                <div key={booking.id} className="flex items-center justify-between py-3">
                  <div>
                    <div className="font-medium text-sm text-gray-900">{booking.event.title}</div>
                    <div className="text-xs text-gray-500">
                      Stall #{booking.stall.stallNumber} | {booking.event.venue.name}, {booking.event.venue.city}
                    </div>
                    <div className="text-xs text-gray-400">{formatDate(booking.event.startDate)}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-sm">{formatCurrency(booking.totalAmount)}</div>
                    <Badge variant={statusVariant(booking.status)}>{booking.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <ShoppingBag className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p>No bookings yet.</p>
              <Link href="/events" className="text-indigo-600 hover:underline text-sm mt-1 inline-block">
                Browse Events
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Action */}
      <Card className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-0">
        <CardContent className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg">Find Your Next Event</h3>
            <p className="text-indigo-100 text-sm">Browse upcoming events and book your stall today.</p>
          </div>
          <Link href="/events">
            <button className="bg-white text-indigo-600 px-4 py-2 rounded-lg font-medium text-sm hover:bg-indigo-50 transition-colors">
              Browse Events
            </button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
