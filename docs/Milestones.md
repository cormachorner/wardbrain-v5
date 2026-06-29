# Milestones

## 1. Concept and Prototype

- Established WardBrain as a medical-student educational reasoning coach.
- Built the initial case-entry and analysis workflow.
- Created the first deterministic diagnosis and red-flag logic.

## 2. App Foundation

- Adopted Next.js, React, and TypeScript.
- Added API-based analysis.
- Added authentication with NextAuth.
- Added Prisma-backed persistence and admin roles.
- Prepared GitHub and Vercel deployment workflow.

## 3. Acute Abdomen v1

- Built the first mature presentation block.
- Added hostile acute-abdominal test cases.
- Added admin test-runner support.
- Improved extraction for obstruction, ectopic pregnancy, pyelonephritis, AAA, mesenteric ischaemia, perforation, and DKA mimics.

## 4. Chest Pain v1

- Added ACS, PE, pneumothorax, aortic syndrome, pneumonia, pericarditis, GORD, musculoskeletal pain, and panic/anxiety patterns.
- Added hostile chest-pain cases.
- Tightened ACS, PE, GORD, musculoskeletal, and aortic red-flag specificity.

## 5. Breathlessness v1

- Added breathlessness and pleuritic chest-pain reasoning.
- Covered PE, pneumonia, asthma, COPD, heart failure, pneumothorax, ACS equivalents, panic, anaemia, and DKA.
- Improved vitals extraction and respiratory negation.

## 6. Pilot Hardening

- Added supported-presentation guardrails.
- Added uncertainty and missing-information output.
- Added explanation traces for red flags and top diagnoses.
- Simplified UI hierarchy and added guideline support.

## 7. LLM Scaffolding

- Added optional LLM feature extraction.
- Added clinical sanity filtering before merge.
- Added offline and live evaluation harnesses.
- Added optional LLM "Present to the reg" rewriting with validation and fallback.

## 8. Evaluation System

- Added bulk case evaluation.
- Added JSON and CSV reports.
- Added weighted feature recall.
- Added live debugging modes for LLM harm analysis.

## 9. Headache v1

- Current work adds a deterministic headache block.
- Includes migraine, tension headache, cluster headache, SAH, meningitis/encephalitis, GCA, raised ICP/mass, CVST, and neurological emergency coverage.
- Adds fixtures, tests, guideline mappings, and bulk evaluation integration.

