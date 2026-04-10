import Link from "next/link"
import { requireAdminPage } from "../../lib/adminAuth"

const navItems = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/feature-labels", label: "Feature labels" },
  { href: "/admin/feature-phrases", label: "Feature phrases" },
  { href: "/admin/test-cases", label: "Test cases" },
]

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAdminPage()

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="inline-flex rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700">
              Admin interface
            </div>
            <h1 className="mt-3 text-3xl font-bold tracking-tight">WardBrain content admin</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-600">
              Reasoning stays in code. Editable content now starts in the database with
              feature labels, feature phrases, and test cases.
            </p>
          </div>

          <Link
            href="/"
            className="inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Back to WardBrain
          </Link>
        </header>

        <nav className="mb-8 flex flex-wrap gap-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {children}
      </div>
    </main>
  )
}
