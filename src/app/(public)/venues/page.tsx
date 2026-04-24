"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MapPin, Building2, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { getVenueTypeLabel } from "@/lib/utils";

interface Venue {
  id: string;
  name: string;
  slug: string;
  type: string;
  address: string;
  city: string;
  state: string;
  description: string | null;
  capacity: number;
  totalStallSlots: number;
  amenities: { name: string; isAvailable: boolean }[];
  _count: { events: number };
}

export default function VenuesPage() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/venues")
      .then((res) => res.json())
      .then((data) => setVenues(data.venues || []))
      .catch(() => setVenues([]))
      .finally(() => setLoading(false));
  }, []);

  const venueGradients = [
    "bg-gradient-to-br from-emerald-400 to-teal-500",
    "bg-gradient-to-br from-blue-400 to-indigo-500",
    "bg-gradient-to-br from-purple-400 to-pink-500",
    "bg-gradient-to-br from-orange-400 to-red-500",
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Venues</h1>
        <p className="text-gray-600 mt-1">Explore event venues across Hyderabad</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-48 bg-gray-200" />
              <CardContent><div className="h-5 bg-gray-200 rounded w-3/4" /></CardContent>
            </Card>
          ))}
        </div>
      ) : venues.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {venues.map((venue, i) => (
            <Link key={venue.id} href={`/venues/${venue.id}`}>
              <Card hover>
                <div className={`h-48 ${venueGradients[i % venueGradients.length]} flex items-end p-4`}>
                  <Badge variant="info">{getVenueTypeLabel(venue.type)}</Badge>
                </div>
                <CardContent>
                  <h3 className="font-semibold text-gray-900 mb-1">{venue.name}</h3>
                  <div className="flex items-center text-sm text-gray-500 mb-2">
                    <MapPin className="h-3.5 w-3.5 mr-1" />
                    {venue.city}, {venue.state}
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {venue.amenities.slice(0, 3).map((a) => (
                      <span key={a.name} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {a.name}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center text-gray-500">
                      <Building2 className="h-3.5 w-3.5 mr-1" />
                      {venue.totalStallSlots} stall slots
                    </span>
                    <span className="flex items-center text-gray-500">
                      <Calendar className="h-3.5 w-3.5 mr-1" />
                      {venue._count.events} events
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900">No venues yet</h3>
          <p className="text-gray-500">Check back soon for venue listings.</p>
        </div>
      )}
    </div>
  );
}
