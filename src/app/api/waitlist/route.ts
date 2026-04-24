import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");

    // Manager viewing waitlist for their event
    if (eventId && session.user.role === "EVENT_MANAGER") {
      const event = await prisma.event.findUnique({ where: { id: eventId }, select: { organizerId: true } });
      if (!event || event.organizerId !== session.user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const entries = await prisma.waitlistEntry.findMany({
        where: { eventId },
        include: { vendor: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "asc" },
      });
      return NextResponse.json({ entries });
    }

    // Vendor viewing their own waitlist
    const entries = await prisma.waitlistEntry.findMany({
      where: { vendorId: session.user.id },
      include: { event: { select: { id: true, title: true, startDate: true, maxStalls: true, bookedStalls: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ entries });
  } catch (error) {
    console.error("Waitlist GET error:", error);
    return NextResponse.json({ error: "Failed to fetch waitlist" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "VENDOR") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { eventId, category } = await request.json();
    if (!eventId) return NextResponse.json({ error: "eventId required" }, { status: 400 });

    const event = await prisma.event.findUnique({ where: { id: eventId }, select: { maxStalls: true, bookedStalls: true } });
    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

    if (event.bookedStalls < event.maxStalls) {
      return NextResponse.json({ error: "Event still has available stalls" }, { status: 400 });
    }

    const existing = await prisma.waitlistEntry.findUnique({
      where: { eventId_vendorId: { eventId, vendorId: session.user.id } },
    });
    if (existing) return NextResponse.json({ error: "Already on waitlist" }, { status: 409 });

    const entry = await prisma.waitlistEntry.create({
      data: { eventId, vendorId: session.user.id, category: category || null },
    });
    return NextResponse.json({ entry }, { status: 201 });
  } catch (error) {
    console.error("Waitlist POST error:", error);
    return NextResponse.json({ error: "Failed to join waitlist" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");
    if (!eventId) return NextResponse.json({ error: "eventId required" }, { status: 400 });

    await prisma.waitlistEntry.delete({
      where: { eventId_vendorId: { eventId, vendorId: session.user.id } },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Waitlist DELETE error:", error);
    return NextResponse.json({ error: "Failed to leave waitlist" }, { status: 500 });
  }
}
