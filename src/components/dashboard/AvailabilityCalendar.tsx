"use client";

type Day = { date: string; busy: boolean; eventTitle?: string | null };

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

export function AvailabilityCalendar({ days }: { days: Day[] }) {
  if (!days || days.length === 0) return null;

  // Group days by YYYY-MM key, preserving the 60-day window order.
  const months = new Map<string, Day[]>();
  for (const d of days) {
    const dt = new Date(d.date);
    const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
    if (!months.has(key)) months.set(key, []);
    months.get(key)!.push(d);
  }

  return (
    <div className="space-y-4">
      {Array.from(months.entries()).map(([key, monthDays]) => {
        const firstDate = new Date(monthDays[0].date);
        const monthLabel = firstDate.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
        // Leading blanks before the first day's weekday column
        const leadingBlanks = new Date(monthDays[0].date).getDay();

        return (
          <div key={key}>
            <div className="text-xs font-semibold text-gray-700 mb-1.5">{monthLabel}</div>
            <div className="grid grid-cols-7 gap-1 text-[10px] text-gray-400 mb-1">
              {WEEKDAYS.map((w, i) => (
                <div key={i} className="text-center">{w}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: leadingBlanks }).map((_, i) => (
                <div key={`blank-${i}`} className="h-8" />
              ))}
              {monthDays.map((d) => {
                const dayNum = new Date(d.date).getDate();
                return (
                  <div
                    key={d.date}
                    title={d.busy ? `${d.date} — ${d.eventTitle || "Booked"}` : `${d.date} — Free`}
                    className={`h-8 rounded flex items-center justify-center text-[11px] font-medium cursor-default border ${
                      d.busy
                        ? "bg-red-100 text-red-700 border-red-200 hover:bg-red-200"
                        : "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                    }`}
                  >
                    {dayNum}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
