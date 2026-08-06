# Database and Workflow Architecture

This document defines the data model and server-side workflows for the cake e-commerce application. It is the design baseline for future implementation work. The application must not bypass these boundaries from browser code.

The executable Prisma model is in [`prisma/schema.prisma`](../../prisma/schema.prisma).

## Design principles

- Neon PostgreSQL is the system of record.
- Prisma owns schema definitions, relations, migrations, and typed queries.
- `DATABASE_URL` must contain Neon’s pooled connection string with `-pooler` in the host address.
- Money is stored as PostgreSQL `Decimal`, never floating-point numbers.
- Orders store immutable product, variant, price, address, and customization snapshots.
- Business rules, authorization, payment verification, inventory reservations, and sensitive calculations run on the server.
- Carts and inventory reservations are temporary; orders, payments, status history, stock movements, audit logs, and analytics events are durable records.
- Catalog records are archived or deactivated instead of being deleted when historical references exist.
- All external webhooks and retried commands must be idempotent.

## Domain model

### Identity and authorization

`User`, `Account`, `Session`, and `VerificationToken` support Auth.js. Password credentials, when enabled, use `User.passwordHash` and a server-side bcrypt or Argon2 implementation. Passwords and raw tokens are never stored.

`Role`, `Permission`, `UserRole`, and `RolePermission` implement database-backed RBAC. Permission keys use the form `resource:action`, such as `order:read` or `inventory:adjust`.

### Catalog

`Cake` is the sellable product family. `CakeVariant` represents a purchasable size or configuration and owns the SKU and price used for carts and orders. `Category` supports nested categories through the self-referencing category tree. `CakeCategory` provides the many-to-many catalog relationship.

`CakeCustomization` and `CakeCustomizationValue` define allowed server-validated options. Customer selections are stored as JSON snapshots in cart and order items after validation against the catalog definition.

`CakeImage` attaches a typed `MediaAsset` to a cake. Promotion targeting is separated into `PromotionCake` and `PromotionCategory`.

### Commerce

`Cart` and `CartItem` support both authenticated users and guest sessions. `Coupon`, `CartCoupon`, `CouponRedemption`, and `Promotion` represent discount configuration and usage history.

`Order` is the immutable commercial record. It is related to `OrderItem`, `OrderAddress`, `Payment`, `Shipment`, `OrderStatusHistory`, `OrderNote`, `Refund`, `CouponRedemption`, and `Notification` records. `Review` may reference a user and order, but moderation remains independent of order state.

`Wishlist` and `WishlistItem` support saved products. `LoyaltyAccount` and `LoyaltyTransaction` provide an append-only points ledger.

### Inventory

`InventoryItem` is one stock ledger per `CakeVariant`. `quantityOnHand` is physically available stock and `quantityReserved` is stock held for an active cart or order. `StockMovement` is the append-only audit trail. `InventoryReservation` records temporary holds and their lifecycle.

### Operations and observability

- `Shipment` and `ShipmentEvent` power delivery tracking and map/timeline views.
- `Notification` records email, WhatsApp, and SMS delivery attempts without putting provider credentials in the database.
- `AnalyticsEvent` stores validated behavioral events; `AnalyticsDailyMetric` stores aggregated reporting values.
- `AuditLog` records privileged changes to orders, catalog, users, inventory, roles, permissions, and media.

## Roles and permissions

The initial role catalogue should be seeded as system roles. Roles are data, not hardcoded conditionals scattered through handlers.

| Role | Intended responsibility | Typical permissions |
| --- | --- | --- |
| `customer` | Shop, manage their account, and view their own commerce data | `catalog:read`, `cart:write`, `order:create`, `order:read:own`, `review:create`, `wishlist:write`, `profile:write` |
| `support` | Customer support and order assistance | `customer:read`, `order:read`, `order:update`, `review:read`, `notification:send` |
| `baker` | Production preparation and cake availability | `cake:read`, `order:read`, `order:update:production`, `inventory:read` |
| `fulfillment` | Packing, dispatch, and delivery tracking | `order:read`, `shipment:update`, `inventory:read`, `inventory:reserve` |
| `analyst` | Read-only business reporting | `analytics:read` |
| `admin` | Day-to-day platform administration | All operational permissions except ownership transfer and secret management |
| `owner` | Full business ownership and access administration | All approved permissions, including `role:manage` and `permission:manage` |

The exact permission keys are seeded and reviewed before implementation. A permission must be checked on the server after session authentication and before the business operation. The browser may hide unavailable controls, but that is only a usability optimization and never an authorization boundary.

### Authorization sequence

1. Auth.js establishes the user session.
2. Next.js middleware performs coarse route protection where appropriate.
3. The API route or Server Action loads the session user and required permission.
4. The service checks ownership, resource state, and business constraints.
5. The mutation runs in a transaction when it affects more than one related record.
6. The mutation appends an `AuditLog` record for privileged or security-sensitive changes.

## Order workflow

### State transitions

| Current state | Allowed transition | Trigger and required server work |
| --- | --- | --- |
| `PENDING_PAYMENT` | `PAID` | Verified payment callback or approved cash-payment action; idempotently record `Payment`. |
| `PAID` | `CONFIRMED` | Server confirms payment amount/currency and active inventory reservations. |
| `CONFIRMED` | `PREPARING` | Authorized production user starts preparation. |
| `PREPARING` | `READY_FOR_DISPATCH` | Production marks the order complete and ready. |
| `READY_FOR_DISPATCH` | `OUT_FOR_DELIVERY` | Fulfillment creates/updates shipment and dispatches the order. |
| `OUT_FOR_DELIVERY` | `DELIVERED` | Courier or authorized staff confirms delivery and appends a shipment event. |
| `DELIVERED` | `COMPLETED` | Server closes the order after the configured completion period or explicit confirmation. |
| `PENDING_PAYMENT`, `PAID`, `CONFIRMED` | `CANCELLED` | Authorized cancellation or timeout; release active inventory reservations and update payment/refund state. |
| `PENDING_PAYMENT` | `FAILED` | Payment failure or checkout expiry; preserve the reason and release reservations. |

Every transition appends `OrderStatusHistory` with the previous state, new state, actor, reason, and relevant metadata. A service must reject transitions that are not in the allowed state machine.

### Checkout transaction

1. Re-read the cart, active variant prices, customization definitions, coupon rules, delivery rules, and user ownership on the server.
2. Reject inactive products, invalid customizations, invalid quantities, expired coupons, and stale or manipulated prices.
3. Lock the affected `InventoryItem` rows for update.
4. Confirm `quantityOnHand - quantityReserved` is sufficient for every line.
5. Create the order and immutable item/address snapshots.
6. Increase `quantityReserved` and create `InventoryReservation` records with an expiry time.
7. Add a `RESERVATION` `StockMovement` for each affected inventory item.
8. Commit the transaction before starting an external payment request.
9. Create a payment attempt with a server-generated idempotency key.

The server recalculates subtotal, discounts, delivery fee, tax, and total. Values submitted by the client are informational only.

### Payment and completion

- Payment provider callbacks are received by a server-only endpoint.
- The callback is authenticated or signature-verified, deduplicated by provider reference, and checked against the expected order amount and currency.
- A successful callback updates `Payment`, `Order.paymentStatus`, and the order state in one transaction.
- Cancellation or payment failure releases active reservations exactly once.
- When production begins, the reservation is converted to a sale: decrement `quantityOnHand`, decrement `quantityReserved`, mark the reservation `CONSUMED`, and append a `SALE` movement.
- Refunds create `Refund` records and never mutate or delete the original payment history.

## Inventory workflow

The available-to-sell quantity is:

```text
available = quantityOnHand - quantityReserved
```

Inventory changes must happen through a transaction that locks the relevant `InventoryItem` row. Direct updates from UI code are prohibited.

### Reservation lifecycle

1. `ACTIVE`: a cart or pending order holds stock until `expiresAt`.
2. `CONSUMED`: payment and fulfillment have converted the hold into a sale.
3. `RELEASED`: cancellation or payment failure returned the hold to availability.
4. `EXPIRED`: a scheduled server job released a hold after its expiry time.
5. `CANCELLED`: an operator explicitly invalidated the reservation.

The expiry job is safe to retry. It selects active expired reservations, locks their inventory items, decrements `quantityReserved`, marks the reservation terminal, and appends a `RELEASE` movement. It must not release a reservation that has already been consumed or released.

Manual receipts, corrections, waste, returns, and cycle counts use `StockMovement` with the actor, reason, before quantity, after quantity, and reference metadata. `InventoryStatus` is derived or updated transactionally from stock levels and reorder thresholds.

## Analytics workflow

### Collection

The browser may emit a restricted allowlist of non-sensitive events such as `page_view`, `search`, `product_view`, `add_to_cart`, and `checkout_started`. The server validates the event name, shape, size, and rate limit before persisting it.

Authoritative events such as `order_created`, `payment_succeeded`, `order_completed`, `refund_created`, and `inventory_adjusted` are emitted by backend services after successful transactions. They must not be accepted as trusted facts from the browser.

`AnalyticsEvent` stores pseudonymous identifiers, event properties, route context, and an IP hash when needed for abuse analysis. Do not store payment credentials, access tokens, full addresses, or unnecessary personal data in event properties.

### Aggregation

An asynchronous server job reads events in bounded time windows and upserts `AnalyticsDailyMetric` records using a deterministic `metricKey`. Aggregation is idempotent and can be rerun for a date range. Dashboards read aggregated metrics by default; access to raw events is restricted to the `analyst`, `admin`, and `owner` roles.

Recommended initial metric keys include `orders.created`, `orders.completed`, `revenue.gross`, `revenue.refunded`, `cakes.viewed`, `cakes.added_to_cart`, `checkout.started`, `checkout.completed`, and `inventory.low_stock`.

## File upload architecture

Files are stored in Cloudflare R2. PostgreSQL stores metadata and lifecycle state, never file bytes. `MediaAsset` is the canonical metadata record and typed join models such as `CakeImage` attach it to domain entities. `UploadSession` tracks a short-lived upload authorization and completion attempt.

### Upload flow

1. An authenticated server request declares the intended purpose, filename, MIME type, byte size, and optional dimensions.
2. The server checks the user permission and purpose-specific limits. It normalizes the filename and generates a non-guessable object key; clients never choose the final key.
3. The server creates `MediaAsset` with `PENDING` status and an `UploadSession` with a short expiry.
4. The server returns a short-lived R2 presigned upload URL or multipart upload instructions. R2 credentials remain server-only.
5. The browser uploads directly to R2 over HTTPS and never receives bucket secrets.
6. The browser calls a server completion endpoint. The server checks the session, performs an R2 `HEAD`/completion verification, confirms size and content type, optionally verifies a checksum, and marks the asset `READY`.
7. A privileged service attaches the ready asset through a typed relation such as `CakeImage`.
8. Public assets are served through an R2 custom domain or CDN URL. Private assets use short-lived signed download URLs.

### Upload security and cleanup

- Allowlist MIME types, file extensions, dimensions, and maximum sizes by `MediaPurpose`.
- Treat client-provided MIME type and filename as untrusted metadata.
- Use server-side content inspection and malware/quarantine processing before making an asset public.
- Keep user-uploaded files isolated from executable hosting paths.
- Do not expose raw bucket names or permanent signed URLs where a scoped URL will work.
- A scheduled cleanup job marks abandoned sessions failed and removes unreferenced temporary R2 objects.
- Deleting a domain attachment first removes the typed relation; physical object deletion is an audited, delayed cleanup operation.

## Consistency, retention, and operational controls

- Use database transactions for checkout, payment state changes, reservations, refunds, role changes, and inventory adjustments.
- Use unique provider references, order numbers, SKUs, session tokens, upload keys, and compound membership keys as idempotency boundaries.
- Never expose Prisma queries or database credentials to frontend bundles.
- Apply least-privilege database and R2 credentials per environment.
- Redact secrets and personal data from logs and analytics properties.
- Retain order, payment, inventory, and audit records according to business and legal requirements; retain analytics only as long as useful.
- Backups, restore tests, migration review, and production schema changes are operational prerequisites before launch.
