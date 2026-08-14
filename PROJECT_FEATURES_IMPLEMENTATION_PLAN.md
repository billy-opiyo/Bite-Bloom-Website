# Bite & Bloom Project Features Implementation Plan

**Project:** Bite & Bloom cake storefront and operations platform  
**Plan owner:** Development team  
**Last reviewed:** 14 August 2026  
**Primary guide:** `rules.md` and `docs/architecture/database-and-workflows.md`

## 1. Purpose

This document is the implementation guide for turning the current Bite & Bloom prototype and server foundation into a production-ready cake-commerce platform.

The repository already contains a visual storefront, an admin interface, reusable components, Prisma models, several Next.js APIs, authentication foundations, cart and checkout services, M-Pesa endpoints, account pages, inventory, reviews, analytics, wishlist, and shipment primitives. The first delivery stages therefore focus on refactoring, connecting, validating, and securing existing work before adding new feature systems.

No browser state, displayed price, role selector, payment result, or client-submitted order status is trusted as an authoritative business record. Prices, discounts, availability, permissions, payment verification, inventory reservations, order transitions, and sensitive calculations remain server-side.

## 2. Status legend

- **Existing:** source structure or implementation is present; refactor, integration, verification, or production configuration may still be required.
- **Partial:** a UI, schema, API, or prototype interaction exists, but the complete production workflow is not finished.
- **New:** no reliable implementation is currently available and the feature must be designed and built.
- **Blocked by business input:** implementation depends on confirmed business data, credentials, policy text, pricing, delivery rules, or provider accounts.

## 3. Current baseline

### Existing or partially implemented

- Next.js App Router structure under `frontend`, with global styling, loading state, branded 404 page, and a visual storefront/admin prototype.
- Cream, beige, rose, plum, and dark theme tokens; responsive CSS; transitions; hover states; rounded cards; shadows; glassmorphism styles; and theme switching foundations.
- Storefront UI containing hero content, featured cakes, categories, promotions, testimonials, delivery areas, contact/FAQ, map area, cake search/filter/sort, product gallery, customization modal, cart drawer, checkout modal, and order-tracking presentation.
- Reusable components under `frontend/components`, shared hooks/stores, typed frontend models, API client helpers, and server-only helpers under `frontend/lib/server`.
- Prisma schema covering users, roles, catalog, variants, customizations, carts, orders, payments, shipments, inventory, reservations, reviews, wishlist, loyalty, notifications, media, analytics, and audit logs.
- Public catalog/detail/review endpoints; cart and coupon endpoints; checkout endpoint; order tracking endpoint; M-Pesa callback/retry endpoints; reservation expiry endpoint; account/order/address/wishlist endpoints; and protected admin catalog, order, shipment, inventory, customer, review, and analytics endpoints.
- Credentials authentication, registration, JWT session foundation, coarse admin middleware, guest checkout, account profile/orders/addresses/wishlist UI, and a seeded role/catalogue baseline.
- M-Pesa Daraja and cash-on-delivery workflow foundations, with production credentials and callback configuration still required.

### Refactor or completion required

- The primary storefront and admin pages still contain large prototype sections, local sample data, hard-coded labels, and browser-only interactions. Extract and connect them without changing the approved visual direction.
- Product data, prices, availability, images, customer details, order status, contact data, social links, and business configuration must come from validated server/API/configuration sources.
- Inspiration-image selection currently behaves like a filename chooser; it must use the R2 upload workflow and persist a verified media reference.
- Admin role selection is a display control, not an authorization boundary. Every admin action must use server-side session and permission checks.
- Contact, newsletter, reminder, notification, email verification, password reset, and WhatsApp actions need durable records, validation, delivery handling, and failure states.
- Legal pages, dedicated public routes, product SEO, structured metadata, accessibility verification, automated tests, migrations, backups, observability, and deployment runbooks are incomplete.

## 4. Delivery principles

1. Preserve the current storefront as the visual reference while extracting reusable components and routes.
2. Keep the Next.js Route Handler/server-service architecture. Do not create a second backend without an explicit architecture decision.
3. Use TypeScript, Prisma, Neon PostgreSQL, Auth.js, Cloudflare R2, Resend, WhatsApp Cloud API, M-Pesa Daraja, and Cloudflare security services in accordance with `rules.md`.
4. Use database transactions for checkout, reservations, payments, refunds, inventory, role changes, and other multi-record mutations.
5. Treat uploaded files, user content, contact details, and analytics properties as untrusted input.
6. Make webhooks, scheduled jobs, retries, notifications, and payment commands idempotent.
7. Complete and verify the MVP before enabling advanced features that increase operational complexity.
8. Use narrow patches and preserve unrelated project changes; do not replace the current styling system with a new framework without approval.

## 5. Phase overview

| Phase | Focus | Outcome | Priority |
| --- | --- | --- | --- |
| 0 | Requirements, configuration, and technical audit | Confirmed business rules, route map, environment contract, and acceptance criteria | Must-have |
| 1 | UI refactor and design-system completion | Reusable, responsive, accessible public shell and shared components | Must-have |
| 2 | Catalog and product experience | Real category/search/product routes backed by catalog data | Must-have |
| 3 | Cart, customization, checkout, and payments | Reliable server-authoritative ordering flow | Must-have |
| 4 | Authentication, account, and customer communication | Verified customer identity, guest merge, account history, and support channels | Recommended/Must-have for launch hardening |
| 5 | Order operations, delivery, and tracking | Staff-controlled production and fulfillment lifecycle | Must-have |
| 6 | Admin panel, RBAC, inventory, and analytics | Real protected business operations | Must-have |
| 7 | Trust, retention, and advanced selling | Reviews, loyalty, referrals, reminders, recovery, and promotions | Professional |
| 8 | Cake builder, custom requests, AI, subscriptions, and branches | Advanced revenue and personalization systems | Professional |
| 9 | Security, performance, SEO, marketing, and legal | Hardened, discoverable, compliant production experience | Must-have before launch |
| 10 | QA, launch, and operations | Repeatable release, monitoring, backup, and support process | Must-have before launch |

Each phase is complete only when its exit gate passes. A UI that merely displays a feature is not considered complete until its real data, failure states, security boundary, and verification path exist.

## 6. Detailed implementation phases

### Phase 0 — Requirements, configuration, and technical audit

**Goal:** establish one agreed source of truth before more code is added.

#### Work items

- [ ] Reconcile `PROJECT_HANDOFF.md` with the current source tree and this plan.
- [ ] Create a feature inventory mapping every route, component, API, Prisma model, scheduled job, and external provider to its owner.
- [ ] Confirm the operating model: Nairobi delivery areas, pickup address, opening hours, preparation lead times, delivery slots, delivery fee matrix, free-delivery threshold, cancellation rules, refund rules, minimum order values, and currency.
- [ ] Confirm business configuration: phone number, WhatsApp number, email, map URL/embed, Facebook, Instagram, TikTok, logo assets, brand copy, and social handles.
- [ ] Confirm payment details and environments for M-Pesa Daraja sandbox and production, including callback URL, shortcode, passkey, transaction limits, and reconciliation process.
- [ ] Define the MVP catalogue and required category slugs: birthday, wedding, anniversary, graduation, baby shower, cupcakes, custom, kids, chocolate, and vegan/eggless.
- [ ] Define role and permission matrix for owner, admin, support, baker, fulfillment/delivery staff, analyst, and customer.
- [ ] Define data retention, privacy, cookie consent, review moderation, marketing opt-in, and account deletion rules.
- [ ] Separate staging from production variables and create a deployment checklist.

#### Exit gate

- Confirmed configuration exists in a documented environment contract without storing secrets in the repository.
- Every requested feature is marked Existing, Partial, New, or Blocked by business input.
- Product, order, payment, delivery, and legal acceptance criteria are approved.

### Phase 1 — UI refactor and design-system completion

**Goal:** preserve the existing Bite & Bloom aesthetic while making it reusable, responsive, accessible, and maintainable.

#### Work items

- [ ] Refactor the large public page into homepage, catalogue, product, cart, checkout, contact, FAQ, tracking, and shared layout components.
- [ ] Refactor the large admin page into protected dashboard, catalogue, orders, delivery, customers, analytics, inventory, reviews, staff, and settings views.
- [ ] Reuse the existing `frontend/components` folders instead of duplicating page-specific controls.
- [ ] Standardize buttons, links, inputs, selects, modals, drawers, badges, tables, empty states, loading states, error states, and confirmation dialogs.
- [ ] Keep the cream/beige background, brown/chocolate accents, warm earth tones, soft neumorphic cards, rounded corners, subtle shadows, elegant typography, and premium dessert-shop styling.
- [ ] Finish dark-mode behavior across every route, including persistence, first-paint behavior, contrast, icons, form controls, map cards, and admin surfaces.
- [ ] Keep smooth transitions and hover effects where helpful; add `prefers-reduced-motion` behavior and avoid motion that blocks ordering.
- [ ] Implement a shared theme/configuration layer rather than scattering colors, phone numbers, social URLs, delivery details, and map URLs through JSX.
- [ ] Add a reusable floating WhatsApp button at the bottom left with an accessible label and configured deep link.
- [ ] Add a reusable back-to-top button at the bottom right that appears after scrolling and is keyboard accessible.
- [ ] Use real React icon packages consistently, selecting Lucide for interface icons and brand-specific icons from a maintained React icon set where available. Remove the page-local icon duplication after parity is verified.
- [ ] Make the footer year dynamic everywhere with `new Date().getFullYear()` or a shared server-safe helper.
- [ ] Verify responsive layouts at narrow mobile, large mobile, tablet, laptop, and wide desktop breakpoints.

#### Exit gate

- No core page depends on prototype-only arrays or duplicated page-local controls.
- Keyboard navigation, focus visibility, labels, contrast, reduced motion, and mobile touch targets pass review.
- Theme toggle, floating actions, dynamic copyright, animations, and responsive layouts work on all public and account pages.

### Phase 2 — Catalog and product experience

**Goal:** provide a real, searchable catalogue and a dedicated product journey.

#### Work items

- [ ] Complete seeded categories and catalogue records for all required cake types.
- [ ] Add dedicated routes for `/cakes`, `/categories/[slug]`, and `/cakes/[slug]` while preserving useful homepage quick views.
- [ ] Connect search, category filters, flavor/dietary filters, availability filters, price ranges, and sorting to validated API query parameters.
- [ ] Add pagination or bounded result windows and useful empty/error/loading states.
- [ ] Make product pages show cake name, price, description, ingredients, allergens, image gallery, available sizes, flavors, shapes, availability, preparation lead time, reviews, and customization choices.
- [ ] Model and validate sizes including 0.5 kg, 1 kg, and 2 kg as variants or configured purchasable options.
- [ ] Move all price calculation to server-validated customization definitions and variant prices.
- [ ] Support message text, theme/colors, toppings, candles, greeting card, and inspiration image metadata in a typed customization snapshot.
- [ ] Implement Cloudflare R2 upload sessions for inspiration images and cake/admin media. Validate MIME type, size, extension, dimensions, content, ownership, and lifecycle before public use.
- [ ] Replace external placeholder imagery with approved optimized assets or CDN/R2 URLs. Use responsive image sizes, alt text, and safe fallbacks.
- [ ] Add product structured data, canonical URLs, metadata, Open Graph images, and indexability rules.
- [ ] Add a product-card WhatsApp order action that creates a safe prefilled message from the selected product/configuration without exposing secrets or bypassing checkout rules.

#### Exit gate

- A customer can find a real active cake, inspect a dedicated product route, choose valid options, upload a verified inspiration image, and receive a server-calculated price.
- Inactive, sold-out, invalid, or unavailable products cannot be added through direct API calls.

### Phase 3 — Cart, customization, checkout, and payments

**Goal:** make ordering durable, accurate, and safe for Kenya-focused commerce.

#### Work items

- [ ] Connect the cart UI to the persisted guest or authenticated cart APIs.
- [ ] Support add, remove, quantity editing, saved-for-later, wishlist handoff, and cart restoration after refresh.
- [ ] Merge guest carts into the customer cart after authentication using conflict-safe rules.
- [ ] Validate one active coupon per cart, eligibility, expiry, usage limits, maximum discount, and redemption history on the server.
- [ ] Calculate subtotal, customization charges, discount, delivery fee, tax if applicable, and estimated total on the server.
- [ ] Support customer name, phone, email, delivery address, notes, delivery or pickup, future date, and delivery time slot.
- [ ] Implement preparation lead-time checks and prevent unavailable dates or delivery slots from being selected.
- [ ] Support M-Pesa STK Push, callback verification, payment status polling/query handling, safe retry, reconciliation, and idempotency.
- [ ] Support cash on delivery with configured service-area and order-value restrictions, confirmation status, and staff settlement workflow.
- [ ] Keep WhatsApp ordering as a convenient support/order channel, but ensure orders created through WhatsApp are entered into the same order and inventory workflow.
- [ ] Reserve inventory transactionally during checkout, expire abandoned reservations, consume stock at the defined production boundary, and release reservations exactly once on failure/cancellation.
- [ ] Generate immutable order and address snapshots; never derive historical order totals from mutable catalogue data.
- [ ] Add confirmation pages and notifications for order received, payment pending/success/failure, pickup, delivery, and cancellation.

#### Exit gate

- A guest can order without an account, an authenticated customer can order with saved details, and both paths survive refresh and retry.
- Client price manipulation, invalid coupons, overselling, duplicate checkout, duplicate callbacks, and unauthorized order access are rejected.
- Staging tests cover M-Pesa success/failure, cash on delivery, expired reservation, invalid slot, coupon limit, and repeated request behavior.

### Phase 4 — Authentication, account, and customer communication

**Goal:** provide secure identity without making account creation mandatory for first purchase.

#### Work items

- [ ] Complete email/password sign-in, registration, sign-out, forgot-password, reset-password, and email-verification flows using secure one-time tokens and expiry.
- [ ] Complete Google sign-in only after provider credentials, redirect URLs, account-linking rules, and staging verification are configured.
- [ ] Preserve anonymous guest checkout and safely link eligible guest orders when the customer later verifies the matching email.
- [ ] Protect customer-owned order, address, wishlist, loyalty, and profile resources with ownership checks on every request.
- [ ] Complete the customer dashboard: order history, order detail/tracking, receipts, reorder, favorites, saved addresses, profile, loyalty balance, and communication preferences.
- [ ] Add email and WhatsApp notification records, retries, templates, opt-in/opt-out handling, and provider failure visibility.
- [ ] Build contact and newsletter endpoints with validation, consent capture, rate limiting, duplicate handling, and admin visibility.
- [ ] Add FAQ and contact routes that use real business details and a verified Google Maps location.
- [ ] Add accessible social links for Facebook, TikTok, Instagram, and WhatsApp with real configured URLs and icons.

#### Exit gate

- Verification and reset tokens are single-use, expire, are not logged, and do not disclose whether another account exists.
- Customers can view only their own data, and notification failures are observable without leaking secrets or message content.
- Contact, newsletter, phone, WhatsApp, email, map, and social actions are real and configured.

### Phase 5 — Order operations, delivery, and tracking

**Goal:** connect customer-facing order tracking to real bakery and delivery operations.

#### Work items

- [ ] Enforce the order state machine: received/pending payment, confirmed, baking/preparing, decorating/ready for dispatch, out for delivery, delivered, completed, cancelled, and failed.
- [ ] Require authorized staff actions for every transition and append status history with actor, reason, and timestamp.
- [ ] Build customer tracking by order number and authenticated ownership, including timeline, status badge, expected date, pickup/delivery method, and support action.
- [ ] Implement delivery slot capacity, blackout dates, preparation time, branch/service area, and holiday rules.
- [ ] Create shipments, assign delivery staff, append shipment events, capture proof of delivery where appropriate, and show delivery status.
- [ ] Add configurable delivery fees by area, distance, branch, time slot, or order threshold.
- [ ] Add pickup workflow with shop instructions, pickup window, readiness notification, and handover confirmation.
- [ ] Integrate a map/ETA provider only after the operational need and privacy implications are confirmed; do not expose precise driver location by default.
- [ ] Add customer cancellation, staff notes, refund request, invoice/receipt generation, and export workflows with permission checks.
- [ ] Add email/WhatsApp status notifications with retry and deduplication.

#### Exit gate

- Staff cannot skip invalid transitions, customers cannot edit status, and every order event is auditable.
- A real staging order can move from checkout through production, delivery or pickup, notification, and completion.

### Phase 6 — Admin panel, RBAC, inventory, and analytics

**Goal:** give the bakery a protected operational control center.

#### Work items

- [ ] Replace the single stateful admin prototype with nested protected routes for dashboard, cakes, categories, orders, delivery, customers, analytics, inventory, reviews, staff, and settings.
- [ ] Enforce database-backed permissions server-side after session authentication. The browser may hide controls but never determines authorization.
- [ ] Complete cake management: create, edit, archive, publish, categories, variants, prices, availability, ingredients, allergen warnings, customizations, images, and preparation lead time.
- [ ] Complete order management: accept/reject, production status, notes, assignment, invoice/receipt, cancellation, refund, and customer support view.
- [ ] Complete delivery management: couriers/staff, assignments, fees, shipment events, delivery zones, and service availability.
- [ ] Complete customer management with pagination, order history, spending, preferences, saved events, guest grouping, privacy controls, and scoped exports.
- [ ] Complete inventory management for cake variants and ingredients such as flour, eggs, cream, and chocolate; support stock movements, reservations, reorder levels, reasons, and low-stock alerts.
- [ ] Complete reviews moderation, public display, abuse handling, and audit records.
- [ ] Complete analytics for revenue, orders, best sellers, profitable flavors, peak time, repeat customers, conversion, cart abandonment, and low stock using server-generated events and daily aggregates.
- [ ] Add staff invitations, role assignment, permission review, deactivation, and audit history.
- [ ] Add privacy-friendly login activity: device summary, approximate location, timestamp, failed attempts, and suspicious-activity alerts. Do not store message content or unnecessary sensitive data.

#### Exit gate

- Admin APIs reject unauthenticated, unauthorized, cross-tenant, and invalid state mutations.
- Dashboard metrics reconcile with order/payment records and are not hard-coded.
- Inventory and analytics tests prove transaction safety, idempotency, and correct aggregation.

### Phase 7 — Trust, retention, and advanced selling systems

**Goal:** add professional features that increase repeat purchases and customer confidence after the core ordering flow is stable.

#### Work items

- [ ] Reviews with photos: allow eligible customers to upload delivery photos after completion, moderate submissions, scan/validate media, and display approved photos.
- [ ] Loyalty: award points from authoritative completed orders, maintain an append-only ledger, define expiry/limits, and allow secure redemption.
- [ ] Referrals: issue attributed referral codes, prevent self-referrals and abuse, award rewards only after qualifying orders, and provide admin reporting.
- [ ] Wishlist: complete guest persistence, authenticated sync, availability changes, and remove/add-to-cart behavior.
- [ ] Abandoned cart recovery: detect eligible abandoned carts, respect consent/frequency limits, send email and WhatsApp reminders, record attempts, and provide unsubscribe/stop rules.
- [ ] Occasion reminders: save birthdays, anniversaries, graduations, or other dates; calculate reminder windows; send opted-in WhatsApp, SMS, or email reminders; and allow edits/deletion.
- [ ] Promotions: build admin-managed coupons, flash sales, seasonal offers, targeted promotions, start/end dates, usage rules, and safe stacking policy.
- [ ] Live chat/WhatsApp support: provide a visible support path, business hours, fallback contact, conversation handoff, and no unnecessary storage of message content.
- [ ] Newsletter and push notifications: add consent, provider integration, subscription management, campaign audit, and browser permission handling.

#### Exit gate

- Every reward, reminder, promotion, and recovery message is consent-aware, rate-limited, auditable, and idempotent.
- Abuse prevention and opt-out behavior are tested before enabling automated customer messaging.

### Phase 8 — Cake builder, custom requests, AI, subscriptions, and branches

**Goal:** introduce higher-complexity revenue features only after core catalogue and operations are reliable.

#### Work items

- [ ] Cake builder: define a server-managed configuration graph for cake type, layers, flavor, frosting, colors, decorations, writing, and toppings.
- [ ] Calculate builder prices on the server as options change; show a clear KSh breakdown and preserve the final configuration in the order snapshot.
- [ ] Add business constraints so incompatible layers, flavors, toppings, colors, preparation times, or stock combinations cannot be selected.
- [ ] Custom cake request form: accept reference image, budget, theme, servings, event date, contact details, notes, and consent; create a request status and admin quotation workflow.
- [ ] AI recommendations: start with a transparent rules-based event/person/theme recommendation engine. Add an external AI provider only with approved privacy, cost, moderation, fallback, and prompt/data-handling rules.
- [ ] Real-time delivery scheduling: add slot capacity and atomic reservation so two customers cannot claim the same limited slot.
- [ ] Subscription cakes: model plans, recurring schedule, skip/pause/cancel, payment retries, delivery windows, inventory planning, and customer consent.
- [ ] Multi-branch support: add branches, branch-specific stock, delivery areas, pickup locations, staff scope, prices where necessary, and branch selection/detection without collecting unnecessary location data.
- [ ] Add branch-aware analytics, admin permissions, promotions, and order fulfillment rules.

#### Exit gate

- Builder, quotations, recommendations, subscriptions, slots, and branches use server-side rules and have clear fallback behavior when unavailable.
- Operational staff can fulfill, modify, pause, cancel, and audit advanced orders without manual database edits.

### Phase 9 — Security, performance, SEO, accessibility, marketing, and legal

**Goal:** meet the security and quality requirements before public launch.

#### Security work

- [ ] Enforce HTTPS in deployed environments, secure cookies, security headers, CSP, HSTS where appropriate, and safe CORS behavior.
- [ ] Add rate limiting to authentication, contact, newsletter, reviews, uploads, checkout, coupons, WhatsApp, and public analytics endpoints.
- [ ] Add CSRF protection where required, strict input schemas, output encoding, safe rich-text handling, and SSRF-safe URL processing.
- [ ] Add Cloudflare Turnstile and WAF rules for public abuse surfaces; define bot-failure fallback behavior.
- [ ] Protect admin routes in middleware and every handler; apply least-privilege permissions and audit sensitive actions.
- [ ] Verify M-Pesa callbacks, webhook signatures, provider references, amount/currency, and idempotency.
- [ ] Never log passwords, tokens, payment secrets, full addresses, unnecessary IP data, or private message content.
- [ ] Configure secret management, staging/production separation, database backups, restore tests, R2 cleanup, and key rotation.

#### Performance and accessibility work

- [ ] Use optimized responsive images, lazy loading below the fold, caching/revalidation, bounded queries, pagination, and code splitting.
- [ ] Measure Core Web Vitals on mobile and test slow-network behavior.
- [ ] Add semantic headings, labels, alt text, keyboard paths, focus management, contrast checks, reduced-motion handling, and screen-reader status messages.
- [ ] Prevent layout shift from images, fonts, banners, modals, and floating buttons.

#### SEO, content, and legal work

- [ ] Add page metadata, sitemap, robots policy, canonical URLs, Open Graph/Twitter cards, product/category structured data, and local-business schema after business details are confirmed.
- [ ] Create real Terms & Conditions, Privacy Policy, Cookie Policy, refund/cancellation policy, delivery policy, and consent records. Obtain business/legal approval before publishing.
- [ ] Add a branded 404 and the final branded splash screen with progress bar, percentage counting from 1–100%, ellipsis animation, and Bite & Bloom handwriting animation. Keep it short, accessible, skippable where appropriate, and never block content unnecessarily.
- [ ] Add blog/content routes, Instagram gallery, TikTok embeds, social proof, referral campaigns, and newsletter content only with approved assets and provider policies.
- [ ] Ensure embedded social/media content is lazy, privacy-conscious, and has a fallback link.

#### Exit gate

- Security review, mobile performance review, accessibility review, metadata validation, legal approval, backup restore test, and privacy review are complete.

### Phase 10 — QA, launch, and ongoing operations

**Goal:** make delivery repeatable and supportable.

#### Work items

- [ ] Add unit tests for validation, pricing, customization, coupons, permissions, order transitions, delivery fees, loyalty, referrals, and recommendation rules.
- [ ] Add API/integration tests for auth, cart, checkout, M-Pesa callbacks, guest-to-account merge, inventory reservations, uploads, notifications, reviews, and admin authorization.
- [ ] Add end-to-end tests for mobile guest ordering, authenticated ordering, pickup, delivery, payment failure/retry, customer tracking, and admin fulfillment.
- [ ] Test direct API misuse: altered prices, invalid variant IDs, unauthorized order numbers, forged status transitions, coupon abuse, oversized uploads, replayed callbacks, and duplicate checkout.
- [ ] Run type-check, lint, production build, Prisma validation/generation/migration checks, seed verification, and staging health checks.
- [ ] Configure CI for tests, build, dependency/security checks, migration review, and preview deployment gates.
- [ ] Prepare deployment, rollback, incident response, payment reconciliation, backup/restore, notification failure, and support runbooks.
- [ ] Run a staging order using real-like but non-production credentials and confirm `{ ok: true, database: "up" }` from the health check.
- [ ] Perform a final content pass for contact values, prices, imagery, delivery areas, social links, legal URLs, and copy.
- [ ] Launch with feature flags for advanced systems and monitor errors, checkout conversion, payment failures, delivery issues, and abandoned carts.

#### Exit gate

- All must-have acceptance criteria pass in staging, no critical security or data-integrity issues remain, production credentials are configured last, and rollback/support owners are known.

## 7. Must-have acceptance checklist

### Public experience

- [ ] Responsive on supported mobile, tablet, laptop, and desktop sizes.
- [ ] Dark-mode toggle works and persists without a flash or unreadable content.
- [ ] Warm Bite & Bloom visual system, smooth transitions, useful hover states, rounded cards, subtle shadows, and glassmorphism are consistent.
- [ ] Hero, featured/bestseller cakes, categories, promotions, reviews, order CTAs, delivery areas, contact information, and map are real and configured.
- [ ] Search, filters, sorting, category routes, product details, availability, allergens, sizes, flavors, shapes, and customization options work.
- [ ] WhatsApp floating button is bottom-left; back-to-top button is bottom-right and appears after scrolling.
- [ ] Copyright year is dynamic and shared across the site.
- [ ] Branded loading/splash and 404 experiences are accessible and do not trap the user.

### Commerce

- [ ] Cart add/remove/update/save-for-later works across refresh and guest/account transitions.
- [ ] Coupon, delivery fee, estimated total, availability, and all prices are server-authoritative.
- [ ] Home delivery, pickup, future scheduling, M-Pesa, cash on delivery, and product-card WhatsApp ordering are handled with clear statuses.
- [ ] Order tracking shows received, baking, decorating, out for delivery, and delivered states from durable records.

### Customer and administration

- [ ] Email/password, Google where configured, email verification, password reset, guest checkout, and secure account ownership work.
- [ ] Customer dashboard includes orders, receipts, reorder, favorites, addresses, loyalty, and preferences as each capability is enabled.
- [ ] Admin dashboard, cake/catalogue management, order operations, delivery, customers, analytics, inventory, reviews, and staff roles use real data and server-side permissions.

### Security and quality

- [ ] HTTPS, authentication, authorization, rate limiting, validation, bot protection, secure payments, backups, admin protection, and audit logging are verified.
- [ ] Image optimization, lazy loading, caching, SEO, accessibility, mobile performance, monitoring, and CI checks pass before launch.

## 8. Business decisions required before implementation is considered complete

- Final business phone, WhatsApp number, email, physical address, map location, social URLs, opening hours, and delivery areas.
- Product catalogue, approved images, ingredient/allergen data, size/variant prices, customization prices, preparation lead times, and stock policy.
- Delivery fee matrix, slot capacity, pickup rules, cancellation/refund rules, cash-on-delivery limits, and M-Pesa settlement process.
- Approved Terms & Conditions, Privacy Policy, Cookie Policy, delivery/refund policy, marketing consent wording, and data retention periods.
- Provider accounts and production configuration for Neon, Auth.js/Google, M-Pesa Daraja, Resend, WhatsApp Cloud API, Cloudflare R2, Turnstile/WAF, maps, analytics, and hosting.
- Decision on whether subscriptions, SMS, AI recommendations, live chat, multi-branch support, and push notifications are launch scope or post-launch scope.

## 9. Recommended implementation order

1. Complete Phase 0 and lock configuration/acceptance criteria.
2. Execute Phase 1 UI extraction and shared configuration without changing the approved visual design.
3. Complete Phases 2–3 for a real catalog-to-checkout MVP.
4. Complete Phases 4–6 so authentication, fulfillment, admin, inventory, and analytics are production-connected.
5. Execute Phase 9 security, performance, SEO, legal, and accessibility hardening.
6. Run Phase 10 staging verification and launch gates.
7. Add Phase 7 retention features, then Phase 8 advanced builder/AI/subscription/branch systems behind feature flags.

## 10. Definition of done for future feature work

A feature is done only when:

1. Its UI, route/API, data model, validation, permissions, error states, loading states, and responsive behavior are implemented.
2. Business logic and sensitive calculations run on the server.
3. It has idempotency, audit, notification, privacy, and failure handling where applicable.
4. It has unit/API/end-to-end coverage proportional to risk.
5. It is documented in the current README/runbook and environment contract.
6. It passes type-check, lint, build, staging verification, and a manual mobile/browser smoke test.
7. Any incomplete provider setup or business decision is explicitly recorded as a blocker rather than silently simulated.

