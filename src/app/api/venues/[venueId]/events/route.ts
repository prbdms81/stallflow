import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ venueId: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { venueId } = await params;
    const events = await prisma.event.findMany({
      where: { venueId },
      select: {
        id: true,
        title: true,
        startDate: true,
        endDate: true,
        status: true,
      },
      orderBy: { startDate: "asc" },
    });
    return NextResponse.json({ events });
  } catch {
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}
