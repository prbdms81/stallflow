"use client";

import { useState, useEffect, useCallback } from "react";
import {
  IndianRupee, Calendar, Download, Loader2, TrendingUp,
  FileText, BarChart3, AlertCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { formatCurrency, formatDate } from "@/lib/utils";

type Period = "week" | "month" | "year" | "custom";

interface BreakdownRow {
  eventTitle: string;
  date: string;
  stallFee: number;
  salesAmount: number;
  total: number;
}

interface ReportData {
  totalRevenue: number;
  totalEvents: number;
  avgPerEvent: number;
  breakdown: BreakdownRow[];
  taxSummary: {
    grossIncome: number;
    presumptiveTaxBase: number;
    estimatedTax: number;
    period: string;
  };
}

export default function EarningsReportPage() {
  const [period, setPeriod] = useState<Period>("month");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState(new Date().toISOString().split("T")[0]);
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = useCallback(() => {
    setLoading(true);
    let url = `/api/earnings-report?period=${period}`;
    if (period === "custom" && fromDate && toDate) {
      url += `&fromDate=${fromDate}&toDate=${toDate}`;
    }
    fetch(url)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [period, fromDate, toDate]);

  useEffect(() => {
    if (period !== "custom") fetchReport();
  }, [period, fetchReport]);

  const downloadCSV = () => {
    if (!data) return;
    const lines = [
      "Event,Date,Stall Fee,Sales Amount,Total",
      ...data.breakdown.map((r) =>
        `"${r.eventTitle}",${new Date(r.date).toLocaleDateString("en-IN")},${r.stallFee},${r.salesAmount},${r.total}`
      ),
      "",
      `Total Revenue,,,,${data.totalRevenue}`,
      `Events,,,,${data.totalEvents}`,
      `Avg Per Event,,,,${data.avgPerEvent.toFixed(2)}`,
      "",
      "Tax Summary (Section 44AD)",
      `Gross Income,,,,${data.taxSummary.grossIncome}`,
      `Presumptive Tax Base,,,,${data.taxSummary.presumptiveTaxBase}`,
      `Estimated Tax (6%),,,,${data.taxSummary.estimatedTax.toFixed(2)}`,
    ].join("\n");

    const blob = new Blob([lines], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `earnings-report-${period}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const PERIODS: { key: Period; label: string }[] = [
    { key: "week", label: "Week" },
    { key: "month", label: "Month" },
    { key: "year", label: "Year" },
    { key: "custom", label: "Custom" },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Earnings Report</h1>
          <p className="text-sm text-gray-500">Revenue, breakdowns & tax statement</p>
        </div>
        {data && data.breakdown.length > 0 && (
          <Button size="sm" variant="outline" onClick={downloadCSV}>
            <Download className="h-4 w-4 mr-1" /> Download CSV
          </Button>
        )}
      </div>

      {/* Period Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-4">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              period === p.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Custom date range */}
      {period === "custom" && (
        <div className="flex gap-2 mb-4">
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <Button size="sm" onClick={fetchReport} disabled={!fromDate || !toDate}>
            Apply
          </Button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
        </div>
      ) : !data ? (
        <div className="text-center py-12 text-gray-400">
          <AlertCircle className="h-8 w-8 mx-auto mb-2" />
          <p>Failed to load report</p>
        </div>
      ) : (
        <>
          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <Card>
              <CardContent className="py-4 text-center">
                <IndianRupee className="h-5 w-5 text-green-500 mx-auto mb-1" />
                <div className="text-lg font-bold text-gray-900">{formatCurrency(data.totalRevenue)}</div>
                <div className="text-xs text-gray-500">Total Revenue</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4 text-center">
                <Calendar className="h-5 w-5 text-indigo-500 mx-auto mb-1" />
                <div className="text-lg font-bold text-gray-900">{data.totalEvents}</div>
                <div className="text-xs text-gray-500">Events Done</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4 text-center">
                <TrendingUp className="h-5 w-5 text-amber-500 mx-auto mb-1" />
                <div className="text-lg font-bold text-gray-900">{formatCurrency(data.avgPerEvent)}</div>
                <div className="text-xs text-gray-500">Avg Per Event</div>
              </CardContent>
            </Card>
          </div>

          {/* Breakdown Table */}
          <Card className="mb-6">
            <CardContent>
              <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
                <BarChart3 className="h-4 w-4 text-indigo-500" /> Event Breakdown
              </h2>
              {data.breakdown.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left border-b text-gray-500 text-xs">
                        <th className="pb-2 font-medium">Event</th>
                        <th className="pb-2 font-medium">Date</th>
                        <th className="pb-2 font-medium text-right">Stall Fee</th>
                        <th className="pb-2 font-medium text-right">Sales</th>
                        <th className="pb-2 font-medium text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {data.breakdown.map((row, i) => (
                        <tr key={i}>
                          <td className="py-2 font-medium text-gray-900 max-w-[140px] truncate">{row.eventTitle}</td>
                          <td className="py-2 text-gray-500 whitespace-nowrap">{formatDate(row.date)}</td>
                          <td className="py-2 text-right text-gray-600">{formatCurrency(row.stallFee)}</td>
                          <td className="py-2 text-right text-gray-600">{formatCurrency(row.salesAmount)}</td>
                          <td className="py-2 text-right font-semibold text-gray-900">{formatCurrency(row.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-6">No events found for this period</p>
              )}
            </CardContent>
          </Card>

          {/* Tax Summary */}
          <Card className="border-amber-200 bg-amber-50/30">
            <CardContent>
              <h2 className="text-sm font-semibold text-amber-700 mb-3 flex items-center gap-1.5">
                <FileText className="h-4 w-4" /> Tax Statement — Section 44AD (Presumptive)
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Gross Income</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(data.taxSummary.grossIncome)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Presumptive Tax Base (Sec 44AD)</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(data.taxSummary.presumptiveTaxBase)}</span>
                </div>
                <div className="border-t pt-3 flex justify-between">
                  <span className="text-sm font-medium text-amber-700">Estimated Tax (6% of gross)</span>
                  <span className="text-lg font-bold text-amber-700">{formatCurrency(data.taxSummary.estimatedTax)}</span>
                </div>
                <p className="text-xs text-gray-400">
                  Indicative only. Consult a CA for actual tax computation. Rate: 6% for digital receipts under Sec 44AD.
                </p>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
