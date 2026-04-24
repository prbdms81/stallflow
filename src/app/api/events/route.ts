import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { slugify } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";
    const city = searchParams.get("city") || "";
    const area = searchParams.get("area") || "";
    const eventType = searchParams.get("eventType") || "";
    const category = searchParams.get("category") || "";
    const status = searchParams.get("status") || "";
    const month = searchParams.get("month") || "";
    const dateFrom = searchParams.get("dateFrom") || "";
    const dateTo = searchParams.get("dateTo") || "";
    const sortBy = searchParams.get("sortBy") || "upcoming";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");

    const where: Record<string, unknown> = {};

    if (q) {
      where.OR = [
        { title: { contains: q } },
        { description: { contains: q } },
      ];
    }

    if (city || area) {
      const venueFilter: Record<string, unknown> = {};
      if (city) venueFilter.city = { contains: city };
      if (area) venueFilter.area = { contains: area };
      where.venue = venueFilter;
    }

    if (eventType) {
      where.eventType = eventType;
    }

    if (category) {
      where.category = { slug: category };
    }

    if (status) {
      where.status = status;
    } else {
      where.status = { in: ["PUBLISHED", "LIVE"] };
    }

    // Date filters
    if (dateFrom || dateTo) {
      where.startDate = {};
      if (dateFrom) (where.startDate as Record<string, unknown>).gte = new Date(dateFrom);
      if (dateTo) (where.startDate as Record<string, unknown>).lte = new Date(dateTo);
    } else if (month) {
      // month format: "2026-03"
      const [year, mon] = month.split("-").map(Number);
      where.startDate = {
        gte: new Date(year, mon - 1, 1),
        lt: new Date(year, mon, 1),
      };
    }

    // Default: show upcoming events first (startDate >= today)
    let orderBy: Record<string, string> = { startDate: "asc" };
    if (sortBy === "upcoming") {
      if (!dateFrom && !dateTo && !month) {
        where.startDate = { ...(where.startDate as Record<string, unknown> || {}), gte: new Date() };
      }
    } else if (sortBy === "latest") {
      orderBy = { createdAt: "desc" };
    } else if (sortBy === "price_low") {
      orderBy = { basePrice: "asc" };
    } else if (sortBy === "price_high") {
      orderBy = { basePrice: "desc" };
    }

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where: where as never,
        include: {
          category: { select: { name: true, slug: true } },
          venue: { select: { name: true, city: true, type: true, area: true } },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.event.count({ where: where as never }),
    ]);

    return NextResponse.json({
      events,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Events fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "EVENT_MANAGER" && session.user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      title, description, shortDescription, categoryId, venueId,
      startDate, endDate, startTime, endTime, eventType, maxStalls,
      basePrice, bookingDeadline, cancellationPolicy, terms,
      parkingInfo, stallCategories, lastEventInfo,
    } = body;

    if (!title || !categoryId || !venueId || !startDate || !endDate || !startTime || !endTime || !eventType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const slug = slugify(title) + "-" + Date.now().toString(36);

    const event = await prisma.event.create({
      data: {
        title,
        slug,
        description,
        shortDescription,
        categoryId,
        venueId,
        organizerId: session.user.id,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        startTime,
        endTime,
        eventType,
        maxStalls: maxStalls || 0,
        basePrice: basePrice || 0,
        bookingDeadline: bookingDeadline ? new Date(bookingDeadline) : null,
        cancellationPolicy,
        terms,
        parkingInfo,
        lastEventInfo,
        stallCategories,
      },
      include: { venue: { select: { name: true } } },
    });

    // Notify all vendors subscribed to this venue
    const subscriptions = await prisma.vendorSubscription.findMany({
      where: { venueId: event.venueId },
      select: { vendorId: true },
    });

    if (subscriptions.length > 0) {
      await prisma.notification.createMany({
        data: subscriptions.map((sub) => ({
          userId: sub.vendorId,
          type: "NEW_EVENT_ALERT",
          title: `New event at ${event.venue?.name ?? "your subscribed venue"}`,
          message: `${event.title} is now open for booking`,
          link: `/events/${event.id}`,
        })),
      });
    }

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    console.error("Event creation error:", error);
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}
