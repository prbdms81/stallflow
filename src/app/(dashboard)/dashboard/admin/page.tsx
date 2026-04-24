"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Building2, Calendar, Users, TrendingUp, Plus, Pencil, Trash2,
  ChevronDown, ChevronUp, MapPin, Star, Loader2, X, Check, History, Clock, Share2,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import toast from "react-hot-toast";
import { AvailabilityCalendar } from "@/components/dashboard/AvailabilityCalendar";

interface VenueSummary {
  id: string;
  name: string;
  city: string;
  capacity: number;
  totalEvents: number;
  totalStallRevenue: number;
  totalVisitors: number;
}

interface VenueDashboard {
  totalEvents: number;
  availableDays: number;
  topOrganizers: { organizerId: string; name: string; company: string | null; count: number }[];
  days: { date: string; busy: boolean; eventTitle?: string }[];
  upcomingEvents: { id: string; title: string; startDate: string; endDate: string; status: string }[];
}

interface PastEvent {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  eventType: string;
  maxStalls: number;
  bookedStalls: number;
  categories: string[];
  lastEventInfo: string | null;
  organizer: { name: string; company: string | null };
  reviewCount: number;
  avgRating: number | null;
  feedbackComments: string[];
}

interface VenueDetail {
  id: string;
  name: string;
  type: string;
  address: string;
  area: string;
  city: string;
  state: string;
  pincode: string;
  description: string;
  capacity: number;
  totalStallSlots: number;
  contactName: string;
  contactPhone: string;
  familyCount: number;
  employeeCount: number;
  bestCategories: string;
  eventFrequency: string;
  parkingNotes: string;
  powerSupply: string;
  isActive: boolean;
}

const VENUE_TYPES = [
  { value: "GATED_COMMUNITY", label: "Gated Community" },
  { value: "CORPORATE_OFFICE", label: "Corporate Office" },
  { value: "CONVENTION_CENTER", label: "Convention Center" },
  { value: "WEDDING_HALL", label: "Wedding Hall" },
  { value: "OPEN_GROUND", label: "Open Ground" },
  { value: "OTHER", label: "Other" },
];

const COMMON_AMENITIES = ["Parking", "Power Supply", "Water", "Restrooms", "WiFi", "Security", "Loading Area", "Storage Room"];

const BLANK_FORM: Omit<VenueDetail, "id" | "isActive"> = {
  name: "", type: "", address: "", area: "", city: "Hyderabad", state: "Telangana",
  pincode: "", description: "", capacity: 0, totalStallSlots: 0,
  contactName: "", contactPhone: "", familyCount: 0, employeeCount: 0,
  bestCategories: "", eventFrequency: "", parkingNotes: "", powerSupply: "",
};

export default function VenueAdminDashboard() {
  const [venues, setVenues] = useState<VenueSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [dashData, setDashData] = useState<Record<string, VenueDashboard>>({});
  const [dashLoading, setDashLoading] = useState<Record<string, boolean>>({});

  // Add form
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ ...BLANK_FORM });
  const [addAmenities, setAddAmenities] = useState<string[]>([]);
  const [addSaving, setAddSaving] = useState(false);

  // Edit modal
  const [editVenue, setEditVenue] = useState<VenueDetail | null>(null);
  const [editSaving, setEditSaving] = useState(false);

  // Delete
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteSaving, setDeleteSaving] = useState(false);

  // Past events per venue
  const [pastEventsData, setPastEventsData] = useState<Record<string, PastEvent[]>>({});
  const [pastEventsLoading, setPastEventsLoading] = useState<Record<string, boolean>>({});
  const [selectedPastId, setSelectedPastId] = useState<Record<string, string>>({});

  const fetchVenues = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/venue-summary");
      const data = await res.json();
      setVenues(data.venues || []);
    } catch {
      toast.error("Failed to load venues");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchVenues(); }, [fetchVenues]);

  const loadDashboard = async (venueId: string) => {
    if (dashData[venueId]) return;
    setDashLoading((p) => ({ ...p, [venueId]: true }));
    try {
      const res = await fetch(`/api/venues/${venueId}/dashboard`);
      const data = await res.json();
      setDashData((p) => ({ ...p, [venueId]: data }));
    } catch {
      toast.error("Failed to load venue stats");
    } finally {
      setDashLoading((p) => ({ ...p, [venueId]: false }));
    }
  };

  const loadPastEvents = async (venueId: string) => {
    if (pastEventsData[venueId]) return;
    setPastEventsLoading((p) => ({ ...p, [venueId]: true }));
    try {
      const res = await fetch(`/api/venues/${venueId}/past-events`);
      const data = await res.json();
      setPastEventsData((p) => ({ ...p, [venueId]: data.pastEvents || [] }));
    } catch {
      toast.error("Failed to load past events");
    } finally {
      setPastEventsLoading((p) => ({ ...p, [venueId]: false }));
    }
  };

  const toggleExpand = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      loadDashboard(id);
      loadPastEvents(id);
    }
  };

  const handleAdd = async () => {
    if (!addForm.name || !addForm.type || !addForm.address || !addForm.pincode) {
      toast.error("Name, type, address and pincode are required");
      return;
    }
    setAddSaving(true);
    try {
      const res = await fetch("/api/venues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...addForm,
          amenities: addAmenities.map((name) => ({ name })),
        }),
      });
      if (res.ok) {
        toast.success("Venue created!");
        setShowAdd(false);
        setAddForm({ ...BLANK_FORM });
        setAddAmenities([]);
        fetchVenues();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to create venue");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setAddSaving(false);
    }
  };

  const openEdit = async (venueId: string) => {
    try {
      const res = await fetch(`/api/venues?id=${venueId}`);
      const data = await res.json();
      const v = data.venue;
      setEditVenue({
        id: v.id, name: v.name, type: v.type, address: v.address,
        area: v.area || "", city: v.city, state: v.state, pincode: v.pincode,
        description: v.description || "", capacity: v.capacity,
        totalStallSlots: v.totalStallSlots, contactName: v.contactName || "",
        contactPhone: v.contactPhone || "", familyCount: v.familyCount || 0,
        employeeCount: v.employeeCount || 0, bestCategories: v.bestCategories || "",
        eventFrequency: v.eventFrequency || "", parkingNotes: v.parkingNotes || "",
        powerSupply: v.powerSupply || "", isActive: v.isActive,
      });
    } catch {
      toast.error("Failed to load venue");
    }
  };

  const handleEdit = async () => {
    if (!editVenue) return;
    setEditSaving(true);
    try {
      const res = await fetch(`/api/venues/${editVenue.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editVenue),
      });
      if (res.ok) {
        toast.success("Venue updated!");
        setEditVenue(null);
        fetchVenues();
        setDashData((p) => { const n = { ...p }; delete n[editVenue.id]; return n; });
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to update");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setEditSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleteSaving(true);
    try {
      const res = await fetch(`/api/venues/${deleteId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Venue deleted");
        setDeleteId(null);
        fetchVenues();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to delete");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setDeleteSaving(false);
    }
  };

  const totalRevenue = venues.reduce((s, v) => s + v.totalStallRevenue, 0);
  const totalEvents = venues.reduce((s, v) => s + v.totalEvents, 0);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Venue Manager</h1>
          <p className="text-sm text-gray-500">Manage your venues, track events and organiser activity</p>
        </div>
        <button
          onClick={() => setShowAdd((p) => !p)}
          className="flex items-center gap-1.5 bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="h-4 w-4" /> Add Venue
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "My Venues", value: venues.length, icon: Building2, color: "text-indigo-600 bg-indigo-50" },
          { label: "Total Events", value: totalEvents, icon: Calendar, color: "text-green-600 bg-green-50" },
          { label: "Total Visitors", value: venues.reduce((s, v) => s + v.totalVisitors, 0), icon: Users, color: "text-purple-600 bg-purple-50" },
          { label: "Stall Revenue", value: formatCurrency(totalRevenue), icon: TrendingUp, color: "text-orange-600 bg-orange-50" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${stat.color}`}>
              <stat.icon className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-xs text-gray-500">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Venue Form */}
      {showAdd && (
        <div className="bg-white rounded-xl border p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">New Venue</h2>
            <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>
          <VenueForm form={addForm} onChange={(v) => setAddForm((p) => ({ ...p, ...v }))} amenities={addAmenities} onAmenitiesChange={setAddAmenities} />
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleAdd}
              disabled={addSaving}
              className="flex items-center gap-1.5 bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-60"
            >
              {addSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Create Venue
            </button>
            <button onClick={() => setShowAdd(false)} className="text-sm text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-100">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Venue List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => <div key={i} className="h-28 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : venues.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center">
          <Building2 className="h-12 w-12 mx-auto text-gray-300 mb-3" />
          <p className="font-medium text-gray-700">No venues yet</p>
          <p className="text-sm text-gray-500 mt-1">Add your first venue to start hosting events</p>
        </div>
      ) : (
        <div className="space-y-4">
          {venues.map((venue) => {
            const dash = dashData[venue.id];
            const isExpanded = expandedId === venue.id;
            return (
              <div key={venue.id} className="bg-white rounded-xl border overflow-hidden">
                {/* Venue Header Row */}
                <div className="p-5 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                    <Building2 className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900">{venue.name}</div>
                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                      <MapPin className="h-3 w-3" /> {venue.city}
                    </div>
                    <div className="flex flex-wrap gap-3 mt-2">
                      <span className="text-xs text-gray-500"><span className="font-medium text-gray-800">{venue.totalEvents}</span> events</span>
                      <span className="text-xs text-gray-500"><span className="font-medium text-green-700">{formatCurrency(venue.totalStallRevenue)}</span> revenue</span>
                      <span className="text-xs text-gray-500"><span className="font-medium text-purple-700">{venue.totalVisitors}</span> visitors</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => {
                        const url = `${window.location.origin}/stallmate/demand/${venue.id}`;
                        const shareText = `🏘️ Help us plan events at ${venue.name}!\n\nVote for the stall categories you'd like to see:\n${url}`;

                        const fallbackCopy = () => {
                          const ta = document.createElement("textarea");
                          ta.value = url;
                          ta.style.position = "fixed";
                          ta.style.opacity = "0";
                          document.body.appendChild(ta);
                          ta.focus();
                          ta.select();
                          let ok = false;
                          try { ok = document.execCommand("copy"); } catch { ok = false; }
                          document.body.removeChild(ta);
                          return ok;
                        };

                        // Prefer Web Share API on mobile (opens native share sheet)
                        if (typeof navigator.share === "function") {
                          navigator.share({ title: `Demand poll — ${venue.name}`, text: shareText, url })
                            .catch(() => {
                              if (fallbackCopy()) toast.success("Link copied! Share with residents.");
                              else window.prompt("Copy this link:", url);
                            });
                          return;
                        }

                        // Desktop: try async clipboard, fall back to execCommand, then prompt
                        if (navigator.clipboard?.writeText) {
                          navigator.clipboard.writeText(url)
                            .then(() => toast.success("Demand link copied! Share with residents."))
                            .catch(() => {
                              if (fallbackCopy()) toast.success("Link copied! Share with residents.");
                              else window.prompt("Copy this link:", url);
                            });
                        } else if (fallbackCopy()) {
                          toast.success("Link copied! Share with residents.");
                        } else {
                          window.prompt("Copy this link:", url);
                        }
                      }}
                      className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Share demand link with residents"
                    >
                      <Share2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => openEdit(venue.id)}
                      className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Edit venue"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeleteId(venue.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete venue"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => toggleExpand(venue.id)}
                      className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors ml-1"
                      title="View stats"
                    >
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Stats */}
                {isExpanded && (
                  <div className="border-t px-5 py-4 bg-gray-50 space-y-5">
                    {dashLoading[venue.id] ? (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Loader2 className="h-4 w-4 animate-spin" /> Loading stats...
                      </div>
                    ) : dash ? (
                      <>
                        {/* Top Organizers */}
                        <div>
                          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                            Most Repeated Event Companies
                          </h3>
                          {dash.topOrganizers.length === 0 ? (
                            <p className="text-sm text-gray-400">No events at this venue yet</p>
                          ) : (
                            <div className="space-y-2">
                              {dash.topOrganizers.map((org, i) => (
                                <div key={org.organizerId} className="flex items-center gap-3">
                                  <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700 flex-shrink-0">
                                    {i + 1}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <span className="text-sm font-medium text-gray-900">
                                      {org.company || org.name}
                                    </span>
                                    {org.company && (
                                      <span className="text-xs text-gray-400 ml-1">({org.name})</span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1 text-xs text-indigo-600 font-medium">
                                    <Star className="h-3 w-3" />
                                    {org.count} event{org.count !== 1 ? "s" : ""}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* 60-Day Availability Calendar */}
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                              Availability — Next 60 Days
                            </h3>
                            <div className="flex items-center gap-3 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <span className="w-3 h-3 rounded-sm bg-green-400 inline-block" /> Free
                              </span>
                              <span className="flex items-center gap-1">
                                <span className="w-3 h-3 rounded-sm bg-red-400 inline-block" /> Booked
                              </span>
                              <span className="font-medium text-green-700">{dash.availableDays} days free</span>
                            </div>
                          </div>
                          <AvailabilityCalendar days={dash.days} />
                        </div>

                        {/* Upcoming Events */}
                        {dash.upcomingEvents.length > 0 && (
                          <div>
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                              Upcoming Events ({dash.upcomingEvents.length})
                            </h3>
                            <div className="space-y-2">
                              {dash.upcomingEvents.slice(0, 3).map((e) => (
                                <div key={e.id} className="flex items-center justify-between text-sm">
                                  <span className="text-gray-800 font-medium truncate">{e.title}</span>
                                  <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                                    {new Date(e.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                                  </span>
                                </div>
                              ))}
                              {dash.upcomingEvents.length > 3 && (
                                <p className="text-xs text-gray-400">+{dash.upcomingEvents.length - 3} more</p>
                              )}
                            </div>
                          </div>
                        )}
                      </>
                    ) : null}

                    {/* Past Events Panel */}
                    <PastEventsSection
                      venueId={venue.id}
                      pastEvents={pastEventsData[venue.id] || []}
                      loading={pastEventsLoading[venue.id] || false}
                      selectedId={selectedPastId[venue.id] || ""}
                      onSelect={(id) => setSelectedPastId((p) => ({ ...p, [venue.id]: id }))}
                    />
                  </div>
                )}

                {/* Delete confirmation inline */}
                {deleteId === venue.id && (
                  <div className="border-t px-5 py-4 bg-red-50 flex items-center justify-between gap-4">
                    <p className="text-sm text-red-700 font-medium">
                      Delete &ldquo;{venue.name}&rdquo;? This cannot be undone.
                    </p>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={handleDelete}
                        disabled={deleteSaving}
                        className="flex items-center gap-1 text-sm bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 disabled:opacity-60"
                      >
                        {deleteSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                        Confirm Delete
                      </button>
                      <button
                        onClick={() => setDeleteId(null)}
                        className="text-sm text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-100"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Modal */}
      {editVenue && (
        <div className="fixed inset-0 bg-black/40 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl my-8 shadow-xl">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Edit Venue</h2>
              <button onClick={() => setEditVenue(null)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <VenueForm
                form={editVenue}
                onChange={(val) => setEditVenue((p) => (p ? { ...p, ...val } : p))}
                amenities={[]}
                onAmenitiesChange={() => {}}
                hideAmenities
              />
              <div className="flex items-center gap-3 pt-1">
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editVenue.isActive}
                    onChange={(e) => setEditVenue({ ...editVenue, isActive: e.target.checked })}
                    className="rounded"
                  />
                  Venue is active and visible
                </label>
              </div>
            </div>
            <div className="flex gap-2 p-6 border-t">
              <button
                onClick={handleEdit}
                disabled={editSaving}
                className="flex items-center gap-1.5 bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-60"
              >
                {editSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Save Changes
              </button>
              <button onClick={() => setEditVenue(null)} className="text-sm text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-100">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Shared form component for add & edit
function VenueForm({
  form,
  onChange,
  amenities,
  onAmenitiesChange,
  hideAmenities = false,
}: {
  form: Omit<VenueDetail, "id" | "isActive">;
  onChange: (v: Partial<typeof form>) => void;
  amenities: string[];
  onAmenitiesChange: (v: string[]) => void;
  hideAmenities?: boolean;
}) {
  const field = (key: keyof typeof form, label: string, placeholder?: string, type = "text") => (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <input
        type={type}
        value={String(form[key])}
        onChange={(e) => onChange({ [key]: type === "number" ? Number(e.target.value) : e.target.value } as Partial<typeof form>)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {field("name", "Venue Name *", "e.g. Aparna Sarovar Grande")}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Venue Type *</label>
          <select
            value={form.type}
            onChange={(e) => onChange({ type: e.target.value })}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select type</option>
            {VENUE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
      </div>

      {field("address", "Full Address *", "Survey No. 123, Near Botanical Garden")}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {field("area", "Area / Locality", "Gachibowli")}
        {field("city", "City")}
        {field("pincode", "Pincode *", "500032")}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {field("state", "State")}
        {field("description", "Description", "Brief description")}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {field("capacity", "Capacity", "500", "number")}
        {field("totalStallSlots", "Stall Slots", "20", "number")}
        {field("familyCount", "Family Count", "0", "number")}
        {field("employeeCount", "Employee Count", "0", "number")}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {field("contactName", "Contact Name", "Manager name")}
        {field("contactPhone", "Contact Phone", "+91 98765 43210")}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {field("bestCategories", "Best Categories", "Food, Fashion, Handicrafts")}
        {field("eventFrequency", "Event Frequency", "Monthly")}
        {field("powerSupply", "Power Supply", "3-phase available")}
      </div>

      {field("parkingNotes", "Parking Notes", "200 cars, dedicated vendor entry")}

      {!hideAmenities && (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">Amenities</label>
          <div className="flex flex-wrap gap-2">
            {COMMON_AMENITIES.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() =>
                  onAmenitiesChange(
                    amenities.includes(a) ? amenities.filter((x) => x !== a) : [...amenities, a]
                  )
                }
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  amenities.includes(a)
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PastEventsSection({
  venueId,
  pastEvents,
  loading,
  selectedId,
  onSelect,
}: {
  venueId: string;
  pastEvents: PastEvent[];
  loading: boolean;
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const selected = pastEvents.find((e) => e.id === selectedId) ?? null;
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="border-t pt-5 space-y-3">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
        <History className="h-3.5 w-3.5" /> Previous Events
      </h3>

      {loading ? (
        <div className="text-sm text-gray-400 flex items-center gap-1">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading…
        </div>
      ) : pastEvents.length === 0 ? (
        <p className="text-sm text-gray-400">No past events at this venue yet.</p>
      ) : (
        <>
          <div className="relative">
            <select
              value={selectedId}
              onChange={(e) => onSelect(e.target.value)}
              className="w-full appearance-none rounded-lg border border-gray-200 bg-white px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">— Select a past event to view details —</option>
              {pastEvents.map((pe) => (
                <option key={pe.id} value={pe.id}>
                  {pe.title} · {fmt(pe.startDate)}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>

          {selected && (
            <div className="bg-white rounded-lg border p-4 space-y-3 text-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-semibold text-gray-900">{selected.title}</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    By{" "}
                    <span className="text-indigo-600 font-medium">
                      {selected.organizer.company || selected.organizer.name}
                    </span>
                    {selected.organizer.company && ` (${selected.organizer.name})`}
                  </div>
                </div>
                {selected.avgRating !== null && (
                  <div className="flex items-center gap-1 text-yellow-600 flex-shrink-0">
                    <Star className="h-3.5 w-3.5 fill-yellow-400 stroke-yellow-400" />
                    <span className="font-medium">{selected.avgRating}</span>
                    <span className="text-xs text-gray-400">({selected.reviewCount})</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-gray-600">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-gray-400" />
                  {fmt(selected.startDate)}
                  {selected.startDate !== selected.endDate && ` – ${fmt(selected.endDate)}`}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-gray-400" />
                  {selected.startTime} – {selected.endTime}
                </div>
                <div>
                  <span className="text-gray-400">Stalls: </span>
                  <span className="font-medium text-gray-800">{selected.bookedStalls}</span>
                  <span className="text-gray-400"> / {selected.maxStalls}</span>
                </div>
                <div>
                  <span className="text-gray-400">Occupancy: </span>
                  <span className="font-medium text-gray-800">
                    {selected.maxStalls > 0
                      ? `${Math.round((selected.bookedStalls / selected.maxStalls) * 100)}%`
                      : "—"}
                  </span>
                </div>
              </div>

              {selected.categories.length > 0 && (
                <div>
                  <div className="text-xs text-gray-400 mb-1">Categories used:</div>
                  <div className="flex flex-wrap gap-1">
                    {selected.categories.map((c) => (
                      <span key={c} className="text-[11px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selected.feedbackComments.length > 0 && (
                <div>
                  <div className="text-xs text-gray-400 mb-1">Vendor feedback:</div>
                  <div className="space-y-1">
                    {selected.feedbackComments.map((c, i) => (
                      <p key={i} className="text-xs text-gray-600 bg-gray-50 rounded px-2 py-1 italic">
                        &ldquo;{c}&rdquo;
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {selected.lastEventInfo && (
                <div>
                  <div className="text-xs text-gray-400 mb-1">Organiser notes:</div>
                  <p className="text-xs text-gray-600 bg-gray-50 rounded px-2 py-1">{selected.lastEventInfo}</p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      <a
        href={`/dashboard/manager/events/new?venueId=${venueId}`}
        className="inline-flex items-center gap-1.5 text-xs text-indigo-600 font-medium hover:underline"
      >
        <Calendar className="h-3.5 w-3.5" /> Schedule a new event at this venue →
      </a>
    </div>
  );
}
