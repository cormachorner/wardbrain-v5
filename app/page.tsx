"use client";

import { useState } from "react";
import { AnalysisResults } from "../components/AnalysisResults";
import { CaseForm } from "../components/CaseForm";
import type { AnalyzeCaseResponse, CaseInput } from "../lib/types";

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
  const [submittedCase, setSubmittedCase] = useState<CaseInput | null>(null);
  const [result, setResult] = useState<AnalyzeCaseResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateField<K extends keyof CaseInput>(field: K, value: CaseInput[K]) {
    setCaseInput((prev) => ({ ...prev, [field]: value }));
  }

  async function handleAnalyseCase() {
    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch("/api/analyze-case", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(caseInput),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "WardBrain could not analyze this case.");
      }

      const nextResult = (await response.json()) as AnalyzeCaseResponse;

      setSubmittedCase(caseInput);
      setResult(nextResult);
    } catch (caughtError) {
      setSubmittedCase(null);
      setResult(null);
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "WardBrain could not analyze this case.",
      );
    } finally {
      setIsAnalyzing(false);
    }
  }

  function handleClearCase() {
    setCaseInput(initialCase);
    setSubmittedCase(null);
    setResult(null);
    setError(null);
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
          <CaseForm
            caseInput={caseInput}
            onFieldChange={updateField}
            onAnalyse={handleAnalyseCase}
            onClear={handleClearCase}
            isAnalyzing={isAnalyzing}
          />

          <div>
            {error && (
              <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                {error}
              </div>
            )}

            {submittedCase && result ? <AnalysisResults result={result} /> : null}
          </div>
        </div>
      </div>
    </main>
  );
}
