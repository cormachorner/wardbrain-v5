import test from "node:test";
import assert from "node:assert/strict";

import { analyzeCase } from "../lib/differentialEngine.js";

test("epigastric ACS-style case fires ACS red flag without abdominal scaffold logic leaking into ranking", () => {
  const result = analyzeCase({
    age: "64",
    sex: "male",
    presentingComplaint: "Epigastric pain",
    history: "Epigastric pressure radiating to the jaw with sweating and nausea, thought it was indigestion.",
    pmh: "known hypertension",
    meds: "",
    social: "smoker",
    keyPositives: "",
    keyNegatives: "",
    observations: "",
    suspectedDiagnosis: "ACS",
  });

  assert.equal(result.differentials[0]?.name, "Acute coronary syndrome");
  assert.ok(result.redFlags.some((flag) => flag.name === "ACS suspicion pattern"));
});

test("classic pancreatitis case now surfaces acute pancreatitis as the leading abdominal diagnosis", () => {
  const result = analyzeCase({
    age: "43",
    sex: "male",
    presentingComplaint: "Epigastric pain",
    history:
      "Severe constant upper abdominal pain radiating to the back with vomiting after binge drinking.",
    pmh: "",
    meds: "",
    social: "",
    keyPositives: "",
    keyNegatives: "no diarrhoea no bleeding",
    observations: "",
    suspectedDiagnosis: "pancreatitis",
  });

  assert.equal(result.differentials[0]?.name, "Acute pancreatitis");
  const cholecystitisIndex = result.differentials.findIndex((d) => d.name === "Acute cholecystitis");
  if (cholecystitisIndex !== -1) {
    assert.ok(cholecystitisIndex > 0);
  }
});

test("perforated viscus case now surfaces perforated viscus with peritonitic features", () => {
  const result = analyzeCase({
    age: "58",
    sex: "female",
    presentingComplaint: "Abdominal pain",
    history:
      "Sudden severe generalized abdominal pain with guarding and rigidity, worse on movement and coughing, with a history of peptic ulcer disease.",
    pmh: "",
    meds: "",
    social: "",
    keyPositives: "",
    keyNegatives: "no diarrhoea",
    observations: "",
    suspectedDiagnosis: "perforated ulcer",
  });

  assert.equal(result.differentials[0]?.name, "Perforated viscus");
});

test("mesenteric ischaemia control case still outranks pancreatitis and perforation when vascular features dominate", () => {
  const result = analyzeCase({
    age: "79",
    sex: "male",
    presentingComplaint: "Abdominal pain",
    history: "Sudden severe abdominal pain out of proportion with vomiting and atrial fibrillation.",
    pmh: "",
    meds: "",
    social: "",
    keyPositives: "",
    keyNegatives: "no guarding no diarrhoea",
    observations: "",
    suspectedDiagnosis: "Mesenteric ischaemia",
  });

  assert.equal(result.differentials[0]?.name, "Mesenteric ischaemia");
});

test("gastroenteritis control case does not get overcalled as pancreatitis or perforated viscus", () => {
  const result = analyzeCase({
    age: "24",
    sex: "female",
    presentingComplaint: "Abdominal pain",
    history: "Crampy abdominal pain with vomiting and watery diarrhoea after sick contacts.",
    pmh: "",
    meds: "",
    social: "",
    keyPositives: "",
    keyNegatives: "no guarding no back radiation",
    observations: "",
    suspectedDiagnosis: "Gastroenteritis",
  });

  assert.equal(result.differentials[0]?.name, "Gastroenteritis");
});

test("GI bleed control case does not get displaced by pancreatitis or perforated viscus", () => {
  const result = analyzeCase({
    age: "67",
    sex: "male",
    presentingComplaint: "Collapse",
    history: "Vomited blood with melaena and epigastric discomfort.",
    pmh: "peptic ulcer disease",
    meds: "",
    social: "",
    keyPositives: "",
    keyNegatives: "",
    observations: "HR 128 BP 85/50",
    suspectedDiagnosis: "GI bleed",
  });

  assert.equal(result.differentials[0]?.name, "GI bleed");
  assert.ok(!result.differentials.slice(0, 2).some((d) => d.name === "Acute pancreatitis"));
});

test("classic acute cholangitis case now surfaces acute cholangitis with a source-tagged red flag", () => {
  const result = analyzeCase({
    age: "69",
    sex: "female",
    presentingComplaint: "RUQ pain and jaundice",
    history:
      "Right upper quadrant pain with jaundice, fever, rigors, dark urine, pale stools, and known gallstones.",
    pmh: "",
    meds: "",
    social: "",
    keyPositives: "",
    keyNegatives: "no diarrhoea",
    observations: "HR 122 BP 92/58",
    suspectedDiagnosis: "ascending cholangitis",
  });

  assert.equal(result.differentials[0]?.name, "Acute cholangitis");
  assert.ok(result.redFlags.some((flag) => flag.name === "Acute cholangitis pattern"));
});

test("acute cholecystitis case now ranks acute cholecystitis above pancreatitis and cholangitis when jaundice is absent", () => {
  const result = analyzeCase({
    age: "45",
    sex: "female",
    presentingComplaint: "RUQ pain",
    history:
      "Constant right upper quadrant pain for 18 hours with fever, nausea and vomiting. The pain started after a heavy meal and has not settled. It is worse on movement and she feels tender under the right costal margin when examined.",
    pmh: "known gallstones",
    meds: "",
    social: "",
    keyPositives: "",
    keyNegatives: "no jaundice no dark urine no pale stools",
    observations: "",
    suspectedDiagnosis: "cholecystitis",
  });

  assert.equal(result.differentials[0]?.name, "Acute cholecystitis");
  const pancreatitisIndex = result.differentials.findIndex((d) => d.name === "Acute pancreatitis");
  const cholangitisIndex = result.differentials.findIndex((d) => d.name === "Acute cholangitis");
  if (pancreatitisIndex !== -1) {
    assert.ok(pancreatitisIndex > 0);
  }
  if (cholangitisIndex !== -1) {
    assert.ok(cholangitisIndex > 0);
  }
});

test("classic acute cholecystitis no longer leaks chest-wall pain or meningitis into a localized RUQ inflammatory case", () => {
  const result = analyzeCase({
    age: "47",
    sex: "female",
    presentingComplaint: "Right upper quadrant pain",
    history:
      "Persistent right upper quadrant pain with fever, nausea, vomiting, and localized tenderness after a meal.",
    pmh: "known gallstones",
    meds: "",
    social: "",
    keyPositives: "",
    keyNegatives: "no jaundice no dark urine no pale stools no headache no confusion",
    observations: "",
    suspectedDiagnosis: "cholecystitis",
  });

  assert.equal(result.differentials[0]?.name, "Acute cholecystitis");
  assert.ok(!result.detectedFeatures?.includes("movement-related chest pain"));
  assert.ok(!result.differentials.slice(0, 3).some((d) => d.name === "Meningitis / encephalitis"));
});

test("classic biliary colic case now ranks biliary colic above cholangitis", () => {
  const result = analyzeCase({
    age: "41",
    sex: "female",
    presentingComplaint: "RUQ pain",
    history:
      "Recurrent episodic RUQ pain after fatty meals that settles between attacks with no fever or jaundice.",
    pmh: "known gallstones",
    meds: "",
    social: "",
    keyPositives: "",
    keyNegatives: "",
    observations: "",
    suspectedDiagnosis: "biliary colic",
  });

  assert.equal(result.differentials[0]?.name, "Biliary colic / gallstone disease");
});

test("obstructive jaundice case now ranks choledocholithiasis above cholangitis without infective features", () => {
  const result = analyzeCase({
    age: "63",
    sex: "male",
    presentingComplaint: "Jaundice",
    history:
      "Jaundice with dark urine, pale stools, itching, and a cholestatic picture after previous gallstone attacks.",
    pmh: "",
    meds: "",
    social: "",
    keyPositives: "",
    keyNegatives: "no fever no rigors",
    observations: "",
    suspectedDiagnosis: "obstructive jaundice",
  });

  assert.equal(result.differentials[0]?.name, "Choledocholithiasis / obstructive jaundice");
  assert.ok(result.differentials.some((d) => d.name === "Acute cholangitis"));
});

test("PSC-style chronic cholestatic case keeps PSC scaffold-only and avoids acute biliary promotion", () => {
  const pscResult = analyzeCase({
    age: "48",
    sex: "male",
    presentingComplaint: "Jaundice and itch",
    history:
      "Months of itching, fatigue, dark urine, pale stools, and intermittent jaundice with ulcerative colitis.",
    pmh: "",
    meds: "",
    social: "",
    keyPositives: "",
    keyNegatives: "no fever no rigors",
    observations: "",
    suspectedDiagnosis: "PSC",
  });

  assert.ok(!pscResult.differentials.some((d) => d.name === "Primary sclerosing cholangitis"));
  assert.ok(pscResult.differentials[0]?.name !== "Acute cholangitis");
});

test("PBC-style chronic cholestatic case keeps PBC scaffold-only and avoids acute biliary promotion", () => {
  const pbcResult = analyzeCase({
    age: "58",
    sex: "female",
    presentingComplaint: "Itch and jaundice",
    history:
      "Gradual jaundice over months with itching, fatigue, and dry eyes and mouth, but no fevers or rigors.",
    pmh: "",
    meds: "",
    social: "",
    keyPositives: "",
    keyNegatives: "",
    observations: "",
    suspectedDiagnosis: "PBC",
  });

  assert.ok(!pbcResult.differentials.some((d) => d.name === "Primary biliary cholangitis"));
  assert.ok(pbcResult.differentials[0]?.name !== "Acute cholangitis");
});

test("pancreatitis control case is not pulled into cholangitis by gallstone context alone", () => {
  const result = analyzeCase({
    age: "44",
    sex: "female",
    presentingComplaint: "Epigastric pain",
    history:
      "Severe constant upper abdominal pain radiating to the back with vomiting and known gallstones.",
    pmh: "",
    meds: "",
    social: "",
    keyPositives: "",
    keyNegatives: "no jaundice no fever no rigors",
    observations: "",
    suspectedDiagnosis: "pancreatitis",
  });

  assert.equal(result.differentials[0]?.name, "Acute pancreatitis");
  assert.ok(!result.redFlags.some((flag) => flag.name === "Acute cholangitis pattern"));
});

test("spontaneous pneumothorax signature now outranks PE when VTE context is absent", () => {
  const result = analyzeCase({
    age: "21",
    sex: "male",
    presentingComplaint: "Chest pain and shortness of breath",
    history:
      "Tall slim male with sudden unilateral pleuritic chest pain and shortness of breath at rest.",
    pmh: "",
    meds: "",
    social: "smoker",
    keyPositives: "unilateral reduced air entry",
    keyNegatives: "no fever no productive cough",
    observations: "",
    suspectedDiagnosis: "PE",
  });

  assert.equal(result.differentials[0]?.name, "Pneumothorax");
  assert.ok(result.differentials.some((differential) => differential.name === "Pulmonary embolism"));
});

test("PE control case still outranks pneumothorax when VTE context and physiological support are present", () => {
  const result = analyzeCase({
    age: "46",
    sex: "female",
    presentingComplaint: "Chest pain and shortness of breath",
    history:
      "Sudden pleuritic chest pain and shortness of breath after a long haul flight with reduced mobility.",
    pmh: "",
    meds: "",
    social: "",
    keyPositives: "",
    keyNegatives: "no unilateral reduced air entry no wheeze",
    observations: "HR 126 RR 30 sats 89%",
    suspectedDiagnosis: "PE",
  });

  assert.equal(result.differentials[0]?.name, "Pulmonary embolism");
  assert.ok(result.differentials.some((differential) => differential.name === "Pneumothorax"));
});

test("musculoskeletal chest wall pattern is educationally favored over PE and ACS when danger features are absent", () => {
  const result = analyzeCase({
    age: "34",
    sex: "female",
    presentingComplaint: "Chest pain",
    history:
      "Localized chest pain after heavy lifting, reproducible on palpation and worse on movement.",
    pmh: "",
    meds: "",
    social: "",
    keyPositives: "",
    keyNegatives: "no shortness of breath no fever",
    observations: "",
    suspectedDiagnosis: "PE",
  });

  assert.equal(result.differentials[0]?.name, "Musculoskeletal chest pain");
});

test("classic benign migraine aura pattern no longer gets catastrophe-dominant ranking", () => {
  const result = analyzeCase({
    age: "29",
    sex: "female",
    presentingComplaint: "Headache",
    history:
      "Recurrent unilateral throbbing headaches with flashing lights beforehand, photophobia, nausea, and well intervals between episodes.",
    pmh: "",
    meds: "",
    social: "",
    keyPositives: "",
    keyNegatives: "no focal neurology no fever",
    observations: "",
    suspectedDiagnosis: "Migraine",
  });

  assert.equal(result.differentials[0]?.name, "Migraine");
  assert.ok(!result.redFlags.some((flag) => flag.name === "Headache urgent evaluation pattern"));
});

test("tension headache pattern is recognized without SAH dominance", () => {
  const result = analyzeCase({
    age: "33",
    sex: "male",
    presentingComplaint: "Headache",
    history: "Gradual bilateral band-like headache after stress and poor sleep.",
    pmh: "",
    meds: "",
    social: "",
    keyPositives: "",
    keyNegatives: "no focal deficit no vomiting",
    observations: "",
    suspectedDiagnosis: "Tension headache",
  });

  assert.equal(result.differentials[0]?.name, "Tension headache");
});

test("temporal arteritis is now surfaced in a compatible older-adult headache pattern", () => {
  const result = analyzeCase({
    age: "76",
    sex: "female",
    presentingComplaint: "Headache",
    history:
      "New temporal headache with scalp tenderness, jaw pain when chewing, blurred vision, and aching shoulders.",
    pmh: "",
    meds: "",
    social: "",
    keyPositives: "",
    keyNegatives: "",
    observations: "",
    suspectedDiagnosis: "Temporal arteritis",
  });

  assert.equal(result.differentials[0]?.name, "Temporal arteritis");
});

test("infectious progressive pleuritic case favors pneumonia and avoids ACS red flag overfiring", () => {
  const result = analyzeCase({
    age: "58",
    sex: "female",
    presentingComplaint: "Breathlessness and chest pain",
    history:
      "Progressively worsening shortness of breath over several days with pleuritic chest pain, productive cough, green sputum, fever, and rigors.",
    pmh: "",
    meds: "",
    social: "",
    keyPositives: "",
    keyNegatives: "",
    observations: "",
    suspectedDiagnosis: "Pneumonia",
  });

  assert.equal(result.differentials[0]?.name, "Pneumonia");
  assert.ok(!result.redFlags.some((flag) => flag.name === "ACS suspicion pattern"));
});

test("asthma and COPD exacerbation can now surface as live breathlessness diagnoses", () => {
  const asthmaResult = analyzeCase({
    age: "25",
    sex: "female",
    presentingComplaint: "Shortness of breath",
    history:
      "Known asthma with wheeze, chest tightness after a recent viral cold, increased inhaler use, and too breathless to speak full sentences.",
    pmh: "",
    meds: "",
    social: "",
    keyPositives: "",
    keyNegatives: "no pleuritic chest pain no fever",
    observations: "RR 28 sats 91%",
    suspectedDiagnosis: "Asthma exacerbation",
  });

  const copdResult = analyzeCase({
    age: "71",
    sex: "male",
    presentingComplaint: "Shortness of breath",
    history:
      "Known COPD with worsening baseline breathlessness over days, increased sputum volume, and yellow sputum.",
    pmh: "",
    meds: "",
    social: "",
    keyPositives: "",
    keyNegatives: "",
    observations: "RR 26 sats 90%",
    suspectedDiagnosis: "COPD exacerbation",
  });

  assert.equal(asthmaResult.differentials[0]?.name, "Asthma exacerbation");
  assert.equal(copdResult.differentials[0]?.name, "COPD exacerbation");
  assert.ok(!asthmaResult.differentials.slice(0, 2).some((d) => d.name === "Pulmonary embolism"));
});

test("pneumonia control case does not get pulled toward asthma when infectious consolidation pattern is clear", () => {
  const result = analyzeCase({
    age: "54",
    sex: "male",
    presentingComplaint: "Shortness of breath",
    history:
      "Progressively worsening breathlessness over several days with productive cough, green sputum, pleuritic chest pain, fever, and rigors.",
    pmh: "history of asthma",
    meds: "",
    social: "",
    keyPositives: "",
    keyNegatives: "no increased inhaler use",
    observations: "RR 28 sats 90%",
    suspectedDiagnosis: "Pneumonia",
  });

  assert.equal(result.differentials[0]?.name, "Pneumonia");
});

test("true abdominal pain control case keeps abdominal framing rather than chest pain red-flag behavior", () => {
  const result = analyzeCase({
    age: "42",
    sex: "female",
    presentingComplaint: "Abdominal pain",
    history: "Central abdominal pain with diarrhoea and vomiting after sick contacts.",
    pmh: "",
    meds: "",
    social: "",
    keyPositives: "",
    keyNegatives: "no jaw pain no sweating no chest pain",
    observations: "",
    suspectedDiagnosis: "Gastroenteritis",
  });

  assert.equal(result.differentials[0]?.name, "Gastroenteritis");
  assert.ok(!result.redFlags.some((flag) => flag.name === "ACS suspicion pattern"));
});

test("older confused infection case surfaces delirium secondary to infection as an educational lead", () => {
  const result = analyzeCase({
    age: "84",
    sex: "male",
    presentingComplaint: "Confusion",
    history: "Acute fluctuating confusion with fever and productive cough after a recent infection.",
    pmh: "",
    meds: "",
    social: "",
    keyPositives: "",
    keyNegatives: "",
    observations: "",
    suspectedDiagnosis: "Sepsis",
  });

  assert.equal(result.differentials[0]?.name, "Delirium secondary to infection");
  assert.ok(result.differentials.some((differential) => differential.name === "Sepsis"));
});

test("meningitis encephalitis red flag is now honestly labeled as a coverage gap", () => {
  const result = analyzeCase({
    age: "22",
    sex: "female",
    presentingComplaint: "Headache",
    history: "Headache with fever, stiff neck, photophobia, and drowsiness.",
    pmh: "",
    meds: "",
    social: "",
    keyPositives: "",
    keyNegatives: "",
    observations: "",
    suspectedDiagnosis: "Meningitis",
  });

  const meningitisFlag = result.redFlags.find(
    (flag) => flag.name === "Meningitis / encephalitis suspicion pattern",
  );

  assert.ok(meningitisFlag);
  assert.equal(meningitisFlag?.sourceId, "coverage-gap");
  assert.equal(meningitisFlag?.sourceCoverage, "gap");
});
