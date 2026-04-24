import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "LISTED";

    const transfers = await prisma.stallTransfer.findMany({
      where: { status },
      include: {
        booking: {
          include: {
            event: { select: { id: true, title: true, startDate: true, endDate: true, venue: { select: { name: true, area: true } } } },
            stall: { select: { stallNumber: true, type: true, size: true, stallCategory: true, price: true } },
            vendor: { select: { name: true, vendorProfile: { select: { businessName: true } } } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ transfers });
  } catch (error) {
    console.error("Stall transfers fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch transfers" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { bookingId, price, reason } = body;

    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking || booking.vendorId !== session.user.id) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.status !== "CONFIRMED") {
      return NextResponse.json({ error: "Only confirmed bookings can be transferred" }, { status: 400 });
    }

    const transfer = await prisma.stallTransfer.create({
      data: {
        bookingId,
        fromVendorId: session.user.id,
        price: parseFloat(price),
        reason: reason || null,
      },
    });

    return NextResponse.json({ transfer }, { status: 201 });
  } catch (error) {
    console.error("Stall transfer creation error:", error);
    return NextResponse.json({ error: "Failed to create transfer" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { transferId, action } = body;

    const transfer = await prisma.stallTransfer.findUnique({ where: { id: transferId } });
    if (!transfer) return NextResponse.json({ error: "Transfer not found" }, { status: 404 });

    if (action === "claim" && transfer.status === "LISTED") {
      const updated = await prisma.stallTransfer.update({
        where: { id: transferId },
        data: { toVendorId: session.user.id, status: "CLAIMED" },
      });
      return NextResponse.json({ transfer: updated });
    }

    if (action === "complete" && transfer.status === "CLAIMED" && transfer.fromVendorId === session.user.id) {
      const updated = await prisma.stallTransfer.update({
        where: { id: transferId },
        data: { status: "COMPLETED" },
      });
      // Update booking vendor
      await prisma.booking.update({
        where: { id: transfer.bookingId },
        data: { vendorId: transfer.toVendorId! },
      });
      return NextResponse.json({ transfer: updated });
    }

    if (action === "cancel" && transfer.fromVendorId === session.user.id) {
      const updated = await prisma.stallTransfer.update({
        where: { id: transferId },
        data: { status: "CANCELLED" },
      });
      return NextResponse.json({ transfer: updated });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Transfer update error:", error);
    return NextResponse.json({ error: "Failed to update transfer" }, { status: 500 });
  }
}
