import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET ?venueId= — returns vote counts grouped by category, sorted desc, plus top 3
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const venueId = searchParams.get("venueId");

    if (!venueId) {
      return NextResponse.json({ error: "venueId is required" }, { status: 400 });
    }

    // Verify venue exists
    const venue = await prisma.venue.findUnique({
      where: { id: venueId },
      select: { id: true, name: true },
    });

    if (!venue) {
      return NextResponse.json({ error: "Venue not found" }, { status: 404 });
    }

    // Group votes by category
    const rawGroups = await prisma.demandVote.groupBy({
      by: ["category"],
      where: { venueId },
      _count: { category: true },
      orderBy: { _count: { category: "desc" } },
    });

    // Also get recent subcategories per category
    const allVotes = await prisma.demandVote.findMany({
      where: { venueId },
      select: { category: true, subcategory: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });

    const subcategoryMap: Record<string, string[]> = {};
    for (const v of allVotes) {
      if (v.subcategory) {
        if (!subcategoryMap[v.category]) subcategoryMap[v.category] = [];
        if (!subcategoryMap[v.category].includes(v.subcategory)) {
          subcategoryMap[v.category].push(v.subcategory);
        }
      }
    }

    const grouped = rawGroups.map((g) => ({
      category: g.category,
      count: g._count.category,
      subcategories: (subcategoryMap[g.category] || []).slice(0, 5),
    }));

    const top3 = grouped.slice(0, 3).map((g) => g.category);
    const totalVotes = grouped.reduce((sum, g) => sum + g.count, 0);

    return NextResponse.json({
      venueId,
      venueName: venue.name,
      grouped,
      top3,
      totalVotes,
    });
  } catch (error) {
    console.error("Demand votes GET error:", error);
    return NextResponse.json({ error: "Failed to fetch demand votes" }, { status: 500 });
  }
}

// POST — public, no auth needed
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { venueId, category, subcategory, residentName, residentEmail, residentPhone } = body;

    if (!venueId || !category) {
      return NextResponse.json({ error: "venueId and category are required" }, { status: 400 });
    }

    // Require at least phone or email for dedup
    if (!residentEmail && !residentPhone) {
      return NextResponse.json(
        { error: "Please provide your phone or email so we can count your vote." },
        { status: 400 }
      );
    }

    // Verify venue exists
    const venue = await prisma.venue.findUnique({
      where: { id: venueId },
      select: { id: true },
    });
    if (!venue) {
      return NextResponse.json({ error: "Venue not found" }, { status: 404 });
    }

    // Rate-limit: same email/phone + same category in last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const dupConditions: Array<Record<string, unknown>> = [];
    if (residentEmail) {
      dupConditions.push({ residentEmail, category, venueId, createdAt: { gte: sevenDaysAgo } });
    }
    if (residentPhone) {
      dupConditions.push({ residentPhone, category, venueId, createdAt: { gte: sevenDaysAgo } });
    }

    const existing = await prisma.demandVote.findFirst({
      where: { OR: dupConditions },
    });

    if (existing) {
      return NextResponse.json(
        { error: "You already voted for this category recently. Try again in 7 days." },
        { status: 409 }
      );
    }

    const vote = await prisma.demandVote.create({
      data: {
        venueId,
        category,
        subcategory: subcategory || null,
        residentName: residentName || null,
        residentEmail: residentEmail || null,
        residentPhone: residentPhone || null,
      },
    });

    return NextResponse.json({ vote }, { status: 201 });
  } catch (error) {
    console.error("Demand votes POST error:", error);
    return NextResponse.json({ error: "Failed to submit vote" }, { status: 500 });
  }
}
