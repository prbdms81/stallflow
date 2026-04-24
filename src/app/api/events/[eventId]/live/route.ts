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

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, organizerId: true },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const userId = (session.user as { id: string }).id;
    const role = (session.user as { role: string }).role;

    if (role !== "ADMIN" && event.organizerId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Stall counts
    const [totalStalls, availableStalls, bookedStalls] = await Promise.all([
      prisma.stall.count({ where: { eventId } }),
      prisma.stall.count({ where: { eventId, status: "AVAILABLE" } }),
      prisma.stall.count({ where: { eventId, status: { not: "AVAILABLE" } } }),
    ]);

    // Booking counts
    const [confirmedBookings, pendingBookings] = await Promise.all([
      prisma.booking.count({
        where: { eventId, status: "CONFIRMED" },
      }),
      prisma.booking.count({
        where: { eventId, status: "PENDING" },
      }),
    ]);

    // Checked-in vendors: confirmed bookings with an ACTIVE gate pass
    const checkedInBookings = await prisma.booking.findMany({
      where: {
        eventId,
        status: "CONFIRMED",
        gatePass: { status: "ACTIVE" },
      },
      select: {
        id: true,
        vendor: { select: { id: true, name: true } },
        stall: { select: { stallNumber: true } },
        gatePass: { select: { createdAt: true } },
      },
    });

    const checkedIn = checkedInBookings.map((b) => ({
      bookingId: b.id,
      vendorName: b.vendor.name,
      stallNumber: b.stall.stallNumber,
      checkInTime: b.gatePass!.createdAt,
    }));

    // Not checked in: confirmed bookings without an active gate pass
    const notCheckedInBookings = await prisma.booking.findMany({
      where: {
        eventId,
        status: "CONFIRMED",
        gatePass: null,
      },
      select: {
        id: true,
        status: true,
        vendor: { select: { id: true, name: true } },
        stall: { select: { stallNumber: true } },
      },
    });

    // Also include confirmed bookings whose gate pass is not ACTIVE
    const notCheckedInRevoked = await prisma.booking.findMany({
      where: {
        eventId,
        status: "CONFIRMED",
        gatePass: { status: { not: "ACTIVE" } },
      },
      select: {
        id: true,
        status: true,
        vendor: { select: { id: true, name: true } },
        stall: { select: { stallNumber: true } },
      },
    });

    const notCheckedIn = [...notCheckedInBookings, ...notCheckedInRevoked].map(
      (b) => ({
        bookingId: b.id,
        vendorName: b.vendor.name,
        stallNumber: b.stall.stallNumber,
        bookingStatus: b.status,
      })
    );

    // Recent activity: last 10 bookings + gate passes combined, sorted by time
    const recentBookings = await prisma.booking.findMany({
      where: { eventId },
      orderBy: { updatedAt: "desc" },
      take: 10,
      select: {
        id: true,
        bookingNumber: true,
        status: true,
        updatedAt: true,
        vendor: { select: { name: true } },
        stall: { select: { stallNumber: true } },
      },
    });

    const recentGatePasses = await prisma.gatePass.findMany({
      where: { booking: { eventId } },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        status: true,
        createdAt: true,
        vendorName: true,
        stallNumber: true,
      },
    });

    type ActivityItem = {
      type: "booking" | "gate_pass";
      id: string;
      label: string;
      timestamp: Date;
      meta: string;
    };

    const activity: ActivityItem[] = [
      ...recentBookings.map((b) => ({
        type: "booking" as const,
        id: b.id,
        label: `Booking ${b.bookingNumber} — ${b.vendor.name}`,
        timestamp: b.updatedAt,
        meta: `Stall ${b.stall.stallNumber} · ${b.status}`,
      })),
      ...recentGatePasses.map((g) => ({
        type: "gate_pass" as const,
        id: g.id,
        label: `Gate pass issued — ${g.vendorName}`,
        timestamp: g.createdAt,
        meta: `Stall ${g.stallNumber} · ${g.status}`,
      })),
    ]
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10);

    return NextResponse.json({
      totalStalls,
      availableStalls,
      bookedStalls,
      confirmedBookings,
      pendingBookings,
      checkedIn,
      notCheckedIn,
      recentActivity: activity,
    });
  } catch (error) {
    console.error("Live dashboard error:", error);
    return NextResponse.json(
      { error: "Failed to fetch live data" },
      { status: 500 }
    );
  }
}
