/**
 * WhatsApp sender helper via WATI API.
 *
 * If WATI_API_URL + WATI_API_KEY are not set in .env, messages are only
 * logged to the console (stub mode). Plug in real credentials to activate.
 *
 * WATI docs: https://docs.wati.io/reference/post_api-v1-sendsessionmessage-whatsappnumber
 */
export async function sendWhatsAppMessage(phone: string, message: string): Promise<void> {
  const apiUrl = process.env.WATI_API_URL;
  const apiKey = process.env.WATI_API_KEY;

  if (!apiUrl || !apiKey) {
    // ── STUB MODE ── Replace this with real sending once credentials are set
    console.log(`[WhatsApp STUB] To ${phone}: ${message}`);
    return;
  }

  // Normalise to digits-only (WATI expects no +/spaces)
  const normalizedPhone = phone.replace(/\D/g, "");

  // WATI send-session-message endpoint
  await fetch(`${apiUrl}/api/v1/sendSessionMessage/${normalizedPhone}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ messageText: message }),
  });
}
