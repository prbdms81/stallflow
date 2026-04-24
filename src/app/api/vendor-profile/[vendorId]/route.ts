import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeVendorScore } from "@/lib/vendor-score";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ vendorId: string }> }
) {
  try {
    const { vendorId } = await params;

    const user = await prisma.user.findUnique({
      where: { id: vendorId },
      select: {
        id: true,
        name: true,
        bio: true,
        avatar: true,
        phone: true,
        role: true,
        vendorProfile: {
          select: {
            businessName: true,
            category: true,
            description: true,
            logo: true,
            trustScore: true,
            documents: { select: { isVerified: true } },
          },
        },
      },
    });

    if (!user || user.role !== "VENDOR") {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    const [bookings, reviews, pastEventBookings] = await Promise.all([
      prisma.booking.findMany({
        where: { vendorId },
        select: { status: true, paymentStatus: true },
      }),
      prisma.review.findMany({
        where: { targetId: vendorId, reviewType: "VENDOR_REVIEW" },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
          author: { select: { name: true } },
        },
      }),
      prisma.booking.findMany({
        where: { vendorId, status: "COMPLETED" },
        orderBy: { createdAt: "desc" },
        take: 3,
        select: {
          event: { select: { title: true, startDate: true } },
        },
      }),
    ]);

    const totalBookings = bookings.length;
    const paidBookings = bookings.filter((b) => b.paymentStatus === "PAID").length;
    const completedBookings = bookings.filter((b) => b.status === "COMPLETED").length;
    const cancelledBookings = bookings.filter((b) => b.status === "CANCELLED").length;
    const confirmedBookings = bookings.filter((b) => b.status === "CONFIRMED").length;

    const allReviewsForRating = await prisma.review.findMany({
      where: { targetId: vendorId, reviewType: "VENDOR_REVIEW" },
      select: { rating: true },
    });
    const avgRating =
      allReviewsForRating.length > 0
        ? allReviewsForRating.reduce((s, r) => s + r.rating, 0) / allReviewsForRating.length
        : 0;

    const verifiedDocs = user.vendorProfile?.documents.filter((d) => d.isVerified).length ?? 0;
    const totalDocs = user.vendorProfile?.documents.length ?? 0;

    const scoreBreakdown = computeVendorScore({
      totalBookings,
      paidBookings,
      completedBookings,
      cancelledBookings,
      avgRating,
      reviewCount: allReviewsForRating.length,
      verifiedDocs,
      totalDocs,
    });

    // Derive city from user bio or leave empty — schema has no city on User directly
    const profile = {
      id: user.id,
      name: user.vendorProfile?.businessName || user.name,
      bio: user.vendorProfile?.description || user.bio || null,
      profileImage: user.vendorProfile?.logo || user.avatar || null,
      category: user.vendorProfile?.category || null,
      phone: user.phone || null,
    };

    const formattedReviews = reviews.map((r) => ({
      id: r.id,
      reviewerName: r.author.name,
      rating: r.rating,
      comment: r.comment || null,
      createdAt: r.createdAt,
    }));

    const pastEvents = pastEventBookings.map((b) => ({
      title: b.event.title,
      startDate: b.event.startDate,
    }));

    return NextResponse.json({
      profile,
      vendorScore: scoreBreakdown.total,
      tier: scoreBreakdown.tier,
      avgRating: Math.round(avgRating * 10) / 10,
      totalReviews: allReviewsForRating.length,
      totalBookings: confirmedBookings,
      reviews: formattedReviews,
      pastEvents,
    });
  } catch (err) {
    console.error("[vendor-profile] error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
