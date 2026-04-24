"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import StallLayoutEditor from "@/components/stalls/StallLayoutEditor";
import toast from "react-hot-toast";

interface Stall {
  id: string;
  stallNumber: string;
  name: string | null;
  type: string;
  size: string;
  price: number;
  positionX: number;
  positionY: number;
  width: number;
  height: number;
  status: string;
  amenities: string | null;
  stallCategory: string | null;
}

export default function ManageStallsPage() {
  const params = useParams();
  const [stalls, setStalls] = useState<Stall[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [bulkCount, setBulkCount] = useState(10);
  const [newStall, setNewStall] = useState({
    type: "STANDARD",
    size: "6x6",
    price: 3000,
  });

  useEffect(() => {
    fetch(`/api/events/${params.eventId}`)
      .then((res) => res.json())
      .then((data) => setStalls(data.event?.stalls || []))
      .catch(() => setStalls([]))
      .finally(() => setLoading(false));
  }, [params.eventId]);

  const handleBulkAdd = async () => {
    setAdding(true);
    const cols = Math.ceil(Math.sqrt(bulkCount));

    const stallsToAdd = Array.from({ length: bulkCount }, (_, i) => ({
      stallNumber: `${stalls.length + i + 1}`,
      type: newStall.type,
      size: newStall.size,
      price: newStall.price,
      positionX: i % cols,
      positionY: Math.floor(i / cols),
      width: 1,
      height: 1,
    }));

    try {
      const res = await fetch(`/api/events/${params.eventId}/stalls`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stalls: stallsToAdd }),
      });

      if (res.ok) {
        const data = await res.json();
        setStalls([...stalls, ...data.stalls]);
        toast.success(`Added ${bulkCount} stalls!`);
      } else {
        toast.error("Failed to add stalls");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Manage Stalls</h1>
        <p className="text-gray-500">Configure the stall layout for your event</p>
      </div>

      {/* Add Stalls */}
      <Card>
        <CardHeader><h2 className="font-semibold">Add Stalls</h2></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 items-end">
            <Input
              id="bulkCount" label="Number of Stalls"
              type="number" value={bulkCount.toString()}
              onChange={(e) => setBulkCount(parseInt(e.target.value) || 1)}
            />
            <Select
              id="type" label="Type"
              value={newStall.type}
              onChange={(e) => setNewStall({ ...newStall, type: e.target.value })}
              options={[
                { value: "STANDARD", label: "Standard" },
                { value: "PREMIUM", label: "Premium" },
                { value: "CORNER", label: "Corner" },
                { value: "FOOD_COURT", label: "Food Court" },
                { value: "KIOSK", label: "Kiosk" },
              ]}
            />
            <Select
              id="size" label="Size"
              value={newStall.size}
              onChange={(e) => setNewStall({ ...newStall, size: e.target.value })}
              options={[
                { value: "6x6", label: "6x6 ft" },
                { value: "8x8", label: "8x8 ft" },
                { value: "10x10", label: "10x10 ft" },
                { value: "10x15", label: "10x15 ft" },
              ]}
            />
            <Input
              id="price" label="Price (INR)"
              type="number" value={newStall.price.toString()}
              onChange={(e) => setNewStall({ ...newStall, price: parseInt(e.target.value) || 0 })}
            />
            <Button onClick={handleBulkAdd} isLoading={adding}>
              Add Stalls
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stall Layout Editor */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Visual Layout Editor ({stalls.length} stalls)</h2>
            <span className="text-xs text-gray-400">Drag stalls to reposition · Click to edit</span>
          </div>
        </CardHeader>
        <CardContent className="overflow-auto">
          {loading ? (
            <div className="h-64 bg-gray-100 rounded-lg animate-pulse" />
          ) : (
            <StallLayoutEditor
              eventId={params.eventId as string}
              initialStalls={stalls}
              onSaved={(updated) => setStalls(updated.map((s) => ({ ...s, amenities: s.amenities ?? null })))}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
