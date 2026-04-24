"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { CheckCircle, Users } from "lucide-react";

export default function VisitorCheckInPage() {
  const { eventId } = useParams();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [eventTitle, setEventTitle] = useState("");

  const submit = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/footfall", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, name, phone }),
      });
      const data = await res.json();
      if (res.ok) {
        setEventTitle(data.event?.title || "");
        setDone(true);
      }
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white flex items-center justify-center px-4">
        <div className="text-center max-w-xs">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900">Welcome!</h1>
          {eventTitle && <p className="text-gray-500 mt-2">You are checked in to <span className="font-medium text-gray-700">{eventTitle}</span></p>}
          <p className="text-sm text-gray-400 mt-4">Enjoy the event! Explore the stalls and support local businesses.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white flex items-center justify-center px-4">
      <div className="w-full max-w-xs">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users className="h-8 w-8 text-indigo-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Quick Check-In</h1>
          <p className="text-sm text-gray-500 mt-1">Optional — takes 5 seconds</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-600">Your Name (optional)</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Priya"
              className="mt-1 w-full border rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">Phone (optional)</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              type="tel"
              className="mt-1 w-full border rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            onClick={submit}
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? "Checking in…" : "Check In →"}
          </button>
          <p className="text-xs text-center text-gray-400">Your info is used only for event footfall tracking</p>
        </div>
      </div>
    </div>
  );
}
