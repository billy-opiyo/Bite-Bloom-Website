# PROJECT ARCHITECTURE RULES

## Production-Grade Web Application

## MANDATORY TECHNOLOGY STACK

### Frontend

- Next.js (latest stable version)
- React
- TypeScript for all React components, hooks, utilities, and frontend logic
- JavaScript only when required by external libraries or build tools
- Cloudflare or Vercel hosting, with Vercel as the preferred platform

### Backend

- Node.js runtime
- Next.js API routes or dedicated Node.js services
- TypeScript for all backend code
- JavaScript only when absolutely necessary
- Neon PostgreSQL database
- Auth.js authentication and Server Actions middleware (Next.js)
- Next.js API routes will perform the web service work
- Prisma ORM for schemas, queries, and type-safe data access
- Cloudflare R2 storage
- Resend for emails
- WhatsApp Cloud APIs
- When setting up the database URL in Prisma, use Neon’s pooled connection string (`-pooler` in the host address) rather than the direct connection string

## CODING STANDARDS

1. Always use TypeScript (`.ts` and `.tsx` files) by default.
2. Avoid plain JavaScript unless there is a documented technical reason.
3. Use strict TypeScript typing.
4. Do not use `any` unless unavoidable.
5. Use reusable React components.
6. Follow clean architecture principles.
7. Separate frontend, backend, and shared code.
8. Use environment variables for secrets.
9. Never hardcode API keys, passwords, tokens, or database credentials.

## SECURITY REQUIREMENTS

1. All sensitive business logic must remain on the backend.
2. Never expose secret keys to the frontend.
3. Validate all inputs on both the client and server.
4. Implement authentication and authorization checks on the server.
5. Sanitize user-generated content.
6. Use HTTPS-only API communication.
7. Implement rate limiting for public APIs.
8. Use secure password hashing (bcrypt or Argon2).
9. Use JWT or secure session management.
10. Protect against XSS, CSRF, SQL injection, and SSRF attacks.
11. Use Cloudflare Turnstile for bot protection.
12. Use a Cloudflare Web Application Firewall.

## REVERSE ENGINEERING MITIGATION

1. Keep proprietary algorithms on the backend.
2. Never expose database queries to the frontend.
3. Never expose internal business rules to browser code.
4. Minimize frontend exposure to sensitive logic.
5. Use code splitting and production builds.
6. Store sensitive calculations on the server.
7. Use API gateways and server-side validation.

## FILE STRUCTURE

```text
/frontend
  /components
  /hooks
  /pages
  /app
  /styles

/backend
  /controllers
  /services
  /middleware
  /routes
```

## BEFORE ANY MODIFICATION

When creating, writing, or editing files:

1. Check whether the change belongs to the frontend or backend.
2. Use TypeScript by default.
3. Follow the existing project architecture rules.
4. Do not introduce a new framework without approval.
5. Maintain compatibility with Next.js, React, Node.js, TypeScript, and JavaScript.

> **NB:** These rules are mandatory and must be followed for every code generation, refactoring, bug-fixing, feature-addition, and deployment task.
