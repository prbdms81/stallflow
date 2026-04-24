"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Copy, FilePlus, LayoutTemplate } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { formatDate } from "@/lib/utils";
import toast from "react-hot-toast";

interface EventTemplate {
  id: string;
  name: string;
  templateData: string;
  createdAt: string;
}

interface ManagerEvent {
  id: string;
  title: string;
  startDate: string;
  status: string;
}

interface TemplateData {
  stalls?: unknown[];
}

function parseStallCount(templateData: string): number {
  try {
    const data = JSON.parse(templateData) as TemplateData;
    return data.stalls?.length ?? 0;
  } catch {
    return 0;
  }
}

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<EventTemplate[]>([]);
  const [events, setEvents] = useState<ManagerEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveEventId, setSaveEventId] = useState("");
  const [saveName, setSaveName] = useState("");
  const [saving, setSaving] = useState(false);

  const [cloneTarget, setCloneTarget] = useState<EventTemplate | null>(null);
  const [cloneTitle, setCloneTitle] = useState("");
  const [cloneStart, setCloneStart] = useState("");
  const [cloneEnd, setCloneEnd] = useState("");
  const [cloning, setCloning] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/event-templates").then((r) => r.json()),
      fetch("/api/events?status=DRAFT,PUBLISHED,LIVE&limit=100").then((r) => r.json()),
    ])
      .then(([tData, eData]) => {
        setTemplates(tData.templates ?? []);
        setEvents(eData.events ?? []);
      })
      .catch(() => toast.error("Failed to load data"))
      .finally(() => setLoading(false));
  }, []);

  async function handleSaveTemplate() {
    if (!saveName.trim() || !saveEventId) {
      toast.error("Please select an event and enter a template name");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/event-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: saveName.trim(), eventId: saveEventId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setTemplates((prev) => [data.template, ...prev]);
      setShowSaveModal(false);
      setSaveName("");
      setSaveEventId("");
      toast.success("Template saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save template");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(templateId: string) {
    if (!confirm("Delete this template?")) return;
    try {
      const res = await fetch(`/api/event-templates/${templateId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      setTemplates((prev) => prev.filter((t) => t.id !== templateId));
      toast.success("Template deleted");
    } catch {
      toast.error("Failed to delete template");
    }
  }

  async function handleClone() {
    if (!cloneTarget) return;
    if (!cloneTitle.trim() || !cloneStart || !cloneEnd) {
      toast.error("Please fill in all fields");
      return;
    }
    setCloning(true);
    try {
      const res = await fetch(`/api/event-templates/${cloneTarget.id}?action=clone`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: cloneTitle.trim(),
          startDate: cloneStart,
          endDate: cloneEnd,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      toast.success("Event created from template");
      router.push(`/dashboard/manager/events/${data.event.id}/stalls`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to clone");
    } finally {
      setCloning(false);
    }
  }

  function openCloneModal(template: EventTemplate) {
    setCloneTarget(template);
    setCloneTitle("");
    setCloneStart("");
    setCloneEnd("");
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <LayoutTemplate className="w-6 h-6 text-indigo-600" />
          <h1 className="text-2xl font-bold text-gray-900">Event Templates</h1>
        </div>
        <Button onClick={() => setShowSaveModal(true)} className="flex items-center gap-2">
          <FilePlus className="w-4 h-4" />
          Save Event as Template
        </Button>
      </div>

      {templates.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <LayoutTemplate className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">No templates yet</p>
            <p className="text-gray-400 text-sm mt-1">
              Save an existing event as a template to quickly create new events with the same stall layout.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {templates.map((template) => {
            const stallCount = parseStallCount(template.templateData);
            return (
              <Card key={template.id}>
                <CardContent className="py-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-gray-900">{template.name}</p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {stallCount} stall{stallCount !== 1 ? "s" : ""} &middot; Saved {formatDate(template.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openCloneModal(template)}
                      className="flex items-center gap-1.5"
                    >
                      <Copy className="w-4 h-4" />
                      Clone into New Event
                    </Button>
                    <button
                      onClick={() => handleDelete(template.id)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                      title="Delete template"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {showSaveModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <h2 className="text-lg font-semibold">Save Event as Template</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Event</label>
                <select
                  value={saveEventId}
                  onChange={(e) => setSaveEventId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">— pick an event —</option>
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.title} ({ev.status})
                    </option>
                  ))}
                </select>
              </div>
              <Input
                label="Template Name"
                placeholder="e.g. Weekend Market Layout"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
              />
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowSaveModal(false)}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button className="flex-1" onClick={handleSaveTemplate} disabled={saving}>
                  {saving ? "Saving…" : "Save Template"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {cloneTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <h2 className="text-lg font-semibold">Clone: {cloneTarget.name}</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Creates a new DRAFT event with {parseStallCount(cloneTarget.templateData)} stalls from this template.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="New Event Title"
                placeholder="e.g. Summer Market 2026"
                value={cloneTitle}
                onChange={(e) => setCloneTitle(e.target.value)}
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={cloneStart}
                    onChange={(e) => setCloneStart(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={cloneEnd}
                    onChange={(e) => setCloneEnd(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setCloneTarget(null)}
                  disabled={cloning}
                >
                  Cancel
                </Button>
                <Button className="flex-1" onClick={handleClone} disabled={cloning}>
                  {cloning ? "Creating…" : "Create Event"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
