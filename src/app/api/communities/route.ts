import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const type = searchParams.get("type") || "";
    const area = searchParams.get("area") || "";
    const sort = searchParams.get("sort") || "smartScore";
    const minFamilies = searchParams.get("minFamilies");
    const minRating = searchParams.get("minRating");

    const where: Record<string, unknown> = { isActive: true };
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { area: { contains: search } },
        { city: { contains: search } },
      ];
    }
    if (type) where.type = type;
    if (area) where.area = { contains: area };
    if (minFamilies) where.familyCount = { gte: parseInt(minFamilies) };
    if (minRating) where.vendorRating = { gte: parseFloat(minRating) };

    const orderBy: Record<string, string> =
      sort === "events" ? { createdAt: "desc" } :
      sort === "families" ? { familyCount: "desc" } :
      sort === "rating" ? { vendorRating: "desc" } :
      sort === "newest" ? { createdAt: "desc" } :
      { smartScore: "desc" }; // default: smartScore

    const venues = await prisma.venue.findMany({
      where: where as never,
      include: {
        amenities: { select: { name: true, isAvailable: true, charges: true } },
        _count: { select: { events: true } },
      },
      orderBy: orderBy as never,
    });

    return NextResponse.json({ communities: venues });
  } catch (error) {
    console.error("Communities fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch communities" }, { status: 500 });
  }
}
