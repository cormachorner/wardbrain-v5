import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "./lib/prisma"

export const { handlers, auth } = NextAuth({
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const email = String(credentials.email).toLowerCase().trim()
        const password = String(credentials.password)

        // Demo password requirement
        if (password !== "password") return null

        // Find or create user in Prisma database
        let user = await prisma.user.findUnique({ where: { email } })

        if (!user) {
          const role = email.includes("admin")
            ? "ADMIN"
            : email.includes("instructor")
            ? "INSTRUCTOR"
            : "STUDENT"

          user = await prisma.user.create({
            data: {
              email,
              name: email.split("@")[0],
              role,
            },
          })
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? user.email.split("@")[0],
          role: user.role,
        }
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role || token.role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
})
