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
    if (!eventId) return NextResponse.json({ error: "eventId required" }, { status: 400 });

    const event = await prisma.event.findUnique({ where: { id: eventId }, select: { organizerId: true } });
    if (!event || event.organizerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const bookings = await prisma.booking.findMany({
      where: { eventId },
      include: {
        stall: { select: { stallNumber: true } },
        vendor: { select: { name: true } },
        utilityBillings: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ bookings });
  } catch {
    return NextResponse.json({ error: "Failed to fetch utility bills" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { bookingId, type, units, rate, notes } = await request.json();
    if (!bookingId || !type || units == null || rate == null) {
      return NextResponse.json({ error: "bookingId, type, units and rate are required" }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { event: { select: { organizerId: true } } },
    });
    if (!booking || booking.event.organizerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const amount = parseFloat(units) * parseFloat(rate);
    const bill = await prisma.utilityBilling.create({
      data: {
        bookingId,
        type,
        units: parseFloat(units),
        rate: parseFloat(rate),
        amount,
        notes: notes || null,
      },
    });

    return NextResponse.json({ bill }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create bill" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const billId = searchParams.get("billId");
    if (!billId) return NextResponse.json({ error: "billId required" }, { status: 400 });

    const bill = await prisma.utilityBilling.findUnique({
      where: { id: billId },
      include: { booking: { include: { event: { select: { organizerId: true } } } } },
    });
    if (!bill || bill.booking.event.organizerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.utilityBilling.delete({ where: { id: billId } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete bill" }, { status: 500 });
  }
}
