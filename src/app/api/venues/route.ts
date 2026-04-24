import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { slugify } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    // Single venue detail
    if (id) {
      const venue = await prisma.venue.findUnique({
        where: { id },
        include: {
          amenities: true,
          parkingSlots: true,
          events: {
            orderBy: { startDate: "desc" },
            select: {
              id: true,
              title: true,
              startDate: true,
              endDate: true,
              eventType: true,
              status: true,
              maxStalls: true,
              bookedStalls: true,
              basePrice: true,
              category: { select: { name: true } },
              bookings: {
                where: { status: "COMPLETED" },
                select: {
                  vendorId: true,
                  vendor: {
                    select: {
                      id: true,
                      name: true,
                      avatar: true,
                      vendorProfile: {
                        select: {
                          id: true,
                          businessName: true,
                          category: true,
                          logo: true,
                          rating: true,
                          totalEvents: true,
                          isTrusted: true,
                          trustScore: true,
                        },
                      },
                    },
                  },
                },
              },
              reviews: {
                select: { rating: true },
              },
            },
          },
          _count: { select: { events: true } },
        },
      });

      if (!venue) {
        return NextResponse.json({ error: "Venue not found" }, { status: 404 });
      }

      // Compute top vendors at this venue (by number of completed bookings)
      const vendorMap: Record<
        string,
        {
          userId: string;
          profileId: string;
          name: string;
          businessName: string;
          category: string;
          logo: string | null;
          avatar: string | null;
          rating: number;
          trustScore: number;
          isTrusted: boolean;
          eventsHere: number;
        }
      > = {};

      for (const event of venue.events) {
        for (const booking of event.bookings) {
          const vp = booking.vendor.vendorProfile;
          if (!vp) continue;
          if (!vendorMap[booking.vendorId]) {
            vendorMap[booking.vendorId] = {
              userId: booking.vendorId,
              profileId: vp.id,
              name: booking.vendor.name,
              businessName: vp.businessName,
              category: vp.category,
              logo: vp.logo,
              avatar: booking.vendor.avatar,
              rating: vp.rating,
              trustScore: vp.trustScore,
              isTrusted: vp.isTrusted,
              eventsHere: 0,
            };
          }
          vendorMap[booking.vendorId].eventsHere += 1;
        }
      }

      const topVendors = Object.values(vendorMap)
        .sort((a, b) => b.eventsHere - a.eventsHere)
        .slice(0, 10);

      // Compute venue vendor rating from reviews across all events
      let totalRating = 0;
      let totalReviews = 0;
      for (const event of venue.events) {
        for (const review of event.reviews) {
          totalRating += review.rating;
          totalReviews += 1;
        }
      }
      const computedVendorRating =
        totalReviews > 0 ? Math.round((totalRating / totalReviews) * 10) / 10 : venue.vendorRating;

      // Update cached vendor rating if changed
      if (Math.abs(venue.vendorRating - computedVendorRating) > 0.05) {
        await prisma.venue.update({
          where: { id: venue.id },
          data: { vendorRating: computedVendorRating },
        });
      }

      // Build clean events list (without nested bookings/reviews)
      const events = venue.events.map((e) => ({
        id: e.id,
        title: e.title,
        startDate: e.startDate,
        endDate: e.endDate,
        eventType: e.eventType,
        status: e.status,
        maxStalls: e.maxStalls,
        bookedStalls: e.bookedStalls,
        basePrice: e.basePrice,
        categoryName: e.category.name,
        avgRating:
          e.reviews.length > 0
            ? Math.round((e.reviews.reduce((s, r) => s + r.rating, 0) / e.reviews.length) * 10) / 10
            : null,
        vendorCount: new Set(e.bookings.map((b) => b.vendorId)).size,
      }));

      // Images
      const images: string[] = venue.images ? JSON.parse(venue.images) : [];

      return NextResponse.json({
        venue: {
          id: venue.id,
          name: venue.name,
          slug: venue.slug,
          type: venue.type,
          address: venue.address,
          area: venue.area,
          city: venue.city,
          state: venue.state,
          pincode: venue.pincode,
          description: venue.description,
          images,
          capacity: venue.capacity,
          totalStallSlots: venue.totalStallSlots,
          familyCount: venue.familyCount,
          employeeCount: venue.employeeCount,
          vendorRating: computedVendorRating,
          totalReviews,
          eventFrequency: venue.eventFrequency,
          bestCategories: venue.bestCategories,
          powerSupply: venue.powerSupply,
          parkingNotes: venue.parkingNotes,
          smartScore: venue.smartScore,
          avgSpendPerVisit: venue.avgSpendPerVisit,
          contactName: venue.contactName,
          contactPhone: venue.contactPhone,
          amenities: venue.amenities.map((a) => ({
            name: a.name,
            isAvailable: a.isAvailable,
            charges: a.charges,
          })),
          parkingSlots: venue.parkingSlots.map((p) => ({
            slotNumber: p.slotNumber,
            type: p.type,
            isAvailable: p.isAvailable,
            charges: p.charges,
          })),
          events,
          topVendors,
          _count: venue._count,
        },
      });
    }

    // List venues
    const city = searchParams.get("city") || "";
    const type = searchParams.get("type") || "";

    const where: Record<string, unknown> = { isActive: true };
    if (city) where.city = { contains: city };
    if (type) where.type = type;

    const venues = await prisma.venue.findMany({
      where: where as never,
      include: {
        amenities: { select: { name: true, isAvailable: true } },
        _count: { select: { events: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ venues });
  } catch (error) {
    console.error("Venues fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch venues" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["VENUE_ADMIN", "ADMIN", "EVENT_MANAGER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      name, type, address, city, state, pincode, description,
      capacity, totalStallSlots, contactName, contactPhone, contactEmail,
      amenities, parkingSlots,
    } = body;

    if (!name || !type || !address || !city || !state || !pincode) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const slug = slugify(name) + "-" + Date.now().toString(36);

    const venue = await prisma.venue.create({
      data: {
        name,
        slug,
        type,
        address,
        city,
        state,
        pincode,
        description,
        capacity: capacity || 0,
        totalStallSlots: totalStallSlots || 0,
        contactName,
        contactPhone,
        contactEmail,
        adminId: session.user.id,
        amenities: amenities
          ? {
              create: amenities.map((a: { name: string; description?: string; charges?: number }) => ({
                name: a.name,
                description: a.description || null,
                charges: a.charges || 0,
              })),
            }
          : undefined,
        parkingSlots: parkingSlots
          ? {
              create: parkingSlots.map((p: { slotNumber: string; type: string; charges?: number }) => ({
                slotNumber: p.slotNumber,
                type: p.type,
                charges: p.charges || 0,
              })),
            }
          : undefined,
      },
    });

    return NextResponse.json({ venue }, { status: 201 });
  } catch (error) {
    console.error("Venue creation error:", error);
    return NextResponse.json({ error: "Failed to create venue" }, { status: 500 });
  }
}
