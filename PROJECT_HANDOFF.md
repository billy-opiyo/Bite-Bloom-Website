# Bite & Bloom — Current Project Handoff

**Last reviewed:** 17 August 2026
**Repository state:** active MVP implementation; production launch is still blocked by migrations, provider setup, testing, and incomplete admin UI integration.

## Executive summary

The repository has moved beyond the original browser-only prototype. The live architecture is now a Next.js App Router application with Prisma-backed Route Handlers and server-only services under `frontend/lib/server`.

The customer journey is substantially implemented: catalog data, product detail, cart, coupon, checkout, inventory reservation, order creation, M-Pesa/COD payment foundations, account resources, tracking, reviews, contact, and newsletter records have server routes. Authentication and coarse admin protection are also present.

The remaining work is primarily integration and release hardening. Admin catalog, orders, delivery, customer directory, analytics, inventory, reviews, and communication views now consume protected APIs with explicit empty states; the staff view remains a clearly labeled prototype pending the role-access decision, the admin UI no longer simulates role switching, media upload is not connected to R2, external providers are not configured, the initial migration baseline is generated but unapplied, and staging execution/release verification is absent. The source-aligned staging checklist is [STAGING_SMOKE_TEST_CHECKLIST.md](docs/STAGING_SMOKE_TEST_CHECKLIST.md).

The homepage post-checkout status display refreshes from the protected order-tracking endpoint; its local “Preview next update” prototype action was removed in favor of the real `/tracking` route.

When the catalog API is available, homepage category filters now derive from live category names and stale category selections reset safely. Static cakes remain only as visual hero/promo fallbacks when a configured catalog has fewer than four visual items; they are not added to the live collection listing.

The public `/tracking` result now refreshes its server status automatically every 30 seconds while the page is open.

Checkout success now links guests to `/tracking` with the order number and checkout email, and the tracking form hydrates and loads those values automatically.

The branded splash now advances one percentage point per interval across its configured four-second duration instead of reaching 100% halfway through, and its status text is announced politely to assistive technology.

Production verification supports `NEXT_DIST_DIR` (default `.next`); isolated local/CI builds use `.next-build` so a Turbo development server cannot corrupt production output in the shared directory.

## Implemented surface

### Public pages

The App Router contains real pages for:

`/`, `/about`, `/cakes`, `/cakes/[slug]`, `/cakes/[slug]/reviews`, `/categories/[slug]`, `/cart`, `/checkout`, `/contact`, `/faq`, `/offers`, `/tracking`, `/privacy`, `/terms`, and `/cookies`.

The public layout includes the branded navigation/footer, responsive actions, theme support, loading/not-found states, sitemap, route-level public metadata/canonicals, robots metadata, and manifest support.

### Authentication and account

- Auth.js credentials login uses Prisma and bcrypt with JWT sessions.
- Registration creates a customer account and can associate eligible prior guest orders by email.
- New password accounts remain `PENDING` until the single-use verification token is consumed; registration no longer auto-signs the user in.
- Forgot-password, reset-password, email-verification, and rate-limited verification-resend pages/routes use database verification tokens with expiry; password-reset token cleanup now targets its namespaced identifier correctly, each token endpoint rejects tokens belonging to the other flow before touching user records, and shared auth input parsers validate email/token/password shapes before configuration access. Verification and password-reset confirmation attempts are rate-limited.
- Middleware protects `/admin/:path*` for sessions carrying the `admin` or `owner` role.
- Account routes cover profile updates, address create/edit/delete/default management, order history/detail, and wishlist operations; wishlist cards expose server-derived availability and guest save actions return to sign-in; the account page now exposes those address controls through the protected endpoints.
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
- `/custom-cake` captures a structured text brief through the rate-limited contact endpoint with `custom-cake` source tagging; verified reference-image uploads and quotations remain gated on R2 and business policy. `/unsubscribe` provides a generic, rate-limited newsletter opt-out flow backed by the persisted subscriber status.

### Checkout, payment, and inventory

- Checkout validates contact details, delivery/pickup, scheduled date, fixed delivery slots, notes, payment method, cart contents, coupons, customizations, and inventory.
- The server creates immutable order/item/address snapshots and inventory reservations in a transaction.
- Checkout accepts a client-generated idempotency key, returns the existing order for repeated submissions, and recovers a concurrent unique-key race when the first order wins.
- Reservation availability is `quantityOnHand - quantityReserved`.
- M-Pesa Daraja STK Push, idempotent callback handling, and guarded payment retry are implemented behind environment configuration.
- M-Pesa callbacks now pass through a bounded structural parser before reconciliation; malformed or oversized callback data is acknowledged without touching payment/order transactions.
- Payment metadata is merged rather than replaced during initial STK setup, retry locking/failure, and callback reconciliation, preserving the payment method and provider evidence across attempts.
- Cash on delivery creates a pending cash payment, confirms the order path, and opens a prefilled WhatsApp confirmation link.
- The order transition service consumes reservations when production starts, releases them for cancellation/failure, and settles pending cash payment at delivery.
- Authenticated customers can cancel unpaid `PENDING_PAYMENT` or `CONFIRMED` orders; paid orders intentionally require support review because refund processing is not connected.
- The reservation expiry job is protected by `CRON_SECRET` and releases active expired reservations in bounded batches.
- Payment query/reconciliation, refunds, checkout idempotency, service-area/fee rules, and scheduled-job hosting are still required. Slot capacity is server-enforced through `/api/checkout/slots` and checkout validation; checkout now renders only server-derived slots, disables full slots, and blocks submission while live availability is unavailable.

### Orders, tracking, reviews, and operations

- Customer order lookup supports order number plus email; authenticated customers can view owned order records.
- The server order state machine records status history and rejects invalid transitions.
- Admin APIs list/update orders, add notes, create/update shipments, and expose shipment events.
- Inventory list and adjustment APIs create stock movement records and protect reserved quantities.
- Verified delivered-order customers can submit one pending review per cake/order combination.
- Public reviews and protected moderation are implemented; moderation writes an audit log.
- Review submissions are protected by the shared in-process rate limiter in addition to delivered-order ownership checks.
- The public review page now provides a validated delivered-order submission form with moderation feedback; review-photo uploads are intentionally still gated on the verified media/R2 flow.
- Protected `/admin/messages` reads persisted contact messages and newsletter subscribers, and contact message status changes are audited transactionally. Newsletter opt-out requests update subscriber status without exposing subscription existence.
- Protected `/admin/promotions` manages validated coupon records, start/end scheduling, and truthful active/scheduled/expired states, with transactional audit records; public `/offers` and `/api/promotions` expose only active promotions within their configured date windows.
- Protected `/admin/notifications` exposes redacted notification delivery metadata and status without returning payloads or verification/reset tokens; provider delivery, retries, and distributed scheduling remain pending.
- Admin order printing now opens a protected, server-backed receipt route using immutable order item and total snapshots.
- The admin courier field now persists assignments through the protected shipment endpoint without fabricating driver identities; a verified staff directory and richer dispatch workflows remain pending. Status transitions remain governed by the order state machine.
- Protected date-range analytics returns sales, paid revenue, customer-repeat, daily, and top-cake metrics; the admin overview and analytics screens now render those values when available.
- Delivery staff assignment, proof of delivery, courier/ETA integration, invoices, exports, refunds, notifications, and analytics aggregation remain incomplete.

## Admin status

`frontend/app/admin/page.tsx`, `/admin/messages`, `/admin/notifications`, `/admin/audit`, and `/admin/customers/[email]` are protected by `frontend/middleware.ts`. A shared admin utility navigation exposes messages, promotions, notifications, and audit trail routes from the admin shell. Catalog, review, inventory, order status, overview metrics, delivery shipment summaries, customer aggregates/detail, analytics, notification metadata, audit metadata, and persisted communication records now connect to protected APIs. The admin cake editor uses the live active category list, persists new-cake availability, and refreshes server-derived stock/availability after mutations rather than inventing local stock values. Order and courier mutations now rehydrate the protected order/shipment feeds after persistence so server-normalized state is displayed. Existing admin APIs enforce their seeded permission keys after the admin/owner role check; staff management, login-audit telemetry, exports, and some fallback state remain incomplete.

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
- `prisma/migrations/00000000000000_initial/migration.sql` and `migration_lock.toml` now exist as an unapplied baseline generated from the current schema. No database was contacted or changed; review, staging application, and shadow-database verification remain pending.
- `server-only` is now an explicit dependency; the initial rate-limit test exposed and fixed its missing package contract.
- `.env.example` documents the current environment contract. Local `.env.local` values must remain private.
- The root `backend/` directory is not the active backend. Do not add a parallel server without an explicit architecture decision.
- The package name remains `cake-website`, while the product and repository documentation use Bite & Bloom.

## Release blockers

1. Review and apply the generated initial Prisma migration to isolated staging; verify a disposable restore path using [`RELEASE_AND_DATABASE_RUNBOOK.md`](docs/deployment/RELEASE_AND_DATABASE_RUNBOOK.md) before production deployment.
2. Configure separate staging and production values for Neon, Auth.js, Daraja, WhatsApp, email, media, scheduler, and public URLs.
3. Approve and implement the remaining admin staff/audit/export workflows; operational views no longer use fabricated API fallback records.
4. Implement and verify R2 media upload/attachment, email/WhatsApp notification delivery, payment reconciliation/refunds, and job scheduling.
5. Add unit/API/browser tests and CI checks for permission enforcement, price tampering, invalid variants, coupon abuse, duplicate checkout/callbacks, reservation expiry, and order transitions.
6. Complete business decisions for delivery coverage/fees, pickup, slots, cancellation/refunds, privacy/retention, final catalog, and legal copy.

Baseline security headers/CSP (with development-only `unsafe-eval`), a database-aware sitemap, a tested in-process rate-limit core, a same-origin browser mutation guard, a 1 MiB declared API body-size guard, and middleware JSON content-type validation for non-Auth API mutations are now present; duplicate header configuration has been consolidated. The in-process rate-limit store now prunes expired buckets and caps retained keys to avoid unbounded process-memory growth. Auth.js form-encoded callbacks remain explicitly exempt from the JSON guard. The rate-limit test also prompted the missing `server-only` dependency to be added explicitly. These guards are defense-in-depth and do not replace distributed limits, WAF/bot protection, or provider-level controls. The npm install reported eight audit findings; dependency upgrades require a separate review.

## Recommended next sequence

1. Lock business configuration, review the generated migration baseline, and apply it to isolated staging.
2. Finish catalog/media and connect the public/admin catalog flows.
3. Connect admin orders, delivery, customers, analytics, and inventory screens.
4. Add notification/payment reconciliation providers and schedule reservation expiry.
5. Add automated tests, staging data, backup/restore verification, security headers/rate limits, and deployment runbooks.
6. Perform mobile/browser smoke testing across catalog, cart, checkout, account, tracking, and admin before launch.

## Validation notes

The default test script runs with one worker on Windows because parallel test workers intermittently produced `spawn EPERM`; the 25 assertions pass sequentially.

The homepage cart, checkout, account, and product overlays now move focus into the active dialog, contain Tab navigation, close on Escape, and restore focus to the triggering control. Catalog/product loading and error states now expose status/alert semantics; product thumbnails are removed when external images fail; and catalog cards try remaining images before showing an accessible unavailable-image placeholder. Broader mobile, screen-reader, image-alt, and browser/device review remains outstanding.

Homepage catalog hydration now consumes `/api/cakes` as a paginated `{ items, ... }` response, maps active customization definitions and approved media URLs when available, uses live variant prices for estimates, and restores server-only cakes in cart/wishlist state. Legacy visual cake records remain limited to offline/unconfigured preview and missing hero/promo visuals; they are not included in the live collection listing.

Cart, checkout, account, wishlist, reviews, registration, payment retry, scheduling, catalog, inventory, order, shipment, promotion, contact-message, analytics, customer, newsletter, and admin-review handlers now parse selected bodies and path/query parameters before returning configuration errors or touching database code. Direct production-output checks returned HTTP 400 for malformed review, registration, scheduling, payment-retry, cart, checkout, and email-verification requests; the source audit found no remaining matching public/admin ordering gaps.

A clean production build initially stalled after generating output on Windows. `next.config.js` now disables the Webpack build worker and supports `NEXT_DIST_DIR`; a shared `.next` verification briefly reproduced a Windows/Turbo output race (`PageNotFoundError` for `/_error` and a missing Turbopack runtime), while the isolated `NEXT_DIST_DIR=.next-build` rerun completed all 35 pages and finalization successfully. The isolated output emitted only existing Webpack cache and Autoprefixer warnings, and its preview smoke returned `/` 200, `/cakes` 200, no-database health 503, malformed catalog 400, with no preview listener left running.

The source-level TypeScript check, focused rate-limit/catalog-query/request-size/origin/promotion/public-form/address/notification-privacy/auth-input/admin-cake-input/mpesa-callback/payment-metadata/migration-baseline tests, Prisma schema validation, lint, latest production build, preview smoke checks, and diff check pass. A local placeholder `DATABASE_URL` was used only to validate and generate the unapplied migration; migration-directory consistency could not be checked because Prisma requires a reachable shadow database for that operation. Protected admin/account APIs redirect or return 401 without a session, while database-dependent public APIs return explicit 503 configuration states without `DATABASE_URL`. A live database, Daraja callback delivery, email delivery, external media upload, and production deployment were not verified by this handoff. `npm install` reported eight audit findings; no automatic audit fix was applied because it may introduce breaking dependency changes.


## Key files

- `frontend/app` — pages and Route Handlers.
- `frontend/lib/server` — server-only business and integration helpers.
- `frontend/middleware.ts` — coarse admin route protection.
- `prisma/schema.prisma` — data model.
- `prisma/seed.ts` — development seed.
- `docs/architecture/database-and-workflows.md` — data and workflow boundaries.
- `PROJECT_FEATURES_IMPLEMENTATION_PLAN.md` — current progress and next work.
- `rules.md` — engineering and security constraints.
