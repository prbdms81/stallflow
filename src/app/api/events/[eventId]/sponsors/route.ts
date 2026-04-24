import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

type Params = { params: Promise<{ eventId: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { eventId } = await params;
    const sponsors = await prisma.eventSponsor.findMany({
      where: { eventId },
      orderBy: [
        { tier: "asc" },
        { createdAt: "asc" },
      ],
    });
    return NextResponse.json({ sponsors });
  } catch {
    return NextResponse.json({ error: "Failed to fetch sponsors" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { eventId } = await params;
    const event = await prisma.event.findUnique({ where: { id: eventId }, select: { organizerId: true } });
    if (!event || event.organizerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { name, logoUrl, websiteUrl, tier, amount, visibility } = await request.json();
    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    const sponsor = await prisma.eventSponsor.create({
      data: {
        eventId,
        name,
        logoUrl: logoUrl || null,
        websiteUrl: websiteUrl || null,
        tier: tier || "BRONZE",
        amount: amount ? parseFloat(amount) : 0,
        visibility: visibility || null,
        paymentStatus: "PENDING",
      },
    });

    return NextResponse.json({ sponsor }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to add sponsor" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { eventId } = await params;
    const { searchParams } = new URL(request.url);
    const sponsorId = searchParams.get("sponsorId");
    if (!sponsorId) return NextResponse.json({ error: "sponsorId required" }, { status: 400 });

    const event = await prisma.event.findUnique({ where: { id: eventId }, select: { organizerId: true } });
    if (!event || event.organizerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const sponsor = await prisma.eventSponsor.update({
      where: { id: sponsorId },
      data: {
        name: body.name,
        logoUrl: body.logoUrl,
        websiteUrl: body.websiteUrl,
        tier: body.tier,
        amount: body.amount !== undefined ? parseFloat(body.amount) : undefined,
        visibility: body.visibility,
        paymentStatus: body.paymentStatus,
      },
    });

    return NextResponse.json({ sponsor });
  } catch {
    return NextResponse.json({ error: "Failed to update sponsor" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { eventId } = await params;
    const { searchParams } = new URL(request.url);
    const sponsorId = searchParams.get("sponsorId");
    if (!sponsorId) return NextResponse.json({ error: "sponsorId required" }, { status: 400 });

    const event = await prisma.event.findUnique({ where: { id: eventId }, select: { organizerId: true } });
    if (!event || event.organizerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.eventSponsor.delete({ where: { id: sponsorId } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete sponsor" }, { status: 500 });
  }
}
