"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  ShieldCheck,
  ShieldX,
  MapPin,
  Calendar,
  Car,
  Phone,
  Store,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  UtensilsCrossed,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { formatDate } from "@/lib/utils";

interface VerifyResult {
  valid: boolean;
  gatePass?: {
    vendorName: string;
    businessName: string;
    eventTitle: string;
    venueName: string;
    stallNumber: string;
    vehicleNumber: string | null;
    vehicleType: string | null;
    validFrom: string;
    validTo: string;
    status: string;
    bookingStatus: string;
    paymentStatus: string;
    vendorPhone: string | null;
    vendorCategory: string | null;
    vendorLogo: string | null;
    isTrusted: boolean;
    trustScore: number;
    hasFssai: boolean;
  };
  error?: string;
}

export default function VerifyGatePassPage() {
  const { code } = useParams();
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/gate-pass/verify?code=${code}`)
      .then((r) => r.json())
      .then((d) => setResult(d))
      .catch(() => setResult({ valid: false, error: "Verification failed" }))
      .finally(() => setLoading(false));
  }, [code]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-500 mx-auto mb-3" />
          <p className="text-gray-500">Verifying gate pass...</p>
        </div>
      </div>
    );
  }

  if (!result || !result.gatePass) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Card className="max-w-sm w-full border-red-200">
          <CardContent className="py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <ShieldX className="h-8 w-8 text-red-500" />
            </div>
            <h1 className="text-xl font-bold text-red-600 mb-2">Invalid Gate Pass</h1>
            <p className="text-gray-500 text-sm">
              {result?.error || "This gate pass could not be verified."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const gp = result.gatePass;
  const isValid = result.valid;
  const now = new Date();
  const validFrom = new Date(gp.validFrom);
  const validTo = new Date(gp.validTo);
  const isExpired = now > validTo;
  const isEarly = now < validFrom;

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-sm mx-auto">
        {/* Status Banner */}
        <Card
          className={`mb-6 border-2 ${
            isValid
              ? "border-green-300 bg-green-50"
              : isExpired
              ? "border-gray-300 bg-gray-50"
              : "border-red-300 bg-red-50"
          }`}
        >
          <CardContent className="py-6 text-center">
            {isValid ? (
              <>
                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                  <ShieldCheck className="h-10 w-10 text-green-600" />
                </div>
                <h1 className="text-2xl font-bold text-green-700">VERIFIED</h1>
                <p className="text-green-600 text-sm mt-1">This vendor is authorized to enter</p>
              </>
            ) : isExpired ? (
              <>
                <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                  <Clock className="h-10 w-10 text-gray-500" />
                </div>
                <h1 className="text-2xl font-bold text-gray-600">EXPIRED</h1>
                <p className="text-gray-500 text-sm mt-1">This gate pass is no longer valid</p>
              </>
            ) : isEarly ? (
              <>
                <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-3">
                  <Clock className="h-10 w-10 text-amber-500" />
                </div>
                <h1 className="text-2xl font-bold text-amber-600">NOT YET VALID</h1>
                <p className="text-amber-600 text-sm mt-1">
                  Valid from {formatDate(gp.validFrom)}
                </p>
              </>
            ) : (
              <>
                <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
                  <XCircle className="h-10 w-10 text-red-500" />
                </div>
                <h1 className="text-2xl font-bold text-red-600">INVALID</h1>
                <p className="text-red-500 text-sm mt-1">This gate pass cannot be verified</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Vendor Info */}
        <Card className="mb-4">
          <CardContent className="py-4">
            <div className="flex items-center gap-3 mb-3">
              {gp.vendorLogo ? (
                <img
                  src={gp.vendorLogo}
                  alt={gp.businessName}
                  className="h-12 w-12 rounded-full object-cover"
                />
              ) : (
                <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
                  <Store className="h-6 w-6 text-indigo-500" />
                </div>
              )}
              <div>
                <h2 className="font-bold text-gray-900">{gp.businessName}</h2>
                <p className="text-sm text-gray-500">{gp.vendorName}</p>
              </div>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-2 mb-3">
              {gp.isTrusted && (
                <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full">
                  <ShieldCheck className="h-3 w-3" /> Trusted Vendor
                </span>
              )}
              {gp.hasFssai && (
                <span className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full">
                  <UtensilsCrossed className="h-3 w-3" /> FSSAI
                </span>
              )}
              {gp.trustScore > 0 && (
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    gp.trustScore >= 80
                      ? "bg-green-100 text-green-700"
                      : gp.trustScore >= 60
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  Score: {gp.trustScore}
                </span>
              )}
            </div>

            {gp.vendorCategory && (
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                {gp.vendorCategory}
              </span>
            )}
          </CardContent>
        </Card>

        {/* Pass Details */}
        <Card className="mb-4">
          <CardContent className="py-4 space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="h-4 w-4 text-indigo-500 flex-shrink-0" />
              <div>
                <div className="font-medium text-gray-900">{gp.eventTitle}</div>
                <div className="text-gray-500">
                  {formatDate(gp.validFrom)}
                  {gp.validFrom !== gp.validTo && ` — ${formatDate(gp.validTo)}`}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <MapPin className="h-4 w-4 text-green-500 flex-shrink-0" />
              <div>
                <div className="font-medium text-gray-900">{gp.venueName}</div>
                <div className="text-gray-500">Stall #{gp.stallNumber}</div>
              </div>
            </div>

            {gp.vehicleNumber && (
              <div className="flex items-center gap-3 text-sm">
                <Car className="h-4 w-4 text-blue-500 flex-shrink-0" />
                <div>
                  <div className="font-medium text-gray-900">{gp.vehicleNumber}</div>
                  <div className="text-gray-500">
                    {gp.vehicleType?.replace("_", " ")}
                  </div>
                </div>
              </div>
            )}

            {gp.vendorPhone && (
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <a
                  href={`tel:${gp.vendorPhone}`}
                  className="text-indigo-600 hover:underline"
                >
                  {gp.vendorPhone}
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Status */}
        <Card>
          <CardContent className="py-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Payment</span>
              <span
                className={`flex items-center gap-1 font-medium ${
                  gp.paymentStatus === "PAID" ? "text-green-600" : "text-amber-600"
                }`}
              >
                {gp.paymentStatus === "PAID" ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <Clock className="h-4 w-4" />
                )}
                {gp.paymentStatus}
              </span>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-gray-400 mt-6">
          Verified by StallMate
        </p>
      </div>
    </div>
  );
}
