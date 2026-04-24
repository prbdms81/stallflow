"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Calendar, ShoppingBag,
  MessageSquare, Bell, ArrowLeft, User, IndianRupee,
  QrCode, FileText, MapPin, UtensilsCrossed, Repeat, Star, Settings, TrendingUp, Users, Compass, Gift, CreditCard,
  MessageCircle, BarChart2, FileSpreadsheet, Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const vendorLinks = [
  { href: "/dashboard/vendor", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/vendor/bookings", label: "My Bookings", icon: ShoppingBag },
  { href: "/dashboard/vendor/earnings", label: "My Earnings", icon: IndianRupee },
  { href: "/dashboard/vendor/profile", label: "My Profile", icon: User },
  { href: "/dashboard/vendor/gate-pass", label: "Gate Passes", icon: QrCode },
  { href: "/dashboard/vendor/documents", label: "Documents", icon: FileText },
  { href: "/dashboard/vendor/menu", label: "Stall Menu & QR", icon: UtensilsCrossed },
  { href: "/dashboard/vendor/subscriptions", label: "Subscriptions", icon: Repeat },
  { href: "/dashboard/vendor/calendar", label: "My Calendar", icon: Calendar },
  { href: "/dashboard/vendor/discover", label: "Discover Events", icon: Compass },
  { href: "/dashboard/vendor/reviews", label: "My Reviews", icon: Star },
  { href: "/dashboard/vendor/loyalty", label: "Loyalty & Referral", icon: Gift },
  { href: "/dashboard/vendor/bnpl", label: "Pay After Event", icon: CreditCard },
  { href: "/dashboard/vendor/msme-report", label: "MSME Report", icon: FileSpreadsheet },
  { href: "/dashboard/vendor/revenue-predict", label: "Revenue Predictor", icon: TrendingUp },
  { href: "/dashboard/vendor/notifications", label: "Notifications", icon: Settings },
  { href: "/demand", label: "Demand Map", icon: TrendingUp },
  { href: "/dashboard/messages", label: "Messages", icon: MessageSquare },
];

const managerLinks = [
  { href: "/dashboard/manager", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/manager/events/new", label: "Create Event", icon: Calendar },
  { href: "/dashboard/manager/venues", label: "Browse Venues", icon: MapPin },
  { href: "/dashboard/manager/templates", label: "Event Templates", icon: FileText },
  { href: "/dashboard/manager/reviews", label: "Vendor Reviews", icon: Star },
  { href: "/dashboard/manager#team", label: "Team Access", icon: Users },
  { href: "/dashboard/manager/demand", label: "Resident Demand", icon: BarChart2 },
  { href: "/demand", label: "Demand Map", icon: TrendingUp },
  { href: "/dashboard/admin/whatsapp", label: "WhatsApp Bot", icon: MessageCircle },
  { href: "/dashboard/messages", label: "Messages", icon: MessageSquare },
];

const adminLinks = [
  { href: "/dashboard/admin", label: "My Venues", icon: Building2 },
  { href: "/demand", label: "Demand Map", icon: TrendingUp },
  { href: "/dashboard/admin/whatsapp", label: "WhatsApp Bot", icon: MessageCircle },
  { href: "/dashboard/messages", label: "Messages", icon: MessageSquare },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const pathname = usePathname();

  const links = session?.user?.role === "EVENT_MANAGER"
    ? managerLinks
    : session?.user?.role === "VENUE_ADMIN"
    ? adminLinks
    : vendorLinks;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-64 bg-white border-r flex-col">
        <div className="p-4 border-b">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <span className="text-xl font-bold text-gray-900">
              Stall<span className="text-indigo-600">Mate</span>
            </span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                pathname === link.href
                  ? "bg-indigo-50 text-indigo-600"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <link.icon className="h-5 w-5" />
              <span>{link.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t">
          <Link href="/" className="flex items-center space-x-2 text-sm text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Site</span>
          </Link>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <header className="bg-white border-b px-6 py-3 flex items-center justify-between">
          <div className="lg:hidden">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">S</span>
              </div>
              <span className="font-bold text-gray-900">StallMate</span>
            </Link>
          </div>
          <div className="hidden lg:block" />
          <div className="flex items-center space-x-4">
            <Link href="/dashboard/messages" className="relative p-2 text-gray-400 hover:text-gray-600">
              <Bell className="h-5 w-5" />
            </Link>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-indigo-600" />
              </div>
              <div className="hidden sm:block">
                <div className="text-sm font-medium text-gray-900">{session?.user?.name}</div>
                <div className="text-xs text-gray-500 capitalize">{session?.user?.role?.toLowerCase().replace("_", " ")}</div>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 sm:p-6 pb-24 lg:pb-6">{children}</main>
      </div>

      {/* Mobile bottom nav */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-40">
        <div className="flex justify-around py-2">
          {links.slice(0, 4).map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex flex-col items-center py-2 px-3 text-xs",
                pathname === link.href ? "text-indigo-600" : "text-gray-500"
              )}
            >
              <link.icon className="h-5 w-5 mb-0.5" />
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
