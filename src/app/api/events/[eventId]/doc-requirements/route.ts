import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest, { params }: { params: { eventId: string } }) {
  try {
    const event = await prisma.event.findUnique({
      where: { id: params.eventId },
      select: { stallCategories: true, eventType: true },
    });
    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

    let config: { requiredDocTypes?: string[] } = {};
    try {
      config = event.stallCategories ? JSON.parse(event.stallCategories) : {};
    } catch {
      config = {};
    }

    // Auto-require FSSAI for food-related event types
    const requiredDocTypes: string[] = config.requiredDocTypes || [];
    const isFoodEvent = ["FOOD_COURT", "FOOD_FESTIVAL"].includes(event.eventType);
    if (isFoodEvent && !requiredDocTypes.includes("FSSAI")) {
      requiredDocTypes.push("FSSAI");
    }

    return NextResponse.json({ requiredDocTypes });
  } catch (error) {
    console.error("Doc requirements GET error:", error);
    return NextResponse.json({ error: "Failed to fetch requirements" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { eventId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "EVENT_MANAGER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const event = await prisma.event.findUnique({
      where: { id: params.eventId },
      select: { organizerId: true, stallCategories: true },
    });
    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });
    if (event.organizerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { requiredDocTypes } = await request.json();

    let existing: Record<string, unknown> = {};
    try {
      existing = event.stallCategories ? JSON.parse(event.stallCategories) : {};
    } catch {
      existing = {};
    }

    const updated = { ...existing, requiredDocTypes: requiredDocTypes || [] };
    await prisma.event.update({
      where: { id: params.eventId },
      data: { stallCategories: JSON.stringify(updated) },
    });

    return NextResponse.json({ requiredDocTypes: updated.requiredDocTypes });
  } catch (error) {
    console.error("Doc requirements PATCH error:", error);
    return NextResponse.json({ error: "Failed to update requirements" }, { status: 500 });
  }
}
