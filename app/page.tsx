"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react"
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
  const { data: session, status } = useSession()
  const [caseInput, setCaseInput] = useState<CaseInput>(initialCase);
  const [submittedCase, setSubmittedCase] = useState<CaseInput | null>(null);
  const [result, setResult] = useState<AnalyzeCaseResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect to sign-in if not authenticated
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">WardBrain v5</h1>
          <p className="text-xl text-slate-600 mb-8">A clinical reasoning coach for medical students</p>
          <p className="text-slate-600 mb-6">Please sign in to access the application.</p>
          <a
            href="/auth/signin"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Sign In
          </a>
        </div>
      </div>
    )
  }

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
          <div className="flex justify-between items-start mb-3">
            <div className="inline-flex rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800">
              Educational use only • De-identified cases only
            </div>
            <div className="flex gap-2">
              {session.user.role === "ADMIN" && (
                <a
                  href="/admin"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Admin
                </a>
              )}
              <a
                href="/profile"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Profile
              </a>
              <button
                onClick={() => signOut()}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Sign Out
              </button>
            </div>
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
