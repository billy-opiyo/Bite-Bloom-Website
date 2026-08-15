# Database and Workflow Architecture

**Last reviewed:** 15 August 2026

This document describes the current Bite & Bloom data and server workflow boundaries. The executable schema is [`prisma/schema.prisma`](../../prisma/schema.prisma). The active API implementation is in `frontend/app/api`; reusable server-only logic is in `frontend/lib/server`.

The database and server are authoritative. Browser state, displayed prices, role selectors, payment results, and client-submitted order status are never trusted as commercial or security records.

## Current architecture

```text
Browser pages/components
        |
        v
Next.js Route Handlers: frontend/app/api
        |
        +--> server-only helpers: frontend/lib/server
        |       auth, access, catalog, cart, coupons, customizations,
        |       order state, M-Pesa, Prisma, validation
        |
        v
Prisma Client --> PostgreSQL (Neon intended)
        |
        +--> Daraja callback/payment requests
        +--> WhatsApp confirmation links
        +--> future email/R2/provider integrations
```

There is no running standalone service under the root `backend/` directory. New feature APIs belong in Next.js Route Handlers unless a separate service is explicitly approved.

## Design principles

- PostgreSQL is the system of record; Neon pooled connections are the intended runtime configuration.
- Prisma owns schema definitions, relations, and typed queries.
- Money is stored as PostgreSQL `Decimal`, never JavaScript floating-point values in persisted records.
- Orders store immutable product, variant, price, address, and customization snapshots.
- Authorization, payment verification, inventory reservations, order transitions, and sensitive calculations run on the server.
- Temporary carts/reservations are distinct from durable orders, payments, status history, stock movements, audit logs, and analytics records.
- Catalog records are deactivated/archived rather than deleted when historical references exist.
- Webhooks, callbacks, scheduled jobs, and retries must be idempotent.

## Domain model

### Identity and access

`User`, `Account`, `Session`, and `VerificationToken` support Auth.js. Password credentials are compared with bcrypt; password hashes and raw verification/reset tokens are not exposed to the client.

`Role`, `Permission`, `UserRole`, and `RolePermission` hold the role model. The seed currently creates `customer`, `support`, `baker`, `fulfillment`, `analyst`, `admin`, and `owner` roles.

The current coarse authorization boundary is:

1. Auth.js establishes the session.
2. `frontend/middleware.ts` protects `/admin/:path*` for `admin` or `owner` roles.
3. API handlers call `getAuthenticatedSession()` or `getAdminSession()`.
4. The handler checks ownership and resource state before reading or mutating data.
5. Multi-record mutations use Prisma transactions.
6. Security-sensitive privileged changes append an `AuditLog` where implemented.

Granular permission checks for every seeded permission, staff invitations, and role-management APIs remain release work.

### Catalog

`Cake` is a sellable product family. `CakeVariant` owns the SKU and price used in carts and orders. `Category` and `CakeCategory` provide category relationships. `CakeCustomization` and `CakeCustomizationValue` define allowed server-validated options.

Public catalog serialization includes active cakes, variants, categories, ingredients, allergens, preparation time, and only ready/public media. Current seeded media is not populated, so the UI uses an explicit placeholder where no asset exists.

`MediaAsset`, `UploadSession`, and `CakeImage` model the intended media boundary, but R2 upload-session and completion handlers are not currently present.

### Commerce

`Cart` and `CartItem` support guest sessions and authenticated users. A guest cart is identified by the HTTP-only `bite_bloom_cart` cookie. `Coupon`, `CartCoupon`, and `CouponRedemption` hold discount configuration and usage history.

`Order` is the durable commercial record. It relates to item/address snapshots, payments, shipments, status history, notes, refunds, coupon redemptions, reviews, reservations, notifications, and loyalty transactions.

`Wishlist` and `WishlistItem` are implemented for authenticated customers. Loyalty models exist, but the customer loyalty workflow is not yet implemented.

### Inventory

`InventoryItem` is maintained per cake variant. `quantityOnHand` is physical stock and `quantityReserved` is held stock. Available-to-sell is:

```text
available = quantityOnHand - quantityReserved
```

`StockMovement` records adjustments, reservations, releases, and sales. `InventoryReservation` records the temporary hold and its lifecycle.

## Implemented workflows

### Catalog and cart

1. A public handler reads active catalog records through `frontend/lib/server/catalog.ts`.
2. A variant is available only when it has inventory and `quantityOnHand > quantityReserved`.
3. Add-to-cart sends the variant and customization selection to the server.
4. The server re-reads the variant/customization definitions and calculates the unit price.
5. Cart item changes and coupon changes are persisted through Route Handlers.

Client display values are convenience values; they are recalculated during checkout.

### Checkout transaction

The current checkout handler validates:

- contact details and Kenyan phone format for M-Pesa;
- delivery or pickup;
- a scheduled date from tomorrow through the configured validation window;
- one of the server-defined delivery slots;
- required delivery address;
- payment method;
- active catalog variants, customization values, coupons, and inventory.

The transaction then re-reads the cart, calculates totals, creates order/item/address snapshots, creates payment/reservation records, and reserves stock before an external payment request is started. Client-submitted totals are not authoritative.

Current business gaps are delivery-area/fee rules, slot capacity, checkout idempotency, and full payment reconciliation.

### Payment

M-Pesa is server-only. `frontend/lib/server/mpesa.ts` obtains a Daraja token, starts STK Push, and validates the callback URL as HTTPS. The callback route updates the matching payment/order idempotently using provider references and expected order data. A retry route is limited to an eligible pending M-Pesa order without an existing provider reference.

Cash on delivery creates a pending cash payment and produces a prefilled WhatsApp confirmation link. Delivery-time cash settlement is handled in the order transition service.

Refunds, payment query/reconciliation, provider failure reporting, and live Daraja verification require provider configuration and tests.

### Order state machine

The current transition service allows:

| Current | Allowed next state |
| --- | --- |
| `PENDING_PAYMENT` | `PAID`, `FAILED`, `CANCELLED` |
| `PAID` | `CONFIRMED`, `CANCELLED` |
| `CONFIRMED` | `PREPARING`, `CANCELLED` |
| `PREPARING` | `READY_FOR_DISPATCH` |
| `READY_FOR_DISPATCH` | `OUT_FOR_DELIVERY` |
| `OUT_FOR_DELIVERY` | `DELIVERED` |
| `DELIVERED` | `COMPLETED` |
| terminal state | no further transition |

Each accepted transition writes `OrderStatusHistory`. Entering `PREPARING` consumes active reservations as a sale. Cancellation/failure releases active reservations. `DELIVERED` settles a pending cash payment.

Customer-facing routes can read owned orders or use the order-number/email tracking flow. Customers cannot set status.

### Reservation expiry

`/api/jobs/expire-reservations` requires `CRON_SECRET`. It processes a bounded batch of active reservations whose expiry has passed, decrements reserved quantities, marks the reservation terminal, and records a release movement. It must be invoked by a trusted scheduler before production use.

### Reviews and contact records

A customer review must correspond to a delivered order containing the cake and is created as `PENDING`. Public reads expose published reviews. Admin moderation changes status and writes an audit record.

Contact and newsletter handlers validate and persist `ContactMessage` and `NewsletterSubscriber` records. Provider delivery, rate limiting, consent history, and admin inbox workflows remain incomplete.

## Data model coverage

The Prisma schema also contains models for `Shipment`, `ShipmentEvent`, `Notification`, `LoyaltyAccount`, `LoyaltyTransaction`, `MediaAsset`, `UploadSession`, `AnalyticsEvent`, `AnalyticsDailyMetric`, and `AuditLog`. Their full operational workflows are planned but not all are connected to UI or external providers.

## Operational controls still required

- Create/review/commit the initial Prisma migration; the current `prisma/migrations/` directory is empty.
- Keep pooled runtime URLs and direct administrative/backup URLs separate.
- Add rate limiting, CSRF strategy, secure headers/CSP, Turnstile/WAF, structured logging, error monitoring, and secret management.
- Implement R2 upload verification, media cleanup, email/WhatsApp delivery records and retries, and scheduler deployment.
- Add backup/restore tests, staging isolation, migration checks, and automated API/browser coverage.
- Redact secrets, payment credentials, full addresses, and unnecessary personal data from logs and analytics.

## Related source

- [`prisma/schema.prisma`](../../prisma/schema.prisma)
- [`frontend/lib/server/catalog.ts`](../../frontend/lib/server/catalog.ts)
- [`frontend/lib/server/cart.ts`](../../frontend/lib/server/cart.ts)
- [`frontend/lib/server/order-state.ts`](../../frontend/lib/server/order-state.ts)
- [`frontend/lib/server/mpesa.ts`](../../frontend/lib/server/mpesa.ts)
- [`frontend/app/api/checkout/route.ts`](../../frontend/app/api/checkout/route.ts)
- [`frontend/middleware.ts`](../../frontend/middleware.ts)
