import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/payments - Create Razorpay order
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { bookingId } = body;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { event: { select: { title: true } } },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.vendorId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // In production, create a Razorpay order here:
    // const razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
    // const order = await razorpay.orders.create({ amount: booking.totalAmount * 100, currency: "INR", receipt: booking.bookingNumber });

    // For now, simulate order creation
    const orderId = `order_${Date.now().toString(36)}`;

    await prisma.booking.update({
      where: { id: bookingId },
      data: { paymentOrderId: orderId },
    });

    return NextResponse.json({
      orderId,
      amount: booking.totalAmount * 100, // Razorpay expects amount in paise
      currency: "INR",
      bookingNumber: booking.bookingNumber,
      description: `Stall booking for ${booking.event.title}`,
      // In production, also return:
      // key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Payment order error:", error);
    return NextResponse.json({ error: "Failed to create payment order" }, { status: 500 });
  }
}

// PATCH /api/payments - Verify payment (webhook or client callback)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingId, paymentId, orderId } = body;

    // In production, verify payment signature with Razorpay:
    // const isValid = razorpay.validateWebhookSignature(...)

    const booking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        paymentId,
        paymentOrderId: orderId,
        paymentStatus: "PAID",
        status: "CONFIRMED",
        paidAt: new Date(),
      },
    });

    // Notify vendor
    await prisma.notification.create({
      data: {
        userId: booking.vendorId,
        type: "PAYMENT_CONFIRMED",
        title: "Payment Confirmed",
        message: `Your booking #${booking.bookingNumber} has been confirmed.`,
        link: `/dashboard/vendor/bookings`,
      },
    });

    return NextResponse.json({ booking });
  } catch (error) {
    console.error("Payment verification error:", error);
    return NextResponse.json({ error: "Payment verification failed" }, { status: 500 });
  }
}
