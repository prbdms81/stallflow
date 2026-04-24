import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "VENDOR") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const vendorId = session.user.id;
    const { searchParams } = new URL(request.url);
    const cityFilter = searchParams.get("city") || "";
    const categoryFilter = searchParams.get("category") || "";

    // Determine vendor's preferred city from most recent booking's venue
    const lastBooking = await prisma.booking.findFirst({
      where: { vendorId },
      orderBy: { createdAt: "desc" },
      include: {
        event: {
          include: { venue: { select: { city: true } } },
        },
      },
    });

    const vendorCity = lastBooking?.event?.venue?.city ?? null;

    // Determine vendor's stall categories from past bookings
    const pastBookings = await prisma.booking.findMany({
      where: { vendorId, stallCategory: { not: null } },
      select: { stallCategory: true },
      distinct: ["stallCategory"],
    });
    const vendorCategories = pastBookings
      .map((b) => b.stallCategory)
      .filter(Boolean) as string[];

    // Build event filter
    const eventWhere: Record<string, unknown> = {
      status: "PUBLISHED",
      startDate: { gte: new Date() },
    };

    if (cityFilter) {
      eventWhere.venue = { city: { contains: cityFilter } };
    }

    // Fetch PUBLISHED future events with stalls and bookings
    const events = await prisma.event.findMany({
      where: eventWhere as never,
      include: {
        venue: { select: { name: true, city: true } },
        stalls: {
          select: { status: true, price: true, stallCategory: true },
        },
        bookings: {
          where: { vendorId },
          select: { id: true },
        },
      },
      orderBy: { startDate: "asc" },
    });

    // Shape and score each event
    type DiscoverEvent = {
      id: string;
      title: string;
      startDate: Date;
      endDate: Date;
      venueName: string;
      venueCity: string;
      availableStalls: number;
      minPrice: number | null;
      categories: string[];
      alreadyApplied: boolean;
      _score: number;
    };

    const shaped: DiscoverEvent[] = events.map((ev) => {
      const availableStalls = ev.stalls.filter(
        (s) => s.status === "AVAILABLE"
      ).length;

      const prices = ev.stalls.map((s) => s.price);
      const minPrice = prices.length > 0 ? Math.min(...prices) : null;

      const categories = Array.from(
        new Set(ev.stalls.map((s) => s.stallCategory).filter(Boolean))
      ) as string[];

      const alreadyApplied = ev.bookings.length > 0;

      // Relevance score: same city = +10, matching vendor category = +5 per match
      let score = 0;
      if (vendorCity && ev.venue.city.toLowerCase() === vendorCity.toLowerCase()) {
        score += 10;
      }
      for (const vc of vendorCategories) {
        if (categories.some((c) => c.toLowerCase() === vc.toLowerCase())) {
          score += 5;
        }
      }

      return {
        id: ev.id,
        title: ev.title,
        startDate: ev.startDate,
        endDate: ev.endDate,
        venueName: ev.venue.name,
        venueCity: ev.venue.city,
        availableStalls,
        minPrice,
        categories,
        alreadyApplied,
        _score: score,
      };
    });

    // Apply category text filter (client-side after fetch)
    let filtered = shaped;
    if (categoryFilter) {
      const lower = categoryFilter.toLowerCase();
      filtered = shaped.filter((ev) =>
        ev.categories.some((c) => c.toLowerCase().includes(lower))
      );
    }

    // Sort: higher score first, then by startDate ascending
    filtered.sort((a, b) => {
      if (b._score !== a._score) return b._score - a._score;
      return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const result = filtered.slice(0, 20).map(({ _score, ...ev }) => ev);

    return NextResponse.json({ events: result, vendorCity });
  } catch (error) {
    console.error("Discover events error:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}
