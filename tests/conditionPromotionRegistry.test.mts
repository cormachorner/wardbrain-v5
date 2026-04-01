import test from "node:test";
import assert from "node:assert/strict";

import { DIAGNOSIS_RULES } from "../lib/diagnosisRules.js";
import {
  CONDITION_PROMOTION_REGISTRY,
  CONDITION_PROMOTION_REGISTRY_BY_NAME,
  getConditionsForFamily,
} from "../lib/conditionPromotionRegistry.js";
import { FAMILY_DIAGNOSIS_MAP } from "../lib/presentationFamilies.js";
import type { ConditionPromotionStatus } from "../types/wardbrain.js";

const VALID_STATUSES: ConditionPromotionStatus[] = [
  "live-engine",
  "scaffold-only",
  "learn-more",
  "merged",
  "excluded",
];

test("current live diagnoses exist in the promotion registry and map to families", () => {
  for (const rule of DIAGNOSIS_RULES) {
    const entry = CONDITION_PROMOTION_REGISTRY_BY_NAME[rule.name];

    assert.ok(entry, `missing promotion registry entry for ${rule.name}`);
    assert.equal(entry.promotionStatus, "live-engine");
    assert.ok(entry.presentationFamilies.length > 0, `${rule.name} has no presentation family`);

    for (const family of entry.presentationFamilies) {
      assert.ok(
        FAMILY_DIAGNOSIS_MAP[family].includes(rule.name),
        `${rule.name} missing from family map for ${family}`,
      );
    }
  }
});

test("promotion registry statuses are valid and canonical names are unique", () => {
  const seenNames = new Set<string>();

  for (const entry of CONDITION_PROMOTION_REGISTRY) {
    assert.ok(!seenNames.has(entry.canonicalName), `duplicate registry entry: ${entry.canonicalName}`);
    seenNames.add(entry.canonicalName);
    assert.ok(
      VALID_STATUSES.includes(entry.promotionStatus),
      `invalid status for ${entry.canonicalName}: ${entry.promotionStatus}`,
    );
    assert.ok(entry.aliases.length > 0, `${entry.canonicalName} has no aliases`);
    assert.ok(entry.presentationFamilies.length > 0, `${entry.canonicalName} has no family mapping`);
  }
});

test("registry family queries return internally consistent entries", () => {
  for (const family of Object.keys(FAMILY_DIAGNOSIS_MAP)) {
    const familyEntries = getConditionsForFamily(family as keyof typeof FAMILY_DIAGNOSIS_MAP);

    for (const entry of familyEntries) {
      assert.ok(
        entry.presentationFamilies.includes(family as keyof typeof FAMILY_DIAGNOSIS_MAP),
        `${entry.canonicalName} missing back-reference to ${family}`,
      );
    }
  }
});

test("seeded next-wave conditions have the expected controlled promotion status", () => {
  const seededStatuses = new Map(
    CONDITION_PROMOTION_REGISTRY
      .filter((entry) =>
        [
          "Pericarditis",
          "Musculoskeletal chest pain",
          "Tension headache",
          "Temporal arteritis",
          "Asthma exacerbation",
          "COPD exacerbation",
        ].includes(entry.canonicalName),
      )
      .map((entry) => [entry.canonicalName, entry.promotionStatus]),
  );

  assert.deepEqual(Object.fromEntries(seededStatuses), {
    Pericarditis: "scaffold-only",
    "Musculoskeletal chest pain": "live-engine",
    "Tension headache": "live-engine",
    "Temporal arteritis": "live-engine",
    "Asthma exacerbation": "live-engine",
    "COPD exacerbation": "live-engine",
  });
});

test("acute abdominal first-wave promoted conditions are live-engine", () => {
  const promoted = new Map(
    CONDITION_PROMOTION_REGISTRY
      .filter((entry) => ["Acute pancreatitis", "Perforated viscus"].includes(entry.canonicalName))
      .map((entry) => [entry.canonicalName, entry.promotionStatus]),
  );

  assert.deepEqual(Object.fromEntries(promoted), {
    "Acute pancreatitis": "live-engine",
    "Perforated viscus": "live-engine",
  });
});

test("RUQ family governance keeps acute cholangitis live and adjacent comparators scaffold-only", () => {
  const ruqStatuses = new Map(
    CONDITION_PROMOTION_REGISTRY
      .filter((entry) =>
        [
          "Acute cholangitis",
          "Acute cholecystitis",
          "Choledocholithiasis / obstructive jaundice",
          "Biliary colic / gallstone disease",
          "Primary sclerosing cholangitis",
          "Primary biliary cholangitis",
        ].includes(entry.canonicalName),
      )
      .map((entry) => [entry.canonicalName, entry.promotionStatus]),
  );

  assert.deepEqual(Object.fromEntries(ruqStatuses), {
    "Acute cholangitis": "live-engine",
    "Acute cholecystitis": "live-engine",
    "Choledocholithiasis / obstructive jaundice": "live-engine",
    "Biliary colic / gallstone disease": "live-engine",
    "Primary sclerosing cholangitis": "scaffold-only",
    "Primary biliary cholangitis": "scaffold-only",
  });
});
