import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: { venueId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { venueId } = params;

  const venue = await prisma.venue.findUnique({
    where: { id: venueId },
    select: { id: true, name: true, totalStallSlots: true },
  });
  if (!venue) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // All events ever at this venue
  const allEvents = await prisma.event.findMany({
    where: { venueId },
    select: {
      id: true,
      title: true,
      startDate: true,
      endDate: true,
      status: true,
      maxStalls: true,
      bookedStalls: true,
      organizerId: true,
      organizer: { select: { name: true, company: true } },
    },
    orderBy: { startDate: "desc" },
  });

  const totalEvents = allEvents.length;

  // Top event companies (organizers ranked by event count at this venue)
  const organizerMap: Record<string, { name: string; company: string | null; count: number }> = {};
  for (const e of allEvents) {
    if (!organizerMap[e.organizerId]) {
      organizerMap[e.organizerId] = {
        name: e.organizer.name,
        company: e.organizer.company,
        count: 0,
      };
    }
    organizerMap[e.organizerId].count += 1;
  }
  const topOrganizers = Object.entries(organizerMap)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)
    .map(([id, data]) => ({ organizerId: id, ...data }));

  // 60-day availability calendar
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end60 = new Date(today);
  end60.setDate(end60.getDate() + 59);

  const upcomingEvents = allEvents.filter((e) => {
    const start = new Date(e.startDate);
    const end = new Date(e.endDate);
    return end >= today && start <= end60;
  });

  const days: { date: string; busy: boolean; eventTitle?: string }[] = [];
  for (let i = 0; i < 60; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split("T")[0];

    const busyEvent = upcomingEvents.find((e) => {
      const start = new Date(e.startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(e.endDate);
      end.setHours(23, 59, 59, 999);
      return d >= start && d <= end;
    });

    days.push({ date: dateStr, busy: !!busyEvent, eventTitle: busyEvent?.title });
  }

  const availableDays = days.filter((d) => !d.busy).length;

  return NextResponse.json({
    venueId,
    totalEvents,
    topOrganizers,
    upcomingEvents: upcomingEvents.map((e) => ({
      id: e.id,
      title: e.title,
      startDate: e.startDate,
      endDate: e.endDate,
      status: e.status,
      maxStalls: e.maxStalls,
      bookedStalls: e.bookedStalls,
    })),
    days,
    availableDays,
  });
}
