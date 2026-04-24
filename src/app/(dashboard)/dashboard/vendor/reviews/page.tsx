"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { formatDate } from "@/lib/utils";
import toast from "react-hot-toast";

interface Review {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  createdAt: string;
  author: { id: string; name: string; avatar: string | null };
  event: { id: string; title: string };
}

interface PendingRating {
  bookingId: string;
  eventId: string;
  eventTitle: string;
  organizerId: string;
  organizerName: string;
  eventDate: string;
}

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          onMouseEnter={() => setHovered(s)}
          onMouseLeave={() => setHovered(0)}
          className="focus:outline-none"
        >
          <Star
            className={`h-6 w-6 transition-colors ${
              s <= (hovered || value) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`h-4 w-4 ${s <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
        />
      ))}
    </div>
  );
}

export default function VendorReviewsPage() {
  const { data: session } = useSession();
  const [tab, setTab] = useState<"received" | "rate">("received");
  const [received, setReceived] = useState<Review[]>([]);
  const [pending, setPending] = useState<PendingRating[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeForm, setActiveForm] = useState<string | null>(null);
  const [formRating, setFormRating] = useState(0);
  const [formComment, setFormComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const userId = (session?.user as { id?: string })?.id;
      const targetParam = userId ? `&targetId=${userId}` : "";
      const authorParam = userId ? `&authorId=${userId}` : "";
      const [reviewsRes, bookingsRes] = await Promise.all([
        fetch(`/api/reviews?reviewType=VENDOR_REVIEW${targetParam}`),
        fetch("/api/bookings?status=COMPLETED"),
      ]);

      const reviewsData = await reviewsRes.json();
      const bookingsData = await bookingsRes.json();

      const myReviews: Review[] = reviewsData.reviews || [];
      setReceived(myReviews);

      const completedBookings: Array<{
        id: string;
        eventId: string;
        event: { id: string; title: string; startDate: string; organizer: { id: string; name: string } | null };
      }> = bookingsData.bookings || [];
      const existingOrgReviewsRes = await fetch(`/api/reviews?reviewType=ORGANIZER_REVIEW${authorParam}`);
      const existingOrgData = await existingOrgReviewsRes.json();
      const ratedEventIds = new Set(
        (existingOrgData.reviews || []).map((r: Review & { event: { id: string } }) => r.event.id)
      );

      const pendingList: PendingRating[] = completedBookings
        .filter((b) => !ratedEventIds.has(b.eventId) && b.event?.organizer != null)
        .map((b) => ({
          bookingId: b.id,
          eventId: b.eventId,
          eventTitle: b.event.title,
          organizerId: b.event.organizer!.id,
          organizerName: b.event.organizer!.name,
          eventDate: b.event.startDate,
        }));

      setPending(pendingList);
    } catch {
      toast.error("Failed to load reviews");
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async (item: PendingRating) => {
    if (formRating === 0) {
      toast.error("Please select a rating");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: item.eventId,
          targetId: item.organizerId,
          rating: formRating,
          comment: formComment || undefined,
          reviewType: "ORGANIZER_REVIEW",
        }),
      });

      if (res.ok) {
        toast.success("Review submitted!");
        setActiveForm(null);
        setFormRating(0);
        setFormComment("");
        fetchData();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to submit review");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Reviews</h1>
        <p className="text-gray-500">View feedback you received and rate organizers</p>
      </div>

      <div className="flex gap-2">
        {(["received", "rate"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t ? "bg-indigo-600 text-white" : "bg-white border text-gray-600 hover:bg-gray-50"
            }`}
          >
            {t === "received" ? "Reviews I Received" : "Rate Organizers"}
            {t === "rate" && pending.length > 0 && (
              <span className="ml-2 bg-indigo-100 text-indigo-700 text-xs px-1.5 py-0.5 rounded-full">
                {pending.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent><div className="h-16 bg-gray-200 rounded" /></CardContent>
            </Card>
          ))}
        </div>
      ) : tab === "received" ? (
        received.length > 0 ? (
          <div className="space-y-4">
            {received.map((r) => (
              <Card key={r.id}>
                <CardContent>
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-gray-900">{r.author.name}</span>
                        <span className="text-xs text-gray-400">{formatDate(r.createdAt)}</span>
                      </div>
                      <div className="text-xs text-gray-500">{r.event.title}</div>
                      {r.title && <div className="text-sm font-medium text-gray-800">{r.title}</div>}
                      {r.comment && <div className="text-sm text-gray-600">{r.comment}</div>}
                    </div>
                    <StarDisplay rating={r.rating} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12 text-gray-500">
              No reviews received yet.
            </CardContent>
          </Card>
        )
      ) : pending.length > 0 ? (
        <div className="space-y-4">
          {pending.map((item) => (
            <Card key={item.bookingId}>
              <CardContent>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="font-medium text-gray-900">{item.eventTitle}</div>
                    <div className="text-sm text-gray-500">
                      Organizer: {item.organizerName} | {formatDate(item.eventDate)}
                    </div>
                  </div>
                  {activeForm !== item.bookingId && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setActiveForm(item.bookingId);
                        setFormRating(0);
                        setFormComment("");
                      }}
                    >
                      Rate Now
                    </Button>
                  )}
                </div>

                {activeForm === item.bookingId && (
                  <div className="mt-4 border-t pt-4 space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">Rating</label>
                      <StarRating value={formRating} onChange={setFormRating} />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">Comment (optional)</label>
                      <textarea
                        value={formComment}
                        onChange={(e) => setFormComment(e.target.value)}
                        rows={3}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Share your experience with this organizer..."
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        isLoading={submitting}
                        onClick={() => handleSubmit(item)}
                      >
                        Submit Review
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setActiveForm(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12 text-gray-500">
            No pending organizer reviews. Complete events will appear here.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
