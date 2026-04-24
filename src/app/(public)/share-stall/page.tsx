"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Users, Handshake, MapPin, Calendar, MessageCircle, Loader2,
  Plus, IndianRupee, Filter, Zap,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Badge from "@/components/ui/Badge";
import toast from "react-hot-toast";
import { formatCurrency, formatDate } from "@/lib/utils";

interface ShareRequest {
  id: string;
  vendorId: string;
  eventId: string;
  message: string | null;
  category: string | null;
  budget: number | null;
  status: string;
  partnerVendorId: string | null;
  vendorName: string;
  vendorCategory: string;
  eventTitle: string;
  venueName: string;
  eventDate: string | null;
}

interface Event {
  id: string;
  title: string;
  startDate: string;
  venue: { name: string };
}

const categories = [
  { value: "", label: "Any Category" },
  { value: "Food & Beverages", label: "Food & Beverages" },
  { value: "Clothing & Fashion", label: "Clothing & Fashion" },
  { value: "Handicrafts", label: "Handicrafts" },
  { value: "Home & Decor", label: "Home & Decor" },
  { value: "Beauty & Wellness", label: "Beauty & Wellness" },
  { value: "Electronics", label: "Electronics" },
  { value: "Other", label: "Other" },
];

// Complementary categories that work well together
const complementaryMap: Record<string, string[]> = {
  "Food & Beverages": ["Handicrafts", "Home & Decor", "Beauty & Wellness"],
  "Clothing & Fashion": ["Beauty & Wellness", "Handicrafts"],
  "Handicrafts": ["Food & Beverages", "Clothing & Fashion", "Home & Decor"],
  "Home & Decor": ["Handicrafts", "Food & Beverages", "Clothing & Fashion"],
  "Beauty & Wellness": ["Clothing & Fashion", "Food & Beverages"],
  "Electronics": ["Home & Decor"],
};

function isComplementary(cat1: string, cat2: string): boolean {
  return complementaryMap[cat1]?.includes(cat2) || complementaryMap[cat2]?.includes(cat1) || false;
}

export default function ShareStallPage() {
  const { data: session } = useSession();
  const [requests, setRequests] = useState<ShareRequest[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPost, setShowPost] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filterCategory, setFilterCategory] = useState("");

  // New request form
  const [selectedEvent, setSelectedEvent] = useState("");
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState("");
  const [budget, setBudget] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/stall-shares?status=OPEN").then((r) => r.json()),
      fetch("/api/events").then((r) => r.json()),
    ])
      .then(([shareData, eventData]) => {
        setRequests(shareData.requests || []);
        setEvents(eventData.events || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handlePost = async () => {
    if (!selectedEvent) {
      toast.error("Select an event");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/stall-shares", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: selectedEvent,
          message: message.trim() || null,
          category: category || null,
          budget: budget || null,
        }),
      });
      if (res.ok) {
        toast.success("Request posted! Other vendors can now find you.");
        setShowPost(false);
        setSelectedEvent("");
        setMessage("");
        setCategory("");
        setBudget("");
        // Refresh
        fetch("/api/stall-shares?status=OPEN")
          .then((r) => r.json())
          .then((d) => setRequests(d.requests || []));
      } else {
        toast.error("Failed to post request");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const handleMatch = async (requestId: string) => {
    if (!session) {
      toast.error("Please login first");
      return;
    }
    try {
      const res = await fetch("/api/stall-shares", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action: "match" }),
      });
      if (res.ok) {
        toast.success("Matched! Connect via WhatsApp to coordinate.");
        setRequests(requests.filter((r) => r.id !== requestId));
      } else {
        toast.error("Failed to match");
      }
    } catch {
      toast.error("Something went wrong");
    }
  };

  const contactOnWhatsApp = (req: ShareRequest) => {
    const msg = [
      `Hi ${req.vendorName}! 👋`,
      ``,
      `I saw your stall-sharing request on StallMate:`,
      `Event: ${req.eventTitle}`,
      `Venue: ${req.venueName}`,
      req.budget ? `Budget: ${formatCurrency(req.budget)}` : "",
      ``,
      `I'm interested in sharing a stall. Let's discuss!`,
    ].filter(Boolean).join("\n");
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const filtered = filterCategory
    ? requests.filter((r) => r.vendorCategory === filterCategory || r.category === filterCategory)
    : requests;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Find a Stall Partner</h1>
          <p className="text-sm text-gray-500">Split cost, double the value</p>
        </div>
        {session && (
          <Button size="sm" onClick={() => setShowPost(!showPost)}>
            <Plus className="h-4 w-4 mr-1" /> Post Request
          </Button>
        )}
      </div>

      {/* How It Works */}
      <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl p-5 text-white mb-6">
        <h2 className="font-bold text-lg mb-3">How Stall Sharing Works</h2>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-2xl mb-1">📝</div>
            <div className="text-xs font-medium">Post what event you want to share at</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-2xl mb-1">🤝</div>
            <div className="text-xs font-medium">A complementary vendor connects</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-2xl mb-1">💰</div>
            <div className="text-xs font-medium">Split cost & set up together</div>
          </div>
        </div>
      </div>

      {/* Post Form */}
      {showPost && (
        <Card className="mb-6">
          <CardContent className="py-5 space-y-4">
            <Select
              label="Which Event?"
              options={events.map((e) => ({
                value: e.id,
                label: `${e.title} — ${e.venue.name}`,
              }))}
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
              placeholder="Select an event"
            />
            <Select
              label="Your Category"
              options={categories}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
            <Input
              label="Your Budget (your share)"
              type="number"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="e.g. 2500"
            />
            <Input
              label="Message to potential partners"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g. Looking for a clothing vendor to share a 10x10 stall"
            />
            <div className="flex gap-2">
              <Button onClick={handlePost} isLoading={saving}>Post Request</Button>
              <Button variant="ghost" onClick={() => setShowPost(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category Filter */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2 -mx-4 px-4">
        <Filter className="h-4 w-4 text-gray-400 flex-shrink-0" />
        <button
          onClick={() => setFilterCategory("")}
          className={`whitespace-nowrap px-3 py-2 rounded-full text-xs font-medium transition-colors ${
            !filterCategory ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600"
          }`}
        >
          All
        </button>
        {categories.slice(1).map((cat) => (
          <button
            key={cat.value}
            onClick={() => setFilterCategory(cat.value)}
            className={`whitespace-nowrap px-3 py-2 rounded-full text-xs font-medium transition-colors ${
              filterCategory === cat.value ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Requests */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
        </div>
      ) : filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((req) => {
            const isOwn = session?.user?.id === req.vendorId;
            const complementary = req.vendorCategory && req.category
              ? isComplementary(req.vendorCategory, req.category)
              : false;

            return (
              <Card key={req.id} className={complementary ? "border-purple-200 bg-purple-50/20" : ""}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="h-9 w-9 rounded-full bg-indigo-100 flex items-center justify-center">
                        <Users className="h-5 w-5 text-indigo-500" />
                      </div>
                      <div>
                        <span className="font-semibold text-gray-900 text-sm">{req.vendorName}</span>
                        <div className="flex items-center gap-1.5">
                          {req.vendorCategory && (
                            <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                              {req.vendorCategory}
                            </span>
                          )}
                          {complementary && (
                            <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                              <Zap className="h-2.5 w-2.5" /> Great match
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {isOwn && <Badge variant="info">Your request</Badge>}
                  </div>

                  <h3 className="text-sm font-medium text-gray-800 mt-2">{req.eventTitle}</h3>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {req.venueName}
                    </span>
                    {req.eventDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> {formatDate(req.eventDate)}
                      </span>
                    )}
                  </div>

                  {req.message && (
                    <div className="bg-gray-50 rounded-lg p-2.5 mt-2">
                      <p className="text-sm text-gray-600">{req.message}</p>
                    </div>
                  )}

                  {req.budget && (
                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-2">
                      <IndianRupee className="h-3 w-3" />
                      Budget: <strong className="text-gray-900">{formatCurrency(req.budget)}</strong> (their share)
                    </div>
                  )}

                  {/* Actions */}
                  {!isOwn && (
                    <div className="flex gap-2 mt-3 pt-2 border-t border-gray-100">
                      <button
                        onClick={() => handleMatch(req.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        <Handshake className="h-4 w-4" /> I&apos;m Interested
                      </button>
                      <button
                        onClick={() => contactOnWhatsApp(req)}
                        className="flex items-center justify-center gap-1 px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        <MessageCircle className="h-4 w-4" /> Chat
                      </button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16">
          <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900">No share requests yet</h3>
          <p className="text-gray-500 text-sm mt-1">
            Be the first! Post a request and find a stall partner for an upcoming event.
          </p>
        </div>
      )}
    </div>
  );
}
