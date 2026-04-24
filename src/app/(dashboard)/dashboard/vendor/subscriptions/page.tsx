"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Bell, BellOff, MapPin, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import toast from "react-hot-toast";

interface Venue {
  id: string;
  name: string;
  city: string;
  type: string;
}

interface Subscription {
  id: string;
  venueId: string | null;
  createdAt: string;
  venue: { id: string; name: string; city: string } | null;
}

export default function VendorSubscriptionsPage() {
  const { data: session } = useSession();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(true);
  const [loadingVenues, setLoadingVenues] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const subscribedVenueIds = new Set(
    subscriptions.map((s) => s.venueId).filter(Boolean) as string[]
  );

  const fetchSubscriptions = useCallback(async () => {
    setLoadingSubs(true);
    try {
      const res = await fetch("/api/subscriptions");
      const data = await res.json();
      if (res.ok) setSubscriptions(data.subscriptions);
    } catch {
      toast.error("Failed to load subscriptions");
    } finally {
      setLoadingSubs(false);
    }
  }, []);

  const fetchVenues = useCallback(async () => {
    setLoadingVenues(true);
    try {
      const res = await fetch("/api/venues");
      const data = await res.json();
      if (res.ok) setVenues(data.venues);
    } catch {
      toast.error("Failed to load venues");
    } finally {
      setLoadingVenues(false);
    }
  }, []);

  useEffect(() => {
    if (session) {
      fetchSubscriptions();
      fetchVenues();
    }
  }, [session, fetchSubscriptions, fetchVenues]);

  const handleSubscribe = async (venueId: string) => {
    setActionLoading(venueId);
    try {
      const res = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ venueId }),
      });
      if (res.ok) {
        toast.success("Subscribed! You'll be notified of new events.");
        await fetchSubscriptions();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to subscribe");
      }
    } catch {
      toast.error("Failed to subscribe");
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnsubscribe = async (venueId: string) => {
    setActionLoading(venueId);
    try {
      const res = await fetch(`/api/subscriptions?venueId=${venueId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Unsubscribed from venue");
        await fetchSubscriptions();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to unsubscribe");
      }
    } catch {
      toast.error("Failed to unsubscribe");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Venue Subscriptions</h1>
        <p className="mt-1 text-sm text-gray-500">
          Get notified automatically when new events are posted at your favourite venues.
        </p>
      </div>

      {/* Current subscriptions */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Your Subscriptions</h2>
        {loadingSubs ? (
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading…
          </div>
        ) : subscriptions.length === 0 ? (
          <p className="text-sm text-gray-500">
            You have no venue subscriptions yet. Browse venues below to subscribe.
          </p>
        ) : (
          <div className="space-y-3">
            {subscriptions.map((sub) =>
              sub.venue ? (
                <Card key={sub.id}>
                  <CardContent className="flex items-center justify-between py-4 px-5">
                    <div className="flex items-center gap-3">
                      <Bell className="w-5 h-5 text-green-500 shrink-0" />
                      <div>
                        <p className="font-medium text-gray-900">{sub.venue.name}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {sub.venue.city}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUnsubscribe(sub.venue!.id)}
                      disabled={actionLoading === sub.venue.id}
                    >
                      {actionLoading === sub.venue.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <BellOff className="w-4 h-4 mr-1" />
                          Unsubscribe
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ) : null
            )}
          </div>
        )}
      </section>

      {/* Browse all venues */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Browse Venues to Subscribe</h2>
        {loadingVenues ? (
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading venues…
          </div>
        ) : venues.length === 0 ? (
          <p className="text-sm text-gray-500">No active venues found.</p>
        ) : (
          <div className="space-y-3">
            {venues.map((venue) => {
              const isSubscribed = subscribedVenueIds.has(venue.id);
              const isActing = actionLoading === venue.id;
              return (
                <Card key={venue.id}>
                  <CardContent className="flex items-center justify-between py-4 px-5">
                    <div>
                      <p className="font-medium text-gray-900">{venue.name}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {venue.city}
                        {venue.type && (
                          <span className="ml-2 bg-gray-100 text-gray-600 rounded px-1.5 py-0.5 text-[10px] uppercase tracking-wide">
                            {venue.type}
                          </span>
                        )}
                      </p>
                    </div>

                    {isSubscribed ? (
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                          <Bell className="w-4 h-4" />
                          Subscribed
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUnsubscribe(venue.id)}
                          disabled={isActing}
                          className="text-red-500 border-red-200 hover:bg-red-50"
                        >
                          {isActing ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            "Unsubscribe"
                          )}
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleSubscribe(venue.id)}
                        disabled={isActing}
                      >
                        {isActing ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Bell className="w-4 h-4 mr-1" />
                            Subscribe
                          </>
                        )}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
