import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { eventId } = await params;

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { organizerId: true, title: true },
  });

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  if (event.organizerId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const bookings = await prisma.booking.findMany({
    where: { eventId },
    include: {
      vendor: { select: { name: true, email: true } },
      stall: { select: { stallNumber: true } },
      utilityBillings: { select: { amount: true } },
    },
  });

  const paidBookings = bookings.filter((b) => b.paymentStatus === "PAID");
  const cancelledPaidBookings = bookings.filter(
    (b) => b.status === "CANCELLED" && b.paymentStatus === "PAID"
  );

  const totalStallRevenue = paidBookings.reduce((sum, b) => sum + b.totalAmount, 0);
  const platformFee = totalStallRevenue * 0.05;
  const refunds = cancelledPaidBookings.reduce((sum, b) => sum + b.totalAmount, 0);

  const sponsors = await prisma.eventSponsor.findMany({
    where: { eventId, paymentStatus: "PAID" },
    select: { amount: true },
  });
  const sponsorRevenue = sponsors.reduce((sum, s) => sum + s.amount, 0);

  const allUtilityCharges = bookings.flatMap((b) => b.utilityBillings);
  const utilityRevenue = allUtilityCharges.reduce((sum, u) => sum + u.amount, 0);

  const netToOrganizer = totalStallRevenue - platformFee - refunds + sponsorRevenue + utilityRevenue;

  const breakdown = bookings.map((b) => ({
    bookingId: b.id,
    bookingNumber: b.bookingNumber,
    vendorName: b.vendor.name,
    vendorEmail: b.vendor.email,
    stallNumber: b.stall.stallNumber,
    stallCategory: b.stallCategory || "—",
    amountPaid: b.paymentStatus === "PAID" ? b.totalAmount : 0,
    utilityCharges: b.utilityBillings.reduce((sum, u) => sum + u.amount, 0),
    paymentStatus: b.paymentStatus,
    bookingStatus: b.status,
  }));

  return NextResponse.json({
    totalStallRevenue,
    platformFee,
    sponsorRevenue,
    utilityRevenue,
    refunds,
    netToOrganizer,
    breakdown,
    eventTitle: event.title,
  });
}
