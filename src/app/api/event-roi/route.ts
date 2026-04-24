import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get("eventId");
  const vendorCategory = searchParams.get("vendorCategory");

  if (!eventId) return NextResponse.json({ error: "eventId required" }, { status: 400 });

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { venueId: true, categoryId: true, basePrice: true },
  });

  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  const pastEvents = await prisma.event.findMany({
    where: {
      venueId: event.venueId,
      categoryId: event.categoryId,
      id: { not: eventId },
      status: "COMPLETED",
    },
    select: {
      id: true,
      bookings: {
        where: { paymentStatus: "PAID" },
        select: {
          totalAmount: true,
          vendorId: true,
          stallCategory: true,
          salesLogs: { select: { amount: true } },
        },
      },
    },
    take: 20,
    orderBy: { startDate: "desc" },
  });

  let bookings = pastEvents.flatMap((e) => e.bookings);

  if (vendorCategory) {
    bookings = bookings.filter((b) => b.stallCategory === vendorCategory);
  }

  if (bookings.length === 0) {
    return NextResponse.json({
      stallFee: event.basePrice,
      avgSales: 0,
      avgProfit: 0,
      successRate: 0,
      sampleSize: 0,
      recommendation: "LOW",
    });
  }

  const stallFee = event.basePrice;
  let totalSales = 0;
  let successCount = 0;

  for (const b of bookings) {
    const sales = b.salesLogs.reduce((s, l) => s + l.amount, 0);
    totalSales += sales;
    if (sales > b.totalAmount) successCount++;
  }

  const avgSales = totalSales / bookings.length;
  const avgStallFee = bookings.reduce((s, b) => s + b.totalAmount, 0) / bookings.length;
  const avgProfit = avgSales - avgStallFee;
  const successRate = Math.round((successCount / bookings.length) * 100);

  const recommendation: "HIGH" | "MEDIUM" | "LOW" =
    successRate >= 60 && avgProfit > 0 ? "HIGH" :
    successRate >= 35 || avgProfit > 0 ? "MEDIUM" : "LOW";

  return NextResponse.json({
    stallFee,
    avgSales: Math.round(avgSales),
    avgProfit: Math.round(avgProfit),
    successRate,
    sampleSize: bookings.length,
    recommendation,
  });
}
