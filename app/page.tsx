"use client";

import { useState } from "react";
import { analyzeCase } from "../lib/differentialEngine";
import type { CaseInput } from "../lib/types";


const initialCase: CaseInput = {
  age: "",
  sex: "",
  presentingComplaint: "",
  history: "",
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

export default function Home() {
  const [caseInput, setCaseInput] = useState<CaseInput>(initialCase);
  const [submittedCase, setSubmittedCase] = useState<CaseInput>(initialCase);

  const result = analyzeCase(submittedCase);

  function updateField<K extends keyof CaseInput>(field: K, value: CaseInput[K]) {
    setCaseInput((prev) => ({ ...prev, [field]: value }));
  }

  function handleAnalyseCase() {
    setSubmittedCase(caseInput);
  }

  function handleClearCase() {
    setCaseInput(initialCase);
    setSubmittedCase(initialCase);
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <header className="mb-8">
          <div className="mb-3 inline-flex rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800">
            Educational use only • De-identified cases only
          </div>
          <h1 className="text-4xl font-bold tracking-tight">WardBrain v5</h1>
          <p className="mt-3 max-w-3xl text-slate-600">
            A clinical reasoning coach for medical students that detects anchoring,
            surfaces dangerous differentials, and helps turn a messy case into a safer,
            sharper presentation.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-2xl font-semibold">Enter case</h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-sm font-medium">Age</span>
                <input
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none ring-0"
                  value={caseInput.age}
                  onChange={(e) => updateField("age", e.target.value)}
                  placeholder="68"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium">Sex</span>
                <select
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none"
                  value={caseInput.sex}
                  onChange={(e) => updateField("sex", e.target.value)}
                >
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </label>
            </div>

            <Field
              label="Presenting complaint"
              value={caseInput.presentingComplaint}
              onChange={(v) => updateField("presentingComplaint", v)}
              placeholder="Tearing chest pain"
            />

            <TextArea
              label="History of presenting complaint"
              value={caseInput.history}
              onChange={(v) => updateField("history", v)}
              placeholder="Sudden onset, radiating to the back, collapse..."
            />

            <TextArea
              label="PMH / PSH"
              value={caseInput.pmh}
              onChange={(v) => updateField("pmh", v)}
              placeholder="Untreated hypertension..."
            />

            <TextArea
              label="Drugs / allergies"
              value={caseInput.meds}
              onChange={(v) => updateField("meds", v)}
              placeholder="Any regular meds, anticoagulation, allergies..."
            />

            <TextArea
              label="Social / risk factors"
              value={caseInput.social}
              onChange={(v) => updateField("social", v)}
              placeholder="Smoker, alcohol, independent baseline..."
            />

            <TextArea
              label="Key positives"
              value={caseInput.keyPositives}
              onChange={(v) => updateField("keyPositives", v)}
              placeholder="Radiates to back, loss of consciousness, pulsatile abdomen..."
            />

            <TextArea
              label="Key negatives"
              value={caseInput.keyNegatives}
              onChange={(v) => updateField("keyNegatives", v)}
              placeholder="No fever, no pleuritic pain..."
            />

            <TextArea
              label="Observations"
              value={caseInput.observations}
              onChange={(v) => updateField("observations", v)}
              placeholder="BP, HR, sats, RR..."
            />

            <Field
              label="Lead diagnosis"
              value={caseInput.leadDiagnosis ?? ""}
              onChange={(v) => updateField("leadDiagnosis", v)}
              placeholder="GORD"
            />

            <TextArea
              label="Other differentials being considered"
              value={caseInput.otherDifferentials ?? ""}
              onChange={(v) => updateField("otherDifferentials", v)}
              placeholder="PE, ACS, pneumonia"
            />

            <TextArea
              label="Dangerous diagnoses / worst-case scenarios to exclude"
              value={caseInput.dangerousDiagnoses ?? ""}
              onChange={(v) => updateField("dangerousDiagnoses", v)}
              placeholder="Acute aortic syndrome, PE, GI bleed"
            />

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white"
                onClick={handleAnalyseCase}
              >
                Analyse case
              </button>
              <button
                type="button"
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
                onClick={handleClearCase}
              >
                Clear
              </button>
            </div>
          </section>

          <section className="space-y-4">
            <Card title="Problem representation">
              <p>{result.problemRepresentation}</p>
            </Card>
<Card title="Features detected">
  {result.detectedFeatures.length > 0 ? (
    <div className="flex flex-wrap gap-2">
      {result.detectedFeatures.map((feature) => (
        <span
          key={feature}
          className="rounded-full border border-slate-300 bg-slate-50 px-3 py-1 text-sm text-slate-700"
        >
          {feature}
        </span>
      ))}
    </div>
  ) : (
    <p className="text-slate-600">No features detected yet.</p>
  )}
</Card>
          
<Card title="Red-flag pattern detection">
  {result.redFlags.length > 0 ? (
    <ul className="space-y-2">
      {result.redFlags.map((flag) => (
        <li key={flag.name} className="rounded-xl border border-red-200 bg-red-50 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="font-semibold text-red-900">{flag.name}</div>

            {flag.sourceBody && flag.sourceId && (
              <span className="rounded-full border border-red-300 px-2 py-0.5 text-xs font-medium text-red-900">
                {flag.sourceBody} {flag.sourceId}
              </span>
            )}

            {flag.sourceCoverage && (
              <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-900">
                coverage: {flag.sourceCoverage}
              </span>
            )}
          </div>

          <div className="mt-2 text-sm text-red-800">{flag.explanation}</div>
        </li>
      ))}
    </ul>
  ) : (
    <p className="text-slate-600">No major red-flag override pattern detected yet.</p>
  )}

<Card title="Ranked differentials">
  {result.differentials.length > 0 ? (
    <ol className="space-y-2">
      {result.differentials.map((dx, index) => (
        <li key={dx.name} className="rounded-xl border border-slate-200 p-3">
          <div className="flex items-center justify-between gap-4">
            <div className="font-semibold">
              {index + 1}. {dx.name}
            </div>
            <div className="text-sm text-slate-500">Score {dx.score}</div>
          </div>

          <div className="mt-2 text-sm text-slate-700">
            <span className="font-medium">Why it fits: </span>
            {dx.reasonsFor.length > 0 ? dx.reasonsFor.join(", ") : "Limited support"}
          </div>

          {dx.reasonsAgainst.length > 0 && (
            <div className="mt-1 text-sm text-slate-700">
              <span className="font-medium">Why against: </span>
              {dx.reasonsAgainst.join(", ")}
            </div>
          )}
        </li>
      ))}
    </ol>
  ) : (
    <p className="text-slate-600">No differential met the current display threshold.</p>
  )}
</Card>
</Card>
            {result.nextSteps && (
              <Card title="Investigations and immediate next steps">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="font-semibold text-slate-900">{result.nextSteps.diagnosis}</div>

                  {result.nextSteps.sourceBody && result.nextSteps.sourceId && (
                    <span className="rounded-full border border-slate-300 px-2 py-0.5 text-xs font-medium text-slate-800">
                      {result.nextSteps.sourceBody} {result.nextSteps.sourceId}
                    </span>
                  )}

                  {result.nextSteps.sourceCoverage && (
                    <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-900">
                      coverage: {result.nextSteps.sourceCoverage}
                    </span>
                  )}
                </div>

                {result.nextSteps.investigations.length > 0 && (
                  <div className="mt-3">
                    <div className="mb-1 text-sm font-medium text-slate-900">Investigations</div>
                    <ul className="space-y-1 text-sm text-slate-700">
                      {result.nextSteps.investigations.map((item) => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.nextSteps.immediateNextSteps.length > 0 && (
                  <div className="mt-3">
                    <div className="mb-1 text-sm font-medium text-slate-900">
                      Immediate next steps
                    </div>
                    <ul className="space-y-1 text-sm text-slate-700">
                      {result.nextSteps.immediateNextSteps.map((item) => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.nextSteps.notes.length > 0 && (
                  <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                    {result.nextSteps.notes.join(" ")}
                  </div>
                )}
              </Card>
            )}
            <Card title="Does your lead diagnosis fit?">
              <div className="mb-2 text-lg font-semibold">{result.fitCheck.label}</div>
              <p className="mb-3 text-slate-700">{result.fitCheck.summary}</p>

              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Supporting: </span>
                  {result.fitCheck.supporting.length > 0
                    ? result.fitCheck.supporting.join(", ")
                    : "None identified"}
                </div>
                <div>
                  <span className="font-medium">Conflicting: </span>
                  {result.fitCheck.conflicting.length > 0
                    ? result.fitCheck.conflicting.join(", ")
                    : "No major conflicts detected"}
                </div>
              </div>
            </Card>

            <Card title="How your current reasoning compares">
              <div className="space-y-3 text-sm text-slate-700">
                <p>{result.reasoningComparison.leadAssessment}</p>
                <p>{result.reasoningComparison.differentialAssessment}</p>
                <p>{result.reasoningComparison.dangerAssessment}</p>
              </div>
            </Card>

            <Card title="Anchor warning">
              <p>{result.anchorWarning}</p>
            </Card>

            <Card title="Present to the reg">
              <p>{result.presentation}</p>
            </Card>
          </section>
        </div>
      </div>
    </main>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-3 text-xl font-semibold">{title}</h3>
      {children}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="mt-4 block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      <input
        className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="mt-4 block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      <textarea
        className="min-h-24 w-full rounded-xl border border-slate-300 px-3 py-2 outline-none"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}
