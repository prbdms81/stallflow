"use client";

import { useState, useEffect } from "react";
import {
  FileText, Plus, Trash2, AlertCircle, CheckCircle, Clock, Shield, Loader2,
  Share2, MessageCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Badge from "@/components/ui/Badge";
import toast from "react-hot-toast";

interface Document {
  id: string;
  type: string;
  documentNumber: string;
  fileUrl: string | null;
  expiresAt: string | null;
  isVerified: boolean;
  createdAt: string;
}

interface Booking {
  id: string;
  bookingNumber: string;
  event: { title: string; organizer?: { name: string; phone: string | null } };
}

const docTypes = [
  { value: "FSSAI", label: "FSSAI License" },
  { value: "GST", label: "GST Certificate" },
  { value: "TRADE_LICENSE", label: "GHMC Trade License" },
  { value: "ID_PROOF", label: "ID Proof (Aadhaar/PAN)" },
  { value: "VEHICLE_RC", label: "Vehicle RC" },
  { value: "FIRE_NOC", label: "Fire Safety NOC" },
];

const docTypeLabels: Record<string, string> = {
  FSSAI: "FSSAI License",
  GST: "GST Certificate",
  TRADE_LICENSE: "Trade License",
  ID_PROOF: "ID Proof",
  VEHICLE_RC: "Vehicle RC",
  FIRE_NOC: "Fire NOC",
};

// Which docs are considered essential for trust score
const essentialDocs = ["FSSAI", "GST", "ID_PROOF"];
const allDocTypes = docTypes.map((d) => d.value);

export default function VendorDocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSharePanel, setShowSharePanel] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [newDoc, setNewDoc] = useState({ type: "", documentNumber: "", fileUrl: "", expiresAt: "" });

  const fetchDocs = () => {
    Promise.all([
      fetch("/api/vendor-documents").then((r) => r.json()),
      fetch("/api/bookings").then((r) => r.json()),
    ])
      .then(([docData, bookingData]) => {
        setDocuments(docData.documents || []);
        setBookings(bookingData.bookings || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchDocs(); }, []);

  const handleAdd = async () => {
    if (!newDoc.type || !newDoc.documentNumber) {
      toast.error("Document type and number are required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/vendor-documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newDoc),
      });
      if (res.ok) {
        toast.success("Document added!");
        setNewDoc({ type: "", documentNumber: "", fileUrl: "", expiresAt: "" });
        setShowAdd(false);
        fetchDocs();
      } else {
        toast.error("Failed to add document");
      }
    } catch (err: unknown) {
      console.error(err);
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/vendor-documents?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Document removed");
        fetchDocs();
      }
    } catch (err: unknown) {
      console.error(err);
    }
  };

  const isExpiringSoon = (date: string | null) => {
    if (!date) return false;
    const diff = new Date(date).getTime() - Date.now();
    return diff > 0 && diff < 30 * 24 * 60 * 60 * 1000;
  };

  const isExpired = (date: string | null) => {
    if (!date) return false;
    return new Date(date).getTime() < Date.now();
  };

  // Completion stats
  const uploadedTypes = new Set(documents.map((d) => d.type));
  const verifiedCount = documents.filter((d) => d.isVerified).length;
  const expiredCount = documents.filter((d) => isExpired(d.expiresAt)).length;
  const expiringSoonCount = documents.filter((d) => isExpiringSoon(d.expiresAt)).length;
  const essentialUploaded = essentialDocs.filter((t) => uploadedTypes.has(t)).length;
  const completionPct = Math.round((uploadedTypes.size / allDocTypes.length) * 100);
  const missingDocs = allDocTypes.filter((t) => !uploadedTypes.has(t));

  const shareDocsOnWhatsApp = (booking: Booking) => {
    setSharing(true);
    const verifiedDocs = documents.filter((d) => d.isVerified);
    const allDocs = documents;
    const docList = allDocs.map((d) => {
      const label = docTypeLabels[d.type] || d.type;
      const status = d.isVerified ? "Verified" : "Uploaded";
      const expired = isExpired(d.expiresAt) ? " (EXPIRED)" : "";
      return `  ${d.isVerified ? "✅" : "📄"} ${label}: ${d.documentNumber} — ${status}${expired}`;
    }).join("\n");

    const msg = [
      `📋 Vendor Documents`,
      ``,
      `Event: ${booking.event.title}`,
      `Booking: #${booking.bookingNumber}`,
      ``,
      `Documents (${verifiedDocs.length}/${allDocs.length} verified):`,
      docList,
      ``,
      `Completion: ${completionPct}% (${uploadedTypes.size}/${allDocTypes.length} types)`,
      missingDocs.length > 0
        ? `Missing: ${missingDocs.map((t) => docTypeLabels[t]).join(", ")}`
        : `All document types uploaded ✅`,
    ].join("\n");

    const phone = booking.event.organizer?.phone?.replace(/\D/g, "") || "";
    const whatsappUrl = phone
      ? `https://wa.me/91${phone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;

    window.open(whatsappUrl, "_blank");
    setSharing(false);
    toast.success("Opening WhatsApp...");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Documents</h1>
          <p className="text-sm text-gray-500">Store all your compliance documents in one place</p>
        </div>
        <div className="flex gap-2">
          {documents.length > 0 && (
            <Button size="sm" variant="outline" onClick={() => setShowSharePanel(!showSharePanel)}>
              <Share2 className="h-4 w-4 mr-1" /> Share
            </Button>
          )}
          <Button size="sm" onClick={() => setShowAdd(!showAdd)}>
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>
      </div>

      {/* Completion Tracker */}
      <Card className="mb-6">
        <CardContent className="py-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-gray-700">Document Completion</span>
            <span className="text-lg font-bold text-indigo-600">{completionPct}%</span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden mb-3">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                completionPct === 100
                  ? "bg-green-500"
                  : completionPct >= 50
                  ? "bg-indigo-500"
                  : "bg-amber-500"
              }`}
              style={{ width: `${completionPct}%` }}
            />
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 text-center mb-3">
            <div className="bg-gray-50 rounded-lg py-2">
              <div className="text-lg font-bold text-gray-900">{uploadedTypes.size}/{allDocTypes.length}</div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wide">Types</div>
            </div>
            <div className="bg-gray-50 rounded-lg py-2">
              <div className="text-lg font-bold text-green-600">{verifiedCount}</div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wide">Verified</div>
            </div>
            <div className="bg-gray-50 rounded-lg py-2">
              <div className={`text-lg font-bold ${expiredCount > 0 ? "text-red-500" : "text-gray-900"}`}>
                {essentialUploaded}/{essentialDocs.length}
              </div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wide">Essential</div>
            </div>
          </div>

          {/* Alerts */}
          {(expiredCount > 0 || expiringSoonCount > 0 || missingDocs.length > 0) && (
            <div className="space-y-2">
              {expiredCount > 0 && (
                <div className="flex items-center gap-2 text-sm bg-red-50 text-red-700 px-3 py-2 rounded-lg">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {expiredCount} document{expiredCount !== 1 ? "s" : ""} expired — renew to keep your trust score high
                </div>
              )}
              {expiringSoonCount > 0 && (
                <div className="flex items-center gap-2 text-sm bg-amber-50 text-amber-700 px-3 py-2 rounded-lg">
                  <Clock className="h-4 w-4 flex-shrink-0" />
                  {expiringSoonCount} document{expiringSoonCount !== 1 ? "s" : ""} expiring within 30 days
                </div>
              )}
              {missingDocs.length > 0 && (
                <div className="bg-indigo-50 px-3 py-2 rounded-lg">
                  <div className="text-sm text-indigo-700 font-medium mb-1">Missing documents:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {missingDocs.map((type) => (
                      <button
                        key={type}
                        onClick={() => {
                          setNewDoc({ ...newDoc, type });
                          setShowAdd(true);
                        }}
                        className="text-xs bg-white border border-indigo-200 text-indigo-600 px-2 py-1 rounded-full hover:bg-indigo-100 transition-colors"
                      >
                        + {docTypeLabels[type]}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {completionPct === 100 && expiredCount === 0 && (
            <div className="flex items-center gap-2 text-sm bg-green-50 text-green-700 px-3 py-2 rounded-lg">
              <CheckCircle className="h-4 w-4 flex-shrink-0" />
              All documents uploaded! Your trust score gets a boost from complete documentation.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Share Panel */}
      {showSharePanel && (
        <Card className="mb-6 border-green-200">
          <CardContent className="py-4">
            <div className="flex items-center gap-2 mb-3">
              <MessageCircle className="h-5 w-5 text-green-600" />
              <span className="font-semibold text-gray-900 text-sm">Share Documents with Organizer</span>
            </div>
            <p className="text-xs text-gray-500 mb-3">
              Send your document summary to an event organizer via WhatsApp for quick verification
            </p>
            {bookings.length > 0 ? (
              <div className="space-y-2">
                {bookings.slice(0, 5).map((booking) => (
                  <button
                    key={booking.id}
                    onClick={() => shareDocsOnWhatsApp(booking)}
                    disabled={sharing}
                    className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-green-50 rounded-lg text-left transition-colors"
                  >
                    <div>
                      <div className="text-sm font-medium text-gray-900">{booking.event.title}</div>
                      <div className="text-xs text-gray-500">#{booking.bookingNumber}</div>
                    </div>
                    <MessageCircle className="h-4 w-4 text-green-500" />
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No bookings found to share with</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add Document Form */}
      {showAdd && (
        <Card className="mb-6">
          <CardContent className="py-5 space-y-4">
            <Select
              label="Document Type"
              options={docTypes}
              value={newDoc.type}
              onChange={(e) => setNewDoc({ ...newDoc, type: e.target.value })}
              placeholder="Select type"
            />
            <Input
              label="Document Number"
              value={newDoc.documentNumber}
              onChange={(e) => setNewDoc({ ...newDoc, documentNumber: e.target.value })}
              placeholder="e.g. FSSAI 14-digit number"
            />
            <Input
              label="Document File URL (optional)"
              value={newDoc.fileUrl}
              onChange={(e) => setNewDoc({ ...newDoc, fileUrl: e.target.value })}
              placeholder="Link to scanned document"
              helperText="Upload to Google Drive and paste the link"
            />
            <Input
              label="Expires On (optional)"
              type="date"
              value={newDoc.expiresAt}
              onChange={(e) => setNewDoc({ ...newDoc, expiresAt: e.target.value })}
            />
            <div className="flex gap-2">
              <Button onClick={handleAdd} isLoading={saving}>Save Document</Button>
              <Button variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Documents List */}
      {documents.length > 0 ? (
        <div className="space-y-3">
          {documents.map((doc) => (
            <Card key={doc.id}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      isExpired(doc.expiresAt)
                        ? "bg-red-50"
                        : doc.isVerified
                        ? "bg-green-50"
                        : "bg-indigo-50"
                    }`}>
                      <FileText className={`h-5 w-5 ${
                        isExpired(doc.expiresAt)
                          ? "text-red-500"
                          : doc.isVerified
                          ? "text-green-500"
                          : "text-indigo-500"
                      }`} />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{docTypeLabels[doc.type] || doc.type}</div>
                      <div className="text-sm text-gray-500 font-mono">{doc.documentNumber}</div>
                      {doc.expiresAt && (
                        <div className="flex items-center gap-1 mt-1">
                          {isExpired(doc.expiresAt) ? (
                            <Badge variant="danger">
                              <AlertCircle className="h-3 w-3 mr-1" /> Expired
                            </Badge>
                          ) : isExpiringSoon(doc.expiresAt) ? (
                            <Badge variant="warning">
                              <Clock className="h-3 w-3 mr-1" /> Expiring soon
                            </Badge>
                          ) : (
                            <span className="text-xs text-gray-400">
                              Expires: {new Date(doc.expiresAt).toLocaleDateString("en-IN")}
                            </span>
                          )}
                        </div>
                      )}
                      {essentialDocs.includes(doc.type) && (
                        <span className="text-[10px] text-indigo-500 font-medium uppercase mt-1 inline-block">
                          Essential
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {doc.isVerified ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <Shield className="h-5 w-5 text-gray-300" />
                    )}
                    <button onClick={() => handleDelete(doc.id)} className="p-2 text-gray-400 hover:text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
          <Shield className="h-10 w-10 mx-auto mb-2" />
          <p className="font-medium text-gray-600">No documents yet</p>
          <p className="text-sm mt-1">Add your FSSAI, GST, and other documents for quick verification at events</p>
        </div>
      )}
    </div>
  );
}
