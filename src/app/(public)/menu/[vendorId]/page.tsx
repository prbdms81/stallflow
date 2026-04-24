"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Minus, Plus, QrCode } from "lucide-react";

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string | null;
  image: string | null;
}

interface CartItem extends MenuItem {
  qty: number;
}

function buildUpiLink(upiId: string, amount: number, name: string, note: string) {
  const params = new URLSearchParams({
    pa: upiId,
    pn: name,
    am: amount.toFixed(2),
    cu: "INR",
    tn: note,
  });
  return `upi://pay?${params.toString()}`;
}

export default function StallMenuPage() {
  const { vendorId } = useParams();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [vendorName, setVendorName] = useState("");
  const [upiId, setUpiId] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCart, setShowCart] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/stall-menu?vendorId=${vendorId}`).then((r) => r.json()),
      fetch(`/api/vendors/${vendorId}?byUserId=1`).then((r) => r.json()),
    ])
      .then(([menuData, vendorData]) => {
        setItems(menuData.items || []);
        if (vendorData.vendor) {
          setVendorName(vendorData.vendor.businessName || vendorData.vendor.user?.name || "");
          setUpiId(vendorData.vendor.upiId || "");
        }
      })
      .finally(() => setLoading(false));
  }, [vendorId]);

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === item.id);
      if (existing) return prev.map((c) => c.id === item.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const changeQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev.map((c) => c.id === id ? { ...c, qty: c.qty + delta } : c).filter((c) => c.qty > 0)
    );
  };

  const total = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const cartCount = cart.reduce((s, c) => s + c.qty, 0);

  const grouped = items.reduce<Record<string, MenuItem[]>>((acc, item) => {
    const key = item.category || "Other";
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/2 mx-auto" />
          <div className="h-4 bg-gray-100 rounded w-1/3 mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 pb-28 pt-6">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <QrCode className="h-7 w-7 text-indigo-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">{vendorName || "Stall Menu"}</h1>
        <p className="text-sm text-gray-500 mt-1">Tap items to add, then pay via UPI</p>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p>Menu coming soon</p>
        </div>
      ) : (
        Object.entries(grouped).map(([cat, catItems]) => (
          <div key={cat} className="mb-6">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2 px-1">
              {cat}
            </h2>
            <div className="space-y-2">
              {catItems.map((item) => {
                const cartItem = cart.find((c) => c.id === item.id);
                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-xl border border-gray-100 shadow-sm flex items-center gap-3 p-3"
                  >
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 text-xl flex-shrink-0">
                        🍽
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm">{item.name}</p>
                      {item.description && (
                        <p className="text-xs text-gray-400 truncate">{item.description}</p>
                      )}
                      <p className="text-indigo-600 font-semibold text-sm mt-0.5">
                        ₹{item.price.toFixed(0)}
                      </p>
                    </div>
                    {cartItem ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => changeQty(item.id, -1)}
                          className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-4 text-center font-semibold text-sm">{cartItem.qty}</span>
                        <button
                          onClick={() => changeQty(item.id, 1)}
                          className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center hover:bg-indigo-200"
                        >
                          <Plus className="h-3.5 w-3.5 text-indigo-600" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addToCart(item)}
                        className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center hover:bg-indigo-700 flex-shrink-0"
                      >
                        <Plus className="h-4 w-4 text-white" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}

      {/* Floating cart bar */}
      {cartCount > 0 && (
        <div className="fixed bottom-4 left-4 right-4 max-w-lg mx-auto">
          <button
            onClick={() => setShowCart(true)}
            className="w-full bg-indigo-600 text-white rounded-2xl py-4 px-5 flex items-center justify-between shadow-xl"
          >
            <span className="bg-white/20 rounded-lg px-2 py-0.5 text-sm font-semibold">
              {cartCount} item{cartCount !== 1 ? "s" : ""}
            </span>
            <span className="font-semibold">View Order</span>
            <span className="font-semibold">₹{total.toFixed(0)}</span>
          </button>
        </div>
      )}

      {/* Cart / Checkout sheet */}
      {showCart && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full max-w-lg mx-auto rounded-t-2xl p-5 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Your Order</h2>
              <button onClick={() => setShowCart(false)} className="text-gray-400 text-xl">×</button>
            </div>

            <div className="space-y-3 mb-4">
              {cart.map((item) => (
                <div key={item.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-xs text-gray-400">₹{item.price} × {item.qty}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => changeQty(item.id, -1)}
                      className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs">−</button>
                    <span className="w-5 text-center text-sm font-semibold">{item.qty}</span>
                    <button onClick={() => changeQty(item.id, 1)}
                      className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs">+</button>
                    <span className="w-14 text-right text-sm font-semibold">
                      ₹{(item.price * item.qty).toFixed(0)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t pt-3 mb-4">
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>₹{total.toFixed(0)}</span>
              </div>
            </div>

            {upiId ? (
              <a
                href={buildUpiLink(
                  upiId,
                  total,
                  vendorName,
                  cart.map((c) => `${c.name}×${c.qty}`).join(", ")
                )}
                className="block w-full bg-green-600 text-white text-center py-4 rounded-xl font-semibold text-base hover:bg-green-700"
              >
                Pay ₹{total.toFixed(0)} via UPI
              </a>
            ) : (
              <div className="text-center text-sm text-gray-500 py-3 bg-gray-50 rounded-xl">
                Show this order to the vendor and pay directly
              </div>
            )}

            <p className="text-xs text-center text-gray-400 mt-3">
              Opens your UPI app (GPay, PhonePe, Paytm, etc.)
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
