import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "INR"): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function generateBookingNumber(): string {
  const prefix = "SM";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-800",
    PUBLISHED: "bg-blue-100 text-blue-800",
    LIVE: "bg-green-100 text-green-800",
    COMPLETED: "bg-purple-100 text-purple-800",
    CANCELLED: "bg-red-100 text-red-800",
    PENDING: "bg-yellow-100 text-yellow-800",
    CONFIRMED: "bg-green-100 text-green-800",
    AVAILABLE: "bg-green-100 text-green-800",
    BOOKED: "bg-red-100 text-red-800",
    RESERVED: "bg-yellow-100 text-yellow-800",
    BLOCKED: "bg-gray-100 text-gray-800",
    PAID: "bg-green-100 text-green-800",
    FAILED: "bg-red-100 text-red-800",
    REFUNDED: "bg-orange-100 text-orange-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
}

export function getStallTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    STANDARD: "Standard",
    PREMIUM: "Premium",
    CORNER: "Corner",
    FOOD_COURT: "Food Court",
    KIOSK: "Kiosk",
  };
  return labels[type] || type;
}

export function getEventTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    WEEKDAY_CORPORATE: "Corporate (Weekday)",
    WEEKEND_COMMUNITY: "Community (Weekend)",
    WEDDING: "Wedding",
    EXHIBITION: "Exhibition",
    FESTIVAL: "Festival",
  };
  return labels[type] || type;
}

export function getVenueTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    GATED_COMMUNITY: "Gated Community",
    CORPORATE_OFFICE: "Corporate Office",
    CONVENTION_CENTER: "Convention Center",
    HOTEL: "Hotel",
    OUTDOOR: "Outdoor Venue",
  };
  return labels[type] || type;
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}

export function generateShareToken(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 8; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

export function generateUpiLink({
  upiId,
  payeeName,
  amount,
  transactionNote,
}: {
  upiId: string;
  payeeName: string;
  amount: number;
  transactionNote: string;
}): string {
  const params = new URLSearchParams({
    pa: upiId,
    pn: payeeName,
    am: amount.toFixed(2),
    tn: transactionNote,
    cu: "INR",
  });
  return `upi://pay?${params.toString()}`;
}
