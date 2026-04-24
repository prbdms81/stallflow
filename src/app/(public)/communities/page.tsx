"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search, MapPin, Users, Calendar, Star, Building2,
  Briefcase, Home, TrendingUp,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Select from "@/components/ui/Select";

interface Community {
  id: string;
  name: string;
  type: string;
  area: string | null;
  city: string;
  familyCount: number;
  employeeCount: number;
  vendorRating: number;
  eventFrequency: string | null;
  bestCategories: string | null;
  powerSupply: string | null;
  parkingNotes: string | null;
  smartScore: number;
  totalStallSlots: number;
  _count: { events: number };
}

const typeOptions = [
  { value: "", label: "All Types" },
  { value: "GATED_COMMUNITY", label: "Gated Community" },
  { value: "CORPORATE_OFFICE", label: "Corporate Office" },
  { value: "CONVENTION_CENTER", label: "Convention Center" },
  { value: "HOTEL", label: "Hotel" },
  { value: "OUTDOOR", label: "Outdoor Venue" },
];

const areaOptions = [
  { value: "", label: "All Areas" },
  { value: "Gachibowli", label: "Gachibowli" },
  { value: "Kondapur", label: "Kondapur" },
  { value: "Madhapur", label: "Madhapur" },
  { value: "Kukatpally", label: "Kukatpally" },
  { value: "Nallagandla", label: "Nallagandla" },
  { value: "Manikonda", label: "Manikonda" },
  { value: "Miyapur", label: "Miyapur" },
  { value: "Banjara Hills", label: "Banjara Hills" },
  { value: "Jubilee Hills", label: "Jubilee Hills" },
  { value: "HITEC City", label: "HITEC City" },
  { value: "Financial District", label: "Financial District" },
];

const sortOptions = [
  { value: "smartScore", label: "Best Match" },
  { value: "rating", label: "Highest Rated" },
  { value: "families", label: "Most Families" },
  { value: "events", label: "Most Events" },
  { value: "newest", label: "Newest" },
];

const gradients = [
  "bg-gradient-to-br from-emerald-400 to-teal-500",
  "bg-gradient-to-br from-blue-400 to-indigo-500",
  "bg-gradient-to-br from-purple-400 to-pink-500",
  "bg-gradient-to-br from-orange-400 to-amber-500",
  "bg-gradient-to-br from-rose-400 to-red-500",
];

export default function CommunitiesPage() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [area, setArea] = useState("");
  const [sort, setSort] = useState("smartScore");

  const fetchData = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (type) params.set("type", type);
    if (area) params.set("area", area);
    if (sort) params.set("sort", sort);

    fetch(`/api/communities?${params}`)
      .then((r) => r.json())
      .then((d) => setCommunities(d.communities || []))
      .catch(() => setCommunities([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [type, area, sort]); // eslint-disable-line react-hooks/exhaustive-deps

  const getIcon = (t: string) =>
    t === "CORPORATE_OFFICE" ? (
      <Briefcase className="h-6 w-6" />
    ) : (
      <Home className="h-6 w-6" />
    );

  const getTypeLabel = (t: string) =>
    t === "GATED_COMMUNITY"
      ? "Gated Community"
      : t === "CORPORATE_OFFICE"
      ? "Corporate Office"
      : t === "CONVENTION_CENTER"
      ? "Convention Center"
      : t;

  const getPeopleInfo = (c: Community) => {
    if (c.familyCount > 0)
      return { count: c.familyCount.toLocaleString(), label: "families" };
    if (c.employeeCount > 0)
      return { count: c.employeeCount.toLocaleString(), label: "employees" };
    return null;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Community Directory</h1>
        <p className="text-gray-600 mt-1">
          Find the best communities & offices for your next stall
        </p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by community name, area, or city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchData()}
            className="w-full pl-12 pr-4 py-3 text-base rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
        <Select
          options={typeOptions}
          value={type}
          onChange={(e) => setType(e.target.value)}
        />
        <Select
          options={areaOptions}
          value={area}
          onChange={(e) => setArea(e.target.value)}
        />
        <Select
          options={sortOptions}
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        />
        <div className="flex items-center justify-end">
          <span className="text-sm text-gray-400">
            {communities.length} found
          </span>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-36 bg-gray-200" />
              <CardContent>
                <div className="h-5 bg-gray-200 rounded w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : communities.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {communities.map((c, i) => (
            <Link key={c.id} href={`/communities/${c.id}`}>
              <Card hover>
                <div
                  className={`h-32 ${
                    gradients[i % gradients.length]
                  } flex items-center justify-center relative`}
                >
                  <div className="text-white/80">{getIcon(c.type)}</div>

                  {/* Smart score badge */}
                  {c.smartScore > 0 && (
                    <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {c.smartScore.toFixed(0)}
                    </div>
                  )}

                  {/* Type label */}
                  <div className="absolute bottom-3 left-3">
                    <Badge variant="info">{getTypeLabel(c.type)}</Badge>
                  </div>

                  {/* Vendor rating */}
                  {c.vendorRating > 0 && (
                    <div className="absolute bottom-3 right-3 bg-black/30 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-0.5">
                      <Star className="h-3 w-3 fill-current text-amber-300" />
                      {c.vendorRating.toFixed(1)}
                    </div>
                  )}
                </div>
                <CardContent>
                  <h3 className="font-semibold text-gray-900 text-lg mb-1">
                    {c.name}
                  </h3>
                  <div className="flex items-center text-sm text-gray-500 mb-3">
                    <MapPin className="h-3.5 w-3.5 mr-1" />
                    {c.area || c.city}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {getPeopleInfo(c) && (
                      <span className="flex items-center text-gray-600">
                        <Users className="h-3.5 w-3.5 mr-1 text-indigo-500" />
                        {getPeopleInfo(c)!.count} {getPeopleInfo(c)!.label}
                      </span>
                    )}
                    <span className="flex items-center text-gray-600">
                      <Calendar className="h-3.5 w-3.5 mr-1 text-green-500" />
                      {c._count.events} events
                    </span>
                    {c.eventFrequency && (
                      <span className="text-gray-500 text-xs col-span-2">
                        {c.eventFrequency}
                      </span>
                    )}
                  </div>

                  {c.bestCategories && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {(JSON.parse(c.bestCategories) as string[])
                        .slice(0, 3)
                        .map((cat) => (
                          <span
                            key={cat}
                            className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
                          >
                            {cat}
                          </span>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900">No communities found</h3>
          <p className="text-gray-500">Try adjusting your search or filters.</p>
        </div>
      )}
    </div>
  );
}
