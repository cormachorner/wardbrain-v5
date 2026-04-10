"use client"

import { useEffect, useState } from "react"

type FeatureLabelOption = {
  id: string
  slug: string
  label: string
}

type FeaturePhrase = {
  id: string
  slug: string
  phrase: string
  notes: string | null
  status: "DRAFT" | "PUBLISHED"
  featureLabel: FeatureLabelOption
}

type FeaturePhraseFormState = {
  slug: string
  phrase: string
  notes: string
  status: "DRAFT" | "PUBLISHED"
  featureLabelId: string
}

const initialFormState: FeaturePhraseFormState = {
  slug: "",
  phrase: "",
  notes: "",
  status: "DRAFT",
  featureLabelId: "",
}

export default function AdminFeaturePhrasesPage() {
  const [featurePhrases, setFeaturePhrases] = useState<FeaturePhrase[]>([])
  const [featureLabels, setFeatureLabels] = useState<FeatureLabelOption[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(initialFormState)
  const [error, setError] = useState<string | null>(null)

  async function loadData() {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/feature-phrases")
      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to load feature phrases.")
      }

      setFeaturePhrases(payload.featurePhrases)
      setFeatureLabels(
        payload.featureLabels.map((item: { id: string; slug: string; label: string }) => ({
          id: item.id,
          slug: item.slug,
          label: item.label,
        })),
      )
      setForm((prev) => ({
        ...prev,
        featureLabelId: prev.featureLabelId || payload.featureLabels[0]?.id || "",
      }))
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Failed to load feature phrases.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  function resetForm(defaultLabelId?: string) {
    setForm({
      ...initialFormState,
      featureLabelId: defaultLabelId ?? featureLabels[0]?.id ?? "",
    })
    setEditingId(null)
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const response = await fetch(
        editingId ? `/api/admin/feature-phrases/${editingId}` : "/api/admin/feature-phrases",
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        },
      )
      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to save feature phrase.")
      }

      await loadData()
      resetForm()
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Failed to save feature phrase.")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm("Delete this feature phrase?")
    if (!confirmed) {
      return
    }

    try {
      const response = await fetch(`/api/admin/feature-phrases/${id}`, { method: "DELETE" })
      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to delete feature phrase.")
      }

      await loadData()
      if (editingId === id) {
        resetForm()
      }
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Failed to delete feature phrase.")
    }
  }

  function startEdit(featurePhrase: FeaturePhrase) {
    setEditingId(featurePhrase.id)
    setForm({
      slug: featurePhrase.slug,
      phrase: featurePhrase.phrase,
      notes: featurePhrase.notes ?? "",
      status: featurePhrase.status,
      featureLabelId: featurePhrase.featureLabel.id,
    })
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[380px,1fr]">
      <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">{editingId ? "Edit feature phrase" : "Create feature phrase"}</h2>
            <p className="mt-1 text-sm text-slate-600">Feature phrases stay editable without moving extractor logic out of code yet.</p>
          </div>
          {editingId ? (
            <button
              type="button"
              onClick={() => resetForm()}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </button>
          ) : null}
        </div>

        {error ? <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</div> : null}

        <div className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Feature label</span>
            <select
              required
              value={form.featureLabelId}
              onChange={(event) => setForm((prev) => ({ ...prev, featureLabelId: event.target.value }))}
              className="w-full rounded-md border border-slate-300 px-3 py-2"
            >
              {featureLabels.map((featureLabel) => (
                <option key={featureLabel.id} value={featureLabel.id}>
                  {featureLabel.label} ({featureLabel.slug})
                </option>
              ))}
            </select>
          </label>

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
            <span className="mb-1 block text-sm font-medium text-slate-700">Phrase</span>
            <textarea
              required
              rows={4}
              value={form.phrase}
              onChange={(event) => setForm((prev) => ({ ...prev, phrase: event.target.value }))}
              className="w-full rounded-md border border-slate-300 px-3 py-2"
            />
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
                setForm((prev) => ({ ...prev, status: event.target.value as FeaturePhraseFormState["status"] }))
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
          disabled={saving || featureLabels.length === 0}
          className="mt-6 w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {saving ? "Saving..." : editingId ? "Update feature phrase" : "Create feature phrase"}
        </button>
      </form>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold">Feature phrases</h2>
        </div>

        {loading ? (
          <div className="p-6 text-sm text-slate-600">Loading feature phrases...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Phrase</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Feature</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Slug</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Status</th>
                  <th className="px-4 py-3 text-right font-medium text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {featurePhrases.map((featurePhrase) => (
                  <tr key={featurePhrase.id}>
                    <td className="px-4 py-3">
                      <div className="text-slate-900">{featurePhrase.phrase}</div>
                      {featurePhrase.notes ? (
                        <div className="mt-1 text-xs text-slate-500">{featurePhrase.notes}</div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {featurePhrase.featureLabel.label}
                      <div className="font-mono text-xs text-slate-500">{featurePhrase.featureLabel.slug}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-700">{featurePhrase.slug}</td>
                    <td className="px-4 py-3">{featurePhrase.status}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(featurePhrase)}
                          className="rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-700 hover:bg-slate-100"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(featurePhrase.id)}
                          className="rounded-md border border-red-200 px-3 py-2 text-xs text-red-700 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}
