import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get("bookingId");

    if (bookingId) {
      const pass = await prisma.gatePass.findUnique({ where: { bookingId } });
      return NextResponse.json({ gatePass: pass });
    }

    // Get all passes for this vendor
    const bookings = await prisma.booking.findMany({
      where: { vendorId: session.user.id },
      select: { id: true },
    });
    const bookingIds = bookings.map((b) => b.id);

    const passes = await prisma.gatePass.findMany({
      where: { bookingId: { in: bookingIds } },
      orderBy: { validFrom: "desc" },
    });

    return NextResponse.json({ gatePasses: passes });
  } catch (error) {
    console.error("Gate pass fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch gate passes" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { bookingId, vehicleNumber, vehicleType } = body;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        event: { include: { venue: true } },
        stall: true,
        vendor: { include: { vendorProfile: true } },
      },
    });

    if (!booking || booking.vendorId !== session.user.id) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Generate QR code string (unique identifier)
    const qrCode = `SM-GP-${booking.bookingNumber}-${Date.now().toString(36)}`;

    const gatePass = await prisma.gatePass.create({
      data: {
        bookingId,
        vendorName: booking.vendor.name,
        businessName: booking.vendor.vendorProfile?.businessName || booking.vendor.company || booking.vendor.name,
        eventTitle: booking.event.title,
        venueName: booking.event.venue.name,
        stallNumber: booking.stall.stallNumber,
        vehicleNumber: vehicleNumber || null,
        vehicleType: vehicleType || null,
        qrCode,
        validFrom: booking.event.startDate,
        validTo: booking.event.endDate,
      },
    });

    return NextResponse.json({ gatePass }, { status: 201 });
  } catch (error) {
    console.error("Gate pass creation error:", error);
    return NextResponse.json({ error: "Failed to create gate pass" }, { status: 500 });
  }
}
