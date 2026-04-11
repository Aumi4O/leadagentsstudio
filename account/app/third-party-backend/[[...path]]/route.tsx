import { auth } from "@/auth"
import { NextRequest } from "next/server"

/**
 * Auth.js third-party backend example proxy.
 * Lives under /third-party-backend/* so it does not catch real app routes like /survey.
 */
function stripContentEncoding(result: Response) {
  const responseHeaders = new Headers(result.headers)
  responseHeaders.delete("content-encoding")

  return new Response(result.body, {
    status: result.status,
    statusText: result.statusText,
    headers: responseHeaders,
  })
}

async function handle(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> }
) {
  const session = await auth()
  const { path: segments } = await context.params
  const pathname =
    segments && segments.length > 0 ? "/" + segments.join("/") : "/"

  const headers = new Headers(request.headers)
  headers.set("Authorization", `Bearer ${session?.accessToken}`)

  const backendBase = (
    process.env.THIRD_PARTY_API_EXAMPLE_BACKEND ??
    "https://third-party-backend.authjs.dev"
  ).replace(/\/$/, "")

  const target = new URL(pathname + request.nextUrl.search, `${backendBase}/`)

  const result = await fetch(target.href, {
    headers,
    body:
      request.method !== "GET" && request.method !== "HEAD"
        ? request.body
        : undefined,
    method: request.method,
    duplex: "half",
  } as RequestInit)

  return stripContentEncoding(result)
}

export const dynamic = "force-dynamic"

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> }
) {
  return handle(request, context)
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> }
) {
  return handle(request, context)
}
