import { prisma } from "@/lib/prisma";

interface NotifyPayload {
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
}

// Central notification dispatcher — in-app always, email/WhatsApp when prefs say so
export async function notify(payload: NotifyPayload) {
  const { userId, type, title, message, link } = payload;

  // Always create in-app notification
  await prisma.notification.create({
    data: { userId, type, title, message, link: link || null },
  });

  // Load prefs (non-blocking — don't throw if prefs missing)
  try {
    const prefs = await prisma.notificationPreference.findUnique({ where: { userId } });

    if (prefs?.email) {
      await sendEmail(userId, title, message).catch(() => {});
    }

    if (prefs?.whatsapp && prefs.whatsappNo) {
      await sendWhatsApp(prefs.whatsappNo, title, message).catch(() => {});
    }
  } catch {
    // prefs failure should never break the main flow
  }
}

async function sendEmail(userId: string, title: string, message: string) {
  const emailApiUrl = process.env.EMAIL_API_URL;
  const emailApiKey = process.env.EMAIL_API_KEY;
  if (!emailApiUrl || !emailApiKey) return;

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true } });
  if (!user) return;

  await fetch(emailApiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${emailApiKey}` },
    body: JSON.stringify({ to: user.email, toName: user.name, subject: title, text: message }),
  });
}

// WhatsApp via WATI or Twilio — plug API key in .env to activate
async function sendWhatsApp(phone: string, title: string, message: string) {
  const watiUrl = process.env.WATI_API_URL;
  const watiKey = process.env.WATI_API_KEY;
  if (!watiUrl || !watiKey) return;

  const normalized = phone.replace(/\D/g, "");
  await fetch(`${watiUrl}/sendSessionMessage/${normalized}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: watiKey },
    body: JSON.stringify({ messageText: `*${title}*\n${message}` }),
  });
}
