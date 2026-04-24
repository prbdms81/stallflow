"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ArrowLeft, ChevronRight, ShoppingBag, CreditCard, CheckCircle, Car } from "lucide-react";
import Button from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import StallLayout from "@/components/stalls/StallLayout";
import { formatCurrency } from "@/lib/utils";
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

interface BookingEvent {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  parkingInfo: string | null;
  venue: {
    name: string;
    city: string;
  };
  stalls: Stall[];
}

export default function BookStallPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();
  const [event, setEvent] = useState<BookingEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStall, setSelectedStall] = useState<Stall | null>(null);
  const [step, setStep] = useState(1); // 1: Select Stall, 2: Review & Pay
  const [submitting, setSubmitting] = useState(false);
  const [notes, setNotes] = useState("");
  const [setupKits, setSetupKits] = useState<{ id: string; name: string; description: string | null; items: string; price: number }[]>([]);
  const [selectedKit, setSelectedKit] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/events/${params.eventId}`)
      .then((res) => res.json())
      .then((data) => {
        setEvent(data.event || null);
        // Fetch setup kits for this venue
        if (data.event?.venue) {
          fetch(`/api/setup-kits?venueId=${data.event.venueId || ""}`)
            .then((r) => r.json())
            .then((d) => setSetupKits(d.kits || []))
            .catch(() => {});
        }
      })
      .catch(() => setEvent(null))
      .finally(() => setLoading(false));
  }, [params.eventId]);

  if (authStatus === "unauthenticated") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold mb-2">Login Required</h2>
        <p className="text-gray-600 mb-4">Please login to book a stall.</p>
        <Link href="/login"><Button>Login to Continue</Button></Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-64 bg-gray-200 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold mb-2">Event not found</h2>
        <Link href="/events"><Button variant="outline">Browse Events</Button></Link>
      </div>
    );
  }

  const stallAmount = selectedStall?.price || 0;
  const kitPrice = selectedKit ? (setupKits.find((k) => k.id === selectedKit)?.price || 0) : 0;
  const subtotal = stallAmount + kitPrice;
  const tax = Math.round(subtotal * 0.18);
  const total = subtotal + tax;

  const handleStallSelect = (stall: Stall) => {
    if (stall.status !== "AVAILABLE") return;
    setSelectedStall(stall);
  };

  const handleBooking = async () => {
    if (!selectedStall || !session) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: event.id,
          stallId: selectedStall.id,
          stallCategory: selectedStall.stallCategory,
          amount: stallAmount,
          tax,
          totalAmount: total,
          notes,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Booking created! Redirecting to payment...");
        router.push(`/dashboard/vendor/bookings`);
      } else {
        toast.error(data.error || "Booking failed");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center text-sm text-gray-500 mb-6">
        <Link href={`/events/${event.id}`} className="hover:text-indigo-600 flex items-center">
          <ArrowLeft className="h-4 w-4 mr-1" /> {event.title}
        </Link>
        <ChevronRight className="h-4 w-4 mx-2" />
        <span className="text-gray-900">Book a Stall</span>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-8">
        {[
          { num: 1, label: "Select Stall", icon: ShoppingBag },
          { num: 2, label: "Review & Pay", icon: CreditCard },
        ].map((s, i) => (
          <div key={s.num} className="flex items-center">
            <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${step >= s.num ? "bg-indigo-50 text-indigo-600" : "text-gray-400"}`}>
              {step > s.num ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <s.icon className="h-5 w-5" />
              )}
              <span className="text-sm font-medium hidden sm:inline">{s.label}</span>
            </div>
            {i < 1 && <ChevronRight className="h-4 w-4 text-gray-300 mx-2" />}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {/* Step 1: Select Stall */}
          {step === 1 && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold">Select Your Stall</h2>
                <p className="text-sm text-gray-500">Click on a green stall to select it</p>
              </CardHeader>
              <CardContent>
                <StallLayout
                  stalls={event.stalls}
                  selectedStallId={selectedStall?.id}
                  onStallClick={handleStallSelect}
                />
                <div className="mt-4 flex justify-end">
                  <Button onClick={() => setStep(2)} disabled={!selectedStall}>
                    Review Booking
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Review & Pay */}
          {step === 2 && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold">Review Your Booking</h2>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Event</span>
                    <span className="font-medium">{event.title}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Venue</span>
                    <span>{event.venue.name}, {event.venue.city}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Stall</span>
                    <span>#{selectedStall?.stallNumber} ({selectedStall?.type} - {selectedStall?.size} ft)</span>
                  </div>
                  {selectedStall?.stallCategory && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Category</span>
                      <span>{selectedStall.stallCategory}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Date</span>
                    <span>
                      {new Date(event.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      {event.startDate !== event.endDate &&
                        ` - ${new Date(event.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Timings</span>
                    <span>{event.startTime} - {event.endTime}</span>
                  </div>
                </div>

                {event.parkingInfo && (
                  <div className="bg-blue-50 rounded-lg p-4 flex items-start gap-3">
                    <Car className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-blue-900">Parking Information</div>
                      <p className="text-sm text-blue-700">{event.parkingInfo}</p>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes (Optional)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Any special requirements or notes..."
                  />
                </div>

                {/* Setup Kit Add-on */}
                {setupKits.length > 0 && (
                  <div className="bg-indigo-50 rounded-lg p-4">
                    <div className="text-sm font-medium text-indigo-900 mb-2">Quick Setup Kit (Optional)</div>
                    <div className="space-y-2">
                      {setupKits.map((kit) => {
                        const items: string[] = (() => { try { return JSON.parse(kit.items); } catch { return []; } })();
                        return (
                          <label
                            key={kit.id}
                            className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                              selectedKit === kit.id ? "border-indigo-500 bg-white" : "border-transparent bg-white/50 hover:bg-white/80"
                            }`}
                          >
                            <input
                              type="radio"
                              name="setupKit"
                              checked={selectedKit === kit.id}
                              onChange={() => setSelectedKit(selectedKit === kit.id ? null : kit.id)}
                              className="mt-0.5"
                            />
                            <div className="flex-1">
                              <div className="flex justify-between">
                                <span className="text-sm font-medium text-gray-900">{kit.name}</span>
                                <span className="text-sm font-medium text-indigo-600">+{formatCurrency(kit.price)}</span>
                              </div>
                              {items.length > 0 && (
                                <p className="text-xs text-gray-500 mt-0.5">{items.join(" + ")}</p>
                              )}
                            </div>
                          </label>
                        );
                      })}
                      {selectedKit && (
                        <button onClick={() => setSelectedKit(null)} className="text-xs text-gray-500 hover:text-gray-700">
                          Remove setup kit
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Stall Price</span>
                    <span>{formatCurrency(stallAmount)}</span>
                  </div>
                  {kitPrice > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Setup Kit</span>
                      <span>{formatCurrency(kitPrice)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">GST (18%)</span>
                    <span>{formatCurrency(tax)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg pt-2 border-t">
                    <span>Total</span>
                    <span className="text-indigo-600">{formatCurrency(total)}</span>
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                  <Button size="lg" onClick={handleBooking} isLoading={submitting}>
                    Pay {formatCurrency(total)}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar Summary */}
        <div>
          <Card className="sticky top-24">
            <CardContent className="space-y-3">
              <h3 className="font-semibold text-gray-900">Booking Summary</h3>
              <div className="text-sm text-gray-600">{event.title}</div>
              <div className="text-sm text-gray-500">{event.venue.name}, {event.venue.city}</div>

              {selectedStall && (
                <div className="pt-3 border-t space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Stall #{selectedStall.stallNumber}</span>
                    <span className="font-medium">{formatCurrency(selectedStall.price)}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {selectedStall.type} - {selectedStall.size} ft
                    {selectedStall.stallCategory && ` | ${selectedStall.stallCategory}`}
                  </div>
                </div>
              )}

              {selectedStall && (
                <div className="pt-3 border-t">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">GST (18%)</span>
                    <span>{formatCurrency(tax)}</span>
                  </div>
                  <div className="flex justify-between font-bold mt-2">
                    <span>Total</span>
                    <span className="text-indigo-600">{formatCurrency(total)}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
