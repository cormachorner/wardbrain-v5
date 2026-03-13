import { normaliseDiagnosisName } from "./diagnosisAliases";
import type { NextStepsRule } from "./types";

export const NEXT_STEPS_RULES: NextStepsRule[] = [
  {
    diagnosis: "Pulmonary embolism",
    sourceBody: "NICE",
    sourceId: "NG158",
    sourceCoverage: "full",
    investigations: [
      "Consider a 2-level PE Wells score to structure pre-test probability.",
      "If PE seems likely, think about CTPA as the usual confirmatory test.",
      "If PE seems unlikely, think about D-dimer to help confirm or exclude.",
      "Consider chest X-ray as part of the initial assessment pathway.",
    ],
    immediateNextSteps: [
      "This pattern would usually prompt formal PE assessment rather than casual exclusion.",
      "If diagnostic delay is expected, think about interim therapeutic anticoagulation in line with NICE.",
    ],
    notes: [
      "These are educational prompts to support reasoning, not a prescribing pathway.",
    ],
  },
  {
    diagnosis: "Acute coronary syndrome",
    sourceBody: "NICE",
    sourceId: "CG95",
    sourceCoverage: "full",
    investigations: [
      "Consider a 12-lead ECG early in the assessment.",
      "Consider the local acute chest pain and troponin pathway as appropriate.",
    ],
    immediateNextSteps: [
      "If ACS is suspected, think about urgent hospital assessment or escalation.",
      "Do not use response to GTN to rule ACS in or out.",
    ],
    notes: [
      "The aim here is to keep ACS in a structured rule-out pathway rather than rely on reassurance by symptoms alone.",
    ],
  },
  {
    diagnosis: "GI bleed",
    sourceBody: "NICE",
    sourceId: "CG141",
    sourceCoverage: "partial",
    investigations: [
      "Think about haemodynamic assessment and resuscitation priorities first in a real pathway.",
      "Consider blood count and group and save or crossmatch in a real clinical pathway.",
    ],
    immediateNextSteps: [
      "This pattern would usually prompt urgent senior review.",
      "For suspected upper GI bleeding, think about an urgent endoscopic pathway.",
    ],
    notes: [
      "These prompts are educational and intended to support escalation thinking rather than give treatment instructions.",
    ],
  },
  {
    diagnosis: "Sepsis",
    sourceBody: "NICE",
    sourceId: "NG253",
    sourceCoverage: "partial",
    investigations: [
      "Consider sepsis screening or escalation tools used in the local pathway.",
      "Think about bloods, cultures, lactate, and infection-source assessment.",
    ],
    immediateNextSteps: [
      "This presentation would usually prompt urgent senior review.",
      "Think about Sepsis Six-style early priorities and time-critical escalation in a real clinical pathway if sepsis remains plausible.",
    ],
    notes: [
      "Use these prompts to structure early escalation thinking, not as a substitute for local policy or supervision.",
    ],
  },
  {
    diagnosis: "Subarachnoid haemorrhage",
    sourceBody: "NICE",
    sourceId: "CG150",
    sourceCoverage: "full",
    investigations: [
      "Consider urgent neuroimaging in line with the acute headache pathway.",
      "Think about senior review and the local pathway for sudden severe headache.",
    ],
    immediateNextSteps: [
      "This pattern would usually prompt urgent hospital assessment rather than reassurance as migraine alone.",
      "Think about neurological observation and escalation while confirmatory assessment is underway.",
    ],
    notes: [
      "These prompts are intended to support structured escalation thinking, not to replace supervised clinical decision-making.",
    ],
  },
  {
    diagnosis: "Meningitis / encephalitis",
    sourceBody: "NICE",
    sourceId: "NG143",
    sourceCoverage: "partial",
    investigations: [
      "Consider bloods, cultures, and infection-source assessment in the usual acute pathway.",
      "Think about urgent senior review and local CNS infection investigation pathways.",
    ],
    immediateNextSteps: [
      "This feature cluster would usually prompt urgent escalation rather than simple delirium framing.",
      "Think about time-critical treatment decisions in line with local meningitis or encephalitis pathways.",
    ],
    notes: [
      "Use this as an educational prompt to structure urgent assessment and escalation thinking.",
    ],
  },
  {
    diagnosis: "Pneumothorax",
    sourceBody: "NICE",
    sourceId: "coverage-gap",
    sourceCoverage: "gap",
    investigations: [
      "Consider chest X-ray as part of the usual confirmation pathway.",
      "Think about whether the clinical pattern would usually prompt urgent respiratory or emergency review.",
    ],
    immediateNextSteps: [
      "If the patient is unstable, this pattern would usually prompt immediate senior escalation in a real pathway.",
      "Think about confirming or excluding pneumothorax alongside other dangerous chest diagnoses such as PE.",
    ],
    notes: [
      "This rule is educational and currently uses an internal WardBrain source tag because the project does not yet map this card to a full NICE pathway.",
    ],
  },
  {
    diagnosis: "Acute aortic syndrome",
    sourceBody: "NICE",
    sourceId: "coverage-gap",
    sourceCoverage: "gap",
    investigations: [
      "Consider urgent senior assessment and think about CT aortic imaging in the appropriate acute pathway.",
      "If ruptured AAA is also a concern, think about point-of-care or urgent aortic imaging pathways as appropriate.",
    ],
    immediateNextSteps: [
      "This pattern would usually prompt urgent escalation rather than reassurance as benign chest pain.",
      "Think about early involvement of emergency, medical, or vascular teams in a real pathway.",
    ],
    notes: [
      "This is an internal educational rule because the project does not yet map acute aortic syndrome next steps to a single full NICE pathway.",
    ],
  },
  {
    diagnosis: "Abdominal aortic aneurysm",
    sourceBody: "NICE",
    sourceId: "NG156",
    sourceCoverage: "full",
    investigations: [
      "Consider urgent aortic imaging in line with the suspected AAA pathway.",
      "Think about bedside or emergency imaging pathways that would help confirm or exclude ruptured AAA.",
    ],
    immediateNextSteps: [
      "This pattern would usually prompt urgent senior and vascular escalation.",
      "Think about haemodynamic assessment and transfer priorities in a real clinical pathway.",
    ],
    notes: [
      "These prompts are educational and intended to support escalation thinking rather than act as a treatment protocol.",
    ],
  },
];

export function findNextStepsRule(diagnosis: string): NextStepsRule | undefined {
  const canonicalDiagnosis = normaliseDiagnosisName(diagnosis);

  return NEXT_STEPS_RULES.find(
    (rule) => rule.diagnosis.toLowerCase() === canonicalDiagnosis.toLowerCase(),
  );
}
