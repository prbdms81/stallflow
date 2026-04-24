export type Lang = "en" | "te" | "hi";

export const LANG_LABELS: Record<Lang, string> = {
  en: "English",
  te: "తెలుగు",
  hi: "हिन्दी",
};

const strings = {
  // Page header
  bookStall: { en: "Book Your Stall", te: "మీ స్టాల్ బుక్ చేయండి", hi: "अपना स्टॉल बुक करें" },
  eventDetails: { en: "Event Details", te: "ఈవెంట్ వివరాలు", hi: "इवेंट विवरण" },
  venue: { en: "Venue", te: "వేదిక", hi: "स्थान" },
  date: { en: "Date", te: "తేదీ", hi: "तारीख" },
  time: { en: "Time", te: "సమయం", hi: "समय" },
  price: { en: "Price", te: "ధర", hi: "कीमत" },
  startingFrom: { en: "Starting from", te: "మొదలు", hi: "शुरू से" },
  perStall: { en: "per stall", te: "ప్రతి స్టాల్", hi: "प्रति स्टॉल" },

  // Step 1: Stall selection
  selectStall: { en: "Select a Stall", te: "స్టాల్ ఎంచుకోండి", hi: "स्टॉल चुनें" },
  available: { en: "Available", te: "అందుబాటులో", hi: "उपलब्ध" },
  booked: { en: "Booked", te: "బుక్ అయింది", hi: "बुक हो गया" },
  reserved: { en: "Reserved", te: "రిజర్వ్", hi: "आरक्षित" },
  stallNo: { en: "Stall", te: "స్టాల్", hi: "स्टॉल" },
  type: { en: "Type", te: "రకం", hi: "प्रकार" },
  size: { en: "Size", te: "సైజు", hi: "आकार" },
  next: { en: "Next", te: "తదుపరి", hi: "आगे" },

  // Step 2: Your details
  yourDetails: { en: "Your Details", te: "మీ వివరాలు", hi: "आपकी जानकारी" },
  fullName: { en: "Full Name", te: "పూర్తి పేరు", hi: "पूरा नाम" },
  phoneNumber: { en: "Phone Number", te: "ఫోన్ నంబర్", hi: "फोन नंबर" },
  businessName: { en: "Business Name", te: "���్యాపారం పేరు", hi: "व्यापार का नाम" },
  optional: { en: "Optional", te: "ఐచ్ఛికం", hi: "वैकल्पिक" },
  category: { en: "Category", te: "వర్గం", hi: "श्रेणी" },
  notes: { en: "Notes", te: "గమనికలు", hi: "नोट्स" },
  anySpecialNeeds: { en: "Any special requirements?", te: "ఏదైనా ప్రత్యేక అవసరం?", hi: "��ोई खास जरूरत?" },

  // Step 3: Payment
  confirmBooking: { en: "Confirm Booking", te: "బుకింగ్ నిర్ధారించండి", hi: "बुकिंग पक्की करें" },
  stallPrice: { en: "Stall Price", te: "స్టాల్ ధర", hi: "स्टॉल कीमत" },
  gst: { en: "GST (18%)", te: "జీఎస్టీ (18%)", hi: "जीएसटी (18%)" },
  total: { en: "Total", te: "మొత్తం", hi: "कुल" },
  payViaUpi: { en: "Pay via UPI", te: "UPI ద్వారా చెల్లించండి", hi: "UPI से भुगतान करें" },
  payAtVenue: { en: "Pay at Venue", te: "వేదిక వద్ద చెల్లించండి", hi: "स्थान पर भुगतान करें" },
  back: { en: "Back", te: "వెనక్కి", hi: "वापस" },

  // Confirmation
  bookingConfirmed: { en: "Booking Confirmed!", te: "బుకింగ్ నిర్ధారించబడింది!", hi: "बुकिंग पक्की हो गई!" },
  bookingNumber: { en: "Booking Number", te: "బుకింగ్ నంబర్", hi: "बुकिंग नंबर" },
  shareOnWhatsApp: { en: "Save to WhatsApp", te: "WhatsApp లో సేవ్ చేయండి", hi: "WhatsApp पर सेव करें" },
  contactOrganizer: { en: "Contact Organizer", te: "నిర్వాహకుని సంప్రదించండి", hi: "आयोजक से संपर्क करें" },
  paymentPending: { en: "Payment pending — pay via UPI or at venue", te: "చెల్లింపు పెండింగ్ — UPI లేదా వేదిక వద్ద చెల్లించండి", hi: "भुगतान बाकी — UPI या स्थान पर भुगतान करें" },

  // Misc
  stallsLeft: { en: "stalls left", te: "స్టాల్స్ మిగిలి ఉన్నాయి", hi: "स्टॉल बचे हैं" },
  eventNotFound: { en: "Event not found", te: "ఈవెంట్ కనుగొనబడలేదు", hi: "इवेंट नहीं मिला" },
  bookingFailed: { en: "Booking failed. Please try again.", te: "బుకింగ్ విఫలమైంది. మళ్ళీ ప్రయత్నించండి.", hi: "बुकिंग विफल. कृपया फिर से कोशिश करें." },
  parking: { en: "Parking", te: "పార్కింగ్", hi: "पार्किंग" },
  poweredBy: { en: "Powered by StallMate", te: "StallMate ద్వారా", hi: "StallMate द्वारा" },
} as const;

export type StringKey = keyof typeof strings;

export function t(key: StringKey, lang: Lang): string {
  return strings[key]?.[lang] || strings[key]?.en || key;
}
