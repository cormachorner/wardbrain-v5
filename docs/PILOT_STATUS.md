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
