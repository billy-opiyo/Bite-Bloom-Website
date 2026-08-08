# Bite & Bloom Cake Website — Project Handoff

**Last reviewed:** 8 August 2026  
**Repository status:** UI prototype and database design exist; the production application foundation is now being implemented.

## Executive summary

The project currently renders two polished, interactive client-side screens:

- Storefront: `frontend/app/(public)/page.tsx`
- Admin dashboard: `frontend/app/admin/page.tsx`

Both are large self-contained prototypes. Their data is hard-coded and interactions only update React state in the browser. No storefront or admin action yet persists data, authenticates a user, processes a payment, uploads a file, or sends a notification. A server-only Prisma foundation and `GET /api/health` endpoint now exist, but no feature API has been connected to either interface.

The Prisma schema is a strong design baseline for a complete cake-commerce system. However, it has no migration files, seed implementation, database configuration, Prisma client wrapper, or queries/services connected to it. All currently created backend TypeScript files are empty.

## What is implemented

| Area | Current state | Notes |
| --- | --- | --- |
| Next.js app shell | Present | Root layout, global CSS, loading state, and 404 page exist. |
| Public home/storefront UI | Partially connected | Catalog browsing, search/filter/sort, cake details/customization modal, cart drawer, checkout modal, tracking section, FAQ, contact, and dark-mode UI are in one page file. Catalogue pricing/categories hydrate from the public API when available. |
| Admin UI | Partially connected | The cake list hydrates from the protected API and adding a cake persists through it; remaining tabs and existing-cake edits are still local prototype interactions. |
| Styling | Present | `frontend/app/globals.css` contains the actual styling. |
| Prisma schema | Present | Models cover identity/RBAC, catalog, cart/orders/payments, inventory, delivery, media, notifications, analytics, loyalty, and audit logs. |
| Server foundation | Present | Server-only environment/Prisma helpers, health check, public cake list/detail APIs, protected admin cake list/create APIs, and Auth.js credentials endpoints are available. |
| Admin access control | Present | Next.js middleware restricts `/admin` to users with `admin` or `owner` roles; `/login` provides the credentials sign-in form. |
| Development seed data | Present | `prisma/seed.ts` idempotently seeds system roles/permissions, a small catalogue, inventory, and `SWEET10`. |
| Architecture guidance | Present | `docs/architecture/database-and-workflows.md` documents the desired secure workflows. |

## Frontend work still required

### 1. Break the prototype pages into reusable frontend code

The two existing pages embed their own types, icons, sample data, business calculations, and UI. Move these responsibilities into the existing empty folders before adding more features:

| Empty area | Required implementation |
| --- | --- |
| `frontend/components/cakes/` | `CakeCard`, gallery, filters, search, sort, and customization components. |
| `frontend/components/cart/` | Cart line items, cart summary, coupon form, and loading/error handling. |
| `frontend/components/checkout/` | Address, delivery, checkout, and payment components. |
| `frontend/components/homepage/` | Hero, categories, featured cakes, promotions, testimonials, delivery areas, CTA. |
| `frontend/components/layout/` | Navbar, footer, mobile menu, search, theme toggle. |
| `frontend/components/tracking/` | Status badge, order timeline, and map/tracking view. |
| `frontend/components/ui/` and `components/shared/` | Button, input, modal, drawer, badge, spinner, tooltip, empty/error/loading states. |
| `frontend/types/` | Typed API/domain contracts for cakes, orders, reviews, and users. |
| `frontend/lib/` | API client, constants, helpers, and client-side validation. |
| `frontend/hooks/` and `frontend/store/` | Auth, cart, order, debounce, theme, wishlist state and data fetching. |
| `frontend/styles/` | Either populate these style modules or remove them and keep a documented global-CSS strategy. |

### 2. Create the missing routes/pages

The following route folders exist but contain no page files. The home page currently uses modals and anchor links instead of real routes.

| Route group | Missing pages/features |
| --- | --- |
| `(public)` | About, cake catalogue, cake detail, cart, categories, checkout, contact, FAQ, offers, reviews, and order tracking. |
| `(auth)` | Login, registration, forgot-password, reset-password, email verification. |
| `account` | Profile, addresses, order history/detail, wishlist, loyalty. |
| `admin` | Prefer nested protected routes for dashboard, catalog, orders, delivery, customers, analytics, inventory, reviews, and staff rather than one stateful page. |

### 3. Replace browser-only storefront behaviour

The following existing behaviours are demos and must be server-backed:

- Catalog, category, prices, ratings, images, ingredient/allergen data, and availability are static arrays.
- Search, filters, and sorting only work against that static array.
- Cake pricing, toppings, add-ons, free-delivery threshold, and coupon discounts are calculated in the browser. The server must be authoritative.
- Cart, saved-for-later items, coupon state, checkout customer details, and the placed order disappear on refresh.
- Coupon codes are hard-coded as `SWEET10` and `BLOOM500`.
- The inspiration-image chooser only stores the filename; it does not upload a file.
- Checkout creates a random `BB-####` number and shows a confirmation without creating an order, reserving inventory, charging/payment instruction, or sending a notification.
- Order tracking is a locally created order only; it cannot retrieve a real order or live shipment events.
- Sign-in, registration, Google sign-in, account summary, loyalty points, saved addresses, and sign-out are simulated React state.
- Newsletter and contact forms only show a toast. The contact form does not capture the name/email field values.
- Contact details, business address, social accounts, delivery areas, and map are hard-coded placeholders that need confirmed business configuration.

### 4. Replace browser-only admin behaviour

`frontend/app/admin/page.tsx` has no authentication or authorization and uses sample arrays/counters. It must not be deployed as an admin interface in its current form.

| Admin feature shown | Missing production implementation |
| --- | --- |
| Dashboard | Real metrics and charts with date-range query support. |
| Cake management | Persisted create/read/update/archive actions, categories/variants/customizations, real image upload, publish state, and audit logs. |
| Orders | Real order list/detail, permitted state transitions, staff assignment, order notes, print/export endpoint, refunds/cancellations. |
| Delivery | Staff/courier records, shipment creation, driver assignment, delivery events, map/ETA provider integration. |
| Customers | Paginated directory, customer detail/history, search/filter/export, privacy controls. |
| Analytics | Server-generated metrics, date filtering, access restriction, export. |
| Inventory | Variant/ingredient decision, stock adjustments with reason, reservations, low-stock alerts, purchase-order workflow if required. |
| Reviews | Customer review creation, moderation, and public display. |
| Staff & roles | Real invitations, role assignment, server-side permission enforcement, session/login activity. |

The current role selector only changes what the page displays; it does not protect any action.

## Backend work still required

### Empty backend source files

Every TypeScript file under `backend/src/` is currently 0 bytes. This includes:

- Controllers: analytics, auth, cake, cart, customer, inventory, order, review.
- Routes: analytics, auth, cake, cart, inventory, order.
- Services: analytics, auth, cake, cart, inventory, notification, order, Resend email, uploads, WhatsApp.
- Middleware: auth, CSRF, rate limit, role, Turnstile, validation.
- Utilities/types: errors, JWT, logger, permissions, response, shared backend types.

There is no separate backend application entry point or running HTTP server. The project now uses the recommended Next.js Route Handler approach: the first handler is `GET /api/health`, and server-only helpers live in `frontend/lib/server/`. Continue that architecture consistently rather than creating a parallel standalone API service.

Use Next.js Route Handlers/Server Actions with server-only services. If a separate service is later required, decide that explicitly and provide its own `package.json`, build/dev scripts, entry point, CORS policy, and deployment configuration.

### Required server capabilities

Implement these in the order below. The data models and workflow rules are already described in `docs/architecture/database-and-workflows.md`.

1. **Foundation (in progress)** — server-only environment access, Prisma client singleton, standard success/error response helpers, and `GET /api/health` are implemented. Add structured logging, schema validation, and feature API contracts.
2. **Database delivery (in progress)** — `prisma/seed.ts` now provides idempotent development roles, permissions, a small catalogue, inventory, and an optional owner account. Generate and commit the initial migration from `prisma/schema.prisma`, then document database deployment/backup procedure.
3. **Authentication and access control (in progress)** — Auth.js credentials login, bcrypt password comparison, JWT sessions, `/login`, and `/admin` role middleware are implemented. Registration/verification/reset flows, granular RBAC, ownership checks, audit logging, and secure staff invitations remain.
4. **Catalog (in progress)** — public `GET /api/cakes` returns active cake/variant/category data. Connect the storefront, add cake detail/category endpoints, media, customizations, and protected admin CRUD/archive endpoints.
5. **Cart and checkout** — guest/session carts, server-side validation/calculation, coupons/promotions, delivery pricing/rules, inventory reservation transaction, immutable order snapshots, idempotency.
6. **Payments (in progress)** — M-Pesa Daraja STK Push is implemented with server-side OAuth, a checkout request, and an idempotent callback that marks matching payments paid or releases reservations on failure. Configure Daraja sandbox/production credentials and public HTTPS callback URL, add payment-query/retry handling, and implement refunds/cancellations before launch.
7. **Order operations** — order lookup/history, documented state machine, production queue, status history, notes, cancellation, invoices/exports.
8. **Inventory and fulfilment** — stock adjustments/movements, reservation expiry job, low-stock alerts, shipment/event APIs, courier integration if required.
9. **Media and messaging** — Cloudflare R2 presigned uploads/verification/cleanup, Resend transactional templates, WhatsApp Cloud API templates/webhooks, notification delivery records/retries.
10. **Analytics and moderation** — validated event collection, daily aggregation job, protected dashboard queries, review submission/moderation.
11. **Security/operations** — rate limiting, CSRF protection, Turnstile, secure headers/CSP, secret management, monitoring, error reporting, background-job scheduling, backups and restore test.

## Data and configuration gaps

- `.env` is empty. `.env.example` now documents the required Neon `DATABASE_URL`; add future variables there as integrations are implemented.
- No database connection is configured. The intended production database is Neon PostgreSQL using the pooled connection string.
- `prisma/seed.ts` is empty and `prisma/migrations/` contains no migration files.
- No payment provider, Resend account/configuration, WhatsApp Cloud configuration, Cloudflare R2 bucket, or Turnstile keys are configured.
- `middleware.ts` at the repository root is empty; it needs auth/route protection and any relevant request policy.
- `tailwind.config.ts` is empty. Tailwind is installed but current UI styling is in `globals.css`; either configure Tailwind or remove the unused dependency/config.
- `README.md` is empty. Add local setup, required services, environment variables, database commands, test commands, and deploy/runbook instructions.
- There are no automated tests, test configuration, CI workflow, or deployment configuration in the repository.

## Suggested delivery sequence

1. Preserve the current pages as a visual reference, then extract shared components/types and add real route structure.
2. Establish database, migrations, seed data, Prisma access, and the chosen API architecture.
3. Implement auth/RBAC before exposing `/admin`; add middleware protection immediately.
4. Build catalog + admin catalog management, then connect the public catalogue to it.
5. Implement cart, secure checkout transaction, payment flow, order notifications, and customer tracking.
6. Implement admin order/inventory/delivery workflows and operational reports.
7. Add uploads, reviews, loyalty, analytics, account features, testing, monitoring, and deployment hardening.

## Validation status

- The current source tree was reviewed on 8 August 2026.
- A production build was started for verification but did not finish within the available 60-second command limit, so compilation should be rerun locally with `npm run build` before the next implementation task.
- `git status` showed a pre-existing modification to `tsconfig.json`; this handoff does not alter it.

## Key files for the next developer

- `frontend/app/(public)/page.tsx` — visual and interaction reference for the storefront prototype.
- `frontend/app/admin/page.tsx` — visual and interaction reference for the admin prototype.
- `frontend/app/globals.css` — current styling source.
- `prisma/schema.prisma` — implemented database model definition.
- `docs/architecture/database-and-workflows.md` — required server-side boundaries and workflows.
- `rules.md` — required technology stack, architecture, and security rules.
