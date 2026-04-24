import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const TIER_THRESHOLDS: Record<string, number | null> = {
  Bronze: 500,
  Silver: 2000,
  Gold: 5000,
  Platinum: null,
};

function getTier(points: number): string {
  if (points < 500) return "Bronze";
  if (points < 2000) return "Silver";
  if (points < 5000) return "Gold";
  return "Platinum";
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "VENDOR") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const vendorId = session.user.id;

    // Count all confirmed bookings for points calculation
    const confirmedBookingsCount = await prisma.booking.count({
      where: {
        vendorId,
        status: "CONFIRMED",
      },
    });

    // Fetch last 5 confirmed bookings with event info
    const recentBookings = await prisma.booking.findMany({
      where: {
        vendorId,
        status: "CONFIRMED",
      },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        totalAmount: true,
        createdAt: true,
        event: {
          select: { title: true },
        },
      },
    });

    const points = confirmedBookingsCount * 100;
    const tier = getTier(points);
    const nextTierAt = TIER_THRESHOLDS[tier];
    const referralCode = session.user.id.substring(0, 8).toUpperCase();

    return NextResponse.json({
      points,
      tier,
      confirmedBookingsCount,
      nextTierAt,
      referralCode,
      recentBookings: recentBookings.map((b) => ({
        id: b.id,
        eventName: b.event.title,
        amount: b.totalAmount,
        date: b.createdAt,
        pointsEarned: 100,
      })),
    });
  } catch (error) {
    console.error("Loyalty GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
