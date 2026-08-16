# Bite & Bloom staging smoke-test checklist

Use this checklist only against an isolated staging database and staging deployment. Never use production customer data or production payment credentials for these checks. Record the date, commit, environment name, tester, and evidence link for each result.

## Preconditions

- [ ] Staging uses a reviewed Prisma migration and a disposable or approved staging database.
- [ ] `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, and database settings are configured privately.
- [ ] Payment, email, WhatsApp, R2, and scheduled-job providers are either configured in staging or explicitly marked `blocked`.
- [ ] A test customer email, phone number, delivery address, and test coupon are available.
- [ ] No real customer or payment data is used.

## Public storefront

- [ ] `/`, `/cakes`, `/categories/birthday`, `/offers`, `/custom-cake`, `/tracking`, `/faq`, `/privacy`, `/terms`, and `/cookies` load on desktop and mobile widths.
- [ ] Theme toggle, keyboard focus, reduced-motion behavior, splash/loading state, WhatsApp action, and back-to-top action behave correctly.
- [ ] Catalog search, category filter, sort, pagination/load-more, product detail, gallery, allergens, variants, and availability match the API response.
- [ ] Product customization validates on the server; message, flavor, shape, toppings, candle, and card selections survive cart reload.
- [ ] Product and admin media controls remain clearly unavailable until verified media storage is configured.

## Cart and checkout

- [ ] Guest cart persists across reloads and supports quantity changes, removal, coupon apply/remove, save-for-later, delivery, and pickup.
- [ ] A signed-in customer merges the guest cart without duplicating items.
- [ ] Client-side price or variant changes cannot alter server totals.
- [ ] Invalid, full, expired, or out-of-window delivery slots are rejected by the server and unavailable slots are disabled in the UI.
- [ ] Duplicate checkout requests with the same idempotency key create one order and one reservation set.
- [ ] Failed validation does not create an order or leave an unreleased reservation.
- [ ] Cash-on-delivery creates the expected pending payment/order state and confirmation flow.
- [ ] M-Pesa STK success, failure, duplicate callback, retry, and unknown-callback cases are verified only after a real staging Daraja callback is configured.

## Account and tracking

- [ ] Registration, single-use email verification, login, logout, password reset, and guest checkout behavior match the configured email capability.
- [ ] Account profile, address create/edit/delete/default behavior, wishlist, loyalty read-only view, order history, receipt, reorder, and eligible cancellation are ownership-scoped.
- [ ] Deleting the default address promotes a remaining address, if one exists.
- [ ] Tracking requires the order number and checkout email, exposes only that order, and refreshes server status without client-side status fabrication.
- [ ] An account cannot read, cancel, reorder, or review another customer’s order.

## Admin and operations

- [ ] Unauthenticated requests to admin pages and admin APIs are rejected or redirected.
- [ ] Permission keys are enforced server-side; changing client-side labels or role-like UI cannot grant access.
- [ ] Catalog availability, inventory adjustment, order transitions, notes, courier assignment, shipment data, receipts, review moderation, customer detail, messages, newsletter records, and promotions persist through protected APIs.
- [ ] Admin views show explicit empty/unavailable states and never fabricate records when the database/API is unavailable.
- [ ] Promotion windows, usage limits, per-customer limits, and server-side discount totals are correct.
- [ ] Contact-message status updates, source labels, search, and filters work without exposing unrelated records.
- [ ] Export, staff invitation, login-audit, refund, proof-of-delivery, and purchase-order controls remain clearly unavailable until their approved workflows exist.

## Security and resilience

- [ ] API requests declaring a body over 1 MiB are rejected.
- [ ] Cross-origin browser mutations are rejected; legitimate server callbacks without an `Origin` header are handled according to their provider contract.
- [ ] Public contact, newsletter, registration, password-reset, and review limits return a safe retry response when exceeded.
- [ ] Invalid JSON, oversized strings, malformed IDs, invalid emails, unsafe status transitions, and unauthorized resource IDs return safe structured errors.
- [ ] CSP/security headers, HTTPS, cookie settings, backups, restore, monitoring, distributed rate limits, WAF/bot protection, and secret rotation are verified in the staging environment before release.

## Evidence record

| Check | Result | Evidence | Notes/blocker |
| --- | --- | --- | --- |
| Commit/environment |  |  |  |
| Public storefront |  |  |  |
| Cart/checkout |  |  |  |
| Account/tracking |  |  |  |
| Admin/operations |  |  |  |
| Security/resilience |  |  |  |

Local source checks do not replace this staging run. Provider callbacks, real email delivery, media uploads, database restore, and production deployment remain unverified until their external systems are configured.
