# Decisions

This document records major product and engineering decisions made during WardBrain development.

## Deterministic Engine Owns Clinical Reasoning

WardBrain uses deterministic extraction, scoring, red-flag rules, and explanation traces as the source of truth. This keeps behaviour testable, debuggable, and suitable for an educational pilot.

## LLMs Are Assistive, Not Authoritative

LLM support was added as optional scaffolding only. The LLM may propose feature slugs or rewrite an already-generated handover, but it must not introduce diagnoses, red flags, or management advice outside WardBrain's structured output.

## Use Canonical Slugs Internally

Feature and diagnosis comparisons use canonical slugs. Hyphenated database content and underscore engine features are normalised so tests, scoring, and UI do not drift.

## Prefer Extraction Fixes Before Scoring Changes

When a case fails, the preferred sequence is:

1. Check feature extraction.
2. Check negation handling.
3. Check diagnosis aliases and vocabulary.
4. Adjust scoring only if the extracted feature set is correct.

## Red Flags Must Be Specific

Red-flag rules are intentionally conservative. For example, PE should not fire from generic breathlessness plus tachycardia alone, and perforation should not fire from focal guarding without stronger peritonitic evidence.

## Clinical Test Cases Are First-Class Content

Clinical test cases are stored in the database, editable in admin, runnable individually or in bulk, and supported by a deterministic test runner. This makes pilot regressions visible without manual UI testing.

## Guideline Support Is Source-Aware

WardBrain links diagnoses and red flags to curated guideline source metadata and short WardBrain-authored summaries. It does not scrape or bulk-copy copyrighted guideline content.

## Evaluation Uses Weighted Feature Recall

Feature recall is weighted so clinically critical findings matter more than low-impact supporting context. This better reflects safety and reasoning quality than simple feature counts.

