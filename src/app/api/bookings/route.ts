import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateBookingNumber } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "";

    const where: Record<string, unknown> = {};

    if (session.user.role === "VENDOR") {
      where.vendorId = session.user.id;
    } else if (session.user.role === "EVENT_MANAGER") {
      where.event = { organizerId: session.user.id };
    }

    if (status) {
      where.status = status;
    }

    const bookings = await prisma.booking.findMany({
      where: where as never,
      include: {
        event: {
          select: { id: true, title: true, startDate: true, endDate: true, startTime: true, endTime: true, venue: { select: { name: true, city: true } }, organizer: { select: { id: true, name: true } } },
        },
        stall: { select: { stallNumber: true, type: true, size: true, stallCategory: true } },
        vendor: { select: { id: true, name: true, email: true, phone: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ bookings });
  } catch (error) {
    console.error("Bookings fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { eventId, stallId, stallCategory, amount, tax, totalAmount, notes, paymentMode = "UPFRONT" } = body;

    if (!eventId || !stallId) {
      return NextResponse.json({ error: "Event and stall are required" }, { status: 400 });
    }

    // Check stall availability
    const stall = await prisma.stall.findUnique({ where: { id: stallId } });
    if (!stall || stall.status !== "AVAILABLE") {
      return NextResponse.json({ error: "Stall is not available" }, { status: 400 });
    }

    // Document verification gate: if stall category is FOOD, require verified FSSAI
    const bookedCategory = (stallCategory || stall.stallCategory || "").toUpperCase();
    if (bookedCategory === "FOOD" || bookedCategory === "FOOD_COURT") {
      const vendorProfile = await prisma.vendorProfile.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      });
      if (vendorProfile) {
        const verifiedDoc = await prisma.vendorDocument.findFirst({
          where: { vendorId: vendorProfile.id, type: "FSSAI", isVerified: true },
        });
        if (!verifiedDoc) {
          return NextResponse.json(
            { error: "Document verification required. Please upload and get your FSSAI certificate verified before booking a food stall." },
            { status: 400 }
          );
        }
      }
    }

    // BNPL eligibility gate: vendor must have at least 1 prior CONFIRMED booking
    if (paymentMode === "BNPL") {
      const priorConfirmedCount = await prisma.booking.count({
        where: { vendorId: session.user.id, status: "CONFIRMED" },
      });
      if (priorConfirmedCount < 1) {
        return NextResponse.json(
          { error: "BNPL is only available to vendors with at least one confirmed booking. Complete your first booking to unlock Pay After Event." },
          { status: 400 }
        );
      }
    }

    const bookingNumber = generateBookingNumber();

    // Fetch event for BNPL due date calculation (endDate + 3 days)
    const eventForBnpl = paymentMode === "BNPL"
      ? await prisma.event.findUnique({ where: { id: eventId }, select: { endDate: true } })
      : null;

    // Create booking and update stall status in a transaction
    const booking = await prisma.$transaction(async (tx) => {
      const newBooking = await tx.booking.create({
        data: {
          bookingNumber,
          eventId,
          stallId,
          vendorId: session.user.id,
          stallCategory: stallCategory || stall.stallCategory || null,
          amount: amount || 0,
          tax: tax || 0,
          amenityCharges: 0,
          totalAmount: totalAmount || 0,
          notes: notes || null,
          status: "PENDING",
          paymentStatus: "PENDING",
          paymentMode,
        },
      });

      // Mark stall as booked
      await tx.stall.update({
        where: { id: stallId },
        data: { status: "BOOKED" },
      });

      // Increment event booked stalls count
      await tx.event.update({
        where: { id: eventId },
        data: { bookedStalls: { increment: 1 } },
      });

      // Create notification for event organizer
      const event = await tx.event.findUnique({
        where: { id: eventId },
        select: { organizerId: true, title: true },
      });

      if (event) {
        await tx.notification.create({
          data: {
            userId: event.organizerId,
            type: "BOOKING_RECEIVED",
            title: "New Booking",
            message: `${session.user.name} booked stall #${stall.stallNumber} for ${event.title}`,
            link: `/dashboard/manager`,
          },
        });
      }

      return newBooking;
    });

    // After transaction: create BNPLAgreement if paymentMode is BNPL
    let bnplAgreement = null;
    if (paymentMode === "BNPL" && eventForBnpl) {
      const dueDate = new Date(eventForBnpl.endDate);
      dueDate.setDate(dueDate.getDate() + 3);
      bnplAgreement = await prisma.bNPLAgreement.create({
        data: {
          bookingId: booking.id,
          vendorId: session.user.id,
          amount: booking.totalAmount,
          dueDate,
          status: "PENDING",
        },
      });
    }

    return NextResponse.json({ booking, bnplAgreement }, { status: 201 });
  } catch (error) {
    console.error("Booking creation error:", error);
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
  }
}
