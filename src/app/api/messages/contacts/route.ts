import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = session.user.role;
    const userId = session.user.id;

    let contacts;

    if (role === "VENDOR") {
      // Vendors can message event managers of events they've booked or all event managers
      const bookedManagerIds = await prisma.booking.findMany({
        where: { vendorId: userId },
        select: { event: { select: { organizerId: true } } },
      });
      const managerIds = Array.from(new Set(bookedManagerIds.map((b) => b.event.organizerId)));

      // Get all event managers (prioritize ones vendor has interacted with)
      contacts = await prisma.user.findMany({
        where: {
          role: { in: ["EVENT_MANAGER", "ADMIN"] },
          id: { not: userId },
        },
        select: { id: true, name: true, role: true, avatar: true, company: true },
        orderBy: { name: "asc" },
      });

      // Sort: booked managers first
      contacts.sort((a, b) => {
        const aBooked = managerIds.includes(a.id) ? 0 : 1;
        const bBooked = managerIds.includes(b.id) ? 0 : 1;
        return aBooked - bBooked;
      });
    } else if (role === "EVENT_MANAGER") {
      // Event managers can message vendors who booked their events, or all vendors
      const bookedVendorIds = await prisma.booking.findMany({
        where: { event: { organizerId: userId } },
        select: { vendorId: true },
      });
      const vendorIds = Array.from(new Set(bookedVendorIds.map((b) => b.vendorId)));

      contacts = await prisma.user.findMany({
        where: {
          role: "VENDOR",
          id: { not: userId },
        },
        select: { id: true, name: true, role: true, avatar: true, company: true },
        orderBy: { name: "asc" },
      });

      contacts.sort((a, b) => {
        const aBooked = vendorIds.includes(a.id) ? 0 : 1;
        const bBooked = vendorIds.includes(b.id) ? 0 : 1;
        return aBooked - bBooked;
      });
    } else {
      // Admins can message anyone
      contacts = await prisma.user.findMany({
        where: { id: { not: userId } },
        select: { id: true, name: true, role: true, avatar: true, company: true },
        orderBy: { name: "asc" },
      });
    }

    return NextResponse.json({ contacts });
  } catch (error) {
    console.error("Contacts fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch contacts" }, { status: 500 });
  }
}
