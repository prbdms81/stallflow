"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Star,
  ShieldCheck,
  Award,
  Repeat,
  Calendar,
  ArrowLeft,
  Phone,
  Building2,
  UtensilsCrossed,
  X,
  MapPin,
  FileCheck,
  TrendingUp,
  Clock,
  BadgeCheck,
  Users,
  Camera,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { formatDate } from "@/lib/utils";

interface VendorDocument {
  type: string;
  isVerified: boolean;
  expiresAt: string | null;
}

interface EventHistoryItem {
  eventId: string;
  eventTitle: string;
  startDate: string;
  endDate: string;
  eventType: string;
  venueName: string;
  venueCity: string;
  venueArea: string | null;
  categoryName: string;
  stallCategory: string | null;
}

interface VendorDetail {
  id: string;
  userId: string;
  businessName: string;
  category: string;
  description: string | null;
  logo: string | null;
  experience: number;
  rating: number;
  totalEvents: number;
  isTrusted: boolean;
  trustScore: number;
  fssaiNumber: string | null;
  fssaiVerified: boolean;
  udyamNumber: string | null;
  stallPhotos: string | null;
  socialLinks: string | null;
  repeatBookings: number;
  repeatBookingPct: number;
  uniqueVenues: number;
  verifiedDocsCount: number;
  totalDocs: number;
  documents: VendorDocument[];
  user: {
    id: string;
    name: string;
    avatar: string | null;
    phone: string | null;
    company: string | null;
    createdAt: string;
  };
  eventHistory: EventHistoryItem[];
  reviews: {
    id: string;
    rating: number;
    title: string | null;
    comment: string | null;
    authorName: string;
    authorAvatar: string | null;
    eventTitle: string;
    createdAt: string;
  }[];
}

// Trust Score Ring component
function TrustScoreRing({ score }: { score: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getColor = (s: number) => {
    if (s >= 80) return { stroke: "#16a34a", bg: "text-green-600", label: "Excellent" };
    if (s >= 60) return { stroke: "#2563eb", bg: "text-blue-600", label: "Good" };
    if (s >= 40) return { stroke: "#f59e0b", bg: "text-amber-600", label: "Building" };
    return { stroke: "#9ca3af", bg: "text-gray-500", label: "New" };
  };

  const { stroke, bg, label } = getColor(score);

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-32">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="8" />
          <circle
            cx="60" cy="60" r={radius} fill="none"
            stroke={stroke} strokeWidth="8" strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-3xl font-bold ${bg}`}>{score}</span>
          <span className="text-xs text-gray-400">/ 100</span>
        </div>
      </div>
      <span className={`text-sm font-medium mt-1 ${bg}`}>{label}</span>
      <span className="text-xs text-gray-400">Trust Score</span>
    </div>
  );
}

// Badge pill component
function VerificationBadge({
  icon: Icon,
  label,
  verified,
}: {
  icon: React.ElementType;
  label: string;
  verified: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border ${
        verified
          ? "bg-green-50 border-green-200 text-green-700"
          : "bg-gray-50 border-gray-200 text-gray-400"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
      {verified && <BadgeCheck className="h-3 w-3 text-green-500" />}
    </span>
  );
}

const DOC_TYPE_LABELS: Record<string, string> = {
  FSSAI: "FSSAI",
  GST: "GST",
  TRADE_LICENSE: "Trade License",
  ID_PROOF: "ID Proof",
  VEHICLE_RC: "Vehicle RC",
  FIRE_NOC: "Fire NOC",
};

const EVENT_TYPE_LABELS: Record<string, string> = {
  WEEKDAY_CORPORATE: "Corporate",
  WEEKEND_COMMUNITY: "Community",
  WEDDING: "Wedding",
  EXHIBITION: "Exhibition",
  FESTIVAL: "Festival",
};

export default function VendorProfilePage() {
  const { vendorId } = useParams();
  const [vendor, setVendor] = useState<VendorDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [showAllEvents, setShowAllEvents] = useState(false);

  useEffect(() => {
    fetch(`/api/vendors/${vendorId}`)
      .then((res) => res.json())
      .then((data) => setVendor(data.vendor || null))
      .catch(() => setVendor(null))
      .finally(() => setLoading(false));
  }, [vendorId]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-48 bg-gray-200 rounded-xl" />
          <div className="h-6 bg-gray-200 rounded w-1/3" />
          <div className="h-4 bg-gray-100 rounded w-2/3" />
        </div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-semibold text-gray-900">Vendor not found</h2>
        <Link href="/vendors" className="text-indigo-600 mt-2 inline-block">
          Back to vendors
        </Link>
      </div>
    );
  }

  const photos: string[] = vendor.stallPhotos ? JSON.parse(vendor.stallPhotos) : [];
  const socialLinks = vendor.socialLinks ? JSON.parse(vendor.socialLinks) : {};
  const visibleEvents = showAllEvents ? vendor.eventHistory : vendor.eventHistory.slice(0, 5);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Back */}
      <Link
        href="/vendors"
        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-1" /> All Vendors
      </Link>

      {/* ── Profile Header ── */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 sm:p-8 text-white mb-8">
        <div className="flex flex-col sm:flex-row items-start gap-5">
          {/* Avatar */}
          {vendor.logo ? (
            <img
              src={vendor.logo}
              alt={vendor.businessName}
              className="h-20 w-20 rounded-full object-cover border-3 border-white/30 shadow-lg flex-shrink-0"
            />
          ) : (
            <div className="h-20 w-20 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <span className="text-2xl font-bold">{vendor.businessName.charAt(0)}</span>
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold">{vendor.businessName}</h1>
              {vendor.isTrusted && (
                <span className="bg-green-400/20 border border-green-300/40 text-green-100 text-xs px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5" /> Trusted
                </span>
              )}
            </div>
            <p className="text-indigo-100 mt-1">{vendor.category}</p>
            {vendor.description && (
              <p className="text-white/80 mt-2 text-sm leading-relaxed line-clamp-3">
                {vendor.description}
              </p>
            )}

            {/* Quick badges row */}
            <div className="flex flex-wrap gap-2 mt-3">
              {vendor.fssaiNumber && (
                <span className="bg-blue-400/20 border border-blue-300/40 text-blue-100 text-xs px-3 py-1 rounded-full flex items-center gap-1">
                  <UtensilsCrossed className="h-3.5 w-3.5" /> FSSAI{" "}
                  {vendor.fssaiVerified ? "Verified" : "Submitted"}
                </span>
              )}
              {vendor.udyamNumber && (
                <span className="bg-amber-400/20 border border-amber-300/40 text-amber-100 text-xs px-3 py-1 rounded-full flex items-center gap-1">
                  <FileCheck className="h-3.5 w-3.5" /> Udyam Registered
                </span>
              )}
              {vendor.experience > 0 && (
                <span className="bg-white/10 border border-white/20 text-white/90 text-xs px-3 py-1 rounded-full flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" /> {vendor.experience}+ yrs experience
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Trust Score + Key Metrics ── */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
        {/* Trust Score Ring */}
        <Card className="sm:row-span-2">
          <CardContent className="flex items-center justify-center py-6">
            <TrustScoreRing score={vendor.trustScore} />
          </CardContent>
        </Card>

        {/* Metric cards */}
        <Card>
          <CardContent className="text-center py-5">
            <Award className="h-6 w-6 text-indigo-500 mx-auto mb-1" />
            <div className="text-2xl font-bold text-gray-900">{vendor.totalEvents}</div>
            <div className="text-xs text-gray-500 mt-0.5">Events Done</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="text-center py-5">
            <Star className="h-6 w-6 text-amber-500 mx-auto mb-1 fill-current" />
            <div className="text-2xl font-bold text-gray-900">
              {vendor.rating > 0 ? vendor.rating.toFixed(1) : "—"}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              Avg Rating {reviews_count(vendor) > 0 && `(${reviews_count(vendor)})`}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="text-center py-5">
            <Repeat className="h-6 w-6 text-green-500 mx-auto mb-1" />
            <div className="text-2xl font-bold text-gray-900">{vendor.repeatBookingPct}%</div>
            <div className="text-xs text-gray-500 mt-0.5">Repeat Rate</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="text-center py-5">
            <MapPin className="h-6 w-6 text-rose-500 mx-auto mb-1" />
            <div className="text-2xl font-bold text-gray-900">{vendor.uniqueVenues}</div>
            <div className="text-xs text-gray-500 mt-0.5">Venues Served</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="text-center py-5">
            <FileCheck className="h-6 w-6 text-teal-500 mx-auto mb-1" />
            <div className="text-2xl font-bold text-gray-900">
              {vendor.verifiedDocsCount}/{vendor.totalDocs}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">Docs Verified</div>
          </CardContent>
        </Card>
      </div>

      {/* ── Verification Badges ── */}
      {vendor.documents.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Verifications</h2>
          <div className="flex flex-wrap gap-2">
            {vendor.fssaiNumber && (
              <VerificationBadge
                icon={UtensilsCrossed}
                label="FSSAI License"
                verified={vendor.fssaiVerified}
              />
            )}
            {vendor.udyamNumber && (
              <VerificationBadge icon={Building2} label="Udyam Registration" verified={true} />
            )}
            {vendor.documents.map((doc, i) => (
              <VerificationBadge
                key={i}
                icon={FileCheck}
                label={DOC_TYPE_LABELS[doc.type] || doc.type}
                verified={doc.isVerified}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Contact Info ── */}
      <Card className="mb-8">
        <CardContent className="py-4">
          <div className="flex flex-wrap gap-4 text-sm">
            {vendor.user.phone && (
              <a
                href={`tel:${vendor.user.phone}`}
                className="flex items-center gap-1.5 text-gray-600 hover:text-indigo-600"
              >
                <Phone className="h-4 w-4" /> {vendor.user.phone}
              </a>
            )}
            {socialLinks.whatsapp && (
              <a
                href={`https://wa.me/${socialLinks.whatsapp.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-gray-600 hover:text-green-600"
              >
                <Users className="h-4 w-4" /> WhatsApp
              </a>
            )}
            {socialLinks.instagram && (
              <a
                href={`https://instagram.com/${socialLinks.instagram.replace("@", "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-gray-600 hover:text-pink-600"
              >
                <Camera className="h-4 w-4" /> @{socialLinks.instagram.replace("@", "")}
              </a>
            )}
            {vendor.user.company && (
              <span className="flex items-center gap-1.5 text-gray-600">
                <Building2 className="h-4 w-4" /> {vendor.user.company}
              </span>
            )}
            <span className="flex items-center gap-1.5 text-gray-400">
              <Calendar className="h-4 w-4" /> Member since {formatDate(vendor.user.createdAt)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* ── Verified Event History ── */}
      {vendor.eventHistory.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-indigo-500" />
            Verified Event History ({vendor.eventHistory.length})
          </h2>
          <div className="space-y-3">
            {visibleEvents.map((event, i) => (
              <Card key={i}>
                <CardContent className="py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={`/events/${event.eventId}`}
                        className="font-medium text-gray-900 hover:text-indigo-600 text-sm"
                      >
                        {event.eventTitle}
                      </Link>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {event.venueName}
                          {event.venueArea && `, ${event.venueArea}`}
                        </span>
                        <span>{event.categoryName}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-xs text-gray-500">{formatDate(event.startDate)}</div>
                      <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600">
                        {EVENT_TYPE_LABELS[event.eventType] || event.eventType}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {vendor.eventHistory.length > 5 && (
            <button
              onClick={() => setShowAllEvents(!showAllEvents)}
              className="mt-3 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              {showAllEvents
                ? "Show less"
                : `Show all ${vendor.eventHistory.length} events`}
            </button>
          )}
        </div>
      )}

      {/* ── Stall Photos ── */}
      {photos.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Camera className="h-5 w-5 text-indigo-500" />
            Past Stall Photos ({photos.length})
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {photos.map((photo, i) => (
              <button
                key={i}
                onClick={() => setSelectedPhoto(photo)}
                className="aspect-[4/3] rounded-xl overflow-hidden bg-gray-100 hover:opacity-90 transition-opacity"
              >
                <img
                  src={photo}
                  alt={`Stall photo ${i + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Photo Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <button
            onClick={() => setSelectedPhoto(null)}
            className="absolute top-4 right-4 text-white bg-black/40 rounded-full p-2"
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={selectedPhoto}
            alt="Stall photo"
            className="max-w-full max-h-[85vh] rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* ── Reviews ── */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Star className="h-5 w-5 text-amber-500" />
          Reviews {vendor.reviews.length > 0 && `(${vendor.reviews.length})`}
        </h2>

        {/* Rating breakdown */}
        {vendor.reviews.length > 0 && (
          <Card className="mb-4">
            <CardContent className="py-4">
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">
                    {vendor.rating.toFixed(1)}
                  </div>
                  <div className="flex items-center gap-0.5 mt-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < Math.round(vendor.rating)
                            ? "text-amber-500 fill-current"
                            : "text-gray-200"
                        }`}
                      />
                    ))}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {vendor.reviews.length} review{vendor.reviews.length !== 1 ? "s" : ""}
                  </div>
                </div>
                <div className="flex-1 space-y-1.5">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = vendor.reviews.filter((r) => r.rating === star).length;
                    const pct =
                      vendor.reviews.length > 0
                        ? (count / vendor.reviews.length) * 100
                        : 0;
                    return (
                      <div key={star} className="flex items-center gap-2 text-xs">
                        <span className="w-3 text-gray-500">{star}</span>
                        <Star className="h-3 w-3 text-amber-400 fill-current" />
                        <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-amber-400 h-full rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-6 text-right text-gray-400">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {vendor.reviews.length > 0 ? (
          <div className="space-y-3">
            {vendor.reviews.map((review) => (
              <Card key={review.id}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {review.authorAvatar ? (
                        <img
                          src={review.authorAvatar}
                          alt={review.authorName}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-500">
                          {review.authorName.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-gray-900 text-sm">
                          {review.authorName}
                        </div>
                        <div className="text-xs text-gray-400">{review.eventTitle}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3.5 w-3.5 ${
                            i < review.rating
                              ? "text-amber-500 fill-current"
                              : "text-gray-200"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  {review.title && (
                    <p className="text-sm font-medium text-gray-800 mb-1">{review.title}</p>
                  )}
                  {review.comment && (
                    <p className="text-sm text-gray-600">{review.comment}</p>
                  )}
                  <div className="text-xs text-gray-400 mt-2">
                    {formatDate(review.createdAt)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <Star className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">No reviews yet</p>
          </div>
        )}
      </div>
    </div>
  );
}

function reviews_count(vendor: VendorDetail): number {
  return vendor.reviews.length;
}
