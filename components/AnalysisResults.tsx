"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import type { LabValueAssessment } from "../lib/domain/labs/labTypes";
import type { AnalyzeCaseResponse } from "../lib/types";
import { SimpleList } from "./WardBrainCard";

function formatSlug(value: string) {
  return value.replaceAll("_", " ").replaceAll("-", " ");
}

function Icon({
  name,
  className = "h-4 w-4",
}: {
  name: "brain" | "shield" | "alert" | "clipboard" | "search" | "info" | "check";
  className?: string;
}) {
  const common = {
    className,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  if (name === "brain") {
    return (
      <svg {...common}>
        <path d="M9 4.5a3 3 0 0 0-3 3v.2a3.5 3.5 0 0 0-1 6.2 3.3 3.3 0 0 0 3.2 4.6H9" />
        <path d="M15 4.5a3 3 0 0 1 3 3v.2a3.5 3.5 0 0 1 1 6.2 3.3 3.3 0 0 1-3.2 4.6H15" />
        <path d="M12 5v14" />
        <path d="M8.5 10.5c1.4.3 2.3 1.1 2.7 2.4" />
        <path d="M15.5 10.5c-1.4.3-2.3 1.1-2.7 2.4" />
      </svg>
    );
  }

  if (name === "shield") {
    return (
      <svg {...common}>
        <path d="M12 3 5 6v5c0 4.5 2.8 8.2 7 10 4.2-1.8 7-5.5 7-10V6l-7-3Z" />
      </svg>
    );
  }

  if (name === "alert") {
    return (
      <svg {...common}>
        <path d="m12 3 9 16H3L12 3Z" />
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
      </svg>
    );
  }

  if (name === "clipboard") {
    return (
      <svg {...common}>
        <path d="M9 4h6l1 2h2v15H6V6h2l1-2Z" />
        <path d="M9 10h6" />
        <path d="M9 14h6" />
      </svg>
    );
  }

  if (name === "search") {
    return (
      <svg {...common}>
        <circle cx="11" cy="11" r="6" />
        <path d="m16 16 4 4" />
      </svg>
    );
  }

  if (name === "check") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="m8 12 2.5 2.5L16 9" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5" />
      <path d="M12 8h.01" />
    </svg>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
    >
      <path d="m5 7.5 5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Section({
  title,
  icon,
  children,
  defaultOpen = true,
  tone = "default",
  actions,
}: {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  tone?: "default" | "danger" | "amber" | "secondary" | "primary";
  actions?: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const toneClasses = {
    default: "border-slate-200 bg-white",
    danger: "border-red-200 bg-white",
    amber: "border-amber-200 bg-white",
    secondary: "border-slate-200 bg-slate-50",
    primary: "border-[var(--brand-border)] bg-white",
  };

  return (
    <section className={`rounded-2xl border p-5 shadow-sm transition-colors hover:border-slate-300 ${toneClasses[tone]}`}>
      <div className="flex items-start justify-between gap-3">
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
          className="group flex min-w-0 flex-1 items-center gap-2 text-left text-xl font-semibold text-slate-950 outline-none focus-visible:rounded-lg focus-visible:ring-2 focus-visible:ring-[var(--brand-navy)] focus-visible:ring-offset-2"
        >
          {icon && <span className="shrink-0 text-slate-500" aria-hidden="true">{icon}</span>}
          <span>{title}</span>
          <span className="ml-1 text-slate-400 group-hover:text-slate-600">
            <Chevron open={open} />
          </span>
        </button>
        {actions}
      </div>
      {open && <div className="mt-3">{children}</div>}
    </section>
  );
}

function ChipList({
  items,
  empty = "None identified",
  tone = "slate",
  limit = 4,
}: {
  items: string[];
  empty?: string;
  tone?: "slate" | "red" | "amber";
  limit?: number;
}) {
  const [expanded, setExpanded] = useState(false);

  if (items.length === 0) {
    return <span className="text-slate-500">{empty}</span>;
  }

  const toneClasses = {
    slate: "border-slate-200 bg-slate-50 text-slate-700",
    red: "border-red-200 bg-red-50 text-red-900",
    amber: "border-amber-200 bg-amber-50 text-amber-900",
  };
  const visibleItems = expanded ? items : items.slice(0, limit);
  const hiddenCount = items.length - visibleItems.length;

  return (
    <span className="inline-flex flex-wrap gap-1.5 align-middle">
      {visibleItems.map((item) => (
        <span key={item} className={`rounded-full border px-2 py-0.5 text-xs ${toneClasses[tone]}`}>
          {item}
        </span>
      ))}
      {hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs font-medium text-slate-500 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-navy)] focus-visible:ring-offset-1"
        >
          +{hiddenCount} more
        </button>
      )}
    </span>
  );
}

function WhyItFitsDisclosure({
  reasonsFor,
  reasonsAgainst,
}: {
  reasonsFor: string[];
  reasonsAgainst: string[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-2 text-sm text-slate-700">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="inline-flex items-center gap-1 rounded-lg text-sm font-medium text-slate-600 outline-none hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-[var(--brand-navy)] focus-visible:ring-offset-2"
      >
        Why it fits
        <Chevron open={open} />
      </button>
      {open && (
        <div className="mt-2 space-y-1 rounded-xl border border-slate-100 bg-slate-50 p-3">
          <div>
            <span className="font-medium">Why it fits: </span>
            {reasonsFor.length > 0 ? reasonsFor.join(", ") : "Limited support"}
          </div>
          {reasonsAgainst.length > 0 && (
            <div>
              <span className="font-medium">Why against: </span>
              {reasonsAgainst.join(", ")}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function isLabReason(reason: string) {
  return reason.startsWith("Lab:");
}

function parseLabReason(reason: string) {
  const match = reason.match(/^Lab:\s*\+(\d+)\s+(.+?)\s+-\s+(.+)$/);

  if (!match) {
    return {
      delta: undefined,
      feature: "Laboratory evidence",
      explanation: reason.replace(/^Lab:\s*/, ""),
    };
  }

  return {
    delta: match[1],
    feature: formatSlug(match[2]),
    explanation: match[3],
  };
}

function LaboratoryEvidence({ reasons }: { reasons: string[] }) {
  const labReasons = reasons.filter(isLabReason).map(parseLabReason);

  if (labReasons.length === 0) {
    return null;
  }

  return (
    <div className="mt-2 rounded-xl border border-sky-100 bg-sky-50 p-3 text-sm text-slate-700">
      <div className="mb-1 font-medium text-slate-900">Laboratory evidence</div>
      <ul className="space-y-1">
        {labReasons.map((reason) => (
          <li key={`${reason.delta}-${reason.feature}-${reason.explanation}`} className="flex gap-2">
            {reason.delta && (
              <span className="shrink-0 rounded-full border border-sky-200 bg-white px-2 py-0.5 text-xs font-semibold text-sky-900">
                +{reason.delta}
              </span>
            )}
            <span>
              <span className="font-medium capitalize">{reason.feature}: </span>
              {reason.explanation}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DiagnosisTraceDisclosure({
  trace,
}: {
  trace: AnalyzeCaseResponse["diagnosisTraces"][number];
}) {
  const [open, setOpen] = useState(false);
  const clinicalOtherReasons = trace.otherReasons.filter((reason) => !isLabReason(reason));
  const labReasons = trace.otherReasons.filter(isLabReason);

  return (
    <div className="mt-2 rounded-xl border border-slate-100 bg-slate-50 p-3 text-sm text-slate-700">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-3 text-left font-medium text-slate-800 outline-none focus-visible:rounded-lg focus-visible:ring-2 focus-visible:ring-[var(--brand-navy)] focus-visible:ring-offset-2"
      >
        <span className="flex items-center gap-2">
          <Icon name="info" />
          Scoring detail
        </span>
        <Chevron open={open} />
      </button>
      {open && (
        <div className="mt-3 space-y-2">
          <div>
            <span className="font-medium">Most supportive features: </span>
            <ChipList items={trace.supportingFeatures} />
          </div>
          <div>
            <span className="font-medium">Features against: </span>
            <ChipList items={trace.opposingFeatures} />
          </div>
          {clinicalOtherReasons.length > 0 && (
            <div>
              <span className="font-medium">Composite/rule support: </span>
              <ChipList items={clinicalOtherReasons} />
            </div>
          )}
          <LaboratoryEvidence reasons={labReasons} />
        </div>
      )}
    </div>
  );
}

function LabExplanationDisclosure({ explanations }: { explanations: string[] }) {
  const [open, setOpen] = useState(false);

  if (explanations.length === 0) {
    return null;
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="inline-flex items-center gap-1 rounded-lg text-sm font-medium text-slate-600 outline-none hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-[var(--brand-navy)] focus-visible:ring-offset-2"
      >
        Why?
        <Chevron open={open} />
      </button>
      {open && (
        <ul className="mt-2 space-y-1 rounded-xl border border-slate-100 bg-slate-50 p-3 text-sm text-slate-700">
          {explanations.map((explanation) => (
            <li key={explanation}>• {explanation}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function labStatusMarker(status: "low" | "high" | "normal" | "invalid" | "missing") {
  if (status === "low") return "↓";
  if (status === "high") return "↑";
  if (status === "invalid") return "!";
  return "";
}

function labPanelForTest(test: string) {
  if (["Hb", "WCC", "Platelets", "MCV", "MCH", "MCHC", "Neutrophils", "Lymphocytes", "Monocytes", "Eosinophils", "Basophils", "Reticulocytes", "PCV", "ESR", "D-dimer"].includes(test)) {
    return "FBC";
  }

  if (["Na", "K", "Cl", "HCO3", "Urea", "Creatinine", "Calcium", "Magnesium", "Phosphate", "eGFR", "Fasting glucose"].includes(test)) {
    return test === "Fasting glucose" ? "Glucose" : "U&Es";
  }

  if (["Albumin", "ALT", "AST", "ALP", "Bilirubin", "GGT"].includes(test)) {
    return "LFTs";
  }

  return "ABG";
}

function labStatusClasses(status: LabValueAssessment["status"]) {
  if (status === "invalid") return "border-amber-200 bg-amber-50 text-amber-950";
  if (status === "high" || status === "low") return "border-slate-200 bg-white text-slate-800";
  return "border-slate-200 bg-slate-50 text-slate-600";
}

function LabAbnormalityRow({ abnormality }: { abnormality: LabValueAssessment }) {
  const marker = labStatusMarker(abnormality.status);
  const statusLabel = abnormality.status === "high"
    ? "High"
    : abnormality.status === "low"
      ? "Low"
      : abnormality.status === "invalid"
        ? "Invalid"
        : abnormality.status;

  return (
    <li className={`rounded-lg border px-3 py-2 ${labStatusClasses(abnormality.status)}`}>
      <div className="flex items-center justify-between gap-3">
        <span className="font-medium">{abnormality.test}</span>
        <span className="text-right">
          {abnormality.value !== undefined ? `${abnormality.value} ${abnormality.unit}` : "not provided"}
          {marker && <span className="ml-1 font-bold" aria-hidden="true">{marker}</span>}
        </span>
      </div>
      <div className="mt-1 text-xs text-slate-500">
        {statusLabel}
        {" · "}
        Reference {abnormality.referenceRange}
      </div>
    </li>
  );
}

function AbgSummary({ abnormalities, features }: { abnormalities: LabValueAssessment[]; features: string[] }) {
  const abgAbnormalities = abnormalities.filter((abnormality) => labPanelForTest(abnormality.test) === "ABG");
  const abgFeatureSet = new Set([
    "acidaemia",
    "alkalaemia",
    "metabolic_acidosis",
    "respiratory_acidosis",
    "respiratory_alkalosis",
    "metabolic_alkalosis",
    "hypoxaemia",
    "hypercapnia",
    "hypocapnia",
    "low_bicarbonate_abg",
    "raised_bicarbonate_abg",
    "base_deficit",
    "base_excess",
    "raised_lactate",
  ]);
  const abgFeatures = features.filter((feature) => abgFeatureSet.has(feature));

  if (abgAbnormalities.length === 0 && abgFeatures.length === 0) {
    return null;
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="font-semibold text-slate-900">ABG</div>
        <div className="text-xs text-slate-500">acid-base / gas exchange</div>
      </div>
      {abgAbnormalities.length > 0 && (
        <ul className="grid gap-2 sm:grid-cols-2">
          {abgAbnormalities.map((abnormality) => (
            <LabAbnormalityRow
              key={`${abnormality.test}-${abnormality.value}-${abnormality.status}`}
              abnormality={abnormality}
            />
          ))}
        </ul>
      )}
      {abgFeatures.length > 0 && (
        <div className="mt-3">
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Interpretation</div>
          <ChipList items={abgFeatures.map(formatSlug)} limit={6} />
        </div>
      )}
    </div>
  );
}

function LaboratoryResults({ labs }: { labs: NonNullable<AnalyzeCaseResponse["labs"]> }) {
  const nonAbgAbnormalities = labs.abnormalities.filter(
    (abnormality) => labPanelForTest(abnormality.test) !== "ABG",
  );
  const groupedAbnormalities = nonAbgAbnormalities.reduce<Record<string, typeof labs.abnormalities>>(
    (groups, abnormality) => {
      const panel = labPanelForTest(abnormality.test);
      groups[panel] = [...(groups[panel] ?? []), abnormality];
      return groups;
    },
    {},
  );
  const abgFeatureNames = new Set([
    "acidaemia",
    "alkalaemia",
    "metabolic_acidosis",
    "respiratory_acidosis",
    "respiratory_alkalosis",
    "metabolic_alkalosis",
    "hypoxaemia",
    "hypercapnia",
    "hypocapnia",
    "low_bicarbonate_abg",
    "raised_bicarbonate_abg",
    "base_deficit",
    "base_excess",
    "raised_lactate",
  ]);
  const nonAbgFeatures = labs.features.filter((feature) => !abgFeatureNames.has(feature));
  const missingWarnings = Array.from(new Set(labs.warnings.filter((warning) => warning.includes("not provided"))));
  const otherWarnings = Array.from(new Set(labs.warnings.filter((warning) => !warning.includes("not provided"))));

  return (
    <Section title="Laboratory results" icon={<Icon name="info" />}>
      <div className="space-y-4 text-sm text-slate-700">
        {labs.safetyWarnings.length > 0 && (
          <div className="space-y-2">
            {labs.safetyWarnings.map((warning) => (
              <div
                key={warning.id}
                className={
                  warning.severity === "urgent"
                    ? "rounded-xl border border-red-200 bg-red-50 p-3 text-red-950"
                    : "rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-950"
                }
              >
                <div className="text-xs font-semibold uppercase tracking-wide">
                  {warning.severity === "urgent" ? "Urgent laboratory abnormality" : "Laboratory safety warning"}
                </div>
                <div className="mt-1 font-semibold">{warning.title}</div>
                <div className="mt-1">{warning.explanation}</div>
                <ul className="mt-2 space-y-1">
                  {warning.triggerValues.map((triggerValue) => (
                    <li key={`${warning.id}-${triggerValue.test}`} className="rounded-lg bg-white/70 px-2 py-1">
                      <span className="font-semibold">{triggerValue.test} {triggerValue.value} {triggerValue.unit}</span>
                      <span className="opacity-80"> - {triggerValue.threshold}</span>
                    </li>
                  ))}
                </ul>
                {warning.recommendedNextStep && (
                  <div className="mt-2">
                    <span className="font-medium">Recommended next step: </span>
                    {warning.recommendedNextStep}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <AbgSummary abnormalities={labs.abnormalities} features={labs.features} />

        {nonAbgAbnormalities.length > 0 ? (
          <div>
            <div className="mb-2 text-sm font-semibold text-slate-900">Clinically important abnormalities</div>
            <div className="grid gap-3 sm:grid-cols-2">
            {Object.entries(groupedAbnormalities).map(([panel, abnormalities]) => (
              <div key={panel} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="mb-2 font-semibold text-slate-900">{panel}</div>
                <ul className="space-y-2">
                  {abnormalities.map((abnormality) => (
                    <LabAbnormalityRow
                      key={`${abnormality.test}-${abnormality.value}-${abnormality.status}`}
                      abnormality={abnormality}
                    />
                  ))}
                </ul>
              </div>
            ))}
            </div>
          </div>
        ) : (
          <p className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-600">
            No non-ABG laboratory abnormalities detected in the entered values.
          </p>
        )}

        <div>
          <div className="mb-2 text-sm font-semibold text-slate-900">Derived interpretation / patterns</div>
          <ChipList items={nonAbgFeatures.map(formatSlug)} empty="No non-ABG derived lab-only features." limit={8} />
        </div>

        {otherWarnings.length > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-950">
            <div className="font-medium">Invalid values</div>
            <ChipList items={otherWarnings} tone="amber" />
          </div>
        )}

        {missingWarnings.length > 0 && (
          <details className="rounded-xl border border-slate-200 bg-white p-3">
            <summary className="cursor-pointer text-sm font-medium text-slate-600">
              Missing fields from partial panels ({missingWarnings.length})
            </summary>
            <div className="mt-2">
              <ChipList items={missingWarnings} limit={8} />
            </div>
          </details>
        )}

        <LabExplanationDisclosure explanations={labs.explanations} />

        <p className="text-xs text-slate-500">
          Lab interpretation is educational. Lab-derived score modifiers are separately labelled as laboratory evidence and do not alter non-lab red-flag rules.
        </p>
      </div>
    </Section>
  );
}

export function AnalysisResults({ result }: { result: AnalyzeCaseResponse }) {
  const [copied, setCopied] = useState(false);
  const showPresentationDebug = process.env.NODE_ENV !== "production";
  const displayedDetectedFeatures = Array.from(
    new Map(
      result.detectedFeatures.map((feature, index) => [
        result.detectedFeatureSlugs[index] ?? feature,
        feature,
      ]),
    ),
  );
  const leadDiagnosis = result.differentials[0];
  const leadClinicalReasons = leadDiagnosis?.reasonsFor.filter((reason) => !isLabReason(reason)) ?? [];

  async function copyPresentation() {
    try {
      await navigator.clipboard.writeText(result.presentation);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section className="space-y-4">
      <Section title="Most likely diagnosis / ranked differentials" icon={<Icon name="brain" />} tone="primary">
        {leadDiagnosis && (
          <div className="mb-4 rounded-2xl border border-[var(--brand-border)] bg-slate-50 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Most likely
            </div>
            <div className="mt-1 flex flex-wrap items-baseline justify-between gap-3">
              <div className="text-2xl font-bold tracking-tight text-[var(--brand-navy)]">
                {leadDiagnosis.name}
              </div>
              <div className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-sm font-medium text-slate-600">
                Score {leadDiagnosis.score}
              </div>
            </div>
            <div className="mt-3 text-sm text-slate-700">
              <span className="font-medium">Key support: </span>
              <ChipList items={leadClinicalReasons} />
            </div>
            <LaboratoryEvidence reasons={leadDiagnosis.reasonsFor} />
            <WhyItFitsDisclosure
              reasonsFor={leadClinicalReasons}
              reasonsAgainst={leadDiagnosis.reasonsAgainst}
            />
          </div>
        )}

        {result.differentials.length > 1 ? (
          <ol className="space-y-2">
            {result.differentials.slice(1).map((dx, index) => (
              <li
                key={dx.name}
                className="rounded-xl border border-slate-200 bg-white/70 p-3 transition-colors hover:border-slate-300"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="font-semibold">
                    {index + 2}. {dx.name}
                  </div>
                  <div className="text-sm text-slate-500">Score {dx.score}</div>
                </div>

                <div className="mt-2 text-sm text-slate-700">
                  <span className="font-medium">Key support: </span>
                  <ChipList items={dx.reasonsFor.filter((reason) => !isLabReason(reason))} empty="Limited support" />
                </div>

                <LaboratoryEvidence reasons={dx.reasonsFor} />
                <WhyItFitsDisclosure
                  reasonsFor={dx.reasonsFor.filter((reason) => !isLabReason(reason))}
                  reasonsAgainst={dx.reasonsAgainst}
                />

                {result.diagnosisTraces[index + 1] && (
                  <DiagnosisTraceDisclosure trace={result.diagnosisTraces[index + 1]} />
                )}
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-slate-500">No additional ranked differentials met the current display threshold.</p>
        )}
      </Section>

      <Section title="Red-flag pattern detection" icon={<Icon name="alert" />} tone="danger">
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

                {flag.triggeredFeatures && flag.triggeredFeatures.length > 0 && (
                  <div className="mt-2 text-sm text-red-900">
                    <span className="font-medium">Triggered by: </span>
                    <ChipList items={flag.triggeredFeatures.map(formatSlug)} tone="red" />
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-slate-600">No major red-flag override pattern detected yet.</p>
        )}
      </Section>

      <Section title="Dangerous diagnoses to exclude / comparison" icon={<Icon name="shield" />}>
        <div className="space-y-3 text-sm text-slate-700">
          <p>{result.reasoningComparison.leadAssessment}</p>
          <p>{result.reasoningComparison.differentialAssessment}</p>
          <p>{result.reasoningComparison.dangerAssessment}</p>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="mb-1 text-base font-semibold text-slate-900">
              {result.fitCheck.label}
            </div>
            <p>{result.fitCheck.summary}</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <div>
                <span className="font-medium">Supporting: </span>
                <ChipList items={result.fitCheck.supporting} />
              </div>
              <div>
                <span className="font-medium">Conflicting: </span>
                <ChipList items={result.fitCheck.conflicting} tone="amber" empty="No major conflicts detected" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-950">
            <span className="font-medium">Anchor warning: </span>
            {result.anchorWarning}
          </div>
        </div>
      </Section>

      <Section title="Uncertainty / missing information" icon={<Icon name="search" />} tone="amber">
        <div className="mb-2 inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-sm font-medium capitalize text-amber-950">
          {result.uncertainty.level} uncertainty
        </div>
        <p className="text-slate-700">{result.uncertainty.summary}</p>

        <div className="mt-3 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
          <SimpleList title="Why" items={result.uncertainty.reasons} />
          <SimpleList
            title="Missing information that would help"
            items={result.uncertainty.missingInformation}
          />
        </div>
      </Section>

      <Section
        title="Present to the reg"
        icon={<Icon name="clipboard" />}
        tone="primary"
        actions={
          <button
            type="button"
            onClick={copyPresentation}
            aria-label="Copy presentation summary"
            className="rounded-lg border border-[var(--brand-border)] bg-white px-3 py-1.5 text-xs font-medium text-slate-700 outline-none transition-colors hover:bg-slate-50 active:bg-slate-100 focus-visible:ring-2 focus-visible:ring-[var(--brand-navy)] focus-visible:ring-offset-2"
          >
            {copied ? "Copied" : "Copy"}
          </button>
        }
      >
        <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
          <span className="font-medium">Problem representation: </span>
          {result.problemRepresentation}
        </div>
        <div>
          <div className="mb-1 text-sm font-medium text-slate-500">Presentation summary</div>
          <p className="text-slate-800">{result.presentation}</p>
          {showPresentationDebug && result.llmPresentation ? (
            <p className="mt-2 text-xs text-slate-500">
              Presentation source: {result.llmPresentation.presentationSource}
              {" · "}Attempted: {result.llmPresentation.llmPresentationAttempted ? "yes" : "no"}
              {" · "}Used: {result.llmPresentation.llmPresentationUsed ? "yes" : "no"}
              {" · "}Fallback: {result.llmPresentation.llmPresentationFallbackReason ?? "none"}
              {result.llmPresentation.llmPresentationFallbackTrigger
                ? ` (${result.llmPresentation.llmPresentationFallbackTrigger})`
                : ""}
            </p>
          ) : null}
        </div>
      </Section>

      {result.labs && (
        <LaboratoryResults labs={result.labs} />
      )}

      <Section title="Guideline support" icon={<Icon name="info" />} defaultOpen={false} tone="secondary">
        {result.guidelineSupport.sources.length > 0 ? (
          <div className="space-y-3 text-sm text-slate-700">
            <p>
              Curated source links mapped to the matched diagnoses, red flags, or presentation
              block. WardBrain summaries are educational and do not copy full guideline text.
            </p>

            <ul className="space-y-3">
              {result.guidelineSupport.sources.map((match) => (
                <li key={match.source.id} className="rounded-xl border border-slate-200 bg-white p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href={match.source.url}
                      target={match.source.url.startsWith("http") ? "_blank" : undefined}
                      rel={match.source.url.startsWith("http") ? "noreferrer" : undefined}
                      className="font-semibold text-[var(--brand-navy)] underline-offset-2 hover:underline"
                    >
                      {match.source.title}
                    </a>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-600">
                      {match.source.source}
                    </span>
                    <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-900">
                      {match.source.status}
                    </span>
                  </div>

                  <p className="mt-2">{match.source.shortTeachingSummary}</p>

                  <div className="mt-2 text-xs text-slate-500">
                    Last reviewed: {match.source.lastReviewed}
                    {" · "}
                    {match.source.licenceStatus}
                  </div>

                  <div className="mt-3 grid gap-2 sm:grid-cols-3">
                    <div>
                      <span className="font-medium">Diagnoses: </span>
                      <ChipList items={match.matchedDiagnosisSlugs.map(formatSlug)} />
                    </div>
                    <div>
                      <span className="font-medium">Red flags: </span>
                      <ChipList items={match.matchedRedFlagSlugs.map(formatSlug)} />
                    </div>
                    <div>
                      <span className="font-medium">Blocks: </span>
                      <ChipList items={match.matchedPresentationBlocks.map(formatSlug)} />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-sm text-slate-600">
            No curated guideline source mapping is available for this exact output yet.
          </p>
        )}
      </Section>

      <Section title="Case summary" icon={<Icon name="check" />} defaultOpen={false} tone="secondary">
        <div className="space-y-4 text-sm text-slate-700">
          <div>
            <span className="font-medium">Matched block: </span>
            {result.presentationSupport.matchedBlockLabel ?? "No supported block matched"}
            <span className="ml-2 text-slate-500">
              confidence {result.presentationSupport.confidence}
            </span>
          </div>

          {result.presentationSupport.warning ? (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-amber-900">
              {result.presentationSupport.warning}
            </div>
          ) : (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-900">
              This case fits a pilot-supported presentation block.
            </div>
          )}

          <div>
            <div className="mb-2 text-sm font-medium text-slate-500">Features detected</div>
            <ChipList items={displayedDetectedFeatures.map(([, feature]) => feature)} empty="No features detected yet." />
          </div>

          <div>
            <div className="mb-2 text-sm font-medium text-slate-500">Supported blocks</div>
            <div className="grid gap-2">
              {result.presentationSupport.supportedBlocks.map((block) => (
                <div key={block.id} className="rounded-xl border border-slate-200 bg-white p-3">
                  <div className="font-medium">{block.label}</div>
                  <div className="mt-1 text-xs text-slate-500">
                    {block.diagnoses.length} diagnoses currently represented
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {result.nextSteps && (
        <Section title="Investigations and immediate next steps" icon={<Icon name="info" />} defaultOpen={false} tone="secondary">
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
              <div className="mb-1 text-sm font-medium text-slate-900">Immediate next steps</div>
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
        </Section>
      )}

      <Section title="Presentation teaching scaffold" icon={<Icon name="info" />} defaultOpen={false} tone="secondary">
        {result.matchedPresentationBlock ? (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              A presentation-based teaching framework relevant to this case. This is a
              secondary educational scaffold, not the main case-specific reasoning output.
            </p>

            <div>
              <div className="text-sm font-medium text-slate-500">Presentation</div>
              <div className="text-lg font-semibold text-slate-900">
                {result.matchedPresentationBlock.block.presentation}
              </div>
            </div>

            {result.matchedPresentationBlock.emphasis && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                <div className="text-sm font-medium text-amber-900">
                  {result.matchedPresentationBlock.emphasis.title}
                </div>
                <p className="mt-1 text-sm text-amber-900">
                  {result.matchedPresentationBlock.emphasis.summary}
                </p>
                <SimpleList
                  title="Case-relevant emphasis"
                  items={result.matchedPresentationBlock.emphasis.highlightedDifferentials}
                />
              </div>
            )}

            <div>
              <div className="text-sm font-medium text-slate-500">Lead pattern</div>
              <p className="text-slate-700">{result.matchedPresentationBlock.block.leadPattern}</p>
            </div>

            <SimpleList
              title="Ranked differentials"
              items={result.matchedPresentationBlock.block.differentials}
              ordered
            />
            <SimpleList
              title="Features for the lead"
              items={result.matchedPresentationBlock.block.featuresForLead}
            />
            <SimpleList
              title="Features against the lead"
              items={result.matchedPresentationBlock.block.featuresAgainstLead}
            />
            <SimpleList
              title="Worst-case diagnoses to exclude"
              items={result.matchedPresentationBlock.block.worstCaseToExclude}
            />
            <SimpleList
              title="Red-flag override triggers"
              items={result.matchedPresentationBlock.block.redFlags}
            />
            <SimpleList
              title="First-line tests"
              items={result.matchedPresentationBlock.block.firstLineTests}
            />
            <SimpleList
              title="Immediate actions"
              items={result.matchedPresentationBlock.block.immediateActions}
            />

            <div>
              <div className="text-sm font-medium text-slate-500">Escalation</div>
              <p className="text-slate-700">{result.matchedPresentationBlock.block.escalation}</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-600">
            No closely matching presentation teaching scaffold is available for this case yet.
          </p>
        )}
      </Section>
    </section>
  );
}
