import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/events/share?token=xxx — fetch event by share token (no auth)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Token required" }, { status: 400 });
    }

    const event = await prisma.event.findUnique({
      where: { shareToken: token },
      include: {
        venue: {
          select: {
            name: true,
            address: true,
            area: true,
            city: true,
            parkingNotes: true,
          },
        },
        category: { select: { name: true } },
        stalls: {
          select: {
            id: true,
            stallNumber: true,
            name: true,
            type: true,
            size: true,
            price: true,
            positionX: true,
            positionY: true,
            width: true,
            height: true,
            status: true,
            stallCategory: true,
          },
          orderBy: { stallNumber: "asc" },
        },
        organizer: {
          select: { name: true, phone: true },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (event.status !== "PUBLISHED") {
      return NextResponse.json({ error: "Event is not available for booking" }, { status: 400 });
    }

    return NextResponse.json({
      event: {
        id: event.id,
        title: event.title,
        description: event.shortDescription || event.description,
        startDate: event.startDate,
        endDate: event.endDate,
        startTime: event.startTime,
        endTime: event.endTime,
        eventType: event.eventType,
        basePrice: event.basePrice,
        maxStalls: event.maxStalls,
        bookedStalls: event.bookedStalls,
        bannerImage: event.bannerImage,
        parkingInfo: event.parkingInfo,
        upiId: event.upiId,
        categoryName: event.category.name,
        venue: event.venue,
        organizerName: event.organizer.name,
        organizerPhone: event.organizer.phone,
        stalls: event.stalls,
        stallCategories: event.stallCategories,
      },
    });
  } catch (error) {
    console.error("Share event fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch event" }, { status: 500 });
  }
}
