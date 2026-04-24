"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Calendar, Clock, History, Copy, Star, ChevronDown, Check } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { getEventTypeLabel } from "@/lib/utils";
import VendorMixPanel from "@/components/events/VendorMixPanel";
import toast from "react-hot-toast";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Venue {
  id: string;
  name: string;
  city: string;
}

interface PastEvent {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  eventType: string;
  maxStalls: number;
  bookedStalls: number;
  categories: string[];
  lastEventInfo: string | null;
  organizer: { name: string; company: string | null };
  reviewCount: number;
  avgRating: number | null;
  feedbackComments: string[];
}

function CreateEventForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(false);
  const [stallCategoryInput, setStallCategoryInput] = useState("");
  const [stallCategoriesList, setStallCategoriesList] = useState<string[]>([]);
  const [pastEvents, setPastEvents] = useState<PastEvent[]>([]);
  const [loadingPastEvents, setLoadingPastEvents] = useState(false);
  const [selectedPastId, setSelectedPastId] = useState("");
  const [venueDemand, setVenueDemand] = useState<{ category: string; count: number }[]>([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [form, setForm] = useState({
    title: "",
    description: "",
    shortDescription: "",
    categoryId: "",
    venueId: "",
    startDate: "",
    endDate: "",
    startTime: "09:00",
    endTime: "18:00",
    eventType: "WEEKEND_COMMUNITY",
    maxStalls: 20,
    basePrice: 3000,
    bookingDeadline: "",
    parkingInfo: "",
    lastEventInfo: "",
    cancellationPolicy: "Full refund if cancelled 7 days before the event. 50% refund within 3-7 days. No refund within 3 days.",
  });

  useEffect(() => {
    const preVenueId = searchParams.get("venueId") || "";
    Promise.all([
      fetch("/api/categories").then((r) => r.json()),
      fetch("/api/venues").then((r) => r.json()),
    ]).then(([catData, venData]) => {
      setCategories(catData.categories || []);
      setVenues(venData.venues || []);
      if (preVenueId) {
        setForm((p) => ({ ...p, venueId: preVenueId }));
        fetchPastEvents(preVenueId);
        fetchVenueDemand(preVenueId);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchPastEvents = useCallback(async (venueId: string) => {
    if (!venueId) { setPastEvents([]); setSelectedPastId(""); return; }
    setLoadingPastEvents(true);
    try {
      const res = await fetch(`/api/venues/${venueId}/past-events`);
      const data = await res.json();
      setPastEvents(data.pastEvents || []);
      setSelectedPastId("");
    } catch {
      setPastEvents([]);
    } finally {
      setLoadingPastEvents(false);
    }
  }, []);

  const fetchVenueDemand = useCallback(async (venueId: string) => {
    if (!venueId) { setVenueDemand([]); setTotalVotes(0); return; }
    try {
      const res = await fetch(`/api/demand-votes?venueId=${venueId}`);
      const data = await res.json();
      setVenueDemand(data.grouped || []);
      setTotalVotes(data.totalVotes || 0);
    } catch {
      setVenueDemand([]);
      setTotalVotes(0);
    }
  }, []);

  const selectedPastEvent = pastEvents.find((e) => e.id === selectedPastId) ?? null;

  const copyFromPastEvent = () => {
    if (!selectedPastEvent) return;
    setForm((p) => ({
      ...p,
      eventType: selectedPastEvent.eventType,
      maxStalls: selectedPastEvent.maxStalls,
      startTime: selectedPastEvent.startTime,
      endTime: selectedPastEvent.endTime,
    }));
    if (selectedPastEvent.categories.length > 0) {
      setStallCategoriesList(selectedPastEvent.categories);
    }
    toast.success("Copied settings from past event");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const value = e.target.type === "number" ? parseInt(e.target.value) || 0 : e.target.value;
    setForm({ ...form, [e.target.name]: value });
    if (e.target.name === "venueId") {
      fetchPastEvents(e.target.value);
      fetchVenueDemand(e.target.value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          stallCategories: stallCategoriesList.length > 0 ? JSON.stringify(stallCategoriesList) : null,
          lastEventInfo: form.lastEventInfo || null,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Event created! Now add stalls.");
        router.push(`/dashboard/manager/events/${data.event.id}/stalls`);
      } else {
        toast.error(data.error || "Failed to create event");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create New Event</h1>
        <p className="text-gray-500">Fill in the details to create your event</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><h2 className="font-semibold">Basic Details</h2></CardHeader>
          <CardContent className="space-y-4">
            <Input
              id="title" name="title" label="Event Title"
              value={form.title} onChange={handleChange}
              placeholder="e.g., Weekend Bazaar at Aparna Sarovar"
              required
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={4}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Describe your event..."
              />
            </div>
            <Input
              id="shortDescription" name="shortDescription" label="Short Description"
              value={form.shortDescription} onChange={handleChange}
              placeholder="One-line summary"
            />
            <div className="grid grid-cols-2 gap-4">
              <Select
                id="categoryId" name="categoryId" label="Category"
                value={form.categoryId} onChange={handleChange}
                placeholder="Select category"
                options={categories.map((c) => ({ value: c.id, label: c.name }))}
              />
              <Select
                id="eventType" name="eventType" label="Event Type"
                value={form.eventType} onChange={handleChange}
                options={[
                  { value: "WEEKDAY_CORPORATE", label: "Corporate (Weekday)" },
                  { value: "WEEKEND_COMMUNITY", label: "Community (Weekend)" },
                  { value: "WEDDING", label: "Wedding" },
                  { value: "EXHIBITION", label: "Exhibition" },
                  { value: "FESTIVAL", label: "Festival" },
                ]}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><h2 className="font-semibold">Venue & Schedule</h2></CardHeader>
          <CardContent className="space-y-4">
            <Select
              id="venueId" name="venueId" label="Venue"
              value={form.venueId} onChange={handleChange}
              placeholder="Select venue"
              options={venues.map((v) => ({ value: v.id, label: `${v.name}, ${v.city}` }))}
            />

            {/* Past Events at this Venue */}
            {form.venueId && (
              <div className="rounded-lg border border-indigo-100 bg-indigo-50/50 p-4 space-y-3">
                <h4 className="text-sm font-semibold text-indigo-800 flex items-center gap-2">
                  <History className="h-4 w-4" />
                  Previous Events at this Venue
                </h4>

                {loadingPastEvents ? (
                  <div className="text-sm text-indigo-400 animate-pulse">Loading past events…</div>
                ) : pastEvents.length === 0 ? (
                  <p className="text-sm text-indigo-400">No previous events at this venue.</p>
                ) : (
                  <>
                    {/* Dropdown */}
                    <div className="relative">
                      <select
                        value={selectedPastId}
                        onChange={(e) => setSelectedPastId(e.target.value)}
                        className="w-full appearance-none rounded-lg border border-indigo-200 bg-white px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">— Select a past event to view details —</option>
                        {pastEvents.map((pe) => (
                          <option key={pe.id} value={pe.id}>
                            {pe.title} ({new Date(pe.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })})
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-400 pointer-events-none" />
                    </div>

                    {/* Selected event detail card */}
                    {selectedPastEvent && (
                      <div className="bg-white rounded-lg border border-indigo-100 p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-semibold text-gray-900 text-sm">{selectedPastEvent.title}</div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              Organised by{" "}
                              <span className="font-medium text-indigo-700">
                                {selectedPastEvent.organizer.company || selectedPastEvent.organizer.name}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={copyFromPastEvent}
                            className="flex items-center gap-1 text-xs bg-indigo-600 text-white px-2.5 py-1.5 rounded-lg hover:bg-indigo-700 flex-shrink-0"
                          >
                            <Copy className="h-3 w-3" /> Copy Settings
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                          <div className="flex items-center gap-1.5 text-gray-600">
                            <Calendar className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                            {new Date(selectedPastEvent.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                            {selectedPastEvent.startDate !== selectedPastEvent.endDate &&
                              ` – ${new Date(selectedPastEvent.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`}
                          </div>
                          <div className="flex items-center gap-1.5 text-gray-600">
                            <Clock className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                            {selectedPastEvent.startTime} – {selectedPastEvent.endTime}
                          </div>
                          <div className="text-gray-600">
                            <span className="text-gray-400">Type: </span>
                            {getEventTypeLabel(selectedPastEvent.eventType)}
                          </div>
                          <div className="text-gray-600">
                            <span className="text-gray-400">Stalls: </span>
                            <span className="font-medium">{selectedPastEvent.bookedStalls}</span>
                            <span className="text-gray-400"> / {selectedPastEvent.maxStalls} booked</span>
                          </div>
                        </div>

                        {selectedPastEvent.categories.length > 0 && (
                          <div>
                            <div className="text-xs text-gray-500 mb-1.5">Categories in last event:</div>
                            <div className="flex flex-wrap gap-1.5">
                              {selectedPastEvent.categories.map((cat) => (
                                <span key={cat} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">
                                  {cat}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {selectedPastEvent.avgRating !== null && (
                          <div className="flex items-center gap-2">
                            <Star className="h-4 w-4 fill-yellow-400 stroke-yellow-400" />
                            <span className="text-sm font-medium text-gray-800">{selectedPastEvent.avgRating}</span>
                            <span className="text-xs text-gray-400">from {selectedPastEvent.reviewCount} review{selectedPastEvent.reviewCount !== 1 ? "s" : ""}</span>
                          </div>
                        )}

                        {selectedPastEvent.feedbackComments.length > 0 && (
                          <div>
                            <div className="text-xs text-gray-500 mb-1.5">Vendor feedback:</div>
                            <div className="space-y-1">
                              {selectedPastEvent.feedbackComments.map((comment, i) => (
                                <p key={i} className="text-xs text-gray-600 bg-gray-50 rounded px-2 py-1.5 italic">
                                  &ldquo;{comment}&rdquo;
                                </p>
                              ))}
                            </div>
                          </div>
                        )}

                        {selectedPastEvent.lastEventInfo && (
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Organiser notes:</div>
                            <p className="text-xs text-gray-600 bg-gray-50 rounded px-2 py-1.5">
                              {selectedPastEvent.lastEventInfo}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}

                {/* Manual notes field */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Additional notes for this event (visible to vendors)
                  </label>
                  <textarea
                    name="lastEventInfo"
                    value={form.lastEventInfo}
                    onChange={handleChange}
                    rows={2}
                    className="block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    placeholder="e.g., Great footfall expected. Last time all stalls were sold out by Day 2."
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Input
                id="startDate" name="startDate" label="Start Date"
                type="date" value={form.startDate} onChange={handleChange} required
              />
              <Input
                id="endDate" name="endDate" label="End Date"
                type="date" value={form.endDate} onChange={handleChange} required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                id="startTime" name="startTime" label="Start Time"
                type="time" value={form.startTime} onChange={handleChange}
              />
              <Input
                id="endTime" name="endTime" label="End Time"
                type="time" value={form.endTime} onChange={handleChange}
              />
            </div>
            <Input
              id="bookingDeadline" name="bookingDeadline" label="Booking Deadline"
              type="date" value={form.bookingDeadline} onChange={handleChange}
            />
          </CardContent>
        </Card>

        {form.eventType && (
          <VendorMixPanel eventType={form.eventType} maxStalls={form.maxStalls} />
        )}

        <Card>
          <CardHeader><h2 className="font-semibold">Pricing & Stalls</h2></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                id="maxStalls" name="maxStalls" label="Max Stalls"
                type="number" value={form.maxStalls.toString()} onChange={handleChange}
              />
              <Input
                id="basePrice" name="basePrice" label="Base Price (INR)"
                type="number" value={form.basePrice.toString()} onChange={handleChange}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stall Categories</label>
              <p className="text-xs text-gray-500 mb-2">Add categories vendors can choose from (e.g., Womens Wear, Food, Electronics)</p>
              {form.venueId && venueDemand.length > 0 && (
                <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="text-xs font-semibold text-amber-900 mb-2 flex items-center gap-1">
                    <span>🔥</span>
                    <span>Resident demand at this venue ({totalVotes} votes)</span>
                    <span className="text-amber-700 font-normal ml-1">— tap to add</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {venueDemand.slice(0, 6).map((d) => {
                      const already = stallCategoriesList.includes(d.category);
                      const pct = totalVotes > 0 ? Math.round((d.count / totalVotes) * 100) : 0;
                      return (
                        <button
                          key={d.category}
                          type="button"
                          disabled={already}
                          onClick={() => setStallCategoriesList([...stallCategoriesList, d.category])}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border transition-colors ${
                            already
                              ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                              : "bg-white text-amber-800 border-amber-300 hover:bg-amber-100"
                          }`}
                        >
                          {already && <Check className="h-3 w-3" />}
                          {d.category}
                          <span className="text-amber-500 font-medium">{pct}%</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={stallCategoryInput}
                  onChange={(e) => setStallCategoryInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (stallCategoryInput.trim() && !stallCategoriesList.includes(stallCategoryInput.trim())) {
                        setStallCategoriesList([...stallCategoriesList, stallCategoryInput.trim()]);
                        setStallCategoryInput("");
                      }
                    }
                  }}
                  placeholder="Type a category and press Enter"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (stallCategoryInput.trim() && !stallCategoriesList.includes(stallCategoryInput.trim())) {
                      setStallCategoriesList([...stallCategoriesList, stallCategoryInput.trim()]);
                      setStallCategoryInput("");
                    }
                  }}
                >
                  Add
                </Button>
              </div>
              {stallCategoriesList.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {stallCategoriesList.map((cat) => (
                    <span
                      key={cat}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm"
                    >
                      {cat}
                      <button
                        type="button"
                        onClick={() => setStallCategoriesList(stallCategoriesList.filter((c) => c !== cat))}
                        className="text-indigo-400 hover:text-indigo-600 ml-1"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><h2 className="font-semibold">Parking & Policies</h2></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Parking Information</label>
              <textarea
                name="parkingInfo"
                value={form.parkingInfo}
                onChange={handleChange}
                rows={2}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g., Parking is allocated for this event in B1-Visitor Parking. Please use Gate 2 entrance."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cancellation Policy</label>
              <textarea
                name="cancellationPolicy"
                value={form.cancellationPolicy}
                onChange={handleChange}
                rows={3}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" isLoading={loading}>Create Event</Button>
        </div>
      </form>
    </div>
  );
}

export default function CreateEventPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20 text-gray-400">Loading form…</div>}>
      <CreateEventForm />
    </Suspense>
  );
}
