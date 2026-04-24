import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/subscriptions — list current vendor's venue subscriptions
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subscriptions = await prisma.vendorSubscription.findMany({
      where: { vendorId: session.user.id },
      include: {
        venue: { select: { id: true, name: true, city: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ subscriptions });
  } catch (error) {
    console.error("Subscriptions fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch subscriptions" }, { status: 500 });
  }
}

// POST /api/subscriptions — subscribe to a venue
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { venueId } = body;

    if (!venueId) {
      return NextResponse.json({ error: "venueId is required" }, { status: 400 });
    }

    const venue = await prisma.venue.findUnique({
      where: { id: venueId },
      select: { id: true, name: true, city: true },
    });

    if (!venue) {
      return NextResponse.json({ error: "Venue not found" }, { status: 404 });
    }

    // Upsert — ignore if already subscribed
    const subscription = await prisma.vendorSubscription.upsert({
      where: { vendorId_venueId: { vendorId: session.user.id, venueId } },
      update: {},
      create: { vendorId: session.user.id, venueId },
    });

    // Confirmation notification
    await prisma.notification.create({
      data: {
        userId: session.user.id,
        type: "SUBSCRIPTION_CONFIRMED",
        title: `Subscribed to ${venue.name}`,
        message: `You will be notified whenever a new event is posted at ${venue.name}, ${venue.city}.`,
        link: `/venues/${venueId}`,
      },
    });

    return NextResponse.json({ subscription }, { status: 201 });
  } catch (error) {
    console.error("Subscription create error:", error);
    return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 });
  }
}

// DELETE /api/subscriptions?venueId=xxx — unsubscribe from a venue
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const venueId = searchParams.get("venueId");

    if (!venueId) {
      return NextResponse.json({ error: "venueId query param required" }, { status: 400 });
    }

    await prisma.vendorSubscription.deleteMany({
      where: { vendorId: session.user.id, venueId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Subscription delete error:", error);
    return NextResponse.json({ error: "Failed to unsubscribe" }, { status: 500 });
  }
}
