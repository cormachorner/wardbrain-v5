"use client";

import { useEffect, useRef, useState } from "react";
import { useSession, signOut } from "next-auth/react"
import { AnalysisResults } from "../components/AnalysisResults";
import { WardBrainLogo } from "../components/brand/WardBrainLogo";
import { CaseForm } from "../components/CaseForm";
import { SUPPORTED_PRESENTATION_BLOCKS } from "../lib/pilotStatus";
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

function hasLearningReflectionInput(input: CaseInput | null) {
  if (!input) {
    return false;
  }

  return Boolean(
    input.leadDiagnosis?.trim() ||
      input.otherDifferentials?.trim() ||
      input.dangerousDiagnoses?.trim() ||
      input.keyPositives.trim() ||
      input.keyNegatives.trim(),
  );
}

export default function Home() {
  const { data: session, status } = useSession()
  const [caseInput, setCaseInput] = useState<CaseInput>(initialCase);
  const [submittedCase, setSubmittedCase] = useState<CaseInput | null>(null);
  const [result, setResult] = useState<AnalyzeCaseResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resultsRegion = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (result || error || isAnalyzing) resultsRegion.current?.focus();
  }, [result, error, isAnalyzing]);

  // Redirect to sign-in if not authenticated
  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-[var(--brand-navy)]"></div>
          <p className="mt-4 font-medium text-slate-700">Opening WardBrain...</p>
          <p className="mt-1 text-sm text-slate-500">Educational cases only. No identifiable patient data.</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="mx-auto max-w-xl px-6 text-center">
          <WardBrainLogo size="lg" className="justify-center" />
          <p className="mt-5 text-xl text-slate-600">A clinical reasoning coach for medical students</p>
          <p className="mx-auto mt-4 inline-flex rounded-full border border-[var(--brand-border)] bg-white px-3 py-1 text-xs font-medium text-slate-600">
            Educational use only • De-identified cases only
          </p>
          <p className="mb-6 mt-6 text-slate-600">Please sign in to access the application.</p>
          <a
            href="/auth/signin"
            className="inline-flex items-center rounded-md border border-transparent bg-[var(--brand-navy)] px-6 py-3 text-base font-medium text-white hover:bg-[#0b2340]"
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
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(caseInput),
        signal: AbortSignal.timeout(60000),
      });

      if (!response.ok) {
        throw new Error(response.status === 401
          ? "Your session has expired. Sign in again to continue."
          : response.status === 400
            ? "Check the required case details and any laboratory values, then try again."
            : "WardBrain could not complete the analysis. Your case is still here; please try again.");
      }

      const nextResult = (await response.json()) as AnalyzeCaseResponse;

      setSubmittedCase(caseInput);
      setResult(nextResult);
    } catch (caughtError) {
      setSubmittedCase(null);
      setResult(null);
      setError(
        caughtError instanceof Error && caughtError.name === "Error"
          ? caughtError.message
          : "The connection was interrupted or took too long. Your case is still here; please try again.",
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
    <main className="pilot-workspace min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8 lg:py-10">
        <header className="mb-8">
          <div className="flex flex-col gap-6 rounded-2xl border border-[var(--brand-border)] bg-white/80 p-4 shadow-sm md:flex-row md:items-start md:justify-between md:p-6">
            <div>
              <WardBrainLogo size="md" />
              <h1 className="sr-only">WardBrain clinical reasoning practice</h1>
              <p className="mt-4 max-w-3xl text-slate-600">
                Practise clinical reasoning: organise a case, compare possibilities and learn what to ask next.
              </p>
              <div className="mt-4 inline-flex rounded-full border border-[var(--brand-border)] bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                Pilot mode: educational use only • de-identified cases only
              </div>
              <details className="mt-2 text-xs text-slate-500">
                <summary className="inline-flex cursor-pointer list-none items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 font-medium text-slate-600 hover:bg-slate-50">
                  Supported presentations ▸
                </summary>
                <div className="mt-2 flex max-w-3xl flex-wrap gap-1.5">
                  {SUPPORTED_PRESENTATION_BLOCKS.map((block) => (
                    <span key={block.id} className="rounded-full bg-slate-100 px-2 py-0.5">
                      {block.label}
                    </span>
                  ))}
                </div>
              </details>
            </div>
            <nav aria-label="Primary" className="flex flex-wrap gap-2 md:justify-end">
              <a
                href="/status"
                className="inline-flex items-center rounded-md border border-[var(--brand-border)] bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--brand-navy)]"
              >
                Status
              </a>
              {session.user.role === "ADMIN" && (
                <a
                  href="/admin"
                  className="inline-flex items-center rounded-md border border-[var(--brand-border)] bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--brand-navy)]"
                >
                  Admin
                </a>
              )}
              <a
                href="/profile"
                className="inline-flex items-center rounded-md border border-[var(--brand-border)] bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--brand-navy)]"
              >
                Profile
              </a>
              <button
                onClick={() => signOut()}
                className="inline-flex items-center rounded-md border border-[var(--brand-border)] bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--brand-navy)]"
              >
                Sign Out
              </button>
            </nav>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-start">
          <CaseForm
            caseInput={caseInput}
            onFieldChange={updateField}
            onCasePatch={(patch) => setCaseInput((previous) => ({ ...previous, ...patch }))}
            onAnalyse={handleAnalyseCase}
            onClear={handleClearCase}
            isAnalyzing={isAnalyzing}
          />

          <div ref={resultsRegion} tabIndex={-1} aria-label="Case analysis" className="min-w-0 scroll-mt-4 rounded-2xl">
            {error && (
              <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900" role="alert">
                <div className="font-semibold">Analysis did not run</div>
                <p className="mt-1">{error}</p>
              </div>
            )}

            {isAnalyzing && (
              <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-700 shadow-sm" role="status">
                <div className="font-semibold text-slate-900">Analysing case...</div>
                <p className="mt-1">WardBrain is extracting features, checking red flags, and ranking differentials.</p>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full w-1/2 animate-pulse rounded-full bg-[var(--brand-navy)]" />
                </div>
              </div>
            )}

            {!isAnalyzing && submittedCase && result && JSON.stringify(caseInput) !== JSON.stringify(submittedCase) && (
              <p role="status" className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">You have edited the case. These results are from your previous analysis; select Analyse case to update them.</p>
            )}
            {!isAnalyzing && submittedCase && result ? (
              <AnalysisResults
                result={result}
                showEducationalReflection={hasLearningReflectionInput(submittedCase)}
              />
            ) : null}

            {!isAnalyzing && !submittedCase && !result && !error && (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-6 text-sm text-slate-600">
                <div className="text-lg font-semibold text-slate-900">Your analysis will appear here</div>
                <p className="mt-2">
                  Paste a de-identified practice case, organise and review the details,
                  then analyse. WardBrain will show differentials, red-flag patterns,
                  uncertainty, labs, and a presentation summary here.
                </p>
                <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-3 text-blue-950">
                  <div className="font-semibold">Minimum to start</div>
                  <p className="mt-1">Age, sex, and presenting complaint. More detail improves the teaching output.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
