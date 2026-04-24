import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");

    if (session.user.role === "VENDOR") {
      // Vendor: list their own BNPL agreements
      const agreements = await prisma.bNPLAgreement.findMany({
        where: { vendorId: session.user.id },
        include: {
          booking: {
            select: {
              id: true,
              bookingNumber: true,
              event: { select: { id: true, title: true, endDate: true } },
              stall: { select: { stallNumber: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json({ agreements });
    }

    if (session.user.role === "EVENT_MANAGER") {
      // Manager: list BNPL agreements for their event
      if (!eventId) {
        return NextResponse.json({ error: "eventId is required" }, { status: 400 });
      }
      // Verify this manager owns the event
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: { organizerId: true },
      });
      if (!event || event.organizerId !== session.user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const agreements = await prisma.bNPLAgreement.findMany({
        where: { booking: { eventId } },
        include: {
          booking: {
            select: {
              id: true,
              bookingNumber: true,
              stall: { select: { stallNumber: true } },
              vendor: { select: { id: true, name: true, email: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json({ agreements });
    }

    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  } catch (error) {
    console.error("BNPL fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch BNPL agreements" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "EVENT_MANAGER") {
      return NextResponse.json({ error: "Forbidden — Event Managers only" }, { status: 403 });
    }

    const body = await request.json();
    const { agreementId } = body;

    if (!agreementId) {
      return NextResponse.json({ error: "agreementId is required" }, { status: 400 });
    }

    // Load agreement with event organizer info
    const agreement = await prisma.bNPLAgreement.findUnique({
      where: { id: agreementId },
      include: {
        booking: {
          select: {
            event: { select: { organizerId: true } },
          },
        },
      },
    });

    if (!agreement) {
      return NextResponse.json({ error: "Agreement not found" }, { status: 404 });
    }

    // Must be the organizer of the event
    if (agreement.booking.event.organizerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden — not the event organizer" }, { status: 403 });
    }

    if (agreement.status === "SETTLED") {
      return NextResponse.json({ error: "Agreement is already settled" }, { status: 400 });
    }

    const updated = await prisma.bNPLAgreement.update({
      where: { id: agreementId },
      data: {
        status: "SETTLED",
        settledAt: new Date(),
      },
    });

    return NextResponse.json({ agreement: updated });
  } catch (error) {
    console.error("BNPL settle error:", error);
    return NextResponse.json({ error: "Failed to settle agreement" }, { status: 500 });
  }
}
