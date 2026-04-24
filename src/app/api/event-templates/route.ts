import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "EVENT_MANAGER" && session.user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const templates = await prisma.eventTemplate.findMany({
      where: { managerId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ templates });
  } catch (error) {
    console.error("Templates fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "EVENT_MANAGER" && session.user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, eventId } = await request.json();
    if (!name || !eventId) {
      return NextResponse.json({ error: "name and eventId are required" }, { status: 400 });
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { stalls: true },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    if (event.organizerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const templateData = JSON.stringify({
      title: event.title,
      description: event.description,
      shortDescription: event.shortDescription,
      categoryId: event.categoryId,
      venueId: event.venueId,
      startTime: event.startTime,
      endTime: event.endTime,
      eventType: event.eventType,
      basePrice: event.basePrice,
      cancellationPolicy: event.cancellationPolicy,
      parkingInfo: event.parkingInfo,
      terms: event.terms,
      stallCategories: event.stallCategories,
      stalls: event.stalls.map((s) => ({
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
      })),
    });

    const template = await prisma.eventTemplate.create({
      data: {
        name,
        managerId: session.user.id,
        templateData,
      },
    });

    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    console.error("Template create error:", error);
    return NextResponse.json({ error: "Failed to create template" }, { status: 500 });
  }
}
