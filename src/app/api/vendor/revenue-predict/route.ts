import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(idx);
  const upper = Math.ceil(idx);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (idx - lower);
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;
  const role = (session.user as { role: string }).role;
  if (role !== "VENDOR") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get("eventId");
  if (!eventId) return NextResponse.json({ error: "eventId required" }, { status: 400 });

  // Fetch the target event
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      venue: { select: { id: true, city: true, name: true } },
      category: { select: { name: true } },
    },
  });
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  const eventMonth = new Date(event.startDate).getMonth(); // 0-indexed
  const dayOfWeek = new Date(event.startDate).getDay();

  // Vendor's stall category from past bookings
  const vendorCatBooking = await prisma.booking.findFirst({
    where: { vendorId: userId, stallCategory: { not: null } },
    orderBy: { createdAt: "desc" },
    select: { stallCategory: true },
  });
  const vendorStallCategory = vendorCatBooking?.stallCategory ?? null;

  // 1. Historical bookings at the SAME venue
  const venueBookings = await prisma.booking.findMany({
    where: {
      status: "CONFIRMED",
      paymentStatus: "PAID",
      event: { venueId: event.venueId },
    },
    select: { totalAmount: true },
  });
  const venueAmounts = venueBookings.map((b) => b.totalAmount).sort((a, b) => a - b);
  const venueAvg = avg(venueAmounts);
  const venueP25 = percentile(venueAmounts, 25);
  const venueP75 = percentile(venueAmounts, 75);

  // 2. Historical bookings in same month across all venues for vendor's stall category
  const allBookingsForMonth = await prisma.booking.findMany({
    where: {
      status: "CONFIRMED",
      paymentStatus: "PAID",
      stallCategory: vendorStallCategory ?? undefined,
    },
    select: {
      totalAmount: true,
      event: { select: { startDate: true } },
    },
  });

  const categoryAmounts = allBookingsForMonth
    .filter((b) => new Date(b.event.startDate).getMonth() === eventMonth)
    .map((b) => b.totalAmount);
  const categoryAvg = avg(categoryAmounts);

  // 3. Vendor's own past performance
  const vendorPastBookings = await prisma.booking.findMany({
    where: {
      vendorId: userId,
      status: "CONFIRMED",
      paymentStatus: "PAID",
    },
    include: {
      event: { select: { title: true } },
    },
    orderBy: { totalAmount: "desc" },
  });

  const vendorAmounts = vendorPastBookings.map((b) => b.totalAmount);
  const vendorAvg = avg(vendorAmounts);
  const bestEvent = vendorPastBookings[0]
    ? { title: vendorPastBookings[0].event.title, amount: vendorPastBookings[0].totalAmount }
    : null;
  const worstEvent =
    vendorPastBookings.length > 0
      ? {
          title: vendorPastBookings[vendorPastBookings.length - 1].event.title,
          amount: vendorPastBookings[vendorPastBookings.length - 1].totalAmount,
        }
      : null;

  // Weighted prediction
  const weights = { venue: 0.4, category: 0.3, vendor: 0.3 };
  let predictedAvg = 0;
  let divisor = 0;

  if (venueAmounts.length > 0) { predictedAvg += venueAvg * weights.venue; divisor += weights.venue; }
  if (categoryAmounts.length > 0) { predictedAvg += categoryAvg * weights.category; divisor += weights.category; }
  if (vendorAmounts.length > 0) { predictedAvg += vendorAvg * weights.vendor; divisor += weights.vendor; }

  if (divisor > 0) predictedAvg = predictedAvg / divisor;

  // Spread: use p25/p75 if available, else ±20%
  const sampleSize = venueAmounts.length + categoryAmounts.length + vendorAmounts.length;
  const predictedMin = venueAmounts.length >= 3 ? Math.round(venueP25) : Math.round(predictedAvg * 0.8);
  const predictedMax = venueAmounts.length >= 3 ? Math.round(venueP75) : Math.round(predictedAvg * 1.2);

  // Confidence
  const confidence: "LOW" | "MEDIUM" | "HIGH" =
    sampleSize < 3 ? "LOW" : sampleSize < 10 ? "MEDIUM" : "HIGH";

  // Insights
  const insights: string[] = [];

  if (dayOfWeek === 6 || dayOfWeek === 0) {
    insights.push(`${DAY_NAMES[dayOfWeek]} events at this venue typically attract higher footfall`);
  } else {
    insights.push(`Weekday events may see lower footfall than weekend events`);
  }

  if (vendorStallCategory && (eventMonth === 11 || eventMonth === 0)) {
    insights.push(`${vendorStallCategory} category performs best in December–January festival season`);
  } else if (vendorStallCategory) {
    insights.push(`Your ${vendorStallCategory} category has ${categoryAmounts.length} comparable data points for ${MONTH_NAMES[eventMonth]}`);
  }

  if (venueAmounts.length > 0) {
    insights.push(`${venueAmounts.length} booking(s) recorded at ${event.venue.name} — venue avg is ₹${Math.round(venueAvg).toLocaleString("en-IN")}`);
  } else {
    insights.push(`No prior bookings at ${event.venue.name} — prediction based on category & your history`);
  }

  if (bestEvent) {
    insights.push(`Your best event earned ₹${Math.round(bestEvent.amount).toLocaleString("en-IN")} (${bestEvent.title})`);
  }

  if (vendorAmounts.length === 0 && categoryAmounts.length === 0 && venueAmounts.length === 0) {
    insights.push("Not enough historical data — book your first event to improve predictions");
  }

  return NextResponse.json({
    eventId,
    eventTitle: event.title,
    eventDate: event.startDate,
    venueCity: event.venue.city,
    venueName: event.venue.name,
    predictedMin,
    predictedMax,
    predictedAvg: Math.round(predictedAvg),
    venueAvg: Math.round(venueAvg),
    categoryAvg: Math.round(categoryAvg),
    vendorAvg: Math.round(vendorAvg),
    sampleSize,
    confidence,
    insights,
    bestEvent,
    worstEvent,
  });
}
