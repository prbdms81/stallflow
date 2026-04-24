# Stallmate — 10-Slide Investor Deck

> Drop each slide into Google Slides / Pitch / Canva. One idea per slide.
> Target: 8-minute pitch, 2-minute Q&A buffer.

---

## Slide 1 — Title

**Stallmate**
*The operating system for India's stall-booking economy.*

**Visual:** Logo + hero photo (crowded weekend bazaar at a gated community).
**Footer:** Your name · Role · Month Year · Seed round

**Say:** "Every weekend, 1,000 bazaars happen across India's gated communities.
Today they run on WhatsApp and cash. We're building the platform that runs them."

---

## Slide 2 — The problem

**50,000 community events a year in India run on WhatsApp forwards, Google Sheets, and cash.**

Three sides, three failures:

| 🏘️  **Venue Admin (RWA)** | 🎯 **Event Manager** | 🛍️  **Vendor (MSME)** |
|---|---|---|
| No idea what residents actually want | Calls 30 RWAs to find a venue | Pays ₹3K–20K upfront, no footfall signal |
| Same repeat vendors, no new blood | Re-creates every event from scratch | No portable reputation across venues |
| Revenue invisible, "informal" | Payment chasing eats 20% of fees | No financing → weaker vendors locked out |

**Visual:** Split photo of a cramped WhatsApp group vs. a messy event-day spreadsheet.

**Say:** "The ecosystem is huge. The tooling is zero. Everyone loses money to friction."

---

## Slide 3 — The solution

**One platform. Three dashboards. Five data loops that compound.**

```
 Venue Admin ─ shares demand poll ─▶ Event Manager ─ matches demand ─▶ Vendor
       ▲                                                                 │
       └────────── reviews + earnings + reputation flow back ────────────┘
```

Stallmate is a Next.js + Prisma marketplace where:
- RWAs **see** what residents want, earn from bookings.
- Organisers **plan** events around real demand, copy-paste past events.
- Vendors **discover** the right events, get financed, build reputation.

**Visual:** Three-panel screenshot of the three dashboards side-by-side.

**Say:** "We don't list events. We close the feedback loop that no one else has."

---

## Slide 4 — Market

**₹6,400 Cr annual GMV. ₹900 Cr SOM in 5 years.**

| India's stall-booking market                        |            |
|-----------------------------------------------------|------------|
| Gated communities (top 20 cities)                   | 28,000     |
| Corporate campuses / IT parks                       | 4,500      |
| Events per venue per year                           | 4 – 24     |
| Stalls per event × avg fee                          | 25–80 × ₹3K–20K |
| **Total GMV**                                       | **₹6,400 Cr/yr** |
| Platform + BNPL take-rate                           | 12 – 18%    |
| **Serviceable Obtainable Market (5-yr)**            | **₹900 Cr/yr** |

**Hyderabad alone: 600 communities × ₹40 Cr/yr → our beach-head.**

**Visual:** India map with top 8 cities highlighted by community density.

**Say:** "This isn't a niche. It's bigger than Indian food delivery was in 2013."

---

## Slide 5 — Product (how it works)

**The demand loop in four touch-points — already live.**

1. **RWA shares a poll link** with the resident WhatsApp group (one tap).
2. **Residents vote** categories they want: Food 40%, Fashion 25%, Plants 15%.
3. **Organiser creates event** — demand chips pre-fill stall categories.
4. **Vendor browses event** — sees demand bars, takes stall with confidence.

**What vendors also get:**
- BNPL — pay stall fee 30 days after the event.
- Portable reputation across venues and cities.
- Government scheme hooks (MSME, PM-SVANidhi, T-PRIDE).

**Visual:** Four sequential screenshots — the exact UI of each touch-point.

**Say:** "Every click in the loop creates data that nobody else has. That's our moat."

---

## Slide 6 — Business model

**6 revenue streams. 7-week payback per venue.**

| Revenue stream                              | Rate         |
|--------------------------------------------|--------------|
| Booking commission                         | 5 – 8% of stall fee |
| BNPL interest                              | 2 – 3%/month |
| Setup-kit sales (tents, tables, signage)   | 10 – 20% margin |
| Smart-Score analytics subscription         | ₹2,500/mo per organiser |
| Venue premium listings                     | ₹1,000/mo per venue |
| Sponsor matchmaking                        | 10% cut       |

**Per-venue Year-2 economics:**
- 8 events/yr × ₹2.5 L GMV × 7.2% take → **₹1.44 L margin/venue/year**
- CAC per venue: ₹6,000 → **Payback: 7 weeks**

**Visual:** Stacked bar chart of revenue streams by year 1–5.

**Say:** "This isn't an ads business. We monetise the whole event lifecycle."

---

## Slide 7 — Traction (we've built it)

**Running in production. Real seeded activity. Not slideware.**

Live demo: **`http://69.62.80.48/stallmate`** — login as admin / manager / vendor (pw: `password123`)

- 🧱 **172 files** · **30 Prisma models** · **60 page routes** · **156 API endpoints**
- 🏘️ 3 flagship Hyderabad venues + 53 real events scraped from public listings
- 🎯 4 event-organiser companies with distinct past-event histories
- 🛍️ 5 vendors across fashion / food / handicrafts / plants / jewellery
- 📊 11 completed past events · 55 bookings · 29 reviews · 11 BNPL settlements · 90 demand votes

**What's missing = GTM, not product.**

**Visual:** Single big number — **"0 → 30 models in 6 weeks"** — or dashboard GIF.

**Say:** "When you log in, you see real data flowing through a real loop.
This is what your ₹8 Cr deploys against — not an MVP."

---

## Slide 8 — Competition & moat

**Everyone else lists events. We close the loop.**

| Player              | Model                   | What they're missing                      |
|--------------------|-------------------------|-------------------------------------------|
| BookMyStall        | Listing directory       | No demand signal, no BNPL, no reputation  |
| EventsHigh         | Consumer ticketing      | B2C-only, not vendor-centric              |
| WhatsApp groups    | Zero-friction discovery | Zero data, zero trust, zero scale         |
| Local organisers   | Hyper-local relationships| Can't cross venues; single-city ceiling  |

**Our moat (compounds month-over-month):**
1. **Resident demand graph** — proprietary, per-venue, updated continuously.
2. **Vendor reputation graph** — portable, cross-venue, outcome-weighted.
3. **Event-outcome dataset** — training fuel for footfall prediction.

**Visual:** 2×2 matrix — axes: "has data loop?" vs. "three-sided?" — Stallmate alone in top-right.

**Say:** "After 12 months, our category predictor beats the RWA's gut feel.
That's when organisers stop choosing — they just pay."

---

## Slide 9 — GTM & roadmap

**Hyderabad → 4 cities → Tier-2. Three milestones that matter.**

**Phase 1 · Next 90 days · Hyderabad beach-head**
- 15 pilot gated communities signed (Aparna, My Home, DLF chains).
- 5 organisers live. 300 vendors onboarded.
- **Target: 120 events, ₹2.5 Cr GMV, ₹18 L platform revenue.**

**Phase 2 · Months 4–12 · Expansion**
- Bangalore, Pune, Chennai launched.
- BNPL live with NBFC partner (₹5 Cr credit line).
- **Target: 500 vendors transacting monthly. ₹4 Cr annualised GMV.**

**Phase 3 · Year 2+ · Tier-2 + platform extension**
- Vizag, Indore, Coimbatore, Kochi.
- Fundraisers, school events, religious festivals.
- **Target: ₹40 Cr annual GMV run-rate. Series A ready.**

**Visual:** Simple horizontal timeline with 3 milestones.

**Say:** "Every city we launch uses the playbook from the city before."

---

## Slide 10 — Ask

**Raising ₹8 Crore seed.**

**Use of funds:**
- **40% GTM** — venue acquisition, organiser enablement, vendor onboarding.
- **25% Product** — BNPL rails, mobile app, ML demand prediction.
- **20% Operations** — 3 city launches, setup-kit inventory.
- **10% Compliance** — FSSAI integration, MSME registration flow, state schemes.
- **5% Reserve**

**What you get:**
- 15 paying pilot venues by **Month 3**.
- 500 vendors transacting monthly by **Month 9**.
- ₹4 Cr annualised GMV by **Month 12**.
- **Series A readiness at Month 18** with multi-city data.

**Contact:** your@email · +91 XXXXX XXXXX · stallmate.in

**Visual:** Clean single-column slide with logo, ask, and contact info.

**Say:** "We'll close this round in 45 days. Deploys in Hyderabad within 60.
First investor meeting of a data business you'll regret missing."

---

## Speaker-note cheat sheet

| Slide | Time  | One sentence you MUST say                                                                 |
|-------|-------|--------------------------------------------------------------------------------------------|
| 1     | 20s   | "1,000 bazaars this weekend. All on WhatsApp."                                              |
| 2     | 60s   | "Three sides, three failures, zero tooling."                                                |
| 3     | 45s   | "We close the loop no one else has."                                                        |
| 4     | 45s   | "₹6,400 Cr GMV — bigger than Indian food delivery was in 2013."                             |
| 5     | 90s   | "Four touch-points. Already live. Here's the demo."                                         |
| 6     | 45s   | "Six revenue streams. 7-week payback."                                                      |
| 7     | 75s   | "Log in right now. This is real code, real data, real loop."                                |
| 8     | 45s   | "Listing directories don't compound. Data does."                                            |
| 9     | 45s   | "Hyderabad → 4 cities → Tier-2. Playbook repeats."                                          |
| 10    | 30s   | "₹8 Cr. 18-month window to Series A. Close in 45 days."                                     |

**Total: ~8 min.** Leave ~2 min for Q&A.

---

## Design cues (for the designer)

- **Colour palette**: indigo (primary), amber (accent — mirrors the demand-loop UI), gray-50 (background).
- **Typography**: Inter or similar sans-serif. Headlines 48–60pt. Body 18–20pt.
- **Don't use stock clipart.** Use actual product screenshots.
- **One idea per slide.** If a slide has 3 points, split it.
- **Demo video over slides** for Slide 7 — 45-second loop of a full booking flow.

---

_v1.0 · Last updated April 2026 · See also: PITCH.md (long-form memo)_
