import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId") || "";
    const status = searchParams.get("status") || "OPEN";

    const where: Record<string, unknown> = { status };
    if (eventId) where.eventId = eventId;

    const requests = await prisma.stallShareRequest.findMany({
      where: where as never,
      orderBy: { createdAt: "desc" },
    });

    // Enrich with vendor names
    const vendorIds = requests.map((r) => r.vendorId);
    const profiles = await prisma.vendorProfile.findMany({
      where: { userId: { in: vendorIds } },
      select: { userId: true, businessName: true, category: true },
    });
    const profileMap = Object.fromEntries(profiles.map((p) => [p.userId, p]));

    const events = await prisma.event.findMany({
      where: { id: { in: requests.map((r) => r.eventId) } },
      select: { id: true, title: true, startDate: true, venue: { select: { name: true } } },
    });
    const eventMap = Object.fromEntries(events.map((e) => [e.id, e]));

    return NextResponse.json({
      requests: requests.map((r) => ({
        ...r,
        vendorName: profileMap[r.vendorId]?.businessName || "Unknown",
        vendorCategory: profileMap[r.vendorId]?.category || "",
        eventTitle: eventMap[r.eventId]?.title || "",
        venueName: eventMap[r.eventId]?.venue?.name || "",
        eventDate: eventMap[r.eventId]?.startDate || null,
      })),
    });
  } catch (error) {
    console.error("Stall share requests fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch share requests" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { eventId, message, category, budget } = body;

    const shareReq = await prisma.stallShareRequest.create({
      data: {
        vendorId: session.user.id,
        eventId,
        message: message || null,
        category: category || null,
        budget: budget ? parseFloat(budget) : null,
      },
    });

    return NextResponse.json({ request: shareReq }, { status: 201 });
  } catch (error) {
    console.error("Share request creation error:", error);
    return NextResponse.json({ error: "Failed to create share request" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { requestId, action } = body;

    const req = await prisma.stallShareRequest.findUnique({ where: { id: requestId } });
    if (!req) return NextResponse.json({ error: "Request not found" }, { status: 404 });

    if (action === "match" && req.status === "OPEN") {
      const updated = await prisma.stallShareRequest.update({
        where: { id: requestId },
        data: { partnerVendorId: session.user.id, status: "MATCHED" },
      });
      return NextResponse.json({ request: updated });
    }

    if (action === "close" && req.vendorId === session.user.id) {
      const updated = await prisma.stallShareRequest.update({
        where: { id: requestId },
        data: { status: "CLOSED" },
      });
      return NextResponse.json({ request: updated });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Share request update error:", error);
    return NextResponse.json({ error: "Failed to update request" }, { status: 500 });
  }
}
