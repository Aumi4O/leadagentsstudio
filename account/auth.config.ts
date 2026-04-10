import type { NextAuthConfig } from "next-auth"
import Google from "next-auth/providers/google"

/**
 * Edge-safe auth config (no Prisma / DB client). Used by `middleware.ts` only.
 * Full stack with Prisma + Credentials lives in `auth.ts`.
 * @see https://authjs.dev/guides/edge-compatibility
 */
export default {
  theme: {
    logo: "/logo.png",
    brandColor: "#00d4ff",
    colorScheme: "light",
  },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  basePath: "/auth",
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    signOut: "/",
    error: "/login",
    newUser: "/dashboard",
  },
  callbacks: {
    authorized({ request, auth }) {
      const { pathname } = request.nextUrl
      if (pathname.startsWith("/dashboard") || pathname.startsWith("/account")) {
        return !!auth
      }
      return true
    },
    jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
        token.credits = (user as { credits?: number }).credits ?? 0
      }
      if (trigger === "update" && session) {
        token.credits = session.credits as number | undefined
        if (session.name) token.name = session.name
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.credits = token.credits as number
      }
      return session
    },
  },
} satisfies NextAuthConfig
