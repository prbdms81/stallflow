"use client";

import { cn } from "@/lib/utils";
import { formatCurrency, getStallTypeLabel } from "@/lib/utils";
import { useState } from "react";

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

interface StallLayoutProps {
  stalls: Stall[];
  selectedStallId?: string | null;
  onStallClick?: (stall: Stall) => void;
  editable?: boolean;
}

const statusColors: Record<string, { bg: string; border: string; text: string }> = {
  AVAILABLE: { bg: "bg-green-100 hover:bg-green-200", border: "border-green-400", text: "text-green-800" },
  BOOKED: { bg: "bg-red-100", border: "border-red-300", text: "text-red-700" },
  RESERVED: { bg: "bg-yellow-100", border: "border-yellow-400", text: "text-yellow-800" },
  BLOCKED: { bg: "bg-gray-100", border: "border-gray-300", text: "text-gray-500" },
};

const typeColors: Record<string, string> = {
  STANDARD: "from-blue-500/10",
  PREMIUM: "from-purple-500/10",
  CORNER: "from-orange-500/10",
  FOOD_COURT: "from-red-500/10",
  KIOSK: "from-teal-500/10",
};

export default function StallLayout({ stalls, selectedStallId, onStallClick }: StallLayoutProps) {
  const [hoveredStall, setHoveredStall] = useState<Stall | null>(null);

  if (stalls.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No stall layout available for this event.</p>
      </div>
    );
  }

  // Calculate grid dimensions
  const maxX = Math.max(...stalls.map((s) => s.positionX + s.width));
  const maxY = Math.max(...stalls.map((s) => s.positionY + s.height));
  const cols = Math.ceil(maxX);
  const rows = Math.ceil(maxY);

  // Category-wise booking summary
  const categorySummary: Record<string, { total: number; booked: number; available: number }> = {};
  stalls.forEach((stall) => {
    const cat = stall.stallCategory || "Uncategorized";
    if (!categorySummary[cat]) {
      categorySummary[cat] = { total: 0, booked: 0, available: 0 };
    }
    categorySummary[cat].total++;
    if (stall.status === "BOOKED") categorySummary[cat].booked++;
    if (stall.status === "AVAILABLE") categorySummary[cat].available++;
  });

  return (
    <div className="space-y-4">
      {/* Category-wise Booking Summary */}
      {Object.keys(categorySummary).length > 1 && (
        <div className="bg-white border rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Category-wise Stall Summary</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {Object.entries(categorySummary)
              .sort((a, b) => a[0].localeCompare(b[0]))
              .map(([cat, counts]) => (
                <div key={cat} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 text-sm">
                  <span className="font-medium text-gray-700 truncate mr-2">{cat}</span>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="text-green-600 font-semibold" title="Available">{counts.available}</span>
                    <span className="text-gray-300">/</span>
                    <span className="text-gray-500" title="Total">{counts.total}</span>
                    {counts.booked > 0 && (
                      <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full ml-1">
                        {counts.booked} booked
                      </span>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-green-100 border border-green-400" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-red-100 border border-red-300" />
          <span>Booked</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-yellow-100 border border-yellow-400" />
          <span>Reserved</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-indigo-100 border-2 border-indigo-500" />
          <span>Selected</span>
        </div>
      </div>

      {/* Floor Plan */}
      <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-4 bg-gray-50 overflow-auto">
        {/* Entrance marker */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-indigo-600 text-white text-xs px-3 py-1 rounded-full">
          ENTRANCE
        </div>

        <div
          className="grid gap-2 mt-4"
          style={{
            gridTemplateColumns: `repeat(${Math.max(cols, 4)}, minmax(80px, 1fr))`,
            gridTemplateRows: `repeat(${Math.max(rows, 2)}, minmax(80px, 1fr))`,
          }}
        >
          {stalls.map((stall) => {
            const colors = statusColors[stall.status] || statusColors.BLOCKED;
            const isSelected = selectedStallId === stall.id;
            const isClickable = stall.status === "AVAILABLE" && onStallClick;

            return (
              <button
                key={stall.id}
                onClick={() => isClickable && onStallClick(stall)}
                onMouseEnter={() => setHoveredStall(stall)}
                onMouseLeave={() => setHoveredStall(null)}
                disabled={!isClickable}
                className={cn(
                  "relative rounded-lg border-2 p-2 transition-all text-center min-h-[80px] flex flex-col items-center justify-center",
                  isSelected
                    ? "bg-indigo-100 border-indigo-500 ring-2 ring-indigo-300 shadow-md"
                    : `${colors.bg} ${colors.border}`,
                  isClickable && "cursor-pointer",
                  !isClickable && stall.status !== "AVAILABLE" && "cursor-not-allowed opacity-75",
                  `bg-gradient-to-br ${typeColors[stall.type] || ""} to-transparent`
                )}
                style={{
                  gridColumn: `${Math.floor(stall.positionX) + 1} / span ${Math.ceil(stall.width)}`,
                  gridRow: `${Math.floor(stall.positionY) + 1} / span ${Math.ceil(stall.height)}`,
                }}
              >
                <span className={cn("font-bold text-sm", isSelected ? "text-indigo-700" : colors.text)}>
                  #{stall.stallNumber}
                </span>
                {stall.stallCategory && (
                  <span className="text-[10px] text-gray-500 mt-0.5 truncate max-w-full">{stall.stallCategory}</span>
                )}
                <span className="text-xs text-gray-500 mt-0.5">{stall.size} ft</span>
                <span className={cn("text-xs font-medium mt-0.5", isSelected ? "text-indigo-600" : "text-gray-700")}>
                  {formatCurrency(stall.price)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Hovered/Selected Stall Info */}
      {(hoveredStall || (selectedStallId && stalls.find((s) => s.id === selectedStallId))) && (
        <div className="bg-white border rounded-lg p-4 text-sm">
          {(() => {
            const stall = hoveredStall || stalls.find((s) => s.id === selectedStallId)!;
            return (
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <span className="font-semibold">Stall #{stall.stallNumber}</span>
                  <span className="text-gray-500 ml-2">{getStallTypeLabel(stall.type)}</span>
                  <span className="text-gray-400 mx-2">|</span>
                  <span className="text-gray-500">{stall.size} ft</span>
                  {stall.stallCategory && (
                    <span className="ml-2 px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-xs">{stall.stallCategory}</span>
                  )}
                  {stall.name && <span className="text-gray-500 ml-2">- {stall.name}</span>}
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-indigo-600">{formatCurrency(stall.price)}</span>
                  <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium",
                    stall.status === "AVAILABLE" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  )}>
                    {stall.status}
                  </span>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
