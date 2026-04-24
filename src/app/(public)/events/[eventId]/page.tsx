"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Calendar, Clock, Users, Car, Wifi, Zap, Shield,
  ChevronRight, Star, ArrowLeft, Phone, Mail, Info, History,
  TrendingUp, AlertCircle,
} from "lucide-react";
import Button from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import StallLayout from "@/components/stalls/StallLayout";
import { formatCurrency, formatDate, getEventTypeLabel, getStallTypeLabel, getStatusColor } from "@/lib/utils";
import toast from "react-hot-toast";

interface Stall {
  id: string;
  stallNumber: string;
  name: string | null;
  type: string;
  size: string;
  price: number;
  positionX: number;
  positionY: number;
  width: number;
  height: number;
  status: string;
  amenities: string | null;
  stallCategory: string | null;
}

interface EventDetail {
  id: string;
  title: string;
  description: string | null;
  shortDescription: string | null;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  eventType: string;
  status: string;
  bannerImage: string | null;
  maxStalls: number;
  bookedStalls: number;
  basePrice: number;
  bookingDeadline: string | null;
  cancellationPolicy: string | null;
  parkingInfo: string | null;
  lastEventInfo: string | null;
  stallCategories: string | null;
  terms: string | null;
  isFeatured: boolean;
  viewCount: number;
  category: { name: string; slug: string };
  venue: {
    id: string;
    name: string;
    address: string;
    city: string;
    area: string | null;
    state: string;
    type: string;
    description: string | null;
    amenities: { id: string; name: string; isAvailable: boolean; charges: number }[];
    parkingSlots: { id: string; slotNumber: string; type: string; isAvailable: boolean; charges: number }[];
  };
  organizer: { id: string; name: string; email: string; phone: string | null; company: string | null };
  stalls: Stall[];
  reviews: { id: string; rating: number; comment: string; author: { name: string }; createdAt: string }[];
}

interface RecentVenueEvent {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  eventType: string;
  maxStalls: number;
  bookedStalls: number;
}

interface EventSponsor {
  id: string;
  name: string;
  logoUrl: string | null;
  websiteUrl: string | null;
  tier: string;
  visibility: string | null;
}

interface RoiData {
  stallFee: number;
  avgSales: number;
  avgProfit: number;
  successRate: number;
  sampleSize: number;
  recommendation: "HIGH" | "MEDIUM" | "LOW";
}

export default function EventDetailPage() {
  const params = useParams();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [recentVenueEvents, setRecentVenueEvents] = useState<RecentVenueEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "stalls" | "venue" | "reviews">("overview");
  const [joiningWaitlist, setJoiningWaitlist] = useState(false);
  const [onWaitlist, setOnWaitlist] = useState(false);
  const [roi, setRoi] = useState<RoiData | null>(null);
  const [roiLoading, setRoiLoading] = useState(false);
  const [sponsors, setSponsors] = useState<EventSponsor[]>([]);
  const [venueDemand, setVenueDemand] = useState<{ category: string; count: number }[]>([]);
  const [totalVotes, setTotalVotes] = useState(0);

  useEffect(() => {
    fetch(`/api/events/${params.eventId}`)
      .then((res) => res.json())
      .then((data) => {
        setEvent(data.event || null);
        setRecentVenueEvents(data.recentVenueEvents || []);
        if (data.event?.venue?.id) {
          fetch(`/api/demand-votes?venueId=${data.event.venue.id}`)
            .then((r) => r.json())
            .then((d) => {
              setVenueDemand(d.grouped || []);
              setTotalVotes(d.totalVotes || 0);
            })
            .catch(() => {});
        }
      })
      .catch(() => setEvent(null))
      .finally(() => setLoading(false));
  }, [params.eventId]);

  useEffect(() => {
    if (!params.eventId) return;
    setRoiLoading(true);
    fetch(`/api/event-roi?eventId=${params.eventId}`)
      .then((r) => r.json())
      .then((d) => { if (!d.error) setRoi(d); })
      .catch(() => {})
      .finally(() => setRoiLoading(false));
    fetch(`/api/events/${params.eventId}/sponsors`)
      .then((r) => r.json())
      .then((d) => setSponsors(d.sponsors || []))
      .catch(() => {});
  }, [params.eventId]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-64 bg-gray-200 rounded-xl" />
          <div className="h-8 bg-gray-200 rounded w-1/2" />
          <div className="h-4 bg-gray-200 rounded w-3/4" />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Event not found</h2>
        <p className="text-gray-600 mb-4">This event may have been removed or doesn&apos;t exist.</p>
        <Link href="/events"><Button variant="outline">Browse Events</Button></Link>
      </div>
    );
  }

  const stallsLeft = event.maxStalls - event.bookedStalls;
  const avgRating = event.reviews.length
    ? (event.reviews.reduce((sum, r) => sum + r.rating, 0) / event.reviews.length).toFixed(1)
    : null;

  const handleJoinWaitlist = async () => {
    setJoiningWaitlist(true);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: event.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOnWaitlist(true);
      toast.success("You've joined the waitlist! We'll notify you when a stall opens.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to join waitlist";
      if (msg.includes("Already on waitlist")) {
        setOnWaitlist(true);
        toast("You're already on the waitlist.");
      } else {
        toast.error(msg);
      }
    } finally {
      setJoiningWaitlist(false);
    }
  };

  const amenityIcons: Record<string, React.ReactNode> = {
    "Power Supply": <Zap className="h-4 w-4" />,
    "Wi-Fi": <Wifi className="h-4 w-4" />,
    Security: <Shield className="h-4 w-4" />,
    Parking: <Car className="h-4 w-4" />,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center text-sm text-gray-500 mb-6">
        <Link href="/events" className="hover:text-indigo-600 flex items-center">
          <ArrowLeft className="h-4 w-4 mr-1" /> Events
        </Link>
        <ChevronRight className="h-4 w-4 mx-2" />
        <span className="text-gray-900">{event.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Banner */}
          <div className="h-64 sm:h-80 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-end p-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-black/20" />
            <div className="relative z-10">
              <div className="flex gap-2 mb-3">
                <Badge variant="info">{event.category.name}</Badge>
                <Badge>{getEventTypeLabel(event.eventType)}</Badge>
                {event.isFeatured && <Badge variant="warning">Featured</Badge>}
              </div>
              <h1 className="text-3xl font-bold text-white mb-1">{event.title}</h1>
              <p className="text-white/80">{event.venue.name}{event.venue.area ? `, ${event.venue.area}` : ""}, {event.venue.city}</p>
              <div className="flex items-center gap-4 mt-2 text-white/90 text-sm">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatDate(event.startDate)}{event.startDate !== event.endDate ? ` - ${formatDate(event.endDate)}` : ""}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {event.startTime} - {event.endTime}
                </span>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b">
            <div className="flex space-x-6">
              {(["overview", "stalls", "venue", "reviews"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-3 text-sm font-medium capitalize transition-colors ${
                    activeTab === tab
                      ? "border-b-2 border-indigo-600 text-indigo-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab}
                  {tab === "reviews" && event.reviews.length > 0 && ` (${event.reviews.length})`}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <Card>
                <CardContent>
                  <h3 className="font-semibold text-gray-900 mb-3">About This Event</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {event.description || event.shortDescription || "No description provided."}
                  </p>
                </CardContent>
              </Card>

              {venueDemand.length > 0 && (() => {
                const plannedCategories: string[] = (() => {
                  if (!event.stallCategories) return [];
                  try {
                    const parsed = JSON.parse(event.stallCategories);
                    return Array.isArray(parsed) ? parsed : [];
                  } catch { return []; }
                })();
                const top = venueDemand.slice(0, 5);
                const unmet = top.filter((d) => !plannedCategories.includes(d.category));
                return (
                  <Card className="border-amber-200 bg-amber-50/30">
                    <CardContent>
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                          <TrendingUp className="h-5 w-5 text-amber-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">What residents want at this venue</h3>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Based on {totalVotes} resident {totalVotes === 1 ? "vote" : "votes"} — helps you decide if your product fits.
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {top.map((d) => {
                          const pct = totalVotes > 0 ? Math.round((d.count / totalVotes) * 100) : 0;
                          const isPlanned = plannedCategories.includes(d.category);
                          return (
                            <div key={d.category} className="flex items-center gap-3">
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm font-medium text-gray-800 flex items-center gap-1.5">
                                    {d.category}
                                    {isPlanned && (
                                      <span className="text-[10px] uppercase tracking-wide bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-semibold">
                                        In this event
                                      </span>
                                    )}
                                  </span>
                                  <span className="text-xs font-semibold text-amber-700">{pct}% · {d.count} votes</span>
                                </div>
                                <div className="h-1.5 bg-amber-100 rounded-full overflow-hidden">
                                  <div className="h-full bg-amber-500 rounded-full" style={{ width: `${pct}%` }} />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {unmet.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-amber-200 flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-amber-800">
                            <span className="font-semibold">Unmet demand:</span> This event doesn&apos;t include{" "}
                            <span className="font-medium">{unmet.slice(0, 3).map((u) => u.category).join(", ")}</span>
                            {unmet.length > 3 && ` +${unmet.length - 3} more`} — residents have asked for these.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })()}

              <Card>
                <CardContent>
                  <h3 className="font-semibold text-gray-900 mb-3">Event Details</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-start space-x-3">
                      <Calendar className="h-5 w-5 text-indigo-600 mt-0.5" />
                      <div>
                        <div className="font-medium">Date</div>
                        <div className="text-gray-600">
                          {formatDate(event.startDate)}
                          {event.startDate !== event.endDate && ` - ${formatDate(event.endDate)}`}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Clock className="h-5 w-5 text-indigo-600 mt-0.5" />
                      <div>
                        <div className="font-medium">Time</div>
                        <div className="text-gray-600">{event.startTime} - {event.endTime}</div>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Users className="h-5 w-5 text-indigo-600 mt-0.5" />
                      <div>
                        <div className="font-medium">Stalls</div>
                        <div className="text-gray-600">{stallsLeft} available of {event.maxStalls}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* ROI Widget */}
              {(roiLoading || roi) && (
                <Card className={
                  roi?.recommendation === "HIGH" ? "border-green-200 bg-green-50/30" :
                  roi?.recommendation === "MEDIUM" ? "border-amber-200 bg-amber-50/30" :
                  "border-gray-200"
                }>
                  <CardContent>
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-indigo-500" /> Is this event worth it?
                    </h3>
                    {roiLoading ? (
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <span className="animate-pulse">Analysing past data...</span>
                      </div>
                    ) : roi && roi.sampleSize > 0 ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">Recommendation</span>
                          <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                            roi.recommendation === "HIGH" ? "bg-green-100 text-green-700" :
                            roi.recommendation === "MEDIUM" ? "bg-amber-100 text-amber-700" :
                            "bg-red-100 text-red-600"
                          }`}>
                            {roi.recommendation}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="bg-white rounded-lg p-3 border">
                            <div className="text-gray-500 text-xs mb-0.5">Avg Vendor Earnings</div>
                            <div className="font-semibold text-gray-900">{formatCurrency(roi.avgSales)}</div>
                          </div>
                          <div className="bg-white rounded-lg p-3 border">
                            <div className="text-gray-500 text-xs mb-0.5">Avg Profit</div>
                            <div className={`font-semibold ${roi.avgProfit >= 0 ? "text-green-600" : "text-red-500"}`}>
                              {roi.avgProfit >= 0 ? "+" : ""}{formatCurrency(roi.avgProfit)}
                            </div>
                          </div>
                          <div className="bg-white rounded-lg p-3 border">
                            <div className="text-gray-500 text-xs mb-0.5">Success Rate</div>
                            <div className="font-semibold text-gray-900">{roi.successRate}%</div>
                          </div>
                          <div className="bg-white rounded-lg p-3 border">
                            <div className="text-gray-500 text-xs mb-0.5">Sample Size</div>
                            <div className="font-semibold text-gray-900">{roi.sampleSize} vendors</div>
                          </div>
                        </div>
                        <p className="text-xs text-gray-400">Based on past events at this venue in the same category.</p>
                      </div>
                    ) : roi ? (
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <AlertCircle className="h-4 w-4" />
                        Not enough past data to estimate ROI for this event.
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              )}

              {event.parkingInfo && (
                <Card>
                  <CardContent>
                    <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                      <Car className="h-4 w-4 mr-2" /> Parking Information
                    </h3>
                    <p className="text-gray-600 text-sm">{event.parkingInfo}</p>
                  </CardContent>
                </Card>
              )}

              {/* Recent Events at this Venue - last 4 weeks */}
              <Card>
                <CardContent>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <History className="h-4 w-4 mr-2" /> Recent Events at this Venue (Last 4 Weeks)
                  </h3>
                  {recentVenueEvents.length > 0 ? (
                    <div className="space-y-3">
                      <p className="text-sm text-indigo-600 font-medium">
                        {recentVenueEvents.length} event{recentVenueEvents.length > 1 ? "s" : ""} held in the last 4 weeks
                      </p>
                      <div className="divide-y">
                        {recentVenueEvents.map((re) => (
                          <div key={re.id} className="py-2.5 first:pt-0 last:pb-0">
                            <div className="flex items-center justify-between">
                              <Link href={`/events/${re.id}`} className="text-sm font-medium text-gray-900 hover:text-indigo-600">
                                {re.title}
                              </Link>
                              <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
                                {re.bookedStalls}/{re.maxStalls} stalls booked
                              </span>
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(re.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                                {re.startDate !== re.endDate && ` - ${new Date(re.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {re.startTime} - {re.endTime}
                              </span>
                              <span>{getEventTypeLabel(re.eventType)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">No events were held at this venue in the last 4 weeks.</p>
                  )}
                  {event.lastEventInfo && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-xs font-medium text-gray-500 mb-1">Additional Info from Organizer</p>
                      <p className="text-sm text-gray-600">{event.lastEventInfo}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {event.cancellationPolicy && (
                <Card>
                  <CardContent>
                    <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                      <Info className="h-4 w-4 mr-2" /> Cancellation Policy
                    </h3>
                    <p className="text-gray-600 text-sm">{event.cancellationPolicy}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {activeTab === "stalls" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <h3 className="font-semibold text-gray-900">Stall Layout</h3>
                  <p className="text-sm text-gray-500">Click on an available stall to select it</p>
                </CardHeader>
                <CardContent>
                  <StallLayout stalls={event.stalls} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <h3 className="font-semibold text-gray-900">Stall Pricing</h3>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left border-b">
                          <th className="pb-2 font-medium text-gray-500">Type</th>
                          <th className="pb-2 font-medium text-gray-500">Size</th>
                          <th className="pb-2 font-medium text-gray-500">Price</th>
                          <th className="pb-2 font-medium text-gray-500">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {event.stalls.map((stall) => (
                          <tr key={stall.id}>
                            <td className="py-2">{getStallTypeLabel(stall.type)}</td>
                            <td className="py-2">{stall.size} ft</td>
                            <td className="py-2 font-medium">{formatCurrency(stall.price)}</td>
                            <td className="py-2">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(stall.status)}`}>
                                {stall.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "venue" && (
            <div className="space-y-6">
              <Card>
                <CardContent>
                  <h3 className="font-semibold text-gray-900 mb-2">{event.venue.name}</h3>
                  <p className="text-sm text-gray-600 mb-3">{event.venue.address}, {event.venue.city}, {event.venue.state}</p>
                  {event.venue.description && (
                    <p className="text-sm text-gray-600">{event.venue.description}</p>
                  )}
                </CardContent>
              </Card>

              {event.venue.amenities.length > 0 && (
                <Card>
                  <CardHeader>
                    <h3 className="font-semibold text-gray-900">Amenities for Vendors</h3>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {event.venue.amenities.map((amenity) => (
                        <div key={amenity.id} className="flex items-center space-x-2 text-sm">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${amenity.isAvailable ? "bg-green-50 text-green-600" : "bg-gray-50 text-gray-400"}`}>
                            {amenityIcons[amenity.name] || <Info className="h-4 w-4" />}
                          </div>
                          <div>
                            <div className={amenity.isAvailable ? "text-gray-900" : "text-gray-400 line-through"}>{amenity.name}</div>
                            {amenity.charges > 0 && (
                              <div className="text-xs text-gray-500">{formatCurrency(amenity.charges)} extra</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {event.venue.parkingSlots.length > 0 && (
                <Card>
                  <CardHeader>
                    <h3 className="font-semibold text-gray-900">Vendor Parking</h3>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {["TWO_WHEELER", "FOUR_WHEELER", "VAN", "TRUCK"].map((type) => {
                        const slots = event.venue.parkingSlots.filter((s) => s.type === type);
                        if (slots.length === 0) return null;
                        const available = slots.filter((s) => s.isAvailable).length;
                        return (
                          <div key={type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <div className="font-medium">{type.replace("_", " ")}</div>
                              <div className="text-gray-500 text-xs">{available} of {slots.length} available</div>
                            </div>
                            {slots[0].charges > 0 && (
                              <div className="text-indigo-600 font-medium">{formatCurrency(slots[0].charges)}</div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {activeTab === "reviews" && (
            <div className="space-y-4">
              {event.reviews.length > 0 ? (
                event.reviews.map((review) => (
                  <Card key={review.id}>
                    <CardContent>
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium text-gray-900">{review.author.name}</div>
                        <div className="flex items-center text-yellow-500">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`h-4 w-4 ${i < review.rating ? "fill-current" : "text-gray-300"}`} />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">{review.comment}</p>
                      <p className="text-xs text-gray-400 mt-2">{formatDate(review.createdAt)}</p>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Star className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p>No reviews yet for this event.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sponsors Section */}
        {sponsors.length > 0 && (
          <Card>
            <CardContent>
              <h3 className="font-semibold text-gray-900 mb-4">Event Sponsors</h3>
              {(["TITLE", "GOLD", "SILVER", "BRONZE"] as const).map((tier) => {
                const tierSponsors = sponsors.filter((s) => s.tier === tier);
                if (tierSponsors.length === 0) return null;
                const tierStyles: Record<string, string> = {
                  TITLE: "bg-purple-100 text-purple-800",
                  GOLD: "bg-yellow-100 text-yellow-800",
                  SILVER: "bg-gray-100 text-gray-700",
                  BRONZE: "bg-orange-100 text-orange-700",
                };
                return (
                  <div key={tier} className="mb-4">
                    <div className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium mb-3 ${tierStyles[tier]}`}>
                      {tier} SPONSOR{tierSponsors.length > 1 ? "S" : ""}
                    </div>
                    <div className="flex flex-wrap gap-4">
                      {tierSponsors.map((s) => (
                        s.websiteUrl ? (
                          <a key={s.id} href={s.websiteUrl} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1 hover:opacity-80 transition-opacity">
                            {s.logoUrl ? (
                              <img src={s.logoUrl} alt={s.name} className="h-12 w-auto object-contain" />
                            ) : (
                              <div className="h-12 px-4 flex items-center justify-center bg-gray-100 rounded-lg text-sm font-semibold text-gray-700">{s.name}</div>
                            )}
                          </a>
                        ) : (
                          <div key={s.id} className="flex flex-col items-center gap-1">
                            {s.logoUrl ? (
                              <img src={s.logoUrl} alt={s.name} className="h-12 w-auto object-contain" />
                            ) : (
                              <div className="h-12 px-4 flex items-center justify-center bg-gray-100 rounded-lg text-sm font-semibold text-gray-700">{s.name}</div>
                            )}
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Sidebar - Booking Card */}
        <div className="space-y-6">
          <Card className="sticky top-24">
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-gray-500">Starting from</div>
                <div className="text-3xl font-bold text-indigo-600">{formatCurrency(event.basePrice)}</div>
                <div className="text-sm text-gray-500">per stall</div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Available Stalls</span>
                  <span className="font-medium text-gray-900">{stallsLeft} of {event.maxStalls}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-indigo-600 h-2 rounded-full"
                    style={{ width: `${(event.bookedStalls / event.maxStalls) * 100}%` }}
                  />
                </div>
                {stallsLeft <= 5 && stallsLeft > 0 && (
                  <p className="text-orange-600 text-xs font-medium">Only {stallsLeft} stalls left! Book now.</p>
                )}
              </div>

              {event.bookingDeadline && (
                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="h-4 w-4 mr-2" />
                  Booking deadline: {formatDate(event.bookingDeadline)}
                </div>
              )}

              {avgRating && (
                <div className="flex items-center text-sm">
                  <Star className="h-4 w-4 text-yellow-500 fill-current mr-1" />
                  <span className="font-medium">{avgRating}</span>
                  <span className="text-gray-500 ml-1">({event.reviews.length} reviews)</span>
                </div>
              )}

              {event.status === "CANCELLED" ? (
                <Button size="lg" className="w-full" disabled>Event Cancelled</Button>
              ) : stallsLeft === 0 ? (
                <div className="space-y-2">
                  <Button
                    size="lg"
                    className="w-full"
                    variant="outline"
                    onClick={handleJoinWaitlist}
                    disabled={joiningWaitlist || onWaitlist}
                  >
                    {onWaitlist ? "On Waitlist" : joiningWaitlist ? "Joining..." : "Join Waitlist"}
                  </Button>
                  {onWaitlist && (
                    <p className="text-xs text-green-600 text-center font-medium">
                      You&apos;ll be notified when a stall opens up.
                    </p>
                  )}
                </div>
              ) : (
                <Link href={`/events/${event.id}/book`} className="block">
                  <Button size="lg" className="w-full">Book a Stall</Button>
                </Link>
              )}

              <p className="text-xs text-gray-400 text-center">Secure payment via Razorpay</p>

              {/* WhatsApp Share */}
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`🎪 ${event.title}\n📍 ${event.venue.name}, ${event.venue.area || event.venue.city}\n📅 ${formatDate(event.startDate)}\n💰 Stalls from ${formatCurrency(event.basePrice)}\n\n${stallsLeft} stalls available! Book now:\n${typeof window !== "undefined" ? window.location.href : ""}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                Share on WhatsApp
              </a>
            </CardContent>
          </Card>

          {/* Organizer Contact */}
          <Card>
            <CardContent>
              <h3 className="font-semibold text-gray-900 mb-3">Event Organizer</h3>
              <div className="space-y-2 text-sm">
                <div className="font-medium">{event.organizer.name}</div>
                {event.organizer.company && (
                  <div className="text-gray-500">{event.organizer.company}</div>
                )}
                <div className="flex items-center text-gray-600">
                  <Mail className="h-4 w-4 mr-2" />
                  {event.organizer.email}
                </div>
                {event.organizer.phone && (
                  <div className="flex items-center text-gray-600">
                    <Phone className="h-4 w-4 mr-2" />
                    {event.organizer.phone}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
