# Bite & Bloom — Feature Implementation Plan

**Last reviewed:** 15 August 2026
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
- Public routes for home, catalog, categories, product detail, cart, checkout, tracking, contact, FAQ, offers, about, privacy, terms, and cookies.
- Prisma schema, Prisma client helper, server API response helpers, environment checks, and idempotent development seed.
- Public catalog/detail/review APIs with server-calculated availability and active customization definitions.
- Guest cart cookie, cart item operations, coupons, server-side customizations/pricing, checkout validation, delivery/pickup, scheduled dates/slots, immutable order snapshots, and inventory reservations.
- Auth.js credentials login, registration, JWT sessions, verification/reset token routes, protected account resources, and coarse admin middleware.
- M-Pesa STK Push/callback/retry foundation and cash-on-delivery order path.
- Order lookup/tracking, order transition service, reservation expiry job, admin order/notes/shipment APIs, inventory adjustments, reviews/moderation, customer APIs, wishlist, and date-range analytics API.

### Partial

- Storefront pages use live APIs for the main catalog/cart/checkout path, but product media is still placeholder-driven and the home page contains presentation content that needs final business configuration.
- The admin page is protected and partially API-connected, but overview, orders, delivery, customers, analytics, inventory, and staff sections still contain sample values or prototype actions.
- Database role/permission records are seeded, but handlers primarily use coarse admin/owner checks rather than a complete granular permission matrix.
- Contact/newsletter records and verification/reset tokens are persisted, but email/WhatsApp delivery, rate limiting, consent history, retries, and admin visibility are incomplete.
- Prisma models exist for R2 media, notifications, loyalty, analytics events/daily metrics, refunds, and audit coverage, but the full provider/workflow surface is not connected.

### Blocked or not started

- The initial migration baseline and production migration/backup/restore procedure.
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
- [ ] Confirm Nairobi service areas, delivery fees, pickup address/hours, slot capacity, preparation lead times, cancellation/refund rules, and final currency policy.
- [ ] Confirm production providers, staging/production separation, retention/privacy policy, legal copy, and deployment owner.

### Phase 1 — Storefront and shared UI integration

**Status: Partial**

- [x] Reusable cake, cart, checkout, homepage, layout, tracking, legal, and shared state components exist.
- [x] Responsive theme, navigation, splash/loading, floating public actions, and dynamic footer behavior exist.
- [ ] Remove remaining page-local sample data and connect every visible metric/action to a source of truth.
- [ ] Complete accessibility review, reduced-motion review, mobile breakpoints, focus management, and image alt/fallback review.
- [ ] Replace placeholder business copy/contact/social/map values with approved configuration.

### Phase 2 — Catalog and product experience

**Status: Partial**

- [x] Public cake list/detail routes and APIs exist.
- [x] Variant size, price, ingredient/allergen fields, preparation time, availability, and customization validation foundations exist.
- [x] Product cards link to real product routes and can add a server-validated variant to cart.
- [ ] Seed the approved full catalog and category set.
- [ ] Add validated query filtering, bounded pagination, complete product SEO/structured data, and approved media.
- [ ] Implement R2 upload/verification and replace filename-only image controls.

### Phase 3 — Cart, checkout, and payments

**Status: Partial**

- [x] Guest cart, item changes, coupons, server totals, delivery/pickup, scheduled date/slot, reservations, snapshots, M-Pesa STK foundation, COD, callback, and retry routes exist.
- [x] Inventory availability and reservation release/consumption are server-controlled.
- [ ] Add guest-to-account cart merge, checkout idempotency, slot capacity, configured delivery pricing/areas, payment query/reconciliation, refunds, and provider failure states.
- [ ] Run staging scenarios for price tampering, invalid variants, coupon limits, duplicate checkout/callbacks, expired reservations, M-Pesa success/failure, COD, and unauthorized order access.

### Phase 4 — Authentication, account, and communication

**Status: Partial**

- [x] Credentials login, registration, JWT session, verification/reset route foundations, account profile, addresses, orders, and wishlist exist.
- [x] Customer ownership is checked in account/order resources.
- [ ] Configure secure email delivery and complete single-use token delivery/failure handling.
- [ ] Add granular RBAC, staff invitations, Google OAuth only if approved, account deletion/retention, loyalty UI, reorder/receipt flows, and communication preferences.
- [ ] Add rate limits, consent capture, notification records/retries, and admin visibility for contact/newsletter messages.

### Phase 5 — Order operations and delivery

**Status: Partial**

- [x] Server order state machine, status history, customer tracking, admin order updates/notes, shipment records/events, and inventory consumption/release foundations exist.
- [ ] Connect admin order/delivery screens to APIs and add staff assignment, proof of delivery, courier/ETA integration, pickup readiness, cancellation, invoices/receipts, exports, and refunds.
- [ ] Configure and schedule reservation expiry; add status notifications with retry/deduplication.

### Phase 6 — Admin, RBAC, inventory, and analytics

**Status: Partial**

- [x] Protected admin route, catalog CRUD foundation, inventory list/adjustment, customer list/detail, review moderation, shipment, order, and analytics APIs exist.
- [x] Seeded roles and permissions cover the initial operating roles.
- [ ] Replace sample admin metrics, charts, directory, order lists, delivery views, inventory actions, and staff UI with API-backed screens.
- [ ] Enforce granular permission keys at each handler, implement staff/role management, add audit coverage, event collection, daily aggregation, exports, and privacy-scoped customer operations.

### Phase 7 — Trust, retention, and advanced selling

**Status: Partial for reviews; otherwise not started**

- [x] Delivered-order review submission and protected moderation exist.
- [x] Authenticated wishlist operations exist.
- [ ] Complete review UX, loyalty ledger/rewards, referrals, abandoned-cart recovery, promotions, reminders, and wishlist availability synchronization.

### Phase 8 — Media, custom requests, AI, subscriptions, and branches

**Status: Not started / Blocked**

- [ ] Implement verified R2 media flow before accepting inspiration/admin images.
- [ ] Decide whether custom cake requests, subscriptions, AI recommendations, live chat, SMS, or multi-branch support are launch scope.

### Phase 9 — Security, performance, SEO, accessibility, marketing, and legal

**Status: Not started**

- [ ] Add rate limiting, CSRF review, security headers/CSP, Turnstile/WAF, secret management, structured logs, monitoring, and error reporting.
- [ ] Complete metadata/structured data, image optimization, performance review, keyboard/contrast/screen-reader review, consent/cookie behavior, and legal approval.
- [ ] Validate all public and admin forms against direct API misuse and oversized/untrusted input.

### Phase 10 — QA, launch, and operations

**Status: Not started**

- [ ] Create migration, staging, CI, deployment, backup, restore, rollback, and incident runbooks.
- [ ] Add unit, API, integration, and browser coverage proportional to payment, inventory, auth, and admin risk.
- [ ] Verify a disposable database restore and a complete staging order from checkout through completion.
- [ ] Perform mobile/browser smoke tests and record release evidence before production.

## Recommended next five implementation slices

1. Confirm business configuration and create the reviewed Prisma migration baseline.
2. Connect the admin orders, delivery, customers, analytics, and inventory tabs to their existing protected APIs.
3. Implement R2 upload/verification and attach real approved catalog/product media.
4. Add payment reconciliation/refund boundaries, notification providers, and scheduled reservation expiry.
5. Add focused automated tests and a staging smoke-test checklist for the server-authoritative commerce paths.

## Definition of done

A feature is complete only when its UI, route/API, data model, validation, authorization, loading/error states, responsive behavior, documentation, and proportional tests are present. External provider setup, business decisions, migrations, and deployment evidence must be recorded explicitly; they must not be represented as successful when they have not been verified.
