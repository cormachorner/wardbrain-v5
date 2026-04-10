"use client"

import { useEffect, useState } from "react"

type FeatureLabel = {
  id: string
  slug: string
  label: string
  description: string | null
  groupName: string | null
  status: "DRAFT" | "PUBLISHED"
  _count: {
    phrases: number
    expectedBy: number
  }
}

type FeatureLabelFormState = {
  slug: string
  label: string
  description: string
  groupName: string
  status: "DRAFT" | "PUBLISHED"
}

const initialFormState: FeatureLabelFormState = {
  slug: "",
  label: "",
  description: "",
  groupName: "",
  status: "DRAFT",
}

export default function AdminFeatureLabelsPage() {
  const [featureLabels, setFeatureLabels] = useState<FeatureLabel[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(initialFormState)
  const [error, setError] = useState<string | null>(null)

  async function loadFeatureLabels() {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/feature-labels")
      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to load feature labels.")
      }

      setFeatureLabels(payload.featureLabels)
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Failed to load feature labels.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadFeatureLabels()
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
      const response = await fetch(
        editingId ? `/api/admin/feature-labels/${editingId}` : "/api/admin/feature-labels",
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        },
      )
      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to save feature label.")
      }

      await loadFeatureLabels()
      resetForm()
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Failed to save feature label.")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm("Delete this feature label? Linked phrases and case references will also be removed.")
    if (!confirmed) {
      return
    }

    setError(null)

    try {
      const response = await fetch(`/api/admin/feature-labels/${id}`, { method: "DELETE" })
      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to delete feature label.")
      }

      await loadFeatureLabels()
      if (editingId === id) {
        resetForm()
      }
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Failed to delete feature label.")
    }
  }

  function startEdit(featureLabel: FeatureLabel) {
    setEditingId(featureLabel.id)
    setForm({
      slug: featureLabel.slug,
      label: featureLabel.label,
      description: featureLabel.description ?? "",
      groupName: featureLabel.groupName ?? "",
      status: featureLabel.status,
    })
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[360px,1fr]">
      <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">{editingId ? "Edit feature label" : "Create feature label"}</h2>
            <p className="mt-1 text-sm text-slate-600">Use stable slugs. These are the future DB-backed content anchors.</p>
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
            <span className="mb-1 block text-sm font-medium text-slate-700">Label</span>
            <input
              required
              value={form.label}
              onChange={(event) => setForm((prev) => ({ ...prev, label: event.target.value }))}
              className="w-full rounded-md border border-slate-300 px-3 py-2"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Group</span>
            <input
              value={form.groupName}
              onChange={(event) => setForm((prev) => ({ ...prev, groupName: event.target.value }))}
              className="w-full rounded-md border border-slate-300 px-3 py-2"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Description</span>
            <textarea
              rows={4}
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              className="w-full rounded-md border border-slate-300 px-3 py-2"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Status</span>
            <select
              value={form.status}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, status: event.target.value as FeatureLabelFormState["status"] }))
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
          {saving ? "Saving..." : editingId ? "Update feature label" : "Create feature label"}
        </button>
      </form>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold">Feature labels</h2>
        </div>

        {loading ? (
          <div className="p-6 text-sm text-slate-600">Loading feature labels...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Label</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Slug</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Group</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Usage</th>
                  <th className="px-4 py-3 text-right font-medium text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {featureLabels.map((featureLabel) => (
                  <tr key={featureLabel.id}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{featureLabel.label}</div>
                      {featureLabel.description ? (
                        <div className="mt-1 text-xs text-slate-500">{featureLabel.description}</div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-700">{featureLabel.slug}</td>
                    <td className="px-4 py-3 text-slate-600">{featureLabel.groupName ?? "—"}</td>
                    <td className="px-4 py-3">{featureLabel.status}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {featureLabel._count.phrases} phrases / {featureLabel._count.expectedBy} test cases
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(featureLabel)}
                          className="rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-700 hover:bg-slate-100"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(featureLabel.id)}
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
