"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Send, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import toast from "react-hot-toast";

interface Vendor {
  id: string;
  name: string;
  email: string;
}

export default function BroadcastPage() {
  const params = useParams();
  const eventId = params.eventId as string;

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loadingVendors, setLoadingVendors] = useState(true);
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);

  const fetchVendors = useCallback(async () => {
    try {
      const res = await fetch(`/api/events/${eventId}/broadcast`);
      const data = await res.json();
      setVendors(data.vendors || []);
    } catch {
      toast.error("Failed to load vendors");
    } finally {
      setLoadingVendors(false);
    }
  }, [eventId]);

  useEffect(() => { fetchVendors(); }, [fetchVendors]);

  const handleSend = async () => {
    if (!subject.trim() || !content.trim()) {
      toast.error("Subject and message are required");
      return;
    }
    setSending(true);
    try {
      const res = await fetch(`/api/events/${eventId}/broadcast`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, content }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`Message sent to ${data.count} vendor${data.count !== 1 ? "s" : ""}!`);
      setSubject("");
      setContent("");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to send broadcast");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/dashboard/manager/events/${eventId}`}>
          <ArrowLeft className="h-5 w-5 text-gray-500 hover:text-gray-700" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Broadcast Message</h1>
          <p className="text-sm text-gray-500">Send a message to all booked vendors</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Recipients preview */}
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-4 w-4 text-indigo-600" />
              <span className="font-medium text-gray-900">
                Recipients
                {vendors.length > 0 && (
                  <span className="ml-2 bg-indigo-100 text-indigo-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                    {vendors.length}
                  </span>
                )}
              </span>
            </div>
            {loadingVendors ? (
              <div className="space-y-2">
                {[1, 2].map((i) => <div key={i} className="h-5 bg-gray-100 rounded animate-pulse" />)}
              </div>
            ) : vendors.length === 0 ? (
              <p className="text-sm text-gray-500">No booked vendors yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {vendors.map((v) => (
                  <span key={v.id} className="inline-flex items-center text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                    {v.name}
                  </span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Compose form */}
        <Card>
          <CardContent className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Important update about the event"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
                placeholder="Write your message to all vendors..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
              <p className="text-xs text-gray-400 mt-1">{content.length} characters</p>
            </div>

            <Button
              onClick={handleSend}
              disabled={sending || vendors.length === 0 || !subject.trim() || !content.trim()}
              className="w-full"
            >
              <Send className="h-4 w-4 mr-2" />
              {sending ? "Sending..." : `Send to All ${vendors.length} Vendor${vendors.length !== 1 ? "s" : ""}`}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
