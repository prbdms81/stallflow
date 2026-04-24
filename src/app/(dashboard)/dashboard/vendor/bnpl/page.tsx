"use client";

import { useEffect, useState } from "react";
import { CreditCard, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import toast from "react-hot-toast";

interface BNPLAgreement {
  id: string;
  amount: number;
  dueDate: string;
  status: string;
  settledAt: string | null;
  createdAt: string;
  booking: {
    id: string;
    bookingNumber: string;
    event: { id: string; title: string; endDate: string };
    stall: { stallNumber: string };
  };
}

function StatusBadge({ status, dueDate }: { status: string; dueDate: string }) {
  const now = new Date();
  const due = new Date(dueDate);
  const isOverdue = status === "PENDING" && due < now;

  if (isOverdue) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
        <AlertTriangle className="h-3 w-3" />
        OVERDUE
      </span>
    );
  }

  if (status === "SETTLED") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
        <CheckCircle className="h-3 w-3" />
        SETTLED
      </span>
    );
  }

  if (status === "DEFAULTED") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
        <AlertTriangle className="h-3 w-3" />
        DEFAULTED
      </span>
    );
  }

  // PENDING and not overdue
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
      <Clock className="h-3 w-3" />
      PENDING
    </span>
  );
}

export default function VendorBNPLPage() {
  const [agreements, setAgreements] = useState<BNPLAgreement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/bnpl")
      .then((res) => res.json())
      .then((data) => setAgreements(data.agreements || []))
      .catch(() => toast.error("Failed to load BNPL agreements"))
      .finally(() => setLoading(false));
  }, []);

  const totalUsed = agreements.length;
  const pendingAmount = agreements
    .filter((a) => a.status === "PENDING")
    .reduce((sum, a) => sum + a.amount, 0);
  const settledAmount = agreements
    .filter((a) => a.status === "SETTLED")
    .reduce((sum, a) => sum + a.amount, 0);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <CreditCard className="h-7 w-7 text-indigo-600" />
          <h1 className="text-2xl font-bold text-gray-900">Pay After Event</h1>
        </div>
        <p className="text-gray-500 text-sm">
          Book stalls now and pay from your event earnings within 3 days after the event ends.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
            <CreditCard className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{totalUsed}</div>
            <div className="text-xs text-gray-500 mt-0.5">Total BNPL Used</div>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
            <Clock className="h-5 w-5 text-yellow-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(pendingAmount)}</div>
            <div className="text-xs text-gray-500 mt-0.5">Pending Amount</div>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(settledAmount)}</div>
            <div className="text-xs text-gray-500 mt-0.5">Settled Amount</div>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-indigo-50 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-indigo-900 mb-4">How Pay After Event Works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: ShoppingBagIcon, step: "1", title: "Book Your Stall", desc: "Select BNPL when booking. No upfront payment required." },
            { icon: StarIcon, step: "2", title: "Attend the Event", desc: "Set up your stall, sell your products, and earn revenue." },
            { icon: CreditCard, step: "3", title: "Pay from Earnings", desc: "Settle your stall fee within 3 days after the event ends." },
          ].map(({ icon: StepIcon, step, title, desc }) => (
            <div key={step} className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-indigo-200 flex items-center justify-center flex-shrink-0 text-indigo-800">
                <StepIcon className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-semibold text-indigo-900">{title}</div>
                <div className="text-xs text-indigo-700 mt-0.5">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Agreements List */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Your BNPL Agreements</h2>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : agreements.length === 0 ? (
          <div className="bg-white rounded-xl border p-10 text-center text-gray-500">
            <CreditCard className="h-10 w-10 mx-auto mb-3 text-gray-300" />
            <p className="font-medium text-gray-700">No BNPL agreements yet</p>
            <p className="text-sm mt-1">Select &quot;Pay After Event&quot; when booking a stall to use BNPL.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {agreements.map((agreement) => {
              const dueDate = new Date(agreement.dueDate);
              return (
                <div key={agreement.id} className="bg-white rounded-xl border p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 truncate">{agreement.booking.event.title}</div>
                    <div className="text-sm text-gray-500 mt-0.5">
                      Stall #{agreement.booking.stall.stallNumber} &middot; Booking {agreement.booking.bookingNumber}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <div>
                      <div className="text-xs text-gray-400">Amount</div>
                      <div className="font-semibold text-gray-900">{formatCurrency(agreement.amount)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">Due Date</div>
                      <div className="font-medium text-gray-700">
                        {dueDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </div>
                    </div>
                    <StatusBadge status={agreement.status} dueDate={agreement.dueDate} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// Inline icon stubs to avoid extra imports
function ShoppingBagIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}

function StarIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}
