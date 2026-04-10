import Link from "next/link"

const sections = [
  {
    href: "/admin/feature-labels",
    title: "Feature labels",
    description: "Manage reusable feature slugs, display labels, groupings, and draft/published state.",
  },
  {
    href: "/admin/feature-phrases",
    title: "Feature phrases",
    description: "Manage extractor phrase content linked to feature labels, ready for future DB-backed extraction work.",
  },
  {
    href: "/admin/test-cases",
    title: "Test cases",
    description: "Store reviewable calibration cases with expected features and draft/published status.",
  },
  {
    href: "/admin/users",
    title: "Users",
    description: "Existing user management remains available alongside the new content models.",
  },
]

export default function AdminOverviewPage() {
  return (
    <section className="grid gap-4 md:grid-cols-2">
      {sections.map((section) => (
        <Link
          key={section.href}
          href={section.href}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300 hover:shadow"
        >
          <h2 className="text-lg font-semibold text-slate-900">{section.title}</h2>
          <p className="mt-2 text-sm text-slate-600">{section.description}</p>
        </Link>
      ))}
    </section>
  )
}
