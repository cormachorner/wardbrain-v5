import type { CaseInput } from "../lib/types";
import type { ReactNode } from "react";
import { Field, TextArea } from "./WardBrainCard";

type LabPanelKey = "fbc" | "ues" | "lfts" | "abg";

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="border-t border-slate-200 pt-3 first:border-t-0 first:pt-0">
      <div className="mb-2">
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        {description && <p className="mt-1 text-sm text-slate-600">{description}</p>}
      </div>
      {children}
    </section>
  );
}

function LabNumberField({
  label,
  unit,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  unit?: string;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  placeholder?: string;
}) {
  const hasValue = value !== undefined;

  return (
    <label className="block">
      <span className="mb-1 flex items-baseline justify-between gap-2 text-xs font-medium text-slate-700">
        <span>{label}</span>
        {unit && <span className="font-normal text-slate-400">{unit}</span>}
      </span>
      <input
        type="number"
        step="any"
        inputMode="decimal"
        className={`w-full rounded-lg border px-2.5 py-2 text-base outline-none transition-colors focus:border-[var(--brand-navy)] focus:ring-2 focus:ring-[var(--brand-navy)]/10 sm:text-sm ${
          hasValue
            ? "border-[var(--brand-border)] bg-slate-50 text-slate-950"
            : "border-slate-300 bg-white text-slate-900 placeholder:text-slate-300"
        }`}
        value={value ?? ""}
        onChange={(event) => {
          const nextValue = event.target.value.trim();
          onChange(nextValue === "" ? undefined : Number(nextValue));
        }}
        placeholder={placeholder}
      />
    </label>
  );
}

function LabPanel({
  title,
  enteredCount = 0,
  children,
  defaultOpen = false,
}: {
  title: string;
  enteredCount?: number;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details
      open={defaultOpen}
      className="group rounded-xl border border-slate-200 bg-slate-50"
    >
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 text-sm font-semibold text-slate-800 marker:hidden">
        <span>{title}</span>
        <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs font-medium text-slate-500">
          {enteredCount > 0 ? `${enteredCount} entered` : "empty"}
        </span>
      </summary>
      <div className="border-t border-slate-200 p-3">{children}</div>
    </details>
  );
}

function countEnteredValues(panel: Record<string, unknown> | undefined) {
  if (!panel) return 0;

  return Object.entries(panel).filter(
    ([key, value]) => !["oxygenContext", "fio2"].includes(key) && value !== undefined && value !== "",
  ).length;
}

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
  function updateLabValue(panel: LabPanelKey, field: string, value: number | undefined) {
    onFieldChange("labs", {
      ...caseInput.labs,
      sex: caseInput.sex === "male" || caseInput.sex === "female" ? caseInput.sex : "unknown",
      [panel]: {
        ...(caseInput.labs?.[panel] ?? {}),
        [field]: value,
      },
    });
  }

  function updateAbgOxygenContext(value: "room_air" | "supplemental_oxygen" | "unknown" | "") {
    onFieldChange("labs", {
      ...caseInput.labs,
      sex: caseInput.sex === "male" || caseInput.sex === "female" ? caseInput.sex : "unknown",
      abg: {
        ...(caseInput.labs?.abg ?? {}),
        oxygenContext: value === "" ? undefined : value,
      },
    });
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-2xl font-semibold">Case input</h2>
        <p className="mt-0.5 text-sm text-slate-600">
          Add the messy case details. WardBrain will keep the payload exactly as entered.
        </p>
      </div>

      <div className="space-y-3">
        <FormSection title="Patient">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Age</span>
              <input
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none ring-0 focus:border-[var(--brand-navy)] focus:ring-2 focus:ring-[var(--brand-navy)]/10"
                value={caseInput.age}
                onChange={(e) => onFieldChange("age", e.target.value)}
                placeholder="68"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium">Sex</span>
              <select
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-[var(--brand-navy)] focus:ring-2 focus:ring-[var(--brand-navy)]/10"
                value={caseInput.sex}
                onChange={(e) => onFieldChange("sex", e.target.value)}
              >
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </label>
          </div>
        </FormSection>

        <FormSection title="Presentation">
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
            label="Observations"
            value={caseInput.observations}
            onChange={(v) => onFieldChange("observations", v)}
            placeholder="BP, HR, sats, RR..."
          />
        </FormSection>

        <FormSection title="Background">
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
        </FormSection>

        <FormSection
          title="Investigations"
          description="Optional. Lab interpretation and any lab-supported scoring are labelled separately from clinical findings."
        >
          <details className="rounded-xl border border-slate-200 bg-white p-3">
            <summary className="cursor-pointer text-sm font-semibold text-slate-800">
              Add laboratory results
            </summary>

            <div className="mt-4 space-y-3">
              <LabPanel title="FBC" enteredCount={countEnteredValues(caseInput.labs?.fbc)} defaultOpen>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <LabNumberField label="Hb" unit="g/L" value={caseInput.labs?.fbc?.hb} onChange={(value) => updateLabValue("fbc", "hb", value)} placeholder="82" />
                  <LabNumberField label="WCC" unit="x10^9/L" value={caseInput.labs?.fbc?.wcc} onChange={(value) => updateLabValue("fbc", "wcc", value)} placeholder="14.2" />
                  <LabNumberField label="Platelets" unit="x10^9/L" value={caseInput.labs?.fbc?.platelets} onChange={(value) => updateLabValue("fbc", "platelets", value)} placeholder="250" />
                  <LabNumberField label="MCV" unit="fL" value={caseInput.labs?.fbc?.mcv} onChange={(value) => updateLabValue("fbc", "mcv", value)} placeholder="72" />
                  <LabNumberField label="Neutrophils" unit="x10^9/L" value={caseInput.labs?.fbc?.neutrophils} onChange={(value) => updateLabValue("fbc", "neutrophils", value)} placeholder="8.2" />
                </div>

                <details className="mt-3">
                  <summary className="min-h-9 cursor-pointer rounded-lg px-1 py-2 text-xs font-medium text-slate-600 hover:text-slate-900">
                    More FBC fields
                  </summary>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <LabNumberField label="MCH" unit="pg" value={caseInput.labs?.fbc?.mch} onChange={(value) => updateLabValue("fbc", "mch", value)} />
                    <LabNumberField label="MCHC" unit="g/L" value={caseInput.labs?.fbc?.mchc} onChange={(value) => updateLabValue("fbc", "mchc", value)} />
                    <LabNumberField label="Lymphocytes" unit="x10^9/L" value={caseInput.labs?.fbc?.lymphocytes} onChange={(value) => updateLabValue("fbc", "lymphocytes", value)} />
                    <LabNumberField label="Monocytes" unit="x10^9/L" value={caseInput.labs?.fbc?.monocytes} onChange={(value) => updateLabValue("fbc", "monocytes", value)} />
                    <LabNumberField label="Eosinophils" unit="x10^9/L" value={caseInput.labs?.fbc?.eosinophils} onChange={(value) => updateLabValue("fbc", "eosinophils", value)} />
                    <LabNumberField label="Basophils" unit="x10^9/L" value={caseInput.labs?.fbc?.basophils} onChange={(value) => updateLabValue("fbc", "basophils", value)} />
                    <LabNumberField label="Reticulocytes" unit="x10^9/L" value={caseInput.labs?.fbc?.reticulocytes} onChange={(value) => updateLabValue("fbc", "reticulocytes", value)} />
                    <LabNumberField label="PCV" value={caseInput.labs?.fbc?.pcv} onChange={(value) => updateLabValue("fbc", "pcv", value)} />
                    <LabNumberField label="ESR" unit="mm/hr" value={caseInput.labs?.fbc?.esr} onChange={(value) => updateLabValue("fbc", "esr", value)} />
                    <LabNumberField label="D-dimer" unit="mg/L" value={caseInput.labs?.fbc?.dDimer} onChange={(value) => updateLabValue("fbc", "dDimer", value)} />
                  </div>
                </details>
              </LabPanel>

              <LabPanel title="U&Es" enteredCount={countEnteredValues(caseInput.labs?.ues)}>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <LabNumberField label="Na" unit="mmol/L" value={caseInput.labs?.ues?.sodium} onChange={(value) => updateLabValue("ues", "sodium", value)} />
                  <LabNumberField label="K" unit="mmol/L" value={caseInput.labs?.ues?.potassium} onChange={(value) => updateLabValue("ues", "potassium", value)} />
                  <LabNumberField label="Urea" unit="mmol/L" value={caseInput.labs?.ues?.urea} onChange={(value) => updateLabValue("ues", "urea", value)} />
                  <LabNumberField label="Creatinine" unit="umol/L" value={caseInput.labs?.ues?.creatinine} onChange={(value) => updateLabValue("ues", "creatinine", value)} />
                  <LabNumberField label="eGFR" unit="mL/min" value={caseInput.labs?.ues?.egfr} onChange={(value) => updateLabValue("ues", "egfr", value)} />
                  <LabNumberField label="Bicarbonate" unit="mmol/L" value={caseInput.labs?.ues?.bicarbonate} onChange={(value) => updateLabValue("ues", "bicarbonate", value)} />
                </div>

                <details className="mt-3">
                  <summary className="min-h-9 cursor-pointer rounded-lg px-1 py-2 text-xs font-medium text-slate-600 hover:text-slate-900">
                    More U&E fields
                  </summary>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <LabNumberField label="Chloride" unit="mmol/L" value={caseInput.labs?.ues?.chloride} onChange={(value) => updateLabValue("ues", "chloride", value)} />
                    <LabNumberField label="Calcium" unit="mmol/L" value={caseInput.labs?.ues?.calcium} onChange={(value) => updateLabValue("ues", "calcium", value)} />
                    <LabNumberField label="Magnesium" unit="mmol/L" value={caseInput.labs?.ues?.magnesium} onChange={(value) => updateLabValue("ues", "magnesium", value)} />
                    <LabNumberField label="Phosphate" unit="mmol/L" value={caseInput.labs?.ues?.phosphate} onChange={(value) => updateLabValue("ues", "phosphate", value)} />
                  </div>
                </details>
              </LabPanel>

              <LabPanel title="LFTs" enteredCount={countEnteredValues(caseInput.labs?.lfts)}>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <LabNumberField label="Albumin" unit="g/L" value={caseInput.labs?.lfts?.albumin} onChange={(value) => updateLabValue("lfts", "albumin", value)} />
                  <LabNumberField label="ALT" unit="U/L" value={caseInput.labs?.lfts?.alt} onChange={(value) => updateLabValue("lfts", "alt", value)} />
                  <LabNumberField label="AST" unit="U/L" value={caseInput.labs?.lfts?.ast} onChange={(value) => updateLabValue("lfts", "ast", value)} />
                  <LabNumberField label="ALP" unit="U/L" value={caseInput.labs?.lfts?.alp} onChange={(value) => updateLabValue("lfts", "alp", value)} />
                  <LabNumberField label="Bilirubin" unit="umol/L" value={caseInput.labs?.lfts?.bilirubin} onChange={(value) => updateLabValue("lfts", "bilirubin", value)} />
                  <LabNumberField label="GGT" unit="U/L" value={caseInput.labs?.lfts?.ggt} onChange={(value) => updateLabValue("lfts", "ggt", value)} />
                </div>
              </LabPanel>

              <LabPanel title="ABG" enteredCount={countEnteredValues(caseInput.labs?.abg)}>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <LabNumberField label="pH" value={caseInput.labs?.abg?.ph} onChange={(value) => updateLabValue("abg", "ph", value)} />
                  <LabNumberField label="PaO2" unit="kPa" value={caseInput.labs?.abg?.pao2} onChange={(value) => updateLabValue("abg", "pao2", value)} />
                  <LabNumberField label="PaCO2" unit="kPa" value={caseInput.labs?.abg?.paco2} onChange={(value) => updateLabValue("abg", "paco2", value)} />
                  <LabNumberField label="Bicarbonate" unit="mmol/L" value={caseInput.labs?.abg?.bicarbonate} onChange={(value) => updateLabValue("abg", "bicarbonate", value)} />
                  <LabNumberField label="Base excess" unit="mmol/L" value={caseInput.labs?.abg?.baseExcess} onChange={(value) => updateLabValue("abg", "baseExcess", value)} />
                  <LabNumberField label="Lactate" unit="mmol/L" value={caseInput.labs?.abg?.lactate} onChange={(value) => updateLabValue("abg", "lactate", value)} />
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-slate-600">Oxygen context</span>
                    <select
                      className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm outline-none focus:border-[var(--brand-navy)] focus:ring-2 focus:ring-[var(--brand-navy)]/10"
                      value={caseInput.labs?.abg?.oxygenContext ?? ""}
                      onChange={(event) => updateAbgOxygenContext(event.target.value as "room_air" | "supplemental_oxygen" | "unknown" | "")}
                    >
                      <option value="">Not specified</option>
                      <option value="room_air">Room air</option>
                      <option value="supplemental_oxygen">Supplemental oxygen</option>
                      <option value="unknown">Unknown</option>
                    </select>
                  </label>
                  <LabNumberField label="FiO2 if known" value={caseInput.labs?.abg?.fio2} onChange={(value) => updateLabValue("abg", "fio2", value)} placeholder="0.28" />
                </div>
              </LabPanel>

              <LabPanel title="Glucose" enteredCount={caseInput.labs?.ues?.fastingGlucose !== undefined ? 1 : 0}>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <LabNumberField label="Fasting glucose" unit="mmol/L" value={caseInput.labs?.ues?.fastingGlucose} onChange={(value) => updateLabValue("ues", "fastingGlucose", value)} placeholder="5.0" />
                </div>
              </LabPanel>
            </div>
          </details>
        </FormSection>

        <FormSection
          title="Your current reasoning"
          description="Optional. These fields help compare your thinking with WardBrain's output."
        >
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
        </FormSection>
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
