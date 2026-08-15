# Bite & Bloom — Current Project Handoff

**Last reviewed:** 15 August 2026
**Repository state:** active MVP implementation; production launch is still blocked by migrations, provider setup, testing, and incomplete admin UI integration.

## Executive summary

The repository has moved beyond the original browser-only prototype. The live architecture is now a Next.js App Router application with Prisma-backed Route Handlers and server-only services under `frontend/lib/server`.

The customer journey is substantially implemented: catalog data, product detail, cart, coupon, checkout, inventory reservation, order creation, M-Pesa/COD payment foundations, account resources, tracking, reviews, contact, and newsletter records have server routes. Authentication and coarse admin protection are also present.

The remaining work is primarily integration and release hardening. The visual admin page still contains sample data in several tabs, media upload is not connected to R2, external providers are not configured, the database has no migration history, and automated/staging verification is absent.

## Implemented surface

### Public pages

The App Router contains real pages for:

`/`, `/about`, `/cakes`, `/cakes/[slug]`, `/cakes/[slug]/reviews`, `/categories/[slug]`, `/cart`, `/checkout`, `/contact`, `/faq`, `/offers`, `/tracking`, `/privacy`, `/terms`, and `/cookies`.

The public layout includes the branded navigation/footer, responsive actions, theme support, loading/not-found states, sitemap, robots metadata, and manifest support.

### Authentication and account

- Auth.js credentials login uses Prisma and bcrypt with JWT sessions.
- Registration creates a customer account and can associate eligible prior guest orders by email.
- Forgot-password, reset-password, and email-verification pages/routes use database verification tokens with expiry.
- Middleware protects `/admin/:path*` for sessions carrying the `admin` or `owner` role.
- Account routes cover profile updates, addresses, order history/detail, and wishlist operations.
- Google OAuth, provider email delivery, granular permission checks, invitations, and full account deletion/retention workflows are not configured or complete.

### Catalog and cart

- `/api/cakes` and `/api/cakes/[slug]` read active Prisma catalog records.
- Cake variants include server-calculated available quantity and an availability flag.
- Active customizations and values are returned on product detail and validated again when added to cart.
- Guest carts are persisted with the HTTP-only `bite_bloom_cart` cookie.
- Cart item changes and coupon operations are server-backed; prices are re-read from the catalog.
- The seeded catalog contains three cakes, three size variants per cake, inventory, and one `SWEET10` coupon.
- Search/filter pagination, complete production imagery, R2 uploads, all planned categories, and richer catalog administration remain incomplete.

### Checkout, payment, and inventory

- Checkout validates contact details, delivery/pickup, scheduled date, fixed delivery slots, notes, payment method, cart contents, coupons, customizations, and inventory.
- The server creates immutable order/item/address snapshots and inventory reservations in a transaction.
- Reservation availability is `quantityOnHand - quantityReserved`.
- M-Pesa Daraja STK Push, idempotent callback handling, and guarded payment retry are implemented behind environment configuration.
- Cash on delivery creates a pending cash payment, confirms the order path, and opens a prefilled WhatsApp confirmation link.
- The order transition service consumes reservations when production starts, releases them for cancellation/failure, and settles pending cash payment at delivery.
- The reservation expiry job is protected by `CRON_SECRET` and releases active expired reservations in bounded batches.
- Payment query/reconciliation, refunds, checkout idempotency, service-area/fee rules, slot capacity, and scheduled-job hosting are still required.

### Orders, tracking, reviews, and operations

- Customer order lookup supports order number plus email; authenticated customers can view owned order records.
- The server order state machine records status history and rejects invalid transitions.
- Admin APIs list/update orders, add notes, create/update shipments, and expose shipment events.
- Inventory list and adjustment APIs create stock movement records and protect reserved quantities.
- Verified delivered-order customers can submit one pending review per cake/order combination.
- Public reviews and protected moderation are implemented; moderation writes an audit log.
- Protected date-range analytics returns sales, paid revenue, customer-repeat, daily, and top-cake metrics.
- Delivery staff assignment, proof of delivery, courier/ETA integration, invoices, exports, refunds, notifications, and analytics aggregation remain incomplete.

## Admin status

`frontend/app/admin/page.tsx` is protected by `frontend/middleware.ts` and already connects some catalog, review, and inventory interactions to APIs. It is not yet a complete operational console.

| Area | Current state |
| --- | --- |
| Catalog | API-backed list/create/update foundation; media, category management, and full editor integration remain. |
| Reviews | API-backed loading and moderation UI. |
| Inventory | API-backed listing/restock foundation; purchase orders and richer stock workflow remain. |
| Orders | Protected APIs exist; several page sections still use sample state and need connection. |
| Delivery | Shipment APIs exist; the page remains mostly presentation/prototype UI. |
| Customers | Protected list/detail APIs exist; the page still displays sample directory/metrics. |
| Analytics | Protected query exists; charts still display sample values. |
| Staff and roles | Seeded role/permission data exists; staff management UI/API is not implemented. |

The role selector in the page must never be treated as authorization. Server session checks are the authority.

## Database and configuration status

- `prisma/schema.prisma` is the executable schema source and includes Auth.js, catalog, commerce, payment, shipment, inventory, review, wishlist, loyalty, media, notification, contact/newsletter, analytics, and audit models.
- `prisma/seed.ts` is idempotent for roles, permissions, optional owner, sample catalog/inventory, and `SWEET10`.
- `prisma/migrations/` exists but contains no migration files.
- `.env.example` documents the current environment contract. Local `.env.local` values must remain private.
- The root `backend/` directory is not the active backend. Do not add a parallel server without an explicit architecture decision.
- The package name remains `cake-website`, while the product and repository documentation use Bite & Bloom.

## Release blockers

1. Create and review the initial Prisma migration; verify a disposable restore path before production deployment.
2. Configure separate staging and production values for Neon, Auth.js, Daraja, WhatsApp, email, media, scheduler, and public URLs.
3. Connect the remaining admin screens to protected APIs and remove sample metrics/actions from operational views.
4. Implement and verify R2 media upload/attachment, email/WhatsApp notification delivery, payment reconciliation/refunds, and job scheduling.
5. Add unit/API/browser tests and CI checks for authorization, price tampering, invalid variants, coupon abuse, duplicate checkout/callbacks, reservation expiry, and order transitions.
6. Complete business decisions for delivery coverage/fees, pickup, slots, cancellation/refunds, privacy/retention, final catalog, and legal copy.

## Recommended next sequence

1. Lock business configuration and create the migration baseline.
2. Finish catalog/media and connect the public/admin catalog flows.
3. Connect admin orders, delivery, customers, analytics, and inventory screens.
4. Add notification/payment reconciliation providers and schedule reservation expiry.
5. Add automated tests, staging data, backup/restore verification, security headers/rate limits, and deployment runbooks.
6. Perform mobile/browser smoke testing across catalog, cart, checkout, account, tracking, and admin before launch.

## Validation notes

The documentation describes source-level implementation found in the repository on 15 August 2026. The direct TypeScript check passes; lint completes with two existing React hook dependency warnings in the home/account pages. A live database, Daraja callback, email delivery, external media upload, and production deployment were not verified by this handoff. Run the checks in [README.md](README.md#verification) after configuring a safe development database.

## Key files

- `frontend/app` — pages and Route Handlers.
- `frontend/lib/server` — server-only business and integration helpers.
- `frontend/middleware.ts` — coarse admin route protection.
- `prisma/schema.prisma` — data model.
- `prisma/seed.ts` — development seed.
- `docs/architecture/database-and-workflows.md` — data and workflow boundaries.
- `PROJECT_FEATURES_IMPLEMENTATION_PLAN.md` — current progress and next work.
- `rules.md` — engineering and security constraints.
