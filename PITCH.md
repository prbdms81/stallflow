# Stallmate

**The operating system for India's stall-booking economy.**

---

## One-liner

Stallmate is a three-sided marketplace that connects **gated communities & corporate parks**
(who have footfall), **event organisers** (who run bazaars, carnivals, and exhibitions),
and **small vendors** (who need stalls to sell) — replacing WhatsApp groups, spreadsheets,
and cash-in-envelope deals with a trust-graded, data-rich booking platform.

---

## The problem

India runs **~50,000 community events a year** across gated communities, IT parks, and
convention centres — from Diwali bazaars to weekend flea markets to wedding expos.
The entire ecosystem is held together by WhatsApp forwards, Google Sheets, and cash.

Each of the three sides loses:

### 🏘️  Venue Admin (RWA / gated community / IT park)
- No way to **measure what residents actually want** — they guess the category mix.
- No **objective vendor quality signal** — same repeat vendors, no new blood.
- Revenue from stall charges never shows up on a dashboard; it's "informal".
- When an organiser asks "has this worked at a similar community?" — no data.

### 🎯  Event Manager (organiser)
- Finds venues by calling RWA presidents one by one.
- Re-creates every event from scratch; **no history** of what sold last time.
- Has no tool to pitch vendors; posts in 12 WhatsApp groups and hopes.
- Payment collection is manual; 20% of stall fee goes in chasing.

### 🛍️  Vendor (small business / MSME / artisan)
- Pays stall rent upfront, with zero visibility into **likely footfall or sales**.
- Shows up to an event and discovers the residents actually wanted plants, not sarees.
- No financing — stall fee is Rs 3,000–20,000 cash, blocking weaker vendors.
- No portable reputation. Good vendors at Aparna Sarovar don't get surfaced at DLF.

---

## The solution

Stallmate is a **Next.js + Prisma marketplace** with role-based dashboards for each side,
tied together by five data loops that compound over time.

### The three personas, in one flow

```
          VENUE ADMIN                       EVENT MANAGER                     VENDOR
   ┌────────────────────────┐       ┌───────────────────────────┐     ┌────────────────────────┐
   │ Owns Aparna Sarovar.   │       │ Runs EventPro Solutions.  │     │ Ravi's Fashion House.  │
   │ Shares demand-poll     │─────▶ │ Sees "residents want food │────▶│ Sees "this community   │
   │ link with 2,000        │       │ 40%, fashion 25%, plants  │     │ wants fashion 25%" →   │
   │ resident WhatsApp      │       │ 15%" while creating event.│     │ books stall with       │
   │ group.                 │       │ Pre-fills stallCategories.│     │ confidence.            │
   └────────────────────────┘       └───────────────────────────┘     └────────────────────────┘
        ▲                                                                        │
        │                                                                        │
        │   Reviews + ratings + earnings history flow back to ALL three sides    │
        └────────────────────────────────────────────────────────────────────────┘
```

---

## What we've built

### 🏘️  For the Venue Admin (RWA / Gated Community)
- **Full CRUD over their venues** with per-venue stats: total events hosted,
  most repeated event companies (ranked), 60-day availability calendar
  showing which days are booked vs free.
- **Past events dashboard** — every past event at their venue, who organised it,
  how many stalls sold, avg rating, vendor feedback comments ("Power tripped
  once on day 1, fixed in 30 min"), plus organiser notes.
- **One-click share** of resident demand polls — drops straight into WhatsApp
  groups so residents vote on what they want to see.
- **Smart Score** — composite venue quality metric visible to organisers.

### 🎯  For the Event Manager
- **Browse all venues** with smart score, avg visitor spend, and per-venue stats.
- **Create event → pick venue → past events + resident demand auto-load.**
  Demand chips show "Food 40% · Fashion 25% · Plants 15%" — tap to add to
  stallCategories.
- **Copy settings from past events** — event type, max stalls, times, categories
  — so the 15th Diwali bazaar takes 30 seconds to create, not 30 minutes.
- **Vendor reviews, event templates, team access, WhatsApp bot integration.**

### 🛍️  For the Vendor
- **Discover events** with fit-scored recommendations (what sells at that venue).
- **Resident demand panel** on every event page — fill-rate bars showing what
  the community has voted for. No more "show up and hope."
- **Unmet-demand badge** — if your category isn't covered by the event but
  residents have asked for it, the page flags it so you can reach out to the
  organiser directly.
- **BNPL / Pay After Event** — book stalls for Rs 3,000–20,000 without upfront
  cash. Settle 30 days post-event.
- **Portable reputation** — ratings, booking history, MSME report, earnings
  calendar — travel with you across venues and cities.

### Platform foundations (already live)
- Role-based auth (NextAuth, 4 roles), Prisma + SQLite (migrating to Postgres
  for prod), Tailwind, Razorpay payment hooks, WhatsApp Bot session model,
  document verification gate, demand votes, sponsor management, utility billing,
  equipment-free stall kits, and more.

---

## Market opportunity

| Metric                                           | Estimate       |
|-------------------------------------------------|----------------|
| Gated communities in top 20 Indian cities       | ~28,000        |
| Corporate campuses / IT parks                   | ~4,500         |
| Community events per venue per year             | 4 – 24         |
| Average stalls per event                        | 25 – 80        |
| Average stall fee per event                     | ₹3,000 – ₹20,000 |
| **Total annual stall-fee GMV (conservative)**   | **₹6,400 Cr**  |
| Take-rate opportunity (platform + financing)    | 12 – 18%       |
| **Serviceable Obtainable Market (5-year view)** | **₹900 Cr/year** |

Hyderabad alone (~600 gated communities) is a ₹40 Cr/year GMV beach-head.

---

## Business model

Stallmate monetises the **entire event lifecycle**, not just listing:

1. **Booking commission** — 5–8% on every stall booked through the platform.
2. **BNPL interest** — 2–3% per month on Pay-After-Event stall financing.
3. **Setup-kit sales** — pre-negotiated tents, tables, signage bundles (10–20% margin).
4. **Smart Score & analytics subscriptions** — organisers pay ₹2,500/month for
   venue-level insights (footfall prediction, vendor mix optimiser).
5. **Venue premium listings** — RWAs pay ₹1,000/month to be featured in the
   organiser search results.
6. **Sponsor matchmaking** — 10% cut on event sponsorship deals we facilitate.

**Unit economics (Year 2 target):**
- Avg event GMV: ₹2.5 L  ·  Stallmate take: ₹18,000 (7.2%)
- Avg events per venue per year: 8
- Avg venue contribution margin: ₹1.44 L/year
- CAC per venue: ₹6,000 (one RWA handshake + demand-poll activation)
- **Payback: ~7 weeks.**

---

## The demand loop — our competitive moat

Every other player in this space is a **listing directory** (BookMyStall, EventsHigh).
They have no feedback signal. Stallmate compounds three data assets:

1. **Resident-voted demand per venue** → proprietary dataset no one else has.
2. **Per-event outcome data** (booked %, reviews, feedback) → training data for
   fit-score and footfall prediction.
3. **Vendor portable reputation** → network effects that lock vendors in and
   make them bring organisers with them.

After 12 months of operation per venue, our category demand prediction is more
accurate than the RWA president's gut feel — and that's what organisers pay for.

---

## What's already live (not vapourware)

- **Running in production at** `http://69.62.80.48/stallmate`
- **Full three-role demo** with 5 vendors, 4 organiser companies, 3 main venues
  (Aparna Sarovar, DLF Cyber City, HICC) + 53 real Hyderabad events pulled from
  public listings.
- **Realistic seeded activity**: 11 past completed events (Oct 2025 – Mar 2026),
  55 completed bookings, 29 vendor reviews with real feedback text, 11 BNPL
  settlements, 90 resident demand votes, 60-day availability calendar.
- **All four demand-loop touch-points wired**: share-link button, creation-time
  chips, public demand panel, unmet-demand alert.
- **~156 API endpoints**, ~60 page routes, ~30 Prisma models.

Login as `admin@stallmate.in`, `manager@stallmate.in`, or `vendor@stallmate.in`
(password `password123`) to see the full loop end-to-end.

---

## Traction & go-to-market

**Phase 1 (next 90 days) — Hyderabad beach-head**
- Sign 15 pilot gated communities (Aparna chain, My Home chain, DLF).
- Onboard 5 event managers already active in these communities.
- Seed 300 vendors from Fatima/Ravi/Lakshmi-type MSMEs.
- Target: 120 events, ₹2.5 Cr GMV, ₹18 L platform revenue.

**Phase 2 (Month 4–12)**
- Expand to Bangalore, Pune, Chennai (similar gated-community density).
- Launch BNPL with an NBFC partner (₹5 Cr credit line).
- Raise ₹8 Cr seed for GTM + product.

**Phase 3 (Year 2+)**
- Tier-2 cities (Vizag, Coimbatore, Indore, Kochi).
- Add fundraisers, school events, and religious festivals.
- ₹40 Cr annual GMV run-rate.

---

## Competition

| Competitor        | What they do                   | What they miss                          |
|-------------------|--------------------------------|-----------------------------------------|
| BookMyStall       | Event listing directory        | No demand signal, no BNPL, no reputation|
| EventsHigh        | Ticketing for paid events      | B2C-only, not vendor-centric            |
| WhatsApp groups   | Zero-friction discovery        | Zero data, zero trust, zero scale       |
| Local organisers  | Hyper-local relationships      | Can't cross venues, no platform leverage|

**We're not a listing site. We're a data company wrapped in a marketplace.**

---

## The ask

**₹8 Crore seed round** to:
- 40% — GTM (venue acquisition, organiser enablement, vendor onboarding)
- 25% — Product (payments, BNPL rails, mobile app, ML demand prediction)
- 20% — Operations (3 city launches, setup-kit inventory)
- 10% — Compliance / legal (FSSAI integration, MSME registration flow, state schemes)
- 5%  — Reserve

**Milestones we'll hit:**
- 15 paying pilot venues by Month 3.
- 500 vendors transacting monthly by Month 9.
- ₹4 Cr annualised GMV by Month 12.
- Series A readiness at Month 18 with multi-city data.

---

## Why now

- **Gated community ecosystem has hit critical mass** — 28K+ communities in
  top cities, most with active RWA WhatsApp groups and UPI-literate residents.
- **MSME formalisation push** (Udyam registration, FSSAI, GST) means vendors
  need platforms that produce invoices, track earnings, and unlock government
  schemes — not platforms that hand out cash receipts.
- **BNPL infrastructure is ready** — NBFCs are hungry for thin-ticket, short-duration
  merchant loans; we're the perfect ramp.
- **AI-driven hyper-local demand prediction** just crossed the accuracy threshold
  needed to beat the RWA president's gut call.

---

## Team

_[To be filled — founders, advisors, domain experts]_

---

## Appendix: product screenshots

_See `http://69.62.80.48/stallmate` live demo. Login credentials above._

Key screens to tour:
1. **Admin venue expand** → 60-day calendar + share demand link button.
2. **Manager create event** → pick Aparna → amber demand chips pre-fill.
3. **Public event page → Overview tab** → "What residents want" panel with
   unmet-demand callout.
4. **Vendor dashboard** → earnings history from seeded past events.

---

_Document version: v1.0  ·  Last updated: April 2026_
