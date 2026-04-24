"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { UserPlus, Trash2, Shield, Eye, Wrench } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import toast from "react-hot-toast";

interface TeamMember {
  id: string;
  role: string;
  createdAt: string;
  user: { id: string; name: string; email: string; avatar: string | null };
}

const ROLE_META: Record<string, { label: string; color: string; icon: React.ElementType; desc: string }> = {
  VIEWER: {
    label: "Viewer",
    color: "bg-gray-100 text-gray-700",
    icon: Eye,
    desc: "Read-only access to event data",
  },
  OPS: {
    label: "Operations",
    color: "bg-sky-100 text-sky-700",
    icon: Wrench,
    desc: "Can scan gate passes and manage check-ins",
  },
  CO_ORGANIZER: {
    label: "Co-Organizer",
    color: "bg-indigo-100 text-indigo-700",
    icon: Shield,
    desc: "Full event management access",
  },
};

export default function TeamPage() {
  const params = useParams();
  const eventId = params.eventId as string;

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [addLoading, setAddLoading] = useState(false);
  const [form, setForm] = useState({ email: "", role: "VIEWER" });

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}/team`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setMembers(data.members || []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load team");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email) return;
    setAddLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}/team`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add member");
      toast.success(`${data.member.user.name} added as ${ROLE_META[form.role].label}`);
      setForm({ email: "", role: "VIEWER" });
      fetchMembers();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add");
    } finally {
      setAddLoading(false);
    }
  };

  const handleRemove = async (userId: string, name: string) => {
    if (!confirm(`Remove ${name} from the team?`)) return;
    try {
      const res = await fetch(`/api/events/${eventId}/team?userId=${userId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to remove");
      toast.success(`${name} removed`);
      setMembers((prev) => prev.filter((m) => m.user.id !== userId));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to remove");
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Team Access</h1>
        <p className="text-gray-500 text-sm">Manage who can help run this event</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {Object.entries(ROLE_META).map(([key, meta]) => {
          const Icon = meta.icon;
          return (
            <div key={key} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
              <div className="flex items-center gap-2 mb-1">
                <Icon className="h-4 w-4 text-gray-600" />
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${meta.color}`}>{meta.label}</span>
              </div>
              <p className="text-xs text-gray-500">{meta.desc}</p>
            </div>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-indigo-600" />
            Add Team Member
          </h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="vendor@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div className="w-full sm:w-48">
              <Select
                id="role"
                name="role"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                options={Object.entries(ROLE_META).map(([value, meta]) => ({ value, label: meta.label }))}
              />
            </div>
            <Button type="submit" isLoading={addLoading}>
              Add
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-800">Current Team ({members.length})</h2>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <p className="text-sm text-gray-400 animate-pulse p-6">Loading...</p>
          ) : members.length === 0 ? (
            <p className="text-sm text-gray-400 p-6">No team members yet. Add someone above.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {members.map((member) => {
                const meta = ROLE_META[member.role] || ROLE_META.VIEWER;
                const Icon = meta.icon;
                return (
                  <li key={member.id} className="flex items-center gap-4 px-6 py-4">
                    <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-sm flex-shrink-0">
                      {member.user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 truncate">{member.user.name}</p>
                      <p className="text-xs text-gray-500 truncate">{member.user.email}</p>
                    </div>
                    <span className={`hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${meta.color}`}>
                      <Icon className="h-3 w-3" />
                      {meta.label}
                    </span>
                    <button
                      onClick={() => handleRemove(member.user.id, member.user.name)}
                      className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded"
                      title="Remove"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
