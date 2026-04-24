"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Zap, Plus, Trash2, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Link from "next/link";
import toast from "react-hot-toast";
import { formatCurrency } from "@/lib/utils";

interface UtilityBill {
  id: string;
  type: string;
  units: number;
  rate: number;
  amount: number;
  notes: string | null;
}

interface BookingRow {
  id: string;
  stall: { stallNumber: string };
  vendor: { name: string };
  utilityBillings: UtilityBill[];
}

const UTILITY_TYPES = ["ELECTRICITY", "WATER", "GAS", "INTERNET"];

export default function UtilitiesPage() {
  const params = useParams();
  const eventId = params.eventId as string;

  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [targetBookingId, setTargetBookingId] = useState<string | null>(null);
  const [form, setForm] = useState({ type: "ELECTRICITY", units: "", rate: "", notes: "" });
  const [submitting, setSubmitting] = useState(false);

  async function fetchData() {
    setLoading(true);
    const res = await fetch(`/api/utility-billing?eventId=${eventId}`);
    if (res.ok) setBookings((await res.json()).bookings || []);
    setLoading(false);
  }

  useEffect(() => { fetchData(); }, [eventId]);

  async function handleAddCharge() {
    if (!targetBookingId || !form.units || !form.rate) { toast.error("Fill all fields"); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/utility-billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: targetBookingId, ...form }),
      });
      if (!res.ok) { toast.error((await res.json()).error || "Failed"); return; }
      toast.success("Charge added");
      setTargetBookingId(null);
      setForm({ type: "ELECTRICITY", units: "", rate: "", notes: "" });
      fetchData();
    } catch { toast.error("Something went wrong"); }
    finally { setSubmitting(false); }
  }

  async function handleDelete(billId: string) {
    if (!confirm("Delete this charge?")) return;
    const res = await fetch(`/api/utility-billing?billId=${billId}`, { method: "DELETE" });
    if (res.ok) { toast.success("Deleted"); fetchData(); }
    else toast.error("Failed");
  }

  const totalRevenue = bookings.reduce(
    (sum, b) => sum + b.utilityBillings.reduce((s, u) => s + u.amount, 0),
    0
  );

  const vendorTotals = bookings.map((b) => ({
    vendor: b.vendor.name,
    stall: b.stall.stallNumber,
    total: b.utilityBillings.reduce((s, u) => s + u.amount, 0),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/dashboard/manager`} className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Utility Billing</h1>
          <p className="text-gray-500 text-sm">Manage electricity, water, and other charges</p>
        </div>
      </div>

      <Card className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
        <CardContent className="flex items-center justify-between">
          <div>
            <div className="text-sm text-amber-100">Total Utility Revenue</div>
            <div className="text-3xl font-bold">{formatCurrency(totalRevenue)}</div>
          </div>
          <Zap className="h-10 w-10 text-amber-200" />
        </CardContent>
      </Card>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="animate-pulse h-24 bg-gray-100 rounded-xl" />)}</div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No bookings found for this event.</div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => {
            const vendorTotal = b.utilityBillings.reduce((s, u) => s + u.amount, 0);
            return (
              <Card key={b.id}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <div className="font-semibold text-gray-900">
                      Stall #{b.stall.stallNumber} — {b.vendor.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      Total charges: {formatCurrency(vendorTotal)}
                    </div>
                  </div>
                  <Button size="sm" onClick={() => setTargetBookingId(b.id)}>
                    <Plus className="h-4 w-4 mr-1" /> Add Charge
                  </Button>
                </CardHeader>
                <CardContent>
                  {b.utilityBillings.length === 0 ? (
                    <p className="text-sm text-gray-400">No charges yet.</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left border-b text-gray-500">
                          <th className="pb-2 font-medium">Type</th>
                          <th className="pb-2 font-medium">Units</th>
                          <th className="pb-2 font-medium">Rate</th>
                          <th className="pb-2 font-medium">Amount</th>
                          <th className="pb-2 font-medium">Notes</th>
                          <th className="pb-2" />
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {b.utilityBillings.map((u) => (
                          <tr key={u.id}>
                            <td className="py-2">{u.type}</td>
                            <td className="py-2">{u.units}</td>
                            <td className="py-2">₹{u.rate}</td>
                            <td className="py-2 font-medium">{formatCurrency(u.amount)}</td>
                            <td className="py-2 text-gray-500">{u.notes || "—"}</td>
                            <td className="py-2">
                              <button onClick={() => handleDelete(u.id)} className="text-red-400 hover:text-red-600">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {vendorTotals.some((v) => v.total > 0) && (
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-gray-900">Vendor Summary</h3>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {vendorTotals.filter((v) => v.total > 0).map((v, i) => (
                <div key={i} className="flex justify-between py-2 text-sm">
                  <span className="text-gray-700">Stall #{v.stall} — {v.vendor}</span>
                  <span className="font-semibold text-indigo-600">{formatCurrency(v.total)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Modal isOpen={!!targetBookingId} onClose={() => setTargetBookingId(null)} title="Add Utility Charge" size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
            >
              {UTILITY_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          {[
            { label: "Units", key: "units", placeholder: "e.g. 10" },
            { label: "Rate per Unit (₹)", key: "rate", placeholder: "e.g. 8" },
            { label: "Notes", key: "notes", placeholder: "Optional" },
          ].map(({ label, key, placeholder }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <input
                type={key === "notes" ? "text" : "number"}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder={placeholder}
                value={form[key as keyof typeof form]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              />
            </div>
          ))}
          {form.units && form.rate && (
            <div className="bg-amber-50 rounded-lg p-3 text-sm text-amber-800">
              Amount: {formatCurrency(parseFloat(form.units) * parseFloat(form.rate))}
            </div>
          )}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setTargetBookingId(null)}>Cancel</Button>
            <Button className="flex-1" onClick={handleAddCharge} disabled={submitting}>
              {submitting ? "Adding..." : "Add Charge"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
