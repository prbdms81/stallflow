import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;
  const role = (session.user as { role: string }).role;
  if (role !== "VENDOR") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Fetch vendor profile
  const vendorProfile = await prisma.vendorProfile.findUnique({
    where: { userId },
    select: { businessName: true, category: true, createdAt: true },
  });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { createdAt: true },
  });

  // Last 12 months window
  const now = new Date();
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

  // Fetch confirmed bookings in last 12 months
  const bookings = await prisma.booking.findMany({
    where: {
      vendorId: userId,
      status: "CONFIRMED",
      createdAt: { gte: twelveMonthsAgo },
    },
    include: {
      event: {
        include: {
          venue: { select: { city: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  // Group by month (YYYY-MM)
  const monthMap = new Map<string, { events: number; revenue: number; paidCount: number }>();

  // Pre-fill all 12 months
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthMap.set(key, { events: 0, revenue: 0, paidCount: 0 });
  }

  for (const b of bookings) {
    const d = new Date(b.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const existing = monthMap.get(key);
    if (existing) {
      existing.events += 1;
      existing.revenue += b.totalAmount;
      if (b.paymentStatus === "PAID") existing.paidCount += 1;
    }
  }

  const monthlyData = Array.from(monthMap.entries()).map(([month, data]) => ({
    month,
    events: data.events,
    grossRevenue: data.revenue,
    paidCount: data.paidCount,
  }));

  const totalRevenue = bookings.reduce((s, b) => s + b.totalAmount, 0);
  const totalEvents = bookings.length;
  const avgRevenuePerEvent = totalEvents > 0 ? totalRevenue / totalEvents : 0;

  // Highest and lowest earning months (only months with events)
  const activeMonths = monthlyData.filter((m) => m.events > 0);
  const highestMonth =
    activeMonths.length > 0
      ? activeMonths.reduce((a, b) => (b.grossRevenue > a.grossRevenue ? b : a))
      : null;
  const lowestMonth =
    activeMonths.length > 0
      ? activeMonths.reduce((a, b) => (b.grossRevenue < a.grossRevenue ? b : a))
      : null;

  // Payment compliance rate
  const paidBookings = bookings.filter((b) => b.paymentStatus === "PAID").length;
  const paymentComplianceRate = totalEvents > 0 ? (paidBookings / totalEvents) * 100 : 0;

  // Vendor city from most recent booking
  const city = bookings.length > 0 ? bookings[bookings.length - 1]?.event?.venue?.city ?? "N/A" : "N/A";

  // Years active
  const memberSince = vendorProfile?.createdAt ?? user?.createdAt ?? now;
  const yearsActive = parseFloat(
    ((now.getTime() - new Date(memberSince).getTime()) / (1000 * 60 * 60 * 24 * 365)).toFixed(1)
  );

  return NextResponse.json({
    vendor: {
      businessName: vendorProfile?.businessName ?? "N/A",
      category: vendorProfile?.category ?? "N/A",
      city,
      yearsActive,
      memberSince: memberSince.toISOString(),
    },
    monthly: monthlyData,
    summary: {
      totalRevenue,
      totalEvents,
      avgRevenuePerEvent,
      paidBookings,
      paymentComplianceRate: parseFloat(paymentComplianceRate.toFixed(1)),
      highestMonth,
      lowestMonth,
    },
  });
}
