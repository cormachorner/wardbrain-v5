# Development Log

WardBrain began as an educational clinical reasoning coach for medical students: a way to turn messy, de-identified clinical vignettes into safer, sharper reasoning. The early concept was deliberately practical: identify likely diagnoses, surface dangerous differentials, challenge anchoring, and help a learner present a case to a senior clinician.

## Platform Foundation

- Built as a Next.js, React, and TypeScript application.
- Uses API routes for server-side analysis and protected admin workflows.
- Uses GitHub for source control and Vercel for deployment.
- Uses Prisma as the data access layer.
- Uses Neon/Postgres for deployed database storage.
- Uses NextAuth credentials authentication with roles for admin access.

## Reasoning Engine

The core reasoning system is deterministic. WardBrain extracts clinical features, canonicalises slugs, scores diagnoses, detects red-flag patterns, and generates explanation traces without relying on an LLM for diagnosis ownership.

Initial pilot work focused on:

- Acute abdominal pain
- Chest pain
- Breathlessness / pleuritic chest pain

The engine was progressively hardened using hostile cases, messy pilot vignettes, negation handling, dynamic extraction, red-flag specificity, and regression tests.

## Evaluation and Safety Layers

The project added a bulk evaluation harness to compare deterministic-only output with optional LLM-assisted feature extraction. Weighted feature recall was added so missed high-risk findings count more than minor supporting details.

The optional LLM layer remains scaffolded and disabled by default. It can propose feature slugs only, passes through a clinical sanity filter, and cannot rank diagnoses or fire red flags directly.

## Current Work

Current development is adding Headache v1 as a new deterministic presentation block with its own diagnosis rules, red flags, guideline mappings, fixtures, and bulk evaluation coverage.

