/**
 * WhatsApp webhook — Feature 32
 *
 * This endpoint receives incoming WhatsApp messages forwarded by WATI and
 * drives a simple conversational booking-inquiry flow backed by the
 * WhatsAppSession table.
 *
 * ┌─────────────────────────────────────────────────────────────┐
 * │  WATI webhook setup                                          │
 * │  POST  https://your-domain/api/webhooks/whatsapp            │
 * │  GET   https://your-domain/api/webhooks/whatsapp  (health)  │
 * └─────────────────────────────────────────────────────────────┘
 *
 * Conversation flow:
 *   IDLE        → any message  → show main menu  (step → MENU)
 *   MENU        → "1"          → list upcoming events (step → BROWSING)
 *   MENU        → "2"          → ask for registered phone (step → BOOKING_LOOKUP)
 *   MENU        → "3"          → support message + reset to IDLE
 *   BROWSING    → "EVENT_xxx"  → show event details + booking link
 *   BOOKING_LOOKUP → <phone>   → list last 3 bookings for that user
 *   (any)       → unknown      → reset to IDLE + show menu
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

// ── Message templates ────────────────────────────────────────────────────────

const MAIN_MENU =
  "Hi! Welcome to StallMate 🎪\n\n" +
  "1️⃣  Browse Events\n" +
  "2️⃣  My Bookings\n" +
  "3️⃣  Talk to Support\n\n" +
  "Reply with 1, 2, or 3";

const SUPPORT_MSG =
  "Our support team will reach out to you shortly.\n" +
  "You can also email us at support@stallmate.in 📧";

// ── GET — health check / WATI webhook verification ───────────────────────────

export async function GET() {
  return NextResponse.json({ status: "ok", service: "stallmate-whatsapp-bot" });
}

// ── POST — incoming message from WATI ────────────────────────────────────────

interface WATIPayload {
  /** Sender's WhatsApp number (no +, digits only: "919876543210") */
  waId?: string;
  /** Inbound message text */
  text?: string;
  /** Unix timestamp (string) */
  timestamp?: string;
  /** Some WATI versions nest the message here */
  message?: { text?: string };
}

export async function POST(req: NextRequest) {
  try {
    const body: WATIPayload = await req.json();

    // Normalise fields — WATI payload shape varies slightly by plan
    const phone: string = (body.waId ?? "").trim();
    const text: string = (body.text ?? body.message?.text ?? "").trim();

    if (!phone || !text) {
      return NextResponse.json({ error: "missing waId or text" }, { status: 400 });
    }

    // Load or create session
    let session = await prisma.whatsAppSession.findUnique({ where: { phone } });
    if (!session) {
      session = await prisma.whatsAppSession.create({
        data: { phone, step: "IDLE", data: "{}" },
      });
    }

    const step = session.step;
    const upper = text.toUpperCase().trim();

    let reply = "";
    let nextStep = step;

    // ── State machine ────────────────────────────────────────────────────────

    if (step === "IDLE") {
      // Any message from IDLE → show main menu
      reply = MAIN_MENU;
      nextStep = "MENU";

    } else if (step === "MENU") {
      if (upper === "1") {
        // List 3 upcoming published events
        const events = await prisma.event.findMany({
          where: { status: "PUBLISHED", startDate: { gte: new Date() } },
          orderBy: { startDate: "asc" },
          take: 3,
          select: { id: true, title: true, startDate: true, maxStalls: true, bookedStalls: true },
        });

        if (events.length === 0) {
          reply = "No upcoming events at the moment. Check back soon! 🔔\n\nReply anything to go back to the menu.";
          nextStep = "IDLE";
        } else {
          const lines = events.map((e, i) => {
            const date = e.startDate.toLocaleDateString("en-IN", {
              day: "numeric", month: "short", year: "numeric",
            });
            const available = e.maxStalls - e.bookedStalls;
            return `${i + 1}. *${e.title}*\n   📅 ${date} | 🏪 ${available} stalls left\n   Reply: EVENT_${e.id}`;
          });
          reply = "🎪 *Upcoming Events:*\n\n" + lines.join("\n\n") + "\n\nReply EVENT_<id> for details";
          nextStep = "BROWSING";
        }

      } else if (upper === "2") {
        reply = "Please reply with the phone number you used to register on StallMate (e.g. 9876543210):";
        nextStep = "BOOKING_LOOKUP";

      } else if (upper === "3") {
        reply = SUPPORT_MSG;
        nextStep = "IDLE";

      } else {
        // Unknown input from MENU → reset
        reply = "Oops! I didn't understand that. Let me show the menu again.\n\n" + MAIN_MENU;
        nextStep = "MENU";
      }

    } else if (step === "BROWSING") {
      // Expect "EVENT_<id>"
      const eventMatch = upper.match(/^EVENT_([A-Z0-9]+)$/i);
      if (eventMatch) {
        const eventId = eventMatch[1];
        const event = await prisma.event.findUnique({
          where: { id: eventId },
          select: {
            id: true, title: true, startDate: true, endDate: true,
            startTime: true, endTime: true, maxStalls: true,
            bookedStalls: true, basePrice: true, venue: { select: { name: true, city: true } },
          },
        });

        if (!event) {
          reply = "Event not found. Please check the ID and try again, or reply MENU to go back.";
        } else {
          const available = event.maxStalls - event.bookedStalls;
          const startDate = event.startDate.toLocaleDateString("en-IN", {
            day: "numeric", month: "short", year: "numeric",
          });
          reply =
            `🎪 *${event.title}*\n\n` +
            `📅 ${startDate} | ⏰ ${event.startTime} – ${event.endTime}\n` +
            `📍 ${event.venue.name}, ${event.venue.city}\n` +
            `🏪 Stalls available: ${available} / ${event.maxStalls}\n` +
            `💰 Starting from ₹${event.basePrice.toLocaleString("en-IN")}\n\n` +
            `👉 Book now: https://stallmate.in/events/${event.id}`;
        }
        nextStep = "BROWSING"; // keep in BROWSING so user can look up more events
      } else if (upper === "MENU" || upper === "0") {
        reply = MAIN_MENU;
        nextStep = "MENU";
      } else {
        reply = "Please reply with EVENT_<id> from the list, or reply MENU to go back.";
      }

    } else if (step === "BOOKING_LOOKUP") {
      // Expect a phone number (10 digits)
      const digits = text.replace(/\D/g, "");
      if (digits.length >= 10) {
        const lookupPhone = digits.slice(-10); // last 10 digits

        // Find user by phone — match last 10 digits (stored format may vary)
        const user = await prisma.user.findFirst({
          where: { phone: { endsWith: lookupPhone } },
          select: { id: true, name: true },
        });

        if (!user) {
          reply =
            "No account found with that phone number. Make sure you use the number registered on StallMate.\n\n" +
            "Reply MENU to start over.";
          nextStep = "IDLE";
        } else {
          const bookings = await prisma.booking.findMany({
            where: { vendorId: user.id },
            orderBy: { createdAt: "desc" },
            take: 3,
            select: {
              bookingNumber: true, status: true, totalAmount: true,
              event: { select: { title: true, startDate: true } },
            },
          });

          if (bookings.length === 0) {
            reply = `Hi ${user.name}! You have no bookings yet.\n\nBrowse events at https://stallmate.in/events 🎪`;
          } else {
            const lines = bookings.map((b) => {
              const date = b.event.startDate.toLocaleDateString("en-IN", {
                day: "numeric", month: "short", year: "numeric",
              });
              return `• ${b.bookingNumber} — ${b.event.title}\n  📅 ${date} | Status: ${b.status} | ₹${b.totalAmount.toLocaleString("en-IN")}`;
            });
            reply =
              `Hi ${user.name}! Here are your recent bookings:\n\n` +
              lines.join("\n\n") +
              "\n\nFor full details visit: https://stallmate.in/dashboard/vendor/bookings";
          }
          nextStep = "IDLE";
        }
      } else {
        reply = "That doesn't look like a valid phone number. Please reply with your 10-digit mobile number:";
        // stay in BOOKING_LOOKUP
      }

    } else {
      // Unknown step — safety reset
      reply = MAIN_MENU;
      nextStep = "MENU";
    }

    // ── Persist updated step ─────────────────────────────────────────────────
    await prisma.whatsAppSession.update({
      where: { phone },
      data: { step: nextStep },
    });

    // ── Send reply ───────────────────────────────────────────────────────────
    await sendWhatsAppMessage(phone, reply);

    return NextResponse.json({ ok: true, step: nextStep });
  } catch (err) {
    console.error("[WhatsApp webhook error]", err);
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}
