"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, MapPin, Calendar, Filter, SlidersHorizontal, X, Clock } from "lucide-react";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import { Card, CardContent } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { formatCurrency, getEventTypeLabel } from "@/lib/utils";

interface Event {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  eventType: string;
  status: string;
  basePrice: number;
  maxStalls: number;
  bookedStalls: number;
  isFeatured: boolean;
  bannerImage: string | null;
  category: { name: string; slug: string };
  venue: { name: string; city: string; type: string; area?: string };
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");
  const [eventType, setEventType] = useState("");
  const [category, setCategory] = useState("");
  const [month, setMonth] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortBy, setSortBy] = useState("upcoming");
  const [initialized, setInitialized] = useState(false);

  // Read URL params on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("q")) setSearch(urlParams.get("q")!);
    if (urlParams.get("city")) setCity(urlParams.get("city")!);
    if (urlParams.get("area")) setArea(urlParams.get("area")!);
    if (urlParams.get("type") || urlParams.get("eventType")) setEventType(urlParams.get("type") || urlParams.get("eventType") || "");
    if (urlParams.get("category")) setCategory(urlParams.get("category")!);
    if (urlParams.get("month")) setMonth(urlParams.get("month")!);
    setInitialized(true);
  }, []);

  const fetchEvents = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      if (city) params.set("city", city);
      if (area) params.set("area", area);
      if (eventType) params.set("eventType", eventType);
      if (category) params.set("category", category);
      if (month) params.set("month", month);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      params.set("sortBy", sortBy);

      const res = await fetch(`/api/events?${params.toString()}`);
      const data = await res.json();
      setEvents(data.events || []);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (initialized) fetchEvents(); }, [initialized]);

  const handleSearch = () => {
    setLoading(true);
    fetchEvents();
  };

  const clearFilters = () => {
    setSearch("");
    setCity("");
    setArea("");
    setEventType("");
    setCategory("");
    setMonth("");
    setDateFrom("");
    setDateTo("");
    setSortBy("upcoming");
    setLoading(true);
    setTimeout(() => fetchEvents(), 0);
  };

  const gradients = [
    "bg-gradient-to-br from-indigo-400 to-purple-500",
    "bg-gradient-to-br from-blue-400 to-cyan-500",
    "bg-gradient-to-br from-pink-400 to-rose-500",
    "bg-gradient-to-br from-orange-400 to-red-500",
    "bg-gradient-to-br from-green-400 to-emerald-500",
    "bg-gradient-to-br from-yellow-400 to-orange-500",
  ];

  // Generate month options for next 12 months
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() + i);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
    return { value, label };
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Browse Events</h1>
        <p className="text-gray-600 mt-1">Find the perfect event to showcase your products</p>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-xl border p-4 mb-8">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search events..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="City"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full sm:w-40 pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <Button onClick={handleSearch}>Search</Button>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center"
          >
            <SlidersHorizontal className="h-4 w-4 mr-1" />
            Filters
          </Button>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Select
                label="Event Type"
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                placeholder="All Types"
                options={[
                  { value: "WEEKDAY_CORPORATE", label: "Corporate (Weekday)" },
                  { value: "WEEKEND_COMMUNITY", label: "Community (Weekend)" },
                  { value: "WEDDING", label: "Wedding" },
                  { value: "EXHIBITION", label: "Exhibition" },
                  { value: "FESTIVAL", label: "Festival" },
                ]}
              />
              <Select
                label="Category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="All Categories"
                options={[
                  { value: "corporate", label: "Corporate Events" },
                  { value: "gated-community", label: "Gated Communities" },
                  { value: "wedding", label: "Wedding" },
                  { value: "food-festival", label: "Food Festival" },
                  { value: "trade-fair", label: "Trade Fair" },
                  { value: "carnival", label: "Carnival" },
                  { value: "lifestyle-exhibition", label: "Lifestyle Exhibition" },
                  { value: "fashion-exhibition", label: "Fashion Exhibition" },
                  { value: "women-expo", label: "Women Expo" },
                  { value: "brand-expo", label: "Brand Expo" },
                  { value: "flea-market", label: "Flea Market" },
                  { value: "mega-mela", label: "Mega Mela" },
                  { value: "pop-up-market", label: "Pop-up Market" },
                ]}
              />
              <Select
                label="Month"
                value={month}
                onChange={(e) => { setMonth(e.target.value); setDateFrom(""); setDateTo(""); }}
                placeholder="All Months"
                options={monthOptions}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Area</label>
                <input
                  type="text"
                  placeholder="e.g. Gachibowli, Madhapur"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => { setDateFrom(e.target.value); setMonth(""); }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => { setDateTo(e.target.value); setMonth(""); }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <Select
                label="Sort By"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                options={[
                  { value: "upcoming", label: "Upcoming First" },
                  { value: "latest", label: "Recently Added" },
                  { value: "price_low", label: "Price: Low to High" },
                  { value: "price_high", label: "Price: High to Low" },
                ]}
              />
              <div className="flex items-end gap-2">
                <Button onClick={handleSearch} className="flex-1">Apply Filters</Button>
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-1" /> Clear
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Active filter pills */}
      {(area || month || dateFrom || eventType || category) && (
        <div className="flex flex-wrap gap-2 mb-4">
          {area && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium">
              Area: {area} <X className="h-3 w-3 cursor-pointer" onClick={() => { setArea(""); handleSearch(); }} />
            </span>
          )}
          {month && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium">
              {monthOptions.find(m => m.value === month)?.label} <X className="h-3 w-3 cursor-pointer" onClick={() => { setMonth(""); handleSearch(); }} />
            </span>
          )}
          {dateFrom && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium">
              From: {dateFrom} <X className="h-3 w-3 cursor-pointer" onClick={() => { setDateFrom(""); handleSearch(); }} />
            </span>
          )}
          {eventType && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium">
              {getEventTypeLabel(eventType)} <X className="h-3 w-3 cursor-pointer" onClick={() => { setEventType(""); handleSearch(); }} />
            </span>
          )}
          {category && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium">
              {category} <X className="h-3 w-3 cursor-pointer" onClick={() => { setCategory(""); handleSearch(); }} />
            </span>
          )}
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-48 bg-gray-200" />
              <CardContent>
                <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-1" />
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-3" />
                <div className="h-6 bg-gray-200 rounded w-1/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : events.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event, index) => (
            <Link key={event.id} href={`/events/${event.id}`}>
              <Card hover>
                <div className={`h-48 ${gradients[index % gradients.length]} relative flex items-end p-4`}>
                  {event.isFeatured && (
                    <Badge variant="warning" className="absolute top-3 right-3">Featured</Badge>
                  )}
                  <Badge variant="info">{event.category.name}</Badge>
                </div>
                <CardContent>
                  <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{event.title}</h3>
                  <div className="flex items-center text-sm text-gray-500 mb-1">
                    <MapPin className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                    <span className="truncate">
                      {event.venue.name}, {event.venue.area ? `${event.venue.area}, ` : ""}{event.venue.city}
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500 mb-1">
                    <Calendar className="h-3.5 w-3.5 mr-1" />
                    {new Date(event.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    {event.startDate !== event.endDate &&
                      ` - ${new Date(event.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`}
                  </div>
                  <div className="flex items-center text-sm text-gray-500 mb-1">
                    <Clock className="h-3.5 w-3.5 mr-1" />
                    {event.startTime} - {event.endTime}
                  </div>
                  <div className="flex items-center text-sm text-gray-500 mb-3">
                    <Filter className="h-3.5 w-3.5 mr-1" />
                    {getEventTypeLabel(event.eventType)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-indigo-600">
                      {formatCurrency(event.basePrice)}
                    </span>
                    <span className="text-xs text-gray-500">
                      {event.maxStalls - event.bookedStalls} of {event.maxStalls} stalls left
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No events found</h3>
          <p className="text-gray-500 mb-4">Try adjusting your search or filters</p>
          <Button variant="outline" onClick={clearFilters}>
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
}
