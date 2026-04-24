import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: { venueId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { venueId } = params;

  const events = await prisma.event.findMany({
    where: {
      venueId,
      endDate: { lt: new Date() },
    },
    orderBy: { endDate: "desc" },
    select: {
      id: true,
      title: true,
      startDate: true,
      endDate: true,
      startTime: true,
      endTime: true,
      eventType: true,
      maxStalls: true,
      bookedStalls: true,
      stallCategories: true,
      lastEventInfo: true,
      organizerId: true,
      organizer: { select: { name: true, company: true } },
      bookings: {
        select: { stallCategory: true },
        where: { status: { in: ["CONFIRMED", "COMPLETED"] } },
      },
      reviews: {
        select: { rating: true, comment: true, title: true, reviewType: true },
      },
    },
  });

  const pastEvents = events.map((e) => {
    // Distinct categories from actual bookings
    const bookingCategories = Array.from(
      new Set(e.bookings.map((b) => b.stallCategory).filter(Boolean))
    ) as string[];

    // Also parse stallCategories JSON field from the event itself
    let eventCategories: string[] = [];
    if (e.stallCategories) {
      try { eventCategories = JSON.parse(e.stallCategories); } catch { /* noop */ }
    }
    const allCategories = Array.from(new Set([...eventCategories, ...bookingCategories]));

    // Reviews summary
    const eventReviews = e.reviews.filter((r) => r.reviewType === "EVENT_REVIEW");
    const avgRating =
      eventReviews.length > 0
        ? Math.round((eventReviews.reduce((s, r) => s + r.rating, 0) / eventReviews.length) * 10) / 10
        : null;

    const feedbackComments = e.reviews
      .filter((r) => r.comment)
      .map((r) => r.comment as string)
      .slice(0, 3);

    return {
      id: e.id,
      title: e.title,
      startDate: e.startDate,
      endDate: e.endDate,
      startTime: e.startTime,
      endTime: e.endTime,
      eventType: e.eventType,
      maxStalls: e.maxStalls,
      bookedStalls: e.bookedStalls,
      categories: allCategories,
      lastEventInfo: e.lastEventInfo,
      organizer: {
        name: e.organizer.name,
        company: e.organizer.company,
      },
      reviewCount: e.reviews.length,
      avgRating,
      feedbackComments,
    };
  });

  return NextResponse.json({ pastEvents });
}
