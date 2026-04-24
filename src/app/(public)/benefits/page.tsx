"use client";

import { useState, useEffect } from "react";
import {
  Gift, ExternalLink, CheckCircle, IndianRupee, Loader2, Landmark,
  MessageCircle, ChevronDown, ChevronUp, HelpCircle,
  FileText,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";

interface Scheme {
  id: string;
  name: string;
  description: string;
  eligibility: string;
  benefits: string;
  applicationUrl: string | null;
  category: string;
}

const categoryLabels: Record<string, string> = {
  MSME: "MSME Scheme",
  SVANDHI: "PM SVANidhi",
  STATE: "Telangana State",
  CENTRAL: "Central Government",
};

const categoryColors: Record<string, string> = {
  MSME: "bg-blue-100 text-blue-800",
  SVANDHI: "bg-green-100 text-green-800",
  STATE: "bg-purple-100 text-purple-800",
  CENTRAL: "bg-orange-100 text-orange-800",
};

// Eligibility quiz questions
const quizQuestions = [
  {
    id: "business_type",
    question: "What type of vendor are you?",
    options: [
      { value: "food", label: "Food / Street Food" },
      { value: "retail", label: "Retail / Merchandise" },
      { value: "handicraft", label: "Handicraft / Artisan" },
      { value: "service", label: "Service Provider" },
    ],
  },
  {
    id: "annual_turnover",
    question: "What is your approximate annual turnover?",
    options: [
      { value: "below_5L", label: "Below ₹5 Lakh" },
      { value: "5L_to_25L", label: "₹5 Lakh - ₹25 Lakh" },
      { value: "25L_to_1Cr", label: "₹25 Lakh - ₹1 Crore" },
      { value: "above_1Cr", label: "Above ₹1 Crore" },
    ],
  },
  {
    id: "has_udyam",
    question: "Do you have Udyam/MSME registration?",
    options: [
      { value: "yes", label: "Yes, registered" },
      { value: "no", label: "No, not registered" },
      { value: "unsure", label: "Not sure" },
    ],
  },
  {
    id: "has_fssai",
    question: "Do you have FSSAI license?",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
      { value: "na", label: "Not applicable (non-food)" },
    ],
  },
];

function getRecommendations(answers: Record<string, string>): string[] {
  const recs: string[] = [];

  // SVANidhi — for street vendors below 5L
  if (answers.annual_turnover === "below_5L") {
    recs.push("SVANDHI");
  }

  // MSME schemes — for most small vendors
  if (answers.annual_turnover !== "above_1Cr") {
    recs.push("MSME");
  }

  // State schemes
  recs.push("STATE");

  // Udyam registration guidance
  if (answers.has_udyam === "no" || answers.has_udyam === "unsure") {
    recs.push("UDYAM_GUIDE");
  }

  // Central schemes for all
  recs.push("CENTRAL");

  return recs;
}

export default function BenefitsPage() {
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizStep, setQuizStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [recommendations, setRecommendations] = useState<string[] | null>(null);
  const [expandedScheme, setExpandedScheme] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/government-schemes")
      .then((r) => r.json())
      .then((d) => setSchemes(d.schemes || []))
      .catch(() => setSchemes([]))
      .finally(() => setLoading(false));
  }, []);

  const handleQuizAnswer = (questionId: string, value: string) => {
    const newAnswers = { ...answers, [questionId]: value };
    setAnswers(newAnswers);

    if (quizStep < quizQuestions.length - 1) {
      setQuizStep(quizStep + 1);
    } else {
      // Quiz complete
      const recs = getRecommendations(newAnswers);
      setRecommendations(recs);
      setShowQuiz(false);
    }
  };

  const resetQuiz = () => {
    setAnswers({});
    setQuizStep(0);
    setRecommendations(null);
    setShowQuiz(false);
  };

  const shareScheme = (scheme: Scheme) => {
    const eligibility: string[] = (() => { try { return JSON.parse(scheme.eligibility); } catch { return [scheme.eligibility]; } })();
    const msg = [
      `🏛️ ${scheme.name}`,
      ``,
      scheme.description,
      ``,
      `💰 Benefits: ${scheme.benefits}`,
      ``,
      `✅ Eligibility:`,
      ...eligibility.map((e) => `  • ${e}`),
      ``,
      scheme.applicationUrl ? `Apply: ${scheme.applicationUrl}` : "",
      ``,
      `Found on StallMate`,
    ].filter(Boolean).join("\n");
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const filtered = filter === "ALL" ? schemes : schemes.filter((s) => s.category === filter);
  const recommended = recommendations
    ? schemes.filter((s) => recommendations.includes(s.category))
    : null;

  const showUdyamGuide = recommendations?.includes("UDYAM_GUIDE");

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Government Benefits</h1>
        <p className="text-sm text-gray-500">Discover schemes that save you money on stall costs</p>
      </div>

      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-5 text-white mb-6">
        <div className="flex items-start gap-3">
          <Gift className="h-7 w-7 flex-shrink-0" />
          <div>
            <h2 className="font-bold text-lg">Did you know?</h2>
            <p className="text-green-100 text-sm mt-1">
              The MSME Ministry reimburses <strong>80-100% of stall costs</strong> at exhibitions.
              Most small vendors are eligible but don&apos;t know about it!
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="bg-white/20 px-2.5 py-1 rounded-full text-xs">Free Udyam Registration</span>
              <span className="bg-white/20 px-2.5 py-1 rounded-full text-xs">Loans at 7% interest</span>
              <span className="bg-white/20 px-2.5 py-1 rounded-full text-xs">Marketing subsidies</span>
            </div>
          </div>
        </div>
      </div>

      {/* Eligibility Checker */}
      {!recommendations && (
        <Card className="mb-6 border-indigo-200">
          <CardContent className="py-4">
            {!showQuiz ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <HelpCircle className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">Not sure what you qualify for?</div>
                    <div className="text-xs text-gray-500">Answer 4 quick questions to find out</div>
                  </div>
                </div>
                <Button size="sm" onClick={() => setShowQuiz(true)}>
                  Check Eligibility
                </Button>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs text-gray-500">
                    Question {quizStep + 1} of {quizQuestions.length}
                  </span>
                  <div className="flex gap-1">
                    {quizQuestions.map((_, i) => (
                      <div
                        key={i}
                        className={`w-8 h-1.5 rounded-full ${
                          i <= quizStep ? "bg-indigo-500" : "bg-gray-200"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <h3 className="font-semibold text-gray-900 mb-3">
                  {quizQuestions[quizStep].question}
                </h3>

                <div className="space-y-2">
                  {quizQuestions[quizStep].options.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => handleQuizAnswer(quizQuestions[quizStep].id, opt.value)}
                      className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-indigo-50 border border-gray-200 hover:border-indigo-300 rounded-lg text-sm font-medium text-gray-700 transition-colors"
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {recommendations && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-indigo-700 flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4" /> Recommended for You
            </h2>
            <button onClick={resetQuiz} className="text-xs text-gray-400 hover:text-gray-600">
              Retake quiz
            </button>
          </div>

          {/* Udyam Registration Guide */}
          {showUdyamGuide && (
            <Card className="mb-3 border-amber-200 bg-amber-50/30">
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <FileText className="h-5 w-5 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">Get Udyam Registration First</h3>
                    <p className="text-xs text-gray-600 mt-1">
                      Udyam registration is FREE and takes 10 minutes online.
                      It unlocks most government schemes for small vendors.
                    </p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <a
                        href="https://udyamregistration.gov.in"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm bg-amber-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-amber-700"
                      >
                        Register Now <ExternalLink className="h-3 w-3" />
                      </a>
                      <button
                        onClick={() => {
                          const msg = [
                            "📋 Udyam Registration Guide",
                            "",
                            "Step 1: Visit udyamregistration.gov.in",
                            "Step 2: Enter Aadhaar number",
                            "Step 3: Fill business details",
                            "Step 4: Get certificate instantly!",
                            "",
                            "It's FREE and takes 10 minutes.",
                            "This unlocks 80-100% stall cost reimbursement!",
                          ].join("\n");
                          window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
                        }}
                        className="inline-flex items-center gap-1 text-sm bg-green-500 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-green-600"
                      >
                        <MessageCircle className="h-3 w-3" /> Share Guide
                      </button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {recommended && recommended.length > 0 ? (
            <div className="space-y-3">
              {recommended.map((scheme) => (
                <SchemeCard
                  key={scheme.id}
                  scheme={scheme}
                  expanded={expandedScheme === scheme.id}
                  onToggle={() => setExpandedScheme(expandedScheme === scheme.id ? null : scheme.id)}
                  onShare={() => shareScheme(scheme)}
                  recommended
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No specific schemes matched. Browse all schemes below.</p>
          )}
        </div>
      )}

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2 mb-4 overflow-x-auto">
        {["ALL", "MSME", "SVANDHI", "STATE", "CENTRAL"].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-3 py-2 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
              filter === cat
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {cat === "ALL" ? `All (${schemes.length})` : categoryLabels[cat] || cat}
          </button>
        ))}
      </div>

      {/* All Schemes */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
        </div>
      ) : filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((scheme) => (
            <SchemeCard
              key={scheme.id}
              scheme={scheme}
              expanded={expandedScheme === scheme.id}
              onToggle={() => setExpandedScheme(expandedScheme === scheme.id ? null : scheme.id)}
              onShare={() => shareScheme(scheme)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <Landmark className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900">No schemes found</h3>
          <p className="text-gray-500 text-sm">Try selecting a different category.</p>
        </div>
      )}
    </div>
  );
}

function SchemeCard({
  scheme,
  expanded,
  onToggle,
  onShare,
  recommended = false,
}: {
  scheme: Scheme;
  expanded: boolean;
  onToggle: () => void;
  onShare: () => void;
  recommended?: boolean;
}) {
  const eligibilityPoints: string[] = (() => { try { return JSON.parse(scheme.eligibility); } catch { return [scheme.eligibility]; } })();

  return (
    <Card className={recommended ? "border-indigo-200 bg-indigo-50/20" : ""}>
      <CardContent className="py-4">
        <button onClick={onToggle} className="w-full text-left">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-gray-900">{scheme.name}</h3>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${categoryColors[scheme.category] || "bg-gray-100 text-gray-600"}`}>
                  {categoryLabels[scheme.category]}
                </span>
                {recommended && <Badge variant="success" className="text-[10px]">Recommended</Badge>}
              </div>
              <p className="text-xs text-gray-600">{scheme.description}</p>
            </div>
            {expanded ? (
              <ChevronUp className="h-5 w-5 text-gray-400 flex-shrink-0" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
            )}
          </div>
        </button>

        {expanded && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            {/* Benefits */}
            <div className="bg-green-50 rounded-lg p-3 mb-3">
              <div className="flex items-center gap-1 text-xs font-semibold text-green-800 mb-1">
                <IndianRupee className="h-3.5 w-3.5" /> Benefits
              </div>
              <p className="text-sm text-green-700">{scheme.benefits}</p>
            </div>

            {/* Eligibility */}
            <div className="mb-3">
              <div className="text-xs font-semibold text-gray-700 mb-1.5">Eligibility</div>
              <ul className="space-y-1.5">
                {eligibilityPoints.map((point, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              {scheme.applicationUrl && (
                <a
                  href={scheme.applicationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Apply Now <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
              <button
                onClick={onShare}
                className="flex items-center justify-center gap-1 px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <MessageCircle className="h-3.5 w-3.5" /> Share
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
