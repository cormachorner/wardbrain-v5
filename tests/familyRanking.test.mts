import test from "node:test";
import assert from "node:assert/strict";

import { analyzeCase } from "../lib/differentialEngine.js";
import { routePresentationFamilies } from "../lib/presentationFamilies.js";
import { extractFeatures } from "../lib/featureExtractor.js";

test("ACS case routes to chest-pain and prioritizes chest-pain diagnoses", () => {
  const input = {
    age: "63",
    sex: "male",
    presentingComplaint: "Chest pain",
    history: "Central chest pressure radiating to the jaw and left arm with sweating and nausea.",
    pmh: "hypertension",
    meds: "",
    social: "smoker",
    keyPositives: "",
    keyNegatives: "",
    observations: "HR 108",
    leadDiagnosis: "",
    otherDifferentials: "",
    dangerousDiagnoses: "",
  };

  const route = routePresentationFamilies(
    [input.presentingComplaint, input.history, input.pmh, input.social, input.observations].join(
      " ",
    ),
    extractFeatures(input),
  );
  const result = analyzeCase(input);

  assert.equal(route.primaryFamily, "chest-pain");
  assert.equal(result.differentials[0]?.name, "Acute coronary syndrome");
  assert.ok(
    result.differentials.slice(0, 3).every((differential) =>
      [
        "Acute coronary syndrome",
        "Pulmonary embolism",
        "Acute aortic syndrome",
        "Pneumothorax",
        "GORD",
        "Pneumonia",
      ].includes(differential.name),
    ),
  );
});

test("thunderclap headache routes to headache and prioritizes headache diagnoses", () => {
  const input = {
    age: "41",
    sex: "female",
    presentingComplaint: "Headache",
    history: "Worst headache of my life with thunderclap onset and vomiting.",
    pmh: "",
    meds: "",
    social: "",
    keyPositives: "",
    keyNegatives: "",
    observations: "",
    leadDiagnosis: "",
    otherDifferentials: "",
    dangerousDiagnoses: "",
  };

  const route = routePresentationFamilies(
    [input.presentingComplaint, input.history].join(" "),
    extractFeatures(input),
  );
  const result = analyzeCase(input);

  assert.equal(route.primaryFamily, "headache");
  assert.equal(result.differentials[0]?.name, "Subarachnoid haemorrhage");
  assert.ok(
    result.differentials[0]?.reasonsFor.some((reason) =>
      reason.includes("red-flag promotion: Headache urgent evaluation pattern"),
    ),
  );
  assert.ok(
    result.differentials.slice(0, 4).every((differential) =>
      [
        "Subarachnoid haemorrhage",
        "Migraine",
        "Meningitis / encephalitis",
        "Stroke / neurological emergency",
        "Viral illness",
      ].includes(differential.name),
    ),
  );
});

test("pleuritic sob routes to breathlessness family and prioritizes pleuro-respiratory diagnoses", () => {
  const input = {
    age: "55",
    sex: "female",
    presentingComplaint: "Shortness of breath and pleuritic chest pain",
    history: "Sudden pleuritic chest pain with shortness of breath after recent surgery.",
    pmh: "",
    meds: "",
    social: "",
    keyPositives: "",
    keyNegatives: "",
    observations: "RR 30 sats 88% HR 122",
    leadDiagnosis: "",
    otherDifferentials: "",
    dangerousDiagnoses: "",
  };

  const route = routePresentationFamilies(
    [input.presentingComplaint, input.history, input.observations].join(" "),
    extractFeatures(input),
  );
  const result = analyzeCase(input);

  assert.equal(route.primaryFamily, "breathlessness-pleuritic-chest-pain");
  assert.equal(result.differentials[0]?.name, "Pulmonary embolism");
  assert.ok(
    result.differentials[0]?.reasonsFor.some((reason) =>
      reason.includes("red-flag promotion: PE suspicion pattern"),
    ),
  );
  assert.ok(
    result.differentials.slice(0, 3).every((differential) =>
      ["Pulmonary embolism", "Pneumothorax", "Pneumonia", "Sepsis", "Acute coronary syndrome"].includes(
        differential.name,
      ),
    ),
  );
});

test("acute abdominal pain routes to acute-abdominal-pain and can prioritize pancreatitis family diagnoses", () => {
  const input = {
    age: "43",
    sex: "male",
    presentingComplaint: "Epigastric pain",
    history:
      "Severe constant upper abdominal pain radiating to the back with vomiting after binge drinking.",
    pmh: "",
    meds: "",
    social: "",
    keyPositives: "",
    keyNegatives: "",
    observations: "",
    leadDiagnosis: "",
    otherDifferentials: "",
    dangerousDiagnoses: "",
  };

  const route = routePresentationFamilies(
    [input.presentingComplaint, input.history].join(" "),
    extractFeatures(input),
  );
  const result = analyzeCase(input);

  assert.equal(route.primaryFamily, "acute-abdominal-pain");
  assert.equal(result.differentials[0]?.name, "Acute pancreatitis");
  assert.ok(
    result.differentials.slice(0, 4).every((differential) =>
      [
        "Acute pancreatitis",
        "Perforated viscus",
        "Mesenteric ischaemia",
        "Abdominal aortic aneurysm",
        "Bowel obstruction",
        "Peptic ulcer disease / gastritis / dyspepsia",
        "Acute coronary syndrome",
        "Gastroenteritis",
        "Sepsis",
      ].includes(differential.name),
    ),
  );
});

test("clear abdominal presentation suppresses implausible cross-domain legacy leakage", () => {
  const result = analyzeCase({
    age: "72",
    sex: "male",
    presentingComplaint: "Abdominal pain",
    history: "Severe right iliac fossa pain after central migration with focal tenderness and anorexia.",
    pmh: "",
    meds: "",
    social: "",
    keyPositives: "",
    keyNegatives: "no chest pain no headache no breathlessness",
    observations: "",
    leadDiagnosis: "",
    otherDifferentials: "",
    dangerousDiagnoses: "",
  });

  assert.ok(!result.differentials.slice(0, 5).some((d) => d.name === "Temporal arteritis"));
  assert.ok(!result.differentials.slice(0, 5).some((d) => d.name === "Pneumothorax"));
});

test("RUQ pain and jaundice routes to ruq-pain-jaundice and keeps live ranking focused on cholangitis", () => {
  const input = {
    age: "68",
    sex: "female",
    presentingComplaint: "RUQ pain and jaundice",
    history:
      "Right upper quadrant pain with jaundice, rigors, dark urine, pale stools, and known gallstones.",
    pmh: "",
    meds: "",
    social: "",
    keyPositives: "",
    keyNegatives: "",
    observations: "HR 118 BP 96/58",
    leadDiagnosis: "",
    otherDifferentials: "",
    dangerousDiagnoses: "",
  };

  const route = routePresentationFamilies(
    [input.presentingComplaint, input.history, input.observations].join(" "),
    extractFeatures(input),
  );
  const result = analyzeCase(input);

  assert.equal(route.primaryFamily, "ruq-pain-jaundice");
  assert.equal(result.differentials[0]?.name, "Acute cholangitis");
  assert.ok(
    result.differentials.some((differential) =>
      ["Acute cholecystitis", "Choledocholithiasis / obstructive jaundice"].includes(differential.name),
    ),
  );
});

test("classic biliary colic now routes to the RUQ family rather than generic acute abdominal pain", () => {
  const input = {
    age: "41",
    sex: "female",
    presentingComplaint: "Epigastric pain after meals",
    history:
      "Recurrent epigastric and RUQ pain after fatty meals with gallstone history, settling between attacks and well between episodes.",
    pmh: "",
    meds: "",
    social: "",
    keyPositives: "",
    keyNegatives: "no fever no jaundice",
    observations: "",
    leadDiagnosis: "",
    otherDifferentials: "",
    dangerousDiagnoses: "",
  };

  const route = routePresentationFamilies(
    [input.presentingComplaint, input.history, input.keyNegatives].join(" "),
    extractFeatures(input),
  );
  const result = analyzeCase(input);

  assert.equal(route.primaryFamily, "ruq-pain-jaundice");
  assert.equal(result.differentials[0]?.name, "Biliary colic / gallstone disease");
});

test("scaffold-only conditions do not appear as ranked diagnoses", () => {
  const result = analyzeCase({
    age: "47",
    sex: "male",
    presentingComplaint: "Chest pain",
    history: "Sharp chest pain worse on inspiration with normal observations.",
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

  const rankedNames = result.differentials.map((differential) => differential.name);

  assert.ok(!rankedNames.includes("Pericarditis"));
});

test("globally dangerous diagnoses survive family scoping when strongly relevant", () => {
  const result = analyzeCase({
    age: "67",
    sex: "male",
    presentingComplaint: "Chest pain and breathlessness",
    history: "Sudden tearing chest pain radiating to the back with shortness of breath and collapse.",
    pmh: "hypertension",
    meds: "",
    social: "",
    keyPositives: "",
    keyNegatives: "",
    observations: "RR 28 sats 90%",
    leadDiagnosis: "",
    otherDifferentials: "",
    dangerousDiagnoses: "",
  });

  assert.equal(result.differentials[0]?.name, "Acute aortic syndrome");
  assert.ok(
    result.differentials.slice(0, 3).some((differential) => differential.name === "Pulmonary embolism"),
  );
});
