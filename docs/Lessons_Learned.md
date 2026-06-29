# Lessons Learned

## Determinism Makes Clinical Behaviour Reviewable

The most useful safety property has been keeping the core engine deterministic. Failures can be reproduced, tested, and fixed without guessing what a model did internally.

## Extraction Quality Often Matters More Than Scoring

Many apparent ranking failures were actually extraction failures: missing age, missed temporal phrasing, negated symptoms extracted as positive, or overly broad phrase matching. Fixing extraction first usually produced safer behaviour.

## Negation Is a Product Feature, Not a Regex Detail

Clinical text often says what is absent. WardBrain needs robust negation handling for pain, fever, cough, wheeze, chest pain, rigidity, guarding, vaginal bleeding, hypoxia, and other high-impact features.

## Red Flags Need Specificity

Unsafe red flags can be as harmful educationally as missed ones. Examples included PE firing from generic leg swelling, perforation firing from guarding alone, and ACS firing from sweating without a compatible chest/epigastric pattern.

## Hostile Cases Are Worth the Effort

Hostile and messy vignettes exposed real weaknesses that tidy exam-style cases missed. They now form a core part of the development process.

## Canonical Slugs Prevent Drift

Feature labels, database phrases, engine extraction, admin test cases, and evaluation fixtures all need the same canonical slug language. Without that, cases can fail for naming reasons rather than clinical reasons.

## LLMs Need Guardrails Before They Help

LLM feature extraction can recover useful missed features, but it can also over-infer dangerous findings. The clinical sanity filter and verbose evaluation harness are essential before considering broader LLM use.

## Evaluation Metrics Should Reflect Clinical Importance

Plain feature recall treats nausea and hypotension equally. Weighted recall gives a more honest picture of whether the system is recovering safety-critical information.

## Documentation Should Track the Living System

WardBrain has changed quickly. Keeping architecture, decisions, milestones, and roadmap notes close to the repo makes it easier to reason about the next change without reopening old assumptions.

