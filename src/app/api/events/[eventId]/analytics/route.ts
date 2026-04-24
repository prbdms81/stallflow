import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { eventId } = await params;

    // Verify organizer ownership
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { organizerId: true, maxStalls: true, bookedStalls: true },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (event.organizerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch all confirmed bookings for this event
    const bookings = await prisma.booking.findMany({
      where: {
        eventId,
        status: "CONFIRMED",
      },
      include: {
        vendor: { select: { id: true, name: true } },
        stall: { select: { stallNumber: true } },
        utilityBillings: { select: { amount: true } },
      },
    });

    // ── Stall Occupancy ───────────────────────────────────────────────────────
    const totalStalls = await prisma.stall.count({ where: { eventId } });
    const bookedCount = await prisma.stall.count({
      where: { eventId, status: "BOOKED" },
    });
    const availableCount = totalStalls - bookedCount;
    const occupancyPct =
      totalStalls > 0 ? Math.round((bookedCount / totalStalls) * 100) : 0;

    // ── Revenue ────────────────────────────────────────────────────────────────
    const totalRevenue = bookings.reduce((sum, b) => sum + b.totalAmount, 0);
    const avgPerStall = bookedCount > 0 ? totalRevenue / bookedCount : 0;

    // Group by stallCategory
    const categoryMap: Record<string, number> = {};
    for (const b of bookings) {
      const cat = b.stallCategory || "Uncategorized";
      categoryMap[cat] = (categoryMap[cat] ?? 0) + b.totalAmount;
    }
    const byCategory = Object.entries(categoryMap).map(([category, amount]) => ({
      category,
      amount,
    }));

    // ── Vendor Breakdown (top 5) ───────────────────────────────────────────────
    const vendorMap: Record<
      string,
      { name: string; amount: number; stallNumber: string }
    > = {};
    for (const b of bookings) {
      const vid = b.vendorId;
      if (!vendorMap[vid]) {
        vendorMap[vid] = {
          name: b.vendor.name ?? "Unknown",
          amount: 0,
          stallNumber: b.stall.stallNumber,
        };
      }
      vendorMap[vid].amount += b.totalAmount;
    }
    const topVendors = Object.values(vendorMap)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    // ── Ratings ────────────────────────────────────────────────────────────────
    const reviews = await prisma.review.findMany({
      where: { eventId, reviewType: "VENDOR" },
      select: { rating: true },
    });
    const totalReviews = reviews.length;
    const avgRating =
      totalReviews > 0
        ? Math.round(
            (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews) * 10
          ) / 10
        : 0;

    // ── Footfall ───────────────────────────────────────────────────────────────
    const footfall = await prisma.visitorCheckIn.count({ where: { eventId } });

    // ── Utility Revenue ────────────────────────────────────────────────────────
    const utilityRevenue = bookings.reduce((sum, b) => {
      return sum + b.utilityBillings.reduce((s, u) => s + u.amount, 0);
    }, 0);

    // ── Sponsor Revenue ────────────────────────────────────────────────────────
    const sponsors = await prisma.eventSponsor.findMany({
      where: { eventId, paymentStatus: "RECEIVED" },
      select: { amount: true },
    });
    const sponsorRevenue = sponsors.reduce((sum, s) => sum + s.amount, 0);

    return NextResponse.json({
      stallOccupancy: {
        total: totalStalls,
        booked: bookedCount,
        available: availableCount,
        occupancyPct,
      },
      revenue: {
        total: totalRevenue,
        avgPerStall,
        byCategory,
      },
      vendorBreakdown: topVendors,
      ratings: {
        avgRating,
        totalReviews,
      },
      footfall,
      utilityRevenue,
      sponsorRevenue,
    });
  } catch (error) {
    console.error("Analytics fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
