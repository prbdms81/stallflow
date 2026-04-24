import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const bookings = await prisma.booking.findMany({
      where: { vendorId: session.user.id },
      include: {
        salesLogs: { orderBy: { date: "desc" } },
        event: {
          select: {
            title: true,
            startDate: true,
            endDate: true,
            venue: { select: { name: true, area: true } },
          },
        },
        stall: { select: { stallNumber: true, type: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    let totalSales = 0;
    let totalStallCost = 0;
    const monthlyMap: Record<string, { sales: number; cost: number; events: number }> = {};
    const venueMap: Record<string, { sales: number; cost: number; events: number }> = {};

    const bookingData = bookings.map((b) => {
      const eventSales = b.salesLogs.reduce((s, l) => s + l.amount, 0);
      totalSales += eventSales;
      totalStallCost += b.totalAmount;

      // Monthly aggregation (by event month)
      const monthKey = b.event.startDate.toISOString().slice(0, 7); // YYYY-MM
      if (!monthlyMap[monthKey]) monthlyMap[monthKey] = { sales: 0, cost: 0, events: 0 };
      monthlyMap[monthKey].sales += eventSales;
      monthlyMap[monthKey].cost += b.totalAmount;
      monthlyMap[monthKey].events += 1;

      // Venue aggregation
      const venueName = b.event.venue.name;
      if (!venueMap[venueName]) venueMap[venueName] = { sales: 0, cost: 0, events: 0 };
      venueMap[venueName].sales += eventSales;
      venueMap[venueName].cost += b.totalAmount;
      venueMap[venueName].events += 1;

      const roi = b.totalAmount > 0 ? Math.round(((eventSales - b.totalAmount) / b.totalAmount) * 100) : 0;

      return {
        id: b.id,
        bookingNumber: b.bookingNumber,
        eventTitle: b.event.title,
        venueName: b.event.venue.name,
        venueArea: b.event.venue.area || null,
        stallNumber: b.stall.stallNumber,
        stallType: b.stall.type || null,
        stallCost: b.totalAmount,
        eventDate: b.event.startDate,
        eventEndDate: b.event.endDate,
        paymentStatus: b.paymentStatus,
        paidAt: b.paidAt,
        salesLogs: b.salesLogs,
        totalSales: eventSales,
        roi,
      };
    });

    // Monthly trend (last 6 months, sorted)
    const sortedMonths = Object.entries(monthlyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, data]) => ({
        month,
        label: new Date(month + "-01").toLocaleDateString("en-IN", { month: "short", year: "2-digit" }),
        ...data,
        profit: data.sales - data.cost,
      }));

    // Best & worst events (by ROI, need at least one sale)
    const eventsWithSales = bookingData.filter((b) => b.totalSales > 0);
    const bestEvent = eventsWithSales.length > 0
      ? eventsWithSales.reduce((best, b) => b.roi > best.roi ? b : best)
      : null;
    const worstEvent = eventsWithSales.length > 1
      ? eventsWithSales.reduce((worst, b) => b.roi < worst.roi ? b : worst)
      : null;

    // Best venue
    const bestVenue = Object.entries(venueMap)
      .filter(([, d]) => d.sales > 0)
      .sort(([, a], [, b]) => (b.sales - b.cost) - (a.sales - a.cost))
      .map(([name, data]) => ({ name, ...data, profit: data.sales - data.cost }))[0] || null;

    // Payment history (bookings with payment info)
    const payments = bookings
      .filter((b) => b.paymentStatus === "PAID")
      .map((b) => ({
        bookingNumber: b.bookingNumber,
        eventTitle: b.event.title,
        amount: b.totalAmount,
        paidAt: b.paidAt,
      }));

    const avgEarningsPerEvent = eventsWithSales.length > 0
      ? Math.round(totalSales / eventsWithSales.length)
      : 0;
    const avgRoi = eventsWithSales.length > 0
      ? Math.round(eventsWithSales.reduce((s, b) => s + b.roi, 0) / eventsWithSales.length)
      : 0;

    return NextResponse.json({
      bookings: bookingData,
      summary: {
        totalSales,
        totalStallCost,
        profit: totalSales - totalStallCost,
        eventCount: bookings.length,
        eventsWithSales: eventsWithSales.length,
        avgEarningsPerEvent,
        avgRoi,
        totalPaid: payments.reduce((s, p) => s + p.amount, 0),
      },
      monthlyTrend: sortedMonths,
      insights: {
        bestEvent: bestEvent ? { title: bestEvent.eventTitle, venue: bestEvent.venueName, roi: bestEvent.roi, profit: bestEvent.totalSales - bestEvent.stallCost } : null,
        worstEvent: worstEvent && worstEvent.id !== bestEvent?.id ? { title: worstEvent.eventTitle, venue: worstEvent.venueName, roi: worstEvent.roi, profit: worstEvent.totalSales - worstEvent.stallCost } : null,
        bestVenue,
      },
      payments,
    });
  } catch (error) {
    console.error("Sales logs fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch sales logs" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { bookingId, date, amount, notes } = body;

    // Verify booking belongs to vendor
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking || booking.vendorId !== session.user.id) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const log = await prisma.salesLog.create({
      data: {
        bookingId,
        date: new Date(date),
        amount: parseFloat(amount),
        notes: notes || null,
      },
    });

    return NextResponse.json({ salesLog: log }, { status: 201 });
  } catch (error) {
    console.error("Sales log creation error:", error);
    return NextResponse.json({ error: "Failed to log sales" }, { status: 500 });
  }
}
