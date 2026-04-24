"use client";

import { useState, useEffect } from "react";
import {
  Package, Loader2, MapPin,
  Tent, ShoppingBag, Armchair, Lightbulb, MessageCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/utils";

interface SetupKit {
  id: string;
  name: string;
  description: string | null;
  items: string;
  price: number;
  venue: { name: string };
}

const itemIcons: Record<string, typeof Tent> = {
  tent: Tent,
  table: Armchair,
  chair: Armchair,
  light: Lightbulb,
  banner: ShoppingBag,
};

function getItemIcon(item: string) {
  const lower = item.toLowerCase();
  for (const [key, Icon] of Object.entries(itemIcons)) {
    if (lower.includes(key)) return Icon;
  }
  return Package;
}

export default function SetupKitsPage() {
  const [kits, setKits] = useState<SetupKit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/setup-kits")
      .then((r) => r.json())
      .then((d) => setKits(d.kits || []))
      .catch(() => setKits([]))
      .finally(() => setLoading(false));
  }, []);

  const enquireOnWhatsApp = (kit: SetupKit) => {
    const items = (() => { try { return JSON.parse(kit.items); } catch { return [kit.items]; } })() as string[];
    const msg = [
      `Hi! I'm interested in the "${kit.name}" setup kit`,
      ``,
      `Venue: ${kit.venue.name}`,
      `Price: ${formatCurrency(kit.price)}`,
      `Items: ${items.join(", ")}`,
      ``,
      `Can you confirm availability?`,
    ].join("\n");
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  };

  // Group by venue
  const byVenue: Record<string, SetupKit[]> = {};
  kits.forEach((kit) => {
    const venueName = kit.venue.name;
    if (!byVenue[venueName]) byVenue[venueName] = [];
    byVenue[venueName].push(kit);
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Setup Kits</h1>
        <p className="text-sm text-gray-500">Rent tent, table, chair & more — ready at the venue</p>
      </div>

      {/* Value Prop */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-5 text-white mb-6">
        <div className="flex items-start gap-3">
          <Package className="h-7 w-7 flex-shrink-0" />
          <div>
            <h2 className="font-bold text-lg">Skip the Hassle</h2>
            <p className="text-indigo-100 text-sm mt-1">
              Don&apos;t carry heavy setup — rent everything at the venue.
              Tables, chairs, tents, lights, and banners all ready when you arrive.
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="bg-white/20 px-3 py-1 rounded-full text-xs">Pre-installed</span>
              <span className="bg-white/20 px-3 py-1 rounded-full text-xs">No transport cost</span>
              <span className="bg-white/20 px-3 py-1 rounded-full text-xs">One-click booking</span>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
        </div>
      ) : Object.keys(byVenue).length > 0 ? (
        <div className="space-y-6">
          {Object.entries(byVenue).map(([venueName, venueKits]) => (
            <div key={venueName}>
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="h-4 w-4 text-indigo-500" />
                <h2 className="text-sm font-semibold text-gray-700">{venueName}</h2>
                <span className="text-xs text-gray-400">({venueKits.length} kit{venueKits.length !== 1 ? "s" : ""})</span>
              </div>

              <div className="space-y-3">
                {venueKits.map((kit) => {
                  const items: string[] = (() => { try { return JSON.parse(kit.items); } catch { return [kit.items]; } })();
                  return (
                    <Card key={kit.id}>
                      <CardContent className="py-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-gray-900">{kit.name}</h3>
                            {kit.description && (
                              <p className="text-xs text-gray-500 mt-0.5">{kit.description}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-indigo-600">
                              {formatCurrency(kit.price)}
                            </div>
                            <div className="text-[10px] text-gray-400">per event</div>
                          </div>
                        </div>

                        {/* Items grid */}
                        <div className="grid grid-cols-2 gap-2 mb-3">
                          {items.map((item, i) => {
                            const Icon = getItemIcon(item);
                            return (
                              <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                                <Icon className="h-4 w-4 text-indigo-400" />
                                <span className="text-sm text-gray-700">{item}</span>
                              </div>
                            );
                          })}
                        </div>

                        <button
                          onClick={() => enquireOnWhatsApp(kit)}
                          className="w-full flex items-center justify-center gap-1.5 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                          <MessageCircle className="h-4 w-4" /> Enquire on WhatsApp
                        </button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900">No setup kits available yet</h3>
          <p className="text-gray-500 text-sm mt-1">
            Venue managers will add rental kits here. Check back before your next event!
          </p>
        </div>
      )}
    </div>
  );
}
