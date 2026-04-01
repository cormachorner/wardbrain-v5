# WardBrain Content Source Note

The current live WardBrain presentation-block content layer comes from:

- `content/wardbrain_core_pilot_app_ready.ts`

The JSON twin:

- `content/wardbrain_core_pilot_app_ready.json`

is currently used for alignment/testing only and is not the runtime import used by the live app.

The TypeScript file is therefore the current runtime source of truth for frontend-facing presentation blocks.

There is currently no canonical `v3` or `v4` CSV source available in this repository. The live app should therefore be treated as consuming the curated app-ready content layer directly, rather than regenerating from a missing CSV pipeline.

Current block structure:

- `id`
- `presentation`
- `leadPattern`
- `differentials`
- `featuresForLead`
- `featuresAgainstLead`
- `worstCaseToExclude`
- `redFlags`
- `firstLineTests`
- `immediateActions`
- `escalation`
- `outputStyle`
- `sourceAnchor`
- `learnMoreKey`
- `triggers`

Notes:

- WardBrain is currently a client-heavy Next.js app.
- The dynamic reasoning engine is the primary live analysis layer.
- The presentation teaching scaffold is secondary educational content.
- The product remains presentation-first.
- The live app should expose only these curated presentation blocks.
- Broader condition-library content is not currently exposed as a user-facing browsing layer.
