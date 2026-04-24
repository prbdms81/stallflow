"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, MapPin, Users, Calendar, Star, Zap,
  Car, Wifi, Shield, Phone, Building2, ShieldCheck,
  TrendingUp, X, ChevronDown, ChevronUp, Clock,
  Image as ImageIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { formatDate, formatCurrency } from "@/lib/utils";

interface TopVendor {
  userId: string;
  profileId: string;
  name: string;
  businessName: string;
  category: string;
  logo: string | null;
  avatar: string | null;
  rating: number;
  trustScore: number;
  isTrusted: boolean;
  eventsHere: number;
}

interface EventItem {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  eventType: string;
  status: string;
  basePrice: number;
  maxStalls: number;
  bookedStalls: number;
  categoryName: string;
  avgRating: number | null;
  vendorCount: number;
}

interface CommunityDetail {
  id: string;
  name: string;
  type: string;
  address: string;
  area: string | null;
  city: string;
  state: string;
  description: string | null;
  images: string[];
  capacity: number;
  totalStallSlots: number;
  familyCount: number;
  employeeCount: number;
  vendorRating: number;
  totalReviews: number;
  eventFrequency: string | null;
  bestCategories: string | null;
  powerSupply: string | null;
  parkingNotes: string | null;
  smartScore: number;
  avgSpendPerVisit: number;
  contactName: string | null;
  contactPhone: string | null;
  amenities: { name: string; isAvailable: boolean; charges: number }[];
  events: EventItem[];
  topVendors: TopVendor[];
  _count: { events: number };
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  WEEKDAY_CORPORATE: "Corporate",
  WEEKEND_COMMUNITY: "Community",
  WEDDING: "Wedding",
  EXHIBITION: "Exhibition",
  FESTIVAL: "Festival",
};

function SmartScoreRing({ score }: { score: number }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const color = score >= 75 ? "#16a34a" : score >= 50 ? "#2563eb" : score >= 25 ? "#f59e0b" : "#9ca3af";

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-24 h-24">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 96 96">
          <circle cx="48" cy="48" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="6" />
          <circle
            cx="48" cy="48" r={radius} fill="none"
            stroke={color} strokeWidth="6" strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-gray-900">{score.toFixed(0)}</span>
        </div>
      </div>
      <span className="text-xs text-gray-500 mt-1">Smart Score</span>
    </div>
  );
}

export default function CommunityDetailPage() {
  const { venueId } = useParams();
  const [community, setCommunity] = useState<CommunityDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [showPastEvents, setShowPastEvents] = useState(false);
  const [eventTab, setEventTab] = useState<"upcoming" | "past">("upcoming");

  useEffect(() => {
    fetch(`/api/venues?id=${venueId}`)
      .then((r) => r.json())
      .then((d) => setCommunity(d.venue || null))
      .catch(() => setCommunity(null))
      .finally(() => setLoading(false));
  }, [venueId]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-48 bg-gray-200 rounded-xl" />
          <div className="h-6 bg-gray-200 rounded w-1/3" />
        </div>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-semibold text-gray-900">Community not found</h2>
        <Link href="/communities" className="text-indigo-600 mt-2 inline-block">
          Back to directory
        </Link>
      </div>
    );
  }

  const bestCats: string[] = community.bestCategories
    ? JSON.parse(community.bestCategories)
    : [];
  const people =
    community.familyCount > 0
      ? { count: community.familyCount.toLocaleString(), label: "Families" }
      : community.employeeCount > 0
      ? { count: community.employeeCount.toLocaleString(), label: "Employees" }
      : null;

  const now = new Date();
  const upcomingEvents = community.events.filter(
    (e) => e.status === "PUBLISHED" && new Date(e.startDate) > now
  );
  const pastEvents = community.events.filter(
    (e) => e.status === "COMPLETED" || new Date(e.endDate) < now
  );
  const displayedPastEvents = showPastEvents ? pastEvents : pastEvents.slice(0, 5);

  const typeLabel =
    community.type === "GATED_COMMUNITY"
      ? "Gated Community"
      : community.type === "CORPORATE_OFFICE"
      ? "Corporate Office"
      : community.type === "CONVENTION_CENTER"
      ? "Convention Center"
      : community.type;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <Link
        href="/communities"
        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-1" /> All Communities
      </Link>

      {/* ── Header ── */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-6 sm:p-8 text-white mb-8">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <Badge variant="info" className="mb-2">
              {typeLabel}
            </Badge>
            <h1 className="text-2xl sm:text-3xl font-bold">{community.name}</h1>
            <p className="text-emerald-100 mt-1 flex items-center">
              <MapPin className="h-4 w-4 mr-1 flex-shrink-0" /> {community.address},{" "}
              {community.area || community.city}
            </p>
            {community.description && (
              <p className="text-white/80 mt-3 text-sm leading-relaxed">
                {community.description}
              </p>
            )}
          </div>
          {community.smartScore > 0 && (
            <div className="flex-shrink-0 ml-4 hidden sm:block">
              <SmartScoreRing score={community.smartScore} />
            </div>
          )}
        </div>
      </div>

      {/* ── Photo Gallery ── */}
      {community.images.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-emerald-500" /> Photos
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {community.images.map((img, i) => (
              <button
                key={i}
                onClick={() => setSelectedPhoto(img)}
                className="aspect-[4/3] rounded-xl overflow-hidden bg-gray-100 hover:opacity-90 transition-opacity"
              >
                <img
                  src={img}
                  alt={`${community.name} photo ${i + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Photo Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <button
            onClick={() => setSelectedPhoto(null)}
            className="absolute top-4 right-4 text-white bg-black/40 rounded-full p-2"
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={selectedPhoto}
            alt="Venue photo"
            className="max-w-full max-h-[85vh] rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* ── Key Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {people && (
          <Card>
            <CardContent className="text-center py-4">
              <Users className="h-5 w-5 text-indigo-500 mx-auto mb-1" />
              <div className="text-lg font-bold text-gray-900">{people.count}</div>
              <div className="text-xs text-gray-500">{people.label}</div>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardContent className="text-center py-4">
            <Calendar className="h-5 w-5 text-green-500 mx-auto mb-1" />
            <div className="text-lg font-bold text-gray-900">
              {community._count?.events || community.events.length}
            </div>
            <div className="text-xs text-gray-500">Total Events</div>
          </CardContent>
        </Card>
        {community.vendorRating > 0 && (
          <Card>
            <CardContent className="text-center py-4">
              <Star className="h-5 w-5 text-amber-500 mx-auto mb-1 fill-current" />
              <div className="text-lg font-bold text-gray-900">
                {community.vendorRating.toFixed(1)}
              </div>
              <div className="text-xs text-gray-500">
                Vendor Rating{community.totalReviews > 0 && ` (${community.totalReviews})`}
              </div>
            </CardContent>
          </Card>
        )}
        {community.avgSpendPerVisit > 0 && (
          <Card>
            <CardContent className="text-center py-4">
              <TrendingUp className="h-5 w-5 text-rose-500 mx-auto mb-1" />
              <div className="text-lg font-bold text-gray-900">
                {formatCurrency(community.avgSpendPerVisit)}
              </div>
              <div className="text-xs text-gray-500">Avg Spend/Visit</div>
            </CardContent>
          </Card>
        )}
        {/* Mobile smart score */}
        {community.smartScore > 0 && (
          <Card className="sm:hidden">
            <CardContent className="text-center py-4">
              <div className="text-lg font-bold text-gray-900">
                {community.smartScore.toFixed(0)}/100
              </div>
              <div className="text-xs text-gray-500">Smart Score</div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ── Best Categories ── */}
      {bestCats.length > 0 && (
        <Card className="mb-8">
          <CardContent className="py-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Best Selling Categories Here
            </h3>
            <div className="flex flex-wrap gap-2">
              {bestCats.map((cat) => (
                <Badge key={cat} variant="success">
                  {cat}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Top Vendors ── */}
      {community.topVendors.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-500" />
            Top Vendors Here ({community.topVendors.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {community.topVendors.map((vendor) => (
              <Link key={vendor.userId} href={`/vendors/${vendor.profileId}`}>
                <Card hover>
                  <CardContent className="py-3">
                    <div className="flex items-center gap-3">
                      {vendor.logo || vendor.avatar ? (
                        <img
                          src={vendor.logo || vendor.avatar || ""}
                          alt={vendor.businessName}
                          className="h-10 w-10 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-emerald-600">
                            {vendor.businessName.charAt(0)}
                          </span>
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-gray-900 text-sm truncate">
                            {vendor.businessName}
                          </span>
                          {vendor.isTrusted && (
                            <ShieldCheck className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                          <span>{vendor.category}</span>
                          <span className="flex items-center gap-0.5">
                            <Star className="h-3 w-3 text-amber-500 fill-current" />
                            {vendor.rating.toFixed(1)}
                          </span>
                          <span>
                            {vendor.eventsHere} event{vendor.eventsHere !== 1 ? "s" : ""} here
                          </span>
                        </div>
                      </div>
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
                          vendor.trustScore >= 80
                            ? "bg-green-100 text-green-700"
                            : vendor.trustScore >= 60
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {vendor.trustScore}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Vendor Tips ── */}
      <Card className="mb-8">
        <CardContent className="py-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Vendor Tips</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            {community.eventFrequency && (
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-600">
                  Events: <strong>{community.eventFrequency}</strong>
                </span>
              </div>
            )}
            {community.powerSupply && (
              <div className="flex items-start gap-2">
                <Zap className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-600">
                  Power: <strong>{community.powerSupply}</strong>
                </span>
              </div>
            )}
            {community.parkingNotes && (
              <div className="flex items-start gap-2">
                <Car className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-600">
                  Parking: <strong>{community.parkingNotes}</strong>
                </span>
              </div>
            )}
            {community.contactPhone && (
              <div className="flex items-start gap-2">
                <Phone className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <span className="text-gray-600">
                  Contact: {community.contactName} — {community.contactPhone}
                </span>
              </div>
            )}
            {community.totalStallSlots > 0 && (
              <div className="flex items-start gap-2">
                <Building2 className="h-4 w-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-600">
                  Capacity: <strong>{community.totalStallSlots} stall slots</strong>
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Amenities ── */}
      {community.amenities.length > 0 && (
        <Card className="mb-8">
          <CardContent className="py-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Amenities</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {community.amenities.map((a) => (
                <div
                  key={a.name}
                  className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${
                    a.isAvailable
                      ? "bg-green-50 text-green-700"
                      : "bg-gray-50 text-gray-400"
                  }`}
                >
                  {a.name === "Wi-Fi" ? (
                    <Wifi className="h-3.5 w-3.5" />
                  ) : a.name === "Security" ? (
                    <Shield className="h-3.5 w-3.5" />
                  ) : a.name === "Power Supply" ? (
                    <Zap className="h-3.5 w-3.5" />
                  ) : (
                    <Building2 className="h-3.5 w-3.5" />
                  )}
                  {a.name}
                  {a.charges > 0 && (
                    <span className="text-xs ml-auto">{formatCurrency(a.charges)}</span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Events (Tabbed: Upcoming / Past) ── */}
      <div>
        <div className="flex items-center gap-4 mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Events</h2>
          <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
            <button
              onClick={() => setEventTab("upcoming")}
              className={`px-4 py-1.5 ${
                eventTab === "upcoming"
                  ? "bg-emerald-500 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              Upcoming ({upcomingEvents.length})
            </button>
            <button
              onClick={() => setEventTab("past")}
              className={`px-4 py-1.5 ${
                eventTab === "past"
                  ? "bg-emerald-500 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              Past ({pastEvents.length})
            </button>
          </div>
        </div>

        {eventTab === "upcoming" ? (
          upcomingEvents.length > 0 ? (
            <div className="space-y-3">
              {upcomingEvents.map((event) => (
                <Link key={event.id} href={`/events/${event.id}`}>
                  <Card hover className="mb-3">
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">{event.title}</h4>
                          <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                            <span>{formatDate(event.startDate)}</span>
                            <span>{formatCurrency(event.basePrice)}/stall</span>
                            <Badge variant="info">
                              {EVENT_TYPE_LABELS[event.eventType] || event.eventType}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-sm font-medium text-indigo-600">
                            {event.maxStalls - event.bookedStalls} stalls left
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Calendar className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm">No upcoming events at this community</p>
            </div>
          )
        ) : pastEvents.length > 0 ? (
          <div className="space-y-3">
            {displayedPastEvents.map((event) => (
              <Link key={event.id} href={`/events/${event.id}`}>
                <Card hover className="mb-3">
                  <CardContent className="py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900 text-sm">{event.title}</h4>
                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                          <span>{formatDate(event.startDate)}</span>
                          <span>{event.categoryName}</span>
                          <Badge variant="info">
                            {EVENT_TYPE_LABELS[event.eventType] || event.eventType}
                          </Badge>
                          {event.vendorCount > 0 && (
                            <span>{event.vendorCount} vendors</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        {event.avgRating && (
                          <span className="flex items-center gap-0.5 text-sm text-amber-500">
                            <Star className="h-3.5 w-3.5 fill-current" />
                            {event.avgRating}
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
            {pastEvents.length > 5 && (
              <button
                onClick={() => setShowPastEvents(!showPastEvents)}
                className="flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700 font-medium mx-auto"
              >
                {showPastEvents ? (
                  <>
                    Show less <ChevronUp className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    Show all {pastEvents.length} past events{" "}
                    <ChevronDown className="h-4 w-4" />
                  </>
                )}
              </button>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <Calendar className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">No past events recorded</p>
          </div>
        )}
      </div>
    </div>
  );
}
