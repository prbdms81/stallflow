"use client";

import { useEffect, useState } from "react";
import { FileSpreadsheet, Download, Building2, MapPin, Tag, Clock } from "lucide-react";

type MonthData = {
  month: string;
  events: number;
  grossRevenue: number;
  paidCount: number;
};

type VendorInfo = {
  businessName: string;
  category: string;
  city: string;
  yearsActive: number;
  memberSince: string;
};

type Summary = {
  totalRevenue: number;
  totalEvents: number;
  avgRevenuePerEvent: number;
  paidBookings: number;
  paymentComplianceRate: number;
  highestMonth: MonthData | null;
  lowestMonth: MonthData | null;
};

type ReportData = {
  vendor: VendorInfo;
  monthly: MonthData[];
  summary: Summary;
};

function formatMonth(key: string): string {
  const [year, month] = key.split("-");
  const d = new Date(Number(year), Number(month) - 1, 1);
  return d.toLocaleString("en-IN", { month: "short", year: "numeric" });
}

function formatINR(amount: number): string {
  return "₹" + Math.round(amount).toLocaleString("en-IN");
}

function getLoanEligibility(totalRevenue: number): { scheme: string; amount: string; description: string } {
  if (totalRevenue < 100000) {
    return {
      scheme: "Mudra Shishu",
      amount: "up to ₹50,000",
      description: "For micro enterprises in early stage. Suitable for small stallholders.",
    };
  } else if (totalRevenue < 1000000) {
    return {
      scheme: "Mudra Kishore",
      amount: "up to ₹5 Lakh",
      description: "For established micro enterprises. Ideal for growing vendors.",
    };
  } else {
    return {
      scheme: "Mudra Tarun",
      amount: "up to ₹10 Lakh",
      description: "For well-established businesses seeking expansion capital.",
    };
  }
}

export default function MSMEReportPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/vendor/msme-report")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setData(d);
      })
      .catch(() => setError("Failed to load report"))
      .finally(() => setLoading(false));
  }, []);

  const handlePrint = () => window.print();

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-4">
        <div className="h-8 bg-gray-200 rounded animate-pulse w-64" />
        <div className="h-4 bg-gray-100 rounded animate-pulse w-96" />
        <div className="h-64 bg-gray-100 rounded-xl animate-pulse mt-6" />
        <div className="h-48 bg-gray-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <p className="text-red-600">{error ?? "Something went wrong"}</p>
      </div>
    );
  }

  const { vendor, monthly, summary } = data;
  const loan = getLoanEligibility(summary.totalRevenue);
  const generatedOn = new Date().toLocaleDateString("en-IN", {
    day: "2-digit", month: "long", year: "numeric",
  });

  return (
    <>
      {/* Print-specific CSS */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #msme-report, #msme-report * { visibility: visible; }
          #msme-report { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
          .print-break { page-break-after: always; }
        }
      `}</style>

      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between no-print">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FileSpreadsheet className="h-6 w-6 text-indigo-600" />
              MSME Credit Report
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Use this report to apply for business loans under the PMMY scheme
            </p>
          </div>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            Download PDF
          </button>
        </div>

        {/* Printable report */}
        <div id="msme-report" className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Report header band */}
          <div className="bg-indigo-600 text-white px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-200 text-xs uppercase tracking-widest font-medium">StallMate</p>
                <h2 className="text-2xl font-bold mt-1">MSME Business Credit Report</h2>
                <p className="text-indigo-200 text-sm mt-1">
                  Annual Performance Summary — Last 12 Months
                </p>
              </div>
              <div className="text-right">
                <p className="text-indigo-200 text-xs">Generated on</p>
                <p className="text-white font-semibold text-sm">{generatedOn}</p>
                <p className="text-indigo-200 text-xs mt-2">Report ref: SM-{Date.now().toString().slice(-8)}</p>
              </div>
            </div>
          </div>

          <div className="px-8 py-6 space-y-8">
            {/* Business Details */}
            <section>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider border-b pb-2 mb-4">
                Business Details
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                <div className="flex items-start gap-3">
                  <Building2 className="h-5 w-5 text-indigo-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Business Name</p>
                    <p className="text-sm font-semibold text-gray-900">{vendor.businessName}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Tag className="h-5 w-5 text-indigo-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Category</p>
                    <p className="text-sm font-semibold text-gray-900">{vendor.category}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-indigo-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Primary City</p>
                    <p className="text-sm font-semibold text-gray-900">{vendor.city}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-indigo-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Years Active</p>
                    <p className="text-sm font-semibold text-gray-900">{vendor.yearsActive} yrs</p>
                  </div>
                </div>
              </div>
            </section>

            {/* 12-Month Revenue Table */}
            <section>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider border-b pb-2 mb-4">
                12-Month Revenue Breakdown
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase">Month</th>
                      <th className="text-center px-4 py-2 text-xs font-medium text-gray-500 uppercase">Events</th>
                      <th className="text-right px-4 py-2 text-xs font-medium text-gray-500 uppercase">Gross Revenue</th>
                      <th className="text-center px-4 py-2 text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {monthly.map((m) => (
                      <tr key={m.month} className={m.events === 0 ? "text-gray-400" : "text-gray-800"}>
                        <td className="px-4 py-2.5 font-medium">{formatMonth(m.month)}</td>
                        <td className="px-4 py-2.5 text-center">{m.events}</td>
                        <td className="px-4 py-2.5 text-right font-mono">
                          {m.events > 0 ? formatINR(m.grossRevenue) : "—"}
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          {m.events === 0 ? (
                            <span className="text-xs text-gray-400">No activity</span>
                          ) : m.paidCount === m.events ? (
                            <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700 font-medium">Paid</span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-yellow-100 text-yellow-700 font-medium">Partial</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Summary */}
            <section>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider border-b pb-2 mb-4">
                Annual Summary
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="bg-indigo-50 rounded-xl p-4">
                  <p className="text-xs text-indigo-600 font-medium">Total Annual Revenue</p>
                  <p className="text-2xl font-bold text-indigo-700 mt-1">{formatINR(summary.totalRevenue)}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 font-medium">Avg Monthly Revenue</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">{formatINR(summary.totalRevenue / 12)}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 font-medium">Payment Compliance</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">{summary.paymentComplianceRate}%</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 font-medium">Total Events (12m)</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">{summary.totalEvents}</p>
                </div>
                {summary.highestMonth && (
                  <div className="bg-green-50 rounded-xl p-4">
                    <p className="text-xs text-green-600 font-medium">Best Month</p>
                    <p className="text-lg font-bold text-green-700 mt-1">{formatMonth(summary.highestMonth.month)}</p>
                    <p className="text-sm text-green-600">{formatINR(summary.highestMonth.grossRevenue)}</p>
                  </div>
                )}
                {summary.lowestMonth && (
                  <div className="bg-orange-50 rounded-xl p-4">
                    <p className="text-xs text-orange-600 font-medium">Lowest Active Month</p>
                    <p className="text-lg font-bold text-orange-700 mt-1">{formatMonth(summary.lowestMonth.month)}</p>
                    <p className="text-sm text-orange-600">{formatINR(summary.lowestMonth.grossRevenue)}</p>
                  </div>
                )}
              </div>
            </section>

            {/* Loan Eligibility */}
            <section>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider border-b pb-2 mb-4">
                Loan Eligibility (PMMY — Pradhan Mantri MUDRA Yojana)
              </h3>
              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 rounded-xl p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs text-indigo-500 font-medium uppercase tracking-wide">Recommended Scheme</p>
                    <p className="text-xl font-bold text-indigo-700 mt-1">{loan.scheme}</p>
                    <p className="text-sm text-gray-600 mt-1">{loan.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-gray-500">Loan Amount</p>
                    <p className="text-lg font-bold text-indigo-600">{loan.amount}</p>
                  </div>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-3 text-center text-xs text-gray-500">
                <div className={`p-2 rounded-lg border ${summary.totalRevenue < 100000 ? "bg-indigo-50 border-indigo-200 font-semibold text-indigo-700" : "border-gray-100"}`}>
                  <p className="font-medium">Shishu</p>
                  <p>{"< ₹1L/yr"}</p>
                  <p className="text-gray-400">up to ₹50,000</p>
                </div>
                <div className={`p-2 rounded-lg border ${summary.totalRevenue >= 100000 && summary.totalRevenue < 1000000 ? "bg-indigo-50 border-indigo-200 font-semibold text-indigo-700" : "border-gray-100"}`}>
                  <p className="font-medium">Kishore</p>
                  <p>₹1L–₹10L/yr</p>
                  <p className="text-gray-400">up to ₹5 Lakh</p>
                </div>
                <div className={`p-2 rounded-lg border ${summary.totalRevenue >= 1000000 ? "bg-indigo-50 border-indigo-200 font-semibold text-indigo-700" : "border-gray-100"}`}>
                  <p className="font-medium">Tarun</p>
                  <p>{"> ₹10L/yr"}</p>
                  <p className="text-gray-400">up to ₹10 Lakh</p>
                </div>
              </div>
            </section>

            {/* Footer */}
            <div className="border-t pt-4 text-center">
              <p className="text-xs text-gray-400">
                Generated by StallMate | stallmate.in | This is a summary report for reference only.
                Not a legally binding financial document. Verify all figures with your chartered accountant before applying.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
