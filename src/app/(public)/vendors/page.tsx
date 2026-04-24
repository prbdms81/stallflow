"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Star, ShieldCheck, Award, Users, UtensilsCrossed, Shirt, Gem, Palette, Store } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Select from "@/components/ui/Select";

interface Vendor {
  id: string;
  businessName: string;
  category: string;
  description: string | null;
  logo: string | null;
  rating: number;
  totalEvents: number;
  isTrusted: boolean;
  trustScore: number;
  fssaiNumber: string | null;
  experience: number;
  user: { id: string; name: string; avatar: string | null };
}

const categoryOptions = [
  { value: "", label: "All Categories" },
  { value: "Food & Beverages", label: "Food & Beverages" },
  { value: "Clothing & Fashion", label: "Clothing & Fashion" },
  { value: "Jewellery & Accessories", label: "Jewellery & Accessories" },
  { value: "Home Decor", label: "Home Decor" },
  { value: "Handicrafts", label: "Handicrafts" },
  { value: "Electronics", label: "Electronics" },
  { value: "Plants & Garden", label: "Plants & Garden" },
  { value: "Health & Wellness", label: "Health & Wellness" },
  { value: "Other", label: "Other" },
];

const sortOptions = [
  { value: "rating", label: "Highest Rated" },
  { value: "events", label: "Most Events" },
  { value: "newest", label: "Newest" },
];

const categoryIcons: Record<string, React.ReactNode> = {
  "Food & Beverages": <UtensilsCrossed className="h-6 w-6" />,
  "Clothing & Fashion": <Shirt className="h-6 w-6" />,
  "Jewellery & Accessories": <Gem className="h-6 w-6" />,
  "Handicrafts": <Palette className="h-6 w-6" />,
};

const vendorGradients = [
  "bg-gradient-to-br from-indigo-400 to-purple-500",
  "bg-gradient-to-br from-emerald-400 to-teal-500",
  "bg-gradient-to-br from-orange-400 to-pink-500",
  "bg-gradient-to-br from-blue-400 to-cyan-500",
  "bg-gradient-to-br from-rose-400 to-red-500",
];

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("rating");
  const [trustedOnly, setTrustedOnly] = useState(false);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (category) params.set("category", category);
    if (sort) params.set("sort", sort);
    if (trustedOnly) params.set("trusted", "true");

    fetch(`/api/vendors?${params}`)
      .then((res) => res.json())
      .then((data) => setVendors(data.vendors || []))
      .catch(() => setVendors([]))
      .finally(() => setLoading(false));
  }, [category, sort, trustedOnly]);

  const handleSearch = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (category) params.set("category", category);
    if (sort) params.set("sort", sort);
    if (trustedOnly) params.set("trusted", "true");

    fetch(`/api/vendors?${params}`)
      .then((res) => res.json())
      .then((data) => setVendors(data.vendors || []))
      .catch(() => setVendors([]))
      .finally(() => setLoading(false));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Find Vendors</h1>
        <p className="text-gray-600 mt-1">Browse trusted vendors for your next event</p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by vendor name or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="w-full pl-12 pr-4 py-3 text-base rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-8">
        <div className="w-48">
          <Select
            options={categoryOptions}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="All Categories"
          />
        </div>
        <div className="w-40">
          <Select
            options={sortOptions}
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          />
        </div>
        <button
          onClick={() => setTrustedOnly(!trustedOnly)}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            trustedOnly
              ? "bg-green-100 text-green-800 border border-green-300"
              : "bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200"
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          Trusted Only
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-32 bg-gray-200" />
              <CardContent>
                <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-100 rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : vendors.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {vendors.map((vendor, i) => (
            <Link key={vendor.id} href={`/vendors/${vendor.id}`}>
              <Card hover>
                <div className={`h-32 ${vendorGradients[i % vendorGradients.length]} flex items-center justify-center relative`}>
                  {vendor.logo ? (
                    <img src={vendor.logo} alt={vendor.businessName} className="h-16 w-16 rounded-full object-cover border-2 border-white shadow" />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center text-white">
                      {categoryIcons[vendor.category] || <Store className="h-6 w-6" />}
                    </div>
                  )}
                  {/* Badges on top-right */}
                  <div className="absolute top-3 right-3 flex gap-1.5">
                    {vendor.isTrusted && (
                      <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                        <ShieldCheck className="h-3 w-3" /> Trusted
                      </span>
                    )}
                    {vendor.fssaiNumber && (
                      <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                        FSSAI
                      </span>
                    )}
                  </div>
                </div>
                <CardContent>
                  <h3 className="font-semibold text-gray-900 text-lg">{vendor.businessName}</h3>
                  <div className="flex items-center gap-2 mt-1 mb-3">
                    <Badge>{vendor.category}</Badge>
                    {vendor.experience > 0 && (
                      <span className="text-xs text-gray-400">{vendor.experience}+ yrs</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center text-amber-500">
                      <Star className="h-4 w-4 fill-current mr-1" />
                      <span className="font-medium">{vendor.rating > 0 ? vendor.rating.toFixed(1) : "New"}</span>
                    </span>
                    <span className="flex items-center text-gray-500">
                      <Award className="h-4 w-4 mr-1" />
                      {vendor.totalEvents} events
                    </span>
                    {/* Trust score mini indicator */}
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      vendor.trustScore >= 80 ? "bg-green-100 text-green-700" :
                      vendor.trustScore >= 60 ? "bg-blue-100 text-blue-700" :
                      vendor.trustScore >= 40 ? "bg-amber-100 text-amber-700" :
                      "bg-gray-100 text-gray-500"
                    }`}>
                      {vendor.trustScore}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900">No vendors found</h3>
          <p className="text-gray-500">Try adjusting your search or filters.</p>
        </div>
      )}
    </div>
  );
}
