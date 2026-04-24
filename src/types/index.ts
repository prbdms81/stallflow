import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
      image?: string;
    };
  }

  interface User {
    role: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
  }
}

export type UserRole = "VENDOR" | "EVENT_MANAGER" | "VENUE_ADMIN" | "ADMIN";

export type EventStatus = "DRAFT" | "PUBLISHED" | "LIVE" | "COMPLETED" | "CANCELLED";

export type EventType =
  | "WEEKDAY_CORPORATE"
  | "WEEKEND_COMMUNITY"
  | "WEDDING"
  | "EXHIBITION"
  | "FESTIVAL";

export type StallStatus = "AVAILABLE" | "BOOKED" | "RESERVED" | "BLOCKED";

export type StallType = "STANDARD" | "PREMIUM" | "CORNER" | "FOOD_COURT" | "KIOSK";

export type BookingStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "REFUNDED" | "COMPLETED";

export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";

export type VenueType =
  | "GATED_COMMUNITY"
  | "CORPORATE_OFFICE"
  | "CONVENTION_CENTER"
  | "HOTEL"
  | "OUTDOOR";

export type ParkingType = "TWO_WHEELER" | "FOUR_WHEELER" | "TRUCK" | "VAN";
