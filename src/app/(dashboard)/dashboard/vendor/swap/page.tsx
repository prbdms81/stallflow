"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeftRight, Loader2, CheckCircle, XCircle, Clock,
  MessageCircle, IndianRupee, ExternalLink,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Badge from "@/components/ui/Badge";
import toast from "react-hot-toast";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Booking {
  id: string;
  bookingNumber: string;
  status: string;
  totalAmount: number;
  event: { title: string; startDate: string; venue: { name: string } };
  stall: { stallNumber: string; type: string; price: number };
}

interface Transfer {
  id: string;
  bookingId: string;
  price: number;
  reason: string | null;
  status: string;
  toVendorId: string | null;
  createdAt: string;
}

export default function VendorSwapPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showList, setShowList] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState("");
  const [price, setPrice] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/bookings").then((r) => r.json()),
      fetch("/api/stall-transfers?status=LISTED").then((r) => r.json()),
    ])
      .then(([bookingData, transferData]) => {
        const confirmed = (bookingData.bookings || []).filter(
          (b: Booking) => b.status === "CONFIRMED"
        );
        setBookings(confirmed);

        // Also fetch claimed transfers for this vendor
        fetch("/api/stall-transfers?status=CLAIMED")
          .then((r) => r.json())
          .then((claimedData) => {
            setTransfers([...(transferData.transfers || []), ...(claimedData.transfers || [])]);
          });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleList = async () => {
    if (!selectedBooking || !price) {
      toast.error("Select a booking and set a price");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/stall-transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: selectedBooking,
          price,
          reason: reason.trim() || null,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setTransfers([data.transfer, ...transfers]);
        setShowList(false);
        setSelectedBooking("");
        setPrice("");
        setReason("");
        toast.success("Stall listed for swap!");
      } else {
        toast.error("Failed to list stall");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const handleAction = async (transferId: string, action: string) => {
    try {
      const res = await fetch("/api/stall-transfers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transferId, action }),
      });
      if (res.ok) {
        const msg = action === "complete" ? "Transfer completed!" : "Listing cancelled";
        toast.success(msg);
        setTransfers(transfers.map((t) =>
          t.id === transferId ? { ...t, status: action === "complete" ? "COMPLETED" : "CANCELLED" } : t
        ));
      }
    } catch {
      toast.error("Something went wrong");
    }
  };

  const shareOnWhatsApp = (t: Transfer) => {
    const booking = bookings.find((b) => b.id === t.bookingId);
    const msg = [
      `🔄 I'm giving up my stall — interested?`,
      ``,
      booking ? `Event: ${booking.event.title}` : "",
      booking ? `Venue: ${booking.event.venue.name}` : "",
      booking ? `Stall: #${booking.stall.stallNumber}` : "",
      `Price: ${formatCurrency(t.price)}`,
      t.reason ? `Reason: ${t.reason}` : "",
      ``,
      `Claim it: ${window.location.origin}/swap`,
    ].filter(Boolean).join("\n");
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
      </div>
    );
  }

  const existingTransferBookings = new Set(transfers.map((t) => t.bookingId));
  const eligibleBookings = bookings.filter((b) => !existingTransferBookings.has(b.id));
  const myTransfers = transfers.filter((t) => t.status !== "CANCELLED" && t.status !== "COMPLETED");
  const pastTransfers = transfers.filter((t) => t.status === "CANCELLED" || t.status === "COMPLETED");

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stall Swap</h1>
          <p className="text-sm text-gray-500">List your stall if you can&apos;t attend an event</p>
        </div>
        <div className="flex gap-2">
          <Link href="/swap">
            <Button size="sm" variant="outline">
              <ExternalLink className="h-4 w-4 mr-1" /> Browse
            </Button>
          </Link>
          {eligibleBookings.length > 0 && (
            <Button size="sm" onClick={() => setShowList(!showList)}>
              <ArrowLeftRight className="h-4 w-4 mr-1" /> List
            </Button>
          )}
        </div>
      </div>

      {/* List Form */}
      {showList && (
        <Card className="mb-6">
          <CardContent className="py-5 space-y-4">
            <Select
              label="Select Booking to Swap"
              options={eligibleBookings.map((b) => ({
                value: b.id,
                label: `${b.event.title} — Stall #${b.stall.stallNumber} (${formatCurrency(b.totalAmount)})`,
              }))}
              value={selectedBooking}
              onChange={(e) => {
                setSelectedBooking(e.target.value);
                const booking = eligibleBookings.find((b) => b.id === e.target.value);
                if (booking) setPrice(String(Math.round(booking.totalAmount * 0.8)));
              }}
              placeholder="Choose a booking"
            />
            <Input
              label="Asking Price"
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Amount in ₹"
              helperText="Tip: Price 10-20% below original for a quick swap"
            />
            <Input
              label="Reason (optional)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Family emergency, schedule conflict"
            />
            <div className="flex gap-2">
              <Button onClick={handleList} isLoading={saving}>List for Swap</Button>
              <Button variant="ghost" onClick={() => setShowList(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Listings */}
      {myTransfers.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Your Listings ({myTransfers.length})
          </h2>
          <div className="space-y-3">
            {myTransfers.map((t) => (
              <Card key={t.id} className={t.status === "CLAIMED" ? "border-green-300" : ""}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <IndianRupee className="h-4 w-4 text-indigo-500" />
                      <span className="font-bold text-gray-900">{formatCurrency(t.price)}</span>
                    </div>
                    {t.status === "LISTED" ? (
                      <Badge variant="warning"><Clock className="h-3 w-3 mr-1" /> Waiting</Badge>
                    ) : (
                      <Badge variant="success"><CheckCircle className="h-3 w-3 mr-1" /> Claimed!</Badge>
                    )}
                  </div>

                  {t.reason && <p className="text-xs text-gray-500 italic mb-2">{t.reason}</p>}
                  <p className="text-xs text-gray-400">Listed {formatDate(t.createdAt)}</p>

                  <div className="flex gap-2 mt-3 pt-2 border-t border-gray-100">
                    {t.status === "CLAIMED" && (
                      <Button size="sm" onClick={() => handleAction(t.id, "complete")}>
                        <CheckCircle className="h-3.5 w-3.5 mr-1" /> Confirm Transfer
                      </Button>
                    )}
                    {t.status === "LISTED" && (
                      <>
                        <button
                          onClick={() => shareOnWhatsApp(t)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-medium"
                        >
                          <MessageCircle className="h-3.5 w-3.5" /> Share
                        </button>
                        <button
                          onClick={() => handleAction(t.id, "cancel")}
                          className="flex items-center gap-1 px-3 py-1.5 text-red-500 hover:bg-red-50 rounded-lg text-xs font-medium"
                        >
                          <XCircle className="h-3.5 w-3.5" /> Cancel
                        </button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Past Transfers */}
      {pastTransfers.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Past ({pastTransfers.length})
          </h2>
          <div className="space-y-2">
            {pastTransfers.map((t) => (
              <Card key={t.id} className="opacity-60">
                <CardContent className="py-3 flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-gray-700">{formatCurrency(t.price)}</span>
                    <span className="text-xs text-gray-400 ml-2">{formatDate(t.createdAt)}</span>
                  </div>
                  {t.status === "COMPLETED" ? (
                    <Badge variant="success">Transferred</Badge>
                  ) : (
                    <Badge>Cancelled</Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {myTransfers.length === 0 && pastTransfers.length === 0 && (
        <div className="text-center py-12 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
          <ArrowLeftRight className="h-10 w-10 mx-auto mb-2" />
          <p className="font-medium text-gray-600">No swap listings yet</p>
          <p className="text-sm mt-1">
            {eligibleBookings.length > 0
              ? "List a stall you can't attend — another vendor will grab it"
              : "You need confirmed bookings to list a stall for swap"}
          </p>
        </div>
      )}
    </div>
  );
}
