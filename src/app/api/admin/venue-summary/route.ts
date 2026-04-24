import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const venues = await prisma.venue.findMany({
      where: { adminId: session.user.id },
      include: {
        events: {
          include: {
            bookings: {
              where: { status: "CONFIRMED" },
              select: { amount: true },
            },
            _count: { select: { visitorCheckIns: true } },
          },
        },
      },
    });

    const venueData = venues.map((v) => ({
      id: v.id,
      name: v.name,
      city: v.city,
      capacity: v.capacity,
      totalEvents: v.events.length,
      totalStallRevenue: v.events.reduce(
        (sum, e) => sum + e.bookings.reduce((s, b) => s + (b.amount ?? 0), 0),
        0
      ),
      totalVisitors: v.events.reduce((sum, e) => sum + e._count.visitorCheckIns, 0),
      recurringSlots: [] as { dayOfWeek: number; frequency: string; description: string }[],
    }));

    return NextResponse.json({ venues: venueData });
  } catch {
    return NextResponse.json({ error: "Failed to fetch venue summary" }, { status: 500 });
  }
}
