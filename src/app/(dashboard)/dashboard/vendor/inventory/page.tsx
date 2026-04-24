"use client";

import { useState, useEffect } from "react";
import {
  Package, Plus, Pencil, Trash2, Loader2, X, Check,
  ChevronDown, TrendingUp, ShoppingCart, IndianRupee,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import toast from "react-hot-toast";
import { formatCurrency } from "@/lib/utils";

interface InventoryItem {
  id: string;
  name: string;
  unit: string;
  costPrice: number;
  sellPrice: number;
  defaultQty: number;
}

interface BookingOption {
  id: string;
  eventTitle: string;
  eventDate: string;
  stallNumber: string;
  footfall: number;
}

interface PlannerRow {
  item: InventoryItem;
  multiplier: number;
  suggestedQty: number;
  estCost: number;
  estRevenue: number;
  estProfit: number;
}

const EMPTY_FORM = { name: "", unit: "units", costPrice: "", sellPrice: "", defaultQty: "" };

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [bookings, setBookings] = useState<BookingOption[]>([]);
  const [selectedBookingId, setSelectedBookingId] = useState("");
  const [plannerRows, setPlannerRows] = useState<PlannerRow[]>([]);
  const [plannerLoading, setPlannerLoading] = useState(false);

  const fetchItems = () => {
    fetch("/api/inventory")
      .then((r) => r.json())
      .then((d) => setItems(d.items || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const fetchBookings = () => {
    fetch("/api/bookings?status=CONFIRMED&upcoming=true")
      .then((r) => r.json())
      .then((d) => {
        const opts: BookingOption[] = (d.bookings || []).map((b: {
          id: string;
          event: { title: string; startDate: string; visitorCheckIns?: { id: string }[] };
          stall: { stallNumber: string };
        }) => ({
          id: b.id,
          eventTitle: b.event?.title || "Event",
          eventDate: b.event?.startDate || "",
          stallNumber: b.stall?.stallNumber || "",
          footfall: b.event?.visitorCheckIns?.length || 0,
        }));
        setBookings(opts);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchItems();
    fetchBookings();
  }, []);

  const openAdd = () => {
    setEditItem(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (item: InventoryItem) => {
    setEditItem(item);
    setForm({
      name: item.name,
      unit: item.unit,
      costPrice: String(item.costPrice),
      sellPrice: String(item.sellPrice),
      defaultQty: String(item.defaultQty),
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Item name required"); return; }
    setSaving(true);
    try {
      const body = {
        name: form.name.trim(),
        unit: form.unit,
        costPrice: form.costPrice,
        sellPrice: form.sellPrice,
        defaultQty: form.defaultQty,
      };
      const res = editItem
        ? await fetch(`/api/inventory?itemId=${editItem.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
        : await fetch("/api/inventory", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

      if (res.ok) {
        toast.success(editItem ? "Item updated" : "Item added");
        setShowModal(false);
        fetchItems();
      } else {
        toast.error("Failed to save item");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this item?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/inventory?itemId=${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Deleted");
        setItems((prev) => prev.filter((i) => i.id !== id));
      } else {
        toast.error("Failed to delete");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setDeletingId(null);
    }
  };

  const runPlanner = () => {
    if (!selectedBookingId || items.length === 0) return;
    setPlannerLoading(true);
    const booking = bookings.find((b) => b.id === selectedBookingId);
    const footfall = booking?.footfall || 0;
    const multiplier = footfall >= 1000 ? 2 : footfall >= 500 ? 1.5 : 1;

    const rows: PlannerRow[] = items.map((item) => {
      const suggestedQty = Math.ceil(item.defaultQty * multiplier);
      return {
        item,
        multiplier,
        suggestedQty,
        estCost: suggestedQty * item.costPrice,
        estRevenue: suggestedQty * item.sellPrice,
        estProfit: suggestedQty * (item.sellPrice - item.costPrice),
      };
    });

    setPlannerRows(rows);
    setPlannerLoading(false);
  };

  const totalPlanCost = plannerRows.reduce((s, r) => s + r.estCost, 0);
  const totalPlanRevenue = plannerRows.reduce((s, r) => s + r.estRevenue, 0);
  const totalPlanProfit = plannerRows.reduce((s, r) => s + r.estProfit, 0);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Planner</h1>
          <p className="text-sm text-gray-500">Manage items and plan quantities for events</p>
        </div>
        <Button size="sm" onClick={openAdd}>
          <Plus className="h-4 w-4 mr-1" /> Add Item
        </Button>
      </div>

      {/* Inventory List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 mb-8">
          <Package className="h-10 w-10 mx-auto mb-2" />
          <p className="font-medium text-gray-600">No inventory items yet</p>
          <p className="text-sm mt-1">Add items you sell at stalls</p>
        </div>
      ) : (
        <Card className="mb-8">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500 text-xs bg-gray-50">
                    <th className="px-4 py-3 font-medium">Item</th>
                    <th className="px-4 py-3 font-medium">Unit</th>
                    <th className="px-4 py-3 font-medium text-right">Cost</th>
                    <th className="px-4 py-3 font-medium text-right">Sell Price</th>
                    <th className="px-4 py-3 font-medium text-right">Default Qty</th>
                    <th className="px-4 py-3 font-medium text-right">Margin</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {items.map((item) => {
                    const margin = item.sellPrice > 0
                      ? Math.round(((item.sellPrice - item.costPrice) / item.sellPrice) * 100)
                      : 0;
                    return (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{item.name}</td>
                        <td className="px-4 py-3 text-gray-500">{item.unit}</td>
                        <td className="px-4 py-3 text-right text-gray-600">{formatCurrency(item.costPrice)}</td>
                        <td className="px-4 py-3 text-right text-gray-600">{formatCurrency(item.sellPrice)}</td>
                        <td className="px-4 py-3 text-right text-gray-600">{item.defaultQty}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${margin >= 40 ? "bg-green-100 text-green-700" : margin >= 20 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-600"}`}>
                            {margin}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => openEdit(item)} className="text-gray-400 hover:text-indigo-600">
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              disabled={deletingId === item.id}
                              className="text-gray-400 hover:text-red-500"
                            >
                              {deletingId === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Event Planner Section */}
      {items.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-indigo-500" /> Event Planner
          </h2>
          <Card className="mb-4">
            <CardContent>
              <p className="text-sm text-gray-500 mb-3">
                Select an upcoming booking to see suggested quantities based on expected footfall.
              </p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <select
                    value={selectedBookingId}
                    onChange={(e) => setSelectedBookingId(e.target.value)}
                    className="w-full appearance-none border border-gray-300 rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select a booking...</option>
                    {bookings.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.eventTitle} — Stall #{b.stallNumber}
                        {b.footfall > 0 ? ` (${b.footfall} check-ins)` : ""}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
                <Button size="sm" onClick={runPlanner} disabled={!selectedBookingId || plannerLoading}>
                  {plannerLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Plan"}
                </Button>
              </div>

              {bookings.length === 0 && (
                <p className="text-xs text-gray-400 mt-2">No upcoming confirmed bookings found.</p>
              )}
            </CardContent>
          </Card>

          {plannerRows.length > 0 && (
            <Card>
              <CardContent>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                    <ShoppingCart className="h-4 w-4 text-indigo-500" /> Suggested Quantities
                  </h3>
                  <span className="text-xs text-gray-400">
                    {plannerRows[0].multiplier}x multiplier
                    {plannerRows[0].multiplier === 2 ? " (large event, 1000+ footfall)" :
                     plannerRows[0].multiplier === 1.5 ? " (medium event, 500+ footfall)" :
                     " (small event)"}
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-gray-500 text-xs">
                        <th className="pb-2 font-medium">Item</th>
                        <th className="pb-2 font-medium text-right">Qty</th>
                        <th className="pb-2 font-medium text-right">Est. Cost</th>
                        <th className="pb-2 font-medium text-right">Est. Revenue</th>
                        <th className="pb-2 font-medium text-right">Est. Profit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {plannerRows.map((row) => (
                        <tr key={row.item.id}>
                          <td className="py-2 font-medium text-gray-900">{row.item.name}</td>
                          <td className="py-2 text-right text-gray-600">{row.suggestedQty} {row.item.unit}</td>
                          <td className="py-2 text-right text-red-500">{formatCurrency(row.estCost)}</td>
                          <td className="py-2 text-right text-green-600">{formatCurrency(row.estRevenue)}</td>
                          <td className="py-2 text-right font-semibold">
                            <span className={row.estProfit >= 0 ? "text-green-600" : "text-red-500"}>
                              {formatCurrency(row.estProfit)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t font-semibold text-sm">
                        <td className="pt-3 text-gray-900">Total</td>
                        <td />
                        <td className="pt-3 text-right text-red-500">{formatCurrency(totalPlanCost)}</td>
                        <td className="pt-3 text-right text-green-600">{formatCurrency(totalPlanRevenue)}</td>
                        <td className="pt-3 text-right">
                          <span className={totalPlanProfit >= 0 ? "text-green-600" : "text-red-500"}>
                            {formatCurrency(totalPlanProfit)}
                          </span>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                <div className="mt-3 p-3 bg-indigo-50 rounded-lg flex items-center gap-2">
                  <IndianRupee className="h-4 w-4 text-indigo-600 flex-shrink-0" />
                  <p className="text-xs text-indigo-700">
                    Projected margin:{" "}
                    <strong>
                      {totalPlanRevenue > 0
                        ? Math.round(((totalPlanRevenue - totalPlanCost) / totalPlanRevenue) * 100)
                        : 0}%
                    </strong>
                    {" "}on estimated revenue of {formatCurrency(totalPlanRevenue)}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-semibold text-gray-900">{editItem ? "Edit Item" : "Add Item"}</h2>
              <button onClick={() => setShowModal(false)}>
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Item Name *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Samosa"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Unit</label>
                  <input
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    placeholder="pieces / kg / litres"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Default Qty</label>
                  <input
                    type="number"
                    value={form.defaultQty}
                    onChange={(e) => setForm({ ...form, defaultQty: e.target.value })}
                    placeholder="100"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Cost Price (per unit)</label>
                  <input
                    type="number"
                    value={form.costPrice}
                    onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
                    placeholder="10"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Sell Price (per unit)</label>
                  <input
                    type="number"
                    value={form.sellPrice}
                    onChange={(e) => setForm({ ...form, sellPrice: e.target.value })}
                    placeholder="20"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-2 p-4 border-t">
              <Button className="flex-1" onClick={handleSave} isLoading={saving}>
                <Check className="h-4 w-4 mr-1" /> {editItem ? "Update" : "Add Item"}
              </Button>
              <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
