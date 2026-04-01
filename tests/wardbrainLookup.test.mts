import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { corePilotBlocks } from "../content/wardbrain_core_pilot_app_ready.js";
import {
  getAllSearchTerms,
  getPresentationBlockById,
  matchPresentationBlock,
  matchPresentationBlockForCase,
} from "../lib/wardbrainLookup.js";
import { routePresentationFamilies } from "../lib/presentationFamilies.js";
import { normalizeText } from "../lib/normalizeInput.js";
import { extractFeatures } from "../lib/featureExtractor.js";

test("normalizes text consistently for block matching", () => {
  assert.equal(normalizeText(" Red painful eye!! "), "red painful eye");
  assert.equal(normalizeText("Confusion / delirium"), "confusion delirium");
});

test("looks up a block by exact id", () => {
  const block = getPresentationBlockById("confusion-delirium", corePilotBlocks);

  assert.ok(block);
  assert.equal(block.presentation, "Confusion / delirium");
});

test("matches by presentation wording", () => {
  const block = matchPresentationBlock("red painful eye", corePilotBlocks);

  assert.ok(block);
  assert.equal(block.id, "red-painful-eye");
});

test("matches by trigger search terms", () => {
  const block = matchPresentationBlock("posterior circulation stroke", corePilotBlocks);

  assert.ok(block);
  assert.equal(block.id, "vertigo-dizziness");
});

test("surfaces all search terms for a block", () => {
  const block = getPresentationBlockById("epistaxis", corePilotBlocks);

  assert.ok(block);
  const terms = getAllSearchTerms(block);

  assert.ok(terms.includes("Epistaxis"));
  assert.ok(terms.includes("Anterior epistaxis"));
});

test("typed TS content and JSON content stay aligned", () => {
  const rawJson = JSON.parse(
    readFileSync("content/wardbrain_core_pilot_app_ready.json", "utf8"),
  ) as typeof corePilotBlocks;

  assert.equal(rawJson.length, corePilotBlocks.length);
  assert.deepEqual(Object.keys(rawJson[0]).sort(), Object.keys(corePilotBlocks[0]).sort());
});

test("acs chest pain routes to chest-pain family", () => {
  const input = {
    age: "61",
    sex: "male",
    presentingComplaint: "Chest pain",
    history: "Central chest pain radiating to the jaw and left arm with sweating and nausea.",
    pmh: "known hypertension",
    meds: "",
    social: "current smoker",
    keyPositives: "",
    keyNegatives: "",
    observations: "",
    leadDiagnosis: "ACS",
    otherDifferentials: "",
    dangerousDiagnoses: "",
  };
  const route = routePresentationFamilies(
    [input.presentingComplaint, input.history, input.pmh, input.social].join(" "),
    extractFeatures(input),
    ["Acute coronary syndrome", "Acute aortic syndrome"],
  );

  assert.equal(route.primaryFamily, "chest-pain");
});

test("thunderclap headache routes to headache family", () => {
  const input = {
    age: "42",
    sex: "female",
    presentingComplaint: "Headache",
    history: "Worst headache of my life, maximal at onset, with vomiting.",
    pmh: "",
    meds: "",
    social: "",
    keyPositives: "",
    keyNegatives: "",
    observations: "",
    leadDiagnosis: "SAH",
    otherDifferentials: "",
    dangerousDiagnoses: "",
  };
  const route = routePresentationFamilies(
    [input.presentingComplaint, input.history].join(" "),
    extractFeatures(input),
    ["Subarachnoid haemorrhage"],
  );

  assert.equal(route.primaryFamily, "headache");
});

test("pleuritic sob routes to breathlessness pleuritic chest pain family", () => {
  const input = {
    age: "56",
    sex: "female",
    presentingComplaint: "Chest pain and breathlessness",
    history: "Sudden pleuritic chest pain with shortness of breath",
    pmh: "",
    meds: "",
    social: "",
    keyPositives: "",
    keyNegatives: "",
    observations: "Sats 88",
    leadDiagnosis: "PE",
    otherDifferentials: "",
    dangerousDiagnoses: "",
  };
  const route = routePresentationFamilies(
    [input.presentingComplaint, input.history, input.observations].join(" "),
    extractFeatures(input),
    ["Pulmonary embolism", "Pneumothorax"],
  );

  assert.equal(route.primaryFamily, "breathlessness-pleuritic-chest-pain");
});

test("abdominal pain still routes to acute abdominal pain family", () => {
  const input = {
    age: "74",
    sex: "male",
    presentingComplaint: "Abdominal pain",
    history: "Sudden severe abdominal pain out of proportion to exam with vomiting and collapse",
    pmh: "atrial fibrillation",
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
    [input.presentingComplaint, input.history, input.pmh].join(" "),
    extractFeatures(input),
    ["Mesenteric ischaemia"],
  );

  assert.equal(route.primaryFamily, "acute-abdominal-pain");
});

test("confusion infection routes to confusion delirium family", () => {
  const input = {
    age: "81",
    sex: "male",
    presentingComplaint: "Confusion",
    history: "New confusion with fever and productive cough",
    pmh: "",
    meds: "",
    social: "",
    keyPositives: "",
    keyNegatives: "",
    observations: "",
    leadDiagnosis: "Sepsis",
    otherDifferentials: "",
    dangerousDiagnoses: "",
  };
  const route = routePresentationFamilies(
    [input.presentingComplaint, input.history].join(" "),
    extractFeatures(input),
    ["Sepsis", "Delirium secondary to infection"],
  );

  assert.equal(route.primaryFamily, "confusion-delirium");
});

test("mesenteric ischaemia style abdominal pain gets vascular abdominal emphasis", () => {
  const match = matchPresentationBlockForCase(
    {
      age: "74",
      sex: "male",
      presentingComplaint: "Abdominal pain",
      history: "Sudden severe abdominal pain out of proportion to exam with vomiting and collapse",
      pmh: "atrial fibrillation",
      meds: "",
      social: "",
      keyPositives: "",
      keyNegatives: "",
      observations: "",
      leadDiagnosis: "",
      otherDifferentials: "",
      dangerousDiagnoses: "",
    },
    corePilotBlocks,
    ["Mesenteric ischaemia", "Abdominal aortic aneurysm"],
  );

  assert.ok(match);
  assert.equal(match.block.id, "acute-abdominal-pain");
  assert.equal(match.emphasis?.id, "vascular-abdominal-emergency");
  assert.ok(match.emphasis?.highlightedDifferentials.includes("Mesenteric ischaemia"));
});

test("pancreatitis style abdominal pain keeps pancreatitis perforation emphasis", () => {
  const match = matchPresentationBlockForCase(
    {
      age: "45",
      sex: "male",
      presentingComplaint: "Severe abdominal pain",
      history: "Severe epigastric pain with vomiting after binge drinking",
      pmh: "",
      meds: "",
      social: "heavy alcohol intake",
      keyPositives: "",
      keyNegatives: "",
      observations: "",
      leadDiagnosis: "",
      otherDifferentials: "",
      dangerousDiagnoses: "",
    },
    corePilotBlocks,
    ["Acute pancreatitis"],
  );

  assert.ok(match);
  assert.equal(match.block.id, "acute-abdominal-pain");
  assert.equal(match.emphasis?.id, "pancreatitis-perforation");
  assert.ok(match.emphasis?.highlightedDifferentials.includes("Acute pancreatitis"));
});

test("chest pain scaffold no longer falls back to abdominal family when a proper family exists", () => {
  const match = matchPresentationBlockForCase(
    {
      age: "61",
      sex: "male",
      presentingComplaint: "Chest pain",
      history: "Central chest pain radiating to the jaw and left arm with sweating and nausea.",
      pmh: "known hypertension",
      meds: "",
      social: "current smoker",
      keyPositives: "",
      keyNegatives: "",
      observations: "",
      leadDiagnosis: "ACS",
      otherDifferentials: "",
      dangerousDiagnoses: "",
    },
    corePilotBlocks,
    ["Acute coronary syndrome", "Acute aortic syndrome"],
  );

  assert.ok(match);
  assert.equal(match.block.id, "chest-pain");
});

test("epigastric ACS-style case prefers chest pain scaffold over abdominal scaffold", () => {
  const match = matchPresentationBlockForCase(
    {
      age: "64",
      sex: "male",
      presentingComplaint: "Epigastric pain",
      history:
        "Epigastric discomfort and upper abdominal heaviness radiating to the jaw with sweating and nausea, thought it was indigestion.",
      pmh: "hypertension",
      meds: "",
      social: "smoker",
      keyPositives: "",
      keyNegatives: "",
      observations: "",
      leadDiagnosis: "ACS",
      otherDifferentials: "",
      dangerousDiagnoses: "",
    },
    corePilotBlocks,
    ["Acute coronary syndrome", "Acute aortic syndrome"],
  );

  assert.ok(match);
  assert.equal(match.block.id, "chest-pain");
});

test("true abdominal pain control case still matches acute abdominal pain scaffold", () => {
  const match = matchPresentationBlockForCase(
    {
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
      leadDiagnosis: "Gastroenteritis",
      otherDifferentials: "",
      dangerousDiagnoses: "",
    },
    corePilotBlocks,
    ["Gastroenteritis", "Mesenteric ischaemia"],
  );

  assert.ok(match);
  assert.equal(match.block.id, "acute-abdominal-pain");
});

test("acute cholangitis style case matches the RUQ scaffold with cholangitis emphasis", () => {
  const match = matchPresentationBlockForCase(
    {
      age: "69",
      sex: "female",
      presentingComplaint: "RUQ pain and jaundice",
      history:
        "Right upper quadrant pain with jaundice, fever, rigors, dark urine, pale stools, and known gallstones.",
      pmh: "",
      meds: "",
      social: "",
      keyPositives: "",
      keyNegatives: "",
      observations: "HR 122 BP 92/58",
      leadDiagnosis: "",
      otherDifferentials: "",
      dangerousDiagnoses: "",
    },
    corePilotBlocks,
    ["Acute cholangitis", "Sepsis"],
  );

  assert.ok(match);
  assert.equal(match.block.id, "ruq-pain-jaundice");
  assert.equal(match.emphasis?.id, "cholangitis-oriented");
  assert.ok(match.emphasis?.highlightedDifferentials.includes("Acute cholangitis"));
});

test("chronic cholestatic case keeps the RUQ scaffold but switches to chronic cholestatic emphasis", () => {
  const match = matchPresentationBlockForCase(
    {
      age: "48",
      sex: "male",
      presentingComplaint: "Jaundice and itch",
      history:
        "Months of itching, fatigue, dry eyes and mouth, intermittent jaundice, and ulcerative colitis.",
      pmh: "",
      meds: "",
      social: "",
      keyPositives: "",
      keyNegatives: "no fever no rigors",
      observations: "",
      leadDiagnosis: "",
      otherDifferentials: "",
      dangerousDiagnoses: "",
    },
    corePilotBlocks,
    ["Sepsis"],
  );

  assert.ok(match);
  assert.equal(match.block.id, "ruq-pain-jaundice");
  assert.equal(match.emphasis?.id, "chronic-cholestatic-oriented");
});

test("classic biliary colic case now matches the RUQ scaffold with biliary colic emphasis", () => {
  const match = matchPresentationBlockForCase(
    {
      age: "41",
      sex: "female",
      presentingComplaint: "Epigastric pain after meals",
      history:
        "Recurrent RUQ and epigastric pain after fatty meals with gallstone history, settling between attacks and well between episodes.",
      pmh: "",
      meds: "",
      social: "",
      keyPositives: "",
      keyNegatives: "no fever no jaundice",
      observations: "",
      leadDiagnosis: "",
      otherDifferentials: "",
      dangerousDiagnoses: "",
    },
    corePilotBlocks,
    ["Biliary colic / gallstone disease"],
  );

  assert.ok(match);
  assert.equal(match.block.id, "ruq-pain-jaundice");
  assert.equal(match.emphasis?.id, "biliary-colic-oriented");
});

test("duct-stone obstructive pattern keeps the RUQ scaffold and switches to obstructive jaundice emphasis", () => {
  const match = matchPresentationBlockForCase(
    {
      age: "63",
      sex: "male",
      presentingComplaint: "Jaundice",
      history:
        "Dark urine, pale stools, itching, and a suspected bile duct stone after previous biliary colic.",
      pmh: "",
      meds: "",
      social: "",
      keyPositives: "",
      keyNegatives: "no fever no rigors",
      observations: "",
      leadDiagnosis: "",
      otherDifferentials: "",
      dangerousDiagnoses: "",
    },
    corePilotBlocks,
    ["Choledocholithiasis / obstructive jaundice"],
  );

  assert.ok(match);
  assert.equal(match.block.id, "ruq-pain-jaundice");
  assert.equal(match.emphasis?.id, "obstructive-jaundice-oriented");
});
