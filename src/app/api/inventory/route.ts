import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getVendorId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  const role = (session.user as { role: string }).role;
  if (role !== "VENDOR") return null;
  return (session.user as { id: string }).id;
}

export async function GET() {
  const vendorId = await getVendorId();
  if (!vendorId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const items = await prisma.inventoryItem.findMany({
    where: { vendorId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const vendorId = await getVendorId();
  if (!vendorId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, unit, costPrice, sellPrice, defaultQty } = body;

  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const item = await prisma.inventoryItem.create({
    data: {
      vendorId,
      name,
      unit: unit || "units",
      costPrice: parseFloat(costPrice) || 0,
      sellPrice: parseFloat(sellPrice) || 0,
      defaultQty: parseInt(defaultQty) || 0,
    },
  });

  return NextResponse.json({ item }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const vendorId = await getVendorId();
  if (!vendorId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const itemId = searchParams.get("itemId");
  if (!itemId) return NextResponse.json({ error: "itemId required" }, { status: 400 });

  const existing = await prisma.inventoryItem.findFirst({ where: { id: itemId, vendorId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const { name, unit, costPrice, sellPrice, defaultQty } = body;

  const item = await prisma.inventoryItem.update({
    where: { id: itemId },
    data: {
      ...(name !== undefined && { name }),
      ...(unit !== undefined && { unit }),
      ...(costPrice !== undefined && { costPrice: parseFloat(costPrice) }),
      ...(sellPrice !== undefined && { sellPrice: parseFloat(sellPrice) }),
      ...(defaultQty !== undefined && { defaultQty: parseInt(defaultQty) }),
    },
  });

  return NextResponse.json({ item });
}

export async function DELETE(req: NextRequest) {
  const vendorId = await getVendorId();
  if (!vendorId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const itemId = searchParams.get("itemId");
  if (!itemId) return NextResponse.json({ error: "itemId required" }, { status: 400 });

  const existing = await prisma.inventoryItem.findFirst({ where: { id: itemId, vendorId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.inventoryItem.delete({ where: { id: itemId } });

  return NextResponse.json({ success: true });
}
