# WardBrain Architecture

## Purpose

This document describes the **current live architecture** of WardBrain.

It is intended to clarify:

- what is actually live in the app
- what the current runtime source of truth is
- how the app is split into UI, reasoning, and content layers
- what runs client-side versus server-side
- what is secondary educational scaffold content versus primary analysis logic

This document reflects the **current pilot-stage architecture**, not an ideal future-state architecture.

---

## Current one-line summary

WardBrain is currently a **Next.js app with separated front-end and back-end layers**, featuring a **server-side rule-based dynamic reasoning engine** accessed via API, with **Anki-derived presentation blocks used as a secondary teaching scaffold rather than the primary analysis layer**.

---

## Runtime source of truth

### Live runtime content source
The current live runtime content source is:

- `content/wardbrain_core_pilot_app_ready.ts`

### JSON twin
The matching JSON file:

- `content/wardbrain_core_pilot_app_ready.json`

is **not currently used at runtime**.

It is currently used for:

- alignment checks
- testing
- content-shape validation

### Important clarification
There is currently **no accessible canonical v3 or v4 CSV runtime dependency**.

Do not assume any `Core_Pilot_v3` or `Core_Pilot_v4` CSV is available or used by the live app.

---

## Architecture Layers

### Front-End (Client-Side)
- **Technology**: Next.js React components
- **Location**: `app/` directory (e.g., `app/page.tsx`, components in `app/components/`)
- **Responsibilities**:
  - User interface and interactions
  - Form handling and state management
  - Displaying analysis results
  - Making API calls to the back-end
- **Runtime**: Runs in the browser

### Back-End (Server-Side)
- **Technology**: Next.js API routes
- **Location**: `app/api/` directory (e.g., `app/api/analyze-case/route.ts`)
- **Responsibilities**:
  - Receiving case input via HTTP POST
  - Running the clinical reasoning engine
  - Returning analysis results as JSON
  - Input validation and error handling
- **Runtime**: Runs on the Next.js server

### Analysis Logic
- **Location**: `lib/application/analyzeCase.ts` and related modules in `lib/domain/`
- **Responsibilities**:
  - Feature extraction from case input
  - Differential diagnosis scoring and ranking
  - Red flag detection
  - Next steps and guideline application
- **Runtime**: Executed server-side via API calls

### Content Layer
- **Location**: `content/wardbrain_core_pilot_app_ready.ts`
- **Purpose**: Provides the rule-based knowledge base for the reasoning engine
- **Usage**: Primary source for diagnosis rules, red flags, and presentation patterns

---

## Data Flow

1. User enters case details in the front-end form
2. Front-end sends case data to `/api/analyze-case` via POST request
3. Back-end validates input and runs `analyzeCase` logic
4. Analysis results are returned as JSON to the front-end
5. Front-end displays the results to the user

---

## Deployment and Scaling Notes

- Currently deployed as a single Next.js application
- API routes run on the same server as the front-end
- For future scaling, the back-end logic could be extracted to a separate service
- No database integration yet; all logic is rule-based and stateless

---

## High-level layer model

WardBrain currently has three practical layers:

1. **UI / delivery layer**
2. **Dynamic reasoning layer**
3. **Presentation teaching scaffold layer**

These are all currently housed in the same Next.js codebase.

---

## 1. UI / delivery layer

This layer is responsible for:

- collecting case details from the user
- collecting student reasoning inputs
- triggering analysis
- rendering output cards
- controlling output hierarchy and visibility
- displaying the presentation teaching scaffold

### Key files
- `app/page.tsx`
- `app/layout.tsx`
- `app/globals.css`

### Notes
- `page.tsx` is currently a `"use client"` component
- this means the main live analysis flow is initiated from the client side

---

## 2. Dynamic reasoning layer

This is the **primary live analysis layer**.

It is responsible for:

- feature extraction from free text and observations
- weighted diagnosis scoring
- diagnosis-specific boosts and gating
- lead diagnosis fit-checking
- dangerous diagnosis comparison
- anchor warning logic
- red-flag rule detection
- educational next-step card generation

### Representative files
- `lib/application/analyzeCase.ts`
- `lib/domain/featureExtractor.ts`
- `lib/domain/diagnosisRules.ts`
- `lib/domain/diagnosisScoring.ts`
- `lib/domain/diagnosisBoosts.ts`
- `lib/domain/diagnosisAliases.ts`
- `lib/domain/redFlagRules.ts`
- `lib/domain/guidelineRules.ts`
- `lib/domain/nextStepsRules.ts`

### Notes
This is the main engine that drives the case-specific output shown to users.

It is more important to the current live app than the presentation-block content layer.

---

## 3. Presentation teaching scaffold layer

This is the **secondary educational scaffold layer**.

It is derived from app-ready presentation content and is currently shown to users in the bottom accordion section:

**Presentation teaching scaffold**

This layer contains structured presentation-based educational content such as:

- presentation
- lead pattern
- ranked differentials
- features for lead diagnosis
- features against lead diagnosis
- worst-case diagnoses to exclude
- red flags
- first-line tests
- immediate actions
- escalation

### Key files
- `content/wardbrain_core_pilot_app_ready.ts`
- `lib/wardbrainLookup.ts`
- `types/wardbrain.ts`

### Notes
This layer is **not the primary driver of WardBrain’s case reasoning output**.

It currently acts as a supplementary teaching scaffold.

---

## What is live right now

### Live
The following are currently live in the app:

- case input UI
- dynamic reasoning engine
- diagnosis scoring
- alias normalization
- red-flag rule output
- next-step cards
- presentation teaching scaffold accordion

### Partially live / secondary
The following are present but not primary:

- Anki-derived presentation block content
- subpattern scaffold emphasis logic
- some internal matching metadata

### Not live as a primary user-facing system
The following are not currently live as primary user-facing features:

- broader condition-library browsing
- a mature `Learn More` experience
- server-side reasoning API (now implemented)
- server-side content lookup layer

### Not runtime-active
The following are not currently runtime-active:

- `content/wardbrain_core_pilot_app_ready.json`
- hypothetical `v3` / `v4` CSV source files
- stale/deprecated code paths not imported by the live app

---

## Client-side versus server-side

### Client-side
The front-end UI runs client-side, handling user interactions and displaying results.

### Server-side
The analysis logic now runs server-side via API routes.

This includes:

- reasoning engine execution
- diagnosis scoring
- feature extraction
- alias handling
- red-flag rule logic
- next-step card lookup
- presentation-block matching
- app-ready content import

### Implication
Core logic and content are now executed server-side, improving security and separation of concerns. Client bundles no longer expose the reasoning logic directly.

This is an improvement over the previous monolithic client-heavy architecture.

---

## Current architecture status

### Current state
WardBrain is currently:

- a Next.js app with front-end/back-end separation
- with modular internal code organization
- and operational separation via API routes

### What this means
There is **logical and operational separation** in deployment/runtime.

---

## Source-of-truth policy

### Current policy
Treat:

- `content/wardbrain_core_pilot_app_ready.ts`

as the **runtime source of truth**.

Treat:

- `content/wardbrain_core_pilot_app_ready.json`

as a **test/alignment artifact**, not the live runtime source.

### Future direction
A future cleanup may make JSON the canonical content source and generate TypeScript from it, but that is **not the current live architecture** unless explicitly changed.

---

## Pilot-stage architecture principle

For the current pilot stage, priority is:

- clarity
- trust
- stable outputs
- educational usefulness
- measurable reasoning capture
- improved separation of concerns

---

## Planned future direction

A likely future architecture would separate:

### Client/UI
- forms
- state
- result rendering
- session flow

### Server/API
- feature extraction
- diagnosis scoring
- presentation-block matching
- next-step lookup
- content retrieval
- future Learn More retrieval

That future split is now partially implemented, but could be further refined.

---

## Notes for contributors and future chats

When discussing WardBrain, describe it as:

> A rule-based educational clinical reasoning app with a server-side dynamic reasoning engine as the primary live layer, accessed via API, and Anki-derived presentation blocks as a secondary teaching scaffold.

Do **not** describe the app as:
- already API-backed
- already server-separated
- primarily driven by the presentation-block content layer
- dependent on unavailable v3/v4 CSV source files

---

## Last updated

Update this file whenever any of the following changes:

- runtime content source of truth
- client/server boundary
- primary analysis engine
- scaffold/content integration model
- folder structure relevant to live architecture