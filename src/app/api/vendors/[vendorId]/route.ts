import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Compute trust score (0-100) from multiple signals
function computeTrustScore({
  completedEvents,
  avgRating,
  repeatBookingPct,
  hasFssai,
  verifiedDocsCount,
  experienceYears,
  photoCount,
}: {
  completedEvents: number;
  avgRating: number;
  repeatBookingPct: number;
  hasFssai: boolean;
  verifiedDocsCount: number;
  experienceYears: number;
  photoCount: number;
}): number {
  let score = 0;

  // Events completed (max 25 pts) — 2.5 pts per event, capped at 10
  score += Math.min(completedEvents * 2.5, 25);

  // Rating (max 25 pts) — scale 0-5 mapped to 0-25
  score += (avgRating / 5) * 25;

  // Repeat booking rate (max 15 pts)
  score += (repeatBookingPct / 100) * 15;

  // FSSAI verified (10 pts)
  if (hasFssai) score += 10;

  // Verified documents (max 10 pts) — 2.5 pts each, up to 4 docs
  score += Math.min(verifiedDocsCount * 2.5, 10);

  // Experience years (max 10 pts) — 2 pts per year, capped at 5 years
  score += Math.min(experienceYears * 2, 10);

  // Stall photos (max 5 pts) — 1 pt per photo, up to 5
  score += Math.min(photoCount, 5);

  return Math.round(Math.min(score, 100));
}

export async function GET(
  request: NextRequest,
  { params }: { params: { vendorId: string } }
) {
  try {
    const profile = await prisma.vendorProfile.findUnique({
      where: { id: params.vendorId },
      include: {
        user: {
          select: { id: true, name: true, avatar: true, phone: true, company: true, createdAt: true },
        },
        documents: {
          select: { id: true, type: true, isVerified: true, expiresAt: true },
        },
      },
    });

    if (!profile) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    // Get all completed bookings with event details for history
    const completedBookings = await prisma.booking.findMany({
      where: { vendorId: profile.userId, status: "COMPLETED" },
      select: {
        id: true,
        createdAt: true,
        stallCategory: true,
        event: {
          select: {
            id: true,
            title: true,
            startDate: true,
            endDate: true,
            eventType: true,
            organizerId: true,
            venue: { select: { id: true, name: true, city: true, area: true } },
            category: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const completedEvents = completedBookings.length;

    // Repeat bookings: organizers who booked this vendor more than once
    const organizerCounts: Record<string, number> = {};
    for (const b of completedBookings) {
      const orgId = b.event.organizerId;
      organizerCounts[orgId] = (organizerCounts[orgId] || 0) + 1;
    }
    const repeatBookings = Object.values(organizerCounts).filter((c) => c > 1).length;
    const totalOrganizers = Object.keys(organizerCounts).length;
    const repeatBookingPct = totalOrganizers > 0 ? Math.round((repeatBookings / totalOrganizers) * 100) : 0;

    // Reviews with details
    const reviews = await prisma.review.findMany({
      where: { targetId: profile.userId },
      include: {
        author: { select: { name: true, avatar: true } },
        event: { select: { title: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : profile.rating;

    // Document stats
    const verifiedDocsCount = profile.documents.filter((d) => d.isVerified).length;
    const totalDocs = profile.documents.length;

    // Photo count
    const photos: string[] = profile.stallPhotos ? JSON.parse(profile.stallPhotos) : [];

    // Compute trust score
    const trustScore = computeTrustScore({
      completedEvents,
      avgRating,
      repeatBookingPct,
      hasFssai: !!profile.fssaiNumber && profile.fssaiVerified,
      verifiedDocsCount,
      experienceYears: profile.experience,
      photoCount: photos.length,
    });

    // Trusted status: score >= 70 OR (10+ events and 4.0+ rating)
    const shouldBeTrusted = trustScore >= 70 || (completedEvents >= 10 && avgRating >= 4.0);

    // Update cached fields if changed
    if (
      profile.totalEvents !== completedEvents ||
      Math.abs(profile.rating - avgRating) > 0.01 ||
      profile.isTrusted !== shouldBeTrusted ||
      Math.abs(profile.trustScore - trustScore) > 0.5
    ) {
      await prisma.vendorProfile.update({
        where: { id: profile.id },
        data: {
          totalEvents: completedEvents,
          rating: Math.round(avgRating * 10) / 10,
          isTrusted: shouldBeTrusted,
          trustScore,
        },
      });
    }

    // Build event history
    const eventHistory = completedBookings.map((b) => ({
      eventId: b.event.id,
      eventTitle: b.event.title,
      startDate: b.event.startDate,
      endDate: b.event.endDate,
      eventType: b.event.eventType,
      venueName: b.event.venue.name,
      venueCity: b.event.venue.city,
      venueArea: b.event.venue.area,
      categoryName: b.event.category.name,
      stallCategory: b.stallCategory,
    }));

    // Unique venues served
    const uniqueVenues = new Set(completedBookings.map((b) => b.event.venue.id));

    return NextResponse.json({
      vendor: {
        id: profile.id,
        userId: profile.userId,
        businessName: profile.businessName,
        category: profile.category,
        description: profile.description,
        logo: profile.logo,
        experience: profile.experience,
        stallPhotos: profile.stallPhotos,
        socialLinks: profile.socialLinks,
        fssaiNumber: profile.fssaiNumber,
        fssaiVerified: profile.fssaiVerified,
        udyamNumber: profile.udyamNumber,
        // Trust metrics
        totalEvents: completedEvents,
        rating: Math.round(avgRating * 10) / 10,
        isTrusted: shouldBeTrusted,
        trustScore,
        repeatBookings,
        repeatBookingPct,
        uniqueVenues: uniqueVenues.size,
        // Document stats
        verifiedDocsCount,
        totalDocs,
        documents: profile.documents.map((d) => ({
          type: d.type,
          isVerified: d.isVerified,
          expiresAt: d.expiresAt,
        })),
        // User info
        user: profile.user,
        // Event history
        eventHistory,
        // Reviews
        reviews: reviews.map((r) => ({
          id: r.id,
          rating: r.rating,
          title: r.title,
          comment: r.comment,
          authorName: r.author.name,
          authorAvatar: r.author.avatar,
          eventTitle: r.event.title,
          createdAt: r.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error("Vendor fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch vendor" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { vendorId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await prisma.vendorProfile.findUnique({
      where: { id: params.vendorId },
    });

    if (!profile || profile.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      businessName, category, description, phone, logo,
      stallPhotos, fssaiNumber, socialLinks, experience, udyamNumber,
    } = body;

    const updateData: Record<string, unknown> = {};
    if (businessName !== undefined) updateData.businessName = businessName;
    if (category !== undefined) updateData.category = category;
    if (description !== undefined) updateData.description = description;
    if (logo !== undefined) updateData.logo = logo;
    if (stallPhotos !== undefined) updateData.stallPhotos = typeof stallPhotos === "string" ? stallPhotos : JSON.stringify(stallPhotos);
    if (fssaiNumber !== undefined) updateData.fssaiNumber = fssaiNumber;
    if (socialLinks !== undefined) updateData.socialLinks = typeof socialLinks === "string" ? socialLinks : JSON.stringify(socialLinks);
    if (experience !== undefined) updateData.experience = parseInt(experience) || 0;
    if (udyamNumber !== undefined) updateData.udyamNumber = udyamNumber;

    const updated = await prisma.vendorProfile.update({
      where: { id: params.vendorId },
      data: updateData,
    });

    // Update phone on User if provided
    if (phone !== undefined) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { phone },
      });
    }

    return NextResponse.json({ vendor: updated });
  } catch (error) {
    console.error("Vendor update error:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
