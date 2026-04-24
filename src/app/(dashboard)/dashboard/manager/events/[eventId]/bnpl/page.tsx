"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
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
    stall: { stallNumber: string };
    vendor: { id: string; name: string; email: string };
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
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
      <Clock className="h-3 w-3" />
      PENDING
    </span>
  );
}

export default function ManagerEventBNPLPage() {
  const params = useParams();
  const eventId = params.eventId as string;

  const [agreements, setAgreements] = useState<BNPLAgreement[]>([]);
  const [loading, setLoading] = useState(true);
  const [settling, setSettling] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/bnpl?eventId=${eventId}`)
      .then((res) => res.json())
      .then((data) => setAgreements(data.agreements || []))
      .catch(() => toast.error("Failed to load BNPL agreements"))
      .finally(() => setLoading(false));
  }, [eventId]);

  const handleSettle = async (agreementId: string) => {
    setSettling(agreementId);
    try {
      const res = await fetch("/api/bnpl", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agreementId }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Agreement marked as settled");
        setAgreements((prev) =>
          prev.map((a) =>
            a.id === agreementId
              ? { ...a, status: "SETTLED", settledAt: new Date().toISOString() }
              : a
          )
        );
      } else {
        toast.error(data.error || "Failed to settle agreement");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSettling(null);
    }
  };

  const pendingAmount = agreements
    .filter((a) => a.status === "PENDING")
    .reduce((sum, a) => sum + a.amount, 0);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <CreditCard className="h-7 w-7 text-indigo-600" />
          <h1 className="text-2xl font-bold text-gray-900">BNPL Agreements</h1>
        </div>
        <p className="text-gray-500 text-sm">
          Vendors using &quot;Pay After Event&quot; for this event. Mark as settled once payment is received.
        </p>
      </div>

      {/* Summary */}
      {agreements.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
            <Clock className="h-5 w-5 text-yellow-600" />
          </div>
          <div>
            <div className="text-sm text-yellow-800 font-medium">Total BNPL Pending</div>
            <div className="text-2xl font-bold text-yellow-900">{formatCurrency(pendingAmount)}</div>
          </div>
        </div>
      )}

      {/* Agreements Table */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : agreements.length === 0 ? (
        <div className="bg-white rounded-xl border p-10 text-center text-gray-500">
          <CreditCard className="h-10 w-10 mx-auto mb-3 text-gray-300" />
          <p className="font-medium text-gray-700">No BNPL agreements for this event</p>
          <p className="text-sm mt-1">Vendors who used Pay After Event will appear here.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Vendor</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Stall</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Amount</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Due Date</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Status</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {agreements.map((agreement) => {
                const dueDate = new Date(agreement.dueDate);
                return (
                  <tr key={agreement.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <div className="font-medium text-gray-900">{agreement.booking.vendor.name}</div>
                      <div className="text-xs text-gray-400">{agreement.booking.vendor.email}</div>
                    </td>
                    <td className="px-5 py-4 text-gray-700">
                      #{agreement.booking.stall.stallNumber}
                    </td>
                    <td className="px-5 py-4 font-semibold text-gray-900">
                      {formatCurrency(agreement.amount)}
                    </td>
                    <td className="px-5 py-4 text-gray-700">
                      {dueDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={agreement.status} dueDate={agreement.dueDate} />
                    </td>
                    <td className="px-5 py-4">
                      {agreement.status !== "SETTLED" ? (
                        <button
                          onClick={() => handleSettle(agreement.id)}
                          disabled={settling === agreement.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                          {settling === agreement.id ? "Settling..." : "Mark Settled"}
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">
                          {agreement.settledAt
                            ? new Date(agreement.settledAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                            : "Settled"}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
