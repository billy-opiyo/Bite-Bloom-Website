# Bite & Bloom — Feature Implementation Plan

**Last reviewed:** 17 August 2026
**Current milestone:** server-backed MVP foundation and storefront integration
**Release status:** not launch-ready

This plan reflects the current source tree. A feature is not considered complete merely because a page, schema model, or endpoint exists: its data source, validation, authorization, failure states, responsive behavior, and verification path must also be complete.

## Status legend

- **Implemented:** the core source-level workflow exists and is connected enough to be used in development.
- **Partial:** some UI/API/schema pieces exist, but integration, provider setup, or verification remains.
- **Not started:** no reliable implementation is present.
- **Blocked:** the next step needs business input, provider credentials, migration/deployment authority, or an external service.

## Current baseline

### Implemented

- Next.js App Router pages, layouts, responsive styling, theme support, loading/not-found states, sitemap, robots, and manifest.
- Public routes for home, catalog, categories, product detail, cart, checkout, tracking, contact, FAQ, offers, about, privacy, terms, cookies, and noindex newsletter preferences.
- Prisma schema, Prisma client helper, server API response helpers, environment checks, and idempotent development seed.
- Public catalog/detail/review APIs with server-calculated availability and active customization definitions.
- Guest cart cookie, cart item operations, coupons, server-side customizations/pricing, checkout validation, delivery/pickup, scheduled dates/slots, immutable order snapshots, and inventory reservations.
- Auth.js credentials login, registration, JWT sessions, verification/reset token routes, protected account resources, and coarse admin middleware.
- M-Pesa STK Push/callback/retry foundation and cash-on-delivery order path.
- Order lookup/tracking, order transition service, reservation expiry job, admin order/notes/shipment APIs, inventory adjustments, reviews/moderation, customer APIs, wishlist, and date-range analytics API.

### Partial

- Storefront pages use live APIs for the main catalog/cart/checkout path, but product media is still placeholder-driven and the home page contains presentation content that needs final business configuration.
- The admin page is protected and API-connected for catalog, orders, delivery, customers, analytics, inventory, reviews, and communication; the staff section remains an explicitly unconfigured prototype pending the approved role-access policy.
- Database role/permission records are seeded, but handlers primarily use coarse admin/owner checks rather than a complete granular permission matrix.
- Contact/newsletter records and verification/reset tokens are persisted. Basic in-process rate limiting, local consent capture, a public newsletter unsubscribe workflow, and protected admin communication visibility are implemented; email/WhatsApp delivery, consent history, distributed limits, and retries remain incomplete.
- Prisma models exist for R2 media, notifications, loyalty, analytics events/daily metrics, refunds, and audit coverage, but the full provider/workflow surface is not connected.

### Blocked or not started

- The initial migration baseline is generated locally but still requires review, a target database, application, and production migration/backup/restore procedure.
- Daraja sandbox/production credentials and public HTTPS callback verification.
- R2 media upload sessions, completion verification, cleanup, and cake image attachment.
- Resend and WhatsApp Cloud delivery, notification retries, templates, and provider failure handling.
- Delivery area/fee/capacity rules, pickup operating rules, cancellation/refund policy, and final catalog/business content.
- Automated unit/API/browser tests, CI, staging smoke tests, monitoring, deployment configuration, and release runbooks.

## Phase tracker

### Phase 0 — Requirements and release contract

**Status: Partial / Blocked**

- [x] Route, schema, API, environment, and seed baseline documented.
- [x] Current implementation and known gaps reconciled in `PROJECT_HANDOFF.md`.
- [x] Generate an unapplied Prisma baseline from the current schema at `prisma/migrations/00000000000000_initial/migration.sql`; [ ] review and apply it against an approved staging database.
- [ ] Confirm Nairobi service areas, delivery fees, pickup address/hours, slot capacity, preparation lead times, cancellation/refund rules, and final currency policy.
- [ ] Confirm production providers, staging/production separation, retention/privacy policy, legal copy, and deployment owner.

### Phase 1 — Storefront and shared UI integration

**Status: Partial**

- [x] Reusable cake, cart, checkout, homepage, layout, tracking, legal, and shared state components exist.
- [x] Responsive theme, navigation, splash/loading, floating public actions, and dynamic footer behavior exist.
- [x] Pace the branded splash progress from 1–100% across its configured duration and expose the live status to assistive technology.
- [x] Add homepage dialog focus management: initial focus, Tab containment, Escape close, and focus restoration for cart, checkout, account, and product overlays.
- [ ] Remove remaining page-local sample data and connect every visible metric/action to a source of truth; the homepage tracking preview control has been replaced with server-refreshed status and a real tracking route.
- [x] Make homepage catalog hydration consume the paginated `/api/cakes` envelope, active customization definitions, live images/metadata, and server variant prices; static records remain limited to unconfigured/offline preview or missing hero/promo visuals.
- [x] Connect the public catalogue search, category, and sort controls to server-side filters and preserve the active category set while loading additional pages.
- [x] Derive homepage category filters from live catalog categories and keep static cakes limited to visual hero/promo fallback when a configured catalog has fewer visual items.
- [x] Add global reduced-motion handling and visible keyboard focus rings; [x] announce catalog/product loading and error states, suppress failed product thumbnails, use named homepage contact fields, and fall back across failed catalog-card images; [ ] complete accessibility review, mobile breakpoints, focus management, and image alt review.
- [ ] Replace placeholder business copy/contact/social/map values with approved configuration.

### Phase 2 — Catalog and product experience

**Status: Partial**

- [x] Public cake list/detail routes and APIs exist.
- [x] Variant size, price, ingredient/allergen fields, preparation time, availability, and customization validation foundations exist.
- [x] Product cards link to real product routes and can add a server-validated variant to cart.
- [x] Product cards expose a configured WhatsApp order action with the cake name and slug in the prefilled message.
- [ ] Seed the approved full catalog and category set.
- [x] Add validated catalogue query filtering, bounded pagination, and a shop-page load-more path; [ ] add approved media records/configuration.
- [x] Add product JSON-LD plus server-side cake metadata, canonical URLs, and approved Open Graph image references.
- [ ] Implement R2 upload/verification and replace filename-only image controls.

### Phase 3 — Cart, checkout, and payments

**Status: Partial**

- [x] Guest cart, item changes, coupons, server totals, delivery/pickup, scheduled date/slot, reservations, snapshots, M-Pesa STK foundation, COD, callback, and retry routes exist.
- [x] Inventory availability and reservation release/consumption are server-controlled.
- [x] Add guest-to-account cart merge and live slot availability/validation.
- [x] Add checkout idempotency, live slot availability, and server slot-capacity validation.
- [x] Remove synthetic checkout slot availability on live-slot errors; the form now shows an unavailable state until server-derived slots are loaded.
- [x] Route checkout success to public email-protected tracking and hydrate tracking fields from its query parameters for guest orders.
- [x] Add safe customer cancellation boundaries for unpaid cancellable orders.
- [x] Add an authenticated cart “save for later” action that moves the cake into the server-backed wishlist.
- [x] Bound and structurally parse M-Pesa callback payloads before payment reconciliation; malformed callbacks acknowledge safely without entering the transaction.
- [x] Preserve payment metadata across initial STK setup, retry locking/failure, and callback reconciliation so provider evidence and attempt history are not silently erased.
- [ ] Add configured delivery pricing/areas, payment query/reconciliation, refunds, and paid-order provider failure states.
- [ ] Run staging scenarios for price tampering, invalid variants, coupon limits, duplicate checkout/callbacks, expired reservations, M-Pesa success/failure, COD, and unauthorized order access.

### Phase 4 — Authentication, account, and communication

**Status: Partial**

- [x] Credentials login, registration, JWT session, verification/reset/resend route foundations, account profile, address create/edit/delete/default management, orders, and wishlist exist.
- [x] Add a real sign-out action to the shared authenticated account navigation.
- [x] Customer ownership is checked in account/order resources.
- [x] Require the single-use verification token before password-account activation; [ ] configure secure email delivery and complete delivery/failure handling.
- [x] Add conditional Google OAuth provider/button wiring; [ ] configure approved credentials and verify the live callback.
- [ ] Add granular RBAC, staff invitations, account deletion/retention, and communication preferences.
- [x] Add protected read-only loyalty balance/history API and account navigation; [ ] approve and implement points earning, redemption, and expiry rules.
- [x] Add authenticated order detail, status history, safe cancellation, print-ready receipt view, and server-validated reorder using stored variant IDs.
- [x] Add basic in-process rate limits to contact, newsletter, registration, password-reset, review, order-tracking, and payment-retry requests.
- [x] Centralize authentication email/token/password parsing, validate reset/verification bodies before database configuration access, and rate-limit verification and password-reset confirmation attempts.
- [x] Add local necessary/optional consent capture, a public newsletter unsubscribe page/API, protected admin visibility/status updates for contact/newsletter records, and privacy-scoped notification delivery metadata; [ ] add distributed limits, notification retries, and provider delivery.

### Phase 5 — Order operations and delivery

**Status: Partial**

- [x] Server order state machine, status history, customer tracking with automatic public-page refresh, admin order updates/notes, shipment records/events, and inventory consumption/release foundations exist.
- [x] Rehydrate protected admin order and shipment feeds after status or courier mutations so server-normalized state replaces local optimistic drift.
- [x] Connect admin order/delivery screens to protected APIs for status, shipment assignment, receipts, and operational export; [ ] add proof of delivery, courier/ETA integration, pickup readiness, cancellation, and refunds.
- [x] Add a privacy-conscious CSV export for the currently loaded protected admin order feed; customer exports remain gated on an approved privacy workflow.
- [x] Connect the admin courier field to validated shipment assignment without fabricated driver identities; [ ] add driver identity management and richer dispatch workflows.
- [x] Persist shipment dispatch/delivery timestamps and expose them with the protected shipment feed; proof-of-delivery evidence remains gated on the approved workflow/media policy.
- [x] Distinguish shipment workflow conflicts from unexpected database failures so admin mutations return truthful 409 versus 503 responses.
- [x] Add protected admin order detail retrieval and a print-ready receipt route for the existing order action.
- [ ] Configure and schedule reservation expiry; add status notifications with retry/deduplication.

### Phase 6 — Admin, RBAC, inventory, and analytics

**Status: Partial**

- [x] Protected admin route, catalog CRUD foundation, inventory list/adjustment, customer list/detail, review moderation, shipment, order, and analytics APIs exist.
- [x] Seeded roles and permissions cover the initial operating roles.
- [x] Replace overview, delivery, customer directory, and analytics sample metrics with API-backed, empty-safe screens; cake availability toggles, inventory restock, order status, and review moderation now persist through protected APIs.
- [x] Make the admin low-stock review control filter the protected inventory feed instead of displaying a no-op notification.
- [x] Make the admin cake editor use live active categories, persist new-cake availability, and refresh from server-derived stock/availability after catalog mutations instead of fabricating local stock.
- [x] Keep unavailable catalog cost/margin metrics explicitly marked unavailable instead of rendering fabricated zero values.
- [x] Connect the admin customer directory's View action to a protected customer detail page with privacy-scoped profile, order, loyalty, payment, and shipment information.
- [x] Remove fabricated fallback records from catalog/order/inventory/review views when protected APIs are unavailable; [x] remove the simulated admin role switch; [ ] connect staff/login-audit/export workflows and replace remaining prototype staff actions.
- [x] Add a protected read-only role/permission matrix to the staff view without exposing staff identities or enabling unapproved invitations/role changes.
- [x] Enforce seeded permission keys across existing admin/owner handlers and add protected notification/audit read surfaces; [ ] decide whether non-admin staff roles may enter the admin surface, then complete staff/role management, audit coverage, event collection, daily aggregation, exports, and privacy-scoped customer operations.

### Phase 7 — Trust, retention, and advanced selling

**Status: Partial; review, wishlist, and basic coupon promotions are implemented**

- [x] Delivered-order review submission and protected moderation exist.
- [x] Authenticated wishlist operations exist.
- [x] Wishlist entries expose current server-derived availability and guest save actions provide a sign-in return path.
- [x] Add customer review submission UX with delivered-order validation, moderation messaging, and abuse throttling.
- [x] Add protected coupon promotion CRUD at `/admin/promotions`, validated start/end scheduling, truthful active/scheduled/expired admin states, transactional audit records, and a public live-offers endpoint/page backed by the existing server-side cart coupon engine.
- [ ] Add review-photo attachments, loyalty ledger/rewards, referrals, abandoned-cart recovery, and reminders; extend promotions to flash sales, cake/category targeting, and campaign scheduling as business rules are approved.

### Phase 8 — Media, custom requests, AI, subscriptions, and branches

**Status: Partial / Blocked**

- [ ] Implement verified R2 media flow before accepting inspiration/admin images.
- [x] Add a text-based custom cake request form with event, guest, budget, theme, and detail fields persisted as sourced contact messages.
- [ ] Add reference-image media, quotation approval, and admin request workflow after the verified media flow and business quotation policy are approved.
- [ ] Decide whether custom cake requests, subscriptions, AI recommendations, live chat, SMS, or multi-branch support are launch scope.

### Phase 9 — Security, performance, SEO, accessibility, marketing, and legal

**Status: Partial**

- [x] Add baseline security response headers/CSP (with development-only `unsafe-eval`), basic in-process rate limiting, a same-origin guard for browser mutations, a 1 MiB declared API body-size guard, and middleware JSON content-type validation for non-Auth API mutations.
- [x] Validate mutation bodies and selected path/query parameters before configuration access across cart, checkout, account, wishlist, reviews, registration, payment retry, scheduling, catalog, inventory, order, shipment, promotion, contact-message, analytics, customer, newsletter, and admin-review handlers.
- [x] Bound the local in-process rate-limit store by pruning expired buckets and evicting the oldest bucket at capacity; [ ] add distributed rate limits before multi-instance production deployment.
- [ ] Complete CSRF review, distributed rate limits, Turnstile/WAF, secret management, structured logs, monitoring, and error reporting.
- [x] Add route-level catalog/information metadata, baseline product metadata and structured data plus a persistent necessary/optional cookie-consent control; [ ] complete image optimization, performance review, keyboard/contrast/screen-reader review, consent copy/legal approval.
- [ ] Validate all public and admin forms against direct API misuse and oversized/untrusted input.

### Phase 10 — QA, launch, and operations

**Status: Partial**

- [x] Create the source-level migration, staging, deployment, backup, restore, rollback, and incident runbook at `docs/deployment/RELEASE_AND_DATABASE_RUNBOOK.md` and add the placeholder-only quality workflow at `.github/workflows/quality.yml`; [ ] verify CI execution and execute the environment runbook against approved environments.
- [x] Add focused automated tests for the rate-limit core, catalog query validation, request-size/origin policy, promotion input, public custom-request source validation, account-address validation, notification recipient redaction, admin cake input, admin order export, M-Pesa callback parsing, payment metadata merging, and migration-baseline integrity.
- [x] Verify a clean isolated `next build frontend` with process-only local placeholders; disable the Windows Webpack build worker and support `NEXT_DIST_DIR=.next-build` so concurrent Turbo development output cannot corrupt production verification.
- [ ] Expand unit, API, integration, and browser coverage proportional to payment, inventory, auth, and admin risk.
- [ ] Verify a disposable database restore and a complete staging order from checkout through completion using `docs/STAGING_SMOKE_TEST_CHECKLIST.md`.
- [ ] Perform mobile/browser smoke tests and record release evidence before production.

## Recommended next five implementation slices

1. Confirm business configuration and create the reviewed Prisma migration baseline.
2. Implement R2 upload/verification and attach real approved catalog/product media.
3. Add payment reconciliation/refund boundaries, notification providers, and scheduled reservation expiry.
4. Complete staff/audit/export workflows after the role-access policy is approved.
5. Execute `docs/STAGING_SMOKE_TEST_CHECKLIST.md` against the isolated staging environment after the migration/provider gates are approved.

## Definition of done

A feature is complete only when its UI, route/API, data model, validation, authorization, loading/error states, responsive behavior, documentation, and proportional tests are present. External provider setup, business decisions, migrations, and deployment evidence must be recorded explicitly; they must not be represented as successful when they have not been verified.
