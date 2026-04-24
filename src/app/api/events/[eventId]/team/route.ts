import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { notify } from "@/lib/notify";

async function getEventOrFail(eventId: string, userId: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { organizerId: true, title: true },
  });
  if (!event) return { event: null, error: "Event not found", status: 404 };
  if (event.organizerId !== userId) return { event: null, error: "Forbidden", status: 403 };
  return { event, error: null, status: 200 };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { eventId } = await params;
  const { event, error, status } = await getEventOrFail(eventId, session.user.id);
  if (!event) return NextResponse.json({ error }, { status });

  const members = await prisma.eventTeamMember.findMany({
    where: { eventId },
    include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ members });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { eventId } = await params;
  const { event, error, status } = await getEventOrFail(eventId, session.user.id);
  if (!event) return NextResponse.json({ error }, { status });

  const body = await request.json();
  const { email, role } = body;

  if (!email || !role) {
    return NextResponse.json({ error: "email and role are required" }, { status: 400 });
  }

  const validRoles = ["VIEWER", "OPS", "CO_ORGANIZER"];
  if (!validRoles.includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, name: true } });
  if (!user) {
    return NextResponse.json({ error: "User not found with that email" }, { status: 404 });
  }

  if (user.id === session.user.id) {
    return NextResponse.json({ error: "Cannot add yourself as a team member" }, { status: 400 });
  }

  const member = await prisma.eventTeamMember.upsert({
    where: { eventId_userId: { eventId, userId: user.id } },
    update: { role },
    create: { eventId, userId: user.id, role },
    include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
  });

  await notify({
    userId: user.id,
    type: "TEAM_INVITE",
    title: "You have been added to an event team",
    message: `You have been added as ${role.replace("_", " ")} for "${event.title}".`,
    link: `/dashboard/manager/events/${eventId}/stalls`,
  });

  return NextResponse.json({ member }, { status: 201 });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { eventId } = await params;
  const { event, error, status } = await getEventOrFail(eventId, session.user.id);
  if (!event) return NextResponse.json({ error }, { status });

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId query param required" }, { status: 400 });

  await prisma.eventTeamMember.deleteMany({ where: { eventId, userId } });

  return NextResponse.json({ ok: true });
}
