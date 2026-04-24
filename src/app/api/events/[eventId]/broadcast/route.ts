import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { notify } from "@/lib/notify";

export async function POST(request: NextRequest, { params }: { params: { eventId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "EVENT_MANAGER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const event = await prisma.event.findUnique({
      where: { id: params.eventId },
      select: { organizerId: true, title: true },
    });
    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

    // Allow organizer or team member
    const isOrganizer = event.organizerId === session.user.id;
    if (!isOrganizer) {
      const teamMember = await prisma.eventTeamMember.findUnique({
        where: { eventId_userId: { eventId: params.eventId, userId: session.user.id } },
      });
      if (!teamMember) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { subject, content } = await request.json();
    if (!subject || !content) {
      return NextResponse.json({ error: "subject and content are required" }, { status: 400 });
    }

    // Get all booked vendors for this event
    const bookings = await prisma.booking.findMany({
      where: { eventId: params.eventId, status: { not: "CANCELLED" } },
      select: { vendorId: true },
      distinct: ["vendorId"],
    });

    if (bookings.length === 0) {
      return NextResponse.json({ count: 0, message: "No booked vendors to message" });
    }

    const vendorIds = bookings.map((b) => b.vendorId);

    // Create message + notification for each vendor
    await Promise.all(
      vendorIds.map(async (receiverId) => {
        await prisma.message.create({
          data: {
            senderId: session.user.id,
            receiverId,
            subject,
            content,
          },
        });
        await notify({
          userId: receiverId,
          type: "BROADCAST_MESSAGE",
          title: subject,
          message: content.length > 120 ? content.slice(0, 120) + "..." : content,
          link: `/dashboard/vendor/messages`,
        });
      })
    );

    return NextResponse.json({ count: vendorIds.length });
  } catch (error) {
    console.error("Broadcast POST error:", error);
    return NextResponse.json({ error: "Failed to send broadcast" }, { status: 500 });
  }
}

export async function GET(request: NextRequest, { params }: { params: { eventId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "EVENT_MANAGER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const event = await prisma.event.findUnique({ where: { id: params.eventId }, select: { organizerId: true } });
    if (!event || event.organizerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const bookings = await prisma.booking.findMany({
      where: { eventId: params.eventId, status: { not: "CANCELLED" } },
      select: { vendor: { select: { id: true, name: true, email: true } } },
      distinct: ["vendorId"],
    });

    const vendors = bookings.map((b) => b.vendor);
    return NextResponse.json({ vendors });
  } catch (error) {
    console.error("Broadcast GET error:", error);
    return NextResponse.json({ error: "Failed to fetch vendors" }, { status: 500 });
  }
}
