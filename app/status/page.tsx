import Link from "next/link";
import { PILOT_GATE_STATUS, SUPPORTED_PRESENTATION_BLOCKS } from "../../lib/pilotStatus";

export default function StatusPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <Link href="/" className="text-sm font-medium text-blue-700 hover:text-blue-900">
            Back to WardBrain
          </Link>
          <h1 className="mt-4 text-4xl font-bold tracking-tight">WardBrain Pilot Status</h1>
          <p className="mt-2 max-w-3xl text-slate-600">
            Baseline support, current test coverage, and deploy gate status for pilot use.
          </p>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold">Current Gate</h2>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 p-3">
              <dt className="font-medium text-slate-500">{PILOT_GATE_STATUS.testCommand}</dt>
              <dd className="mt-1 text-lg font-semibold">
                {PILOT_GATE_STATUS.testStatus} ({PILOT_GATE_STATUS.testCount}/{PILOT_GATE_STATUS.testCount})
              </dd>
            </div>
            <div className="rounded-xl border border-slate-200 p-3">
              <dt className="font-medium text-slate-500">{PILOT_GATE_STATUS.lintCommand}</dt>
              <dd className="mt-1 text-lg font-semibold">{PILOT_GATE_STATUS.lintStatus}</dd>
            </div>
            <div className="rounded-xl border border-slate-200 p-3">
              <dt className="font-medium text-slate-500">{PILOT_GATE_STATUS.buildCommand}</dt>
              <dd className="mt-1 text-lg font-semibold">{PILOT_GATE_STATUS.buildStatus}</dd>
            </div>
          </dl>
          <p className="mt-3 text-xs text-slate-500">
            Last updated: {PILOT_GATE_STATUS.lastUpdated}
          </p>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold">Supported Presentation Blocks</h2>
          <div className="mt-4 grid gap-4">
            {SUPPORTED_PRESENTATION_BLOCKS.map((block) => (
              <div key={block.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold">{block.label}</h3>
                  <span className="rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-900">
                    {block.status}
                  </span>
                </div>
                <div className="mt-2 text-sm text-slate-500">
                  {block.diagnoses.length} diagnoses represented
                </div>
                <ul className="mt-3 grid gap-1 text-sm text-slate-700 sm:grid-cols-2">
                  {block.diagnoses.map((diagnosis) => (
                    <li key={diagnosis}>• {diagnosis}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
