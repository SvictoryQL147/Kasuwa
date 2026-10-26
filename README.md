# Kasuwa: Nigeria-first multi-vendor marketplace

> Working name. Change it in `src/lib/site.ts`.

**What makes it different from Jumia / Temu / Konga**

1. **Team-Up group buying.** Every listing can have a cheaper *team price*. A shopper pays, gets a link, shares it on WhatsApp; when N people join within 24h, everyone gets the team price. If the team doesn't fill, everyone is refunded automatically.
2. **Same-day Express** in Lagos, Abuja, Port Harcourt, Enugu and Ibadan, plus nationwide standard delivery, pickup hubs and **pay on delivery**.
3. **AI shopping assistant** that understands English, Pidgin, Yoruba, Igbo and Hausa, searches the real catalogue and never invents products.

## Stack

| Layer | Choice | Why |
|---|---|---|
| App | Next.js 15 (App Router, Server Actions), React 19, TypeScript | One codebase, SSR for SEO and slow phones |
| DB | Postgres + Drizzle ORM | Works on Supabase/Neon/Railway; no binary engines, fast cold starts |
| Payments | Paystack (card, transfer, USSD) + pay on delivery | Built for Nigeria. All money is stored in **kobo** |
| AI | Anthropic API (tool use) | Falls back to keyword search when no key is set |
| Styling | Tailwind CSS | |
| Hosting | Vercel (`cpt1` Cape Town, the closest region to Lagos) + Vercel Cron | |

## Run locally

```bash
npm install
cp .env.example .env          # set DATABASE_URL and AUTH_SECRET at minimum
npm run db:push               # create tables
npm run db:seed               # 8 categories, 5 Nigerian stores, 24 products, 37 states' delivery rates, 7 pickup hubs
npm run dev                   # http://localhost:3000
```

Demo logins (password `password123`): `buyer@kasuwa.ng` (shopper) and `seller@kasuwa.ng` (Ikeja Gadget Plug).

Without Paystack keys, checkout uses a **test payment page** in dev, so the full flow works out of the box. Add `sk_test_…` keys to use the real Paystack sandbox.

## Going live checklist

1. **Postgres:** create a Supabase/Neon project and set `DATABASE_URL`. Run `npm run db:push && npm run db:seed` (or skip seed and add real sellers).
2. **Paystack:** set `PAYSTACK_SECRET_KEY` / `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`. In Dashboard → Settings → API Keys & Webhooks, set webhook URL `https://YOUR_DOMAIN/api/paystack/webhook`.
3. **AI:** set `ANTHROPIC_API_KEY`.
4. **Cron:** set `CRON_SECRET`. `vercel.json` runs `/api/cron/expire-teams` every 10 minutes to close and refund unfilled teams.
5. Set `NEXT_PUBLIC_SITE_URL` to your domain (used in Paystack callbacks and WhatsApp share links).
6. Make sure `PAYSTACK_MOCK` is **not** `"true"` on the live site.

## How it works

```
src/
  db/schema.ts            Tables: users, stores, categories, products, delivery_rates, pickup_points,
                          orders, order_items, teams, team_members
  db/seed.ts              Nigerian demo data
  lib/orders.ts           markOrderPaid (idempotent, row-locked), Team-Up completion, expireTeams + refunds
  lib/paystack.ts         initialize / verify / refund / webhook HMAC check
  lib/delivery.ts         Express / Standard / Pickup pricing + pay-on-delivery rules
  lib/assistant.ts        Claude tool-use loop over the product search
  lib/queries.ts          Search (Postgres ILIKE over title/tags/description) and product queries
  app/checkout/actions.ts Server-side re-pricing, stock checks, team create/join, order creation
  app/api/paystack/*      Callback (redirect) + webhook (source of truth)
  app/seller/*            Store onboarding, dashboard, listings, fulfilment
```

**Order lifecycle:** `PENDING_PAYMENT → PROCESSING → SHIPPED → DELIVERED`.
Team orders go `PENDING_PAYMENT → AWAITING_TEAM →` (team fills) `PROCESSING`, or (team expires) `REFUNDED`.

Prices are always recomputed on the server from the database. The cart in the browser is display-only.

## Roadmap (phase 2)

- Phone OTP login (Termii) + WhatsApp order notifications (WhatsApp Cloud API)
- Paystack subaccounts for automatic seller split payouts; seller KYC (CAC / NIN) for the verified badge
- Image upload (Cloudinary), product variants (size/colour), reviews with photos
- Logistics API integration (GIG, Kwik, Sendbox) for live tracking
- Typesense/Meilisearch for typo-tolerant search when the catalogue grows
- Voice notes and photo search in the assistant
- Admin panel: disputes, refunds, seller approval, commission reports
- PWA / offline-friendly mode for low-data users
