import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateBookingNumber, generateUpiLink } from "@/lib/utils";
import crypto from "crypto";

// POST /api/quick-book — No-auth booking for WhatsApp flow
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventId, stallId, name, phone, businessName, stallCategory, notes } = body;

    if (!eventId || !stallId || !name || !phone) {
      return NextResponse.json(
        { error: "Event, stall, name, and phone are required" },
        { status: 400 }
      );
    }

    // Validate phone (basic Indian mobile check)
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
    }

    // Check stall availability
    const stall = await prisma.stall.findUnique({
      where: { id: stallId },
      include: { event: true },
    });

    if (!stall || stall.status !== "AVAILABLE") {
      return NextResponse.json({ error: "Stall is not available" }, { status: 400 });
    }

    if (stall.eventId !== eventId) {
      return NextResponse.json({ error: "Stall does not belong to this event" }, { status: 400 });
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        venue: { select: { name: true, city: true } },
        organizer: { select: { name: true, phone: true } },
      },
    });

    if (!event || event.status !== "PUBLISHED") {
      return NextResponse.json({ error: "Event is not available" }, { status: 400 });
    }

    // Find or create user by phone
    const normalizedPhone = cleanPhone.length === 10 ? `+91${cleanPhone}` : `+${cleanPhone}`;
    let user = await prisma.user.findFirst({
      where: { phone: normalizedPhone },
    });

    if (!user) {
      // Create a minimal vendor user
      const tempEmail = `wa_${cleanPhone}@stallmate.local`;
      const randomPass = crypto.randomBytes(16).toString("hex");

      user = await prisma.user.create({
        data: {
          name: name.trim(),
          email: tempEmail,
          phone: normalizedPhone,
          password: randomPass,
          role: "VENDOR",
          company: businessName?.trim() || null,
        },
      });

      // Create vendor profile
      await prisma.vendorProfile.create({
        data: {
          userId: user.id,
          businessName: businessName?.trim() || name.trim(),
          category: stallCategory || "Other",
        },
      });
    }

    // Calculate amounts
    const amount = stall.price;
    const tax = Math.round(amount * 0.18);
    const totalAmount = amount + tax;

    const bookingNumber = generateBookingNumber();

    // Create booking in transaction
    const booking = await prisma.$transaction(async (tx) => {
      const newBooking = await tx.booking.create({
        data: {
          bookingNumber,
          eventId,
          stallId,
          vendorId: user!.id,
          stallCategory: stallCategory || stall.stallCategory || null,
          amount,
          tax,
          amenityCharges: 0,
          totalAmount,
          notes: notes || null,
          status: "PENDING",
          paymentStatus: "PENDING",
        },
      });

      // Mark stall as reserved (not booked until paid)
      await tx.stall.update({
        where: { id: stallId },
        data: { status: "RESERVED" },
      });

      // Notify organizer
      await tx.notification.create({
        data: {
          userId: event!.organizerId,
          type: "BOOKING_RECEIVED",
          title: "New WhatsApp Booking",
          message: `${name} booked stall #${stall.stallNumber} for ${event!.title} via WhatsApp link`,
          link: `/dashboard/manager`,
        },
      });

      return newBooking;
    });

    // Generate UPI link if organizer has UPI ID
    let upiLink = null;
    if (event.upiId) {
      upiLink = generateUpiLink({
        upiId: event.upiId,
        payeeName: event.organizer.name,
        amount: totalAmount,
        transactionNote: `StallMate ${bookingNumber}`,
      });
    }

    // Build WhatsApp confirmation message
    const confirmMsg = [
      `Booking Confirmed! ${bookingNumber}`,
      ``,
      `Event: ${event.title}`,
      `Venue: ${event.venue.name}, ${event.venue.city}`,
      `Date: ${new Date(event.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`,
      `Time: ${event.startTime} - ${event.endTime}`,
      `Stall: #${stall.stallNumber} (${stall.type})`,
      ``,
      `Amount: Rs ${totalAmount}`,
      upiLink ? `\nPay here: ${upiLink}` : "",
      ``,
      `Contact organizer: ${event.organizer.phone || ""}`,
    ]
      .filter(Boolean)
      .join("\n");

    const whatsappLink = `https://wa.me/${normalizedPhone.replace("+", "")}?text=${encodeURIComponent(confirmMsg)}`;

    return NextResponse.json(
      {
        booking: {
          id: booking.id,
          bookingNumber,
          stallNumber: stall.stallNumber,
          stallType: stall.type,
          amount,
          tax,
          totalAmount,
          status: "PENDING",
        },
        upiLink,
        whatsappLink,
        organizerPhone: event.organizer.phone,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Quick book error:", error);
    return NextResponse.json({ error: "Booking failed" }, { status: 500 });
  }
}
