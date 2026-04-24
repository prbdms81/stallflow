"use client";

import Link from "next/link";
import { Search, MapPin, Calendar, ShoppingBag, Star, ArrowRight, Building2, Users, PartyPopper, Briefcase } from "lucide-react";
import Button from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { useState, useEffect } from "react";
import { formatCurrency } from "@/lib/utils";

interface Event {
  id: string;
  title: string;
  startDate: string;
  basePrice: number;
  maxStalls: number;
  bookedStalls: number;
  eventType: string;
  venue: { name: string; area: string | null; city: string };
  category: { name: string };
}

const categories = [
  { name: "Corporate Events", slug: "corporate", icon: Briefcase, color: "bg-blue-500", href: "/events?type=WEEKDAY_CORPORATE" },
  { name: "Gated Communities", slug: "gated-community", icon: Building2, color: "bg-green-500", href: "/events?type=WEEKEND_COMMUNITY" },
  { name: "Carnivals", slug: "carnival", icon: PartyPopper, color: "bg-pink-500", href: "/events?category=carnival" },
  { name: "Lifestyle Expos", slug: "lifestyle", icon: ShoppingBag, color: "bg-orange-500", href: "/events?category=lifestyle-exhibition" },
  { name: "Food Festivals", slug: "food-festival", icon: Users, color: "bg-red-500", href: "/events?category=food-festival" },
  { name: "Fashion Shows", slug: "fashion", icon: Star, color: "bg-purple-500", href: "/events?category=fashion-exhibition" },
];

const gradients = [
  "bg-gradient-to-br from-indigo-400 to-purple-500",
  "bg-gradient-to-br from-blue-400 to-cyan-500",
  "bg-gradient-to-br from-pink-400 to-rose-500",
  "bg-gradient-to-br from-orange-400 to-red-500",
  "bg-gradient-to-br from-green-400 to-teal-500",
  "bg-gradient-to-br from-violet-400 to-fuchsia-500",
];

const stats = [
  { label: "Events Hosted", value: "2,500+" },
  { label: "Stall Vendors", value: "10,000+" },
  { label: "Cities", value: "25+" },
  { label: "Happy Bookings", value: "50,000+" },
];

const howItWorks = [
  { step: 1, title: "Browse Events", description: "Search for upcoming events in gated communities, corporate offices, and wedding venues near you." },
  { step: 2, title: "Choose Your Stall", description: "View the interactive stall layout, compare sizes and prices, and pick the perfect spot." },
  { step: 3, title: "Book & Pay Online", description: "Secure your stall instantly with our safe payment gateway. Get booking confirmation via SMS." },
  { step: 4, title: "Set Up & Sell", description: "Arrive at the venue, set up your stall, and start selling to an engaged audience!" },
];

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchCity, setSearchCity] = useState("");
  const [featuredEvents, setFeaturedEvents] = useState<Event[]>([]);

  useEffect(() => {
    fetch("/api/events?limit=4&status=PUBLISHED")
      .then((r) => r.json())
      .then((d) => setFeaturedEvents(d.events || []))
      .catch(() => {});
  }, []);

  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
              Book Your Perfect Stall
              <span className="block text-indigo-200">at Events Near You</span>
            </h1>
            <p className="text-base sm:text-lg text-indigo-100 mb-8 max-w-2xl mx-auto">
              Discover and book stalls at gated communities, corporate expos, and
              wedding exhibitions across Hyderabad.
            </p>

            {/* Search Bar */}
            <div className="bg-white rounded-xl shadow-2xl p-2 max-w-2xl mx-auto">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1 flex items-center px-3">
                  <Search className="h-5 w-5 text-gray-400 mr-2" />
                  <input
                    type="text"
                    placeholder="Search events, venues..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full py-2 text-gray-900 text-base placeholder:text-gray-400 focus:outline-none"
                  />
                </div>
                <div className="flex items-center px-3 border-t sm:border-t-0 sm:border-l border-gray-200">
                  <MapPin className="h-5 w-5 text-gray-400 mr-2" />
                  <input
                    type="text"
                    placeholder="Hyderabad"
                    value={searchCity}
                    onChange={(e) => setSearchCity(e.target.value)}
                    className="w-full py-2 text-gray-900 text-base placeholder:text-gray-400 focus:outline-none"
                  />
                </div>
                <Link href={`/events?q=${searchQuery}&city=${searchCity}`}>
                  <Button size="lg" className="w-full sm:w-auto">
                    Search
                  </Button>
                </Link>
              </div>
            </div>

            {/* Quick Links */}
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <Link href="/events" className="text-sm text-indigo-200 hover:text-white px-3 py-2 rounded-full border border-indigo-400/30 hover:border-indigo-300 transition-colors">
                All Events
              </Link>
              <Link href="/communities" className="text-sm text-indigo-200 hover:text-white px-3 py-2 rounded-full border border-indigo-400/30 hover:border-indigo-300 transition-colors">
                Communities
              </Link>
              <Link href="/vendors" className="text-sm text-indigo-200 hover:text-white px-3 py-2 rounded-full border border-indigo-400/30 hover:border-indigo-300 transition-colors">
                Vendors
              </Link>
              <Link href="/calendar" className="text-sm text-indigo-200 hover:text-white px-3 py-2 rounded-full border border-indigo-400/30 hover:border-indigo-300 transition-colors">
                Calendar
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl font-bold text-indigo-600">{stat.value}</div>
                <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Browse by Category</h2>
            <p className="text-gray-600 text-sm mt-1">Find events that match your business</p>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {categories.map((cat) => (
              <Link key={cat.slug} href={cat.href}>
                <Card hover className="text-center py-4 px-2">
                  <div className={`w-10 h-10 ${cat.color} rounded-xl flex items-center justify-center mx-auto mb-2`}>
                    <cat.icon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="font-medium text-gray-900 text-xs">{cat.name}</h3>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Events — from DB */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Upcoming Events</h2>
              <p className="text-gray-600 text-sm mt-1">Hot events with stalls filling up fast</p>
            </div>
            <Link href="/events" className="flex items-center text-indigo-600 hover:text-indigo-700 font-medium text-sm">
              View All <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </div>

          {featuredEvents.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {featuredEvents.map((event, i) => {
                const stallsLeft = event.maxStalls - event.bookedStalls;
                return (
                  <Link key={event.id} href={`/events/${event.id}`}>
                    <Card hover>
                      <div className={`h-36 ${gradients[i % gradients.length]} flex items-end p-4`}>
                        <span className="bg-white/90 text-xs font-medium px-2 py-1 rounded-full">
                          {event.category?.name || event.eventType}
                        </span>
                      </div>
                      <CardContent>
                        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{event.title}</h3>
                        <div className="flex items-center text-sm text-gray-500 mb-1">
                          <MapPin className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                          <span className="truncate">{event.venue.name}{event.venue.area ? `, ${event.venue.area}` : ""}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-500 mb-3">
                          <Calendar className="h-3.5 w-3.5 mr-1" />
                          {new Date(event.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-indigo-600">
                            {formatCurrency(event.basePrice)}
                          </span>
                          {stallsLeft > 0 && (
                            <span className="text-xs text-orange-600 font-medium">
                              {stallsLeft} stalls left
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-xl">
              <Calendar className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No events yet. Check back soon!</p>
              <Link href="/events" className="text-indigo-600 text-sm mt-2 inline-block hover:underline">
                Browse all events →
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">How It Works</h2>
            <p className="text-gray-600 text-sm mt-1">Book your stall in 4 simple steps</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {howItWorks.map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center mx-auto mb-3 text-lg font-bold">
                  {item.step}
                </div>
                <h3 className="font-semibold text-gray-900 text-sm mb-1">{item.title}</h3>
                <p className="text-xs text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-indigo-600 py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">
            Ready to Grow Your Business?
          </h2>
          <p className="text-indigo-100 mb-6 max-w-xl mx-auto">
            Whether you&apos;re a vendor looking for the perfect stall or an event organizer
            wanting to fill your event, StallMate makes it easy.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register">
              <Button size="lg" className="bg-white text-indigo-600 hover:bg-gray-100 w-full sm:w-auto">
                Register as Vendor
              </Button>
            </Link>
            <Link href="/register">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-indigo-700 w-full sm:w-auto">
                List Your Event
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
