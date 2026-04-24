"use client";

import { useState, useRef } from "react";
import { Plus, Trash2, Save, RotateCcw, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
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
  stallCategory: string | null;
  amenities?: string | null;
}

interface Props {
  eventId: string;
  initialStalls: Stall[];
  onSaved?: (stalls: Stall[]) => void;
}

const GRID_COLS = 12;
const GRID_ROWS = 10;
const CELL_SIZE = 56;

const TYPE_COLORS: Record<string, string> = {
  STANDARD:   "bg-blue-100 border-blue-300 text-blue-800",
  PREMIUM:    "bg-purple-100 border-purple-300 text-purple-800",
  CORNER:     "bg-orange-100 border-orange-300 text-orange-800",
  FOOD_COURT: "bg-red-100 border-red-300 text-red-800",
  KIOSK:      "bg-teal-100 border-teal-300 text-teal-800",
};

const STALL_TYPES = ["STANDARD", "PREMIUM", "CORNER", "FOOD_COURT", "KIOSK"];

function nextStallNumber(stalls: Stall[]): string {
  const nums = stalls.map((s) => parseInt(s.stallNumber, 10)).filter((n) => !isNaN(n));
  return String(nums.length ? Math.max(...nums) + 1 : 1);
}

function isCellOccupied(stalls: Stall[], col: number, row: number, excludeId?: string): boolean {
  return stalls.some(
    (s) =>
      s.id !== excludeId &&
      col >= s.positionX && col < s.positionX + s.width &&
      row >= s.positionY && row < s.positionY + s.height
  );
}

export default function StallLayoutEditor({ eventId, initialStalls, onSaved }: Props) {
  const [stalls, setStalls] = useState<Stall[]>(initialStalls);
  const [selected, setSelected] = useState<Stall | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Stall>>({});
  const dragId = useRef<string | null>(null);
  const dragOffset = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });

  const selectStall = (s: Stall) => {
    setSelected(s);
    setEditForm({ type: s.type, price: s.price, stallCategory: s.stallCategory, name: s.name, width: s.width, height: s.height });
  };

  const updateSelected = (patch: Partial<Stall>) => {
    if (!selected) return;
    const updated = { ...selected, ...patch };
    setStalls((prev) => prev.map((s) => s.id === updated.id ? updated : s));
    setSelected(updated);
    setDirty(true);
  };

  const addStall = (col: number, row: number) => {
    if (isCellOccupied(stalls, col, row)) return;
    const tempId = `new-${Date.now()}`;
    const newStall: Stall = {
      id: tempId,
      stallNumber: nextStallNumber(stalls),
      name: null,
      type: "STANDARD",
      size: "6x6",
      price: 1500,
      positionX: col,
      positionY: row,
      width: 1,
      height: 1,
      status: "AVAILABLE",
      stallCategory: null,
    };
    setStalls((prev) => [...prev, newStall]);
    selectStall(newStall);
    setDirty(true);
  };

  const deleteSelected = async () => {
    if (!selected) return;
    if (selected.status !== "AVAILABLE") { toast.error("Cannot delete a booked stall"); return; }

    if (!selected.id.startsWith("new-")) {
      const res = await fetch(`/api/events/${eventId}/stalls?stallId=${selected.id}`, { method: "DELETE" });
      if (!res.ok) { toast.error("Failed to delete stall"); return; }
    }
    setStalls((prev) => prev.filter((s) => s.id !== selected.id));
    setSelected(null);
    setDirty(false);
    toast.success("Stall removed");
  };

  const save = async () => {
    setSaving(true);
    try {
      const newStalls = stalls.filter((s) => s.id.startsWith("new-"));
      const existingStalls = stalls.filter((s) => !s.id.startsWith("new-"));

      // Create new stalls
      if (newStalls.length > 0) {
        const res = await fetch(`/api/events/${eventId}/stalls`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stalls: newStalls.map((s) => ({ ...s, id: undefined })) }),
        });
        if (!res.ok) throw new Error("Failed to create new stalls");
        const data = await res.json();
        // Replace temp IDs
        let idx = 0;
        setStalls((prev) =>
          prev.map((s) => (s.id.startsWith("new-") ? data.stalls[idx++] : s))
        );
      }

      // Update existing stalls layout
      if (existingStalls.length > 0) {
        const res = await fetch(`/api/events/${eventId}/stalls`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stalls: existingStalls }),
        });
        if (!res.ok) throw new Error("Failed to update layout");
      }

      setDirty(false);
      toast.success("Layout saved");
      onSaved?.(stalls);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const onDragStart = (e: React.DragEvent, stall: Stall, localX: number, localY: number) => {
    dragId.current = stall.id;
    dragOffset.current = { dx: localX, dy: localY };
    e.dataTransfer.effectAllowed = "move";
  };

  const onDropCell = (e: React.DragEvent, col: number, row: number) => {
    e.preventDefault();
    const id = dragId.current;
    if (!id) return;
    const stall = stalls.find((s) => s.id === id);
    if (!stall) return;
    const targetCol = col - dragOffset.current.dx;
    const targetRow = row - dragOffset.current.dy;

    // Boundary check
    if (targetCol < 0 || targetRow < 0 || targetCol + stall.width > GRID_COLS || targetRow + stall.height > GRID_ROWS) return;

    // Collision check
    for (let dc = 0; dc < stall.width; dc++) {
      for (let dr = 0; dr < stall.height; dr++) {
        if (isCellOccupied(stalls, targetCol + dc, targetRow + dr, id)) return;
      }
    }

    setStalls((prev) => prev.map((s) => s.id === id ? { ...s, positionX: targetCol, positionY: targetRow } : s));
    setDirty(true);
    dragId.current = null;
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4">
      {/* Grid */}
      <div className="flex-1 overflow-auto">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-gray-400">Click empty cell to add stall · Drag to reposition</span>
          <div className="flex gap-2">
            {dirty && (
              <button
                onClick={() => { setStalls(initialStalls); setDirty(false); setSelected(null); }}
                className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border text-gray-600 hover:bg-gray-50"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Reset
              </button>
            )}
            <button
              onClick={save}
              disabled={!dirty || saving}
              className={cn(
                "flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-medium",
                dirty ? "bg-indigo-600 text-white hover:bg-indigo-700" : "bg-gray-100 text-gray-400"
              )}
            >
              <Save className="h-3.5 w-3.5" />
              {saving ? "Saving…" : "Save Layout"}
            </button>
          </div>
        </div>

        <div
          className="relative border rounded-xl bg-gray-50 overflow-hidden"
          style={{ width: GRID_COLS * CELL_SIZE, height: GRID_ROWS * CELL_SIZE }}
        >
          {/* Grid lines */}
          {Array.from({ length: GRID_ROWS }).map((_, row) =>
            Array.from({ length: GRID_COLS }).map((_, col) => (
              <div
                key={`${col}-${row}`}
                className="absolute border border-gray-200 hover:bg-indigo-50/50 cursor-cell transition-colors"
                style={{ left: col * CELL_SIZE, top: row * CELL_SIZE, width: CELL_SIZE, height: CELL_SIZE }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => onDropCell(e, col, row)}
                onClick={() => !isCellOccupied(stalls, col, row) && addStall(col, row)}
              >
                {!isCellOccupied(stalls, col, row) && (
                  <Plus className="h-3.5 w-3.5 text-gray-200 absolute inset-0 m-auto" />
                )}
              </div>
            ))
          )}

          {/* Stalls */}
          {stalls.map((stall) => (
            <div
              key={stall.id}
              draggable={stall.status === "AVAILABLE"}
              onDragStart={(e) => onDragStart(e, stall, 0, 0)}
              onClick={(e) => { e.stopPropagation(); selectStall(stall); }}
              className={cn(
                "absolute border-2 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all select-none z-10 text-center px-1",
                TYPE_COLORS[stall.type] || TYPE_COLORS.STANDARD,
                selected?.id === stall.id && "ring-2 ring-indigo-500 ring-offset-1",
                stall.status === "BOOKED" && "opacity-70 cursor-not-allowed"
              )}
              style={{
                left: stall.positionX * CELL_SIZE + 2,
                top: stall.positionY * CELL_SIZE + 2,
                width: stall.width * CELL_SIZE - 4,
                height: stall.height * CELL_SIZE - 4,
              }}
            >
              <span className="font-bold text-xs leading-tight">#{stall.stallNumber}</span>
              <span className="text-[9px] leading-tight opacity-70">{stall.type.replace("_", " ")}</span>
              <span className="text-[9px] font-semibold">₹{stall.price}</span>
              {stall.status === "BOOKED" && <span className="text-[8px] text-red-600 font-medium">BOOKED</span>}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-2 mt-3">
          {STALL_TYPES.map((t) => (
            <span key={t} className={cn("text-xs px-2 py-0.5 rounded border", TYPE_COLORS[t])}>
              {t.replace("_", " ")}
            </span>
          ))}
        </div>
      </div>

      {/* Properties panel */}
      <div className="w-full lg:w-64 flex-shrink-0">
        {selected ? (
          <div className="bg-white border rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900 flex items-center gap-1.5">
                <Settings className="h-4 w-4 text-indigo-500" /> Stall #{selected.stallNumber}
              </h3>
              {selected.status === "AVAILABLE" && (
                <button onClick={deleteSelected} className="p-1 text-red-400 hover:bg-red-50 rounded">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500">Type</label>
                <select
                  value={editForm.type}
                  onChange={(e) => { setEditForm((p) => ({ ...p, type: e.target.value })); updateSelected({ type: e.target.value }); }}
                  className="mt-1 w-full border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled={selected.status !== "AVAILABLE"}
                >
                  {STALL_TYPES.map((t) => <option key={t} value={t}>{t.replace("_", " ")}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Price (₹)</label>
                <input
                  type="number"
                  value={editForm.price ?? ""}
                  onChange={(e) => { const v = parseFloat(e.target.value); setEditForm((p) => ({ ...p, price: v })); updateSelected({ price: v }); }}
                  className="mt-1 w-full border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled={selected.status !== "AVAILABLE"}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Category</label>
                <input
                  value={editForm.stallCategory ?? ""}
                  onChange={(e) => { setEditForm((p) => ({ ...p, stallCategory: e.target.value })); updateSelected({ stallCategory: e.target.value }); }}
                  placeholder="e.g. Food, Clothing"
                  className="mt-1 w-full border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-gray-500">Width</label>
                  <input
                    type="number" min={1} max={4}
                    value={editForm.width ?? 1}
                    onChange={(e) => { const v = parseInt(e.target.value); setEditForm((p) => ({ ...p, width: v })); updateSelected({ width: v }); }}
                    className="mt-1 w-full border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    disabled={selected.status !== "AVAILABLE"}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Height</label>
                  <input
                    type="number" min={1} max={4}
                    value={editForm.height ?? 1}
                    onChange={(e) => { const v = parseInt(e.target.value); setEditForm((p) => ({ ...p, height: v })); updateSelected({ height: v }); }}
                    className="mt-1 w-full border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    disabled={selected.status !== "AVAILABLE"}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Status</label>
                <div className={cn("mt-1 text-xs px-2 py-1.5 rounded-lg border", TYPE_COLORS[selected.type] || "bg-gray-50")}>
                  {selected.status}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 border rounded-xl p-4 text-center text-sm text-gray-400">
            <Settings className="h-6 w-6 mx-auto mb-2 opacity-30" />
            Click a stall to edit its properties
          </div>
        )}

        <div className="mt-3 bg-blue-50 rounded-xl p-3 text-xs text-blue-700">
          <p className="font-medium mb-1">Quick Guide</p>
          <ul className="space-y-0.5 text-blue-600">
            <li>• Click empty cell to add stall</li>
            <li>• Drag stall to reposition</li>
            <li>• Click stall to edit properties</li>
            <li>• Save when done</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
