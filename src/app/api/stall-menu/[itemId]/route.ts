import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PATCH(request: NextRequest, { params }: { params: { itemId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const item = await prisma.stallMenuItem.findUnique({ where: { id: params.itemId } });
  if (!item || item.vendorId !== session.user.id)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();
  const updated = await prisma.stallMenuItem.update({
    where: { id: params.itemId },
    data: {
      name: body.name ?? item.name,
      description: body.description ?? item.description,
      price: body.price !== undefined ? parseFloat(body.price) : item.price,
      category: body.category ?? item.category,
      isAvailable: body.isAvailable ?? item.isAvailable,
    },
  });

  return NextResponse.json({ item: updated });
}

export async function DELETE(request: NextRequest, { params }: { params: { itemId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const item = await prisma.stallMenuItem.findUnique({ where: { id: params.itemId } });
  if (!item || item.vendorId !== session.user.id)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.stallMenuItem.delete({ where: { id: params.itemId } });
  return NextResponse.json({ success: true });
}
