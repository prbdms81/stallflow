import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: { venueId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const venue = await prisma.venue.findUnique({ where: { id: params.venueId } });
  if (!venue) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (venue.adminId !== session.user.id && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const {
    name, type, address, city, state, pincode, description,
    capacity, totalStallSlots, contactName, contactPhone, contactEmail,
    area, isActive, familyCount, employeeCount, bestCategories,
    eventFrequency, parkingNotes, powerSupply,
  } = body;

  const updated = await prisma.venue.update({
    where: { id: params.venueId },
    data: {
      ...(name && { name }),
      ...(type && { type }),
      ...(address && { address }),
      ...(city && { city }),
      ...(state && { state }),
      ...(pincode && { pincode }),
      ...(description !== undefined && { description }),
      ...(capacity !== undefined && { capacity: Number(capacity) }),
      ...(totalStallSlots !== undefined && { totalStallSlots: Number(totalStallSlots) }),
      ...(contactName !== undefined && { contactName }),
      ...(contactPhone !== undefined && { contactPhone }),
      ...(contactEmail !== undefined && { contactEmail }),
      ...(area !== undefined && { area }),
      ...(isActive !== undefined && { isActive }),
      ...(familyCount !== undefined && { familyCount: Number(familyCount) }),
      ...(employeeCount !== undefined && { employeeCount: Number(employeeCount) }),
      ...(bestCategories !== undefined && { bestCategories }),
      ...(eventFrequency !== undefined && { eventFrequency }),
      ...(parkingNotes !== undefined && { parkingNotes }),
      ...(powerSupply !== undefined && { powerSupply }),
    },
  });

  return NextResponse.json({ venue: updated });
}

export async function DELETE(req: NextRequest, { params }: { params: { venueId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const venue = await prisma.venue.findUnique({ where: { id: params.venueId } });
  if (!venue) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (venue.adminId !== session.user.id && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const activeEvents = await prisma.event.count({
    where: { venueId: params.venueId, status: { in: ["UPCOMING", "ACTIVE"] } },
  });
  if (activeEvents > 0) {
    return NextResponse.json(
      { error: "Cannot delete venue with active or upcoming events" },
      { status: 400 }
    );
  }

  await prisma.venue.delete({ where: { id: params.venueId } });
  return NextResponse.json({ success: true });
}
