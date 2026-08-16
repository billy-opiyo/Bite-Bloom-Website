# Bite & Bloom — Current Project Handoff

**Last reviewed:** 16 August 2026
**Repository state:** active MVP implementation; production launch is still blocked by migrations, provider setup, testing, and incomplete admin UI integration.

## Executive summary

The repository has moved beyond the original browser-only prototype. The live architecture is now a Next.js App Router application with Prisma-backed Route Handlers and server-only services under `frontend/lib/server`.

The customer journey is substantially implemented: catalog data, product detail, cart, coupon, checkout, inventory reservation, order creation, M-Pesa/COD payment foundations, account resources, tracking, reviews, contact, and newsletter records have server routes. Authentication and coarse admin protection are also present.

The remaining work is primarily integration and release hardening. Admin catalog, orders, delivery, customer directory, analytics, inventory, reviews, and communication views now consume protected APIs with explicit empty states; the staff view remains a clearly labeled prototype pending the role-access decision, the admin UI no longer simulates role switching, media upload is not connected to R2, external providers are not configured, the database has no migration history, and staging execution/release verification is absent. The source-aligned staging checklist is [STAGING_SMOKE_TEST_CHECKLIST.md](docs/STAGING_SMOKE_TEST_CHECKLIST.md).

The homepage post-checkout status display refreshes from the protected order-tracking endpoint; its local “Preview next update” prototype action was removed in favor of the real `/tracking` route.

The public `/tracking` result now refreshes its server status automatically every 30 seconds while the page is open.

## Implemented surface

### Public pages

The App Router contains real pages for:

`/`, `/about`, `/cakes`, `/cakes/[slug]`, `/cakes/[slug]/reviews`, `/categories/[slug]`, `/cart`, `/checkout`, `/contact`, `/faq`, `/offers`, `/tracking`, `/privacy`, `/terms`, and `/cookies`.

The public layout includes the branded navigation/footer, responsive actions, theme support, loading/not-found states, sitemap, robots metadata, and manifest support.

### Authentication and account

- Auth.js credentials login uses Prisma and bcrypt with JWT sessions.
- Registration creates a customer account and can associate eligible prior guest orders by email.
- New password accounts remain `PENDING` until the single-use verification token is consumed; registration no longer auto-signs the user in.
- Forgot-password, reset-password, email-verification, and rate-limited verification-resend pages/routes use database verification tokens with expiry; password-reset token cleanup now targets its namespaced identifier correctly, and each token endpoint rejects tokens belonging to the other flow before touching user records.
- Middleware protects `/admin/:path*` for sessions carrying the `admin` or `owner` role.
- Account routes cover profile updates, address create/edit/delete/default management, order history/detail, and wishlist operations; the account page now exposes those address controls through the protected endpoints.
- Address deletion preserves the default-address invariant by promoting the most recently updated remaining address inside the same transaction.
- `/account/orders/[orderNumber]` now provides authenticated status history, print-ready receipt output, safe cancellation when eligible, and reorder actions that revalidate each stored variant through the cart API.
- Google OAuth provider/button wiring is conditional on `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`; live callback verification and provider credentials remain pending. Provider email delivery, granular permission checks, invitations, and full account deletion/retention workflows are not complete.

### Catalog and cart

- `/api/cakes` and `/api/cakes/[slug]` read active Prisma catalog records.
- Cake variants include server-calculated available quantity and an availability flag.
- Active customizations and values are returned on product detail and validated again when added to cart.
- Public cake cards now include a real WhatsApp order action using the configured business number and a prefilled cake-specific message.
- Product routes expose server-side titles, descriptions, canonical URLs, Open Graph image references, and escaped Product JSON-LD offers.
- The root layout now includes a persistent cookie-consent banner with “Only necessary” and “Accept optional” choices; it does not enable analytics or other optional tracking by itself.
- Global reduced-motion handling and visible `:focus-visible` rings are now present; a full screen-reader/contrast/mobile accessibility review remains a release task.
- Guest carts are persisted with the HTTP-only `bite_bloom_cart` cookie.
- Authenticated account loading now merges the current guest cart into the account cart through `/api/account/cart/merge`.
- Cart item changes and coupon operations are server-backed; prices are re-read from the catalog.
- Signed-in customers can save a cart cake for later; the cart moves it into the server-backed wishlist and removes it from the active cart.
- Account navigation now exposes a protected loyalty history page backed by stored balances and transactions; earning, redemption, and expiry rules are intentionally not invented.
- The seeded catalog contains three cakes, three size variants per cake, inventory, and one `SWEET10` coupon.
- Catalogue search/category/sort filters are validated at the API boundary, results are capped at 100 per page, and the shop has a bounded load-more path. Product and admin media controls now explicitly identify unavailable uploads instead of collecting a filename as if it were saved; complete production imagery, R2 uploads, all planned categories, and richer catalog administration remain incomplete.
- `/custom-cake` captures a structured text brief through the rate-limited contact endpoint with `custom-cake` source tagging; verified reference-image uploads and quotations remain gated on R2 and business policy.

### Checkout, payment, and inventory

- Checkout validates contact details, delivery/pickup, scheduled date, fixed delivery slots, notes, payment method, cart contents, coupons, customizations, and inventory.
- The server creates immutable order/item/address snapshots and inventory reservations in a transaction.
- Checkout accepts a client-generated idempotency key, returns the existing order for repeated submissions, and recovers a concurrent unique-key race when the first order wins.
- Reservation availability is `quantityOnHand - quantityReserved`.
- M-Pesa Daraja STK Push, idempotent callback handling, and guarded payment retry are implemented behind environment configuration.
- Cash on delivery creates a pending cash payment, confirms the order path, and opens a prefilled WhatsApp confirmation link.
- The order transition service consumes reservations when production starts, releases them for cancellation/failure, and settles pending cash payment at delivery.
- Authenticated customers can cancel unpaid `PENDING_PAYMENT` or `CONFIRMED` orders; paid orders intentionally require support review because refund processing is not connected.
- The reservation expiry job is protected by `CRON_SECRET` and releases active expired reservations in bounded batches.
- Payment query/reconciliation, refunds, checkout idempotency, service-area/fee rules, and scheduled-job hosting are still required. Slot capacity is server-enforced through `/api/checkout/slots` and checkout validation, and checkout now disables full slots when live availability is returned.

### Orders, tracking, reviews, and operations

- Customer order lookup supports order number plus email; authenticated customers can view owned order records.
- The server order state machine records status history and rejects invalid transitions.
- Admin APIs list/update orders, add notes, create/update shipments, and expose shipment events.
- Inventory list and adjustment APIs create stock movement records and protect reserved quantities.
- Verified delivered-order customers can submit one pending review per cake/order combination.
- Public reviews and protected moderation are implemented; moderation writes an audit log.
- Review submissions are protected by the shared in-process rate limiter in addition to delivered-order ownership checks.
- The public review page now provides a validated delivered-order submission form with moderation feedback; review-photo uploads are intentionally still gated on the verified media/R2 flow.
- Protected `/admin/messages` reads persisted contact messages and newsletter subscribers, and contact message status changes are audited transactionally.
- Protected `/admin/promotions` manages validated coupon records, start/end scheduling, and truthful active/scheduled/expired states, with transactional audit records; public `/offers` and `/api/promotions` expose only active promotions within their configured date windows.
- Admin order printing now opens a protected, server-backed receipt route using immutable order item and total snapshots.
- The admin courier field now persists assignments through the protected shipment endpoint without fabricating driver identities; a verified staff directory and richer dispatch workflows remain pending. Status transitions remain governed by the order state machine.
- Protected date-range analytics returns sales, paid revenue, customer-repeat, daily, and top-cake metrics; the admin overview and analytics screens now render those values when available.
- Delivery staff assignment, proof of delivery, courier/ETA integration, invoices, exports, refunds, notifications, and analytics aggregation remain incomplete.

## Admin status

`frontend/app/admin/page.tsx`, `/admin/messages`, and `/admin/customers/[email]` are protected by `frontend/middleware.ts`. Catalog, review, inventory, order status, overview metrics, delivery shipment summaries, customer aggregates/detail, analytics, and persisted communication records now connect to protected APIs. Existing admin APIs enforce their seeded permission keys after the admin/owner role check; staff management, login-audit telemetry, exports, and some fallback state remain incomplete.

| Area | Current state |
| --- | --- |
| Catalog | API-backed list/create/update foundation, persisted availability toggle, and category-aware catalogue data; media, category management, and full editor integration remain. |
| Promotions | Protected coupon CRUD, date-window scheduling, and active/scheduled/expired admin states are implemented; flash sales, targeting, loyalty/referrals, and automated campaign orchestration remain. |
| Reviews | API-backed loading and moderation UI. |
| Inventory | API-backed listing/restock foundation; purchase orders and richer stock workflow remain. |
| Orders | Protected API-backed loading, status updates, detail retrieval, and print-ready receipts are connected; exports, driver assignment, and richer fulfillment actions remain. |
| Delivery | Protected shipment feed and courier assignment are connected; proof of delivery, courier/ETA integration, driver identity management, and pickup workflow remain. |
| Customers | Protected list/detail APIs exist; the directory and summary metrics now use protected customer/analytics data with empty states. |
| Analytics | Protected query exists; overview and charts now use live date-range analytics with an explicit unavailable state. |
| Staff and roles | Seeded role/permission data exists; staff management UI/API is not implemented. |

The role selector in the page must never be treated as authorization. Server session checks are the authority.

## Database and configuration status

- `prisma/schema.prisma` is the executable schema source and includes Auth.js, catalog, commerce, payment, shipment, inventory, review, wishlist, loyalty, media, notification, contact/newsletter, analytics, and audit models.
- `prisma/seed.ts` is idempotent for roles, permissions, optional owner, sample catalog/inventory, and `SWEET10`.
- `prisma/migrations/` exists but contains no migration files.
- `server-only` is now an explicit dependency; the initial rate-limit test exposed and fixed its missing package contract.
- `.env.example` documents the current environment contract. Local `.env.local` values must remain private.
- The root `backend/` directory is not the active backend. Do not add a parallel server without an explicit architecture decision.
- The package name remains `cake-website`, while the product and repository documentation use Bite & Bloom.

## Release blockers

1. Create and review the initial Prisma migration; verify a disposable restore path before production deployment.
2. Configure separate staging and production values for Neon, Auth.js, Daraja, WhatsApp, email, media, scheduler, and public URLs.
3. Approve and implement the remaining admin staff/audit/export workflows; operational views no longer use fabricated API fallback records.
4. Implement and verify R2 media upload/attachment, email/WhatsApp notification delivery, payment reconciliation/refunds, and job scheduling.
5. Add unit/API/browser tests and CI checks for permission enforcement, price tampering, invalid variants, coupon abuse, duplicate checkout/callbacks, reservation expiry, and order transitions.
6. Complete business decisions for delivery coverage/fees, pickup, slots, cancellation/refunds, privacy/retention, final catalog, and legal copy.

Baseline security headers/CSP (with development-only `unsafe-eval`), a database-aware sitemap, a tested in-process rate-limit core, a same-origin browser mutation guard, and a 1 MiB declared API body-size guard are now present; duplicate header configuration has been consolidated. The rate-limit test also prompted the missing `server-only` dependency to be added explicitly. These guards are defense-in-depth and do not replace distributed limits, WAF/bot protection, or provider-level controls. The npm install reported eight audit findings; dependency upgrades require a separate review.

## Recommended next sequence

1. Lock business configuration and create the migration baseline.
2. Finish catalog/media and connect the public/admin catalog flows.
3. Connect admin orders, delivery, customers, analytics, and inventory screens.
4. Add notification/payment reconciliation providers and schedule reservation expiry.
5. Add automated tests, staging data, backup/restore verification, security headers/rate limits, and deployment runbooks.
6. Perform mobile/browser smoke testing across catalog, cart, checkout, account, tracking, and admin before launch.

## Validation notes

The documentation describes source-level implementation found in the repository on 15 August 2026. The direct TypeScript check, focused rate-limit/catalog-query/request-size/origin/promotion/public-form/address tests (14 passing), Prisma generate/validate checks, lint, and diff check pass. Local preview smoke checks returned 200 for `/`, `/cart`, `/offers`, `/custom-cake`, `/account/loyalty`, `/cakes`, `/faq`, and `/privacy`; protected admin/account APIs redirect or return 401 without a session, and database-dependent public APIs return explicit 503 configuration states without `DATABASE_URL`. Mutating API requests with a mismatched browser `Origin` are rejected with 403, while server callbacks without an Origin header remain allowed. Admin operational views no longer fabricate records when their protected APIs are unavailable. A full `next build frontend` attempt with process-only local placeholders timed out after 180 seconds after webpack cache snapshot warnings; it is not represented as a successful production build. `npm install` reported eight audit findings; no automatic audit fix was applied because it may introduce breaking dependency changes. Basic in-process rate limits now protect public contact/newsletter, registration/password-reset, and review submission requests; these limits are not a substitute for distributed production throttling. Cookie consent is implemented locally, but final consent copy/legal approval and any optional provider integration remain pending. A live database, Daraja callback, email delivery, external media upload, and production deployment were not verified by this handoff. Run the checks in [README.md](README.md#verification) after configuring a safe development database and unique local `NEXTAUTH_SECRET`.

## Key files

- `frontend/app` — pages and Route Handlers.
- `frontend/lib/server` — server-only business and integration helpers.
- `frontend/middleware.ts` — coarse admin route protection.
- `prisma/schema.prisma` — data model.
- `prisma/seed.ts` — development seed.
- `docs/architecture/database-and-workflows.md` — data and workflow boundaries.
- `PROJECT_FEATURES_IMPLEMENTATION_PLAN.md` — current progress and next work.
- `rules.md` — engineering and security constraints.
