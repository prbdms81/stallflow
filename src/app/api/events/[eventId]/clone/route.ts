import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { slugify } from "@/lib/utils";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "EVENT_MANAGER" && session.user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { eventId } = await params;

    const source = await prisma.event.findUnique({
      where: { id: eventId },
      include: { stalls: true },
    });

    if (!source) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    if (source.organizerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { title, startDate, endDate } = body;

    if (!title || !startDate || !endDate) {
      return NextResponse.json({ error: "title, startDate and endDate are required" }, { status: 400 });
    }

    const slug = slugify(title) + "-" + Date.now().toString(36);

    const event = await prisma.event.create({
      data: {
        title,
        slug,
        description: source.description,
        shortDescription: source.shortDescription,
        categoryId: source.categoryId,
        venueId: source.venueId,
        organizerId: session.user.id,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        startTime: source.startTime,
        endTime: source.endTime,
        eventType: source.eventType,
        status: "DRAFT",
        basePrice: source.basePrice,
        cancellationPolicy: source.cancellationPolicy,
        parkingInfo: source.parkingInfo,
        terms: source.terms,
        stallCategories: source.stallCategories,
        maxStalls: source.stalls.length,
      },
    });

    if (source.stalls.length > 0) {
      await prisma.stall.createMany({
        data: source.stalls.map((s) => ({
          eventId: event.id,
          stallNumber: s.stallNumber,
          name: s.name,
          type: s.type,
          size: s.size,
          price: s.price,
          positionX: s.positionX,
          positionY: s.positionY,
          width: s.width,
          height: s.height,
          stallCategory: s.stallCategory,
          amenities: s.amenities,
          notes: s.notes,
          status: "AVAILABLE",
        })),
      });
    }

    return NextResponse.json({ id: event.id, event }, { status: 201 });
  } catch (error) {
    console.error("Event clone error:", error);
    return NextResponse.json({ error: "Failed to clone event" }, { status: 500 });
  }
}
