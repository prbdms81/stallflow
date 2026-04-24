import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const prefs = await prisma.notificationPreference.findUnique({
    where: { userId: session.user.id },
  });

  return NextResponse.json({
    prefs: prefs ?? { inApp: true, email: true, whatsapp: false, whatsappNo: null },
  });
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { inApp, email, whatsapp, whatsappNo } = body;

  const prefs = await prisma.notificationPreference.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      inApp: inApp ?? true,
      email: email ?? true,
      whatsapp: whatsapp ?? false,
      whatsappNo: whatsappNo || null,
    },
    update: {
      ...(inApp !== undefined && { inApp }),
      ...(email !== undefined && { email }),
      ...(whatsapp !== undefined && { whatsapp }),
      ...(whatsappNo !== undefined && { whatsappNo: whatsappNo || null }),
    },
  });

  return NextResponse.json({ prefs });
}
