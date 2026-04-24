import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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
    const body = await request.json();
    const { stalls } = body;

    if (!Array.isArray(stalls) || stalls.length === 0) {
      return NextResponse.json({ error: "Stalls array is required" }, { status: 400 });
    }

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const created = await Promise.all(
      stalls.map((stall: {
        stallNumber: string;
        name?: string;
        type: string;
        size: string;
        price: number;
        positionX?: number;
        positionY?: number;
        width?: number;
        height?: number;
        amenities?: string;
      }) =>
        prisma.stall.create({
          data: {
            eventId,
            stallNumber: stall.stallNumber,
            name: stall.name || null,
            type: stall.type || "STANDARD",
            size: stall.size || "6x6",
            price: stall.price || 0,
            positionX: stall.positionX || 0,
            positionY: stall.positionY || 0,
            width: stall.width || 1,
            height: stall.height || 1,
            amenities: stall.amenities || null,
          },
        })
      )
    );

    // Update event maxStalls count
    const totalStalls = await prisma.stall.count({ where: { eventId } });
    await prisma.event.update({
      where: { id: eventId },
      data: { maxStalls: totalStalls },
    });

    return NextResponse.json({ stalls: created }, { status: 201 });
  } catch (error) {
    console.error("Stall creation error:", error);
    return NextResponse.json({ error: "Failed to create stalls" }, { status: 500 });
  }
}

// PATCH: bulk update stall layout (positions, sizes, types, prices)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "EVENT_MANAGER" && session.user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { eventId } = await params;
    const body = await request.json();
    const { stalls } = body as {
      stalls: {
        id: string;
        positionX?: number;
        positionY?: number;
        width?: number;
        height?: number;
        type?: string;
        price?: number;
        stallCategory?: string;
        status?: string;
        name?: string;
      }[];
    };

    if (!Array.isArray(stalls)) return NextResponse.json({ error: "stalls array required" }, { status: 400 });

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event || event.organizerId !== session.user.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    await Promise.all(
      stalls.map((s) =>
        prisma.stall.updateMany({
          where: { id: s.id, eventId },
          data: {
            ...(s.positionX !== undefined && { positionX: s.positionX }),
            ...(s.positionY !== undefined && { positionY: s.positionY }),
            ...(s.width !== undefined && { width: s.width }),
            ...(s.height !== undefined && { height: s.height }),
            ...(s.type !== undefined && { type: s.type }),
            ...(s.price !== undefined && { price: s.price }),
            ...(s.stallCategory !== undefined && { stallCategory: s.stallCategory }),
            ...(s.status !== undefined && { status: s.status }),
            ...(s.name !== undefined && { name: s.name }),
          },
        })
      )
    );

    const updated = await prisma.stall.findMany({ where: { eventId } });
    return NextResponse.json({ stalls: updated });
  } catch (error) {
    console.error("Stall layout update error:", error);
    return NextResponse.json({ error: "Failed to update layout" }, { status: 500 });
  }
}

// DELETE: remove a single stall by stallId query param
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "EVENT_MANAGER" && session.user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { eventId } = await params;
    const { searchParams } = new URL(request.url);
    const stallId = searchParams.get("stallId");
    if (!stallId) return NextResponse.json({ error: "stallId required" }, { status: 400 });

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event || event.organizerId !== session.user.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const stall = await prisma.stall.findUnique({ where: { id: stallId } });
    if (!stall || stall.eventId !== eventId || stall.status !== "AVAILABLE")
      return NextResponse.json({ error: "Cannot delete booked stall" }, { status: 400 });

    await prisma.stall.delete({ where: { id: stallId } });
    await prisma.event.update({ where: { id: eventId }, data: { maxStalls: { decrement: 1 } } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Stall delete error:", error);
    return NextResponse.json({ error: "Failed to delete stall" }, { status: 500 });
  }
}
