import NextAuth from "next-auth"
import authConfig from "./auth.config"

/**
 * Must NOT import `auth` from `./auth` — that file loads Prisma (Node-only).
 * This lightweight instance is safe on the Edge runtime.
 * @see https://authjs.dev/guides/edge-compatibility
 */
const { auth } = NextAuth(authConfig)

export default auth

export const config = {
  matcher: ["/dashboard/:path*", "/account/:path*"],
}
