import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { computeVendorScore } from "@/lib/vendor-score";
export type { ScoreBreakdown } from "@/lib/vendor-score";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const { searchParams } = new URL(request.url);
  const targetUserId = searchParams.get("userId") || session?.user?.id;

  if (!targetUserId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const [bookings, reviews, profile] = await Promise.all([
    prisma.booking.findMany({
      where: { vendorId: targetUserId },
      select: { status: true, paymentStatus: true },
    }),
    prisma.review.findMany({
      where: { targetId: targetUserId, reviewType: "VENDOR_REVIEW" },
      select: { rating: true },
    }),
    prisma.vendorProfile.findUnique({
      where: { userId: targetUserId },
      include: { documents: { select: { isVerified: true } } },
    }),
  ]);

  const totalBookings = bookings.length;
  const paidBookings = bookings.filter((b) => b.paymentStatus === "PAID").length;
  const completedBookings = bookings.filter((b) => b.status === "COMPLETED").length;
  const cancelledBookings = bookings.filter((b) => b.status === "CANCELLED").length;
  const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const verifiedDocs = profile?.documents.filter((d) => d.isVerified).length ?? 0;
  const totalDocs = profile?.documents.length ?? 0;

  const breakdown = computeVendorScore({
    totalBookings, paidBookings, completedBookings, cancelledBookings,
    avgRating, reviewCount: reviews.length, verifiedDocs, totalDocs,
  });

  // Cache score on vendorProfile
  if (profile && Math.abs(profile.trustScore - breakdown.total) > 1) {
    await prisma.vendorProfile.update({
      where: { userId: targetUserId },
      data: { trustScore: breakdown.total },
    });
  }

  return NextResponse.json({ score: breakdown });
}
