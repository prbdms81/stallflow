export interface ScoreBreakdown {
  total: number;
  paymentScore: number;
  attendanceScore: number;
  reviewScore: number;
  docScore: number;
  tier: "Bronze" | "Silver" | "Gold" | "Platinum";
  perks: string[];
}

export function computeVendorScore({
  totalBookings,
  paidBookings,
  completedBookings,
  cancelledBookings,
  avgRating,
  reviewCount,
  verifiedDocs,
  totalDocs,
}: {
  totalBookings: number;
  paidBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  avgRating: number;
  reviewCount: number;
  verifiedDocs: number;
  totalDocs: number;
}): ScoreBreakdown {
  const paymentRate = totalBookings > 0 ? paidBookings / totalBookings : 0;
  const paymentScore = Math.round(paymentRate * 30);

  const attempted = totalBookings - cancelledBookings;
  const attendanceRate = attempted > 0 ? completedBookings / attempted : 0;
  const attendanceScore = Math.round(attendanceRate * 25);

  const reviewScore = reviewCount > 0 ? Math.round((avgRating / 5) * 25) : 0;

  const docRate = totalDocs > 0 ? verifiedDocs / totalDocs : 0;
  const docScore = Math.round(docRate * 20);

  const total = Math.min(paymentScore + attendanceScore + reviewScore + docScore, 100);

  let tier: ScoreBreakdown["tier"] = "Bronze";
  if (total >= 85) tier = "Platinum";
  else if (total >= 65) tier = "Gold";
  else if (total >= 40) tier = "Silver";

  const perks: string[] = [];
  if (total >= 40) perks.push("Priority notifications for new events");
  if (total >= 65) perks.push("Reduced deposit (50% advance only)");
  if (total >= 65) perks.push("Featured in vendor discovery");
  if (total >= 85) perks.push("Early access to premium events");
  if (total >= 85) perks.push("Trusted badge on profile");

  return { total, paymentScore, attendanceScore, reviewScore, docScore, tier, perks };
}
