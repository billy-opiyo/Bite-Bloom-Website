# Bite & Bloom release, migration, and database runbook

**Status:** source-level runbook; staging and production execution are not verified.

This runbook is deliberately environment-agnostic. It does not contain credentials or approve a production deployment. Run the staging sequence first, record evidence, and obtain the deployment owner’s approval before repeating any step against production.

## Required separation

- Runtime application traffic uses the approved pooled `DATABASE_URL`.
- Backups and restores use an approved direct PostgreSQL URL; do not use a pooler for `pg_dump` or `pg_restore`.
- Staging and production must have separate database, Auth.js, payment, email, WhatsApp, media, scheduler, and public URL values.
- Use disposable or explicitly approved restore targets. Never restore a staging backup over production.
- Keep all URLs, secrets, customer data, and payment credentials outside git and chat.

## 1. Preflight and review

1. Confirm the approved staging database, direct backup URL, deployment owner, retention policy, and rollback decision.
2. Review [`prisma/migrations/00000000000000_initial/migration.sql`](../../prisma/migrations/00000000000000_initial/migration.sql) against `prisma/schema.prisma` and confirm the migration is intended for the empty staging database.
3. Confirm the staging environment has a disposable restore target and a private `SHADOW_DATABASE_URL` that Prisma may create/reset.
4. Confirm the provider checklist in [`STAGING_SMOKE_TEST_CHECKLIST.md`](../STAGING_SMOKE_TEST_CHECKLIST.md). Mark unavailable providers as blocked; do not substitute fake success.

## 2. Local, read-only checks

Run from the repository root with a non-production environment loaded:

```powershell
node .\node_modules\prisma\build\index.js validate --schema .\prisma\schema.prisma
node .\node_modules\prisma\build\index.js generate --schema .\prisma\schema.prisma
node .\node_modules\prisma\build\index.js migrate diff --from-migrations .\prisma\migrations --to-schema-datamodel .\prisma\schema.prisma --shadow-database-url $env:SHADOW_DATABASE_URL --exit-code
```

The migration-directory diff requires a reachable shadow database. A local placeholder URL is sufficient for schema parsing and baseline generation, but it cannot verify migration application or consistency.

## 3. Apply the reviewed migration to staging

After review and private environment configuration:

```powershell
node .\node_modules\prisma\build\index.js migrate deploy --schema .\prisma\schema.prisma
```

Record the migration output, deployment commit, database identifier, and timestamp. Do not use `db:push` for staging or production. Run the seed only when the staging data policy explicitly allows it and the seed is known to be idempotent.

## 4. Staging verification

Run [`STAGING_SMOKE_TEST_CHECKLIST.md`](../STAGING_SMOKE_TEST_CHECKLIST.md) against the isolated staging deployment. At minimum, capture evidence for:

- public storefront, catalog, cart, checkout, guest tracking, and authentication;
- price/variant/inventory/coupon tampering rejection;
- duplicate checkout and duplicate M-Pesa callback behavior;
- COD and configured Daraja success/failure paths;
- admin permission enforcement, order transitions, inventory, reviews, communications, and empty states;
- security headers, rate limits, callback HTTPS, and provider failure states.

Do not mark a provider-dependent check passed when the provider is not configured.

## 4a. CI and release checks

Until a CI provider and deployment project are approved, run the equivalent checks locally and attach their output to the release evidence:

```powershell
node .\node_modules\typescript\bin\tsc --noEmit --pretty false -p .\frontend\tsconfig.json
node .\node_modules\next\dist\bin\next lint frontend
npm test -- --test-reporter=spec
```

The repository workflow at `.github/workflows/quality.yml` runs these checks with process-only Auth.js/site placeholders, no database connection, and an isolated `.next-build` output directory. Its remote execution, retained logs, branch protections, and protected-environment approvals still require CI-owner verification before deployment.

## 5. Backup and disposable restore

Before production migration, use a direct database URL and a disposable target. Confirm the installed PostgreSQL client version is compatible with the database.

```powershell
pg_dump --format=custom --no-owner --no-acl --file .\artifacts\bite-bloom-staging-<timestamp>.dump $env:BACKUP_DATABASE_URL
pg_restore --clean --if-exists --no-owner --no-acl --dbname $env:RESTORE_DATABASE_URL .\artifacts\bite-bloom-staging-<timestamp>.dump
```

After restore, run Prisma validation, a read-only health/catalog query, and the staging smoke checklist’s order-read checks. Record dump checksum, source/target identifiers, restore output, and cleanup confirmation. Keep the dump in an approved secure location; never commit it.

## 6. Production release gate

Production requires all of the following evidence:

- reviewed migration and successful isolated-staging deployment;
- successful disposable restore;
- staging smoke checklist with no unexplained failures;
- provider credentials and HTTPS callback verification;
- approved business rules for delivery, pickup, refunds, retention, legal copy, and staff permissions;
- deployment owner approval and a rollback/incident contact.

Deploy the application and run `migrate deploy` in the approved order defined by the hosting provider. Record the commit, migration output, health result, and release time.

## 7. Rollback and incident handling

- Prefer a forward corrective migration. Do not manually edit an applied migration or invent an unreviewed down migration.
- If the application release is faulty but the schema is compatible, roll back the application deployment and preserve database evidence.
- If a migration fails, stop the release, retain the exact error, inspect migration state, and obtain database-owner direction before retrying.
- Do not restore over production as a first response. A restore is an incident action requiring explicit approval and a current backup.
- For payment, inventory, authentication, or data-integrity incidents, disable the affected workflow, preserve logs with sensitive values redacted, and escalate to the deployment/database owner.

## Evidence record

| Gate | Result | Evidence | Owner/date | Blocker |
| --- | --- | --- | --- | --- |
| Schema and migration review |  |  |  |  |
| Staging migration |  |  |  |  |
| Staging smoke checklist |  |  |  |  |
| Disposable backup/restore |  |  |  |  |
| Provider and callback verification |  |  |  |  |
| Production approval/release |  |  |  |  |
