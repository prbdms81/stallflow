import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const city = searchParams.get("city");
    const eventType = searchParams.get("eventType") || undefined;

    if (!city) {
      return NextResponse.json({ error: "city is required" }, { status: 400 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const where: Record<string, unknown> = {
      status: "PUBLISHED",
      startDate: { gte: today },
      venue: { city: city },
    };
    if (eventType) where.eventType = eventType;

    const events = await prisma.event.findMany({
      where: where as never,
      select: {
        id: true,
        stalls: {
          select: { stallCategory: true, price: true, status: true },
        },
      },
    });

    // Aggregate per category from Stall rows — the source of truth for slot
    // counts, prices, and booked state (every Booking sets its stall to BOOKED).
    const categoryMap: Record<string, { totalSlots: number; bookedSlots: number; prices: number[] }> = {};

    for (const event of events) {
      for (const stall of event.stalls) {
        const cat = stall.stallCategory || "General";
        if (!categoryMap[cat]) categoryMap[cat] = { totalSlots: 0, bookedSlots: 0, prices: [] };
        categoryMap[cat].totalSlots += 1;
        if (stall.price) categoryMap[cat].prices.push(stall.price);
        if (stall.status === "BOOKED") categoryMap[cat].bookedSlots += 1;
      }
    }

    const heatmap = Object.entries(categoryMap).map(([category, data]) => {
      const totalSlots = data.totalSlots;
      const bookedSlots = Math.min(data.bookedSlots, totalSlots);
      const availableSlots = Math.max(totalSlots - bookedSlots, 0);
      const fillRate = totalSlots > 0 ? bookedSlots / totalSlots : 0;
      const demandLevel: "HIGH" | "MEDIUM" | "LOW" =
        fillRate > 0.7 ? "HIGH" : fillRate >= 0.3 ? "MEDIUM" : "LOW";
      const avgPrice =
        data.prices.length > 0
          ? Math.round(data.prices.reduce((s, p) => s + p, 0) / data.prices.length)
          : 0;
      return {
        category,
        totalSlots,
        bookedSlots,
        availableSlots,
        fillRate: parseFloat(fillRate.toFixed(2)),
        demandLevel,
        avgPrice,
      };
    });

    heatmap.sort((a, b) => b.fillRate - a.fillRate);

    return NextResponse.json({ city, heatmap });
  } catch (err) {
    console.error("Demand heatmap error:", err);
    return NextResponse.json({ error: "Failed to fetch demand heatmap" }, { status: 500 });
  }
}
