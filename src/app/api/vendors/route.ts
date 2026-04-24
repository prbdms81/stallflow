import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const trusted = searchParams.get("trusted");
    const minRating = searchParams.get("minRating");
    const sort = searchParams.get("sort") || "rating";

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { businessName: { contains: search } },
        { category: { contains: search } },
        { user: { name: { contains: search } } },
      ];
    }
    if (category) where.category = category;
    if (trusted === "true") where.isTrusted = true;
    if (minRating) where.rating = { gte: parseFloat(minRating) };

    const orderBy: Record<string, string> =
      sort === "events" ? { totalEvents: "desc" } :
      sort === "newest" ? { createdAt: "desc" } :
      { rating: "desc" };

    const vendors = await prisma.vendorProfile.findMany({
      where: where as never,
      include: {
        user: {
          select: { id: true, name: true, avatar: true, phone: true },
        },
      },
      orderBy: orderBy as never,
    });

    return NextResponse.json({ vendors });
  } catch (error) {
    console.error("Vendors fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch vendors" }, { status: 500 });
  }
}
