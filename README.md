# WardBrain

WardBrain is an educational clinical reasoning tool for medical students. It is not a real-time diagnostic or prescribing system.

## Current architecture

- Next.js app with a client-heavy runtime
- Dynamic case-specific reasoning engine is the primary live analysis layer
- Presentation teaching scaffold is secondary educational content
- No accessible `v3` or `v4` CSV runtime dependency currently exists in this repo

## Runtime content source of truth

- Runtime presentation scaffold source: [content/wardbrain_core_pilot_app_ready.ts](content/wardbrain_core_pilot_app_ready.ts)
- Alignment/testing twin: [content/wardbrain_core_pilot_app_ready.json](content/wardbrain_core_pilot_app_ready.json)

The live app currently imports the TypeScript content file at runtime. The JSON file is kept aligned through tests and is not the runtime content source.

## Getting started

```bash
npm install
npm run dev
```

## Validation

```bash
npm test
npm run lint
```
