"use client";

import { useState, useEffect, useCallback } from "react";
import { MessageCircle, Wifi, WifiOff, Copy, Bot, Phone } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import toast from "react-hot-toast";

interface WASession {
  id: string;
  phone: string;
  step: string;
  updatedAt: string;
  createdAt: string;
}

interface SessionsData {
  sessions: WASession[];
  total: number;
  active: number;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const STEP_LABELS: Record<string, string> = {
  IDLE: "Idle",
  MENU: "Main Menu",
  BROWSING: "Browsing Events",
  BOOKING_LOOKUP: "Booking Lookup",
};

export default function WhatsAppBotPage() {
  const [data, setData] = useState<SessionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [botActive, setBotActive] = useState<boolean | null>(null);

  // Simulate form state
  const [simPhone, setSimPhone] = useState("");
  const [simMessage, setSimMessage] = useState("");
  const [simLoading, setSimLoading] = useState(false);

  const webhookUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/webhooks/whatsapp`
      : "/api/webhooks/whatsapp";

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch("/api/whatsapp/sessions");
      if (!res.ok) throw new Error("Failed to load sessions");
      const json: SessionsData = await res.json();
      setData(json);
    } catch {
      toast.error("Could not load session data");
    } finally {
      setLoading(false);
    }
  }, []);

  // Check bot status by pinging the webhook health endpoint
  const checkBotStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/webhooks/whatsapp");
      setBotActive(res.ok);
    } catch {
      setBotActive(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
    checkBotStatus();
  }, [fetchSessions, checkBotStatus]);

  function copyWebhookUrl() {
    navigator.clipboard.writeText(webhookUrl).then(() => {
      toast.success("Webhook URL copied!");
    });
  }

  async function simulateMessage() {
    if (!simPhone.trim() || !simMessage.trim()) {
      toast.error("Enter both phone and message");
      return;
    }
    setSimLoading(true);
    try {
      const res = await fetch("/api/webhooks/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ waId: simPhone.replace(/\D/g, ""), text: simMessage }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Simulation failed");
      toast.success(`Bot replied (step → ${json.step}). Check server console for stub output.`);
      setSimMessage("");
      // Refresh sessions to reflect new/updated session
      await fetchSessions();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Simulation failed");
    } finally {
      setSimLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
            <MessageCircle className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">WhatsApp Bot</h1>
            <p className="text-sm text-gray-500">Automated booking inquiry assistant</p>
          </div>
        </div>

        {/* Status indicator */}
        <div className="flex items-center space-x-2 px-4 py-2 rounded-full border text-sm font-medium">
          {botActive === null ? (
            <span className="text-gray-400">Checking…</span>
          ) : botActive ? (
            <>
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <Wifi className="h-4 w-4 text-green-600" />
              <span className="text-green-700">Webhook Live</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <WifiOff className="h-4 w-4 text-red-500" />
              <span className="text-red-600">Webhook Error</span>
            </>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: "Total Sessions",
            value: data?.total ?? 0,
            icon: Bot,
            color: "text-indigo-600 bg-indigo-50",
          },
          {
            label: "Active (24 h)",
            value: data?.active ?? 0,
            icon: MessageCircle,
            color: "text-green-600 bg-green-50",
          },
          {
            label: "Messages Today",
            value: 0, // Extend with a messages-count endpoint when needed
            icon: Phone,
            color: "text-orange-600 bg-orange-50",
          },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center space-x-4 pt-4">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${stat.color}`}
              >
                <stat.icon className="h-6 w-6" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-sm text-gray-500">{stat.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Setup card */}
        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold text-gray-900 flex items-center space-x-2">
              <Wifi className="h-4 w-4 text-indigo-500" />
              <span>WATI Webhook Setup</span>
            </h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Paste this URL in your WATI dashboard under{" "}
              <span className="font-medium">Configuration → Webhook URL</span>:
            </p>
            <div className="flex items-center space-x-2">
              <code className="flex-1 text-xs bg-gray-50 border rounded-lg px-3 py-2 text-gray-700 break-all">
                {webhookUrl}
              </code>
              <button
                onClick={copyWebhookUrl}
                className="flex-shrink-0 p-2 rounded-lg border hover:bg-gray-50 text-gray-500 hover:text-gray-800 transition-colors"
                title="Copy"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-gray-400">
              The endpoint supports both POST (incoming messages) and GET (health check).
            </p>
          </CardContent>
        </Card>

        {/* Configure / env vars */}
        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold text-gray-900 flex items-center space-x-2">
              <Bot className="h-4 w-4 text-indigo-500" />
              <span>Required Environment Variables</span>
            </h2>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-gray-600">
              Add these to your <code className="bg-gray-100 px-1 rounded">.env</code> file to
              enable real WhatsApp sending:
            </p>
            {[
              {
                key: "WATI_API_URL",
                example: "https://live-mt-server.wati.io/xxxxx",
                desc: "Your WATI instance base URL",
              },
              {
                key: "WATI_API_KEY",
                example: "eyJ...",
                desc: "WATI Bearer token (API credentials page)",
              },
            ].map((env) => (
              <div key={env.key} className="rounded-lg border p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <code className="text-sm font-mono font-semibold text-indigo-700">{env.key}</code>
                  <span className="text-xs text-gray-400">required</span>
                </div>
                <p className="text-xs text-gray-500">{env.desc}</p>
                <code className="text-xs text-gray-400 block"># e.g. {env.example}</code>
              </div>
            ))}
            <p className="text-xs text-green-700 bg-green-50 rounded-lg px-3 py-2">
              Without these vars the bot runs in stub mode — messages are logged to the server
              console only, no real WhatsApp is sent.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Test / Simulate */}
      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-gray-900 flex items-center space-x-2">
            <MessageCircle className="h-4 w-4 text-green-500" />
            <span>Simulate Incoming Message</span>
          </h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Send a test message through the bot flow without a real WhatsApp handset. The bot
            reply will be logged to the server console in stub mode.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Phone (digits only, e.g. 919876543210)
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={simPhone}
                  onChange={(e) => setSimPhone(e.target.value)}
                  placeholder="919876543210"
                  className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-300 focus:outline-none"
                />
              </div>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-700 mb-1">Message</label>
              <input
                type="text"
                value={simMessage}
                onChange={(e) => setSimMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && simulateMessage()}
                placeholder='e.g. "Hi" or "1" or "EVENT_abc123"'
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-300 focus:outline-none"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={simulateMessage}
                disabled={simLoading}
                className="w-full sm:w-auto px-5 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {simLoading ? "Sending…" : "Simulate"}
              </button>
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-500 space-y-1">
            <p className="font-medium text-gray-600">Quick test prompts:</p>
            {["Hi", "1", "2", "3", "EVENT_abc123"].map((msg) => (
              <button
                key={msg}
                onClick={() => setSimMessage(msg)}
                className="mr-2 px-2 py-0.5 bg-white border rounded hover:bg-gray-100 text-gray-600"
              >
                {msg}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent sessions table */}
      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-gray-900 flex items-center space-x-2">
            <Phone className="h-4 w-4 text-indigo-500" />
            <span>Recent Sessions</span>
          </h2>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse h-10 bg-gray-100 rounded" />
              ))}
            </div>
          ) : !data || data.sessions.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <Bot className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No sessions yet. Try simulating a message above.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 border-b">
                    <th className="pb-2 font-medium">Phone</th>
                    <th className="pb-2 font-medium">Current Step</th>
                    <th className="pb-2 font-medium">Last Seen</th>
                    <th className="pb-2 font-medium">Started</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.sessions.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="py-2.5 font-mono text-xs text-gray-700">{s.phone}</td>
                      <td className="py-2.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            s.step === "IDLE"
                              ? "bg-gray-100 text-gray-600"
                              : s.step === "MENU"
                              ? "bg-blue-50 text-blue-700"
                              : s.step === "BROWSING"
                              ? "bg-green-50 text-green-700"
                              : "bg-orange-50 text-orange-700"
                          }`}
                        >
                          {STEP_LABELS[s.step] ?? s.step}
                        </span>
                      </td>
                      <td className="py-2.5 text-gray-500">{timeAgo(s.updatedAt)}</td>
                      <td className="py-2.5 text-gray-500">{timeAgo(s.createdAt)}</td>
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
