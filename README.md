# Bite & Bloom

Bite & Bloom is a Kenya-focused cake storefront and bakery operations platform. It is a Next.js App Router application backed by Prisma and Neon PostgreSQL, with server-authoritative catalog, cart, checkout, inventory, order, account, and administration workflows.

**Repository state:** active MVP implementation; not launch-ready yet.

**Last reviewed:** 15 August 2026

## What is working

The repository currently contains:

- A responsive branded storefront with home, catalog, category, product, cart, checkout, tracking, contact, FAQ, offers, about, privacy, terms, and cookies pages.
- Catalog data loaded from Prisma through public cake list/detail/review APIs. Active variants expose availability as `quantityOnHand - quantityReserved`.
- Guest cart persistence through the HTTP-only `bite_bloom_cart` cookie, server-side price/customization validation, coupon application/removal, delivery scheduling, and inventory reservations.
- Checkout for delivery or pickup, future dates within the server validation window, fixed delivery slots, M-Pesa STK Push when Daraja is configured, and cash-on-delivery confirmation through WhatsApp.
- Auth.js credentials login, customer registration, email verification and password-reset routes, JWT sessions, protected account pages, saved addresses, customer orders, and wishlist operations.
- Customer order tracking, payment retry for an eligible pending M-Pesa order, a server-enforced order state machine, shipment records/events, inventory adjustment, and expired-reservation release APIs.
- Protected admin APIs for catalog, orders, order notes, shipments, inventory, customers, reviews, and date-range analytics. The admin page is protected by middleware for `admin` and `owner` roles.
- Seed data for roles, permissions, an optional owner account, three cakes with size variants and inventory, and the `SWEET10` coupon.
- Durable Prisma models for commerce, payments, reservations, reviews, wishlist, loyalty, media, notifications, contact/newsletter records, analytics, and audit logs.

## What is not complete

The current implementation still needs production hardening and UI integration in several areas:

- `prisma/migrations/` is empty. Use `db:push` only for local development until a reviewed migration baseline is created; do not treat the current schema as deployed production state.
- The admin page still contains prototype/sample sections for overview, orders, delivery, customers, analytics, inventory, and staff. Their protected APIs exist, but those screens are not all connected to them.
- Product and admin image controls currently collect/display filenames or placeholders. Cloudflare R2 upload sessions and verified media attachment are not implemented in the current route tree.
- M-Pesa requires real Daraja credentials and a public HTTPS callback URL. Resend, WhatsApp Cloud, R2, Turnstile/WAF, monitoring, and scheduled-job hosting are not configured in this repository.
- There are no automated unit, API, browser, backup-restore, or staging tests, and no CI or deployment configuration.
- Business decisions still need confirmation for delivery areas/fees, pickup rules, cancellation/refunds, notifications, retention, and the final catalog.

Treat these limitations as explicit release blockers rather than simulated functionality.

## Repository layout

```text
frontend/
  app/                 App Router pages, layouts, and Route Handlers under app/api
  components/          Shared storefront, checkout, tracking, layout, and admin UI
  lib/server/          Server-only auth, access, catalog, cart, checkout helpers, Prisma, and payments
  hooks/ store/ types/ Client hooks, state, and domain types
prisma/
  schema.prisma        Database model and enum source of truth
  seed.ts              Idempotent development seed
docs/
  architecture/        Database and workflow boundaries
PROJECT_HANDOFF.md     Current implementation handoff and gaps
PROJECT_FEATURES_IMPLEMENTATION_PLAN.md
rules.md               Engineering and security rules
```

The root `backend/` directory is not a running separate API service. Feature APIs use Next.js Route Handlers and server-only helpers under `frontend/lib/server`.

## Requirements

- Node.js compatible with the installed Next.js 14/React 18 toolchain.
- npm.
- Neon PostgreSQL, or another PostgreSQL instance for local development.
- Optional for payment testing: Safaricom Daraja sandbox credentials and a public HTTPS callback endpoint.

## Local setup on Windows

From the repository root:

```powershell
npm install
Copy-Item .env.example .env.local
```

Fill `.env.local` with a local/staging `DATABASE_URL` and a unique `NEXTAUTH_SECRET`. Add the seed owner values if you want `npm run db:seed` to create an owner account. Keep credentials out of git and out of documentation.

Generate the Prisma client and initialize a local development database:

```powershell
npm run db:generate
npm run db:push
npm run db:seed
```

`db:push` is the current development workflow because no migration files have been committed yet. A production release must use a reviewed migration process before deployment.

Because the Windows repository path contains `&`, the direct Next binary is the most reliable local preview command:

```powershell
node .\node_modules\next\dist\bin\next dev --turbo frontend
```

Open `http://localhost:3000`. Useful routes include `/`, `/cakes`, `/cart`, `/checkout`, `/account`, `/tracking`, and `/admin`.

The package scripts remain available for normal paths:

```powershell
npm run dev
npm run build
npm run start
npm run lint
npm run db:studio
```

## Environment contract

`.env.example` is the source of truth for names and contains placeholders only.

| Group | Variables | Required for |
| --- | --- | --- |
| Database | `DATABASE_URL` | Prisma-backed catalog, cart, accounts, checkout, and APIs |
| Auth | `NEXTAUTH_SECRET`, `NEXTAUTH_URL` | Auth.js sessions and account routes |
| Public URL | `NEXT_PUBLIC_SITE_URL` | Links and deployment configuration |
| Seed owner | `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `SEED_ADMIN_NAME` | Optional development owner seed |
| M-Pesa | `MPESA_ENVIRONMENT`, `MPESA_CONSUMER_KEY`, `MPESA_CONSUMER_SECRET`, `MPESA_SHORTCODE`, `MPESA_PASSKEY`, `MPESA_CALLBACK_URL`, `MPESA_TRANSACTION_TYPE` | M-Pesa checkout and retry |
| WhatsApp | `NEXT_PUBLIC_WHATSAPP_ORDER_PHONE` | Cash-on-delivery confirmation and support links |
| Storefront contact | `NEXT_PUBLIC_CONTACT_EMAIL`, `NEXT_PUBLIC_CONTACT_PHONE_DISPLAY`, `NEXT_PUBLIC_CONTACT_PHONE`, `NEXT_PUBLIC_STUDIO_ADDRESS`, `NEXT_PUBLIC_MAP_SEARCH_URL`, `NEXT_PUBLIC_MAP_EMBED_URL`, social URL variables | Public contact, map, and social actions |
| Jobs | `CRON_SECRET` | Trusted expired-reservation job calls |

Never put database, Auth.js, Daraja, or scheduler secrets in `NEXT_PUBLIC_*` variables.

## API surface

Public routes include `/api/health`, `/api/cakes`, `/api/cakes/[slug]`, `/api/cakes/[slug]/reviews`, `/api/cart`, `/api/cart/items`, `/api/cart/coupons`, `/api/checkout`, `/api/orders/[orderNumber]`, `/api/contact`, and `/api/newsletter`.

Authenticated customer routes include `/api/account`, `/api/account/addresses`, `/api/account/orders`, `/api/account/wishlist`, and the authenticated order/payment retry paths.

Admin routes include `/api/admin/cakes`, `/api/admin/orders`, `/api/admin/orders/[id]/notes`, `/api/admin/orders/[id]/shipment`, `/api/admin/shipments`, `/api/admin/inventory`, `/api/admin/customers`, `/api/admin/reviews`, and `/api/admin/analytics`.

Auth and operational routes include `/api/auth/*`, `/api/payments/mpesa/callback`, and `/api/jobs/expire-reservations`.

Every database-dependent handler returns a configuration/unavailable response when `DATABASE_URL` is absent. This makes the missing local configuration visible instead of silently falling back to browser-only data.

## Verification

Run these checks after source or schema changes:

```powershell
node .\node_modules\typescript\bin\tsc --noEmit -p .\frontend\tsconfig.json
node .\node_modules\next\dist\bin\next lint frontend
node .\node_modules\next\dist\bin\next build frontend
```

Type-check and build are separate checks. Direct local binaries avoid the `&` path parsing issue on Windows in this repository. Lint currently completes with two existing React hook dependency warnings. A valid database URL may be required by build-time imports or Prisma initialization. Manual smoke testing should cover catalog loading, add-to-cart, checkout validation, account ownership, admin authorization, reservation expiry, and the configured payment callback before any release.

## Related documentation

- [Current project handoff](PROJECT_HANDOFF.md)
- [Feature implementation plan](PROJECT_FEATURES_IMPLEMENTATION_PLAN.md)
- [Database and workflow architecture](docs/architecture/database-and-workflows.md)
- [Engineering and security rules](rules.md)
