# Architecture

WardBrain is a Next.js application with a server-side deterministic clinical reasoning engine and optional, feature-flagged LLM assistance for narrow extraction and presentation rewriting tasks.

## Application Stack

- Frontend: Next.js, React, TypeScript
- Backend: Next.js API routes
- Auth: NextAuth credentials provider
- Database: Prisma with Neon/Postgres in deployed environments
- Deployment: GitHub and Vercel
- Testing: custom TypeScript test runner via `npm test`, plus lint and production build gates

## Main Runtime Flow

1. The user enters a de-identified vignette and structured case details.
2. The client sends the payload to `/api/analyze-case`.
3. The server runs `lib/application/analyzeCase.ts`.
4. The deterministic engine extracts features, scores diagnoses, detects red flags, builds uncertainty, adds guideline support, and generates the presentation summary.
5. The UI displays ranked differentials, red flags, dangerous diagnoses, uncertainty, guideline support, and "Present to the reg".

## Core Layers

### UI Layer

The UI lives primarily in `app/` and `components/`. It handles case entry, authentication-aware navigation, result rendering, admin pages, and progressive disclosure for secondary detail.

### Auth and Admin Layer

NextAuth handles sign-in and JWT sessions. Admin access is protected by role checks in `lib/adminAuth.ts`. Admin users can manage clinical content, users, test cases, and test runs.

### Persistence Layer

Prisma models user accounts, sessions, cases, clinical content, and clinical test cases. Neon/Postgres is used for deployed database storage.

### Deterministic Reasoning Layer

The deterministic reasoning layer lives under `lib/application/` and `lib/domain/`.

Key responsibilities:

- Presentation-block routing
- Feature extraction and slug canonicalisation
- Diagnosis scoring and ranking
- Diagnosis alias comparison
- Red-flag pattern detection
- Uncertainty and missing-information generation
- Guideline support lookup

### LLM Assistance Layer

The LLM layer lives under `lib/llm/` and is disabled by default. It can optionally assist with feature extraction and "Present to the reg" rewriting when explicitly enabled with environment variables and a valid API key.

The LLM cannot:

- Decide diagnoses
- Fire red flags directly
- Override deterministic scoring
- Replace supported-presentation routing

## Evaluation Layer

Bulk evaluation scripts under `scripts/` run labelled fixtures through deterministic-only and optional LLM-augmented paths. Reports are written to `reports/` for review.

