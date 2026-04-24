"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import {
  Menu,
  X,
  ChevronDown,
  User,
  LayoutDashboard,
  LogOut,
  Bell,
  Search,
} from "lucide-react";
import Button from "@/components/ui/Button";

const navLinks = [
  { href: "/events", label: "Events" },
  { href: "/communities", label: "Communities" },
  { href: "/vendors", label: "Vendors" },
  { href: "/calendar", label: "Calendar" },
  { href: "/swap", label: "Swap" },
  { href: "/benefits", label: "Benefits" },
];

export default function Navbar() {
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const getDashboardLink = () => {
    if (!session) return "/login";
    const role = session.user.role;
    if (role === "EVENT_MANAGER") return "/dashboard/manager";
    if (role === "VENUE_ADMIN") return "/dashboard/admin";
    return "/dashboard/vendor";
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <span className="text-xl font-bold text-gray-900">
                Stall<span className="text-indigo-600">Mate</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex ml-10 space-x-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-gray-600 hover:text-indigo-600 px-1 py-2 text-sm font-medium transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            <Link
              href="/events"
              className="hidden sm:flex items-center text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Search className="h-5 w-5" />
            </Link>

            {session ? (
              <>
                <Link href="/dashboard/messages" className="relative p-2 text-gray-400 hover:text-gray-600">
                  <Bell className="h-5 w-5" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                </Link>

                <div className="relative">
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-indigo-600"
                  >
                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-indigo-600" />
                    </div>
                    <span className="hidden md:block">{session.user.name}</span>
                    <ChevronDown className="h-4 w-4" />
                  </button>

                  {profileOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border py-1 z-50">
                      <Link
                        href={getDashboardLink()}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setProfileOpen(false)}
                      >
                        <LayoutDashboard className="h-4 w-4 mr-2" />
                        Dashboard
                      </Link>
                      <button
                        onClick={() => signOut()}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Login
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm">Sign Up</Button>
                </Link>
              </div>
            )}

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-3 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t">
          <div className="px-4 py-3 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block px-3 py-3 rounded-lg text-gray-600 hover:bg-gray-50"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/share-stall"
              className="block px-3 py-3 rounded-lg text-gray-600 hover:bg-gray-50"
              onClick={() => setMobileOpen(false)}
            >
              Find Partner
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
