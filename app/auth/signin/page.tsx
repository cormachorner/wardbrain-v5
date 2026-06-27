"use client"

import { signIn } from "next-auth/react"
import { useState } from "react"
import { WardBrainLogo } from "../../../components/brand/WardBrainLogo"

export default function SignIn() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleCredentialsSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false
      })

      if (result?.error) {
        alert("Invalid credentials")
      } else {
        window.location.href = "/"
      }
    } catch {
      alert("An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <WardBrainLogo size="md" className="justify-center" />
          <p className="mt-4 text-slate-600">Access your medical reasoning coach</p>
          <p className="mx-auto mt-4 inline-flex rounded-full border border-[var(--brand-border)] bg-white px-3 py-1 text-xs font-medium text-slate-600">
            Educational use only • De-identified cases only
          </p>
        </div>

        <form onSubmit={handleCredentialsSignIn} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[var(--brand-navy)] hover:bg-[#0b2340] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--brand-navy)] disabled:opacity-50"
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="text-center text-sm text-slate-600">
          <p>Demo credentials:</p>
          <p>Admin: admin@wardbrain.com / password</p>
          <p>Instructor: instructor@wardbrain.com / password</p>
          <p>Student: student@wardbrain.com / password</p>
        </div>
      </div>
    </div>
  )
}
