import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// POST: visitor checks in (public — no auth)
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { eventId, name, phone } = body;

  if (!eventId) return NextResponse.json({ error: "eventId required" }, { status: 400 });

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { id: true, title: true, status: true },
  });
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  const checkIn = await prisma.visitorCheckIn.create({
    data: {
      eventId,
      name: name?.trim() || null,
      phone: phone?.trim() || null,
    },
  });

  return NextResponse.json({ checkIn, event: { title: event.title } }, { status: 201 });
}

// GET: footfall analytics for an event (organizer only)
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get("eventId");
  if (!eventId) return NextResponse.json({ error: "eventId required" }, { status: 400 });

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { organizerId: true, title: true },
  });
  if (!event || (event.organizerId !== session.user.id && session.user.role !== "ADMIN"))
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const checkIns = await prisma.visitorCheckIn.findMany({
    where: { eventId },
    orderBy: { checkedAt: "asc" },
    select: { id: true, name: true, checkedAt: true },
  });

  // Build hourly buckets
  const hourly: Record<string, number> = {};
  for (const c of checkIns) {
    const hour = new Date(c.checkedAt).getHours();
    const key = `${hour}:00`;
    hourly[key] = (hourly[key] || 0) + 1;
  }

  const peakHour = Object.entries(hourly).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  return NextResponse.json({
    total: checkIns.length,
    peakHour,
    hourly,
    recent: checkIns.slice(-20).reverse(),
  });
}
