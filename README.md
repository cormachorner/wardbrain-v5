# WardBrain

WardBrain is an educational clinical reasoning tool for medical students. It is not a real-time diagnostic or prescribing system.

## Current architecture

- **Next.js 16** app with separated front-end and back-end layers
- **Server-side reasoning engine** accessed via `/api/analyze-case` endpoint
- **Authentication**: NextAuth v5 with bcrypt password hashing and Prisma SQLite
- **Security**: Zod input validation, security headers, HTTPS-ready configuration
- **Database**: SQLite for user accounts and case storage
- Presentation teaching scaffold is secondary educational content
- No accessible `v3` or `v4` CSV runtime dependency currently exists in this repo

## Authentication & User Management

The app includes secure user authentication:
- User signup via `/api/auth/signup` with password hashing
- Login via NextAuth credentials provider
- Role-based user classification (ADMIN, INSTRUCTOR, STUDENT) based on email
- Session persistence with NextAuth JWT
- User data storage in SQLite via Prisma

**Security features:**
- Bcrypt password hashing (12 rounds)
- Zod input validation for all APIs
- Security headers (X-Frame-Options, X-Content-Type-Options, etc.)
- Environment variables for secrets (not committed to git)

## Runtime content source of truth

- Runtime presentation scaffold source: [content/wardbrain_core_pilot_app_ready.ts](content/wardbrain_core_pilot_app_ready.ts)
- Alignment/testing twin: [content/wardbrain_core_pilot_app_ready.json](content/wardbrain_core_pilot_app_ready.json)

The live app currently imports the TypeScript content file at runtime. The JSON file is kept aligned through tests and is not the runtime content source.

## Getting started

```bash
npm install
npm run dev
```

The app runs on `http://localhost:3000` by default.

For testing authentication and case analysis, see [TESTING_GUIDE.md](TESTING_GUIDE.md).

## Validation

```bash
npm test
npm run lint
```

