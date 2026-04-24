import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const vendorId = searchParams.get("vendorId");

  if (!vendorId) return NextResponse.json({ error: "vendorId required" }, { status: 400 });

  const items = await prisma.stallMenuItem.findMany({
    where: { vendorId, isAvailable: true },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { name, description, price, category, image } = body;

  if (!name || !price) return NextResponse.json({ error: "name and price required" }, { status: 400 });

  const item = await prisma.stallMenuItem.create({
    data: {
      vendorId: session.user.id,
      name,
      description: description || null,
      price: parseFloat(price),
      category: category || null,
      image: image || null,
    },
  });

  return NextResponse.json({ item }, { status: 201 });
}
