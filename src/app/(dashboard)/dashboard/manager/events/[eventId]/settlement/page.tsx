"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { IndianRupee, Download, CheckCircle, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import toast from "react-hot-toast";

interface BreakdownRow {
  bookingId: string;
  bookingNumber: string;
  vendorName: string;
  vendorEmail: string;
  stallNumber: string;
  stallCategory: string;
  amountPaid: number;
  utilityCharges: number;
  paymentStatus: string;
  bookingStatus: string;
}

interface Settlement {
  totalStallRevenue: number;
  platformFee: number;
  sponsorRevenue: number;
  utilityRevenue: number;
  refunds: number;
  netToOrganizer: number;
  breakdown: BreakdownRow[];
  eventTitle: string;
}

function fmt(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

export default function SettlementPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;

  const [data, setData] = useState<Settlement | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}/settlement`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load");
      setData(json);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load settlement");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const downloadCSV = () => {
    if (!data) return;
    const headers = ["Booking #", "Vendor", "Email", "Stall", "Category", "Amount Paid", "Utility Charges", "Payment Status", "Booking Status"];
    const rows = data.breakdown.map((r) => [
      r.bookingNumber,
      r.vendorName,
      r.vendorEmail,
      r.stallNumber,
      r.stallCategory,
      r.amountPaid,
      r.utilityCharges,
      r.paymentStatus,
      r.bookingStatus,
    ]);
    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `settlement-${eventId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const markCompleted = async () => {
    setCompleting(true);
    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "COMPLETED" }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      toast.success("Event marked as completed");
      router.push(`/dashboard/manager`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update");
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-500 animate-pulse">Loading settlement report...</p>
      </div>
    );
  }

  if (!data) return null;

  const summaryCards = [
    { label: "Stall Revenue", value: data.totalStallRevenue, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Platform Fee (5%)", value: -data.platformFee, color: "text-red-600", bg: "bg-red-50" },
    { label: "Sponsor Revenue", value: data.sponsorRevenue, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "Utility Revenue", value: data.utilityRevenue, color: "text-sky-600", bg: "bg-sky-50" },
    { label: "Refunds", value: -data.refunds, color: "text-orange-600", bg: "bg-orange-50" },
    { label: "Net to Organizer", value: data.netToOrganizer, color: "text-gray-900", bg: "bg-gray-100", bold: true },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settlement Report</h1>
          <p className="text-gray-500 text-sm">{data.eventTitle}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={downloadCSV}>
            <Download className="h-4 w-4 mr-1.5" />
            Download CSV
          </Button>
          <Button size="sm" onClick={markCompleted} isLoading={completing}>
            <CheckCircle className="h-4 w-4 mr-1.5" />
            Mark Completed
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {summaryCards.map((c) => (
          <Card key={c.label}>
            <CardContent className={`py-4 ${c.bg}`}>
              <p className="text-xs text-gray-500 mb-1">{c.label}</p>
              <p className={`text-xl font-${c.bold ? "bold" : "semibold"} ${c.color} flex items-center gap-1`}>
                <IndianRupee className="h-4 w-4" />
                {fmt(Math.abs(c.value)).replace("₹", "")}
                {c.value < 0 && <span className="text-sm font-normal">(deducted)</span>}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {data.sponsorRevenue > 0 && (
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-800">Sponsor Income</h2>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Total paid sponsor contributions: <span className="font-semibold text-indigo-600">{fmt(data.sponsorRevenue)}</span>
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-800">Per-Vendor Breakdown</h2>
        </CardHeader>
        <CardContent className="p-0">
          {data.breakdown.length === 0 ? (
            <div className="flex items-center gap-2 p-6 text-gray-400">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">No bookings found for this event</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                  <tr>
                    <th className="px-4 py-3 text-left">Vendor</th>
                    <th className="px-4 py-3 text-left">Stall</th>
                    <th className="px-4 py-3 text-left">Category</th>
                    <th className="px-4 py-3 text-right">Stall Amount</th>
                    <th className="px-4 py-3 text-right">Utility</th>
                    <th className="px-4 py-3 text-left">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.breakdown.map((row) => (
                    <tr key={row.bookingId} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800">{row.vendorName}</p>
                        <p className="text-xs text-gray-400">{row.vendorEmail}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600">#{row.stallNumber}</td>
                      <td className="px-4 py-3 text-gray-600">{row.stallCategory}</td>
                      <td className="px-4 py-3 text-right font-medium text-gray-800">{fmt(row.amountPaid)}</td>
                      <td className="px-4 py-3 text-right text-sky-600">{row.utilityCharges > 0 ? fmt(row.utilityCharges) : "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          row.paymentStatus === "PAID"
                            ? "bg-green-100 text-green-700"
                            : row.bookingStatus === "CANCELLED"
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}>
                          {row.bookingStatus === "CANCELLED" ? "Cancelled" : row.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
