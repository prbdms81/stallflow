"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Plus, Trash2, ArrowLeft, DollarSign, CheckCircle, Globe, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import Link from "next/link";
import toast from "react-hot-toast";
import { formatCurrency } from "@/lib/utils";

interface Sponsor {
  id: string;
  name: string;
  logoUrl: string | null;
  websiteUrl: string | null;
  tier: string;
  amount: number;
  visibility: string | null;
  paymentStatus: string;
}

const TIERS = ["TITLE", "GOLD", "SILVER", "BRONZE"];
const tierColors: Record<string, string> = {
  TITLE: "bg-purple-100 text-purple-800",
  GOLD: "bg-yellow-100 text-yellow-800",
  SILVER: "bg-gray-100 text-gray-700",
  BRONZE: "bg-orange-100 text-orange-700",
};

const emptyForm = { name: "", logoUrl: "", websiteUrl: "", tier: "BRONZE", amount: "", visibility: "" };

export default function SponsorsPage() {
  const params = useParams();
  const eventId = params.eventId as string;

  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  async function fetchData() {
    setLoading(true);
    const res = await fetch(`/api/events/${eventId}/sponsors`);
    if (res.ok) setSponsors((await res.json()).sponsors || []);
    setLoading(false);
  }

  useEffect(() => { fetchData(); }, [eventId]);

  async function handleAdd() {
    if (!form.name) { toast.error("Name required"); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/events/${eventId}/sponsors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) { toast.error((await res.json()).error || "Failed"); return; }
      toast.success("Sponsor added");
      setShowAdd(false);
      setForm(emptyForm);
      fetchData();
    } catch { toast.error("Something went wrong"); }
    finally { setSubmitting(false); }
  }

  async function handleMarkPaid(s: Sponsor) {
    const res = await fetch(`/api/events/${eventId}/sponsors?sponsorId=${s.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentStatus: "RECEIVED" }),
    });
    if (res.ok) { toast.success("Marked as paid"); fetchData(); }
    else toast.error("Failed");
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this sponsor?")) return;
    const res = await fetch(`/api/events/${eventId}/sponsors?sponsorId=${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Removed"); fetchData(); }
    else toast.error("Failed");
  }

  const totalAmount = sponsors.reduce((s, sp) => s + sp.amount, 0);
  const receivedAmount = sponsors.filter((s) => s.paymentStatus === "RECEIVED").reduce((s, sp) => s + sp.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/dashboard/manager`} className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Sponsors</h1>
          <p className="text-gray-500 text-sm">Manage event sponsors and track payments</p>
        </div>
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <Plus className="h-4 w-4 mr-1" /> Add Sponsor
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white border-0">
          <CardContent className="flex items-center justify-between">
            <div>
              <div className="text-sm text-purple-100">Total Sponsorship</div>
              <div className="text-3xl font-bold">{formatCurrency(totalAmount)}</div>
            </div>
            <DollarSign className="h-10 w-10 text-purple-200" />
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0">
          <CardContent className="flex items-center justify-between">
            <div>
              <div className="text-sm text-green-100">Amount Received</div>
              <div className="text-3xl font-bold">{formatCurrency(receivedAmount)}</div>
            </div>
            <CheckCircle className="h-10 w-10 text-green-200" />
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="animate-pulse h-20 bg-gray-100 rounded-xl" />)}</div>
      ) : sponsors.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <DollarSign className="h-8 w-8 mx-auto mb-2 text-gray-300" />
          <p>No sponsors yet. Add your first sponsor!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sponsors.map((s) => (
            <Card key={s.id}>
              <CardContent className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {s.logoUrl ? (
                    <img src={s.logoUrl} alt={s.name} className="h-10 w-10 object-contain rounded" />
                  ) : (
                    <div className="h-10 w-10 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs font-bold">
                      {s.name.charAt(0)}
                    </div>
                  )}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">{s.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tierColors[s.tier] || "bg-gray-100 text-gray-700"}`}>
                        {s.tier}
                      </span>
                      <Badge variant={s.paymentStatus === "RECEIVED" ? "success" : "warning"}>
                        {s.paymentStatus === "RECEIVED" ? "Paid" : "Pending"}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-500 flex items-center gap-3">
                      <span>{formatCurrency(s.amount)}</span>
                      {s.visibility && <span><Globe className="h-3 w-3 inline mr-1" />{s.visibility}</span>}
                      {s.websiteUrl && (
                        <a href={s.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline flex items-center gap-1">
                          <ExternalLink className="h-3 w-3" /> Website
                        </a>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  {s.paymentStatus !== "RECEIVED" && (
                    <Button size="sm" variant="outline" onClick={() => handleMarkPaid(s)}>
                      <CheckCircle className="h-4 w-4 mr-1 text-green-600" /> Mark Paid
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => handleDelete(s.id)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Add Sponsor" size="md">
        <div className="space-y-4">
          {[
            { label: "Sponsor Name *", key: "name", type: "text", placeholder: "ACME Corp" },
            { label: "Logo URL", key: "logoUrl", type: "url", placeholder: "https://..." },
            { label: "Website URL", key: "websiteUrl", type: "url", placeholder: "https://..." },
            { label: "Amount (₹)", key: "amount", type: "number", placeholder: "50000" },
            { label: "Visibility", key: "visibility", type: "text", placeholder: "Banner, Stage, Website..." },
          ].map(({ label, key, type, placeholder }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <input
                type={type}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder={placeholder}
                value={form[key as keyof typeof form]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              />
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tier</label>
            <select
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              value={form.tier}
              onChange={(e) => setForm((f) => ({ ...f, tier: e.target.value }))}
            >
              {TIERS.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button className="flex-1" onClick={handleAdd} disabled={submitting}>
              {submitting ? "Adding..." : "Add Sponsor"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
