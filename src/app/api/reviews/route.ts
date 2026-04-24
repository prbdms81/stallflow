import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetId = searchParams.get("targetId");
  const reviewType = searchParams.get("reviewType");
  const eventId = searchParams.get("eventId");

  const where: Record<string, unknown> = {};
  if (targetId) where.targetId = targetId;
  if (reviewType) where.reviewType = reviewType;
  if (eventId) where.eventId = eventId;

  const reviews = await prisma.review.findMany({
    where,
    include: {
      author: { select: { name: true, avatar: true } },
      event: { select: { title: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ reviews });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { eventId, targetId, rating, title, comment, reviewType } = body;

  if (!eventId || !targetId || !rating)
    return NextResponse.json({ error: "eventId, targetId, rating required" }, { status: 400 });
  if (rating < 1 || rating > 5)
    return NextResponse.json({ error: "Rating must be 1-5" }, { status: 400 });

  const existing = await prisma.review.findFirst({
    where: { eventId, authorId: session.user.id, targetId, reviewType: reviewType || "EVENT_REVIEW" },
  });
  if (existing) return NextResponse.json({ error: "Already reviewed" }, { status: 409 });

  const review = await prisma.review.create({
    data: {
      eventId,
      authorId: session.user.id,
      targetId,
      rating: parseInt(rating),
      title: title || null,
      comment: comment || null,
      reviewType: reviewType || "EVENT_REVIEW",
    },
  });

  await prisma.notification.create({
    data: {
      userId: targetId,
      type: "NEW_REVIEW",
      title: "You received a new review",
      message: `${session.user.name} left you a ${rating}-star review`,
      link: `/vendors/${targetId}`,
    },
  });

  return NextResponse.json({ review }, { status: 201 });
}
