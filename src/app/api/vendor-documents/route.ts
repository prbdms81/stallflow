import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const profile = await prisma.vendorProfile.findUnique({
      where: { userId: session.user.id },
    });
    if (!profile) return NextResponse.json({ error: "No vendor profile" }, { status: 404 });

    const documents = await prisma.vendorDocument.findMany({
      where: { vendorId: profile.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ documents });
  } catch (error) {
    console.error("Documents fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const profile = await prisma.vendorProfile.findUnique({
      where: { userId: session.user.id },
    });
    if (!profile) return NextResponse.json({ error: "No vendor profile" }, { status: 404 });

    const body = await request.json();
    const { type, documentNumber, fileUrl, expiresAt } = body;

    if (!type || !documentNumber) {
      return NextResponse.json({ error: "Type and document number required" }, { status: 400 });
    }

    const doc = await prisma.vendorDocument.create({
      data: {
        vendorId: profile.id,
        type,
        documentNumber,
        fileUrl: fileUrl || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    return NextResponse.json({ document: doc }, { status: 201 });
  } catch (error) {
    console.error("Document creation error:", error);
    return NextResponse.json({ error: "Failed to add document" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const docId = searchParams.get("id");
    if (!docId) return NextResponse.json({ error: "Document ID required" }, { status: 400 });

    const profile = await prisma.vendorProfile.findUnique({
      where: { userId: session.user.id },
    });
    if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const doc = await prisma.vendorDocument.findUnique({ where: { id: docId } });
    if (!doc || doc.vendorId !== profile.id) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    await prisma.vendorDocument.delete({ where: { id: docId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Document deletion error:", error);
    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 });
  }
}
