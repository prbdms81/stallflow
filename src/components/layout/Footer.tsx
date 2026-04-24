import Link from "next/link";
import { MapPin, Mail, Phone } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <span className="text-xl font-bold text-white">
                Stall<span className="text-indigo-400">Mate</span>
              </span>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              India&apos;s premier platform for discovering and booking stalls at
              community events, corporate expos, and wedding exhibitions.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span>Hyderabad, Telangana</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <span>support@stallmate.in</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4" />
                <span>+91 9876543210</span>
              </div>
            </div>
          </div>

          {/* For Vendors */}
          <div>
            <h3 className="text-white font-semibold mb-4">For Vendors</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/events" className="hover:text-white transition-colors">Browse Events</Link></li>
              <li><Link href="/register" className="hover:text-white transition-colors">Register as Vendor</Link></li>
              <li><Link href="/communities" className="hover:text-white transition-colors">Communities</Link></li>
              <li><Link href="/categories/corporate" className="hover:text-white transition-colors">Categories</Link></li>
            </ul>
          </div>

          {/* For Organizers */}
          <div>
            <h3 className="text-white font-semibold mb-4">For Organizers</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/register" className="hover:text-white transition-colors">List Your Event</Link></li>
              <li><Link href="/register" className="hover:text-white transition-colors">Manage Stalls</Link></li>
              <li><Link href="/register" className="hover:text-white transition-colors">Venue Dashboard</Link></li>
              <li><Link href="/register" className="hover:text-white transition-colors">Pricing</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-white font-semibold mb-4">Support</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="hover:text-white transition-colors">Help Center</Link></li>
              <li><Link href="/" className="hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link href="/" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/" className="hover:text-white transition-colors">Refund Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} StallMate. All rights reserved. Made with love in Hyderabad.</p>
        </div>
      </div>
    </footer>
  );
}
