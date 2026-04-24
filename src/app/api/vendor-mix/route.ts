import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DEFAULTS = [
  { category: "FOOD_COURT", percentage: 30, reasoning: "Food stalls drive footfall and dwell time" },
  { category: "CLOTHING", percentage: 20, reasoning: "High-volume category at community events" },
  { category: "HANDICRAFTS", percentage: 15, reasoning: "Curated craft stalls attract repeat visitors" },
  { category: "JEWELLERY", percentage: 10, reasoning: "High-margin, low-footprint category" },
  { category: "KIDS", percentage: 10, reasoning: "Family events benefit from kids-focused stalls" },
  { category: "OTHER", percentage: 15, reasoning: "Remaining categories for variety" },
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const eventType = searchParams.get("eventType");
  const maxStalls = parseInt(searchParams.get("maxStalls") || "20");

  if (!eventType) {
    return NextResponse.json({ error: "eventType is required" }, { status: 400 });
  }

  const pastEvents = await prisma.event.findMany({
    where: {
      eventType,
      bookedStalls: { gt: 5 },
      status: { in: ["COMPLETED", "PUBLISHED", "LIVE"] },
    },
    select: {
      id: true,
      bookings: {
        select: { stallCategory: true },
        where: { paymentStatus: "PAID" },
      },
    },
  });

  if (pastEvents.length === 0) {
    const mix = DEFAULTS.map((d) => ({
      ...d,
      suggestedCount: Math.round((d.percentage / 100) * maxStalls),
    }));
    return NextResponse.json({ mix, basedOnEvents: 0 });
  }

  const tally: Record<string, number> = {};
  let total = 0;

  for (const event of pastEvents) {
    for (const booking of event.bookings) {
      const cat = booking.stallCategory || "OTHER";
      tally[cat] = (tally[cat] || 0) + 1;
      total++;
    }
  }

  const mix = Object.entries(tally)
    .sort((a, b) => b[1] - a[1])
    .map(([category, count]) => {
      const percentage = Math.round((count / total) * 100);
      return {
        category,
        percentage,
        suggestedCount: Math.round((percentage / 100) * maxStalls),
        reasoning: `Based on ${count} bookings across ${pastEvents.length} similar events`,
      };
    });

  return NextResponse.json({ mix, basedOnEvents: pastEvents.length });
}
