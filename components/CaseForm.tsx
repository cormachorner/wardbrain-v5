import type { CaseInput } from "../lib/types";
import { Field, TextArea } from "./WardBrainCard";

export function CaseForm({
  caseInput,
  onFieldChange,
  onAnalyse,
  onClear,
  isAnalyzing,
}: {
  caseInput: CaseInput;
  onFieldChange: <K extends keyof CaseInput>(field: K, value: CaseInput[K]) => void;
  onAnalyse: () => void;
  onClear: () => void;
  isAnalyzing: boolean;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-2xl font-semibold">Enter case</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Age</span>
          <input
            className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none ring-0"
            value={caseInput.age}
            onChange={(e) => onFieldChange("age", e.target.value)}
            placeholder="68"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium">Sex</span>
          <select
            className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none"
            value={caseInput.sex}
            onChange={(e) => onFieldChange("sex", e.target.value)}
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
        onChange={(v) => onFieldChange("presentingComplaint", v)}
        placeholder="Tearing chest pain"
      />

      <TextArea
        label="History of presenting complaint"
        value={caseInput.history}
        onChange={(v) => onFieldChange("history", v)}
        placeholder="Sudden onset, radiating to the back, collapse..."
      />

      <TextArea
        label="PMH / PSH"
        value={caseInput.pmh}
        onChange={(v) => onFieldChange("pmh", v)}
        placeholder="Untreated hypertension..."
      />

      <TextArea
        label="Drugs / allergies"
        value={caseInput.meds}
        onChange={(v) => onFieldChange("meds", v)}
        placeholder="Any regular meds, anticoagulation, allergies..."
      />

      <TextArea
        label="Social / risk factors"
        value={caseInput.social}
        onChange={(v) => onFieldChange("social", v)}
        placeholder="Smoker, alcohol, independent baseline..."
      />

      <TextArea
        label="Key positives"
        value={caseInput.keyPositives}
        onChange={(v) => onFieldChange("keyPositives", v)}
        placeholder="Radiates to back, loss of consciousness, pulsatile abdomen..."
      />

      <TextArea
        label="Key negatives"
        value={caseInput.keyNegatives}
        onChange={(v) => onFieldChange("keyNegatives", v)}
        placeholder="No fever, no pleuritic pain..."
      />

      <TextArea
        label="Observations"
        value={caseInput.observations}
        onChange={(v) => onFieldChange("observations", v)}
        placeholder="BP, HR, sats, RR..."
      />

      <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="text-base font-semibold text-slate-900">Your current reasoning</div>
        <p className="mt-1 text-sm text-slate-600">
          Optional. These fields help compare your thinking with WardBrain&apos;s output.
        </p>

        <Field
          label="Lead diagnosis"
          helper="What do you think is the single most likely diagnosis right now?"
          value={caseInput.leadDiagnosis ?? ""}
          onChange={(v) => onFieldChange("leadDiagnosis", v)}
          placeholder="GORD"
        />

        <TextArea
          label="Other differentials being considered"
          helper="List other diagnoses you are actively considering."
          value={caseInput.otherDifferentials ?? ""}
          onChange={(v) => onFieldChange("otherDifferentials", v)}
          placeholder="PE, ACS, pneumonia"
        />

        <TextArea
          label="Dangerous diagnoses to exclude"
          helper="Which dangerous or time-critical diagnoses must be ruled out?"
          value={caseInput.dangerousDiagnoses ?? ""}
          onChange={(v) => onFieldChange("dangerousDiagnoses", v)}
          placeholder="Acute aortic syndrome, PE, GI bleed"
        />
      </div>

      <div className="mt-6 flex gap-3">
        <button
          type="button"
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          onClick={onAnalyse}
          disabled={isAnalyzing}
        >
          {isAnalyzing ? "Analysing..." : "Analyse case"}
        </button>
        <button
          type="button"
          className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
          onClick={onClear}
        >
          Clear
        </button>
      </div>
    </section>
  );
}
