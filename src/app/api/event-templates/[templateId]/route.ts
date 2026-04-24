import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { slugify } from "@/lib/utils";

type StallTemplate = {
  stallNumber: string;
  name?: string | null;
  type: string;
  size: string;
  price: number;
  positionX: number;
  positionY: number;
  width: number;
  height: number;
  stallCategory?: string | null;
  amenities?: string | null;
  notes?: string | null;
};

type TemplateData = {
  title: string;
  description?: string | null;
  shortDescription?: string | null;
  categoryId: string;
  venueId: string;
  startTime: string;
  endTime: string;
  eventType: string;
  basePrice: number;
  cancellationPolicy?: string | null;
  parkingInfo?: string | null;
  terms?: string | null;
  stallCategories?: string | null;
  stalls: StallTemplate[];
};

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "EVENT_MANAGER" && session.user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { templateId } = await params;

    const template = await prisma.eventTemplate.findUnique({ where: { id: templateId } });
    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }
    if (template.managerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.eventTemplate.delete({ where: { id: templateId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Template delete error:", error);
    return NextResponse.json({ error: "Failed to delete template" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "EVENT_MANAGER" && session.user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    if (searchParams.get("action") !== "clone") {
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    const { templateId } = await params;

    const template = await prisma.eventTemplate.findUnique({ where: { id: templateId } });
    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }
    if (template.managerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { title, startDate, endDate, venueId } = body;

    if (!title || !startDate || !endDate) {
      return NextResponse.json({ error: "title, startDate and endDate are required" }, { status: 400 });
    }

    const data = JSON.parse(template.templateData) as TemplateData;
    const slug = slugify(title) + "-" + Date.now().toString(36);

    const event = await prisma.event.create({
      data: {
        title,
        slug,
        description: data.description ?? null,
        shortDescription: data.shortDescription ?? null,
        categoryId: data.categoryId,
        venueId: venueId ?? data.venueId,
        organizerId: session.user.id,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        startTime: data.startTime,
        endTime: data.endTime,
        eventType: data.eventType,
        status: "DRAFT",
        basePrice: data.basePrice,
        cancellationPolicy: data.cancellationPolicy ?? null,
        parkingInfo: data.parkingInfo ?? null,
        terms: data.terms ?? null,
        stallCategories: data.stallCategories ?? null,
        maxStalls: data.stalls.length,
      },
    });

    if (data.stalls.length > 0) {
      await prisma.stall.createMany({
        data: data.stalls.map((s) => ({
          eventId: event.id,
          stallNumber: s.stallNumber,
          name: s.name ?? null,
          type: s.type,
          size: s.size,
          price: s.price,
          positionX: s.positionX,
          positionY: s.positionY,
          width: s.width,
          height: s.height,
          stallCategory: s.stallCategory ?? null,
          amenities: s.amenities ?? null,
          notes: s.notes ?? null,
          status: "AVAILABLE",
        })),
      });
    }

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    console.error("Template clone error:", error);
    return NextResponse.json({ error: "Failed to clone template" }, { status: 500 });
  }
}
