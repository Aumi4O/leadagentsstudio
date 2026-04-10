import NextAuth from "next-auth"
import "next-auth/jwt"

import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

export const { handlers, auth, signIn, signOut } = NextAuth({
  debug: !!process.env.AUTH_DEBUG,
  theme: { 
    logo: "/logo.png",
    brandColor: "#00d4ff",
    colorScheme: "light"
  },
  adapter: PrismaAdapter(prisma),
  providers: [
    // Google OAuth - easy sign-in
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    
    // Email/Password credentials
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "you@example.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string }
        })

        if (!user || !user.password) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        )

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        }
      }
    })
  ],
  basePath: "/auth",
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    signOut: "/",
    error: "/login",
    newUser: "/dashboard"
  },
  callbacks: {
    authorized({ request, auth }) {
      const { pathname } = request.nextUrl
      // Protect dashboard and account routes
      if (pathname.startsWith("/dashboard") || pathname.startsWith("/account")) {
        return !!auth
      }
      return true
    },
    jwt({ token, user, trigger, session }) {
      // Add user ID and credits to token on sign in
      if (user) {
        token.id = user.id
        token.credits = (user as any).credits || 0
      }
      // Handle session updates (e.g., after credit purchase)
      if (trigger === "update" && session) {
        token.credits = session.credits
        if (session.name) token.name = session.name
      }
      return token
    },
    async session({ session, token }) {
      // Add user ID and credits to session
      if (token) {
        session.user.id = token.id as string
        session.user.credits = token.credits as number
      }
      return session
    },
  },
})

// Extend types for credits
declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      credits: number
    }
  }
  
  interface User {
    credits?: number
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string
    credits?: number
  }
}
