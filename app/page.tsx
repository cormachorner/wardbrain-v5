"use client";

import { useState } from "react";
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
          <div className="flex flex-col gap-6 rounded-3xl border border-[var(--brand-border)] bg-white/80 p-5 shadow-sm md:flex-row md:items-start md:justify-between md:p-6">
            <div>
              <WardBrainLogo size="md" />
              <p className="mt-4 max-w-3xl text-slate-600">
                A clinical reasoning coach for medical students that detects anchoring,
                surfaces dangerous differentials, and helps turn a messy case into a safer,
                sharper presentation.
              </p>
              <div className="mt-4 inline-flex rounded-full border border-[var(--brand-border)] bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                Educational use only • De-identified cases only
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
            onAnalyse={handleAnalyseCase}
            onClear={handleClearCase}
            isAnalyzing={isAnalyzing}
          />

          <div className="lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:self-start lg:overflow-y-auto lg:pr-1">
            {error && (
              <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                {error}
              </div>
            )}

            {isAnalyzing && (
              <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-700 shadow-sm">
                <div className="font-semibold text-slate-900">Analysing case...</div>
                <p className="mt-1">WardBrain is extracting features, checking red flags, and ranking differentials.</p>
              </div>
            )}

            {submittedCase && result ? <AnalysisResults result={result} /> : null}

            {!isAnalyzing && !submittedCase && !result && !error && (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-6 text-sm text-slate-600">
                <div className="text-lg font-semibold text-slate-900">Enter a case to begin</div>
                <p className="mt-2">
                  Add the presentation, observations, and your current reasoning on the left.
                  WardBrain will show ranked differentials, red flags, uncertainty, and a reg-ready presentation here.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
