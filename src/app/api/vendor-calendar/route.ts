import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export interface CalendarEvent {
  id: string;
  eventTitle: string;
  startDate: string;
  endDate: string;
  venueName: string;
  stallNumber: string;
  status: string;
}

export interface ConflictPair {
  bookingIdA: string;
  bookingIdB: string;
  eventTitleA: string;
  eventTitleB: string;
  overlapStart: string;
  overlapEnd: string;
}

function datesOverlap(startA: Date, endA: Date, startB: Date, endB: Date) {
  return startA <= endB && startB <= endA;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const bookings = await prisma.booking.findMany({
    where: {
      vendorId: session.user.id,
      status: { not: "CANCELLED" },
      event: { startDate: { gte: today } },
    },
    include: {
      event: {
        select: {
          id: true,
          title: true,
          startDate: true,
          endDate: true,
          venue: { select: { name: true } },
        },
      },
      stall: { select: { stallNumber: true } },
    },
    orderBy: { event: { startDate: "asc" } },
  });

  const events: CalendarEvent[] = bookings.map((b) => ({
    id: b.id,
    eventTitle: b.event.title,
    startDate: b.event.startDate.toISOString(),
    endDate: b.event.endDate.toISOString(),
    venueName: b.event.venue.name,
    stallNumber: b.stall.stallNumber,
    status: b.status,
  }));

  // Detect conflicts: pairs whose date ranges overlap
  const conflicts: ConflictPair[] = [];
  for (let i = 0; i < bookings.length; i++) {
    for (let j = i + 1; j < bookings.length; j++) {
      const a = bookings[i].event;
      const b = bookings[j].event;
      if (datesOverlap(a.startDate, a.endDate, b.startDate, b.endDate)) {
        const overlapStart = new Date(Math.max(a.startDate.getTime(), b.startDate.getTime()));
        const overlapEnd = new Date(Math.min(a.endDate.getTime(), b.endDate.getTime()));
        conflicts.push({
          bookingIdA: bookings[i].id,
          bookingIdB: bookings[j].id,
          eventTitleA: a.title,
          eventTitleB: b.title,
          overlapStart: overlapStart.toISOString(),
          overlapEnd: overlapEnd.toISOString(),
        });
      }
    }
  }

  return NextResponse.json({ events, conflicts });
}
