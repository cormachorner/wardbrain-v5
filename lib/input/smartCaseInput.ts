import type { CaseInput } from "../types";
import { parseLabText } from "./labTextParser";

export type SmartCaseParseResult = {
  patch: Partial<CaseInput>;
  parsedLabCount: number;
  warnings: string[];
};

function inferAge(text: string): string | undefined {
  const candidates = [...text.matchAll(/\b(?:(\d{1,3})\s*(?:[-–—]?\s*year\s*[-–—]?\s*old|yo\b|y\/o\b|[mf]\b)|aged\s+(\d{1,3})\b)/gi)];
  const ages = [...new Set(candidates.map((match) => Number(match[1] ?? match[2])))];
  if (ages.length !== 1 || ages[0] < 0 || ages[0] > 120) return undefined;
  // Family-history ages are not necessarily the patient's age.
  if (candidates.some((match) => /\b(?:mother|father|brother|sister|son|daughter|relative)\b[^.;]*$/i.test(text.slice(0, match.index)))) return undefined;
  return String(ages[0]);
}

function inferSex(text: string): CaseInput["sex"] | undefined {
  if (/\b(?:male|man|gentleman|boy|\d{1,3}\s*m\b)\b/i.test(text)) return "male";
  if (/\b(?:female|woman|lady|girl|\d{1,3}\s*f\b)\b/i.test(text)) return "female";
  return undefined;
}

function cleanComplaint(value: string): string | undefined {
  const cleaned = value
    .replace(/\b(?:hb|wcc|platelets?|mcv|urea|creatinine|pulse|hr|bp|rr|sats?|spo2)\b.*$/i, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[,:;-]+$/, "")
    .trim();

  if (!cleaned) {
    return undefined;
  }

  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

function inferComplaintFromPresentationPhrase(text: string): string | undefined {
  const match = text.match(
    /\b(?:presents?|presenting|complains?\s+of|reports|attends\s+with|admitted\s+with)\s+(?:with\s+)?(.+?)(?:[.\n\r]|$)/i,
  );

  return match?.[1] ? cleanComplaint(match[1]) : undefined;
}

function inferPresentingComplaint(text: string): string | undefined {
  const explicitComplaint = inferComplaintFromPresentationPhrase(text);

  if (explicitComplaint) {
    return explicitComplaint;
  }

  const lower = text.toLowerCase();

  if (/\b(headache|thunderclap)\b/.test(lower)) return "Headache";
  if (/\b(confus(?:ed|ion)|deliri(?:um|ous)|not (?:himself|herself))\b/.test(lower)) return "Confusion";
  if (/\b(chest (?:pain|pressure|tightness|heaviness)|central chest|retrosternal)\b/.test(lower)) return "Chest pain";
  if (/\b(shortness of breath|breathless(?:ness)?|sob|dyspnoea|wheeze)\b/.test(lower)) return "Breathlessness";
  if (/\b(abdominal pain|abdo pain|tummy pain|epigastric|ruq|rif|flank pain)\b/.test(lower)) return "Abdominal pain";
  if (/\b(jaundice|yellow eyes|yellow skin)\b/.test(lower)) return "Jaundice";
  if (/\bweakness\b/.test(lower)) return "Weakness";
  return undefined;
}

function extractObservations(text: string): string | undefined {
  const observations = text.match(/\b(?:hr|pulse|bp|rr|sats?|spo2|temp(?:erature)?)\b[^.。\n;]*/gi);
  return observations ? Array.from(new Set(observations.map((item) => item.trim()))).join("; ") : undefined;
}

function extractPmh(text: string): string | undefined {
  const match = text.match(/\b(?:pmh|past medical history|background)\s*:?\s*([^.\n]+)/i);
  return match?.[1]?.trim();
}

function extractMeds(text: string): string | undefined {
  const match = text.match(/\b(?:meds?|medications?|drugs)\s*:?\s*([^.\n]+)/i);
  return match?.[1]?.trim();
}

function extractSocial(text: string): string | undefined {
  const fragments = text.match(/\b(?:smok(?:er|es|ing)|alcohol|ex-smoker|vapes?)\b[^.。\n;]*/gi);
  return fragments ? Array.from(new Set(fragments.map((item) => item.trim()))).join("; ") : undefined;
}

export function parseSmartCaseInput(text: string, existingLabs?: CaseInput["labs"]): SmartCaseParseResult {
  const trimmedText = text.trim();
  const labParse = parseLabText(trimmedText, existingLabs);
  const patch: Partial<CaseInput> = {};

  if (!trimmedText) {
    return {
      patch,
      parsedLabCount: 0,
      warnings: ["No text entered."],
    };
  }

  const age = inferAge(trimmedText);
  const sex = inferSex(trimmedText);
  const presentingComplaint = inferPresentingComplaint(trimmedText);
  const observations = extractObservations(trimmedText);
  const pmh = extractPmh(trimmedText);
  const meds = extractMeds(trimmedText);
  const social = extractSocial(trimmedText);

  if (age) patch.age = age;
  if (sex) patch.sex = sex;
  if (presentingComplaint) patch.presentingComplaint = presentingComplaint;
  patch.history = trimmedText;
  if (observations) patch.observations = observations;
  if (pmh) patch.pmh = pmh;
  if (meds) patch.meds = meds;
  if (social) patch.social = social;
  if (labParse.parsedValues.length > 0) patch.labs = labParse.labs;

  return {
    patch,
    parsedLabCount: labParse.parsedValues.length,
    warnings: [...labParse.warnings, ...(!age ? ["Patient age was not unambiguous. Enter it manually."] : [])],
  };
}
