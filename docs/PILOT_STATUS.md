# WardBrain Pilot Status

Last updated: 2026-09-01

WardBrain is an educational clinical-reasoning tool for de-identified practice cases. It is not clinical decision support.

## Current Gate Status

| Gate | Status |
| --- | --- |
| `npm test` | Passing, 350/350 |
| `npm run lint` | Passing |
| `npm run build` | Passing |

## Pilot-Supported Blocks

### Acute Abdominal Pain

- Abdominal aortic aneurysm
- Mesenteric ischaemia
- Appendicitis
- Acute pancreatitis
- Perforated viscus
- Ectopic pregnancy
- Ovarian / acute pelvic pathology
- Cauda equina syndrome
- Gastroenteritis
- Diabetic ketoacidosis
- GI bleed
- Sepsis
- UTI / urosepsis

### Breathlessness / Pleuritic Chest Pain

- Pulmonary embolism
- Pneumothorax
- Pneumonia
- Asthma exacerbation
- COPD exacerbation
- Heart failure
- Panic / anxiety
- Anaemia
- Diabetic ketoacidosis
- Sepsis
- Acute coronary syndrome

### Chest Pain

- Acute coronary syndrome
- Pulmonary embolism
- Acute aortic syndrome
- Pneumothorax
- Pericarditis
- GORD
- Pneumonia
- Musculoskeletal chest pain
- Panic / anxiety

### Confusion / Delirium

- Delirium secondary to infection
- Sepsis
- Stroke / neurological emergency
- TIA
- Hypoglycaemia
- UTI / urosepsis
- Meningitis / encephalitis

### Headache

- Subarachnoid haemorrhage
- Migraine
- Tension headache
- Temporal arteritis
- Meningitis / encephalitis
- Stroke / neurological emergency
- Viral illness

### RUQ Pain / Jaundice

- Acute cholangitis
- Acute cholecystitis
- Choledocholithiasis / obstructive jaundice
- Biliary colic / gallstone disease
- Primary sclerosing cholangitis
- Primary biliary cholangitis

### Testicular Pain / Scrotal Swelling

- Testicular torsion

## Pilot Guardrails Added

- The case-entry UI now lists pilot-supported presentation blocks.
- The analysis response now warns when a vignette does not clearly match a supported block.
- Red flags now expose the triggering feature slugs.
- Top ranked diagnoses now include support/against traces.
- Analysis now includes an uncertainty layer with missing discriminating information.

## Pilot UX Readiness Audit - 2026-09-01

### Before

- First-time users landed on structured entry, which required more manual form completion before they saw value.
- Required fields were enforced by the API, but the form did not clearly block analysis until age, sex, and presenting complaint were present.
- Loading and empty-result states were functional but did not strongly reinforce education-only/de-identified pilot use.
- Ranked differentials exposed raw internal scores in the primary UI, which could read as false precision or confusing low-score output.
- Mobile layout worked, but dense cards and horizontal result rows were harder to scan on small screens.

### After

- Case entry now defaults to paste-first smart input, while preserving structured review before analysis.
- The form shows pilot guidance, highlights required fields, disables analysis until required fields are present, and disables parse/clear controls during analysis.
- Loading, error, and empty output states are clearer and framed around educational, de-identified practice cases.
- Differential ranking still uses the same deterministic logic, but the visible UI now describes evidence strength rather than raw scores. Internal scores remain available in development-only scoring detail.
- Card padding and result header layout have been tightened for mobile readability.

### Scope Guardrail

No deterministic clinical scoring, red-flag logic, lab interpretation, presentation block matching, or LLM extraction logic was changed in this pass.

## Pre-pilot clinical safety hardening — 2026-09-19

### Findings and targeted fixes

| Issue | Root cause / previous behaviour | Fix and resulting behaviour |
| --- | --- | --- |
| Explicit negation | The exact deterministic `no pleuritic pain` phrase was already guarded, but the optional LLM sanity check inspected the proposed evidence excerpt, which could omit `no`. Negation also used flattened text, missed suffix/list denials, exempted some background features, and could be bypassed by derived features. | Preserve original sentence/field boundaries for negation; check suffixes and coordinated denial lists; remove background exemptions; veto explicitly negated final features and LLM proposals against the original case, including DB aliases. Negation cannot be lost by clipping an evidence quote. |
| DKA missed without known diabetes | The lab-modifier eligibility check required a textual diabetes/hyperglycaemia cue even when numeric glucose was high. `deep tachypnoea` was not a Kussmaul synonym. | Accept numeric glucose >11 mmol/L plus numeric metabolic acidosis and a metabolic clue (polyuria, polydipsia, Kussmaul breathing or ketotic breath). Reuse existing DKA lab weights and cross-family candidate inclusion. The supplied 24F vignette ranks DKA first across breathlessness, abdominal pain, confusion, chest pain and headache routing. Explain that ketones are required to establish ketoacidosis. |
| Main-vignette labs missed or misassigned | Main paste already called the dedicated parser, but the parser selected only one alias per comma/line fragment and searched arbitrarily far forward for its number. A missing Hb value could borrow a later number. Existing `undefined` fields could also overwrite newly parsed values during merging. | Parse all label/value pairs in narrative order, require a number immediately after its label, retain panel context and existing duplicate/conflict handling, and ignore undefined existing entries when merging. Both paste workflows still use the same structured lab fields. Explicit mg/dL, g/dL and mmHg values are rejected with a conversion/review warning rather than silently treated as canonical units. |
| Age auto-population | `aged 58` was absent; the first matching age won without checking ambiguity or plausible range. The other requested formats were already partly supported. | Support the four requested formats and Unicode hyphens; accept only one distinct age in range 0–120. Multiple ages, unlabelled numbers and identified relative ages remain unfilled for review. |
| Qualitative labs | Numeric parsing could not represent abnormality reports without numbers. | Recognise raised ALT/transaminases, bilirubin, ALP/GGT, WCC/leucocytosis, low Hb/anaemia, raised creatinine and glucose/hyperglycaemia. Mark them as qualitative in interpretation and display, without fabricating measurements, severity or numeric pattern classifications. Existing numeric values—including normal or invalid values—suppress the corresponding qualitative report. Normal numeric glucose also suppresses a conflicting textual hyperglycaemia cue through both deterministic and optional LLM extraction. |
| Cough / hypotension over-inference | `infection_source` explicitly included plain cough and unspecified sputum. SBP 94 was above the previous numeric hypotension cutoff of 92. | Remove those nonspecific infection aliases, guard against legacy DB cough mappings and weak LLM infection proposals, and recognise systolic BP <100 as a circulatory concern. Dry cough and low BP alone do not create an infection source, sepsis flag or shock feature. Productive/infective respiratory controls still trigger appropriately. |

### Clinical/scoring scope

- No scoring architecture, diagnosis definitions, routing architecture or general weights were rewritten.
- Existing DKA lab weights (+7 metabolic acidosis, +2 low bicarbonate, +6 hyperglycaemia where applicable) are retained. The new eligibility path requires the combined numeric/metabolic pattern; isolated acidosis, isolated glucose elevation and the combination without metabolic context receive no new DKA lab promotion.
- DKA remains a suspected diagnosis requiring ketone confirmation. This follows the distinction between the glucose, ketone and acidosis components in the [JBDS adult DKA guideline](https://www.diabetes.org.uk/sites/default/files/2023-03/JBDS%2002%20DKA%20Guideline%20with%20qr%20code.pdf).
- Numeric SBP 93–99 now contributes to existing hypotension-dependent rules. This is a circulatory concern threshold, not a diagnosis of shock or sepsis; [NICE adult IV fluid guidance](https://www.nice.org.uk/guidance/cg174/chapter/recommendations) includes SBP below 100 among signs prompting assessment for urgent resuscitation.
- Qualitative reports use separate, explicitly labelled +1 support, capped at one qualitative modifier per diagnosis and gated by compatible clinical context. They cannot trigger numeric severity warnings, hepatocellular/cholestatic ratios or the new numeric DKA eligibility path. Raised creatinine is reported without inventing an AKI diagnosis or stage; limited sepsis support requires independent infection clues.

### Lab precedence

1. Existing structured/manual values win over either paste source. Main paste now supplies those values to the parser and displays its conflict warnings.
2. Identical values/aliases deduplicate; contradictory values within a paste remain unfilled with a warning. Neither chronological order nor an average resolves a conflict.
3. Clear a structured field before intentionally replacing its value. The next paste can fill a cleared field.
4. Qualitative statements never overwrite numeric fields or provide a substitute numeric measurement. The dedicated lab paste box remains available.

### Permanent regressions and validation

`tests/prePilotSafety.test.mts` is registered in `npm test`. It covers denial prefixes/suffixes, coordinated lists, boundary preservation, clipped LLM quotes, DB aliases, the supplied DKA case across five presenting families, negative DKA controls, inline multi-lab parsing, missing-number safety, duplicates/conflicts/cleared fields, age formats and ambiguity, qualitative findings and numeric precedence, PE/dry-cough and sepsis/BP controls.

Only the DKA vignette was supplied verbatim in the task. The other four scenario groups (PE, qualitative hepatobiliary disease, anaemia, and infective instability) are representative regressions based on the reported failures, not claimed copies of unavailable QA cases.

Final validation:

- `npm test`: **614 passed, 0 failed** (560 existing tests plus 54 new permanent regression checks).
- `npm run lint`: **passed**.
- `npm run build`: **passed**, including TypeScript and generation of 21 pages; Turbopack used the previously authorised local worker-port permission.
- `git diff --check`: **passed**.

No database content, dependency versions or clinical definition files were modified. Changes remain confined to extraction, lab evidence integration, boundary validation, regression coverage and the two necessary UI labels/notices.

### Remaining limitations before pilot

- This remains bounded rule-based text extraction. Complex temporal changes, double negation, family-history prose and unresolved contradictory statements require student review. Explicit conflicting positive/negative text conservatively suppresses the feature; it does not infer which statement is more recent.
- Qualitative reports do not establish magnitude, acuity, organ failure or a definitive diagnosis. Unsupported phrasing and units still need review in the structured fields; explicit mg/dL, g/dL and mmHg are refused, but this is not a comprehensive unit-validation or conversion system.
- The supplied DKA case has no ketone result. Ketoacidosis must be confirmed; this change does not claim complete coverage of euglycaemic DKA or all mixed metabolic disorders.
- Unlabelled glucose still uses the existing `fastingGlucose` storage field and reference range. The new DKA gate uses >11 rather than that fasting upper limit. Separating random/fasting glucose is deferred to an explicit schema/content change.
- Deployed DB phrase content and a live optional LLM still warrant pilot QA; tests exercise injected DB aliases and mocked proposals without requiring those services.
- Exact regressions for the remaining original QA vignettes can be added when their de-identified text is available.

## Real paste workflow hardening — 2026-09-19

### Why parser tests passed while the paste UI failed

The previous tests called `parseSmartCaseInput` directly and then passed its patch to analysis. They never mounted `Home`/`CaseForm`, dispatched a textarea input event or inspected the outgoing request.

- Main textarea `onChange` only updated local `smartInputText`. Age, history, observations and labs were applied to parent case state only after **Organise and review**. Pasting and then selecting **Enter details** left those fields empty. There was no evidence of a React batching race: `Home.updateField` already used functional updates, and the explicit button path could populate numeric fields.
- The dedicated lab paste handler updated state only when it found numeric values. Qualitative-only input stayed in local textarea state and was absent from the analysis request. There was no request-schema field for that report.
- The qualitative parser did not support the exact case B phrases `ALP and GGT elevated` and `ALT mildly raised`.
- Debug labels were guarded only by `NODE_ENV !== "production"`, which exposed them in ordinary student sessions hosted by `npm run dev`.

### Changes and observed behaviour

- Main textarea input now runs parsing and submits an atomic parent-state patch immediately. Unreviewed automatic values track subsequent edits and are removed when their evidence is removed; this prevents early digits or a previous draft from freezing into structured state. **Organise and review** remains the review action. The five requested age forms populate the actual Age field; existing age and sex are preserved. Unlabelled/ambiguous numbers remain unfilled.
- Exact case A now populates age **72**, bilirubin **120**, ALP **340**, ALT **85**, WCC **17** in rendered controls and the JSON sent to `/api/analyze-case`. BP **94/60** and HR **112** remain in the clinical narrative/observations and generate the existing physiology features. No second lab paste is required.
- Dedicated lab parsing now retains its report in optional `CaseInput.labNarrative`, validated by the API and retained by analysis normalisation. It is supplied to qualitative lab interpretation even with zero numeric results. Original text in the main paste continues through `history`.
- Qualitative parsing accepts modest intensity words and coordinated `and` descriptions. Both paste sources are tested for every requested phrase. No numeric result is fabricated; numeric findings still override qualitative descriptions; the previously established +1-per-diagnosis cap is unchanged. Explicit negative/normal phrases remain negative.
- The existing **reviewed/manual current structured value wins** convention is retained as the safer precedence equivalent permitted by the request. Neither paste source silently overwrites a populated lab, including reviewed values previously extracted from the main vignette. Identical values deduplicate; conflicts produce review notices. Clear a field to replace it deliberately. A dedicated result entered first therefore wins over a later main paste; if the main value is already structured, a later conflicting dedicated result is reported rather than silently replacing it.
- Lab weights, internal scores and detailed presentation diagnostics require both a non-production runtime and explicit `NEXT_PUBLIC_WARDBRAIN_DEBUG=1`. They are hidden by default even on the development server, and always hidden in production. Educational explanations remain visible.

### Ruptured AAA warning

Previously, abdominal/back/flank pain + instability + a vascular-context feature could trigger the warning, with age supplying vascular context and SBP 94 supplying hypotension. The specific warning now additionally requires collapse, positive shock, a pulsatile abdominal finding, or sudden severe/back/flank pain. Age + nonspecific abdominal pain + SBP 94 alone is insufficient. No diagnosis scoring weights changed.

The exact cholangitis case D still ranks cholangitis first and retains its relevant infective escalation, without the ruptured AAA warning. Positive controls cover collapse/syncope, sudden severe pain, back/flank pain with low BP, pulsatile mass, explicit shock and coexisting infection with a convincing rupture pattern. This display gate does **not** rule out AAA; clinical suspicion must remain broader, as described in [NICE NG156](https://www.nice.org.uk/guidance/ng156/chapter/Recommendations#identifying-symptomatic-or-ruptured-abdominal-aortic-aneurysms).

These tests also exposed a synonym bug: `no shock` vetoed numeric hypotension because `shock` was a direct hypotension phrase. Positive shock now adds hypotension only after negation has been resolved. Denying shock no longer erases measured low BP, including when a legacy DB phrase maps shock to hypotension; denied shock alone supplies neither feature.

### Full-path regressions and validation

- `tests/pasteWorkflow.test.mjs`: **43 mounted-page tests** using React DOM and development-only jsdom. They mount the actual `Home`, `CaseForm` and `AnalysisResults`; dispatch input/button events; inspect rendered fields; capture the real request JSON; and send that request through the actual API schema, normalisation and analysis. Only authentication and network transport are substituted. Live LLM calls are disabled.
- Covers exact A/B/D cases, all age forms, ambiguous numbers, both review paths, all 12 qualitative phrases through both sources, normal/negative descriptions, numeric precedence, manual age/lab preservation, draft edits/removal, conflicting sources and debug visibility/opt-in.
- `tests/aaaPilotSafety.test.mts`: **16 positive/negative AAA and instability regressions**.
- Regression sensitivity was checked in a temporary compiled copy: disabling the automatic `CaseForm` state update makes case A fail because the rendered Age field remains empty. The repository implementation was not modified by this check.
- `npm test`: **673 passed, 0 failed** (630 clinical/parser/API tests plus 43 mounted-page tests).
- `npm run lint`: **passed**. `npm run build`: **passed**, including TypeScript and all 21 pages. `git diff --check`: **passed**.

### Remaining limits

- jsdom verifies events, state, rendering and the request/API path; it does not replace real-browser/device QA, deployed authentication, deployed DB phrase content or live optional LLM evaluation.
- Reviewed/manual structured values remain protected when replacing pasted text. Start a new case with **Clear case**, or clear/correct conflicting fields explicitly; this pass does not introduce source-history tracking or automatic replacement of reviewed data.
- Dedicated report text replaces the previously retained dedicated report when **Parse into structured fields** is selected. Numeric structured values remain preserved. It is not a longitudinal results history.
- Known AAA has no dedicated extracted feature in the existing feature set. This change adds no new clinical feature or diagnostic architecture; the warning relies on the supported acute findings above. An absent warning must not be treated as exclusion.
- The qualitative and unit-handling limits documented in the preceding safety pass still apply. Qualitative reports do not establish magnitude, acuity or a definitive diagnosis.


Files changed in this focused workflow pass (earlier uncommitted safety work was preserved): `app/page.tsx`, `app/api/analyze-case/route.ts`, `components/CaseForm.tsx`, `components/AnalysisResults.tsx`, `lib/application/analyzeCase.ts`, `lib/types/index.ts`, `lib/domain/labs/qualitativeLabs.ts`, `lib/domain/redFlagRules.ts`, `lib/domain/featureExtractor.ts`, `tests/pasteWorkflow.test.mjs`, `tests/aaaPilotSafety.test.mts`, `scripts/run-tests.mjs`, `package.json`, `package-lock.json`, and this document. jsdom is a development-only dependency for the mounted tests.

## Cholangitis red-flag and qualitative cholestasis hardening — 2026-09-21

### Root causes and fixes

- The cholangitis-specific red-flag gate required only RUQ pain and jaundice. Those two features also satisfied the generic two-trigger threshold, despite the rule rationale requiring fever or rigors. The gate now additionally requires fever, rigors or a clear extracted infection source. Tachycardia and hypotension remain severity findings but cannot supply the infective component.
- The biliary lab-modifier context separately treated tachycardia or hypotension as sufficient infection context. These physiology-only shortcuts were removed, so qualitative or numeric cholestatic results support acute cholangitis only with independent infective evidence.
- Qualitative ALP and GGT were correctly parsed into derived lab features, but the one-reason-per-diagnosis cap added bilirubin first. Later ALP/GGT findings were therefore absent from displayed laboratory evidence. When both ALP and GGT are reported as raised, the modifier now prefers one explicit `qualitative_cholestatic_pattern` reason before considering individual bilirubin, ALP or GGT findings. The score remains capped at +1 and no values are invented.
- Mild qualitative ALT can retain its separate, capped hepatocellular teaching signal, while the combined ALP/GGT pattern is the visible qualitative reason for obstructive jaundice. Numeric results still suppress qualitative evidence for the same analyte, and normal/negated findings remain excluded.

### Regressions

Four mounted page-to-API regressions cover the exact qualitative pattern: non-infective RUQ pain/jaundice with BP 94/60 and HR 112 has no cholangitis red flag or cholangitis modifier; adding rigors preserves both; combined ALP/GGT reaches the obstructive-jaundice modifier and rendered Laboratory evidence; numeric ALP/GGT precedence and negation remain intact.

Validation: `npm test` passes **677 tests** (630 clinical/parser/API tests and 47 mounted workflow tests). Final lint, build and diff checks are recorded in the task handoff.

### Remaining risk

This is a bounded text-rule gate. A separately extracted infection source can satisfy the infective context even when its anatomical relationship to the biliary presentation is uncertain. The output is an educational concern flag, not a diagnostic criterion; conflicting, temporally complex or clinically discordant prose still needs student review.

## AAA and GI-bleed scoring compatibility hardening — 2026-09-21

### Root causes and fixes

- The classic AAA rule combined abdominal pain, hypotension, older age and an additional generic instability context bonus without requiring a compatible AAA syndrome. Unsupported AAA and GI-bleed scores then entered the family-routing seed and shifted a specific RUQ/jaundice presentation into the generic abdominal family. AAA and GI bleed now have final compatibility caps: generic physiology cannot produce a positive score unless the corresponding syndrome has specific evidence. Existing severity points remain available once compatibility is established.
- The acute-abdominal AAA definition separately escalated any abdominal pain plus hypotension. Hypotension now remains a discriminating severity feature, while the large escalation requires collapse, shock or a pulsatile mass; nonspecific pain plus hypotension receives a targeted policy penalty unless an acute specific AAA pain pattern is present.
- The acute-abdominal definition set did not contain the already-live GI-bleed diagnosis. Clear melaena/haematemesis could therefore produce a GI-bleed red flag without entering the ranked differential. A narrowly gated GI-bleed definition now requires explicit bleeding evidence and applies haemodynamic escalation only after that syndrome is established.
- Explicit GI bleeding with collapse previously also satisfied the AAA warning through generic collapse. The AAA warning now requires an independent AAA pain or pulsatile signature when a clear competing GI-bleed syndrome is present.

### Behaviour and regressions

The exact afebrile obstructive-jaundice vignette now ranks `Choledocholithiasis / obstructive jaundice` above both AAA and GI bleed and produces neither emergency-pattern warning. Genuine sudden severe abdominal/back pain with vascular context, collapse and hypotension still ranks AAA first and retains the ruptured-AAA warning. Genuine melaena plus coffee-ground haematemesis, collapse and hypotension now ranks GI bleed first and retains the GI-bleed instability warning.

Four permanent regressions in `tests/aaaPilotSafety.test.mts` cover the exact obstructive-jaundice case, genuine unstable AAA, genuine unstable GI bleed, and preservation of both syndrome-specific must-not-miss warnings. Two older generic-instability trap expectations were corrected so their expected lead no longer contradicts their stated requirement that GI bleed must not be inferred from physiology alone.

Validation: `npm test` passes **681 tests** (634 clinical/parser/API tests and 47 mounted workflow tests). Lint, production build and diff checks are recorded in the task handoff.

### Remaining risk

Low-information collapse with abnormal observations remains diagnostically underdetermined and can produce tied low scores among unrelated emergencies; those results must not be read as diagnostic confidence. Known AAA still has no dedicated extracted feature, so the compatibility gate relies on the supported pain, collapse, shock, pulsatile and vascular-context features. This pass did not change general weights, family architecture or thresholds outside AAA and GI bleed.

## Demographic eligibility and sepsis-context hardening — 2026-09-22

### Root causes and fixes

- Ectopic pregnancy was scored for every acute-abdominal case before demographic plausibility was considered. Generic abdominal pain and hypotension could therefore put it into routing and display for a 72-year-old man. A pre-ranking eligibility gate now excludes ectopic unless there is supported reproductive context: explicit pregnancy evidence, a female childbearing-age feature, or pelvic pain with vaginal bleeding. Explicit pregnancy evidence remains sufficient when sex is unknown and is never inferred. The same eligibility check applies to red-flag promotion and final display.
- The demographic audit kept hard exclusion limited to ectopic pregnancy. Other conditions were not suppressed merely because they are uncommon in a demographic; diagnoses with anatomy-specific extracted findings continue to depend on those defining findings rather than a blanket sex rule.
- The classic Sepsis rule capped physiology-only cases at a positive score, allowing hypotension and tachycardia to enter ranking without infection. Sepsis now caps at zero unless fever, hypothermia, rigors, an extracted infection source, or supported pulmonary/urinary source features are present. Existing physiology points remain unchanged once infection is plausible.
- The acute-abdominal sepsis definition had a separate escalation for abdominal pain plus hypotension, shock or confusion. It now receives the same infection-context cap, preventing that parallel path from restoring physiology-only sepsis.
- The numeric lab modifier considered RUQ pain, jaundice or confusion alone sufficient context for leucocytosis and other results to support Sepsis. Those nonspecific shortcuts were removed. Leucocytosis remains a severity/supporting finding only after independent infection evidence is present. The dedicated cholangitis modifier retains its infective biliary gate.

### Behaviour and regressions

The exact afebrile obstructive-jaundice vignette now ranks `Choledocholithiasis / obstructive jaundice` first, with no Ectopic pregnancy, Sepsis differential, Sepsis lab modifier or sepsis/ectopic warning. Adding fever and rigors preserves Acute cholangitis first, positive Sepsis support, the high-risk sepsis warning and the cholangitis warning.

Four permanent regressions in `tests/aaaPilotSafety.test.mts` cover the exact vignette, genuine cholangitis/sepsis, a reproductive-age female with an unstable confirmed-pregnancy pattern, and unknown sex with versus without explicit reproductive evidence.

Validation: `npm test` passes **685 tests** (638 clinical/parser/API tests and 47 mounted workflow tests). Lint, production build and diff checks are recorded in the task handoff.

### Remaining risk

Eligibility relies on the current structured sex/age fields and extracted reproductive evidence; inconsistent or incorrectly entered demographics can still affect availability. Unknown sex is handled conservatively: explicit pregnancy evidence or a pelvic-pain/vaginal-bleeding context keeps ectopic available, while generic abdominal instability does not. The infection gate remains bounded phrase logic and cannot determine whether every asserted infection source is anatomically related to the presentation.
