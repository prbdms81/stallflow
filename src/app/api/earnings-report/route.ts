import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;
  const role = (session.user as { role: string }).role;
  if (role !== "VENDOR") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") || "month";
  const fromDateParam = searchParams.get("fromDate");
  const toDateParam = searchParams.get("toDate");

  const now = new Date();
  let fromDate: Date;
  let toDate: Date = new Date(now);
  toDate.setHours(23, 59, 59, 999);

  if (period === "custom" && fromDateParam && toDateParam) {
    fromDate = new Date(fromDateParam);
    toDate = new Date(toDateParam);
    toDate.setHours(23, 59, 59, 999);
  } else if (period === "week") {
    fromDate = new Date(now);
    fromDate.setDate(now.getDate() - 7);
  } else if (period === "year") {
    fromDate = new Date(now.getFullYear(), 0, 1);
  } else {
    fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  const bookings = await prisma.booking.findMany({
    where: {
      vendorId: userId,
      paymentStatus: "PAID",
      event: { startDate: { gte: fromDate, lte: toDate } },
    },
    include: {
      event: { select: { title: true, startDate: true } },
      salesLogs: { select: { amount: true } },
    },
  });

  const breakdown = bookings.map((b) => {
    const salesAmount = b.salesLogs.reduce((s, l) => s + l.amount, 0);
    return {
      eventTitle: b.event.title,
      date: b.event.startDate.toISOString(),
      stallFee: b.totalAmount,
      salesAmount,
      total: b.totalAmount + salesAmount,
    };
  });

  const totalRevenue = breakdown.reduce((s, r) => s + r.total, 0);
  const totalEvents = breakdown.length;
  const avgPerEvent = totalEvents > 0 ? totalRevenue / totalEvents : 0;
  const grossIncome = totalRevenue;
  const presumptiveTaxBase = grossIncome;
  const estimatedTax = grossIncome * 0.06;

  return NextResponse.json({
    totalRevenue,
    totalEvents,
    avgPerEvent,
    breakdown,
    taxSummary: {
      grossIncome,
      presumptiveTaxBase,
      estimatedTax,
      period,
    },
  });
}
