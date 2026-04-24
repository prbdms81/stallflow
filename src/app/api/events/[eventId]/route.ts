import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateShareToken } from "@/lib/utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        category: { select: { name: true, slug: true } },
        venue: {
          include: {
            amenities: true,
            parkingSlots: true,
          },
        },
        organizer: {
          select: { id: true, name: true, email: true, phone: true, company: true },
        },
        stalls: {
          orderBy: { stallNumber: "asc" },
        },
        reviews: {
          include: {
            author: { select: { name: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Increment view count
    await prisma.event.update({
      where: { id: eventId },
      data: { viewCount: { increment: 1 } },
    });

    // Fetch recent events at the same venue (last 4 weeks)
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

    const recentVenueEvents = await prisma.event.findMany({
      where: {
        venueId: event.venueId,
        id: { not: eventId },
        endDate: { gte: fourWeeksAgo, lt: new Date() },
        status: { in: ["PUBLISHED", "LIVE", "COMPLETED"] },
      },
      select: {
        id: true,
        title: true,
        startDate: true,
        endDate: true,
        startTime: true,
        endTime: true,
        eventType: true,
        maxStalls: true,
        bookedStalls: true,
      },
      orderBy: { startDate: "desc" },
    });

    return NextResponse.json({ event, recentVenueEvents });
  } catch (error) {
    console.error("Event fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch event" }, { status: 500 });
  }
}

// PATCH /api/events/[eventId] — Generate share token, update UPI ID
export async function PATCH(
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
      select: { organizerId: true, shareToken: true },
    });

    if (!event || event.organizerId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const updateData: Record<string, unknown> = {};

    // Generate share token if requested
    if (body.generateShareToken) {
      if (!event.shareToken) {
        updateData.shareToken = generateShareToken();
      }
    }

    // Update UPI ID
    if (body.upiId !== undefined) {
      updateData.upiId = body.upiId || null;
    }

    // Update status (e.g. mark as COMPLETED)
    const allowedStatuses = ["DRAFT", "PUBLISHED", "LIVE", "COMPLETED", "CANCELLED"];
    if (body.status && allowedStatuses.includes(body.status)) {
      updateData.status = body.status;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ shareToken: event.shareToken });
    }

    const updated = await prisma.event.update({
      where: { id: eventId },
      data: updateData,
      select: { shareToken: true, upiId: true, status: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Event update error:", error);
    return NextResponse.json({ error: "Failed to update event" }, { status: 500 });
  }
}
