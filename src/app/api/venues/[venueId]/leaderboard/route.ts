import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: { venueId: string } }
) {
  try {
    const { venueId } = params;

    // Fetch all COMPLETED bookings at this venue, grouped by vendor
    const bookings = await prisma.booking.findMany({
      where: {
        status: "COMPLETED",
        event: { venueId },
      },
      select: {
        vendorId: true,
        event: { select: { id: true } },
      },
    });

    if (bookings.length === 0) {
      return NextResponse.json({ leaderboard: [] });
    }

    // Count completed bookings per vendor
    const completedByVendor: Record<string, number> = {};
    for (const b of bookings) {
      completedByVendor[b.vendorId] = (completedByVendor[b.vendorId] ?? 0) + 1;
    }

    const vendorIds = Object.keys(completedByVendor);

    // Fetch vendor profiles
    const profiles = await prisma.vendorProfile.findMany({
      where: { userId: { in: vendorIds } },
      select: {
        userId: true,
        businessName: true,
        category: true,
        logo: true,
        trustScore: true,
        stallPhotos: true,
      },
    });

    // Fetch avg ratings per vendor
    const reviews = await prisma.review.findMany({
      where: { targetId: { in: vendorIds }, reviewType: "VENDOR_REVIEW" },
      select: { targetId: true, rating: true },
    });

    const ratingMap: Record<string, { sum: number; count: number }> = {};
    for (const r of reviews) {
      if (!ratingMap[r.targetId]) ratingMap[r.targetId] = { sum: 0, count: 0 };
      ratingMap[r.targetId].sum += r.rating;
      ratingMap[r.targetId].count += 1;
    }

    // Build scored list
    const profileMap = Object.fromEntries(profiles.map((p) => [p.userId, p]));

    const scored = vendorIds
      .map((vendorId) => {
        const profile = profileMap[vendorId];
        if (!profile) return null;
        const completed = completedByVendor[vendorId];
        const ratingData = ratingMap[vendorId];
        const avgRating = ratingData ? ratingData.sum / ratingData.count : 0;
        const trustScore = profile.trustScore ?? 0;
        const stallPhotoCount = profile.stallPhotos
          ? (JSON.parse(profile.stallPhotos) as string[]).length
          : 0;
        // Composite score: 50% completions (capped at 20), 30% rating, 20% trustScore
        const completionNorm = Math.min(completed / 20, 1) * 50;
        const ratingNorm = (avgRating / 5) * 30;
        const trustNorm = (trustScore / 100) * 20;
        const score = completionNorm + ratingNorm + trustNorm;
        return { vendorId, businessName: profile.businessName, category: profile.category, logo: profile.logo, completedEvents: completed, avgRating: parseFloat(avgRating.toFixed(1)), trustScore, stallPhotoCount, score };
      })
      .filter(Boolean)
      .sort((a, b) => b!.score - a!.score)
      .slice(0, 10);

    const leaderboard = scored.map((v, i) => ({ rank: i + 1, ...v, score: undefined }));

    return NextResponse.json({ leaderboard });
  } catch (err) {
    console.error("Leaderboard error:", err);
    return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
  }
}
