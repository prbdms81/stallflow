"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { MapPin, ArrowLeft, Calendar, Zap, Wifi, Shield, Car, Info, Trophy, Star } from "lucide-react";
import Button from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { formatCurrency, formatDate, getVenueTypeLabel, getEventTypeLabel } from "@/lib/utils";

interface LeaderboardEntry {
  rank: number;
  vendorId: string;
  businessName: string;
  category: string;
  logo: string | null;
  completedEvents: number;
  avgRating: number;
  trustScore: number;
  stallPhotoCount: number;
}

interface VenueDetail {
  id: string;
  name: string;
  type: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  description: string | null;
  capacity: number;
  totalStallSlots: number;
  contactName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  amenities: { id: string; name: string; isAvailable: boolean; charges: number; description: string | null }[];
  parkingSlots: { id: string; type: string; isAvailable: boolean; charges: number }[];
  events: {
    id: string;
    title: string;
    startDate: string;
    endDate: string;
    eventType: string;
    status: string;
    maxStalls: number;
    bookedStalls: number;
    basePrice: number;
  }[];
}

export default function VenueDetailPage() {
  const params = useParams();
  const [venue, setVenue] = useState<VenueDetail | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const venueId = params.venueId;
    Promise.all([
      fetch(`/api/venues?id=${venueId}`).then((r) => r.json()),
      fetch(`/api/venues/${venueId}/leaderboard`).then((r) => r.json()),
    ])
      .then(([venueData, lbData]) => {
        setVenue(venueData.venue || null);
        setLeaderboard(lbData.leaderboard || []);
      })
      .catch(() => setVenue(null))
      .finally(() => setLoading(false));
  }, [params.venueId]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 animate-pulse">
        <div className="h-64 bg-gray-200 rounded-xl mb-6" />
        <div className="h-8 bg-gray-200 rounded w-1/3" />
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold mb-2">Venue not found</h2>
        <Link href="/venues"><Button variant="outline">Browse Venues</Button></Link>
      </div>
    );
  }

  const upcomingEvents = venue.events.filter((e) => e.status === "PUBLISHED" || e.status === "LIVE");
  const pastEvents = venue.events.filter((e) => e.status === "COMPLETED");
  const lastEvent = pastEvents.length > 0 ? pastEvents[pastEvents.length - 1] : null;

  const amenityIcons: Record<string, React.ReactNode> = {
    "Power Supply": <Zap className="h-5 w-5" />,
    "Wi-Fi": <Wifi className="h-5 w-5" />,
    Security: <Shield className="h-5 w-5" />,
    Parking: <Car className="h-5 w-5" />,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href="/venues" className="inline-flex items-center text-sm text-gray-500 hover:text-indigo-600 mb-6">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Venues
      </Link>

      {/* Hero */}
      <div className="h-64 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-end p-8 mb-8">
        <div>
          <Badge variant="info" className="mb-2">{getVenueTypeLabel(venue.type)}</Badge>
          <h1 className="text-3xl font-bold text-white">{venue.name}</h1>
          <p className="text-white/80 flex items-center mt-1">
            <MapPin className="h-4 w-4 mr-1" />
            {venue.address}, {venue.city}, {venue.state} - {venue.pincode}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {venue.description && (
            <Card>
              <CardContent>
                <h3 className="font-semibold text-gray-900 mb-2">About</h3>
                <p className="text-gray-600 text-sm">{venue.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Amenities */}
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-gray-900">Amenities for Vendors</h3>
            </CardHeader>
            <CardContent>
              {venue.amenities.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {venue.amenities.map((a) => (
                    <div key={a.id} className={`flex items-start space-x-3 p-3 rounded-lg ${a.isAvailable ? "bg-green-50" : "bg-gray-50"}`}>
                      <div className={`${a.isAvailable ? "text-green-600" : "text-gray-400"}`}>
                        {amenityIcons[a.name] || <Info className="h-5 w-5" />}
                      </div>
                      <div>
                        <div className={`font-medium text-sm ${a.isAvailable ? "text-gray-900" : "text-gray-400"}`}>{a.name}</div>
                        {a.description && <div className="text-xs text-gray-500">{a.description}</div>}
                        {a.charges > 0 && <div className="text-xs text-indigo-600">{formatCurrency(a.charges)} extra charge</div>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No amenity information available.</p>
              )}
            </CardContent>
          </Card>

          {/* Parking */}
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-gray-900">Vendor Parking</h3>
            </CardHeader>
            <CardContent>
              {venue.parkingSlots.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {["TWO_WHEELER", "FOUR_WHEELER", "VAN", "TRUCK"].map((type) => {
                    const slots = venue.parkingSlots.filter((s) => s.type === type);
                    if (slots.length === 0) return null;
                    const available = slots.filter((s) => s.isAvailable).length;
                    return (
                      <div key={type} className="text-center p-4 bg-gray-50 rounded-lg">
                        <Car className="h-6 w-6 mx-auto mb-2 text-indigo-600" />
                        <div className="font-medium text-sm">{type.replace("_", " ")}</div>
                        <div className="text-xs text-gray-500">{available}/{slots.length} available</div>
                        {slots[0].charges > 0 && (
                          <div className="text-xs text-indigo-600 mt-1">{formatCurrency(slots[0].charges)}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No parking information available.</p>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-gray-900">Upcoming Events at This Venue</h3>
            </CardHeader>
            <CardContent>
              {upcomingEvents.length > 0 ? (
                <div className="space-y-3">
                  {upcomingEvents.map((ev) => (
                    <Link key={ev.id} href={`/events/${ev.id}`} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <div>
                        <div className="font-medium text-sm">{ev.title}</div>
                        <div className="text-xs text-gray-500">{formatDate(ev.startDate)} - {getEventTypeLabel(ev.eventType)}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-indigo-600">{formatCurrency(ev.basePrice)}</div>
                        <div className="text-xs text-gray-500">{ev.maxStalls - ev.bookedStalls} stalls left</div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No upcoming events at this venue.</p>
              )}
            </CardContent>
          </Card>

          {/* Last Event */}
          {lastEvent && (
            <Card>
              <CardContent>
                <h3 className="font-semibold text-gray-900 mb-2">Last Event at This Venue</h3>
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                  <span className="font-medium">{lastEvent.title}</span>
                  <span className="mx-2">-</span>
                  <span>{formatDate(lastEvent.startDate)}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Top Vendors Leaderboard */}
          {leaderboard.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Trophy className="h-5 w-5 text-amber-500" />
                  <h3 className="font-semibold text-gray-900">Top Vendors Here</h3>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {leaderboard.slice(0, 5).map((vendor) => (
                    <Link
                      key={vendor.vendorId}
                      href={`/vendors/${vendor.vendorId}`}
                      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      {/* Rank badge */}
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        vendor.rank === 1 ? "bg-amber-100 text-amber-700" :
                        vendor.rank === 2 ? "bg-gray-100 text-gray-600" :
                        vendor.rank === 3 ? "bg-orange-100 text-orange-600" :
                        "bg-indigo-50 text-indigo-600"
                      }`}>
                        {vendor.rank}
                      </div>
                      {/* Logo / avatar */}
                      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 overflow-hidden">
                        {vendor.logo ? (
                          <img src={vendor.logo} alt={vendor.businessName} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-indigo-600 font-bold text-sm">{vendor.businessName[0]}</span>
                        )}
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-gray-900 truncate">{vendor.businessName}</div>
                        <div className="text-xs text-gray-500">{vendor.category}</div>
                      </div>
                      {/* Stats */}
                      <div className="text-right shrink-0">
                        <div className="flex items-center text-xs text-amber-600 justify-end">
                          <Star className="h-3 w-3 mr-0.5 fill-amber-400 text-amber-400" />
                          {vendor.avgRating > 0 ? vendor.avgRating.toFixed(1) : "—"}
                        </div>
                        <div className="text-xs text-gray-400">{vendor.completedEvents} events</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardContent className="space-y-3">
              <h3 className="font-semibold text-gray-900">Venue Info</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Type</span>
                  <span>{getVenueTypeLabel(venue.type)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Capacity</span>
                  <span>{venue.capacity} people</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Stall Slots</span>
                  <span>{venue.totalStallSlots} max</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Events</span>
                  <span>{venue.events.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {(venue.contactName || venue.contactEmail || venue.contactPhone) && (
            <Card>
              <CardContent>
                <h3 className="font-semibold text-gray-900 mb-3">Contact</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  {venue.contactName && <div>{venue.contactName}</div>}
                  {venue.contactEmail && <div>{venue.contactEmail}</div>}
                  {venue.contactPhone && <div>{venue.contactPhone}</div>}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
