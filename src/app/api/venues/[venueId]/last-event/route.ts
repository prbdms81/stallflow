import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ venueId: string }> }
) {
  try {
    const { venueId } = await params;

    const lastEvent = await prisma.event.findFirst({
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
        bookedStalls: true,
        maxStalls: true,
      },
    });

    return NextResponse.json({ lastEvent });
  } catch (error) {
    console.error("Last event fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
