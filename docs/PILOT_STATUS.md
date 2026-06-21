# WardBrain Pilot Status

Last updated: 2026-06-21

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
