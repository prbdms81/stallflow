"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  MapPin,
  Calendar,
  Clock,
  CheckCircle,
  ChevronRight,
  Phone,
  MessageCircle,
  Banknote,
  User,
  Store,
  Car,
  Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { t, LANG_LABELS, type Lang } from "@/lib/i18n";

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
  stallCategory: string | null;
}

interface SharedEvent {
  id: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  eventType: string;
  basePrice: number;
  maxStalls: number;
  bookedStalls: number;
  bannerImage: string | null;
  parkingInfo: string | null;
  upiId: string | null;
  categoryName: string;
  venue: { name: string; address: string; area: string | null; city: string; parkingNotes: string | null };
  organizerName: string;
  organizerPhone: string | null;
  stalls: Stall[];
  stallCategories: string | null;
}

interface BookingResult {
  booking: {
    id: string;
    bookingNumber: string;
    stallNumber: string;
    stallType: string;
    amount: number;
    tax: number;
    totalAmount: number;
  };
  upiLink: string | null;
  whatsappLink: string;
  organizerPhone: string | null;
}

const STALL_TYPE_COLORS: Record<string, string> = {
  STANDARD: "bg-emerald-500",
  PREMIUM: "bg-amber-500",
  CORNER: "bg-blue-500",
  FOOD_COURT: "bg-orange-500",
  KIOSK: "bg-purple-500",
};

export default function QuickBookPage() {
  const { token } = useParams();
  const [lang, setLang] = useState<Lang>("en");
  const [event, setEvent] = useState<SharedEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Step state
  const [step, setStep] = useState(1); // 1: Select, 2: Details, 3: Done
  const [selectedStall, setSelectedStall] = useState<Stall | null>(null);

  // Form fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [category] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [bookingResult, setBookingResult] = useState<BookingResult | null>(null);

  useEffect(() => {
    fetch(`/api/events/share?token=${token}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setEvent(d.event);
      })
      .catch(() => setError("Failed to load"))
      .finally(() => setLoading(false));
  }, [token]);

  const availableStalls = event?.stalls.filter((s) => s.status === "AVAILABLE") || [];

  const handleBook = async () => {
    if (!selectedStall || !event || !name.trim() || !phone.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/quick-book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: event.id,
          stallId: selectedStall.id,
          name: name.trim(),
          phone: phone.trim(),
          businessName: businessName.trim() || null,
          stallCategory: category || selectedStall.stallCategory,
          notes: notes.trim() || null,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setBookingResult(data);
        setStep(3);
      } else {
        setError(data.error || t("bookingFailed", lang));
      }
    } catch {
      setError(t("bookingFailed", lang));
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  // Error state
  if (error && !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <Store className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-gray-900">{t("eventNotFound", lang)}</h2>
          <p className="text-gray-500 text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (!event) return null;

  const stallAmount = selectedStall?.price || 0;
  const tax = Math.round(stallAmount * 0.18);
  const total = stallAmount + tax;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Language toggle — sticky top bar */}
      <div className="bg-white border-b sticky top-0 z-30">
        <div className="max-w-lg mx-auto px-4 py-2 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-500">StallMate</span>
          <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs">
            {(Object.keys(LANG_LABELS) as Lang[]).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-3 py-1 ${
                  lang === l
                    ? "bg-indigo-500 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                {LANG_LABELS[l]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Event Header Card */}
        <Card className="mb-6 overflow-hidden">
          {event.bannerImage && (
            <img
              src={event.bannerImage}
              alt={event.title}
              className="w-full h-40 object-cover"
            />
          )}
          <CardContent className="py-4">
            <h1 className="text-xl font-bold text-gray-900">{event.title}</h1>
            {event.description && (
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">{event.description}</p>
            )}

            <div className="grid grid-cols-1 gap-2 mt-4 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="h-4 w-4 text-indigo-500 flex-shrink-0" />
                <span>
                  {event.venue.name}, {event.venue.area || event.venue.city}
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span>
                  {formatDate(event.startDate)}
                  {event.startDate !== event.endDate &&
                    ` — ${formatDate(event.endDate)}`}
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="h-4 w-4 text-amber-500 flex-shrink-0" />
                <span>
                  {event.startTime} — {event.endTime}
                </span>
              </div>
              {event.parkingInfo && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Car className="h-4 w-4 text-blue-500 flex-shrink-0" />
                  <span>{event.parkingInfo}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between mt-4 pt-3 border-t">
              <div>
                <span className="text-xs text-gray-400">{t("startingFrom", lang)}</span>
                <div className="text-lg font-bold text-indigo-600">
                  {formatCurrency(event.basePrice)}
                  <span className="text-xs font-normal text-gray-400 ml-1">
                    /{t("perStall", lang)}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm font-medium text-green-600">
                  {event.maxStalls - event.bookedStalls} {t("stallsLeft", lang)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error banner */}
        {error && step !== 3 && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* ── STEP 1: Select Stall ── */}
        {step === 1 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              {t("selectStall", lang)}
            </h2>

            {/* Legend */}
            <div className="flex gap-4 mb-4 text-xs">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-emerald-500" /> {t("available", lang)}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-red-300" /> {t("booked", lang)}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-amber-300" /> {t("reserved", lang)}
              </span>
            </div>

            {/* Simple stall list (mobile-friendly, no complex layout) */}
            <div className="space-y-2">
              {event.stalls.map((stall) => {
                const isAvailable = stall.status === "AVAILABLE";
                const isSelected = selectedStall?.id === stall.id;

                return (
                  <button
                    key={stall.id}
                    disabled={!isAvailable}
                    onClick={() => setSelectedStall(stall)}
                    className={`w-full text-left rounded-xl border-2 px-4 py-3 transition-all ${
                      isSelected
                        ? "border-indigo-500 bg-indigo-50"
                        : isAvailable
                        ? "border-gray-200 bg-white hover:border-indigo-300"
                        : "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm ${
                            isAvailable
                              ? STALL_TYPE_COLORS[stall.type] || "bg-emerald-500"
                              : "bg-gray-300"
                          }`}
                        >
                          {stall.stallNumber}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {t("stallNo", lang)} #{stall.stallNumber}
                            {stall.name && ` — ${stall.name}`}
                          </div>
                          <div className="text-xs text-gray-500">
                            {stall.type} · {stall.size} ft
                            {stall.stallCategory && ` · ${stall.stallCategory}`}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900">
                          {formatCurrency(stall.price)}
                        </div>
                        {!isAvailable && (
                          <span className="text-xs text-red-500">{t("booked", lang)}</span>
                        )}
                      </div>
                    </div>
                    {isSelected && (
                      <div className="mt-2 flex items-center gap-1 text-xs text-indigo-600">
                        <CheckCircle className="h-3.5 w-3.5" /> Selected
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {availableStalls.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <Store className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">All stalls are booked</p>
              </div>
            )}

            {selectedStall && (
              <Button
                size="lg"
                className="w-full mt-6"
                onClick={() => {
                  setError("");
                  setStep(2);
                }}
              >
                {t("next", lang)} <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        )}

        {/* ── STEP 2: Your Details ── */}
        {step === 2 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {t("yourDetails", lang)}
            </h2>

            {/* Selected stall summary */}
            {selectedStall && (
              <Card className="mb-4 border-indigo-200 bg-indigo-50/50">
                <CardContent className="py-3">
                  <div className="flex items-center justify-between text-sm">
                    <span>
                      {t("stallNo", lang)} #{selectedStall.stallNumber} · {selectedStall.type} ·{" "}
                      {selectedStall.size} ft
                    </span>
                    <span className="font-bold text-indigo-600">
                      {formatCurrency(selectedStall.price)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <User className="h-3.5 w-3.5 inline mr-1" />
                  {t("fullName", lang)} *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={lang === "te" ? "మీ పేరు" : lang === "hi" ? "आपका नाम" : "Your name"}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Phone className="h-3.5 w-3.5 inline mr-1" />
                  {t("phoneNumber", lang)} *
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                    +91
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    placeholder="98765 43210"
                    className="flex-1 rounded-r-xl border border-gray-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Business Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Store className="h-3.5 w-3.5 inline mr-1" />
                  {t("businessName", lang)}{" "}
                  <span className="text-gray-400 font-normal">({t("optional", lang)})</span>
                </label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder={
                    lang === "te"
                      ? "మీ వ్యాపారం పేరు"
                      : lang === "hi"
                      ? "आपके व्यापार का नाम"
                      : "e.g. Ravi's Biryani"
                  }
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("notes", lang)}{" "}
                  <span className="text-gray-400 font-normal">({t("optional", lang)})</span>
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t("anySpecialNeeds", lang)}
                  rows={2}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Price breakdown */}
            <Card className="mt-6">
              <CardContent className="py-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t("stallPrice", lang)}</span>
                  <span>{formatCurrency(stallAmount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t("gst", lang)}</span>
                  <span>{formatCurrency(tax)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>{t("total", lang)}</span>
                  <span className="text-indigo-600">{formatCurrency(total)}</span>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                size="lg"
                className="flex-1"
                onClick={() => setStep(1)}
              >
                {t("back", lang)}
              </Button>
              <Button
                size="lg"
                className="flex-1"
                onClick={handleBook}
                isLoading={submitting}
                disabled={!name.trim() || phone.length < 10}
              >
                {t("confirmBooking", lang)}
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Confirmation ── */}
        {step === 3 && bookingResult && (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>

            <h2 className="text-xl font-bold text-gray-900">
              {t("bookingConfirmed", lang)}
            </h2>

            <Card className="mt-6 text-left">
              <CardContent className="py-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{t("bookingNumber", lang)}</span>
                  <span className="font-mono font-bold text-gray-900">
                    {bookingResult.booking.bookingNumber}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{t("stallNo", lang)}</span>
                  <span>#{bookingResult.booking.stallNumber} ({bookingResult.booking.stallType})</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{t("venue", lang)}</span>
                  <span>{event.venue.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{t("date", lang)}</span>
                  <span>{formatDate(event.startDate)}</span>
                </div>
                <div className="flex justify-between font-bold pt-2 border-t">
                  <span>{t("total", lang)}</span>
                  <span className="text-indigo-600">
                    {formatCurrency(bookingResult.booking.totalAmount)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Payment pending notice */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mt-4 text-sm text-amber-800">
              <Banknote className="h-4 w-4 inline mr-1" />
              {t("paymentPending", lang)}
            </div>

            {/* Action buttons */}
            <div className="space-y-3 mt-6">
              {/* UPI Pay button */}
              {bookingResult.upiLink && (
                <a
                  href={bookingResult.upiLink}
                  className="flex items-center justify-center gap-2 w-full bg-indigo-600 text-white font-medium py-3 rounded-xl hover:bg-indigo-700 transition-colors"
                >
                  <Banknote className="h-5 w-5" />
                  {t("payViaUpi", lang)} — {formatCurrency(bookingResult.booking.totalAmount)}
                </a>
              )}

              {/* Save to WhatsApp */}
              <a
                href={bookingResult.whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full bg-green-600 text-white font-medium py-3 rounded-xl hover:bg-green-700 transition-colors"
              >
                <MessageCircle className="h-5 w-5" />
                {t("shareOnWhatsApp", lang)}
              </a>

              {/* Contact organizer */}
              {bookingResult.organizerPhone && (
                <a
                  href={`tel:${bookingResult.organizerPhone}`}
                  className="flex items-center justify-center gap-2 w-full border-2 border-gray-200 text-gray-700 font-medium py-3 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <Phone className="h-5 w-5" />
                  {t("contactOrganizer", lang)}
                </a>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-gray-400 mt-8 pb-4">
          {t("poweredBy", lang)}
        </div>
      </div>
    </div>
  );
}
