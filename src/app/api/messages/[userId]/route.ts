import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId: otherUserId } = await params;
    const myId = session.user.id;

    // Get all messages between the two users
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: myId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: myId },
        ],
      },
      include: {
        sender: { select: { id: true, name: true, role: true, avatar: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    // Mark unread messages as read
    await prisma.message.updateMany({
      where: {
        senderId: otherUserId,
        receiverId: myId,
        isRead: false,
      },
      data: { isRead: true },
    });

    // Get other user info
    const otherUser = await prisma.user.findUnique({
      where: { id: otherUserId },
      select: { id: true, name: true, role: true, avatar: true, company: true },
    });

    return NextResponse.json({ messages, otherUser });
  } catch (error) {
    console.error("Conversation fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch conversation" }, { status: 500 });
  }
}
