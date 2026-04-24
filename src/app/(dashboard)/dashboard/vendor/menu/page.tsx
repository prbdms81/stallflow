"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Plus, Trash2, Edit2, QrCode, ToggleLeft, ToggleRight, Copy, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import toast from "react-hot-toast";
import QRCode from "qrcode";

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string | null;
  isAvailable: boolean;
}

const EMPTY_FORM = { name: "", description: "", price: "", category: "" };

export default function VendorMenuPage() {
  const { data: session } = useSession();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<MenuItem | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [copied, setCopied] = useState(false);

  const menuUrl =
    typeof window !== "undefined" && session?.user?.id
      ? `${window.location.origin}/menu/${session.user.id}`
      : "";

  useEffect(() => {
    if (!session?.user?.id) return;
    fetch(`/api/stall-menu?vendorId=${session.user.id}`)
      .then((r) => r.json())
      .then((d) => setItems(d.items || []))
      .finally(() => setLoading(false));
  }, [session]);

  useEffect(() => {
    if (menuUrl) {
      QRCode.toDataURL(menuUrl, { width: 256, margin: 2 })
        .then(setQrDataUrl)
        .catch(() => {});
    }
  }, [menuUrl]);

  const openAdd = () => { setEditItem(null); setForm(EMPTY_FORM); setShowForm(true); };
  const openEdit = (item: MenuItem) => {
    setEditItem(item);
    setForm({ name: item.name, description: item.description || "", price: String(item.price), category: item.category || "" });
    setShowForm(true);
  };

  const save = async () => {
    if (!form.name || !form.price) return toast.error("Name and price are required");
    setSaving(true);
    try {
      const url = editItem ? `/api/stall-menu/${editItem.id}` : "/api/stall-menu";
      const method = editItem ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, price: parseFloat(form.price) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (editItem) {
        setItems((prev) => prev.map((i) => i.id === editItem.id ? data.item : i));
      } else {
        setItems((prev) => [...prev, data.item]);
      }
      setShowForm(false);
      toast.success(editItem ? "Item updated" : "Item added");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const toggleAvailable = async (item: MenuItem) => {
    const res = await fetch(`/api/stall-menu/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isAvailable: !item.isAvailable }),
    });
    if (res.ok) {
      setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, isAvailable: !i.isAvailable } : i));
    }
  };

  const deleteItem = async (id: string) => {
    if (!confirm("Delete this item?")) return;
    const res = await fetch(`/api/stall-menu/${id}`, { method: "DELETE" });
    if (res.ok) {
      setItems((prev) => prev.filter((i) => i.id !== id));
      toast.success("Deleted");
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(menuUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const grouped = items.reduce<Record<string, MenuItem[]>>((acc, item) => {
    const key = item.category || "Uncategorised";
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stall Menu & QR</h1>
          <p className="text-sm text-gray-500 mt-0.5">Customers scan your QR to browse & pay via UPI</p>
        </div>
        <Button onClick={openAdd} size="sm">
          <Plus className="h-4 w-4 mr-1" /> Add Item
        </Button>
      </div>

      {/* QR Code Card */}
      <Card className="mb-6">
        <CardContent className="py-5">
          <div className="flex flex-col sm:flex-row items-center gap-5">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="Menu QR" className="w-28 h-28 rounded-lg border" />
            ) : (
              <div className="w-28 h-28 rounded-lg bg-gray-100 flex items-center justify-center">
                <QrCode className="h-10 w-10 text-gray-300" />
              </div>
            )}
            <div className="flex-1 min-w-0 text-center sm:text-left">
              <p className="font-semibold text-gray-900">Your Stall QR Code</p>
              <p className="text-sm text-gray-500 mt-1">Print and display at your stall. Customers scan to see your menu and pay via UPI.</p>
              <div className="flex items-center gap-2 mt-3">
                <input
                  readOnly
                  value={menuUrl}
                  className="flex-1 text-xs bg-gray-50 border rounded-lg px-3 py-2 text-gray-600 truncate"
                />
                <button
                  onClick={copyLink}
                  className="flex items-center gap-1 text-xs bg-indigo-50 text-indigo-600 px-3 py-2 rounded-lg hover:bg-indigo-100"
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
              {qrDataUrl && (
                <a
                  href={qrDataUrl}
                  download="stallmate-menu-qr.png"
                  className="inline-block mt-2 text-xs text-indigo-600 hover:underline"
                >
                  Download QR for printing
                </a>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Menu Items */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-sm">No items yet. Add your first menu item.</p>
        </div>
      ) : (
        Object.entries(grouped).map(([cat, catItems]) => (
          <div key={cat} className="mb-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">{cat}</h3>
            <div className="space-y-2">
              {catItems.map((item) => (
                <Card key={item.id}>
                  <CardContent className="py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`font-medium text-sm ${!item.isAvailable ? "text-gray-400 line-through" : "text-gray-900"}`}>
                            {item.name}
                          </span>
                          {!item.isAvailable && (
                            <span className="text-xs text-red-500">Unavailable</span>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-xs text-gray-400 truncate">{item.description}</p>
                        )}
                        <p className="text-sm font-semibold text-indigo-600 mt-0.5">₹{item.price.toFixed(0)}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => toggleAvailable(item)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
                          {item.isAvailable
                            ? <ToggleRight className="h-4.5 w-4.5 text-green-500" />
                            : <ToggleLeft className="h-4.5 w-4.5" />}
                        </button>
                        <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button onClick={() => deleteItem(item.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))
      )}

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5">
            <h2 className="text-lg font-bold mb-4">{editItem ? "Edit Item" : "Add Menu Item"}</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600">Item Name *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Masala Chai"
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Price (₹) *</label>
                <input
                  value={form.price}
                  onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                  type="number"
                  placeholder="0"
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Category</label>
                <input
                  value={form.category}
                  onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                  placeholder="e.g. Beverages, Snacks"
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Description</label>
                <input
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Optional short description"
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 py-2.5 rounded-xl border text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? "Saving..." : editItem ? "Update" : "Add Item"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
