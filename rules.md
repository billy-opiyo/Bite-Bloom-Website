# Bite & Bloom — Engineering and Security Rules

**Last reviewed:** 15 August 2026

These rules apply to the Bite & Bloom website and its server-backed commerce workflows. They describe the current repository architecture as well as the security standard required before production.

## Technology and architecture

| Area | Rule |
| --- | --- |
| Web application | Use the pinned Next.js/React versions in `package.json`; do not silently upgrade the framework during feature work. |
| Language | Use TypeScript for pages, components, hooks, utilities, and server code. Avoid `any`; type external input explicitly. |
| API | Use Next.js Route Handlers under `frontend/app/api`. Do not create a parallel backend service without an explicit architecture decision. |
| Database | Use Prisma with PostgreSQL; Neon pooled `DATABASE_URL` is the intended runtime connection. |
| Authentication | Use Auth.js for sessions and bcrypt for password comparison/hashing. |
| Payments | Keep Safaricom Daraja credentials and callbacks server-only. |
| Media | Use Cloudflare R2 for production media when the upload workflow is implemented. |
| Email/messaging | Use Resend and WhatsApp Cloud API only through server-side integrations when configured. |
| Hosting | Target Vercel or Cloudflare-compatible deployment only after the deployment contract is documented and verified. |

The active server boundary is `frontend/lib/server`. The root `backend/` directory is not a running API. Root configuration extends the frontend TypeScript project.

## Repository structure

```text
frontend/
  app/                 App Router pages, layouts, and app/api Route Handlers
  components/          Reusable UI and feature components
  hooks/ store/ types/ Client hooks, state, and domain types
  lib/                 Shared helpers and server-only services
  styles/              Theme and visual style modules
prisma/
  schema.prisma        Database schema
  seed.ts              Idempotent development seed
docs/architecture/     Data and workflow boundaries
```

Keep reusable server helpers outside route files. Route modules should export only supported HTTP handlers and route configuration.

## Coding standards

1. Preserve the existing responsive Bite & Bloom visual language unless a design change is requested.
2. Prefer small reusable components and narrow patches; avoid unrelated formatting churn.
3. Validate external input at the server boundary and return consistent API errors.
4. Keep database queries and provider credentials out of browser bundles.
5. Recalculate prices, discounts, availability, delivery charges, and payment state on the server.
6. Use Prisma transactions for checkout, reservations, payment state changes, refunds, inventory changes, role changes, and other multi-record mutations.
7. Use immutable order/item/address snapshots; historical orders must not depend on mutable catalog values.
8. Make callbacks, scheduled jobs, retries, and notification commands idempotent.
9. Provide loading, empty, error, disabled, and unavailable states for user-facing data flows.
10. Use accessible labels, keyboard paths, focus states, sufficient contrast, touch-friendly controls, and reduced-motion behavior.

## Security requirements

- Never commit credentials, tokens, private URLs, database strings, or real customer data.
- Never put database, Auth.js, Daraja, R2, or scheduler secrets in `NEXT_PUBLIC_*` variables.
- Authenticate and authorize every protected API request on the server. UI role selectors and hidden buttons are not security boundaries.
- Enforce customer ownership for accounts, addresses, orders, wishlist items, and reviews.
- Restrict admin operations to the server and audit privileged changes.
- Reject altered prices, invalid variant/customization IDs, unavailable inventory, invalid coupons, forged order states, duplicate callbacks, and unauthorized order numbers.
- Hash passwords with bcrypt or Argon2. Use short-lived, single-use verification/reset tokens and do not log raw tokens.
- Treat uploaded filenames, MIME types, dimensions, message content, addresses, and analytics properties as untrusted input.
- Add rate limiting, CSRF protection where applicable, secure headers/CSP, abuse controls, and Turnstile/WAF before public launch.
- Use HTTPS for production APIs and require HTTPS for the M-Pesa callback URL.
- Redact secrets and unnecessary personal/payment data from logs and analytics.

## Commerce invariants

- Available inventory is `quantityOnHand - quantityReserved`.
- Catalog and customization prices come from the database/configuration, not the browser.
- A checkout creates durable order/payment/reservation records before initiating external payment.
- Reservation release, consumption, and expiry happen exactly once.
- Order status can change only through the server state machine.
- M-Pesa callbacks are deduplicated and checked against the expected order/payment.
- Refunds append records; they do not rewrite original payment history.

## Before any modification

1. Read the relevant source, schema, route, and current documentation before adding a duplicate feature.
2. Confirm whether the change is public, customer-authenticated, admin-only, server-only, or configuration-only.
3. Preserve unrelated user changes and use `apply_patch` for local edits.
4. Update the relevant README/handoff/architecture note when behavior, setup, routes, or environment variables change.
5. Run at least `node .\node_modules\typescript\bin\tsc --noEmit -p .\frontend\tsconfig.json` for TypeScript changes on this Windows checkout; run lint, build, and focused smoke tests in proportion to risk.
6. If a provider, credential, business rule, migration, or deployment step is missing, record it as a blocker rather than simulating success.

## Source of truth

- Product implementation: `frontend/app` and `frontend/lib/server`.
- Database contract: `prisma/schema.prisma`.
- Development data: `prisma/seed.ts`.
- Environment names: `.env.example`.
- Workflow boundaries: [`docs/architecture/database-and-workflows.md`](docs/architecture/database-and-workflows.md).
- Current progress and release blockers: [`PROJECT_HANDOFF.md`](PROJECT_HANDOFF.md) and [`PROJECT_FEATURES_IMPLEMENTATION_PLAN.md`](PROJECT_FEATURES_IMPLEMENTATION_PLAN.md).
