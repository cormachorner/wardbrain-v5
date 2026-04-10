"use client"

import { useEffect, useState } from "react"

type FeatureLabelOption = {
  id: string
  slug: string
  label: string
}

type ClinicalTestCase = {
  id: string
  slug: string
  title: string
  presentationBlock: string
  vignette: string
  expectedLeadDiagnosis: string | null
  expectedPresentationBlock: string | null
  notes: string | null
  status: "DRAFT" | "PUBLISHED"
  expectedFeatures: Array<{
    id: string
    featureLabel: FeatureLabelOption
  }>
}

type TestCaseFormState = {
  slug: string
  title: string
  presentationBlock: string
  vignette: string
  expectedLeadDiagnosis: string
  expectedPresentationBlock: string
  notes: string
  status: "DRAFT" | "PUBLISHED"
  expectedFeatureSlugs: string
}

const initialFormState: TestCaseFormState = {
  slug: "",
  title: "",
  presentationBlock: "acute_abdominal_pain",
  vignette: "",
  expectedLeadDiagnosis: "",
  expectedPresentationBlock: "acute_abdominal_pain",
  notes: "",
  status: "DRAFT",
  expectedFeatureSlugs: "",
}

export default function AdminTestCasesPage() {
  const [testCases, setTestCases] = useState<ClinicalTestCase[]>([])
  const [featureLabels, setFeatureLabels] = useState<FeatureLabelOption[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(initialFormState)
  const [error, setError] = useState<string | null>(null)

  async function loadData() {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/test-cases")
      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to load test cases.")
      }

      setTestCases(payload.testCases)
      setFeatureLabels(
        payload.featureLabels.map((item: { id: string; slug: string; label: string }) => ({
          id: item.id,
          slug: item.slug,
          label: item.label,
        })),
      )
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Failed to load test cases.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  function resetForm() {
    setForm(initialFormState)
    setEditingId(null)
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const response = await fetch(editingId ? `/api/admin/test-cases/${editingId}` : "/api/admin/test-cases", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          expectedFeatureSlugs: form.expectedFeatureSlugs,
        }),
      })
      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to save test case.")
      }

      await loadData()
      resetForm()
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Failed to save test case.")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm("Delete this test case?")
    if (!confirmed) {
      return
    }

    try {
      const response = await fetch(`/api/admin/test-cases/${id}`, { method: "DELETE" })
      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to delete test case.")
      }

      await loadData()
      if (editingId === id) {
        resetForm()
      }
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Failed to delete test case.")
    }
  }

  function startEdit(testCase: ClinicalTestCase) {
    setEditingId(testCase.id)
    setForm({
      slug: testCase.slug,
      title: testCase.title,
      presentationBlock: testCase.presentationBlock,
      vignette: testCase.vignette,
      expectedLeadDiagnosis: testCase.expectedLeadDiagnosis ?? "",
      expectedPresentationBlock: testCase.expectedPresentationBlock ?? "",
      notes: testCase.notes ?? "",
      status: testCase.status,
      expectedFeatureSlugs: testCase.expectedFeatures.map((feature) => feature.featureLabel.slug).join(", "),
    })
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[420px,1fr]">
      <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">{editingId ? "Edit test case" : "Create test case"}</h2>
            <p className="mt-1 text-sm text-slate-600">Acute abdominal pain is the first target for future DB-backed diagnosis-definition work.</p>
          </div>
          {editingId ? (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </button>
          ) : null}
        </div>

        {error ? <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</div> : null}

        <div className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Slug</span>
            <input
              required
              value={form.slug}
              onChange={(event) => setForm((prev) => ({ ...prev, slug: event.target.value }))}
              className="w-full rounded-md border border-slate-300 px-3 py-2"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Title</span>
            <input
              required
              value={form.title}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              className="w-full rounded-md border border-slate-300 px-3 py-2"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Presentation block</span>
            <input
              required
              value={form.presentationBlock}
              onChange={(event) => setForm((prev) => ({ ...prev, presentationBlock: event.target.value }))}
              className="w-full rounded-md border border-slate-300 px-3 py-2"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Vignette</span>
            <textarea
              required
              rows={8}
              value={form.vignette}
              onChange={(event) => setForm((prev) => ({ ...prev, vignette: event.target.value }))}
              className="w-full rounded-md border border-slate-300 px-3 py-2"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Expected lead diagnosis</span>
            <input
              value={form.expectedLeadDiagnosis}
              onChange={(event) => setForm((prev) => ({ ...prev, expectedLeadDiagnosis: event.target.value }))}
              className="w-full rounded-md border border-slate-300 px-3 py-2"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Expected presentation block</span>
            <input
              value={form.expectedPresentationBlock}
              onChange={(event) => setForm((prev) => ({ ...prev, expectedPresentationBlock: event.target.value }))}
              className="w-full rounded-md border border-slate-300 px-3 py-2"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Expected feature slugs</span>
            <textarea
              rows={3}
              value={form.expectedFeatureSlugs}
              onChange={(event) => setForm((prev) => ({ ...prev, expectedFeatureSlugs: event.target.value }))}
              className="w-full rounded-md border border-slate-300 px-3 py-2"
            />
            <span className="mt-1 block text-xs text-slate-500">
              Comma or newline separated. Existing labels: {featureLabels.map((item) => item.slug).slice(0, 12).join(", ")}
            </span>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Notes</span>
            <textarea
              rows={3}
              value={form.notes}
              onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
              className="w-full rounded-md border border-slate-300 px-3 py-2"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Status</span>
            <select
              value={form.status}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, status: event.target.value as TestCaseFormState["status"] }))
              }
              className="w-full rounded-md border border-slate-300 px-3 py-2"
            >
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
            </select>
          </label>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="mt-6 w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {saving ? "Saving..." : editingId ? "Update test case" : "Create test case"}
        </button>
      </form>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold">Test cases</h2>
        </div>

        {loading ? (
          <div className="p-6 text-sm text-slate-600">Loading test cases...</div>
        ) : (
          <div className="space-y-4 p-4">
            {testCases.map((testCase) => (
              <article key={testCase.id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">{testCase.title}</h3>
                    <div className="mt-1 font-mono text-xs text-slate-500">{testCase.slug}</div>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      <span className="rounded-full bg-slate-100 px-2 py-1">{testCase.presentationBlock}</span>
                      <span className="rounded-full bg-slate-100 px-2 py-1">{testCase.status}</span>
                      {testCase.expectedLeadDiagnosis ? (
                        <span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-800">
                          Lead: {testCase.expectedLeadDiagnosis}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(testCase)}
                      className="rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-700 hover:bg-slate-100"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(testCase.id)}
                      className="rounded-md border border-red-200 px-3 py-2 text-xs text-red-700 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">{testCase.vignette}</p>

                {testCase.expectedFeatures.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {testCase.expectedFeatures.map((feature) => (
                      <span
                        key={feature.id}
                        className="rounded-full bg-blue-50 px-2 py-1 text-xs text-blue-800"
                      >
                        {feature.featureLabel.slug}
                      </span>
                    ))}
                  </div>
                ) : null}

                {testCase.notes ? <p className="mt-3 text-xs text-slate-500">{testCase.notes}</p> : null}
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
