"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const categoryInfo: Record<string, { name: string; description: string }> = {
  corporate: { name: "Corporate Events", description: "Stall opportunities at IT parks, tech campuses, and corporate offices. Monday to Friday events." },
  "gated-community": { name: "Gated Community Events", description: "Weekend bazaars and markets at residential gated communities across Hyderabad." },
  wedding: { name: "Wedding Exhibitions", description: "Showcase your products at wedding expos and bridal exhibitions." },
  "weekend-market": { name: "Weekend Markets", description: "Regular weekend flea markets and pop-up shops." },
  "food-festival": { name: "Food Festivals", description: "Food carnivals, street food festivals, and culinary events." },
  "trade-fair": { name: "Trade Fairs", description: "B2B and B2C trade exhibitions and industry fairs." },
};

export default function CategoryPage() {
  const params = useParams();
  const slug = params.slug as string;
  const info = categoryInfo[slug] || { name: slug, description: "" };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href="/" className="inline-flex items-center text-sm text-gray-500 hover:text-indigo-600 mb-6">
        <ArrowLeft className="h-4 w-4 mr-1" /> Home
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{info.name}</h1>
        <p className="text-gray-600 mt-1">{info.description}</p>
      </div>

      <div className="text-center py-16 bg-gray-50 rounded-xl">
        <p className="text-gray-500">Events in this category will appear here once published.</p>
        <Link href="/events" className="text-indigo-600 hover:underline text-sm mt-2 inline-block">
          Browse all events
        </Link>
      </div>
    </div>
  );
}
