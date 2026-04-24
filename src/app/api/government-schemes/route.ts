import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || "";

    const where: Record<string, unknown> = { isActive: true };
    if (category) where.category = category;

    const schemes = await prisma.governmentScheme.findMany({
      where: where as never,
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ schemes });
  } catch (error) {
    console.error("Schemes fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch schemes" }, { status: 500 });
  }
}
