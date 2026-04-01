import test from "node:test";
import assert from "node:assert/strict";

import { analyzeCase } from "../lib/differentialEngine.js";

test("appendicitis outranks generic abdominal fallbacks when pain migrates to the RIF", () => {
  const result = analyzeCase({
    age: "21",
    sex: "female",
    presentingComplaint: "Abdominal pain",
    history:
      "Started central then moved to the right iliac fossa with fever, nausea, and pain worse on movement.",
    pmh: "",
    meds: "",
    social: "",
    keyPositives: "",
    keyNegatives: "no diarrhoea no vaginal bleeding",
    observations: "",
    leadDiagnosis: "appendicitis",
    otherDifferentials: "",
    dangerousDiagnoses: "",
  });

  assert.equal(result.differentials[0]?.name, "Appendicitis");
});

test("appendicitis stays above gastroenteritis when classic migration-to-RIF features coexist with loose stool noise", () => {
  const result = analyzeCase({
    age: "23",
    sex: "male",
    presentingComplaint: "Abdominal pain",
    history:
      "Started centrally then migrated to the right iliac fossa with focal tenderness, anorexia, and pain worse on movement.",
    pmh: "",
    meds: "",
    social: "",
    keyPositives: "",
    keyNegatives: "one loose stool but no persistent diarrhoea no vomiting",
    observations: "T 37.9",
    leadDiagnosis: "appendicitis",
    otherDifferentials: "",
    dangerousDiagnoses: "",
  });

  assert.equal(result.differentials[0]?.name, "Appendicitis");
  assert.ok(!result.differentials.slice(0, 3).some((d) => d.name === "Gastroenteritis"));
});

test("mesenteric ischaemia pattern triggers escalation and outranks benign abdominal diagnoses", () => {
  const result = analyzeCase({
    age: "78",
    sex: "male",
    presentingComplaint: "Abdominal pain",
    history: "Severe abdominal pain out of proportion with vomiting and atrial fibrillation.",
    pmh: "",
    meds: "",
    social: "",
    keyPositives: "",
    keyNegatives: "",
    observations: "BP 88/54",
    leadDiagnosis: "",
    otherDifferentials: "",
    dangerousDiagnoses: "",
  });

  assert.equal(result.differentials[0]?.name, "Mesenteric ischaemia");
  assert.ok(result.redFlags.some((flag) => flag.name === "Mesenteric ischaemia escalation pattern"));
});

test("peritonitic abdominal pain now outranks pancreatitis when movement-related peritoneal features are present", () => {
  const result = analyzeCase({
    age: "61",
    sex: "female",
    presentingComplaint: "Abdominal pain",
    history:
      "Sudden severe abdominal pain with guarding and rigidity, worse on movement and coughing, and she is lying still in bed.",
    pmh: "peptic ulcer disease",
    meds: "",
    social: "",
    keyPositives: "",
    keyNegatives: "no back radiation no binge drinking",
    observations: "",
    leadDiagnosis: "",
    otherDifferentials: "",
    dangerousDiagnoses: "",
  });

  assert.equal(result.differentials[0]?.name, "Perforated viscus");
  assert.ok(result.redFlags.some((flag) => flag.name === "Perforated viscus / peritonitis pattern"));
});

test("older flank-pain collapse pattern keeps AAA visible and suppresses implausible non-abdominal leakage", () => {
  const result = analyzeCase({
    age: "74",
    sex: "male",
    presentingComplaint: "Flank pain and collapse",
    history: "Sudden severe flank and back pain with collapse.",
    pmh: "hypertension",
    meds: "",
    social: "smoker",
    keyPositives: "",
    keyNegatives: "no pleuritic pain no headache no jaw pain",
    observations: "BP 82/48",
    leadDiagnosis: "",
    otherDifferentials: "",
    dangerousDiagnoses: "",
  });

  assert.ok(result.differentials.slice(0, 3).some((d) => d.name === "Abdominal aortic aneurysm"));
  assert.ok(!result.differentials.slice(0, 3).some((d) => d.name === "Temporal arteritis"));
  assert.ok(!result.differentials.slice(0, 3).some((d) => d.name === "Pneumothorax"));
});

test("transient focal deficit is surfaced as TIA rather than benign aura", () => {
  const result = analyzeCase({
    age: "68",
    sex: "male",
    presentingComplaint: "Transient weakness",
    history: "Sudden right arm weakness and slurred speech that resolved after 15 minutes.",
    pmh: "",
    meds: "",
    social: "",
    keyPositives: "",
    keyNegatives: "no headache no thunderclap",
    observations: "",
    leadDiagnosis: "TIA",
    otherDifferentials: "",
    dangerousDiagnoses: "",
  });

  assert.equal(result.differentials[0]?.name, "TIA");
});

test("cauda equina syndrome is surfaced from retention and saddle symptoms", () => {
  const result = analyzeCase({
    age: "42",
    sex: "male",
    presentingComplaint: "Back pain",
    history: "Severe lower back pain with urinary retention, saddle numbness, and both legs weak.",
    pmh: "",
    meds: "",
    social: "",
    keyPositives: "",
    keyNegatives: "",
    observations: "",
    leadDiagnosis: "",
    otherDifferentials: "",
    dangerousDiagnoses: "",
  });

  assert.equal(result.differentials[0]?.name, "Cauda equina syndrome");
  assert.ok(result.redFlags.some((flag) => flag.name === "Cauda equina pattern"));
});

test("ectopic pregnancy is escalated in bleeding early-pregnancy abdominal pain", () => {
  const result = analyzeCase({
    age: "29",
    sex: "female",
    presentingComplaint: "Abdominal pain",
    history: "Pelvic pain with vaginal bleeding and a missed period. Could be pregnant.",
    pmh: "",
    meds: "",
    social: "",
    keyPositives: "",
    keyNegatives: "",
    observations: "",
    leadDiagnosis: "ectopic pregnancy",
    otherDifferentials: "",
    dangerousDiagnoses: "",
  });

  assert.equal(result.differentials[0]?.name, "Ectopic pregnancy");
  assert.ok(result.redFlags.some((flag) => flag.name === "Ectopic pregnancy pattern"));
});

test("testicular torsion is not absorbed into generic abdominal pain", () => {
  const result = analyzeCase({
    age: "16",
    sex: "male",
    presentingComplaint: "Testicular pain",
    history: "Sudden left testicular pain with vomiting.",
    pmh: "",
    meds: "",
    social: "",
    keyPositives: "",
    keyNegatives: "",
    observations: "",
    leadDiagnosis: "",
    otherDifferentials: "",
    dangerousDiagnoses: "",
  });

  assert.equal(result.differentials[0]?.name, "Testicular torsion");
});

test("hypoglycaemia is surfaced as an urgent reversible cause", () => {
  const result = analyzeCase({
    age: "58",
    sex: "male",
    presentingComplaint: "Confusion",
    history: "Diabetic, sweaty and shaky with confusion.",
    pmh: "type 1 diabetes",
    meds: "insulin",
    social: "",
    keyPositives: "",
    keyNegatives: "no fever no headache",
    observations: "",
    leadDiagnosis: "",
    otherDifferentials: "",
    dangerousDiagnoses: "",
  });

  assert.equal(result.differentials[0]?.name, "Hypoglycaemia");
});

test("heart failure is recognized from orthopnoea and oedema pattern", () => {
  const result = analyzeCase({
    age: "74",
    sex: "male",
    presentingComplaint: "Shortness of breath",
    history: "Progressive breathlessness with orthopnoea, needs extra pillows, and ankle swelling.",
    pmh: "",
    meds: "",
    social: "",
    keyPositives: "",
    keyNegatives: "no pleuritic pain no fever",
    observations: "sats 89%",
    leadDiagnosis: "",
    otherDifferentials: "",
    dangerousDiagnoses: "",
  });

  assert.equal(result.differentials[0]?.name, "Heart failure");
});

test("urinary sepsis source is recognized over generic viral framing", () => {
  const result = analyzeCase({
    age: "83",
    sex: "female",
    presentingComplaint: "Confusion",
    history: "Confused with dysuria, fever, rigors, and flank pain.",
    pmh: "",
    meds: "",
    social: "",
    keyPositives: "",
    keyNegatives: "",
    observations: "BP 86/52",
    leadDiagnosis: "",
    otherDifferentials: "",
    dangerousDiagnoses: "",
  });

  assert.equal(result.differentials[0]?.name, "UTI / urosepsis");
  assert.ok(result.differentials.some((d) => d.name === "Sepsis"));
});

test("panic / anxiety does not need to compete with pleural or septic patterns when panic features dominate", () => {
  const result = analyzeCase({
    age: "24",
    sex: "female",
    presentingComplaint: "Chest tightness",
    history: "Panic attack with chest tightness, shortness of breath, hyperventilating, and tingling around the mouth.",
    pmh: "",
    meds: "",
    social: "",
    keyPositives: "",
    keyNegatives: "no fever no pleuritic pain",
    observations: "sats 99%",
    leadDiagnosis: "",
    otherDifferentials: "",
    dangerousDiagnoses: "",
  });

  assert.equal(result.differentials[0]?.name, "Panic / anxiety");
});

test("ovarian acute pelvic pathology is surfaced in sudden pelvic pain", () => {
  const result = analyzeCase({
    age: "31",
    sex: "female",
    presentingComplaint: "Pelvic pain",
    history: "Sudden pelvic pain with vomiting and vaginal spotting.",
    pmh: "",
    meds: "",
    social: "",
    keyPositives: "",
    keyNegatives: "no diarrhoea",
    observations: "",
    leadDiagnosis: "",
    otherDifferentials: "",
    dangerousDiagnoses: "",
  });

  assert.equal(result.differentials[0]?.name, "Ovarian / acute pelvic pathology");
});
