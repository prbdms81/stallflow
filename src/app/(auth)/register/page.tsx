"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { Card, CardContent } from "@/components/ui/Card";
import toast from "react-hot-toast";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "VENDOR",
    company: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }

    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          password: form.password,
          role: form.role,
          company: form.company,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Account created! Please login.");
        router.push("/login");
      } else {
        toast.error(data.error || "Registration failed");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardContent className="p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Create Account</h1>
          <p className="text-gray-500 mt-1">Join StallMate and start booking stalls</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="name"
            name="name"
            label="Full Name"
            value={form.name}
            onChange={handleChange}
            placeholder="John Doe"
            required
          />
          <Input
            id="email"
            name="email"
            label="Email Address"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="you@example.com"
            required
          />
          <Input
            id="phone"
            name="phone"
            label="Phone Number"
            type="tel"
            value={form.phone}
            onChange={handleChange}
            placeholder="+91 9876543210"
          />
          <Select
            id="role"
            name="role"
            label="I am a"
            value={form.role}
            onChange={handleChange}
            options={[
              { value: "VENDOR", label: "Stall Vendor - I want to book stalls" },
              { value: "EVENT_MANAGER", label: "Event Manager - I organize events" },
              { value: "VENUE_ADMIN", label: "Venue Admin - I manage a venue" },
            ]}
          />
          <Input
            id="company"
            name="company"
            label="Business/Company Name (Optional)"
            value={form.company}
            onChange={handleChange}
            placeholder="Your business name"
          />
          <Input
            id="password"
            name="password"
            label="Password"
            type="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Min 6 characters"
            required
          />
          <Input
            id="confirmPassword"
            name="confirmPassword"
            label="Confirm Password"
            type="password"
            value={form.confirmPassword}
            onChange={handleChange}
            placeholder="Re-enter password"
            required
          />

          <Button type="submit" size="lg" className="w-full" isLoading={loading}>
            Create Account
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link href="/login" className="text-indigo-600 hover:underline font-medium">
            Sign In
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
