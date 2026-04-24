"use client";

import { useState, useEffect } from "react";
import { Bell, Mail, MessageCircle, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import toast from "react-hot-toast";

interface Prefs {
  inApp: boolean;
  email: boolean;
  whatsapp: boolean;
  whatsappNo: string | null;
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? "bg-indigo-600" : "bg-gray-200"}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`} />
    </button>
  );
}

export default function NotificationPrefsPage() {
  const [prefs, setPrefs] = useState<Prefs>({ inApp: true, email: true, whatsapp: false, whatsappNo: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/notification-preferences")
      .then((r) => r.json())
      .then((d) => setPrefs({ ...d.prefs, whatsappNo: d.prefs.whatsappNo || "" }))
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/notification-preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Preferences saved");
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="max-w-lg mx-auto px-4 py-8"><div className="h-48 bg-gray-100 rounded-xl animate-pulse" /></div>;

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Notification Settings</h1>
      <p className="text-sm text-gray-500 mb-6">Choose how you want to be notified about bookings, events, and updates.</p>

      <div className="space-y-4">
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-indigo-50 flex items-center justify-center">
                  <Bell className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">In-App Notifications</p>
                  <p className="text-xs text-gray-500">Alerts inside Stallmate dashboard</p>
                </div>
              </div>
              <Toggle checked={prefs.inApp} onChange={(v) => setPrefs((p) => ({ ...p, inApp: v }))} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center">
                  <Mail className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Email Notifications</p>
                  <p className="text-xs text-gray-500">Sent to your registered email</p>
                </div>
              </div>
              <Toggle checked={prefs.email} onChange={(v) => setPrefs((p) => ({ ...p, email: v }))} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-green-50 flex items-center justify-center">
                  <MessageCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">WhatsApp Notifications</p>
                  <p className="text-xs text-gray-500">Instant alerts on WhatsApp</p>
                </div>
              </div>
              <Toggle checked={prefs.whatsapp} onChange={(v) => setPrefs((p) => ({ ...p, whatsapp: v }))} />
            </div>
            {prefs.whatsapp && (
              <div>
                <label className="text-xs font-medium text-gray-600">WhatsApp Number</label>
                <input
                  value={prefs.whatsappNo || ""}
                  onChange={(e) => setPrefs((p) => ({ ...p, whatsappNo: e.target.value }))}
                  placeholder="+91 98765 43210"
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <p className="text-xs text-gray-400 mt-1">Include country code (e.g. +91 for India)</p>
              </div>
            )}
            {!process.env.NEXT_PUBLIC_WATI_ENABLED && (
              <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
                WhatsApp delivery is being set up. You will be notified when it goes live.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 bg-gray-50 rounded-xl p-4">
        <p className="text-xs font-medium text-gray-700 mb-2">You get notified for:</p>
        <ul className="space-y-1">
          {["Booking confirmed / cancelled", "New event at subscribed venue", "Gate pass approved", "New review received", "Payment received", "Event reminders (24h before)"].map((item) => (
            <li key={item} className="flex items-center gap-2 text-xs text-gray-600">
              <Check className="h-3.5 w-3.5 text-green-500 flex-shrink-0" /> {item}
            </li>
          ))}
        </ul>
      </div>

      <Button onClick={save} isLoading={saving} className="w-full mt-5">
        Save Preferences
      </Button>
    </div>
  );
}
