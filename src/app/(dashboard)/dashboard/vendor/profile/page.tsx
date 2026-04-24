"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Save,
  Plus,
  Trash2,
  ImageIcon,
  Loader2,
  ShieldCheck,
  Eye,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import toast from "react-hot-toast";

const categoryOptions = [
  { value: "Food & Beverages", label: "Food & Beverages" },
  { value: "Clothing & Fashion", label: "Clothing & Fashion" },
  { value: "Jewellery & Accessories", label: "Jewellery & Accessories" },
  { value: "Home Decor", label: "Home Decor" },
  { value: "Handicrafts", label: "Handicrafts" },
  { value: "Electronics", label: "Electronics" },
  { value: "Plants & Garden", label: "Plants & Garden" },
  { value: "Health & Wellness", label: "Health & Wellness" },
  { value: "Other", label: "Other" },
];

export default function VendorProfileEdit() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [trustScore, setTrustScore] = useState(0);
  const [isTrusted, setIsTrusted] = useState(false);

  // Basic fields
  const [businessName, setBusinessName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [logo, setLogo] = useState("");
  const [experience, setExperience] = useState("");

  // Verification fields
  const [fssaiNumber, setFssaiNumber] = useState("");
  const [udyamNumber, setUdyamNumber] = useState("");

  // Social links
  const [whatsapp, setWhatsapp] = useState("");
  const [instagram, setInstagram] = useState("");

  // Photos
  const [stallPhotos, setStallPhotos] = useState<string[]>([]);

  useEffect(() => {
    if (!session?.user?.id) return;

    fetch("/api/vendors")
      .then((res) => res.json())
      .then((data) => {
        const myProfile = (data.vendors || []).find(
          (v: { user: { id: string } }) => v.user.id === session.user.id
        );
        if (myProfile) {
          setProfileId(myProfile.id);
          setBusinessName(myProfile.businessName || "");
          setCategory(myProfile.category || "");
          setDescription(myProfile.description || "");
          setPhone(myProfile.user.phone || "");
          setLogo(myProfile.logo || "");
          setExperience(myProfile.experience ? String(myProfile.experience) : "");
          setFssaiNumber(myProfile.fssaiNumber || "");
          setUdyamNumber(myProfile.udyamNumber || "");
          setTrustScore(myProfile.trustScore || 0);
          setIsTrusted(myProfile.isTrusted || false);
          setStallPhotos(
            myProfile.stallPhotos ? JSON.parse(myProfile.stallPhotos) : []
          );

          // Parse social links
          if (myProfile.socialLinks) {
            try {
              const links = JSON.parse(myProfile.socialLinks);
              setWhatsapp(links.whatsapp || "");
              setInstagram(links.instagram || "");
            } catch {
              // ignore
            }
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [session]);

  const handleSave = async () => {
    if (!profileId) {
      toast.error("Profile not found. Please contact support.");
      return;
    }
    if (!businessName.trim()) {
      toast.error("Business name is required");
      return;
    }

    setSaving(true);
    try {
      const socialLinks: Record<string, string> = {};
      if (whatsapp.trim()) socialLinks.whatsapp = whatsapp.trim();
      if (instagram.trim()) socialLinks.instagram = instagram.trim();

      const res = await fetch(`/api/vendors/${profileId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: businessName.trim(),
          category,
          description: description.trim(),
          phone: phone.trim(),
          logo: logo.trim(),
          experience: experience ? parseInt(experience) : 0,
          fssaiNumber: fssaiNumber.trim() || null,
          udyamNumber: udyamNumber.trim() || null,
          socialLinks: Object.keys(socialLinks).length > 0 ? socialLinks : null,
          stallPhotos: stallPhotos.filter((p) => p.trim()),
        }),
      });

      if (res.ok) {
        toast.success("Profile updated!");
      } else {
        toast.error("Failed to update profile");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const addPhotoSlot = () => setStallPhotos([...stallPhotos, ""]);
  const removePhoto = (i: number) =>
    setStallPhotos(stallPhotos.filter((_, idx) => idx !== i));
  const updatePhoto = (i: number, val: string) => {
    const updated = [...stallPhotos];
    updated[i] = val;
    setStallPhotos(updated);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!profileId) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          No vendor profile found
        </h2>
        <p className="text-gray-500">Make sure you are registered as a vendor.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Edit Your Profile</h1>
        <Link
          href={`/vendors/${profileId}`}
          className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
        >
          <Eye className="h-4 w-4" /> View Public Profile
        </Link>
      </div>

      {/* Trust Score Banner */}
      <Card className="mb-6 border-indigo-100 bg-indigo-50/50">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
                <ShieldCheck className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">
                  Trust Score:{" "}
                  <span className="text-indigo-600 font-bold">{trustScore}/100</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {isTrusted
                    ? "You have Trusted Vendor status!"
                    : "Complete your profile, add photos & get reviews to boost your score"}
                </p>
              </div>
            </div>
            {isTrusted && (
              <span className="bg-green-100 text-green-700 text-xs font-medium px-3 py-1 rounded-full">
                Trusted
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardContent className="py-5 space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
              Business Details
            </h3>
            <Input
              label="Business Name"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="e.g. Ravi's Biryani Stall"
            />
            <Select
              label="Category"
              options={categoryOptions}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Select category"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                About Your Business
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell event managers about your business, what you sell, your specialty..."
                rows={3}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Phone Number"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
              />
              <Input
                label="Years of Experience"
                type="number"
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                placeholder="e.g. 5"
              />
            </div>
          </CardContent>
        </Card>

        {/* Logo */}
        <Card>
          <CardContent className="py-5 space-y-3">
            <Input
              label="Logo / Profile Photo URL"
              value={logo}
              onChange={(e) => setLogo(e.target.value)}
              placeholder="Paste image link (Google Drive, Instagram, etc.)"
              helperText="Paste a link to your business logo or photo"
            />
            {logo && (
              <div className="flex items-center gap-3">
                <img
                  src={logo}
                  alt="Logo preview"
                  className="h-16 w-16 rounded-full object-cover border"
                />
                <span className="text-xs text-gray-400">Preview</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Social Links */}
        <Card>
          <CardContent className="py-5 space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
              Social Links
            </h3>
            <Input
              label="WhatsApp Number"
              type="tel"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="+91 98765 43210"
              helperText="Customers can message you directly on WhatsApp"
            />
            <Input
              label="Instagram Handle"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              placeholder="@yourbusiness"
              helperText="Shows on your public profile"
            />
          </CardContent>
        </Card>

        {/* Verification Documents */}
        <Card>
          <CardContent className="py-5 space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
              Verification & Compliance
            </h3>
            <Input
              label="FSSAI License Number"
              value={fssaiNumber}
              onChange={(e) => setFssaiNumber(e.target.value)}
              placeholder="14-digit FSSAI number"
              helperText="Required for food vendors. Shows FSSAI badge on your profile."
            />
            <Input
              label="Udyam Registration Number"
              value={udyamNumber}
              onChange={(e) => setUdyamNumber(e.target.value)}
              placeholder="UDYAM-XX-00-0000000"
              helperText="If you have Udyam/MSME registration, add it for verified badge"
            />
            <Link
              href="/dashboard/vendor/documents"
              className="text-sm text-indigo-600 hover:text-indigo-700 inline-block"
            >
              Manage all documents &rarr;
            </Link>
          </CardContent>
        </Card>

        {/* Stall Photos */}
        <Card>
          <CardContent className="py-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Past Stall Photos
                </label>
                <p className="text-xs text-gray-400 mt-0.5">
                  Add photos to boost your trust score (+1 pt each, up to 5)
                </p>
              </div>
              <button
                onClick={addPhotoSlot}
                className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                <Plus className="h-3.5 w-3.5" /> Add Photo
              </button>
            </div>
            {stallPhotos.length > 0 ? (
              <div className="space-y-3">
                {stallPhotos.map((photo, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={photo}
                        onChange={(e) => updatePhoto(i, e.target.value)}
                        placeholder="Paste photo link..."
                        className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                      {photo && (
                        <img
                          src={photo}
                          alt={`Stall photo ${i + 1}`}
                          className="mt-2 h-20 w-28 object-cover rounded-lg border"
                        />
                      )}
                    </div>
                    <button
                      onClick={() => removePhoto(i)}
                      className="p-2 text-gray-400 hover:text-red-500 mt-0.5"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                <ImageIcon className="h-8 w-8 mx-auto mb-1" />
                <p className="text-sm">Add photos of your past stalls to build trust</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Save */}
        <Button size="lg" className="w-full" onClick={handleSave} isLoading={saving}>
          <Save className="h-4 w-4 mr-2" /> Save Profile
        </Button>
      </div>
    </div>
  );
}
