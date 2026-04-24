import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const venueId = searchParams.get("venueId");

    const where: Record<string, unknown> = { isActive: true };
    if (venueId) where.venueId = venueId;

    const kits = await prisma.setupKit.findMany({
      where: where as never,
      include: { venue: { select: { name: true } } },
    });

    return NextResponse.json({ kits });
  } catch (error) {
    console.error("Setup kits fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch setup kits" }, { status: 500 });
  }
}
