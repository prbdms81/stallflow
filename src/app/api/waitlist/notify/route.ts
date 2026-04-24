import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { notify } from "@/lib/notify";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "EVENT_MANAGER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { eventId } = await request.json();
    if (!eventId) return NextResponse.json({ error: "eventId required" }, { status: 400 });

    const event = await prisma.event.findUnique({ where: { id: eventId }, select: { organizerId: true, title: true } });
    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });
    if (event.organizerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const entries = await prisma.waitlistEntry.findMany({
      where: { eventId, notified: false },
    });

    if (entries.length === 0) {
      return NextResponse.json({ count: 0, message: "No unnotified vendors on waitlist" });
    }

    await Promise.all(
      entries.map((entry) =>
        notify({
          userId: entry.vendorId,
          type: "WAITLIST_STALL_AVAILABLE",
          title: "Stall Available!",
          message: `A stall has opened up for "${event.title}". Book now before it's gone!`,
          link: `/events/${eventId}`,
        })
      )
    );

    await prisma.waitlistEntry.updateMany({
      where: { eventId, notified: false },
      data: { notified: true },
    });

    return NextResponse.json({ count: entries.length });
  } catch (error) {
    console.error("Waitlist notify error:", error);
    return NextResponse.json({ error: "Failed to send notifications" }, { status: 500 });
  }
}
