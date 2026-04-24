import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/gate-pass/verify?code=xxx — Public, no auth
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.json({ error: "QR code required" }, { status: 400 });
    }

    const gatePass = await prisma.gatePass.findUnique({
      where: { qrCode: code },
      include: {
        booking: {
          select: {
            status: true,
            paymentStatus: true,
            vendor: {
              select: {
                name: true,
                phone: true,
                vendorProfile: {
                  select: {
                    businessName: true,
                    category: true,
                    logo: true,
                    fssaiNumber: true,
                    fssaiVerified: true,
                    isTrusted: true,
                    trustScore: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!gatePass) {
      return NextResponse.json({ valid: false, error: "Gate pass not found" }, { status: 404 });
    }

    const now = new Date();
    const isValid =
      gatePass.status === "ACTIVE" &&
      now >= new Date(gatePass.validFrom) &&
      now <= new Date(gatePass.validTo);

    // Mark as USED if first scan
    if (isValid && gatePass.status === "ACTIVE") {
      await prisma.gatePass.update({
        where: { id: gatePass.id },
        data: { status: "USED" },
      });
    }

    const profile = gatePass.booking.vendor.vendorProfile;

    return NextResponse.json({
      valid: isValid || gatePass.status === "USED",
      gatePass: {
        vendorName: gatePass.vendorName,
        businessName: gatePass.businessName,
        eventTitle: gatePass.eventTitle,
        venueName: gatePass.venueName,
        stallNumber: gatePass.stallNumber,
        vehicleNumber: gatePass.vehicleNumber,
        vehicleType: gatePass.vehicleType,
        validFrom: gatePass.validFrom,
        validTo: gatePass.validTo,
        status: gatePass.status === "ACTIVE" ? "USED" : gatePass.status, // just marked as USED
        bookingStatus: gatePass.booking.status,
        paymentStatus: gatePass.booking.paymentStatus,
        // Vendor trust info for security
        vendorPhone: gatePass.booking.vendor.phone,
        vendorCategory: profile?.category || null,
        vendorLogo: profile?.logo || null,
        isTrusted: profile?.isTrusted || false,
        trustScore: profile?.trustScore || 0,
        hasFssai: !!profile?.fssaiNumber,
      },
    });
  } catch (error) {
    console.error("Gate pass verify error:", error);
    return NextResponse.json({ valid: false, error: "Verification failed" }, { status: 500 });
  }
}
