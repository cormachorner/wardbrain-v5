import { redirect } from "next/navigation"
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { auth } from "../auth"

type AdminRouteAuth =
  | { ok: true; userId?: string }
  | { ok: false; response: NextResponse }

export async function requireAdminPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/auth/signin")
  }

  if (session.user.role !== "ADMIN") {
    redirect("/")
  }

  return session
}

export async function requireAdminRoute(request: NextRequest): Promise<AdminRouteAuth> {
  void request

  const session = await auth()

  if (!session?.user || session.user.role !== "ADMIN") {
    return {
      ok: false,
      response: NextResponse.json({ error: "Admin access required" }, { status: 403 }),
    }
  }

  return { ok: true, userId: session.user.id }
}
