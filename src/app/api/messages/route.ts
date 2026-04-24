import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get all conversations (messages sent or received) grouped by the other person
    const messages = await prisma.message.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      include: {
        sender: { select: { id: true, name: true, role: true, avatar: true } },
        receiver: { select: { id: true, name: true, role: true, avatar: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Group into conversations by the other user
    const convMap = new Map<string, {
      otherUser: { id: string; name: string; role: string; avatar: string | null };
      lastMessage: typeof messages[0];
      unreadCount: number;
    }>();

    for (const msg of messages) {
      const otherId = msg.senderId === userId ? msg.receiverId : msg.senderId;
      const otherUser = msg.senderId === userId ? msg.receiver : msg.sender;

      if (!convMap.has(otherId)) {
        convMap.set(otherId, {
          otherUser,
          lastMessage: msg,
          unreadCount: 0,
        });
      }
      if (msg.receiverId === userId && !msg.isRead) {
        const conv = convMap.get(otherId)!;
        conv.unreadCount++;
      }
    }

    const conversations = Array.from(convMap.values()).sort(
      (a, b) => new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime()
    );

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error("Messages fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { receiverId, subject, content } = body;

    if (!receiverId || !content) {
      return NextResponse.json({ error: "Receiver and content are required" }, { status: 400 });
    }

    // Verify receiver exists
    const receiver = await prisma.user.findUnique({ where: { id: receiverId } });
    if (!receiver) {
      return NextResponse.json({ error: "Receiver not found" }, { status: 404 });
    }

    const message = await prisma.message.create({
      data: {
        senderId: session.user.id,
        receiverId,
        subject: subject || null,
        content,
      },
      include: {
        sender: { select: { id: true, name: true, role: true, avatar: true } },
        receiver: { select: { id: true, name: true, role: true, avatar: true } },
      },
    });

    // Create notification for receiver
    await prisma.notification.create({
      data: {
        userId: receiverId,
        type: "NEW_MESSAGE",
        title: "New Message",
        message: `${session.user.name} sent you a message`,
        link: "/dashboard/messages",
      },
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error("Message send error:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
