import { redirect } from "next/navigation"
import { getToken } from "next-auth/jwt"
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
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })

  if (!token || token.role !== "ADMIN") {
    return {
      ok: false,
      response: NextResponse.json({ error: "Admin access required" }, { status: 403 }),
    }
  }

  return { ok: true, userId: typeof token.id === "string" ? token.id : undefined }
}
