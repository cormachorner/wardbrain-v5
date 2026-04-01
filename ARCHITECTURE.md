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

WardBrain is currently a **client-heavy monolithic Next.js educational app** whose main live functionality is a **rule-based dynamic reasoning engine**, with **Anki-derived presentation blocks used as a secondary teaching scaffold rather than the primary analysis layer**.

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
- `lib/differentialEngine.ts`
- `lib/featureExtractor.ts`
- `lib/diagnosisRules.ts`
- `lib/diagnosisScoring.ts`
- `lib/diagnosisBoosts.ts`
- `lib/diagnosisAliases.ts`
- `lib/redFlagRules.ts`
- `lib/guidelineRules.ts`
- `lib/nextStepsRules.ts`

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
- server-side reasoning API
- server-side content lookup layer

### Not runtime-active
The following are not currently runtime-active:

- `content/wardbrain_core_pilot_app_ready.json`
- hypothetical `v3` / `v4` CSV source files
- stale/deprecated code paths not imported by the live app

---

## Client-side versus server-side

### Client-side
At present, most important WardBrain logic runs client-side.

This includes:

- reasoning engine imports
- diagnosis scoring
- feature extraction
- alias handling
- red-flag rule logic
- next-step card lookup
- presentation-block matching
- app-ready content import

### Server-side
There is currently **no meaningful API/server boundary** for the reasoning/content system.

There are currently no dedicated runtime API routes or server actions serving as a reasoning boundary.

### Implication
Because core logic and content are imported into a client-rendered page, a meaningful amount of the following is likely inspectable in browser bundles:

- diagnosis rules
- scoring heuristics
- trigger phrases
- alias maps
- next-step cards
- red-flag rules
- presentation teaching scaffold content

This is acceptable for the current pilot-stage educational prototype, but is not the desired long-term architecture.

---

## Current architecture status

### Current state
WardBrain is currently best described as:

- a monolithic Next.js app
- with modular internal code organization
- but no meaningful frontend/backend runtime separation

### What this means
There is some **logical separation in code**, but not yet **operational separation in deployment/runtime**.

---

## Source-of-truth policy

### Current policy
Until runtime architecture changes, treat:

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

Priority is **not yet** full backend/API separation.

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

That future split is desirable, but it is **not yet the current architecture**.

---

## Notes for contributors and future chats

When discussing WardBrain, describe it as:

> A rule-based educational clinical reasoning app with a dynamic reasoning engine as the primary live layer, and Anki-derived presentation blocks as a secondary teaching scaffold.

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