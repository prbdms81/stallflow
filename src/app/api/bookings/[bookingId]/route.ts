import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { bookingId } = await params;
    const body = await request.json();
    const { status, paymentStatus, paymentId } = body;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { event: { select: { organizerId: true } } },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Only vendor who made the booking or event organizer can update
    if (booking.vendorId !== session.user.id && booking.event.organizerId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const updateData: Record<string, unknown> = {};
    if (status) updateData.status = status;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;
    if (paymentId) updateData.paymentId = paymentId;
    if (paymentStatus === "PAID") updateData.paidAt = new Date();

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: updateData,
    });

    // If cancelled, release the stall
    if (status === "CANCELLED") {
      await prisma.stall.update({
        where: { id: booking.stallId },
        data: { status: "AVAILABLE" },
      });

      await prisma.event.update({
        where: { id: booking.eventId },
        data: { bookedStalls: { decrement: 1 } },
      });
    }

    return NextResponse.json({ booking: updated });
  } catch (error) {
    console.error("Booking update error:", error);
    return NextResponse.json({ error: "Failed to update booking" }, { status: 500 });
  }
}
