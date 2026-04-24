"use client";

import { useState, useEffect } from "react";
import {
  QrCode, Calendar, MapPin, Car, CheckCircle, Clock,
  Loader2, MessageCircle, ExternalLink, Zap,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Badge from "@/components/ui/Badge";
import toast from "react-hot-toast";
import { formatDate } from "@/lib/utils";

interface GatePass {
  id: string;
  bookingId: string;
  vendorName: string;
  businessName: string;
  eventTitle: string;
  venueName: string;
  stallNumber: string;
  vehicleNumber: string | null;
  vehicleType: string | null;
  qrCode: string;
  validFrom: string;
  validTo: string;
  status: string;
}

interface Booking {
  id: string;
  bookingNumber: string;
  status: string;
  event: { title: string; startDate: string; venue: { name: string } };
  stall: { stallNumber: string };
}

const vehicleTypes = [
  { value: "", label: "No Vehicle" },
  { value: "TWO_WHEELER", label: "Two Wheeler" },
  { value: "FOUR_WHEELER", label: "Four Wheeler" },
  { value: "VAN", label: "Van / Tempo" },
];

export default function GatePassPage() {
  const [passes, setPasses] = useState<GatePass[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showGenerate, setShowGenerate] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [vehicleType, setVehicleType] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/gate-pass").then((r) => r.json()),
      fetch("/api/bookings").then((r) => r.json()),
    ])
      .then(([passData, bookingData]) => {
        setPasses(passData.gatePasses || []);
        const existingPassBookings = new Set(
          (passData.gatePasses || []).map((p: GatePass) => p.bookingId)
        );
        const eligible = (bookingData.bookings || []).filter(
          (b: Booking) => b.status === "CONFIRMED" && !existingPassBookings.has(b.id)
        );
        setBookings(eligible);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleGenerate = async () => {
    if (!selectedBooking) {
      toast.error("Please select a booking");
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch("/api/gate-pass", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: selectedBooking,
          vehicleNumber: vehicleNumber.trim() || null,
          vehicleType: vehicleType || null,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setPasses([data.gatePass, ...passes]);
        setBookings(bookings.filter((b) => b.id !== selectedBooking));
        setShowGenerate(false);
        setSelectedBooking("");
        setVehicleNumber("");
        setVehicleType("");
        toast.success("Gate pass generated!");
      } else {
        toast.error("Failed to generate gate pass");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setGenerating(false);
    }
  };

  const shareOnWhatsApp = (pass: GatePass) => {
    const verifyUrl = `${window.location.origin}/verify/${pass.qrCode}`;
    const msg = [
      `Gate Pass - ${pass.businessName}`,
      ``,
      `Event: ${pass.eventTitle}`,
      `Venue: ${pass.venueName}`,
      `Stall: #${pass.stallNumber}`,
      `Valid: ${formatDate(pass.validFrom)} - ${formatDate(pass.validTo)}`,
      pass.vehicleNumber ? `Vehicle: ${pass.vehicleNumber}` : "",
      ``,
      `Verify: ${verifyUrl}`,
    ]
      .filter(Boolean)
      .join("\n");

    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
      </div>
    );
  }

  const activePasses = passes.filter((p) => new Date(p.validTo) >= new Date());
  const expiredPasses = passes.filter((p) => new Date(p.validTo) < new Date());

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gate Passes</h1>
          <p className="text-sm text-gray-500">
            Show QR code at venue gate for instant entry
          </p>
        </div>
        {bookings.length > 0 && (
          <Button size="sm" onClick={() => setShowGenerate(!showGenerate)}>
            <QrCode className="h-4 w-4 mr-1" /> Generate
          </Button>
        )}
      </div>

      {/* Auto-generate prompt */}
      {bookings.length > 0 && !showGenerate && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <Zap className="h-5 w-5 text-indigo-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-indigo-800">
              {bookings.length} confirmed booking{bookings.length !== 1 ? "s" : ""} without a gate
              pass
            </p>
            <p className="text-xs text-indigo-600 mt-0.5">
              Generate gate passes now so you can enter the venue without delays
            </p>
          </div>
          <Button size="sm" onClick={() => setShowGenerate(true)}>
            Generate
          </Button>
        </div>
      )}

      {/* Generate Form */}
      {showGenerate && (
        <Card className="mb-6">
          <CardContent className="py-5 space-y-4">
            <Select
              label="Select Booking"
              options={bookings.map((b) => ({
                value: b.id,
                label: `${b.event.title} — Stall #${b.stall.stallNumber}`,
              }))}
              value={selectedBooking}
              onChange={(e) => setSelectedBooking(e.target.value)}
              placeholder="Choose a booking"
            />
            <Select
              label="Vehicle Type (optional)"
              options={vehicleTypes}
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value)}
            />
            {vehicleType && (
              <Input
                label="Vehicle Number"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                placeholder="e.g. TS 09 AB 1234"
              />
            )}
            <div className="flex gap-2">
              <Button onClick={handleGenerate} isLoading={generating}>
                Generate Gate Pass
              </Button>
              <Button variant="ghost" onClick={() => setShowGenerate(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Passes */}
      {activePasses.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Active Passes ({activePasses.length})
          </h2>
          <div className="space-y-4">
            {activePasses.map((pass) => (
              <GatePassCard key={pass.id} pass={pass} onShare={shareOnWhatsApp} />
            ))}
          </div>
        </div>
      )}

      {/* Expired Passes */}
      {expiredPasses.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Past Passes ({expiredPasses.length})
          </h2>
          <div className="space-y-4">
            {expiredPasses.map((pass) => (
              <GatePassCard key={pass.id} pass={pass} onShare={shareOnWhatsApp} expired />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {passes.length === 0 && bookings.length === 0 && (
        <div className="text-center py-12 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
          <QrCode className="h-10 w-10 mx-auto mb-2" />
          <p className="font-medium text-gray-600">No gate passes yet</p>
          <p className="text-sm mt-1">
            Generate a gate pass after booking a stall for instant venue entry
          </p>
        </div>
      )}
    </div>
  );
}

function GatePassCard({
  pass,
  onShare,
  expired = false,
}: {
  pass: GatePass;
  onShare: (p: GatePass) => void;
  expired?: boolean;
}) {
  const verifyUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/verify/${pass.qrCode}`
      : "";

  return (
    <Card className={expired ? "opacity-60" : "border-green-200"}>
      <CardContent className="py-5">
        {/* QR Code Area */}
        <div className="text-center mb-4 pb-4 border-b border-dashed border-gray-200">
          <div className="inline-flex items-center justify-center w-32 h-32 bg-gray-900 rounded-xl mb-2">
            <div className="text-center">
              <QrCode className="h-12 w-12 text-white mx-auto mb-1" />
              <div className="text-[8px] text-gray-400 font-mono break-all px-2">
                {pass.qrCode}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center gap-2">
            {!expired ? (
              <Badge variant="success">
                <CheckCircle className="h-3 w-3 mr-1" /> Active
              </Badge>
            ) : (
              <Badge>
                <Clock className="h-3 w-3 mr-1" /> Expired
              </Badge>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="space-y-2 text-sm">
          <div className="font-semibold text-gray-900 text-lg">{pass.businessName}</div>
          <div className="flex items-center text-gray-600">
            <Calendar className="h-4 w-4 mr-2 text-indigo-500" />
            {pass.eventTitle}
          </div>
          <div className="flex items-center text-gray-600">
            <MapPin className="h-4 w-4 mr-2 text-green-500" />
            {pass.venueName} — Stall #{pass.stallNumber}
          </div>
          <div className="text-xs text-gray-400">
            Valid: {formatDate(pass.validFrom)} — {formatDate(pass.validTo)}
          </div>
          {pass.vehicleNumber && (
            <div className="flex items-center text-gray-600">
              <Car className="h-4 w-4 mr-2 text-blue-500" />
              {pass.vehicleNumber} ({pass.vehicleType?.replace("_", " ")})
            </div>
          )}
        </div>

        {/* Actions */}
        {!expired && (
          <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
            <button
              onClick={() => onShare(pass)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <MessageCircle className="h-4 w-4" /> Share on WhatsApp
            </button>
            <a
              href={verifyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-lg text-sm font-medium transition-colors"
            >
              <ExternalLink className="h-4 w-4" /> Verify Link
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
