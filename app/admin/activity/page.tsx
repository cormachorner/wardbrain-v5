"use client"

import { useEffect, useState } from "react"

type ActivityItem = {
  id: string
  title: string | null
  createdAt: string
  updatedAt: string
  user: {
    id: string
    email: string
    name: string | null
    role: string
  }
  presentingComplaint: string | null
  actualLeadDiagnosis: string | null
  actualTop3: string[]
  detectedFeatures: string[]
  detectedRedFlags: string[]
  potentialMissingFeatures: string[]
  caseData: Record<string, unknown> | null
  analysis: Record<string, unknown> | null
}

export default function AdminActivityPage() {
  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadActivity() {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch("/api/admin/activity")
        const payload = await response.json()

        if (!response.ok) {
          throw new Error(payload.error ?? "Failed to load activity.")
        }

        setActivity(payload.activity)
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : "Failed to load activity.")
      } finally {
        setLoading(false)
      }
    }

    void loadActivity()
  }, [])

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">User case activity</h2>
        <p className="mt-1 text-sm text-slate-600">
          Review stored case runs, outputs, detected features, red flags, and potentially missing features.
        </p>
      </div>

      {error ? <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</div> : null}

      <div className="space-y-4">
        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
            Loading activity...
          </div>
        ) : activity.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
            No stored case activity yet. New analyzed cases will appear here.
          </div>
        ) : (
          activity.map((item) => (
            <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    {item.presentingComplaint || item.title || "Untitled case"}
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">
                    {item.user.email}
                    {item.user.name ? ` • ${item.user.name}` : ""}
                    {` • ${new Date(item.createdAt).toLocaleString()}`}
                  </p>
                </div>
                <div className="text-sm text-slate-600">
                  Lead: <span className="font-medium text-slate-900">{item.actualLeadDiagnosis ?? "Unknown"}</span>
                </div>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Top 3</div>
                  <p className="mt-1 text-sm text-slate-700">
                    {item.actualTop3.length > 0 ? item.actualTop3.join(", ") : "None stored"}
                  </p>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Detected red flags</div>
                  <p className="mt-1 text-sm text-slate-700">
                    {item.detectedRedFlags.length > 0 ? item.detectedRedFlags.join(", ") : "None"}
                  </p>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Potential missing features</div>
                  <p className="mt-1 text-sm text-slate-700">
                    {item.potentialMissingFeatures.length > 0 ? item.potentialMissingFeatures.join(", ") : "None"}
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Detected features</div>
                <p className="mt-1 text-sm text-slate-700">
                  {item.detectedFeatures.length > 0 ? item.detectedFeatures.join(", ") : "None"}
                </p>
              </div>

              <details className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <summary className="cursor-pointer text-sm font-medium text-slate-800">
                  View raw case input and analysis
                </summary>
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <div>
                    <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Case input</div>
                    <pre className="overflow-x-auto rounded-lg bg-white p-3 text-xs text-slate-700">
                      {JSON.stringify(item.caseData, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Analysis output</div>
                    <pre className="overflow-x-auto rounded-lg bg-white p-3 text-xs text-slate-700">
                      {JSON.stringify(item.analysis, null, 2)}
                    </pre>
                  </div>
                </div>
              </details>
            </article>
          ))
        )}
      </div>
    </section>
  )
}
