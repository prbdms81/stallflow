import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** Mask a phone number: +91 98765 43210 → +91 98***43210 */
function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10) return phone;
  const last10 = digits.slice(-10);
  // show first 2 and last 5 digits of the 10-digit number
  return `+${digits.slice(0, digits.length - 10)}${last10.slice(0, 2)}***${last10.slice(5)}`;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (
    !session?.user ||
    !["EVENT_MANAGER", "VENUE_ADMIN"].includes((session.user as { role: string }).role)
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const sessions = await prisma.whatsAppSession.findMany({
    orderBy: { updatedAt: "desc" },
    take: 50,
  });

  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const masked = sessions.map((s) => ({
    id: s.id,
    phone: maskPhone(s.phone),
    step: s.step,
    updatedAt: s.updatedAt,
    createdAt: s.createdAt,
  }));

  const activeSessions = sessions.filter((s) => s.updatedAt >= oneDayAgo).length;

  return NextResponse.json({
    sessions: masked,
    total: sessions.length,
    active: activeSessions,
  });
}
