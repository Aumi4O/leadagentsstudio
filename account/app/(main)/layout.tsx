"use client"

import { SessionProvider } from "next-auth/react"

/**
 * Account / marketing routes only. Survey lives outside this tree so customers
 * never load next-auth session machinery on /survey.
 */
export default function MainAppLayout({ children }: React.PropsWithChildren) {
  return <SessionProvider>{children}</SessionProvider>
}
