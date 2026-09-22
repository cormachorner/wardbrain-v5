import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { join } from "node:path";
import test from "node:test";
import { JSDOM } from "jsdom";

// Mount the actual page, including CaseForm and AnalysisResults. Only the session
// and HTTP transport are replaced; requests still pass through the real API
// schema, feature extraction and deterministic analysis.
assert.ok(process.env.WARDBRAIN_TEST_BUILD_DIR, "Run through npm test to compile the application first.");
process.env.NODE_ENV = "development";
process.env.WARDBRAIN_TEST_MODE = "1";
process.env.WARDBRAIN_TEST_AUTH_BYPASS = "1";
process.env.WARDBRAIN_LLM_ENABLED = "0";
process.env.WARDBRAIN_LLM_PRESENTATION_ENABLED = "0";
delete process.env.NEXT_PUBLIC_WARDBRAIN_DEBUG;

const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "http://localhost", pretendToBeVisual: true });
for (const name of ["window", "document", "navigator", "HTMLElement", "HTMLInputElement", "HTMLTextAreaElement", "Event", "MouseEvent"]) {
  Object.defineProperty(globalThis, name, { configurable: true, value: dom.window[name] });
}
globalThis.requestAnimationFrame = (callback) => setTimeout(callback, 0);
globalThis.cancelAnimationFrame = clearTimeout;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const require = createRequire(import.meta.url);
const sessionModule = require.resolve("next-auth/react");
require.cache[sessionModule] = {
  id: sessionModule,
  filename: sessionModule,
  loaded: true,
  exports: {
    useSession: () => ({ data: { user: { role: "STUDENT" } }, status: "authenticated" }),
    signOut: () => {},
  },
};
const { act, createElement } = require("react");
const { createRoot } = require("react-dom/client");
const Home = require(join(process.env.WARDBRAIN_TEST_BUILD_DIR, "app/page.js")).default;
const { POST } = require(join(process.env.WARDBRAIN_TEST_BUILD_DIR, "app/api/analyze-case/route.js"));

async function mountPage(t) {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  const previousFetch = globalThis.fetch;
  const requests = [];
  let pendingRequest;
  globalThis.fetch = (url, options) => {
    assert.equal(url, "/api/analyze-case");
    const input = JSON.parse(options.body);
    pendingRequest = (async () => {
      const response = await POST(new Request(`http://localhost${url}`, options));
      const result = await response.clone().json();
      requests.push({ input, result, status: response.status });
      return response;
    })();
    return pendingRequest;
  };
  t.after(async () => {
    await act(async () => root.unmount());
    container.remove();
    globalThis.fetch = previousFetch;
    delete process.env.NEXT_PUBLIC_WARDBRAIN_DEBUG;
  });
  await act(async () => root.render(createElement(Home)));

  function button(name) {
    const found = [...container.querySelectorAll("button")].find((item) => item.textContent.trim() === name);
    assert.ok(found, `Button not found: ${name}`);
    return found;
  }
  function field(name) {
    const label = [...container.querySelectorAll("label")].find((item) => {
      const caption = item.querySelector("span");
      return caption?.textContent.trim() === name || caption?.firstElementChild?.textContent.trim() === name;
    });
    const found = label?.querySelector("input, textarea, select");
    assert.ok(found, `Field not found: ${name}`);
    return found;
  }
  async function enter(element, value) {
    assert.ok(element, "Input must exist before entering text");
    const prototype = element.tagName === "TEXTAREA" ? dom.window.HTMLTextAreaElement.prototype : dom.window.HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(prototype, "value").set;
    await act(async () => {
      setter.call(element, value);
      element.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
    });
    assert.equal(element.value, value);
  }
  async function click(name) {
    const element = button(name);
    assert.equal(element.disabled, false, `${name} should be enabled`);
    await act(async () => element.click());
  }
  async function mainPaste(text, reviewAction = "Organise and review") {
    if (!container.querySelector('textarea[aria-label="Case notes"]')) await click("Paste case notes");
    await enter(container.querySelector('textarea[aria-label="Case notes"]'), text);
    await click(reviewAction);
  }
  async function labPaste(text) {
    const details = [...container.querySelectorAll("details")].find((item) => item.querySelector("summary")?.textContent.trim() === "Add laboratory results");
    assert.ok(details, "Lab entry disclosure should exist");
    details.open = true;
    await click("Paste results");
    await enter(field("Paste investigation results"), text);
    await click("Parse into structured fields");
  }
  async function analyse() {
    const count = requests.length;
    const element = button("Analyse case");
    assert.equal(element.disabled, false, "Valid reviewed input should enable analysis");
    await act(async () => {
      element.click();
      assert.ok(pendingRequest, "Analyse should send the current form state");
      await pendingRequest;
    });
    assert.equal(requests.length, count + 1);
    const response = requests.at(-1);
    assert.equal(response.status, 200, JSON.stringify(response.result));
    assert.match(container.textContent, /Explore the reasoning/);
    return response;
  }
  return { container, button, field, enter, click, mainPaste, labPaste, analyse };
}

const caseA = "72-year-old man with RUQ pain and jaundice. BP 94/60, HR 112. Bilirubin 120, ALP 340, ALT 85, WCC 17.";
const caseB = "72-year-old man with RUQ pain, jaundice and rigors. Bilirubin raised, ALP and GGT elevated, ALT mildly raised and WCC raised.";
const caseBWithoutInfection = "72-year-old man with RUQ pain and jaundice. BP 94/60, HR 112. Bilirubin raised, ALP and GGT elevated, ALT mildly raised and WCC raised.";
const caseD = "72-year-old man with RUQ pain, jaundice, fever/rigors, vomiting, HR 112, BP 94/60";

function numericValues(labs) {
  return Object.values(labs ?? {}).flatMap((panel) => panel && typeof panel === "object" ? Object.values(panel).filter((value) => typeof value === "number") : []);
}

for (const reviewAction of ["Enter details", "Organise and review"]) {
  test(`mounted main paste A populates fields and API request via ${reviewAction}`, async (t) => {
    const page = await mountPage(t);
    await page.mainPaste(caseA, reviewAction);
    assert.equal(page.field("Age").value, "72");
    for (const [label, value] of [["Bilirubin", "120"], ["ALP", "340"], ["ALT", "85"], ["WCC", "17"]]) {
      assert.equal(page.field(label).value, value, `${label} must populate the rendered lab field`);
    }
    const { input, result } = await page.analyse();
    assert.equal(input.age, "72");
    assert.deepEqual(input.labs.lfts, { bilirubin: 120, alp: 340, alt: 85 });
    assert.deepEqual(input.labs.fbc, { wcc: 17 });
    assert.deepEqual(numericValues(input.labs).sort((a, b) => a - b), [17, 85, 120, 340]);
    assert.match(`${input.history} ${input.observations}`, /BP 94\/60, HR 112/);
    assert.ok(result.detectedFeatureSlugs.includes("hypotension"));
    assert.ok(result.detectedFeatureSlugs.includes("tachycardia"));
    assert.ok(result.labDiagnosisModifiers.length > 0);
    assert.doesNotMatch(page.container.textContent, /dev\s*\+\d|Internal score:|Presentation source:/);
  });
}

for (const [opening, age] of [["58-year-old man", "58"], ["58 year old male", "58"], ["58M", "58"], ["man aged 58", "58"], ["A 72-year-old gentleman", "72"]]) {
  test(`mounted paste applies age automatically: ${opening}`, async (t) => {
    const page = await mountPage(t);
    await page.mainPaste(`${opening} with RUQ pain.`, "Enter details");
    assert.equal(page.field("Age").value, age);
    assert.equal((await page.analyse()).input.age, age);
  });
}

test("mounted paste leaves ambiguous numbers unfilled", async (t) => {
  const page = await mountPage(t);
  await page.mainPaste("Man with RUQ pain for 58 hours. HR 72, BP 94/60.", "Enter details");
  assert.equal(page.field("Age").value, "");
  assert.equal(page.button("Analyse case").disabled, true);
});

test("mounted main paste B delivers combined qualitative findings and capped modifiers", async (t) => {
  const page = await mountPage(t);
  await page.mainPaste(caseB);
  const { input, result } = await page.analyse();
  assert.deepEqual(numericValues(input.labs), []);
  for (const feature of ["raised_bilirubin", "raised_alp", "raised_ggt", "raised_alt", "leucocytosis"]) {
    assert.ok(result.labs.qualitativeFeatures.includes(feature), `Missing qualitative feature: ${feature}`);
  }
  const modifiers = result.labDiagnosisModifiers.filter((item) => item.feature.startsWith("qualitative_"));
  assert.ok(modifiers.some((item) => item.diagnosis === "Acute cholangitis"));
  for (const diagnosis of new Set(modifiers.map((item) => item.diagnosis))) {
    assert.equal(modifiers.filter((item) => item.diagnosis === diagnosis).reduce((sum, item) => sum + item.scoreDelta, 0), 1);
  }
  assert.deepEqual(result.labs.abnormalities, [], "Qualitative reports must not fabricate measurements");
});

test("mounted obstructive-jaundice paste does not turn physiology or qualitative WCC into a cholangitis red flag", async (t) => {
  const page = await mountPage(t);
  await page.mainPaste(caseBWithoutInfection);
  const { result } = await page.analyse();

  assert.ok(result.detectedFeatureSlugs.includes("hypotension"));
  assert.ok(result.detectedFeatureSlugs.includes("tachycardia"));
  assert.ok(!result.redFlags.some((flag) => flag.name === "Acute cholangitis pattern"));
  assert.ok(!result.labDiagnosisModifiers?.some((modifier) => modifier.diagnosis === "Acute cholangitis"));
});

test("mounted infective biliary paste retains the cholangitis flag and combined cholestatic support", async (t) => {
  const page = await mountPage(t);
  await page.mainPaste(caseB);
  const { result } = await page.analyse();

  assert.ok(result.redFlags.some((flag) => flag.name === "Acute cholangitis pattern"));
  assert.ok(result.labDiagnosisModifiers.some((modifier) =>
    modifier.diagnosis === "Acute cholangitis" &&
    modifier.feature === "qualitative_cholestatic_pattern" &&
    modifier.scoreDelta === 1,
  ));
});

test("mounted ALP and GGT text reaches obstructive-jaundice modifiers and visible laboratory evidence", async (t) => {
  const page = await mountPage(t);
  await page.mainPaste(caseBWithoutInfection);
  const { result } = await page.analyse();

  assert.ok(result.labs.qualitativeFeatures.includes("raised_alp"));
  assert.ok(result.labs.qualitativeFeatures.includes("raised_ggt"));
  assert.ok(result.labDiagnosisModifiers.some((modifier) =>
    modifier.diagnosis === "Choledocholithiasis / obstructive jaundice" &&
    modifier.feature === "qualitative_cholestatic_pattern" &&
    modifier.scoreDelta === 1,
  ));
  assert.match(page.container.textContent, /qualitative cholestatic pattern: Reported raised ALP and GGT offer modest support for cholestasis/i);
});

test("mounted qualitative cholestatic evidence preserves numeric precedence and negation", async (t) => {
  const page = await mountPage(t);
  await page.mainPaste("72-year-old man with RUQ pain and jaundice. ALP 340, GGT 180. ALP not raised and GGT normal.");
  const { input, result } = await page.analyse();

  assert.equal(input.labs.lfts.alp, 340);
  assert.equal(input.labs.lfts.ggt, 180);
  assert.ok(!result.labs?.qualitativeFeatures?.includes("raised_alp"));
  assert.ok(!result.labs?.qualitativeFeatures?.includes("raised_ggt"));
  assert.ok(!result.labDiagnosisModifiers?.some((modifier) => modifier.feature.startsWith("qualitative_")));
});

const biliaryContext = "72-year-old man with RUQ pain, jaundice and rigors.";
const anaemiaContext = "58-year-old man with breathlessness, fatigue and pallor.";
const glucoseContext = "24-year-old woman with abdominal pain, vomiting, polyuria, polydipsia and type 1 diabetes.";
const qualitativeCases = [
  ["ALT raised", "raised_alt", biliaryContext],
  ["transaminases elevated", "raised_alt", biliaryContext],
  ["bilirubin raised", "raised_bilirubin", biliaryContext],
  ["ALP raised", "raised_alp", biliaryContext],
  ["GGT elevated", "raised_ggt", biliaryContext],
  ["WCC raised", "leucocytosis", biliaryContext],
  ["leucocytosis", "leucocytosis", biliaryContext],
  ["Hb low", "anaemia", anaemiaContext],
  ["anaemia", "anaemia", anaemiaContext],
  ["creatinine raised", "raised_creatinine", biliaryContext],
  ["glucose raised", "hyperglycaemia_lab", glucoseContext],
  ["hyperglycaemia", "hyperglycaemia_lab", glucoseContext],
];
for (const source of ["main", "dedicated"]) {
  for (const [phrase, feature, context] of qualitativeCases) {
    test(`mounted ${source} paste delivers ${phrase} to analysis`, async (t) => {
      const page = await mountPage(t);
      await page.mainPaste(source === "main" ? `${context} ${phrase}.` : context);
      if (source === "dedicated") await page.labPaste(phrase);
      const { input, result } = await page.analyse();
      assert.deepEqual(numericValues(input.labs), []);
      if (source === "dedicated") assert.match(input.labNarrative, new RegExp(phrase, "i"));
      assert.ok(result.labs.qualitativeFeatures.includes(feature));
      assert.ok(result.labDiagnosisModifiers.some((item) => item.feature === `qualitative_${feature}` && item.scoreDelta === 1));
    });
  }
}

for (const source of ["main", "dedicated"]) {
  test(`mounted ${source} paste excludes explicitly normal/negated qualitative findings`, async (t) => {
    const page = await mountPage(t);
    const negatives = "ALT not raised, normal bilirubin, WCC not elevated.";
    await page.mainPaste(source === "main" ? `${biliaryContext} ${negatives}` : biliaryContext);
    if (source === "dedicated") await page.labPaste(negatives);
    const { result } = await page.analyse();
    for (const feature of ["raised_alt", "raised_bilirubin", "leucocytosis"]) {
      assert.ok(!result.labs?.qualitativeFeatures?.includes(feature), `${feature} must not be positive evidence`);
      assert.ok(!result.labDiagnosisModifiers?.some((item) => item.feature === `qualitative_${feature}`));
    }
  });
}

test("mounted numeric fields override qualitative reports for the same analyte", async (t) => {
  const page = await mountPage(t);
  await page.mainPaste(`${biliaryContext} ALT raised, bilirubin raised, WCC raised. ALT 20, bilirubin 10, WCC 6.`);
  await page.labPaste("ALT raised, bilirubin raised, WCC raised");
  const { input, result } = await page.analyse();
  assert.deepEqual(input.labs.lfts, { alt: 20, bilirubin: 10 });
  assert.deepEqual(input.labs.fbc, { wcc: 6 });
  assert.deepEqual(result.labs.qualitativeFeatures ?? [], []);
  assert.ok(!result.labDiagnosisModifiers?.some((item) => item.feature.startsWith("qualitative_")));
});

test("mounted pastes preserve manually entered age and structured lab values", async (t) => {
  const page = await mountPage(t);
  await page.click("Enter details");
  await page.enter(page.field("Age"), "65");
  await page.enter(page.field("Bilirubin"), "100");
  await page.mainPaste(caseA);
  assert.equal(page.field("Age").value, "65");
  assert.equal(page.field("Bilirubin").value, "100");
  await page.labPaste("Bilirubin 180, ALP 400");
  assert.equal(page.field("Bilirubin").value, "100");
  const { input } = await page.analyse();
  assert.equal(input.age, "65");
  assert.equal(input.labs.lfts.bilirubin, 100);
});

for (const dedicatedFirst of [true, false]) {
  test(`mounted current structured labs are preserved (${dedicatedFirst ? "dedicated first" : "main first"})`, async (t) => {
    const page = await mountPage(t);
    if (dedicatedFirst) {
      await page.mainPaste(biliaryContext);
      await page.labPaste("Bilirubin 180");
      await page.mainPaste(caseA);
    } else {
      await page.mainPaste(caseA);
      await page.labPaste("Bilirubin 180");
    }
    const expected = dedicatedFirst ? 180 : 120;
    assert.equal(page.field("Bilirubin").value, String(expected));
    assert.match(page.container.textContent, /Existing value preserved/);
    const { input } = await page.analyse();
    assert.equal(input.labs.lfts.bilirubin, expected);
    assert.equal(numericValues(input.labs).length, 4);
  });
}

test("mounted cholangitis case D does not generate a high-specificity ruptured AAA warning", async (t) => {
  const page = await mountPage(t);
  await page.mainPaste(caseD);
  const { result } = await page.analyse();
  assert.equal(result.differentials[0].name, "Acute cholangitis");
  assert.ok(result.detectedFeatureSlugs.includes("hypotension"));
  assert.ok(!result.redFlags.some((flag) => flag.name === "Ruptured AAA suspicion pattern"));
  assert.doesNotMatch(page.container.textContent, /Ruptured AAA suspicion pattern/);
});

test("mounted scoring weights require an explicit debug opt-in", async (t) => {
  const page = await mountPage(t);
  await page.mainPaste(caseA);
  await page.analyse();
  assert.doesNotMatch(page.container.textContent, /dev\s*\+\d/);
  process.env.NEXT_PUBLIC_WARDBRAIN_DEBUG = "1";
  await page.analyse();
  assert.match(page.container.textContent, /dev\s*\+\d/);
});


test("mounted unreviewed paste edits update automatic age and labs instead of freezing partial values", async (t) => {
  const page = await mountPage(t);
  const textarea = page.container.querySelector('textarea[aria-label="Case notes"]');
  await page.enter(textarea, "58M with RUQ pain and jaundice. Bilirubin 1");
  await page.enter(textarea, "72M with RUQ pain and jaundice. Bilirubin 120, WCC 17.");
  await page.click("Enter details");
  assert.equal(page.field("Age").value, "72");
  assert.equal(page.field("Bilirubin").value, "120");
  const { input } = await page.analyse();
  assert.equal(input.age, "72");
  assert.equal(input.labs.lfts.bilirubin, 120);
});

test("mounted removal of unreviewed extracted facts does not leave stale automatic age or labs", async (t) => {
  const page = await mountPage(t);
  const textarea = page.container.querySelector('textarea[aria-label="Case notes"]');
  await page.enter(textarea, caseA);
  await page.enter(textarea, "Man with RUQ pain for 72 hours. Bilirubin raised.");
  await page.click("Enter details");
  assert.equal(page.field("Age").value, "");
  assert.equal(page.field("Bilirubin").value, "");
  assert.equal(page.field("WCC").value, "");
  assert.equal(page.button("Analyse case").disabled, true);
});
